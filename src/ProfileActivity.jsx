import { useId, useState } from "react";

function weekLabel(bucket) {
  const end = new Date(`${bucket.week}T00:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 6);
  const count = Number(bucket.value?.run_count || 0);
  return `${bucket.week} to ${end.toISOString().slice(0, 10)} UTC: ${count} completed ${count === 1 ? "run" : "runs"}`;
}

export default function ProfileActivity({ activity }) {
  const id = useId();
  const [selectedIndex, setSelected] = useState(51);
  const [hovered, setHovered] = useState(null);
  const buckets = [...activity]
    .sort((a, b) => a.week_start.localeCompare(b.week_start))
    .map((value) => ({ week: value.week_start, value }));
  const selected = Math.min(selectedIndex, Math.max(0, buckets.length - 1));
  const maximum = Math.max(
    0,
    ...buckets.map((bucket) => Number(bucket.value?.run_count || 0)),
  );
  const total = buckets.reduce(
    (sum, bucket) => sum + Number(bucket.value?.run_count || 0),
    0,
  );

  function move(event) {
    const last = buckets.length - 1;
    const next = {
      ArrowRight: Math.min(last, selected + 1),
      ArrowDown: Math.min(last, selected + 1),
      ArrowLeft: Math.max(0, selected - 1),
      ArrowUp: Math.max(0, selected - 1),
      Home: 0,
      End: last,
    }[event.key];
    if (next === undefined) return;
    event.preventDefault();
    setSelected(next);
    setHovered(null);
  }

  function inspect(event) {
    const week = event.target.closest("[data-week-index]");
    if (!week) return;
    setSelected(Number(week.dataset.weekIndex));
    setHovered(null);
    event.currentTarget.focus();
  }

  return (
    <section className="profile-activity" aria-labelledby={`${id}-heading`}>
      <div className="section-heading">
        <h2 id={`${id}-heading`}>Runs by week.</h2>
        {buckets.length > 0 && (
          <p>
            {buckets.length} weeks / {total} completed{" "}
            {total === 1 ? "run" : "runs"}
          </p>
        )}
      </div>
      {buckets.length === 0 ? (
        <p className="empty-copy">
          Weekly activity is unavailable for this profile. Reload the page to
          request it again.
        </p>
      ) : maximum === 0 ? (
        <p className="empty-copy">
          No cloud runs in the past {buckets.length} weeks. Completed
          cloud-saved tests appear in this activity record.
        </p>
      ) : (
        <>
          <p id={`${id}-instructions`} className="profile-data-note">
            Weeks start Monday at 00:00 UTC, including the current week. Strike
            heights compare each week with the busiest week. Use arrow keys to
            inspect adjacent weeks, or choose a week below.
          </p>
          <div
            className="activity-strikes"
            role="slider"
            tabIndex={0}
            aria-label="Inspect weekly completed cloud runs"
            aria-describedby={`${id}-instructions`}
            aria-valuemin={1}
            aria-valuemax={buckets.length}
            aria-valuenow={selected + 1}
            aria-valuetext={weekLabel(buckets[selected])}
            onFocus={() => setHovered(null)}
            onPointerLeave={() => setHovered(null)}
            onClick={inspect}
            onKeyDown={move}
          >
            {buckets.map((bucket, index) => (
              <span
                key={bucket.week}
                data-week-index={index}
                aria-hidden="true"
                className={`activity-week${selected === index ? " selected" : ""}${hovered === index ? " hovered" : ""}`}
                onPointerEnter={(event) => {
                  if (event.pointerType !== "touch") setHovered(index);
                }}
              >
                <span
                  className="activity-strike"
                  aria-hidden="true"
                  style={{
                    height: `${(Number(bucket.value?.run_count || 0) / maximum) * 100}%`,
                  }}
                />
              </span>
            ))}
          </div>
          <div className="activity-dates" aria-hidden="true">
            <span>{buckets[0].week}</span>
            <span>{buckets.at(-1).week}</span>
          </div>
          <label className="activity-selector" htmlFor={`${id}-week`}>
            Inspect week
            <select
              id={`${id}-week`}
              value={selected}
              onChange={(event) => {
                setSelected(Number(event.target.value));
                setHovered(null);
              }}
            >
              {buckets.map((bucket, index) => (
                <option key={bucket.week} value={index}>
                  {weekLabel(bucket)}
                </option>
              ))}
            </select>
          </label>
          <p
            className="activity-detail"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            {weekLabel(buckets[hovered ?? selected])}
          </p>
        </>
      )}
    </section>
  );
}
