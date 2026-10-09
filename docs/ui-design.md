# KEYSMASH UI decisions

Direction comes from the owner's brutalist brief and `.scratch/typing-v1/spec.md`.
ENERGY 3 / RHYTHM 2 / MOTION 1.

- Off-white paper, black ink, and the existing yellow preserve KEYSMASH's print-like character; red is reserved for actual errors.
- Archivo Black carries the wordmark and scores; Space Mono makes typing positions and numerical comparisons easy to follow.
- A large typing surface is the focal point. Duration and word settings sit together below the masthead, apart from navigation.
- Thick rules divide major regions. Hard shadows lift the typing surface and primary action; secondary controls and data sit flat.
- Yellow identifies the current word and primary action. Selected settings use inverse black, so the accent keeps its purpose.
- Compact settings, spacious test text, and a restrained footer establish rhythm without extra decorative sections.
- Results show the measured score first, the measured pace curve second, and supporting metrics and missed keys last.
- Solid and dashed black chart lines distinguish the current run and PB without relying on color. A table exposes the same measurements to assistive technology.
- The caret moves only to track input and stops moving with reduced motion. No decorative loops, gradients, icons, or new visual assets.
- The fixed light theme follows the existing spec; a theme toggle remains out of scope.
- Tab restarts only inside the typing input or from the results surface; Shift+Tab and Escape allow keyboard navigation out of the test.
- Guests can inspect their last 50 local runs. Cloud history is a separate authenticated source, with explicit loading and retry states.
- Public profile controls sit above history so an empty run list never hides publishing. Public aggregates reuse the flat summary rows; zero-run profiles show no measured averages. Share URLs remain selectable if clipboard access fails.
- Public records lead with an oversized handle, four ruled totals, and numbered score rows for the most-practiced modes. All records expand inline; narrow screens use a two-column ledger and stacked score rows.
- Profile improvement uses a black stepped line and square points for weekly mode averages, with yellow reserved for the latest measured week. Missing weeks stay blank. Native mode/range controls and a weekly table expose the same values; chart labels keep their size on narrow screens.
- Activity uses 52 thin yellow strikes scaled against the busiest UTC week, with empty positions for zero weeks. A black underline and focus outline identify the inspected week. Arrow keys, hover, taps, and a native selector expose exact dates/counts; mobile wraps into two chronological rows.
- Owner records offer flat ghost race actions. Races lock their text/settings, mark the ghost with a black underline and page-edge labels, and show a readable character delta. Results put challenged-ghost scoring ahead of pace/detail inspection; PB feedback stays independent.
- Published records offer the same ghost actions to visitors. Public races name the challenged handle in the heading and results, wrap long handles on mobile, and reuse the existing race controls and unavailable/retry states.
