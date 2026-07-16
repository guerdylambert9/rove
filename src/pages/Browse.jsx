import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchVehicles } from '../api/vehicles.js'
import { fetchVehicleBlocks, rangeOverlapsBlocks } from '../api/availability.js'
import CarCard from '../components/CarCard.jsx'
import AppBottomNav from '../components/AppBottomNav.jsx'
import Icon from '../components/Icon.jsx'
import { todayISODate } from '../lib/tripDates.js'

function vehicleMatchesQuery(car, query) {
  if (!query.trim()) return true
  const q = query.trim().toLowerCase()
  return [car.name, car.year, car.host, car.drive, car.badge]
    .filter(Boolean)
    .some((v) => String(v).toLowerCase().includes(q))
}

export default function Browse() {
  const navigate = useNavigate()
  const [cars, setCars] = useState([])
  const [blocksByVehicle, setBlocksByVehicle] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [pickupDate, setPickupDate] = useState('')
  const [returnDate, setReturnDate] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [view, setView] = useState('list')

  useEffect(() => {
    let cancelled = false

    fetchVehicles()
      .then(async (data) => {
        if (cancelled) return
        setCars(data)
        const entries = await Promise.all(
          data.map(async (car) => {
            try {
              const blocks = await fetchVehicleBlocks(car.id)
              return [car.id, blocks]
            } catch {
              return [car.id, []]
            }
          }),
        )
        if (!cancelled) setBlocksByVehicle(Object.fromEntries(entries))
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

  const filtered = useMemo(() => {
    const start = pickupDate || null
    const end = returnDate || pickupDate || null

    return cars
      .filter((car) => vehicleMatchesQuery(car, query))
      .filter((car) => {
        if (!maxPrice) return true
        return car.pricePerDay <= Number(maxPrice)
      })
      .filter((car) => {
        if (!start || !end) return true
        if (rangeOverlapsBlocks(start, end, blocksByVehicle[car.id] ?? [])) {
          return false
        }
        // Hide cars rented overlapping the filter window (active today / booked)
        if (car.activeReturnDate && start <= car.activeReturnDate && end >= todayISODate()) {
          return car.status !== 'rented'
        }
        return true
      })
      .sort((a, b) => {
        if (view === 'map') {
          return (a.distanceMi ?? 99) - (b.distanceMi ?? 99)
        }
        if (a.status !== b.status) return a.status === 'idle' ? -1 : 1
        return a.name.localeCompare(b.name)
      })
  }, [cars, query, pickupDate, returnDate, maxPrice, blocksByVehicle, view])

  const mapCars = filtered.filter((c) => c.lat != null && c.lng != null)
  const centerLat =
    mapCars.reduce((s, c) => s + c.lat, 0) / (mapCars.length || 1) || 26.7153
  const centerLng =
    mapCars.reduce((s, c) => s + c.lng, 0) / (mapCars.length || 1) || -80.0534

  const osmEmbed = `https://www.openstreetmap.org/export/embed.html?bbox=${
    centerLng - 0.08
  }%2C${centerLat - 0.06}%2C${centerLng + 0.08}%2C${centerLat + 0.06}&layer=mapnik&marker=${centerLat}%2C${centerLng}`

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
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search make, model, host…"
              aria-label="Search vehicles"
            />
          </div>

          <div className="browse-filters">
            <label>
              <span>Pickup</span>
              <input
                type="date"
                value={pickupDate}
                min={todayISODate()}
                onChange={(e) => {
                  const v = e.target.value
                  setPickupDate(v)
                  if (returnDate && returnDate < v) setReturnDate(v)
                }}
              />
            </label>
            <label>
              <span>Return</span>
              <input
                type="date"
                value={returnDate}
                min={pickupDate || todayISODate()}
                onChange={(e) => setReturnDate(e.target.value)}
              />
            </label>
            <label>
              <span>Max $/day</span>
              <input
                type="number"
                min={1}
                placeholder="Any"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </label>
          </div>

          <div className="sectitle">
            <span>
              {loading
                ? 'Available now'
                : `${filtered.length} car${filtered.length === 1 ? '' : 's'}`}
            </span>
            <div className="browse-view-toggle" role="group" aria-label="View mode">
              <button
                type="button"
                className={view === 'list' ? 'on' : ''}
                onClick={() => setView('list')}
              >
                List
              </button>
              <button
                type="button"
                className={view === 'map' ? 'on' : ''}
                onClick={() => setView('map')}
              >
                Map
              </button>
            </div>
          </div>

          {loading && <p className="auth-note">Loading fleet…</p>}
          {error && <p className="auth-error">{error}</p>}
          {!loading && !error && filtered.length === 0 && (
            <p className="auth-note">No vehicles match those filters.</p>
          )}

          {view === 'map' && !loading && filtered.length > 0 && (
            <div className="browse-map">
              <iframe
                title="Fleet map — West Palm Beach"
                src={osmEmbed}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <ul className="browse-map-list">
                {filtered.map((car) => (
                  <li key={car.id}>
                    <button
                      type="button"
                      className="browse-map-pin"
                      disabled={car.status === 'rented'}
                      onClick={() => {
                        if (car.status === 'rented') return
                        navigate(`/car/${car.id}`)
                      }}
                    >
                      <span className="nm">
                        {car.name}
                        {car.rating != null ? ` · ★ ${car.rating}` : ''}
                      </span>
                      <span className="sm">
                        {car.distanceMi != null ? `${car.distanceMi} mi` : 'WPB'} · $
                        {car.pricePerDay}/day
                        {car.status === 'rented' ? ' · Booked' : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {view === 'list' &&
            filtered.map((car) => <CarCard key={car.id} car={car} />)}
        </div>
      </div>

      <AppBottomNav />
    </div>
  )
}
