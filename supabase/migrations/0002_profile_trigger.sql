-- KEYSMASH: auto-create a profile row for every new auth user so results
-- inserts never hit the profiles FK, plus the missing own-results update policy.
-- Apply with: supabase db push (linked project) or paste into the SQL editor.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "own results update" on results for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
