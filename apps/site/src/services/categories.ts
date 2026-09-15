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

export interface MegaMenuItem {
  title: string
  slug: string
  query?: string
}

export interface MegaMenuDepartmentData {
  id: string
  title: string
  slug: string
  categories: MegaMenuItem[]
  models: MegaMenuItem[]
  usageLines: MegaMenuItem[]
  promo?: {
    title: string
    description: string
    image_url?: string
    link?: string
  }
}

/**
 * Agrega dinamicamente os dados do Mega Menu (Categorias, Modelos & Tipos, Linha & Uso)
 * conectando as tabelas store_categories, store_segments e product_store_metadata
 */
export async function fetchMegaMenuCatalog(): Promise<MegaMenuDepartmentData[]> {
  try {
    const { CATALOG_MENU_DEPARTMENTS } = await import('../data/catalogMenuData')

    const [catsRes, segsRes, metaRes, prodsRes] = await Promise.all([
      supabase.from('store_categories').select('id, name, slug, parent_id, segment_id, sort_order, seo, image_url').eq('status', 'active'),
      supabase.from('store_segments').select('id, name, slug, sort_order, description, image_url').eq('status', 'active'),
      supabase.from('product_store_metadata').select('category_id, segment_id, specifications').eq('published', true),
      supabase.from('products').select('id, name, model, category').eq('status', 'active')
    ])

    const dbCategories = catsRes.data || []
    const dbSegments = segsRes.data || []
    const dbMeta = metaRes.data || []
    const dbProducts = prodsRes.data || []

    // Agrupa modelos/tipos e linhas de uso por category_id e segment_id
    const modelsByCat = new Map<string, Set<string>>()
    const usageByCat = new Map<string, Set<string>>()

    for (const m of dbMeta) {
      const specs = m.specifications || {}
      const catId = m.category_id
      const segId = m.segment_id

      const modelList = Array.isArray(specs.model_types) ? specs.model_types : []
      const usageList = Array.isArray(specs.usage_lines) ? specs.usage_lines : []

      if (catId) {
        if (!modelsByCat.has(catId)) modelsByCat.set(catId, new Set())
        modelList.forEach((mod: string) => mod && modelsByCat.get(catId)!.add(mod))

        if (!usageByCat.has(catId)) usageByCat.set(catId, new Set())
        usageList.forEach((use: string) => use && usageByCat.get(catId)!.add(use))
      }

      if (segId) {
        if (!modelsByCat.has(segId)) modelsByCat.set(segId, new Set())
        modelList.forEach((mod: string) => mod && modelsByCat.get(segId)!.add(mod))

        if (!usageByCat.has(segId)) usageByCat.set(segId, new Set())
        usageList.forEach((use: string) => use && usageByCat.get(segId)!.add(use))
      }
    }

    for (const p of dbProducts) {
      if (p.model && p.category) {
        if (!modelsByCat.has(p.category)) modelsByCat.set(p.category, new Set())
        modelsByCat.get(p.category)!.add(p.model)
      }
    }

    // Mapeia os departamentos combinando CATALOG_MENU_DEPARTMENTS com os dados reais do banco
    const result: MegaMenuDepartmentData[] = CATALOG_MENU_DEPARTMENTS.map(dept => {
      // Procura segmento ou categoria correspondente pelo slug ou nome
      const matchedSegment = dbSegments.find(s => s.slug === dept.slug || s.name.toLowerCase() === dept.title.toLowerCase())
      const matchedCat = dbCategories.find(c => c.slug === dept.slug || c.name.toLowerCase() === dept.title.toLowerCase())
      const deptId = matchedSegment?.id || matchedCat?.id || dept.slug

      // Categorias reais do banco pertencentes a este departamento
      const realCats = dbCategories.filter(c => 
        (matchedSegment && c.segment_id === matchedSegment.id) ||
        (matchedCat && c.parent_id === matchedCat.id) ||
        (c.slug !== dept.slug && c.slug.startsWith(dept.slug.split('-')[0]))
      ).map(c => ({ title: c.name, slug: c.slug }))

      // Modelos dinâmicos do banco
      const dynamicModels = new Set<string>()
      if (deptId && modelsByCat.has(deptId)) {
        modelsByCat.get(deptId)!.forEach(m => dynamicModels.add(m))
      }
      realCats.forEach(rc => {
        const foundCat = dbCategories.find(c => c.slug === rc.slug)
        if (foundCat && modelsByCat.has(foundCat.id)) {
          modelsByCat.get(foundCat.id)!.forEach(m => dynamicModels.add(m))
        }
      })

      // Linhas de uso dinâmicas do banco
      const dynamicUsage = new Set<string>()
      if (deptId && usageByCat.has(deptId)) {
        usageByCat.get(deptId)!.forEach(u => dynamicUsage.add(u))
      }

      // Constrói Coluna 1 (Categorias)
      const subs = dept.subcategories || []
      const half = Math.ceil(subs.length / 2)
      const defaultCol1Cats = subs.slice(0, half).map(s => ({ title: s.title, slug: s.slug }))
      const finalCategories = realCats.length > 0
        ? [...realCats, ...defaultCol1Cats.filter(d => !realCats.some(r => r.title.toLowerCase() === d.title.toLowerCase()))]
        : defaultCol1Cats

      // Constrói Coluna 2 (Modelos & Tipos)
      const defaultCol2Models = subs.slice(half).map(s => ({ title: s.title, slug: s.slug }))
      const finalModels = Array.from(dynamicModels).map(m => ({
        title: m,
        slug: `${dept.slug}?modelo=${encodeURIComponent(m)}`
      }))
      if (finalModels.length === 0) {
        defaultCol2Models.forEach(dm => finalModels.push(dm))
      }

      // Constrói Coluna 3 (Linha & Uso)
      const defaultUsageLines = [
        { title: 'Uso Profissional', slug: 'produtos?filtro=profissional' },
        { title: 'Industrial Pesado', slug: 'produtos?filtro=industrial' },
        { title: 'Equipamento Novo 100%', slug: 'produtos?filtro=novo' }
      ]
      const dynamicUsageItems = Array.from(dynamicUsage).map(u => ({
        title: u,
        slug: `produtos?linha=${encodeURIComponent(u)}`
      }))
      const finalUsage = dynamicUsageItems.length > 0
        ? [...dynamicUsageItems, ...defaultUsageLines.filter(d => !dynamicUsageItems.some(du => du.title.toLowerCase() === d.title.toLowerCase()))]
        : defaultUsageLines

      return {
        id: deptId,
        title: dept.title,
        slug: dept.slug,
        categories: finalCategories,
        models: finalModels,
        usageLines: finalUsage
      }
    })

    // Adiciona quaisquer novas categorias raiz criadas no HUB que não estejam nos 10 departamentos padrão
    dbCategories
      .filter(c => !c.parent_id && !result.some(r => r.slug === c.slug || r.title.toLowerCase() === c.name.toLowerCase()))
      .forEach(newCat => {
        const childCats = dbCategories.filter(sub => sub.parent_id === newCat.id).map(sub => ({ title: sub.name, slug: sub.slug }))
        result.push({
          id: newCat.id,
          title: newCat.name,
          slug: newCat.slug,
          categories: childCats.length > 0 ? childCats : [{ title: newCat.name, slug: newCat.slug }],
          models: Array.from(modelsByCat.get(newCat.id) || []).map(m => ({ title: m, slug: `${newCat.slug}?modelo=${encodeURIComponent(m)}` })),
          usageLines: [
            { title: 'Uso Profissional', slug: 'produtos?filtro=profissional' },
            { title: 'Industrial Pesado', slug: 'produtos?filtro=industrial' },
            { title: 'Equipamento Novo 100%', slug: 'produtos?filtro=novo' }
          ]
        })
      })

    return result
  } catch (err) {
    console.error('Erro em fetchMegaMenuCatalog:', err)
    const { CATALOG_MENU_DEPARTMENTS } = await import('../data/catalogMenuData')
    return CATALOG_MENU_DEPARTMENTS.map(dept => {
      const half = Math.ceil(dept.subcategories.length / 2)
      return {
        id: dept.slug,
        title: dept.title,
        slug: dept.slug,
        categories: dept.subcategories.slice(0, half).map(s => ({ title: s.title, slug: s.slug })),
        models: dept.subcategories.slice(half).map(s => ({ title: s.title, slug: s.slug })),
        usageLines: [
          { title: 'Uso Profissional', slug: 'produtos?filtro=profissional' },
          { title: 'Industrial Pesado', slug: 'produtos?filtro=industrial' },
          { title: 'Equipamento Novo 100%', slug: 'produtos?filtro=novo' }
        ]
      }
    })
  }
}
