import { useEffect, useState } from 'react'
import { loadPublicProfile } from './profiles.js'
import ProfileLedger from './ProfileLedger.jsx'
import PublicProfileControls from './PublicProfileControls.jsx'
import Stats from './Stats.jsx'

const emptyProfile = { handle: null, run_count: 0, average_wpm: null, average_accuracy: null, recorded_typing_seconds: null, personal_bests: [] }

export default function OwnerProfile({ user, ownerProfile, onProfileChange, onBack, onRace, freshRun }) {
  const [state, setState] = useState({ loading: true })
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    setState({ loading: true })
    loadPublicProfile(null, controller.signal).then((profile) => {
      if (active) setState({ profile: profile || emptyProfile })
    }, () => {
      if (active) setState({ error: true })
    }).finally(() => clearTimeout(timeout))
    return () => { active = false; clearTimeout(timeout); controller.abort() }
  }, [user.id, freshRun, retry])

  const controls = <PublicProfileControls user={user} onProfileChange={onProfileChange} />
  const handle = ownerProfile?.handle || state.profile?.handle

  return <div className="owner-profile">
    <div className="page-heading profile-masthead"><div><p className="profile-kicker">KEYSMASH / Performance ledger</p><h1 tabIndex={-1}>{handle ? `@${handle}` : 'Your profile'}</h1></div><button className="brutal-btn" onClick={onBack}>Start typing</button></div>
    <ProfileLedger profile={state.profile} onRace={onRace}>
      {state.loading ? <p className="state-panel" role="status">Loading your profile...</p>
        : state.error ? <section className="state-panel" role="alert"><h2>Profile could not load.</h2><p>Your saved history is available below.</p><button className="brutal-btn" onClick={() => setRetry((n) => n + 1)}>Retry profile</button></section> : null}
      {controls}
    </ProfileLedger>
    <Stats user={user} onBack={onBack} freshRun={freshRun} embedded />
  </div>
}
