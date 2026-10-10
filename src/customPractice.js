const CUSTOM_SETUP_KEY = 'keysmash-custom-setup-v1'
const CUSTOM_DURATIONS = [15, 30, 60, 120]
const STORAGE_WARNING = 'Browser storage is unavailable. Your custom text and timer will not be remembered after this visit.'

export function loadCustomSetup() {
  const fallback = { text: '', duration: 60, warning: '' }
  let stored
  try {
    stored = globalThis.localStorage.getItem(CUSTOM_SETUP_KEY)
  } catch {
    return { ...fallback, warning: STORAGE_WARNING }
  }
  try {
    const value = JSON.parse(stored)
    if (!value || typeof value !== 'object' || Array.isArray(value)) return fallback
    const prepared = typeof value.text === 'string' ? prepareCustomText(value.text) : {}
    return {
      text: prepared.text || '',
      duration: CUSTOM_DURATIONS.includes(value.duration) ? value.duration : 60,
      warning: '',
    }
  } catch {
    return fallback
  }
}

export function saveCustomSetup(text, duration) {
  try {
    const stored = JSON.stringify({ text, duration })
    globalThis.localStorage.setItem(CUSTOM_SETUP_KEY, stored)
    if (globalThis.localStorage.getItem(CUSTOM_SETUP_KEY) !== stored) return STORAGE_WARNING
    return 'Custom setup saved in this browser.'
  } catch {
    return STORAGE_WARNING
  }
}

export function prepareCustomText(draft) {
  if (draft.length > 2000) return { error: 'Use 2,000 characters or fewer. Your applied text has not changed.' }
  const text = draft.trim().replace(/\s+/g, ' ')
  if (!text) return { error: 'Enter nonblank text before applying it.' }
  return { text }
}

export function customTarget(text, minimumLength, pageIndex = 0, pageSize = 20) {
  if (!text) return ''
  const period = `${text} `
  const wordsPerCopy = text.split(' ').length
  const copies = Math.max(Math.ceil((minimumLength + 1) / period.length), Math.ceil(((pageIndex + 2) * pageSize) / wordsPerCopy))
  return period.repeat(copies).trimEnd()
}
