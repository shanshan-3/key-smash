import { pbKey, streamWords, WORD_SET_VERSION } from "./engine.js";
import { DURATIONS, WORD_COUNTS } from "./practiceSettings.js";

export function prepareGhost(record) {
  if (!record) return null;
  const version = record.word_set_version ?? WORD_SET_VERSION;
  if (
    version !== WORD_SET_VERSION ||
    !WORD_COUNTS.includes(record.word_count) ||
    !DURATIONS.includes(record.duration_s) ||
    record.mode !== pbKey(record.word_count, record.duration_s) ||
    !Number.isInteger(record.seed) ||
    !Number.isFinite(record.wpm) ||
    record.wpm < 0 ||
    !Number.isFinite(record.accuracy ?? record.acc)
  )
    return null;
  const length = streamWords(record.seed, record.word_count, version).join(
    " ",
  ).length;
  const source = Array.isArray(record.trace)
    ? record.trace
    : Array.isArray(record.samples)
      ? record.samples.filter(Boolean).map((sample) => ({
          second: sample.second,
          position: sample.correctChars,
        }))
      : [];
  const trace = [{ second: 0, position: 0 }];
  for (const point of source
    .filter(Boolean)
    .sort((a, b) => a.second - b.second)) {
    if (
      !Number.isFinite(point.second) ||
      point.second <= trace.at(-1).second ||
      point.second > record.duration_s ||
      !Number.isFinite(point.position) ||
      point.position < 0
    )
      continue;
    trace.push({
      second: point.second,
      position: Math.min(length, point.position),
    });
  }
  return {
    ...record,
    accuracy: record.accuracy ?? record.acc,
    word_set_version: version,
    trace: trace.length > 1 ? trace : [],
    targetLength: length,
  };
}

export function ghostPosition(ghost, seconds) {
  if (seconds <= 0) return 0;
  if (!ghost.trace.length)
    return Math.min(ghost.targetLength, (ghost.wpm * 5 * seconds) / 60);
  const next = ghost.trace.findIndex((point) => point.second >= seconds);
  if (next < 0) return ghost.trace.at(-1).position;
  if (next === 0) return ghost.trace[0].position;
  const before = ghost.trace[next - 1];
  const after = ghost.trace[next];
  return (
    before.position +
    ((after.position - before.position) * (seconds - before.second)) /
      (after.second - before.second)
  );
}

export function ghostOutcome(result, ghost) {
  const difference = result.wpm - ghost.wpm || result.acc - ghost.accuracy;
  return difference > 0
    ? "You beat the ghost."
    : difference < 0
      ? "The ghost finished ahead."
      : "You tied the ghost.";
}

export function ghostPace(ghost) {
  if (!ghost.trace.length)
    return [
      { second: 0, net: ghost.wpm },
      { second: ghost.elapsed_s || ghost.duration_s, net: ghost.wpm },
    ];
  return ghost.trace.slice(1).map((point, index) => ({
    second: point.second,
    net: Math.round(
      (Math.max(0, point.position - ghost.trace[index].position) * 12) /
        (point.second - ghost.trace[index].second),
    ),
  }));
}
