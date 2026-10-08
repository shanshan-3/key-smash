import { useEffect, useState } from 'react'
import { handleError, loadPublicProfile } from './profiles.js'

export default function PublicProfile({ handle, onBack }) {
  const [state, setState] = useState({ loading: true })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    let active = true
    setState({ loading: true })
    const request = handleError(handle) ? Promise.resolve(null) : loadPublicProfile(handle, controller.signal)
    request.then((profile) => {
      if (active) setState({ profile })
    }, () => {
      if (active) setState({ error: true })
    }).finally(() => clearTimeout(timeout))
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [handle, retry])

  return <div className="public-profile">
    <div className="page-heading"><div><h1 tabIndex={-1}>{state.profile ? `@${state.profile.handle}` : 'Public profile.'}</h1><p>All-time cloud stats.</p></div><button className="brutal-btn" onClick={onBack}>Start typing</button></div>
    {state.loading ? <p className="state-panel" role="status">Loading profile...</p>
      : state.error ? <section className="state-panel" role="alert"><h2>Profile could not load.</h2><p>Check your connection and try again.</p><button className="brutal-btn" onClick={() => setRetry((n) => n + 1)}>Retry profile</button></section>
        : !state.profile ? <section className="state-panel"><h2>Profile not found.</h2><p>This public profile is unavailable.</p></section>
          : <><dl className="history-summary"><div><dt>Cloud runs</dt><dd>{state.profile.run_count}</dd></div><div><dt>Average WPM</dt><dd>{state.profile.average_wpm ?? '—'}</dd></div><div><dt>Average accuracy</dt><dd>{state.profile.average_accuracy == null ? '—' : `${state.profile.average_accuracy}%`}</dd></div></dl>{Number(state.profile.run_count) === 0 && <p className="empty-copy">No cloud runs yet. Averages appear after the first saved run.</p>}<p className="muted">Includes every cloud-saved run across all modes. Local-only runs stay on their device.</p></>}
  </div>
}
