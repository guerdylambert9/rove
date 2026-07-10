import { useNavigate, Navigate } from 'react-router-dom'
import { useBooking } from '../state/useBooking.js'
import { bypassInsuranceGate, DEV_COVERAGE_STUB } from '../lib/bookingFlags.js'
import DevBookingBanner from '../components/DevBookingBanner.jsx'
import Icon from '../components/Icon.jsx'

export default function Insurance() {
  const navigate = useNavigate()
  const { trip, setCoverage } = useBooking()

  if (!trip.car) return <Navigate to="/" replace />

  const { coverage } = trip

  const hasCoverageType = coverage.type === 'own' || coverage.type === 'protection'

  // Phase 2: record the choice at booking. Proof upload + admin verify is Phase 4.
  const canContinue = coverage.acknowledged && hasCoverageType

  const selectType = (type) => {
    setCoverage({
      type,
      proofUploaded: type === 'protection' ? false : coverage.proofUploaded,
    })
  }

  const skipToCheckout = () => {
    setCoverage(DEV_COVERAGE_STUB)
    navigate('/checkout')
  }

  const missing = []
  if (!hasCoverageType) missing.push('select a coverage option')
  if (!coverage.acknowledged) missing.push('check the acknowledgment')

  return (
    <div className="page">
      <div className="scroll">
        <div className="pad" style={{ paddingTop: 18 }}>
          <DevBookingBanner />
          <h1 className="h1">Confirm coverage</h1>
          <p className="muted-sm">Every trip must be covered before pickup.</p>

          {bypassInsuranceGate && (
            <button type="button" className="cta outline dev-skip-btn" onClick={skipToCheckout}>
              Skip to checkout (dev bypass)
            </button>
          )}

          <button
            type="button"
            className={`insopt ${coverage.type === 'own' ? 'sel' : ''}`}
            onClick={() => selectType('own')}
          >
            <div className="hd">
              <div className="nm">Use my own auto insurance</div>
              <span className={`radio ${coverage.type === 'own' ? 'on' : ''}`} />
            </div>
            <div className="ds">
              Bring your personal policy. You’ll upload proof — we verify it covers
              rental use before the keys hand over.
            </div>

            {coverage.type === 'own' && (
              <label
                className={`upload ${coverage.proofUploaded ? 'done' : ''}`}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  hidden
                  onChange={(e) =>
                    setCoverage({ proofUploaded: e.target.files.length > 0 })
                  }
                />
                <b>
                  {coverage.proofUploaded ? '✓ Proof uploaded' : '⬆ Upload insurance card (optional for now)'}
                </b>
                {coverage.proofUploaded
                  ? 'We’ll verify before pickup'
                  : 'Required before pickup — verification coming in Phase 4'}
              </label>
            )}
          </button>

          <button
            type="button"
            className={`insopt ${coverage.type === 'protection' ? 'sel' : ''}`}
            onClick={() => selectType('protection')}
          >
            <div className="hd">
              <div className="nm">Add Rové trip protection</div>
              <span className="hd-right">
                <span className="pr">+$24/day</span>
                <span className={`radio ${coverage.type === 'protection' ? 'on' : ''}`} />
              </span>
            </div>
            <div className="ds">
              Third-party coverage added to your booking. No personal policy needed.
            </div>
          </button>

          <label className="ackbox">
            <input
              type="checkbox"
              checked={coverage.acknowledged}
              onChange={(e) => setCoverage({ acknowledged: e.target.checked })}
            />
            <span>
              I confirm my coverage extends to renting this vehicle, and I accept
              liability for any gap. <b>Rové is not the insurer.</b>
            </span>
          </label>

          {!canContinue && missing.length > 0 && (
            <p className="auth-note" style={{ marginTop: 12 }}>
              To continue: {missing.join(' and ')}.
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        className={`cta ${canContinue ? 'sky' : ''}`}
        disabled={!canContinue}
        onClick={() => navigate('/checkout')}
      >
        <span>Confirm coverage</span>
        <Icon name="chevron" size={16} />
      </button>
    </div>
  )
}
