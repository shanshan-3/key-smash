# 02: Quotes + results + local PB

**What to build:** a complete results screen that persists personal bests locally — results overlay with big WPM + Acc + consistency + PB badge + restart, per-key accuracy heatmap, localStorage PB per mode. (Quote mode SHORT/MED was built, then fully removed per user call — time mode only.)

**Blocked by:** 09 (Page-scope backspace + mistakes always count).

**Status:** done

- [x] Results show WPM, Acc, consistency, NEW BEST badge when beaten, heatmap of missed keys, restart works, with Acc on press-count so fixed typos still score
- [x] PB per mode survives refresh as guest with no backend, keyed by word count plus duration so switching N never overwrites PB
- [x] Quote mode removed: SHORT/MED picker, quote lists, and quote PB keys deleted from code
