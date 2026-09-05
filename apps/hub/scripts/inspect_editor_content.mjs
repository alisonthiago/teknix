// Inspeciona o conteúdo (schema/sections) de pages e templates para detectar conteúdo antigo.
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const env = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8')
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim()
const anon = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim()
const supabase = createClient(url, anon)

const KEYWORDS = ['apple', 'vision pro', 'iphone', 'macbook', 'marquee', 'carrossel', 'faq com imagem', 'diferencial', 'modelo3', 'modelo 5', 'editorial light', 'industrial pro', 'search express']

function scan(obj, hits, pathStr = '') {
  if (obj == null) return
  if (typeof obj === 'string') {
    const t = obj.toLowerCase()
    for (const k of KEYWORDS) {
      if (t.includes(k)) hits.push(`${pathStr} => "${obj.slice(0, 80)}" [${k}]`)
    }
  } else if (Array.isArray(obj)) {
    obj.forEach((v, i) => scan(v, hits, `${pathStr}[${i}]`))
  } else if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) scan(v, hits, `${pathStr}.${k}`)
  }
}

async function inspect(table, label) {
  const { data, error } = await supabase.from(table).select('*').limit(1000)
  if (error) { console.log(`\n=== ${label}: erro ${error.message}`); return }
  console.log(`\n=== ${label} (${table}) ===`)
  for (const row of data) {
    const name = row.name || row.title || row.slug || row.id
    const hits = []
    scan(row, hits)
    console.log(`\n▶ [${row.id}] ${name}`)
    if (hits.length === 0) {
      console.log('   ✓ sem conteúdo antigo detectado')
    } else {
      console.log(`   🟠 ${hits.length} ocorrência(s) de conteúdo antigo:`)
      hits.slice(0, 15).forEach(h => console.log(`     - ${h}`))
    }
  }
}

await inspect('pages', 'PÁGINAS')
await inspect('templates', 'TEMPLATES')
await inspect('themes', 'THEMES')
console.log('\n✅ Inspeção concluída.')