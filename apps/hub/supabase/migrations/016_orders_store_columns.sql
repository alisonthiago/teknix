-- ============================================================
-- TEKNIX — Migration 016: store_orders — Pedidos da Loja Própria
--
-- OBJETIVO: Criar uma tabela SEPARADA para pedidos gerados pelo
--           SITE (loja própria TEKNIX), sem alterar a tabela
--           `orders` do FLOW (que pertence à operação de marketplaces).
--
-- REGRA ABSOLUTA: Zero ALTER TABLE na tabela orders do FLOW.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. TABELA PRINCIPAL: store_orders
--    Pedidos originados na Loja Própria TEKNIX (SITE)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_orders (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Referência
  order_number      TEXT NOT NULL UNIQUE,

  -- Cliente
  customer_id       UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name     TEXT,
  customer_email    TEXT,
  customer_phone    TEXT,
  customer_document TEXT,

  -- Valores
  subtotal          NUMERIC(10,2) NOT NULL DEFAULT 0,
  shipping_cost     NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount          NUMERIC(10,2) NOT NULL DEFAULT 0,
  total             NUMERIC(10,2) NOT NULL DEFAULT 0,

  -- Status
  status            TEXT NOT NULL DEFAULT 'pending',
  -- pending | processing | paid | shipped | delivered | cancelled | refunded

  -- Pagamento
  payment_method    TEXT,
  -- Mercado Pago - Pix | Mercado Pago - Cartão | Mercado Pago - Boleto
  payment_status    TEXT NOT NULL DEFAULT 'pending',
  -- pending | approved | rejected | cancelled | refunded
  payment_id        TEXT,
  -- ID do pagamento no Mercado Pago

  -- Entrega
  shipping_method   TEXT,
  delivery_address  TEXT,
  -- Endereço formatado completo

  -- Metadados
  origin            TEXT DEFAULT 'Loja Própria (SITE)',
  notes             TEXT,

  -- Timestamps
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.store_orders IS
  'Pedidos gerados pela Loja Própria TEKNIX (SITE). Separado da tabela orders do FLOW (marketplaces).';

-- ============================================================
-- 2. TABELA: store_order_items
--    Itens dos pedidos da Loja Própria
-- ============================================================
CREATE TABLE IF NOT EXISTS public.store_order_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id      UUID NOT NULL REFERENCES public.store_orders(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  sku           TEXT,
  quantity      INTEGER NOT NULL DEFAULT 1,
  price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  total         NUMERIC(10,2) NOT NULL DEFAULT 0
);

COMMENT ON TABLE public.store_order_items IS
  'Itens dos pedidos da Loja Própria TEKNIX. Referencia store_orders.';

-- ============================================================
-- 3. TRIGGER: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION public.fn_update_store_orders_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_store_orders_updated_at ON public.store_orders;
CREATE TRIGGER trg_store_orders_updated_at
  BEFORE UPDATE ON public.store_orders
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_store_orders_updated_at();

-- ============================================================
-- 4. ÍNDICES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_store_orders_customer_id   ON public.store_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_user_id       ON public.store_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_store_orders_status        ON public.store_orders(status);
CREATE INDEX IF NOT EXISTS idx_store_orders_payment_status ON public.store_orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_store_orders_created_at    ON public.store_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_store_order_items_order_id ON public.store_order_items(order_id);

-- ============================================================
-- 5. RLS (Row Level Security)
-- ============================================================
ALTER TABLE public.store_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_order_items ENABLE ROW LEVEL SECURITY;

-- Admins do HUB podem tudo
DROP POLICY IF EXISTS "hub_admin_store_orders" ON public.store_orders;
CREATE POLICY "hub_admin_store_orders"
  ON public.store_orders FOR ALL
  USING (public.fn_is_hub_admin());

DROP POLICY IF EXISTS "hub_admin_store_order_items" ON public.store_order_items;
CREATE POLICY "hub_admin_store_order_items"
  ON public.store_order_items FOR ALL
  USING (public.fn_is_hub_admin());

-- Clientes autenticados podem ver seus próprios pedidos
DROP POLICY IF EXISTS "customer_view_own_orders" ON public.store_orders;
CREATE POLICY "customer_view_own_orders"
  ON public.store_orders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "customer_view_own_order_items" ON public.store_order_items;
CREATE POLICY "customer_view_own_order_items"
  ON public.store_order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.store_orders so
      WHERE so.id = store_order_items.order_id
        AND so.user_id = auth.uid()
    )
  );

-- Anon e autenticado podem INSERIR pedidos (checkout público)
DROP POLICY IF EXISTS "public_insert_store_orders" ON public.store_orders;
CREATE POLICY "public_insert_store_orders"
  ON public.store_orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "public_insert_store_order_items" ON public.store_order_items;
CREATE POLICY "public_insert_store_order_items"
  ON public.store_order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Update de payment_status e status (webhook do Mercado Pago via service role)
DROP POLICY IF EXISTS "service_update_store_orders" ON public.store_orders;
CREATE POLICY "service_update_store_orders"
  ON public.store_orders FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

COMMIT;
