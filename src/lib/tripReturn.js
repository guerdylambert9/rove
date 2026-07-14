import { formatTripTime, normalizeTripTime, DEFAULT_RETURN_TIME } from './tripTimes.js'

const ENDED_STATES = new Set([
  'returned',
  'deposit_released',
  'completed',
  'cancelled',
])

const OPEN_FOR_RETURN_STATES = new Set([
  'coverage_pending',
  'coverage_verified',
  'agreement_signed',
  'confirmed',
  'in_progress',
  'requested',
])

/** Local Date for the trip's scheduled return. */
export function tripReturnAt(trip) {
  const date = trip.returnDate ?? trip.return_date
  const time = normalizeTripTime(
    trip.returnTime ?? trip.return_time ?? DEFAULT_RETURN_TIME,
  )
  // Interpret as local wall clock (matches booking UI times).
  return new Date(`${date}T${time}:00`)
}

export function tripPickupAt(trip) {
  const date = trip.pickupDate ?? trip.pickup_date
  const time = normalizeTripTime(trip.pickupTime ?? trip.pickup_time ?? '10:00')
  return new Date(`${date}T${time}:00`)
}

/** Whether this trip still occupies the vehicle for browse/fleet. */
export function isTripOccupyingVehicle(trip, now = new Date()) {
  const state = trip.state
  if (!state || ENDED_STATES.has(state) || state === 'payment_pending') {
    return false
  }
  return tripPickupAt(trip) <= now && tripReturnAt(trip) > now
}

/**
 * Return urgency for active trips.
 * @returns {{ status: 'ok'|'due_soon'|'late'|'done', message: string|null }}
 */
export function getReturnTiming(trip, now = new Date()) {
  if (ENDED_STATES.has(trip.state)) {
    return { status: 'done', message: null }
  }
  if (trip.state === 'payment_pending') {
    return { status: 'ok', message: null }
  }

  const returnAt = tripReturnAt(trip)
  const returnLabel = formatTripTime(trip.returnTime ?? trip.return_time)
  const msLeft = returnAt.getTime() - now.getTime()

  if (msLeft <= 0) {
    return {
      status: 'late',
      message: `Return was due at ${returnLabel} — overdue`,
    }
  }

  const oneHour = 60 * 60 * 1000
  if (msLeft <= oneHour) {
    return {
      status: 'due_soon',
      message: `Return due at ${returnLabel} (within the hour)`,
    }
  }

  return { status: 'ok', message: null }
}

export function canOwnerMarkReturned(trip) {
  return OPEN_FOR_RETURN_STATES.has(trip.state)
}
