# 05: Show the 52-week UTC activity strike ledger

**What to build:** public visitors and profile owners can see a year of completed-run consistency as 52 proportional yellow weekly strikes. The visualization communicates exact aggregate counts without copying a square contribution heatmap or revealing individual activity timestamps.

**Blocked by:** 02 (Build the performance ledger and personal records).

**Status:** resolved (code verified; migration 0008 deployment pending)

- [x] Extend the shared aggregate contract with completed cloud-run counts for the current UTC week and preceding 51 weeks.
- [x] Return only aggregate UTC week starts and counts. Continue excluding individual timestamps, run IDs, raw results, account identity, and local-only history.
- [x] Render one narrow strike per week in chronological order. Scale strike height proportionally against the busiest visible week and use the established yellow accent without adding heatmap squares or soft cards.
- [x] State that week boundaries use UTC so owners and visitors see the same public record.
- [x] Make exact week labels and run counts available without hover through a roving-focus interaction. Support arrow-key movement without placing all 52 strikes in the normal tab order.
- [x] Give pointer users equivalent hover/tap details and keep the selected or focused week visually clear without relying on color alone.
- [x] Show an intentional zero-activity state instead of fabricated bars. Preserve loading, retryable error, and generic public not-found states from the shared dashboard.
- [x] Update on navigation or reload after new cloud runs without polling, subscriptions, or cached aggregate tables.
- [x] Keep the ledger within the viewport at 320px, preserve legible spacing and focus, and remove nonessential transitions under reduced motion.
- [x] Manually verify all-zero, single-week, uneven-volume, and equal-maximum histories; current-week and year-boundary bucketing; exact keyboard announcements; touch details; anonymous privacy; reload freshness; and mobile overflow. Lint and production build pass; no automated test tooling is added.

## Comments

Implemented on the current branch. Lint/build, temporary headless Chrome keyboard/touch checks, desktop and 320px visual inspection, and PGlite aggregate/UTC/privacy checks pass. Independent Standards and Spec reviews are clear. See [deployment and verification notes](../../../docs/public-profiles.md). Apply migration 0008 before frontend deployment; live Supabase smoke checks remain pending. No automated test tooling was added.
