export const WORDS = (
  'the be to of and a in that have I it for not on with he as you do at this but his by from they we say her she or an will my one all would there their what so up out if about who get which go me when make can like time no just him know take people into year your good some could them see other than then now look only come its over think also back after use two how our work first well way even new want because any these give day most us is are had has were been was will would can should may might must shall do does did have has had will would there here where when what which who whom whose that this these those then than that with from into over after before between through during under again once here there when where why how all any both each few more most other some such no nor not only own same so than too very can will just don should now'
).split(' ')

function mulberry32(seed) {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let z = Math.imul(t ^ (t >>> 15), t | 1)
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61)
    return ((z ^ (z >>> 14)) >>> 0) / 4294967296
  }
}

export function streamWords(seed, count) {
  const rand = mulberry32(seed)
  return Array.from({ length: count }, () => WORDS[Math.floor(rand() * WORDS.length)])
}

export function scoreRun({ correctChars, keystrokes, seconds }) {
  const minutes = seconds / 60
  const wpm = minutes > 0 ? Math.round(correctChars / 5 / minutes) : 0
  const acc = keystrokes === 0 ? 100 : Math.round((correctChars / keystrokes) * 1000) / 10
  return { wpm, acc }
}

// ponytail: typed-string model only, per-key timestamps if latency heatmap ever matters
export function canDelete({ cursor, wordStart }) {
  return cursor > wordStart
}

export function consistencyFromSamples(samples) {
  if (samples.length < 2) return 100
  const mean = samples.reduce((a, b) => a + b, 0) / samples.length
  if (mean <= 0) return 0
  const variance = samples.reduce((a, b) => a + (b - mean) * (b - mean), 0) / samples.length
  return Math.max(0, Math.min(100, Math.round(100 * (1 - Math.sqrt(variance) / mean))))
}
