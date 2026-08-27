/* ==========================================================================
   TEKNIX — APLICAR MIGRATION 005 VIA SCRIPT NODE.JS
   Execute: node apps/hub/supabase/apply_005_integrations.mjs
   ========================================================================== */

// Lê as variáveis de ambiente do .env do hub
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Carrega .env do hub
let supabaseUrl = ''
let supabaseKey = ''

try {
  const envPath = join(__dirname, '..', '.env')
  const env = readFileSync(envPath, 'utf8')
  const urlMatch = env.match(/VITE_SUPABASE_URL=(.+)/)
  const keyMatch = env.match(/VITE_SUPABASE_ANON_KEY=(.+)/)
  supabaseUrl = urlMatch?.[1]?.trim() || ''
  supabaseKey = keyMatch?.[1]?.trim() || ''
} catch (e) {
  console.error('❌ Não foi possível ler apps/hub/.env')
  process.exit(1)
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontrados.')
  process.exit(1)
}

const migrationSql = readFileSync(join(__dirname, 'migrations', '005_integrations_secure.sql'), 'utf8')

console.log('🚀 Aplicando Migration 005 — TEKNIX Integration Security Layer')
console.log(`📡 Supabase: ${supabaseUrl}`)
console.log('─'.repeat(60))

// Usa a API REST do Supabase para executar SQL
// NOTA: Isso requer a chave service_role, não a anon_key.
// Se você tiver a service_role key, defina SERVICE_ROLE_KEY no .env
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!serviceKey) {
  console.log(`
⚠️  ATENÇÃO: Esta migration requer a chave SERVICE_ROLE para criar tabelas.

Como aplicar manualmente no Supabase Dashboard:
1. Acesse: ${supabaseUrl.replace('https://', 'https://supabase.com/dashboard/project/')}
2. Vá em: SQL Editor
3. Cole e execute o conteúdo do arquivo:
   apps/hub/supabase/migrations/005_integrations_secure.sql

Essa migration cria:
  ✅ integration_configs  — Configurações de provedor (protegidas por RLS)
  ✅ webhook_events       — Idempotência de webhooks (persistente no banco)
  ✅ integration_logs     — Log persistente de todas as ações
  ✅ Seeds dos provedores padrão (sem credenciais — elas são inseridas via painel HUB)
`)
  process.exit(0)
}

// Se tiver service key, aplica diretamente
const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': serviceKey,
    'Authorization': `Bearer ${serviceKey}`
  },
  body: JSON.stringify({ sql: migrationSql })
})

if (response.ok) {
  console.log('✅ Migration 005 aplicada com sucesso!')
} else {
  const err = await response.text()
  console.error('❌ Erro ao aplicar migration:', err)
  console.log('\nApplique manualmente via SQL Editor no Dashboard do Supabase.')
}
