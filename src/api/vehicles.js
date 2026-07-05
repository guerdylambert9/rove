import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

function mapVehicle(row) {
  return {
    id: row.id,
    name: row.name,
    year: row.year,
    host: row.host_display_name,
    pricePerDay: Number(row.price_per_day),
    rating: row.rating != null ? Number(row.rating) : null,
    trips: row.trips_count,
    distanceMi: row.distance_mi != null ? Number(row.distance_mi) : null,
    seats: row.seats,
    range: row.range,
    drive: row.drive,
    badge: row.badge,
    gradient: row.gradient,
    status: row.status,
    statusLabel: row.status_label,
    photos: row.photos ?? [],
    available: row.available,
  }
}

export async function fetchVehicles() {
  if (!isSupabaseConfigured) {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('available', true)
    .order('name')

  if (error) throw error
  return data.map(mapVehicle)
}

export async function fetchVehicle(id) {
  if (!isSupabaseConfigured) {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .eq('available', true)
    .maybeSingle()

  if (error) throw error
  return data ? mapVehicle(data) : null
}
