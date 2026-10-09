# 06: Race your own best in every mode

**What to build:** a typist can race their own personal best in every combined word-count/time-limit mode. The existing local ghost becomes an all-mode feature, and a signed-in owner can launch the cloud best shown on their private Profile. Races reproduce the winning text and pace, show live position and delta, score the outcome, and save the completed attempt through the normal history flow.

**Blocked by:** 03 (Add the owner Profile workspace and account menu).

**Status:** resolved (code verified; migration 0009 deployment pending)

- [x] Generalize the existing local Race your best action from 60-second tests to every combined mode that has a local personal best.
- [x] Add Race this ghost to each populated personal-record row in the owner Profile workspace, including while the profile is unpublished.
- [x] Open owner cloud races at a direct `/profile/race/:mode` route that survives refresh and browser back/forward navigation.
- [x] Version the deterministic word set in saved results and backfill existing results as version 1. Preserve version 1 generation so existing records continue to reproduce the same target text after future word-list changes.
- [x] Add an authenticated owner ghost lookup for a selected mode. It resolves only the caller's winning cloud run and returns the handle, mode, winning WPM and accuracy, word count, duration, elapsed time, seed, word-set version, and a derived time-to-target-position trace.
- [x] Select the cloud winner by WPM descending, accuracy descending, then stable internal result ID ascending, matching the Profile personal-record contract.
- [x] Keep raw samples, keystrokes, missed keys, result IDs, individual timestamps, and account metadata out of the ghost response. Cross-account owner requests return no data.
- [x] Lock word count, duration, seed, word-set version, and target text for the race. An unsupported word-set version shows a generic ghost-unavailable state instead of generating different text.
- [x] Replay the recorded ghost by interpolating between derived trace points and clamping progress to the target length. Fall back to constant average-WPM pacing when an older winning run has no usable samples.
- [x] Show the moving ghost position inside the typing text, the target WPM, and a live character lead or deficit without obscuring current-word and error feedback.
- [x] Restart and rematch preserve the selected ghost and its route. Leaving for ordinary typing clears the explicit ghost selection.
- [x] An explicitly selected cloud ghost takes priority for that attempt. Ordinary typing without an explicit selection continues to use the browser's local personal best.
- [x] Determine the result by WPM first and accuracy second: higher WPM wins, equal WPM with higher accuracy wins, and equal WPM plus accuracy is a tie.
- [x] On results, prioritize the challenged-ghost comparison and pace curve while independently showing New personal best when the challenger also improved their own record.
- [x] Save completed owner/local ghost races through the existing result flow. Guests update local history and PB; signed-in owners also save to their own cloud account.
- [x] Preserve distinct loading, retryable request error, unavailable ghost, active race, and completed result states. A race lookup failure never starts with guessed settings.
- [x] Keep ghost markers, deltas, controls, and result comparisons keyboard-readable, responsive at 320px, and compatible with reduced motion.
- [x] Manually verify every combined mode, local and cloud selection, cross-device cloud bests, deterministic version-1 text, recorded interpolation, average fallback, restart/rematch, win/tie/loss scoring, independent PB badges, persistence, cross-account denial, keyboard use, and mobile layout. Lint and production build pass; no automated test tooling is added.

## Comments

Implemented on the current branch. All 16 local and cloud modes, seeded/versioned text, replay, route persistence, scoring, local/cloud saves, privacy, keyboard controls, and 320px layout passed temporary verification. Lint/build and independent Standards/Spec reviews pass. See [deployment and verification notes](../../../docs/public-profiles.md). Apply migration 0009 before frontend deployment; live Supabase smoke checks remain pending. No automated test tooling was added.
