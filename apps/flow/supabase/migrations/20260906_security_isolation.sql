-- TEKNIX — isolamento de dados por usuário e privilégio mínimo
-- Aplicar no Supabase SQL Editor após revisar em staging.

CREATE OR REPLACE FUNCTION public.fn_is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'ACTIVE'
      AND (p.is_master = true OR p.role IN ('MASTER', 'ADMIN', 'GERENTE'))
  );
$$;

REVOKE ALL ON FUNCTION public.fn_is_staff() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_is_staff() TO authenticated;

-- A policy antiga permitia que qualquer visitante lesse páginas não publicadas.
ALTER TABLE IF EXISTS public.pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read of published pages" ON public.pages;
CREATE POLICY "Public can read published pages only"
  ON public.pages FOR SELECT TO anon, authenticated
  USING (status = 'published');

-- Clientes: somente o próprio cadastro; equipe administrativa pode operar.
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_customers" ON public.customers;
DROP POLICY IF EXISTS "Users can only read their own customer profile" ON public.customers;
CREATE POLICY "Customers read own profile"
  ON public.customers FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_staff());
CREATE POLICY "Staff manage customers"
  ON public.customers FOR ALL TO authenticated
  USING (public.fn_is_staff()) WITH CHECK (public.fn_is_staff());

-- Pedidos e expedição: cliente vê o próprio pedido; equipe autorizada opera.
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated can manage orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can only view their own orders" ON public.orders;
CREATE POLICY "Customers read own orders"
  ON public.orders FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_staff());
CREATE POLICY "Staff manage orders"
  ON public.orders FOR ALL TO authenticated
  USING (public.fn_is_staff()) WITH CHECK (public.fn_is_staff());

ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage order_items" ON public.order_items;
CREATE POLICY "Customers read own order items"
  ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.fn_is_staff())));
CREATE POLICY "Staff manage order items"
  ON public.order_items FOR ALL TO authenticated
  USING (public.fn_is_staff()) WITH CHECK (public.fn_is_staff());

ALTER TABLE IF EXISTS public.order_status_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage order_status_history" ON public.order_status_history;
CREATE POLICY "Customers read own order history"
  ON public.order_status_history FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR public.fn_is_staff())));
CREATE POLICY "Staff manage order history"
  ON public.order_status_history FOR ALL TO authenticated
  USING (public.fn_is_staff()) WITH CHECK (public.fn_is_staff());

ALTER TABLE IF EXISTS public.shipments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can manage shipments" ON public.shipments;
CREATE POLICY "Customers read own shipments"
  ON public.shipments FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.fn_is_staff());
CREATE POLICY "Staff manage shipments"
  ON public.shipments FOR ALL TO authenticated
  USING (public.fn_is_staff()) WITH CHECK (public.fn_is_staff());

-- Notificações nunca devem ser globais.
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_notifications" ON public.notifications;
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR target_user_id = auth.uid() OR public.fn_is_staff());
CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR target_user_id = auth.uid() OR public.fn_is_staff())
  WITH CHECK (user_id = auth.uid() OR target_user_id = auth.uid() OR public.fn_is_staff());
CREATE POLICY "Staff create notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (public.fn_is_staff());

-- Produtos são públicos apenas para leitura; escrita fica administrativa.
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "auth_products" ON public.products;
CREATE POLICY "Public read product catalog"
  ON public.products FOR SELECT TO anon, authenticated
  USING (status = 'ACTIVE' OR public.fn_is_staff());
CREATE POLICY "Staff manage products"
  ON public.products FOR ALL TO authenticated
  USING (public.fn_is_staff()) WITH CHECK (public.fn_is_staff());

