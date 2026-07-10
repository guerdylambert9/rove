import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { useBooking } from '../state/useBooking.js'
import { useAuth } from '../state/auth.jsx'
import { vehicleImageStyle } from '../lib/vehicleImage.js'
import { computePriceBreakdown } from '../lib/tripPricing.js'
import { createTrip } from '../api/trips.js'
import {
  bypassInsuranceGate,
  bypassPaymentGate,
  coverageForBooking,
} from '../lib/bookingFlags.js'
import DevBookingBanner from '../components/DevBookingBanner.jsx'

export default function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { trip, setPersistedTripId, setCoverage } = useBooking()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!trip.car) return <Navigate to="/" replace />

  const car = trip.car
  const coverage = coverageForBooking(trip.coverage)
  const pricingTrip = { ...trip, coverage }
  const breakdown = computePriceBreakdown(car, pricingTrip)
  const { subtotal, serviceFee, protection, deposit, total } = breakdown

  const coverageLabel =
    coverage.type === 'protection'
      ? bypassInsuranceGate && !trip.coverage.type
        ? 'Rové protection (dev placeholder)'
        : 'Rové protection'
      : 'Own policy (pending verification)'

  const handleBook = async () => {
    setError('')

    if (!user) {
      navigate('/account', { state: { from: '/checkout' } })
      return
    }

    if (!coverage.type) {
      navigate('/insurance')
      return
    }

    if (bypassInsuranceGate && !trip.coverage.type) {
      setCoverage(coverage)
    }

    setSubmitting(true)
    try {
      const persisted = await createTrip({
        vehicleId: car.id,
        ownerId: car.ownerId,
        renterId: user.id,
        pickupDate: trip.pickupDate,
        returnDate: trip.returnDate,
        days: trip.days,
        coverage,
        priceBreakdown: breakdown,
      })
      setPersistedTripId(persisted.id)
      navigate('/confirmed')
    } catch (err) {
      setError(err.message || 'Could not complete booking')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="scroll">
        <div className="pad" style={{ paddingTop: 18 }}>
          <DevBookingBanner />
          <h1 className="h1">Review trip</h1>

          <div className="rcard">
            <div className="mini">
              <div className="thumb" style={vehicleImageStyle(car)} />
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

          {!bypassPaymentGate && (
            <div className="rcard">
              <div className="paymethod">
                <div className="visa">VISA</div>
                <div>
                  <div className="nm sm-nm">•••• 6411</div>
                  <div className="sm">Expires 08/27</div>
                </div>
              </div>
              <p className="auth-note" style={{ marginTop: 10, marginBottom: 0 }}>
                Payment is simulated for now — real charges arrive in Phase 3.
              </p>
            </div>
          )}

          {bypassPaymentGate && (
            <p className="auth-note">
              Payment step bypassed in dev — no card charged. Stripe checkout ships in Phase 3.
            </p>
          )}

          <div className="rowline">
            <span>{trip.days} days</span>
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

          {error && <p className="auth-error">{error}</p>}
        </div>
      </div>

      <button className="cta sky" onClick={handleBook} disabled={submitting}>
        <span>
          {submitting
            ? 'Booking…'
            : user
              ? bypassPaymentGate
                ? 'Confirm booking (dev)'
                : 'Confirm booking'
              : 'Sign in to book'}
        </span>
        <span>${total} ›</span>
      </button>
    </div>
  )
}
