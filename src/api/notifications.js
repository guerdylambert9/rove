import { supabase, isSupabaseConfigured } from '../lib/supabase.js'

function mapNotification(row) {
  return {
    id: row.id,
    userId: row.user_id,
    tripId: row.trip_id,
    type: row.type,
    title: row.title,
    body: row.body,
    readAt: row.read_at,
    createdAt: row.created_at,
    unread: row.read_at == null,
  }
}

export async function fetchNotifications(userId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')
  if (!userId) return []

  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return data.map(mapNotification)
}

export async function fetchUnreadCount(userId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')
  if (!userId) return 0

  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) throw error
  return count ?? 0
}

export async function markNotificationRead(id) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw error
}

export async function markAllNotificationsRead(userId) {
  if (!isSupabaseConfigured) throw new Error('SUPABASE_NOT_CONFIGURED')
  if (!userId) return

  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) throw error
}
