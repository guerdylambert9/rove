const SERVICE_FEE = 28
const DEPOSIT = 300

/** @deprecated Stub only used when protection selected without a live Bonzah quote */
const FALLBACK_PROTECTION_PER_DAY = 24

export function computePriceBreakdown(car, { days, coverage }) {
  const subtotal = car.pricePerDay * days
  let protection = 0
  if (coverage?.type === 'protection') {
    if (coverage.premiumTotal != null && Number(coverage.premiumTotal) >= 0) {
      protection = Number(coverage.premiumTotal)
    } else {
      // Dev bypass / incomplete quote — keep a non-zero placeholder
      protection = FALLBACK_PROTECTION_PER_DAY * days
    }
  }
  const total = subtotal + SERVICE_FEE + protection + DEPOSIT

  return {
    pricePerDay: car.pricePerDay,
    days,
    subtotal,
    serviceFee: SERVICE_FEE,
    protection,
    deposit: DEPOSIT,
    total,
    coverageType: coverage?.type ?? null,
    bonzahCovers: coverage?.covers ?? null,
    pickupState: coverage?.pickupState ?? null,
    vehicleName: car.name,
    vehicleId: car.id,
  }
}

/** Amount charged at checkout (excludes refundable deposit hold). */
export function tripChargeAmount(breakdown) {
  return (
    Number(breakdown.subtotal ?? 0) +
    Number(breakdown.serviceFee ?? 0) +
    Number(breakdown.protection ?? 0)
  )
}

export function formatMoney(amount) {
  return `$${Number(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}
