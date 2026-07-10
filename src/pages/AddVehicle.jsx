import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBottomNav from '../components/AppBottomNav.jsx'
import {
  createVehicle,
  slugifyVehicleId,
  VEHICLE_GRADIENTS,
} from '../api/vehicles.js'
import { SAMPLE_VEHICLES } from '../data/sampleVehicles.js'
import VehiclePhotoInput from '../components/VehiclePhotoInput.jsx'
import ComboField from '../components/ComboField.jsx'
import { DRIVE_OPTIONS, BADGE_OPTIONS } from '../data/vehicleFieldOptions.js'
import { useAuth } from '../state/auth.jsx'

export default function AddVehicle() {
  const navigate = useNavigate()
  const { user, profile } = useAuth()
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
  const [submitting, setSubmitting] = useState(false)

  const applySample = (e) => {
    const sample = SAMPLE_VEHICLES.find((s) => s.label === e.target.value)
    if (!sample) return
    setName(sample.name)
    setYear(sample.year)
    setPricePerDay(String(sample.pricePerDay))
    setSeats(sample.seats)
    setRange(sample.range)
    setDrive(sample.drive)
    setDistanceMi(String(sample.distanceMi))
    setBadge(sample.badge)
    setPhotos(sample.photoUrl ? [sample.photoUrl] : [])
  }

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

      const gradient =
        VEHICLE_GRADIENTS[Math.floor(Math.random() * VEHICLE_GRADIENTS.length)]

      await createVehicle({
        id: slugifyVehicleId(name),
        ownerId: user.id,
        hostDisplayName: profile?.name || 'Host',
        name: name.trim(),
        year: Number(year),
        pricePerDay: price,
        seats: Number(seats),
        range: range.trim(),
        drive: drive.trim() || 'Auto',
        distanceMi: distanceMi ? Number(distanceMi) : null,
        badge: badge.trim() || 'Instant book',
        photos,
        gradient,
      })

      navigate('/fleet')
    } catch (err) {
      setError(err.message || 'Could not add vehicle')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="scroll">
        <div className="pad pad--form" style={{ paddingTop: 24 }}>
          <button type="button" className="auth-switch" onClick={() => navigate('/fleet')}>
            ← Back to fleet
          </button>

          <h1 className="h1" style={{ marginTop: 12 }}>
            Add a car
          </h1>
          <p className="auth-note">
            List a vehicle for rent. It will appear on Browse once saved.
          </p>

          <label className="authfield">
            <span>Fill from sample (optional)</span>
            <select className="selectfield" defaultValue="" onChange={applySample}>
              <option value="" disabled>
                Choose a sample car…
              </option>
              {SAMPLE_VEHICLES.map((sample) => (
                <option key={sample.label} value={sample.label}>
                  {sample.label}
                </option>
              ))}
            </select>
          </label>

          <form className="authform" onSubmit={handleSubmit}>
            <label className="authfield">
              <span>Car name</span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tesla Model 3"
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
                placeholder="64"
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
                placeholder="272 mi"
                required
              />
            </label>

            <ComboField
              label="Drive"
              value={drive}
              onChange={setDrive}
              options={DRIVE_OPTIONS}
              placeholder="Auto"
            />

            <label className="authfield">
              <span>Distance from renter (mi)</span>
              <input
                type="number"
                value={distanceMi}
                onChange={(e) => setDistanceMi(e.target.value)}
                placeholder="5"
                min={0}
                step="0.1"
              />
            </label>

            <ComboField
              label="Badge label"
              value={badge}
              onChange={setBadge}
              options={BADGE_OPTIONS}
              placeholder="Instant book"
            />

            <VehiclePhotoInput
              userId={user?.id}
              value={photos}
              onChange={setPhotos}
              onError={setPhotoError}
            />

            {photoError && <p className="auth-error">{photoError}</p>}

            {error && <p className="auth-error">{error}</p>}

            <button className="cta sky" type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Add to fleet'}
            </button>
          </form>
        </div>
      </div>

      <AppBottomNav />
    </div>
  )
}
