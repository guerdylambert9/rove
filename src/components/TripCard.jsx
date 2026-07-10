import { vehicleImageStyle } from '../lib/vehicleImage.js'
import { tripStateLabel } from '../lib/tripStates.js'
import { formatMoney } from '../lib/tripPricing.js'

export default function TripCard({ trip }) {
  const car = trip.vehicle
  const displayName = car?.name ?? trip.priceBreakdown?.vehicleName ?? 'Vehicle'

  return (
    <div className="trip-card">
      <div
        className="th"
        style={vehicleImageStyle(
          car ?? {
            photos: [],
            gradient: 'linear-gradient(120deg, #134074, #3A86FF)',
          },
        )}
      />
      <div className="trip-card-body">
        <div className="nm">{displayName}</div>
        <div className="sm">
          {trip.pickup} – {trip.dropoff} · {trip.days} days
        </div>
        <div className={`trip-state trip-state--${trip.state}`}>
          {tripStateLabel(trip.state)}
        </div>
      </div>
      {trip.total != null && (
        <div className="ern">
          <b>{formatMoney(trip.total)}</b>
        </div>
      )}
    </div>
  )
}
