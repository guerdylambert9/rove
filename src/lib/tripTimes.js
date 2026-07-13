import { formatTripDate } from './tripDates.js'

export const TRIP_TIME_OPTIONS = [
  { value: '08:00', label: '8:00 AM' },
  { value: '10:00', label: '10:00 AM' },
  { value: '12:00', label: '12:00 PM' },
  { value: '14:00', label: '2:00 PM' },
  { value: '16:00', label: '4:00 PM' },
  { value: '18:00', label: '6:00 PM' },
  { value: '20:00', label: '8:00 PM' },
]

export const DEFAULT_PICKUP_TIME = '10:00'
export const DEFAULT_RETURN_TIME = '18:00'

export function normalizeTripTime(value) {
  if (!value) return DEFAULT_PICKUP_TIME
  const str = String(value)
  return str.length >= 5 ? str.slice(0, 5) : DEFAULT_PICKUP_TIME
}

export function formatTripTime(value) {
  const time = normalizeTripTime(value)
  const [h, m] = time.split(':').map(Number)
  const date = new Date(2000, 0, 1, h, m)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: m === 0 ? undefined : '2-digit',
  })
}

/** e.g. Fri, Jul 10 · 10:00 AM – Sat, Jul 11 · return by 6:00 PM */
export function formatTripSchedule({
  pickupDate,
  returnDate,
  pickupTime,
  returnTime,
}) {
  const pickup = formatTripDate(pickupDate)
  const dropoff = formatTripDate(returnDate)
  const pickupAt = formatTripTime(pickupTime ?? DEFAULT_PICKUP_TIME)
  const returnBy = formatTripTime(returnTime ?? DEFAULT_RETURN_TIME)

  if (pickupDate === returnDate) {
    return `${pickup} · ${pickupAt} – ${returnBy}`
  }

  return `${pickup} · ${pickupAt} – ${dropoff} · return by ${returnBy}`
}

export function isReturnTimeValid(pickupDate, returnDate, pickupTime, returnTime) {
  if (returnDate > pickupDate) return true
  if (returnDate < pickupDate) return false
  return normalizeTripTime(returnTime) > normalizeTripTime(pickupTime)
}

/** Next slot after pickupTime on the same day, or last slot if none. */
export function nextReturnTimeAfter(pickupTime) {
  const pickup = normalizeTripTime(pickupTime)
  const idx = TRIP_TIME_OPTIONS.findIndex((o) => o.value === pickup)
  if (idx < 0 || idx >= TRIP_TIME_OPTIONS.length - 1) {
    return TRIP_TIME_OPTIONS[TRIP_TIME_OPTIONS.length - 1].value
  }
  return TRIP_TIME_OPTIONS[idx + 1].value
}
