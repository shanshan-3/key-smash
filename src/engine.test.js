import { describe, expect, it } from 'vitest'
import { canDelete, consistencyFromSamples, scoreRun, streamWords, WORDS } from './engine.js'

describe('scoreRun', () => {
  it('computes wpm and acc from correct chars', () => {
    expect(scoreRun({ correctChars: 250, keystrokes: 260, seconds: 60 })).toEqual({
      wpm: 50,
      acc: 96.2,
    })
  })

  it('returns zeros before any input', () => {
    expect(scoreRun({ correctChars: 0, keystrokes: 0, seconds: 15 })).toEqual({
      wpm: 0,
      acc: 100,
    })
  })
})

describe('streamWords', () => {
  it('is deterministic per seed and draws from the list', () => {
    const a = streamWords(60, 50)
    const b = streamWords(60, 50)
    expect(a).toEqual(b)
    expect(a).toHaveLength(50)
    for (const w of a) expect(WORDS).toContain(w)
  })

  it('differs across seeds', () => {
    expect(streamWords(1, 20)).not.toEqual(streamWords(2, 20))
  })
})

describe('canDelete', () => {
  it('allows backspace inside the current word only', () => {
    expect(canDelete({ cursor: 5, wordStart: 4 })).toBe(true)
    expect(canDelete({ cursor: 4, wordStart: 4 })).toBe(false)
  })
})

describe('consistencyFromSamples', () => {
  it('returns 100 with fewer than two samples', () => {
    expect(consistencyFromSamples([])).toBe(100)
    expect(consistencyFromSamples([50])).toBe(100)
  })

  it('returns 100 for perfectly steady pace', () => {
    expect(consistencyFromSamples([50, 50, 50, 50])).toBe(100)
  })

  it('drops below 100 when pace varies', () => {
    expect(consistencyFromSamples([40, 60, 40, 60])).toBe(80)
  })
})
