import { supabase } from './supabase.js'

const reserved = new Set(['auth', 'stats', 'u', 'type', 'login', 'logout', 'callback', 'admin', 'api'])

export function normalizeHandle(value) { return value.toLowerCase() }

export function handleError(handle) {
  if (handle.length < 3 || handle.length > 20) return 'Use 3–20 characters.'
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(handle)) return 'Use letters, digits, and single hyphens between words.'
  if (reserved.has(handle)) return 'This handle is reserved. Choose another.'
  return ''
}

export function profileError(error) {
  if (error?.code === '23505') return 'That handle is unavailable. Choose another.'
  if (error?.code === '23514') return 'This handle is invalid. Check the handle rules.'
  return 'Profile settings could not connect. Retry after checking your connection and database setup.'
}

export async function profileRequest(query, signal) {
  const { data, error } = await query.abortSignal(signal)
  if (error) throw error
  return data
}

export function loadOwnerProfile(id, signal) {
  return profileRequest(supabase.from('profiles').select('handle,published').eq('id', id).maybeSingle(), signal)
}

export function savePublication(id, handle, published, signal) {
  return profileRequest(supabase.from('profiles').upsert({ id, handle, published }, { onConflict: 'id' }).select('handle,published').single(), signal)
}

export function loadPublicProfile(handle, signal) {
  if (!supabase) return Promise.reject(new Error('Cloud is not configured'))
  return profileRequest(supabase.rpc('get_public_profile', { requested_handle: handle }).maybeSingle(), signal)
}
