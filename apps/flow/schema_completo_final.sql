-- ================================================================
-- TEKNIX — MIGRATION DEFINITIVA COM TODAS AS TABELAS E COLUNAS
-- ================================================================

-- 1. EXTENSÕES & ENUMS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ALTERAÇÕES EM TABELAS EXISTENTES (ADICIONAR COLUNAS QUE FALTAM)
-- Suppliers
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS distributor_city TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS distributor_state TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS pickup_address TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS pix_key TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS min_order_value NUMERIC(10,2);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS free_shipping_value NUMERIC(10,2);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS order_cutoff_time TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS default_discount NUMERIC(5,2);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS catalogs_count INTEGER DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS active_products_count INTEGER DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS catalog_url TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_freight NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_packaging NUMERIC(10,2) DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost_other NUMERIC(10,2) DEFAULT 0;

-- Purchases
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS buyer_id UUID REFERENCES auth.users(id);
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS buyer_name TEXT;
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'COMPLETED';

-- Sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS marketplace_account_id UUID;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS customer_id UUID;

-- Marketplaces
ALTER TABLE public.marketplaces ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE public.marketplaces ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'MARKETPLACE';
ALTER TABLE public.marketplaces ADD COLUMN IF NOT EXISTS api_available BOOLEAN DEFAULT FALSE;
ALTER TABLE public.marketplaces ADD COLUMN IF NOT EXISTS oauth_available BOOLEAN DEFAULT FALSE;
ALTER TABLE public.marketplaces ADD COLUMN IF NOT EXISTS webhook_available BOOLEAN DEFAULT FALSE;

-- Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role_label TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
UPDATE public.profiles SET photo_url = avatar_url WHERE photo_url IS NULL AND avatar_url IS NOT NULL;
UPDATE public.profiles SET avatar_url = photo_url WHERE avatar_url IS NULL AND photo_url IS NOT NULL;

-- 3. CRIAR TABELAS DE FORNECEDORES
-- Supplier Contacts
CREATE TABLE IF NOT EXISTS public.supplier_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT NOT NULL,
    is_whatsapp BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_supplier_contacts_supplier_id ON public.supplier_contacts(supplier_id);
ALTER TABLE public.supplier_contacts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_supplier_contacts" ON public.supplier_contacts FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Supplier Catalogs
CREATE TABLE IF NOT EXISTS public.supplier_catalogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_name TEXT,
    file_size_bytes BIGINT,
    file_type TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_supplier_catalogs_supplier_id ON public.supplier_catalogs(supplier_id);
ALTER TABLE public.supplier_catalogs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_supplier_catalogs" ON public.supplier_catalogs FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. CRIAR TABELAS DE PRODUTOS & ESTOQUE
-- Product Images
CREATE TABLE IF NOT EXISTS public.product_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_product_images" ON public.product_images FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Product Stock
CREATE TABLE IF NOT EXISTS public.product_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE UNIQUE,
    physical INTEGER NOT NULL DEFAULT 0,
    reserved INTEGER NOT NULL DEFAULT 0,
    available INTEGER NOT NULL DEFAULT 0,
    minimum INTEGER NOT NULL DEFAULT 0,
    maximum INTEGER NOT NULL DEFAULT 0,
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
DROP TRIGGER IF EXISTS update_product_stock_updated_at ON public.product_stock;
CREATE TRIGGER update_product_stock_updated_at BEFORE UPDATE ON public.product_stock FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_product_stock" ON public.product_stock FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Stock Movements (tabela completa e sincronizada com inventory_movements)
CREATE TABLE IF NOT EXISTS public.stock_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    unit_cost NUMERIC(10,2),
    total_cost NUMERIC(10,2),
    reference_id UUID,
    reference_type TEXT,
    order_ref TEXT,
    notes TEXT,
    user_id UUID REFERENCES auth.users(id),
    external_order_id TEXT,
    marketplace_id TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id ON public.stock_movements(product_id);
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_stock_movements" ON public.stock_movements FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. CRIAR TABELAS DE MARKETPLACES & CONTAS
-- Marketplace Accounts
CREATE TABLE IF NOT EXISTS public.marketplace_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id UUID REFERENCES public.marketplaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    account_name TEXT NOT NULL,
    seller_id TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    auto_sync_stock BOOLEAN DEFAULT TRUE,
    auto_sync_prices BOOLEAN DEFAULT TRUE,
    auto_import_orders BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
DROP TRIGGER IF EXISTS update_marketplace_accounts_updated_at ON public.marketplace_accounts;
CREATE TRIGGER update_marketplace_accounts_updated_at BEFORE UPDATE ON public.marketplace_accounts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
ALTER TABLE public.marketplace_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_marketplace_accounts" ON public.marketplace_accounts FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- User Marketplace Accounts
CREATE TABLE IF NOT EXISTS public.user_marketplace_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    marketplace_account_id UUID NOT NULL REFERENCES public.marketplace_accounts(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'OPERATOR',
    can_manage BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, marketplace_account_id)
);
ALTER TABLE public.user_marketplace_accounts ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_user_marketplace_accounts" ON public.user_marketplace_accounts FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Marketplace Connections
CREATE TABLE IF NOT EXISTS public.marketplace_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    marketplace_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    account_name TEXT,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    last_sync_at TIMESTAMPTZ,
    last_webhook_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
DROP TRIGGER IF EXISTS update_marketplace_connections_updated_at ON public.marketplace_connections;
CREATE TRIGGER update_marketplace_connections_updated_at BEFORE UPDATE ON public.marketplace_connections FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
ALTER TABLE public.marketplace_connections ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_marketplace_connections" ON public.marketplace_connections FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Marketplace Listings
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    marketplace_id UUID NOT NULL REFERENCES public.marketplaces(id) ON DELETE CASCADE,
    marketplace_account_id UUID REFERENCES public.marketplace_accounts(id) ON DELETE SET NULL,
    external_id TEXT,
    seller_sku TEXT,
    title TEXT,
    price NUMERIC(10,2) NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    stock_synced INTEGER DEFAULT 0,
    marketplace_url TEXT,
    category TEXT,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
DROP TRIGGER IF EXISTS update_marketplace_listings_updated_at ON public.marketplace_listings;
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON public.marketplace_listings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_marketplace_listings" ON public.marketplace_listings FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Marketplace Orders
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id TEXT NOT NULL,
    external_order_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    status TEXT NOT NULL,
    total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'BRL',
    order_date TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    raw_data JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_orders_external_id ON public.marketplace_orders(marketplace_id, external_order_id);
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_marketplace_orders" ON public.marketplace_orders FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Marketplace Order Items
CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    external_item_id TEXT NOT NULL,
    seller_sku TEXT,
    quantity INTEGER NOT NULL,
    unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_marketplace_order_items" ON public.marketplace_order_items FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Marketplace Shipping Rates
CREATE TABLE IF NOT EXISTS public.marketplace_shipping_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id UUID REFERENCES public.marketplaces(id) ON DELETE CASCADE,
    logistic_type TEXT DEFAULT 'standard',
    weight_min_g INTEGER NOT NULL,
    weight_max_g INTEGER NOT NULL,
    seller_cost NUMERIC(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
DROP TRIGGER IF EXISTS update_marketplace_shipping_rates_updated_at ON public.marketplace_shipping_rates;
CREATE TRIGGER update_marketplace_shipping_rates_updated_at BEFORE UPDATE ON public.marketplace_shipping_rates FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
ALTER TABLE public.marketplace_shipping_rates ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_marketplace_shipping_rates" ON public.marketplace_shipping_rates FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Marketplace Fee Rules
CREATE TABLE IF NOT EXISTS public.marketplace_fee_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id UUID NOT NULL REFERENCES public.marketplaces(id) ON DELETE CASCADE,
    fee_percentage NUMERIC(10,2) NOT NULL DEFAULT 0,
    fixed_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax_percentage NUMERIC(10,2) NOT NULL DEFAULT 0,
    advertising_percentage NUMERIC(10,2) NOT NULL DEFAULT 0,
    other_cost_percentage NUMERIC(10,2) NOT NULL DEFAULT 0,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
DROP TRIGGER IF EXISTS update_marketplace_fee_rules_updated_at ON public.marketplace_fee_rules;
CREATE TRIGGER update_marketplace_fee_rules_updated_at BEFORE UPDATE ON public.marketplace_fee_rules FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
ALTER TABLE public.marketplace_fee_rules ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_marketplace_fee_rules" ON public.marketplace_fee_rules FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Marketplace Webhook Events
CREATE TABLE IF NOT EXISTS public.marketplace_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    resource TEXT NOT NULL,
    raw_payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    processed_at TIMESTAMPTZ,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.marketplace_webhook_events ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_marketplace_webhook_events" ON public.marketplace_webhook_events FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Integration Logs
CREATE TABLE IF NOT EXISTS public.integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id TEXT NOT NULL,
    type TEXT NOT NULL,
    endpoint TEXT,
    method TEXT,
    status_code INTEGER,
    duration_ms INTEGER,
    success BOOLEAN NOT NULL,
    error TEXT,
    resource TEXT,
    resource_id TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_integration_logs" ON public.integration_logs FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    module TEXT NOT NULL,
    target_id TEXT,
    target_name TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_audit_logs" ON public.audit_logs FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Sync Jobs
CREATE TABLE IF NOT EXISTS public.sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING',
    marketplace_id TEXT,
    items_synced INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    logs JSONB,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_sync_jobs" ON public.sync_jobs FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- API Keys
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL,
    permissions JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_api_keys" ON public.api_keys FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 6. SEED MARKETPLACE SHIPPING RATES (MERCADO LIVRE)
DO $$
DECLARE
  v_ml_id UUID;
BEGIN
  SELECT id INTO v_ml_id FROM public.marketplaces WHERE code = 'MERCADO_LIVRE' OR name ILIKE '%Mercado Livre%' LIMIT 1;
  IF v_ml_id IS NOT NULL THEN
    INSERT INTO public.marketplace_shipping_rates (marketplace_id, logistic_type, weight_min_g, weight_max_g, seller_cost)
    VALUES
      (v_ml_id, 'standard', 0, 300, 18.95),
      (v_ml_id, 'standard', 301, 500, 19.45),
      (v_ml_id, 'standard', 501, 1000, 20.95),
      (v_ml_id, 'standard', 1001, 2000, 22.45),
      (v_ml_id, 'standard', 2001, 5000, 28.45),
      (v_ml_id, 'standard', 5001, 9000, 41.95),
      (v_ml_id, 'standard', 9001, 13000, 61.95),
      (v_ml_id, 'standard', 13001, 17000, 70.95),
      (v_ml_id, 'standard', 17001, 23000, 83.95),
      (v_ml_id, 'standard', 23001, 30000, 96.95)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- VERIFICAÇÃO GERAL
-- ============================================================
SELECT 'suppliers' as tabela, count(*) as contagem FROM suppliers
UNION ALL SELECT 'supplier_contacts', count(*) FROM supplier_contacts
UNION ALL SELECT 'supplier_catalogs', count(*) FROM supplier_catalogs
UNION ALL SELECT 'product_images', count(*) FROM product_images
UNION ALL SELECT 'stock_movements', count(*) FROM stock_movements
UNION ALL SELECT 'product_stock', count(*) FROM product_stock
UNION ALL SELECT 'marketplace_accounts', count(*) FROM marketplace_accounts
UNION ALL SELECT 'marketplace_connections', count(*) FROM marketplace_connections
UNION ALL SELECT 'marketplace_listings', count(*) FROM marketplace_listings
UNION ALL SELECT 'marketplace_orders', count(*) FROM marketplace_orders
UNION ALL SELECT 'marketplace_shipping_rates', count(*) FROM marketplace_shipping_rates
UNION ALL SELECT 'marketplace_fee_rules', count(*) FROM marketplace_fee_rules
UNION ALL SELECT 'marketplace_webhook_events', count(*) FROM marketplace_webhook_events
UNION ALL SELECT 'integration_logs', count(*) FROM integration_logs
UNION ALL SELECT 'audit_logs', count(*) FROM audit_logs
UNION ALL SELECT 'sync_jobs', count(*) FROM sync_jobs
UNION ALL SELECT 'api_keys', count(*) FROM api_keys;
