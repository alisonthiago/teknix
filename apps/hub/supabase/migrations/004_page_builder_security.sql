-- ============================================================
-- TEKNIX PAGE BUILDER SECURITY FIX
-- Migration 004: escrita administrativa nas tabelas do Page Builder
--
-- PROBLEMA CORRIGIDO:
-- As policies da migration 001 permitiam INSERT/UPDATE/DELETE para
-- QUALQUER usuário autenticado ("Authenticated can manage ...").
-- Um cliente logado no SITE poderia alterar páginas, temas e conteúdo.
--
-- SOLUÇÃO:
-- Remove as 13 policies "FOR ALL" genéricas e recria exigindo
-- public.fn_is_hub_admin() (profiles.status=ACTIVE E
-- (profiles.is_master OU profiles.role IN ('MASTER','ADMIN'))).
--
-- PRESERVADO SEM ALTERAÇÃO:
-- - Todas as policies de leitura pública (draft invisível p/ anon).
-- - Estrutura das tabelas, dados, seeds.
-- - TEKNIX FLOW: zero impacto (não referencia estas tabelas).
-- ============================================================

-- ------------------------------------------------------------
-- 0. Função de admin (idempotente — mesma definição do 003;
--    pode rodar antes ou depois, CREATE OR REPLACE é seguro)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_is_hub_admin()
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'ACTIVE'
      AND (p.is_master = true OR p.role IN ('MASTER', 'ADMIN'))
  );
$$;

REVOKE EXECUTE ON FUNCTION public.fn_is_hub_admin() FROM anon;

-- ------------------------------------------------------------
-- 1. REMOÇÃO das policies antigas (escrita aberta)
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated can manage themes"          ON themes;
DROP POLICY IF EXISTS "Authenticated can manage templates"       ON templates;
DROP POLICY IF EXISTS "Authenticated can manage pages"           ON pages;
DROP POLICY IF EXISTS "Authenticated can manage sections"        ON page_sections;
DROP POLICY IF EXISTS "Authenticated can manage containers"      ON page_containers;
DROP POLICY IF EXISTS "Authenticated can manage widgets"         ON page_widgets;
DROP POLICY IF EXISTS "Authenticated can manage global components" ON global_components;
DROP POLICY IF EXISTS "Authenticated can manage menus"           ON menus;
DROP POLICY IF EXISTS "Authenticated can manage headers"         ON page_headers;
DROP POLICY IF EXISTS "Authenticated can manage footers"         ON page_footers;
DROP POLICY IF EXISTS "Authenticated can manage campaigns"       ON campaigns;
DROP POLICY IF EXISTS "Authenticated can manage publications"    ON page_publications;
DROP POLICY IF EXISTS "Authenticated can manage media"           ON media;

-- ------------------------------------------------------------
-- 2. RECRIAÇÃO: admins do HUB têm acesso completo (leitura de
--    rascunhos incluída, pois o editor precisa ver drafts);
--    clientes autenticados ficam só com as leituras públicas.
-- ------------------------------------------------------------
CREATE POLICY "Hub admins manage themes"
  ON themes FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage templates"
  ON templates FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage pages"
  ON pages FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage sections"
  ON page_sections FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage containers"
  ON page_containers FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage widgets"
  ON page_widgets FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage global components"
  ON global_components FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage menus"
  ON menus FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage headers"
  ON page_headers FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage footers"
  ON page_footers FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage campaigns"
  ON campaigns FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage publications"
  ON page_publications FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage media"
  ON media FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());
