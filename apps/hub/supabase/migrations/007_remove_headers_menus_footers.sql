-- ============================================================
-- TEKNIX HUB — Remoção de tabelas não utilizadas
-- Headers, Menus e Footers foram removidos do sistema.
-- O Page Builder personalizado gerencia esses elementos.
--
-- EXECUTE ESTE SCRIPT NO SUPABASE SQL EDITOR:
-- https://supabase.com/dashboard/project/_/sql
-- ============================================================

-- Remover políticas RLS antes de dropar as tabelas
DROP POLICY IF EXISTS "Public can read global menus" ON menus;
DROP POLICY IF EXISTS "Public can read global headers" ON page_headers;
DROP POLICY IF EXISTS "Public can read global footers" ON page_footers;

DROP POLICY IF EXISTS "Authenticated can manage menus" ON menus;
DROP POLICY IF EXISTS "Authenticated can manage headers" ON page_headers;
DROP POLICY IF EXISTS "Authenticated can manage footers" ON page_footers;

-- Remover referências nas páginas (colunas header_id, footer_id)
ALTER TABLE pages DROP COLUMN IF EXISTS header_id;
ALTER TABLE pages DROP COLUMN IF EXISTS footer_id;
ALTER TABLE pages DROP COLUMN IF EXISTS menu;

-- Remover as tabelas
DROP TABLE IF EXISTS page_footers CASCADE;
DROP TABLE IF EXISTS page_headers CASCADE;
DROP TABLE IF EXISTS menus CASCADE;

-- ============================================================
-- Confirmar remoção
-- ============================================================
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('menus', 'page_headers', 'page_footers')
ORDER BY table_name;
-- Resultado esperado: 0 linhas (tabelas removidas com sucesso)
