import { supabase } from './supabase'

interface TableInfo {
  name: string
  exists: boolean
  rowCount?: number
  columns?: string[]
  error?: string
}

export async function analyzeDatabaseSchema() {
  console.log('=== ANÁLISE DO SCHEMA DO SUPABASE ===\n')

  const tables = [
    'products',
    'categories',
    'customers',
    'orders',
    'order_items',
    'users',
    'profiles',
    'stock',
    'inventory',
    'payments',
    'transactions'
  ]

  const results: TableInfo[] = []

  for (const tableName of tables) {
    console.log(`Verificando tabela: ${tableName}`)

    try {
      const { error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (error) {
        console.log(`  ❌ Erro: ${error.message}`)
        results.push({
          name: tableName,
          exists: false,
          error: error.message
        })
      } else {
        console.log(`  ✅ Existe - ${count || 0} registros`)

        // Get sample data to understand structure
        const { data: sampleData } = await supabase
          .from(tableName)
          .select('*')
          .limit(1)

        const columns = sampleData && sampleData.length > 0
          ? Object.keys(sampleData[0])
          : []

        if (columns.length > 0) {
          console.log(`  📋 Colunas: ${columns.join(', ')}`)
        }

        results.push({
          name: tableName,
          exists: true,
          rowCount: count || 0,
          columns
        })
      }
    } catch (err) {
      console.log(`  ❌ Erro inesperado: ${err}`)
      results.push({
        name: tableName,
        exists: false,
        error: 'Unexpected error'
      })
    }
  }

  console.log('\n=== RESUMO ===')
  console.log('Tabelas encontradas:', results.filter(r => r.exists).length)
  console.log('Tabelas não encontradas:', results.filter(r => !r.exists).length)

  return results
}
