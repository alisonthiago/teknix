import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Configuração segura do Supabase ausente no servidor.')
  return createClient(url, key)
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
    }

    const supabase = getAdminClient()
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Nome sanitizado e único
    const cleanName = (file.name || 'imagem.png').replace(/[^a-zA-Z0-9.-]/g, '_')
    const fileName = `chat/${Date.now()}_${Math.random().toString(36).substring(2, 7)}_${cleanName}`

    const { data, error } = await supabase.storage
      .from('media')
      .upload(fileName, buffer, {
        contentType: file.type || 'image/png',
        upsert: true
      })

    if (error) {
      console.error('[ChatUpload] Erro no Supabase Storage:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(fileName)

    return NextResponse.json({
      url: urlData.publicUrl,
      fileName: file.name,
      fileSize: file.size,
      contentType: file.type
    })
  } catch (err: any) {
    console.error('[ChatUpload] Erro:', err)
    return NextResponse.json({ error: err.message || 'Erro ao processar upload' }, { status: 500 })
  }
}
