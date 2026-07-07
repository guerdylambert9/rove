import { useAuth } from '../state/auth.jsx'
import MfaChallenge from './MfaChallenge.jsx'

export default function AuthGate({ children }) {
  const { user, loading, needsMfaChallenge, refreshMfaState } = useAuth()

  if (loading) {
    return (
      <div className="page">
        <div className="pad" style={{ paddingTop: 24 }}>
          <p className="auth-note">Loading…</p>
        </div>
      </div>
    )
  }

  if (user && needsMfaChallenge) {
    return <MfaChallenge onVerified={refreshMfaState} />
  }

  return children
}
