begin;

create index if not exists results_user_id_idx on public.results (user_id);

create function public.get_profile_dashboard(requested_handle text default null)
returns table (
  handle text,
  run_count bigint,
  average_wpm numeric,
  average_accuracy numeric,
  recorded_typing_seconds numeric,
  personal_bests jsonb
)
language sql stable security definer set search_path = ''
as $$
  with selected_profile as (
    select p.id, p.handle from public.profiles p
    where (requested_handle is not null and p.published and p.handle = requested_handle)
       or (requested_handle is null and p.id = auth.uid())
  ), owner_runs as materialized (
    select r.id, r.mode, r.wpm, r.acc, r.elapsed_s
    from public.results r join selected_profile p on p.id = r.user_id
  ), ranked_modes as (
    select r.mode, r.wpm, r.acc,
      count(*) over (partition by r.mode) as mode_run_count,
      row_number() over (partition by r.mode order by r.wpm desc, r.acc desc, r.id asc) as position
    from owner_runs r
  )
  select p.handle,
    (select count(*) from owner_runs),
    (select round(avg(r.wpm)) from owner_runs r),
    (select round(avg(r.acc)::numeric, 1) from owner_runs r),
    (select round(sum(r.elapsed_s)::numeric) from owner_runs r),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'mode', r.mode, 'run_count', r.mode_run_count, 'wpm', r.wpm, 'accuracy', r.acc
      ) order by r.mode)
      from ranked_modes r where r.position = 1
    ), '[]'::jsonb)
  from selected_profile p;
$$;

revoke all on function public.get_profile_dashboard(text) from public;
grant execute on function public.get_profile_dashboard(text) to anon, authenticated;

commit;
