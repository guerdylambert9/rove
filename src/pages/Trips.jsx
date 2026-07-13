import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav.jsx'
import TripCard from '../components/TripCard.jsx'
import { fetchRenterTrips } from '../api/trips.js'
import {
  defaultBookingYear,
  getBookingYears,
  groupTripsByMonth,
} from '../lib/groupTripsByMonth.js'
import { useAuth } from '../state/auth.jsx'

export default function Trips() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tripYear, setTripYear] = useState(() => new Date().getFullYear())

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

  const tripYears = useMemo(() => getBookingYears(trips), [trips])

  useEffect(() => {
    if (trips.length === 0) return
    setTripYear((prev) => {
      const years = getBookingYears(trips)
      if (years.includes(prev)) return prev
      return defaultBookingYear(trips)
    })
  }, [trips])

  const tripGroups = groupTripsByMonth(trips, { year: tripYear })
  const yearTripCount = tripGroups.reduce((sum, g) => sum + g.trips.length, 0)

  return (
    <div className="page">
      <div className="statusbar">
        <span>9:41</span>
        <span className="signal" />
      </div>

      <div className="scroll">
        <div className="pad" style={{ paddingTop: 24 }}>
          <div className="trips-head">
            <h1 className="h1">Your trips</h1>
            {user && tripYears.length > 0 && (
              <label className="bookings-year">
                <span className="sr-only">Trip year</span>
                <select
                  className="bookings-year-select"
                  value={tripYear}
                  onChange={(e) => setTripYear(Number(e.target.value))}
                  aria-label="Filter trips by year"
                >
                  {tripYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {authLoading && <p className="auth-note">Loading…</p>}
          {!authLoading && !user && (
            <>
              <p className="auth-note">Sign in to see your trip history.</p>
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
          {user && !loading && !error && trips.length > 0 && yearTripCount === 0 && (
            <p className="auth-note">No trips in {tripYear}.</p>
          )}
          {tripGroups.map((group) => (
            <section key={group.key} className="booking-group">
              <h2 className="booking-month">{group.label}</h2>
              {group.trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </section>
          ))}
        </div>
      </div>

      <AppBottomNav />
    </div>
  )
}
