import { useEffect, useState } from 'react'
import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { fetchVehicle } from '../api/vehicles.js'
import { useBooking } from '../state/booking.jsx'
import Icon from '../components/Icon.jsx'

export default function CarDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trip, selectCar } = useBooking()
  const [car, setCar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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

  const subtotal = car.pricePerDay * trip.days
  const serviceFee = 28

  const goToInsurance = () => {
    selectCar(car)
    navigate('/insurance')
  }

  return (
    <div className="page">
      <div className="hero" style={{ background: car.gradient }}>
        <button className="iconbtn back" onClick={() => navigate('/')}>
          <Icon name="back" size={18} />
        </button>
        <div className="hero-title">
          <div className="host">Hosted by {car.host}</div>
          <h1>{car.name}</h1>
        </div>
      </div>

      <div className="scroll">
        <div className="pad">
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
            <div className="datebox">
              <span>Pick-up</span>
              <b>{trip.pickup}</b>
            </div>
            <div className="datebox">
              <span>Return</span>
              <b>{trip.dropoff}</b>
            </div>
          </div>

          <button className="addins" onClick={goToInsurance}>
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
            <b>$300</b>
          </div>
        </div>
      </div>

      <button className="cta sky" onClick={goToInsurance}>
        <span>Continue</span>
        <span>${subtotal + serviceFee} total ›</span>
      </button>
    </div>
  )
}
