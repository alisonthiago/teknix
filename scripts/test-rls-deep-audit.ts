import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Carrega variáveis com segurança de apps/flow/.env.local
const envPath = path.resolve(process.cwd(), 'apps/flow/.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!SERVICE_KEY || !ANON_KEY) {
  throw new Error('Chaves de ambiente são obrigatórias.')
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY)

async function runRlsAudit() {
  console.log('\n=============================================================')
  console.log('🔒 TEKNIX — AUDITORIA PROFUNDA DE RLS (CLIENTE A x CLIENTE B)')
  console.log('=============================================================\n')

  const clientAEmail = 'client_a_test@teknix.com'
  const clientBEmail = 'client_b_test@teknix.com'
  const passwordA = 'ClientA@Pass123!'
  const passwordB = 'ClientB@Pass123!'

  // 1. Obtém os IDs dos dois clientes
  const { data: userList } = await adminClient.auth.admin.listUsers()
  const userA = userList.users.find(u => u.email === clientAEmail)
  const userB = userList.users.find(u => u.email === clientBEmail)

  if (!userA || !userB) {
    throw new Error('Falha ao localizar usuários de teste A e B')
  }

  console.log(`• Cliente A ID: ${userA.id} (${clientAEmail})`)
  console.log(`• Cliente B ID: ${userB.id} (${clientBEmail})`)

  // 2. Garante perfil de Cliente B e Cliente A na tabela profiles
  await adminClient.from('profiles').upsert([
    { id: userA.id, email: clientAEmail, name: 'Cliente A (Test)', role: 'CLIENTE', is_master: false },
    { id: userB.id, email: clientBEmail, name: 'Cliente B (Test)', role: 'CLIENTE', is_master: false }
  ])

  // 2.1 Garante registro na tabela customers para o Cliente B
  let customerBId: string
  const { data: existingCust } = await adminClient
    .from('customers')
    .select('id')
    .eq('user_id', userB.id)
    .maybeSingle()

  if (existingCust) {
    customerBId = existingCust.id
  } else {
    const { data: newCust, error: custErr } = await adminClient
      .from('customers')
      .insert({
        user_id: userB.id,
        name: 'Cliente B Oficial',
        email: clientBEmail,
        phone: '11999998888',
        address: 'Rua Teste, 100, Bairro Teste',
        city: 'São Paulo',
        state: 'SP',
        zip_code: '01001-000'
      })
      .select('id')
      .single()

    if (custErr || !newCust) {
      throw new Error(`Falha ao criar customer B: ${custErr?.message}`)
    }
    customerBId = newCust.id
  }

  // 3. Cria um pedido privado pertencente ao Cliente B
  const orderBNumber = `ORD-RLS-${Date.now().toString().slice(-6)}`
  const { data: orderB, error: ordErr } = await adminClient
    .from('orders')
    .insert({
      customer_id: customerBId,
      user_id: userB.id,
      order_number: orderBNumber,
      customer_name: 'Cliente B Oficial',
      customer_phone: '11999998888',
      total_amount: 899.90,
      status: 'pago',
      origin: 'site'
    })
    .select('id, order_number, customer_id, user_id')
    .single()

  if (ordErr || !orderB) {
    throw new Error(`Falha ao criar pedido do Cliente B: ${ordErr?.message}`)
  }
  console.log(`\n📦 Pedido criado para o Cliente B: ID ${orderB.id} (${orderB.order_number})`)

  // =========================================================================
  // TESTE 1: Cliente A autenticado tenta consultar o pedido do Cliente B
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE 1] Cliente A autenticado tenta SELECT do pedido do Cliente B...')
  console.log('-------------------------------------------------------------')

  const clientA = createClient(SUPABASE_URL, ANON_KEY)
  const { error: loginAErr } = await clientA.auth.signInWithPassword({
    email: clientAEmail,
    password: passwordA
  })
  if (loginAErr) throw new Error(`Falha no login do Cliente A: ${loginAErr.message}`)

  const { data: ordersSeenByA, error: errSeenA } = await clientA
    .from('orders')
    .select('id, order_number, customer_name, total_amount')
    .eq('id', orderB.id)

  console.log(`• Registros retornados para o Cliente A: ${ordersSeenByA?.length || 0}`)

  const leakedToA = ordersSeenByA && ordersSeenByA.length > 0
  if (leakedToA) {
    console.error('❌ FALHA GRAVE: Cliente A conseguiu visualizar o pedido do Cliente B!')
  } else {
    console.log('✅ SUCESSO: Cliente A NÃO conseguiu visualizar o pedido do Cliente B (0 registros retornados)!')
  }

  // =========================================================================
  // TESTE 2: Cliente B autenticado consulta o próprio pedido
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE 2] Cliente B autenticado consulta o seu PRÓPRIO pedido...')
  console.log('-------------------------------------------------------------')

  const clientB = createClient(SUPABASE_URL, ANON_KEY)
  const { error: loginBErr } = await clientB.auth.signInWithPassword({
    email: clientBEmail,
    password: passwordB
  })
  if (loginBErr) throw new Error(`Falha no login do Cliente B: ${loginBErr.message}`)

  const { data: ordersSeenByB, error: errSeenB } = await clientB
    .from('orders')
    .select('id, order_number, customer_name, total_amount')
    .eq('id', orderB.id)

  console.log(`• Registros retornados para o Cliente B: ${ordersSeenByB?.length || 0}`)

  const canSeeOwn = ordersSeenByB && ordersSeenByB.length === 1
  if (!canSeeOwn) {
    console.warn(`⚠️ ALERTA: Cliente B não conseguiu visualizar o próprio pedido (possível política de RLS em orders). Erro: ${errSeenB?.message}`)
  } else {
    console.log(`✅ SUCESSO: Cliente B visualizou o seu próprio pedido com sucesso: ${ordersSeenByB[0].order_number}`)
  }

  // =========================================================================
  // TESTE 3: Usuário Anônimo (Público) tenta ler orders
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE 3] Usuário Anônimo (Sem login) tenta SELECT em orders...')
  console.log('-------------------------------------------------------------')

  const anonClient = createClient(SUPABASE_URL, ANON_KEY)
  const { data: anonOrders } = await anonClient
    .from('orders')
    .select('id, order_number')
    .eq('id', orderB.id)

  console.log(`• Registros retornados para o Anônimo: ${anonOrders?.length || 0}`)
  if (anonOrders && anonOrders.length > 0) {
    console.error('❌ FALHA: Pedido vazou para anônimo!')
  } else {
    console.log('✅ SUCESSO: Usuário anônimo bloqueado em orders (0 registros)!')
  }

  // =========================================================================
  // TESTE 4: Usuário Anônimo tenta modificar produtos ou criar anúncios
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE 4] Usuário Anônimo tenta UPDATE em products.stock e INSERT em listings...')
  console.log('-------------------------------------------------------------')

  // Pega um produto
  const { data: anyProd } = await adminClient.from('products').select('id, stock').limit(1).single()

  const { data: anonUpd, error: anonUpdErr } = await anonClient
    .from('products')
    .update({ stock: 9999 })
    .eq('id', anyProd.id)
    .select()

  console.log(`• Tentativa de UPDATE stock por anônimo: Bloqueado? ${anonUpdErr ? 'SIM (' + anonUpdErr.message + ')' : (anonUpd?.length === 0 ? 'SIM (0 rows afetadas)' : 'NÃO')}`)

  const { data: anonInsList, error: anonInsErr } = await anonClient
    .from('marketplace_listings')
    .insert({
      product_id: anyProd.id,
      title: 'Hack Listing',
      price: 10,
      external_id: 'HACK-999',
      channel: 'mercadolivre',
      marketplace_id: '6ef8f3db-6d35-4701-86f7-8199378ec0c7'
    })
    .select()

  console.log(`• Tentativa de INSERT listing por anônimo: Bloqueado? ${anonInsErr ? 'SIM (' + anonInsErr.message + ')' : (anonInsList?.length === 0 ? 'SIM' : 'NÃO')}`)

  // =========================================================================
  // TESTE 5: Cliente A tenta ler o perfil do Cliente B
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE 5] Cliente A tenta ler o perfil do Cliente B em profiles...')
  console.log('-------------------------------------------------------------')

  const { data: profBSeenByA } = await clientA
    .from('profiles')
    .select('id, email, name')
    .eq('id', userB.id)

  console.log(`• Perfil do Cliente B retornado para o Cliente A: ${profBSeenByA?.length || 0} registros`)
  if (profBSeenByA && profBSeenByA.length > 0) {
    console.warn('⚠️ Perfil de outro cliente visível para Cliente A (necessita policy restrita em profiles)')
  } else {
    console.log('✅ SUCESSO: Perfil de terceiros protegido contra outros clientes!')
  }

  // Limpeza
  console.log('\n🧹 Limpando dados do teste de auditoria...')
  await adminClient.from('orders').delete().eq('id', orderB.id)
  console.log('✅ Base limpa!')

  return {
    clientAIso: !leakedToA,
    clientBAllowed: canSeeOwn,
    anonBlockedOrders: !anonOrders || anonOrders.length === 0,
    anonBlockedMutations: Boolean(anonUpdErr || anonUpd?.length === 0)
  }
}

runRlsAudit()
  .then(res => {
    console.log('\n📊 RESUMO DO AUDIT RLS:\n', res)
  })
  .catch(err => {
    console.error('\n❌ Erro durante a auditoria:\n', err)
    process.exit(1)
  })
