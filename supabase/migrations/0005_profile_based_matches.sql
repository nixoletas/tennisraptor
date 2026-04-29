-- Profile-based players: drop tabela players, matches passa a referenciar profiles(id) direto.
-- Todos os "jogadores" agora são usuários reais cadastrados.
--
-- DESTRUTIVO: dropa matches existentes (FKs apontam pra players obsoleto).
-- Em dev. Não rode em prod com dados.

drop table if exists public.matches cascade;
drop table if exists public.players cascade;

-- ============================================================
-- matches v2: player1/player2/winner referenciam profiles
-- ============================================================
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,

  date date not null,
  scheduled_time time,
  location text,
  banner_url text,

  player1_id uuid not null references public.profiles(id) on delete cascade,
  player2_id uuid not null references public.profiles(id) on delete cascade,
  winner_id uuid references public.profiles(id) on delete set null,

  sets jsonb not null default '[]'::jsonb,
  surface text not null check (surface in ('clay','hard','grass')),
  format text not null check (format in ('best_of_3','best_of_5','pro_set')),
  notes text,
  duration_minutes integer,

  created_at timestamptz not null default now(),

  -- Sanity: não dá pra jogar contra si mesmo
  constraint matches_distinct_players check (player1_id <> player2_id)
);

create index matches_owner_idx on public.matches(owner_id);
create index matches_p1_idx on public.matches(player1_id);
create index matches_p2_idx on public.matches(player2_id);

-- ============================================================
-- RLS
-- ============================================================
alter table public.matches enable row level security;

-- Visível pro owner E pros dois jogadores envolvidos (proprietário pode não ser P1).
create policy matches_select on public.matches
  for select using (
    auth.uid() = owner_id
    or auth.uid() = player1_id
    or auth.uid() = player2_id
  );
create policy matches_insert on public.matches
  for insert with check (auth.uid() = owner_id);
create policy matches_update on public.matches
  for update using (auth.uid() = owner_id);
create policy matches_delete on public.matches
  for delete using (auth.uid() = owner_id);
