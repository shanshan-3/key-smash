import { supabase } from './supabase.js'

const reserved = new Set(['auth', 'stats', 'profile', 'u', 'type', 'login', 'logout', 'callback', 'admin', 'api'])

export function normalizeHandle(value) { return value.toLowerCase() }

export function handleError(handle, allowReserved = false) {
  if (handle.length < 3 || handle.length > 20) return 'Use 3–20 characters.'
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(handle)) return 'Use letters, digits, and single hyphens between words.'
  if (!allowReserved && reserved.has(handle)) return 'This handle is reserved. Choose another.'
  return ''
}

export function profileError(error) {
  if (error?.code === 'PGRST116') return 'Your profile changed in another session. Reload profile settings before retrying.'
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

export async function savePublication(id, handle, published, signal, currentHandle) {
  if (currentHandle) return profileRequest(supabase.from('profiles').update({ published }).eq('id', id).eq('handle', currentHandle).select('handle,published').single(), signal)
  const data = await profileRequest(supabase.from('profiles').update({ handle, published }).eq('id', id).is('handle', null).select('handle,published').maybeSingle(), signal)
  return data || profileRequest(supabase.from('profiles').insert({ id, handle, published }).select('handle,published').single(), signal)
}

export function renameHandle(id, handle, signal, currentHandle) {
  return profileRequest(supabase.from('profiles').update({ handle }).eq('id', id).eq('handle', currentHandle).select('handle,published').single(), signal)
}

export function loadPublicProfile(handle, signal) {
  if (!supabase) return Promise.reject(new Error('Cloud is not configured'))
  return profileRequest(supabase.rpc('get_profile_dashboard', { requested_handle: handle }).maybeSingle(), signal)
}
