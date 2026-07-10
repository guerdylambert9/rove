import { useNavigate } from 'react-router-dom'
import { useBooking } from '../state/useBooking.js'
import { useAuth } from '../state/auth.jsx'
import { canUseOwnerView } from '../lib/roles.js'
import Icon from '../components/Icon.jsx'

export default function Confirmed() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { trip, reset } = useBooking()
  const host = trip.car?.host || 'your host'

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
        <h1>You’re booked</h1>
        <p>
          {host} will see your request. Coverage verification is next (Phase 4) —
          pickup details follow once that clears.
        </p>
      </div>

      <div className="handoff">
        <div className="li">
          <div className="ic2">
            <Icon name="pin" size={16} />
          </div>
          <div>
            <div className="tt">Pickup</div>
            <div className="dd">
              {trip.pickup} – {trip.dropoff} · Downtown WPB
            </div>
          </div>
        </div>
        <div className="li">
          <div className="ic2">
            <Icon name="doc" size={16} />
          </div>
          <div>
            <div className="tt">Rental agreement</div>
            <div className="dd">Sign digitally before keys (coming in Phase 4)</div>
          </div>
        </div>
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
