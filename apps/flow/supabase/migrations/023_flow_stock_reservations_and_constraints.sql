-- ==============================================================================
-- TEKNIX — MIGRATION 023: INFRAESTRUTURA MULTICANAL, CONSTRAINTS, RESERVAS & RLS
-- ==============================================================================
-- 1. Criação da Tabela de Reservas de Estoque com TTL (stock_reservations)
-- 2. Constraints de integridade física (stock >= 0, reserved_stock >= 0)
-- 3. Índices de performance e unicidade (channel + external_id)
-- 4. Funções RPC atômicas para baixa e devolução de estoque central
-- 5. Função de expiração automática de reservas de checkout / Pix
-- 6. Proteção rigorosa de RPCs: REVOKE EXECUTE para anon e authenticated
-- 7. RLS na tabela de reservas com permissão estrita para equipe/staff
-- ==============================================================================

-- 1. TABELA DE RESERVAS DE ESTOQUE (TTL CHECKOUT)
CREATE TABLE IF NOT EXISTS public.stock_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'site',
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  status TEXT NOT NULL DEFAULT 'RESERVED' CHECK (status IN ('RESERVED', 'CONFIRMED', 'RELEASED', 'EXPIRED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CONSTRAINTS DE INTEGRIDADE FÍSICA NO PRODUTO
DO $$
BEGIN
  -- Garantir que stock central nunca seja negativo
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_stock_non_negative'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_stock_non_negative CHECK (stock >= 0);
  END IF;

  -- Garantir que reserved_stock nunca seja negativo
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_reserved_stock_non_negative'
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT products_reserved_stock_non_negative CHECK (reserved_stock >= 0);
  END IF;
END $$;

-- 3. ÍNDICES DE PERFORMANCE E UNICIDADE
-- Impedir duplicidade de anúncio no mesmo canal com mesmo external_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_listings_channel_external 
  ON public.marketplace_listings(channel, external_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_catalog_product_id 
  ON public.marketplace_listings(catalog_product_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_listings_product_id 
  ON public.marketplace_listings(product_id);

CREATE INDEX IF NOT EXISTS idx_products_is_site_published 
  ON public.products(is_site_published);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_expires_status 
  ON public.stock_reservations(status, expires_at);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_order_id 
  ON public.stock_reservations(order_id);

-- 4. FUNÇÃO RPC TRANSACIONAL DE BAIXA ATÔMICA DE ESTOQUE
CREATE OR REPLACE FUNCTION public.deduct_central_stock_atomic(
  p_product_id UUID,
  p_quantity INT,
  p_order_id TEXT,
  p_channel TEXT,
  p_listing_external_id TEXT DEFAULT NULL,
  p_unit_price NUMERIC DEFAULT 0,
  p_customer_name TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_stock INT;
  v_new_stock INT;
  v_already_processed BOOLEAN;
  v_is_uuid BOOLEAN;
BEGIN
  IF p_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_QUANTITY');
  END IF;

  -- 1. Idempotência por pedido
  SELECT EXISTS(
    SELECT 1 FROM inventory_movements
    WHERE product_id = p_product_id AND type = 'VENDA' AND notes ILIKE '%[ORDER:' || p_order_id || ']%'
  ) INTO v_already_processed;

  IF v_already_processed THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true, 'message', 'Venda já processada anteriormente');
  END IF;

  -- 2. Decremento atômico com trava condicional (impede overselling em concorrência simultânea)
  UPDATE products
  SET stock = stock - p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id AND stock >= p_quantity
  RETURNING stock INTO v_new_stock;

  IF NOT FOUND THEN
    SELECT stock INTO v_current_stock FROM products WHERE id = p_product_id;
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INSUFFICIENT_STOCK',
      'current_stock', COALESCE(v_current_stock, 0),
      'requested_quantity', p_quantity
    );
  END IF;

  -- 3. Registra movimentação no livro-razão de auditoria
  v_is_uuid := (p_order_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

  INSERT INTO inventory_movements (
    product_id,
    type,
    quantity,
    reference_id,
    notes,
    created_at
  ) VALUES (
    p_product_id,
    'VENDA',
    -p_quantity,
    CASE WHEN v_is_uuid THEN p_order_id::UUID ELSE NULL END,
    CONCAT('[ORDER:', p_order_id, '] Venda via ', UPPER(p_channel), CASE WHEN p_listing_external_id IS NOT NULL THEN CONCAT(' (', p_listing_external_id, ')') ELSE '' END, ' — Preço: R$ ', ROUND(p_unit_price, 2)::TEXT, ' — Comprador: ', COALESCE(p_customer_name, 'Cliente')),
    NOW()
  );

  -- 4. Atualiza métricas do anúncio se aplicável
  IF p_listing_external_id IS NOT NULL THEN
    UPDATE marketplace_listings
    SET sold_quantity = COALESCE(sold_quantity, 0) + p_quantity,
        total_revenue = COALESCE(total_revenue, 0) + (p_quantity * p_unit_price),
        last_synced_at = NOW()
    WHERE external_id = p_listing_external_id OR external_listing_id = p_listing_external_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'new_stock', v_new_stock,
    'deducted', p_quantity
  );
END;
$$;

-- 5. FUNÇÃO RPC TRANSACIONAL DE DEVOLUÇÃO / CANCELAMENTO
CREATE OR REPLACE FUNCTION public.restore_central_stock_atomic(
  p_product_id UUID,
  p_quantity INT,
  p_order_id TEXT,
  p_channel TEXT,
  p_reason TEXT DEFAULT 'Cancelamento de Pedido'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_already_restored BOOLEAN;
  v_new_stock INT;
  v_is_uuid BOOLEAN;
BEGIN
  IF p_quantity <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INVALID_QUANTITY');
  END IF;

  -- 1. Idempotência do estorno (impede devolver duas vezes o mesmo pedido)
  SELECT EXISTS(
    SELECT 1 FROM inventory_movements
    WHERE product_id = p_product_id AND type = 'DEVOLUCAO' AND notes ILIKE '%[ORDER:' || p_order_id || ']%'
  ) INTO v_already_restored;

  IF v_already_restored THEN
    RETURN jsonb_build_object('success', true, 'duplicate', true, 'message', 'Estoque deste pedido já foi estornado anteriormente');
  END IF;

  -- 2. Incrementa estoque central
  UPDATE products
  SET stock = stock + p_quantity,
      updated_at = NOW()
  WHERE id = p_product_id
  RETURNING stock INTO v_new_stock;

  v_is_uuid := (p_order_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$');

  INSERT INTO inventory_movements (
    product_id,
    type,
    quantity,
    reference_id,
    notes,
    created_at
  ) VALUES (
    p_product_id,
    'DEVOLUCAO',
    p_quantity,
    CASE WHEN v_is_uuid THEN p_order_id::UUID ELSE NULL END,
    CONCAT('[ORDER:', p_order_id, '] Cancelamento/Estorno via ', UPPER(p_channel), ' — Motivo: ', p_reason),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'new_stock', v_new_stock,
    'restored', p_quantity
  );
END;
$$;

-- 6. FUNÇÃO PARA EXPIRAR RESERVAS AUTOMATICAMENTE (TTL PIX/CHECKOUT)
CREATE OR REPLACE FUNCTION public.cleanup_expired_stock_reservations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
  v_released_count INT := 0;
BEGIN
  FOR r IN
    SELECT id, product_id, order_id, quantity
    FROM stock_reservations
    WHERE status = 'RESERVED' AND expires_at < NOW()
  LOOP
    -- Reduz reserved_stock no produto central
    UPDATE products
    SET reserved_stock = GREATEST(0, COALESCE(reserved_stock, 0) - r.quantity),
        updated_at = NOW()
    WHERE id = r.product_id;

    -- Marca reserva como expirada
    UPDATE stock_reservations
    SET status = 'EXPIRED',
        updated_at = NOW()
    WHERE id = r.id;

    -- Registra auditoria
    INSERT INTO inventory_movements (
      product_id,
      type,
      quantity,
      notes,
      created_at
    ) VALUES (
      r.product_id,
      'LIBERACAO_RESERVA',
      r.quantity,
      CONCAT('[ORDER:', r.order_id, '] Reserva expirada automaticamente por TTL de checkout'),
      NOW()
    );

    v_released_count := v_released_count + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'expired_reservations_cleaned', v_released_count);
END;
$$;

-- 7. RLS — ROW LEVEL SECURITY NA TABELA DE RESERVAS
ALTER TABLE public.stock_reservations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "Staff manage stock reservations" ON public.stock_reservations;
  CREATE POLICY "Staff manage stock reservations" ON public.stock_reservations
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
          AND (profiles.role IN ('MASTER', 'ADMIN', 'OPERATOR', 'FLOW', 'HUB') OR profiles.is_master = true)
      )
    );
END $$;

-- 8. PROTEÇÃO RIGOROSA DAS RPCs: REVOGA EXECUTE DE PUBLIC, ANON E AUTHENTICATED
-- Garante que nenhum usuário malicioso possa chamar essas funções pelo PostgREST (/rest/v1/rpc)
REVOKE EXECUTE ON FUNCTION public.deduct_central_stock_atomic(UUID, INT, TEXT, TEXT, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_central_stock_atomic(UUID, INT, TEXT, TEXT, TEXT, NUMERIC, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.restore_central_stock_atomic(UUID, INT, TEXT, TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_central_stock_atomic(UUID, INT, TEXT, TEXT, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.cleanup_expired_stock_reservations() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_stock_reservations() TO service_role;
