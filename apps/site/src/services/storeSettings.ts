import { supabase } from '../lib/supabase'

export interface WhatsappSettings {
  enabled: boolean
  phoneNumber: string
  defaultMessage: string
  position: 'br' | 'bl'
}

export const DEFAULT_WHATSAPP_SETTINGS: WhatsappSettings = {
  enabled: true,
  phoneNumber: '5511998887766',
  defaultMessage: 'Olá! Vim do site TEKNIX e gostaria de tirar uma dúvida sobre os produtos.',
  position: 'br'
}

export async function loadWhatsappSettings(): Promise<WhatsappSettings> {
  const { data, error } = await supabase.from('store_settings').select('whatsapp_enabled, whatsapp_phone, whatsapp_message, whatsapp_position').eq('id', 'default').maybeSingle()
  if (error) throw error
  return {
    enabled: data?.whatsapp_enabled ?? DEFAULT_WHATSAPP_SETTINGS.enabled,
    phoneNumber: data?.whatsapp_phone || DEFAULT_WHATSAPP_SETTINGS.phoneNumber,
    defaultMessage: data?.whatsapp_message || DEFAULT_WHATSAPP_SETTINGS.defaultMessage,
    position: data?.whatsapp_position === 'bl' ? 'bl' : 'br'
  }
}