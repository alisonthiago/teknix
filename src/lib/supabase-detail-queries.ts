import { createClient } from '@/utils/supabase/server'

export async function getProductDetail(id: string) {
  const s = await createClient()
  const { data: product } = await s.from('products').select('*, suppliers(*), product_images(*)').eq('id', id).single()
  if (!product) return null

  const { data: movements } = await s.from('inventory_movements').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(20)
  const { data: purchaseItems } = await s.from('purchase_items').select('*, purchases(*, suppliers(*))').eq('product_id', id).limit(20)
  const { data: orderItems } = await s.from('order_items').select('*, orders(*, marketplaces(*))').eq('product_id', id).limit(20)
  const { data: saleItems } = await s.from('sale_items').select('*, sales(*, marketplaces(*), marketplace_accounts(*))').eq('product_id', id).limit(20)
  const { data: listings } = await s.from('marketplace_listings').select('*, marketplaces(*), marketplace_accounts(*)').eq('product_id', id)

  const supplier = product.suppliers as Record<string, unknown> | null
  const totalRevenue = (saleItems || []).reduce((a: number, si: Record<string, unknown>) => {
    const sale = si.sales as Record<string, unknown> | null
    return a + Number(si.unit_price || sale?.total_revenue || 0) * Number(si.quantity || 0)
  }, 0)
  const totalCost = (saleItems || []).reduce((a: number, si: Record<string, unknown>) => a + (Number(si.cogs) || 0), 0)
  const totalFees = (saleItems || []).reduce((a: number, si: Record<string, unknown>) => a + Number(si.fees || 0) + Number(si.taxes || 0) + Number(si.other_costs || 0), 0)

  const rawImages = (product.product_images as any[] || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
  const images = rawImages.map(img => img.url)
  const primaryImage = images[0] || (product as any).image_url || '/placeholder-product.png'

  return {
    id: product.id, sku: product.sku, name: product.name,
    brand: (product.brand as string) || '—', model: (product.model as string) || '—',
    ean: (product.ean as string) || '—', category: (product.category as string) || '—',
    description: (product.description as string) || '', 
    image: primaryImage,
    images: images.length > 0 ? images : [primaryImage],
    status: (product.status as 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'PAUSED') || 'ACTIVE',
    created_at: product.created_at ? new Date(product.created_at as string).toLocaleDateString('pt-BR') : '—',
    updated_at: product.updated_at ? new Date(product.updated_at as string).toLocaleDateString('pt-BR') : '—',
    supplier: {
      id: supplier?.id as string || '', name: supplier?.name as string || '—',
      cnpj: supplier?.cnpj as string || '—', contact: supplier?.contact as string || '—',
      phone: supplier?.phone as string || '—', whatsapp: supplier?.whatsapp as string || '—',
      email: supplier?.email as string || '—', delivery_time: Number(supplier?.delivery_time || 0),
      min_order: Number(supplier?.min_order || 0), last_purchase: '—',
      cost: Number(product.cost_purchase || 0),
    },
    costs: {
      purchase: Number(product.cost_purchase || 0), freight: Number(product.freight_purchase || 0),
      packaging: Number(product.packaging_cost || 0), other: Number(product.other_costs || 0),
      real: Number(product.cost_real || product.cost_purchase || 0),
    },
    pricing: {
      current_price: Number(product.current_price || 0), suggested_price: Number(product.cost_real || product.cost_purchase || 0) * 1.5,
      minimum_price: Number(product.cost_real || product.cost_purchase || 0) * 1.1,
      profit: (Number(product.current_price || 0) - Number(product.cost_real || 0)),
      margin: Number(product.current_price || 0) > 0
        ? ((Number(product.current_price || 0) - Number(product.cost_real || 0)) / Number(product.current_price || 0) * 100) : 0,
    },
    stock: {
      physical: Number(product.stock || 0), reserved: 0,
      available: Number(product.stock || 0), minimum: Number(product.min_stock || 0),
      maximum: Number(product.min_stock || 0) * 3, location: 'Geral',
      value: Number(product.stock || 0) * Number(product.cost_real || 0),
    },
    summary: {
      total_sales: (saleItems || []).reduce((a: number, si: Record<string, unknown>) => a + Number(si.quantity || 0), 0),
      total_orders: (orderItems || []).length,
      total_revenue: totalRevenue, total_profit: totalRevenue - totalCost - totalFees,
      avg_margin: totalRevenue > 0 ? ((totalRevenue - totalCost - totalFees) / totalRevenue * 100) : 0,
      avg_ticket: (saleItems || []).length > 0 ? totalRevenue / (saleItems || []).length : 0,
    },
    marketplaces: (listings || []).map((l: Record<string, unknown>) => {
      const mp = l.marketplaces as Record<string, unknown> | null
      const acc = l.marketplace_accounts as Record<string, unknown> | null
      return {
        name: (mp?.name as string) || '—', 
        account_name: (acc?.name as string) || '—',
        listing_id: (l.external_id as string) || '—',
        price: Number(l.price || 0), stock: Number(l.stock_synced || 0),
        status: (l.status as string) === 'ACTIVE' ? 'ACTIVE' as const : 'INACTIVE' as const,
        last_sync: l.updated_at ? new Date(l.updated_at as string).toISOString() : new Date().toISOString(),
      }
    }),
    recent_sales: (saleItems || []).slice(0, 10).map((si: Record<string, unknown>) => {
      const sale = si.sales as Record<string, unknown> | null
      const mp = sale?.marketplaces as Record<string, unknown> | null
      const acc = sale?.marketplace_accounts as Record<string, unknown> | null
      return {
        id: si.id as string, order_id: (sale?.order_id as string) || '—',
        marketplace: (mp?.name as string) || '—',
        account_name: (acc?.name as string) || '—',
        quantity: Number(si.quantity || 0), price: Number(si.unit_price || 0),
        revenue: Number(si.quantity || 0) * Number(si.unit_price || 0),
        profit: Number(si.profit || 0),
        margin: Number(si.margin || 0),
        status: (sale?.status as string) || 'COMPLETED',
        date: si.created_at ? new Date(si.created_at as string).toLocaleDateString('pt-BR') : '—',
      }
    }),
    stock_movements: (movements || []).map((m: Record<string, unknown>) => {
      const d = m.created_at ? new Date(m.created_at as string) : new Date()
      const t = String(m.type || 'AJUSTE')
      const validTypes = ['COMPRA', 'VENDA', 'CANCELAMENTO', 'DEVOLUCAO', 'AJUSTE', 'PERDA', 'TRANSFERENCIA'] as const
      return {
        id: m.id as string, date: d.toLocaleDateString('pt-BR'),
        type: (validTypes.includes(t as typeof validTypes[number]) ? t : 'AJUSTE') as 'COMPRA' | 'VENDA' | 'CANCELAMENTO' | 'DEVOLUCAO' | 'AJUSTE' | 'PERDA' | 'TRANSFERENCIA',
        quantity: Number(m.quantity || 0),
        balance: Number(m.running_balance || 0), order_ref: (m.reference_id as string)?.slice(0, 8) || '—',
        user: (m.notes as string)?.split('—')[1]?.trim() || 'Sistema',
      }
    }),
    purchases_history: (purchaseItems || []).map((pi: Record<string, unknown>) => {
      const purchase = pi.purchases as Record<string, unknown> | null
      return {
        id: pi.id as string, 
        purchase_id: purchase?.id as string || '',
        order_ref: (purchase?.invoice as string) || 'S/N',
        supplier: (purchase?.suppliers as Record<string, unknown>)?.name as string || '—',
        quantity: Number(pi.quantity || 0), unit_cost: Number(pi.unit_cost || 0),
        total: Number(pi.quantity || 0) * Number(pi.unit_cost || 0),
        date: purchase?.date ? new Date(purchase.date as string).toLocaleDateString('pt-BR') : '—',
        status: (purchase?.status as string) || 'CONCLUIDA',
      }
    }),
    history: [
      ...((orderItems || []).slice(0, 3).map((oi: Record<string, unknown>) => ({
        id: oi.id as string, date: oi.created_at ? new Date(oi.created_at as string).toLocaleDateString('pt-BR') : '—',
        time: oi.created_at ? new Date(oi.created_at as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
        action: 'Venda registrada', user: 'Sistema',
        details: `Pedido #${(oi.orders as Record<string, unknown>)?.order_number || '—'} — ${oi.quantity} unidades`,
      }))),
      ...((purchaseItems || []).slice(0, 3).map((pi: Record<string, unknown>) => ({
        id: `p-${pi.id}`, date: pi.created_at ? new Date(pi.created_at as string).toLocaleDateString('pt-BR') : '—',
        time: pi.created_at ? new Date(pi.created_at as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
        action: 'Compra registrada', user: 'Alison',
        details: `${pi.quantity} unidades`,
      }))),
    ].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10),
    sales_chart: Array.from({ length: 11 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - (10 - i))
      const daySales = (saleItems || []).filter((si: Record<string, unknown>) => {
        const siDate = new Date(si.created_at as string)
        return siDate.toDateString() === d.toDateString()
      })
      return {
        period: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
        units: daySales.reduce((a: number, si: Record<string, unknown>) => a + Number(si.quantity || 0), 0),
        revenue: daySales.reduce((a: number, si: Record<string, unknown>) => a + Number(si.unit_price || 0) * Number(si.quantity || 0), 0),
      }
    }),
  }
}

export async function getOrderDetail(id: string) {
  const s = await createClient()
  const { data: order } = await s
    .from('orders')
    .select('*, marketplaces(name, code, logo), order_items(*, products(*, product_images(*)))')
    .or(`id.eq.${id.includes('-') && id.length === 36 ? id : '00000000-0000-0000-0000-000000000000'},order_number.eq.${id}`)
    .single()
  if (!order) return null

  const mp = order.marketplaces as Record<string, unknown> | null

  const { data: history } = await s.from('order_status_history').select('*').eq('order_id', id).order('created_at', { ascending: true })

  return {
    id: order.id as string, order_number: order.order_number as string,
    marketplace: (mp?.name as string) || order.channel || 'Mercado Livre',
    customer: {
      name: order.customer_name as string || '—', email: order.customer_email as string || '—',
      phone: order.customer_phone as string || '—', cpf: order.customer_cpf as string || '—',
    },
    date: order.created_at ? new Date(order.created_at as string).toLocaleDateString('pt-BR') : '—',
    status: order.status as string,
    items: (order.order_items as Record<string, unknown>[] || []).map((item: Record<string, unknown>) => {
      const prod = item.products as Record<string, unknown> | null
      const rawImages = (prod?.product_images as any[] || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      const imageUrl = rawImages[0]?.url || (prod as any)?.image_url || null

      return {
        sku: (prod?.sku as string) || (item.sku as string) || '—',
        name: (prod?.name as string) || (item.product_name as string) || 'Produto Mercado Livre',
        quantity: Number(item.quantity || 1), 
        price: Number(item.unit_price || 0),
        total: Number(item.total_price || (Number(item.unit_price || 0) * Number(item.quantity || 1))),
        image: imageUrl
      }
    }),
    payment: {
      method: (order.payment_method as string) || 'PIX',
      installments: Number(order.installments || 1),
      total: Number(order.total_amount || 0), fee: Number(order.marketplace_fees || 0),
      net: Number(order.net_amount || 0),
    },
    shipping: {
      address: order.shipping_address as string || '—', city: order.shipping_city as string || '—',
      state: order.shipping_state as string || '—', zip: order.shipping_zip as string || '—',
      method: (order.shipping_method as string) || 'SEDEX',
      cost: Number(order.shipping_cost || 0), tracking: (order.tracking_code as string) || '',
    },
    timeline: (history || []).map((h: Record<string, unknown>) => {
      const d = h.created_at ? new Date(h.created_at as string) : new Date()
      return {
        date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: h.to_status as string, description: (h.notes as string) || `Status: ${h.to_status}`,
      }
    }),
  }
}

export async function getSaleDetail(id: string) {
  const s = await createClient()
  const { data: sale } = await s.from('sales').select('*, marketplaces(*, code, logo), marketplace_accounts(*), sale_items(*, products(name, sku, brand))').eq('id', id).single()
  if (!sale) return null

  const mp = sale.marketplaces as Record<string, unknown> | null
  const items = (sale.sale_items as Record<string, unknown>[] || [])
  const firstItem = items[0]
  const product = firstItem?.products as Record<string, unknown> | null

  const totalCost = items.reduce((a: number, si: Record<string, unknown>) => a + Number(si.cogs || 0), 0)

  return {
    id: sale.id as string, order_id: sale.order_id as string,
    marketplace: (mp?.name as string) || '—',
    customer: {
      name: sale.customer_name as string || '—', email: sale.customer_email as string || '—',
      phone: sale.customer_phone as string || '—',
    },
    product: {
      id: product?.id as string || '', sku: product?.sku as string || '—',
      name: product?.name as string || '—', brand: (product?.brand as string) || '—',
    },
    quantity: items.reduce((a: number, si: Record<string, unknown>) => a + Number(si.quantity || 0), 0),
    price: Number(firstItem?.unit_price || 0),
    revenue: Number(sale.total_revenue || 0), cost: totalCost,
    fees: Number(sale.marketplace_fees || 0), freight: Number(sale.shipping_cost || 0),
    taxes: Number(sale.taxes || 0),
    profit: Number(sale.total_revenue || 0) - totalCost - Number(sale.marketplace_fees || 0),
    margin: Number(sale.total_revenue || 0) > 0
      ? ((Number(sale.total_revenue || 0) - totalCost - Number(sale.marketplace_fees || 0)) / Number(sale.total_revenue || 0) * 100) : 0,
    date: sale.created_at ? new Date(sale.created_at as string).toLocaleDateString('pt-BR') : '—',
    status: sale.status as string,
    payment: { method: sale.payment_method as string || 'PIX', installments: Number(sale.installments || 1) },
    shipping: {
      method: (sale.shipping_method as string) || 'SEDEX',
      tracking: sale.tracking_number as string || '',
      status: (sale.shipment_status as string) || 'Pendente',
    },
    timeline: [
      { date: sale.created_at ? new Date(sale.created_at as string).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—',
        time: sale.created_at ? new Date(sale.created_at as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
        action: 'Venda registrada', details: `${(mp?.name as string) || '—'} — #${sale.order_id}` },
    ],
  }
}

export async function getSupplierDetail(id: string) {
  const s = await createClient()
  const { data: supplier } = await s.from('suppliers').select('*').eq('id', id).single()
  if (!supplier) return null

  const { data: products } = await s.from('products').select('id, sku, name, cost_purchase, stock').eq('supplier_id', id)
  const { data: purchases } = await s.from('purchases').select('*, purchase_items(*)').eq('supplier_id', id).order('created_at', { ascending: false })
  const { data: contacts } = await s.from('supplier_contacts').select('*').eq('supplier_id', id).order('created_at', { ascending: true })

  const totalPurchased = (purchases || []).reduce((a: number, p: Record<string, unknown>) => a + Number(p.total_cost || 0), 0)

  return {
    id: supplier.id as string, name: supplier.name as string,
    logo_url: supplier.logo_url as string || null,
    cnpj: supplier.cnpj as string || '—', contact: supplier.contact as string || '—',
    phone: supplier.phone as string || '—', whatsapp: supplier.whatsapp as string || '—',
    email: supplier.email as string || '—', city: supplier.city as string || '—',
    state: supplier.state as string || '—', address: supplier.address as string || '—',
    distributor_city: supplier.distributor_city as string || '',
    distributor_state: supplier.distributor_state as string || '',
    pickup_address: supplier.pickup_address as string || '',
    delivery_time: Number(supplier.delivery_time || 0), min_order: Number(supplier.min_order || 0),
    freight: Number(supplier.freight || 0),
    payment_terms: supplier.payment_terms as string || '—',
    bank: (supplier.bank_name as string) || '—', agency: (supplier.bank_agency as string) || '—',
    account: (supplier.bank_account as string) || '—', pix_key: supplier.pix_key as string || '—',
    notes: supplier.notes as string || '', status: supplier.status as string || 'ACTIVE',
    created_at: supplier.created_at ? new Date(supplier.created_at as string).toLocaleDateString('pt-BR') : '—',
    contacts: (contacts || []).map((c: Record<string, unknown>) => ({
      id: c.id as string,
      name: c.name as string | null,
      phone: c.phone as string,
      is_whatsapp: Boolean(c.is_whatsapp)
    })),
    products: (products || []).map((p: Record<string, unknown>) => ({
      id: p.id as string, sku: p.sku as string, name: p.name as string,
      cost: Number(p.cost_purchase || 0), stock: Number(p.stock || 0),
    })),
    purchases: (purchases || []).map((p: Record<string, unknown>) => ({
      id: p.id as string, date: p.created_at ? new Date(p.created_at as string).toLocaleDateString('pt-BR') : '—',
      invoice: (p.invoice as string) || '—',
      items: (p.purchase_items as Record<string, unknown>[] || []).length,
      total: Number(p.total_cost || 0), status: (p.status as string) || 'CONCLUIDA',
    })),
    stats: {
      total_purchased: totalPurchased, total_orders: (purchases || []).length,
      avg_ticket: (purchases || []).length > 0 ? totalPurchased / (purchases || []).length : 0,
      products_count: (products || []).length,
    },
    timeline: (purchases || []).slice(0, 5).map((p: Record<string, unknown>) => ({
      date: p.created_at ? new Date(p.created_at as string).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—',
      time: p.created_at ? new Date(p.created_at as string).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—',
      action: 'Compra realizada',
      details: `${(p.invoice as string) || 'NF'} — R$ ${Number(p.total_cost || 0).toLocaleString('pt-BR')}`,
    })),
  }
}
