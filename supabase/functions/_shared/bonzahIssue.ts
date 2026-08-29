import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  bonzahConfigured,
  bonzahFetch,
  dropOffTimeLabel,
  toBonzahDate,
  type BonzahCovers,
} from './bonzah.ts'

type InsuredSnapshot = {
  firstName?: string
  lastName?: string
  dateOfBirth?: string
  addressLine1?: string
  city?: string
  state?: string
  zipCode?: string
  phone?: string
  email?: string
}

function normalizeTime(value?: string | null): string {
  if (!value) return '10:00:00'
  const str = String(value)
  return str.length >= 8 ? str.slice(0, 8) : `${str.slice(0, 5)}:00`
}

function toBonzahDateTime(isoDate: string, time?: string | null): string {
  return `${toBonzahDate(isoDate)} ${normalizeTime(time)}`
}

function toBonzahDob(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${m}/${d}/${y}`
}

function normalizePhone(raw?: string): string {
  const digits = String(raw || '').replace(/\D/g, '')
  if (digits.length === 11 && digits.startsWith('1')) return digits
  if (digits.length === 10) return `1${digits}`
  return ''
}

function parseVehicle(name: string, year?: number | null) {
  const makeModel = name.split('·')[0]?.trim() || name
  const tokens = makeModel.split(/\s+/).filter(Boolean)
  const make = tokens[0] || 'Unknown'
  const model = tokens.slice(1).join(' ') || makeModel
  return {
    year: year ?? undefined,
    make,
    model,
  }
}

function pdfIdsFromPayment(data: Record<string, unknown>) {
  const ids: Record<string, number> = {}
  if (data.cdw_pdf_id) ids.cdw = Number(data.cdw_pdf_id)
  if (data.rcli_pdf_id) ids.rcli = Number(data.rcli_pdf_id)
  if (data.sli_pdf_id) ids.sli = Number(data.sli_pdf_id)
  if (data.pai_pdf_id) ids.pai = Number(data.pai_pdf_id)
  return ids
}

export type BonzahIssueResult =
  | { ok: true; policyNo: string; skipped?: boolean }
  | { ok: false; error: string }

export async function issueBonzahForTrip(
  serviceClient: SupabaseClient,
  tripId: string,
): Promise<BonzahIssueResult> {
  if (!bonzahConfigured()) {
    return { ok: false, error: 'Bonzah is not configured' }
  }

  const { data: trip, error: tripError } = await serviceClient
    .from('trips')
    .select(
      'id, state, pickup_date, return_date, pickup_time, return_time, renter_id, vehicle_id',
    )
    .eq('id', tripId)
    .single()

  if (tripError || !trip) {
    return { ok: false, error: 'Trip not found' }
  }

  const { data: coverage, error: covError } = await serviceClient
    .from('coverages')
    .select('*')
    .eq('trip_id', tripId)
    .single()

  if (covError || !coverage) {
    return { ok: false, error: 'Coverage not found' }
  }

  if (coverage.type !== 'protection') {
    return { ok: true, policyNo: '', skipped: true }
  }

  if (coverage.bonzah_policy_no) {
    if (trip.state === 'coverage_pending') {
      await serviceClient
        .from('trips')
        .update({ state: 'coverage_verified' })
        .eq('id', tripId)
        .eq('state', 'coverage_pending')

      await serviceClient
        .from('coverages')
        .update({
          verification_status: 'verified',
          verified_at: coverage.verified_at ?? new Date().toISOString(),
        })
        .eq('trip_id', tripId)
    }
    return { ok: true, policyNo: coverage.bonzah_policy_no as string, skipped: true }
  }

  const insured = (coverage.insured_snapshot ?? {}) as InsuredSnapshot
  const phone = normalizePhone(insured.phone)
  if (
    !insured.firstName ||
    !insured.lastName ||
    !insured.dateOfBirth ||
    !insured.addressLine1 ||
    !insured.zipCode ||
    !phone
  ) {
    return {
      ok: false,
      error: 'Missing insured details for Bonzah policy issuance',
    }
  }

  const { data: profile } = await serviceClient
    .from('profiles')
    .select('email')
    .eq('id', trip.renter_id)
    .single()

  const email = insured.email || profile?.email
  if (!email) {
    return { ok: false, error: 'Renter email required for Bonzah policy' }
  }

  const { data: vehicle } = await serviceClient
    .from('vehicles')
    .select('name, year')
    .eq('id', trip.vehicle_id)
    .single()

  const covers = (coverage.bonzah_covers ?? {}) as BonzahCovers
  const pickupState = coverage.pickup_state || insured.state || 'Florida'
  const residenceState = insured.state || pickupState
  const vehicleInfo = parseVehicle(vehicle?.name ?? 'Vehicle', vehicle?.year)

  const quoteBody: Record<string, unknown> = {
    quote_id: coverage.bonzah_quote_id ?? undefined,
    trip_start_date: toBonzahDateTime(trip.pickup_date, trip.pickup_time),
    trip_end_date: toBonzahDateTime(trip.return_date, trip.return_time),
    pickup_country: 'United States',
    pickup_state: pickupState,
    drop_off_time: dropOffTimeLabel(trip.pickup_time, trip.return_time),
    residence_country: 'United States',
    residence_state: residenceState,
    cdw_cover: Boolean(covers.cdw),
    rcli_cover: Boolean(covers.rcli),
    sli_cover: Boolean(covers.sli),
    pai_cover: Boolean(covers.pai),
    first_name: insured.firstName,
    last_name: insured.lastName,
    dob: toBonzahDob(insured.dateOfBirth),
    pri_email_address: email,
    address_line_1: insured.addressLine1,
    address_line_2: '',
    zip_code: insured.zipCode,
    inspection_done: covers.cdw ? 'Renter' : undefined,
    source: Deno.env.get('BONZAH_SOURCE') || 'API',
    phone_no: phone,
    policy_booking_time_zone: 'America/New_York',
    finalize: 1,
    rental_use: 'Pleasure/Personal',
    ev_classification: 'No',
    year: vehicleInfo.year,
    make: vehicleInfo.make,
    model: vehicleInfo.model,
  }

  if (insured.city) quoteBody.city = insured.city

  try {
    const quoteJson = await bonzahFetch('/api/v1/Bonzah/quote', { body: quoteBody })

    if (quoteJson?.status !== 0 || !quoteJson?.data?.payment_id) {
      const msg = quoteJson?.txt || 'Bonzah quote finalize failed'
      await serviceClient
        .from('coverages')
        .update({
          rejection_reason: msg,
          bonzah_raw: quoteJson,
        })
        .eq('trip_id', tripId)
      return { ok: false, error: msg }
    }

    const quoteData = quoteJson.data
    const paymentId = quoteData.payment_id as string
    const amount = String(
      quoteData.total_amount ?? quoteData.total_premium ?? coverage.bonzah_premium,
    )

    const payJson = await bonzahFetch('/api/v1/Bonzah/payment', {
      body: { payment_id: paymentId, amount },
    })

    if (payJson?.status !== 0 || !payJson?.data?.policy_no) {
      const msg = payJson?.txt || 'Bonzah payment failed'
      await serviceClient
        .from('coverages')
        .update({
          bonzah_quote_id: quoteData.quote_id,
          bonzah_payment_id: paymentId,
          bonzah_policy_id: quoteData.policy_id ?? null,
          rejection_reason: msg,
          bonzah_raw: { quote: quoteData, payment: payJson },
        })
        .eq('trip_id', tripId)
      return { ok: false, error: msg }
    }

    const payData = payJson.data as Record<string, unknown>
    const policyNo = payData.policy_no as string
    const pdfIds = pdfIdsFromPayment(payData)

    await serviceClient
      .from('coverages')
      .update({
        bonzah_quote_id: quoteData.quote_id,
        bonzah_payment_id: paymentId,
        bonzah_policy_id: payData.policy_id ?? quoteData.policy_id,
        bonzah_policy_no: policyNo,
        bonzah_premium: Number(payData.total_premium ?? amount),
        bonzah_pdf_ids: pdfIds,
        bonzah_raw: { quote: quoteData, payment: payData },
        verification_status: 'verified',
        verified_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('trip_id', tripId)

    await serviceClient
      .from('trips')
      .update({ state: 'coverage_verified' })
      .eq('id', tripId)
      .eq('state', 'coverage_pending')

    return { ok: true, policyNo }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bonzah issuance failed'
    await serviceClient
      .from('coverages')
      .update({ rejection_reason: msg })
      .eq('trip_id', tripId)
    return { ok: false, error: msg }
  }
}
