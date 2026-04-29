-- Allow any authenticated user to read every profile so the app can show
-- a "platform" directory of other users on the Players tab.
-- Inserts/updates/deletes still gated to auth.uid() = id by the existing policies.

drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_select_all_authed on public.profiles;

create policy profiles_select_all_authed on public.profiles
  for select to authenticated
  using (true);
