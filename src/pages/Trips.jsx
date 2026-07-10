import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav.jsx'
import TripCard from '../components/TripCard.jsx'
import { fetchRenterTrips } from '../api/trips.js'
import { useAuth } from '../state/auth.jsx'

export default function Trips() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      setLoading(false)
      return
    }

    let cancelled = false
    fetchRenterTrips(user.id)
      .then((data) => {
        if (!cancelled) setTrips(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load trips')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  return (
    <div className="page">
      <div className="statusbar">
        <span>9:41</span>
        <span className="signal" />
      </div>

      <div className="scroll">
        <div className="pad" style={{ paddingTop: 24 }}>
          <h1 className="h1">Your trips</h1>

          {authLoading && <p className="auth-note">Loading…</p>}
          {!authLoading && !user && (
            <>
              <p className="auth-note">Sign in to see your bookings.</p>
              <button
                type="button"
                className="auth-switch"
                onClick={() => navigate('/account', { state: { from: '/trips' } })}
              >
                Go to Account
              </button>
            </>
          )}
          {user && loading && <p className="auth-note">Loading trips…</p>}
          {error && <p className="auth-error">{error}</p>}
          {user && !loading && !error && trips.length === 0 && (
            <p className="auth-note">
              No trips yet. Browse available cars and book your first ride.
            </p>
          )}
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </div>

      <AppBottomNav />
    </div>
  )
}
