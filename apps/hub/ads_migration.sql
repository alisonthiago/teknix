-- Migration: ads table
-- TEKNIX HUB — Sistema de Anúncios / Banners / ADS
-- Propósito: banners e anúncios gerenciados no HUB (/hub/ads), exibidos no SITE

create table if not exists public.ads (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  image_url         text not null default '',
  link              text not null default '#',
  target            text not null default '_self',
  placement         text not null default 'middle_screen',
  type              text not null default 'single', -- 'single' | 'carousel'
  interval_seconds  integer not null default 5,
  items             jsonb not null default '[]'::jsonb,
  -- Posições suportadas:
  -- middle_screen    → Anúncio / Carrossel no Meio da Tela
  -- product          → Anúncio no Espaço de Produto
  -- home-hero        → Banner principal da Home (carrossel)
  -- home-middle      → Meio da Home
  -- home-footer      → Rodapé da Home
  -- product-header   → Topo da página de Produto
  -- product-middle   → Meio da página de Produto
  -- product-footer   → Rodapé da página de Produto
  -- blog-header      → Topo do Blog
  -- blog-middle      → Meio do Blog
  -- blog-footer      → Rodapé do Blog
  -- global-header    → Header global
  -- global-footer    → Footer global
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  start_date        timestamptz,
  end_date          timestamptz,
  clicks            integer not null default 0,
  impressions       integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Garantir colunas caso a tabela já tenha sido criada anteriormente
alter table public.ads add column if not exists target text not null default '_self';
alter table public.ads add column if not exists type text not null default 'single';
alter table public.ads add column if not exists interval_seconds integer not null default 5;
alter table public.ads add column if not exists items jsonb not null default '[]'::jsonb;

-- Índices para otimização de busca
create index if not exists ads_placement_idx on public.ads (placement);
create index if not exists ads_active_idx on public.ads (is_active);
create index if not exists ads_sort_idx on public.ads (sort_order);

-- RLS
alter table public.ads enable row level security;

-- Política pública: visitantes só leem anúncios ativos
drop policy if exists "Public can read active ads" on public.ads;
create policy "Public can read active ads"
  on public.ads for select
  using (is_active = true);

-- Política administrativa: usuários autenticados (HUB) ou anon para dev/demo
drop policy if exists "Authenticated users can manage ads" on public.ads;
create policy "Authenticated users can manage ads"
  on public.ads for all
  using (true)
  with check (true);
