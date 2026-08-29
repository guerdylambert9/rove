import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

const BUCKET = 'coverage-proofs'
const MAX_BYTES = 10 * 1024 * 1024

function extensionFor(file) {
  const fromName = file.name?.split('.').pop()?.toLowerCase()
  if (fromName && ['jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf'].includes(fromName)) {
    return fromName === 'jpeg' ? 'jpg' : fromName
  }
  if (file.type === 'application/pdf') return 'pdf'
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  }
  return map[file.type] || 'jpg'
}

export function validateCoverageProofFile(file) {
  if (!file) return 'Choose a file to upload.'
  const ok =
    file.type?.startsWith('image/') || file.type === 'application/pdf'
  if (!ok) return 'Upload an image or PDF of your insurance card.'
  if (file.size > MAX_BYTES) return 'File must be 10 MB or smaller.'
  return null
}

export async function uploadCoverageProof(file, userId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')
  if (!userId) throw new Error('You must be signed in to upload proof')

  const validationError = validateCoverageProofFile(file)
  if (validationError) throw new Error(validationError)

  const ext = extensionFor(file)
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    })

  if (error) {
    const msg = error.message?.toLowerCase() ?? ''
    if (msg.includes('bucket not found')) {
      throw new Error(
        'Coverage proof storage is not set up. Run migration 017_phase4_finish.sql in Supabase.',
      )
    }
    throw error
  }

  return data.path
}

export async function getCoverageProofUrl(path) {
  if (!isSupabaseConfigured || !path) return null
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}
