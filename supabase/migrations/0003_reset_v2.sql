-- TennisRaptor v2 reset
-- Limpeza total: dropa qualquer schema antigo (incl. de outro sistema) e recria.
-- Foco social: profile rico (peso, altura, mão, estilo, região, pro similar, redes sociais).
-- Players = adversários do usuário. Matches inalterado. Tournaments/groups removidos.
--
-- IDEMPOTENTE: re-rodar dropa e recria. Não rode em prod com dados reais.

create extension if not exists "pgcrypto";

-- Drop tudo (cascade pega FKs e dependências de outras versões/sistemas).
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

drop table if exists public.matches cascade;
drop table if exists public.group_members cascade;
drop table if exists public.tournament_players cascade;
drop table if exists public.groups cascade;
drop table if exists public.tournaments cascade;
drop table if exists public.players cascade;
drop table if exists public.profiles cascade;

-- ============================================================
-- profiles: 1:1 com auth.users. Source of truth do "eu jogador".
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  handle text,
  avatar_url text,
  avatar_color text,

  -- Características físicas
  weight_kg integer check (weight_kg between 30 and 200),
  height_cm integer check (height_cm between 100 and 230),
  dominant_hand text check (dominant_hand in ('right','left')),

  -- Jogo
  play_style text check (play_style in ('serve_volley','defensive','all_court','offensive')),
  preferred_environment text check (preferred_environment in ('outdoor','indoor')),
  preferred_surface text check (preferred_surface in ('clay','hard','grass')),
  similar_pro_id text,

  -- Localização (proximity filter)
  region_state text,
  region_city text,

  -- Networking
  instagram_url text,
  linkedin_url text,

  -- Gate
  onboarding_completed boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_region_idx on public.profiles(region_state, region_city);

-- ============================================================
-- players: adversários cadastrados pelo usuário (não logam).
-- ============================================================
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
create unique index players_one_me_per_owner on public.players(owner_id) where is_me;

-- ============================================================
-- matches: histórico de partidas owner-scoped.
-- ============================================================
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  player1_id uuid not null references public.players(id) on delete cascade,
  player2_id uuid not null references public.players(id) on delete cascade,
  winner_id uuid references public.players(id) on delete set null,
  sets jsonb not null default '[]'::jsonb,
  surface text not null check (surface in ('clay','hard','grass')),
  format text not null check (format in ('best_of_3','best_of_5','pro_set')),
  notes text,
  duration_minutes integer,
  created_at timestamptz not null default now()
);

create index matches_owner_idx on public.matches(owner_id);
create index matches_p1_idx on public.matches(player1_id);
create index matches_p2_idx on public.matches(player2_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.profiles enable row level security;
alter table public.players enable row level security;
alter table public.matches enable row level security;

-- profiles: read aberto a authenticated (precisa pra proximity / players tab).
-- Write somente do dono.
create policy profiles_select_all_authed on public.profiles
  for select to authenticated using (true);
create policy profiles_insert on public.profiles
  for insert with check (auth.uid() = id);
create policy profiles_update on public.profiles
  for update using (auth.uid() = id);
create policy profiles_delete on public.profiles
  for delete using (auth.uid() = id);

-- players: owner-scoped CRUD
create policy players_select on public.players
  for select using (auth.uid() = owner_id);
create policy players_insert on public.players
  for insert with check (auth.uid() = owner_id);
create policy players_update on public.players
  for update using (auth.uid() = owner_id);
create policy players_delete on public.players
  for delete using (auth.uid() = owner_id);

-- matches: owner-scoped CRUD
create policy matches_select on public.matches
  for select using (auth.uid() = owner_id);
create policy matches_insert on public.matches
  for insert with check (auth.uid() = owner_id);
create policy matches_update on public.matches
  for update using (auth.uid() = owner_id);
create policy matches_delete on public.matches
  for delete using (auth.uid() = owner_id);

-- ============================================================
-- Auto-criar profile no signup. Pega name + avatar do Google se vier.
-- onboarding_completed=false força fluxo de onboarding pra preencher resto.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- updated_at auto
create or replace function public.touch_profiles_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_profiles_updated_at();
