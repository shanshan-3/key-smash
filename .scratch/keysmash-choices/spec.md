Status: ready-for-agent

# KEYSMASH — word-count choices with paged 3-line view

## Problem Statement

The test shows a tall wall of 200 words that refills forever. It looks overwhelming at a glance. I want more words than a one-liner but not that long, and I want choices — not only 60 words.

## Solution

A brutalist speed-test site titled KEYSMASH. The typist picks a word count (25 / 50 / 60 / 100, default 60) beside the existing duration picker (15 / 30 / 60 / 120s). Every run shows a finite test of N words, paged as fixed 20-word pages (~3 lines each). Finishing a page replaces it with the next, forward-only. The run ends on whichever comes first: finishing word N or timer expiry. Early finish scores on actual elapsed time; timeout shows partial results.

## User Stories

1. As a typist, I want to pick 25 / 50 / 60 / 100 words, so that I control how long the test is
2. As a typist, I want 60 words pre-selected on load, so that the default matches the balanced middle
3. As a typist, I want the word picker beside the duration picker in one header row, so that controls stay in one place
4. As a typist, I want to also pick 15 / 30 / 60 / 120s independently, so that time pressure and length stay separate choices
5. As a typist, I want to see only ~3 lines at a time, so that the test never looks like a wall
6. As a typist, I want a finite N-word test with no refill, so that I know when it ends
7. As a typist, I want page 2 to replace page 1 on completion, so that the box stays short
8. As a typist, I want pages locked forward-only, so that I can't backspace into a prior page
9. As a typist, I want backspace to work inside the current word, so that small typos stay fixable
10. As a typist, I want a 25-word run to end as one full page plus a short 5-word tail, so that odd sizes still work
11. As a typist, I want the run to end when I finish the last word, so that long durations give instant results
12. As a typist, I want the run to end on timer expiry with partial results, so that short durations still score
13. As a fast typist, I want early-finish WPM computed on actual elapsed seconds, so that finishing quickly isn't punished
14. As a typist, I want to see page position and word position plus a progress bar that adapt to N, so that I know how far is left
15. As a typist, I want the timer to start on first keystroke, so that reaction time doesn't count
16. As a typist, I want Tab to restart with a fresh seed of the selected length, so that bad runs cost nothing
17. As a typist, I want switching word count or duration to restart with a fresh test, so that stale text never lingers
18. As a typist, I want live WPM plus countdown visible, so that I can pace
19. As a typist, I want errors shown red inline with current-word highlight and block caret, so that position stays obvious
20. As a visitor, I want the site titled KEYSMASH, so that it has an identity

## Implementation Decisions

- Modules: test-engine reused unchanged (seeded word stream, scorer, delete guard); typing UI modified (word-count picker state, duration state, paging state, finish conditions, progress display, title).
- Picks: word options 25 / 50 / 60 / 100 with default 60; durations unchanged with default 60s; both pickers live in the same header control group with the same button style.
- Text: single seeded stream of N words per run, split into fixed 20-word pages; page count is ceiling of N divided by 20; narrow screens may wrap past 3 lines and that variance is accepted.
- Short tail: a remainder page holds leftover words with no padding (25 becomes 20 plus 5).
- No infinite refill: the near-end append behavior is removed; the word list is fixed at reset or picker switch.
- Finish: whichever comes first — last-word complete shows results immediately, timer expiry shows partial results on typed-so-far.
- Scoring: live and timeout paths score on elapsed seconds; early-finish final scores on actual elapsed rather than full duration; timeout final scores on typed-so-far.
- Paging: forward-only; prior-page typos stand and count toward accuracy; no cross-page caret.
- Progress: compact label plus bar showing page position and word position out of N; no layout change to the card.
- Title: KEYSMASH in document title and header; existing brutalist tokens, fonts, and theme unchanged.
- Same word list and seeded generator; reset and picker switches generate a fresh seed for the selected N.

## Testing Decisions

- Good test means external behavior only: given a seed plus a keystroke string plus elapsed seconds, assert word-list length, page boundaries, and WPM/Acc — never DOM structure or key handlers.
- Modules tested: test-engine pure functions only (seeded generator determinism at counts like 25/60/100, scorer with elapsed versus duration seconds, delete guard unchanged).
- Prior art: the existing vitest suites for the scorer, the seeded generator, and the delete guard — follow the same given-input and assert-output style at the same seam. One seam total; no new test seam proposed. Paging stays plain slicing in UI state so it needs no new engine API.

## Out of Scope

- Strict CSS line clamping, resize observers, or variable words-per-line by width
- Cross-page backspace, per-duration word counts, linked duration-to-length pairs, custom user-entered lengths
- Quote mode, PB ghost, heatmap, auth, persistence, stats page, leaderboard, theme toggle
- New word lists, international lists, mobile-specific paging

## Further Notes

- Runs on long durations will mostly end by words; runs on short durations will mostly end by timer — intended per the whichever-first decision.
- The existing tracker tickets 07 (finite test plus finish and scoring) and 08 (paged display plus progress plus KEYSMASH) were written as fixed-60 and now need reparam to N from the picker with page math of ceiling of N divided by 20.
