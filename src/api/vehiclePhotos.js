import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const BUCKET = 'vehicle-photos'
const MAX_BYTES = 5 * 1024 * 1024

function extensionFor(file) {
  const fromName = file.name?.split('.').pop()?.toLowerCase()
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName
  }
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return map[file.type] || 'jpg'
}

export function validateVehiclePhotoFile(file) {
  if (!file?.type?.startsWith('image/')) {
    return 'Please choose an image file (JPEG, PNG, WebP, or GIF).'
  }
  if (file.size > MAX_BYTES) {
    return 'Image must be 5 MB or smaller.'
  }
  return null
}

export async function uploadVehiclePhoto(file, userId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')
  if (!userId) throw new Error('You must be signed in to upload photos')

  const validationError = validateVehiclePhotoFile(file)
  if (validationError) throw new Error(validationError)

  const ext = extensionFor(file)
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('bucket not found')) {
      throw new Error(
        'Photo storage is not set up. Run supabase/migrations/004_vehicle_photos_storage.sql in the Supabase SQL Editor, then try again.',
      )
    }
    throw error
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path)
  return urlData.publicUrl
}
