import { useEffect, useState } from 'react'
import { handleError, loadPublicProfile } from './profiles.js'
import ProfileLedger from './ProfileLedger.jsx'

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
    <div className="page-heading profile-masthead"><div><p className="profile-kicker">KEYSMASH / Performance ledger</p><h1 tabIndex={-1}>{state.profile ? `@${state.profile.handle}` : 'Public profile.'}</h1></div><button className="brutal-btn" onClick={onBack}>Start typing</button></div>
    {state.loading ? <p className="state-panel" role="status">Loading profile...</p>
      : state.error ? <section className="state-panel" role="alert"><h2>Profile could not load.</h2><p>Check your connection and try again.</p><button className="brutal-btn" onClick={() => setRetry((n) => n + 1)}>Retry profile</button></section>
        : !state.profile ? <section className="state-panel"><h2>Profile not found.</h2><p>This public profile is unavailable.</p></section>
          : <ProfileLedger profile={state.profile} />}
  </div>
}
