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

export function formatMoney(amount) {
  return `$${Number(amount).toLocaleString('en-US', { maximumFractionDigits: 0 })}`
}
