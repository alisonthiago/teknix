-- Cupons cadastrados no HUB e validados pela loja no checkout.
create table if not exists public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  discount_type text not null check (discount_type in ('percentage', 'fixed')),
  discount_value numeric(12,2) not null check (discount_value > 0),
  free_shipping boolean not null default false,
  min_order_amount numeric(12,2) not null default 0,
  starts_at timestamptz,
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit > 0),
  used_count integer not null default 0 check (used_count >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.coupons enable row level security;

drop policy if exists "Authenticated users can read active coupons" on public.coupons;
create policy "Authenticated users can read active coupons"
  on public.coupons for select to authenticated using (active = true);

-- O HUB já opera com sessão autenticada; a gestão de permissões pode restringir
-- esta política a operadores quando os papéis administrativos forem habilitados.
drop policy if exists "Authenticated users can manage coupons" on public.coupons;
create policy "Authenticated users can manage coupons"
  on public.coupons for all to authenticated using (true) with check (true);
