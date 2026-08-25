-- ============================================================
-- 007_MULTIACCOUNT_ARCHITECTURE.sql
-- Multi-contas por marketplace: marketplace_accounts, webhooks, logs
-- Execute no Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ============================================================
-- 1. MARKETPLACE ACCOUNTS (contas por marketplace)
-- ============================================================

CREATE TABLE IF NOT EXISTS marketplace_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  display_name TEXT,
  seller_id TEXT,
  store_id TEXT,
  external_account_id TEXT,
  cnpj TEXT,
  legal_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'INACTIVE',
  -- INACTIVE, CONNECTED, REAUTH_REQUIRED, ERROR, DISCONNECTED
  connection_status TEXT DEFAULT 'DISCONNECTED',
  -- DISCONNECTED, CONNECTING, CONNECTED, TOKEN_EXPIRED, ERROR
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  oauth_scopes TEXT,
  last_sync_at TIMESTAMPTZ,
  last_webhook_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT,
  default_percentage_fee NUMERIC(10, 2),
  default_fixed_fee NUMERIC(10, 2),
  default_tax NUMERIC(10, 2),
  default_freight NUMERIC(10, 2),
  default_ads_fee NUMERIC(10, 2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TRIGGER update_marketplace_accounts_updated_at BEFORE UPDATE ON marketplace_accounts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE INDEX IF NOT EXISTS idx_marketplace_accounts_marketplace_id ON marketplace_accounts(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_accounts_status ON marketplace_accounts(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_accounts_seller_id ON marketplace_accounts(seller_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_accounts_external ON marketplace_accounts(marketplace_id, external_account_id) WHERE external_account_id IS NOT NULL;

ALTER TABLE marketplace_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage marketplace_accounts" ON marketplace_accounts FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 2. USER ↔ MARKETPLACE ACCOUNTS (permissões por conta)
-- ============================================================

CREATE TABLE IF NOT EXISTS user_marketplace_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace_account_id UUID NOT NULL REFERENCES marketplace_accounts(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL DEFAULT 'VIEW',
  -- VIEW, EDIT, ADMIN
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, marketplace_account_id)
);

ALTER TABLE user_marketplace_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage user_marketplace_accounts" ON user_marketplace_accounts FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 3. MARKETPLACE WEBHOOK EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS marketplace_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID NOT NULL REFERENCES marketplaces(id),
  marketplace_account_id UUID REFERENCES marketplace_accounts(id),
  topic TEXT,
  resource TEXT,
  resource_id TEXT,
  external_event_id TEXT,
  seller_id TEXT,
  payload_hash TEXT,
  raw_payload JSONB,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  -- RECEIVED, PROCESSING, PROCESSED, ERROR, IGNORED
  attempts INTEGER DEFAULT 0,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_account ON marketplace_webhook_events(marketplace_account_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON marketplace_webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received ON marketplace_webhook_events(received_at DESC);

ALTER TABLE marketplace_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage webhook_events" ON marketplace_webhook_events FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 4. INTEGRATION LOGS (log de chamadas API)
-- ============================================================

CREATE TABLE IF NOT EXISTS integration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID REFERENCES marketplaces(id),
  marketplace_account_id UUID REFERENCES marketplace_accounts(id),
  endpoint TEXT,
  method TEXT,
  status_code INTEGER,
  duration_ms INTEGER,
  request_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_logs_account ON integration_logs(marketplace_account_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created ON integration_logs(created_at DESC);

ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage integration_logs" ON integration_logs FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 5. SYNC JOBS (jobs de sincronização por conta)
-- ============================================================

CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID NOT NULL REFERENCES marketplaces(id),
  marketplace_account_id UUID NOT NULL REFERENCES marketplace_accounts(id),
  job_type TEXT NOT NULL,
  -- FULL_SYNC, ORDERS_SYNC, PRODUCTS_SYNC, INVENTORY_SYNC
  status TEXT NOT NULL DEFAULT 'PENDING',
  -- PENDING, RUNNING, COMPLETED, FAILED
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  records_created INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  errors INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_account ON sync_jobs(marketplace_account_id);

ALTER TABLE sync_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage sync_jobs" ON sync_jobs FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- 6. ADICIONAR marketplace_account_id NAS TABELAS EXISTENTES
-- ============================================================

-- Orders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'marketplace_account_id') THEN
    ALTER TABLE orders ADD COLUMN marketplace_account_id UUID REFERENCES marketplace_accounts(id);
    CREATE INDEX IF NOT EXISTS idx_orders_marketplace_account ON orders(marketplace_account_id);
  END IF;
END $$;

-- Sales
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'marketplace_account_id') THEN
    ALTER TABLE sales ADD COLUMN marketplace_account_id UUID REFERENCES marketplace_accounts(id);
    CREATE INDEX IF NOT EXISTS idx_sales_marketplace_account ON sales(marketplace_account_id);
  END IF;
END $$;

-- Sale items
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_items' AND column_name = 'marketplace_account_id') THEN
    ALTER TABLE sale_items ADD COLUMN marketplace_account_id UUID REFERENCES marketplace_accounts(id);
  END IF;
END $$;

-- Shipments
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'marketplace_account_id') THEN
    ALTER TABLE shipments ADD COLUMN marketplace_account_id UUID REFERENCES marketplace_accounts(id);
  END IF;
END $$;

-- Inventory movements
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_movements' AND column_name = 'marketplace_account_id') THEN
    ALTER TABLE inventory_movements ADD COLUMN marketplace_account_id UUID REFERENCES marketplace_accounts(id);
  END IF;
END $$;

-- Marketplace listings
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_listings' AND column_name = 'marketplace_account_id') THEN
    ALTER TABLE marketplace_listings ADD COLUMN marketplace_account_id UUID REFERENCES marketplace_accounts(id);
  END IF;
END $$;

-- ============================================================
-- 7. SEED: contas de exemplo para cada marketplace
-- ============================================================

-- ML conta principal
INSERT INTO marketplace_accounts (marketplace_id, account_name, display_name, seller_id, cnpj, status, connection_status, default_percentage_fee, default_fixed_fee, default_tax, default_ads_fee)
VALUES
  ((SELECT id FROM marketplaces WHERE code = 'MERCADO_LIVRE'), 'ML - Loja Principal', 'Loja Principal', 'ML-SELLER-001', '12.345.678/0001-90', 'CONNECTED', 'CONNECTED', 16.00, 4.00, 11.00, 8.00);

-- ML conta B
INSERT INTO marketplace_accounts (marketplace_id, account_name, display_name, seller_id, cnpj, status, connection_status, default_percentage_fee, default_fixed_fee, default_tax, default_ads_fee)
VALUES
  ((SELECT id FROM marketplaces WHERE code = 'MERCADO_LIVRE'), 'ML - Eletronicos', 'Loja Eletronicos', 'ML-SELLER-002', '23.456.789/0001-01', 'CONNECTED', 'CONNECTED', 16.00, 4.00, 11.00, 8.00);

-- Shopee conta 01
INSERT INTO marketplace_accounts (marketplace_id, account_name, display_name, seller_id, status, connection_status, default_percentage_fee, default_fixed_fee, default_tax, default_ads_fee)
VALUES
  ((SELECT id FROM marketplaces WHERE code = 'SHOPEE'), 'Shopee - Loja Acessorios', 'Loja Acessorios', 'SH-SELLER-001', 'CONNECTED', 'CONNECTED', 20.00, 4.00, 11.00, 10.00);

-- Shopee conta 02
INSERT INTO marketplace_accounts (marketplace_id, account_name, display_name, seller_id, status, connection_status, default_percentage_fee, default_fixed_fee, default_tax, default_ads_fee)
VALUES
  ((SELECT id FROM marketplaces WHERE code = 'SHOPEE'), 'Shopee - Loja Capas', 'Loja Capas', 'SH-SELLER-002', 'CONNECTED', 'CONNECTED', 20.00, 4.00, 11.00, 10.00);

-- TikTok conta 01
INSERT INTO marketplace_accounts (marketplace_id, account_name, display_name, seller_id, status, connection_status, default_percentage_fee, default_fixed_fee, default_tax, default_ads_fee)
VALUES
  ((SELECT id FROM marketplaces WHERE code = 'TIKTOK'), 'TikTok - Loja Principal', 'Loja Principal', 'TK-SELLER-001', 'CONNECTED', 'CONNECTED', 8.00, 2.00, 11.00, 12.00);

-- Amazon conta 01
INSERT INTO marketplace_accounts (marketplace_id, account_name, display_name, seller_id, cnpj, status, connection_status, default_percentage_fee, default_fixed_fee, default_tax, default_ads_fee)
VALUES
  ((SELECT id FROM marketplaces WHERE code = 'AMAZON'), 'Amazon - Loja Tech', 'Loja Tech', 'AM-SELLER-001', '34.567.890/0001-12', 'CONNECTED', 'CONNECTED', 15.00, 3.00, 11.00, 5.00);

-- Amazon conta 02
INSERT INTO marketplace_accounts (marketplace_id, account_name, display_name, seller_id, status, connection_status, default_percentage_fee, default_fixed_fee, default_tax, default_ads_fee)
VALUES
  ((SELECT id FROM marketplaces WHERE code = 'AMAZON'), 'Amazon - Loja Acessorios', 'Loja Acessorios', 'AM-SELLER-002', 'INACTIVE', 'DISCONNECTED', 15.00, 3.00, 11.00, 5.00);

-- Magalu conta 01
INSERT INTO marketplace_accounts (marketplace_id, account_name, display_name, seller_id, status, connection_status, default_percentage_fee, default_fixed_fee, default_tax, default_ads_fee)
VALUES
  ((SELECT id FROM marketplaces WHERE code = 'MAGALU'), 'Magalu - Loja Principal', 'Loja Principal', 'MG-SELLER-001', 'CONNECTED', 'CONNECTED', 14.00, 5.00, 11.00, 6.00);

-- ============================================================
-- 8. VINCULAR EXISTING ORDERS/SALES A CONTAS (mapear por marketplace)
-- ============================================================

-- Orders -> marketplace_accounts
UPDATE orders SET marketplace_account_id = (
  SELECT ma.id FROM marketplace_accounts ma
  WHERE ma.marketplace_id = orders.marketplace_id
  AND ma.status = 'CONNECTED'
  ORDER BY ma.created_at
  LIMIT 1
)
WHERE marketplace_account_id IS NULL AND marketplace_id IS NOT NULL;

-- Sales -> marketplace_accounts
UPDATE sales SET marketplace_account_id = (
  SELECT ma.id FROM marketplace_accounts ma
  WHERE ma.marketplace_id = sales.marketplace_id
  AND ma.status = 'CONNECTED'
  ORDER BY ma.created_at
  LIMIT 1
)
WHERE marketplace_account_id IS NULL AND marketplace_id IS NOT NULL;
