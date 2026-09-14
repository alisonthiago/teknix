/* ==========================================================================
   TEKNIX SITE — Serviço de Categorias Centrais Dinâmicas
   Substitui listas hardcoded por dados reais do Supabase (store_categories)
   ========================================================================== */

import { supabase } from '../lib/supabase'
import {
  type CentralCategory,
  parseCategoryRow
} from '../../../../packages/core/src/categoryRules'

export interface CentralCategoryWithSegment extends CentralCategory {
  segment_id?: string | null
}

export interface StoreSegment {
  id: string
  name: string
  slug: string
  description?: string
  image_url?: string
  status: string
  sort_order: number
}

let cachedCategories: CentralCategoryWithSegment[] | null = null
let cachedSegments: StoreSegment[] | null = null

/**
 * Busca as categorias ativas no Supabase (store_categories)
 */
export async function fetchPublishedCategories(): Promise<CentralCategoryWithSegment[]> {
  try {
    const { data, error } = await supabase
      .from('store_categories')
      .select('*')
      .eq('status', 'active')
      .order('sort_order', { ascending: true })

    if (error || !data) {
      console.warn('Falha na consulta de categorias publicadas:', error?.message)
      return cachedCategories || (CORE_CATEGORIES as any)
    }

    const parsed: CentralCategoryWithSegment[] = data.map(row => {
      const cat = parseCategoryRow(row) as CentralCategoryWithSegment
      cat.segment_id = row.segment_id || null
      return cat
    })

    cachedCategories = parsed
    return parsed
  } catch (err) {
    console.error('Erro ao buscar categorias publicadas:', err)
    return cachedCategories || (CORE_CATEGORIES as any)
  }
}

/**
 * Busca os segmentos ativos no Supabase (store_segments)
 */
export async function fetchPublishedSegments(): Promise<StoreSegment[]> {
  try {
    const { data, error } = await supabase
      .from('store_segments')
      .select('*')
      .eq('status', 'active')
      .order('sort_order', { ascending: true })

    if (error || !data || data.length === 0) {
      return cachedSegments || CORE_SEGMENTS
    }

    cachedSegments = data
    return data
  } catch (err) {
    console.error('Erro ao buscar segmentos:', err)
    return cachedSegments || CORE_SEGMENTS
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

export const CORE_SEGMENTS: StoreSegment[] = [
  { id: '10000000-0000-4000-8000-000000000001', name: 'Ferramentas', slug: 'ferramentas', sort_order: 1, status: 'active', description: 'Elétricas, manuais e acessórios profissionais' },
  { id: '10000000-0000-4000-8000-000000000002', name: 'Informática', slug: 'informatica', sort_order: 2, status: 'active', description: 'Periféricos, componentes e soluções técnicas' },
  { id: '10000000-0000-4000-8000-000000000003', name: 'Casa', slug: 'casa', sort_order: 3, status: 'active', description: 'Tudo para organização e manutenção do lar' },
  { id: '10000000-0000-4000-8000-000000000004', name: 'Automotivo', slug: 'automotivo', sort_order: 4, status: 'active', description: 'Ferramentas e acessórios para seu veículo' },
]

export function findCoreCategory(slug: string) {
  return CORE_CATEGORIES.find(c => c.slug === slug)
}
