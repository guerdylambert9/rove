import { useParams, useNavigate, Navigate } from 'react-router-dom'
import { getCar } from '../data/cars.js'
import { useBooking } from '../state/booking.jsx'
import Icon from '../components/Icon.jsx'

export default function CarDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { trip, selectCar } = useBooking()
  const car = getCar(id)

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
