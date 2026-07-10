import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import CarPhotoCollage from './CarPhotoCollage.jsx'
import ImageLightbox from './ImageLightbox.jsx'
import { isVehicleBooked, vehicleBookedLabel } from '../lib/vehicleAvailability.js'

export default function CarCard({ car }) {
  const navigate = useNavigate()
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const photos = car.photos?.filter(Boolean) ?? []
  const booked = isVehicleBooked(car)
  const bookedLabel = vehicleBookedLabel(car)

  const openLightbox = (index) => {
    if (booked) return
    if (photos.length === 0) {
      navigate(`/car/${car.id}`)
      return
    }
    setLightboxIndex(index)
  }

  const openDetail = () => {
    if (booked) return
    navigate(`/car/${car.id}`)
  }

  const badge = booked ? (
    <span className="badge badge--booked">{bookedLabel}</span>
  ) : (
    <span className="badge">{car.badge}</span>
  )

  return (
    <>
      <article
        className={`carcard ${booked ? 'carcard--booked' : ''}`}
        aria-disabled={booked || undefined}
      >
        <CarPhotoCollage
          car={car}
          badge={badge}
          onImageClick={booked ? undefined : openLightbox}
          disabled={booked}
        />
        {booked ? (
          <div className="carmeta carmeta--disabled">
            <div className="nm">
              {car.name} · {car.year}
            </div>
            <div className="rw">
              <span className="loc booked-label">{bookedLabel}</span>
              <span className="price price--muted">
                ${car.pricePerDay}
                <small>/day</small>
              </span>
            </div>
          </div>
        ) : (
          <button type="button" className="carmeta" onClick={openDetail}>
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
          </button>
        )}
      </article>

      {lightboxIndex !== null && photos.length > 0 && (
        <ImageLightbox
          photos={photos}
          index={lightboxIndex}
          title={car.name}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  )
}
