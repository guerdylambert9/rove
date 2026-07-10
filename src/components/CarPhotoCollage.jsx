import { photoBackgroundStyle } from '../lib/vehicleImage.js'

const MAX_COLLAGE = 3

function CollageShell({ as: Tag = 'button', disabled, className, style, onClick, ariaLabel, children }) {
  if (disabled) {
    return (
      <div className={className} style={style} aria-hidden="true">
        {children}
      </div>
    )
  }

  return (
    <Tag
      type={Tag === 'button' ? 'button' : undefined}
      className={className}
      style={style}
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </Tag>
  )
}

export default function CarPhotoCollage({ car, badge, onImageClick, disabled = false }) {
  const photos = car.photos?.filter(Boolean) ?? []
  const extra = Math.max(0, photos.length - MAX_COLLAGE)

  if (photos.length === 0) {
    return (
      <CollageShell
        disabled={disabled}
        className="carcollage carcollage-single"
        style={photoBackgroundStyle(null, car.gradient)}
        onClick={() => onImageClick?.(0)}
        ariaLabel={`View ${car.name} photos`}
      >
        {badge}
      </CollageShell>
    )
  }

  if (photos.length === 1) {
    return (
      <CollageShell
        disabled={disabled}
        className="carcollage carcollage-single"
        style={photoBackgroundStyle(photos[0], car.gradient)}
        onClick={() => onImageClick?.(0)}
        ariaLabel={`View ${car.name} photo`}
      >
        {badge}
      </CollageShell>
    )
  }

  const cells = photos.slice(0, MAX_COLLAGE)
  const layoutClass =
    photos.length === 2 ? 'carcollage-two' : 'carcollage-three'

  return (
    <div className={`carcollage ${layoutClass}`}>
      {cells.map((url, i) => (
        <CollageShell
          key={`${url}-${i}`}
          disabled={disabled}
          className={`carcollage-cell cell-${i}`}
          style={photoBackgroundStyle(url, car.gradient)}
          onClick={() => onImageClick?.(i)}
          ariaLabel={`View ${car.name} photo ${i + 1}`}
        >
          {i === MAX_COLLAGE - 1 && extra > 0 && (
            <span className="carcollage-more">+{extra}</span>
          )}
        </CollageShell>
      ))}
      <div className="carcollage-badge">{badge}</div>
    </div>
  )
}
