// Auditoria: lista templates, pages e themes do editor para identificar conteúdo antigo.
// NÃO apaga nada — apenas lê e gera um relatório.
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')
const env = fs.readFileSync(envPath, 'utf8')
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim()
const anon = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim()

if (!url || !anon) {
  console.error('❌ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados em .env')
  process.exit(1)
}

const supabase = createClient(url, anon)

const KEYWORDS_ANTIGOS = [
  'apple', 'vision pro', 'iphone', 'macbook', 'modelo3', 'modelo 5', 'modelo5',
  'editorial light', 'industrial pro', 'search express', 'marquee', 'carrossel',
  'faq com imagem', 'diferencial', 'landing page de campanha', 'store oficial',
  'header oficial teknix (apple', 'home oficial', 'oferta'
]

function ehAntigo(texto = '') {
  const t = texto.toLowerCase()
  return KEYWORDS_ANTIGOS.some(k => t.includes(k))
}

async function auditTable(table, label) {
  const { data, error } = await supabase.from(table).select('*').limit(1000)
  if (error) {
    console.log(`\n=== ${label} (${table}) ===`)
    console.log(`⚠️  Erro ao ler: ${error.message}`)
    return []
  }
  console.log(`\n=== ${label} (${table}) — ${data.length} registros ===`)
  for (const row of data) {
    const name = row.name || row.title || row.slug || row.id
    const flag = ehAntigo(name) ? ' 🟠 ANTIGO' : ''
    console.log(`  - [${row.id}] ${name}${flag}`)
  }
  return data
}

console.log('🔍 AUDITORIA DE DADOS DO EDITOR TEKNIX\n')
await auditTable('templates', 'TEMPLATES')
await auditTable('pages', 'PÁGINAS')
await auditTable('themes', 'THEMES')
console.log('\n✅ Auditoria concluída.')