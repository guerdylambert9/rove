import { useNavigate, Navigate } from 'react-router-dom'
import { useBooking } from '../state/booking.jsx'
import Icon from '../components/Icon.jsx'

export default function Insurance() {
  const navigate = useNavigate()
  const { trip, setCoverage } = useBooking()

  if (!trip.car) return <Navigate to="/" replace />

  const { coverage } = trip

  // Deliberate risk hedge: to continue on "own policy" you must upload proof
  // AND tick the liability acknowledgment. Protection path needs the ack too.
  const canContinue =
    coverage.acknowledged &&
    ((coverage.type === 'own' && coverage.proofUploaded) ||
      coverage.type === 'protection')

  return (
    <div className="page">
      <div className="scroll">
        <div className="pad" style={{ paddingTop: 18 }}>
          <h1 className="h1">Confirm coverage</h1>
          <p className="muted-sm">Every trip must be covered before pickup.</p>

          <button
            className={`insopt ${coverage.type === 'own' ? 'sel' : ''}`}
            onClick={() => setCoverage({ type: 'own' })}
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
                  {coverage.proofUploaded ? '✓ Proof uploaded' : '⬆ Upload insurance card'}
                </b>
                {coverage.proofUploaded ? 'We’ll verify within ~1 hr' : 'PDF or photo'}
              </label>
            )}
          </button>

          <button
            className={`insopt ${coverage.type === 'protection' ? 'sel' : ''}`}
            onClick={() => setCoverage({ type: 'protection' })}
          >
            <div className="hd">
              <div className="nm">Add Rové trip protection</div>
              <div className="pr">+$24/day</div>
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
        </div>
      </div>

      <button
        className="cta"
        disabled={!canContinue}
        onClick={() => navigate('/checkout')}
      >
        <span>Confirm coverage</span>
        <Icon name="chevron" size={16} />
      </button>
    </div>
  )
}
