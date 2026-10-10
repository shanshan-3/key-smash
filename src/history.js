const HISTORY_KEY = "keysmash-history-v1";
const PB_KEY = "keysmash-pb-v1";
let memoryRuns = [];
let memoryPbs = {};
let sessionOnly = false;

export const isCustomMode = (mode) => /^custom-\d+s$/.test(mode || "");

function storage() {
  return globalThis.localStorage;
}

export function loadHistory() {
  if (sessionOnly) return memoryRuns;
  try {
    const value = JSON.parse(storage().getItem(HISTORY_KEY) || "[]");
    if (Array.isArray(value)) {
      memoryRuns = value
        .filter(
          (run) =>
            run &&
            typeof run.id === "string" &&
            Number.isFinite(run.wpm) &&
            typeof run.created_at === "string",
        )
        .slice(0, 50);
    }
  } catch {
    // Keep this session's results available when storage is blocked or full.
  }
  return memoryRuns;
}

export function loadPbs() {
  if (sessionOnly) return memoryPbs;
  try {
    const value = JSON.parse(storage().getItem(PB_KEY) || "{}");
    if (value && typeof value === "object" && !Array.isArray(value)) {
      memoryPbs = Object.fromEntries(
        Object.entries(value).filter(([, pb]) => pb && Number.isFinite(pb.wpm)),
      );
    }
  } catch {
    // PBs remain usable in memory for this session.
  }
  return memoryPbs;
}

export function saveRun(run) {
  const runs = [
    run,
    ...loadHistory().filter((entry) => entry.id !== run.id),
  ].slice(0, 50);
  const pbs = loadPbs();
  const custom = isCustomMode(run.mode);
  const previous = custom ? null : pbs[run.mode] || null;
  const isBest =
    !custom &&
    (!previous ||
      run.wpm > previous.wpm ||
      (run.wpm === previous.wpm && run.acc > previous.acc));
  const nextPbs = isBest ? { ...pbs, [run.mode]: run } : pbs;
  memoryRuns = runs;
  memoryPbs = nextPbs;
  let persisted = true;
  try {
    storage().setItem(HISTORY_KEY, JSON.stringify(runs));
    if (!custom) storage().setItem(PB_KEY, JSON.stringify(nextPbs));
  } catch {
    persisted = false;
    sessionOnly = true;
  }
  return { previous, isBest, persisted };
}

export function formatMode(mode) {
  if (isCustomMode(mode)) return `Custom practice / ${mode.slice(7)}`;
  const match = mode?.match(/^time-(\d+)w-(\d+)s$/);
  return match ? `${match[1]} words / ${match[2]}s` : mode;
}
