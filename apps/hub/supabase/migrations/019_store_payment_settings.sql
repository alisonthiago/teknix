-- Configuração pública dos meios de pagamento da loja própria.
-- Credenciais privadas continuam somente no Hub; esta tabela contém apenas
-- as preferências necessárias para o checkout decidir o que exibir.
CREATE TABLE IF NOT EXISTS public.store_payment_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  enable_pix BOOLEAN NOT NULL DEFAULT true,
  pix_discount_percent NUMERIC(5,2) NOT NULL DEFAULT 5,
  enable_credit_card BOOLEAN NOT NULL DEFAULT true,
  enable_boleto BOOLEAN NOT NULL DEFAULT false,
  max_installments INTEGER NOT NULL DEFAULT 12,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.store_payment_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.store_payment_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_store_payment_settings" ON public.store_payment_settings;
CREATE POLICY "public_read_store_payment_settings"
  ON public.store_payment_settings FOR SELECT
  TO anon, authenticated
  USING (id = 'default');

DROP POLICY IF EXISTS "hub_admin_manage_store_payment_settings" ON public.store_payment_settings;
CREATE POLICY "hub_admin_manage_store_payment_settings"
  ON public.store_payment_settings FOR ALL
  TO authenticated
  USING (public.fn_is_hub_admin())
  WITH CHECK (public.fn_is_hub_admin());