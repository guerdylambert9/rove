import { useState, useCallback } from 'react'
import { defaultBookingDates, datesFromRange, billableDays } from '../lib/tripDates.js'
import {
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
  clampPickupTime,
  isReturnTimeValid,
  nextReturnTimeAfter,
} from '../lib/tripTimes.js'
import { BookingContext } from './bookingContext.js'

const initialDates = defaultBookingDates(
  3,
  0,
  DEFAULT_PICKUP_TIME,
  DEFAULT_RETURN_TIME,
)
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
  days: billableDays(
    initialDates.pickupDate,
    initialDates.returnDate,
    initialPickupTime,
    initialReturnTime,
  ),
  coverage: {
    type: null,
    proofUploaded: false,
    proofFileRef: null,
    acknowledged: false,
    covers: null,
    pickupState: null,
    premiumTotal: null,
    insured: null,
  },
  persistedTripId: null,
}

export function BookingProvider({ children }) {
  const [trip, setTrip] = useState(defaultTrip)

  const selectCar = useCallback((car) => setTrip((t) => ({ ...t, car })), [])

  const setCoverage = useCallback(
    (patch) => setTrip((t) => ({ ...t, coverage: { ...t.coverage, ...patch } })),
    [],
  )

  const setDates = useCallback(
    (pickupDate, returnDate) =>
      setTrip((t) => {
        let pickupTime = clampPickupTime(pickupDate, t.pickupTime)
        let returnTime = t.returnTime
        if (
          !isReturnTimeValid(pickupDate, returnDate, pickupTime, returnTime)
        ) {
          returnTime = nextReturnTimeAfter(pickupTime)
        }
        const range = datesFromRange(
          pickupDate,
          returnDate,
          pickupTime,
          returnTime,
        )
        return {
          ...t,
          ...range,
          pickupTime,
          returnTime,
        }
      }),
    [],
  )

  const setTimes = useCallback(
    (pickupTime, returnTime) =>
      setTrip((t) => {
        const pickup = clampPickupTime(t.pickupDate, pickupTime)
        let nextReturn = returnTime
        if (
          !isReturnTimeValid(t.pickupDate, t.returnDate, pickup, returnTime)
        ) {
          nextReturn = nextReturnTimeAfter(pickup)
        }
        return {
          ...t,
          pickupTime: pickup,
          returnTime: nextReturn,
          days: billableDays(
            t.pickupDate,
            t.returnDate,
            pickup,
            nextReturn,
          ),
        }
      }),
    [],
  )

  const setPersistedTripId = useCallback(
    (id) => setTrip((t) => ({ ...t, persistedTripId: id })),
    [],
  )

  const reset = useCallback(() => setTrip(defaultTrip), [])

  return (
    <BookingContext.Provider
      value={{ trip, selectCar, setCoverage, setDates, setTimes, setPersistedTripId, reset }}
    >
      {children}
    </BookingContext.Provider>
  )
}
