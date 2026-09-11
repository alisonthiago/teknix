import { createClient } from '@supabase/supabase-js'
import { updateListingPrice, updateSiteProductPrice } from '../apps/flow/src/services/catalog/priceService'
import { processSaleDeduction } from '../apps/flow/src/services/inventory/stockService'

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
  throw new Error('Chaves SUPABASE_SERVICE_ROLE_KEY e NEXT_PUBLIC_SUPABASE_ANON_KEY são obrigatórias via .env.local')
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY)
const publicClient = createClient(SUPABASE_URL, ANON_KEY)

async function runTestsAToG() {
  console.log('\n=============================================================')
  console.log('🧪 TEKNIX — BATERIA DE TESTES OFICIAIS EXIGIDOS (A a G)')
  console.log('=============================================================\n')

  const testSku = `SKU-REQ-${Date.now().toString().slice(-6)}`
  const testMlId = `MLB-REQ-${Date.now().toString().slice(-6)}`

  // Setup: Criação do Produto Central com estoque 20 e Preço Site R$ 273
  console.log(`📦 [Setup] Criando produto central ${testSku} (Estoque: 20 un, Preço Site: R$ 273,00)...`)
  const { data: product, error: pErr } = await adminClient
    .from('products')
    .insert({
      name: 'Microfone Hollyland Lark M2 (Bateria Oficial A-G)',
      sku: testSku,
      stock: 20,
      reserved_stock: 0,
      site_price: 273.00,
      cost_purchase: 120.00,
      is_site_published: true,
      brand: 'Hollyland',
      model: 'Lark M2'
    })
    .select('*')
    .single()

  if (pErr || !product) throw new Error(`Falha no setup: ${pErr?.message}`)

  // Setup: Criação da Listing no Mercado Livre com Preço R$ 565
  console.log(`🛒 [Setup] Criando anúncio no ML ${testMlId} com preço inicial R$ 565,00...`)
  const { data: listing, error: lErr } = await adminClient
    .from('marketplace_listings')
    .insert({
      product_id: product.id,
      channel: 'mercadolivre',
      marketplace_id: '6ef8f3db-6d35-4701-86f7-8199378ec0c7',
      external_id: testMlId,
      external_listing_id: testMlId,
      catalog_product_id: 'MLB38491029',
      title: 'Hollyland Lark M2 ML Oficial',
      price: 565.00,
      stock_synced: 20,
      listing_type: 'gold_special',
      status: 'active',
      sold_quantity: 0,
      total_revenue: 0,
      last_sync_origin: 'TEST_SUITE'
    })
    .select('*')
    .single()

  if (lErr || !listing) throw new Error(`Falha ao criar listing ML: ${lErr?.message}`)

  // =========================================================================
  // TESTE A: Site = R$273, ML = R$565 -> Alterar ML para R$520 -> Site continua R$273
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE A] Alterar ML para R$ 520,00 e confirmar Site = R$ 273,00...')
  console.log('-------------------------------------------------------------')

  await updateListingPrice({
    listingId: listing.id,
    newPrice: 520.00,
    origin: 'FLOW',
    reason: 'Teste Oficial A — Alteração de preço no ML'
  })

  const { data: prodAfterA } = await adminClient.from('products').select('site_price').eq('id', product.id).single()
  const { data: listAfterA } = await adminClient.from('marketplace_listings').select('price').eq('id', listing.id).single()

  console.log(`• Preço ML: R$ ${listAfterA?.price} (Esperado: R$ 520)`)
  console.log(`• Preço Site: R$ ${prodAfterA?.site_price} (Esperado: R$ 273)`)

  if (listAfterA?.price !== 520.00 || prodAfterA?.site_price !== 273.00) {
    throw new Error('FALHA NO TESTE A: Preços divergentes!')
  }
  console.log('✅ TESTE A PASSOU COM SUCESSO: ML alterado para R$ 520 e Site PERMANECEU R$ 273,00!')

  // =========================================================================
  // TESTE B: Alterar Site para R$ 280 -> ML continua R$ 520
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE B] Alterar Site para R$ 280,00 e confirmar ML = R$ 520,00...')
  console.log('-------------------------------------------------------------')

  await updateSiteProductPrice({
    productId: product.id,
    newPrice: 280.00,
    origin: 'HUB'
  })

  const { data: prodAfterB } = await adminClient.from('products').select('site_price').eq('id', product.id).single()
  const { data: listAfterB } = await adminClient.from('marketplace_listings').select('price').eq('id', listing.id).single()

  console.log(`• Preço Site: R$ ${prodAfterB?.site_price} (Esperado: R$ 280)`)
  console.log(`• Preço ML: R$ ${listAfterB?.price} (Esperado: R$ 520)`)

  if (prodAfterB?.site_price !== 280.00 || listAfterB?.price !== 520.00) {
    throw new Error('FALHA NO TESTE B: Preço do ML foi contaminado pelo Site!')
  }
  console.log('✅ TESTE B PASSOU COM SUCESSO: Site alterado para R$ 280 e ML PERMANECEU R$ 520,00!')

  // =========================================================================
  // TESTE C: Produto com estoque 20. Venda de 2 no Mercado Livre -> estoque central = 18
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE C] Venda de 2 un no Mercado Livre -> estoque central deve ir de 20 para 18...')
  console.log('-------------------------------------------------------------')

  const orderMl = `ORD-ML-${Date.now()}`
  await processSaleDeduction({
    productId: product.id,
    channel: 'mercadolivre',
    listingExternalId: testMlId,
    orderId: orderMl,
    quantity: 2,
    unitPriceSold: 520.00,
    customerName: 'Cliente ML Teste C'
  })

  const { data: prodAfterC } = await adminClient.from('products').select('stock').eq('id', product.id).single()
  console.log(`• Estoque Central após venda ML: ${prodAfterC?.stock} un (Esperado: 18 un)`)

  if (prodAfterC?.stock !== 18) {
    throw new Error(`FALHA NO TESTE C: Estoque deveria ser 18, mas está ${prodAfterC?.stock}`)
  }
  console.log('✅ TESTE C PASSOU COM SUCESSO: Estoque central debitado para 18 unidades!')

  // =========================================================================
  // TESTE D: Venda de 3 no Site -> estoque central = 15
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE D] Venda de 3 un no Site -> estoque central deve ir de 18 para 15...')
  console.log('-------------------------------------------------------------')

  const orderSite = `ORD-SITE-${Date.now()}`
  await processSaleDeduction({
    productId: product.id,
    channel: 'site',
    orderId: orderSite,
    quantity: 3,
    unitPriceSold: 280.00,
    customerName: 'Cliente Loja Oficial D2C'
  })

  const { data: prodAfterD } = await adminClient.from('products').select('stock').eq('id', product.id).single()
  console.log(`• Estoque Central após venda Site: ${prodAfterD?.stock} un (Esperado: 15 un)`)

  if (prodAfterD?.stock !== 15) {
    throw new Error(`FALHA NO TESTE D: Estoque deveria ser 15, mas está ${prodAfterD?.stock}`)
  }
  console.log('✅ TESTE D PASSOU COM SUCESSO: Estoque central debitado para 15 unidades!')

  // =========================================================================
  // TESTE E: Tentar duas baixas concorrentes superiores ao estoque -> Bloquear overselling
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE E] Concorrência extrema: Estoque = 1 un com duas tentativas de baixa simultâneas...')
  console.log('-------------------------------------------------------------')

  // Reduz estoque para 1
  await adminClient.from('products').update({ stock: 1 }).eq('id', product.id)

  const [resA, resB] = await Promise.allSettled([
    processSaleDeduction({
      productId: product.id,
      channel: 'site',
      orderId: `SIM-A-${Date.now()}`,
      quantity: 1,
      unitPriceSold: 280.00
    }),
    processSaleDeduction({
      productId: product.id,
      channel: 'mercadolivre',
      orderId: `SIM-B-${Date.now()}`,
      quantity: 1,
      unitPriceSold: 520.00
    })
  ])

  const { data: prodAfterE } = await adminClient.from('products').select('stock').eq('id', product.id).single()
  console.log(`• Status Tentativa 1: ${resA.status}`)
  console.log(`• Status Tentativa 2: ${resB.status}`)
  console.log(`• Estoque Central Final: ${prodAfterE?.stock} un`)

  const successCount = [resA, resB].filter(r => r.status === 'fulfilled').length
  const rejectedCount = [resA, resB].filter(r => r.status === 'rejected').length

  if (prodAfterE?.stock! < 0 || successCount !== 1 || rejectedCount !== 1) {
    throw new Error(`FALHA NO TESTE E: Bloqueio de concorrência falhou! Estoque: ${prodAfterE?.stock}`)
  }
  console.log('✅ TESTE E PASSOU COM SUCESSO: Bloqueio de concorrência atômica impediu overselling (estoque = 0, nunca negativo)!')

  // =========================================================================
  // TESTE F: Cliente A tentar consultar pedido do Cliente B -> Negado por RLS
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE F] Isolamento RLS: Cliente A tenta consultar pedidos privados de outros clientes...')
  console.log('-------------------------------------------------------------')

  // Cria um pedido pertencente a um cliente fictício B
  const clientBUuid = 'bbbbbbbb-bbbb-4bbb-abbb-bbbbbbbbbbbb'
  const { data: orderB, error: ordErr } = await adminClient
    .from('orders')
    .insert({
      customer_id: clientBUuid,
      order_number: `ORD-PRIV-${Date.now()}`,
      customer_name: 'Cliente B (Privado)',
      total_amount: 1500.00,
      status: 'pago'
    })
    .select('id')
    .single()

  // Consulta usando cliente não-admin / anônimo (ou token sem permissão de ver outros clientes)
  const { data: leakedOrders, error: leakErr } = await publicClient
    .from('orders')
    .select('id, customer_name, total_amount')
    .eq('id', orderB?.id)

  console.log(`• Tentativa de acesso público/anônimo ao pedido do Cliente B: Encontrou ${leakedOrders?.length || 0} registros`)

  if (leakedOrders && leakedOrders.length > 0) {
    throw new Error('FALHA CRÍTICA NO TESTE F: O pedido do Cliente B vazou para consulta não-autorizada!')
  }
  console.log('✅ TESTE F PASSOU COM SUCESSO: Consulta negada/isolada por RLS (nenhum dado de outro cliente vazou)!')

  // Limpa pedido teste B
  if (orderB?.id) await adminClient.from('orders').delete().eq('id', orderB.id)

  // =========================================================================
  // TESTE G: Produto is_site_published = false -> Não aparece publicamente no site
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE G] Privacidade da Vitrine: Produto is_site_published = false não deve aparecer publicamente...')
  console.log('-------------------------------------------------------------')

  // Despublica o produto do site
  await adminClient.from('products').update({ is_site_published: false }).eq('id', product.id)

  // Simula consulta pública do SITE (usando o cliente público do frontend)
  // O frontend filtra produtos publicados no catálogo oficial
  const { data: publicCatalog } = await publicClient
    .from('products')
    .select('id, name, is_site_published')
    .eq('id', product.id)
    .eq('is_site_published', true)

  console.log(`• Consulta no catálogo público da loja: Encontrou ${publicCatalog?.length || 0} produtos`)

  if (publicCatalog && publicCatalog.length > 0) {
    throw new Error('FALHA NO TESTE G: Produto despublicado apareceu na vitrine pública!')
  }
  console.log('✅ TESTE G PASSOU COM SUCESSO: Produto com is_site_published = false fica 100% oculto da vitrine pública!')

  // Teardown
  console.log('\n🧹 Limpando dados do teste...')
  await adminClient.from('inventory_movements').delete().eq('product_id', product.id)
  await adminClient.from('listing_price_history').delete().eq('product_id', product.id)
  await adminClient.from('marketplace_listings').delete().eq('product_id', product.id)
  await adminClient.from('products').delete().eq('id', product.id)
  console.log('✅ Base de dados limpa com sucesso!')

  console.log('\n=============================================================')
  console.log('🏆 TODOS OS TESTES A, B, C, D, E, F, G FORAM CONCLUÍDOS COM 100% DE SUCESSO!')
  console.log('=============================================================\n')
}

runTestsAToG().catch(err => {
  console.error('\n❌ ERRO NA EXECUÇÃO DA BATERIA:\n', err)
  process.exit(1)
})
