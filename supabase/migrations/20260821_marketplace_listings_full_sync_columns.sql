-- Migration: Colunas completas para sincronização de catálogo do Mercado Livre
-- Garante que marketplace_listings tenha todos os campos necessários para
-- dados reais da API sem precisar de fallbacks ou valores fictícios.

-- ─── Novas colunas na marketplace_listings ───────────────────────────────────

ALTER TABLE marketplace_listings
  ADD COLUMN IF NOT EXISTS base_price         NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS original_price     NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS promo_price        NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS currency_id        TEXT DEFAULT 'BRL',
  ADD COLUMN IF NOT EXISTS description        TEXT,
  ADD COLUMN IF NOT EXISTS condition          TEXT DEFAULT 'new',
  ADD COLUMN IF NOT EXISTS listing_type       TEXT,
  ADD COLUMN IF NOT EXISTS category_id        TEXT,
  ADD COLUMN IF NOT EXISTS catalog_product_id TEXT,
  ADD COLUMN IF NOT EXISTS user_product_id    TEXT,
  ADD COLUMN IF NOT EXISTS family_id          TEXT,
  ADD COLUMN IF NOT EXISTS brand              TEXT,
  ADD COLUMN IF NOT EXISTS model              TEXT,
  ADD COLUMN IF NOT EXISTS gtin               TEXT,
  ADD COLUMN IF NOT EXISTS weight             TEXT,
  ADD COLUMN IF NOT EXISTS dimensions         TEXT,
  ADD COLUMN IF NOT EXISTS sold_quantity      INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stock_synced       INTEGER,
  ADD COLUMN IF NOT EXISTS sync_status        TEXT DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS price_synced_from_endpoint BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_sync_error    TEXT,
  ADD COLUMN IF NOT EXISTS sync_attempts      INTEGER DEFAULT 0;

-- ─── Índice para buscas rápidas por external_listing_id ──────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS marketplace_listings_external_listing_id_idx
  ON marketplace_listings (external_listing_id);

-- ─── Garantir external_picture_id na tabela de imagens ───────────────────────
ALTER TABLE marketplace_listing_images
  ADD COLUMN IF NOT EXISTS external_picture_id TEXT,
  ADD COLUMN IF NOT EXISTS size                 TEXT,
  ADD COLUMN IF NOT EXISTS max_size             TEXT;

-- ─── Garantir external_variation_id na tabela de variações ───────────────────
ALTER TABLE marketplace_listing_variations
  ADD COLUMN IF NOT EXISTS seller_sku           TEXT,
  ADD COLUMN IF NOT EXISTS price                NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS stock                INTEGER,
  ADD COLUMN IF NOT EXISTS attributes           JSONB DEFAULT '[]';

-- ─── Índice único para variações por listing ─────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS ml_variation_listing_id_external_idx
  ON marketplace_listing_variations (listing_id, external_variation_id)
  WHERE external_variation_id IS NOT NULL;

-- ─── Comentários para documentar a arquitetura ───────────────────────────────
COMMENT ON COLUMN marketplace_listings.sync_status IS
  'Status de sincronização: SYNCED=completo, PARTIAL=algum campo faltou, FAILED=erro, PENDING=aguardando';
COMMENT ON COLUMN marketplace_listings.price_synced_from_endpoint IS
  'TRUE se preço veio de GET /items/{id}/prices (endpoint oficial). FALSE se fallback para item.price';
COMMENT ON COLUMN marketplace_listings.description IS
  'Descrição obtida via GET /items/{id}/description (plain_text)';
COMMENT ON COLUMN marketplace_listings.promo_price IS
  'Preço promocional quando houver promoção ativa no Mercado Livre';
COMMENT ON COLUMN marketplace_listings.last_sync_error IS
  'Mensagem de erro da última sincronização, se houver';
