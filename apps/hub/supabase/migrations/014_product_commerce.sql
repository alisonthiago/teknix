-- Condições da loja própria. Não altera products, FLOW, permissões ou RLS.
BEGIN;
ALTER TABLE public.product_store_metadata
  ADD COLUMN IF NOT EXISTS commercial_settings JSONB NOT NULL DEFAULT '{}'::jsonb;
COMMENT ON COLUMN public.product_store_metadata.commercial_settings IS
  'HUB → SITE: oferta com prazo, selo editorial, aviso de última unidade, parcelas sem juros, desconto Pix e frete grátis.';
COMMIT;
