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
