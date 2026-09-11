import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )
}

export async function GET() {
  try {
    const supabase = getAdminClient()
    const { data: pending, error } = await supabase
      .from('pending_product_matches')
      .select('*, suggested_product:products!suggested_product_id(id, name, sku, brand, model, ean, image_url, stock, cost_purchase)')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json({ pending: pending || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getAdminClient()
    const body = await request.json()
    const { matchId, action, targetProductId } = body

    if (!matchId || !action) {
      return NextResponse.json({ error: 'matchId e action são obrigatórios' }, { status: 400 })
    }

    const { data: match, error: mErr } = await supabase
      .from('pending_product_matches')
      .select('*')
      .eq('id', matchId)
      .single()

    if (mErr || !match) {
      return NextResponse.json({ error: 'Item pendente não encontrado' }, { status: 404 })
    }

    if (action === 'LINK') {
      const finalProductId = targetProductId || match.suggested_product_id
      if (!finalProductId) {
        return NextResponse.json({ error: 'targetProductId é necessário para vincular' }, { status: 400 })
      }

      // Cria ou vincula o anúncio a este produto central
      const { data: existingListing } = await supabase
        .from('marketplace_listings')
        .select('id')
        .or(`external_id.eq.${match.external_id},external_listing_id.eq.${match.external_id}`)
        .maybeSingle()

      if (existingListing) {
        await supabase
          .from('marketplace_listings')
          .update({
            product_id: finalProductId,
            price: match.price,
            stock_synced: match.stock,
            last_synced_at: new Date().toISOString()
          })
          .eq('id', existingListing.id)
      } else {
        await supabase
          .from('marketplace_listings')
          .insert({
            product_id: finalProductId,
            channel: match.channel,
            marketplace_id: match.channel,
            marketplace_account_id: match.marketplace_account_id,
            external_id: match.external_id,
            external_listing_id: match.external_id,
            title: match.title,
            price: match.price,
            stock: match.stock,
            stock_synced: match.stock,
            thumbnail_url: match.thumbnail_url,
            permalink: match.permalink,
            catalog_product_id: match.catalog_product_id,
            status: 'active',
            last_synced_at: new Date().toISOString(),
            last_sync_origin: 'MANUAL_LINK'
          })
      }

      await supabase
        .from('pending_product_matches')
        .update({
          status: 'RESOLVED',
          resolution_action: 'LINKED',
          resolved_at: new Date().toISOString()
        })
        .eq('id', matchId)

      return NextResponse.json({ success: true, message: `Anúncio vinculado ao produto ${finalProductId}` })
    }

    if (action === 'CREATE_NEW') {
      // Cria um novo produto central apenas com autorização explícita do operador
      const generatedSku = match.seller_sku || `PRD-${Date.now().toString().slice(-6)}`
      const { data: newProd, error: pErr } = await supabase
        .from('products')
        .insert({
          sku: generatedSku,
          name: match.title,
          brand: match.brand || 'TEKNIX',
          model: match.model || '—',
          ean: match.gtin || null,
          image_url: match.thumbnail_url,
          stock: match.stock || 0,
          cost_purchase: Math.round(match.price * 0.6 * 100) / 100,
          status: 'ACTIVE'
        })
        .select('id')
        .single()

      if (pErr) throw pErr

      // Cria a listing vinculada ao novo produto
      await supabase
        .from('marketplace_listings')
        .insert({
          product_id: newProd.id,
          channel: match.channel,
          marketplace_id: match.channel,
          marketplace_account_id: match.marketplace_account_id,
          external_id: match.external_id,
          external_listing_id: match.external_id,
          title: match.title,
          price: match.price,
          stock: match.stock,
          stock_synced: match.stock,
          thumbnail_url: match.thumbnail_url,
          permalink: match.permalink,
          catalog_product_id: match.catalog_product_id,
          status: 'active',
          last_synced_at: new Date().toISOString(),
          last_sync_origin: 'CREATED_NEW'
        })

      await supabase
        .from('pending_product_matches')
        .update({
          status: 'RESOLVED',
          resolution_action: 'CREATED_NEW',
          resolved_at: new Date().toISOString()
        })
        .eq('id', matchId)

      return NextResponse.json({ success: true, productId: newProd.id, message: 'Novo produto criado e anúncio vinculado.' })
    }

    if (action === 'IGNORE') {
      await supabase
        .from('pending_product_matches')
        .update({
          status: 'IGNORED',
          resolution_action: 'IGNORED',
          resolved_at: new Date().toISOString()
        })
        .eq('id', matchId)

      return NextResponse.json({ success: true, message: 'Correspondência ignorada' })
    }

    return NextResponse.json({ error: 'Ação desconhecida' }, { status: 400 })
  } catch (err: any) {
    console.error('[Match Action Error]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
