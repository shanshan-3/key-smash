import { useEffect, useMemo, useState } from "react";
import { supabase } from "./supabase.js";
import { formatMode, isCustomMode, loadHistory } from "./history.js";
import PaceChart from "./PaceChart.jsx";

const fmtDate = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function Stats({
  user,
  onLogin,
  onBack,
  freshRun,
  embedded = false,
}) {
  const [source, setSource] = useState("local");
  const [cloudRuns, setCloudRuns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("all");
  const localRuns = useMemo(() => loadHistory(), [freshRun]);
  const runs = source === "local" ? localRuns : cloudRuns;
  const modes = [...new Set(runs.map((run) => run.mode))];
  const filtered =
    mode === "all" ? runs : runs.filter((run) => run.mode === mode);
  const standard = filtered.filter((run) => !isCustomMode(run.mode));
  const selected = filtered.find((run) => run.id === selectedId) || filtered[0];
  const pbMap = {};
  for (const run of standard)
    if (!pbMap[run.mode] || run.wpm > pbMap[run.mode].wpm)
      pbMap[run.mode] = run;
  const byDay = {};
  for (const run of standard.slice(0, 30).toReversed()) {
    const date = run.created_at.slice(0, 10);
    if (!byDay[date]) byDay[date] = [];
    byDay[date].push(run.wpm);
  }
  const trend = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, values], index) => ({
      second: index + 1,
      net: Math.round(
        values.reduce((sum, value) => sum + value, 0) / values.length,
      ),
      label,
    }));

  useEffect(() => {
    setCloudRuns([]);
    setError("");
    if (source !== "cloud" || !user || !supabase) {
      setLoading(false);
      return;
    }
    let active = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    setLoading(true);
    supabase
      .from("results")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200)
      .abortSignal(controller.signal)
      .then(
        ({ data, error: fetchError }) => {
          clearTimeout(timeout);
          if (!active) return;
          if (fetchError)
            setError(
              "Cloud history could not load. Retry or view your local runs.",
            );
          else setCloudRuns(data || []);
          setLoading(false);
        },
        () => {
          clearTimeout(timeout);
          if (!active) return;
          setError(
            "Cloud history could not load. Retry or view your local runs.",
          );
          setLoading(false);
        },
      );
    return () => {
      active = false;
      clearTimeout(timeout);
      controller.abort();
    };
  }, [source, user?.id, freshRun, retry]);

  function changeSource(next) {
    setSource(next);
    setMode("all");
    setSelectedId(null);
  }

  return (
    <div className="stats-page">
      <div className="page-heading">
        <div>
          {embedded ? (
            <h2 id="history" tabIndex={-1}>
              Your record.
            </h2>
          ) : (
            <h1 tabIndex={-1}>Your record.</h1>
          )}
          <p>Find your pace. Pick a run to inspect it.</p>
        </div>
        <button className="brutal-btn" onClick={onBack}>
          Back to typing
        </button>
      </div>
      <div className="history-toolbar">
        <div className="segmented" role="group" aria-label="History source">
          <button
            aria-pressed={source === "local"}
            onClick={() => changeSource("local")}
          >
            This device
          </button>
          {supabase && (
            <button
              aria-pressed={source === "cloud"}
              onClick={() => changeSource("cloud")}
            >
              Cloud
            </button>
          )}
        </div>
        <p className="muted">
          {source === "local"
            ? "Last 50 runs saved in this browser."
            : "Latest 200 runs from your account."}
        </p>
      </div>
      {source === "cloud" && !user ? (
        <section className="state-panel">
          <h2>Keep your runs across devices.</h2>
          <p>
            Log in to view cloud history. Your local runs are available on this
            device.
          </p>
          <button className="brutal-btn primary" onClick={onLogin}>
            Log in
          </button>
        </section>
      ) : loading ? (
        <p className="state-panel" role="status">
          Loading your cloud runs...
        </p>
      ) : error ? (
        <section className="state-panel" role="alert">
          <h2>History is unavailable.</h2>
          <p>{error}</p>
          <button className="brutal-btn" onClick={() => setRetry((n) => n + 1)}>
            Retry cloud history
          </button>
        </section>
      ) : runs.length === 0 ? (
        <section className="state-panel">
          <h2>No finished runs yet.</h2>
          <p>Complete a typing test to see your scores and pace here.</p>
          <button className="brutal-btn primary" onClick={onBack}>
            Start a test
          </button>
        </section>
      ) : (
        <>
          <label className="mode-filter">
            Compare a mode
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setSelectedId(null);
              }}
            >
              <option value="all">All modes</option>
              {modes.map((m) => (
                <option key={m} value={m}>
                  {formatMode(m)}
                </option>
              ))}
            </select>
          </label>
          <dl className="history-summary">
            <div>
              <dt>Runs shown</dt>
              <dd>{filtered.length}</dd>
            </div>
            <div>
              <dt>Standard best WPM</dt>
              <dd>
                {standard.length
                  ? Math.max(...standard.map((r) => r.wpm))
                  : "None"}
              </dd>
            </div>
            <div>
              <dt>Standard average WPM</dt>
              <dd>
                {standard.length
                  ? Math.round(
                      standard.reduce((sum, r) => sum + r.wpm, 0) /
                        standard.length,
                    )
                  : "None"}
              </dd>
            </div>
          </dl>
          <p className="muted">
            Custom practice is excluded from standard records and daily
            averages.
          </p>
          <section className="history-chart">
            <div className="section-heading">
              <h2>Daily average WPM</h2>
              <p>
                Latest {Math.min(30, standard.length)} standard{" "}
                {standard.length === 1 ? "run" : "runs"}. Dates use UTC.
              </p>
            </div>
            <PaceChart
              samples={trend}
              kind="history"
              label={
                trend.length
                  ? `Daily average WPM: ${trend[0].label} to ${trend.at(-1).label} UTC`
                  : "Daily average WPM"
              }
            />
          </section>
          {selected && (
            <section className="history-chart">
              <div className="section-heading">
                <h2>WPM during this run</h2>
                <p>
                  {formatMode(selected.mode)} / {fmtDate(selected.created_at)}
                </p>
              </div>
              <PaceChart
                samples={selected.samples || []}
                label={`${selected.wpm} WPM / ${selected.acc}% accuracy`}
              />
            </section>
          )}
          <section>
            <div className="section-heading">
              <h2>Best by mode</h2>
              <span className="muted">Within this history</span>
            </div>
            <div className="best-list">
              {Object.values(pbMap).map((r) => (
                <div key={r.mode}>
                  <span>{formatMode(r.mode)}</span>
                  <strong>
                    {r.wpm} <small>WPM</small>
                  </strong>
                  <span>{r.acc}% accuracy</span>
                </div>
              ))}
            </div>
          </section>
          <section>
            <div className="section-heading">
              <h2>Last 10 runs</h2>
              <span className="muted">Choose a score for its pace curve.</span>
            </div>
            <div
              className="table-scroll"
              tabIndex={0}
              role="region"
              aria-label="Recent runs"
            >
              <table>
                <thead>
                  <tr>
                    <th scope="col">WPM</th>
                    <th scope="col">Accuracy</th>
                    <th scope="col">Mode</th>
                    <th scope="col">Finished</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 10).map((r) => (
                    <tr
                      key={r.id}
                      className={selected?.id === r.id ? "selected-row" : ""}
                    >
                      <td>
                        <button
                          className="score-link"
                          aria-pressed={selected?.id === r.id}
                          aria-label={`View ${r.wpm} WPM run from ${fmtDate(r.created_at)}`}
                          onClick={() => setSelectedId(r.id)}
                        >
                          {r.wpm}
                        </button>
                      </td>
                      <td>{r.acc}%</td>
                      <td>{formatMode(r.mode)}</td>
                      <td>{fmtDate(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
