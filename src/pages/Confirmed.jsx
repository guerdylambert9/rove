import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useBooking } from '../state/useBooking.js'
import { useAuth } from '../state/auth.jsx'
import { canUseOwnerView } from '../lib/roles.js'
import { formatTripSchedule } from '../lib/tripTimes.js'
import { fetchTrip } from '../api/trips.js'
import { paymentSummary } from '../lib/paymentStatus.js'
import {
  isAgreementSigned,
  isCoverageVerified,
} from '../lib/tripReady.js'
import Icon from '../components/Icon.jsx'

export default function Confirmed() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user, profile } = useAuth()
  const { trip, reset } = useBooking()
  const [loadedTrip, setLoadedTrip] = useState(null)

  const tripId = searchParams.get('trip_id') ?? trip.persistedTripId

  useEffect(() => {
    if (!tripId) return
    let cancelled = false
    fetchTrip(tripId).then((data) => {
      if (!cancelled) setLoadedTrip(data)
    })
    return () => {
      cancelled = true
    }
  }, [tripId])

  const displayTrip = loadedTrip ?? trip
  const host = loadedTrip?.vehicle?.host ?? trip.car?.host ?? 'your host'
  const scheduleLabel = loadedTrip
    ? loadedTrip.schedule
    : formatTripSchedule(trip)
  const payLine = paymentSummary(loadedTrip?.payment)

  const coverageDone = loadedTrip ? isCoverageVerified(loadedTrip) : false
  const agreementDone = loadedTrip ? isAgreementSigned(loadedTrip) : false
  const bonzahNo = loadedTrip?.coverage?.bonzahPolicyNo
  const ownPolicy = loadedTrip?.coverage?.type === 'own'

  let nextStep =
    'Coverage verification is next — pickup details follow once that clears.'
  if (coverageDone && !agreementDone) {
    nextStep = 'Coverage is set. Sign the rental agreement before pickup.'
  } else if (coverageDone && agreementDone) {
    nextStep = 'You are ready for pickup once your host confirms handoff.'
  } else if (ownPolicy && loadedTrip?.state === 'coverage_pending') {
    nextStep =
      'We received your insurance proof. An admin will verify it, then you can sign the agreement.'
  } else if (bonzahNo) {
    nextStep = `Bonzah policy ${bonzahNo} is on file. Sign the rental agreement when ready.`
  }

  const viewTrip = () => {
    reset()
    if (user && canUseOwnerView(profile)) {
      navigate('/dashboard')
    } else {
      navigate('/trips')
    }
  }

  return (
    <div className="page">
      <div className="confhero">
        <div className="tick">
          <Icon name="check" size={30} stroke="#fff" />
        </div>
        <h1>You&apos;re booked</h1>
        <p>
          {payLine ? `${payLine}. ` : ''}
          {host} will see your request. {nextStep}
        </p>
      </div>

      <div className="handoff">
        <div className="li">
          <div className="ic2">
            <Icon name="pin" size={16} />
          </div>
          <div>
            <div className="tt">Pickup</div>
            <div className="dd">{scheduleLabel} · Downtown WPB</div>
          </div>
        </div>
        <div className="li">
          <div className="ic2">
            <Icon name="doc" size={16} />
          </div>
          <div>
            <div className="tt">Rental agreement</div>
            <div className="dd">
              {agreementDone
                ? 'Signed — ready for pickup handoff'
                : coverageDone
                  ? 'Sign from your trip list before keys'
                  : 'Available after coverage is verified'}
            </div>
          </div>
        </div>
        {loadedTrip && coverageDone && !agreementDone && (
          <Link to={`/trip/${loadedTrip.id}/sign`} className="cta outline conf-sign-link">
            Sign agreement now
          </Link>
        )}
        <div className="li">
          <div className="ic2">
            <Icon name="chat" size={16} />
          </div>
          <div>
            <div className="tt">Message {host}</div>
            <div className="dd">Messaging arrives in Phase 6</div>
          </div>
        </div>
      </div>

      <button className="cta sky" style={{ marginTop: 8 }} onClick={viewTrip}>
        <span>View trip</span>
        <Icon name="chevron" size={16} />
      </button>
    </div>
  )
}
