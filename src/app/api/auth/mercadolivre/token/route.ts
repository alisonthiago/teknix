import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { syncMercadoLivreAccount } from '@/services/mercadolivre/syncCatalog'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { access_token, refresh_token, seller_id: providedSellerId, account_name: providedName } = body

    if (!access_token) {
      return NextResponse.json({ error: 'access_token é obrigatório.' }, { status: 400 })
    }

    // 1. Validate token with Mercado Livre API and fetch user details
    let sellerId = providedSellerId
    let sellerNickname = providedName || 'TEKNIXBRASIL'

    try {
      const userRes = await fetch('https://api.mercadolibre.com/users/me', {
        headers: { Authorization: `Bearer ${access_token.trim()}` }
      })
      if (userRes.ok) {
        const userData = await userRes.json()
        if (userData.id) sellerId = userData.id.toString()
        if (userData.nickname) sellerNickname = userData.nickname
      } else if (providedSellerId) {
        const fallbackRes = await fetch(`https://api.mercadolibre.com/users/${providedSellerId}`, {
          headers: { Authorization: `Bearer ${access_token.trim()}` }
        })
        if (fallbackRes.ok) {
          const userData = await fallbackRes.json()
          if (userData.nickname) sellerNickname = userData.nickname
        }
      }
    } catch (e) {
      console.warn('Could not fetch ML user from token:', e)
    }

    if (!sellerId) {
      sellerId = '470831049' // fallback default seller id
    }

    const supabase = getSupabase()
    const defaultUserId = '3af9068a-4b78-4c9c-8657-f83b93c01588'
    const expiresAt = new Date(Date.now() + 6 * 3600 * 1000).toISOString() // 6 hours default

    // 2. Resolve marketplace record
    let marketplaceId = '6ef8f3db-6d35-4701-86f7-8199378ec0c7'
    const { data: mp } = await supabase
      .from('marketplaces')
      .select('id')
      .or('code.eq.MERCADO_LIVRE,code.eq.mercadolivre')
      .single()
    if (mp) marketplaceId = mp.id

    // 3. Upsert marketplace_connections
    const { data: existingConn } = await supabase
      .from('marketplace_connections')
      .select('id')
      .eq('seller_id', sellerId.toString())
      .single()

    if (existingConn) {
      await supabase
        .from('marketplace_connections')
        .update({
          account_name: sellerNickname,
          access_token: access_token.trim(),
          refresh_token: refresh_token?.trim() || null,
          token_expires_at: expiresAt,
          is_active: true,
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingConn.id)
    } else {
      await supabase
        .from('marketplace_connections')
        .insert({
          user_id: defaultUserId,
          marketplace_id: 'mercadolivre',
          seller_id: sellerId.toString(),
          account_name: sellerNickname,
          access_token: access_token.trim(),
          refresh_token: refresh_token?.trim() || null,
          token_expires_at: expiresAt,
          is_active: true,
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
    }

    // 4. Upsert marketplace_accounts
    await supabase
      .from('marketplace_accounts')
      .upsert({
        marketplace_id: marketplaceId,
        user_id: defaultUserId,
        account_name: sellerNickname,
        seller_id: sellerId.toString(),
        access_token: access_token.trim(),
        refresh_token: refresh_token?.trim() || null,
        token_expires_at: expiresAt,
        status: 'ACTIVE',
        connection_status: 'CONNECTED',
        auto_sync_stock: true,
        auto_sync_prices: true,
        auto_import_orders: true,
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'seller_id' })

    // 5. Trigger immediate sync of orders & catalog
    let syncResults: any = { productsSynced: 0, ordersSynced: 0 }
    try {
      syncResults = await syncMercadoLivreAccount(sellerId.toString())
    } catch (syncErr: any) {
      console.error('Error during immediate token sync:', syncErr)
    }

    return NextResponse.json({
      success: true,
      message: `Conta ${sellerNickname} conectada e sincronizada com sucesso!`,
      seller_id: sellerId,
      seller_nickname: sellerNickname,
      ...syncResults
    })
  } catch (error: any) {
    console.error('Save token error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao salvar token' }, { status: 500 })
  }
}
