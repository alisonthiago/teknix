-- ==============================================================================
-- TEKNIX — MIGRATION 024: ZERO DUPLICATAS — CONSTRAINTS E ÍNDICES DE UNICIDADE
-- ==============================================================================
-- Esta migration:
-- 1. Limpa com segurança quaisquer registros duplicados históricos acumulados;
-- 2. Cria restrições físicas UNIQUE (UNIQUE CONSTRAINTS) no PostgreSQL;
-- 3. Impede matematicamente qualquer duplicação futura em orders, order_items,
--    sales e sale_items em todo o ecossistema (FLOW, HUB, SITE, APIs e Webhooks).
-- ==============================================================================

-- ==============================================================================
-- FASE 1: EXPURGO SEGURO DE REGISTROS DUPLICADOS HISTÓRICOS
-- ==============================================================================

-- 1.1 Limpar itens duplicados de pedidos (mantendo apenas o primeiro registro)
WITH duplicate_order_items AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY order_id, COALESCE(sku, product_id::text)
           ORDER BY id ASC
         ) as row_num
  FROM public.order_items
  WHERE order_id IS NOT NULL
)
DELETE FROM public.order_items
WHERE id IN (
  SELECT id FROM duplicate_order_items WHERE row_num > 1
);

-- 1.2 Limpar pedidos duplicados (se houver múltiplos pedidos com mesmo order_number)
WITH duplicate_orders AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY order_number 
           ORDER BY created_at ASC, id ASC
         ) as row_num
  FROM public.orders
  WHERE order_number IS NOT NULL AND order_number <> ''
)
DELETE FROM public.orders
WHERE id IN (
  SELECT id FROM duplicate_orders WHERE row_num > 1
);

-- 1.3 Limpar itens de venda duplicados (mantendo apenas o primeiro registro)
WITH duplicate_sale_items AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY sale_id, COALESCE(product_id::text, sku)
           ORDER BY id ASC
         ) as row_num
  FROM public.sale_items
  WHERE sale_id IS NOT NULL
)
DELETE FROM public.sale_items
WHERE id IN (
  SELECT id FROM duplicate_sale_items WHERE row_num > 1
);

-- 1.4 Limpar vendas duplicadas com o mesmo order_id
WITH duplicate_sales AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY order_id 
           ORDER BY created_at ASC, id ASC
         ) as row_num
  FROM public.sales
  WHERE order_id IS NOT NULL AND order_id <> ''
)
DELETE FROM public.sales
WHERE id IN (
  SELECT id FROM duplicate_sales WHERE row_num > 1
);

-- ==============================================================================
-- FASE 2: BLINDAGEM DE CONSTRAINTS DE UNICIDADE (UNIQUE)
-- ==============================================================================

-- 2.1 Constraint Única em orders: Garante que order_number nunca seja duplicado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_orders_order_number'
  ) THEN
    ALTER TABLE public.orders 
      ADD CONSTRAINT uq_orders_order_number UNIQUE (order_number);
  END IF;
END $$;

-- 2.2 Constraint Única em order_items: Garante que (order_id, sku) nunca seja duplicado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_order_items_order_sku'
  ) THEN
    ALTER TABLE public.order_items 
      ADD CONSTRAINT uq_order_items_order_sku UNIQUE (order_id, sku);
  END IF;
END $$;

-- 2.3 Constraint Única em sales: Garante que order_id nunca seja duplicado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_sales_order_id'
  ) THEN
    ALTER TABLE public.sales 
      ADD CONSTRAINT uq_sales_order_id UNIQUE (order_id);
  END IF;
END $$;

-- 2.4 Constraint Única em sale_items: Garante que (sale_id, product_id) nunca seja duplicado
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'uq_sale_items_sale_product'
  ) THEN
    ALTER TABLE public.sale_items 
      ADD CONSTRAINT uq_sale_items_sale_product UNIQUE (sale_id, product_id);
  END IF;
END $$;

-- ==============================================================================
-- FASE 3: ÍNDICES DE ALTA PERFORMANCE PARA BUSCAS DE PEDIDOS E ITENS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sku ON public.order_items(sku);
CREATE INDEX IF NOT EXISTS idx_sales_order_id ON public.sales(order_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON public.sale_items(sale_id);

COMMENT ON CONSTRAINT uq_orders_order_number ON public.orders IS 'Impede duplicidade de pedidos no banco de dados';
COMMENT ON CONSTRAINT uq_order_items_order_sku ON public.order_items IS 'Impede duplicidade de itens com mesmo SKU no mesmo pedido';
COMMENT ON CONSTRAINT uq_sales_order_id ON public.sales IS 'Impede duplicidade de vendas para o mesmo pedido';
COMMENT ON CONSTRAINT uq_sale_items_sale_product ON public.sale_items IS 'Impede duplicidade de itens na mesma venda';
