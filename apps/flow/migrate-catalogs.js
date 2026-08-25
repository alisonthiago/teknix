const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to database.");

    await client.query(`
      ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS logo_url TEXT;

      CREATE TABLE IF NOT EXISTS public.supplier_catalogs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        supplier_id UUID REFERENCES public.suppliers(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('PDF', 'LINK')),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      ALTER TABLE public.supplier_catalogs ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Enable ALL access for authenticated on supplier_catalogs" ON public.supplier_catalogs;
      CREATE POLICY "Enable ALL access for authenticated on supplier_catalogs" ON public.supplier_catalogs FOR ALL USING (auth.role() = 'authenticated');

      INSERT INTO storage.buckets (id, name, public) VALUES ('supplier-logos', 'supplier-logos', true) ON CONFLICT (id) DO NOTHING;
      INSERT INTO storage.buckets (id, name, public) VALUES ('supplier-catalogs', 'supplier-catalogs', true) ON CONFLICT (id) DO NOTHING;

      DROP POLICY IF EXISTS "Public Access for Supplier Logos" ON storage.objects;
      CREATE POLICY "Public Access for Supplier Logos" ON storage.objects FOR SELECT USING (bucket_id = 'supplier-logos');
      
      DROP POLICY IF EXISTS "Authenticated users can upload supplier logos" ON storage.objects;
      CREATE POLICY "Authenticated users can upload supplier logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'supplier-logos' AND auth.role() = 'authenticated');
      
      DROP POLICY IF EXISTS "Authenticated users can update supplier logos" ON storage.objects;
      CREATE POLICY "Authenticated users can update supplier logos" ON storage.objects FOR UPDATE USING (bucket_id = 'supplier-logos' AND auth.role() = 'authenticated');
      
      DROP POLICY IF EXISTS "Authenticated users can delete supplier logos" ON storage.objects;
      CREATE POLICY "Authenticated users can delete supplier logos" ON storage.objects FOR DELETE USING (bucket_id = 'supplier-logos' AND auth.role() = 'authenticated');

      DROP POLICY IF EXISTS "Public Access for Supplier Catalogs" ON storage.objects;
      CREATE POLICY "Public Access for Supplier Catalogs" ON storage.objects FOR SELECT USING (bucket_id = 'supplier-catalogs');
      
      DROP POLICY IF EXISTS "Authenticated users can upload supplier catalogs" ON storage.objects;
      CREATE POLICY "Authenticated users can upload supplier catalogs" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'supplier-catalogs' AND auth.role() = 'authenticated');
      
      DROP POLICY IF EXISTS "Authenticated users can update supplier catalogs" ON storage.objects;
      CREATE POLICY "Authenticated users can update supplier catalogs" ON storage.objects FOR UPDATE USING (bucket_id = 'supplier-catalogs' AND auth.role() = 'authenticated');
      
      DROP POLICY IF EXISTS "Authenticated users can delete supplier catalogs" ON storage.objects;
      CREATE POLICY "Authenticated users can delete supplier catalogs" ON storage.objects FOR DELETE USING (bucket_id = 'supplier-catalogs' AND auth.role() = 'authenticated');
    `);
    
    console.log("Migration successful.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

run();
