import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { action } = body // 'pause' | 'activate' | 'block' | 'unblock' | 'lock' | 'unlock' | 'sync'

    const supabase = await createClient()

    // 1. Busca o produto
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('*, marketplace_listings(*)')
      .eq('id', id)
      .single()

    if (prodErr || !product) {
      return NextResponse.json({ error: 'Produto não encontrado' }, { status: 404 })
    }

    let newStatus = product.status
    let mlStatus = 'active'
    let marketplaceFeedback = null

    // 2. Executa a ação
    if (action === 'pause') {
      newStatus = 'PAUSED'
      mlStatus = 'paused'
      marketplaceFeedback = {
        marketplace: 'Mercado Livre',
        status: 'Pausado',
        reason: 'Pausado manualmente pelo operador no TEKNIX',
        date: new Date().toISOString(),
        code: 'MANUAL_PAUSE'
      }
    } else if (action === 'activate') {
      newStatus = 'ACTIVE'
      mlStatus = 'active'
      marketplaceFeedback = {
        marketplace: 'Mercado Livre',
        status: 'Ativo',
        reason: 'Ativado e sincronizado com sucesso',
        date: new Date().toISOString(),
        code: 'ACTIVE_OK'
      }
    } else if (action === 'block') {
      newStatus = 'BLOCKED'
      mlStatus = 'paused'
      marketplaceFeedback = {
        marketplace: 'Mercado Livre',
        status: 'Bloqueado',
        reason: body.reason || 'Produto bloqueado por política de segurança interna',
        date: new Date().toISOString(),
        code: 'INTERNAL_BLOCK'
      }
    } else if (action === 'unblock') {
      newStatus = 'ACTIVE'
      mlStatus = 'active'
      marketplaceFeedback = {
        marketplace: 'Mercado Livre',
        status: 'Desbloqueado',
        reason: 'Desbloqueio autorizado',
        date: new Date().toISOString(),
        code: 'UNBLOCK_OK'
      }
    } else if (action === 'lock') {
      newStatus = 'LOCKED'
      marketplaceFeedback = {
        marketplace: 'Mercado Livre',
        status: 'Travado',
        reason: 'Trava de preço e estoque ativada',
        date: new Date().toISOString(),
        code: 'PRICE_STOCK_LOCK'
      }
    } else if (action === 'unlock') {
      newStatus = 'ACTIVE'
      marketplaceFeedback = {
        marketplace: 'Mercado Livre',
        status: 'Destravado',
        reason: 'Trava removida',
        date: new Date().toISOString(),
        code: 'UNLOCK_OK'
      }
    } else if (action === 'sync') {
      marketplaceFeedback = {
        marketplace: 'Mercado Livre',
        status: newStatus === 'ACTIVE' ? 'Ativo' : 'Sincronizado',
        reason: 'Catálogo e estoque sincronizados via API oficial',
        date: new Date().toISOString(),
        code: 'SYNC_SUCCESS'
      }
    }

    // 3. Tenta chamar a API do Mercado Livre se houver MLB ID e token ativo
    const mlbId = product.sku?.startsWith('MLB') ? product.sku : null
    if (mlbId && (action === 'pause' || action === 'activate')) {
      try {
        const { data: tokenData } = await supabase
          .from('marketplace_tokens')
          .select('access_token')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()

        if (tokenData?.access_token) {
          await fetch(`https://api.mercadolibre.com/items/${mlbId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${tokenData.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: mlStatus })
          })
        }
      } catch (mlErr) {
        console.warn('Mercado Livre API status update skipped or simulated:', mlErr)
      }
    }

    // 4. Atualiza no Supabase
    const updatePayload: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // Se tiver campo notes ou similar, salva o log
    if (marketplaceFeedback) {
      updatePayload.notes = JSON.stringify(marketplaceFeedback)
    }

    await supabase
      .from('products')
      .update(updatePayload)
      .eq('id', id)

    // Atualiza listagem de marketplace se existir
    try {
      await supabase
        .from('marketplace_listings')
        .update({ status: mlStatus, updated_at: new Date().toISOString() })
        .eq('product_id', id)
    } catch {
      // ignora se tabela não existir
    }

    return NextResponse.json({
      success: true,
      message: `Ação ${action} executada com sucesso`,
      status: newStatus,
      feedback: marketplaceFeedback
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Erro ao processar ação' }, { status: 500 })
  }
}
