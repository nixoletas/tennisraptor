-- Feed social: posts auto-criados ao confirmar match, reactions (🔥 fire / 😭 cry / 🐐 goat),
-- e comentários com mentions (@handle resolvido em uuid[] de profiles).
--
-- Posts são INSERT-only via trigger SECURITY DEFINER no matches → ninguém insere posts direto.
-- Feed é público pra todo authenticated user (gym-rats vibe: descoberta global).

create extension if not exists "pgcrypto";

-- ============================================================
-- posts: 1:1 com matches (após confirm). Snapshot de banner+caption.
-- ============================================================
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null unique references public.matches(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  caption text,
  banner_url text,
  created_at timestamptz not null default now()
);

create index if not exists posts_author_idx on public.posts(author_id);
create index if not exists posts_created_idx on public.posts(created_at desc);

-- ============================================================
-- post_reactions: toggle por (post,user,emoji). Multi-emoji por user permitido.
-- ============================================================
create table if not exists public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (emoji in ('fire','cry','goat')),
  created_at timestamptz not null default now(),
  unique (post_id, user_id, emoji)
);

create index if not exists post_reactions_post_idx on public.post_reactions(post_id);

-- ============================================================
-- post_comments: body livre, mentions = uuid[] de profiles citados.
-- Resolvido client-side ao postar (regex @handle → profile.id).
-- ============================================================
create table if not exists public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (length(body) > 0 and length(body) <= 1000),
  mentions uuid[] not null default array[]::uuid[],
  created_at timestamptz not null default now()
);

create index if not exists post_comments_post_idx on public.post_comments(post_id, created_at);

-- ============================================================
-- RLS
-- ============================================================
alter table public.posts enable row level security;
alter table public.post_reactions enable row level security;
alter table public.post_comments enable row level security;

-- posts: leitura pública pra authed; INSERT bloqueado (só via trigger SECURITY DEFINER);
-- UPDATE/DELETE só pelo author (caso queira editar caption ou deletar post).
drop policy if exists posts_select on public.posts;
drop policy if exists posts_update on public.posts;
drop policy if exists posts_delete on public.posts;
create policy posts_select on public.posts for select to authenticated using (true);
create policy posts_update on public.posts for update using (auth.uid() = author_id);
create policy posts_delete on public.posts for delete using (auth.uid() = author_id);

-- reactions: leitura pública; user só insere/deleta as próprias.
drop policy if exists reactions_select on public.post_reactions;
drop policy if exists reactions_insert on public.post_reactions;
drop policy if exists reactions_delete on public.post_reactions;
create policy reactions_select on public.post_reactions for select to authenticated using (true);
create policy reactions_insert on public.post_reactions for insert with check (auth.uid() = user_id);
create policy reactions_delete on public.post_reactions for delete using (auth.uid() = user_id);

-- comments: leitura pública; user só insere/edita/deleta os próprios.
drop policy if exists comments_select on public.post_comments;
drop policy if exists comments_insert on public.post_comments;
drop policy if exists comments_update on public.post_comments;
drop policy if exists comments_delete on public.post_comments;
create policy comments_select on public.post_comments for select to authenticated using (true);
create policy comments_insert on public.post_comments for insert with check (auth.uid() = author_id);
create policy comments_update on public.post_comments for update using (auth.uid() = author_id);
create policy comments_delete on public.post_comments for delete using (auth.uid() = author_id);

-- ============================================================
-- Trigger: cria post quando match vira 'confirmed'.
-- Cobre 2 caminhos:
--   (a) INSERT já com status='confirmed' (auto-confirmed pelo P2 owner)
--   (b) UPDATE pending → confirmed (P2 aprovou)
-- author_id = match.owner_id (quem registrou). caption = match.notes.
-- SECURITY DEFINER pra bypass RLS (só esse caminho cria posts).
-- ============================================================
create or replace function public.create_post_on_match_confirm()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'confirmed'
     and (tg_op = 'INSERT' or old.status is distinct from 'confirmed')
  then
    insert into public.posts (match_id, author_id, caption, banner_url)
    values (new.id, new.owner_id, new.notes, new.banner_url)
    on conflict (match_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists matches_create_post_on_confirm on public.matches;
create trigger matches_create_post_on_confirm
  after insert or update of status on public.matches
  for each row execute procedure public.create_post_on_match_confirm();

-- ============================================================
-- Backfill: cria posts pra todos matches já confirmed.
-- ============================================================
insert into public.posts (match_id, author_id, caption, banner_url)
select m.id, m.owner_id, m.notes, m.banner_url
  from public.matches m
 where m.status = 'confirmed'
on conflict (match_id) do nothing;
