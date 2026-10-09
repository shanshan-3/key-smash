# Public profile deployment

Apply migrations 0001–0010 to Supabase in order before deploying the profile UI.
Migration 0004 backfills missing profile rows without publishing any account,
adds owner updates and handle constraints, and grants anonymous callers access
to `get_public_profile` only. Run it as the migration/database owner so the
security-definer function can aggregate results through row-level security.

Migration 0005 adds `get_profile_dashboard` and an owner-results lookup index.
Apply it before deploying the ledger frontend. It retains `get_public_profile`
unchanged so the previous frontend works before and after the migration.
Do not deploy the new frontend first: a missing dashboard RPC produces the
public page's retryable request error. Private history and publishing controls
continue to use their existing endpoints.

Deploy the frontend and `vercel.json` together. The `/stats`, `/profile`, and `/u/:handle`
rewrites serve the application on direct navigation and refresh. Other hosts
need equivalent SPA fallbacks for these paths.

Before the migration is available, profile settings show their own error and
retry action. Private local/cloud history continues independently.

The dashboard RPC returns only a handle, cloud run count, rounded whole-number
average WPM, average accuracy rounded to one decimal place, measured typing
seconds rounded to a whole second, and personal-best aggregates. Each best
contains its mode, run count, winning WPM, and accuracy from the same run.
WPM wins first, accuracy breaks ties, and the smallest internal result ID breaks
remaining ties without being returned. It includes every cloud run across modes.
Missing elapsed values are not estimated. No measured elapsed time returns null;
no runs means null averages and an empty record list.
Unknown and unpublished handles both return no row. Requests use no application
cache; unpublishing takes effect on subsequent lookups. An already open page
refreshes its data on reload or navigation, rather than polling.

Handles are lowercased before submission and validated again in the database.
The unique index arbitrates concurrent claims. An unavailable handle is reported
inline after submission; no anonymous availability endpoint exposes private
handles. Unpublishing retains the handle. Owner controls support inline rename
with save/cancel and preserve publication state. Both rename and publication
updates require the expected persisted handle, so a stale tab cannot overwrite
a newer identity. Reload profile settings resolves stale-tab feedback.

Passing a normalized handle to the dashboard RPC returns only a published
profile. A null handle returns only the authenticated caller's own profile,
including unpublished profiles; anonymous callers receive no row. The owner
dashboard uses this private lookup. Both owner and public dashboards show
weekly mode improvement and a 52-week activity ledger. Owners can race their
cloud records while private. Public ghost challenges remain in ticket 07.

Migration 0006 reserves `profile` for future handle claims through an insert/update
trigger. Existing accounts using that handle keep their URL and publication
controls. The trigger rejects changing another handle to `profile`; ordinary
publication changes and unchanged handles remain allowed. Apply it before the
owner workspace frontend. Migration 0005 remains required for owner aggregates.

Migration 0007 extends `get_profile_dashboard` with `weekly_mode_trends`.
Its changed table return type requires dropping and recreating the function in
one transaction, restoring the empty search path and explicit execution grants.
Apply it before deploying the improvement chart. The legacy public RPC and
existing dashboard fields remain available. Each weekly entry contains only
`week_start` (a UTC Monday date), `mode`, `run_count`, and rounded `average_wpm`.
The current UTC week and previous 51 weeks are included; older results remain
in all-time totals and personal records. Missing weeks have no aggregate entry.

Migration 0008 adds `weekly_activity` to the same aggregate RPC, recreating it
atomically and restoring execution grants. Apply it before deploying the activity
ledger. Activity contains exactly 52 chronological UTC Monday dates and completed
cloud-run counts across every mode, including zero-run buckets. Only `week_start`
and `run_count` are returned for each entry. Existing totals, records, trends, and
the legacy public lookup remain available. The frontend uses the returned window
as a snapshot until navigation or reload, so the browser clock cannot shift it.

Migration 0009 adds `word_set_version` with default 1 to saved results, backfills
existing results, and creates `get_owner_ghost(requested_mode)`. Apply it before
deploying owner races or the versioned result writer. The RPC has an empty search
path and explicit authenticated execution grant; anonymous execution is denied.
It selects only `auth.uid()`'s winning result, whether or not the profile has a
handle or is published. Winner ordering matches personal records: WPM descending,
accuracy descending, internal ID ascending. Only handle, mode, WPM, accuracy,
word count, duration, elapsed time, seed, word-set version, and a derived trace
of `second` plus `position` are returned. Raw samples, keystrokes, missed keys,
IDs, account information, and individual timestamps remain private.

Deploy `/profile/race/:mode` and `/profile/race` hosting fallbacks with the
frontend. The latter shows a generic unavailable state for a missing mode.
Version-1 generation preserves the original word list and random generator;
future word-set changes must retain this implementation. Unsupported versions
are unavailable rather than silently producing a different word stream.

## Verification — 2026-10-08

`npm.cmd run lint` and `npm.cmd run build` pass. No automated test files,
scripts, or project dependencies were added.

Manually exercised migrations 0001–0004 in a temporary PGlite PostgreSQL runtime
outside the repository. Two accounts started private, including one missing
its profile row before backfill. Owner reads returned only their own row;
cross-account updates affected no rows. Anonymous raw reads failed with 42501.
Duplicate claims failed with 23505 without changing the claimant's state;
uppercase, short, reserved, leading/trailing-hyphen, and repeated-hyphen handles
failed with 23514. A published empty profile returned zero runs and null
averages. A 201-run profile returned all 201 runs, 50 average WPM and 99.9%
average accuracy. Unpublished and unknown handles both returned no rows;
republishing restored the same handle and aggregates.

Manually inspected Chrome through CDP with in-memory API/session fixtures:
owner controls alongside empty local history, lowercase input, duplicate
feedback, unavailable settings isolated from history and successful settings retry,
publish/unpublish/republish, copy success and denied-clipboard fallback,
selectable URL, public aggregate and zero-run states, not-found, request failure,
retry, direct navigation and browser history. At 320px the public page and owner
panel had document width 320px; keyboard Tab showed a solid focus outline.
Browser fixtures verify presentation and interaction, not live authentication.
The live Supabase migration and a deployed-host smoke check remain outstanding.

## Standards

Independent review of `804db62...8592551`: no documented-standard violations or
actionable heuristic findings. Standards findings: 0; no worst issue.

## Spec

Independent review against ticket 01: no missing behavior, incorrect implementation,
or scope creep found by inspection. Spec findings: 0; no worst issue. Personal
bests and renaming remain in tickets 02 and 03.

## Ticket 02 verification

Lint and production build pass. No automated test files, scripts, or project
dependencies were added. Migration 0005 has not been applied to live Supabase;
apply it before deploying the ledger frontend.

Manually exercised migrations 0001–0005 in a temporary PGlite PostgreSQL runtime.
A 209-run profile across five modes returned all 209 runs, 52 average WPM,
99.8% average accuracy, and 61 measured seconds from two 30.25-second entries;
older null durations did not contribute. Each best retained its winning-run
accuracy, including equal-WPM records where 98% beat 97%. The ordering includes
ascending internal result ID for remaining ties without returning that ID.
Zero runs returned null averages/time and an empty list. Anonymous null-handle
requests and unknown/unpublished handles returned no rows. Authenticated null-
handle requests returned only the caller's own private or handleless profile.
Anonymous raw reads failed with 42501. The legacy RPC still returned its
original four-field aggregate. The new function's fixed empty search path and
security-definer property were confirmed.

Manually inspected Chrome with in-memory API fixtures. Five modes produced four
featured rows ordered by practice count and best WPM; the inline table sorted
word counts and durations numerically. Enter expanded the native disclosure and
focus had a solid outline. Fewer modes rendered only available rows, null time
showed a dash, and zero runs showed no measured averages or invented records.
Loading, request error, successful retry, not-found, and navigation back from
typing were checked. Desktop and 320px screenshots were inspected; mobile
document width remained 320px. These browser checks do not replace a live
deployment smoke check after the migration.

### Standards

Independent review of `bc3a7c2...cfc9d10`: no documented-standard violations or
actionable heuristic findings. Standards findings: 0; no worst issue.

### Spec

Independent review against ticket 02: no code behavior mismatch or scope creep.
One operational requirement remains: apply migration 0005 before enabling the
frontend. Spec code findings: 0; pending deployment requirement: 1.

## Ticket 03 verification — 2026-10-09

Implemented the owner `/profile` workspace, shared ledger preview, separate
private history under `#history`, and the account menu. Session restoration
finishes before private-route redirects; authenticated `/stats` redirects to
Profile and guest `/profile` redirects to Stats. Logout returns to typing.

Lint and production build pass. This JavaScript project has no configured
typecheck or automated test suite. No automated test tooling or dependencies
were added to the repository.

Temporary headless Chrome/CDP fixtures verified restored-session redirects,
history anchor focus, menu Escape focus return and all destinations, conditional
public links, logout, public navigation and browser back, handleless preview,
initial publish, rename while published/private, unchanged handles, duplicate
feedback, stale-tab rejection and settings reload, clipboard denial, unpublish/
republish, aggregate failure isolated from local/cloud history, dashboard retry,
generic not-found for old URLs, and owner/menu containment at 320px. Browser
fixtures verify interactions rather than live Supabase authentication.

Temporary PGlite checks exercised migrations 0001–0006: existing `profile`
handles retain publication and unchanged-update access; new reserved claims
fail with 23514; duplicates fail with 23505 without changing the row; rename
replaces the public URL; expected-handle conditions reject stale writes; owner
RLS blocks cross-account rename; private owner aggregates remain available;
anonymous null-handle, unpublished, and raw-table access remain denied.

Independent Standards and Spec reviews found two correctness issues and one
duplication concern, all fixed and re-reviewed with no remaining findings.
Migration 0006 has not been applied to live Supabase. Apply it before deployment
and smoke-check real authentication and hosting fallbacks afterward.

## Ticket 04 verification — 2026-10-09

The shared dashboard now renders weekly mode improvement below personal records,
before private owner history. Its default mode follows featured-record ordering:
run count descending, best WPM descending, then mode identifier. The selector
offers every practiced combined mode. The range buttons select 12, 26, or 52
UTC Monday buckets including the current week. Black steps connect consecutive
measured weeks, square points show each measurement, and yellow identifies the
latest measured week. Missing weeks remain gaps; recorded zero WPM remains a
measurement. A native disclosure exposes every bucket's date, WPM, and run count.
Mode/range status is announced, and SVG marks have no keyboard tab stops.

Lint and production build pass. No typecheck or automated test suite is
configured, and no automated test tooling or dependencies were added.
Independent Standards and Spec reviews found no actionable issues.

Temporary PGlite verification applied migrations 0001–0007 and checked a
211-result profile, 205 runs in one week, rounded mode averages, the exact
oldest included bucket, the excluded preceding microsecond, Sunday/Monday UTC
boundaries, exclusion of the next week's boundary, and identical trends under
Singapore and Los Angeles session timezones. Weekly objects contain exactly the
four documented summary fields. Anonymous private/unpublished requests remain
empty, raw table reads remain denied, and unpublished owners can read trends.

Temporary headless Chrome fixtures verified all three bucket counts, default
mode ordering and ties, gaps, real zero WPM, latest-point emphasis, single-mode
and single-week views, zero-mode and empty-range states, the accessible table
and live status, keyboard controls, reduced motion, shared owner/public placement,
new cloud measurements after reload, retry and generic not-found states.
Desktop and 320px screenshots were inspected. Mobile document width remains
320px and chart labels retain their size as the viewport changes.

Migration 0007 has not been applied to live Supabase. Apply it before deployment;
these fixture checks do not replace the live authentication and hosting smoke check.

## Ticket 05 verification — 2026-10-09

Public and owner dashboards now show the activity strike ledger after improvement,
before private owner history. Each measured week's yellow strike scales against
the busiest visible week. Zero weeks retain an inspectable position without a
fabricated strike; an entirely inactive year has an explicit empty state. The
selected week has a black underline and keyboard focus has an outline. Desktop
shows 52 positions in one row; narrow screens show two chronological rows of 26.

The ledger has one roving tab stop. Left/right and up/down inspect adjacent
weeks; Home/End select the oldest/latest week. Every button announces its exact
UTC date range and completed-run count. Hover, tap, and a native week selector
provide equivalent details through a visible live status. The selector makes
exact inspection available without needing to tap a narrow strike.

Lint and production build pass. No typecheck or automated test suite is configured;
no automated test tooling or dependencies were added. Independent Standards and
Spec reviews are clear after fixing a client-clock issue: the ledger now renders
server buckets directly rather than recalculating dates on interaction.

Temporary PGlite checks applied migrations 0001–0008. A 211-result profile
returned all-time totals and 52 activity buckets, with 206 current-week runs
across two modes. Exact oldest-week and Sunday/Monday boundaries, zero weeks,
January 1 grouped into its preceding-year UTC Monday, fresh counts on the next
request, and an empty profile's 52 zero buckets passed. Existing mode trends,
timezone independence, aggregate-only fields, anonymous privacy, and unpublished
owner access passed as well.

Temporary headless Chrome checks covered all-zero, single-week, uneven-volume,
and equal-maximum histories; one tab stop; arrow/Home/End navigation and exact
live announcements; hover outlines; actual touch taps and native selection;
reduced motion; owner placement; anonymous public lookup; reload freshness;
request retry and generic not-found. Moving the browser clock forward a week
left server dates and counts unchanged. Desktop and 320px screenshots were
inspected; mobile document width remained 320px.

Migration 0008 has not been applied to live Supabase. Apply it before frontend
deployment and complete the live authentication/hosting smoke checks afterward.

## Ticket 06 verification — 2026-10-09

All local combined modes now expose Race your best. Owner record rows and the
expanded records table open authenticated cloud challenges at
`/profile/race/:mode`, including for unpublished accounts. Explicit cloud
selection takes precedence over local PBs. Settings and seeded versioned text
stay locked; restart/rematch preserves the selected ghost, while ordinary typing
navigation clears it even when a local race already uses `/`.

Recorded correct-progress points are interpolated and clamped to the target.
Unsampled old records use constant final-average WPM pacing. The ghost is marked
within the current text page; an edge indicator preserves its presence when its
position is outside that page. Target WPM, exact position, and character lead/
deficit remain readable. Results compare the challenged ghost first, using WPM
then accuracy for win/tie/loss, with independent local personal-best feedback.
The dashed ghost pace also has accessible tabular measurements. Completed runs
use normal local/PB persistence and the signed-in challenger's cloud account.
Local PBs now accept higher accuracy when WPM ties.

Lint and production build pass. No typecheck or automated test suite is configured;
no automated test tooling or dependencies were added. Standards and Spec reviews
are clear after fixing same-route local exits, ordinary-run preservation on login,
off-page ghost markers, and missing-mode race routes.

Temporary PGlite checks applied migrations 0001–0009: existing records backfilled
to version 1; cloud winner ordering selected matching accuracy and the smallest
internal ID; derived trace points excluded malformed/out-of-range samples and
raw metrics; private handleless owners could race; older records returned an
empty trace for fallback; missing and cross-account modes returned no data;
anonymous ghost execution and raw-table reads remained denied.

Temporary headless Chrome fixtures exercised all 16 cloud and all 16 local
combined modes, owner actions while unpublished, cross-device cloud lookup,
explicit-cloud priority, locked settings, seeded target text, refresh/back,
restart/rematch after a new PB, interpolation/fallback and clamping, win/tie/loss
rules, independent PB badges, local/cloud result payloads, unsupported versions,
retryable errors, missing-mode routing, page-edge markers in both directions,
keyboard restart, reduced motion, guest local-only saving, and login without
discarding an ordinary active run. A 320px screenshot was inspected and mobile
document width remained 320px. Version-1 text was compared with the pre-change
generator across all word counts and multiple seeds and remained identical.

Migration 0009 has not been applied to live Supabase. Apply it before frontend
deployment and smoke-check real authentication, race deep links, and cloud saves.

## Ticket 07 verification — 2026-10-09

Published record rows and the expanded records table now offer Race this ghost.
Public challenges use `/u/:handle/race/:mode` with hosting rewrites for direct
loads and refresh. Guests and signed-in challengers share the existing locked,
seeded race engine. Restart/rematch retain the selected ghost; ordinary typing
clears it and browser history restores the challenge from its URL.

Migration 0010 adds `get_profile_ghost` with anonymous and authenticated execution.
A non-null handle selects only a currently published profile's winning mode,
ordered by WPM, accuracy, then internal ID. Only the approved replay fields and
derived second/position trace leave the lookup. Raw profile/result/sample access
remains denied to anonymous callers. The existing authenticated owner RPC delegates
to the same selection logic, preserving access to private owner records.

Results name the challenged handle and show outcome, deltas, ghost pace, and an
independent challenger PB badge. Saves use the challenger's normal local history
and, when signed in, their own cloud account. A ghost already in memory survives
owner unpublishing and challenger login; fresh loads check current publication.

Lint and production build pass. Standards and Spec reviews have no remaining
findings after fixing long-handle wrapping. No automated test tooling or dependencies
were added; the repository has no configured typecheck or automated test suite.

Temporary PGlite checks applied migrations 0001–0010 and verified normalized
anonymous lookup, exact winning-run ordering and field whitelist, filtered trace,
missing modes/handles, rename/unpublish invalidation, raw-table denial, preserved
private owner access, challenger insert isolation, RLS rejection of owner inserts,
and an unchanged owner profile and complete result set after challenger saves.

Temporary headless Chrome fixtures covered all 16 public modes, featured/table
actions, direct links, refresh, back/forward, deterministic text, locked settings,
restart/rematch, generic invalid-route/handle/version states, retryable network
errors, old-record fallback, guest local/PB saves, signed-in challenger cloud saves,
mid-race unpublish and login, no owner mutations, keyboard restart, and reduced
motion. At 320px, race and result screens also fit maximum-length wide-character
handles. The mobile race screenshot was inspected. Malformed percent encoding was
checked through browser history because Vite rejects it before serving the SPA.

Migration 0010 has not been applied to live Supabase. Apply it before deploying
the frontend, then smoke-check real authentication, public deep links, publication
changes, and cloud saves on the deployed host.
