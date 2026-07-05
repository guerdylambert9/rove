import { useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'

export default function CarCard({ car }) {
  const navigate = useNavigate()
  return (
    <button className="carcard" onClick={() => navigate(`/car/${car.id}`)}>
      <div className="carimg" style={{ background: car.gradient }}>
        <span className="badge">{car.badge}</span>
      </div>
      <div className="carmeta">
        <div className="nm">
          {car.name} · {car.year}
        </div>
        <div className="rw">
          <span className="loc">
            <Icon name="pin" size={12} /> {car.distanceMi} mi away
          </span>
          <span className="price">
            ${car.pricePerDay}
            <small>/day</small>
          </span>
        </div>
      </div>
    </button>
  )
}
