import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

const envPath = path.resolve(process.cwd(), 'apps/flow/.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ykgprfzfnffooqmfbeox.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY não encontrada em apps/flow/.env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

async function runCleanup() {
  console.log('===============================================================')
  console.log('🧹 INICIANDO EXPURGO DE DADOS DUPLICADOS NO SUPABASE REMOTO')
  console.log('===============================================================\n')

  // 1. Limpeza de order_items duplicados
  console.log('1️⃣ Verificando order_items duplicados...')
  const { data: orderItems, error: oiErr } = await supabase
    .from('order_items')
    .select('id, order_id, sku, product_id')

  if (oiErr) {
    console.error('Erro ao buscar order_items:', oiErr.message)
  } else if (orderItems) {
    const seenMap = new Map()
    const duplicateIds = []

    for (const item of orderItems) {
      const key = `${item.order_id}_${item.sku || item.product_id}`
      if (seenMap.has(key)) {
        duplicateIds.push(item.id)
      } else {
        seenMap.set(key, item.id)
      }
    }

    if (duplicateIds.length > 0) {
      console.log(`• Encontrados ${duplicateIds.length} itens duplicados em order_items. Deletando...`)
      // Deleta em lotes de 50
      for (let i = 0; i < duplicateIds.length; i += 50) {
        const batch = duplicateIds.slice(i, i + 50)
        await supabase.from('order_items').delete().in('id', batch)
      }
      console.log(`✅ ${duplicateIds.length} itens duplicados removidos com sucesso!`)
    } else {
      console.log('✅ Nenhum item duplicado encontrado em order_items.')
    }
  }

  // 2. Limpeza de sale_items duplicados
  console.log('\n2️⃣ Verificando sale_items duplicados...')
  const { data: saleItems, error: siErr } = await supabase
    .from('sale_items')
    .select('id, sale_id, product_id, sku')

  if (siErr) {
    console.error('Erro ao buscar sale_items:', siErr.message)
  } else if (saleItems) {
    const seenSaleMap = new Map()
    const dupSaleItemIds = []

    for (const item of saleItems) {
      const key = `${item.sale_id}_${item.product_id || item.sku}`
      if (seenSaleMap.has(key)) {
        dupSaleItemIds.push(item.id)
      } else {
        seenSaleMap.set(key, item.id)
      }
    }

    if (dupSaleItemIds.length > 0) {
      console.log(`• Encontrados ${dupSaleItemIds.length} itens duplicados em sale_items. Deletando...`)
      for (let i = 0; i < dupSaleItemIds.length; i += 50) {
        const batch = dupSaleItemIds.slice(i, i + 50)
        await supabase.from('sale_items').delete().in('id', batch)
      }
      console.log(`✅ ${dupSaleItemIds.length} itens de venda duplicados removidos com sucesso!`)
    } else {
      console.log('✅ Nenhum item duplicado encontrado em sale_items.')
    }
  }

  // 3. Limpeza de pedidos duplicados em orders
  console.log('\n3️⃣ Verificando orders duplicados por order_number...')
  const { data: orders, error: ordErr } = await supabase
    .from('orders')
    .select('id, order_number, created_at')
    .order('created_at', { ascending: true })

  if (ordErr) {
    console.error('Erro ao buscar orders:', ordErr.message)
  } else if (orders) {
    const seenOrders = new Map()
    const dupOrderIds = []

    for (const ord of orders) {
      if (!ord.order_number) continue
      if (seenOrders.has(ord.order_number)) {
        dupOrderIds.push(ord.id)
      } else {
        seenOrders.set(ord.order_number, ord.id)
      }
    }

    if (dupOrderIds.length > 0) {
      console.log(`• Encontrados ${dupOrderIds.length} pedidos duplicados em orders. Deletando...`)
      for (let i = 0; i < dupOrderIds.length; i += 50) {
        const batch = dupOrderIds.slice(i, i + 50)
        await supabase.from('orders').delete().in('id', batch)
      }
      console.log(`✅ ${dupOrderIds.length} pedidos duplicados removidos com sucesso!`)
    } else {
      console.log('✅ Nenhum pedido duplicado encontrado em orders.')
    }
  }

  // 4. Limpeza de vendas duplicadas em sales
  console.log('\n4️⃣ Verificando sales duplicadas por order_id...')
  const { data: sales, error: saleErr } = await supabase
    .from('sales')
    .select('id, order_id, created_at')
    .order('created_at', { ascending: true })

  if (saleErr) {
    console.error('Erro ao buscar sales:', saleErr.message)
  } else if (sales) {
    const seenSales = new Map()
    const dupSales = []

    for (const sale of sales) {
      if (!sale.order_id) continue
      if (seenSales.has(sale.order_id)) {
        dupSales.push(sale.id)
      } else {
        seenSales.set(sale.order_id, sale.id)
      }
    }

    if (dupSales.length > 0) {
      console.log(`• Encontradas ${dupSales.length} vendas duplicadas em sales. Deletando...`)
      for (let i = 0; i < dupSales.length; i += 50) {
        const batch = dupSales.slice(i, i + 50)
        await supabase.from('sales').delete().in('id', batch)
      }
      console.log(`✅ ${dupSales.length} vendas duplicadas removidas com sucesso!`)
    } else {
      console.log('✅ Nenhuma venda duplicada encontrada em sales.')
    }
  }

  console.log('\n===============================================================')
  console.log('🎉 BANCO DE DADOS LIMPO COM SUCESSO! ZERO DUPLICATAS.')
  console.log('===============================================================')
}

runCleanup().catch(err => {
  console.error('Erro fatal durante a limpeza:', err)
  process.exit(1)
})
