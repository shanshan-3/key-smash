# Public profile deployment

Apply migrations 0001–0004 to Supabase in order before deploying the profile UI.
Migration 0004 backfills missing profile rows without publishing any account,
adds owner updates and handle constraints, and grants anonymous callers access
to `get_public_profile` only. Run it as the migration/database owner so the
security-definer function can aggregate results through row-level security.

Deploy the frontend and `vercel.json` together. The `/stats` and `/u/:handle`
rewrites serve the application on direct navigation and refresh. Other hosts
need equivalent SPA fallbacks for these paths.

Before the migration is available, profile settings show their own error and
retry action. Private local/cloud history continues independently.

The public RPC returns only a handle, cloud run count, rounded whole-number
average WPM, and average accuracy rounded to one decimal place. It includes
every cloud run across modes. No runs means null averages, rendered as dashes.
Unknown and unpublished handles both return no row. Requests use no application
cache; unpublishing takes effect on subsequent lookups. An already open page
refreshes its data on reload or navigation, rather than polling.

Handles are lowercased before submission and validated again in the database.
The unique index arbitrates concurrent claims. An unavailable handle is reported
inline after submission; no anonymous availability endpoint exposes private
handles. Unpublishing retains the handle. Renaming and public personal bests
remain separate tickets.

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
