import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.21.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    )

    const serviceClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { tripId, successPath = '/confirmed', cancelPath = '/checkout' } =
      await req.json()

    if (!tripId) {
      return new Response(JSON.stringify({ error: 'tripId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, renter_id, state, price_breakdown, vehicle:vehicles(name)')
      .eq('id', tripId)
      .single()

    if (tripError || !trip) {
      return new Response(JSON.stringify({ error: 'Trip not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (trip.renter_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (trip.state !== 'payment_pending') {
      return new Response(
        JSON.stringify({ error: 'Trip is not awaiting payment' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      )
    }

    const breakdown = trip.price_breakdown ?? {}
    const subtotal = Number(breakdown.subtotal ?? 0)
    const serviceFee = Number(breakdown.serviceFee ?? 0)
    const protection = Number(breakdown.protection ?? 0)
    const deposit = Number(breakdown.deposit ?? 0)
    const chargeAmount = subtotal + serviceFee + protection
    const vehicleName = trip.vehicle?.name ?? 'Vehicle rental'

    if (chargeAmount <= 0) {
      throw new Error('Invalid charge amount')
    }

    const origin =
      req.headers.get('origin') ??
      Deno.env.get('SITE_URL') ??
      'http://localhost:5173'

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    })

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: user.email ?? undefined,
      // Persist customer + card so webhook can authorize the deposit hold
      customer_creation: 'always',
      payment_intent_data: {
        setup_future_usage: 'off_session',
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Rové — ${vehicleName}`,
              description: `${breakdown.days ?? ''} day rental + fees`,
            },
            unit_amount: Math.round(chargeAmount * 100),
          },
          quantity: 1,
        },
      ],
      metadata: {
        trip_id: tripId,
        deposit_cents: String(Math.round(deposit * 100)),
        renter_id: user.id,
      },
      success_url: `${origin}${successPath}?trip_id=${tripId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}${cancelPath}?cancelled=1`,
    })

    await serviceClient
      .from('payments')
      .update({
        payment_status: 'processing',
        stripe_checkout_session_id: session.id,
        charge_amount: chargeAmount,
        deposit_amount: deposit,
        amount: chargeAmount,
      })
      .eq('trip_id', tripId)

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message ?? 'Checkout failed' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  }
})
