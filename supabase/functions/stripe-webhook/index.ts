import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2023-10-16',
  // Deno has no Node http — use Fetch
  httpClient: Stripe.createFetchHttpClient(),
})

// Deno has no sync crypto — required for webhook signature verification
const cryptoProvider = Stripe.createSubtleCryptoProvider()

Deno.serve(async (req) => {
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!Deno.env.get('STRIPE_SECRET_KEY') || !webhookSecret) {
    return new Response('Stripe not configured', { status: 500 })
  }

  const signature = req.headers.get('Stripe-Signature')
  if (!signature) {
    return new Response('Missing signature', { status: 400 })
  }

  // Must use raw body text for signature verification
  const body = await req.text()

  let event
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      cryptoProvider,
    )
  } catch (err) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 })
  }

  const serviceClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const tripId = session.metadata?.trip_id
    const depositCents = Number(session.metadata?.deposit_cents ?? 0)

    if (!tripId) {
      return new Response('Missing trip_id', { status: 400 })
    }

    const paymentIntentId =
      typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id

    await serviceClient
      .from('payments')
      .update({
        payment_status: 'paid',
        stripe_payment_intent_id: paymentIntentId ?? null,
        stripe_checkout_session_id: session.id,
        provider_reference: paymentIntentId ?? session.id,
      })
      .eq('trip_id', tripId)

    let depositIntentId = null
    let depositHoldStatus = 'none'

    if (depositCents > 0 && paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
        const paymentMethod =
          typeof paymentIntent.payment_method === 'string'
            ? paymentIntent.payment_method
            : paymentIntent.payment_method?.id
        const customerId =
          typeof paymentIntent.customer === 'string'
            ? paymentIntent.customer
            : paymentIntent.customer?.id ??
              (typeof session.customer === 'string' ? session.customer : null)

        if (!paymentMethod) {
          throw new Error('No payment method on charge to authorize deposit')
        }

        const depositIntent = await stripe.paymentIntents.create({
          amount: depositCents,
          currency: 'usd',
          ...(customerId ? { customer: customerId } : {}),
          payment_method: paymentMethod,
          capture_method: 'manual',
          confirm: true,
          off_session: true,
          metadata: { trip_id: tripId, type: 'deposit_hold' },
        })

        depositIntentId = depositIntent.id
        if (depositIntent.status === 'requires_capture') {
          depositHoldStatus = 'authorized'
        } else if (depositIntent.status === 'succeeded') {
          depositHoldStatus = 'captured'
        } else {
          console.error('Unexpected deposit status:', depositIntent.status)
          depositHoldStatus = 'failed'
        }
      } catch (depositErr) {
        console.error('Deposit hold failed:', depositErr.message)
        depositHoldStatus = 'failed'
      }
    }

    await serviceClient
      .from('payments')
      .update({
        stripe_deposit_intent_id: depositIntentId,
        deposit_hold_status: depositHoldStatus,
      })
      .eq('trip_id', tripId)

    await serviceClient
      .from('trips')
      .update({ state: 'coverage_pending' })
      .eq('id', tripId)
      .eq('state', 'payment_pending')
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object
    const tripId = session.metadata?.trip_id
    if (tripId) {
      await serviceClient
        .from('payments')
        .update({ payment_status: 'failed' })
        .eq('trip_id', tripId)

      await serviceClient
        .from('trips')
        .update({ state: 'cancelled' })
        .eq('id', tripId)
        .eq('state', 'payment_pending')
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
