import { createClient } from '@supabase/supabase-js'
import { Client } from 'pg'

type VercelRequest = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: unknown
}

type VercelResponse = {
  status(code: number): VercelResponse
  json(body: unknown): VercelResponse
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pgUrl = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || process.env.DATABASE_URL

  const statements = [
    `ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS fiscal_preference TEXT DEFAULT 'nfe'`,
    `ALTER TABLE public.store_orders ADD COLUMN IF NOT EXISTS fiscal_status TEXT DEFAULT 'nao_emitida'`,
    `CREATE TABLE IF NOT EXISTS public.store_invoices (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES public.store_orders(id) ON DELETE SET NULL,
      order_number TEXT,
      customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
      customer_name TEXT,
      customer_document TEXT,
      reference TEXT NOT NULL UNIQUE,
      numero TEXT,
      serie TEXT DEFAULT '1',
      chave TEXT,
      protocolo TEXT,
      status TEXT NOT NULL DEFAULT 'nao_emitida',
      ambiente TEXT NOT NULL DEFAULT 'homologacao',
      valor NUMERIC(10,2) NOT NULL DEFAULT 0,
      xml_url TEXT,
      danfe_url TEXT,
      rejection_code TEXT,
      rejection_message TEXT,
      cancellation_reason TEXT,
      issued_at TIMESTAMPTZ,
      cancelled_at TIMESTAMPTZ,
      raw_payload JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS public.store_receipts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
      order_number TEXT NOT NULL,
      receipt_number TEXT NOT NULL UNIQUE,
      customer_name TEXT,
      customer_document TEXT,
      status TEXT NOT NULL DEFAULT 'gerado',
      total NUMERIC(10,2) NOT NULL DEFAULT 0,
      payment_method TEXT,
      file_url TEXT,
      generated_by TEXT DEFAULT 'admin',
      notes TEXT,
      generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS public.fiscal_audit_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID REFERENCES public.store_orders(id) ON DELETE CASCADE,
      invoice_id UUID REFERENCES public.store_invoices(id) ON DELETE CASCADE,
      action TEXT NOT NULL,
      actor TEXT DEFAULT 'sistema',
      details JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `CREATE TABLE IF NOT EXISTS public.store_fiscal_settings (
      id TEXT PRIMARY KEY DEFAULT 'default',
      razao_social TEXT NOT NULL DEFAULT 'ALYSON THIAGO LOURENCO DA SILVA 41728401836',
      nome_fantasia TEXT DEFAULT 'TEKNIX',
      cnpj TEXT NOT NULL DEFAULT '38068360000106',
      inscricao_estadual TEXT,
      regime_tributario TEXT NOT NULL DEFAULT '1',
      ambiente_padrao TEXT NOT NULL DEFAULT 'homologacao',
      serie_nfe TEXT NOT NULL DEFAULT '1',
      proximo_numero_nfe INTEGER NOT NULL DEFAULT 1,
      emissao_automatica BOOLEAN NOT NULL DEFAULT FALSE,
      emissao_apos_status TEXT NOT NULL DEFAULT 'paid',
      endereco_logradouro TEXT,
      endereco_numero TEXT,
      endereco_bairro TEXT,
      endereco_municipio TEXT DEFAULT 'São Paulo',
      endereco_uf TEXT DEFAULT 'SP',
      endereco_cep TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`,
    `INSERT INTO public.store_fiscal_settings (id, razao_social, nome_fantasia, cnpj, ambiente_padrao, serie_nfe, emissao_automatica)
     VALUES ('default', 'ALYSON THIAGO LOURENCO DA SILVA 41728401836', 'TEKNIX', '38068360000106', 'homologacao', '1', FALSE)
     ON CONFLICT (id) DO NOTHING`,
    `CREATE INDEX IF NOT EXISTS idx_store_invoices_order_id ON public.store_invoices(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_store_invoices_status ON public.store_invoices(status)`,
    `CREATE INDEX IF NOT EXISTS idx_store_invoices_reference ON public.store_invoices(reference)`,
    `CREATE INDEX IF NOT EXISTS idx_store_invoices_created_at ON public.store_invoices(created_at DESC)`,
    `CREATE INDEX IF NOT EXISTS idx_store_receipts_order_id ON public.store_receipts(order_id)`,
    `CREATE INDEX IF NOT EXISTS idx_fiscal_audit_order_id ON public.fiscal_audit_events(order_id)`,
    `ALTER TABLE public.store_invoices ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE public.store_receipts ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE public.fiscal_audit_events ENABLE ROW LEVEL SECURITY`,
    `ALTER TABLE public.store_fiscal_settings ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_invoices' AND policyname='hub_admin_store_invoices') THEN
        CREATE POLICY "hub_admin_store_invoices" ON public.store_invoices FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_receipts' AND policyname='hub_admin_store_receipts') THEN
        CREATE POLICY "hub_admin_store_receipts" ON public.store_receipts FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='fiscal_audit_events' AND policyname='hub_admin_fiscal_audit') THEN
        CREATE POLICY "hub_admin_fiscal_audit" ON public.fiscal_audit_events FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='store_fiscal_settings' AND policyname='hub_admin_store_fiscal_settings') THEN
        CREATE POLICY "hub_admin_store_fiscal_settings" ON public.store_fiscal_settings FOR ALL USING (true) WITH CHECK (true);
      END IF;
    END $$`
  ]

  const results: Array<{ sql: string; ok: boolean; error?: string }> = []

  if (pgUrl) {
    const client = new Client({
      connectionString: pgUrl,
      ssl: { rejectUnauthorized: false }
    })
    try {
      await client.connect()
      for (const sql of statements) {
        try {
          await client.query(sql)
          results.push({ sql: sql.slice(0, 50), ok: true })
        } catch (e: any) {
          if (e.message?.includes('already exists') || e.message?.includes('duplicate')) {
            results.push({ sql: sql.slice(0, 50), ok: true })
          } else {
            results.push({ sql: sql.slice(0, 50), ok: false, error: e.message })
          }
        }
      }
      await client.end()
      return res.status(200).json({ ok: true, runner: 'pg', results, timestamp: new Date().toISOString() })
    } catch (connErr: any) {
      console.error('PG connect error:', connErr.message)
      return res.status(200).json({ ok: false, runner: 'pg_failed', pgUrlPresent: !!pgUrl, pgError: connErr.message, timestamp: new Date().toISOString() })
    }
  } else {
    return res.status(200).json({ ok: false, runner: 'no_pg_url', timestamp: new Date().toISOString() })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return res.status(500).json({ error: 'Supabase credentials missing and PG connection failed' })
  }

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
  for (const sql of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql_migration', { sql_text: sql })
      if (error && !error.message.includes('already exists') && !error.message.includes('duplicate')) {
        results.push({ sql: sql.slice(0, 50), ok: false, error: error.message })
      } else {
        results.push({ sql: sql.slice(0, 50), ok: true })
      }
    } catch (e: any) {
      results.push({ sql: sql.slice(0, 50), ok: false, error: e.message })
    }
  }

  return res.status(200).json({ ok: true, runner: 'rpc', results, timestamp: new Date().toISOString() })
}
