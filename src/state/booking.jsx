import { useState } from 'react'
import { defaultBookingDates, datesFromRange } from '../lib/tripDates.js'
import {
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  isReturnTimeValid,
  nextReturnTimeAfter,
} from '../lib/tripTimes.js'
import { BookingContext } from './bookingContext.js'

const initialDates = defaultBookingDates(3)

const defaultTrip = {
  car: null,
  pickupDate: initialDates.pickupDate,
  returnDate: initialDates.returnDate,
  pickupTime: DEFAULT_PICKUP_TIME,
  returnTime: DEFAULT_RETURN_TIME,
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
      let nextReturn = returnTime
      if (
        !isReturnTimeValid(t.pickupDate, t.returnDate, pickupTime, returnTime)
      ) {
        nextReturn = nextReturnTimeAfter(pickupTime)
      }
      return { ...t, pickupTime, returnTime: nextReturn }
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
