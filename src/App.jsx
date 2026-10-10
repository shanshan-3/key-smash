import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { isAuthRetryableFetchError } from '@supabase/supabase-js'
import { buildRunPayload, canDelete, consistencyFromSamples, correctCount, pbKey, rankMissed, sampleProgress, scoreRun, streamWords } from './engine.js'
import { ghostOutcome, ghostPace, ghostPosition, prepareGhost } from './ghosts.js'
import { isRacePath, raceRequest } from './raceRoutes.js'
import { formatMode, loadPbs, saveRun } from './history.js'
import Stats from './Stats.jsx'
import PublicProfile from './PublicProfile.jsx'
import OwnerProfile from './OwnerProfile.jsx'
import AccountMenu from './AccountMenu.jsx'
import { loadOwnerGhost, loadOwnerProfile, loadPublicGhost } from './profiles.js'
import PaceChart from './PaceChart.jsx'
import { callbackUrl, loginStorageAvailable, supabase } from './supabase.js'
import { customTarget, loadCustomSetup, prepareCustomText, saveCustomSetup } from './customPractice.js'

const DURATIONS = [15, 30, 60, 120]
const WORD_COUNTS = [25, 50, 60, 100]
const WORDS_PER_PAGE = 20
const idleRun = () => ({ typed: '', presses: 0, pageIndex: 0, startedAt: null, now: Date.now(), result: null })
const currentPage = () => isRacePath(window.location.pathname) ? 'race' : window.location.pathname === '/profile' ? 'owner' : window.location.pathname === '/stats' ? 'stats' : window.location.pathname.startsWith('/u/') ? 'profile' : 'type'

export default function App() {
  const [rememberedSetup] = useState(loadCustomSetup)
  const [duration, setDuration] = useState(60)
  const [wordCount, setWordCount] = useState(60)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1e9))
  const [wordSetVersion, setWordSetVersion] = useState(1)
  const [textSource, setTextSource] = useState('words')
  const [customDraft, setCustomDraft] = useState(rememberedSetup.text)
  const [customText, setCustomText] = useState(rememberedSetup.text)
  const [customDuration, setCustomDuration] = useState(rememberedSetup.duration)
  const [customSetupStatus, setCustomSetupStatus] = useState(rememberedSetup.warning)
  const [customError, setCustomError] = useState('')
  const standardWords = useMemo(() => streamWords(seed, wordCount, wordSetVersion), [seed, wordCount, wordSetVersion])
  const [run, setRun] = useState(idleRun)
  const runRef = useRef(run)
  const samplesRef = useRef([])
  const missedRef = useRef({})
  const [ghost, setGhost] = useState(null)
  const [raceState, setRaceState] = useState({})
  const [raceRetry, setRaceRetry] = useState(0)
  const cloudRaceActive = useRef(false)
  const [localGhostUnavailable, setLocalGhostUnavailable] = useState(false)
  const [focused, setFocused] = useState(false)
  const [caret, setCaret] = useState(null)
  const [user, setUser] = useState(null)
  const [authOpen, setAuthOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [authMsg, setAuthMsg] = useState('')
  const [authPending, setAuthPending] = useState(false)
  const [authLoading, setAuthLoading] = useState(() => !!supabase && window.location.pathname === '/auth/callback')
  const [authRestoring, setAuthRestoring] = useState(!!supabase)
  const [ownerProfile, setOwnerProfile] = useState(null)
  const ownerProfileVersion = useRef(0)
  const [route, setRoute] = useState(() => window.location.pathname + window.location.hash)
  const [page, setPage] = useState(currentPage)
  const request = raceRequest(route.split('#')[0])
  const publicRace = page === 'race' && !request.owner
  const raceAccount = publicRace ? null : user?.id
  const raceAuthPending = !publicRace && (authRestoring || authLoading)
  const typingPage = page === 'type' || page === 'race'
  const custom = textSource === 'custom' && page !== 'race'
  const target = custom ? customTarget(customText, run.typed.length, run.pageIndex) : standardWords.join(' ')
  const words = custom ? target.split(' ') : standardWords
  const [publicHandle, setPublicHandle] = useState(() => window.location.pathname.slice(3))
  const [freshRun, setFreshRun] = useState(0)
  const [saveStatus, setSaveStatus] = useState('')
  const inputRef = useRef(null)
  const cardRef = useRef(null)
  const resultRef = useRef(null)
  const dialogRef = useRef(null)
  const authTriggerRef = useRef(null)
  const totalPages = Math.ceil(words.length / WORDS_PER_PAGE)
  const pageStart = run.pageIndex === 0 ? 0 : words.slice(0, run.pageIndex * WORDS_PER_PAGE).join(' ').length + 1
  const pageWords = words.slice(run.pageIndex * WORDS_PER_PAGE, (run.pageIndex + 1) * WORDS_PER_PAGE)
  const elapsed = run.startedAt === null ? 0 : Math.min(duration, (run.now - run.startedAt) / 1000)
  const live = scoreRun({ correctChars: correctCount(target, run.typed), keystrokes: run.presses, seconds: Math.max(elapsed, 0.5) })
  const active = run.startedAt !== null && !run.result
  const pb = custom ? null : loadPbs()[pbKey(wordCount, duration)] || null
  const progress = custom ? (elapsed / duration) * 100 : Math.min(100, run.typed.length / target.length * 100)
  const completedWords = run.result && run.typed.length === target.length ? wordCount : (run.typed.match(/ /g) || []).length

  function updateRun(next) {
    runRef.current = next
    setRun(next)
  }

  function reset(nextDuration = duration, nextCount = wordCount, nextSeed = ghost?.seed ?? Math.floor(Math.random() * 1e9), nextGhost = ghost) {
    setDuration(nextDuration)
    setWordCount(nextCount)
    setSeed(nextSeed)
    updateRun(idleRun())
    samplesRef.current = []
    missedRef.current = {}
    setGhost(nextGhost)
    setWordSetVersion(nextGhost?.word_set_version ?? 1)
    setLocalGhostUnavailable(false)
    setSaveStatus('')
    setCaret(null)
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  function finish(
    typed = runRef.current.typed,
    presses = runRef.current.presses,
    at = Date.now(),
  ) {
    const current = runRef.current;
    if (current.result || current.startedAt === null) return;
    const seconds = Math.max(
      0.001,
      Math.min(duration, (at - current.startedAt) / 1000),
    );
    const correctChars = correctCount(target, typed);
    const score = scoreRun({ correctChars, keystrokes: presses, seconds });
    const samples = sampleProgress(samplesRef.current, {
      seconds,
      correctChars,
      keystrokes: presses,
    });
    const entry = {
      ...(custom ? {
        ...score,
        mode: `custom-${duration}s`,
        duration_s: duration,
        missed_keys: { ...missedRef.current },
        samples,
        elapsed_s: seconds,
      } : buildRunPayload({
        ...score,
        duration,
        wordCount,
        missed: { ...missedRef.current },
        seed,
        samples,
        elapsed: seconds,
        wordSetVersion,
      })),
      id: crypto.randomUUID(),
      created_at: new Date(at).toISOString(),
      raw: Math.round(presses / 5 / (seconds / 60)),
      consistency: consistencyFromSamples(samples.map((sample) => sample.net)),
    };
    const saved = saveRun(entry);
    updateRun({
      ...current,
      typed,
      presses,
      now: current.startedAt + seconds * 1000,
      result: { ...entry, ...saved },
    });
    setFreshRun((n) => n + 1);
    setSaveStatus(
      saved.persisted
        ? "Saved on this device."
        : "Browser storage is unavailable. This run is kept for this session only.",
    );
    if (!custom && supabase && user) {
      const localStatus = saved.persisted
        ? "Saved on this device."
        : "Kept for this session only.";
      const {
        id: _id,
        created_at: _date,
        raw: _raw,
        consistency: _consistency,
        ...payload
      } = entry;
      setSaveStatus(`${localStatus} Saving to cloud...`);
      supabase
        .from("results")
        .insert({ ...payload, user_id: user.id })
        .abortSignal(AbortSignal.timeout(10000))
        .then(
          ({ error }) => {
            if (runRef.current.result?.id === entry.id)
              setSaveStatus(
                error
                  ? `${localStatus} Cloud save failed. Check your connection and database setup.`
                  : `${localStatus} Cloud copy saved.`,
              );
            if (!error) setFreshRun((n) => n + 1);
          },
          () => {
            if (runRef.current.result?.id === entry.id)
              setSaveStatus(
                `${localStatus} Cloud save failed. Check your connection.`,
              );
          },
        );
    }
  }

  useEffect(() => {
    if (!typingPage || run.startedAt === null || run.result) return
    const timer = setInterval(() => {
      const current = runRef.current
      const at = Date.now()
      const seconds = Math.min(duration, (at - current.startedAt) / 1000)
      if (seconds >= duration) { finish(current.typed, current.presses, at); return }
      if (Math.floor(seconds) > Math.floor(samplesRef.current.at(-1)?.second || 0)) {
        samplesRef.current = sampleProgress(samplesRef.current, { seconds, correctChars: correctCount(target, current.typed), keystrokes: current.presses })
      }
      updateRun({ ...current, now: at })
    }, 100)
    return () => clearInterval(timer)
  }, [run.startedAt, run.result, duration, target, user?.id, typingPage])

  useLayoutEffect(() => {
    const card = cardRef.current
    if (!card || !focused || run.result || !typingPage) return
    function measure() {
      const span = card.querySelector('[data-caret]')
      if (!span) return
      const c = card.getBoundingClientRect()
      const r = span.getBoundingClientRect()
      const next = { x: r.left - c.left - card.clientLeft, y: r.top - c.top - card.clientTop, h: r.height }
      setCaret((previous) => previous?.x === next.x && previous?.y === next.y && previous?.h === next.h ? previous : next)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(card)
    document.fonts.ready.then(measure)
    return () => observer.disconnect()
  }, [run.typed, run.pageIndex, run.result, focused, page, target])

  useEffect(() => { if (run.result && typingPage) resultRef.current?.focus() }, [run.result, page])

  useEffect(() => {
    const onPop = () => {
      setPage(currentPage())
      setRoute(window.location.pathname + window.location.hash)
      setPublicHandle(window.location.pathname.slice(3))
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener('hashchange', onPop)
    return () => { window.removeEventListener('popstate', onPop); window.removeEventListener('hashchange', onPop) }
  }, [])

  useEffect(() => {
    if (!supabase) return
    let mounted = true
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      setUser(data?.session?.user || null)
      setAuthRestoring(false)
      if (error) {
        setAuthMsg('Could not restore your login. Check your connection and try again.')
        setAuthOpen(true)
      }
    }, () => { if (mounted) { setAuthRestoring(false); setAuthMsg('Could not connect to login. Typing still works on this device.'); setAuthOpen(true) } })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => { if (mounted) { setUser(session?.user || null); setAuthRestoring(false) } })
    return () => { mounted = false; data.subscription.unsubscribe() }
  }, [])

  const updateOwnerProfile = useCallback((profile) => {
    ownerProfileVersion.current++
    setOwnerProfile({ ...profile, userId: user?.id })
  }, [user?.id])

  useEffect(() => {
    if (!user || !supabase) { setOwnerProfile(null); return }
    let active = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const version = ownerProfileVersion.current
    loadOwnerProfile(user.id, controller.signal).then((profile) => {
      if (active && version === ownerProfileVersion.current) updateOwnerProfile(profile || { handle: null, published: false })
    }, () => { if (active && version === ownerProfileVersion.current) setOwnerProfile(null) }).finally(() => clearTimeout(timeout))
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [user?.id, updateOwnerProfile])

  useEffect(() => {
    if (authRestoring || authLoading) return
    const redirect = page === 'stats' && user ? `/profile${window.location.hash}` : (page === 'owner' || (page === 'race' && !publicRace)) && !user ? '/stats' : null
    if (redirect) {
      window.history.replaceState({}, '', redirect)
      setRoute(redirect)
      setPage(currentPage())
      return
    }
    const frame = requestAnimationFrame(() => {
      const heading = page === 'owner' && window.location.hash === '#history' ? document.getElementById('history') : document.querySelector('main h1')
      heading?.focus()
      if (heading) heading.scrollIntoView({ block: 'start' })
    })
    return () => cancelAnimationFrame(frame)
  }, [route, page, user?.id, authRestoring, authLoading])

  useEffect(() => {
    if (page !== 'race') {
      if (cloudRaceActive.current) {
        reset(textSource === "custom" ? customDuration : duration, wordCount, Math.floor(Math.random() * 1e9), null)
        setRaceState({})
        cloudRaceActive.current = false
      }
      return
    }
    cloudRaceActive.current = true
    if (raceAuthPending || (!publicRace && !raceAccount)) return
    let active = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    const { handle, mode, valid } = raceRequest(window.location.pathname)
    setRaceState({ route, userId: raceAccount, loading: true })
    setGhost(null)
    updateRun(idleRun())
    const lookup = !valid ? Promise.resolve(null) : publicRace ? loadPublicGhost(handle, mode, controller.signal) : loadOwnerGhost(mode, controller.signal)
    lookup.then((data) => {
      if (!active) return
      const selected = prepareGhost(data)
      if (!selected || selected.mode !== mode || (publicRace && selected.handle !== handle)) { setRaceState({ route, userId: raceAccount, unavailable: true }); return }
      reset(selected.duration_s, selected.word_count, selected.seed, selected)
      setRaceState({ route, userId: raceAccount, ready: true })
    }, () => { if (active) setRaceState({ route, userId: raceAccount, error: true }) }).finally(() => clearTimeout(timeout))
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [page, route, raceAccount, raceAuthPending, raceRetry])

  useEffect(() => {
    if (!authLoading || !supabase) return
    let mounted = true
    const complete = (message) => {
      if (!mounted) return
      window.history.replaceState({}, '', '/')
      setPage('type')
      setRoute('/')
      setAuthLoading(false)
      if (message) { setAuthMsg(message); setAuthOpen(true) }
    }
    const failureMessage = (error) => isAuthRetryableFetchError(error)
      ? 'Login could not connect. Check your connection and try again.'
      : 'Login was cancelled or the link expired. Try again.'
    // Supabase consumes callback credentials during initialization, once per client.
    supabase.auth.initialize().then(async ({ error }) => {
      if (error) {
        complete(failureMessage(error))
        return
      }
      const { data, error: sessionError } = await supabase.auth.getSession()
      complete(sessionError
        ? failureMessage(sessionError)
        : !data?.session ? 'Login link expired. Request a new link.' : '')
    }).catch(() => complete('Login failed. Check your connection and try again.'))
    return () => { mounted = false }
  }, [authLoading])

  useEffect(() => {
    const dialog = dialogRef.current
    if (authOpen && dialog && !dialog.open) {
      authTriggerRef.current = document.activeElement
      dialog.showModal()
    } else if (!authOpen && dialog?.open) {
      dialog.close()
      authTriggerRef.current?.focus?.()
    }
  }, [authOpen])

  useEffect(() => {
    function onKey(e) {
      if (!typingPage || (page === 'race' && (!raceState.ready || raceState.route !== route || raceState.userId !== raceAccount)) || authOpen || runRef.current.result || e.ctrlKey || e.metaKey || e.altKey) return
      if (document.activeElement !== document.body || e.key.length !== 1) return
      e.preventDefault()
      inputRef.current?.focus()
      acceptText(runRef.current.typed + e.key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [page, route, raceAccount, raceState.ready, authOpen, duration, wordCount, target])

  function navigate(next) {
    const path = next.startsWith('/') ? next : next === 'stats' ? (user ? '/profile#history' : '/stats') : '/'
    if (path === '/') reset(textSource === 'custom' ? customDuration : duration, wordCount, Math.floor(Math.random() * 1e9), null)
    window.history.pushState({}, '', path)
    setPage(currentPage())
    setRoute(path)
    setPublicHandle(window.location.pathname.slice(3))
    setAuthOpen(false)
    requestAnimationFrame(() => {
      const heading = path.endsWith('#history') ? document.getElementById('history') : document.querySelector('main h1')
      heading?.focus()
      if (!path.endsWith('#history')) window.scrollTo(0, 0)
    })
  }

  function acceptText(next) {
    const current = runRef.current;
    if (current.result || authOpen || (custom && !customText)) return;
    const nextTarget = custom ? customTarget(customText, next.length, current.pageIndex) : target;
    const nextWords = custom ? nextTarget.split(" ") : words;
    const at = Date.now();
    if (
      current.startedAt !== null &&
      at - current.startedAt >= duration * 1000
    ) {
      finish();
      return;
    }
    const start =
      current.pageIndex === 0
        ? 0
        : words.slice(0, current.pageIndex * WORDS_PER_PAGE).join(" ").length +
          1;
    if (next.length < current.typed.length) {
      if (
        !current.typed.startsWith(next) ||
        !canDelete({ cursor: next.length, pageStart: start })
      )
        return;
      updateRun({
        ...current,
        typed: next,
        presses: current.presses + 1,
        now: at,
      });
      return;
    }
    if (
      next.length <= current.typed.length ||
      (!custom && next.length > target.length) ||
      !next.startsWith(current.typed)
    )
      return;
    const added = next.slice(current.typed.length);
    for (let i = 0; i < added.length; i++) {
      const expected = nextTarget[current.typed.length + i];
      if (added[i] !== expected) {
        const key = expected === " " ? "space" : expected.toLowerCase();
        missedRef.current[key] = (missedRef.current[key] || 0) + 1;
      }
    }
    let pageIndex = current.pageIndex;
    while (
      pageIndex < Math.ceil(nextWords.length / WORDS_PER_PAGE) - 1 &&
      next.length >=
        nextWords.slice(0, (pageIndex + 1) * WORDS_PER_PAGE).join(" ").length + 1
    )
      pageIndex++;
    const updated = {
      ...current,
      typed: next,
      presses: current.presses + added.length,
      startedAt: current.startedAt ?? at,
      now: at,
      pageIndex,
    };
    updateRun(updated);
    if (!custom && next.length === target.length) finish(next, updated.presses, at);
  }

  function applyCustomText() {
    const prepared = prepareCustomText(customDraft);
    setCustomError(prepared.error || "");
    if (prepared.error) return;
    setCustomText(prepared.text);
    setCustomDuration(duration);
    setCustomSetupStatus(saveCustomSetup(prepared.text, duration));
    reset(duration, wordCount, Math.floor(Math.random() * 1e9), null);
  }

  function rematch() {
    if (ghost) { reset(); return }
    const selected = prepareGhost(pb && { ...pb, mode: pb.mode || pbKey(wordCount, duration), duration_s: pb.duration_s ?? duration, word_count: pb.word_count ?? wordCount })
    if (!selected) { setLocalGhostUnavailable(true); return }
    reset(selected.duration_s, selected.word_count, selected.seed, selected)
  }

  async function login(kind) {
    if (!supabase || authPending) return
    setAuthPending(true)
    setAuthMsg('')
    try {
      const { error } = kind === 'google'
        ? await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: callbackUrl() } })
        : await supabase.auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: callbackUrl() } })
      setAuthMsg(error ? `Login failed: ${error.message}` : kind === 'email' ? 'Check your inbox for the login link.' : 'Opening Google login...')
    } catch { setAuthMsg('Login could not connect. Check your connection and try again.') }
    finally { setAuthPending(false) }
  }

  async function logout() {
    const { error } = await supabase.auth.signOut().catch(() => ({ error: true }))
    if (error) { setAuthMsg('Logout failed. Check your connection and try again.'); setAuthOpen(true) }
    else { setUser(null); setOwnerProfile(null); navigate('type') }
  }

  const challengedHandle = publicRace && ghost?.handle ? `@${ghost.handle}` : null
  const result = run.result
  const cursor = run.typed.length
  const ghostCursor = ghost ? Math.floor(ghostPosition(ghost, elapsed)) : -1
  const characterDelta = ghost ? correctCount(target, run.typed) - ghostCursor : 0
  const pageEnd = pageStart + pageWords.join(' ').length
  const raceReady = page !== 'race' || (raceState.ready && raceState.route === route && raceState.userId === raceAccount)
  let charOffset = pageStart

  if (authLoading || ((page === 'owner' || (page === 'race' && !publicRace) || page === 'stats') && (authRestoring || ((page === 'owner' || page === 'race') && !user) || (page === 'stats' && user)))) return <main className="app-main"><p className="state-panel" role="status">Connecting your account...</p></main>

  return (
    <div className="app-shell">
      <a href="#main" className="skip-link">Skip to content</a>
      <header className="masthead">
        <button className="wordmark" onClick={() => navigate('type')} aria-label="KEYSMASH home"><img src="/favicon.png" alt="" width="40" height="40" />KEYSMASH<span aria-hidden="true">.</span></button>
        <nav aria-label="Main navigation"><button aria-current={page === 'type' ? 'page' : undefined} onClick={() => navigate('type')}>Type</button>{user ? <AccountMenu current={page === 'owner'} route={route} profile={ownerProfile?.userId === user.id ? ownerProfile : null} onNavigate={navigate} onLogout={logout} /> : <><button aria-current={page === 'stats' ? 'page' : undefined} onClick={() => navigate('stats')}>Stats</button>{supabase && <button onClick={() => { setAuthMsg(''); setAuthOpen(true) }}>Log in</button>}</>}</nav>
      </header>
      <main id="main" className="app-main" tabIndex={-1}>
        {page === 'owner' ? <OwnerProfile key={user.id} user={user} ownerProfile={ownerProfile?.userId === user.id ? ownerProfile : null} onProfileChange={updateOwnerProfile} onBack={() => navigate('type')} onRace={(mode) => navigate(`/profile/race/${mode}`)} freshRun={freshRun} /> : page === 'stats' ? <Stats user={user} onLogin={() => setAuthOpen(true)} onBack={() => navigate('type')} freshRun={freshRun} /> : page === 'profile' ? <PublicProfile key={publicHandle} handle={publicHandle} onBack={() => navigate('type')} onRace={(handle, mode) => navigate(`/u/${handle}/race/${mode}`)} /> : !raceReady ? <><div className="page-heading"><h1 tabIndex={-1}>{publicRace ? 'Public ghost race.' : 'Your ghost race.'}</h1><button className="brutal-btn" onClick={() => navigate(publicRace ? request.valid ? `/u/${request.handle}` : '/' : '/profile')}>{publicRace && !request.valid ? 'Start typing' : 'Back to profile'}</button></div>{raceState.route !== route || raceState.loading ? <p className="state-panel" role="status">Loading ghost...</p> : raceState.error ? <section className="state-panel" role="alert"><h2>Ghost could not load.</h2><p>Check your connection and try again.</p><button className="brutal-btn" onClick={() => setRaceRetry((n) => n + 1)}>Retry ghost</button></section> : <section className="state-panel"><h2>Ghost unavailable.</h2><p>This record cannot be raced.</p></section>}</> : <>
          <div className={`test-workspace${result ? ' is-result' : ''}`}>
          <div className="test-console">
          <div className="test-heading"><h1 tabIndex={-1}>{challengedHandle ? `Race ${challengedHandle}.` : ghost ? 'Race your best.' : 'Less talk. More type.'}</h1><p>{ghost ? `${formatMode(ghost.mode)} / Target: ${ghost.wpm} WPM, ${ghost.accuracy}% accuracy` : 'Beat the clock. Then beat yourself.'}</p></div>
          <div className="test-settings">
            {!ghost && page !== "race" && <fieldset>
                    <legend>Text source</legend>
                    <div className="segmented">
                      {["words", "custom"].map((source) => <button key={source} aria-pressed={textSource === source} onClick={() => {
                        setTextSource(source);
                        reset(source === "custom" ? customDuration : duration, wordCount, Math.floor(Math.random() * 1e9), null);
                      }}>{source === "custom" ? "Custom" : "Words"}</button>)}
                    </div>
                  </fieldset>}
            <fieldset disabled={(active && !custom) || !!ghost}><legend>Time limit</legend><div className="segmented">{DURATIONS.map((d) => <button key={d} aria-pressed={d === duration} onClick={() => {
                if (custom) {
                  setCustomDuration(d)
                  setCustomSetupStatus(saveCustomSetup(customText, d))
                }
                reset(d, wordCount, Math.floor(Math.random() * 1e9), null)
              }}>{d}<span>s</span></button>)}</div></fieldset>
            {!custom && <fieldset disabled={active || !!ghost}><legend>Word count</legend><div className="segmented">{WORD_COUNTS.map((count) => <button key={count} aria-pressed={count === wordCount} onClick={() => reset(duration, count, Math.floor(Math.random() * 1e9), null)}>{count}</button>)}</div></fieldset>}
            <p className="settings-note">{custom ? 'Custom practice repeats until the timer ends. Scores stay on this device.' : ghost ? 'Race text and settings are locked.' : active ? 'Finish or restart to change modes.' : 'Finish the words or run out the clock.'}</p>
          </div>
          {custom && <div className="custom-editor">
                  <label htmlFor="custom-text">Your practice text</label>
                  <textarea id="custom-text" value={customDraft} onChange={(e) => setCustomDraft(e.target.value)} aria-describedby="custom-text-help custom-text-count" aria-invalid={!!customError} />
                  <p id="custom-text-help">Up to 2,000 entered characters, including whitespace. Emoji may count as two characters (UTF-16). Applying text trims and joins whitespace into single spaces.</p>
                  <p id="custom-text-count">{customDraft.length.toLocaleString()} / 2,000 characters</p>
                  {customError && <p role="alert">{customError}</p>}
                  <p role="status" aria-live="polite">{customSetupStatus}</p>
                  <button className="brutal-btn primary" onClick={applyCustomText}>Use this text</button>
                </div>}
          {!result && <div className="live-strip">
              <div className="clock"><strong>{Math.max(0, Math.ceil(duration - elapsed))}</strong><span>seconds left</span></div>
              <dl className="live-metrics"><div><dt>WPM</dt><dd>{active ? live.wpm : '0'}</dd></div><div><dt>Accuracy</dt><dd>{live.acc}<small>%</small></dd></div></dl>
              <div className="page-position"><span>Page {run.pageIndex + 1}{!custom && ` / ${totalPages}`}</span><strong>{completedWords}{!custom && ` / ${wordCount}`} words</strong></div>
            </div>}
          </div>
          {!result ? <div className="test-stage">
            <div className={`typing-card ${focused ? 'is-focused' : ''}`} ref={cardRef}>
              <div className="typing-text" aria-label="Text to type" style={{ filter: focused ? undefined : 'blur(4px)' }}>
                {ghost && ghostCursor < pageStart && <p className="ghost-edge">Ghost is {pageStart - ghostCursor} characters before this page.</p>}
                {custom && !customText && <p>Add text above, then choose Use this text.</p>}
                {pageWords.map((word, wi) => {
                  const offset = charOffset
                  charOffset += word.length + 1
                  let characterOffset = offset
                  return <span className={`typing-word ${cursor >= offset && cursor <= offset + word.length ? 'current-word' : ''}`} key={offset}>{[...word, ...(wi < pageWords.length - 1 ? [' '] : [])].map((ch) => {
                    const index = characterOffset
                    characterOffset += ch.length
                    const typed = run.typed.length <= index ? undefined : run.typed.slice(index, index + ch.length)
                    return <span key={index} data-caret={index === cursor || undefined} className={`${typed === undefined ? 'untyped' : typed === ch ? 'correct' : 'incorrect'} ${index === ghostCursor ? 'ghost-char' : ''}`}>{ch}</span>
                  })}{wi === pageWords.length - 1 && (cursor === offset + word.length || ghostCursor === offset + word.length) && <span data-caret={cursor === offset + word.length || undefined} className={ghostCursor === offset + word.length ? 'ghost-char' : ''} aria-hidden="true">&nbsp;</span>}</span>
                })}
                {ghost && ghostCursor > pageEnd && <p className="ghost-edge">Ghost is {ghostCursor - pageEnd} characters beyond this page.</p>}
              </div>
              <textarea ref={inputRef} disabled={custom && !customText} value={run.typed} onChange={(e) => { acceptText(e.target.value); e.target.setSelectionRange(e.target.value.length, e.target.value.length) }} onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); reset() }
                if (e.key === 'Escape') { e.preventDefault(); inputRef.current.blur(); document.querySelector('nav button')?.focus() }
                if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) e.preventDefault()
              }} onPaste={(e) => e.preventDefault()} onDrop={(e) => e.preventDefault()} onFocus={(e) => { setFocused(true); e.target.setSelectionRange(run.typed.length, run.typed.length) }} onBlur={() => setFocused(false)} onSelect={(e) => { if (e.target.selectionStart !== e.target.value.length) e.target.setSelectionRange(e.target.value.length, e.target.value.length) }} autoCapitalize="off" autoComplete="off" autoCorrect="off" spellCheck={false} aria-label="Typing input" aria-describedby="typing-help" className="typing-input" />
              {!focused && <div className="focus-cover" aria-hidden="true"><span>{custom && !customText ? "Apply your text to begin" : "Click here or press a key to type"}</span></div>}
              {focused && caret && <div className="smooth-caret" aria-hidden="true" style={{ transform: `translate(${caret.x}px, ${caret.y}px)`, height: caret.h }} />}
              <div className="test-progress" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Typing progress"><div style={{ width: `${progress}%` }} /></div>
            </div>
            <div className="test-bottom"><p id="typing-help"><kbd>Tab</kbd> restart <span>/</span> <kbd>Esc</kbd> leave test<br /><span className="muted">Timer starts on your first key. Backspace stays on this page.</span></p><button className="brutal-btn" onClick={() => reset()}>Restart test</button></div>
            <div className="ghost-row">{custom ? <p className="muted">Custom practice does not count toward personal bests or ghosts.</p> : ghost ? <><p>Target: <strong>{ghost.wpm} WPM</strong>. <strong>{Math.abs(characterDelta)} characters {characterDelta >= 0 ? 'ahead' : 'behind'}</strong>. Ghost position {ghostCursor} / {target.length}.{ghost.trace.length === 0 && ' Average-pace replay.'}</p><button className="text-button" onClick={() => navigate('type')}>Leave race</button></> : pb ? <><p>Your best in this mode: <strong>{pb.wpm} WPM</strong></p><button className="text-button" onClick={rematch}>Race your best</button></> : <p className="muted">Complete this mode to set a best and unlock your ghost.</p>}</div>
            {localGhostUnavailable && <p role="status">Ghost unavailable. This record cannot be raced.</p>}
          </div> : <section className="results" ref={resultRef} tabIndex={-1} aria-label="Test results" onKeyDown={(e) => { if (e.key === 'Tab' && !e.shiftKey && e.target === e.currentTarget) { e.preventDefault(); reset() } }}>
            <div className="result-heading"><h2>That's your run.</h2>{result.isBest && <span className="best-stamp">New personal best</span>}</div>
            {ghost && <div className="ghost-result"><h3>{ghostOutcome(result, ghost)}</h3><p>{challengedHandle && `Challenged ${challengedHandle}. `}Your {result.wpm} WPM / {result.acc}% accuracy versus ghost {ghost.wpm} WPM / {ghost.accuracy}% accuracy.</p><p>{result.wpm - ghost.wpm >= 0 ? '+' : ''}{result.wpm - ghost.wpm} WPM / {Number((result.acc - ghost.accuracy).toFixed(1)) >= 0 ? '+' : ''}{Number((result.acc - ghost.accuracy).toFixed(1))} accuracy points</p></div>}
            <div className="result-hero"><div><span className="metric-label">Words per minute</span><strong>{result.wpm}</strong></div><div><span className="metric-label">Accuracy</span><strong>{result.acc}<small>%</small></strong></div></div>
            <PaceChart samples={result.samples} comparison={ghost ? ghostPace(ghost) : result.previous?.samples || []} comparisonLabel={ghost ? 'Challenged ghost' : 'Previous best'} />
            {!custom && !ghost && !result.previous?.samples?.length && <p className="comparison-note">{result.previous ? 'Your earlier best has no pace samples. Future bests will include a comparison curve.' : 'First recorded run in this mode. Your next run can compare against this curve.'}</p>}
            <dl className="result-details"><div><dt>Raw WPM</dt><dd>{result.raw}</dd></div><div><dt>Net WPM</dt><dd>{result.wpm}</dd></div><div><dt>Consistency</dt><dd>{result.consistency}%</dd></div><div><dt>Elapsed</dt><dd>{Number(result.elapsed_s.toFixed(2))}s</dd></div></dl>
            <div className="missed-keys"><h3>Missed keys</h3>{rankMissed(result.missed_keys).length ? <ul>{rankMissed(result.missed_keys).map(([key, count]) => <li key={key}><kbd>{key}</kbd><span>{count} {count === 1 ? 'miss' : 'misses'}</span></li>)}</ul> : <p>No missed keys in this run.</p>}</div>
            <div className="result-actions"><button className="brutal-btn primary" onClick={() => reset()}>{ghost ? 'Rematch' : 'Type again'} <kbd>Tab</kbd></button>{!ghost && pb && <button className="brutal-btn" onClick={rematch}>Race your best</button>}{ghost && <button className="brutal-btn" onClick={() => navigate('type')}>Leave race</button>}<button className="text-button" onClick={() => navigate('stats')}>View history</button></div>
            <div className="result-meta"><span>{formatMode(result.mode)}</span>{ghost && <span>{result.wpm - ghost.wpm >= 0 ? '+' : ''}{result.wpm - ghost.wpm} WPM vs ghost</span>}<p role="status">{saveStatus}</p></div>
          </section>}
          </div>
        </>}
      </main>
      <footer className="app-footer"><span>KEYSMASH / A typing test.</span><span>{user ? `Signed in as ${user.email}${loginStorageAvailable ? '' : ' (this visit only)'}` : 'No account needed. Just a keyboard.'}</span></footer>
      {supabase && <dialog ref={dialogRef} className="auth-dialog" aria-labelledby="auth-heading" onCancel={() => setAuthOpen(false)} onClick={(e) => { if (e.target === dialogRef.current) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) setAuthOpen(false) } }}>
        <div className="section-heading"><h2 id="auth-heading">Save your pace.</h2><button className="text-button" onClick={() => setAuthOpen(false)}>Close</button></div>
        <p>Log in for cloud history. Your tests always work without an account.</p>
        {!loginStorageAvailable && <p role="status">This browser cannot remember your login. You can sign in for this visit.</p>}
        <button className="brutal-btn" disabled={authPending} onClick={() => login('google')}>Continue with Google</button>
        <form onSubmit={(e) => { e.preventDefault(); login('email') }}><label htmlFor="login-email">Email address</label><input id="login-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /><button className="brutal-btn primary" disabled={authPending}>{authPending ? 'Connecting...' : 'Send login link'}</button></form>
        {authMsg && <p role="status">{authMsg}</p>}
      </dialog>}
    </div>
  )
}
