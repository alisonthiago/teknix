-- ============================================================
-- TEKNIX — Migration 021: Módulo Fiscal Completo da Loja Própria (HUB)
--
-- OBJETIVO: Criar tabelas dedicadas para Notas Fiscais (NF-e),
--           Recibos Comerciais e Auditoria Fiscal da Loja Própria (HUB),
--           mantendo isolamento absoluto do FLOW (marketplaces).
--
-- REGRA ABSOLUTA: Zero alteração destrutiva em tabelas existentes.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. EXTENSÃO DA TABELA store_orders COM PREFERÊNCIA FISCAL
-- ============================================================
ALTER TABLE public.store_orders
  ADD COLUMN IF NOT EXISTS fiscal_preference TEXT DEFAULT 'nfe',
  ADD COLUMN IF NOT EXISTS fiscal_status     TEXT DEFAULT 'nao_emitida';

COMMENT ON COLUMN public.store_orders.fiscal_preference IS
  'Preferência de documento do pedido: none | receipt | nfe | both';
COMMENT ON COLUMN public.store_orders.fiscal_status IS
  'Status fiscal consolidado: nao_emitida | aguardando | processando | autorizada | rejeitada | cancelada | dados_incompletos | recibo_apenas';

-- ============================================================
-- 2. TABELA PRINCIPAL: store_invoices (Notas Fiscais da Loja)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_invoices (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID REFERENCES public.store_orders(id) ON DELETE SET NULL,
  order_number        TEXT,
  customer_id         UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name       TEXT,
  customer_document   TEXT,
  
  -- Identificação e SEFAZ
  reference           TEXT NOT NULL UNIQUE,
  numero              TEXT,
  serie               TEXT DEFAULT '1',
  chave               TEXT,
  protocolo           TEXT,
  
  -- Status e Ambiente
  status              TEXT NOT NULL DEFAULT 'nao_emitida',
  -- nao_emitida | aguardando | processando | autorizada | rejeitada | cancelada | erro | dados_incompletos
  ambiente            TEXT NOT NULL DEFAULT 'homologacao',
  -- homologacao | producao
  
  -- Valores e Documentos
  valor               NUMERIC(10,2) NOT NULL DEFAULT 0,
  xml_url             TEXT,
  danfe_url           TEXT,
  
  -- Rejeição / Erro / Cancelamento
  rejection_code      TEXT,
  rejection_message   TEXT,
  cancellation_reason TEXT,
  
  -- Timestamps
  issued_at           TIMESTAMPTZ,
  cancelled_at        TIMESTAMPTZ,
  raw_payload         JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.store_invoices IS
  'Notas Fiscais eletrônicas (NF-e) emitidas para pedidos da Loja Própria TEKNIX (SITE/HUB).';

-- Trigger de updated_at para store_invoices
CREATE OR REPLACE FUNCTION public.fn_update_store_invoices_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_store_invoices_updated_at ON public.store_invoices;
CREATE TRIGGER trg_store_invoices_updated_at
  BEFORE UPDATE ON public.store_invoices
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_store_invoices_updated_at();

-- ============================================================
-- 3. TABELA: store_receipts (Recibos / Comprovantes de Compra)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_receipts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  order_number      TEXT NOT NULL,
  receipt_number    TEXT NOT NULL UNIQUE,
  customer_name     TEXT,
  customer_document TEXT,
  status            TEXT NOT NULL DEFAULT 'gerado',
  -- gerado | cancelado
  total             NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method    TEXT,
  file_url          TEXT,
  generated_by      TEXT DEFAULT 'admin',
  notes             TEXT,
  generated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.store_receipts IS
  'Recibos e comprovantes comerciais gerados para pedidos da Loja Própria TEKNIX.';

-- ============================================================
-- 4. TABELA: fiscal_audit_events (Auditoria e Histórico Fiscal)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.fiscal_audit_events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id    UUID REFERENCES public.store_orders(id) ON DELETE CASCADE,
  invoice_id  UUID REFERENCES public.store_invoices(id) ON DELETE CASCADE,
  action      TEXT NOT NULL,
  -- solicitada | enviada | autorizada | rejeitada | reprocessada | cancelada | recibo_gerado | enviado_cliente
  actor       TEXT DEFAULT 'sistema',
  details     JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.fiscal_audit_events IS
  'Trilha de auditoria de todos os eventos fiscais e geração de recibos da TEKNIX.';

-- ============================================================
-- 5. TABELA: store_fiscal_settings (Configurações Fiscais da Empresa)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_fiscal_settings (
  id                        TEXT PRIMARY KEY DEFAULT 'default',
  razao_social              TEXT NOT NULL DEFAULT 'ALYSON THIAGO LOURENCO DA SILVA 41728401836',
  nome_fantasia             TEXT DEFAULT 'TEKNIX',
  cnpj                      TEXT NOT NULL DEFAULT '38068360000106',
  inscricao_estadual        TEXT,
  regime_tributario         TEXT NOT NULL DEFAULT '1', -- 1 = Simples Nacional, 3 = Regime Normal
  ambiente_padrao           TEXT NOT NULL DEFAULT 'homologacao', -- homologacao | producao
  serie_nfe                 TEXT NOT NULL DEFAULT '1',
  proximo_numero_nfe        INTEGER NOT NULL DEFAULT 1,
  emissao_automatica        BOOLEAN NOT NULL DEFAULT FALSE, -- Inicia MANUAL por segurança
  emissao_apos_status       TEXT NOT NULL DEFAULT 'paid',
  endereco_logradouro       TEXT,
  endereco_numero           TEXT,
  endereco_bairro           TEXT,
  endereco_municipio        TEXT DEFAULT 'São Paulo',
  endereco_uf               TEXT DEFAULT 'SP',
  endereco_cep              TEXT,
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.store_fiscal_settings (id, razao_social, nome_fantasia, cnpj, ambiente_padrao, serie_nfe, emissao_automatica)
VALUES ('default', 'ALYSON THIAGO LOURENCO DA SILVA 41728401836', 'TEKNIX', '38068360000106', 'homologacao', '1', FALSE)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. ÍNDICES DE PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_store_invoices_order_id     ON public.store_invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_store_invoices_status       ON public.store_invoices(status);
CREATE INDEX IF NOT EXISTS idx_store_invoices_reference    ON public.store_invoices(reference);
CREATE INDEX IF NOT EXISTS idx_store_invoices_created_at   ON public.store_invoices(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_receipts_order_id     ON public.store_receipts(order_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_audit_order_id       ON public.fiscal_audit_events(order_id);
CREATE INDEX IF NOT EXISTS idx_fiscal_audit_invoice_id     ON public.fiscal_audit_events(invoice_id);

-- ============================================================
-- 7. RLS (Row Level Security)
-- ============================================================
ALTER TABLE public.store_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_fiscal_settings ENABLE ROW LEVEL SECURITY;

-- Admins do HUB: acesso irrestrito
DROP POLICY IF EXISTS "hub_admin_store_invoices" ON public.store_invoices;
CREATE POLICY "hub_admin_store_invoices"
  ON public.store_invoices FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "hub_admin_store_receipts" ON public.store_receipts;
CREATE POLICY "hub_admin_store_receipts"
  ON public.store_receipts FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "hub_admin_fiscal_audit" ON public.fiscal_audit_events;
CREATE POLICY "hub_admin_fiscal_audit"
  ON public.fiscal_audit_events FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "hub_admin_store_fiscal_settings" ON public.store_fiscal_settings;
CREATE POLICY "hub_admin_store_fiscal_settings"
  ON public.store_fiscal_settings FOR ALL
  USING (true)
  WITH CHECK (true);

COMMIT;
