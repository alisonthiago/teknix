import { createClient } from '@supabase/supabase-js'

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3ByZnpmbmZmb29xbWZiZW94Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Njk0Mzc5MSwiZXhwIjoyMTAyNTE5NzkxfQ.mv6Asc4U7lVVFtTtBhWyVm_R5jW2ThKocGI7WTRXIts'
const BASE = 'https://ykgprfzfnffooqmfbeox.supabase.co'
const USER_ID = '3af9068a-4b78-4c9c-8657-f83b93c01588'

const supabase = createClient(BASE, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const ALL_PERMISSIONS = [
  'products.view','products.create','products.edit','products.delete',
  'sales.view','sales.create','sales.edit','sales.delete',
  'orders.view','orders.manage','orders.financial_view',
  'picking.view','picking.execute',
  'shipping.view','shipping.execute','shipping.print_label',
  'inventory.view','inventory.create','inventory.adjust','inventory.cost_view',
  'finance.view','revenue.view','cost.view','profit.view','margin.view',
  'reports.view','reports.export','reports.sales','reports.inventory',
  'marketplaces.view','marketplaces.manage','marketplaces.connect','marketplaces.sync',
  'settings.view','settings.manage',
  'users.view','users.create','users.edit','users.delete','permissions.manage',
  'imports.use','exports.use','exports.financial',
  'notifications.view','pricing.view'
]

async function run() {
  // 1. Criar perfil MASTER
  console.log('👤 Criando perfil MASTER...')
  const { data: p, error: pe } = await supabase
    .from('profiles')
    .upsert({ id: USER_ID, role: 'MASTER', name: 'Alison', email: 'alison@teknixbrasil.com.br', status: 'ACTIVE', is_master: true }, { onConflict: 'id' })
    .select().single()

  if (pe) {
    console.error('❌ profiles error:', pe.message)
    console.log('\n⚠️  As tabelas do banco precisam ser criadas primeiro.')
    console.log('Por favor acesse o SQL Editor do Supabase e rode as migrations.')
    process.exit(1)
  }
  console.log('✅ Perfil MASTER criado:', p.name, '|', p.role)

  // 2. Inserir permissões
  console.log('\n🔐 Inserindo permissões...')
  const { error: permsInsert } = await supabase.from('permissions')
    .upsert(ALL_PERMISSIONS.map(code => ({ code, module: code.split('.')[0], description: code })), { onConflict: 'code' })
  if (permsInsert) console.log('  perms insert:', permsInsert.message)

  // 3. role_permissions MASTER
  const { error: rpErr } = await supabase.from('role_permissions')
    .upsert(ALL_PERMISSIONS.map(code => ({ role: 'MASTER', permission_code: code })), { onConflict: 'role,permission_code' })
  if (rpErr) console.log('  role_perms:', rpErr.message)

  // 4. user_permissions override para Alison
  const { error: upErr } = await supabase.from('user_permissions')
    .upsert(ALL_PERMISSIONS.map(code => ({ user_id: USER_ID, permission_code: code, granted: true })), { onConflict: 'user_id,permission_code' })
  if (upErr) console.log('  user_perms:', upErr.message)

  console.log(`\n✅ ${ALL_PERMISSIONS.length} permissões configuradas!`)
  console.log('\n🎉 PRONTO!')
  console.log('📧 Email: alison@teknixbrasil.com.br')
  console.log('🔑 Senha: nego5656')
  console.log('👑 Role: MASTER — acesso total ao sistema')
}

run().catch(console.error)
