# 07: Race a published profile's ghost

**What to build:** any visitor can launch a published typist's personal best from its record row and race it at a shareable URL. The challenge reuses the proven ghost engine, exposes only the replay data needed for the selected winning run, saves the challenger's result as their own, and never changes the profile owner's data.

**Blocked by:** 06 (Race your own best in every mode).

**Status:** resolved (code verified; migration 0010 deployment pending)

- [x] Add Race this ghost to every populated personal-record row on a published public profile.
- [x] Open public challenges at `/u/:handle/race/:mode`. Direct load, refresh, browser back/forward, restart, rematch, and sharing preserve the selected profile and mode.
- [x] Extend the ghost lookup so a non-null normalized handle returns the selected winning mode only when that profile is currently published. Unknown, unpublished, superseded, or mode-less requests return no row.
- [x] Explicitly grant anonymous callers access to the ghost lookup while continuing to deny anonymous raw profile, result, and sample reads.
- [x] Return only the selected winner's approved replay fields: handle, mode, WPM, accuracy, word count, duration, elapsed time, seed, word-set version, and derived time-to-target-position trace.
- [x] Do not expose raw pace samples, raw keystrokes, missed keys, result IDs, individual timestamps, email, authentication metadata, or any non-winning run.
- [x] Reuse the same winning-run ordering, word-set generation, trace interpolation, average-WPM fallback, locked settings, live marker, ahead/behind delta, and race scoring as owner ghost races.
- [x] Show a generic ghost-unavailable state for unknown handles, unpublished profiles, old renamed handles, absent modes, malformed routes, and unsupported word-set versions. Keep network errors distinct and retryable.
- [x] If a public ghost is loaded and the owner unpublishes during the attempt, allow the in-memory race to finish. A new load or refresh after unpublishing becomes unavailable.
- [x] Save a guest challenger's completed race to their local history and personal best. Save a signed-in challenger's result locally and to their own cloud account.
- [x] Never update, insert, or otherwise alter the challenged profile owner's records, aggregate counts, handle, or publication state.
- [x] Results name the challenged handle, show win/tie/behind status and deltas, compare the challenger pace with the ghost, and independently report the challenger's own personal-best improvement.
- [x] Navigating to ordinary typing clears the public challenge. Returning through browser history restores it from the race URL rather than hidden navigation state.
- [x] Keep public race actions and states keyboard operable, visibly focused, screen-reader understandable, reduced-motion aware, and free of document overflow at 320px.
- [x] Manually verify anonymous and signed-in challengers, shared direct links, refresh/history, every combined mode, rename and unpublish invalidation, mid-race unpublish, old-record fallback, unsupported versions, guest/cloud persistence, owner-data isolation, raw-data denial, keyboard behavior, and mobile rendering. Lint and production build pass; no automated test tooling is added.

## Comments

Implemented public ghost race links and privacy-scoped lookup. Lint/build and temporary browser/database checks passed; Standards and Spec reviews are clear. Verification details: docs/public-profiles.md, Ticket 07. Live Supabase migration 0010 and deployment smoke checks remain pending.
