import { useState } from 'react'
import { defaultBookingDates, datesFromRange } from '../lib/tripDates.js'
import { BookingContext } from './bookingContext.js'

const initialDates = defaultBookingDates(3)

const defaultTrip = {
  car: null,
  pickupDate: initialDates.pickupDate,
  returnDate: initialDates.returnDate,
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
    setTrip((t) => ({ ...t, ...datesFromRange(pickupDate, returnDate) }))

  const setPersistedTripId = (id) => setTrip((t) => ({ ...t, persistedTripId: id }))

  const reset = () => setTrip(defaultTrip)

  return (
    <BookingContext.Provider
      value={{ trip, selectCar, setCoverage, setDates, setPersistedTripId, reset }}
    >
      {children}
    </BookingContext.Provider>
  )
}
