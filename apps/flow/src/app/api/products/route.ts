import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const DEFAULT_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3ByZnpmbmZmb29xbWZiZW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk0Mzc5MSwiZXhwIjoyMTAyNTE5NzkxfQ.mv6Asc4U7lVVFtTtBhWyVm_R5jW2ThKocGI7WTRXIts'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || DEFAULT_SERVICE_KEY
  )
}

export async function GET() {
  try {
    const supabase = getAdminClient()
    const { data, error } = await supabase
      .from('products')
      .select('*, store_meta:product_store_metadata(*)')
      .order('name', { ascending: true })

    if (error) {
      console.error('[API /api/products] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Normaliza os campos para consumo no FLOW e HUB
    const formatted = (data || []).map(p => {
      const meta = Array.isArray(p.store_meta) ? p.store_meta[0] : p.store_meta
      return {
        ...p,
        price: p.site_price || meta?.sale_price || p.cost_purchase || 0,
        is_site_published: p.is_site_published ?? meta?.published ?? true,
        store_meta: meta || null
      }
    })

    return NextResponse.json(formatted)
  } catch (err: any) {
    console.error('[API /api/products] Exception:', err)
    return NextResponse.json({ error: err.message || 'Erro ao carregar produtos' }, { status: 500 })
  }
}
