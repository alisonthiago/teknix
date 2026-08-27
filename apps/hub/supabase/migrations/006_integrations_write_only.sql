-- ============================================================
-- TEKNIX HUB — INTEGRATIONS SECURITY LAYER (Migration 006)
-- WRITE-ONLY CREDENTIALS & SERVER-SIDE ISOLATION
--
-- REGRA ABSOLUTA: O frontend NUNCA tem acesso de leitura aos tokens.
-- O banco expõe apenas status, environment e has_credentials (boolean).
-- ============================================================

-- 1. VIEW HIGIENIZADA (sem a coluna credentials)
CREATE OR REPLACE VIEW public.vw_integration_statuses AS
SELECT
  id,
  name,
  category,
  status,
  environment,
  enabled,
  webhook_url,
  last_sync_at,
  last_health_check_at,
  health_latency_ms,
  error_message,
  created_at,
  updated_at,
  (credentials IS NOT NULL AND credentials != '{}'::jsonb AND jsonb_typeof(credentials) = 'object' AND credentials != 'null'::jsonb) AS has_credentials
FROM public.integration_configs;

-- 2. FUNÇÃO SEGURA DE LEITURA (RPC)
-- Retorna apenas os metadados dos provedores para o painel HUB
CREATE OR REPLACE FUNCTION public.fn_get_integration_statuses()
RETURNS TABLE (
  id                   TEXT,
  name                 TEXT,
  category             TEXT,
  status               TEXT,
  environment          TEXT,
  enabled              BOOLEAN,
  webhook_url          TEXT,
  last_sync_at         TIMESTAMPTZ,
  last_health_check_at TIMESTAMPTZ,
  health_latency_ms    INT,
  error_message        TEXT,
  created_at           TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ,
  has_credentials      BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    name,
    category,
    status,
    environment,
    enabled,
    webhook_url,
    last_sync_at,
    last_health_check_at,
    health_latency_ms,
    error_message,
    created_at,
    updated_at,
    has_credentials
  FROM public.vw_integration_statuses;
$$;

-- 3. FUNÇÃO SEGURA DE GRAVAÇÃO (RPC WRITE-ONLY)
-- Salva a credencial no servidor e NÃO retorna o token de volta
CREATE OR REPLACE FUNCTION public.fn_save_integration_credentials(
  p_id          TEXT,
  p_credentials JSONB DEFAULT NULL,
  p_environment TEXT DEFAULT 'sandbox',
  p_enabled     BOOLEAN DEFAULT TRUE,
  p_webhook_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credentials JSONB;
BEGIN
  -- Busca credenciais existentes para merge
  SELECT credentials INTO v_current_credentials
  FROM public.integration_configs
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provedor % não encontrado.', p_id;
  END IF;

  -- Se novas credenciais foram informadas, atualiza
  IF p_credentials IS NOT NULL AND p_credentials != '{}'::jsonb THEN
    v_current_credentials := p_credentials;
  END IF;

  UPDATE public.integration_configs
  SET
    credentials = v_current_credentials,
    environment = COALESCE(p_environment, environment),
    enabled = COALESCE(p_enabled, enabled),
    webhook_url = COALESCE(p_webhook_url, webhook_url),
    status = CASE
      WHEN v_current_credentials IS NOT NULL AND v_current_credentials != '{}'::jsonb THEN 'connected'
      ELSE 'pending_credentials'
    END,
    updated_at = NOW()
  WHERE id = p_id;

  -- Retorna apenas confirmação segura, NUNCA o token
  RETURN jsonb_build_object(
    'success', TRUE,
    'id', p_id,
    'status', CASE WHEN v_current_credentials IS NOT NULL AND v_current_credentials != '{}'::jsonb THEN 'connected' ELSE 'pending_credentials' END,
    'has_credentials', (v_current_credentials IS NOT NULL AND v_current_credentials != '{}'::jsonb)
  );
END;
$$;

-- 4. FUNÇÃO SERVER-SIDE DE PROXY PARA EXECUÇÃO DE INTEGRAÇÕES (SECURITY DEFINER)
-- Permite que o Supabase execute chamadas ou obtenha o secret internamente
CREATE OR REPLACE FUNCTION public.fn_execute_integration(
  p_provider_id TEXT,
  p_action      TEXT,
  p_payload     JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
BEGIN
  -- Busca a configuração com o token interno (segredo protegido no servidor)
  SELECT * INTO v_config
  FROM public.integration_configs
  WHERE id = p_provider_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'Provedor não encontrado');
  END IF;

  -- Registra log de execução interna
  INSERT INTO public.integration_logs (
    provider_id,
    category,
    action,
    status,
    order_id,
    request_payload,
    created_at
  ) VALUES (
    p_provider_id,
    v_config.category,
    p_action,
    'server_execution',
    p_payload->>'orderId',
    jsonb_build_object('action', p_action),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', TRUE,
    'provider_id', p_provider_id,
    'action', p_action,
    'status', v_config.status,
    'environment', v_config.environment,
    'has_credentials', (v_config.credentials IS NOT NULL AND v_config.credentials != '{}'::jsonb)
  );
END;
$$;
