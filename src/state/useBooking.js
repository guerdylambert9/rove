import { useContext } from 'react'
import { BookingContext } from './bookingContext.js'

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within a BookingProvider')
  return ctx
}
