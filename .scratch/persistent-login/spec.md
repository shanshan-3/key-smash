Status: ready-for-agent

# Keep returning users signed in

## Problem Statement

Returning KEYSMASH users want to reopen the site in the same browser without logging in again. The requested outcome is persistent authentication; repeated login on the deployed site has not yet been reproduced. The existing Supabase client already persists sessions, refreshes tokens, and restores the session during startup.

## Solution

Verify the existing session lifecycle and fix any demonstrated failure so a successful login survives refresh, navigation, and closing and reopening the same browser. Continue using Supabase authentication, including its access tokens and refresh mechanism. Explicit logout and server-side revocation still end access.

## User Stories

1. As a returning user, I want my login restored when I reopen the site in the same browser, so that I can continue without another login prompt.
2. As a signed-in user, I want refreshing the page to preserve my login, so that reloading does not interrupt my work.
3. As a signed-in user, I want navigation between typing, history, and my profile to preserve my session, so that I can use account features continuously.
4. As a returning user, I want the account controls to reflect my restored session, so that I know which account is active.
5. As a signed-in user, I want valid refresh credentials to renew an expired access token, so that ordinary token expiry does not force another login.
6. As a user, I want explicit logout to survive reopening the site, so that my browser does not silently sign me back in.
7. As a user whose session was revoked, I want the site to request login again, so that revoked access is not restored.
8. As a guest, I want typing to remain available without an account, so that authentication remains optional.
9. As a user signing in through Google, I want the callback to establish a restorable session, so that my chosen login method supports return visits.
10. As a user signing in through an email magic link, I want the callback to establish a restorable session, so that my chosen login method supports return visits.
11. As a user whose browser cannot retain authentication storage, I want an understandable failure state and continued guest access, so that I can still practice.
12. As a returning user, I want account-dependent actions to use the restored identity, so that my standard runs and profile belong to the correct account.

## Implementation Decisions

- Retain the existing Supabase auth client, startup session restoration, auth-state subscription, callback handling, and logout flow. Change them only where verification demonstrates a defect.
- Persistent login means the same browser profile and site origin with usable browser storage. It does not promise access after storage is cleared or a session is revoked or otherwise invalidated by the authentication service.
- Let Supabase own token storage, refresh, and session validation. Do not add a parallel JWT issuer, independent token lifecycle, or custom authentication backend.
- Verify both supported sign-in methods and account-dependent screens. Successful refresh and restoration must produce the same signed-in identity as the original login.
- Keep authentication optional and preserve guest typing when Supabase is unavailable or unconfigured.
- Distinguish session restoration failure from an ordinary signed-out state using the existing authentication feedback conventions. Do not assume a temporary connection problem means that logout was requested.
- Preserve the existing visual identity and normal standard-test behavior.
- No database migration or new API contract is planned. If deployment settings cause repeated login, record the demonstrated cause and the configuration correction rather than inventing an application defect.

## Testing Decisions

- Primary seam: the browser-visible authentication lifecycle. A good test observes identity, account access, return visits, and logout rather than internal token representation or SDK method calls.
- Verify successful login, page refresh, navigation, closing and reopening the browser with the same persistent browser profile, and restoration into an account-dependent screen.
- Cover Google and email magic-link callbacks, ordinary access-token expiry with a valid refresh session, explicit logout followed by reopening, and an invalid or revoked refresh session.
- Exercise unavailable storage and network failures; verify useful feedback and continued guest typing. Do not treat a transient network error as evidence of revoked credentials.
- Prior art: the app already restores the Supabase session and observes auth changes; previous project verification used browser smoke checks. The current checkout has no checked-in automated test suite or test script.
- Use the configured live environment for a real return-visit smoke check where available. Mocked auth behavior or a production build alone does not prove deployed session persistence.
- Run existing lint and production-build checks for any eventual code change. Record deployment-only blockers separately from passing local checks.
- The browser test boundary was proposed to the user for confirmation during spec synthesis. Feedback may refine verification tooling without changing the agreed product behavior.

## Out of Scope

Custom JWT issuance, a replacement authentication service, new login providers, an optional remember-me checkbox, cross-device automatic login, bypassing session revocation, guest-history merging, and guaranteeing persistence when browser storage is cleared or unavailable.

## Further Notes

This is a verification-first feature. If the existing implementation meets the agreed behavior, document the successful checks without adding redundant authentication code. Custom timed practice is specified separately and does not require login.
