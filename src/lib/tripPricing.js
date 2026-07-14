const SERVICE_FEE = 28
const DEPOSIT = 300
const PROTECTION_PER_DAY = 24

export function computePriceBreakdown(car, { days, coverage }) {
  const subtotal = car.pricePerDay * days
  const protection =
    coverage?.type === 'protection' ? PROTECTION_PER_DAY * days : 0
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
