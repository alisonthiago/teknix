-- ============================================================
-- TEKNIX — Migration 017: Fix RLS para store_orders
--
-- PROBLEMA: A policy "hub_admin_store_orders" usa FOR ALL com
-- apenas USING (fn_is_hub_admin()), sem WITH CHECK.
-- No Postgres/Supabase, para operações INSERT de um FOR ALL policy,
-- o WITH CHECK default é o próprio USING clause.
-- Isso fazia com que a avaliação de INSERT para usuários anon/authenticated
-- conflitasse com o comportamento esperado.
--
-- SOLUÇÃO: Recriar as policies de admin com WITH CHECK explícito,
-- e garantir que as policies de insert público sejam permissivas.
-- ============================================================

BEGIN;

-- ============================================================
-- 1. Recriar policy de admin para store_orders com WITH CHECK explícito
-- ============================================================
DROP POLICY IF EXISTS "hub_admin_store_orders" ON public.store_orders;
CREATE POLICY "hub_admin_store_orders"
  ON public.store_orders FOR ALL
  TO authenticated
  USING (public.fn_is_hub_admin())
  WITH CHECK (public.fn_is_hub_admin());

-- ============================================================
-- 2. Recriar policy de admin para store_order_items com WITH CHECK explícito
-- ============================================================
DROP POLICY IF EXISTS "hub_admin_store_order_items" ON public.store_order_items;
CREATE POLICY "hub_admin_store_order_items"
  ON public.store_order_items FOR ALL
  TO authenticated
  USING (public.fn_is_hub_admin())
  WITH CHECK (public.fn_is_hub_admin());

-- ============================================================
-- 3. Garantir policy de INSERT público para store_orders (anon e authenticated)
-- ============================================================
DROP POLICY IF EXISTS "public_insert_store_orders" ON public.store_orders;
CREATE POLICY "public_insert_store_orders"
  ON public.store_orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================================
-- 4. Garantir policy de INSERT público para store_order_items
-- ============================================================
DROP POLICY IF EXISTS "public_insert_store_order_items" ON public.store_order_items;
CREATE POLICY "public_insert_store_order_items"
  ON public.store_order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================================
-- 5. Manter policy de UPDATE via service_role (webhook Mercado Pago)
--    Alterada: remover anon do UPDATE pois apenas o webhook precisa atualizar
-- ============================================================
DROP POLICY IF EXISTS "service_update_store_orders" ON public.store_orders;
CREATE POLICY "service_update_store_orders"
  ON public.store_orders FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

COMMIT;
