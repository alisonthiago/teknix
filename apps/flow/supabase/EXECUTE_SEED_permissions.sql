-- TEKNIX - Seed completo (segundo bloco)
-- Cole no Supabase Dashboard → SQL Editor → Run

-- 0. Recriar role_permissions com TEXT (evita problema do enum na mesma transação)
DROP TABLE IF EXISTS role_permissions CASCADE;
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL,
  permission_code TEXT NOT NULL REFERENCES permissions(code),
  UNIQUE(role, permission_code)
);
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage role_permissions" ON role_permissions
  FOR ALL USING (
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Authenticated can read role_permissions" ON role_permissions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role);

-- 1. Seed permissions
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

-- 2. ADMIN: todas
INSERT INTO role_permissions (role, permission_code)
SELECT 'ADMIN', code FROM permissions
ON CONFLICT DO NOTHING;

-- 3. GERENTE
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

-- 4. FINANCEIRO
INSERT INTO role_permissions (role, permission_code) VALUES
  ('FINANCEIRO', 'products.view'),
  ('FINANCEIRO', 'sales.view'), ('FINANCEIRO', 'sales.create'),
  ('FINANCEIRO', 'finance.view'), ('FINANCEIRO', 'revenue.view'),
  ('FINANCEIRO', 'cost.view'), ('FINANCEIRO', 'profit.view'), ('FINANCEIRO', 'margin.view'),
  ('FINANCEIRO', 'reports.view'), ('FINANCEIRO', 'reports.export'),
  ('FINANCEIRO', 'notifications.view'), ('FINANCEIRO', 'exports.use')
ON CONFLICT DO NOTHING;

-- 5. SEPARADOR
INSERT INTO role_permissions (role, permission_code) VALUES
  ('SEPARADOR', 'products.view'),
  ('SEPARADOR', 'picking.view'), ('SEPARADOR', 'picking.execute'),
  ('SEPARADOR', 'orders.view'),
  ('SEPARADOR', 'inventory.view'),
  ('SEPARADOR', 'notifications.view')
ON CONFLICT DO NOTHING;

-- 6. EXPEDICAO
INSERT INTO role_permissions (role, permission_code) VALUES
  ('EXPEDICAO', 'products.view'),
  ('EXPEDICAO', 'shipping.view'), ('EXPEDICAO', 'shipping.execute'),
  ('EXPEDICAO', 'orders.view'),
  ('EXPEDICAO', 'notifications.view')
ON CONFLICT DO NOTHING;

-- 7. VENDEDOR
INSERT INTO role_permissions (role, permission_code) VALUES
  ('VENDEDOR', 'products.view'),
  ('VENDEDOR', 'sales.view'), ('VENDEDOR', 'sales.create'),
  ('VENDEDOR', 'inventory.view'),
  ('VENDEDOR', 'orders.view'),
  ('VENDEDOR', 'notifications.view')
ON CONFLICT DO NOTHING;

-- 8. ESTOQUE
INSERT INTO role_permissions (role, permission_code) VALUES
  ('ESTOQUE', 'products.view'),
  ('ESTOQUE', 'inventory.view'), ('ESTOQUE', 'inventory.create'), ('ESTOQUE', 'inventory.adjust'),
  ('ESTOQUE', 'orders.view'),
  ('ESTOQUE', 'notifications.view')
ON CONFLICT DO NOTHING;

-- 9. CONSULTA
INSERT INTO role_permissions (role, permission_code) VALUES
  ('CONSULTA', 'products.view'),
  ('CONSULTA', 'sales.view'),
  ('CONSULTA', 'orders.view'),
  ('CONSULTA', 'inventory.view'),
  ('CONSULTA', 'reports.view'),
  ('CONSULTA', 'notifications.view')
ON CONFLICT DO NOTHING;

-- 10. handle_new_user (mantém compatibilidade)
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
