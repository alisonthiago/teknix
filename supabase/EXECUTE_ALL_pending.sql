-- TEKNIX - SQL COMPLETO (tudo junto)
-- Cole no Supabase Dashboard → SQL Editor → Run

-- ============================================================
-- PARTE 1: Tabelas RBAC
-- ============================================================

CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission_code TEXT NOT NULL REFERENCES permissions(code),
  UNIQUE(role, permission_code)
);

CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL REFERENCES permissions(code),
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(user_id, permission_code)
);

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read permissions" ON permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage role_permissions" ON role_permissions
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Admins can manage user_permissions" ON user_permissions
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Authenticated can read role_permissions" ON role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can read own user_permissions" ON user_permissions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- PARTE 2: Tabelas Orders, Inventory, Shipments
-- ============================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  marketplace_id UUID REFERENCES marketplaces(id),
  order_number TEXT NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  status TEXT NOT NULL DEFAULT 'NOVO',
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

CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  order_id UUID NOT NULL REFERENCES orders(id),
  carrier TEXT,
  tracking_code TEXT,
  label_url TEXT,
  status TEXT NOT NULL DEFAULT 'PREPARANDO',
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

CREATE TABLE IF NOT EXISTS public.marketplace_fee_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id UUID NOT NULL REFERENCES public.marketplaces(id) ON DELETE CASCADE,
    fee_percentage NUMERIC(10,2) NOT NULL DEFAULT 0,
    fixed_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
    shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 0,
    tax_percentage NUMERIC(10,2) NOT NULL DEFAULT 0,
    advertising_percentage NUMERIC(10,2) NOT NULL DEFAULT 0,
    other_cost_percentage NUMERIC(10,2) NOT NULL DEFAULT 0,
    effective_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    effective_until TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE TRIGGER update_marketplace_fee_rules_updated_at BEFORE UPDATE ON public.marketplace_fee_rules FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TABLE IF NOT EXISTS public.marketplace_fee_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id UUID NOT NULL REFERENCES public.marketplaces(id) ON DELETE CASCADE,
    listing_id UUID REFERENCES public.marketplace_listings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id),
    old_fee_percentage NUMERIC(10,2),
    new_fee_percentage NUMERIC(10,2),
    old_fixed_fee NUMERIC(10,2),
    new_fixed_fee NUMERIC(10,2),
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_marketplace_id ON orders(marketplace_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(type);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_fee_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_fee_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can manage orders" ON orders FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage order_items" ON order_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage order_status_history" ON order_status_history FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage inventory_movements" ON inventory_movements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage shipments" ON shipments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Enable ALL for authenticated on marketplace_fee_rules" ON public.marketplace_fee_rules FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable ALL for authenticated on marketplace_fee_history" ON public.marketplace_fee_history FOR ALL TO authenticated USING (true);

-- ============================================================
-- PARTE 3: Seeds (permissions + role_permissions)
-- ============================================================

INSERT INTO permissions (code, module, description) VALUES
  ('products.view',   'Produtos',   'Visualizar produtos'),
  ('products.create', 'Produtos',   'Criar produtos'),
  ('products.edit',   'Produtos',   'Editar produtos'),
  ('products.delete', 'Produtos',   'Excluir produtos'),
  ('sales.view',   'Vendas',   'Visualizar vendas'),
  ('sales.create', 'Vendas',   'Criar vendas'),
  ('sales.edit',   'Vendas',   'Editar vendas'),
  ('sales.delete', 'Vendas',   'Excluir vendas'),
  ('orders.view',   'Pedidos',   'Visualizar pedidos'),
  ('orders.manage', 'Pedidos',   'Gerenciar pedidos'),
  ('picking.view',    'Separação',   'Visualizar separação'),
  ('picking.execute', 'Separação',   'Executar separação'),
  ('shipping.view',    'Expedição',   'Visualizar expedição'),
  ('shipping.execute', 'Expedição',   'Executar expedição'),
  ('inventory.view',    'Estoque',   'Visualizar estoque'),
  ('inventory.create',  'Estoque',   'Registrar entrada/saída'),
  ('inventory.adjust',  'Estoque',   'Ajustar estoque'),
  ('finance.view',      'Financeiro',   'Visualizar dados financeiros'),
  ('revenue.view',      'Faturamento',  'Visualizar faturamento'),
  ('cost.view',         'Custos',       'Visualizar custos'),
  ('profit.view',       'Lucro',        'Visualizar lucro'),
  ('margin.view',       'Margem',       'Visualizar margem'),
  ('reports.view',   'Relatórios',   'Visualizar relatórios'),
  ('reports.export', 'Relatórios',   'Exportar relatórios'),
  ('marketplaces.view',    'Marketplaces',   'Visualizar marketplaces'),
  ('marketplaces.manage',  'Marketplaces',   'Gerenciar marketplaces'),
  ('marketplaces.connect', 'Marketplaces',   'Conectar marketplaces'),
  ('settings.view',   'Configurações',   'Visualizar configurações'),
  ('settings.manage', 'Configurações',   'Gerenciar configurações'),
  ('users.view',             'Usuários',   'Visualizar usuários'),
  ('users.create',           'Usuários',   'Criar usuários'),
  ('users.edit',             'Usuários',   'Editar usuários'),
  ('users.delete',           'Usuários',   'Excluir usuários'),
  ('permissions.manage',     'Usuários',   'Gerenciar permissões'),
  ('imports.use', 'Importação', 'Usar importação'),
  ('exports.use', 'Exportação', 'Usar exportação'),
  ('notifications.view', 'Notificações', 'Visualizar notificações')
ON CONFLICT (code) DO NOTHING;

INSERT INTO role_permissions (role, permission_code)
SELECT 'ADMIN', code FROM permissions
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_code) VALUES
  ('GERENTE', 'products.view'), ('GERENTE', 'products.create'), ('GERENTE', 'products.edit'),
  ('GERENTE', 'sales.view'), ('GERENTE', 'sales.create'),
  ('GERENTE', 'orders.view'), ('GERENTE', 'orders.manage'),
  ('GERENTE', 'picking.view'), ('GERENTE', 'picking.execute'),
  ('GERENTE', 'shipping.view'), ('GERENTE', 'shipping.execute'),
  ('GERENTE', 'inventory.view'), ('GERENTE', 'inventory.create'), ('GERENTE', 'inventory.adjust'),
  ('GERENTE', 'marketplaces.view'), ('GERENTE', 'marketplaces.manage'),
  ('GERENTE', 'reports.view'),
  ('GERENTE', 'notifications.view'), ('GERENTE', 'exports.use')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_code) VALUES
  ('FINANCEIRO', 'products.view'),
  ('FINANCEIRO', 'sales.view'), ('FINANCEIRO', 'sales.create'),
  ('FINANCEIRO', 'finance.view'), ('FINANCEIRO', 'revenue.view'),
  ('FINANCEIRO', 'cost.view'), ('FINANCEIRO', 'profit.view'), ('FINANCEIRO', 'margin.view'),
  ('FINANCEIRO', 'reports.view'), ('FINANCEIRO', 'reports.export'),
  ('FINANCEIRO', 'notifications.view'), ('FINANCEIRO', 'exports.use')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_code) VALUES
  ('SEPARADOR', 'products.view'),
  ('SEPARADOR', 'picking.view'), ('SEPARADOR', 'picking.execute'),
  ('SEPARADOR', 'orders.view'),
  ('SEPARADOR', 'inventory.view'),
  ('SEPARADOR', 'notifications.view')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_code) VALUES
  ('EXPEDICAO', 'products.view'),
  ('EXPEDICAO', 'shipping.view'), ('EXPEDICAO', 'shipping.execute'),
  ('EXPEDICAO', 'orders.view'),
  ('EXPEDICAO', 'notifications.view')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_code) VALUES
  ('VENDEDOR', 'products.view'),
  ('VENDEDOR', 'sales.view'), ('VENDEDOR', 'sales.create'),
  ('VENDEDOR', 'inventory.view'),
  ('VENDEDOR', 'orders.view'),
  ('VENDEDOR', 'notifications.view')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_code) VALUES
  ('ESTOQUE', 'products.view'),
  ('ESTOQUE', 'inventory.view'), ('ESTOQUE', 'inventory.create'), ('ESTOQUE', 'inventory.adjust'),
  ('ESTOQUE', 'orders.view'),
  ('ESTOQUE', 'notifications.view')
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role, permission_code) VALUES
  ('CONSULTA', 'products.view'),
  ('CONSULTA', 'sales.view'),
  ('CONSULTA', 'orders.view'),
  ('CONSULTA', 'inventory.view'),
  ('CONSULTA', 'reports.view'),
  ('CONSULTA', 'notifications.view')
ON CONFLICT DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name, email, status)
  VALUES (
    new.id,
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'ADMIN'::user_role
      ELSE 'OPERATOR'::user_role
    END,
    COALESCE(new.raw_user_meta_data->>'name', 'Usuário'),
    new.email,
    'ACTIVE'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
