# 05: Cloud samples sync plus richer Stats

**What to build:** per-second samples sync to Supabase with each logged-in run so charts work cross-device, and the Stats timeline draws per-run curves from cloud data when available.

**Blocked by:** 01 (Per-second sampling upgrade).

**Status:** done

- [x] Migration adds a samples column to the results table with owner-only access
- [x] Logged-in runs upload samples; offline or failed uploads keep local-only data intact
- [x] Stats timeline renders per-run curves from cloud samples when present

## Comments

2026-10-08: Implementation complete. Migration `supabase/migrations/0003_run_samples.sql` adds samples and actual elapsed seconds under existing owner-only RLS. Runs save locally before any cloud request. Stats retains daily averages and adds selectable per-run curves, a mode filter, and loading/error/retry states. Requests time out after ten seconds. Browser backend traffic was intercepted; uploads and cloud states were verified against mock responses. The migration has not been applied to the live project, and real authentication/cloud integration was not exercised. Evidence: [verification](../../ui-hardening/verification.md).
