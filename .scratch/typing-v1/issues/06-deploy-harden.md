# 06: Vercel deploy + hardening

**What to build:** a public hardened release — Vercel build with env wiring, responsive brutalist layout at mobile + desktop, empty/error states for no-PB and Supabase-down, all prior slices verified on the live URL including word picker, paging, page-scope backspace, and KEYSMASH title.

**Blocked by:** 05 (Stats page (gated)).

**Status:** done

- [x] Public Vercel URL runs time tests, ghost, heatmap, auth, stats end-to-end (quote mode was removed; verify time modes only)
- [x] Mobile and desktop layouts keep test card readable with no overflow
- [x] No-PB, guest-stats-gate, and Supabase-down states all render cleanly
