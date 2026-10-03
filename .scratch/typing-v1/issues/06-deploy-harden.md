# 06: Vercel deploy + hardening

**What to build:** a public hardened release — Vercel build with env wiring, responsive brutalist layout at mobile + desktop, empty/error states for no-PB and Supabase-down, all prior slices verified on the live URL including word picker, paging, page-scope backspace, and KEYSMASH title.

**Blocked by:** 05 (Stats page (gated)).

**Status:** ready-for-agent

- [ ] Public Vercel URL runs time + quote tests, ghost, heatmap, auth, stats end-to-end
- [ ] Mobile and desktop layouts keep test card readable with no overflow
- [ ] No-PB, guest-stats-gate, and Supabase-down states all render cleanly
