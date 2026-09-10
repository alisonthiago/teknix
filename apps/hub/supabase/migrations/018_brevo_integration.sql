-- ============================================================
-- TEKNIX — Migration 018: Brevo — Integração de E-mail Transacional
--
-- Registra o provedor Brevo na tabela integration_configs
-- para que o integrations-proxy possa buscar a API key.
--
-- A API key não deve ser colocada nesta migration. Configure-a somente
-- no ambiente seguro ou pelo Hub após a migration.
-- ============================================================

BEGIN;

-- Registra Brevo em integration_configs (se ainda não existir)
INSERT INTO public.integration_configs (
  id,
  name,
  category,
  environment,
  status,
  enabled,
  credentials,
  created_at,
  updated_at
)
VALUES (
  'brevo',
  'Brevo (Sendinblue)',
  'email',
  'production',
  'pending_credentials',
  false,
  '{"apiKey": ""}'::jsonb,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
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
--      status = 'connected',
--      enabled = true
--    WHERE id = 'brevo';
--
-- 4. Ou via Hub > Integrações > Brevo > Configurar
-- ============================================================
