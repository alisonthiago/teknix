-- 0003_multichannel_architecture.sql
-- Enhance marketplaces table for multichannel architecture
-- Add marketplace_fee_rules and marketplace_fee_history

-- 1. Enhance marketplaces
ALTER TABLE public.marketplaces ADD COLUMN IF NOT EXISTS logo TEXT;
ALTER TABLE public.marketplaces ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'MARKETPLACE';
ALTER TABLE public.marketplaces ADD COLUMN IF NOT EXISTS api_available BOOLEAN DEFAULT FALSE;
ALTER TABLE public.marketplaces ADD COLUMN IF NOT EXISTS oauth_available BOOLEAN DEFAULT FALSE;
ALTER TABLE public.marketplaces ADD COLUMN IF NOT EXISTS webhook_available BOOLEAN DEFAULT FALSE;

-- 2. Enhance marketplace_connections
ALTER TABLE public.marketplace_connections ADD COLUMN IF NOT EXISTS account_name TEXT;
ALTER TABLE public.marketplace_connections ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;
ALTER TABLE public.marketplace_connections ADD COLUMN IF NOT EXISTS last_webhook_at TIMESTAMPTZ;

-- 3. Enhance marketplace_listings
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS marketplace_url TEXT;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS stock_synced INTEGER DEFAULT 0;

-- 4. marketplace_fee_rules
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
CREATE TRIGGER update_marketplace_fee_rules_updated_at BEFORE UPDATE ON public.marketplace_fee_rules FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 5. marketplace_fee_history
CREATE TABLE IF NOT EXISTS public.marketplace_fee_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id UUID NOT NULL REFERENCES public.marketplaces(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id),
    old_fee_percentage NUMERIC(10,2),
    new_fee_percentage NUMERIC(10,2),
    old_fixed_fee NUMERIC(10,2),
    new_fixed_fee NUMERIC(10,2),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. RLS for new tables
ALTER TABLE public.marketplace_fee_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL access for authenticated users on marketplace_fee_rules"
    ON public.marketplace_fee_rules FOR ALL TO authenticated USING (true);

ALTER TABLE public.marketplace_fee_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL access for authenticated users on marketplace_fee_history"
    ON public.marketplace_fee_history FOR ALL TO authenticated USING (true);

-- 7. Seed all 12 marketplaces
INSERT INTO public.marketplaces (name, code, status, type, api_available, oauth_available, webhook_available, default_percentage_fee, default_fixed_fee, default_tax, default_freight, default_ads_fee, logo)
VALUES
  ('Mercado Livre', 'MERCADO_LIVRE', 'ACTIVE', 'MARKETPLACE', TRUE, TRUE, TRUE, 16.00, 4.99, 11.00, 0, 0, '/logos/mercadolivre.svg'),
  ('Shopee', 'SHOPEE', 'ACTIVE', 'MARKETPLACE', TRUE, FALSE, TRUE, 20.00, 0, 11.00, 0, 0, '/logos/shopee.svg'),
  ('Amazon', 'AMAZON', 'ACTIVE', 'MARKETPLACE', TRUE, FALSE, TRUE, 15.00, 0, 11.00, 0, 0, '/logos/amazon.svg'),
  ('TikTok Shop', 'TIKTOK_SHOP', 'INACTIVE', 'MARKETPLACE', FALSE, FALSE, FALSE, 8.00, 0, 11.00, 0, 0, '/logos/tiktokshop.svg'),
  ('Magazine Luiza', 'MAGALU', 'ACTIVE', 'MARKETPLACE', TRUE, FALSE, FALSE, 18.00, 0, 11.00, 0, 0, '/logos/magalu.svg'),
  ('Temu', 'TEMU', 'INACTIVE', 'MARKETPLACE', FALSE, FALSE, FALSE, 0, 0, 11.00, 0, 0, '/logos/temu.svg'),
  ('Shein', 'SHEIN', 'INACTIVE', 'MARKETPLACE', FALSE, FALSE, FALSE, 0, 0, 11.00, 0, 0, '/logos/shein.svg'),
  ('AliExpress', 'ALIEXPRESS', 'INACTIVE', 'MARKETPLACE', FALSE, FALSE, FALSE, 0, 0, 11.00, 0, 0, '/logos/aliexpress.svg'),
  ('Casas Bahia', 'CASAS_BAHIA', 'INACTIVE', 'MARKETPLACE', FALSE, FALSE, FALSE, 15.00, 0, 11.00, 0, 0, '/logos/casasbahia.svg'),
  ('Americanas', 'AMERICANAS', 'INACTIVE', 'MARKETPLACE', FALSE, FALSE, FALSE, 15.00, 0, 11.00, 0, 0, '/logos/americanas.svg'),
  ('OLX', 'OLX', 'INACTIVE', 'MARKETPLACE', FALSE, FALSE, FALSE, 0, 0, 11.00, 0, 0, '/logos/olx.svg'),
  ('Outros', 'OUTROS', 'ACTIVE', 'OTHER', FALSE, FALSE, FALSE, 0, 0, 0, 0, 0, '/logos/outros.svg')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  status = EXCLUDED.status,
  type = EXCLUDED.type,
  api_available = EXCLUDED.api_available,
  oauth_available = EXCLUDED.oauth_available,
  webhook_available = EXCLUDED.webhook_available,
  default_percentage_fee = EXCLUDED.default_percentage_fee,
  default_fixed_fee = EXCLUDED.default_fixed_fee,
  default_tax = EXCLUDED.default_tax,
  default_freight = EXCLUDED.default_freight,
  default_ads_fee = EXCLUDED.default_ads_fee,
  logo = EXCLUDED.logo;
