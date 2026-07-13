import { formatShortReturn } from './tripDates.js'

/** Trip is actively using the vehicle today (pickup ≤ today ≤ return). */
export function isVehicleBooked(car) {
  return Boolean(car?.activeReturnDate)
}

/** e.g. "Booked until Jul 11" */
export function vehicleBookedLabel(car) {
  if (!isVehicleBooked(car)) return null
  return `Booked until ${formatShortReturn(car.activeReturnDate)}`
}

export function ownerRentedLabel(returnDate) {
  return `Rented · returns ${formatShortReturn(returnDate)}`
}
