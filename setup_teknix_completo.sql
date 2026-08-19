-- ================================================================
-- TEKNIX — SETUP COMPLETO DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/ykgprfzfnffooqmfbeox/sql/new
-- ================================================================

-- 1. TIPOS ENUM
DO $$ BEGIN CREATE TYPE user_role AS ENUM ('MASTER','ADMIN','OPERATOR','GERENTE','FINANCEIRO','SEPARADOR','EXPEDICAO','VENDEDOR','ESTOQUE','CONSULTA');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'MASTER'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'GERENTE'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'FINANCEIRO'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SEPARADOR'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'EXPEDICAO'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'VENDEDOR'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ESTOQUE'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CONSULTA'; EXCEPTION WHEN others THEN NULL; END $$;

-- 2. FUNÇÃO updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

-- 3. TABELA PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role TEXT NOT NULL DEFAULT 'OPERATOR',
  name TEXT NOT NULL DEFAULT 'Usuário',
  email TEXT NOT NULL DEFAULT '',
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'ACTIVE',
  is_master BOOLEAN DEFAULT FALSE,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 4. SUPPLIERS
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, legal_name TEXT, cnpj TEXT, contact TEXT, phone TEXT, whatsapp TEXT,
  email TEXT, website TEXT, city TEXT, state TEXT, delivery_time INTEGER,
  min_order NUMERIC(10,2), freight NUMERIC(10,2), payment_terms TEXT, notes TEXT, logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 5. PRODUCTS
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL, brand TEXT, model TEXT, ean TEXT, category TEXT,
  supplier_id UUID REFERENCES suppliers(id),
  cost_purchase NUMERIC(10,2) NOT NULL DEFAULT 0, freight_purchase NUMERIC(10,2) NOT NULL DEFAULT 0,
  packaging_cost NUMERIC(10,2) NOT NULL DEFAULT 0, other_costs NUMERIC(10,2) NOT NULL DEFAULT 0,
  weight NUMERIC(10,2), width NUMERIC(10,2), height NUMERIC(10,2), length NUMERIC(10,2),
  stock INTEGER NOT NULL DEFAULT 0, min_stock INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'ACTIVE', notes TEXT, image_url TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 6. MARKETPLACES
CREATE TABLE IF NOT EXISTS marketplaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, code TEXT NOT NULL UNIQUE, status TEXT DEFAULT 'ACTIVE',
  default_percentage_fee NUMERIC(10,2) NOT NULL DEFAULT 0, default_fixed_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  default_tax NUMERIC(10,2) NOT NULL DEFAULT 0, default_freight NUMERIC(10,2) NOT NULL DEFAULT 0,
  default_ads_fee NUMERIC(10,2) NOT NULL DEFAULT 0, other_fees NUMERIC(10,2) NOT NULL DEFAULT 0, notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_marketplaces_updated_at ON marketplaces;
CREATE TRIGGER update_marketplaces_updated_at BEFORE UPDATE ON marketplaces FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 7. PURCHASES
CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE, supplier_id UUID NOT NULL REFERENCES suppliers(id),
  invoice TEXT, total_cost NUMERIC(10,2) NOT NULL DEFAULT 0, payment_method TEXT, notes TEXT,
  status TEXT DEFAULT 'COMPLETED', user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_purchases_updated_at ON purchases;
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 8. PURCHASE ITEMS
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  sku TEXT NOT NULL, quantity INTEGER NOT NULL, unit_cost NUMERIC(10,2) NOT NULL,
  freight NUMERIC(10,2) NOT NULL DEFAULT 0, other_costs NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(10,2) NOT NULL, real_unit_cost NUMERIC(10,2) NOT NULL,
  user_id UUID REFERENCES auth.users(id)
);

-- 9. SALES
CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE, order_id TEXT,
  marketplace_id UUID REFERENCES marketplaces(id),
  total_revenue NUMERIC(10,2) NOT NULL DEFAULT 0, status TEXT DEFAULT 'COMPLETED',
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
DROP TRIGGER IF EXISTS update_sales_updated_at ON sales;
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 10. SALE ITEMS
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  sku TEXT NOT NULL, quantity INTEGER NOT NULL, unit_price NUMERIC(10,2) NOT NULL,
  total_revenue NUMERIC(10,2) NOT NULL, fees NUMERIC(10,2) NOT NULL DEFAULT 0,
  taxes NUMERIC(10,2) NOT NULL DEFAULT 0, freight NUMERIC(10,2) NOT NULL DEFAULT 0,
  other_costs NUMERIC(10,2) NOT NULL DEFAULT 0, cogs NUMERIC(10,2) NOT NULL DEFAULT 0,
  profit NUMERIC(10,2) NOT NULL DEFAULT 0, margin NUMERIC(10,2) NOT NULL DEFAULT 0,
  user_id UUID REFERENCES auth.users(id)
);

-- 11. INVENTORY MOVEMENTS
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  type TEXT NOT NULL, quantity INTEGER NOT NULL, reference_id UUID, notes TEXT,
  user_id UUID REFERENCES auth.users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id), type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL, message TEXT NOT NULL, is_read BOOLEAN DEFAULT FALSE,
  actor_user_id UUID REFERENCES auth.users(id), actor_name TEXT, actor_role TEXT,
  target_user_id UUID, module TEXT, entity_id TEXT, entity_type TEXT,
  resource TEXT, resource_id TEXT, marketplace_id UUID, metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. PERMISSIONS TABLES
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE, module TEXT NOT NULL, description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role TEXT NOT NULL, permission_code TEXT NOT NULL REFERENCES permissions(code),
  UNIQUE(role, permission_code)
);
CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_code TEXT NOT NULL REFERENCES permissions(code),
  granted BOOLEAN NOT NULL DEFAULT TRUE,
  UNIQUE(user_id, permission_code)
);

-- 14. RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "auth_profiles" ON profiles FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_suppliers" ON suppliers FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_products" ON products FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_marketplaces" ON marketplaces FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_purchases" ON purchases FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_purchase_items" ON purchase_items FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_sales" ON sales FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_sale_items" ON sale_items FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_inventory" ON inventory_movements FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_notifications" ON notifications FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_permissions_read" ON permissions FOR SELECT USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_role_permissions" ON role_permissions FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "auth_user_permissions" ON user_permissions FOR ALL USING (auth.role()='authenticated'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 15. TRIGGER AUTO-CRIAR PERFIL
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name, email, status, is_master)
  VALUES (
    new.id,
    CASE WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE is_master = true) THEN 'MASTER' ELSE 'OPERATOR' END,
    COALESCE(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.email, 'ACTIVE',
    CASE WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE is_master = true) THEN true ELSE false END
  ) ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 16. SEED PERMISSIONS
INSERT INTO permissions (code, module, description) VALUES
  ('products.view','Produtos','Visualizar produtos'),('products.create','Produtos','Criar produtos'),
  ('products.edit','Produtos','Editar produtos'),('products.delete','Produtos','Excluir produtos'),
  ('sales.view','Vendas','Visualizar vendas'),('sales.create','Vendas','Criar vendas'),
  ('sales.edit','Vendas','Editar vendas'),('sales.delete','Vendas','Excluir vendas'),
  ('orders.view','Pedidos','Visualizar pedidos'),('orders.manage','Pedidos','Gerenciar pedidos'),
  ('orders.financial_view','Pedidos','Ver financeiro de pedidos'),
  ('picking.view','Separação','Visualizar separação'),('picking.execute','Separação','Executar separação'),
  ('shipping.view','Expedição','Visualizar expedição'),('shipping.execute','Expedição','Executar expedição'),
  ('shipping.print_label','Expedição','Imprimir etiquetas'),
  ('inventory.view','Estoque','Visualizar estoque'),('inventory.create','Estoque','Registrar movimentação'),
  ('inventory.adjust','Estoque','Ajustar estoque'),('inventory.cost_view','Estoque','Ver custos'),
  ('finance.view','Financeiro','Visualizar financeiro'),('revenue.view','Faturamento','Visualizar faturamento'),
  ('cost.view','Custos','Visualizar custos'),('profit.view','Lucro','Visualizar lucro'),
  ('margin.view','Margem','Visualizar margem'),
  ('reports.view','Relatórios','Visualizar relatórios'),('reports.export','Relatórios','Exportar'),
  ('reports.sales','Relatórios','Relatório de vendas'),('reports.inventory','Relatórios','Relatório de estoque'),
  ('marketplaces.view','Marketplaces','Visualizar'),('marketplaces.manage','Marketplaces','Gerenciar'),
  ('marketplaces.connect','Marketplaces','Conectar'),('marketplaces.sync','Marketplaces','Sincronizar'),
  ('settings.view','Configurações','Visualizar'),('settings.manage','Configurações','Gerenciar'),
  ('users.view','Usuários','Visualizar usuários'),('users.create','Usuários','Criar usuários'),
  ('users.edit','Usuários','Editar usuários'),('users.delete','Usuários','Excluir usuários'),
  ('permissions.manage','Usuários','Gerenciar permissões'),
  ('imports.use','Importação','Usar importação'),('exports.use','Exportação','Usar exportação'),
  ('exports.financial','Exportação','Exportar financeiro'),
  ('notifications.view','Notificações','Visualizar notificações'),
  ('pricing.view','Precificação','Visualizar precificação')
ON CONFLICT (code) DO NOTHING;

-- MASTER e ADMIN têm TUDO
INSERT INTO role_permissions (role, permission_code) SELECT 'MASTER', code FROM permissions ON CONFLICT DO NOTHING;
INSERT INTO role_permissions (role, permission_code) SELECT 'ADMIN', code FROM permissions ON CONFLICT DO NOTHING;

-- 17. CRIAR PERFIL DO ALISON COMO MASTER
INSERT INTO public.profiles (id, role, name, email, status, is_master)
VALUES (
  '3af9068a-4b78-4c9c-8657-f83b93c01588',
  'MASTER',
  'Alison',
  'alison@teknixbrasil.com.br',
  'ACTIVE',
  true
) ON CONFLICT (id) DO UPDATE SET role='MASTER', status='ACTIVE', is_master=true;

-- 18. DAR TODAS AS PERMISSÕES AO ALISON
INSERT INTO user_permissions (user_id, permission_code, granted)
SELECT '3af9068a-4b78-4c9c-8657-f83b93c01588', code, true FROM permissions
ON CONFLICT (user_id, permission_code) DO UPDATE SET granted=true;

-- ✅ VERIFICAR RESULTADO
SELECT 'PERFIL CRIADO:' as info, id, name, email, role, status, is_master FROM profiles WHERE id='3af9068a-4b78-4c9c-8657-f83b93c01588';
SELECT 'PERMISSÕES:' as info, count(*) as total FROM user_permissions WHERE user_id='3af9068a-4b78-4c9c-8657-f83b93c01588';
