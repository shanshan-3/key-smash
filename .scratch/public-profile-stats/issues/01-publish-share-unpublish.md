# 01: Publish, share, and unpublish a profile

**What to build:** a signed-in typist chooses a handle from private Stats, explicitly publishes a shareable public profile, copies its URL, and can take it offline. Visitors can open the link without an account and see the handle, all-time cloud run count, average WPM, and average accuracy. This slice includes the complete database, public lookup, routing, and owner-control path; personal bests and renaming follow in separate tickets.

**Blocked by:** None (can start immediately).

**Status:** resolved (implementation complete; live deployment pending)

- [x] Existing and new accounts start unpublished. Logging in never automatically creates a public identity, and publishing requires an authenticated owner and a valid handle.
- [x] The Public profile panel appears in private Stats independently of whether the owner has any saved runs. Existing local and cloud history remain usable.
- [x] Handles normalize to lowercase and contain 3–20 ASCII letters, digits, or single internal hyphens. Leading, trailing, and repeated hyphens are rejected. Application route names, including auth, stats, and u, are reserved.
- [x] Inline feedback identifies invalid or unavailable handles. Database validation and case-insensitive uniqueness prevent duplicate claims, including simultaneous submissions; a conflict leaves the owner's existing state intact.
- [x] Only the authenticated owner can read or update their profile record. Existing authentication/profile creation continues to work, and existing accounts can publish even if their profile row needs backfilling.
- [x] Publish persists the handle and publication state, displays the current public URL, and enables copying it. Copy success is announced; clipboard failure leaves a visible, selectable URL and actionable feedback.
- [x] The public `/u/:handle` route resolves without login on direct load, refresh, and browser back/forward navigation. Navigation away from the public page works with the existing typing and Stats routes.
- [x] The public lookup is one aggregate RPC with a fixed database search path, explicitly granted to intended callers. It returns only the handle, run count, rounded average WPM, and rounded average accuracy for a published profile.
- [x] Counts and averages use all of the owner's cloud-saved runs, with no private Stats fetch limit and no inclusion of local-only runs. Navigation or reload reflects newly saved cloud results.
- [x] A published account with zero cloud runs displays an honest empty state and does not present nonexistent averages as measured scores.
- [x] Unknown and unpublished handles show the same generic profile-not-found state. Loading and request errors are distinct from not-found, with an actionable retry for errors.
- [x] Unpublish clearly states that the public page will become unavailable, removes it from subsequent lookups immediately, and retains the handle, account, and results. The owner can republish the retained handle.
- [x] Anonymous callers cannot select raw profiles or results. The public response exposes no account IDs, emails, authentication metadata, individual runs, timestamps, missed keys, seeds, or pace samples.
- [x] The owner panel and public page follow the existing brutalist design, fit narrow screens without document overflow, and support keyboard operation with visible focus and announced action feedback.
- [x] Manually verify owner controls, anonymous lookup, aggregate calculations, empty/error/not-found states, duplicate handling, copy failure, unpublish/republish, and cross-account access restrictions. Build and lint pass; no automated test files, scripts, or dependencies are introduced.
- [x] Record the required migration deployment order: enable the database changes and RPC before the profile controls, and keep existing private Stats usable when the feature is unavailable.

## Comments

Implemented in commit `8592551`. Validation and independent Standards/Spec
reviews are recorded in [public profile deployment notes](../../../docs/public-profiles.md).
Lint and build pass; PostgreSQL permission/aggregate checks and browser UI checks
used temporary tools outside the repo. No automated test tooling was added.
Apply migration 0004 before frontend deployment, then smoke-check the real
Supabase authentication and hosting paths. Personal bests and renaming remain
separate tickets.

