# Public profile deployment

Apply migrations 0001–0006 to Supabase in order before deploying the profile UI.
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
dashboard uses this private lookup. Trends, activity, and race actions remain
separate tickets.

Migration 0006 reserves `profile` for future handle claims through an insert/update
trigger. Existing accounts using that handle keep their URL and publication
controls. The trigger rejects changing another handle to `profile`; ordinary
publication changes and unchanged handles remain allowed. Apply it before the
owner workspace frontend. Migration 0005 remains required for owner aggregates.

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
