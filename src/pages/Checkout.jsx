import { useState } from 'react'
import { useNavigate, Navigate, useSearchParams } from 'react-router-dom'
import { useBooking } from '../state/useBooking.js'
import { useAuth } from '../state/auth.jsx'
import { vehicleImageStyle } from '../lib/vehicleImage.js'
import { computePriceBreakdown, tripChargeAmount } from '../lib/tripPricing.js'
import { createTrip } from '../api/trips.js'
import { startCheckoutSession } from '../api/payments.js'
import { formatTripSchedule, isPickupTimeValid } from '../lib/tripTimes.js'
import { isPaymentsEnabled } from '../lib/stripe.js'
import {
  bypassInsuranceGate,
  bypassPaymentGate,
  coverageForBooking,
} from '../lib/bookingFlags.js'
import DevBookingBanner from '../components/DevBookingBanner.jsx'

export default function Checkout() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const { trip, setPersistedTripId, setCoverage } = useBooking()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const cancelled = searchParams.get('cancelled') === '1'
  const paymentsOn = isPaymentsEnabled()

  if (!trip.car) return <Navigate to="/" replace />

  const car = trip.car
  const coverage = coverageForBooking(trip.coverage)
  const pricingTrip = { ...trip, coverage }
  const breakdown = computePriceBreakdown(car, pricingTrip)
  const { subtotal, serviceFee, protection, deposit, total } = breakdown
  const chargeToday = paymentsOn ? tripChargeAmount(breakdown) : total

  const coverageLabel =
    coverage.type === 'protection'
      ? bypassInsuranceGate && !trip.coverage.type
        ? 'Rové protection (dev placeholder)'
        : 'Rové protection'
      : 'Own policy (pending verification)'

  const scheduleLabel = formatTripSchedule(trip)

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

    if (!isPickupTimeValid(trip.pickupDate, trip.pickupTime)) {
      setError('Pickup time must be in the future. Go back and choose a later time.')
      return
    }

    if (!car.ownerId) {
      setError(
        `${car.name} isn't linked to an owner yet. Book a listing from Fleet, or assign an owner in Supabase.`,
      )
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
        pickupTime: trip.pickupTime,
        returnTime: trip.returnTime,
        days: trip.days,
        coverage,
        priceBreakdown: breakdown,
        awaitPayment: paymentsOn,
      })

      setPersistedTripId(persisted.id)

      if (paymentsOn) {
        const { url } = await startCheckoutSession(persisted.id)
        window.location.href = url
        return
      }

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

          {cancelled && (
            <p className="auth-error">Payment was cancelled. You can try again.</p>
          )}

          <div className="rcard">
            <div className="mini">
              <div className="thumb" style={vehicleImageStyle(car)} />
              <div>
                <div className="nm">{car.name}</div>
                <div className="sm">{scheduleLabel} · West Palm Beach</div>
              </div>
            </div>
            <div className="divide" />
            <div className="rowline">
              <span>Coverage</span>
              <b>{coverageLabel}</b>
            </div>
          </div>

          {paymentsOn && (
            <div className="rcard">
              <p className="auth-note" style={{ margin: 0 }}>
                You&apos;ll pay securely with Stripe. Rental + fees are charged now; a
                refundable deposit is authorized separately (not captured unless needed).
              </p>
            </div>
          )}

          {bypassPaymentGate && (
            <p className="auth-note">
              Payment step bypassed in dev — no card charged.
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
          {paymentsOn && (
            <div className="rowline">
              <span>Deposit (hold)</span>
              <b>${deposit}</b>
            </div>
          )}
          <div className="divide" />
          <div className="totrow">
            <span>{paymentsOn ? 'Charged today' : 'Total today'}</span>
            <span>${chargeToday}</span>
          </div>
          {paymentsOn && (
            <p className="auth-note" style={{ marginTop: 8 }}>
              Plus ${deposit} refundable deposit hold on your card.
            </p>
          )}

          {error && <p className="auth-error">{error}</p>}
        </div>
      </div>

      <button className="cta sky" onClick={handleBook} disabled={submitting}>
        <span>
          {submitting
            ? paymentsOn
              ? 'Redirecting…'
              : 'Booking…'
            : user
              ? paymentsOn
                ? 'Pay with Stripe'
                : bypassPaymentGate
                  ? 'Confirm booking (dev)'
                  : 'Confirm booking'
              : 'Sign in to book'}
        </span>
        <span>${chargeToday} ›</span>
      </button>
    </div>
  )
}
