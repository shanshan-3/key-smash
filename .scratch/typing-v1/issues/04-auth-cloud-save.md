# 04: Optional Supabase auth + cloud save

**What to build:** opt-in login that never blocks typing — Google + email via Supabase with callback route, header Login/avatar toggle, runs auto-save with wpm/acc/mode/word-count/duration/missed-key counts/seed/date under own-rows-only RLS, Supabase-down falls back to local-only run.

**Blocked by:** 02 (Quotes + results + local PB).

**Status:** ready-for-agent

- [ ] Guest types without login; login button opens Supabase Google + email flow and returns to test
- [ ] Logged run auto-saves and is readable only by its owner
- [ ] Supabase unreachable still shows full results with local save, no crash
