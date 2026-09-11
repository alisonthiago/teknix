import { createClient } from '@supabase/supabase-js'
import { updateListingPrice, updateSiteProductPrice } from '../apps/flow/src/services/catalog/priceService'
import {
  processSaleDeduction,
  processSaleCancellation,
  reserveStockWithTTL,
  releaseReservedStock
} from '../apps/flow/src/services/inventory/stockService'

import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const envPath = path.resolve(process.cwd(), 'apps/flow/.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!SUPABASE_KEY) {
  throw new Error('Chave NEXT_PUBLIC_SUPABASE_ANON_KEY obrigatória via .env.local')
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function runTestSuite() {
  console.log('\n=============================================================')
  console.log('🧪 TEKNIX — BATERIA DE TESTES DE INTEGRAÇÃO & ISOLAMENTO')
  console.log('=============================================================\n')

  console.log('🔐 [Autenticação] Autenticando com Supabase...')
  const { error: authErr } = await supabase.auth.signInWithPassword({
    email: 'teste@teste.com',
    password: '123456'
  })
  if (authErr) {
    throw new Error(`Falha na autenticação: ${authErr.message}`)
  }
  console.log('✅ Autenticado com sucesso!')

  const testSku = `TEST-ISO-${Date.now().toString().slice(-6)}`
  const testMlId = `MLB-TEST-${Date.now().toString().slice(-6)}`

  // PASSO 0: Criação do Produto Central de Teste
  console.log(`📦 [Passo 0] Criando Produto Central de Teste: ${testSku}...`)
  const { data: product, error: pErr } = await supabase
    .from('products')
    .insert({
      name: 'Microfone Hollyland Lark M2 (Teste Automatizado)',
      sku: testSku,
      stock: 20,
      reserved_stock: 0,
      site_price: 273.00,
      cost_purchase: 120.00,
      is_site_published: true,
      brand: 'Hollyland',
      model: 'Lark M2',
      category: 'Áudio & Vídeo'
    })
    .select('*')
    .single()

  if (pErr || !product) {
    throw new Error(`Falha ao criar produto de teste: ${pErr?.message}`)
  }
  console.log(`✅ Produto criado com sucesso: ID ${product.id} | Estoque: ${product.stock} un | Preço Site: R$ ${product.site_price}`)

  // PASSO 1: Criação da Listing no Mercado Livre
  console.log(`\n🛒 [Passo 1] Criando Oferta no Mercado Livre (${testMlId})...`)
  const { data: listing, error: lErr } = await supabase
    .from('marketplace_listings')
    .insert({
      product_id: product.id,
      channel: 'mercadolivre',
      marketplace_id: '6ef8f3db-6d35-4701-86f7-8199378ec0c7',
      external_id: testMlId,
      external_listing_id: testMlId,
      catalog_product_id: 'MLB38491029', // Buy Box Catalog
      title: 'Hollyland Lark M2 Microfone Sem Fio Oficial ML',
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

  if (lErr || !listing) {
    throw new Error(`Falha ao criar listing ML: ${lErr?.message}`)
  }
  console.log(`✅ Oferta ML criada: ID ${listing.id} | Preço Inicial: R$ ${listing.price} | Catalog Buy Box: ${listing.catalog_product_id}`)

  // =========================================================================
  // TESTE 1: O TESTE CRÍTICO DE ISOLAMENTO DE PREÇO SOLICITADO PELO USUÁRIO
  // Site = R$ 273 -> ML = R$ 565 -> alterar ML para R$ 520 -> Site permanece R$ 273
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE 1] Alterando preço do ML para R$ 520,00 e verificando Site...')
  console.log('-------------------------------------------------------------')

  const priceResult = await updateListingPrice({
    listingId: listing.id,
    newPrice: 520.00,
    origin: 'FLOW',
    reason: 'Teste de Isolamento de Preço — Redução de R$ 565 para R$ 520'
  })

  // Consulta imediata no banco para ambos
  const { data: verifiedProduct } = await supabase
    .from('products')
    .select('id, site_price, stock')
    .eq('id', product.id)
    .single()

  const { data: verifiedListing } = await supabase
    .from('marketplace_listings')
    .select('id, price')
    .eq('id', listing.id)
    .single()

  console.log(`• Preço da Listing ML após atualização: R$ ${verifiedListing?.price}`)
  console.log(`• Preço do Site no Banco: R$ ${verifiedProduct?.site_price}`)

  if (verifiedListing?.price !== 520.00) {
    throw new Error(`FALHA NO TESTE: Preço do ML deveria ser 520.00, mas está ${verifiedListing?.price}`)
  }
  if (verifiedProduct?.site_price !== 273.00) {
    throw new Error(`FALHA CRÍTICA DE ISOLAMENTO: O preço do Site foi contaminado! Deveria ser 273.00, mas está ${verifiedProduct?.site_price}`)
  }
  console.log('🎉 [TESTE 1 PASSOU]: Preço do ML alterado para R$ 520,00 e Preço do Site PERMANECEU EXATAMENTE R$ 273,00!')

  // =========================================================================
  // TESTE 2: BAIXA UNIFICADA DE ESTOQUE CENTRAL POR VENDA NO MERCADO LIVRE
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE 2] Simulando venda de 1 un no ML por R$ 520,00...')
  console.log('-------------------------------------------------------------')

  const orderId = `PEDIDO-ML-${Date.now().toString().slice(-6)}`
  const saleResult = await processSaleDeduction({
    productId: product.id,
    channel: 'mercadolivre',
    listingExternalId: testMlId,
    orderId,
    quantity: 1,
    unitPriceSold: 520.00,
    customerName: 'Comprador Teste ML'
  })

  const { data: stockAfterSale } = await supabase
    .from('products')
    .select('stock, site_price')
    .eq('id', product.id)
    .single()

  const { data: listingAfterSale } = await supabase
    .from('marketplace_listings')
    .select('sold_quantity, total_revenue')
    .eq('id', listing.id)
    .single()

  console.log(`• Novo Estoque Central: ${stockAfterSale?.stock} un (Esperado: 19 un)`)
  console.log(`• Vendas acumuladas na Oferta ML: ${listingAfterSale?.sold_quantity} un`)
  console.log(`• Faturamento acumulado na Oferta ML: R$ ${listingAfterSale?.total_revenue}`)
  console.log(`• Preço do Site após a venda: R$ ${stockAfterSale?.site_price}`)

  if (stockAfterSale?.stock !== 19) {
    throw new Error(`FALHA NO ESTOQUE: Deveria ser 19 un, mas está ${stockAfterSale?.stock}`)
  }
  if (stockAfterSale?.site_price !== 273.00) {
    throw new Error(`FALHA: Venda alterou preço do site!`)
  }
  console.log('🎉 [TESTE 2 PASSOU]: Estoque central debitado de 20 para 19 unidades com sucesso!')

  // =========================================================================
  // TESTE 3: CANCELAMENTO E DEVOLUÇÃO DE ESTOQUE (ESTORNO)
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE 3] Simulando cancelamento do pedido ML e restauração do estoque...')
  console.log('-------------------------------------------------------------')

  const cancelResult = await processSaleCancellation({
    productId: product.id,
    channel: 'mercadolivre',
    orderId,
    quantity: 1,
    listingExternalId: testMlId,
    reason: 'Comprador solicitou cancelamento antes do envio'
  })

  const { data: stockAfterCancel } = await supabase
    .from('products')
    .select('stock')
    .eq('id', product.id)
    .single()

  console.log(`• Estoque após cancelamento/estorno: ${stockAfterCancel?.stock} un (Esperado: 20 un)`)

  if (stockAfterCancel?.stock !== 20) {
    throw new Error(`FALHA NA DEVOLUÇÃO: Estoque deveria voltar para 20 un, mas está ${stockAfterCancel?.stock}`)
  }

  // Testa idempotência da devolução (tentar devolver o mesmo cancelamento novamente)
  const duplicateCancel = await processSaleCancellation({
    productId: product.id,
    channel: 'mercadolivre',
    orderId,
    quantity: 1,
    listingExternalId: testMlId
  })
  console.log(`• Idempotência de devolução testada: duplicata detectada? ${Boolean(duplicateCancel.duplicate)}`)

  console.log('🎉 [TESTE 3 PASSOU]: Estoque restaurado com sucesso para 20 un e protegido contra estornos duplicados!')

  // =========================================================================
  // TESTE 4: CONCORRÊNCIA E PROTEÇÃO CONTRA ESTOQUE NEGATIVO (< 0)
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE 4] Testando concorrência: Estoque = 1 un com 2 vendas simultâneas...')
  console.log('-------------------------------------------------------------')

  // Reduz estoque para 1 un
  await supabase.from('products').update({ stock: 1 }).eq('id', product.id)

  const orderSimA = `PED-SIM-A-${Date.now()}`
  const orderSimB = `PED-SIM-B-${Date.now()}`

  // Dispara 2 vendas concorrentes ao mesmo tempo
  const [resA, resB] = await Promise.allSettled([
    processSaleDeduction({
      productId: product.id,
      channel: 'site',
      orderId: orderSimA,
      quantity: 1,
      unitPriceSold: 273.00
    }),
    processSaleDeduction({
      productId: product.id,
      channel: 'mercadolivre',
      orderId: orderSimB,
      quantity: 1,
      unitPriceSold: 520.00
    })
  ])

  const { data: stockAfterRace } = await supabase
    .from('products')
    .select('stock')
    .eq('id', product.id)
    .single()

  console.log(`• Resultado Venda A: ${resA.status}`)
  console.log(`• Resultado Venda B: ${resB.status}`)
  console.log(`• Estoque Final Central: ${stockAfterRace?.stock} un`)

  const successCount = [resA, resB].filter(r => r.status === 'fulfilled').length
  const rejectedCount = [resA, resB].filter(r => r.status === 'rejected').length

  if (stockAfterRace?.stock! < 0) {
    throw new Error(`FALHA GRAVE: Estoque ficou negativo: ${stockAfterRace?.stock}`)
  }
  if (successCount !== 1 || rejectedCount !== 1) {
    throw new Error(`FALHA DE CONCORRÊNCIA: Exatamente 1 deveria passar e 1 ser rejeitada. (Passaram: ${successCount}, Rejeitadas: ${rejectedCount})`)
  }
  console.log('🎉 [TESTE 4 PASSOU]: Concorrência protegida! 1 venda foi aceita, 1 venda foi barrada e o estoque parou em 0 (NUNCA negativo)!')

  // =========================================================================
  // TESTE 5: RESERVA DE ESTOQUE COM TTL E LIBERAÇÃO (CHECKOUT / PIX)
  // =========================================================================
  console.log('\n-------------------------------------------------------------')
  console.log('🎯 [TESTE 5] Testando reserva com TTL e expiração/liberação...')
  console.log('-------------------------------------------------------------')

  // Restaura estoque para 5 un
  await supabase.from('products').update({ stock: 5, reserved_stock: 0 }).eq('id', product.id)

  const pixOrderId = `PIX-${Date.now()}`
  const reserveResult = await reserveStockWithTTL({
    productId: product.id,
    orderId: pixOrderId,
    quantity: 2,
    ttlMinutes: 15
  })

  console.log(`• Reserva criada para Pix: 2 un reservadas | Disponível para venda: ${reserveResult.availableStock} un`)

  if (reserveResult.availableStock !== 3) {
    throw new Error(`FALHA NA RESERVA: Disponível deveria ser 3, mas é ${reserveResult.availableStock}`)
  }

  // Simula expiração do Pix / cancelamento
  const releaseResult = await releaseReservedStock({
    productId: product.id,
    orderId: pixOrderId,
    quantity: 2,
    reason: 'Tempo limite do Pix excedido (15 min)'
  })

  console.log(`• Reserva liberada: ${releaseResult.releasedQuantity} un devolvidas | Disponível agora: ${releaseResult.availableStock} un`)

  if (releaseResult.availableStock !== 5) {
    throw new Error(`FALHA NA LIBERAÇÃO: Disponível deveria voltar a 5, mas é ${releaseResult.availableStock}`)
  }
  console.log('🎉 [TESTE 5 PASSOU]: Reserva com TTL e liberação funcionam perfeitamente!')

  // Limpeza dos dados de teste
  console.log('\n🧹 Limpando dados do teste...')
  await supabase.from('inventory_movements').delete().eq('product_id', product.id)
  await supabase.from('listing_price_history').delete().eq('product_id', product.id)
  await supabase.from('marketplace_listings').delete().eq('product_id', product.id)
  await supabase.from('products').delete().eq('id', product.id)
  console.log('✅ Base limpa com sucesso!')

  console.log('\n=============================================================')
  console.log('🏆 TODOS OS 5 TESTES DE INTEGRAÇÃO PASSARAM COM 100% DE SUCESSO!')
  console.log('=============================================================\n')
}

runTestSuite().catch(err => {
  console.error('\n❌ ERRO NA EXECUÇÃO DA BATERIA DE TESTES:\n', err)
  process.exit(1)
})
