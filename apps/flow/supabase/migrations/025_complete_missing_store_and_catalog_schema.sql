-- ==============================================================================
-- TEKNIX — MIGRATION 025: COMPLEMENTO DEFINITIVO DO SCHEMA (HUB, SITE & FLOW)
-- ==============================================================================
-- 1. store_ads: Vitrines e Banners Promocionais da Home e Loja Própria;
-- 2. store_fiscal_logs: Auditoria de Eventos e Comunicações da SEFAZ / NF-e;
-- 3. products (category_id, featured, flash_sale): Integração de vitrines e catálogo;
-- 4. pages (published_schema, draft_schema): Compatibilidade de schemas.
-- ==============================================================================

-- ==============================================================================
-- 1. TABELA store_ads (Banners e Anúncios da Loja)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.store_ads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL DEFAULT '',
  image_url   TEXT NOT NULL DEFAULT '',
  link_url    TEXT NOT NULL DEFAULT '',
  slot        TEXT NOT NULL DEFAULT 'trio',
  position    INTEGER NOT NULL DEFAULT 0,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  starts_at   TIMESTAMPTZ,
  ends_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_ads_slot   ON public.store_ads(slot);
CREATE INDEX IF NOT EXISTS idx_store_ads_status ON public.store_ads(status);

ALTER TABLE public.store_ads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_store_ads" ON public.store_ads;
CREATE POLICY "public_read_store_ads" 
  ON public.store_ads FOR SELECT 
  TO anon, authenticated 
  USING (status = 'active');

DROP POLICY IF EXISTS "admin_manage_store_ads" ON public.store_ads;
CREATE POLICY "admin_manage_store_ads" 
  ON public.store_ads FOR ALL 
  TO authenticated 
  USING (true) WITH CHECK (true);

-- ==============================================================================
-- 2. TABELA store_fiscal_logs (Logs de Emissão e SEFAZ)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.store_fiscal_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID REFERENCES public.store_invoices(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  request     JSONB,
  response    JSONB,
  status      TEXT NOT NULL,
  message     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_store_fiscal_logs_invoice ON public.store_fiscal_logs(invoice_id);

ALTER TABLE public.store_fiscal_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_manage_fiscal_logs" ON public.store_fiscal_logs;
CREATE POLICY "admin_manage_fiscal_logs" 
  ON public.store_fiscal_logs FOR ALL 
  TO authenticated 
  USING (true) WITH CHECK (true);

-- ==============================================================================
-- 3. EXTENSÃO DA TABELA products (Vitrines e Categorias da Loja Própria)
-- ==============================================================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.store_categories(id) ON DELETE SET NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS flash_sale BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS video_url TEXT;

CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured    ON public.products(featured);
CREATE INDEX IF NOT EXISTS idx_products_flash_sale  ON public.products(flash_sale);

-- ==============================================================================
-- 4. EXTENSÃO DA TABELA pages
-- ==============================================================================
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS published_schema JSONB;
ALTER TABLE public.pages ADD COLUMN IF NOT EXISTS draft_schema JSONB;

-- ==============================================================================
-- 5. RECARREGAR O SCHEMA CACHE DO SUPABASE
-- ==============================================================================
NOTIFY pgrst, 'reload schema';
