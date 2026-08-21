import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const supplierId = formData.get('supplierId') as string | null
    const customTitle = formData.get('title') as string | null

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 })
    }

    if (!supplierId) {
      return NextResponse.json({ error: 'ID do fornecedor é obrigatório.' }, { status: 400 })
    }

    // Limit check: 50MB
    const MAX_SIZE = 50 * 1024 * 1024 // 50MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'O arquivo excede o limite máximo permitido de 50MB.' }, { status: 400 })
    }

    const supabase = getSupabase()
    const buffer = Buffer.from(await file.arrayBuffer())

    // Determine type & extension
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    const fileExt = file.name.split('.').pop() || (isPdf ? 'pdf' : 'jpg')
    const fileName = `${supplierId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('supplier-catalogs')
      .upload(fileName, buffer, {
        contentType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
        upsert: true
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: `Erro no Supabase Storage: ${uploadError.message}` }, { status: 500 })
    }

    const { data: urlData } = supabase.storage
      .from('supplier-catalogs')
      .getPublicUrl(fileName)

    const title = (customTitle || file.name.replace(/\.[^/.]+$/, '')).trim()

    // Insert record in supplier_catalogs
    const { data: catalogRecord, error: dbError } = await supabase
      .from('supplier_catalogs')
      .insert({
        supplier_id: supplierId,
        title,
        url: urlData.publicUrl,
        type: isPdf ? 'PDF' : 'IMAGEM'
      })
      .select()
      .single()

    if (dbError) {
      console.error('DB Insert error:', dbError)
      return NextResponse.json({ error: `Erro ao salvar catálogo no banco: ${dbError.message}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Catálogo enviado com sucesso!',
      catalog: catalogRecord
    })
  } catch (error: any) {
    console.error('Catalog upload error:', error)
    return NextResponse.json({ error: error.message || 'Erro interno ao processar upload.' }, { status: 500 })
  }
}
