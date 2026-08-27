-- ============================================================
-- TEKNIX — APLICAÇÃO ÚNICA: 004 (segurança Page Builder) + 003 (loja própria)
-- Colar NO SQL Editor do Supabase e executar UMA vez.
-- Idempotente: pode rodar novamente sem duplicar nada.
-- ============================================================

-- ============================================================
-- TEKNIX PAGE BUILDER SECURITY FIX
-- Migration 004: escrita administrativa nas tabelas do Page Builder
--
-- PROBLEMA CORRIGIDO:
-- As policies da migration 001 permitiam INSERT/UPDATE/DELETE para
-- QUALQUER usuário autenticado ("Authenticated can manage ...").
-- Um cliente logado no SITE poderia alterar páginas, temas e conteúdo.
--
-- SOLUÇÃO:
-- Remove as 13 policies "FOR ALL" genéricas e recria exigindo
-- public.fn_is_hub_admin() (profiles.status=ACTIVE E
-- (profiles.is_master OU profiles.role IN ('MASTER','ADMIN'))).
--
-- PRESERVADO SEM ALTERAÇÃO:
-- - Todas as policies de leitura pública (draft invisível p/ anon).
-- - Estrutura das tabelas, dados, seeds.
-- - TEKNIX FLOW: zero impacto (não referencia estas tabelas).
-- ============================================================

-- ------------------------------------------------------------
-- 0. Função de admin (idempotente — mesma definição do 003;
--    pode rodar antes ou depois, CREATE OR REPLACE é seguro)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_is_hub_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'ACTIVE'
      AND (p.is_master = true OR p.role IN ('MASTER', 'ADMIN'))
  );
$$;

REVOKE EXECUTE ON FUNCTION public.fn_is_hub_admin() FROM anon;

-- ------------------------------------------------------------
-- 1. REMOÇÃO das policies antigas (escrita aberta)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can manage themes"          ON themes;
DROP POLICY IF EXISTS "Authenticated can manage templates"       ON templates;
DROP POLICY IF EXISTS "Authenticated can manage pages"           ON pages;
DROP POLICY IF EXISTS "Authenticated can manage sections"        ON page_sections;
DROP POLICY IF EXISTS "Authenticated can manage containers"      ON page_containers;
DROP POLICY IF EXISTS "Authenticated can manage widgets"         ON page_widgets;
DROP POLICY IF EXISTS "Authenticated can manage global components" ON global_components;
DROP POLICY IF EXISTS "Authenticated can manage menus"           ON menus;
DROP POLICY IF EXISTS "Authenticated can manage headers"         ON page_headers;
DROP POLICY IF EXISTS "Authenticated can manage footers"         ON page_footers;
DROP POLICY IF EXISTS "Authenticated can manage campaigns"       ON campaigns;
DROP POLICY IF EXISTS "Authenticated can manage publications"    ON page_publications;
DROP POLICY IF EXISTS "Authenticated can manage media"           ON media;

-- ------------------------------------------------------------
-- 2. RECRIAÇÃO: admins do HUB têm acesso completo (leitura de
--    rascunhos incluída, pois o editor precisa ver drafts);
--    clientes autenticados ficam só com as leituras públicas.
-- ------------------------------------------------------------
CREATE POLICY "Hub admins manage themes"
  ON themes FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage templates"
  ON templates FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage pages"
  ON pages FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage sections"
  ON page_sections FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage containers"
  ON page_containers FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage widgets"
  ON page_widgets FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage global components"
  ON global_components FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage menus"
  ON menus FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage headers"
  ON page_headers FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage footers"
  ON page_footers FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage campaigns"
  ON campaigns FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage publications"
  ON page_publications FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage media"
  ON media FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());


-- ############################################################
-- ############## PARTE 2 — STORE CATALOG (003) ################
-- ############################################################

-- ============================================================
-- TEKNIX STORE CATALOG v2 — Estrutura da Loja Própria
-- Migration 003 (revisada): segurança RLS administrativa
--
-- REGRA ABSOLUTA: NÃO altera nenhuma tabela do TEKNIX FLOW.
-- - products, marketplace_listings, orders, order_items, customers,
--   sales, purchases, suppliers, stock_movements,
--   inventory_movements: ZERO ALTER TABLE, ZERO UPDATE.
-- - permissions / role_permissions / user_permissions (FLOW): intocadas.
-- - Tabelas do Page Builder (themes, pages, etc): apenas referenciadas.
-- Reutiliza o mecanismo EXISTENTE: profiles.role / profiles.is_master.
-- ============================================================

-- ============================================================
-- 0. FUNÇÃO DE ADMINISTRAÇÃO DO HUB (reutiliza profiles existente)
--    Reconhece como admin quem tem profile ATIVO com
--    is_master = true OU role IN ('MASTER','ADMIN')
--    SECURITY DEFINER: le o profile mesmo com RLS própria do profiles.
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_is_hub_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'ACTIVE'
      AND (p.is_master = true OR p.role IN ('MASTER', 'ADMIN'))
  );
$$;

REVOKE EXECUTE ON FUNCTION public.fn_is_hub_admin() FROM anon;

-- ============================================================
-- 1. SEGMENTOS DA LOJA
-- ============================================================
CREATE TABLE IF NOT EXISTS store_segments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  image_url   TEXT DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  theme_id    UUID REFERENCES themes(id) ON DELETE SET NULL,
  page_id     UUID REFERENCES pages(id) ON DELETE SET NULL,
  seo         JSONB DEFAULT '{}'::jsonb,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. CATEGORIAS DA LOJA (por segmento, com subcategorias)
-- ============================================================
CREATE TABLE IF NOT EXISTS store_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id  UUID NOT NULL REFERENCES store_segments(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES store_categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url   TEXT DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  page_id     UUID REFERENCES pages(id) ON DELETE SET NULL,
  seo         JSONB DEFAULT '{}'::jsonb,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT uq_store_category_slug_per_segment UNIQUE (segment_id, slug)
);

-- ============================================================
-- 3. METADADOS DA LOJA POR PRODUTO (1:1 com products)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_store_metadata (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         UUID NOT NULL UNIQUE REFERENCES products(id) ON DELETE CASCADE,

  segment_id         UUID REFERENCES store_segments(id) ON DELETE SET NULL,
  category_id        UUID REFERENCES store_categories(id) ON DELETE SET NULL,

  sale_price         NUMERIC(10,2) CHECK (sale_price IS NULL OR sale_price >= 0),
  promotional_price  NUMERIC(10,2) CHECK (promotional_price IS NULL OR promotional_price >= 0),

  slug               TEXT UNIQUE,
  published          BOOLEAN NOT NULL DEFAULT false,
  featured           BOOLEAN NOT NULL DEFAULT false,

  short_description  TEXT DEFAULT '',
  store_description  TEXT DEFAULT '',
  specifications     JSONB DEFAULT '[]'::jsonb,

  seo                JSONB DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_store_categories_segment ON store_categories(segment_id);
CREATE INDEX IF NOT EXISTS idx_store_categories_parent  ON store_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_store_categories_status  ON store_categories(status);

CREATE INDEX IF NOT EXISTS idx_psm_segment   ON product_store_metadata(segment_id);
CREATE INDEX IF NOT EXISTS idx_psm_category  ON product_store_metadata(category_id);
CREATE INDEX IF NOT EXISTS idx_psm_featured  ON product_store_metadata(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_psm_published ON product_store_metadata(published) WHERE published = true;

-- ============================================================
-- 4. UPDATED_AT AUTOMÁTICO (mecanismo novo, isolado nas 3 tabelas)
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_store_segments_updated_at ON store_segments;
CREATE TRIGGER trg_store_segments_updated_at
  BEFORE UPDATE ON store_segments
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_store_categories_updated_at ON store_categories;
CREATE TRIGGER trg_store_categories_updated_at
  BEFORE UPDATE ON store_categories
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_psm_updated_at ON product_store_metadata;
CREATE TRIGGER trg_psm_updated_at
  BEFORE UPDATE ON product_store_metadata
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

-- ============================================================
-- 5. CONSISTÊNCIA SEGMENTO ↔ CATEGORIA ↔ PRODUTO
--    Garante que a categoria pertence ao segmento informado
--    e gera slug automaticamente quando ausente.
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_validate_psm()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_base TEXT;
  v_candidate TEXT;
  v_suffix INTEGER := 0;
BEGIN
  -- Categoria precisa pertencer ao mesmo segmento do produto
  IF NEW.category_id IS NOT NULL THEN
    IF NEW.segment_id IS NULL THEN
      RAISE EXCEPTION 'segment_id e obrigatorio quando category_id e definido';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.store_categories c
      WHERE c.id = NEW.category_id
        AND c.segment_id = NEW.segment_id
        AND c.status = 'active'
    ) THEN
      RAISE EXCEPTION 'Categoria % nao pertence ao segmento % (ou esta inativa)',
        NEW.category_id, NEW.segment_id;
    END IF;
  END IF;

  -- Slug público gerado a partir do nome do produto quando ausente
  -- (translate remove acentos sem depender da extensão unaccent)
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    SELECT btrim(regexp_replace(
             translate(
               lower(COALESCE(p.name, 'produto')),
               'áàâãäéèêëíìîïóòôõöúùûüçñ',
               'aaaaaeeeeiiiiooooouuuucn'
             ),
             '[^a-z0-9]+', '-', 'g'
           ), '-')
      INTO v_base
      FROM public.products p
     WHERE p.id = NEW.product_id;

    IF v_base IS NULL OR v_base = '' THEN
      v_base := 'produto';
    END IF;

    v_candidate := v_base;
    WHILE EXISTS (SELECT 1 FROM public.product_store_metadata m WHERE m.slug = v_candidate) LOOP
      v_suffix := v_suffix + 1;
      v_candidate := v_base || '-' || v_suffix::text;
    END LOOP;
    NEW.slug := v_candidate;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_psm_validate ON product_store_metadata;
CREATE TRIGGER trg_psm_validate
  BEFORE INSERT OR UPDATE OF segment_id, category_id, slug ON product_store_metadata
  FOR EACH ROW EXECUTE FUNCTION public.fn_validate_psm();

-- ============================================================
-- 6. ROW LEVEL SECURITY
--    Leitura pública: somente ativo/publicado.
--    Escrita: SOMENTE admins do HUB (via fn_is_hub_admin).
--    Clientes autenticados do SITE: NÃO escrevem.
-- ============================================================
ALTER TABLE store_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_store_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_segments FORCE ROW LEVEL SECURITY;
ALTER TABLE store_categories FORCE ROW LEVEL SECURITY;
ALTER TABLE product_store_metadata FORCE ROW LEVEL SECURITY;

-- ---------- LEITURA PÚBLICA ----------
CREATE POLICY "Public read active segments"
  ON store_segments FOR SELECT
  USING (status = 'active');

-- categorias visíveis só se a categoria E o segmento estiverem ativos
CREATE POLICY "Public read active categories of active segments"
  ON store_categories FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.store_segments s
      WHERE s.id = segment_id AND s.status = 'active'
    )
  );

CREATE POLICY "Public read published product metadata"
  ON product_store_metadata FOR SELECT
  USING (published = true);

-- ---------- ESCRITA ADMINISTRATIVA ----------
CREATE POLICY "Hub admins insert segments"
  ON store_segments FOR INSERT TO authenticated
  WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins update segments"
  ON store_segments FOR UPDATE TO authenticated
  USING (public.fn_is_hub_admin())
  WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins delete segments"
  ON store_segments FOR DELETE TO authenticated
  USING (public.fn_is_hub_admin());

CREATE POLICY "Hub admins insert categories"
  ON store_categories FOR INSERT TO authenticated
  WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins update categories"
  ON store_categories FOR UPDATE TO authenticated
  USING (public.fn_is_hub_admin())
  WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins delete categories"
  ON store_categories FOR DELETE TO authenticated
  USING (public.fn_is_hub_admin());

CREATE POLICY "Hub admins insert product metadata"
  ON product_store_metadata FOR INSERT TO authenticated
  WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins update product metadata"
  ON product_store_metadata FOR UPDATE TO authenticated
  USING (public.fn_is_hub_admin())
  WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins delete product metadata"
  ON product_store_metadata FOR DELETE TO authenticated
  USING (public.fn_is_hub_admin());

-- ============================================================
-- SEEDS (idempotentes)
-- ============================================================
INSERT INTO store_segments (id, name, slug, description, sort_order) VALUES
  ('10000000-0000-4000-8000-000000000001', 'Ferramentas', 'ferramentas', 'Elétricas, manuais e acessórios profissionais', 1),
  ('10000000-0000-4000-8000-000000000002', 'Informática', 'informatica', 'Periféricos, componentes e soluções técnicas', 2),
  ('10000000-0000-4000-8000-000000000003', 'Casa',        'casa',        'Tudo para organização e manutenção do lar', 3),
  ('10000000-0000-4000-8000-000000000004', 'Automotivo',  'automotivo',  'Ferramentas e acessórios para seu veículo', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO store_categories (id, segment_id, name, slug, sort_order) VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Furadeiras',          'furadeiras', 1),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Parafusadeiras',      'parafusadeiras', 2),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Serras',              'serras', 3),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Ferramentas Manuais', 'ferramentas-manuais', 4),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'Kits',                'kits', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO store_categories (id, segment_id, name, slug, sort_order) VALUES
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', 'Notebooks', 'notebooks', 1),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', 'Monitores', 'monitores', 2),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000002', 'Teclados',  'teclados', 3),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000002', 'Mouses',    'mouses', 4)
ON CONFLICT (id) DO NOTHING;
