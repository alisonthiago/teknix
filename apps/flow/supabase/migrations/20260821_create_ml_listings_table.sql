-- Migration: Tabela dedicada para anúncios do Mercado Livre com sincronização completa
-- A tabela marketplace_listings original tem product_id NOT NULL, o que impede
-- importar anúncios sem produto vinculado. Esta tabela (ml_listings) é a fonte
-- de verdade dos dados do Mercado Livre, sem FK obrigatória para products.

CREATE TABLE IF NOT EXISTS public.ml_listings (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificadores do Mercado Livre
  marketplace_id              UUID REFERENCES public.marketplaces(id),
  seller_id                   TEXT NOT NULL,
  external_listing_id         TEXT NOT NULL,        -- MLB1234567890
  product_id                  UUID REFERENCES public.products(id),  -- opcional

  -- Dados principais do anúncio (de GET /items/{id})
  title                       TEXT,
  status                      TEXT DEFAULT 'active',  -- active, paused, closed, etc.
  listing_type                TEXT,                   -- gold_special, gold_pro, etc.
  condition                   TEXT DEFAULT 'new',     -- new, used
  permalink                   TEXT,
  category_id                 TEXT,
  currency_id                 TEXT DEFAULT 'BRL',
  sold_quantity               INTEGER DEFAULT 0,

  -- Preços (de GET /items/{id}/prices — endpoint oficial)
  price                       NUMERIC(10,2),          -- preço atual de venda
  base_price                  NUMERIC(10,2),          -- preço base
  original_price              NUMERIC(10,2),          -- preço antes da promoção
  promo_price                 NUMERIC(10,2),          -- preço promocional ativo
  price_synced_from_endpoint  BOOLEAN DEFAULT false,  -- TRUE se veio de /prices endpoint

  -- Estoque (de GET /items/{id})
  stock                       INTEGER,                -- available_quantity

  -- Descrição (de GET /items/{id}/description — endpoint separado)
  description                 TEXT,

  -- Fotos (armazenadas separadamente em ml_listing_images)
  thumbnail_url               TEXT,

  -- Referências do catálogo ML
  catalog_product_id          TEXT,                   -- ID no catálogo do ML
  user_product_id             TEXT,                   -- User Product ID
  family_id                   TEXT,                   -- Family ID

  -- Atributos do produto
  brand                       TEXT,
  model                       TEXT,
  gtin                        TEXT,
  weight                      TEXT,
  dimensions                  TEXT,

  -- Status de sincronização
  -- SYNCED = todos os campos disponíveis foram sincronizados com sucesso
  -- PARTIAL = alguns campos falharam (verificar last_sync_error)
  -- FAILED = falha crítica, nenhum dado válido obtido
  -- PENDING = aguardando sincronização
  sync_status                 TEXT DEFAULT 'PENDING',
  last_synced_at              TIMESTAMPTZ,
  last_sync_error             TEXT,
  sync_attempts               INTEGER DEFAULT 0,

  created_at                  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at                  TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE (seller_id, external_listing_id)
);

-- Fotos dos anúncios do ML (por picture_id para evitar re-download desnecessário)
CREATE TABLE IF NOT EXISTS public.ml_listing_images (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id            UUID NOT NULL REFERENCES public.ml_listings(id) ON DELETE CASCADE,
  external_picture_id   TEXT,                   -- ID único da foto no ML
  url                   TEXT NOT NULL,          -- secure_url
  size                  TEXT,
  max_size              TEXT,
  is_primary            BOOLEAN DEFAULT false,
  sort_order            INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE (listing_id, external_picture_id)
);

-- Variações dos anúncios do ML
CREATE TABLE IF NOT EXISTS public.ml_listing_variations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id              UUID NOT NULL REFERENCES public.ml_listings(id) ON DELETE CASCADE,
  external_variation_id   TEXT NOT NULL,
  seller_sku              TEXT,
  price                   NUMERIC(10,2),
  stock                   INTEGER,
  attributes              JSONB DEFAULT '[]',   -- [{id, name, value}]
  created_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at              TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE (listing_id, external_variation_id)
);

-- Índices para buscas frequentes
CREATE INDEX IF NOT EXISTS ml_listings_seller_id_idx ON public.ml_listings(seller_id);
CREATE INDEX IF NOT EXISTS ml_listings_external_listing_id_idx ON public.ml_listings(external_listing_id);
CREATE INDEX IF NOT EXISTS ml_listings_sync_status_idx ON public.ml_listings(sync_status);
CREATE INDEX IF NOT EXISTS ml_listing_images_listing_id_idx ON public.ml_listing_images(listing_id);
CREATE INDEX IF NOT EXISTS ml_listing_variations_listing_id_idx ON public.ml_listing_variations(listing_id);

-- Trigger para updated_at automático
CREATE OR REPLACE TRIGGER update_ml_listings_updated_at
  BEFORE UPDATE ON public.ml_listings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE OR REPLACE TRIGGER update_ml_listing_variations_updated_at
  BEFORE UPDATE ON public.ml_listing_variations
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- RLS
ALTER TABLE public.ml_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ml_listings_access" ON public.ml_listings
  FOR ALL TO authenticated USING (true);

ALTER TABLE public.ml_listing_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ml_listing_images_access" ON public.ml_listing_images
  FOR ALL TO authenticated USING (true);

ALTER TABLE public.ml_listing_variations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ml_listing_variations_access" ON public.ml_listing_variations
  FOR ALL TO authenticated USING (true);

-- Comentários
COMMENT ON TABLE public.ml_listings IS 'Anúncios do Mercado Livre sincronizados via API. price=null significa dado indisponível, não zero.';
COMMENT ON COLUMN public.ml_listings.price IS 'Preço de venda atual. NULL = não sincronizado. Use price_synced_from_endpoint para saber a fonte.';
COMMENT ON COLUMN public.ml_listings.price_synced_from_endpoint IS 'TRUE se preço veio de GET /items/{id}/prices (fonte oficial de preços)';
COMMENT ON COLUMN public.ml_listings.description IS 'Texto obtido de GET /items/{id}/description (plain_text). Endpoint separado do item principal.';
COMMENT ON COLUMN public.ml_listings.sync_status IS 'SYNCED=completo|PARTIAL=incompleto|FAILED=erro|PENDING=aguardando';
