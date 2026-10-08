import { useEffect, useRef, useState } from 'react'
import { handleError, loadOwnerProfile, normalizeHandle, profileError, savePublication } from './profiles.js'

export default function PublicProfileControls({ user }) {
  const [profile, setProfile] = useState(null)
  const [handle, setHandle] = useState('')
  const [loading, setLoading] = useState(true)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)
  const active = useRef(false)
  const mutation = useRef(null)
  const url = profile?.handle ? `${window.location.origin}/u/${profile.handle}` : ''
  const invalid = handle ? handleError(handle) : ''

  useEffect(() => {
    active.current = true
    let cancelled = false
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000)
    setLoading(true)
    setError('')
    loadOwnerProfile(user.id, controller.signal).then((data) => {
      if (cancelled) return
      setProfile(data || { handle: null, published: false })
      setHandle(data?.handle || '')
    }, (failure) => {
      if (!cancelled) setError(profileError(failure))
    }).finally(() => {
      clearTimeout(timeout)
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true; active.current = false; clearTimeout(timeout); controller.abort(); mutation.current?.abort() }
  }, [user.id, retry])

  async function publish(published) {
    if (mutation.current) return
    const nextHandle = profile.handle || normalizeHandle(handle)
    const validation = handleError(nextHandle)
    if (validation) { setError(validation); return }
    const controller = new AbortController()
    mutation.current = controller
    const timeout = setTimeout(() => controller.abort(), 10000)
    setPending(true)
    setError('')
    setMessage('')
    try {
      const data = await savePublication(user.id, nextHandle, published, controller.signal)
      if (active.current) {
        setProfile(data)
        setHandle(data.handle)
        setMessage(published ? 'Profile published. Anyone with the link can view your stats.' : 'Profile unpublished. Your handle and runs are retained.')
      }
    } catch (failure) {
      if (active.current) setError(profileError(failure))
    } finally {
      clearTimeout(timeout)
      mutation.current = null
      if (active.current) setPending(false)
    }
  }

  async function copyUrl() {
    setMessage('')
    try {
      await navigator.clipboard.writeText(url)
      if (active.current) setMessage('Profile URL copied.')
    } catch {
      if (active.current) setMessage('Could not copy. Select the URL above and copy it manually.')
    }
  }

  return <section className="profile-controls" aria-labelledby="profile-settings-title">
    <div className="section-heading"><h2 id="profile-settings-title">Public profile</h2><span>{profile?.published ? 'Published' : 'Private'}</span></div>
    <p>Share your handle and all-time cloud averages. Your account details and individual runs stay private.</p>
    {loading ? <p role="status">Loading profile settings...</p>
      : !profile ? <><p role="alert">{error}</p><button className="brutal-btn" onClick={() => setRetry((n) => n + 1)}>Retry profile settings</button></>
        : <>
          {!profile.handle && <form onSubmit={(event) => { event.preventDefault(); publish(true) }}>
            <label htmlFor="profile-handle">Choose a handle</label>
            <div className="profile-actions"><input id="profile-handle" value={handle} onChange={(event) => { setHandle(normalizeHandle(event.target.value)); setError(''); setMessage('') }} disabled={pending} autoCapitalize="none" autoCorrect="off" spellCheck={false} aria-describedby="handle-rules handle-feedback" aria-invalid={!!invalid} /><button className="brutal-btn primary" disabled={pending || !!invalid || !handle}>{pending ? 'Publishing...' : 'Publish profile'}</button></div>
            <p id="handle-rules" className="muted">3–20 letters or digits, with single hyphens between words. Handles become lowercase.</p>
            <p id="handle-feedback" role="status">{invalid}</p>
          </form>}
          {profile.handle && <>
            <label htmlFor="profile-url">{profile.published ? 'Your public URL' : 'Your retained URL (currently unavailable)'}</label>
            <div className="profile-actions"><input id="profile-url" readOnly value={url} onFocus={(event) => event.target.select()} />{profile.published && <button className="brutal-btn" onClick={copyUrl}>Copy URL</button>}</div>
            {profile.published ? <><p>Unpublishing makes this public page unavailable. Your handle and saved runs remain.</p><button className="brutal-btn" disabled={pending} onClick={() => publish(false)}>{pending ? 'Unpublishing...' : 'Unpublish profile'}</button></> : <button className="brutal-btn primary" disabled={pending} onClick={() => publish(true)}>{pending ? 'Publishing...' : 'Republish profile'}</button>}
          </>}
          <p role="alert">{error}</p>
          <p role="status">{message}</p>
        </>}
  </section>
}
