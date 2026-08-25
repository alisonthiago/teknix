-- 0006_intelligent_pricing.sql

-- Cria tabela de taxas de frete por peso (Mercado Livre e outros)
CREATE TABLE IF NOT EXISTS marketplace_shipping_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID REFERENCES marketplaces(id) ON DELETE CASCADE,
  logistic_type TEXT DEFAULT 'standard',
  weight_min_g INTEGER NOT NULL,
  weight_max_g INTEGER NOT NULL,
  seller_cost NUMERIC NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_shipping_rates_marketplace_id ON marketplace_shipping_rates(marketplace_id);
CREATE TRIGGER update_marketplace_shipping_rates_updated_at BEFORE UPDATE ON marketplace_shipping_rates FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Adiciona RLS
ALTER TABLE marketplace_shipping_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable ALL access for authenticated on marketplace_shipping_rates"
    ON marketplace_shipping_rates FOR ALL TO authenticated USING (true);

-- Insert dummy data for Mercado Livre shipping (just as a placeholder until the cron syncs it)
DO $$
DECLARE
  v_ml_id UUID;
BEGIN
  SELECT id INTO v_ml_id FROM marketplaces WHERE name ILIKE '%Mercado Livre%' LIMIT 1;

  IF v_ml_id IS NOT NULL THEN
    -- Approximate shipping costs for ML
    INSERT INTO marketplace_shipping_rates (marketplace_id, logistic_type, weight_min_g, weight_max_g, seller_cost)
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
