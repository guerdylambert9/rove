import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { ownerRentedLabel } from '../lib/vehicleAvailability.js'
import { todayISODate } from '../lib/tripDates.js'

const INACTIVE_TRIP_STATES = ['cancelled', 'completed', 'deposit_released']

function mapVehicle(row) {
  return {
    id: row.id,
    name: row.name,
    year: row.year,
    host: row.host_display_name,
    ownerId: row.owner_id,
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

async function fetchActiveReturnDates(today = todayISODate()) {
  const { data, error } = await supabase
    .from('trips')
    .select('vehicle_id, return_date')
    .not('state', 'in', `(${INACTIVE_TRIP_STATES.map((s) => `"${s}"`).join(',')})`)
    .lte('pickup_date', today)
    .gte('return_date', today)

  if (error) throw error

  const byVehicle = new Map()
  for (const trip of data ?? []) {
    const current = byVehicle.get(trip.vehicle_id)
    if (!current || trip.return_date > current) {
      byVehicle.set(trip.vehicle_id, trip.return_date)
    }
  }
  return byVehicle
}

function applyActiveTripStatus(vehicle, activeReturns) {
  const returnDate = activeReturns.get(vehicle.id)
  if (!returnDate) {
    return {
      ...vehicle,
      status: 'idle',
      statusLabel: 'Idle · open now',
      activeReturnDate: null,
    }
  }

  return {
    ...vehicle,
    status: 'rented',
    statusLabel: ownerRentedLabel(returnDate),
    activeReturnDate: returnDate,
  }
}

async function enrichWithActiveTripStatus(vehicles) {
  const activeReturns = await fetchActiveReturnDates()
  return vehicles.map((v) => applyActiveTripStatus(v, activeReturns))
}

function mapVehicleToRow(vehicle) {
  return {
    id: vehicle.id,
    owner_id: vehicle.ownerId,
    name: vehicle.name,
    year: vehicle.year,
    host_display_name: vehicle.hostDisplayName,
    price_per_day: vehicle.pricePerDay,
    seats: vehicle.seats,
    range: vehicle.range,
    drive: vehicle.drive ?? 'Auto',
    distance_mi: vehicle.distanceMi ?? null,
    badge: vehicle.badge ?? 'Instant book',
    gradient: vehicle.gradient,
    status: vehicle.status ?? 'idle',
    status_label: vehicle.statusLabel ?? 'Idle · open now',
    trips_count: 0,
    available: true,
    photos: vehicle.photos?.length
      ? vehicle.photos.filter(Boolean)
      : vehicle.photoUrl
        ? [vehicle.photoUrl]
        : [],
  }
}

export function slugifyVehicleId(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
  const suffix = Math.random().toString(36).slice(2, 6)
  return `${base || 'vehicle'}-${suffix}`
}

export const VEHICLE_GRADIENTS = [
  'linear-gradient(120deg, #134074, #3A86FF)',
  'linear-gradient(120deg, #0B2545, #5B6B7B)',
  'linear-gradient(120deg, #1F3A4D, #5DB7AB)',
  'linear-gradient(120deg, #2D1B4E, #9B5DE5)',
  'linear-gradient(120deg, #1A3C34, #2EC4B6)',
]

export async function fetchVehicles() {
  if (!isSupabaseConfigured) {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('available', true)
    .order('status')
    .order('name')

  if (error) throw error
  const vehicles = await enrichWithActiveTripStatus(data.map(mapVehicle))
  return vehicles.sort((a, b) => {
    if (a.status !== b.status) return a.status === 'idle' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
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
  if (!data) return null

  const [vehicle] = await enrichWithActiveTripStatus([mapVehicle(data)])
  return vehicle
}

export async function fetchOwnerVehicles(ownerId) {
  if (!isSupabaseConfigured) {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('owner_id', ownerId)
    .order('name')

  if (error) throw error
  return enrichWithActiveTripStatus(data.map(mapVehicle))
}

export async function fetchOwnerVehicle(id, ownerId) {
  if (!isSupabaseConfigured) {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }

  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('id', id)
    .eq('owner_id', ownerId)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  const [vehicle] = await enrichWithActiveTripStatus([mapVehicle(data)])
  return vehicle
}

function mapVehicleUpdateToRow(vehicle) {
  return {
    name: vehicle.name,
    year: vehicle.year,
    price_per_day: vehicle.pricePerDay,
    seats: vehicle.seats,
    range: vehicle.range,
    drive: vehicle.drive ?? 'Auto',
    distance_mi: vehicle.distanceMi ?? null,
    badge: vehicle.badge ?? 'Instant book',
    photos: vehicle.photos?.length ? vehicle.photos.filter(Boolean) : [],
  }
}

export async function updateVehicle(id, ownerId, vehicle) {
  if (!isSupabaseConfigured) {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }

  const row = mapVehicleUpdateToRow(vehicle)
  const { data, error } = await supabase
    .from('vehicles')
    .update(row)
    .eq('id', id)
    .eq('owner_id', ownerId)
    .select('*')
    .single()

  if (error) throw error
  return mapVehicle(data)
}

export async function createVehicle(vehicle) {
  if (!isSupabaseConfigured) {
    throw new Error('SUPABASE_NOT_CONFIGURED')
  }

  const row = mapVehicleToRow(vehicle)
  const { data, error } = await supabase
    .from('vehicles')
    .insert(row)
    .select('*')
    .single()

  if (error) throw error
  return mapVehicle(data)
}
