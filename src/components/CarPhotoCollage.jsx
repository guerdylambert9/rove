import { photoBackgroundStyle } from '../lib/vehicleImage.js'

const MAX_COLLAGE = 3

export default function CarPhotoCollage({ car, badge, onImageClick }) {
  const photos = car.photos?.filter(Boolean) ?? []
  const extra = Math.max(0, photos.length - MAX_COLLAGE)

  if (photos.length === 0) {
    return (
      <button
        type="button"
        className="carcollage carcollage-single"
        style={photoBackgroundStyle(null, car.gradient)}
        onClick={() => onImageClick?.(0)}
        aria-label={`View ${car.name} photos`}
      >
        {badge}
      </button>
    )
  }

  if (photos.length === 1) {
    return (
      <button
        type="button"
        className="carcollage carcollage-single"
        style={photoBackgroundStyle(photos[0], car.gradient)}
        onClick={() => onImageClick(0)}
        aria-label={`View ${car.name} photo`}
      >
        {badge}
      </button>
    )
  }

  const cells = photos.slice(0, MAX_COLLAGE)
  const layoutClass =
    photos.length === 2 ? 'carcollage-two' : 'carcollage-three'

  return (
    <div className={`carcollage ${layoutClass}`}>
      {cells.map((url, i) => (
        <button
          key={`${url}-${i}`}
          type="button"
          className={`carcollage-cell cell-${i}`}
          style={photoBackgroundStyle(url, car.gradient)}
          onClick={() => onImageClick(i)}
          aria-label={`View ${car.name} photo ${i + 1}`}
        >
          {i === MAX_COLLAGE - 1 && extra > 0 && (
            <span className="carcollage-more">+{extra}</span>
          )}
        </button>
      ))}
      <div className="carcollage-badge">{badge}</div>
    </div>
  )
}
