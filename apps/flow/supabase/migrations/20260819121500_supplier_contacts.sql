-- Create supplier_contacts table
CREATE TABLE IF NOT EXISTS public.supplier_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  name TEXT,
  phone TEXT NOT NULL,
  is_whatsapp BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS setup
ALTER TABLE public.supplier_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable ALL access for authenticated on supplier_contacts" ON public.supplier_contacts;
CREATE POLICY "Enable ALL access for authenticated on supplier_contacts" ON public.supplier_contacts FOR ALL USING (auth.role() = 'authenticated');
