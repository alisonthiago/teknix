/**
 * Centralized calculation service for TEKNIX.
 * All modules MUST use these functions to avoid divergent formulas.
 */

export interface CostBreakdown {
  unitCost: number
  freightPerUnit: number
  packagingCost: number
  otherCosts: number
  realUnitCost: number
}

export interface FeesBreakdown {
  percentageFee: number
  fixedFee: number
  percentageValue: number
  totalFees: number
}

export interface MarginResult {
  profit: number
  margin: number
  status: 'LUCRO' | 'MARGEM_BOA' | 'MARGEM_BAIXA' | 'PREJUIZO'
}

/**
 * Custo Real = Custo de Compra + Frete + Embalagem + Outros Custos
 */
export function calculateRealCost(item: {
  costPurchase: number
  freightPurchase?: number
  packagingCost?: number
  otherCosts?: number
}): CostBreakdown {
  const unitCost = item.costPurchase || 0
  const freightPerUnit = item.freightPurchase || 0
  const packagingCost = item.packagingCost || 0
  const otherCosts = item.otherCosts || 0

  return {
    unitCost,
    freightPerUnit,
    packagingCost,
    otherCosts,
    realUnitCost: unitCost + freightPerUnit + packagingCost + otherCosts,
  }
}

/**
 * Marketplace fees calculation
 */
export function calculateMarketplaceFees(salePrice: number, marketplace: {
  percentageFee?: number
  fixedFee?: number
}): FeesBreakdown {
  const percentageFee = marketplace.percentageFee || 0
  const fixedFee = marketplace.fixedFee || 0
  const percentageValue = salePrice * (percentageFee / 100)
  const totalFees = percentageValue + fixedFee

  return {
    percentageFee,
    fixedFee,
    percentageValue,
    totalFees,
  }
}

/**
 * Lucro = Receita - Custo - Taxas - Frete - Impostos - Outros Custos
 */
export function calculateProfit(sale: {
  revenue: number
  realUnitCost: number
  quantity: number
  fees: number
  freight: number
  taxes: number
  otherCosts?: number
}): number {
  const totalCost = sale.realUnitCost * sale.quantity
  return sale.revenue - totalCost - sale.fees - sale.freight - sale.taxes - (sale.otherCosts || 0)
}

/**
 * Margem = (Lucro / Receita) * 100
 */
export function calculateMargin(profit: number, revenue: number): number {
  if (revenue === 0) return 0
  return (profit / revenue) * 100
}

/**
 * Full margin result with status classification
 */
export function calculateMarginResult(sale: {
  revenue: number
  realUnitCost: number
  quantity: number
  fees: number
  freight: number
  taxes: number
  otherCosts?: number
}): MarginResult {
  const profit = calculateProfit(sale)
  const margin = calculateMargin(profit, sale.revenue)

  let status: MarginResult['status'] = 'PREJUIZO'
  if (margin > 25) status = 'MARGEM_BOA'
  else if (margin > 15) status = 'LUCRO'
  else if (margin > 0) status = 'MARGEM_BAIXA'

  return { profit, margin, status }
}

/**
 * Preço Sugerido = Custo Real / (1 - (Taxa% + Imposto% + Margem%) / 100)
 */
export function calculateSuggestedPrice(params: {
  realCost: number
  marketplaceFeePercent: number
  taxPercent: number
  desiredMarginPercent: number
  fixedFees?: number
}): number {
  const { realCost, marketplaceFeePercent, taxPercent, desiredMarginPercent, fixedFees = 0 } = params
  const totalDeductionsPercent = marketplaceFeePercent + taxPercent + desiredMarginPercent

  if (totalDeductionsPercent >= 100) return realCost * 10

  const divisor = 1 - totalDeductionsPercent / 100
  const price = realCost / divisor

  // Add fixed fees amortized
  return Math.ceil(price + fixedFees)
}

/**
 * Preço Mínimo = Custo Real / (1 - (Taxa% + Imposto%) / 100)
 */
export function calculateMinimumPrice(params: {
  realCost: number
  marketplaceFeePercent: number
  taxPercent: number
  fixedFees?: number
}): number {
  const { realCost, marketplaceFeePercent, taxPercent, fixedFees = 0 } = params
  const totalDeductionsPercent = marketplaceFeePercent + taxPercent

  if (totalDeductionsPercent >= 100) return realCost * 10

  const divisor = 1 - totalDeductionsPercent / 100
  return Math.ceil(realCost / divisor + fixedFees)
}

/**
 * Stock value = sum(quantity * realUnitCost) for all products
 */
export function calculateStockValue(items: Array<{ quantity: number; realUnitCost: number }>): number {
  return items.reduce((sum, item) => sum + item.quantity * item.realUnitCost, 0)
}

/**
 * Generate price simulation table
 */
export function generatePriceSimulation(params: {
  startPrice: number
  step: number
  count: number
  realCost: number
  marketplaceFeePercent: number
  fixedFees: number
  taxPercent: number
}): Array<{
  price: number
  totalCost: number
  netRevenue: number
  profit: number
  margin: number
  status: MarginResult['status']
}> {
  const results = []

  for (let i = 0; i < params.count; i++) {
    const price = params.startPrice + i * params.step
    const fees = calculateMarketplaceFees(price, { percentageFee: params.marketplaceFeePercent })
    const taxValue = price * (params.taxPercent / 100)
    const totalCost = params.realCost + fees.totalFees + taxValue + params.fixedFees
    const netRevenue = price - fees.totalFees - taxValue
    const profit = netRevenue - params.realCost
    const margin = calculateMargin(profit, price)

    let status: MarginResult['status'] = 'PREJUIZO'
    if (margin > 25) status = 'MARGEM_BOA'
    else if (margin > 15) status = 'LUCRO'
    else if (margin > 0) status = 'MARGEM_BAIXA'

    results.push({ price, totalCost, netRevenue, profit, margin, status })
  }

  return results
}

/**
 * Calculate order totals from items
 */
export function calculateOrderTotals(items: Array<{
  quantity: number
  unitPrice: number
  unitCost: number
  fees?: number
  freight?: number
  taxes?: number
}>): {
  totalRevenue: number
  totalCost: number
  totalFees: number
  totalFreight: number
  totalTaxes: number
  profit: number
  margin: number
} {
  let totalRevenue = 0
  let totalCost = 0
  let totalFees = 0
  let totalFreight = 0
  let totalTaxes = 0

  for (const item of items) {
    totalRevenue += item.quantity * item.unitPrice
    totalCost += item.quantity * item.unitCost
    totalFees += item.fees || 0
    totalFreight += item.freight || 0
    totalTaxes += item.taxes || 0
  }

  const profit = totalRevenue - totalCost - totalFees - totalFreight - totalTaxes
  const margin = calculateMargin(profit, totalRevenue)

  return { totalRevenue, totalCost, totalFees, totalFreight, totalTaxes, profit, margin }
}
