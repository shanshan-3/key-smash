# 04: Show mode-specific improvement over time

**What to build:** public visitors and profile owners can choose a practiced combined mode and see its weekly average WPM as a KEYSMASH stepped progress chart over 12 weeks, 6 months, or 1 year. The same chart appears in the shared public and owner dashboard without exposing individual runs or timestamps.

**Blocked by:** 02 (Build the performance ledger and personal records).

**Status:** resolved (code verified; migration 0007 deployment pending)

- [x] Extend the shared aggregate contract with weekly mode trends covering the current UTC week and preceding 51 weeks for every populated mode.
- [x] Return aggregate entries containing only UTC week start, mode, completed-run count, and rounded average WPM. Do not expose individual timestamps, run IDs, or raw result rows.
- [x] Calculate trends from all cloud results at request time. Exclude local-only runs and avoid cached rollups, polling, and subscriptions.
- [x] Default the chart to the most-practiced mode using the same ordering as featured records. Offer every populated combined mode with existing readable mode labels.
- [x] Offer 12 weeks, 6 months, and 1 year as the latest 12, 26, and 52 UTC week buckets, including the current week.
- [x] Render weekly average WPM as a stepped black line with square points and a yellow marker on the latest measured week. Weeks without runs appear as gaps, never as zero WPM.
- [x] Provide an accessible equivalent for chart values and announce mode/range changes without making decorative chart marks permanent tab stops.
- [x] Show an intentional empty state when the profile has no modes or the selected range contains no measurements. Preserve retryable aggregate errors and generic public not-found behavior.
- [x] Keep controls usable by keyboard and touch, fit the chart within a 320px viewport, and disable nonessential motion under reduced-motion preferences.
- [x] Manually verify all three ranges, UTC boundaries, inactive weeks, single- and multiple-mode profiles, default mode ties, newly saved runs after reload/navigation, anonymous response privacy, keyboard controls, and mobile rendering. Lint and production build pass; no automated test tooling is added.

## Comments

Implemented on the current branch. Lint/build, temporary headless Chrome UI checks, visual inspection at desktop and 320px, and PGlite UTC-boundary/privacy checks pass. Independent Standards and Spec reviews found no actionable issues. See [deployment and verification notes](../../../docs/public-profiles.md). Apply migration 0007 before frontend deployment; live Supabase smoke checks remain pending. No automated test tooling was added.

