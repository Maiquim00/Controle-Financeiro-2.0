create table if not exists public.transacoes (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
    descricao text not null check (char_length(trim(descricao)) between 1 and 80),
    valor numeric(12, 2) not null check (valor > 0),
    tipo text not null check (tipo in ('receita', 'despesa')),
    categoria text not null check (categoria in ('alimentacao', 'transporte', 'casa', 'lazer', 'estudos', 'tecnologia', 'outros')),
    created_at timestamptz not null default now()
);

create index if not exists transacoes_user_created_idx
    on public.transacoes (user_id, created_at desc);

alter table public.transacoes enable row level security;

drop policy if exists "Usuários leem as próprias transações" on public.transacoes;
create policy "Usuários leem as próprias transações"
    on public.transacoes for select to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Usuários criam as próprias transações" on public.transacoes;
create policy "Usuários criam as próprias transações"
    on public.transacoes for insert to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "Usuários atualizam as próprias transações" on public.transacoes;
create policy "Usuários atualizam as próprias transações"
    on public.transacoes for update to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "Usuários removem as próprias transações" on public.transacoes;
create policy "Usuários removem as próprias transações"
    on public.transacoes for delete to authenticated
    using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.transacoes to authenticated;