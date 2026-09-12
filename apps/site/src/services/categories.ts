/* ==========================================================================
   TEKNIX SITE — Serviço de Categorias Centrais Dinâmicas
   Substitui listas hardcoded por dados reais do Supabase (store_categories)
   ========================================================================== */

import { supabase } from '../lib/supabase'
import {
  type CentralCategory,
  parseCategoryRow
} from '../../../../packages/core/src/categoryRules'

let cachedCategories: CentralCategory[] | null = null

/**
 * Busca as categorias ativas e publicadas no Supabase (store_categories)
 */
export async function fetchPublishedCategories(): Promise<CentralCategory[]> {
  try {
    const { data, error } = await supabase
      .from('store_categories')
      .select('*')
      .order('sort_order', { ascending: true })

    if (error || !data) {
      console.warn('Falha na consulta de categorias publicadas:', error?.message)
      return cachedCategories || []
    }

    const parsed = data
      .map(parseCategoryRow)
      .filter(c => c.is_published && c.status === 'active')

    cachedCategories = parsed
    return parsed
  } catch (err) {
    console.error('Erro ao buscar categorias publicadas:', err)
    return cachedCategories || []
  }
}

/**
 * Busca uma categoria específica por slug no Supabase (store_categories)
 */
export async function fetchCategoryBySlug(slug: string): Promise<CentralCategory | null> {
  if (!slug) return null

  try {
    const { data, error } = await supabase
      .from('store_categories')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()

    if (error || !data) return null
    return parseCategoryRow(data)
  } catch (err) {
    console.error(`Erro ao buscar categoria pelo slug "${slug}":`, err)
    return null
  }
}

/**
 * Busca as subcategorias filhas de uma categoria pai
 */
export async function fetchSubcategories(parentId: string): Promise<CentralCategory[]> {
  if (!parentId) return []

  try {
    const { data, error } = await supabase
      .from('store_categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('sort_order', { ascending: true })

    if (error || !data) return []
    return data.map(parseCategoryRow).filter(c => c.is_published && c.status === 'active')
  } catch (err) {
    console.error(`Erro ao buscar subcategorias de "${parentId}":`, err)
    return []
  }
}

/**
 * Fallback de compatibilidade caso o banco esteja inacessível
 */
export const CORE_CATEGORIES = [
  { id: '20000000-0000-4000-8000-000000000001', name: 'Furadeiras', slug: 'furadeiras' },
  { id: '20000000-0000-4000-8000-000000000002', name: 'Parafusadeiras', slug: 'parafusadeiras' },
  { id: '20000000-0000-4000-8000-000000000003', name: 'Serras', slug: 'serras' },
  { id: '20000000-0000-4000-8000-000000000004', name: 'Ferramentas Manuais', slug: 'ferramentas-manuais' },
  { id: '20000000-0000-4000-8000-000000000005', name: 'Kits', slug: 'kits' },
  { id: '20000000-0000-4000-8000-000000000006', name: 'Notebooks', slug: 'notebooks' },
  { id: '20000000-0000-4000-8000-000000000007', name: 'Monitores', slug: 'monitores' },
  { id: '20000000-0000-4000-8000-000000000008', name: 'Teclados', slug: 'teclados' },
  { id: '20000000-0000-4000-8000-000000000009', name: 'Mouses', slug: 'mouses' },
] as const

export function findCoreCategory(slug: string) {
  return CORE_CATEGORIES.find(c => c.slug === slug)
}
