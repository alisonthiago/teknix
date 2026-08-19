-- ================================================================
-- TEKNIX — STORAGE DEFINITIVO (POLÍTICAS E BUCKETS PÚBLICOS)
-- ================================================================

-- 1. Garantir que todos os buckets existem e são PÚBLICOS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('product-images', 'product-images', true, 52428800, null),
  ('supplier-logos', 'supplier-logos', true, 52428800, null),
  ('supplier-catalogs', 'supplier-catalogs', true, 52428800, null),
  ('user-avatars', 'user-avatars', true, 52428800, null),
  ('company-assets', 'company-assets', true, 52428800, null),
  ('documents', 'documents', true, 52428800, null),
  ('logos', 'logos', true, 52428800, null),
  ('catalogs', 'catalogs', true, 52428800, null),
  ('avatars', 'avatars', true, 52428800, null)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 52428800;

-- 2. Limpar políticas antigas de storage para evitar conflitos
DROP POLICY IF EXISTS "Public Access for Catalogs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload catalogs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update catalogs" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete catalogs" ON storage.objects;
DROP POLICY IF EXISTS "Public Read All Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload All Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update All Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete All Buckets" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access on storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert access on storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update access on storage" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete access on storage" ON storage.objects;
DROP POLICY IF EXISTS "storage_public_read" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_insert" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_update" ON storage.objects;
DROP POLICY IF EXISTS "storage_auth_delete" ON storage.objects;

-- 3. Criar Políticas Globais Permissivas no Supabase Storage

-- LEITURA PÚBLICA (qualquer um pode ver/carregar fotos de produtos, logos, avatares, PDFs)
CREATE POLICY "storage_public_read"
ON storage.objects FOR SELECT
USING (true);

-- UPLOAD POR USUÁRIOS AUTENTICADOS (qualquer usuário logado pode enviar arquivos)
CREATE POLICY "storage_auth_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (true);

-- ATUALIZAÇÃO POR USUÁRIOS AUTENTICADOS (substituir foto/logo/arquivo)
CREATE POLICY "storage_auth_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (true);

-- EXCLUSÃO POR USUÁRIOS AUTENTICADOS (remover foto/logo/arquivo)
CREATE POLICY "storage_auth_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (true);

-- 4. Sincronizar perfis (avatar_url e photo_url)
UPDATE public.profiles SET photo_url = avatar_url WHERE photo_url IS NULL AND avatar_url IS NOT NULL;
UPDATE public.profiles SET avatar_url = photo_url WHERE avatar_url IS NULL AND photo_url IS NOT NULL;

-- 5. Verificação
SELECT id, name, public, file_size_limit FROM storage.buckets;
