# Stripe payments (Phase 3)

Rové uses **Stripe Checkout** for rental charges and a separate **deposit authorization** after payment succeeds. The secret key never touches the React app — only Supabase Edge Functions.

## 1. Supabase migration

Run in SQL Editor:

`supabase/migrations/010_phase3_payments.sql`

## 2. Edge Function secrets

In [Supabase Dashboard](https://supabase.com/dashboard) → Project → Edge Functions → Secrets (or CLI):

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set SITE_URL=https://rove-staging.vercel.app
```

## 3. Deploy functions

Install CLI if needed: `brew install supabase/tap/supabase`

Log in once (opens browser):

```bash
supabase login
```

Link and deploy from the project root:

```bash
cd ~/coding/rove
supabase link --project-ref zomiqxzmwhvmkjykepdr
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy release-deposit
```

Without a global install, prefix commands with `npx` (e.g. `npx supabase login`).

Verify in Supabase Dashboard → **Edge Functions** — you should see all three listed.

## 4. Stripe webhook

In Stripe Dashboard → Developers → Webhooks → Add endpoint:

- **URL:** `https://zomiqxzmwhvmkjykepdr.supabase.co/functions/v1/stripe-webhook`
- **Events:** `checkout.session.completed`, `checkout.session.expired`
- Copy signing secret → `STRIPE_WEBHOOK_SECRET`

The webhook uses `constructEventAsync` + SubtleCrypto (required on Deno / Edge Functions).
If deliveries return 400 with `SubtleCryptoProvider cannot be used in a synchronous context`,
redeploy `stripe-webhook` with the current function code.

Local testing:

```bash
stripe listen --forward-to https://zomiqxzmwhvmkjykepdr.supabase.co/functions/v1/stripe-webhook
```

## 5. Frontend env

Root `.env` / Vercel:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Do not** prefix the secret key with `VITE_`.

To test real checkout locally, **remove** `VITE_DEV_BOOKING_BYPASS` (or set `VITE_BYPASS_PAYMENT=false`).

## 6. Test card

`4242 4242 4242 4242` · any future expiry · any CVC

## Flow

1. Renter confirms → trip `payment_pending` + payment row
2. Redirect to Stripe Checkout (rental + fees only)
3. Webhook marks payment **paid**, authorizes deposit hold, trip → `coverage_pending`
4. Trip cards show **Paid · Deposit held**

`coverage_pending` = insurance/coverage verification (Phase 4). Payment is done; admin/owner still needs to verify coverage before keys.