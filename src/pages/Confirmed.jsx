import { useNavigate } from 'react-router-dom'
import { useBooking } from '../state/booking.jsx'
import Icon from '../components/Icon.jsx'

export default function Confirmed() {
  const navigate = useNavigate()
  const { trip } = useBooking()
  const host = trip.car?.host || 'your host'

  return (
    <div className="page">
      <div className="confhero">
        <div className="tick">
          <Icon name="check" size={30} stroke="#fff" />
        </div>
        <h1>You’re booked</h1>
        <p>{host} will confirm pickup details shortly.</p>
      </div>

      <div className="handoff">
        <div className="li">
          <div className="ic2">
            <Icon name="pin" size={16} />
          </div>
          <div>
            <div className="tt">Pickup</div>
            <div className="dd">Downtown WPB · shared at 24 hr out</div>
          </div>
        </div>
        <div className="li">
          <div className="ic2">
            <Icon name="doc" size={16} />
          </div>
          <div>
            <div className="tt">Rental agreement</div>
            <div className="dd">Sign digitally before keys</div>
          </div>
        </div>
        <div className="li">
          <div className="ic2">
            <Icon name="chat" size={16} />
          </div>
          <div>
            <div className="tt">Message {host}</div>
            <div className="dd">Usually replies in minutes</div>
          </div>
        </div>
      </div>

      <button
        className="cta sky"
        style={{ marginTop: 8 }}
        onClick={() => navigate('/dashboard')}
      >
        <span>View trip</span>
        <Icon name="chevron" size={16} />
      </button>
    </div>
  )
}
