import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { consistencyFromSamples, scoreRun, streamWords } from './engine.js'

const DURATIONS = [15, 30, 60, 120]
const WORD_COUNTS = [25, 50, 60, 100]
const WORDS_PER_PAGE = 20
const PB_KEY = 'keysmash-pb-v1'

const QUOTE_S = [
  'the quick brown fox jumps over the lazy dog and runs into the woods',
  'i like to type fast words on my loud old keyboard every day',
  'she sells fresh bread and warm soup at the small corner shop',
  'we walk along the river when the sun is low and gold',
  'code is just writing thoughts that a machine can follow',
]

const QUOTE_M = [
  'there is a quiet house at the end of the street where an old cat sleeps in the sun all afternoon without a single worry in the world',
  'when the rain starts to fall the city slows down and people open umbrellas like flowers blooming upside down along the sidewalk',
  'he learned to type by copying pages from old books letter by letter until his fingers knew the keys better than his eyes knew the page',
  'the night train moves through dark fields and small towns while passengers dream of stations they have never seen before',
  'a good test is short enough to finish and long enough to matter so type steady and let your hands find their own rhythm',
]

function correctCount(target, typed) {
  let n = 0
  for (let i = 0; i < typed.length; i++) if (typed[i] === target[i]) n++
  return n
}

export default function App() {
  const [duration, setDuration] = useState(60)
  const [wordCount, setWordCount] = useState(60)
  const [mode, setMode] = useState('time')
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9))
  const [words, setWords] = useState(() => streamWords(seed, 60))
  const [typed, setTyped] = useState('')
  const [presses, setPresses] = useState(0)
  const [pageIndex, setPageIndex] = useState(0)
  const [startedAt, setStartedAt] = useState(null)
  const [now, setNow] = useState(Date.now())
  const [finished, setFinished] = useState(false)
  const [pbInfo, setPbInfo] = useState(null)
  const [con, setCon] = useState(null)
  const inputRef = useRef(null)
  const secRef = useRef(0)
  const samplesRef = useRef([])
  const missedRef = useRef({})

  const target = useMemo(() => words.join(' '), [words])
  const totalPages = Math.max(1, Math.ceil(words.length / WORDS_PER_PAGE))
  const pageStart = useMemo(() => {
    if (pageIndex === 0) return 0
    return words.slice(0, pageIndex * WORDS_PER_PAGE).join(' ').length + 1
  }, [words, pageIndex])
  const pageTarget = useMemo(
    () => words.slice(pageIndex * WORDS_PER_PAGE, pageIndex * WORDS_PER_PAGE + WORDS_PER_PAGE).join(' '),
    [words, pageIndex],
  )
  const wordsTyped = typed === '' ? 0 : Math.min(words.length, typed.split(' ').length)
  const progressPct = target.length === 0 ? 0 : Math.min(100, (typed.length / target.length) * 100)
  const elapsedSecs = startedAt ? (now - startedAt) / 1000 : 0
  const timeLeft = Math.max(0, Math.ceil(duration - elapsedSecs))
  const live = scoreRun({
    correctChars: correctCount(target, typed),
    keystrokes: presses,
    seconds: Math.max(elapsedSecs, 0.5),
  })

  const reset = useCallback(
    (
      nextDuration = duration,
      nextWordCount = wordCount,
      nextSeed = Math.floor(Math.random() * 1e9),
      nextMode = mode,
    ) => {
      setDuration(nextDuration)
      setWordCount(nextWordCount)
      setMode(nextMode)
      setSeed(nextSeed)
      const list = nextMode === 'quote-s' ? QUOTE_S : nextMode === 'quote-m' ? QUOTE_M : null
      setWords(list ? list[nextSeed % list.length].split(' ') : streamWords(nextSeed, nextWordCount))
      setTyped('')
      setPresses(0)
      setPageIndex(0)
      setStartedAt(null)
      setFinished(false)
      setPbInfo(null)
      setCon(null)
      setNow(Date.now())
      secRef.current = 0
      samplesRef.current = []
      missedRef.current = {}
      requestAnimationFrame(() => inputRef.current?.focus())
    },
    [duration, wordCount, mode],
  )

  useEffect(() => {
    if (startedAt === null || finished) return
    const id = setInterval(() => {
      const s = (Date.now() - startedAt) / 1000
      setNow(Date.now())
      const sec = Math.floor(s)
      if (sec > secRef.current) {
        secRef.current = sec
        samplesRef.current.push(s > 0 ? Math.round(correctCount(target, typed) / 5 / (s / 60)) : 0)
      }
      if (s >= duration) setFinished(true)
    }, 100)
    return () => clearInterval(id)
  }, [startedAt, finished, duration, typed, target])

  useEffect(() => {
    if (!finished) return
    const secs = Math.max(elapsedSecs, 0.5)
    const cc = correctCount(target, typed)
    const s = scoreRun({ correctChars: cc, keystrokes: presses, seconds: secs })
    setCon(consistencyFromSamples(samplesRef.current))
    const key = mode === 'time' ? `time-${words.length}w-${duration}s` : mode
    let all = {}
    try {
      all = JSON.parse(localStorage.getItem(PB_KEY) || '{}')
    } catch {
      all = {}
    }
    const prev = all[key] || null
    const best = !prev || s.wpm > prev.wpm
    if (best) {
      const next = { ...all, [key]: { wpm: s.wpm, acc: s.acc } }
      try {
        localStorage.setItem(PB_KEY, JSON.stringify(next))
      } catch {
        /* private mode: run still scores, PB just doesn't persist */
      }
    }
    setPbInfo({ isBest: best, pb: best ? { wpm: s.wpm, acc: s.acc } : prev })
  }, [finished])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function markStarted() {
    if (startedAt === null) {
      const t = Date.now()
      setStartedAt(t)
      setNow(t)
    }
  }

  function onChange(e) {
    if (finished) return
    const next = e.target.value
    if (next.length < typed.length) {
      if (next.length < pageStart) return
      setTyped(next)
      return
    }
    if (next.length > target.length) return
    markStarted()
    const added = next.slice(typed.length)
    for (let j = 0; j < added.length; j++) {
      const expected = target[typed.length + j]
      if (expected && expected !== ' ' && added[j] !== expected) {
        const k = expected.toLowerCase()
        missedRef.current[k] = (missedRef.current[k] || 0) + 1
      }
    }
    setPresses((p) => p + (next.length - typed.length))
    setTyped(next.length === target.length ? target : next)
    if (next.length === target.length) {
      setNow(Date.now())
      setFinished(true)
    } else if (next.length > pageStart + pageTarget.length && pageIndex < totalPages - 1) {
      setPageIndex(pageIndex + 1)
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Tab') {
      e.preventDefault()
      reset()
    }
  }

  const final = finished
    ? scoreRun({ correctChars: correctCount(target, typed), keystrokes: presses, seconds: Math.max(elapsedSecs, 0.5) })
    : null

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 p-4">
        <h1 className="brutal-card font-display bg-[var(--accent)] px-3 py-1 text-2xl tracking-tight">KEYSMASH</h1>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="mode">
          <span className="text-[11px] font-bold tracking-[0.2em]" aria-hidden="true">MODE</span>
          <button
            type="button"
            aria-pressed={mode === 'time'}
            onClick={() => reset(duration, wordCount, undefined, 'time')}
            className="brutal-btn px-3 py-2 text-sm font-bold"
          >
            TIME
          </button>
          <button
            type="button"
            aria-pressed={mode === 'quote-s'}
            onClick={() => reset(duration, wordCount, undefined, 'quote-s')}
            className="brutal-btn px-3 py-2 text-sm font-bold"
          >
            SHORT
          </button>
          <button
            type="button"
            aria-pressed={mode === 'quote-m'}
            onClick={() => reset(duration, wordCount, undefined, 'quote-m')}
            className="brutal-btn px-3 py-2 text-sm font-bold"
          >
            MED
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="durations">
          <span className="text-[11px] font-bold tracking-[0.2em]" aria-hidden="true">SECS</span>
          {DURATIONS.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={d === duration}
              onClick={() => reset(d, wordCount)}
              className="brutal-btn px-3 py-2 text-sm font-bold"
            >
              {d}s
            </button>
          ))}
        </div>
        {mode === 'time' && (
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="word counts">
          <span className="text-[11px] font-bold tracking-[0.2em]" aria-hidden="true">WORDS</span>
          {WORD_COUNTS.map((w) => (
            <button
              key={w}
              type="button"
              aria-pressed={w === wordCount}
              onClick={() => reset(duration, w)}
              className="brutal-btn px-3 py-2 text-sm font-bold"
            >
              {w}
            </button>
          ))}
        </div>
        )}
      </header>

      <main className="mx-auto w-full max-w-3xl p-4">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <div className="brutal-card font-display px-3 py-1 text-xl tabular-nums" aria-live="polite">
            {finished ? 0 : timeLeft}s
          </div>
          <div className="brutal-card px-3 py-1 text-sm tabular-nums" aria-live="polite">
            {startedAt && !finished ? `${live.wpm} wpm` : 'start typing'}
          </div>
          <div className="brutal-card px-3 py-1 text-sm tabular-nums" aria-live="polite">
            page {pageIndex + 1}/{totalPages} · word {wordsTyped}/{words.length}
          </div>
        </div>
        <div className="brutal-card mb-3 h-3 w-full overflow-hidden" role="progressbar" aria-valuenow={Math.round(progressPct)} aria-valuemin={0} aria-valuemax={100} aria-label="typing progress">
          <div className="brutal-progress-fill h-full" style={{ width: `${progressPct}%` }} />
        </div>

        {!finished ? (
          <div className="brutal-card relative min-h-[11rem] p-5 text-lg leading-9 md:text-xl" onClick={() => inputRef.current?.focus()}>
            <p aria-label="text to type">
              {(() => {
                const cursor = Math.min(typed.length, target.length)
                const start = target.lastIndexOf(' ', cursor - 1) + 1
                let end = target.indexOf(' ', cursor)
                if (end === -1) end = target.length
                return pageTarget.split('').map((ch, i) => {
                  const gi = pageStart + i
                  const t = typed[gi]
                  const isCurrent = gi === cursor
                  const inWord = gi >= start && gi < end && ch !== ' '
                  const cls =
                    t === undefined ? 'text-neutral-500' : t === ch ? 'text-black' : 'bg-[var(--danger)] text-white'
                  const hl = t === undefined && inWord ? 'bg-[var(--accent)]' : t !== undefined && t === ch && inWord ? 'bg-[var(--accent)]' : ''
                  return (
                    <span key={gi} className={`${cls} ${hl} ${isCurrent ? 'caret-block' : ''}`}>
                      {ch}
                    </span>
                  )
                })
              })()}
            </p>
            <input
              ref={inputRef}
              value={typed}
              onChange={onChange}
              onKeyDown={onKeyDown}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="typing input"
              className="absolute inset-0 h-full w-full cursor-text opacity-0"
            />
          </div>
        ) : (
          <div className="brutal-card bg-[var(--accent)] p-6 text-center">
            {pbInfo?.isBest && (
              <div className="font-display mx-auto mb-3 inline-block bg-black px-3 py-1 text-sm text-white">NEW BEST</div>
            )}
            <div className="font-display text-6xl tabular-nums">{final.wpm}</div>
            <div className="font-display mt-1 text-sm tracking-wide">WORDS PER MINUTE</div>
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm font-bold tabular-nums">
              <span className="brutal-card bg-white px-3 py-1">{final.acc}% ACC</span>
              <span className="brutal-card bg-white px-3 py-1">{con ?? 100}% CON</span>
              {mode === 'time' ? (
                <>
                  <span className="brutal-card bg-white px-3 py-1">{duration}s</span>
                  <span className="brutal-card bg-white px-3 py-1">{wordCount} WORDS</span>
                </>
              ) : (
                <span className="brutal-card bg-white px-3 py-1">{mode === 'quote-s' ? 'SHORT' : 'MED'} QUOTE</span>
              )}
              {pbInfo && !pbInfo.isBest && pbInfo.pb && (
                <span className="brutal-card bg-white px-3 py-1">PB {pbInfo.pb.wpm} WPM</span>
              )}
            </div>
            {(() => {
              const entries = Object.entries(missedRef.current)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 12)
              const top = entries.length ? entries[0][1] : 0
              return (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-sm font-bold" aria-label="missed keys">
                  <span className="text-[11px] tracking-[0.2em]" aria-hidden="true">MISSED</span>
                  {entries.length === 0 ? (
                    <span className="brutal-card bg-white px-3 py-1">CLEAN</span>
                  ) : (
                    entries.map(([ch, n]) => (
                      <span
                        key={ch}
                        className={`brutal-card px-2 py-1 tabular-nums ${n === top && top > 1 ? 'bg-[var(--danger)] text-white' : n >= 2 ? 'bg-white [box-shadow:4px_4px_0_var(--danger)]' : 'bg-white opacity-70'}`}
                      >
                        {ch} ×{n}
                      </span>
                    ))
                  )}
                </div>
              )
            })()}
            <button type="button" onClick={() => reset()} className="brutal-btn font-display mt-5 bg-white px-5 py-2">
              RETRY (TAB)
            </button>
          </div>
        )}

        <p className="mt-3 text-xs font-bold"><span className="brutal-kbd">TAB</span> restart · timer starts on first keystroke · backspace roams the page</p>
      </main>
    </div>
  )
}
