-- ================================================================
-- TEKNIX — TABELAS FALTANTES
-- Cole no SQL Editor: https://supabase.com/dashboard/project/ykgprfzfnffooqmfbeox/sql/new
-- ================================================================

-- ============================================================
-- 1. CORRIGIR photo_url → avatar_url no layout
-- (adicionar coluna avatar_url se não existir, manter photo_url como alias)
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_url TEXT;
-- Sincronizar os dois campos
UPDATE profiles SET avatar_url = photo_url WHERE avatar_url IS NULL AND photo_url IS NOT NULL;
UPDATE profiles SET photo_url = avatar_url WHERE photo_url IS NULL AND avatar_url IS NOT NULL;

-- ============================================================
-- 2. TABELA DE CLIENTES (customers)
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  notes TEXT,
  total_orders INTEGER DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_customers" ON customers FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 3. TABELA DE PEDIDOS (orders)
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  marketplace_id UUID REFERENCES marketplaces(id),
  customer_id UUID REFERENCES customers(id),
  order_number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'NOVO',
  total_amount NUMERIC(10,2) DEFAULT 0,
  total_cost NUMERIC(10,2) DEFAULT 0,
  total_fees NUMERIC(10,2) DEFAULT 0,
  total_freight NUMERIC(10,2) DEFAULT 0,
  total_taxes NUMERIC(10,2) DEFAULT 0,
  profit NUMERIC(10,2) DEFAULT 0,
  margin NUMERIC(10,2) DEFAULT 0,
  notes TEXT,
  tracking_code TEXT,
  carrier TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_orders" ON orders FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 4. ITENS DO PEDIDO (order_items)
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  unit_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
  fees NUMERIC(10,2) NOT NULL DEFAULT 0,
  freight NUMERIC(10,2) NOT NULL DEFAULT 0,
  taxes NUMERIC(10,2) NOT NULL DEFAULT 0,
  profit NUMERIC(10,2) NOT NULL DEFAULT 0,
  margin NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDENTE'
);
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_order_items" ON order_items FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 5. HISTÓRICO DE STATUS DO PEDIDO
-- ============================================================
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_order_status_history" ON order_status_history FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 6. EXPEDIÇÕES (shipments)
-- ============================================================
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  carrier TEXT,
  tracking_code TEXT,
  label_url TEXT,
  status TEXT NOT NULL DEFAULT 'PREPARANDO',
  weight NUMERIC(8,2),
  width NUMERIC(8,2),
  height NUMERIC(8,2),
  length NUMERIC(8,2),
  notes TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_shipments_updated_at ON shipments;
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN CREATE POLICY "auth_shipments" ON shipments FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 7. CHAT — CONVERSAS (conversations)
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 UUID NOT NULL REFERENCES auth.users(id),
  participant_2 UUID NOT NULL REFERENCES auth.users(id),
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count_1 INTEGER DEFAULT 0,
  unread_count_2 INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(participant_1, participant_2)
);
DROP TRIGGER IF EXISTS update_conversations_updated_at ON conversations;
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "auth_conversations" ON conversations FOR ALL
  USING (auth.uid() = participant_1 OR auth.uid() = participant_2);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 8. CHAT — MENSAGENS (messages)
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "auth_messages" ON messages FOR ALL
  USING (
    auth.uid() = sender_id OR
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 9. PRESENÇA ONLINE (presence)
-- ============================================================
CREATE TABLE IF NOT EXISTS presence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) UNIQUE,
  status TEXT NOT NULL DEFAULT 'offline',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_presence_updated_at ON presence;
CREATE TRIGGER update_presence_updated_at BEFORE UPDATE ON presence FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
ALTER TABLE presence ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "auth_presence_read" ON presence FOR SELECT USING (auth.role()='authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "auth_presence_write" ON presence FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 10. ÍNDICES para performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_marketplace_id ON orders(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_presence_user_id ON presence(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);

-- ============================================================
-- 11. ADICIONAR permissions que faltam para os novos módulos
-- ============================================================
INSERT INTO permissions (code, module, description) VALUES
  ('orders.financial_view','Pedidos','Ver financeiro de pedidos'),
  ('customers.view','Clientes','Visualizar clientes'),
  ('customers.create','Clientes','Criar clientes'),
  ('customers.edit','Clientes','Editar clientes'),
  ('customers.delete','Clientes','Excluir clientes'),
  ('chat.use','Chat','Usar o chat'),
  ('shipping.print_label','Expedição','Imprimir etiquetas')
ON CONFLICT (code) DO NOTHING;

-- MASTER e ADMIN recebem as novas permissões também
INSERT INTO role_permissions (role, permission_code)
SELECT 'MASTER', code FROM permissions
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_code)
SELECT 'ADMIN', code FROM permissions
ON CONFLICT DO NOTHING;

-- Dar novas permissões ao Alison (MASTER)
INSERT INTO user_permissions (user_id, permission_code, granted)
SELECT '3af9068a-4b78-4c9c-8657-f83b93c01588', code, true FROM permissions
ON CONFLICT (user_id, permission_code) DO UPDATE SET granted=true;

-- ============================================================
-- ✅ VERIFICAÇÃO FINAL
-- ============================================================
SELECT 'orders' as tabela, count(*) as registros FROM orders
UNION ALL SELECT 'customers', count(*) FROM customers
UNION ALL SELECT 'conversations', count(*) FROM conversations
UNION ALL SELECT 'messages', count(*) FROM messages
UNION ALL SELECT 'presence', count(*) FROM presence
UNION ALL SELECT 'shipments', count(*) FROM shipments
UNION ALL SELECT 'order_items', count(*) FROM order_items
UNION ALL SELECT 'user_permissions (Alison)', count(*) FROM user_permissions WHERE user_id='3af9068a-4b78-4c9c-8657-f83b93c01588';
