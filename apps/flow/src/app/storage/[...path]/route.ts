import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  const pathParts = resolvedParams.path || []
  const storagePath = pathParts.join('/')

  if (!storagePath) {
    return new NextResponse('Arquivo não especificado', { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
  const fileUrl = `${supabaseUrl}/storage/v1/object/public/${storagePath}`

  try {
    const res = await fetch(fileUrl)

    if (!res.ok) {
      return new NextResponse('Arquivo não encontrado no storage', { status: res.status })
    }

    const contentType = res.headers.get('content-type') || 
      (storagePath.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream')

    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Cache-Control', 'public, max-age=31536000, immutable')
    
    // Se for PDF, abre no navegador inline sob o nosso domínio
    if (storagePath.endsWith('.pdf')) {
      headers.set('Content-Disposition', 'inline')
    }

    return new NextResponse(res.body, {
      status: 200,
      headers
    })
  } catch (err: any) {
    console.error('Proxy storage error:', err)
    return new NextResponse('Erro ao buscar arquivo', { status: 500 })
  }
}
