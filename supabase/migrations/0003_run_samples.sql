-- Existing owner-only results policies also protect these columns.
alter table public.results
  add column if not exists samples jsonb not null default '[]'::jsonb,
  add column if not exists elapsed_s double precision;

alter table public.results add constraint results_samples_array
  check (jsonb_typeof(samples) = 'array');
