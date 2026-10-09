# 03: Add the owner Profile workspace and account menu

**What to build:** a signed-in typist gets a private `/profile` workspace that previews the shared performance ledger, keeps detailed local/cloud history below it, and provides compact publication and handle controls. Signed-in navigation becomes a Profile account menu with direct access to the dashboard, detailed statistics, public page, and logout.

**Blocked by:** 02 (Build the performance ledger and personal records).

**Status:** resolved (code verified; migration 0006 deployment pending)

- [x] Add `/profile` as the signed-in account destination and hosting fallback. Wait for authentication restoration before deciding private-route redirects so the wrong page does not flash.
- [x] Redirect signed-in `/stats` visits to `/profile`. Redirect signed-out `/profile` visits to guest `/stats`. Preserve direct loads, refresh, back/forward navigation, and heading focus.
- [x] Replace the signed-in Stats and Log out controls with a Profile menu containing View profile, Your stats, conditional View public page, and Log out.
- [x] Make View profile open the top of `/profile`, Your stats target the private history section, and View public page appear only when the profile is published. Logging out returns to typing.
- [x] Make the menu keyboard operable, expose expanded state, keep it inside narrow viewports, close it on selection, Escape, outside interaction, route change, or logout, and return focus to the trigger when appropriate.
- [x] Retrieve the owner's aggregate ledger through the shared contract without requiring publication or an existing handle. Before a handle exists, show “Your profile” and the complete private dashboard preview.
- [x] Keep profile-dashboard loading and failure independent from local/cloud history. An aggregate error offers retry while the existing history source selector and individual-run inspection remain usable.
- [x] Place compact owner controls after the handle and total ledger. Preserve initial publication, copy success/failure, unpublish, republish, retained handle, and clearly announced action feedback.
- [x] Add inline handle editing with explicit edit, save, and cancel states. Apply the established lowercase normalization, length, character, reserved-name, and case-insensitive uniqueness rules.
- [x] Rename atomically while preserving publication state, account, and saved results. Treat a normalized unchanged handle as unchanged rather than a conflict.
- [x] On a successful published rename, update the displayed URL and menu link immediately; the new public URL resolves and the old URL becomes the same generic not-found state as unknown or unpublished profiles, without redirects or aliases.
- [x] On invalid, unavailable, concurrent, cross-account, or failed rename attempts, preserve the persisted handle, publication state, working URL, and ability to retry.
- [x] Present the dashboard in the agreed order: handle and totals, owner controls, featured records, later analytics regions, then private history under a stable anchor.
- [x] Keep the profile handle as the only identity. Do not add an avatar, display name, bio, join date, level, XP, badges, or social links.
- [x] Manually verify restored sessions, signed-in and signed-out redirects, all menu destinations, conditional public link, logout destination, private preview with and without a handle, independent history, published/unpublished renames, conflict preservation, copy failure, keyboard focus, and narrow layouts. Lint and production build pass; no automated test tooling is added.

## Comments

Implemented on the current branch. Lint/build, temporary headless Chrome UI checks, and PGlite migration/security checks pass. Independent Standards and Spec reviews were resolved and rechecked. See [deployment and verification notes](../../../docs/public-profiles.md). Migration 0006 and live authentication/hosting smoke checks remain deployment work; no automated test tooling was added.

