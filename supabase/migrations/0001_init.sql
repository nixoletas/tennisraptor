-- TennisRaptor schema
-- Each table is scoped to its owner via owner_id (= auth.uid()).
-- Row-level security restricts every operation to rows owned by the caller.
--
-- Idempotent: re-running drops the existing app tables (cascade) and recreates
-- them. Safe in dev — DO NOT run against a database with real data.

create extension if not exists "pgcrypto";

-- Drop in reverse-FK order so cascades don't fight us.
drop table if exists public.matches cascade;
drop table if exists public.group_members cascade;
drop table if exists public.tournament_players cascade;
drop table if exists public.groups cascade;
drop table if exists public.tournaments cascade;
drop table if exists public.players cascade;
drop table if exists public.profiles cascade;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  handle text,
  avatar_color text,
  created_at timestamptz not null default now()
);

create table public.players (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  handle text,
  avatar_color text not null,
  is_me boolean not null default false,
  created_at timestamptz not null default now()
);

create index players_owner_idx on public.players(owner_id);
create unique index players_one_me_per_owner
  on public.players(owner_id) where is_me;

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  format text not null check (format in ('round_robin','single_elim','groups')),
  surface text not null check (surface in ('clay','hard','grass','carpet','indoor')),
  start_date date not null,
  end_date date,
  status text not null default 'upcoming' check (status in ('upcoming','active','completed')),
  created_at timestamptz not null default now()
);

create index tournaments_owner_idx on public.tournaments(owner_id);

create table public.tournament_players (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  primary key (tournament_id, player_id)
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  admin_id uuid references public.players(id) on delete set null,
  created_at timestamptz not null default now()
);

create index groups_owner_idx on public.groups(owner_id);

create table public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  primary key (group_id, player_id)
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  player1_id uuid not null references public.players(id) on delete cascade,
  player2_id uuid not null references public.players(id) on delete cascade,
  winner_id uuid references public.players(id) on delete set null,
  sets jsonb not null default '[]'::jsonb,
  surface text not null check (surface in ('clay','hard','grass','carpet','indoor')),
  format text not null check (format in ('best_of_3','best_of_5','pro_set')),
  tournament_id uuid references public.tournaments(id) on delete set null,
  group_id uuid references public.groups(id) on delete set null,
  notes text,
  duration_minutes integer,
  created_at timestamptz not null default now()
);

create index matches_owner_idx on public.matches(owner_id);
create index matches_tournament_idx on public.matches(tournament_id);
create index matches_group_idx on public.matches(group_id);

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;
alter table public.tournaments enable row level security;
alter table public.tournament_players enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- profiles: row id == auth.uid()
drop policy if exists profiles_select on public.profiles;
drop policy if exists profiles_insert on public.profiles;
drop policy if exists profiles_update on public.profiles;
drop policy if exists profiles_delete on public.profiles;
create policy profiles_select on public.profiles for select using (auth.uid() = id);
create policy profiles_insert on public.profiles for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles for update using (auth.uid() = id);
create policy profiles_delete on public.profiles for delete using (auth.uid() = id);

-- owner-scoped tables
drop policy if exists players_select on public.players;
drop policy if exists players_insert on public.players;
drop policy if exists players_update on public.players;
drop policy if exists players_delete on public.players;
create policy players_select on public.players for select using (auth.uid() = owner_id);
create policy players_insert on public.players for insert with check (auth.uid() = owner_id);
create policy players_update on public.players for update using (auth.uid() = owner_id);
create policy players_delete on public.players for delete using (auth.uid() = owner_id);

drop policy if exists matches_select on public.matches;
drop policy if exists matches_insert on public.matches;
drop policy if exists matches_update on public.matches;
drop policy if exists matches_delete on public.matches;
create policy matches_select on public.matches for select using (auth.uid() = owner_id);
create policy matches_insert on public.matches for insert with check (auth.uid() = owner_id);
create policy matches_update on public.matches for update using (auth.uid() = owner_id);
create policy matches_delete on public.matches for delete using (auth.uid() = owner_id);

drop policy if exists tournaments_select on public.tournaments;
drop policy if exists tournaments_insert on public.tournaments;
drop policy if exists tournaments_update on public.tournaments;
drop policy if exists tournaments_delete on public.tournaments;
create policy tournaments_select on public.tournaments for select using (auth.uid() = owner_id);
create policy tournaments_insert on public.tournaments for insert with check (auth.uid() = owner_id);
create policy tournaments_update on public.tournaments for update using (auth.uid() = owner_id);
create policy tournaments_delete on public.tournaments for delete using (auth.uid() = owner_id);

drop policy if exists groups_select on public.groups;
drop policy if exists groups_insert on public.groups;
drop policy if exists groups_update on public.groups;
drop policy if exists groups_delete on public.groups;
create policy groups_select on public.groups for select using (auth.uid() = owner_id);
create policy groups_insert on public.groups for insert with check (auth.uid() = owner_id);
create policy groups_update on public.groups for update using (auth.uid() = owner_id);
create policy groups_delete on public.groups for delete using (auth.uid() = owner_id);

-- Junction tables: gate by parent ownership
drop policy if exists tp_select on public.tournament_players;
drop policy if exists tp_insert on public.tournament_players;
drop policy if exists tp_delete on public.tournament_players;
create policy tp_select on public.tournament_players for select using (
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.owner_id = auth.uid())
);
create policy tp_insert on public.tournament_players for insert with check (
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.owner_id = auth.uid())
);
create policy tp_delete on public.tournament_players for delete using (
  exists (select 1 from public.tournaments t where t.id = tournament_id and t.owner_id = auth.uid())
);

drop policy if exists gm_select on public.group_members;
drop policy if exists gm_insert on public.group_members;
drop policy if exists gm_delete on public.group_members;
create policy gm_select on public.group_members for select using (
  exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid())
);
create policy gm_insert on public.group_members for insert with check (
  exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid())
);
create policy gm_delete on public.group_members for delete using (
  exists (select 1 from public.groups g where g.id = group_id and g.owner_id = auth.uid())
);

-- Auto-create profile row on signup, seeded with name from user metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
