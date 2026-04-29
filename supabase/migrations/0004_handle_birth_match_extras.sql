-- Adiciona handle único, data de nascimento, e campos novos em matches.
-- Não-destrutivo. Pode rodar sobre 0003.
--
-- Handle continua nullable (pra usuários antigos sem handle), mas único quando preenchido.
-- App força handle obrigatório no onboarding novo.

-- ============================================================
-- profiles
-- ============================================================
alter table public.profiles
  add column if not exists birth_date date;

-- handle único entre não-nulls (comportamento default do postgres unique).
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'profiles_handle_unique'
  ) then
    create unique index profiles_handle_unique
      on public.profiles(lower(handle))
      where handle is not null;
  end if;
end $$;

-- ============================================================
-- matches
-- ============================================================
alter table public.matches
  add column if not exists scheduled_time time,
  add column if not exists location text,
  add column if not exists banner_url text;
