-- ============================================================
-- 007b_ADD_MARKETPLACE_ACCOUNT_ID.sql
-- Versão simplificada — sem DO $$ blocks
-- Execute no SQL Editor do Supabase
-- ============================================================

-- 1. MARKETPLACE ACCOUNTS (se não existir)
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
  connection_status TEXT DEFAULT 'DISCONNECTED',
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
ALTER TABLE marketplace_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage marketplace_accounts" ON marketplace_accounts FOR ALL USING (auth.role() = 'authenticated');

-- 2. Adicionar marketplace_account_id em orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS marketplace_account_id UUID REFERENCES marketplace_accounts(id);
CREATE INDEX IF NOT EXISTS idx_orders_marketplace_account ON orders(marketplace_account_id);

-- 3. Adicionar marketplace_account_id em sales
ALTER TABLE sales ADD COLUMN IF NOT EXISTS marketplace_account_id UUID REFERENCES marketplace_accounts(id);
CREATE INDEX IF NOT EXISTS idx_sales_marketplace_account ON sales(marketplace_account_id);

-- 4. Adicionar marketplace_account_id em sale_items
ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS marketplace_account_id UUID REFERENCES marketplace_accounts(id);

-- 5. Adicionar marketplace_account_id em shipments
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS marketplace_account_id UUID REFERENCES marketplace_accounts(id);

-- 6. Adicionar marketplace_account_id em inventory_movements
ALTER TABLE inventory_movements ADD COLUMN IF NOT EXISTS marketplace_account_id UUID REFERENCES marketplace_accounts(id);

-- 7. Adicionar marketplace_account_id em marketplace_listings
ALTER TABLE marketplace_listings ADD COLUMN IF NOT EXISTS marketplace_account_id UUID REFERENCES marketplace_accounts(id);

-- 8. WEBHOOK EVENTS
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
  attempts INTEGER DEFAULT 0,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_webhook_events_account ON marketplace_webhook_events(marketplace_account_id);
ALTER TABLE marketplace_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage webhook_events" ON marketplace_webhook_events FOR ALL USING (auth.role() = 'authenticated');

-- 9. INTEGRATION LOGS
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
ALTER TABLE integration_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage integration_logs" ON integration_logs FOR ALL USING (auth.role() = 'authenticated');

-- 10. SYNC JOBS
CREATE TABLE IF NOT EXISTS sync_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID NOT NULL REFERENCES marketplaces(id),
  marketplace_account_id UUID NOT NULL REFERENCES marketplace_accounts(id),
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
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

-- 11. USER ↔ MARKETPLACE ACCOUNTS
CREATE TABLE IF NOT EXISTS user_marketplace_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace_account_id UUID NOT NULL REFERENCES marketplace_accounts(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL DEFAULT 'VIEW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, marketplace_account_id)
);
ALTER TABLE user_marketplace_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can manage user_marketplace_accounts" ON user_marketplace_accounts FOR ALL USING (auth.role() = 'authenticated');

-- 12. SEED: contas de exemplo
INSERT INTO marketplace_accounts (marketplace_id, account_name, display_name, seller_id, cnpj, status, connection_status, default_percentage_fee, default_fixed_fee, default_tax, default_ads_fee)
VALUES
  ((SELECT id FROM marketplaces WHERE code = 'MERCADO_LIVRE'), 'ML - Loja Principal', 'Loja Principal', 'ML-SELLER-001', '12.345.678/0001-90', 'CONNECTED', 'CONNECTED', 16.00, 4.00, 11.00, 8.00),
  ((SELECT id FROM marketplaces WHERE code = 'MERCADO_LIVRE'), 'ML - Eletronicos', 'Loja Eletronicos', 'ML-SELLER-002', '23.456.789/0001-01', 'CONNECTED', 'CONNECTED', 16.00, 4.00, 11.00, 8.00),
  ((SELECT id FROM marketplaces WHERE code = 'SHOPEE'), 'Shopee - Loja Acessorios', 'Loja Acessorios', 'SH-SELLER-001', NULL, 'CONNECTED', 'CONNECTED', 20.00, 4.00, 11.00, 10.00),
  ((SELECT id FROM marketplaces WHERE code = 'SHOPEE'), 'Shopee - Loja Capas', 'Loja Capas', 'SH-SELLER-002', NULL, 'CONNECTED', 'CONNECTED', 20.00, 4.00, 11.00, 10.00),
  ((SELECT id FROM marketplaces WHERE code = 'TIKTOK'), 'TikTok - Loja Principal', 'Loja Principal', 'TK-SELLER-001', NULL, 'CONNECTED', 'CONNECTED', 8.00, 2.00, 11.00, 12.00),
  ((SELECT id FROM marketplaces WHERE code = 'AMAZON'), 'Amazon - Loja Tech', 'Loja Tech', 'AM-SELLER-001', '34.567.890/0001-12', 'CONNECTED', 'CONNECTED', 15.00, 3.00, 11.00, 5.00),
  ((SELECT id FROM marketplaces WHERE code = 'AMAZON'), 'Amazon - Loja Acessorios', 'Loja Acessorios', 'AM-SELLER-002', NULL, 'INACTIVE', 'DISCONNECTED', 15.00, 3.00, 11.00, 5.00),
  ((SELECT id FROM marketplaces WHERE code = 'MAGALU'), 'Magalu - Loja Principal', 'Loja Principal', 'MG-SELLER-001', NULL, 'CONNECTED', 'CONNECTED', 14.00, 5.00, 11.00, 6.00);

-- 13. Vincular orders existentes à primeira conta conectada do marketplace
UPDATE orders SET marketplace_account_id = (
  SELECT ma.id FROM marketplace_accounts ma
  WHERE ma.marketplace_id = orders.marketplace_id
  AND ma.status = 'CONNECTED'
  ORDER BY ma.created_at
  LIMIT 1
)
WHERE marketplace_account_id IS NULL AND marketplace_id IS NOT NULL;

-- 14. Vincular sales existentes à primeira conta conectada do marketplace
UPDATE sales SET marketplace_account_id = (
  SELECT ma.id FROM marketplace_accounts ma
  WHERE ma.marketplace_id = sales.marketplace_id
  AND ma.status = 'CONNECTED'
  ORDER BY ma.created_at
  LIMIT 1
)
WHERE marketplace_account_id IS NULL AND marketplace_id IS NOT NULL;
