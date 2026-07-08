import { useRef, useState } from 'react'
import { uploadVehiclePhoto, validateVehiclePhotoFile } from '../api/vehiclePhotos.js'
import { photoBackgroundStyle } from '../lib/vehicleImage.js'
import { VEHICLE_GRADIENTS } from '../api/vehicles.js'

const MAX_PHOTOS = 8

export default function VehiclePhotoInput({
  userId,
  value = [],
  onChange,
  onError,
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [urlDraft, setUrlDraft] = useState('')

  const photos = value.filter(Boolean)

  const addPhoto = (url) => {
    if (!url || photos.includes(url)) return
    if (photos.length >= MAX_PHOTOS) {
      onError?.(`You can add up to ${MAX_PHOTOS} photos.`)
      return
    }
    onChange([...photos, url])
    onError?.('')
  }

  const removePhoto = (index) => {
    onChange(photos.filter((_, i) => i !== index))
  }

  const processFiles = async (files) => {
    const list = Array.from(files).filter((f) => f.type?.startsWith('image/'))
    if (!list.length) return

    if (photos.length + list.length > MAX_PHOTOS) {
      onError?.(`You can add up to ${MAX_PHOTOS} photos total.`)
      return
    }

    setUploading(true)
    onError?.('')

    try {
      const uploaded = []
      for (const file of list) {
        const validationError = validateVehiclePhotoFile(file)
        if (validationError) throw new Error(validationError)
        const publicUrl = await uploadVehiclePhoto(file, userId)
        uploaded.push(publicUrl)
      }
      onChange([...photos, ...uploaded])
    } catch (err) {
      onError?.(err.message || 'Could not upload photos')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files?.length) processFiles(e.target.files)
    e.target.value = ''
  }

  const handlePaste = (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    const imageFiles = []
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) imageFiles.push(file)
      }
    }
    if (imageFiles.length) {
      e.preventDefault()
      processFiles(imageFiles)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files)
  }

  const addUrl = () => {
    const url = urlDraft.trim()
    if (!url) return
    addPhoto(url)
    setUrlDraft('')
  }

  return (
    <div className="photo-input">
      <span className="authfield-label">
        Car photos ({photos.length}/{MAX_PHOTOS})
      </span>

      <div
        className="photo-dropzone"
        tabIndex={0}
        onPaste={handlePaste}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <p className="photo-dropzone-hint">
          Paste, drop, or browse multiple images (⌘V / Ctrl+V)
        </p>

        {photos.length > 0 && (
          <div className="photo-thumbs">
            {photos.map((url, i) => (
              <div key={`${url}-${i}`} className="photo-thumb-wrap">
                <div
                  className="photo-thumb"
                  style={photoBackgroundStyle(url, VEHICLE_GRADIENTS[0])}
                />
                <button
                  type="button"
                  className="photo-thumb-remove"
                  onClick={() => removePhoto(i)}
                  aria-label="Remove photo"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="photo-actions">
          <button
            type="button"
            className="cta outline"
            onClick={() => inputRef.current?.click()}
            disabled={uploading || !userId || photos.length >= MAX_PHOTOS}
          >
            {uploading ? 'Uploading…' : 'Browse images'}
          </button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          hidden
          onChange={handleFileChange}
        />
      </div>

      <div className="photo-url-row">
        <input
          type="url"
          className="photo-url-input"
          value={urlDraft}
          onChange={(e) => setUrlDraft(e.target.value)}
          placeholder="Or paste a photo URL"
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addUrl())}
        />
        <button
          type="button"
          className="cta outline"
          onClick={addUrl}
          disabled={!urlDraft.trim() || photos.length >= MAX_PHOTOS}
        >
          Add URL
        </button>
      </div>
    </div>
  )
}
