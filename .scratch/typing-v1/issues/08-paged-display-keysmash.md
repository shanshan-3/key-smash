# 08: Paged 20-word display with adaptive progress + KEYSMASH title

**What to build:** the test box stays short with fixed 20-word pages plus adaptive progress, branded KEYSMASH — pages replace forward-only with no backspace into prior pages, page count is ceiling of N divided by 20 with a short tail accepted, progress label and bar adapt to N, tab title and header read KEYSMASH. Within-page deletion is free per the page-scope backspace spec (this ticket only locks pages); accuracy uses press-count so fixed typos still score.

**Blocked by:** 07 (Finite N-word test with picker + whichever-first finish).

**Status:** done

- [ ] Box shows fixed 20 words per page (100 gives 5 pages, 60 gives 3, 50 gives 20+20+10, 25 gives 20+5)
- [ ] Completing a page advances forward-only with no backspace into prior pages
- [ ] Progress shows page position and word position out of N plus a progress bar
- [ ] Tab title and header read KEYSMASH with the same brutalist style
