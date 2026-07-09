import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav.jsx'
import { fetchOwnerVehicle, updateVehicle } from '../api/vehicles.js'
import VehiclePhotoInput from '../components/VehiclePhotoInput.jsx'
import { useAuth } from '../state/auth.jsx'

export default function EditVehicle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [pricePerDay, setPricePerDay] = useState('')
  const [seats, setSeats] = useState(5)
  const [range, setRange] = useState('')
  const [drive, setDrive] = useState('Auto')
  const [distanceMi, setDistanceMi] = useState('')
  const [badge, setBadge] = useState('Instant book')
  const [photos, setPhotos] = useState([])
  const [photoError, setPhotoError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!user || !id) return

    let cancelled = false
    fetchOwnerVehicle(id, user.id)
      .then((car) => {
        if (cancelled) return
        if (!car) {
          setError('Vehicle not found')
          return
        }
        setName(car.name)
        setYear(car.year)
        setPricePerDay(String(car.pricePerDay))
        setSeats(car.seats)
        setRange(car.range)
        setDrive(car.drive || 'Auto')
        setDistanceMi(car.distanceMi != null ? String(car.distanceMi) : '')
        setBadge(car.badge || 'Instant book')
        setPhotos(car.photos ?? [])
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || 'Could not load vehicle')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [user, id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const price = Number(pricePerDay)
      if (!name.trim()) throw new Error('Car name is required')
      if (!price || price <= 0) throw new Error('Enter a valid daily price')
      if (!range.trim()) throw new Error('Range is required (e.g. 300 mi)')
      if (!user) throw new Error('You must be signed in')

      await updateVehicle(id, user.id, {
        name: name.trim(),
        year: Number(year),
        pricePerDay: price,
        seats: Number(seats),
        range: range.trim(),
        drive: drive.trim() || 'Auto',
        distanceMi: distanceMi ? Number(distanceMi) : null,
        badge: badge.trim() || 'Instant book',
        photos,
      })

      navigate('/fleet')
    } catch (err) {
      setError(err.message || 'Could not save changes')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="page">
        <div className="scroll">
          <div className="pad" style={{ paddingTop: 24 }}>
            <p className="auth-note">Loading vehicle…</p>
          </div>
        </div>
        <AppBottomNav />
      </div>
    )
  }

  if (error && !name) {
    return (
      <div className="page">
        <div className="scroll">
          <div className="pad" style={{ paddingTop: 24 }}>
            <p className="auth-error">{error}</p>
            <button type="button" className="auth-switch" onClick={() => navigate('/fleet')}>
              ← Back to fleet
            </button>
          </div>
        </div>
        <AppBottomNav />
      </div>
    )
  }

  return (
    <div className="page">
      <div className="scroll">
        <div className="pad" style={{ paddingTop: 24 }}>
          <button type="button" className="auth-switch" onClick={() => navigate('/fleet')}>
            ← Back to fleet
          </button>

          <h1 className="h1" style={{ marginTop: 12 }}>
            Edit car
          </h1>
          <p className="auth-note">Update listing details, price, or photos.</p>

          <form className="authform" onSubmit={handleSubmit}>
            <label className="authfield">
              <span>Car name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </label>

            <label className="authfield">
              <span>Year</span>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                min={1990}
                max={2030}
                required
              />
            </label>

            <label className="authfield">
              <span>Price per day ($)</span>
              <input
                type="number"
                value={pricePerDay}
                onChange={(e) => setPricePerDay(e.target.value)}
                min={1}
                step="1"
                required
              />
            </label>

            <label className="authfield">
              <span>Seats</span>
              <input
                type="number"
                value={seats}
                onChange={(e) => setSeats(e.target.value)}
                min={2}
                max={9}
                required
              />
            </label>

            <label className="authfield">
              <span>Range</span>
              <input
                type="text"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                required
              />
            </label>

            <label className="authfield">
              <span>Drive</span>
              <input
                type="text"
                value={drive}
                onChange={(e) => setDrive(e.target.value)}
              />
            </label>

            <label className="authfield">
              <span>Distance from renter (mi)</span>
              <input
                type="number"
                value={distanceMi}
                onChange={(e) => setDistanceMi(e.target.value)}
                min={0}
                step="0.1"
              />
            </label>

            <label className="authfield">
              <span>Badge label</span>
              <input
                type="text"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
              />
            </label>

            <VehiclePhotoInput
              userId={user?.id}
              value={photos}
              onChange={setPhotos}
              onError={setPhotoError}
            />

            {photoError && <p className="auth-error">{photoError}</p>}
            {error && <p className="auth-error">{error}</p>}

            <button className="cta sky" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>
      </div>

      <AppBottomNav />
    </div>
  )
}
