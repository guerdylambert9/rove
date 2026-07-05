import BottomNav from '../components/BottomNav.jsx'

export default function Trips() {
  return (
    <div className="page">
      <div className="statusbar">
        <span>9:41</span>
        <span className="signal" />
      </div>

      <div className="scroll">
        <div className="pad" style={{ paddingTop: 24 }}>
          <h1 className="h1">Your trips</h1>
          <p className="auth-note">
            No trips yet. Browse available cars and book your first ride.
          </p>
        </div>
      </div>

      <BottomNav variant="renter" />
    </div>
  )
}
