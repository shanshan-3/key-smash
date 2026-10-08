-- KEYSMASH cloud runs: profiles + results with owner-only row security.
-- Apply with: supabase db push (linked project) or paste into the SQL editor.

create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade
);

create table if not exists results (
  id bigint generated always as identity primary key,
  user_id uuid not null references profiles (id) on delete cascade,
  wpm int not null,
  acc float not null,
  mode text not null,
  duration_s int not null,
  word_count int not null,
  missed_keys jsonb not null default '{}',
  seed int not null,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table results enable row level security;

-- Own rows only: read, insert, and (for idempotent re-seeds) update.
create policy "own profile read" on profiles for select using (auth.uid() = id);
create policy "own profile insert" on profiles for insert with check (auth.uid() = id);

create policy "own results read" on results for select using (auth.uid() = user_id);
create policy "own results insert" on results for insert with check (auth.uid() = user_id);
