-- ============================================================
-- TEKNIX HUB — INTEGRATIONS SECURITY LAYER
-- Migration 005 (v2): Idempotente — recria tabelas se necessário
--
-- REGRA: NÃO altera nenhuma tabela do FLOW.
-- Credenciais sensíveis ficam no banco com RLS ativa.
-- ============================================================

-- ============================================================
-- 0. CLEANUP — Remove versões antigas/incompletas das tabelas
-- ============================================================
DROP TABLE IF EXISTS public.integration_logs CASCADE;
DROP TABLE IF EXISTS public.webhook_events CASCADE;
DROP TABLE IF EXISTS public.integration_configs CASCADE;

-- ============================================================
-- 1. integration_configs
-- ============================================================
CREATE TABLE public.integration_configs (
  id                     TEXT PRIMARY KEY,
  name                   TEXT NOT NULL,
  category               TEXT NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'pending_credentials',
  environment            TEXT NOT NULL DEFAULT 'sandbox',
  enabled                BOOLEAN NOT NULL DEFAULT FALSE,
  credentials            JSONB NOT NULL DEFAULT '{}',
  webhook_url            TEXT,
  webhook_secret         TEXT,
  last_sync_at           TIMESTAMPTZ,
  last_health_check_at   TIMESTAMPTZ,
  health_latency_ms      INT,
  error_message          TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_integration_configs_updated_at ON public.integration_configs;
CREATE TRIGGER trg_integration_configs_updated_at
  BEFORE UPDATE ON public.integration_configs
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hub_admins_all_integration_configs"
  ON public.integration_configs
  FOR ALL
  TO authenticated
  USING (public.fn_is_hub_admin())
  WITH CHECK (public.fn_is_hub_admin());

-- ============================================================
-- 2. webhook_events — Idempotencia persistente
-- ============================================================
CREATE TABLE public.webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_hash      TEXT NOT NULL UNIQUE,
  provider_id     TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  event_id        TEXT,
  status          TEXT NOT NULL DEFAULT 'received',
  payload         JSONB,
  result          JSONB,
  error_message   TEXT,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_events_hash        ON public.webhook_events(event_hash);
CREATE INDEX idx_webhook_events_provider    ON public.webhook_events(provider_id);
CREATE INDEX idx_webhook_events_received_at ON public.webhook_events(received_at DESC);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hub_admins_all_webhook_events"
  ON public.webhook_events
  FOR ALL
  TO authenticated
  USING (public.fn_is_hub_admin())
  WITH CHECK (public.fn_is_hub_admin());

-- ============================================================
-- 3. integration_logs — Log persistente
-- ============================================================
CREATE TABLE public.integration_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id      TEXT NOT NULL,
  category         TEXT NOT NULL,
  action           TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  order_id         TEXT,
  order_number     TEXT,
  latency_ms       INT,
  request_payload  JSONB,
  response_payload JSONB,
  error_message    TEXT,
  can_reprocess    BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_integration_logs_provider ON public.integration_logs(provider_id);
CREATE INDEX idx_integration_logs_order    ON public.integration_logs(order_id);
CREATE INDEX idx_integration_logs_created  ON public.integration_logs(created_at DESC);
CREATE INDEX idx_integration_logs_status   ON public.integration_logs(status);

ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hub_admins_all_integration_logs"
  ON public.integration_logs
  FOR ALL
  TO authenticated
  USING (public.fn_is_hub_admin())
  WITH CHECK (public.fn_is_hub_admin());

-- ============================================================
-- 4. SEEDS — Provedores padrao SEM credenciais
-- ============================================================
INSERT INTO public.integration_configs (id, name, category, status, environment, enabled, credentials)
VALUES
  ('mercado_pago', 'Mercado Pago',        'payment',  'pending_credentials', 'sandbox',    FALSE, '{}'),
  ('asaas',        'Asaas',               'payment',  'pending_credentials', 'sandbox',    FALSE, '{}'),
  ('focus_nfe',    'Focus NFe',           'fiscal',   'pending_credentials', 'sandbox',    FALSE, '{}'),
  ('bling',        'Bling ERP',           'fiscal',   'pending_credentials', 'production', FALSE, '{}'),
  ('melhor_envio', 'Melhor Envio',        'shipping', 'pending_credentials', 'sandbox',    FALSE, '{}'),
  ('frenet',       'Frenet',              'shipping', 'pending_credentials', 'production', FALSE, '{}'),
  ('site_teknix',  'Loja Propria (SITE)', 'channel',  'connected',           'production', TRUE,  '{"storeUrl":"http://localhost:5173"}')
ON CONFLICT (id) DO NOTHING;
