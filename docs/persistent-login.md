# Persistent login verification

Ticket: persistent-login 01. Local verification completed on 2026-10-10.

Supabase remains responsible for session storage, token refresh, callback credential exchange, and logout. Its existing persistent-session and automatic-refresh defaults are retained. Persistence applies to the same browser profile and origin with usable browser storage.

The application now waits for Supabase callback initialization before cleaning the callback URL. Incoming code callbacks select the SDK's PKCE flow; ordinary Google and email sign-in retain the existing implicit flow. The SDK exchanges a code once, including when React development effects run twice. Rejected callbacks in the query string or URL fragment show a login explanation rather than silently returning to typing.

Restoration errors open the existing login dialog with connection feedback. Retryable callback service failures also show connection feedback rather than declaring a link expired. A temporary refresh failure retains SDK credentials, allowing a later return visit to recover once the service is available. When browser storage is unavailable at startup, Supabase falls back to memory; the dialog explains that login cannot be remembered and the signed-in footer says "this visit only". No independent token store or JWT service was added.

## Browser regression checks

Run `node --test tests/auth.browser.test.mjs` from the repository root. The test uses Node's built-in test runner, the installed Vite server, and headless Chrome through its debugging protocol. Set `CHROME_PATH` if Chrome is installed outside the default Windows location. In the managed sandbox, the browser command needs permission to run outside the sandbox so it can connect to Chrome's local debugging port.

The tests override the public Supabase configuration with an isolated fixture origin and intercept its HTTP requests. They use a fresh temporary Chrome profile and deliberately reuse it for browser restart checks. Fixture credentials are synthetic; no real account email, password, login link, or access token is used. A controlled browser clock exercises expiry and the SDK's network retry window without waiting for real token lifetimes.

| Check | Local result |
| --- | --- |
| Rejected fragment callback shows feedback and guest typing | Pass |
| Google callback, refresh, profile navigation, browser restart, and subsequent cloud save preserve identity | Pass |
| Logout survives browser restart; missing/expired callback requests a new link | Pass |
| Email magic-link callback survives refresh and browser restart | Pass |
| Expired access token refreshes without another login | Pass |
| Revoked expired refresh session returns to guest practice | Pass |
| Temporary refresh failure shows feedback and recovers without replacing credentials | Pass |
| Blocked storage allows session-only login, warns visibly, and retains guest typing | Pass |
| One-use PKCE callback signs in without a duplicate-exchange error | Pass |
| Callback service failure shows connection feedback rather than declaring the link expired | Pass |
| Unconfigured Supabase still permits a completed standard typing test | Pass |

Existing lint and production-build checks pass. This JavaScript project has no configured typechecking command. The browser regression file is the complete checked-in test suite for this change. Expected SDK warnings appear during the deliberately unavailable-service case.

## Live account smoke check

A real-account return-visit check remains pending: the workspace provides project configuration but no authenticated test account or usable Google/email login session. Fixture results do not prove deployed provider settings, redirect allowlists, session-lifetime settings, or live profile RPC availability.

On the intended deployed origin, sign in through each enabled provider, refresh, open the owner profile, close and reopen the same browser profile, and verify the original identity is restored. Then log out and verify reopening stays signed out. Use the exact origin configured in the authentication redirect allowlist; localhost, 127.0.0.1, preview deployments, and production are distinct storage origins. Existing profile deployment prerequisites remain separate from this authentication change.
