import { useState } from 'react'
import { defaultBookingDates, datesFromRange } from '../lib/tripDates.js'
import {
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  clampPickupTime,
  isReturnTimeValid,
  nextReturnTimeAfter,
} from '../lib/tripTimes.js'
import { BookingContext } from './bookingContext.js'

const initialDates = defaultBookingDates(3)
const initialPickupTime = clampPickupTime(
  initialDates.pickupDate,
  DEFAULT_PICKUP_TIME,
)
const initialReturnTime = isReturnTimeValid(
  initialDates.pickupDate,
  initialDates.returnDate,
  initialPickupTime,
  DEFAULT_RETURN_TIME,
)
  ? DEFAULT_RETURN_TIME
  : nextReturnTimeAfter(initialPickupTime)

const defaultTrip = {
  car: null,
  pickupDate: initialDates.pickupDate,
  returnDate: initialDates.returnDate,
  pickupTime: initialPickupTime,
  returnTime: initialReturnTime,
  pickup: initialDates.pickup,
  dropoff: initialDates.dropoff,
  days: initialDates.days,
  coverage: {
    type: null,
    proofUploaded: false,
    acknowledged: false,
  },
  persistedTripId: null,
}

export function BookingProvider({ children }) {
  const [trip, setTrip] = useState(defaultTrip)

  const selectCar = (car) => setTrip((t) => ({ ...t, car }))

  const setCoverage = (patch) =>
    setTrip((t) => ({ ...t, coverage: { ...t.coverage, ...patch } }))

  const setDates = (pickupDate, returnDate) =>
    setTrip((t) => {
      const next = { ...t, ...datesFromRange(pickupDate, returnDate) }
      next.pickupTime = clampPickupTime(pickupDate, next.pickupTime)
      if (
        !isReturnTimeValid(
          pickupDate,
          returnDate,
          next.pickupTime,
          next.returnTime,
        )
      ) {
        next.returnTime = nextReturnTimeAfter(next.pickupTime)
      }
      return next
    })

  const setTimes = (pickupTime, returnTime) =>
    setTrip((t) => {
      const pickup = clampPickupTime(t.pickupDate, pickupTime)
      let nextReturn = returnTime
      if (
        !isReturnTimeValid(t.pickupDate, t.returnDate, pickup, returnTime)
      ) {
        nextReturn = nextReturnTimeAfter(pickup)
      }
      return { ...t, pickupTime: pickup, returnTime: nextReturn }
    })

  const setPersistedTripId = (id) => setTrip((t) => ({ ...t, persistedTripId: id }))

  const reset = () => setTrip(defaultTrip)

  return (
    <BookingContext.Provider
      value={{ trip, selectCar, setCoverage, setDates, setTimes, setPersistedTripId, reset }}
    >
      {children}
    </BookingContext.Provider>
  )
}
