import { supabase } from '../lib/supabase'
import type { HeaderConfig, HeaderModel } from '../components/GlobalHeaderRenderer'
import type { FooterConfig, FooterModel } from '../components/GlobalFooterRenderer'

export interface PageThemeMeta {
  id?: string
  slug?: string
  type?: string
  hide_header?: boolean
  hide_footer?: boolean
  header_model?: HeaderModel
  footer_model?: FooterModel
  header_is_local_only?: boolean
  footer_is_local_only?: boolean
  header_settings?: HeaderConfig
  footer_settings?: FooterConfig
  display_conditions?: any[]
}

export interface ResolvedHeaderResult {
  shouldRender: boolean
  isGlobal: boolean
  isLocal: boolean
  model: HeaderModel
  config: HeaderConfig
}

export interface ResolvedFooterResult {
  shouldRender: boolean
  isGlobal: boolean
  isLocal: boolean
  model: FooterModel
  config: FooterConfig
}

let cachedGlobalHeaderConfig: HeaderConfig | null = null
let cachedGlobalFooterConfig: FooterConfig | null = null

export function setCachedGlobalTheme(header?: HeaderConfig, footer?: FooterConfig) {
  if (header) cachedGlobalHeaderConfig = header
  if (footer) cachedGlobalFooterConfig = footer
}

/**
 * Busca e sincroniza do Supabase as configurações ativas do Header e Footer Globais
 */
export async function fetchGlobalThemeConfig(): Promise<{ header: HeaderConfig | null; footer: FooterConfig | null }> {
  try {
    // 1. Busca primeiro a página Home publicada
    const { data: homePage } = await supabase
      .from('pages')
      .select('id, header_model, footer_model, header_settings, footer_settings, header_is_local_only, footer_is_local_only, page_styles')
      .or('type.eq.home,slug.eq./,slug.eq.')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (homePage) {
      const hs = homePage.header_settings || (homePage as any).page_styles?.header_settings
      const fs = homePage.footer_settings || (homePage as any).page_styles?.footer_settings
      if (hs && typeof hs === 'object' && Object.keys(hs).length > 0) {
        cachedGlobalHeaderConfig = {
          model: homePage.header_model || (hs as any).model || 'apple_light',
          ...(hs as any)
        }
      }
      if (fs && typeof fs === 'object' && Object.keys(fs).length > 0) {
        cachedGlobalFooterConfig = {
          model: homePage.footer_model || (fs as any).model || 'apple_directory_5cols_light',
          ...(fs as any)
        }
      }
    }

    // 2. Se não encontrou na Home, busca a última página publicada com header_settings não-local
    if (!cachedGlobalHeaderConfig) {
      const { data: anyPages } = await supabase
        .from('pages')
        .select('header_model, footer_model, header_settings, footer_settings, header_is_local_only, footer_is_local_only')
        .not('header_settings', 'is', null)
        .eq('status', 'published')
        .order('updated_at', { ascending: false })
        .limit(5)

      if (anyPages && anyPages.length > 0) {
        const candidate = anyPages.find(p => p.header_is_local_only !== true) || anyPages[0]
        if (candidate.header_settings && Object.keys(candidate.header_settings).length > 0) {
          cachedGlobalHeaderConfig = {
            model: candidate.header_model || (candidate.header_settings as any).model || 'apple_light',
            ...(candidate.header_settings as any)
          }
        }
        if (candidate.footer_settings && Object.keys(candidate.footer_settings).length > 0) {
          cachedGlobalFooterConfig = {
            model: candidate.footer_model || (candidate.footer_settings as any).model || 'apple_directory_5cols_light',
            ...(candidate.footer_settings as any)
          }
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar tema global:', err)
  }

  return { header: cachedGlobalHeaderConfig, footer: cachedGlobalFooterConfig }
}

// Inicia busca inicial em background
fetchGlobalThemeConfig()

/**
 * Resolução Centralizada e Unificada do Header (Garante EXATAMENTE 1 Header por página)
 */
export function resolveActiveHeader(page?: PageThemeMeta | null): ResolvedHeaderResult {
  // 1. Se a página marcou para ocultar o cabeçalho
  if (page?.hide_header) {
    return {
      shouldRender: false,
      isGlobal: false,
      isLocal: false,
      model: 'apple_light',
      config: {}
    }
  }

  // 2. Se a página tem Header Local / Específico exclusivo
  if (page && page.header_is_local_only === true && page.header_settings && Object.keys(page.header_settings).length > 0) {
    return {
      shouldRender: true,
      isGlobal: false,
      isLocal: true,
      model: page.header_model || page.header_settings?.model || 'apple_light',
      config: {
        model: page.header_model || page.header_settings?.model || 'apple_light',
        ...(page.header_settings || {})
      }
    }
  }

  // 3. A page that is not explicitly local must never shadow the global
  // header with an old per-page snapshot. This was why an enabled announcement
  // ribbon appeared in the editor but not on other published pages.
  // 4. Se temos o header global em cache/Supabase
  if (cachedGlobalHeaderConfig) {
    return {
      shouldRender: true,
      isGlobal: true,
      isLocal: false,
      model: cachedGlobalHeaderConfig.model || 'apple_light',
      config: cachedGlobalHeaderConfig
    }
  }

  // 5. Fallback padrão do sistema
  return {
    shouldRender: true,
    isGlobal: true,
    isLocal: false,
    model: page?.header_model || 'apple_light',
    config: {
      model: page?.header_model || 'apple_light',
      ...(page?.header_settings || {})
    }
  }
}

/**
 * Resolução Centralizada e Unificada do Footer (Garante EXATAMENTE 1 Footer por página)
 */
export function resolveActiveFooter(page?: PageThemeMeta | null): ResolvedFooterResult {
  // 1. Se a página marcou para ocultar o rodapé
  if (page?.hide_footer) {
    return {
      shouldRender: false,
      isGlobal: false,
      isLocal: false,
      model: 'apple_directory_5cols_light',
      config: {}
    }
  }

  // 2. Se a página tem Footer Local / Específico exclusivo
  if (page && page.footer_is_local_only === true && page.footer_settings && Object.keys(page.footer_settings).length > 0) {
    return {
      shouldRender: true,
      isGlobal: false,
      isLocal: true,
      model: page.footer_model || page.footer_settings?.model || 'apple_directory_5cols_light',
      config: {
        model: page.footer_model || page.footer_settings?.model || 'apple_directory_5cols_light',
        ...(page.footer_settings || {})
      }
    }
  }

  // 3. Se a página atual tem footer_settings (e não é local_only), usa seus dados
  if (page?.footer_settings && typeof page.footer_settings === 'object' && Object.keys(page.footer_settings).length > 0 && page.footer_is_local_only !== true) {
    return {
      shouldRender: true,
      isGlobal: true,
      isLocal: false,
      model: page.footer_model || page.footer_settings.model || 'apple_directory_5cols_light',
      config: {
        model: page.footer_model || page.footer_settings.model || 'apple_directory_5cols_light',
        ...page.footer_settings
      }
    }
  }

  // 4. Se temos o footer global em cache/Supabase
  if (cachedGlobalFooterConfig) {
    return {
      shouldRender: true,
      isGlobal: true,
      isLocal: false,
      model: cachedGlobalFooterConfig.model || 'apple_directory_5cols_light',
      config: cachedGlobalFooterConfig
    }
  }

  // 5. Fallback padrão do sistema
  return {
    shouldRender: true,
    isGlobal: true,
    isLocal: false,
    model: page?.footer_model || 'apple_directory_5cols_light',
    config: {
      model: page?.footer_model || 'apple_directory_5cols_light',
      ...(page?.footer_settings || {})
    }
  }
}
