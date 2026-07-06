import { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/auth.jsx'

export default function OwnerRoute({ children }) {
  const { user, loading, canUseOwnerView, setViewMode } = useAuth()
  const location = useLocation()

  useEffect(() => {
    if (user && canUseOwnerView()) {
      setViewMode('owner')
    }
  }, [user, canUseOwnerView, setViewMode])

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

  if (!canUseOwnerView()) {
    return <Navigate to="/" replace />
  }

  return children
}
