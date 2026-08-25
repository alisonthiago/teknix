import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// INTERNAL ONLY - Remove or protect this endpoint after migration
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const statements = [
    // ml_listings - tabela principal de anúncios do Mercado Livre
    `CREATE TABLE IF NOT EXISTS public.ml_listings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      marketplace_id UUID,
      seller_id TEXT NOT NULL,
      external_listing_id TEXT NOT NULL,
      product_id UUID,
      title TEXT,
      status TEXT DEFAULT 'active',
      listing_type TEXT,
      condition TEXT DEFAULT 'new',
      permalink TEXT,
      category_id TEXT,
      currency_id TEXT DEFAULT 'BRL',
      sold_quantity INTEGER DEFAULT 0,
      price NUMERIC(10,2),
      base_price NUMERIC(10,2),
      original_price NUMERIC(10,2),
      promo_price NUMERIC(10,2),
      price_synced_from_endpoint BOOLEAN DEFAULT false,
      stock INTEGER,
      description TEXT,
      thumbnail_url TEXT,
      catalog_product_id TEXT,
      user_product_id TEXT,
      family_id TEXT,
      brand TEXT,
      model TEXT,
      gtin TEXT,
      weight TEXT,
      dimensions TEXT,
      sync_status TEXT DEFAULT 'PENDING',
      last_synced_at TIMESTAMPTZ,
      last_sync_error TEXT,
      sync_attempts INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      UNIQUE (seller_id, external_listing_id)
    )`,
    // ml_listing_images
    `CREATE TABLE IF NOT EXISTS public.ml_listing_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id UUID NOT NULL REFERENCES public.ml_listings(id) ON DELETE CASCADE,
      external_picture_id TEXT,
      url TEXT NOT NULL,
      size TEXT,
      max_size TEXT,
      is_primary BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      UNIQUE (listing_id, external_picture_id)
    )`,
    // ml_listing_variations
    `CREATE TABLE IF NOT EXISTS public.ml_listing_variations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id UUID NOT NULL REFERENCES public.ml_listings(id) ON DELETE CASCADE,
      external_variation_id TEXT NOT NULL,
      seller_sku TEXT,
      price NUMERIC(10,2),
      stock INTEGER,
      attributes JSONB DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
      UNIQUE (listing_id, external_variation_id)
    )`,
    // Índices
    `CREATE INDEX IF NOT EXISTS ml_listings_seller_id_idx ON public.ml_listings(seller_id)`,
    `CREATE INDEX IF NOT EXISTS ml_listings_external_id_idx ON public.ml_listings(external_listing_id)`,
    `CREATE INDEX IF NOT EXISTS ml_listings_sync_status_idx ON public.ml_listings(sync_status)`,
    // RLS
    `ALTER TABLE public.ml_listings ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ml_listings' AND policyname='ml_listings_access') THEN
        CREATE POLICY "ml_listings_access" ON public.ml_listings FOR ALL TO authenticated USING (true);
      END IF;
    END $$`,
    `ALTER TABLE public.ml_listing_images ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ml_listing_images' AND policyname='ml_listing_images_access') THEN
        CREATE POLICY "ml_listing_images_access" ON public.ml_listing_images FOR ALL TO authenticated USING (true);
      END IF;
    END $$`,
    `ALTER TABLE public.ml_listing_variations ENABLE ROW LEVEL SECURITY`,
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='ml_listing_variations' AND policyname='ml_listing_variations_access') THEN
        CREATE POLICY "ml_listing_variations_access" ON public.ml_listing_variations FOR ALL TO authenticated USING (true);
      END IF;
    END $$`,
  ]

  const results: Array<{ sql: string; ok: boolean; error?: string }> = []

  for (const sql of statements) {
    const { error } = await supabase.rpc('exec_sql_migration', { sql_text: sql })
    if (error && !error.message.includes('already exists') && !error.message.includes('duplicate')) {
      results.push({ sql: sql.substring(0, 60), ok: false, error: error.message })
    } else {
      results.push({ sql: sql.substring(0, 60), ok: true })
    }
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() })
}
