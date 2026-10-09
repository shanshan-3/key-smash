import { handleError, normalizeHandle } from './profiles.js'

export function raceRequest(path) {
  const parts = path.split('/')
  const owner = parts[1] === 'profile'
  let handle = null
  let mode = ''
  try {
    if (!owner) handle = normalizeHandle(decodeURIComponent(parts[2] || ''))
    mode = decodeURIComponent(parts[owner ? 3 : 4] || '')
  } catch { return { owner, valid: false } }
  const valid = (owner ? parts.length === 4 && parts[2] === 'race' : parts.length === 5 && parts[1] === 'u' && parts[3] === 'race' && !handleError(handle, true))
    && /^time-(25|50|60|100)w-(15|30|60|120)s$/.test(mode)
  return { owner, handle, mode, valid }
}

export function isRacePath(path) {
  return /^\/profile\/race(?:\/|$)/.test(path) || (path.startsWith('/u/') && path.split('/')[3] === 'race')
}
