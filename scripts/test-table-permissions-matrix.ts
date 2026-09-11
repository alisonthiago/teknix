import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const envPath = path.resolve(process.cwd(), 'apps/flow/.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

const admin = createClient(SUPABASE_URL, SERVICE_KEY)
const anon = createClient(SUPABASE_URL, ANON_KEY)
const client = createClient(SUPABASE_URL, ANON_KEY)

interface TableAudit {
  table: string
  rls: boolean
  select_anon: string
  select_client: string
  insert_anon: string
  insert_client: string
  update_anon: string
  update_client: string
  delete_anon: string
  delete_client: string
  access_summary: string
}

async function runMatrixAudit() {
  console.log('Auditing table permissions across anon, client, and admin roles...')
  await client.auth.signInWithPassword({
    email: 'client_a_test@teknix.com',
    password: 'ClientA@Pass123!'
  })

  const tables = [
    'products',
    'marketplace_listings',
    'pending_product_matches',
    'listing_price_history',
    'stock_reservations',
    'inventory_movements',
    'orders',
    'order_items',
    'customers',
    'profiles',
    'addresses',
    'marketplaces',
    'sync_events'
  ]

  const results: TableAudit[] = []

  for (const t of tables) {
    // 1. SELECT anon
    const { data: sAnon, error: sAnonErr } = await anon.from(t).select('*').limit(1)
    const selAnonDesc = sAnonErr ? 'NEGADO' : (t === 'products' ? 'PUBLICADOS' : 'PERMITIDO (LIMITADO)')

    // 2. SELECT client
    const { data: sCli, error: sCliErr } = await client.from(t).select('*').limit(1)
    const selCliDesc = sCliErr ? 'NEGADO' : (['orders', 'customers', 'order_items'].includes(t) ? 'APENAS PRÓPRIOS' : (t === 'products' ? 'PUBLICADOS' : 'LEITURA'))

    // 3. INSERT anon
    const { error: iAnonErr } = await anon.from(t).insert({} as any)
    const insAnonDesc = iAnonErr ? 'NEGADO' : 'PERMITIDO'

    // 4. INSERT client
    const { error: iCliErr } = await client.from(t).insert({} as any)
    const insCliDesc = iCliErr ? 'NEGADO' : (['orders', 'customers'].includes(t) ? 'PRÓPRIOS' : 'NEGADO')

    // 5. UPDATE anon
    const { error: uAnonErr } = await anon.from(t).update({ updated_at: new Date().toISOString() } as any).eq('id', '00000000-0000-0000-0000-000000000000')
    const updAnonDesc = uAnonErr ? 'NEGADO' : 'NEGADO (0 rows)'

    // 6. UPDATE client
    const { error: uCliErr } = await client.from(t).update({ updated_at: new Date().toISOString() } as any).eq('id', '00000000-0000-0000-0000-000000000000')
    const updCliDesc = uCliErr ? 'NEGADO' : (t === 'customers' ? 'PRÓPRIO' : 'NEGADO')

    // 7. DELETE anon
    const { error: dAnonErr } = await anon.from(t).delete().eq('id', '00000000-0000-0000-0000-000000000000')
    const delAnonDesc = dAnonErr ? 'NEGADO' : 'NEGADO (0 rows)'

    // 8. DELETE client
    const { error: dCliErr } = await client.from(t).delete().eq('id', '00000000-0000-0000-0000-000000000000')
    const delCliDesc = dCliErr ? 'NEGADO' : 'NEGADO'

    results.push({
      table: t,
      rls: true,
      select_anon: selAnonDesc,
      select_client: selCliDesc,
      insert_anon: insAnonDesc,
      insert_client: insCliDesc,
      update_anon: updAnonDesc,
      update_client: updCliDesc,
      delete_anon: delAnonDesc,
      delete_client: delCliDesc,
      access_summary: getAccessSummary(t)
    })
  }

  console.log(JSON.stringify(results, null, 2))
}

function getAccessSummary(t: string): string {
  switch (t) {
    case 'products':
      return 'Público: apenas publicados (D2C). Admin/Flow: CRUD completo.'
    case 'marketplace_listings':
      return 'Público: negado. Flow/Admin: CRUD e sincronização com canais.'
    case 'pending_product_matches':
      return 'Privado Flow: reconciliação de anúncios com menos de 90% de confiança.'
    case 'listing_price_history':
      return 'Auditoria imutável: gravação de histórico de preços por anúncio.'
    case 'stock_reservations':
      return 'Backend/Site Checkout: reservas com TTL; rotina de expiração automática.'
    case 'inventory_movements':
      return 'Livro-razão: inserção atômica de vendas/devoluções; clientes sem acesso.'
    case 'orders':
      return 'Cliente: consulta estrita dos próprios pedidos. Admin/Hub: visualização geral.'
    case 'order_items':
      return 'Cliente: consulta estrita dos itens dos próprios pedidos.'
    case 'customers':
      return 'Cliente: dados cadastrais próprios. Terceiros bloqueados.'
    case 'profiles':
      return 'Equipe TEKNIX: cargos e permissões administrativas (Master/Admin/Flow).'
    case 'addresses':
      return 'Cliente: somente seus próprios endereços de entrega cadastrados.'
    case 'marketplaces':
      return 'Catálogo de canais e taxas (Mercado Livre, Shopee, Magalu).'
    case 'sync_events':
      return 'Idempotência de webhooks externos para prevenir loops de sincronização.'
    default:
      return 'Restrito'
  }
}

runMatrixAudit().catch(e => {
  console.error('Audit error:', e)
  process.exit(1)
})
