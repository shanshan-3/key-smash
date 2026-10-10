Status: ready-for-agent

# Custom text for timed typing practice

## Problem Statement

KEYSMASH users can practice generated words but cannot type a passage they choose. They want to paste or write their own text, practice it under the existing time limits, and return to the same setup later. Custom passages vary in difficulty, so their scores must not affect standard records or account statistics.

## Solution

Add a guest-accessible Custom mode with a text editor and an explicit "Use this text" action. Accept up to 2,000 characters, normalize whitespace, and preserve the passage's order, capitalization, and punctuation. Offer 15, 30, 60, and 120-second practice, beginning on the first keystroke. Repeat the passage with a separating space until the timer expires. Remember the last applied passage and selected custom timer in this browser. Show normal practice results and labeled local history while keeping custom runs separate from standard records and cloud data.

## User Stories

1. As a guest, I want to select Custom mode without signing in, so that I can practice my own text immediately.
2. As a signed-in user, I want the same Custom mode, so that account access does not change practice behavior.
3. As a typist, I want Custom alongside the existing Words and Time controls, so that I can discover it where I choose practice settings.
4. As a typist, I want to paste a passage into an editor, so that I can practice material from elsewhere.
5. As a typist, I want to write a passage in the editor, so that I can build my own exercise.
6. As a typist, I want an explicit "Use this text" button, so that editing does not immediately replace my active passage.
7. As a typist, I want my passage's word order preserved, so that I practice the sentences I supplied.
8. As a typist, I want capitalization and punctuation preserved, so that I practice those characters too.
9. As a typist, I want pasted line breaks, tabs, and repeated spaces converted into single spaces, so that invisible formatting does not obstruct practice.
10. As a typist, I want blank input rejected with a clear message, so that I know why practice cannot start.
11. As a typist, I want passages up to 2,000 characters accepted, so that I can practice useful amounts of text.
12. As a typist, I want oversized input rejected without silent truncation, so that the passage I practice is the one I chose.
13. As a typist, I want 15, 30, 60, and 120-second limits, so that custom practice supports the familiar session lengths.
14. As a typist, I want the timer to start on my first typing keystroke, so that preparing to type does not consume practice time.
15. As a typist, I want a short passage to repeat with a space between repetitions, so that I can continue practicing for the full time limit.
16. As a typist, I want the run to end when time expires, so that results reflect the chosen practice duration.
17. As a typist, I want to retry the same passage, so that I can practice repeatedly without entering it again.
18. As a typist, I want applying edited text to reset the current attempt, so that one run never mixes two passages.
19. As a returning typist, I want my last applied passage remembered in this browser, so that I can resume my exercise later.
20. As a returning typist, I want my selected custom timer remembered, so that I can repeat the same setup.
21. As a typist with unavailable browser storage, I want practice to remain usable, so that saving failure does not block typing.
22. As a typist with unavailable browser storage, I want a visible message that my setup will not be remembered, so that I understand what will happen on my next visit.
23. As a typist, I want WPM and accuracy results, so that I can assess my custom practice.
24. As a typist, I want custom runs labeled "Custom practice" in this browser's history, so that I can distinguish them from standard tests.
25. As a typist, I want custom runs excluded from standard personal bests and rankings, so that easy passages cannot inflate competitive records.
26. As an account owner, I want custom runs excluded from cloud statistics and profile trends, so that my standard-test progress remains comparable.
27. As a typist, I want custom text to remain in this browser without account sync or public sharing, so that this feature stays focused on local practice.
28. As a keyboard user, I want to edit, apply, select a timer, type, and retry with clear focus behavior, so that I can complete the practice flow using my keyboard.
29. As a mobile user, I want the editor, controls, and typing display to fit a narrow viewport, so that custom practice works on my phone.
30. As a standard-test user, I want standard tests, stored personal bests, and supported ghosts to keep working, so that adding Custom does not disrupt existing practice.

## Implementation Decisions

- Extend the existing typing UI and run lifecycle with a distinguishable custom-practice mode. Keep the approved Neo Brutalist visual identity.
- Provide an editor, validation feedback, and "Use this text" action. Keep editor focus separate from typing capture: editing must not start a timer or trigger typing-test restart shortcuts.
- Reject blank or whitespace-only input and input exceeding 2,000 characters; never silently cut a passage. Apply whitespace normalization after input validation, trimming the passage and converting runs of whitespace into single spaces. The input limit refers to entered text before normalization; document the character-count convention in the control.
- Preserve all remaining characters and their order. Reuse the existing character-comparison and scoring behavior; no translation, shuffling, or punctuation removal is introduced.
- Custom uses timed completion exclusively. Offer the existing four durations; do not terminate when a passage or a standard word-count preset is exhausted.
- Generate repeatable continuation from the normalized passage with one space between copies. Continue supplying text throughout the run, including across the existing typing-display pages. Do not impose a fixed repeat count that can end practice early.
- Begin timing with the first typing keystroke and finish at the selected duration. Display WPM and accuracy using the existing scoring conventions.
- Applying valid text abandons and resets any current attempt without recording it as completed. Invalid text does not replace the applied passage. Retry preserves the passage and selected timer.
- Changing a custom timer uses the existing reset-on-settings-change behavior; never mix durations within one run.
- Persist the last successfully applied normalized passage and custom timer in browser-local settings. This is one remembered setup, not a saved-passage library. Unapplied drafts are not a separate persistent feature.
- Validate restored settings before using them. Missing or invalid stored settings must not crash the app or produce an invalid typing target. Reuse the existing 60-second initial duration when no valid custom timer is saved.
- Keep usable in-memory settings when storage fails and provide visible feedback that settings cannot be remembered. Preserve the history module's session-only fallback for results where applicable.
- Give custom runs a distinct run classification and readable label that includes the selected timer. Do not encode them as standard generated-word modes or create a personal best for them.
- Extend local-history saving so custom practice can be stored without updating personal-best storage. Prevent custom runs from receiving best badges, previous-best comparisons, or ghost actions.
- Audit local-history derived summaries as well as the personal-best store. Keep custom entries inspectable as practice, but exclude them from standard best-by-mode records and combined standard-test aggregates; a labeled history row alone is insufficient isolation.
- Explicitly block custom results from cloud inserts and ghost creation or replay, even when a user is signed in. This also keeps them out of public and owner profile statistics and trends.
- Preserve existing standard history, scoring, cloud saving, personal bests, and supported ghost behavior. No cloud schema migration or custom-text RPC is planned.
- Store the remembered passage only in local settings; local result records need practice metrics and classification rather than copies of the full passage or a replay payload.

## Testing Decisions

- Primary seam: the browser-visible practice workflow, including visible results, persisted setup, local history, and absence of cloud effects. Good tests assert observable behavior and persisted outcomes rather than component state, handler names, or rendering internals.
- Verify guest and signed-in entry, keyboard editor use, paste, apply, retry, switching modes, timer changes, and a 320px viewport. Confirm typing shortcuts do not interfere with editing.
- Cover whitespace-only rejection, exactly 2,000 characters, 2,001 characters, line breaks, tabs, repeated spaces, capitalization, and punctuation. Verify rejection leaves the applied passage intact and does not silently truncate input.
- Verify each duration starts on the first typing keystroke and ends at expiry. Use a short passage to exercise multiple repetitions and a long passage to exercise paging; confirm repetition does not stop the run or reset its score.
- Verify known correct and incorrect typing against existing WPM and accuracy semantics, including characters near repetition and page boundaries.
- Reopen the same browser profile and verify the last applied passage and timer are restored. Cover missing and corrupt stored settings, blocked storage, and storage-full failure with usable practice and visible feedback.
- Seed existing standard runs and personal bests, complete custom practice, and verify a labeled local-history entry appears without changing standard records or awarding best badges. Inspect best-by-mode and combined standard aggregates, not only the personal-best storage key.
- For a signed-in custom run, verify no result insert or custom-text upload is sent and no ghost is created or offered. Confirm a subsequent standard run still follows the normal cloud-save and personal-best paths.
- Secondary seam only where needed: exercise the existing pure scoring/text functions and history persistence interface with controlled inputs and storage failure. Prefer these existing module boundaries over new internal test hooks.
- Prior art: existing scorer, seeded text generation, history storage fallbacks, and browser checks from earlier feature work. The current checkout has no checked-in automated test suite or test script; do not claim prior automated coverage or passing tests that are absent.
- Run the existing lint and production-build checks during implementation. A passing build does not substitute for typing, persistence, scoring-isolation, and keyboard checks.
- The browser-first test boundary was proposed to the user for confirmation during synthesis. Testing-tool feedback may refine the verification approach without reopening the settled feature behavior.

## Out of Scope

Untimed passage completion, custom word-count presets, shuffled custom word lists, a passage library, persistent draft editing, custom-text account sync, cross-device setup restoration, public passage sharing, custom ghosts, cloud storage of custom runs, custom rankings or personal bests, paragraph-layout fidelity, a new scoring formula, and redesigning the site.

## Further Notes

The initial proposal to finish when the passage ends was rejected. The agreed behavior is timed practice with passage repetition. The initial 10,000-character recommendation was replaced by the user's 2,000-character limit. Custom results remain local practice, and authentication is optional. Persistent login is specified as an independent verification-first feature.
