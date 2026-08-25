-- 0004_add_user_id_and_crud.sql
-- Add user_id to sales and purchases for multi-tenancy

-- 1. Add user_id to sales
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_sales_user_id ON public.sales(user_id);

-- 2. Add user_id to purchases
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);

-- 3. Add user_id to purchase_items
ALTER TABLE public.purchase_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 4. Add user_id to sale_items
ALTER TABLE public.sale_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 5. Add user_id to products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);

-- 6. Add user_id to suppliers
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_suppliers_user_id ON public.suppliers(user_id);

-- 7. Add user_id to stock_movements
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
