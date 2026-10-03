# 07: Finite N-word test with picker + whichever-first finish

**What to build:** header gains a word picker (25 / 50 / 60 / 100, default 60) beside durations; every run is a finite N-word stream with no refill; switching either picker restarts fresh; the run ends on whichever comes first with early-finish WPM on actual elapsed seconds and timeout partial results.

**Blocked by:** 01 (Scaffold + time-mode test engine).

**Status:** done

- [ ] Word picker shows 25 / 50 / 60 / 100 with 60 pre-selected beside durations
- [ ] Every run starts a finite N-word test with no refill for the selected N
- [ ] Switching word count or duration restarts with a fresh test
- [ ] Finishing the last word ends immediately with WPM on actual elapsed seconds
- [ ] Timer expiry ends with partial WPM/Acc on typed-so-far
