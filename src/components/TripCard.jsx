import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { vehicleImageStyle } from '../lib/vehicleImage.js'
import { tripStateLabel } from '../lib/tripStates.js'
import { formatMoney } from '../lib/tripPricing.js'
import { paymentSummary } from '../lib/paymentStatus.js'
import {
  canOwnerConfirmPickup,
  canOwnerMarkReturned,
  getReturnTiming,
  isAgreementSigned,
  isCoverageVerified,
  pickupGateMessage,
} from '../lib/tripReturn.js'
import { BONZAH_PRODUCTS } from '../lib/bonzahCovers.js'
import {
  cancelPaymentPendingTrip,
  markTripPickedUp,
  markTripReturned,
} from '../api/trips.js'
import { releaseTripDeposit, startCheckoutSession } from '../api/payments.js'
import { downloadBonzahPolicyPdf, settleBonzahInsurance } from '../api/bonzah.js'
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
  const showConfirmPickup = role === 'owner' && canOwnerConfirmPickup(trip)
  const showSignAgreement =
    role === 'renter' &&
    isCoverageVerified(trip) &&
    !isAgreementSigned(trip) &&
    !['payment_pending', 'cancelled'].includes(trip.state)
  const gateMessage = pickupGateMessage(trip)
  const pdfIds = trip.coverage?.bonzahPdfIds ?? {}
  const pdfKeys = BONZAH_PRODUCTS.map((p) => p.id).filter((id) => pdfIds[id])
  const showPaymentActions = role === 'renter' && trip.state === 'payment_pending'
  const showBonzahSettle =
    role === 'renter' &&
    trip.state === 'coverage_pending' &&
    trip.coverage?.type === 'protection' &&
    !trip.coverage?.bonzahPolicyNo
  const bonzahPolicyNo = trip.coverage?.bonzahPolicyNo
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

  const handleConfirmPickup = async () => {
    setActionError('')
    setBusy(true)
    try {
      await markTripPickedUp(trip.id)
      onUpdated?.()
    } catch (err) {
      setActionError(err.message || 'Could not confirm pickup')
    } finally {
      setBusy(false)
    }
  }

  const handleDownloadPdf = async (pdfKey) => {
    setActionError('')
    setBusy(true)
    try {
      await downloadBonzahPolicyPdf(trip.id, pdfKey)
    } catch (err) {
      setActionError(err.message || 'Could not download policy PDF')
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

  const handleSettleInsurance = async () => {
    setActionError('')
    setBusy(true)
    try {
      await settleBonzahInsurance(trip.id)
      onUpdated?.()
    } catch (err) {
      setActionError(err.message || 'Could not issue insurance policy')
    } finally {
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
          {trip.schedule ?? `${trip.pickup} – ${trip.dropoff}`} · {trip.days}{' '}
          {trip.days === 1 ? 'day' : 'days'}
        </div>
        <div className={`trip-state trip-state--${trip.state}`}>
          {tripStateLabel(trip.state)}
        </div>
        {payLine && <div className="trip-pay sm">{payLine}</div>}
        {bonzahPolicyNo && (
          <div className="trip-pay sm">Bonzah policy {bonzahPolicyNo}</div>
        )}
        {trip.coverage?.type === 'own' &&
          trip.coverage?.verificationStatus === 'pending' &&
          trip.state === 'coverage_pending' && (
            <div className="trip-pay sm">Own policy — awaiting admin verification</div>
          )}
        {trip.coverage?.rejectionReason &&
          trip.coverage?.verificationStatus === 'rejected' && (
            <div className="auth-note" role="alert">
              Coverage rejected: {trip.coverage.rejectionReason}
            </div>
          )}
        {trip.coverage?.rejectionReason && showBonzahSettle && (
          <div className="auth-note" role="alert">
            {trip.coverage.rejectionReason}
          </div>
        )}
        {gateMessage &&
          !['payment_pending', 'cancelled', 'returned', 'completed', 'deposit_released'].includes(
            trip.state,
          ) &&
          !showSignAgreement && (
            <div className="trip-return-note" role="status">
              Before pickup: {gateMessage}
            </div>
          )}
        {pdfKeys.length > 0 && (
          <div className="trip-pdf-links">
            {pdfKeys.map((key) => {
              const label = BONZAH_PRODUCTS.find((p) => p.id === key)?.name ?? key
              return (
                <button
                  key={key}
                  type="button"
                  className="trip-pdf-link"
                  disabled={busy}
                  onClick={() => handleDownloadPdf(key)}
                >
                  {label} PDF
                </button>
              )
            })}
          </div>
        )}
        {timing.message && (
          <div
            className={`trip-return-note trip-return-note--${timing.status}`}
            role="status"
          >
            {timing.message}
          </div>
        )}
        {showConfirmPickup && (
          <button
            type="button"
            className="trip-return-btn trip-return-btn--primary"
            onClick={handleConfirmPickup}
            disabled={busy}
          >
            {busy ? 'Updating…' : 'Confirm pickup'}
          </button>
        )}
        {showSignAgreement && (
          <Link to={`/trip/${trip.id}/sign`} className="trip-return-btn trip-return-btn--primary">
            Sign rental agreement
          </Link>
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
        {showBonzahSettle && (
          <button
            type="button"
            className="trip-return-btn trip-return-btn--primary"
            onClick={handleSettleInsurance}
            disabled={busy}
          >
            {busy ? 'Issuing policy…' : 'Issue Bonzah policy'}
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
