import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  return createClient(url, key)
}

export async function GET(req: NextRequest) {
  try {
    const supabase = getAdminClient()
    
    // Busca conversas e profiles
    const [convRes, profRes, msgRes] = await Promise.all([
      supabase.from('internal_conversations').select('*').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, name, email, role, avatar_url, photo_url, status').order('name'),
      supabase.from('internal_messages').select('conversation_id, content, sender_name, created_at').order('created_at', { ascending: false }).limit(200)
    ])

    return NextResponse.json({
      conversations: convRes.data || [],
      profiles: profRes.data || [],
      recentMessages: msgRes.data || []
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const supabase = getAdminClient()

    const { data, error } = await supabase
      .from('internal_conversations')
      .upsert({
        id: body.id,
        type: body.type || 'GROUP',
        name: body.name,
        description: body.description || null,
        members: body.members || [],
        created_at: body.created_at || new Date().toISOString()
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, conversation: data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
