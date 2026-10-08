# 02: Local 50-run history store

**What to build:** finished runs persist locally with their per-second samples, missed keys, timestamp, and mode config, capped at the last 50 runs — closing and reopening the app keeps offline history and trend data.

**Blocked by:** 01 (Per-second sampling upgrade).

**Status:** done

- [x] Each finished run is stored with samples, missed keys, timestamp, and mode config
- [x] Store holds at most 50 runs, oldest evicted first
- [x] History survives reload and private-mode storage failures degrade gracefully

## Comments

2026-10-08: Implemented `src/history.js` with a session-memory fallback and six persistence tests. Browser checks confirm reload persistence, guest history access, and a visible session-only notice when writes fail. Evidence: [verification](../../ui-hardening/verification.md).
