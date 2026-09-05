-- SITE: endereços do cliente. Não modifica tabelas do FLOW ou do HUB.
-- Aplicar no projeto Supabase configurado no SITE antes de habilitar endereços.
begin;

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Entrega',
  recipient_name text,
  street text not null,
  number text not null,
  complement text,
  neighborhood text not null,
  city text not null,
  state text not null check (char_length(state) = 2),
  zip_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);
create index addresses_user_id_idx on public.addresses(user_id);
alter table public.addresses enable row level security;
revoke all on public.addresses from anon;
grant select, insert, update, delete on public.addresses to authenticated;
create policy addresses_read_own on public.addresses for select to authenticated
  using (user_id = (select auth.uid()));
create policy addresses_insert_own on public.addresses for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy addresses_update_own on public.addresses for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy addresses_delete_own on public.addresses for delete to authenticated
  using (user_id = (select auth.uid()));

commit;
