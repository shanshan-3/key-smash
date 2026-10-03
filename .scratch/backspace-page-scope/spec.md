Status: ready-for-agent

# Backspace across the page, locked across pages, mistakes always count

## Problem Statement

When I mistype a letter I want backspace to erase it so I can fix it — anywhere on the page I'm looking at, including words I already finished with space. Today backspace stops at the start of the current word, so a committed word can't be revisited. Pages replacing each other must stay locked: I never want backspace to pull the previous page back.

## Solution

Backspace moves freely inside the current 20-word page: wrong letters erase, finished words on the same page can be re-entered and fixed, and the run continues. Backspace never crosses a page boundary and never works after the run finishes. Every physical keypress counts toward accuracy, so a typo that gets fixed still lowers the score.

## User Stories

1. As a typist, I want backspace to erase a wrong letter mid-word, so that I can fix it immediately
2. As a typist, I want backspace to erase correct letters too, so that navigation feels uniform
3. As a typist, I want backspace at the start of a word to enter the previous word on the same page, so that committed words stay fixable
4. As a typist, I want backspace to cross spaces freely inside the page, so that I never hit an invisible wall mid-page
5. As a typist, I want backspace to stop at the first character of the page, so that the prior page never comes back
6. As a typist, I want backspace to do nothing after the run finishes, so that results stay stable
7. As a typist, I want a fixed typo to still count as a mistake, so that the score reflects what happened
8. As a typist, I want live accuracy to drop the moment I mistype even if I fix it right away, so that feedback is honest
9. As a typist, I want final accuracy computed over all keypresses, so that fast fixers don't outscore clean typists
10. As a typist, I want WPM to keep measuring correct characters over elapsed time, so that fixing costs time but not double punishment
11. As a typist, I want the same behavior on every word count and every duration, so that there is nothing new to learn per mode
12. As a typist, I want the timer to keep running while I fix mistakes, so that corrections cost time fairly
13. As a typist, I want Tab to restart cleanly including the mistake count, so that bad runs cost nothing
14. As a typist, I want switching word count or duration to reset the mistake count, so that stale errors never leak across runs
15. As a first-word typist, I want the same rules at position zero, so that the start of the test behaves like everywhere else

## Implementation Decisions

- Modules: test-engine delete guard widened from word-start to page-start; typing UI passes the page boundary instead of the word boundary and counts every physical keypress for accuracy; scorer reused unchanged with the full press count as its keystroke input.
- Boundary: the only backspace limit is the first character of the visible page; spaces are ordinary erasable characters inside the page.
- Locked pages: completing a page still replaces it forward-only; the prior page's text is gone and unreachable by any input.
- Finished runs: all input ignored once the run ends by words or by timer, including backspace.
- Accuracy: correct characters over total physical presses (presses include characters later erased); fixing a typo repairs the text but never repairs the count.
- WPM: correct characters over elapsed time, unchanged in formula; only the accuracy input changes meaning.
- Restart and picker switches clear both the text and the press count together.
- Same behavior for all word counts and all durations; no per-mode exceptions and no first-word exception.

## Testing Decisions

- Good test means external behavior only: given a boundary plus a cursor plus a press log, assert whether deletion is allowed and what accuracy results — never DOM structure or key handlers.
- Modules tested: test-engine pure guard (allowed inside the page, blocked at page start, blocked after finish) and the scorer fed with a press count larger than the final text length.
- Prior art: the existing vitest suites for the delete guard, the seeded generator, and the scorer — follow the same given-input and assert-output style at the same single seam. One seam total; no new test seam proposed.

## Out of Scope

- Backspace across page boundaries, page history, or a back button for pages
- Per-word mistake highlighting beyond the existing inline error style
- Mistake counts per key, heatmaps, or stats pages (owned by their own tickets)
- Changing WPM to punish mistakes beyond the time corrections already cost
- Custom word lists, quote mode text, international lists

## Further Notes

- This supersedes the current-word-only rule from the original scaffold and the forward-only assumption that implied it; forward-only now applies to pages, not words.
- Tracker impact: the finite-test ticket, the paged-display ticket, and the quotes-results ticket assume word-locked deletion and final-length accuracy — all three need their acceptance updated to page-scope deletion and press-count accuracy.
