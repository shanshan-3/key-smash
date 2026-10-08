# 01: Per-second sampling upgrade

**What to build:** every run records two per-second series — correct characters and total keystrokes — so raw WPM, net WPM, and the per-run chart all draw from real measured data instead of end-of-run totals.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Engine helper builds per-second samples of correct-chars and keystrokes, covered by tests
- [x] Live run tracking feeds the sampler each tick without changing scoring results
- [x] Existing tests, lint, and production build all pass
