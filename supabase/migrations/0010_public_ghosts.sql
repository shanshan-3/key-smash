begin;

create function public.get_profile_ghost(requested_mode text, requested_handle text default null)
returns table (
  handle text,
  mode text,
  wpm integer,
  accuracy double precision,
  word_count integer,
  duration_s integer,
  elapsed_s double precision,
  seed integer,
  word_set_version integer,
  trace jsonb
)
language sql stable security definer set search_path = ''
as $$
  with winner as (
    select p.handle, r.* from public.results r
    join public.profiles p on p.id = r.user_id
    where r.mode = requested_mode and (
      (requested_handle is null and p.id = auth.uid()) or
      (requested_handle is not null and p.published and p.handle = lower(requested_handle))
    )
    order by r.wpm desc, r.acc desc, r.id asc limit 1
  ), sample_values as (
    select case when jsonb_typeof(s.value->'second') = 'number' then (s.value->>'second')::numeric end as second,
      case when jsonb_typeof(s.value->'correctChars') = 'number' then (s.value->>'correctChars')::numeric end as position,
      w.duration_s
    from winner w cross join lateral jsonb_array_elements(w.samples) s(value)
  ), replay_points as (
    select s.second, max(s.position) as position from sample_values s
    where s.second > 0 and s.second <= s.duration_s and s.position >= 0
    group by s.second
  )
  select w.handle, w.mode, w.wpm, w.acc, w.word_count, w.duration_s,
    w.elapsed_s, w.seed, w.word_set_version,
    coalesce((select jsonb_agg(jsonb_build_object('second', s.second, 'position', s.position) order by s.second) from replay_points s), '[]'::jsonb)
  from winner w;
$$;

revoke all on function public.get_profile_ghost(text, text) from public;
grant execute on function public.get_profile_ghost(text, text) to anon, authenticated;

create or replace function public.get_owner_ghost(requested_mode text)
returns table (
  handle text,
  mode text,
  wpm integer,
  accuracy double precision,
  word_count integer,
  duration_s integer,
  elapsed_s double precision,
  seed integer,
  word_set_version integer,
  trace jsonb
)
language sql stable security definer set search_path = ''
as $$
  select * from public.get_profile_ghost(requested_mode, null);
$$;

revoke all on function public.get_owner_ghost(text) from public;
grant execute on function public.get_owner_ghost(text) to authenticated;

commit;
