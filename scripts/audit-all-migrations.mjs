import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ykgprfzfnffooqmfbeox.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3ByZnpmbmZmb29xbWZiZW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk0Mzc5MSwiZXhwIjoyMTAyNTE5NzkxfQ.mv6Asc4U7lVVFtTtBhWyVm_R5jW2ThKocGI7WTRXIts'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const TABLES_TO_CHECK = [
  // Core FLOW
  'products',
  'categories',
  'suppliers',
  'purchases',
  'purchase_items',
  'orders',
  'order_items',
  'order_status_history',
  'sales',
  'sale_items',
  'marketplaces',
  'marketplace_accounts',
  'marketplace_listings',
  'marketplace_orders',
  'marketplace_order_items',
  'stock_reservations',
  'stock_movements',
  'internal_chats',
  'internal_chat_messages',
  'notifications',
  'profiles',
  'roles',
  'permissions',
  'role_permissions',
  'user_roles',
  'audit_logs',
  'shipping_rates',
  'supplier_contacts',
  'supplier_catalogs',
  
  // HUB / Loja Própria
  'pages',
  'page_drafts',
  'page_versions',
  'page_components',
  'store_settings',
  'payment_settings',
  'shipping_settings',
  'integrations',
  'integration_logs',
  'addresses',
  'invoices',
  'invoice_items',
  'stock_notifications',
  'ads_campaigns',
  'ads_analytics',
  'blog_posts',
  'blog_analytics',
  'fiscal_notes',
  'fiscal_settings'
]

async function runAudit() {
  console.log('===============================================================')
  console.log('🔍 AUDITANDO TODAS AS TABELAS DO ECOSSISTEMA NO SUPABASE')
  console.log('===============================================================\n')

  const existing = []
  const missing = []

  for (const table of TABLES_TO_CHECK) {
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('schema cache')) {
        missing.push({ table, error: error.message, code: error.code })
      } else {
        // Table exists but maybe RLS or empty
        existing.push({ table, note: `Acesso OK (${error.message})` })
      }
    } else {
      existing.push({ table, note: 'Existe e acessível' })
    }
  }

  console.log(`✅ TABELAS EXISTENTES NO BANCO (${existing.length}):`)
  existing.forEach(t => console.log(`  • ${t.table}: ${t.note}`))

  console.log(`\n❌ TABELAS AUSENTES OU COM ERRO (${missing.length}):`)
  missing.forEach(t => console.log(`  • ${t.table} -> ${t.error}`))

  // Checar colunas específicas críticas
  console.log('\n===============================================================')
  console.log('🔍 AUDITANDO COLUNAS CRÍTICAS DE RECURSOS ESPECÍFICOS')
  console.log('===============================================================\n')

  const COLUMN_CHECKS = [
    { table: 'products', col: 'is_site_published' },
    { table: 'products', col: 'cost_purchase' },
    { table: 'products', col: 'reserved_stock' },
    { table: 'products', col: 'category_id' },
    { table: 'orders', col: 'marketplace_id' },
    { table: 'orders', col: 'order_number' },
    { table: 'orders', col: 'tracking_code' },
    { table: 'marketplace_listings', col: 'catalog_product_id' },
    { table: 'marketplace_listings', col: 'external_id' },
    { table: 'pages', col: 'published_schema' },
    { table: 'pages', col: 'slug' },
    { table: 'categories', col: 'slug' },
    { table: 'categories', col: 'is_smart' },
  ]

  for (const c of COLUMN_CHECKS) {
    const { data, error } = await supabase.from(c.table).select(c.col).limit(1)
    if (error) {
      console.log(`❌ ${c.table}.${c.col}: AUSENTE ou ERRO (${error.message})`)
    } else {
      console.log(`✅ ${c.table}.${c.col}: PRESENTE`)
    }
  }
}

runAudit().catch(err => {
  console.error('Erro na auditoria:', err)
})
