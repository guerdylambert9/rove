import { supabase, isSupabaseConfigured } from '../lib/supabase.js'
import { normalizeBonzahCovers } from '../lib/bonzahCovers.js'

/**
 * Live Bonzah premium preview (skip_validation). Requires signed-in user + Edge secrets.
 */
export async function fetchBonzahPremium({
  tripStartDate,
  tripEndDate,
  pickupState,
  pickupCountry,
  pickupTime,
  returnTime,
  covers,
}) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const normalized = normalizeBonzahCovers(covers)

  const { data, error } = await supabase.functions.invoke('bonzah-premium', {
    body: {
      tripStartDate,
      tripEndDate,
      pickupState,
      pickupCountry,
      pickupTime,
      returnTime,
      cdw: normalized.cdw,
      rcli: normalized.rcli,
      sli: normalized.sli,
      pai: normalized.pai,
    },
  })

  if (error) {
    // FunctionsHttpError may include JSON body on context
    let detail = data?.error
    try {
      if (!detail && error.context && typeof error.context.json === 'function') {
        const body = await error.context.json()
        detail = body?.error
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail || error.message || 'Premium request failed')
  }
  if (data?.error) throw new Error(data.error)
  if (data?.totalPremium == null) throw new Error('No premium returned')

  return data
}

/** Download Bonzah policy PDF for a trip cover (cdw, rcli, sli, pai). */
export async function downloadBonzahPolicyPdf(tripId, pdfKey) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const { data: sessionData } = await supabase.auth.getSession()
  const token = sessionData.session?.access_token
  if (!token) throw new Error('You must be signed in')

  const base = import.meta.env.VITE_SUPABASE_URL
  const url = `${base}/functions/v1/bonzah-policy-pdf`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tripId, pdfKey }),
  })

  if (!res.ok) {
    let detail = 'PDF download failed'
    try {
      const body = await res.json()
      detail = body.error ?? detail
    } catch {
      /* binary or empty */
    }
    throw new Error(detail)
  }

  const blob = await res.blob()
  const objectUrl = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = objectUrl
  a.download = `bonzah-${pdfKey}-${tripId.slice(0, 8)}.pdf`
  a.click()
  URL.revokeObjectURL(objectUrl)
}

/** Retry Bonzah quote finalize + settle for a paid protection trip. */
export async function settleBonzahInsurance(tripId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const { data, error } = await supabase.functions.invoke('bonzah-settle', {
    body: { tripId },
  })

  if (error) {
    let detail = data?.error
    try {
      if (!detail && error.context && typeof error.context.json === 'function') {
        const body = await error.context.json()
        detail = body?.error
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail || error.message || 'Insurance settlement failed')
  }
  if (data?.error) throw new Error(data.error)
  return data
}
