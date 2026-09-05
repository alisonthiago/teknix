export interface DisplayCondition {
  id: string
  type: 'include' | 'exclude'
  target: 'entire_site' | 'archives' | 'singular'
  subTarget?: string
  specificId?: string
}

export function evaluateDisplayConditions(
  conditions: DisplayCondition[] = [],
  context: {
    pathname: string
    pageType?: string
    pageId?: string
    product?: { id?: string; slug?: string; sku?: string }
  }
): boolean {
  if (!conditions || conditions.length === 0) return true

  const { pathname, pageType, pageId, product } = context

  const segments = pathname.split('/').filter(Boolean)
  const isArchive = pageType === 'category' || pageType === 'segment' ||
    (pathname === '/produtos' || pathname === '/produtos/') ||
    (segments.length >= 2 && segments[0] === 'segmento')

  const isSingular = pageType === 'product' ||
    (segments.length >= 2 && segments[0] === 'produtos') ||
    !!product?.id

  const matches: boolean[] = conditions.map((cond) => {
    let matchesTarget = false

    if (cond.target === 'entire_site') {
      matchesTarget = true
    } else if (cond.target === 'archives') {
      matchesTarget = isArchive
    } else if (cond.target === 'singular') {
      matchesTarget = isSingular
    }

    if (!matchesTarget) return false

    if (cond.subTarget === 'all_archives') {
      matchesTarget = isArchive
    } else if (cond.subTarget === 'categorias') {
      matchesTarget = isArchive && (pageType === 'category' || (segments.length >= 2 && segments[0] === 'segmento'))
    } else if (cond.subTarget === 'products') {
      matchesTarget = isSingular && (pageType === 'product' || (segments.length >= 2 && segments[0] === 'produtos'))
    } else if (cond.subTarget === 'all_pages') {
      matchesTarget = true
    }

    if (cond.specificId && cond.specificId !== pageId) {
      matchesTarget = false
    }

    return matchesTarget
  })

  const hasInclude = conditions.some((c) => c.type === 'include')
  const includeMatches = matches.filter((_, i) => conditions[i].type === 'include')
  const excludeMatches = matches.filter((_, i) => conditions[i].type === 'exclude')

  if (hasInclude) {
    return includeMatches.some(Boolean) && !excludeMatches.some(Boolean)
  }

  return !excludeMatches.some(Boolean)
}
