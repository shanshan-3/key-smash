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
