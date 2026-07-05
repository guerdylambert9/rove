import { useNavigate, Navigate } from 'react-router-dom'
import { useBooking } from '../state/booking.jsx'

export default function Checkout() {
  const navigate = useNavigate()
  const { trip } = useBooking()

  if (!trip.car) return <Navigate to="/" replace />

  const car = trip.car
  const subtotal = car.pricePerDay * trip.days
  const serviceFee = 28
  const protection = trip.coverage.type === 'protection' ? 24 * trip.days : 0
  const deposit = 300
  const total = subtotal + serviceFee + protection + deposit

  const coverageLabel =
    trip.coverage.type === 'protection'
      ? 'Rové protection'
      : 'Own policy ✓ verified'

  return (
    <div className="page">
      <div className="scroll">
        <div className="pad" style={{ paddingTop: 18 }}>
          <h1 className="h1">Review trip</h1>

          <div className="rcard">
            <div className="mini">
              <div className="thumb" style={{ background: car.gradient }} />
              <div>
                <div className="nm">{car.name}</div>
                <div className="sm">
                  {trip.pickup} – {trip.dropoff} · West Palm Beach
                </div>
              </div>
            </div>
            <div className="divide" />
            <div className="rowline">
              <span>Coverage</span>
              <b>{coverageLabel}</b>
            </div>
          </div>

          <div className="rcard">
            <div className="paymethod">
              <div className="visa">VISA</div>
              <div>
                <div className="nm sm-nm">•••• 6411</div>
                <div className="sm">Expires 08/27</div>
              </div>
            </div>
          </div>

          <div className="rowline">
            <span>
              {trip.days} days
            </span>
            <b>${subtotal}</b>
          </div>
          {protection > 0 && (
            <div className="rowline">
              <span>Trip protection</span>
              <b>${protection}</b>
            </div>
          )}
          <div className="rowline">
            <span>Service fee</span>
            <b>${serviceFee}</b>
          </div>
          <div className="rowline">
            <span>Deposit (hold)</span>
            <b>${deposit}</b>
          </div>
          <div className="divide" />
          <div className="totrow">
            <span>Total today</span>
            <span>${total}</span>
          </div>
        </div>
      </div>

      <button className="cta sky" onClick={() => navigate('/confirmed')}>
        <span>Pay &amp; book</span>
        <span>${total} ›</span>
      </button>
    </div>
  )
}
