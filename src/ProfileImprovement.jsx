import { useEffect, useId, useRef, useState } from "react";
import { formatMode } from "./history.js";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const ranges = [
  { weeks: 12, label: "12 weeks" },
  { weeks: 26, label: "6 months" },
  { weeks: 52, label: "1 year" },
];

function currentUtcWeek() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  return date.getTime();
}

export default function ProfileImprovement({ modes, trends }) {
  const id = useId();
  const container = useRef(null);
  const [width, setWidth] = useState(800);
  const [chosenMode, setChosenMode] = useState("");
  const [weeks, setWeeks] = useState(12);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(240, Math.round(entry.contentRect.width))),
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const mode =
    modes.find((record) => record.mode === chosenMode)?.mode ||
    modes[0]?.mode ||
    "";
  const values = new Map(
    (trends || [])
      .filter((entry) => entry.mode === mode)
      .map((entry) => [entry.week_start, entry]),
  );
  const currentWeek = currentUtcWeek();
  const buckets = Array.from({ length: weeks }, (_, index) => {
    const week = new Date(currentWeek - (weeks - index - 1) * WEEK_MS)
      .toISOString()
      .slice(0, 10);
    return { week, value: values.get(week) };
  });
  const measured = buckets.filter((bucket) => bucket.value);
  const latest = buckets.findLastIndex((bucket) => bucket.value);
  const ceiling = Math.max(
    10,
    Math.ceil(
      Math.max(
        0,
        ...measured.map((bucket) => Number(bucket.value.average_wpm)),
      ) / 10,
    ) * 10,
  );
  const right = width - 24;
  const x = (index) => 56 + (index / (weeks - 1)) * (right - 56);
  const y = (wpm) => 224 - (Number(wpm) / ceiling) * 192;
  const paths = [];
  let path = "";
  buckets.forEach((bucket, index) => {
    if (!bucket.value) {
      if (path) paths.push(path);
      path = "";
      return;
    }
    path += path
      ? ` H ${x(index)} V ${y(bucket.value.average_wpm)}`
      : `M ${x(index)} ${y(bucket.value.average_wpm)}`;
  });
  if (path) paths.push(path);
  const range = ranges.find((entry) => entry.weeks === weeks).label;

  return (
    <section
      className="profile-improvement"
      ref={container}
      aria-labelledby={`${id}-heading`}
    >
      <div className="section-heading">
        <h2 id={`${id}-heading`}>Weekly average WPM.</h2>
        <p>Compare one practiced mode at a time.</p>
      </div>
      {trends == null ? (
        <p className="empty-copy">
          Weekly pace data is unavailable for this profile. Reload the page to
          request it again.
        </p>
      ) : modes.length === 0 ? (
        <p className="empty-copy">
          Complete a cloud-saved run to begin your improvement record.
        </p>
      ) : (
        <>
          <div className="improvement-controls">
            <label htmlFor={`${id}-mode`}>
              Practiced mode
              <select
                id={`${id}-mode`}
                value={mode}
                onChange={(event) => setChosenMode(event.target.value)}
              >
                {modes.map((record) => (
                  <option key={record.mode} value={record.mode}>
                    {formatMode(record.mode)}
                  </option>
                ))}
              </select>
            </label>
            <div
              className="segmented"
              role="group"
              aria-label="Improvement range"
            >
              {ranges.map((entry) => (
                <button
                  key={entry.weeks}
                  aria-pressed={weeks === entry.weeks}
                  onClick={() => setWeeks(entry.weeks)}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>
          <p className="profile-data-note" role="status" aria-live="polite">
            {formatMode(mode)} / {range} / {measured.length} measured{" "}
            {measured.length === 1 ? "week" : "weeks"}. Weeks start Monday at
            00:00 UTC; the current week is included.
          </p>
          {measured.length === 0 ? (
            <p className="empty-copy">
              No cloud runs in this mode during this range. Choose a longer
              range or another practiced mode.
            </p>
          ) : (
            <>
              <svg
                className="improvement-chart"
                viewBox={`0 0 ${width} 272`}
                role="img"
                aria-labelledby={`${id}-chart-title ${id}-chart-description`}
              >
                <title id={`${id}-chart-title`}>
                  {formatMode(mode)} weekly average WPM over {range}
                </title>
                <desc id={`${id}-chart-description`}>
                  Black steps and square points show measured weeks. Gaps
                  indicate weeks without runs. Yellow marks the latest measured
                  week. Exact values are in the weekly data table below.
                </desc>
                <g aria-hidden="true">
                  {[0, ceiling / 2, ceiling].map((value) => (
                    <g key={value}>
                      <line
                        className="improvement-grid"
                        x1="56"
                        x2={right}
                        y1={y(value)}
                        y2={y(value)}
                      />
                      <text x="44" y={y(value) + 5} textAnchor="end">
                        {value}
                      </text>
                    </g>
                  ))}
                  <text x="56" y="18">
                    WPM
                  </text>
                  <text x="56" y="256">
                    {buckets[0].week}
                  </text>
                  <text x={right} y="256" textAnchor="end">
                    {buckets.at(-1).week}
                  </text>
                  {paths.map((d, index) => (
                    <path key={index} className="improvement-line" d={d} />
                  ))}
                  {buckets.map(
                    (bucket, index) =>
                      bucket.value && (
                        <rect
                          key={bucket.week}
                          className={
                            index === latest
                              ? "improvement-point latest"
                              : "improvement-point"
                          }
                          x={x(index) - (index === latest ? 5 : 3)}
                          y={
                            y(bucket.value.average_wpm) -
                            (index === latest ? 5 : 3)
                          }
                          width={index === latest ? 10 : 6}
                          height={index === latest ? 10 : 6}
                        />
                      ),
                  )}
                </g>
              </svg>
            </>
          )}
          <details className="improvement-data">
            <summary>View weekly data</summary>
            <div
              className="table-scroll"
              role="region"
              aria-label="Weekly improvement data"
              tabIndex={0}
            >
              <table>
                <caption>
                  {formatMode(mode)} / {range}. Week starts are UTC.
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Week starting</th>
                    <th scope="col">Average WPM</th>
                    <th scope="col">Runs</th>
                  </tr>
                </thead>
                <tbody>
                  {buckets.map((bucket) => (
                    <tr key={bucket.week}>
                      <th scope="row">{bucket.week}</th>
                      <td>
                        {bucket.value ? bucket.value.average_wpm : "No runs"}
                      </td>
                      <td>{bucket.value?.run_count ?? 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
}
