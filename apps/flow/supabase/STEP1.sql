-- ============================================================
-- PASSO 1: Criar tabela marketplace_accounts (só isso)
-- ============================================================

CREATE TABLE IF NOT EXISTS marketplace_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marketplace_id UUID NOT NULL REFERENCES marketplaces(id) ON DELETE CASCADE,
  account_name TEXT NOT NULL,
  display_name TEXT,
  seller_id TEXT,
  store_id TEXT,
  external_account_id TEXT,
  cnpj TEXT,
  legal_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'INACTIVE',
  connection_status TEXT DEFAULT 'DISCONNECTED',
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  oauth_scopes TEXT,
  last_sync_at TIMESTAMPTZ,
  last_webhook_at TIMESTAMPTZ,
  last_error_at TIMESTAMPTZ,
  last_error_message TEXT,
  default_percentage_fee NUMERIC(10, 2),
  default_fixed_fee NUMERIC(10, 2),
  default_tax NUMERIC(10, 2),
  default_freight NUMERIC(10, 2),
  default_ads_fee NUMERIC(10, 2),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
