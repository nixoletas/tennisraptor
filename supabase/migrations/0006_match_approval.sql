-- Match approval flow (gym-rats style):
-- P1 registra → status=pending. P2 aprova ou rejeita.
-- Só matches confirmed contam pra stats / aparecem no histórico público.

alter table public.matches
  add column if not exists status text not null default 'pending'
    check (status in ('pending','confirmed','rejected')),
  add column if not exists confirmed_at timestamptz,
  add column if not exists rejected_at timestamptz;

create index if not exists matches_status_idx on public.matches(status);

-- ============================================================
-- RLS update: P2 pode atualizar status (não outros campos).
-- A check anterior deixa só owner update. Adicionamos uma policy
-- separada pra P2 mudar status.
-- ============================================================
drop policy if exists matches_update_p2_status on public.matches;
create policy matches_update_p2_status on public.matches
  for update
  using (auth.uid() = player2_id and status = 'pending')
  with check (
    auth.uid() = player2_id
    and status in ('confirmed','rejected')
  );
