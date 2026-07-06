import AppBottomNav from '../components/AppBottomNav.jsx'

export default function Inbox() {
  return (
    <div className="page">
      <div className="statusbar">
        <span>9:41</span>
        <span className="signal" />
      </div>

      <div className="scroll">
        <div className="pad" style={{ paddingTop: 24 }}>
          <h1 className="h1">Inbox</h1>
          <p className="auth-note">
            No messages yet. Trip messaging arrives in a later phase.
          </p>
        </div>
      </div>

      <AppBottomNav />
    </div>
  )
}
