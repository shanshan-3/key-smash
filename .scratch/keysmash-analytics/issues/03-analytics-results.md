# 03: Analytics results screen

**What to build:** the results screen reads hero, then chart, then stats — big WPM/ACC with NEW BEST, a hand-rolled canvas WPM-over-time chart with the PB run overlaid, then raw/net/consistency/missed-keys/mode chips with rematch and stats actions.

**Blocked by:** 01 (Per-second sampling upgrade), 02 (Local 50-run history store).

**Status:** done

- [x] Hero card shows WPM, ACC, and NEW BEST in monkeytype order
- [x] Canvas chart draws this run's WPM curve plus the PB run's curve in TrendChart's visual language, zero new deps
- [x] Stat grid shows raw WPM, net WPM, consistency, missed keys, and mode chips
- [x] PBs without sampled runs show an honest unlock hint instead of a fabricated overlay

## Comments

2026-10-08: Added responsive canvas charts, actual elapsed time, final partial-interval samples, and accessible measurement tables. PB comparison uses the preceding best's recorded samples. Fixed final-input replacement that previously erased mistakes before scoring. Browser checks cover early finish, PB overlay, paging, and 200% text zoom. Evidence: [verification](../../ui-hardening/verification.md).
