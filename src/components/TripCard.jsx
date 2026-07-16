import { useEffect, useState } from 'react'
import { vehicleImageStyle } from '../lib/vehicleImage.js'
import { tripStateLabel } from '../lib/tripStates.js'
import { formatMoney } from '../lib/tripPricing.js'
import { paymentSummary } from '../lib/paymentStatus.js'
import { canOwnerMarkReturned, getReturnTiming } from '../lib/tripReturn.js'
import { cancelPaymentPendingTrip, markTripReturned } from '../api/trips.js'
import { releaseTripDeposit, startCheckoutSession } from '../api/payments.js'
import {
  createReview,
  fetchTripReviewByAuthor,
} from '../api/reviews.js'
import { useAuth } from '../state/auth.jsx'

const REVIEWABLE = new Set(['returned', 'deposit_released', 'completed'])

export default function TripCard({ trip, role = 'renter', onUpdated }) {
  const { user } = useAuth()
  const car = trip.vehicle
  const displayName = car?.name ?? trip.priceBreakdown?.vehicleName ?? 'Vehicle'
  const payLine = paymentSummary(trip.payment)
  const timing = getReturnTiming(trip)
  const showMarkReturned = role === 'owner' && canOwnerMarkReturned(trip)
  const showPaymentActions = role === 'renter' && trip.state === 'payment_pending'
  const canReview = REVIEWABLE.has(trip.state) && user

  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [existingReview, setExistingReview] = useState(null)
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)

  useEffect(() => {
    if (!canReview || !user) return
    let cancelled = false
    fetchTripReviewByAuthor(trip.id, user.id)
      .then((r) => {
        if (!cancelled) setExistingReview(r)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [canReview, trip.id, user])

  const handleMarkReturned = async () => {
    setActionError('')
    setBusy(true)
    try {
      await markTripReturned(trip.id)
      if (trip.payment?.depositHoldStatus === 'authorized') {
        try {
          await releaseTripDeposit(trip.id)
        } catch {
          // Return still succeeds; deposit can be released later.
        }
      }
      onUpdated?.()
    } catch (err) {
      setActionError(err.message || 'Could not mark returned')
    } finally {
      setBusy(false)
    }
  }

  const handleCompletePayment = async () => {
    setActionError('')
    setBusy(true)
    try {
      const { url } = await startCheckoutSession(trip.id)
      window.location.href = url
    } catch (err) {
      setActionError(err.message || 'Could not resume checkout')
      setBusy(false)
    }
  }

  const handleCancelPending = async () => {
    setActionError('')
    setBusy(true)
    try {
      await cancelPaymentPendingTrip(trip.id)
      onUpdated?.()
    } catch (err) {
      setActionError(err.message || 'Could not cancel booking')
    } finally {
      setBusy(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!user) return
    setActionError('')
    setBusy(true)
    try {
      const saved = await createReview({
        tripId: trip.id,
        vehicleId: trip.vehicleId,
        authorId: user.id,
        role,
        rating,
        body,
      })
      setExistingReview(saved)
      setReviewOpen(false)
      onUpdated?.()
    } catch (err) {
      setActionError(err.message || 'Could not save review')
    } finally {
      setBusy(false)
    }
  }

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
          {trip.schedule ?? `${trip.pickup} – ${trip.dropoff}`} · {trip.days} days
        </div>
        <div className={`trip-state trip-state--${trip.state}`}>
          {tripStateLabel(trip.state)}
        </div>
        {payLine && <div className="trip-pay sm">{payLine}</div>}
        {timing.message && (
          <div
            className={`trip-return-note trip-return-note--${timing.status}`}
            role="status"
          >
            {timing.message}
          </div>
        )}
        {showMarkReturned && (
          <button
            type="button"
            className="trip-return-btn"
            onClick={handleMarkReturned}
            disabled={busy}
          >
            {busy ? 'Updating…' : 'Mark returned'}
          </button>
        )}
        {showPaymentActions && (
          <div className="trip-card-actions">
            <button
              type="button"
              className="trip-return-btn trip-return-btn--primary"
              onClick={handleCompletePayment}
              disabled={busy}
            >
              {busy ? 'Opening…' : 'Complete payment'}
            </button>
            <button
              type="button"
              className="trip-return-btn"
              onClick={handleCancelPending}
              disabled={busy}
            >
              Cancel hold
            </button>
          </div>
        )}
        {canReview && existingReview && (
          <div className="trip-review-done sm">
            Your rating: {'★'.repeat(existingReview.rating)}
            {'☆'.repeat(5 - existingReview.rating)}
          </div>
        )}
        {canReview && !existingReview && !reviewOpen && (
          <button
            type="button"
            className="trip-return-btn"
            onClick={() => setReviewOpen(true)}
          >
            Leave a review
          </button>
        )}
        {canReview && !existingReview && reviewOpen && (
          <div className="trip-review-form">
            <label className="authfield">
              <span>Rating</span>
              <select
                value={rating}
                onChange={(e) => setRating(Number(e.target.value))}
              >
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>
                    {n} star{n === 1 ? '' : 's'}
                  </option>
                ))}
              </select>
            </label>
            <label className="authfield">
              <span>Comment (optional)</span>
              <textarea
                rows={2}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="How was the trip?"
              />
            </label>
            <div className="trip-card-actions">
              <button
                type="button"
                className="trip-return-btn trip-return-btn--primary"
                onClick={handleSubmitReview}
                disabled={busy}
              >
                {busy ? 'Saving…' : 'Submit review'}
              </button>
              <button
                type="button"
                className="trip-return-btn"
                onClick={() => setReviewOpen(false)}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        {actionError && <p className="auth-error trip-action-error">{actionError}</p>}
      </div>
      {trip.total != null && (
        <div className="ern">
          <b>{formatMoney(trip.total)}</b>
        </div>
      )}
    </div>
  )
}
