/**
 * Dev-only shortcuts for end-to-end booking tests (Phase 2).
 * Leave unset (or false) in production. Real gates return in Phases 3–4.
 *
 * VITE_DEV_BOOKING_BYPASS=true  → skip insurance + payment UI requirements
 * VITE_BYPASS_INSURANCE=true    → skip insurance only
 * VITE_BYPASS_PAYMENT=true      → skip payment UI only
 */

export const bypassInsuranceGate =
  import.meta.env.VITE_DEV_BOOKING_BYPASS === 'true' ||
  import.meta.env.VITE_BYPASS_INSURANCE === 'true'

export const bypassPaymentGate =
  import.meta.env.VITE_DEV_BOOKING_BYPASS === 'true' ||
  import.meta.env.VITE_BYPASS_PAYMENT === 'true'

/** Recorded on the trip when insurance gate is bypassed — swap for real flow in Phase 4 */
export const DEV_COVERAGE_STUB = {
  type: 'protection',
  acknowledged: true,
  proofUploaded: false,
}

export function coverageForBooking(coverage) {
  if (coverage?.type && coverage?.acknowledged) return coverage
  if (bypassInsuranceGate) return DEV_COVERAGE_STUB
  return coverage
}
