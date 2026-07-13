function tripPickupIso(trip) {
  return trip.pickupDate ?? trip.createdAt?.slice(0, 10) ?? null
}

function tripPickupDate(trip) {
  const iso = tripPickupIso(trip)
  return iso ? new Date(`${iso}T12:00:00`) : null
}

/** Years with bookings, newest first. */
export function getBookingYears(trips) {
  const years = new Set()
  for (const trip of trips) {
    const date = tripPickupDate(trip)
    if (date) years.add(date.getFullYear())
  }
  return [...years].sort((a, b) => b - a)
}

/** Default year: current year if it has trips, else newest year with trips. */
export function defaultBookingYear(trips) {
  const years = getBookingYears(trips)
  if (years.length === 0) return new Date().getFullYear()
  const current = new Date().getFullYear()
  return years.includes(current) ? current : years[0]
}

/** Group trips by pickup month, newest first. Optional year filter. */
export function groupTripsByMonth(trips, { year } = {}) {
  const filtered =
    year == null
      ? trips
      : trips.filter((trip) => tripPickupDate(trip)?.getFullYear() === year)

  const sorted = [...filtered].sort((a, b) => {
    const da = tripPickupIso(a) ?? ''
    const db = tripPickupIso(b) ?? ''
    return db.localeCompare(da)
  })

  const groups = []
  let current = null

  for (const trip of sorted) {
    const date = tripPickupDate(trip)
    if (!date) continue

    const tripYear = date.getFullYear()
    const key = `${tripYear}-${date.getMonth()}`

    if (!current || current.key !== key) {
      current = {
        key,
        year: tripYear,
        month: date.getMonth(),
        label:
          year != null
            ? date.toLocaleDateString('en-US', { month: 'long' })
            : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        trips: [],
      }
      groups.push(current)
    }

    current.trips.push(trip)
  }

  return groups
}
