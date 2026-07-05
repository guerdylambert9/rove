import { cars } from '../data/cars.js'
import CarCard from '../components/CarCard.jsx'
import BottomNav from '../components/BottomNav.jsx'
import Icon from '../components/Icon.jsx'

export default function Browse() {
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
            <input placeholder="Dates, car, or make…" />
          </div>

          <div className="sectitle">
            Available now <a>Map</a>
          </div>

          {cars.map((car) => (
            <CarCard key={car.id} car={car} />
          ))}
        </div>
      </div>

      <BottomNav variant="renter" />
    </div>
  )
}
