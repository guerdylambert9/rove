export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatTripDate(isoDate) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function defaultBookingDates(days = 3, leadDays = 7) {
  const pickup = new Date()
  pickup.setDate(pickup.getDate() + leadDays)
  const returnDate = new Date(pickup)
  returnDate.setDate(returnDate.getDate() + (days - 1))

  const pickupDate = toISODate(pickup)
  const returnIso = toISODate(returnDate)

  return datesFromRange(pickupDate, returnIso)
}

export function daysBetween(pickupIso, returnIso) {
  const start = new Date(`${pickupIso}T12:00:00`)
  const end = new Date(`${returnIso}T12:00:00`)
  const diff = Math.round((end - start) / (1000 * 60 * 60 * 24))
  return Math.max(1, diff + 1)
}

export function datesFromRange(pickupIso, returnIso) {
  if (returnIso < pickupIso) returnIso = pickupIso
  const days = daysBetween(pickupIso, returnIso)

  return {
    pickupDate: pickupIso,
    returnDate: returnIso,
    days,
    pickup: formatTripDate(pickupIso),
    dropoff: formatTripDate(returnIso),
  }
}

export function todayISODate() {
  return toISODate(new Date())
}
