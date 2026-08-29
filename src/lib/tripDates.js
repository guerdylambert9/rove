const DEFAULT_PICKUP_TIME = '10:00'
const DEFAULT_RETURN_TIME = '18:00'

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

const MS_PER_DAY = 24 * 60 * 60 * 1000

function normalizeHHMM(value) {
  if (!value) return DEFAULT_PICKUP_TIME
  const str = String(value)
  return str.length >= 5 ? str.slice(0, 5) : DEFAULT_PICKUP_TIME
}

function timeToMinutes(hhmm) {
  const [h, m] = normalizeHHMM(hhmm).split(':').map(Number)
  return h * 60 + m
}

/** Whole calendar days between two ISO dates (0 = same day). */
export function calendarDayOffset(pickupIso, returnIso) {
  const start = new Date(`${pickupIso}T12:00:00`)
  const end = new Date(`${returnIso}T12:00:00`)
  return Math.max(0, Math.round((end - start) / MS_PER_DAY))
}

/**
 * Billable rental days on a 24-hour cycle from pickup time
 * (agency-style / Bonzah-aligned).
 *
 * Tue 2:00 PM → Wed 2:00 PM = 1 day
 * Tue 2:00 PM → Wed 2:01 PM (or 6:00 PM) = 2 days
 *
 * Uses wall-clock date+time only (not device timezone conversion).
 */
export function billableDays(
  pickupIso,
  returnIso,
  pickupTime = DEFAULT_PICKUP_TIME,
  returnTime = DEFAULT_RETURN_TIME,
) {
  if (!pickupIso || !returnIso) return 1
  if (returnIso < pickupIso) return 1

  const dayOffset = calendarDayOffset(pickupIso, returnIso)
  const totalMinutes =
    dayOffset * 24 * 60 + (timeToMinutes(returnTime) - timeToMinutes(pickupTime))

  if (totalMinutes <= 0) return 1
  return Math.max(1, Math.ceil(totalMinutes / (24 * 60) - 1e-9))
}

/**
 * @deprecated Prefer billableDays with pickup/return times.
 * Inclusive calendar dates (ignores clock) — kept for any legacy callers.
 */
export function daysBetween(pickupIso, returnIso) {
  return Math.max(1, calendarDayOffset(pickupIso, returnIso) + 1)
}

/**
 * Default trip lasting `targetDays` billable 24-hour periods
 * (given default pickup/return clock times).
 */
export function defaultBookingDates(
  targetDays = 3,
  leadDays = 0,
  pickupTime = DEFAULT_PICKUP_TIME,
  returnTime = DEFAULT_RETURN_TIME,
) {
  const pickup = new Date()
  pickup.setDate(pickup.getDate() + leadDays)
  const pickupDate = toISODate(pickup)

  let returnIso = pickupDate
  let guard = 0
  while (
    billableDays(pickupDate, returnIso, pickupTime, returnTime) < targetDays &&
    guard++ < 400
  ) {
    const d = new Date(`${returnIso}T12:00:00`)
    d.setDate(d.getDate() + 1)
    returnIso = toISODate(d)
  }

  return datesFromRange(pickupDate, returnIso, pickupTime, returnTime)
}

export function datesFromRange(
  pickupIso,
  returnIso,
  pickupTime = DEFAULT_PICKUP_TIME,
  returnTime = DEFAULT_RETURN_TIME,
) {
  if (returnIso < pickupIso) returnIso = pickupIso
  const days = billableDays(pickupIso, returnIso, pickupTime, returnTime)

  return {
    pickupDate: pickupIso,
    returnDate: returnIso,
    days,
    pickup: formatTripDate(pickupIso),
    dropoff: formatTripDate(returnIso),
  }
}

export function formatShortReturn(isoDate) {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export function todayISODate(now = new Date()) {
  return toISODate(now)
}
