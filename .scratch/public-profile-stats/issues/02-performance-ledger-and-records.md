# 02: Build the performance ledger and personal records

**What to build:** visitors can open a published profile and immediately understand the typist's overall cloud record and strongest practiced configurations. The page becomes a distinctive KEYSMASH performance ledger with an oversized handle, four headline totals, four featured records, and an inline view of every populated mode. This slice establishes the shared aggregate contract that later owner, improvement, and activity slices extend.

**Blocked by:** 01 (Publish, share, and unpublish a profile) — resolved.

**Status:** resolved (code verified; migration 0005 deployment pending)

- [x] Add a new aggregate profile contract while retaining the existing public lookup during rollout. A normalized handle returns one published profile or no row; a null handle is reserved for the authenticated owner's later private workspace.
- [x] Return only the handle, completed cloud-run count, rounded all-time average WPM, rounded average accuracy, recorded typing seconds, and personal-best aggregates. Continue excluding account identity, individual runs, result IDs, timestamps, seeds, missed keys, and pace samples.
- [x] Sum recorded typing time from non-null measured elapsed values only. Do not estimate missing history from configured durations; return no measured total when none exists.
- [x] Produce one personal best for every populated combined mode from all cloud results, including results beyond the private history limit. Local-only runs never contribute.
- [x] Select a winning run by WPM descending, accuracy descending, then stable internal result ID ascending. Return the winning accuracy from that same run without exposing the tie-breaker ID.
- [x] Include each mode's completed-run count so the four featured records can be selected by run count descending, winning WPM descending, then mode identifier.
- [x] Keep the aggregate function behind a fixed empty search path with fully qualified objects, revoked default access, and explicit anonymous/authenticated execution grants. Anonymous raw profile and result reads remain denied.
- [x] Redesign the public profile in the established light brutalist system: oversized `@handle`, a ruled total ledger, and numbered score-sheet rows rather than an avatar, soft cards, or a dark dashboard.
- [x] Show completed runs, average WPM, average accuracy, and compact recorded typing time. Use an em dash for unavailable measured values and never invent an average or duration for a zero-run profile.
- [x] Feature up to four most-practiced modes with readable combined word-count/time-limit labels, winning WPM, matching accuracy, and run count.
- [x] Provide a keyboard-operable “View all modes” control that expands an inline table ordered by word count, duration, and mode identifier. Omit unpopulated modes.
- [x] Preserve distinct loading, retryable error, zero-run, generic not-found, and populated states. Unknown and unpublished handles remain indistinguishable.
- [x] Reflow totals and records at narrow widths without document overflow, preserve visible focus, announce expansion state, and respect reduced motion.
- [ ] Apply the aggregate migration before enabling the new frontend. Confirm the existing public profile remains usable during the deployment sequence.
- [x] Manually verify more than 200 cloud runs, multiple modes, all tie-break stages, most-practiced ordering, fewer than four modes, null elapsed history, zero runs, anonymous privacy, keyboard behavior, and a 320px viewport. Lint and production build pass; no automated test tooling is added.

## Comments

Implemented in `cfc9d10`, with final copy and verification notes committed separately.
Lint/build and manual PostgreSQL/browser checks passed. Independent Standards
and Spec reviews found no code defects. Deployment remains gated on applying
migration 0005 before the new frontend; this environment has no database admin
connection. The legacy RPC is retained for a safe database-first rollout.
No automated test tooling was added. Owner routes, rename, trends, activity,
and ghost racing remain in tickets 03–07.
