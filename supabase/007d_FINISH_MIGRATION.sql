-- ============================================================
-- 007d_FINISH_MIGRATION.sql
-- Só adiciona o que FALTA — ignora o que já existe
-- ============================================================

-- 1. Adicionar marketplace_account_id onde não existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'marketplace_account_id') THEN
    ALTER TABLE orders ADD COLUMN marketplace_account_id UUID REFERENCES marketplace_accounts(id);
    CREATE INDEX idx_orders_marketplace_account ON orders(marketplace_account_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sales' AND column_name = 'marketplace_account_id') THEN
    ALTER TABLE sales ADD COLUMN marketplace_account_id UUID REFERENCES marketplace_accounts(id);
    CREATE INDEX idx_sales_marketplace_account ON sales(marketplace_account_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sale_items' AND column_name = 'marketplace_account_id') THEN
    ALTER TABLE sale_items ADD COLUMN marketplace_account_id UUID REFERENCES marketplace_accounts(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shipments' AND column_name = 'marketplace_account_id') THEN
    ALTER TABLE shipments ADD COLUMN marketplace_account_id UUID REFERENCES marketplace_accounts(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_movements' AND column_name = 'marketplace_account_id') THEN
    ALTER TABLE inventory_movements ADD COLUMN marketplace_account_id UUID REFERENCES marketplace_accounts(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'marketplace_listings' AND column_name = 'marketplace_account_id') THEN
    ALTER TABLE marketplace_listings ADD COLUMN marketplace_account_id UUID REFERENCES marketplace_accounts(id);
  END IF;
END $$;

-- 2. Criar tabelas que faltam
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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sync_jobs') THEN
    CREATE POLICY "Authenticated can manage sync_jobs" ON sync_jobs FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS user_marketplace_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace_account_id UUID NOT NULL REFERENCES marketplace_accounts(id) ON DELETE CASCADE,
  permission_level TEXT NOT NULL DEFAULT 'VIEW',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, marketplace_account_id)
);
ALTER TABLE user_marketplace_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_marketplace_accounts') THEN
    CREATE POLICY "Authenticated can manage user_marketplace_accounts" ON user_marketplace_accounts FOR ALL USING (auth.role() = 'authenticated');
  END IF;
END $$;

-- 3. Seed contas (só se vazio)
DO $$
BEGIN
  IF (SELECT count(*) FROM marketplace_accounts) = 0 THEN
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
  END IF;
END $$;

-- 4. Vincular orders existentes
UPDATE orders SET marketplace_account_id = (
  SELECT ma.id FROM marketplace_accounts ma
  WHERE ma.marketplace_id = orders.marketplace_id
  AND ma.status = 'CONNECTED'
  ORDER BY ma.created_at
  LIMIT 1
)
WHERE marketplace_account_id IS NULL AND marketplace_id IS NOT NULL;

-- 5. Vincular sales existentes
UPDATE sales SET marketplace_account_id = (
  SELECT ma.id FROM marketplace_accounts ma
  WHERE ma.marketplace_id = sales.marketplace_id
  AND ma.status = 'CONNECTED'
  ORDER BY ma.created_at
  LIMIT 1
)
WHERE marketplace_account_id IS NULL AND marketplace_id IS NOT NULL;
