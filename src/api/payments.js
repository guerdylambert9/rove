import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

export async function startCheckoutSession(tripId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: { tripId },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)
  if (!data?.url) throw new Error('No checkout URL returned')

  return data
}

export async function releaseTripDeposit(tripId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const { data, error } = await supabase.functions.invoke('release-deposit', {
    body: { tripId },
  })

  if (error) throw error
  if (data?.error) throw new Error(data.error)
  return data
}
