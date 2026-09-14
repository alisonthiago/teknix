import { supabase } from '../lib/supabase'

export interface WhatsappSettings {
  enabled: boolean
  phoneNumber: string
  defaultMessage: string
  position: 'br' | 'bl'
  pageDisplayMode?: 'all' | 'specific' | 'exclude'
  selectedPages?: string[]
}

export const DEFAULT_WHATSAPP_SETTINGS: WhatsappSettings = {
  enabled: true,
  phoneNumber: '5511998887766',
  defaultMessage: 'Olá! Vim do site TEKNIX e gostaria de tirar uma dúvida sobre os produtos.',
  position: 'br',
  pageDisplayMode: 'all',
  selectedPages: ['home', 'products', 'categories', 'cart', 'institutional']
}

export async function loadWhatsappSettings(): Promise<WhatsappSettings> {
  let localPagesConfig: { mode?: 'all' | 'specific' | 'exclude'; pages?: string[] } = {}
  try {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('teknix_whatsapp_pages_config')
      if (stored) localPagesConfig = JSON.parse(stored)
    }
  } catch {}

  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('whatsapp_enabled, whatsapp_phone, whatsapp_message, whatsapp_position, whatsapp_display_mode, whatsapp_pages')
      .eq('id', 'default')
      .maybeSingle()

    if (!error && data) {
      return {
        enabled: data.whatsapp_enabled ?? DEFAULT_WHATSAPP_SETTINGS.enabled,
        phoneNumber: data.whatsapp_phone || DEFAULT_WHATSAPP_SETTINGS.phoneNumber,
        defaultMessage: data.whatsapp_message || DEFAULT_WHATSAPP_SETTINGS.defaultMessage,
        position: data.whatsapp_position === 'bl' ? 'bl' : 'br',
        pageDisplayMode: (data.whatsapp_display_mode as any) || localPagesConfig.mode || DEFAULT_WHATSAPP_SETTINGS.pageDisplayMode,
        selectedPages: Array.isArray(data.whatsapp_pages) ? data.whatsapp_pages : localPagesConfig.pages || DEFAULT_WHATSAPP_SETTINGS.selectedPages
      }
    }
  } catch {
    // Tenta fallback sem as colunas novas caso a tabela não tenha sido atualizada
  }

  try {
    const { data } = await supabase
      .from('store_settings')
      .select('whatsapp_enabled, whatsapp_phone, whatsapp_message, whatsapp_position')
      .eq('id', 'default')
      .maybeSingle()

    return {
      enabled: data?.whatsapp_enabled ?? DEFAULT_WHATSAPP_SETTINGS.enabled,
      phoneNumber: data?.whatsapp_phone || DEFAULT_WHATSAPP_SETTINGS.phoneNumber,
      defaultMessage: data?.whatsapp_message || DEFAULT_WHATSAPP_SETTINGS.defaultMessage,
      position: data?.whatsapp_position === 'bl' ? 'bl' : 'br',
      pageDisplayMode: localPagesConfig.mode || DEFAULT_WHATSAPP_SETTINGS.pageDisplayMode,
      selectedPages: localPagesConfig.pages || DEFAULT_WHATSAPP_SETTINGS.selectedPages
    }
  } catch {
    return {
      ...DEFAULT_WHATSAPP_SETTINGS,
      pageDisplayMode: localPagesConfig.mode || DEFAULT_WHATSAPP_SETTINGS.pageDisplayMode,
      selectedPages: localPagesConfig.pages || DEFAULT_WHATSAPP_SETTINGS.selectedPages
    }
  }
}

export async function saveWhatsappSettings(settings: WhatsappSettings) {
  // Salva no localStorage para consistência imediata
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem('teknix_whatsapp_pages_config', JSON.stringify({
        mode: settings.pageDisplayMode || 'all',
        pages: settings.selectedPages || []
      }))
    }
  } catch {}

  const cleanPhone = settings.phoneNumber.replace(/\D/g, '')

  // Tenta salvar com as novas colunas
  try {
    const { error } = await supabase.from('store_settings').upsert({
      id: 'default',
      whatsapp_enabled: settings.enabled,
      whatsapp_phone: cleanPhone,
      whatsapp_message: settings.defaultMessage,
      whatsapp_position: settings.position,
      whatsapp_display_mode: settings.pageDisplayMode || 'all',
      whatsapp_pages: settings.selectedPages || [],
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' })

    if (!error) return
  } catch {}

  // Fallback caso as colunas novas ainda não existam no banco
  const { error } = await supabase.from('store_settings').upsert({
    id: 'default',
    whatsapp_enabled: settings.enabled,
    whatsapp_phone: cleanPhone,
    whatsapp_message: settings.defaultMessage,
    whatsapp_position: settings.position,
    updated_at: new Date().toISOString()
  }, { onConflict: 'id' })

  if (error) throw error
}