-- ============================================================
-- TEKNIX STORE — PÁGINA AUTOMÁTICA DE CATEGORIA
-- Migration 008: cria automaticamente a página padrão de uma
-- categoria quando ela é criada, e a mantém vinculada via page_id.
--
-- A página criada tem slug /categoria/{slug} e pode ser
-- personalizada depois pelo Editor de Páginas (Page Builder).
-- Novos produtos vinculados à categoria aparecem automaticamente
-- na página, pois a CategoryPage consulta por category_id.
-- ============================================================

-- 1. Garante a coluna page_id em store_categories (idempotente)
ALTER TABLE IF EXISTS store_categories
  ADD COLUMN IF NOT EXISTS page_id UUID REFERENCES pages(id) ON DELETE SET NULL;

-- 2. Função que cria a página padrão da categoria
CREATE OR REPLACE FUNCTION public.fn_create_category_page()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_page_id UUID;
  v_slug TEXT;
BEGIN
  -- Só cria se ainda não houver página vinculada
  IF NEW.page_id IS NULL THEN
    v_slug := '/categoria/' || COALESCE(NEW.slug, 'categoria-' || NEW.id::text);

    -- Evita conflito de slug único
    IF EXISTS (SELECT 1 FROM pages WHERE slug = v_slug) THEN
      v_slug := v_slug || '-' || substr(NEW.id::text, 1, 8);
    END IF;

    INSERT INTO pages (type, slug, title, status, seo_title, seo_description)
    VALUES (
      'category',
      v_slug,
      NEW.name,
      'published',
      NEW.name || ' — TEKNIX',
      'Produtos da categoria ' || NEW.name || ' na TEKNIX.'
    )
    RETURNING id INTO v_page_id;

    -- Vincula a página à categoria
    UPDATE store_categories
    SET page_id = v_page_id
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Trigger AFTER INSERT em store_categories
DROP TRIGGER IF EXISTS trg_store_categories_create_page ON store_categories;
CREATE TRIGGER trg_store_categories_create_page
  AFTER INSERT ON store_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_create_category_page();

-- 4. Backfill: cria páginas para categorias existentes sem página
DO $$
DECLARE
  r RECORD;
  v_page_id UUID;
  v_slug TEXT;
BEGIN
  FOR r IN
    SELECT * FROM store_categories WHERE page_id IS NULL
  LOOP
    v_slug := '/categoria/' || COALESCE(r.slug, 'categoria-' || r.id::text);
    IF EXISTS (SELECT 1 FROM pages WHERE slug = v_slug) THEN
      v_slug := v_slug || '-' || substr(r.id::text, 1, 8);
    END IF;

    INSERT INTO pages (type, slug, title, status, seo_title, seo_description)
    VALUES ('category', v_slug, r.name, 'published',
            r.name || ' — TEKNIX',
            'Produtos da categoria ' || r.name || ' na TEKNIX.')
    RETURNING id INTO v_page_id;

    UPDATE store_categories SET page_id = v_page_id WHERE id = r.id;
  END LOOP;
END $$;