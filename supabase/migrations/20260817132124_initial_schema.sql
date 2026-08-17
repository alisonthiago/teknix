-- Enums
CREATE TYPE user_role AS ENUM ('ADMIN', 'OPERATOR');
CREATE TYPE stock_movement_type AS ENUM ('PURCHASE', 'SALE', 'ADJUSTMENT', 'RETURN', 'LOSS');
CREATE TYPE entity_status AS ENUM ('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED');

-- Custom trigger for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1. Profiles
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  role user_role NOT NULL DEFAULT 'OPERATOR',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 2. Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  legal_name TEXT,
  cnpj TEXT,
  contact TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  website TEXT,
  city TEXT,
  state TEXT,
  delivery_time INTEGER,
  min_order NUMERIC(10, 2),
  freight NUMERIC(10, 2),
  payment_terms TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 3. Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  ean TEXT,
  category TEXT,
  supplier_id UUID REFERENCES suppliers(id),
  cost_purchase NUMERIC(10, 2) NOT NULL DEFAULT 0,
  freight_purchase NUMERIC(10, 2) NOT NULL DEFAULT 0,
  packaging_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  other_costs NUMERIC(10, 2) NOT NULL DEFAULT 0,
  weight NUMERIC(10, 2),
  width NUMERIC(10, 2),
  height NUMERIC(10, 2),
  length NUMERIC(10, 2),
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  status entity_status NOT NULL DEFAULT 'ACTIVE',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 4. Marketplaces
CREATE TABLE marketplaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'ACTIVE',
  default_percentage_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  default_fixed_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  default_tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
  default_freight NUMERIC(10, 2) NOT NULL DEFAULT 0,
  default_ads_fee NUMERIC(10, 2) NOT NULL DEFAULT 0,
  other_fees NUMERIC(10, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_marketplaces_updated_at BEFORE UPDATE ON marketplaces FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 5. Marketplace Listings
CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  marketplace_id UUID NOT NULL REFERENCES marketplaces(id),
  listing_code TEXT,
  listing_type TEXT,
  specific_percentage_fee NUMERIC(10, 2),
  specific_fixed_fee NUMERIC(10, 2),
  specific_tax NUMERIC(10, 2),
  specific_freight NUMERIC(10, 2),
  specific_ads_fee NUMERIC(10, 2),
  specific_other_fees NUMERIC(10, 2),
  price NUMERIC(10, 2),
  status TEXT DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, marketplace_id, listing_code)
);
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 6. Purchases
CREATE TABLE purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id),
  invoice TEXT,
  total_cost NUMERIC(10, 2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 7. Purchase Items
CREATE TABLE purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_cost NUMERIC(10, 2) NOT NULL,
  freight NUMERIC(10, 2) NOT NULL DEFAULT 0,
  other_costs NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_cost NUMERIC(10, 2) NOT NULL,
  real_unit_cost NUMERIC(10, 2) NOT NULL
);

-- 8. Sales
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  order_id TEXT,
  marketplace_id UUID NOT NULL REFERENCES marketplaces(id),
  total_revenue NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'COMPLETED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- 9. Sale Items
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_revenue NUMERIC(10, 2) NOT NULL,
  fees NUMERIC(10, 2) NOT NULL DEFAULT 0,
  taxes NUMERIC(10, 2) NOT NULL DEFAULT 0,
  freight NUMERIC(10, 2) NOT NULL DEFAULT 0,
  other_costs NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cogs NUMERIC(10, 2) NOT NULL, -- Cost of Goods Sold
  profit NUMERIC(10, 2) NOT NULL,
  margin NUMERIC(10, 2) NOT NULL
);

-- 10. Stock Movements
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  type stock_movement_type NOT NULL,
  quantity INTEGER NOT NULL, -- positive for IN, negative for OUT
  reference_id UUID, -- sale_id or purchase_id
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  entity TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS setup (Private Administrative System)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access to authenticated users on profiles" ON profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on suppliers" ON suppliers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on products" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on marketplaces" ON marketplaces FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on marketplace_listings" ON marketplace_listings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on purchases" ON purchases FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on purchase_items" ON purchase_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on sales" ON sales FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on sale_items" ON sale_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on stock_movements" ON stock_movements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow full access to authenticated users on audit_logs" ON audit_logs FOR ALL USING (auth.role() = 'authenticated');

-- Trigger to create profile when auth.users is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, name, email)
  VALUES (new.id, 'OPERATOR', COALESCE(new.raw_user_meta_data->>'name', 'Usuário'), new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql security definer;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
