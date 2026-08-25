/**
 * Script de análise do banco de dados Supabase
 * Execute com: npx tsx analyze-db.ts
 *
 * IMPORTANTE: Este script apenas LE dados, não modifica nada.
 */

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

// Carregar variáveis de ambiente do arquivo .env
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env')
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env não encontrado!')
    console.error('Copie .env.example para .env e adicione suas credenciais.')
    process.exit(1)
  }

  const envContent = fs.readFileSync(envPath, 'utf-8')
  const envVars: Record<string, string> = {}

  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim()
    }
  })

  return envVars
}

async function analyze() {
  console.log('=== ANÁLISE DO BANCO DE DADOS SUPABASE ===\n')

  const env = loadEnv()
  const supabaseUrl = env.VITE_SUPABASE_URL
  const supabaseKey = env.VITE_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis de ambiente não configuradas!')
    console.error('Verifique VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

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
    'transactions',
    'addresses',
    'wishlists',
    'reviews'
  ]

  const results: Array<{
    name: string
    exists: boolean
    rowCount: number
    columns: string[]
    error?: string
  }> = []

  for (const tableName of tables) {
    process.stdout.write(`Verificando ${tableName}... `)

    try {
      // Verificar se a tabela existe e contar registros
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })

      if (countError) {
        console.log('❌ Não existe')
        results.push({
          name: tableName,
          exists: false,
          rowCount: 0,
          columns: [],
          error: countError.message
        })
        continue
      }

      // Buscar amostra para ver estrutura
      const { data: sample, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (sampleError) {
        console.log('⚠️  Existe mas sem acesso')
        results.push({
          name: tableName,
          exists: true,
          rowCount: count || 0,
          columns: [],
          error: sampleError.message
        })
        continue
      }

      const columns = sample && sample.length > 0 ? Object.keys(sample[0]) : []

      console.log(`✅ ${count || 0} registros, ${columns.length} colunas`)
      results.push({
        name: tableName,
        exists: true,
        rowCount: count || 0,
        columns
      })

    } catch (err) {
      console.log(`❌ Erro: ${err}`)
      results.push({
        name: tableName,
        exists: false,
        rowCount: 0,
        columns: [],
        error: String(err)
      })
    }
  }

  // Resumo
  console.log('\n=== RESUMO ===')
  console.log(`Tabelas encontradas: ${results.filter(r => r.exists).length}`)
  console.log(`Tabelas não encontradas: ${results.filter(r => !r.exists).length}`)

  // Tabelas com dados
  const tablesWithData = results.filter(r => r.exists && r.rowCount > 0)
  if (tablesWithData.length > 0) {
    console.log('\n=== TABELAS COM DADOS ===')
    tablesWithData.forEach(t => {
      console.log(`  ${t.name}: ${t.rowCount} registros`)
      if (t.columns.length > 0) {
        console.log(`    Colunas: ${t.columns.join(', ')}`)
      }
    })
  }

  // Possíveis problemas
  const tablesWithErrors = results.filter(r => r.exists && r.error)
  if (tablesWithErrors.length > 0) {
    console.log('\n=== POSSÍVEIS PROBLEMAS DE PERMISSÃO (RLS) ===')
    tablesWithErrors.forEach(t => {
      console.log(`  ${t.name}: ${t.error}`)
    })
  }

  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    tables: results,
    summary: {
      total: results.length,
      found: results.filter(r => r.exists).length,
      notFound: results.filter(r => !r.exists).length,
      withData: tablesWithData.length,
      withPermissionIssues: tablesWithErrors.length
    }
  }

  fs.writeFileSync(
    path.resolve(process.cwd(), 'database-report.json'),
    JSON.stringify(report, null, 2)
  )

  console.log('\n✅ Relatório salvo em database-report.json')
}

analyze().catch(console.error)
