-- Migration: blog_posts table
-- TEKNIX HUB — Sistema de Blog
-- Criado: 2026-09-01
-- Propósito: tabela para posts do blog publicados no SITE

create table if not exists public.blog_posts (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  slug            text not null unique,
  summary         text,
  cover_image     text,
  content         text,                  -- HTML fallback (legado)
  blocks          jsonb default '[]'::jsonb, -- sistema de blocos do editor
  seo_title       text,
  seo_description text,
  tags            text[] default '{}',
  status          text not null default 'draft' check (status in ('draft', 'published')),
  author_name     text,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Índice para busca por slug (SITE renderer)
create index if not exists blog_posts_slug_idx on public.blog_posts (slug);

-- Índice para listagem por data
create index if not exists blog_posts_created_at_idx on public.blog_posts (created_at desc);

-- Índice para filtro por status
create index if not exists blog_posts_status_idx on public.blog_posts (status);

-- RLS: visitantes do SITE só veem posts publicados
alter table public.blog_posts enable row level security;

-- Política pública: leitura de posts publicados
create policy "Public can read published blog posts"
  on public.blog_posts for select
  using (status = 'published');

-- Política administrativa: usuários autenticados (HUB) têm acesso total
create policy "Authenticated users can manage blog posts"
  on public.blog_posts for all
  using (auth.role() = 'authenticated');
