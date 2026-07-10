import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { fetchVehicle } from '../api/vehicles.js'
import { useBooking } from '../state/useBooking.js'
import { todayISODate, toISODate } from '../lib/tripDates.js'
import { computePriceBreakdown } from '../lib/tripPricing.js'
import { bypassInsuranceGate, DEV_COVERAGE_STUB } from '../lib/bookingFlags.js'
import DevBookingBanner from '../components/DevBookingBanner.jsx'
import { photoBackgroundStyle, vehicleImageStyle } from '../lib/vehicleImage.js'
import ImageLightbox from '../components/ImageLightbox.jsx'
import Icon from '../components/Icon.jsx'

export default function CarDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trip, selectCar, setDates, setCoverage } = useBooking()
  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetchVehicle(id)
      .then((data) => {
        if (!cancelled) setCar(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err.message === 'SUPABASE_NOT_CONFIGURED'
              ? 'Backend not configured. See .env.example.'
              : err.message || 'Could not load vehicle',
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [id])

  if (loading) {
    return (
      <div className="page">
        <div className="pad" style={{ paddingTop: 24 }}>
          <p className="auth-note">Loading…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page">
        <div className="pad" style={{ paddingTop: 24 }}>
          <p className="auth-error">{error}</p>
          <button className="auth-switch" onClick={() => navigate('/')}>
            Back to browse
          </button>
        </div>
      </div>
    )
  }

  if (!car) return <Navigate to="/" replace />

  const photos = car.photos?.filter(Boolean) ?? []
  const breakdown = computePriceBreakdown(car, trip)
  const { subtotal, serviceFee, deposit } = breakdown
  const minReturn = trip.pickupDate

  const handlePickupChange = (pickupDate) => {
    if (!pickupDate) return
    let returnDate = trip.returnDate
    if (returnDate < pickupDate) {
      const adjusted = new Date(`${pickupDate}T12:00:00`)
      adjusted.setDate(adjusted.getDate() + (trip.days - 1))
      returnDate = toISODate(adjusted)
    }
    setDates(pickupDate, returnDate)
  }

  const handleReturnChange = (returnDate) => {
    if (!returnDate || returnDate < trip.pickupDate) return
    setDates(trip.pickupDate, returnDate)
  }

  const continueBooking = () => {
    selectCar(car)
    if (bypassInsuranceGate) {
      setCoverage(DEV_COVERAGE_STUB)
      navigate('/checkout')
      return
    }
    navigate('/insurance')
  }

  return (
    <div className="page">
      <div
        className="hero hero-clickable"
        style={vehicleImageStyle(car)}
        onClick={() => photos.length && setLightboxIndex(0)}
        onKeyDown={(e) => e.key === 'Enter' && photos.length && setLightboxIndex(0)}
        role={photos.length ? 'button' : undefined}
        tabIndex={photos.length ? 0 : undefined}
      >
        <button
          type="button"
          className="iconbtn back"
          onClick={(e) => {
            e.stopPropagation()
            navigate('/')
          }}
        >
          <Icon name="back" size={18} />
        </button>
        <div className="hero-title">
          <div className="host">Hosted by {car.host}</div>
          <h1>{car.name}</h1>
        </div>
      </div>

      {photos.length > 1 && (
        <div className="photo-strip">
          {photos.map((url, i) => (
            <button
              key={`${url}-${i}`}
              type="button"
              className="photo-strip-item"
              style={photoBackgroundStyle(url, car.gradient)}
              onClick={() => setLightboxIndex(i)}
              aria-label={`View photo ${i + 1}`}
            />
          ))}
        </div>
      )}

      <div className="scroll">
        <div className="pad">
          <DevBookingBanner />
          <div className="specs">
            <div className="spec">
              <span>Seats</span>
              <b>{car.seats}</b>
            </div>
            <div className="spec">
              <span>Range</span>
              <b>{car.range}</b>
            </div>
            <div className="spec">
              <span>Drive</span>
              <b>{car.drive}</b>
            </div>
          </div>

          <div className="daterow">
            <label className="datebox datebox--editable">
              <span>Pick-up</span>
              <input
                type="date"
                className="datebox-input"
                value={trip.pickupDate}
                min={todayISODate()}
                onChange={(e) => handlePickupChange(e.target.value)}
                aria-label="Pick-up date"
              />
            </label>
            <label className="datebox datebox--editable">
              <span>Return</span>
              <input
                type="date"
                className="datebox-input"
                value={trip.returnDate}
                min={minReturn}
                onChange={(e) => handleReturnChange(e.target.value)}
                aria-label="Return date"
              />
            </label>
          </div>

          <button className="addins" onClick={continueBooking}>
            <span className="lft">
              <span className="sh">
                <Icon name="shield" size={16} />
              </span>
              <span className="t">
                Insurance
                <small>Choose before you book</small>
              </span>
            </span>
            <Icon name="chevron" size={16} />
          </button>

          <div className="rowline">
            <span>
              ${car.pricePerDay} × {trip.days} days
            </span>
            <b>${subtotal}</b>
          </div>
          <div className="rowline">
            <span>Service fee</span>
            <b>${serviceFee}</b>
          </div>
          <div className="rowline">
            <span>Refundable deposit</span>
            <b>${deposit}</b>
          </div>
        </div>
      </div>

      <button className="cta sky" onClick={continueBooking}>
        <span>Continue</span>
        <span>${subtotal + serviceFee} total ›</span>
      </button>

      {lightboxIndex !== null && photos.length > 0 && (
        <ImageLightbox
          photos={photos}
          index={lightboxIndex}
          title={car.name}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  )
}
