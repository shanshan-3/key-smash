begin;

create function public.reserve_profile_route_handle()
returns trigger language plpgsql set search_path = '' as $$
begin
  -- Preserve existing handles while reserving the new route for future claims.
  if new.handle = 'profile' then
    if tg_op = 'INSERT' then
      raise check_violation using message = 'The profile handle is reserved';
    elsif new.handle is distinct from old.handle then
      raise check_violation using message = 'The profile handle is reserved';
    end if;
  end if;
  return new;
end;
$$;

revoke all on function public.reserve_profile_route_handle() from public;
create trigger reserve_profile_route_handle before insert or update on public.profiles
  for each row execute function public.reserve_profile_route_handle();
commit;
