import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchOwnerVehicles } from '../api/vehicles.js'
import { fetchOwnerTrips } from '../api/trips.js'
import { vehicleImageStyle } from '../lib/vehicleImage.js'
import AppBottomNav from '../components/AppBottomNav.jsx'
import TripCard from '../components/TripCard.jsx'
import {
  defaultBookingYear,
  getBookingYears,
  groupTripsByMonth,
} from '../lib/groupTripsByMonth.js'
import { useAuth } from '../state/auth.jsx'

export default function Dashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [cars, setCars] = useState([])
  const [trips, setTrips] = useState([])
  const [loadingFleet, setLoadingFleet] = useState(true)
  const [loadingTrips, setLoadingTrips] = useState(true)
  const [bookingYear, setBookingYear] = useState(() => new Date().getFullYear())

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

    fetchOwnerTrips(user.id)
      .then((data) => {
        if (!cancelled) setTrips(data)
      })
      .finally(() => {
        if (!cancelled) setLoadingTrips(false)
      })

    return () => {
      cancelled = true
    }
  }, [user])

  const bookingYears = useMemo(() => getBookingYears(trips), [trips])

  useEffect(() => {
    if (trips.length === 0) return
    setBookingYear((prev) => {
      const years = getBookingYears(trips)
      if (years.includes(prev)) return prev
      return defaultBookingYear(trips)
    })
  }, [trips])

  const avgRate =
    cars.length > 0
      ? Math.round(cars.reduce((sum, c) => sum + c.pricePerDay, 0) / cars.length)
      : 0

  const activeTrips = trips.filter(
    (t) => !['completed', 'cancelled', 'deposit_released'].includes(t.state),
  )

  const bookingGroups = groupTripsByMonth(trips, { year: bookingYear })
  const yearTripCount = bookingGroups.reduce((sum, g) => sum + g.trips.length, 0)

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
            <div className="vl">{loadingTrips ? '…' : activeTrips.length}</div>
          </div>
          <div className="kpi">
            <div className="lb">Avg / day</div>
            <div className="vl">{avgRate > 0 ? `$${avgRate}` : '—'}</div>
          </div>
        </div>

        <div className="pad" style={{ paddingTop: 4 }}>
          <div className="sectitle bookings-head">
            <span>Bookings</span>
            {bookingYears.length > 0 && (
              <label className="bookings-year">
                <span className="sr-only">Booking year</span>
                <select
                  className="bookings-year-select"
                  value={bookingYear}
                  onChange={(e) => setBookingYear(Number(e.target.value))}
                  aria-label="Filter bookings by year"
                >
                  {bookingYears.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {loadingTrips && <p className="auth-note">Loading bookings…</p>}
          {!loadingTrips && trips.length === 0 && (
            <p className="auth-note">No bookings yet. They’ll appear here when renters book your cars.</p>
          )}
          {!loadingTrips && trips.length > 0 && yearTripCount === 0 && (
            <p className="auth-note">No bookings in {bookingYear}.</p>
          )}
          {bookingGroups.map((group) => (
            <section key={group.key} className="booking-group">
              <h2 className="booking-month">{group.label}</h2>
              {group.trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </section>
          ))}

          <div className="sectitle" style={{ marginTop: 20 }}>
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
            <button
              type="button"
              className="fleetrow fleetrow--clickable"
              key={car.id}
              onClick={() => navigate(`/fleet/${car.id}/edit`)}
            >
              <div className="th" style={vehicleImageStyle(car)} />
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
            </button>
          ))}
        </div>
      </div>

      <AppBottomNav />
    </div>
  )
}
