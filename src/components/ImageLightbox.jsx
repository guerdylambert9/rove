import { useEffect, useState } from 'react'

export default function ImageLightbox({ photos, index, title, onClose }) {
  const [current, setCurrent] = useState(index)

  useEffect(() => {
    setCurrent(index)
  }, [index])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setCurrent((i) => Math.max(0, i - 1))
      if (e.key === 'ArrowRight') setCurrent((i) => Math.min(photos.length - 1, i + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photos.length, onClose])

  if (!photos.length) return null

  const photo = photos[current]

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={title || 'Photo'}>
      <button className="lightbox-backdrop" type="button" onClick={onClose} aria-label="Close" />
      <div className="lightbox-panel">
        <div className="lightbox-toolbar">
          {title && <span className="lightbox-title">{title}</span>}
          {photos.length > 1 && (
            <span className="lightbox-count">
              {current + 1} / {photos.length}
            </span>
          )}
          <button className="lightbox-close" type="button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <img className="lightbox-img" src={photo} alt={title || `Photo ${current + 1}`} />

        {photos.length > 1 && (
          <div className="lightbox-nav">
            <button
              type="button"
              className="lightbox-arrow"
              disabled={current === 0}
              onClick={() => setCurrent((i) => i - 1)}
            >
              ‹
            </button>
            <button
              type="button"
              className="lightbox-arrow"
              disabled={current === photos.length - 1}
              onClick={() => setCurrent((i) => i + 1)}
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
