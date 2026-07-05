import { createContext, useContext, useState } from 'react'

const BookingContext = createContext(null)

const defaultTrip = {
  car: null,
  pickup: 'Fri, Jul 4',
  dropoff: 'Sun, Jul 6',
  days: 3,
  coverage: {
    type: null,          // 'own' | 'protection'
    proofUploaded: false, // for 'own'
    acknowledged: false,
  },
}

export function BookingProvider({ children }) {
  const [trip, setTrip] = useState(defaultTrip)

  const selectCar = (car) => setTrip((t) => ({ ...t, car }))

  const setCoverage = (patch) =>
    setTrip((t) => ({ ...t, coverage: { ...t.coverage, ...patch } }))

  const reset = () => setTrip(defaultTrip)

  return (
    <BookingContext.Provider value={{ trip, selectCar, setCoverage, reset }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within a BookingProvider')
  return ctx
}
