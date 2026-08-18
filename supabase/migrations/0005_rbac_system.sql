-- 0005_rbac_system.sql
-- Role-Based Access Control for TEKNIX

-- 1. Extend the user_role enum with all profiles
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'GERENTE';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'FINANCEIRO';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SEPARADOR';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'EXPEDICAO';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'VENDEDOR';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ESTOQUE';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CONSULTA';

-- 2. Permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Role-default permissions (which permissions each role gets by default)
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role user_role NOT NULL,
  permission_code TEXT NOT NULL REFERENCES permissions(code),
  UNIQUE(role, permission_code)
);

-- 4. User-specific permission overrides (grant/revoke on top of role)
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL REFERENCES permissions(code),
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(user_id, permission_code)
);

-- 5. User status and last login
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_permissions_code ON permissions(code);

-- RLS
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- All authenticated can read permissions (needed for UI)
CREATE POLICY "Authenticated can read permissions" ON permissions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can modify permissions
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

-- Everyone can read role_permissions (needed to resolve effective permissions)
CREATE POLICY "Authenticated can read role_permissions" ON role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can read own user_permissions" ON user_permissions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- SEED: All permissions
-- ============================================================
INSERT INTO permissions (code, module, description) VALUES
  -- Products
  ('products.view',   'Produtos',   'Visualizar produtos'),
  ('products.create', 'Produtos',   'Criar produtos'),
  ('products.edit',   'Produtos',   'Editar produtos'),
  ('products.delete', 'Produtos',   'Excluir produtos'),

  -- Sales
  ('sales.view',   'Vendas',   'Visualizar vendas'),
  ('sales.create', 'Vendas',   'Criar vendas'),
  ('sales.edit',   'Vendas',   'Editar vendas'),
  ('sales.delete', 'Vendas',   'Excluir vendas'),

  -- Orders
  ('orders.view',   'Pedidos',   'Visualizar pedidos'),
  ('orders.manage', 'Pedidos',   'Gerenciar pedidos'),

  -- Picking / Separation
  ('picking.view',    'Separação',   'Visualizar separação'),
  ('picking.execute', 'Separação',   'Executar separação'),

  -- Shipping
  ('shipping.view',    'Expedição',   'Visualizar expedição'),
  ('shipping.execute', 'Expedição',   'Executar expedição'),

  -- Inventory
  ('inventory.view',    'Estoque',   'Visualizar estoque'),
  ('inventory.create',  'Estoque',   'Registrar entrada/saída'),
  ('inventory.adjust',  'Estoque',   'Ajustar estoque'),

  -- Finance (sensitive)
  ('finance.view',      'Financeiro',   'Visualizar dados financeiros'),
  ('revenue.view',      'Faturamento',  'Visualizar faturamento'),
  ('cost.view',         'Custos',       'Visualizar custos'),
  ('profit.view',       'Lucro',        'Visualizar lucro'),
  ('margin.view',       'Margem',       'Visualizar margem'),

  -- Reports
  ('reports.view',   'Relatórios',   'Visualizar relatórios'),
  ('reports.export', 'Relatórios',   'Exportar relatórios'),

  -- Marketplaces
  ('marketplaces.view',    'Marketplaces',   'Visualizar marketplaces'),
  ('marketplaces.manage',  'Marketplaces',   'Gerenciar marketplaces'),
  ('marketplaces.connect', 'Marketplaces',   'Conectar marketplaces'),

  -- Settings
  ('settings.view',   'Configurações',   'Visualizar configurações'),
  ('settings.manage', 'Configurações',   'Gerenciar configurações'),

  -- Users
  ('users.view',             'Usuários',   'Visualizar usuários'),
  ('users.create',           'Usuários',   'Criar usuários'),
  ('users.edit',             'Usuários',   'Editar usuários'),
  ('users.delete',           'Usuários',   'Excluir usuários'),
  ('permissions.manage',     'Usuários',   'Gerenciar permissões'),

  -- Import/Export
  ('imports.use', 'Importação', 'Usar importação'),
  ('exports.use', 'Exportação', 'Usar exportação'),

  -- Notifications
  ('notifications.view', 'Notificações', 'Visualizar notificações')

ON CONFLICT (code) DO NOTHING;

-- ============================================================
-- SEED: Default role permissions
-- ============================================================

-- ADMIN: everything
INSERT INTO role_permissions (role, permission_code)
SELECT 'ADMIN', code FROM permissions
ON CONFLICT DO NOTHING;

-- GERENTE: operational, no financial sensitivity
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

-- FINANCEIRO: financial data, no admin
INSERT INTO role_permissions (role, permission_code) VALUES
  ('FINANCEIRO', 'products.view'),
  ('FINANCEIRO', 'sales.view'), ('FINANCEIRO', 'sales.create'),
  ('FINANCEIRO', 'finance.view'), ('FINANCEIRO', 'revenue.view'),
  ('FINANCEIRO', 'cost.view'), ('FINANCEIRO', 'profit.view'), ('FINANCEIRO', 'margin.view'),
  ('FINANCEIRO', 'reports.view'), ('FINANCEIRO', 'reports.export'),
  ('FINANCEIRO', 'notifications.view'), ('FINANCEIRO', 'exports.use')
ON CONFLICT DO NOTHING;

-- SEPARADOR: picking only, zero financial
INSERT INTO role_permissions (role, permission_code) VALUES
  ('SEPARADOR', 'products.view'),
  ('SEPARADOR', 'picking.view'), ('SEPARADOR', 'picking.execute'),
  ('SEPARADOR', 'orders.view'),
  ('SEPARADOR', 'inventory.view'),
  ('SEPARADOR', 'notifications.view')
ON CONFLICT DO NOTHING;

-- EXPEDICAO: shipping only, zero financial
INSERT INTO role_permissions (role, permission_code) VALUES
  ('EXPEDICAO', 'products.view'),
  ('EXPEDICAO', 'shipping.view'), ('EXPEDICAO', 'shipping.execute'),
  ('EXPEDICAO', 'orders.view'),
  ('EXPEDICAO', 'notifications.view')
ON CONFLICT DO NOTHING;

-- VENDEDOR: products, stock visibility, sales, no financial sensitive
INSERT INTO role_permissions (role, permission_code) VALUES
  ('VENDEDOR', 'products.view'),
  ('VENDEDOR', 'sales.view'), ('VENDEDOR', 'sales.create'),
  ('VENDEDOR', 'inventory.view'),
  ('VENDEDOR', 'orders.view'),
  ('VENDEDOR', 'notifications.view')
ON CONFLICT DO NOTHING;

-- ESTOQUE: inventory management, no financial
INSERT INTO role_permissions (role, permission_code) VALUES
  ('ESTOQUE', 'products.view'),
  ('ESTOQUE', 'inventory.view'), ('ESTOQUE', 'inventory.create'), ('ESTOQUE', 'inventory.adjust'),
  ('ESTOQUE', 'orders.view'),
  ('ESTOQUE', 'notifications.view')
ON CONFLICT DO NOTHING;

-- CONSULTA: view only, no create/edit/delete
INSERT INTO role_permissions (role, permission_code) VALUES
  ('CONSULTA', 'products.view'),
  ('CONSULTA', 'sales.view'),
  ('CONSULTA', 'orders.view'),
  ('CONSULTA', 'inventory.view'),
  ('CONSULTA', 'reports.view'),
  ('CONSULTA', 'notifications.view')
ON CONFLICT DO NOTHING;

-- Update handle_new_user to use ADMIN as default for first user, CONSULTA for others
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name, email, status)
  VALUES (
    new.id,
    CASE
      WHEN NOT EXISTS (SELECT 1 FROM public.profiles) THEN 'ADMIN'
      ELSE 'OPERATOR'
    END,
    COALESCE(new.raw_user_meta_data->>'name', 'Usuário'),
    new.email,
    'ACTIVE'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
