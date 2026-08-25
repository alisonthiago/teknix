-- 1. Add logo_url to suppliers
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Create supplier_catalogs table
CREATE TABLE IF NOT EXISTS public.supplier_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('PDF', 'LINK')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for supplier_catalogs
ALTER TABLE public.supplier_catalogs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL access for authenticated on supplier_catalogs" ON public.supplier_catalogs FOR ALL USING (auth.role() = 'authenticated');

-- 3. Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('supplier-logos', 'supplier-logos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('supplier-catalogs', 'supplier-catalogs', true) ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Logos
CREATE POLICY "Public Access for Supplier Logos" ON storage.objects FOR SELECT USING (bucket_id = 'supplier-logos');
CREATE POLICY "Authenticated users can upload supplier logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'supplier-logos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update supplier logos" ON storage.objects FOR UPDATE USING (bucket_id = 'supplier-logos' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete supplier logos" ON storage.objects FOR DELETE USING (bucket_id = 'supplier-logos' AND auth.role() = 'authenticated');

-- Catalogs
CREATE POLICY "Public Access for Supplier Catalogs" ON storage.objects FOR SELECT USING (bucket_id = 'supplier-catalogs');
CREATE POLICY "Authenticated users can upload supplier catalogs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'supplier-catalogs' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update supplier catalogs" ON storage.objects FOR UPDATE USING (bucket_id = 'supplier-catalogs' AND auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete supplier catalogs" ON storage.objects FOR DELETE USING (bucket_id = 'supplier-catalogs' AND auth.role() = 'authenticated');
