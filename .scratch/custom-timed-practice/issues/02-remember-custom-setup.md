# 02: Remember the custom setup across visits

**What to build:** returning users find their last applied custom passage and selected timer available in the same browser. Storage failures leave practice usable and explain that the setup cannot be remembered.

**Blocked by:** 01 (Complete timed custom-text practice).

**Status:** resolved

- [x] Persist the last successfully applied normalized passage and selected custom timer in browser-local settings. Remember one setup; do not introduce a passage library or separately persisted editing drafts.
- [x] Refreshing and closing and reopening the same persistent browser profile restores the passage and timer for both guests and signed-in users. Restoration does not automatically start a run.
- [x] Invalid input does not overwrite the saved applied passage. Retry retains the setup; unapplied editor changes do not replace the remembered passage.
- [x] Timer changes remain consistent with ticket 01's reset behavior and persist the chosen custom duration without changing a run already in progress.
- [x] Validate restored settings before using them. Missing, malformed, blank, oversized, or unsupported values do not crash the app or produce an invalid typing target. Fall back to 60 seconds when no valid custom timer is saved.
- [x] When browser storage is blocked, full, or throws during access, keep the applied passage and timer usable in memory for the current session. Show visible feedback that the setup will not be remembered.
- [x] Recovery from corrupt or unavailable settings does not interfere with standard personal bests, history, authentication storage, or the existing session-only history fallback.
- [x] Store custom text only in browser-local settings. Add no account sync, cloud requests, public sharing, ghost replay payloads, or cloud schema changes.
- [x] Verify browser-visible restoration after refresh and reopening, persisted timer selection, invalid-setting recovery, and blocked/full storage behavior. Include keyboard-accessible feedback and narrow-screen rendering.
- [x] Confirm the completed practice flow still satisfies ticket 01, including labeled local history and exclusion from standard records and cloud effects. Run existing lint and production-build checks.

## Comments

Implemented custom-timed-practice 02 only. The last applied normalized passage and selected custom timer are stored as one browser-local setup. Restored fields are validated independently, invalid durations fall back to 60 seconds, and restoration never starts a run. Invalid or unapplied drafts and standard timer choices do not overwrite the setup. Storage-access, quota, and readback failures leave current practice state usable and show an accessible visit-only retention message.

Browser-first TDD reproduced missing restoration and misleading success feedback when reads fail. A review then found a race-return timer leak: returning from a standard ghost could replace the custom timer. Both home navigation and race-exit resets now restore the selected custom timer; the reproducing browser check passes.

All 23 browser/history regression checks pass against the exact staged source snapshot, including guest and signed-in refresh/reopening, corrupt and unsupported settings, blocked/full/read-failing storage, 320px visible feedback, prior custom score isolation, authentication, standard saving, and ghost racing. Lint and production builds pass. The configured working build emits a nonblocking 500 kB chunk-size warning. No typechecking command is configured. Account responses are local HTTP fixtures rather than real-service smoke checks.

Standards review has no findings. Spec review's timer-leak finding is resolved, with no remaining findings. The 320px warning screen was visually inspected. Existing unrelated App and CSS edits were excluded from the commit; CSS was not changed for this ticket.
