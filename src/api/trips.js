import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { formatTripDate } from '../lib/tripDates.js'
import { formatTripSchedule, normalizeTripTime, isPickupTimeValid } from '../lib/tripTimes.js'
import { tripChargeAmount } from '../lib/tripPricing.js'
import { isPaymentsEnabled } from '../lib/stripe.js'

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

function mapPayment(row) {
  if (!row) return null
  return {
    id: row.id,
    tripId: row.trip_id,
    amount: row.amount != null ? Number(row.amount) : null,
    chargeAmount: row.charge_amount != null ? Number(row.charge_amount) : null,
    depositAmount: row.deposit_amount != null ? Number(row.deposit_amount) : null,
    paymentStatus: row.payment_status,
    depositHoldStatus: row.deposit_hold_status,
    providerReference: row.provider_reference,
    stripeCheckoutSessionId: row.stripe_checkout_session_id,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    stripeDepositIntentId: row.stripe_deposit_intent_id,
    payoutStatus: row.payout_status,
  }
}

function mapTrip(row) {
  const breakdown = row.price_breakdown ?? {}
  const vehicle = mapVehicle(row.vehicle)
  const paymentRow = Array.isArray(row.payment) ? row.payment[0] : row.payment
  const payment = mapPayment(paymentRow)

  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    renterId: row.renter_id,
    ownerId: row.owner_id,
    pickupDate: row.pickup_date,
    returnDate: row.return_date,
    pickupTime: normalizeTripTime(row.pickup_time),
    returnTime: normalizeTripTime(row.return_time),
    pickup: formatTripDate(row.pickup_date),
    dropoff: formatTripDate(row.return_date),
    schedule: formatTripSchedule({
      pickupDate: row.pickup_date,
      returnDate: row.return_date,
      pickupTime: row.pickup_time,
      returnTime: row.return_time,
    }),
    days: row.days,
    state: row.state,
    priceBreakdown: breakdown,
    total: breakdown.total ?? null,
    vehicle,
    payment,
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
  ),
  payment:payments (*)
`

async function resolveOwnerId(vehicleId, ownerId) {
  if (ownerId) return ownerId

  const { data, error } = await supabase
    .from('vehicles')
    .select('owner_id, name')
    .eq('id', vehicleId)
    .single()

  if (error) throw error
  if (data?.owner_id) return data.owner_id

  const label = data?.name ?? 'This vehicle'
  throw new Error(
    `${label} isn't linked to an owner yet. Book a listing from Fleet, or assign an owner in Supabase.`,
  )
}

export async function createTrip({
  vehicleId,
  ownerId,
  renterId,
  pickupDate,
  returnDate,
  pickupTime,
  returnTime,
  days,
  coverage,
  priceBreakdown,
  awaitPayment = isPaymentsEnabled(),
}) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')
  if (!renterId) throw new Error('You must be signed in to book')

  const resolvedOwnerId = await resolveOwnerId(vehicleId, ownerId)
  if (resolvedOwnerId === renterId) throw new Error('You cannot book your own vehicle')

  if (!isPickupTimeValid(pickupDate, pickupTime)) {
    throw new Error('Pickup time must be in the future')
  }

  const { data: conflicts, error: conflictError } = await supabase
    .from('trips')
    .select('id, renter_id, state')
    .eq('vehicle_id', vehicleId)
    .not('state', 'in', '("cancelled","completed","deposit_released","returned")')
    .lte('pickup_date', returnDate)
    .gte('return_date', pickupDate)

  if (conflictError) throw conflictError

  if (conflicts?.length > 0) {
    const ownPending = conflicts.filter(
      (t) => t.renter_id === renterId && t.state === 'payment_pending',
    )
    const blockers = conflicts.filter(
      (t) => !(t.renter_id === renterId && t.state === 'payment_pending'),
    )

    if (blockers.length > 0) {
      throw new Error('This vehicle is already booked for those dates')
    }

    // Same renter abandoned Stripe — resume the existing pending trip
    if (ownPending.length > 0) {
      const resumeId = ownPending[0].id
      await supabase
        .from('trips')
        .update({
          pickup_date: pickupDate,
          return_date: returnDate,
          pickup_time: normalizeTripTime(pickupTime),
          return_time: normalizeTripTime(returnTime),
          days,
          price_breakdown: priceBreakdown,
        })
        .eq('id', resumeId)
        .eq('state', 'payment_pending')

      if (awaitPayment) {
        const chargeAmount = tripChargeAmount(priceBreakdown)
        await supabase
          .from('payments')
          .update({
            amount: chargeAmount,
            charge_amount: chargeAmount,
            deposit_amount: priceBreakdown.deposit,
            payment_status: 'pending',
          })
          .eq('trip_id', resumeId)
      }

      return fetchTrip(resumeId)
    }
  }

  const initialState = awaitPayment ? 'payment_pending' : 'coverage_pending'

  const { data: tripRow, error: tripError } = await supabase
    .from('trips')
    .insert({
      vehicle_id: vehicleId,
      renter_id: renterId,
      owner_id: resolvedOwnerId,
      pickup_date: pickupDate,
      return_date: returnDate,
      pickup_time: normalizeTripTime(pickupTime),
      return_time: normalizeTripTime(returnTime),
      days,
      state: initialState,
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

  if (awaitPayment) {
    const chargeAmount = tripChargeAmount(priceBreakdown)
    const { error: paymentError } = await supabase.from('payments').insert({
      trip_id: tripRow.id,
      amount: chargeAmount,
      charge_amount: chargeAmount,
      deposit_amount: priceBreakdown.deposit,
      payment_status: 'pending',
      deposit_hold_status: 'none',
    })

    if (paymentError) throw paymentError
  }

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

/** Owner confirms vehicle handoff; frees listing and unlocks deposit release. */
export async function markTripReturned(tripId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')
  if (!tripId) throw new Error('Trip id required')

  const { data, error } = await supabase
    .from('trips')
    .update({ state: 'returned' })
    .eq('id', tripId)
    .in('state', [
      'coverage_pending',
      'coverage_verified',
      'agreement_signed',
      'confirmed',
      'in_progress',
      'requested',
    ])
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Trip could not be marked returned')

  return fetchTrip(tripId)
}

/** Renter cancels an unpaid checkout hold so dates become bookable again. */
export async function cancelPaymentPendingTrip(tripId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')
  if (!tripId) throw new Error('Trip id required')

  const { data, error } = await supabase
    .from('trips')
    .update({ state: 'cancelled' })
    .eq('id', tripId)
    .eq('state', 'payment_pending')
    .select('id')
    .maybeSingle()

  if (error) throw error
  if (!data) throw new Error('Trip could not be cancelled')

  await supabase
    .from('payments')
    .update({ payment_status: 'failed' })
    .eq('trip_id', tripId)

  return fetchTrip(tripId)
}
