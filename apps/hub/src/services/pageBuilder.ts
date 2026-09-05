import { supabase } from '../lib/supabase'

interface PageData {
  type?: string
  slug?: string
  title?: string
  status?: string
  is_landing_mode?: boolean
  theme_id?: string | null
  template_id?: string | null
  menu?: any[]
  seo_title?: string
  seo_description?: string
  seo_image?: string
  seo_slug?: string
  seo_canonical?: string
  seo_og?: any
  head_scripts?: string
  body_scripts?: string
  page_styles?: any
  version?: number
}

export async function createPage(page: PageData) {
  let cleanSlug = (page.slug || '').trim()
  if (cleanSlug !== '/' && cleanSlug.startsWith('/')) {
    cleanSlug = cleanSlug.replace(/^\/+/, '')
  }
  if (!cleanSlug) cleanSlug = '/'

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const validThemeId = page.theme_id && uuidRegex.test(page.theme_id) ? page.theme_id : null
  const validTemplateId = page.template_id && uuidRegex.test(page.template_id) ? page.template_id : null

  const pageData: any = {
    type: page.type || 'custom',
    slug: cleanSlug,
    title: page.title || 'Nova página',
    status: page.status || 'draft',
    is_landing_mode: page.is_landing_mode || false,
    theme_id: validThemeId,
    template_id: validTemplateId,
    menu: page.menu || [],
    seo_title: page.seo_title || `${page.title || 'Nova Página'} — TEKNIX`,
    seo_description: page.seo_description || 'Página oficial TEKNIX com design profissional e alta performance.',
    seo_image: page.seo_image || '',
    seo_slug: cleanSlug,
    seo_canonical: page.seo_canonical || '',
    seo_og: page.seo_og || {},
    head_scripts: page.head_scripts || '',
    body_scripts: page.body_scripts || '',
    page_styles: page.page_styles || {},
    version: 1,
  }

  const { data, error } = await supabase
    .from('pages')
    .insert(pageData)
    .select()
    .single()

  if (error) {
    console.error('Supabase error in createPage:', {
      code: error.code,
      message: error.message,
      details: error.details,
      hint: error.hint
    })
    throw error
  }

  return data
}
