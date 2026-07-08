import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { vehicleImageStyle } from '../lib/vehicleImage.js'
import AppBottomNav from '../components/AppBottomNav.jsx'
import { fetchOwnerVehicles } from '../api/vehicles.js'
import { useAuth } from '../state/auth.jsx'

export default function Fleet() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return

    let cancelled = false
    fetchOwnerVehicles(user.id)
      .then((data) => {
        if (!cancelled) setCars(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load fleet')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <div className="page">
      <div className="statusbar">
        <span>9:41</span>
        <span className="signal" />
      </div>

      <div className="scroll">
        <div className="pad" style={{ paddingTop: 24 }}>
          <div className="sectitle" style={{ marginBottom: 16 }}>
            Your fleet
            <button type="button" className="linkbtn" onClick={() => navigate('/fleet/add')}>
              + Add car
            </button>
          </div>

          {loading && <p className="auth-note">Loading fleet…</p>}
          {error && <p className="auth-error">{error}</p>}
          {!loading && !error && cars.length === 0 && (
            <p className="auth-note">
              No cars listed yet.{' '}
              <button type="button" className="auth-switch" onClick={() => navigate('/fleet/add')}>
                Add your first car
              </button>
            </p>
          )}

          {cars.map((car) => (
            <div className="fleetrow" key={car.id}>
              <div className="th" style={vehicleImageStyle(car)} />
              <div>
                <div className="nm">{car.name}</div>
                <div className={`st ${car.status}`}>
                  <span className="dot" />
                  {car.statusLabel || (car.status === 'idle' ? 'Idle' : 'Rented')}
                </div>
              </div>
              <div className="ern">
                <b>${car.pricePerDay}</b>
                <span>/day</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AppBottomNav />
    </div>
  )
}
