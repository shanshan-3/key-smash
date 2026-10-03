# 09: Page-scope backspace + mistakes always count

**What to build:** backspace erases anywhere inside the visible page including finished words, never crosses a page boundary and never works after the run finishes — every physical press counts in accuracy so a fixed typo still lowers the score.

**Blocked by:** 08 (Paged 20-word display with adaptive progress + KEYSMASH title).

**Status:** done

- [ ] Backspace erases wrong and correct letters anywhere inside the current page, crossing spaces freely
- [ ] Backspace stops at the first character of the page and never pulls the prior page back
- [ ] Backspace does nothing after the run finishes by words or by timer
- [ ] Accuracy counts every physical press so fixed typos still score; WPM keeps measuring correct characters over elapsed time
- [ ] Restart and picker switches clear the press count with the text
