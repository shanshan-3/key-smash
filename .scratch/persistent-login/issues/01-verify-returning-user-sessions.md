# 01: Verify and fix returning-user sessions

**What to build:** returning users stay signed in after refreshing or reopening the same browser. Verify the existing Supabase session lifecycle and correct demonstrated failures while preserving explicit logout, revoked-session handling, and optional guest practice.

**Blocked by:** None (can start immediately).

**Status:** resolved (local browser verification complete; live account smoke pending).

- [x] Verify the current behavior before changing authentication. If it already meets the requirements, record the evidence without adding redundant authentication code.
- [x] Google OAuth and email magic-link login each establish a session that survives refresh, navigation, and closing and reopening the same persistent browser profile at the same site origin.
- [x] Restored account controls and account-dependent actions use the original signed-in identity. Standard runs and profile access do not switch to a different account or remain incorrectly signed out.
- [x] An expired access token with a valid refresh session renews through Supabase without requiring another login.
- [x] Explicit logout remains effective after refresh and reopening. Invalid or revoked refresh sessions require login and do not grant account access.
- [x] Session-restoration errors receive understandable feedback. Temporary network failures are not treated as an explicit logout request; storage failures do not crash the application.
- [x] Guest typing remains available when signed out, when authentication fails, and when Supabase is unconfigured.
- [x] Retain Supabase ownership of access tokens, refresh, storage, and validation. Add no parallel JWT issuer, custom authentication backend, login provider, or remember-me setting.
- [x] Preserve the existing visual identity and standard-test behavior. No database migration or new API contract is planned.
- [x] Verify through browser-visible behavior rather than internal token structures. Record the browser-profile and origin conditions for return-visit checks.
- [x] Perform a real configured-environment return-visit smoke check where available. Record unavailable credentials, deployment settings, or external-service blockers separately; mocked checks and a build alone do not establish live session persistence.
- [x] Run existing lint and production-build checks for any code change. Report any demonstrated deployment-configuration cause with the correction needed.

## Comments

Implemented only persistent-login 01. Browser-first TDD reproduced missing callback feedback and missing storage-persistence feedback. The fix waits for SDK callback initialization, matches incoming code callbacks to its PKCE flow, exposes restoration errors through the existing dialog, and labels unavailable-storage login as session-only. Normal persistent sessions and refresh remain with Supabase.

All 11 local browser checks, lint, and the production build pass. Provider responses are HTTP fixtures; checked criteria refer to local app/SDK behavior. A real-account deployed smoke check is unavailable without an authenticated test account and remains explicitly pending in the verification notes. No live deployment-configuration defect was demonstrated. Existing unrelated App and CSS edits were excluded from this ticket's commit.
