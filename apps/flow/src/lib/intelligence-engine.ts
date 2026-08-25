/**
 * TEKTOU Intelligence & Operations Engine
 * 
 * Central mathematical and operational intelligence calculations based on real
 * Supabase data (orders, products, order_items, inventory_movements, marketplace_accounts).
 */

export interface RealProfitMetrics {
  totalRevenue: number
  totalCOGS: number
  totalFees: number
  totalFreight: number
  totalTaxes: number
  netProfit: number
  netMarginPercentage: number
  averageTicket: number
  ordersCount: number
}

export interface RankedProduct {
  id: string
  name: string
  sku: string
  ean?: string
  stock: number
  minStock: number
  costPrice: number
  salePrice: number
  unitsSold: number
  revenue: number
  profit: number
  margin: number
  dailyVelocity: number
  daysOfInventory: number
  category: 'TOP_SELLER' | 'HIGH_REVENUE' | 'FAST_MOVER' | 'LOW_MARGIN' | 'DEAD_STOCK' | 'NORMAL'
}

export interface MarketplaceComparison {
  name: string
  code: string
  logo?: string
  ordersCount: number
  unitsSold: number
  revenue: number
  fees: number
  netProfit: number
  netMargin: number
  averageTicket: number
}

export interface PurchaseSuggestion {
  productId: string
  productName: string
  sku: string
  stock: number
  minStock: number
  costPrice: number
  dailyVelocity: number
  daysUntilStockout: number
  suggestedQuantity: number
  estimatedInvestment: number
  urgency: 'CRITICAL' | 'MODERATE' | 'NORMAL'
}

export interface OperationalAnomaly {
  id: string
  type: 'SALES_DROP' | 'OUT_OF_STOCK_ACTIVE' | 'INTEGRATION_DELAY' | 'LOW_MARGIN_ALERT'
  title: string
  description: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  actionLabel: string
  actionUrl: string
}

/**
 * 1. Calculate REAL net profit decomposition from actual orders and items
 */
export function calculateRealProfit(orders: any[] = []): RealProfitMetrics {
  let totalRevenue = 0
  let totalCOGS = 0
  let totalFees = 0
  let totalFreight = 0
  let totalTaxes = 0

  orders.forEach((o) => {
    // Only count completed/paid orders for finalized financial metrics
    if (o.status === 'CANCELADO' || o.status === 'ERROR') return

    const rev = Number(o.total_amount || 0)
    const cost = Number(o.total_cost || 0)
    const fee = Number(o.total_fees || 0)
    const freight = Number(o.total_freight || 0)
    const tax = Number(o.total_taxes || 0)

    totalRevenue += rev
    totalCOGS += cost
    totalFees += fee
    totalFreight += freight
    totalTaxes += tax
  })

  const totalDeductions = totalCOGS + totalFees + totalFreight + totalTaxes
  const netProfit = totalRevenue - totalDeductions
  const netMarginPercentage = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0
  const ordersCount = orders.filter((o) => o.status !== 'CANCELADO').length
  const averageTicket = ordersCount > 0 ? totalRevenue / ordersCount : 0

  return {
    totalRevenue,
    totalCOGS,
    totalFees,
    totalFreight,
    totalTaxes,
    netProfit,
    netMarginPercentage,
    averageTicket,
    ordersCount,
  }
}

/**
 * 2. Rank and categorize products based on real order items and catalog data
 */
export function rankProducts(products: any[] = [], orderItems: any[] = []): RankedProduct[] {
  // Aggregate sales per product
  const salesMap = new Map<string, { unitsSold: number; revenue: number; profit: number }>()

  orderItems.forEach((item) => {
    const pId = item.product_id || item.products?.id
    if (!pId) return

    const qty = Number(item.quantity || 1)
    const price = Number(item.unit_price || 0)
    const cost = Number(item.unit_cost || item.total_cost || 0)
    const fee = Number(item.fees || 0)
    const rev = qty * price
    const prof = Number(item.profit || rev - cost - fee)

    const prev = salesMap.get(pId) || { unitsSold: 0, revenue: 0, profit: 0 }
    salesMap.set(pId, {
      unitsSold: prev.unitsSold + qty,
      revenue: prev.revenue + rev,
      profit: prev.profit + prof,
    })
  })

  return products.map((prod) => {
    const s = salesMap.get(prod.id) || { unitsSold: 0, revenue: 0, profit: 0 }
    const stock = Number(prod.stock || 0)
    const minStock = Number(prod.min_stock || 3)
    const costPrice = Number(prod.cost_purchase || prod.costs?.real || 0)
    const salePrice = Number(prod.price || prod.pricing?.current_price || 0)

    // Calculate daily velocity based on 30-day window
    const dailyVelocity = s.unitsSold > 0 ? s.unitsSold / 30 : 0
    const daysOfInventory = dailyVelocity > 0 ? Math.round(stock / dailyVelocity) : (stock > 0 ? 999 : 0)

    const margin = s.revenue > 0 ? (s.profit / s.revenue) * 100 : (salePrice > 0 ? ((salePrice - costPrice) / salePrice) * 100 : 0)

    let category: RankedProduct['category'] = 'NORMAL'

    if (s.unitsSold >= 10) {
      category = 'TOP_SELLER'
    } else if (s.revenue >= 1000) {
      category = 'HIGH_REVENUE'
    } else if (dailyVelocity >= 0.8) {
      category = 'FAST_MOVER'
    } else if (margin < 15 && s.revenue > 0) {
      category = 'LOW_MARGIN'
    } else if (s.unitsSold === 0 && stock > 0) {
      category = 'DEAD_STOCK'
    }

    return {
      id: prod.id,
      name: prod.name || 'Produto sem nome',
      sku: prod.sku || 'SEM-SKU',
      ean: prod.ean,
      stock,
      minStock,
      costPrice,
      salePrice,
      unitsSold: s.unitsSold,
      revenue: s.revenue,
      profit: s.profit,
      margin,
      dailyVelocity,
      daysOfInventory,
      category,
    }
  }).sort((a, b) => b.revenue - a.revenue)
}

/**
 * 3. Cross-Marketplace comparison matrix
 */
export function compareMarketplaces(orders: any[] = []): MarketplaceComparison[] {
  const map = new Map<string, MarketplaceComparison>()

  orders.forEach((o) => {
    if (o.status === 'CANCELADO') return

    const mpName = (o.marketplaces as any)?.name || o.marketplace || 'Mercado Livre'
    const code = (o.marketplaces as any)?.code || mpName.toLowerCase().replace(/\s+/g, '_')
    const rev = Number(o.total_amount || 0)
    const cost = Number(o.total_cost || 0)
    const fees = Number(o.total_fees || 0)
    const freight = Number(o.total_freight || 0)
    const profit = Number(o.profit || rev - cost - fees - freight)

    const cur = map.get(mpName) || {
      name: mpName,
      code,
      logo: (o.marketplaces as any)?.logo,
      ordersCount: 0,
      unitsSold: 0,
      revenue: 0,
      fees: 0,
      netProfit: 0,
      netMargin: 0,
      averageTicket: 0,
    }

    cur.ordersCount += 1
    cur.revenue += rev
    cur.fees += fees
    cur.netProfit += profit
    cur.unitsSold += Array.isArray(o.order_items) ? o.order_items.reduce((a: number, it: any) => a + Number(it.quantity || 1), 0) : 1

    map.set(mpName, cur)
  })

  return Array.from(map.values()).map((mp) => ({
    ...mp,
    netMargin: mp.revenue > 0 ? (mp.netProfit / mp.revenue) * 100 : 0,
    averageTicket: mp.ordersCount > 0 ? mp.revenue / mp.ordersCount : 0,
  })).sort((a, b) => b.revenue - a.revenue)
}

/**
 * 4. Automated Purchase Suggestions based on burn rate & lead time
 */
export function generatePurchaseSuggestions(
  products: any[] = [],
  orderItems: any[] = [],
  coverageDays: number = 30
): PurchaseSuggestion[] {
  const ranked = rankProducts(products, orderItems)

  const suggestions: PurchaseSuggestion[] = []

  ranked.forEach((p) => {
    const isCritical = p.stock <= p.minStock || p.daysOfInventory <= 5

    if (isCritical || (p.dailyVelocity > 0 && p.daysOfInventory < coverageDays)) {
      const daily = p.dailyVelocity > 0 ? p.dailyVelocity : 0.2
      const targetStock = Math.ceil(daily * coverageDays)
      const qtyToBuy = Math.max(p.minStock * 2, targetStock - p.stock)

      if (qtyToBuy > 0) {
        suggestions.push({
          productId: p.id,
          productName: p.name,
          sku: p.sku,
          stock: p.stock,
          minStock: p.minStock,
          costPrice: p.costPrice,
          dailyVelocity: p.dailyVelocity,
          daysUntilStockout: p.daysOfInventory,
          suggestedQuantity: qtyToBuy,
          estimatedInvestment: qtyToBuy * p.costPrice,
          urgency: p.stock <= 0 ? 'CRITICAL' : (p.daysOfInventory <= 4 ? 'MODERATE' : 'NORMAL'),
        })
      }
    }
  })

  return suggestions.sort((a, b) => a.daysUntilStockout - b.daysUntilStockout)
}

/**
 * 5. Operational Anomaly Detector
 */
export function detectOperationalAnomalies(
  orders: any[] = [],
  products: any[] = [],
  accounts: any[] = []
): OperationalAnomaly[] {
  const anomalies: OperationalAnomaly[] = []

  // Check out-of-stock products
  const outOfStock = products.filter((p) => Number(p.stock || 0) <= 0 && p.status === 'ACTIVE')
  if (outOfStock.length > 0) {
    anomalies.push({
      id: 'anom-stock-0',
      type: 'OUT_OF_STOCK_ACTIVE',
      title: `${outOfStock.length} produtos ativos com estoque zerado`,
      description: 'Anúncios ativos sem estoque correm risco de cancelamento e penalização na reputação.',
      severity: 'HIGH',
      actionLabel: 'Ver Produtos Esgotados',
      actionUrl: '/operacao',
    })
  }

  // Check stale integrations
  const staleAccounts = accounts.filter((a) => a.status === 'ERROR' || a.sync_status === 'FAILED')
  if (staleAccounts.length > 0) {
    anomalies.push({
      id: 'anom-int-stale',
      type: 'INTEGRATION_DELAY',
      title: `${staleAccounts.length} conta(s) com erro de sincronização`,
      description: 'Verifique a conexão dos tokens com o Mercado Livre ou outros canais.',
      severity: 'HIGH',
      actionLabel: 'Reconectar Contas',
      actionUrl: '/marketplaces',
    })
  }

  return anomalies
}
