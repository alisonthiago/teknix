-- ============================================================
-- TEKNIX STORE — ANÚNCIOS (ADS) + BLOG
-- Migration 009: cria as tabelas de anúncios e posts de blog.
--
-- store_ads: banners/anúncios exibidos na Home (carrossel, trio,
--            faixas). Cada anúncio tem imagem + link de destino
--            (produto, promoção ou página).
-- blog_posts: artigos do blog gerenciados pelo HUB e exibidos
--             em /blog e /blog/{slug} no site.
-- ============================================================

-- ============================================================
-- 1. ANÚNCIOS (ADS)
-- ============================================================
CREATE TABLE IF NOT EXISTS store_ads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL DEFAULT '',
  image_url   TEXT NOT NULL DEFAULT '',
  link_url    TEXT NOT NULL DEFAULT '',
  slot        TEXT NOT NULL DEFAULT 'trio', -- 'carousel' | 'trio' | 'banner'
  position    INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_ads_slot   ON store_ads(slot);
CREATE INDEX IF NOT EXISTS idx_store_ads_status ON store_ads(status);

-- ============================================================
-- 2. BLOG
-- ============================================================
CREATE TABLE IF NOT EXISTS blog_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  excerpt     TEXT DEFAULT '',
  content     TEXT DEFAULT '',
  cover_image TEXT DEFAULT '',
  author      TEXT DEFAULT 'TEKNIX',
  category    TEXT DEFAULT 'Geral',
  tags        TEXT[] DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at TIMESTAMPTZ,
  created_by  UUID,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug   ON blog_posts(slug);

-- ============================================================
-- 3. UPDATED_AT AUTOMÁTICO
-- ============================================================
DROP TRIGGER IF EXISTS trg_store_ads_updated_at ON store_ads;
CREATE TRIGGER trg_store_ads_updated_at
  BEFORE UPDATE ON store_ads
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER trg_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- 4. RLS — apenas admin do HUB pode gerenciar; leitura pública
-- ============================================================
ALTER TABLE store_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Leitura pública (site)
CREATE POLICY "store_ads_public_read" ON store_ads
  FOR SELECT USING (true);

CREATE POLICY "blog_posts_public_read" ON blog_posts
  FOR SELECT USING (status = 'published');

-- Escrita apenas admin do HUB
CREATE POLICY "store_ads_admin_write" ON store_ads
  FOR ALL USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "blog_posts_admin_write" ON blog_posts
  FOR ALL USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());