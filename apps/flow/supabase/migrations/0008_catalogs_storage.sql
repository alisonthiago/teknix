-- Migration para criar o Bucket "catalogs" no Storage do Supabase para armazenar PDFs dos fornecedores

-- Inserir o novo bucket público "catalogs"
INSERT INTO storage.buckets (id, name, public) 
VALUES ('catalogs', 'catalogs', true)
ON CONFLICT (id) DO NOTHING;

-- Adicionar políticas de segurança para o bucket "catalogs"

-- Permitir leitura pública (qualquer pessoa pode baixar ou visualizar os catálogos PDF/Imagens)
CREATE POLICY "Public Access for Catalogs"
ON storage.objects FOR SELECT
USING ( bucket_id = 'catalogs' );

-- Permitir que usuários autenticados façam upload de arquivos para a pasta catalogs
CREATE POLICY "Authenticated users can upload catalogs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'catalogs' );

-- Permitir que usuários autenticados atualizem seus próprios arquivos
CREATE POLICY "Authenticated users can update catalogs"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'catalogs' );

-- Permitir que usuários autenticados deletem arquivos
CREATE POLICY "Authenticated users can delete catalogs"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'catalogs' );

-- Atualizar a tabela de fornecedores para incluir o campo do catálogo, se não existir
ALTER TABLE public.suppliers
ADD COLUMN IF NOT EXISTS catalog_url TEXT;
