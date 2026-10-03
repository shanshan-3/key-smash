# 01: Scaffold + time-mode test engine

**What to build:** a runnable brutalist speed test for 15/30/60/120s with infinite word stream — timer starts on first keystroke, live WPM + countdown, current-word-only backspace, Tab restart, standard WPM/Acc scoring, boxed card with block caret.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Guest runs a 15s test end-to-end with no login and sees WPM + Acc on finish
- [x] Timer starts on first keystroke, stops at 0; Tab restarts instantly
- [x] Backspace limited to current word; errors show red, current word boxed yellow
- [x] Light brutalist theme: off-white bg, 3px borders, hard shadows, radius 0, yellow accent, Space Mono test text
