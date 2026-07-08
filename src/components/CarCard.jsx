import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Icon from './Icon.jsx'
import CarPhotoCollage from './CarPhotoCollage.jsx'
import ImageLightbox from './ImageLightbox.jsx'

export default function CarCard({ car }) {
  const navigate = useNavigate()
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const photos = car.photos?.filter(Boolean) ?? []

  const openLightbox = (index) => {
    if (photos.length === 0) {
      navigate(`/car/${car.id}`)
      return
    }
    setLightboxIndex(index)
  }

  return (
    <>
      <article className="carcard">
        <CarPhotoCollage
          car={car}
          badge={<span className="badge">{car.badge}</span>}
          onImageClick={openLightbox}
        />
        <button type="button" className="carmeta" onClick={() => navigate(`/car/${car.id}`)}>
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
