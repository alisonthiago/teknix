-- FIX: Dropar tabelas com NUMERIC(1,2) incorreto e recriar com NUMERIC(3,2)
-- Execute este SQL no Supabase Dashboard > SQL Editor

-- Dropar na ordem correta (respeitar foreign keys)
DROP TABLE IF EXISTS page_publications CASCADE;
DROP TABLE IF EXISTS page_widgets CASCADE;
DROP TABLE IF EXISTS page_containers CASCADE;
DROP TABLE IF EXISTS page_sections CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS page_headers CASCADE;
DROP TABLE IF EXISTS page_footers CASCADE;
DROP TABLE IF EXISTS menus CASCADE;
DROP TABLE IF EXISTS global_components CASCADE;
DROP TABLE IF EXISTS media CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS themes CASCADE;

-- Remover coluna adicionada em products (se existir)
ALTER TABLE products DROP COLUMN IF EXISTS presentation_page_id;

-- Agora recriar com NUMERIC(3,2) correto
-- Cole aqui o conteudo de apply_migrations.sql (ja corrigido)
