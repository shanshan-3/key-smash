# 01: Complete timed custom-text practice

**What to build:** guests and signed-in users can enter their own passage, practice it repeatedly for a selected duration, inspect WPM and accuracy, and review labeled local practice history without affecting standard records, cloud statistics, or ghosts.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] Offer Custom alongside the existing Words and Time controls, with a text editor and an explicit "Use this text" action. Login is not required.
- [x] Accept nonblank input up to 2,000 entered characters before normalization. Clearly reject whitespace-only and oversized input without silent truncation; invalid input leaves the applied passage intact. Explain the character-count convention in the control.
- [x] Trim the passage and convert line breaks, tabs, and repeated whitespace into single spaces. Preserve all remaining characters, capitalization, punctuation, and order.
- [x] Editing does not change the active passage or start the typing timer. Typing-test shortcuts do not hijack input while the editor has focus.
- [x] Offer 15, 30, 60, and 120-second limits. Timing begins on the first typing keystroke and finishes at expiry, using the existing scoring conventions.
- [x] Repeat the normalized passage with one separating space between copies until the timer expires. Passage exhaustion and standard word-count presets never end a custom run early.
- [x] Supply continuation across typing-display pages without a fixed repeat-count limit, timer reset, or score reset. Verify both short repeating text and longer paged text.
- [x] Retry retains the applied passage and selected timer. Applying edited text or changing the timer resets the attempt without saving an abandoned run as completed.
- [x] Results show WPM and accuracy. Verify known correct and incorrect input, including capitalization, punctuation, repetition boundaries, and page boundaries.
- [x] Save completed custom runs in this browser's history with a distinct custom classification, a "Custom practice" label, and the selected duration. History entries store metrics and classification without copies of the full passage or a ghost replay payload.
- [x] Custom runs never update personal-best storage or receive best badges, previous-best comparisons, or ghost actions. Exclude them from standard best-by-mode records and combined standard-test aggregates while keeping their local history entries inspectable.
- [x] Signed-in custom runs send no cloud-result inserts or custom-text uploads, create no ghosts, and do not enter owner/public profile trends or cloud statistics. Enforce this behavior from the first usable version of Custom.
- [x] Preserve the existing local-history session-only fallback if result storage is blocked or full. Practice and results remain usable with clear storage feedback.
- [x] Existing standard tests, stored records, history, cloud saving, and supported ghost flows keep working. Verify a standard run after custom practice follows its normal saving and scoring paths.
- [x] Preserve the approved Neo Brutalist appearance. Verify editor, apply, timer, typing, and retry flows with keyboard focus and at a 320px viewport.
- [x] Use browser-visible checks as the primary verification boundary, including local-history outcomes and absence of cloud effects. Use existing pure scoring/text and history interfaces for controlled boundary checks where useful; do not create internal test hooks or claim absent automated coverage.
- [x] Check the 2,000/2,001-character boundary, whitespace-only input, all four durations, repeated passages, paging, reset behavior, and score isolation. Run existing lint and production-build checks.
- [x] Do not add account sync, public sharing, custom ghosts, cloud storage, a passage library, untimed completion, or a new scoring formula. Remembering the setup across visits belongs to ticket 02.

## Comments

Implemented only custom-timed-practice 01. Custom is available to guests and signed-in users with explicit draft application, pre-normalization validation, whitespace normalization, and unbounded timed repetition across display pages. Custom results retain metrics in local history without seeded replay fields or copies of the passage, and never update PBs or cloud results. Standard aggregates exclude custom practice.

Browser-first checks cover all four durations, the character-limit boundary, known scoring errors, repetition and paging, draft/apply/timer resets, native paste and Unicode, mixed standard/custom history, signed-in cloud isolation, storage blocked/full behavior, 320px keyboard use, and standard saving and local PB ghost racing afterward. The full 18-check suite passes against the exact scoped commit snapshot. Lint and production builds pass. HTTP fixtures verify app behavior without real cloud writes.

Standards review found no issues. Spec review found one ghost-verification gap, resolved by the passing standard PB race check. A captured 320px screenshot was visually inspected; editor text and surfaces have passing contrast. Setup persistence remains ticket 02. Pre-existing unrelated App and CSS edits are excluded from this commit.
