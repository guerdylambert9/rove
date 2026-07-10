import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { formatTripDate } from '../lib/tripDates.js'

function mapVehicle(row) {
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    year: row.year,
    host: row.host_display_name,
    pricePerDay: Number(row.price_per_day),
    photos: row.photos ?? [],
    gradient: row.gradient,
  }
}

function mapTrip(row) {
  const breakdown = row.price_breakdown ?? {}
  const vehicle = mapVehicle(row.vehicle)

  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    renterId: row.renter_id,
    ownerId: row.owner_id,
    pickupDate: row.pickup_date,
    returnDate: row.return_date,
    pickup: formatTripDate(row.pickup_date),
    dropoff: formatTripDate(row.return_date),
    days: row.days,
    state: row.state,
    priceBreakdown: breakdown,
    total: breakdown.total ?? null,
    vehicle,
    createdAt: row.created_at,
  }
}

const TRIP_SELECT = `
  *,
  vehicle:vehicles (
    id,
    name,
    year,
    host_display_name,
    price_per_day,
    photos,
    gradient
  )
`

export async function createTrip({
  vehicleId,
  ownerId,
  renterId,
  pickupDate,
  returnDate,
  days,
  coverage,
  priceBreakdown,
}) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')
  if (!renterId) throw new Error('You must be signed in to book')
  if (ownerId === renterId) throw new Error('You cannot book your own vehicle')

  const { data: conflicts, error: conflictError } = await supabase
    .from('trips')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .not('state', 'in', '("cancelled","completed","deposit_released")')
    .lte('pickup_date', returnDate)
    .gte('return_date', pickupDate)

  if (conflictError) throw conflictError
  if (conflicts?.length > 0) {
    throw new Error('This vehicle is already booked for those dates')
  }

  const { data: tripRow, error: tripError } = await supabase
    .from('trips')
    .insert({
      vehicle_id: vehicleId,
      renter_id: renterId,
      owner_id: ownerId,
      pickup_date: pickupDate,
      return_date: returnDate,
      days,
      state: 'coverage_pending',
      price_breakdown: priceBreakdown,
    })
    .select('*')
    .single()

  if (tripError) throw tripError

  const { error: coverageError } = await supabase.from('coverages').insert({
    trip_id: tripRow.id,
    type: coverage.type,
    verification_status: 'pending',
    acknowledgment_text: 'Rové is not the insurer.',
    acknowledged_at: coverage.acknowledged ? new Date().toISOString() : null,
    proof_file_ref: coverage.proofUploaded ? 'pending_upload' : null,
  })

  if (coverageError) throw coverageError

  return fetchTrip(tripRow.id)
}

export async function fetchTrip(id) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const { data, error } = await supabase
    .from('trips')
    .select(TRIP_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data ? mapTrip(data) : null
}

export async function fetchRenterTrips(renterId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const { data, error } = await supabase
    .from('trips')
    .select(TRIP_SELECT)
    .eq('renter_id', renterId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(mapTrip)
}

export async function fetchOwnerTrips(ownerId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const { data, error } = await supabase
    .from('trips')
    .select(TRIP_SELECT)
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data.map(mapTrip)
}
