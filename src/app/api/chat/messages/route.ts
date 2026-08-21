import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return createClient(url, key)
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversation_id')

    if (!conversationId) {
      return NextResponse.json({ messages: [] })
    }

    const supabase = getAdminClient()

    // Canal "Geral" = feed global de TODAS as mensagens
    if (conversationId === 'conv-geral') {
      const { data, error } = await supabase
        .from('internal_messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(500)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ messages: data || [] })
    }

    // Outros canais: filtrar por conversation_id
    const { data, error } = await supabase
      .from('internal_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ messages: data || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getAdminClient()

    // Valida se o sender_id é um UUID válido para evitar erros de sintaxe do Postgres
    let senderId = body.sender_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!senderId || !uuidRegex.test(senderId)) {
      // Se não for UUID válido (ex: 'user-current'), usa UUID padrão zerado seguro
      senderId = '00000000-0000-0000-0000-000000000000'
    }

    const { data, error } = await supabase
      .from('internal_messages')
      .insert({
        id: body.id || `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        conversation_id: body.conversation_id,
        sender_id: senderId,
        sender_name: body.sender_name || 'Usuário',
        sender_photo: body.sender_photo || null,
        content: body.content || '',
        message_type: body.message_type || 'TEXT',
        metadata: body.metadata || {},
        reply_to: body.reply_to || null,
        created_at: body.created_at || new Date().toISOString()
      })

    if (error) {
      console.error('[API /api/chat/messages POST Error]:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: data })
  } catch (err: any) {
    console.error('[API /api/chat/messages POST Exception]:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
