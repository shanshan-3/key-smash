Status: ready-for-agent

# Typing site v1 — brutalist speed test with timer

## Problem Statement

I want a typing speed-test site with a real timer, but Monkeytype looks soft and has no reason to come back. I want a brutalist version where I can beat my own 60s ghost and see which keys I miss, with optional login to keep history.

## Solution

A public React JS + Vite + Tailwind v4 site on Vercel with Supabase as optional backend. Guest can run full tests with local PB. Logged user (Google + email) auto-saves runs and sees stats. Brutalist light theme, boxed test card, 15/30/60/120s + short/medium quotes, 60s PB ghost, accuracy heatmap on results.

## User Stories

1. As a guest, I want to run a 15/30/60/120s test without login, so that I can try it instantly
2. As a typist, I want the timer to start on first keystroke, so that I don't lose time to reaction
3. As a typist, I want Tab to restart instantly, so that bad runs cost nothing
4. As a typist, I want backspace limited to current word, so that behavior matches Monkeytype expectations
5. As a typist, I want live WPM + countdown visible, so that I can pace
6. As a typist, I want errors shown red inline, current word boxed yellow, block caret, so that position is obvious in brutalist card
7. As a quote fan, I want short/medium quote mode, so that I can type real sentences
8. As a competitor, I want a 60s PB ghost marker on same seed with live +/- delta, so that I can race myself
9. As a competitor, I want no ghost shown before a first PB exists, so that empty state isn't confusing
10. As a learner, I want per-key accuracy heatmap on results, so that I know weak keys
11. As a typist, I want WPM = (correct chars/5)/minutes and Acc = correct/all keystrokes, so that scores are comparable
12. As a typist, I want results showing WPM big + Acc + consistency + PB badge + ghost delta + restart, so that one screen tells all
13. As a guest, I want local PB per mode in localStorage, so that refresh keeps best
14. As a user who opts in, I want Google + email login via Supabase, so that history persists
15. As a logged user, I want runs auto-saved with wpm/acc/mode/duration/missed-keys/seed/date, so that I never click save
16. As a logged user, I want a stats page with PB per mode + last 10 table + average graph, so that progress is visible
17. As a guest, I want stats route to explain login is needed, so that gating isn't silent
18. As a mobile/desktop user, I want brutalist light theme readable at all sizes, Space Mono test + Archivo Black headings, 0 radius, 3px borders, 4px hard shadows, so that style is consistent

## Implementation Decisions

- Modules: test-engine (pure: seeded word stream, quote picker, scorer, ghost-delta, heatmap aggregator), typing UI (input capture, caret, live stats), results overlay, stats page, auth client, persistence client (localStorage + Supabase), brutalist design tokens.
- Seeded text: PRNG seed stored per run so 60s PB ghost replays same word order; quotes are fixed local lists.
- Timer: countdown only, plain for v1 (uniqueness deferred), starts first keystroke, stops at 0, no penalty extensions.
- Data: profiles(id=auth id) + results(user_id, wpm int, acc float, mode enum time-15/30/60/120 + quote-s/m, duration_s, missed_keys jsonb counts only, seed int, created_at). RLS own-rows read/insert only. No guest-merge v1.
- Auth: optional, Supabase Google OAuth + email, callback route, header shows Login vs avatar.
- Theme tokens: off-white bg, black borders, acid yellow accent, block caret, yellow current-word box, black-on-red error.
- Routing: `/` test + results modal, `/stats` gated, `/auth/callback`.
- Offline/Supabase-down: show run + local save only, no queue.

## Testing Decisions

- Good test = external behavior only: given keystroke log + seed + time, assert WPM/Acc/consistency/missed-counts/ghost-delta, not DOM or key handlers.
- Modules tested: test-engine pure functions only (scorer, seeded generator determinism, heatmap aggregation, ghost comparison).
- Prior art: none — greenfield, no existing tests to follow. One seam total.

## Out of Scope

Leaderboard/multiplayer, custom wordlists, code mode, latency heatmap + live heatmap, ghosts for other modes/users, full keystroke-log storage, guest-history merge, theme toggle/settings page, offline sync queue, i18n / non-English lists.

## Further Notes

Timer uniqueness explicitly cut for v1 per user. Heatmap stays accuracy-only to avoid timestamp noise filtering. Tailwind v4 via Vite plugin assumed with JS (not TS) per Q18 answer.
