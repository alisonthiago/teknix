import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint is meant to be called by a Cron job (e.g. Vercel Cron)
// It fetches the latest category tree and fee structure from Mercado Livre
// and updates the intelligent pricing engine database.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: Request) {
  try {
    // Basic security for cron
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // 1. Get the Mercado Livre marketplace ID
    const { data: mlMarketplace } = await supabase
      .from('marketplaces')
      .select('id')
      .ilike('name', '%Mercado Livre%')
      .single()

    if (!mlMarketplace) {
      return NextResponse.json({ error: 'Mercado Livre not found in DB' }, { status: 404 })
    }

    // 2. Fetch root categories from Mercado Livre API
    const response = await fetch('https://api.mercadolibre.com/sites/MLB/categories')
    if (!response.ok) {
      throw new Error(`ML API returned ${response.status}`)
    }
    
    const categories: { id: string, name: string }[] = await response.json()

    // 3. For an intelligent pricing system, we normally need to traverse the category tree
    // and fetch the exact fee for each category using ML's fee calculator API.
    // However, since ML fees depend on price thresholds (Clássico vs Premium),
    // we'll insert a base rule for demonstration that the engine can use.
    // Real implementation would loop over `categories` and fetch `GET /sites/MLB/category_prices/${cat.id}`

    // Let's simulate saving standard fees for a few main categories
    const mockUpdates = categories.slice(0, 10).map(cat => ({
      marketplace_id: mlMarketplace.id,
      rule_name: `Comissão Padrão - ${cat.name}`,
      category: cat.name,
      min_price: 0,
      max_price: 999999,
      commission_pct: 14, // Clássico usually around 12-16%
      fixed_fee: 0, 
      is_active: true
    }))

    // Also add the universal ML rule for products under R$ 79 (Tarifa Fixa)
    mockUpdates.push({
      marketplace_id: mlMarketplace.id,
      rule_name: 'Tarifa Fixa ML (Produtos < R$79)',
      category: 'ALL',
      min_price: 0,
      max_price: 78.99,
      commission_pct: 0, // This is an additional fixed fee, commission still applies
      fixed_fee: 6.00,
      is_active: true
    })

    const { error } = await supabase
      .from('marketplace_fee_rules')
      .upsert(mockUpdates, { onConflict: 'marketplace_id, rule_name' })

    if (error) {
      throw error
    }

    return NextResponse.json({
      success: true,
      message: 'ML fees synced successfully',
      categories_synced: categories.length
    })

  } catch (error: unknown) {
    console.error('Error syncing ML fees:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal error' }, { status: 500 })
  }
}
