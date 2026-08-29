import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../state/auth.jsx'
import { fetchTrip } from '../api/trips.js'
import { signTripAgreement } from '../api/coverage.js'
import { isAgreementSigned, isCoverageVerified } from '../lib/tripReady.js'
import { formatMoney } from '../lib/tripPricing.js'
import Icon from '../components/Icon.jsx'

const ACK_TEXT =
  'I agree to the Rové peer-to-peer rental terms for this trip, including vehicle care, ' +
  'return condition, fuel/charging, mileage limits if stated by the host, and applicable fees. ' +
  'I confirm I am the authorized driver and will comply with traffic laws and the host’s rules.'

export default function SignAgreement() {
  const { id: tripId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [trip, setTrip] = useState(null)
  const [loading, setLoading] = useState(true)
  const [signerName, setSignerName] = useState('')
  const [ack, setAck] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!tripId) return
    let cancelled = false
    fetchTrip(tripId)
      .then((data) => {
        if (!cancelled) setTrip(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load trip')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [tripId])

  if (!user) {
    return <Navigate to="/account" replace state={{ from: `/trip/${tripId}/sign` }} />
  }

  if (loading) {
    return (
      <div className="page">
        <div className="pad" style={{ paddingTop: 24 }}>
          <p className="auth-note">Loading trip…</p>
        </div>
      </div>
    )
  }

  if (!trip) {
    return (
      <div className="page">
        <div className="pad" style={{ paddingTop: 24 }}>
          <p className="auth-note">{error || 'Trip not found'}</p>
          <Link to="/trips" className="cta outline" style={{ marginTop: 16 }}>
            Back to trips
          </Link>
        </div>
      </div>
    )
  }

  if (trip.renterId !== user.id) {
    return <Navigate to="/trips" replace />
  }

  if (isAgreementSigned(trip)) {
    return <Navigate to="/trips" replace />
  }

  if (!isCoverageVerified(trip)) {
    return (
      <div className="page">
        <div className="scroll">
          <div className="pad" style={{ paddingTop: 18 }}>
            <h1 className="h1">Coverage required first</h1>
            <p className="muted-sm">
              Your rental agreement unlocks after coverage is verified. Check your trip for
              status.
            </p>
            <Link to="/trips" className="cta outline" style={{ marginTop: 16 }}>
              View trips
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const vehicleName = trip.vehicle?.name ?? 'Vehicle'
  const total = trip.total ?? trip.priceBreakdown?.total

  const handleSign = async () => {
    setError('')
    if (!signerName.trim()) {
      setError('Enter your full legal name')
      return
    }
    if (!ack) {
      setError('Check the acknowledgment to continue')
      return
    }

    setBusy(true)
    try {
      await signTripAgreement({
        tripId: trip.id,
        renterId: user.id,
        signerName: signerName.trim(),
        acknowledgmentText: ACK_TEXT,
      })
      navigate('/trips')
    } catch (err) {
      setError(err.message || 'Could not sign agreement')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="scroll">
        <div className="pad" style={{ paddingTop: 18 }}>
          <h1 className="h1">Rental agreement</h1>
          <p className="muted-sm">
            Sign digitally before pickup. Your host can hand over keys once this is complete.
          </p>

          <div className="agreement-summary">
            <div className="agreement-row">
              <span className="muted-sm">Vehicle</span>
              <b>{vehicleName}</b>
            </div>
            <div className="agreement-row">
              <span className="muted-sm">Dates</span>
              <b>{trip.schedule ?? `${trip.pickup} – ${trip.dropoff}`}</b>
            </div>
            {total != null && (
              <div className="agreement-row">
                <span className="muted-sm">Trip total</span>
                <b>{formatMoney(total)}</b>
              </div>
            )}
            {trip.coverage?.bonzahPolicyNo && (
              <div className="agreement-row">
                <span className="muted-sm">Bonzah policy</span>
                <b>{trip.coverage.bonzahPolicyNo}</b>
              </div>
            )}
          </div>

          <div className="agreement-terms">
            <p>{ACK_TEXT}</p>
          </div>

          <label className="field">
            <span>Full legal name (e-signature)</span>
            <input
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              autoComplete="name"
              placeholder="As shown on your license"
            />
          </label>

          <label className="ackbox">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} />
            <span>I have read and agree to the rental terms above.</span>
          </label>

          {error && (
            <p className="auth-note" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        className="cta sky"
        disabled={busy || !signerName.trim() || !ack}
        onClick={handleSign}
      >
        <span>{busy ? 'Signing…' : 'Sign agreement'}</span>
        <Icon name="chevron" size={16} />
      </button>
    </div>
  )
}
