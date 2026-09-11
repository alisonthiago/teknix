-- ============================================================
-- TEKNIX FLOW — Migration 022: Arquitetura Multicanal,
-- Multi-Anúncio, Preços Independentes e Estoque Central
--
-- REGRA ABSOLUTA: 
-- 1 Produto Físico Central -> Vários Canais -> Vários Anúncios por Canal
-- -> Preço Individual por Anúncio -> Estoque Central Único
-- Zero alteração destrutiva em dados existentes.
-- ============================================================

BEGIN;

-- 1. EXTENSÃO DA TABELA products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS reserved_stock INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_site_published BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS site_price NUMERIC(10,2);

COMMENT ON COLUMN public.products.reserved_stock IS 'Estoque reservado por pedidos pendentes de pagamento';
COMMENT ON COLUMN public.products.is_site_published IS 'Indica se o produto está ativo e publicado no site oficial TEKNIX';
COMMENT ON COLUMN public.products.site_price IS 'Preço de venda exclusivo do site oficial TEKNIX';

-- 2. EXTENSÃO DA TABELA marketplace_listings
ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'mercadolivre',
  ADD COLUMN IF NOT EXISTS catalog_product_id TEXT,
  ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'gold_special',
  ADD COLUMN IF NOT EXISTS sold_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_revenue NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_sync_origin TEXT DEFAULT 'FLOW',
  ADD COLUMN IF NOT EXISTS permalink TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS external_listing_id TEXT;

-- Preencher external_id e external_listing_id de forma coerente se existirem
UPDATE public.marketplace_listings 
SET external_listing_id = external_id 
WHERE external_listing_id IS NULL AND external_id IS NOT NULL;

UPDATE public.marketplace_listings 
SET external_id = external_listing_id 
WHERE external_id IS NULL AND external_listing_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ml_listings_product_id ON public.marketplace_listings(product_id);
CREATE INDEX IF NOT EXISTS idx_ml_listings_channel ON public.marketplace_listings(channel);
CREATE INDEX IF NOT EXISTS idx_ml_listings_external_id ON public.marketplace_listings(external_id);
CREATE INDEX IF NOT EXISTS idx_ml_listings_catalog_id ON public.marketplace_listings(catalog_product_id);

-- 3. TABELA: pending_product_matches (Produtos para Vincular)
-- Usada quando um anúncio externo chega sem correspondência 100% segura
CREATE TABLE IF NOT EXISTS public.pending_product_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL DEFAULT 'mercadolivre', -- 'mercadolivre', 'shopee', 'magalu'
    external_id TEXT NOT NULL,
    seller_sku TEXT,
    title TEXT NOT NULL,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    stock INTEGER DEFAULT 0,
    thumbnail_url TEXT,
    permalink TEXT,
    gtin TEXT,
    brand TEXT,
    model TEXT,
    catalog_product_id TEXT,
    suggested_product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    confidence_score NUMERIC(5,2) DEFAULT 0,
    match_reason TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'LINKED', 'CREATED_NEW', 'IGNORED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ,
    UNIQUE(channel, external_id)
);

CREATE INDEX IF NOT EXISTS idx_pending_matches_status ON public.pending_product_matches(status);
CREATE INDEX IF NOT EXISTS idx_pending_matches_suggested ON public.pending_product_matches(suggested_product_id);

ALTER TABLE public.pending_product_matches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_pending_product_matches" ON public.pending_product_matches;
CREATE POLICY "auth_pending_product_matches" ON public.pending_product_matches FOR ALL USING (true) WITH CHECK (true);

-- 4. TABELA: listing_price_history (Auditoria de Preços por Anúncio)
CREATE TABLE IF NOT EXISTS public.listing_price_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    channel TEXT NOT NULL,
    external_id TEXT,
    old_price NUMERIC(10,2),
    new_price NUMERIC(10,2) NOT NULL,
    origin TEXT NOT NULL DEFAULT 'FLOW', -- 'FLOW', 'HUB', 'SITE', 'MERCADO_LIVRE', 'SHOPEE', 'MAGALU'
    user_id UUID,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_price_history_listing ON public.listing_price_history(listing_id);
CREATE INDEX IF NOT EXISTS idx_price_history_product ON public.listing_price_history(product_id);
CREATE INDEX IF NOT EXISTS idx_price_history_created ON public.listing_price_history(created_at DESC);

ALTER TABLE public.listing_price_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_listing_price_history" ON public.listing_price_history;
CREATE POLICY "auth_listing_price_history" ON public.listing_price_history FOR ALL USING (true) WITH CHECK (true);

-- 5. TABELA: sync_events (Prevenção de Loops e Idempotência de Webhooks)
CREATE TABLE IF NOT EXISTS public.sync_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel TEXT NOT NULL,
    event_type TEXT NOT NULL,
    external_event_id TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE(channel, external_event_id)
);

CREATE INDEX IF NOT EXISTS idx_sync_events_lookup ON public.sync_events(channel, external_event_id);

ALTER TABLE public.sync_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_sync_events" ON public.sync_events;
CREATE POLICY "auth_sync_events" ON public.sync_events FOR ALL USING (true) WITH CHECK (true);

COMMIT;
