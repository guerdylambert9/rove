import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

function mapCoverageRow(row) {
  if (!row) return null
  return {
    id: row.id,
    tripId: row.trip_id,
    type: row.type,
    verificationStatus: row.verification_status,
    proofFileRef: row.proof_file_ref,
    bonzahPolicyNo: row.bonzah_policy_no,
    bonzahPdfIds: row.bonzah_pdf_ids ?? {},
    rejectionReason: row.rejection_reason,
    acknowledgedAt: row.acknowledged_at,
  }
}

export async function fetchPendingCoverages() {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const { data, error } = await supabase
    .from('coverages')
    .select(
      `
      *,
      trip:trips (
        id,
        pickup_date,
        return_date,
        state,
        renter_id,
        vehicle:vehicles ( name )
      )
    `,
    )
    .eq('type', 'own')
    .eq('verification_status', 'pending')
    .not('proof_file_ref', 'is', null)
    .neq('proof_file_ref', 'pending_upload')
    .order('created_at', { ascending: true })

  if (error) throw error

  const rows = data ?? []
  const renterIds = [
    ...new Set(rows.map((r) => r.trip?.renter_id).filter(Boolean)),
  ]

  let profilesById = {}
  if (renterIds.length > 0) {
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', renterIds)
    if (profileError) throw profileError
    profilesById = Object.fromEntries((profiles ?? []).map((p) => [p.id, p]))
  }

  return rows.map((row) => ({
    ...row,
    trip: row.trip
      ? { ...row.trip, renter: profilesById[row.trip.renter_id] ?? null }
      : null,
  }))
}

export async function verifyCoverage(coverageId, { approved, reason = '' }) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const { data, error } = await supabase
    .from('coverages')
    .update({
      verification_status: approved ? 'verified' : 'rejected',
      verified_at: approved ? new Date().toISOString() : null,
      verified_by: (await supabase.auth.getUser()).data.user?.id ?? null,
      rejection_reason: approved ? null : reason || 'Coverage proof rejected',
    })
    .eq('id', coverageId)
    .select('*')
    .single()

  if (error) throw error
  return mapCoverageRow(data)
}

export async function signTripAgreement({
  tripId,
  renterId,
  signerName,
  acknowledgmentText,
}) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const signaturePayload = {
    signerName,
    signedAt: new Date().toISOString(),
    acknowledgment: acknowledgmentText,
    templateVersion: 'rove-rental-v1',
  }

  const path = `${renterId}/${tripId}-signature.json`
  const { error: uploadError } = await supabase.storage
    .from('agreements')
    .upload(path, JSON.stringify(signaturePayload, null, 2), {
      contentType: 'application/json',
      upsert: true,
    })

  if (uploadError) throw uploadError

  const { error: agreementError } = await supabase.from('agreements').upsert(
    {
      trip_id: tripId,
      document_ref: path,
      signature_ref: path,
      signer_name: signerName,
      signed_at: signaturePayload.signedAt,
      template_version: 'rove-rental-v1',
      acknowledgment_snapshot: acknowledgmentText,
    },
    { onConflict: 'trip_id' },
  )

  if (agreementError) throw agreementError

  const { error: tripError } = await supabase
    .from('trips')
    .update({ state: 'agreement_signed' })
    .eq('id', tripId)
    .in('state', ['coverage_pending', 'coverage_verified'])

  if (tripError) throw tripError

  return signaturePayload
}
