import { formatMode } from './history.js'

function formatTypingTime(seconds) {
  if (seconds == null) return '—'
  const total = Math.round(Number(seconds))
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor(total % 3600 / 60)
  if (hours) return `${hours}h ${minutes}m`
  if (minutes) return `${minutes}m ${total % 60}s`
  return `${total}s`
}

function compareModes(a, b) {
  const first = a.mode.match(/^time-(\d+)w-(\d+)s$/)
  const second = b.mode.match(/^time-(\d+)w-(\d+)s$/)
  if (first && second) return Number(first[1]) - Number(second[1]) || Number(first[2]) - Number(second[2]) || a.mode.localeCompare(b.mode, 'en')
  if (first || second) return first ? -1 : 1
  return a.mode.localeCompare(b.mode, 'en')
}

export default function ProfileLedger({ profile }) {
  const records = profile.personal_bests
  const featured = [...records].sort((a, b) => b.run_count - a.run_count || b.wpm - a.wpm || a.mode.localeCompare(b.mode, 'en')).slice(0, 4)
  const allModes = [...records].sort(compareModes)

  return <>
    <dl className="profile-totals">
      <div><dt>Completed runs</dt><dd>{profile.run_count}</dd></div>
      <div><dt>Average WPM</dt><dd>{profile.average_wpm ?? '—'}</dd></div>
      <div><dt>Average accuracy</dt><dd>{profile.average_accuracy == null ? '—' : `${profile.average_accuracy}%`}</dd></div>
      <div><dt>Recorded typing time</dt><dd>{formatTypingTime(profile.recorded_typing_seconds)}</dd></div>
    </dl>
    <p className="profile-data-note">All-time cloud results across every mode. Typing time includes measured runs only; local-only runs stay on their device.</p>
    {Number(profile.run_count) === 0 ? <section className="state-panel"><h2>No cloud runs yet.</h2><p>Records and averages appear after the first cloud-saved run.</p></section>
      : <section className="profile-records" aria-labelledby="profile-records-title">
        <div className="section-heading"><h2 id="profile-records-title">Personal records.</h2><p>Your most-practiced modes. Each score is a best.</p></div>
        <ol className="record-sheet">{featured.map((record, index) => <li key={record.mode}>
          <span className="record-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <div className="record-mode"><h3>{formatMode(record.mode)}</h3><span>{record.run_count} {Number(record.run_count) === 1 ? 'run' : 'runs'}</span></div>
          <strong className="record-wpm">{record.wpm}<small> WPM</small></strong>
          <span className="record-accuracy">{record.accuracy}% accuracy</span>
        </li>)}</ol>
        <details className="all-records">
          <summary>View all modes ({records.length})</summary>
          <div className="table-scroll" role="region" aria-label="All personal records" tabIndex={0}>
            <table><caption>Personal bests by word count and time limit</caption><thead><tr><th scope="col">Mode</th><th scope="col">Best WPM</th><th scope="col">Accuracy</th><th scope="col">Runs</th></tr></thead>
              <tbody>{allModes.map((record) => <tr key={record.mode}><th scope="row">{formatMode(record.mode)}</th><td>{record.wpm}</td><td>{record.accuracy}%</td><td>{record.run_count}</td></tr>)}</tbody>
            </table>
          </div>
        </details>
      </section>}
  </>
}
