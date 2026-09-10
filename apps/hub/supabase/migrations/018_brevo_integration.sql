-- ============================================================
-- TEKNIX — Migration 018: Brevo — Integração de E-mail Transacional
--
-- Registra o provedor Brevo na tabela integration_configs
-- para que o integrations-proxy possa buscar a API key.
--
-- IMPORTANTE: Substitua 'SUA_API_KEY_BREVO_AQUI' pela API key real
-- obtida em app.brevo.com > SMTP & API > API Keys
-- ============================================================

BEGIN;

-- Registra Brevo em integration_configs (se ainda não existir)
INSERT INTO public.integration_configs (
  id,
  name,
  category,
  environment,
  status,
  credentials,
  settings,
  created_at,
  updated_at
)
VALUES (
  'brevo',
  'Brevo (Sendinblue)',
  'email',
  'production',
  'pending_credentials',
  '{"apiKey": ""}'::jsonb,  -- Preencher com a API key real do Brevo
  '{
    "senderEmail": "noreply@teknixbrasil.com.br",
    "senderName": "TEKNIX",
    "templates": {
      "pix_pending": "Aguardando pagamento Pix — inclui código copia e cola",
      "payment_approved": "Pagamento aprovado — confirmação de compra",
      "order_shipped": "Pedido enviado — com código de rastreamento"
    }
  }'::jsonb,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  settings = EXCLUDED.settings,
  updated_at = now();

COMMIT;

-- ============================================================
-- COMO ATIVAR O BREVO:
-- 
-- 1. Acesse: https://app.brevo.com
-- 2. Vá em: SMTP & API > API Keys > Criar nova chave
-- 3. Execute no Supabase SQL Editor:
--
--    UPDATE public.integration_configs
--    SET
--      credentials = '{"apiKey": "YOUR_BREVO_API_KEY"}'::jsonb,
--      status = 'connected'
--    WHERE id = 'brevo';
--
-- 4. Ou via Hub > Integrações > Brevo > Configurar
-- ============================================================
