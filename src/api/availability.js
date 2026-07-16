import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

function mapBlock(row) {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason,
    createdAt: row.created_at,
  }
}

export async function fetchVehicleBlocks(vehicleId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const { data, error } = await supabase
    .from('availability_blocks')
    .select('*')
    .eq('vehicle_id', vehicleId)
    .order('start_date')

  if (error) throw error
  return (data ?? []).map(mapBlock)
}

export async function createAvailabilityBlock({
  vehicleId,
  startDate,
  endDate,
  reason,
}) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')
  if (!startDate || !endDate) throw new Error('Start and end dates required')
  if (endDate < startDate) throw new Error('End date must be on or after start')

  const { data, error } = await supabase
    .from('availability_blocks')
    .insert({
      vehicle_id: vehicleId,
      start_date: startDate,
      end_date: endDate,
      reason: reason?.trim() || null,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapBlock(data)
}

export async function deleteAvailabilityBlock(blockId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const { error } = await supabase
    .from('availability_blocks')
    .delete()
    .eq('id', blockId)

  if (error) throw error
}

/** True if [rangeStart, rangeEnd] overlaps any block. */
export function rangeOverlapsBlocks(rangeStart, rangeEnd, blocks) {
  if (!blocks?.length) return false
  return blocks.some(
    (b) => b.startDate <= rangeEnd && b.endDate >= rangeStart,
  )
}
