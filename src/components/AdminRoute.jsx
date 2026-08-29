import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/auth.jsx'
import { isAdmin } from '../lib/roles.js'

export default function AdminRoute({ children }) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="page">
        <div className="pad" style={{ paddingTop: 24 }}>
          <p className="auth-note">Loading…</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/account" replace state={{ from: location.pathname }} />
  }

  if (!isAdmin(profile)) {
    return <Navigate to="/" replace />
  }

  return children
}
