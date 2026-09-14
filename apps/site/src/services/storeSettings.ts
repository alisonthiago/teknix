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
  } catch {}

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