import { useEffect, useState } from 'react'
import { fetchVehicles } from '../api/vehicles.js'
import CarCard from '../components/CarCard.jsx'
import AppBottomNav from '../components/AppBottomNav.jsx'
import Icon from '../components/Icon.jsx'

export default function Browse() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    fetchVehicles()
      .then((data) => {
        if (!cancelled) setCars(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.message === 'SUPABASE_NOT_CONFIGURED'
              ? 'Backend not configured. See .env.example.'
              : err.message || 'Could not load vehicles',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="page">
      <div className="statusbar">
        <span>9:41</span>
        <span className="signal" />
      </div>

      <div className="scroll">
        <div className="pad">
          <div className="greet">
            <span>West Palm Beach, FL</span>
            Find your ride
          </div>

          <div className="searchbar">
            <Icon name="search" size={16} />
            <input placeholder="Dates, car, or make…" />
          </div>

          <div className="sectitle">
            Available now <a>Map</a>
          </div>

          {loading && <p className="auth-note">Loading fleet…</p>}
          {error && <p className="auth-error">{error}</p>}
          {!loading && !error && cars.length === 0 && (
            <p className="auth-note">No vehicles available right now.</p>
          )}
          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </div>

      <AppBottomNav />
    </div>
  )
}
