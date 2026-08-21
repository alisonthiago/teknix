import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Testar insert com payload mínimo para descobrir as colunas que existem
  const { data: test, error: testErr } = await supabase
    .from('ml_listings')
    .select('id')
    .limit(1)

  if (testErr && testErr.message.includes('ml_listings')) {
    // Tabela não existe — precisa ser criada via SQL Editor do Supabase
    return NextResponse.json({
      status: 'MIGRATION_NEEDED',
      message: 'Tabela ml_listings não existe. Execute a migration via Supabase SQL Editor.',
      migrationFile: '/supabase/migrations/20260821_create_ml_listings_table.sql'
    })
  }

  return NextResponse.json({
    status: 'OK',
    message: 'Tabela ml_listings já existe.',
    data: test
  })
}
