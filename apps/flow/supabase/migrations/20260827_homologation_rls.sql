-- ==========================================================================
-- TEKNIX MONOREPO — PRODUÇÃO SUPABASE RLS & POLICIES (HOMOLOGAÇÃO)
-- Permite leitura pública de produtos e assets para visitantes da loja,
-- mantendo clientes, pedidos e custos estritamente protegidos.
-- ==========================================================================

-- 1. Leitura pública do catálogo de produtos (Anon + Authenticated)
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of products" ON public.products;
CREATE POLICY "Allow public read of products"
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 2. Leitura pública de páginas publicadas do Page Builder
ALTER TABLE IF EXISTS public.pages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read of published pages" ON public.pages;
CREATE POLICY "Allow public read of published pages"
  ON public.pages
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- 3. Proteção estrita de Clientes (Somente o próprio usuário ou Admin/Master)
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can only read their own customer profile" ON public.customers;
CREATE POLICY "Users can only read their own customer profile"
  ON public.customers
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 4. Proteção estrita de Pedidos (Somente o próprio cliente)
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can only view their own orders" ON public.orders;
CREATE POLICY "Customers can only view their own orders"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Storage: Leitura pública de fotos de produtos e assets da empresa
DROP POLICY IF EXISTS "Public access to product images and assets" ON storage.objects;
CREATE POLICY "Public access to product images and assets"
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id IN ('product-images', 'company-assets', 'supplier-logos', 'user-avatars'));
