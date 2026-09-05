import { supabase } from '../lib/supabase'

export interface AdCarouselItem {
  id: string
  title: string
  image_url: string
  link: string
  target: '_self' | '_blank'
  sort_order: number
  tablet_image_url?: string
  mobile_image_url?: string
  show_desktop?: boolean
  show_tablet?: boolean
  show_mobile?: boolean
}

export async function recordAdEvent(adId: string, eventType: 'impression' | 'click', placement: string) {
  const rpcResult = await supabase.rpc('record_ad_event', {
    p_ad_id: adId,
    p_event_type: eventType,
    p_placement: placement,
    p_page_url: window.location.href,
    p_user_agent: navigator.userAgent,
  })
  if (!rpcResult.error) return rpcResult

  // Compatibilidade enquanto a migration de ad_events ainda não foi aplicada.
  // A tabela ads já possui estes contadores, portanto o painel continua funcionando.
  const { data } = await supabase.from('ads').select('clicks,impressions').eq('id', adId).single()
  if (!data) return rpcResult
  return supabase.from('ads').update({
    clicks: (data.clicks || 0) + (eventType === 'click' ? 1 : 0),
    impressions: (data.impressions || 0) + (eventType === 'impression' ? 1 : 0),
    updated_at: new Date().toISOString()
  }).eq('id', adId)
}

export interface Ad {
  id: string
  name: string
  image_url: string
  link: string
  target: '_self' | '_blank'
  placement: string
  type: 'single' | 'carousel'
  interval_seconds: number
  items: AdCarouselItem[]
  is_active: boolean
  sort_order: number
  start_date: string | null
  end_date: string | null
  clicks: number
  impressions: number
  show_arrows?: boolean
  show_dots?: boolean
  arrows_position?: 'inside' | 'outside'
  width_mode?: 'full' | 'container'
  sections?: Array<{
    id: string
    title: string
    type: 'single' | 'carousel'
    interval?: number
    interval_seconds?: number
    slides?: AdCarouselItem[]
    items?: AdCarouselItem[]
  }>
}

const LEGACY_PREFIX = '__TEKNIX_AD_V2__'
function decodeLegacyAdConfig(value?: string) {
  if (!value?.startsWith(LEGACY_PREFIX)) return null
  try { return JSON.parse(decodeURIComponent(value.slice(LEGACY_PREFIX.length))) }
  catch { return null }
}

/**
 * Busca anúncios ativos para a posição indicada, considerando agendamento (start_date/end_date)
 */
export async function getActiveAdsByPosition(position: string): Promise<Ad[]> {
  try {
    // Normalizar posições equivalentes
    const positions = [position]
    if (position === 'middle_screen') positions.push('home-middle')
    if (position === 'product') positions.push('product-middle')

    const { data, error } = await supabase
      .from('ads')
      .select('*')
      .in('placement', positions)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error || !data) return []

    const now = new Date()

    return data
      .filter((ad: any) => {
        // Validação de agendamento
        if (ad.start_date && new Date(ad.start_date) > now) return false
        if (ad.end_date && new Date(ad.end_date) < now) return false
        return true
      })
      .map((ad: any) => {
        const saved = decodeLegacyAdConfig(ad.link)
        const items = Array.isArray(saved?.items) && saved.items.length
          ? saved.items
          : Array.isArray(ad.items) ? ad.items : []
        return {
          ...ad,
          link: saved?.destination_link || ad.link,
          type: saved?.type || ad.type || (items.length > 1 ? 'carousel' : 'single'),
          target: saved?.target || ad.target || '_self',
          interval_seconds: saved?.interval_seconds || ad.interval_seconds || items?.[0]?.interval_seconds || 5,
          items,
          sections: saved?.sections || ad.sections || null,
          show_arrows: saved?.show_arrows !== false,
          show_dots: saved?.show_dots !== false,
          arrows_position: saved?.arrows_position === 'outside' ? 'outside' : 'inside',
          width_mode: saved?.width_mode === 'container' ? 'container' : 'full'
        }
      })
  } catch {
    return []
  }
}
