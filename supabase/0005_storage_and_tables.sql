-- 0005_storage_and_tables.sql
-- Storage buckets, policies, additional tables, RLS, triggers, and seed data

-- ============================================================
-- 1. STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('product-images', 'product-images', FALSE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('user-avatars', 'user-avatars', TRUE, 2097152, NULL),
  ('company-assets', 'company-assets', FALSE, 10485760, NULL),
  ('documents', 'documents', FALSE, 20971520, NULL)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================================
-- 2. STORAGE POLICIES
-- ============================================================

-- product-images: authenticated users full access (simple policy, no company_id yet)
CREATE POLICY "Authenticated users can view product images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');

-- user-avatars: anyone can read, only owner can upload/update/delete
CREATE POLICY "Anyone can view user avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'user-avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- company-assets: authenticated users full access
CREATE POLICY "Authenticated users can view company assets"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'company-assets');

CREATE POLICY "Authenticated users can upload company assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-assets');

CREATE POLICY "Authenticated users can update company assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'company-assets');

CREATE POLICY "Authenticated users can delete company assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'company-assets');

-- documents: authenticated users full access
CREATE POLICY "Authenticated users can view documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can upload documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Authenticated users can update documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can delete documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'documents');

-- ============================================================
-- 3. ADDITIONAL TABLES
-- ============================================================

-- 3.1 product_images
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- 3.2 marketplace_fee_rules (replace existing from 0003 with expanded schema)
DROP TABLE IF EXISTS marketplace_fee_history;
DROP TABLE IF EXISTS marketplace_fee_rules;

CREATE TABLE IF NOT EXISTS marketplace_fee_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID REFERENCES marketplaces(id) ON DELETE CASCADE,
  rule_name TEXT NOT NULL,
  category TEXT,
  min_price NUMERIC,
  max_price NUMERIC,
  commission_pct NUMERIC DEFAULT 0,
  fixed_fee NUMERIC DEFAULT 0,
  shipping_fee_pct NUMERIC DEFAULT 0,
  other_fees_pct NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_fee_rules_marketplace_id ON marketplace_fee_rules(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_fee_rules_category ON marketplace_fee_rules(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_fee_rules_is_active ON marketplace_fee_rules(is_active);
CREATE TRIGGER update_marketplace_fee_rules_updated_at BEFORE UPDATE ON marketplace_fee_rules FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 3.3 calculator_shares
CREATE TABLE IF NOT EXISTS calculator_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  product_id UUID REFERENCES products(id),
  marketplace_code TEXT,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  calc_data JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calculator_shares_user_id ON calculator_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_calculator_shares_share_token ON calculator_shares(share_token);

-- 3.4 product_marketplace_listings
CREATE TABLE IF NOT EXISTS product_marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  marketplace_id UUID REFERENCES marketplaces(id),
  marketplace_account_id UUID,
  external_id TEXT,
  listing_url TEXT,
  title TEXT,
  price NUMERIC,
  stock_synced BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'ACTIVE',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_marketplace_listings_product_id ON product_marketplace_listings(product_id);
CREATE INDEX IF NOT EXISTS idx_product_marketplace_listings_marketplace_id ON product_marketplace_listings(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_product_marketplace_listings_status ON product_marketplace_listings(status);
CREATE TRIGGER update_product_marketplace_listings_updated_at BEFORE UPDATE ON product_marketplace_listings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 3.5 api_keys
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions TEXT[],
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_is_active ON api_keys(is_active);

-- 3.6 webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  marketplace_id UUID REFERENCES marketplaces(id),
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[],
  is_active BOOLEAN DEFAULT true,
  last_triggered_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhooks_user_id ON webhooks(user_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_marketplace_id ON webhooks(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_webhooks_is_active ON webhooks(is_active);
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON webhooks FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

-- product_images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage product_images" ON product_images FOR ALL USING (auth.role() = 'authenticated');

-- marketplace_fee_rules
ALTER TABLE marketplace_fee_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage marketplace_fee_rules" ON marketplace_fee_rules FOR ALL USING (auth.role() = 'authenticated');

-- calculator_shares
ALTER TABLE calculator_shares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage calculator_shares" ON calculator_shares FOR ALL USING (auth.role() = 'authenticated');

-- product_marketplace_listings
ALTER TABLE product_marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage product_marketplace_listings" ON product_marketplace_listings FOR ALL USING (auth.role() = 'authenticated');

-- api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage api_keys" ON api_keys FOR ALL USING (auth.role() = 'authenticated');

-- webhooks
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage webhooks" ON webhooks FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 5. SEED: Marketplace Fee Rules (realistic fees per marketplace)
-- ============================================================

-- Mercado Livre: 11-16% commission, shipping varies by fulfillment
INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'Comissão padrão', NULL, 13.00, 0, 5.00, 0, 'Mercado Livre - Tabela oficial 2024'
FROM marketplaces m WHERE m.code = 'MERCADO_LIVRE'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'Comissão eletrônicos', 'ELETRONICOS', 16.00, 0, 5.00, 0, 'Mercado Livre - Eletrônicos'
FROM marketplaces m WHERE m.code = 'MERCADO_LIVRE'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'Comissão baixo valor', NULL, 11.00, 0, 5.00, 0, 'Mercado Livre - Itens até R$50'
FROM marketplaces m WHERE m.code = 'MERCADO_LIVRE'
ON CONFLICT DO NOTHING;

-- Shopee: 10-14% commission
INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'Comissão padrão', NULL, 12.00, 0, 4.00, 2.00, 'Shopee - Taxa padrão'
FROM marketplaces m WHERE m.code = 'SHOPEE'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'Comissão marketplace', NULL, 14.00, 0, 4.00, 2.00, 'Shopee - Seller marketplace'
FROM marketplaces m WHERE m.code = 'SHOPEE'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'Comissão cross-border', NULL, 10.00, 0, 4.00, 2.00, 'Shopee - Cross-border'
FROM marketplaces m WHERE m.code = 'SHOPEE'
ON CONFLICT DO NOTHING;

-- TikTok Shop: 5-8% commission
INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'Comissão padrão', NULL, 6.00, 0, 3.00, 0, 'TikTok Shop - Standard'
FROM marketplaces m WHERE m.code = 'TIKTOK_SHOP'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'Comissão promocional', NULL, 5.00, 0, 3.00, 0, 'TikTok Shop - Promoção'
FROM marketplaces m WHERE m.code = 'TIKTOK_SHOP'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'Comissão alta giro', NULL, 8.00, 0, 3.00, 0, 'TikTok Shop - Alta rotatividade'
FROM marketplaces m WHERE m.code = 'TIKTOK_SHOP'
ON CONFLICT DO NOTHING;

-- Amazon: 8-15% commission + FBA fees
INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'Comissão padrão', NULL, 12.00, 0, 0, 3.00, 'Amazon - Referral fee'
FROM marketplaces m WHERE m.code = 'AMAZON'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'Comissão eletrônicos', 'ELETRONICOS', 8.00, 0, 0, 3.00, 'Amazon - Eletrônicos'
FROM marketplaces m WHERE m.code = 'AMAZON'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'Comissão vestuário', 'VESTUARIO', 15.00, 0, 0, 3.00, 'Amazon - Vestuário'
FROM marketplaces m WHERE m.code = 'AMAZON'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'FBA taxa de armazenamento', NULL, 0, 0, 0, 8.00, 'Amazon - FBA storage'
FROM marketplaces m WHERE m.code = 'AMAZON'
ON CONFLICT DO NOTHING;

-- Magalu: 10-14% commission
INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'Comissão padrão', NULL, 12.00, 0, 4.00, 1.00, 'Magalu - Taxa padrão'
FROM marketplaces m WHERE m.code = 'MAGALU'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'Comissão eletrônicos', 'ELETRONICOS', 14.00, 0, 4.00, 1.00, 'Magalu - Eletrônicos'
FROM marketplaces m WHERE m.code = 'MAGALU'
ON CONFLICT DO NOTHING;

INSERT INTO marketplace_fee_rules (marketplace_id, rule_name, category, commission_pct, fixed_fee, shipping_fee_pct, other_fees_pct, source)
SELECT m.id, 'Comissão casa e decoração', 'CASA_E_DECORACAO', 10.00, 0, 4.00, 1.00, 'Magalu - Casa e Decoração'
FROM marketplaces m WHERE m.code = 'MAGALU'
ON CONFLICT DO NOTHING;
