/* ==========================================================================
   TEKNIX CORE — SISTEMA CENTRAL INTELIGENTE DE CATEGORIAS
   Compartilhado entre FLOW + HUB + SITE
   ========================================================================== */

export type LinkingMode = 'manual' | 'automatic' | 'hybrid'
export type RuleOperator = 'AND' | 'OR'

export type RuleField =
  | 'name'
  | 'description'
  | 'brand'
  | 'model'
  | 'sku'
  | 'tag'
  | 'min_price'
  | 'max_price'
  | 'in_stock'
  | 'status'

export type RuleCondition =
  | 'contains'
  | 'equals'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'is_true'

export interface CategoryRule {
  id: string
  field: RuleField
  condition: RuleCondition
  value: string | number | boolean
}

export interface MarketplaceMapping {
  channel: 'mercadolivre' | 'shopee' | 'amazon' | 'magalu' | string
  external_category_id: string
  external_category_name?: string
}

export interface CentralCategory {
  id: string
  name: string
  slug: string
  parent_id: string | null
  description?: string
  image_url?: string
  icon?: string
  status: 'active' | 'inactive'
  is_published: boolean
  sort_order: number
  linking_mode: LinkingMode
  rule_operator: RuleOperator
  rules: CategoryRule[]
  manual_product_ids: string[]
  excluded_product_ids: string[]
  seo_title?: string
  seo_description?: string
  canonical_url?: string
  marketplace_mappings?: MarketplaceMapping[]
  page_id?: string | null
  created_at?: string
  updated_at?: string
}

export interface ProductCategoryLink {
  productId: string
  productName: string
  sku: string
  brand: string
  stock: number
  price: number
  source: 'MANUAL' | 'REGRA AUTOMATICA'
  matchedRuleId?: string
}

/**
 * Normaliza strings para busca e comparação:
 * Remove diacríticos/acentos, converte para minúsculas e remove espaços extras.
 */
export function normalizeText(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Avalia uma única regra determinística em relação a um produto.
 */
export function matchesRule(product: any, rule: CategoryRule): boolean {
  if (!product || !rule) return false

  const normValue = typeof rule.value === 'string' ? normalizeText(rule.value) : rule.value

  switch (rule.field) {
    case 'name': {
      const pName = normalizeText(product.name || product.title)
      if (rule.condition === 'equals') return pName === normValue
      if (rule.condition === 'starts_with') return pName.startsWith(String(normValue))
      return pName.includes(String(normValue))
    }

    case 'description': {
      const pDesc = normalizeText(product.description || product.store_description || product.notes || product.short_description)
      return pDesc.includes(String(normValue))
    }

    case 'brand': {
      const pBrand = normalizeText(product.brand)
      if (rule.condition === 'equals') return pBrand === normValue
      return pBrand.includes(String(normValue))
    }

    case 'model': {
      const pModel = normalizeText(product.model)
      return pModel.includes(String(normValue))
    }

    case 'sku': {
      const pSku = normalizeText(product.sku)
      if (rule.condition === 'starts_with') return pSku.startsWith(String(normValue))
      if (rule.condition === 'ends_with') return pSku.endsWith(String(normValue))
      if (rule.condition === 'equals') return pSku === normValue
      return pSku.includes(String(normValue))
    }

    case 'tag': {
      const tags = Array.isArray(product.tags)
        ? product.tags.map(normalizeText)
        : typeof product.tags === 'string'
        ? product.tags.split(',').map(normalizeText)
        : []
      return tags.some((t: string) => t.includes(String(normValue)))
    }

    case 'min_price': {
      const price = Number(product.promo_price ?? product.sale_price ?? product.price ?? 0)
      return price >= Number(rule.value)
    }

    case 'max_price': {
      const price = Number(product.promo_price ?? product.sale_price ?? product.price ?? 0)
      return price <= Number(rule.value)
    }

    case 'in_stock': {
      const stock = Number(product.stock ?? product.stock_quantity ?? 0)
      return stock > 0
    }

    case 'status': {
      const status = String(product.status || '').toLowerCase()
      return status === String(normValue)
    }

    default:
      return false
  }
}

/**
 * Avalia o conjunto de regras inteligentes para um produto conforme o operador (AND/OR).
 */
export function matchesCategoryRules(
  product: any,
  rules: CategoryRule[],
  operator: RuleOperator = 'OR'
): { matched: boolean; matchedRuleId?: string } {
  if (!rules || rules.length === 0) {
    return { matched: false }
  }

  if (operator === 'AND') {
    const allMatch = rules.every((r) => matchesRule(product, r))
    return { matched: allMatch, matchedRuleId: allMatch ? rules[0]?.id : undefined }
  } else {
    // OR
    for (const rule of rules) {
      if (matchesRule(product, rule)) {
        return { matched: true, matchedRuleId: rule.id }
      }
    }
    return { matched: false }
  }
}

/**
 * Resolve todos os produtos que pertencem a uma categoria
 * com base no modo configurado (MANUAL, AUTOMATICA, HIBRIDA).
 */
export function resolveCategoryProducts(
  category: Partial<CentralCategory>,
  allProducts: any[]
): ProductCategoryLink[] {
  if (!allProducts || allProducts.length === 0) return []

  const mode = category.linking_mode || (category.rules && category.rules.length > 0 ? 'automatic' : 'manual')
  const manualIds = new Set(category.manual_product_ids || [])
  const excludedIds = new Set(category.excluded_product_ids || [])
  const rules = category.rules || []
  const operator = category.rule_operator || 'OR'

  const links: ProductCategoryLink[] = []

  for (const product of allProducts) {
    const pId = String(product.id)

    // Se estiver explicitamente excluído na categoria
    if (excludedIds.has(pId)) continue

    const isManual = manualIds.has(pId)

    let isMatched = false
    let matchedRuleId: string | undefined = undefined

    if (mode === 'manual') {
      isMatched = isManual
    } else if (mode === 'automatic') {
      const ruleResult = matchesCategoryRules(product, rules, operator)
      isMatched = ruleResult.matched
      matchedRuleId = ruleResult.matchedRuleId
    } else if (mode === 'hybrid') {
      if (isManual) {
        isMatched = true
      } else {
        const ruleResult = matchesCategoryRules(product, rules, operator)
        isMatched = ruleResult.matched
        matchedRuleId = ruleResult.matchedRuleId
      }
    }

    if (isMatched) {
      links.push({
        productId: pId,
        productName: product.name || product.title || 'Sem título',
        sku: product.sku || '',
        brand: product.brand || 'TEKNIX',
        stock: Number(product.stock ?? product.stock_quantity ?? 0),
        price: Number(product.promo_price ?? product.sale_price ?? product.price ?? 0),
        source: isManual ? 'MANUAL' : 'REGRA AUTOMATICA',
        matchedRuleId
      })
    }
  }

  return links
}

/**
 * Converte o registro bruto do Supabase (store_categories) para o modelo CentralCategory.
 * Suporta tanto colunas dedicadas quanto metadados ricos salvos em 'seo'.
 */
export function parseCategoryRow(row: any): CentralCategory {
  if (!row) {
    throw new Error('parseCategoryRow: row inválida')
  }

  const seo = (typeof row.seo === 'object' && row.seo !== null) ? row.seo : {}

  return {
    id: row.id,
    name: row.name || '',
    slug: row.slug || '',
    parent_id: row.parent_id || null,
    description: row.description || seo.description || '',
    image_url: row.image_url || seo.image_url || '',
    icon: row.icon || seo.icon || '',
    status: row.status === 'inactive' ? 'inactive' : 'active',
    is_published: row.is_published ?? seo.is_published ?? (row.status === 'active'),
    sort_order: Number(row.sort_order ?? 0),
    linking_mode: (row.linking_mode || seo.linking_mode || (seo.rules?.length > 0 ? 'automatic' : 'manual')) as LinkingMode,
    rule_operator: (row.rule_operator || seo.rule_operator || 'OR') as RuleOperator,
    rules: Array.isArray(row.rules) ? row.rules : Array.isArray(seo.rules) ? seo.rules : [],
    manual_product_ids: Array.isArray(row.manual_product_ids)
      ? row.manual_product_ids
      : Array.isArray(seo.manual_product_ids)
      ? seo.manual_product_ids
      : [],
    excluded_product_ids: Array.isArray(row.excluded_product_ids)
      ? row.excluded_product_ids
      : Array.isArray(seo.excluded_product_ids)
      ? seo.excluded_product_ids
      : [],
    seo_title: row.seo_title || seo.seo_title || row.name || '',
    seo_description: row.seo_description || seo.seo_description || row.description || '',
    canonical_url: row.canonical_url || seo.canonical_url || `/categoria/${row.slug}`,
    marketplace_mappings: Array.isArray(row.marketplace_mappings)
      ? row.marketplace_mappings
      : Array.isArray(seo.marketplace_mappings)
      ? seo.marketplace_mappings
      : [],
    page_id: row.page_id || null,
    created_at: row.created_at,
    updated_at: row.updated_at
  }
}

/**
 * Prepara o payload para gravação no Supabase (store_categories), garantindo que
 * o objeto 'seo' JSONB retenha as regras inteligentes, metadados e mapeamentos
 * mantendo total compatibilidade com o schema existente.
 */
export function formatCategoryPayload(cat: Partial<CentralCategory>) {
  const existingSeo = (typeof (cat as any).seo === 'object' && (cat as any).seo !== null) ? (cat as any).seo : {}

  const seoPayload = {
    ...existingSeo,
    linking_mode: cat.linking_mode || 'manual',
    rule_operator: cat.rule_operator || 'OR',
    rules: cat.rules || [],
    manual_product_ids: cat.manual_product_ids || [],
    excluded_product_ids: cat.excluded_product_ids || [],
    seo_title: cat.seo_title || cat.name || '',
    seo_description: cat.seo_description || cat.description || '',
    canonical_url: cat.canonical_url || `/categoria/${cat.slug}`,
    icon: cat.icon || '',
    is_published: cat.is_published !== false,
    marketplace_mappings: cat.marketplace_mappings || []
  }

  return {
    name: cat.name?.trim(),
    slug: cat.slug?.trim(),
    description: cat.description || '',
    parent_id: cat.parent_id || null,
    image_url: cat.image_url || '',
    status: cat.status || (cat.is_published === false ? 'inactive' : 'active'),
    sort_order: Number(cat.sort_order ?? 0),
    page_id: cat.page_id || null,
    seo: seoPayload,
    updated_at: new Date().toISOString()
  }
}
