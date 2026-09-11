import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ykgprfzfnffooqmfbeox.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY não definida')
  console.error('Execute com: SUPABASE_SERVICE_KEY=<sua-service-key> node scripts/cleanup-products.mjs')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
})

async function cleanupProducts() {
  console.log('🔍 Buscando todos os produtos...')
  
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select('id, name, sku')

  if (prodErr) {
    console.error('❌ Erro ao buscar produtos:', prodErr.message)
    process.exit(1)
  }

  console.log(`📦 Encontrados ${products?.length ?? 0} produtos`)
  if (!products?.length) {
    console.log('✅ Nenhum produto encontrado. Banco já está limpo.')
    return
  }

  const productIds = products.map(p => p.id)
  console.log('IDs:', productIds.slice(0, 5), '...')

  // 1. Limpar stock_reservations
  console.log('\n🧹 Limpando stock_reservations...')
  const { error: e1 } = await supabase
    .from('stock_reservations')
    .delete()
    .in('product_id', productIds)
  if (e1) console.warn('  ⚠️  stock_reservations:', e1.message)
  else console.log('  ✅ stock_reservations limpo')

  // 2. Limpar inventory_movements
  console.log('🧹 Limpando inventory_movements...')
  const { error: e2 } = await supabase
    .from('inventory_movements')
    .delete()
    .in('product_id', productIds)
  if (e2) console.warn('  ⚠️  inventory_movements:', e2.message)
  else console.log('  ✅ inventory_movements limpo')

  // 3. Limpar marketplace_listings
  console.log('🧹 Limpando marketplace_listings...')
  const { error: e3 } = await supabase
    .from('marketplace_listings')
    .delete()
    .in('product_id', productIds)
  if (e3) console.warn('  ⚠️  marketplace_listings:', e3.message)
  else console.log('  ✅ marketplace_listings limpo')

  // 4. Limpar product_images
  console.log('🧹 Limpando product_images...')
  const { error: e4 } = await supabase
    .from('product_images')
    .delete()
    .in('product_id', productIds)
  if (e4) console.warn('  ⚠️  product_images (pode não existir):', e4.message)
  else console.log('  ✅ product_images limpo')

  // 5. Limpar product_variants
  console.log('🧹 Limpando product_variants...')
  const { error: e5 } = await supabase
    .from('product_variants')
    .delete()
    .in('product_id', productIds)
  if (e5) console.warn('  ⚠️  product_variants (pode não existir):', e5.message)
  else console.log('  ✅ product_variants limpo')

  // 6. Limpar product_categories (tabela de pivot se existir)
  console.log('🧹 Limpando product_categories...')
  const { error: e6 } = await supabase
    .from('product_categories')
    .delete()
    .in('product_id', productIds)
  if (e6) console.warn('  ⚠️  product_categories (pode não existir):', e6.message)
  else console.log('  ✅ product_categories limpo')

  // 7. NÃO apagar order_items — manter histórico de vendas
  // Verificar se order_items referencia produtos
  console.log('\n📋 Verificando order_items (serão preservados)...')
  const { data: oi, error: e7 } = await supabase
    .from('order_items')
    .select('id, product_id')
    .in('product_id', productIds)
  if (e7) console.warn('  ⚠️  order_items:', e7.message)
  else {
    console.log(`  ℹ️  ${oi?.length ?? 0} order_items referenciam esses produtos - serão preservados`)
    // NÃO deletar order_items
  }

  // 8. Deletar os produtos
  console.log('\n🗑️  Deletando produtos...')
  const { error: e8, count } = await supabase
    .from('products')
    .delete()
    .in('id', productIds)
  
  if (e8) {
    console.error('❌ Erro ao deletar produtos:', e8.message)
    console.error('  Detalhe:', e8.details)
    // Tentar deletar um por um para ver qual falha
    console.log('\n  Tentando deletar individualmente...')
    for (const prod of products) {
      const { error: ep } = await supabase.from('products').delete().eq('id', prod.id)
      if (ep) console.warn(`  ❌ ${prod.name} (${prod.id}): ${ep.message}`)
      else console.log(`  ✅ ${prod.name}`)
    }
  } else {
    console.log(`  ✅ ${products.length} produtos deletados`)
  }

  // 9. Verificar resultado final
  console.log('\n🔍 Verificação final...')
  const { data: remaining, error: e9 } = await supabase
    .from('products')
    .select('id, name')
  
  if (e9) console.warn('  ⚠️  Erro na verificação:', e9.message)
  else console.log(`  📦 Produtos restantes: ${remaining?.length ?? 0}`)

  if ((remaining?.length ?? 0) === 0) {
    console.log('\n🎉 LIMPEZA CONCLUÍDA COM SUCESSO! 0 produtos no banco.')
  } else {
    console.log('\n⚠️  Ainda restam produtos. Verificar manualmente.')
    remaining?.forEach(p => console.log(`  - ${p.name} (${p.id})`))
  }
}

cleanupProducts().catch(err => {
  console.error('Erro fatal:', err)
  process.exit(1)
})
