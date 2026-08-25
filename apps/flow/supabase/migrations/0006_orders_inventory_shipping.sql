-- 0006_orders_inventory_shipping.sql
-- Orders, Inventory Movements, Shipments, Status History

-- 1. Orders (pedidos)
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  marketplace_id UUID REFERENCES marketplaces(id),
  order_number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'NOVO',
  -- NOVO, PAGO, AGUARDANDO_SEPARACAO, EM_SEPARACAO, SEPARADO, AGUARDANDO_EXPEDICAO, EMBALADO, ENVIADO, ENTREGUE, CANCELADO, DEVOLVIDO, PROBLEMA
  total_amount NUMERIC(10, 2) DEFAULT 0,
  total_cost NUMERIC(10, 2) DEFAULT 0,
  total_fees NUMERIC(10, 2) DEFAULT 0,
  total_freight NUMERIC(10, 2) DEFAULT 0,
  total_taxes NUMERIC(10, 2) DEFAULT 0,
  profit NUMERIC(10, 2) DEFAULT 0,
  margin NUMERIC(10, 2) DEFAULT 0,
  notes TEXT,
  tracking_code TEXT,
  carrier TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 2. Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  fees NUMERIC(10, 2) NOT NULL DEFAULT 0,
  freight NUMERIC(10, 2) NOT NULL DEFAULT 0,
  taxes NUMERIC(10, 2) NOT NULL DEFAULT 0,
  profit NUMERIC(10, 2) NOT NULL DEFAULT 0,
  margin NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDENTE'
);

-- 3. Order Status History
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Inventory Movements (movimentações de estoque)
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  type TEXT NOT NULL,
  -- PURCHASE, SALE, ADJUSTMENT, RETURN, LOSS, TRANSFER, PICKING, SHIPPING
  quantity INTEGER NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  -- purchase, sale, order, shipment
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Shipments (expedição)
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  carrier TEXT,
  tracking_code TEXT,
  label_url TEXT,
  status TEXT NOT NULL DEFAULT 'PREPARANDO',
  -- PREPARANDO, EMBALADO, ETIQUETA, ENVIADO, ENTREGUE, PROBLEMA
  weight NUMERIC(8, 2),
  width NUMERIC(8, 2),
  height NUMERIC(8, 2),
  length NUMERIC(8, 2),
  notes TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_marketplace_id ON orders(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(type);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

-- RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage orders" ON orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage order_items" ON order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage order_status_history" ON order_status_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage inventory_movements" ON inventory_movements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage shipments" ON shipments FOR ALL USING (auth.role() = 'authenticated');
