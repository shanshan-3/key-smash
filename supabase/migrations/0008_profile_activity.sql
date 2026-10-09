begin;

-- Changing the table return type requires recreation; the transaction keeps the RPC available atomically.
drop function public.get_profile_dashboard(text);

create function public.get_profile_dashboard(requested_handle text default null)
returns table (
  handle text,
  run_count bigint,
  average_wpm numeric,
  average_accuracy numeric,
  recorded_typing_seconds numeric,
  personal_bests jsonb,
  weekly_mode_trends jsonb,
  weekly_activity jsonb
)
language sql stable security definer set search_path = ''
as $$
  with selected_profile as (
    select p.id, p.handle from public.profiles p
    where (requested_handle is not null and p.published and p.handle = requested_handle)
       or (requested_handle is null and p.id = auth.uid())
  ), owner_runs as materialized (
    select r.id, r.mode, r.wpm, r.acc, r.elapsed_s, r.created_at
    from public.results r join selected_profile p on p.id = r.user_id
  ), ranked_modes as (
    select r.mode, r.wpm, r.acc,
      count(*) over (partition by r.mode) as mode_run_count,
      row_number() over (partition by r.mode order by r.wpm desc, r.acc desc, r.id asc) as position
    from owner_runs r
  ), week_bounds as (
    select date_trunc('week', current_timestamp at time zone 'UTC') as current_week
  ), weekly_modes as (
    select date_trunc('week', r.created_at at time zone 'UTC') as week_start,
      r.mode, count(*) as mode_run_count, round(avg(r.wpm)) as average_wpm
    from owner_runs r cross join week_bounds b
    where r.created_at >= (b.current_week - interval '51 weeks') at time zone 'UTC'
      and r.created_at < (b.current_week + interval '1 week') at time zone 'UTC'
    group by date_trunc('week', r.created_at at time zone 'UTC'), r.mode
  ), weekly_activity as (
    select weeks.week_start, coalesce(sum(w.mode_run_count), 0)::bigint as run_count
    from week_bounds b
    cross join lateral generate_series(b.current_week - interval '51 weeks', b.current_week, interval '1 week') as weeks(week_start)
    left join weekly_modes w on w.week_start = weeks.week_start
    group by weeks.week_start
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
    ), '[]'::jsonb),
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'week_start', to_char(w.week_start, 'YYYY-MM-DD'), 'mode', w.mode,
        'run_count', w.mode_run_count, 'average_wpm', w.average_wpm
      ) order by w.week_start, w.mode)
      from weekly_modes w
    ), '[]'::jsonb),
    (select jsonb_agg(jsonb_build_object(
      'week_start', to_char(a.week_start, 'YYYY-MM-DD'), 'run_count', a.run_count
    ) order by a.week_start) from weekly_activity a)
  from selected_profile p;
$$;

revoke all on function public.get_profile_dashboard(text) from public;
grant execute on function public.get_profile_dashboard(text) to anon, authenticated;

commit;

