import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getValidTokenBySellerId } from '@/services/mercadolivre/client'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sellerId = searchParams.get('seller_id') || '470831049'

    // 1. Get valid token
    const token = await getValidTokenBySellerId(sellerId)

    // 2. Query questions from Mercado Livre API
    const res = await fetch(`https://api.mercadolibre.com/questions/search?seller_id=${sellerId}&sort=date_desc&limit=50`, {
      headers: { Authorization: `Bearer ${token}` }
    })

    if (!res.ok) {
      const errData = await res.json()
      return NextResponse.json({ error: errData.message || 'Erro ao buscar perguntas' }, { status: res.status })
    }

    const data = await res.json()
    const questions = data.questions || []

    // 3. Batch resolve item details for products
    const itemIds = Array.from(new Set(questions.map((q: any) => q.item_id).filter(Boolean)))
    const itemMap = new Map<string, any>()

    if (itemIds.length > 0) {
      try {
        const itemRes = await fetch(`https://api.mercadolibre.com/items?ids=${itemIds.join(',')}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (itemRes.ok) {
          const itemsData: any[] = await itemRes.json()
          for (const it of itemsData) {
            if (it.code === 200 && it.body) {
              itemMap.set(it.body.id, {
                title: it.body.title,
                price: it.body.price,
                thumbnail: (it.body.thumbnail || it.body.pictures?.[0]?.url || '').replace('http://', 'https://'),
                permalink: it.body.permalink,
                status: it.body.status
              })
            }
          }
        }
      } catch (e) {
        console.warn('Could not batch fetch item details for questions:', e)
      }
    }

    // 4. Enrich questions
    const enriched = questions.map((q: any) => {
      const itemInfo = itemMap.get(q.item_id) || {
        title: `Anúncio ${q.item_id}`,
        price: 0,
        thumbnail: '/placeholder.png',
        permalink: `https://produto.mercadolivre.com.br/${q.item_id}`,
        status: 'active'
      }

      return {
        id: q.id.toString(),
        text: q.text,
        status: q.status, // UNANSWERED | ANSWERED | CLOSED_UNANSWERED
        date_created: q.date_created,
        answer: q.answer ? {
          text: q.answer.text,
          status: q.answer.status,
          date_created: q.answer.date_created
        } : null,
        buyer_id: q.from?.id,
        item_id: q.item_id,
        item: itemInfo
      }
    })

    const unansweredCount = enriched.filter((q: any) => q.status === 'UNANSWERED').length

    return NextResponse.json({
      total: data.total || enriched.length,
      unansweredCount,
      questions: enriched
    })
  } catch (error: any) {
    console.error('Questions fetch error:', error)
    return NextResponse.json({ error: error.message || 'Erro interno ao buscar perguntas' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { question_id, text, seller_id = '470831049' } = body

    if (!question_id || !text) {
      return NextResponse.json({ error: 'question_id e text são obrigatórios.' }, { status: 400 })
    }

    const token = await getValidTokenBySellerId(seller_id)

    const res = await fetch('https://api.mercadolibre.com/answers', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        question_id: Number(question_id) || question_id,
        text: text.trim()
      })
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.message || 'Erro ao enviar resposta ao Mercado Livre' }, { status: res.status })
    }

    return NextResponse.json({
      success: true,
      message: 'Resposta enviada com sucesso ao Mercado Livre!',
      answer: data
    })
  } catch (error: any) {
    console.error('Answer question error:', error)
    return NextResponse.json({ error: error.message || 'Erro ao enviar resposta' }, { status: 500 })
  }
}
