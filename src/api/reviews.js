import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

function mapReview(row) {
  return {
    id: row.id,
    tripId: row.trip_id,
    vehicleId: row.vehicle_id,
    authorId: row.author_id,
    role: row.role,
    rating: row.rating,
    body: row.body,
    createdAt: row.created_at,
  }
}

export async function fetchVehicleReviews(vehicleId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapReview)
}

export async function fetchTripReviewByAuthor(tripId, authorId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('trip_id', tripId)
    .eq('author_id', authorId)
    .maybeSingle()

  if (error) throw error
  return data ? mapReview(data) : null
}

export async function createReview({
  tripId,
  vehicleId,
  authorId,
  role,
  rating,
  body,
}) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')
  if (!rating || rating < 1 || rating > 5) {
    throw new Error('Choose a rating from 1 to 5')
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert({
      trip_id: tripId,
      vehicle_id: vehicleId,
      author_id: authorId,
      role,
      rating: Number(rating),
      body: body?.trim() || null,
    })
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('You already reviewed this trip')
    }
    throw error
  }
  return mapReview(data)
}

export async function fetchVehicleRatingSummaries(vehicleIds) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')
  if (!vehicleIds?.length) return {}

  const { data, error } = await supabase
    .from('reviews')
    .select('vehicle_id, rating')
    .in('vehicle_id', vehicleIds)
    .eq('role', 'renter')

  if (error) throw error

  const summary = {}
  for (const row of data ?? []) {
    const cur = summary[row.vehicle_id] ?? { sum: 0, count: 0 }
    cur.sum += row.rating
    cur.count += 1
    summary[row.vehicle_id] = cur
  }

  const out = {}
  for (const [id, { sum, count }] of Object.entries(summary)) {
    out[id] = {
      rating: Math.round((sum / count) * 10) / 10,
      reviewCount: count,
    }
  }
  return out
}
