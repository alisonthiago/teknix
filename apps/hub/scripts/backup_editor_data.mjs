// Backup dos dados do editor (templates, pages, themes) antes de qualquer alteração.
import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const env = fs.readFileSync(path.resolve(__dirname, '../.env'), 'utf8')
const url = env.match(/VITE_SUPABASE_URL=(.+)/)?.[1]?.trim()
const anon = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim()
const supabase = createClient(url, anon)

const stamp = new Date().toISOString().replace(/[:.]/g, '-')
const outDir = path.resolve(__dirname, '../backups')
fs.mkdirSync(outDir, { recursive: true })

const tables = ['templates', 'pages', 'themes']
const backup = {}

for (const table of tables) {
  const { data, error } = await supabase.from(table).select('*').limit(10000)
  if (error) {
    console.log(`⚠️  ${table}: ${error.message}`)
    continue
  }
  backup[table] = data
  console.log(`✓ ${table}: ${data.length} registros`)
}

const file = path.join(outDir, `editor_backup_${stamp}.json`)
fs.writeFileSync(file, JSON.stringify(backup, null, 2))
console.log(`\n✅ Backup salvo em: ${file}`)