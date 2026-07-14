import { bypassPaymentGate } from './bookingFlags.js'

export const isStripeConfigured = Boolean(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
)

/** Real Stripe checkout when publishable key is set and payment bypass is off. */
export function isPaymentsEnabled() {
  return isStripeConfigured && !bypassPaymentGate
}
