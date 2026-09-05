create table if not exists public.blog_events (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.blog_posts(id) on delete cascade,
  event_type text not null check (event_type in ('view')),
  page_url text,
  created_at timestamptz not null default now()
);
create index if not exists blog_events_post_created_idx on public.blog_events(post_id, created_at desc);
alter table public.blog_events enable row level security;
drop policy if exists "public can record blog views" on public.blog_events;
create policy "public can record blog views" on public.blog_events for insert to anon, authenticated with check (event_type = 'view');
drop policy if exists "authenticated can read blog analytics" on public.blog_events;
create policy "authenticated can read blog analytics" on public.blog_events for select to authenticated using (true);
