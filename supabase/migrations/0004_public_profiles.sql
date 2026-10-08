begin;

alter table public.profiles
  add column handle text,
  add column published boolean not null default false,
  add constraint profile_handle_format check (
    handle is null or (
      length(handle) between 3 and 20
      and handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
      and handle not in ('auth', 'stats', 'u', 'type', 'login', 'logout', 'callback', 'admin', 'api')
    )
  ),
  add constraint published_profile_has_handle check (not published or handle is not null);

create unique index profiles_handle_unique on public.profiles (lower(handle));
create policy "own profile update" on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id);

insert into public.profiles (id)
  select id from auth.users on conflict (id) do nothing;

revoke all on public.profiles, public.results from anon;
grant select, insert, update on public.profiles to authenticated;

create function public.get_public_profile(requested_handle text)
returns table (handle text, run_count bigint, average_wpm numeric, average_accuracy numeric)
language sql stable security definer set search_path = ''
as $$
  select p.handle, count(r.id), round(avg(r.wpm)), round(avg(r.acc)::numeric, 1)
  from public.profiles p
  left join public.results r on r.user_id = p.id
  where p.published and p.handle = requested_handle
  group by p.id, p.handle;
$$;

revoke all on function public.get_public_profile(text) from public;
grant execute on function public.get_public_profile(text) to anon, authenticated;

commit;
