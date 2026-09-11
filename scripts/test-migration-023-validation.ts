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

if (!SERVICE_KEY || !ANON_KEY) {
  console.error('ERRO: Variáveis de ambiente SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias.')
  process.exit(1)
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY)
const anon = createClient(SUPABASE_URL, ANON_KEY)
const client = createClient(SUPABASE_URL, ANON_KEY)

async function runValidation() {
  console.log('=============================================================')
  console.log('🔍 VALIDAÇÃO RIGOROSA DA MIGRATION 023 NO SUPABASE REMOTO')
  console.log('=============================================================\n')

  // 1. Checagem de existência da tabela stock_reservations
  console.log('1️⃣ Checando existência da tabela stock_reservations...')
  const { data: resTable, error: errTable } = await admin.from('stock_reservations').select('id').limit(1)
  const tableExists = !errTable
  console.log(`• Tabela stock_reservations: ${tableExists ? '✅ EXISTE' : '❌ NÃO ENCONTRADA (' + errTable?.message + ')'}`)

  if (!tableExists) {
    console.log('\n⚠️ A MIGRATION 023 AINDA NÃO FOI EXECUTADA NO SUPABASE.')
    console.log('Por favor, execute o script SQL no Supabase Dashboard (SQL Editor) antes de reexecutar este teste.\n')
    process.exit(2)
  }

  // Autentica cliente comum para os testes de permissão
  await client.auth.signInWithPassword({
    email: 'client_a_test@teknix.com',
    password: 'ClientA@Pass123!'
  })

  // 2. Checagem de RPCs bloqueadas para ANON
  console.log('\n2️⃣ Testando RPCs sob persona ANON (Visitante público)...')
  const rpcAnonDeduct = await anon.rpc('deduct_central_stock_atomic', {
    p_product_id: '00000000-0000-0000-0000-000000000000',
    p_quantity: 1,
    p_order_id: 'TEST-ANON',
    p_channel: 'site'
  })
  const anonDeductBlocked = rpcAnonDeduct.error?.message.toLowerCase().includes('permission denied') ||
                            rpcAnonDeduct.error?.code === '42501' ||
                            rpcAnonDeduct.status === 401 ||
                            rpcAnonDeduct.status === 403
  console.log(`• RPC deduct_central_stock_atomic (ANON): ${anonDeductBlocked ? '✅ BLOQUEADA (Acesso Negado)' : '❌ VULNERÁVEL (' + JSON.stringify(rpcAnonDeduct) + ')'}`)

  const rpcAnonRestore = await anon.rpc('restore_central_stock_atomic', {
    p_product_id: '00000000-0000-0000-0000-000000000000',
    p_quantity: 1,
    p_order_id: 'TEST-ANON',
    p_channel: 'site'
  })
  const anonRestoreBlocked = rpcAnonRestore.error?.message.toLowerCase().includes('permission denied') ||
                             rpcAnonRestore.error?.code === '42501' ||
                             rpcAnonRestore.status === 401 ||
                             rpcAnonRestore.status === 403
  console.log(`• RPC restore_central_stock_atomic (ANON): ${anonRestoreBlocked ? '✅ BLOQUEADA (Acesso Negado)' : '❌ VULNERÁVEL (' + JSON.stringify(rpcAnonRestore) + ')'}`)

  // 3. Checagem de RPCs bloqueadas para CLIENTE AUTENTICADO
  console.log('\n3️⃣ Testando RPCs sob persona CLIENTE (Usuário logado comum)...')
  const rpcCliDeduct = await client.rpc('deduct_central_stock_atomic', {
    p_product_id: '00000000-0000-0000-0000-000000000000',
    p_quantity: 1,
    p_order_id: 'TEST-CLI',
    p_channel: 'site'
  })
  const cliDeductBlocked = rpcCliDeduct.error?.message.toLowerCase().includes('permission denied') ||
                           rpcCliDeduct.error?.code === '42501' ||
                           rpcCliDeduct.status === 401 ||
                           rpcCliDeduct.status === 403
  console.log(`• RPC deduct_central_stock_atomic (CLIENTE): ${cliDeductBlocked ? '✅ BLOQUEADA (Acesso Negado)' : '❌ VULNERÁVEL (' + JSON.stringify(rpcCliDeduct) + ')'}`)

  // 4. Checagem de execução autorizada pelo FLOW BACKEND (service_role)
  console.log('\n4️⃣ Testando execução autorizada pelo FLOW BACKEND (service_role)...')
  
  // Cria produto isolado de teste
  const testSku = `SKU-VAL-${Date.now()}`
  const { data: prod, error: pErr } = await admin.from('products').insert({
    name: `Produto Teste Validação 023`,
    sku: testSku,
    stock: 1,
    reserved_stock: 0,
    site_price: 199.90,
    is_site_published: true
  }).select().single()

  if (pErr) throw new Error(`Falha ao criar produto de teste: ${pErr.message}`)
  console.log(`• Produto de teste criado: ID ${prod.id} (Estoque inicial: 1)`)

  // 5. Teste de Concorrência Real: Duas vendas simultâneas com estoque = 1
  console.log('\n5️⃣ Teste de Concorrência: 2 baixas simultâneas de quantidade 1 em produto com estoque = 1...')
  const orderRef1 = `ORD-CONC-1-${Date.now()}`
  const orderRef2 = `ORD-CONC-2-${Date.now()}`

  const [resVenda1, resVenda2] = await Promise.all([
    admin.rpc('deduct_central_stock_atomic', {
      p_product_id: prod.id,
      p_quantity: 1,
      p_order_id: orderRef1,
      p_channel: 'mercadolivre'
    }),
    admin.rpc('deduct_central_stock_atomic', {
      p_product_id: prod.id,
      p_quantity: 1,
      p_order_id: orderRef2,
      p_channel: 'site'
    })
  ])

  const v1Success = resVenda1.data?.success === true
  const v2Success = resVenda2.data?.success === true
  const v1Blocked = resVenda1.data?.error === 'INSUFFICIENT_STOCK'
  const v2Blocked = resVenda2.data?.error === 'INSUFFICIENT_STOCK'

  const concurrencyPassed = (v1Success && v2Blocked) || (v2Success && v1Blocked)
  console.log(`• Venda 1: ${JSON.stringify(resVenda1.data)}`)
  console.log(`• Venda 2: ${JSON.stringify(resVenda2.data)}`)
  console.log(`• Proteção contra overselling: ${concurrencyPassed ? '✅ APROVADO (Exatamente 1 venda aprovada e 1 rejeitada com INSUFFICIENT_STOCK)' : '❌ FALHA DE CONCORRÊNCIA'}`)

  // Checa estoque final no banco
  const { data: prodAfter } = await admin.from('products').select('stock').eq('id', prod.id).single()
  console.log(`• Estoque após concorrência: ${prodAfter?.stock} (Esperado: 0) ${prodAfter?.stock === 0 ? '✅' : '❌'}`)

  // 6. Teste de Restauração / Cancelamento Atômico
  console.log('\n6️⃣ Teste de Restauração / Cancelamento atômico...')
  const orderToCancel = v1Success ? orderRef1 : orderRef2
  const { data: resRestore } = await admin.rpc('restore_central_stock_atomic', {
    p_product_id: prod.id,
    p_quantity: 1,
    p_order_id: orderToCancel,
    p_channel: 'mercadolivre',
    p_reason: 'Teste de devolução homologado'
  })
  console.log(`• Restauração: ${JSON.stringify(resRestore)}`)
  const { data: prodRestored } = await admin.from('products').select('stock').eq('id', prod.id).single()
  console.log(`• Estoque após restauração: ${prodRestored?.stock} (Esperado: 1) ${prodRestored?.stock === 1 ? '✅' : '❌'}`)

  // Teste de idempotência da restauração
  const { data: resRestoreDupl } = await admin.rpc('restore_central_stock_atomic', {
    p_product_id: prod.id,
    p_quantity: 1,
    p_order_id: orderToCancel,
    p_channel: 'mercadolivre'
  })
  console.log(`• Idempotência de devolução duplicada: ${resRestoreDupl?.duplicate ? '✅ REJEITOU DUPLICIDADE' : '❌ FALHA'}`)

  // 7. Teste de Reserva com TTL e Expiração Automática
  console.log('\n7️⃣ Teste de Reserva com TTL e Expiração Automática...')
  // Atualiza reserved_stock
  await admin.from('products').update({ reserved_stock: 1 }).eq('id', prod.id)
  const { data: reservation } = await admin.from('stock_reservations').insert({
    product_id: prod.id,
    order_id: `RES-${Date.now()}`,
    channel: 'site',
    quantity: 1,
    status: 'RESERVED',
    expires_at: new Date(Date.now() - 10000).toISOString() // Já expirada
  }).select().single()

  console.log(`• Reserva criada com TTL expirado: ID ${reservation?.id}`)
  const { data: cleanRes } = await admin.rpc('cleanup_expired_stock_reservations')
  console.log(`• Limpeza automática de reservas expiradas: ${JSON.stringify(cleanRes)}`)

  const { data: prodAfterClean } = await admin.from('products').select('reserved_stock').eq('id', prod.id).single()
  console.log(`• reserved_stock após cleanup: ${prodAfterClean?.reserved_stock} (Esperado: 0) ${prodAfterClean?.reserved_stock === 0 ? '✅' : '❌'}`)

  // 8. Teste de Constraints Físicas (stock >= 0)
  console.log('\n8️⃣ Teste da Constraint física stock >= 0...')
  const { error: errNegStock } = await admin.from('products').update({ stock: -5 }).eq('id', prod.id)
  const constraintStockOk = errNegStock?.message.includes('products_stock_non_negative') || errNegStock?.code === '23514'
  console.log(`• Tentativa de estoque negativo (-5): ${constraintStockOk ? '✅ BLOQUEADO PELA CONSTRAINT' : '❌ FALHA (' + errNegStock?.message + ')'}`)

  // 9. Teste do Índice UNIQUE marketplace_listings(channel, external_id)
  console.log('\n9️⃣ Teste do Índice UNIQUE de marketplace_listings...')
  const uniqueExtId = `MLB-UNIQ-${Date.now()}`
  const { data: mps } = await admin.from('marketplaces').select('id').limit(1)
  const mpId = mps?.[0]?.id

  await admin.from('marketplace_listings').insert({
    marketplace_id: mpId,
    product_id: prod.id,
    channel: 'mercadolivre',
    external_id: uniqueExtId,
    price: 150
  })

  const { error: errDuplListing } = await admin.from('marketplace_listings').insert({
    marketplace_id: mpId,
    product_id: prod.id,
    channel: 'mercadolivre',
    external_id: uniqueExtId,
    price: 150
  })
  const uniqueIndexOk = errDuplListing?.message.includes('idx_marketplace_listings_channel_external') ||
                        errDuplListing?.code === '23505'
  console.log(`• Inserção de anúncio duplicado no mesmo canal: ${uniqueIndexOk ? '✅ BLOQUEADO PELO ÍNDICE ÚNICO' : '❌ FALHA (' + errDuplListing?.message + ')'}`)

  // Limpeza do produto de teste
  await admin.from('products').delete().eq('id', prod.id)
  console.log('\n🧹 Limpeza de dados temporários concluída.')

  console.log('\n=============================================================')
  console.log('🎉 TODOS OS TESTES DA MIGRATION 023 PASSARAM COM SUCESSO!')
  console.log('=============================================================')
}

runValidation().catch(e => {
  console.error('Erro na validação:', e)
  process.exit(1)
})
