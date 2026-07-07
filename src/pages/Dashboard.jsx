import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOwnerVehicles } from '../api/vehicles.js'
import AppBottomNav from '../components/AppBottomNav.jsx'
import { useAuth } from '../state/auth.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [cars, setCars] = useState([])
  const [loadingFleet, setLoadingFleet] = useState(true)

  useEffect(() => {
    if (!user) return

    let cancelled = false
    fetchOwnerVehicles(user.id)
      .then((data) => {
        if (!cancelled) setCars(data)
      })
      .finally(() => {
        if (!cancelled) setLoadingFleet(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const avgRate =
    cars.length > 0
      ? Math.round(cars.reduce((sum, c) => sum + c.pricePerDay, 0) / cars.length)
      : 0

  return (
    <div className="page">
      <div className="statusbar">
        <span>9:41</span>
        <span className="signal" />
      </div>

      <div className="scroll">
        <div className="dashhead">
          <h1>July at a glance</h1>
        </div>

        <div className="kpis">
          <div className="kpi dark">
            <div className="lb">Net this month</div>
            <div className="vl">$0</div>
            <div className="dl">Live data in Phase 7</div>
          </div>
          <div className="kpi">
            <div className="lb">Utilization</div>
            <div className="vl">—</div>
          </div>
          <div className="kpi">
            <div className="lb">Trips</div>
            <div className="vl">0</div>
          </div>
          <div className="kpi">
            <div className="lb">Avg / day</div>
            <div className="vl">{avgRate > 0 ? `$${avgRate}` : '—'}</div>
          </div>
        </div>

        <div className="pad" style={{ paddingTop: 4 }}>
          <div className="sectitle">
            Fleet{' '}
            <button type="button" className="linkbtn" onClick={() => navigate('/fleet')}>
              Manage
            </button>
          </div>

          {loadingFleet && <p className="auth-note">Loading fleet…</p>}
          {!loadingFleet && cars.length === 0 && (
            <p className="auth-note">
              No cars yet.{' '}
              <button type="button" className="auth-switch" onClick={() => navigate('/fleet/add')}>
                Add a car
              </button>
            </p>
          )}

          {cars.map((car) => (
            <div className="fleetrow" key={car.id}>
              <div className="th" style={{ background: car.gradient }} />
              <div>
                <div className="nm">{car.name}</div>
                <div className={`st ${car.status}`}>
                  <span className="dot" />
                  {car.statusLabel || (car.status === 'idle' ? 'Idle · open now' : 'Rented')}
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
