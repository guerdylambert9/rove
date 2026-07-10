export function isVehicleBooked(car) {
  return car?.status === 'rented'
}

/** e.g. "Booked until Sat Jul 11" from synced status_label */
export function vehicleBookedLabel(car) {
  if (!isVehicleBooked(car)) return null

  const match = car.statusLabel?.match(/returns\s+(.+)$/i)
  if (match) return `Booked until ${match[1]}`

  return 'Currently booked'
}
