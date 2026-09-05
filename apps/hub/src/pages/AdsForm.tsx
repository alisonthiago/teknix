import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, X, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { PLACEMENTS } from './AdsList'
import MediaLibraryModal from '../components/MediaLibraryModal'
import './AdsEditor.css'

type Device = 'desktop' | 'tablet' | 'mobile'
type Slide = {
  id: string
  title: string
  link: string
  target: '_self' | '_blank'
  sort_order: number
  image_url: string
  tablet_image_url: string
  mobile_image_url: string
  show_desktop: boolean
  show_tablet: boolean
  show_mobile: boolean
  promo_badge?: string
  promo_text?: string
  background_color?: string
  text_color?: string
}

export type MiddleSection = {
  id: string
  title: string
  type: 'single' | 'carousel'
  interval: number
  slides: Slide[]
}

interface DeviceSizeConfig {
  label: string
  width: number
  height: number
}

// Configuração oficial de tamanhos obrigatórios da TEKNIX
const SIZES: Record<string, Record<Device, DeviceSizeConfig>> = {
  'home-promo-strip': {
    desktop: { label: '2080 × 185 px', width: 2080, height: 185 },
    tablet: { label: '2080 × 185 px (exibição proporcional)', width: 2080, height: 185 },
    mobile: { label: '2080 × 185 px (exibição proporcional)', width: 2080, height: 185 }
  },
  'home-hero': {
    desktop: { label: '1620 × 219 px', width: 1620, height: 219 },
    tablet: { label: '1620 × 219 px (exibição proporcional)', width: 1620, height: 219 },
    mobile: { label: '1620 × 219 px (exibição proporcional)', width: 1620, height: 219 }
  },
  'home-middle': {
    desktop: { label: '470 × 360 px (cada bloco)', width: 470, height: 360 },
    tablet: { label: '320 × 280 px', width: 320, height: 280 },
    mobile: { label: '390 × 260 px', width: 390, height: 260 }
  },
  middle_screen: {
    desktop: { label: '470 × 360 px (cada bloco)', width: 470, height: 360 },
    tablet: { label: '320 × 280 px', width: 320, height: 280 },
    mobile: { label: '390 × 260 px', width: 390, height: 260 }
  },
  'home-footer': {
    desktop: { label: '1440 × 240 px', width: 1440, height: 240 },
    tablet: { label: '960 × 220 px', width: 960, height: 220 },
    mobile: { label: '390 × 180 px', width: 390, height: 180 }
  },
  'profession-showcase': {
    desktop: { label: '1440 × 480 px', width: 1440, height: 480 },
    tablet: { label: '1024 × 420 px', width: 1024, height: 420 },
    mobile: { label: '430 × 560 px', width: 430, height: 560 }
  },
  'promo-bar': {
    desktop: { label: '1920 × 44 px', width: 1920, height: 44 },
    tablet: { label: '1024 × 44 px', width: 1024, height: 44 },
    mobile: { label: '430 × 44 px', width: 430, height: 44 }
  },
  'global-header': {
    desktop: { label: '1440 × 240 px', width: 1440, height: 240 },
    tablet: { label: '1024 × 220 px', width: 1024, height: 220 },
    mobile: { label: '430 × 200 px', width: 430, height: 200 }
  },
  'global-footer': {
    desktop: { label: '1440 × 240 px', width: 1440, height: 240 },
    tablet: { label: '1024 × 220 px', width: 1024, height: 220 },
    mobile: { label: '430 × 200 px', width: 430, height: 200 }
  },
  product: {
    desktop: { label: '1200 × 320 px', width: 1200, height: 320 },
    tablet: { label: '900 × 280 px', width: 900, height: 280 },
    mobile: { label: '390 × 240 px', width: 390, height: 240 }
  },
  'product-header': {
    desktop: { label: '1440 × 320 px', width: 1440, height: 320 },
    tablet: { label: '960 × 280 px', width: 960, height: 280 },
    mobile: { label: '390 × 240 px', width: 390, height: 240 }
  },
  'product-middle': {
    desktop: { label: '1200 × 320 px', width: 1200, height: 320 },
    tablet: { label: '900 × 280 px', width: 900, height: 280 },
    mobile: { label: '390 × 240 px', width: 390, height: 240 }
  },
  'product-footer': {
    desktop: { label: '1200 × 240 px', width: 1200, height: 240 },
    tablet: { label: '900 × 220 px', width: 900, height: 220 },
    mobile: { label: '390 × 180 px', width: 390, height: 180 }
  },
  'blog-header': {
    desktop: { label: '1200 × 360 px', width: 1200, height: 360 },
    tablet: { label: '900 × 300 px', width: 900, height: 300 },
    mobile: { label: '390 × 260 px', width: 390, height: 260 }
  },
  'blog-middle': {
    desktop: { label: '900 × 320 px', width: 900, height: 320 },
    tablet: { label: '720 × 280 px', width: 720, height: 280 },
    mobile: { label: '390 × 240 px', width: 390, height: 240 }
  },
  'blog-footer': {
    desktop: { label: '1200 × 240 px', width: 1200, height: 240 },
    tablet: { label: '900 × 220 px', width: 900, height: 220 },
    mobile: { label: '390 × 180 px', width: 390, height: 180 }
  }
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height })
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Erro ao ler a imagem'))
    }
    img.src = url
  })
}

const emptySlide = (order = 1): Slide => ({
  id: crypto.randomUUID(),
  title: '',
  link: '',
  target: '_self',
  sort_order: order,
  image_url: '',
  tablet_image_url: '',
  mobile_image_url: '',
  show_desktop: true,
  show_tablet: true,
  show_mobile: true,
  promo_badge: '10% OFF',
  promo_text: 'Compre à vista com 10% de desconto',
  background_color: '#b5f500',
  text_color: '#111111'
})

const defaultMiddleSections = (): MiddleSection[] => [
  { id: 'sec-1', title: 'Coluna Esquerda', type: 'single', interval: 5, slides: [emptySlide(1)] },
  { id: 'sec-2', title: 'Coluna Central', type: 'single', interval: 5, slides: [emptySlide(1)] },
  { id: 'sec-3', title: 'Coluna Direita', type: 'single', interval: 5, slides: [emptySlide(1)] }
]

const LEGACY_PREFIX = '__TEKNIX_AD_V2__'
function encodeLegacyAdConfig(value: unknown) {
  return LEGACY_PREFIX + encodeURIComponent(JSON.stringify(value))
}
function decodeLegacyAdConfig(value: string | undefined) {
  if (!value?.startsWith(LEGACY_PREFIX)) return null
  try {
    return JSON.parse(decodeURIComponent(value.slice(LEGACY_PREFIX.length)))
  } catch {
    return null
  }
}

export default function AdsForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const editing = Boolean(id)
  const [name, setName] = useState('')
  const [placement, setPlacement] = useState('home-hero')
  const [type, setType] = useState<'single' | 'carousel'>('single')
  const [interval, setIntervalValue] = useState(5)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [active, setActive] = useState(true)
  const [slides, setSlides] = useState<Slide[]>([emptySlide()])
  const [middleSections, setMiddleSections] = useState<MiddleSection[]>(defaultMiddleSections())
  const [showArrows, setShowArrows] = useState(true)
  const [showDots, setShowDots] = useState(true)
  const [arrowsPosition, setArrowsPosition] = useState<'inside' | 'outside'>('inside')
  const [widthMode, setWidthMode] = useState<'full' | 'container'>('container')
  const [nameError, setNameError] = useState('')
  const [saving, setSaving] = useState(false)
  const [published, setPublished] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [uploading, setUploading] = useState('')
  const [deviceStatus, setDeviceStatus] = useState<Record<string, {
    type: 'error' | 'success' | 'warning'
    detected: string
    required: string
  }>>({})
  const fileRef = useRef<HTMLInputElement>(null)
  const uploadTarget = useRef<{ index: number; device: Device; secIdx?: number }>({ index: 0, device: 'desktop' })
  const sizes = SIZES[placement] || SIZES['home-hero']

  useEffect(() => {
    if (!id) return
    supabase
      .from('ads')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return
        const saved = decodeLegacyAdConfig(data.link)
        setName(data.name || '')
        setPlacement(data.placement || 'home-hero')
        setType(saved?.type || data.type || 'single')
        setIntervalValue(saved?.interval_seconds || data.interval_seconds || data.items?.[0]?.interval_seconds || 5)
        setShowArrows(saved?.show_arrows !== false)
        setShowDots(saved?.show_dots !== false)
        setArrowsPosition(saved?.arrows_position === 'outside' ? 'outside' : 'inside')
        setWidthMode(saved?.width_mode === 'container' ? 'container' : 'full')
        setStartDate(data.start_date?.slice(0, 16) || '')
        setEndDate(data.end_date?.slice(0, 16) || '')
        setActive(data.is_active !== false)

        const raw = Array.isArray(saved?.items) && saved.items.length
          ? saved.items
          : Array.isArray(data.items) && data.items.length
          ? data.items
          : [{ image_url: data.image_url, link: saved?.destination_link || data.link, target: saved?.target || data.target }]

        setSlides(
          raw.map((s: any, i: number) => ({
            ...emptySlide(i + 1),
            ...s,
            tablet_image_url: s.tablet_image_url || '',
            mobile_image_url: s.mobile_image_url || ''
          }))
        )

        // Se houver seções salvas para middle_screen
        if (saved?.sections && Array.isArray(saved.sections) && saved.sections.length === 3) {
          setMiddleSections(
            saved.sections.map((sec: any, idx: number) => ({
              id: sec.id || `sec-${idx + 1}`,
              title: sec.title || (idx === 0 ? 'Coluna Esquerda' : idx === 1 ? 'Coluna Central' : 'Coluna Direita'),
              type: sec.type || 'single',
              interval: sec.interval || sec.interval_seconds || 5,
              slides: (Array.isArray(sec.slides) && sec.slides.length ? sec.slides : [emptySlide(1)]).map((s: any, i: number) => ({
                ...emptySlide(i + 1),
                ...s
              }))
            }))
          )
        } else if (data.placement === 'middle_screen' || data.placement === 'home-middle') {
          setMiddleSections([
            { id: 'sec-1', title: 'Coluna Esquerda', type: 'single', interval: 5, slides: [raw[0] ? { ...emptySlide(1), ...raw[0] } : emptySlide(1)] },
            { id: 'sec-2', title: 'Coluna Central', type: 'single', interval: 5, slides: [raw[1] ? { ...emptySlide(1), ...raw[1] } : emptySlide(1)] },
            { id: 'sec-3', title: 'Coluna Direita', type: 'single', interval: 5, slides: [raw[2] ? { ...emptySlide(1), ...raw[2] } : emptySlide(1)] }
          ])
        }
      })
  }, [id])

  const update = (index: number, patch: Partial<Slide>) =>
    setSlides(v => v.map((s, i) => (i === index ? { ...s, ...patch } : s)))

  const updateMiddleSection = (secIdx: number, patch: Partial<MiddleSection>) => {
    setMiddleSections(prev => prev.map((sec, i) => (i === secIdx ? { ...sec, ...patch } : sec)))
  }

  const updateMiddleSlide = (secIdx: number, slideIdx: number, patch: Partial<Slide>) => {
    setMiddleSections(prev =>
      prev.map((sec, i) => {
        if (i !== secIdx) return sec
        const updated = sec.slides.map((sl, slI) => (slI === slideIdx ? { ...sl, ...patch } : sl))
        return { ...sec, slides: updated }
      })
    )
  }

  const addMiddleSlide = (secIdx: number) => {
    setMiddleSections(prev =>
      prev.map((sec, i) => {
        if (i !== secIdx) return sec
        return { ...sec, slides: [...sec.slides, emptySlide(sec.slides.length + 1)] }
      })
    )
  }

  const removeMiddleSlide = (secIdx: number, slideIdx: number) => {
    setMiddleSections(prev =>
      prev.map((sec, i) => {
        if (i !== secIdx) return sec
        return { ...sec, slides: sec.slides.filter((_, slI) => slI !== slideIdx) }
      })
    )
  }

  const [mediaModalOpen, setMediaModalOpen] = useState(false)
  const [activeTarget, setActiveTarget] = useState<{ index: number; device: Device; secIdx?: number } | null>(null)

  function openMediaLibrary(index: number, device: Device, secIdx?: number) {
    setActiveTarget({ index, device, secIdx })
    setMediaModalOpen(true)
  }

  function handleMediaSelected(url: string, meta?: { width?: number; height?: number; name?: string }) {
    if (!activeTarget) return
    const { index, device, secIdx } = activeTarget
    const expected = (SIZES[placement] || SIZES['home-hero'])?.[device]
    const statusKey = secIdx !== undefined ? `${secIdx}-${index}-${device}` : `${index}-${device}`

    if (secIdx !== undefined) {
      updateMiddleSlide(secIdx, index, { [device === 'desktop' ? 'image_url' : `${device}_image_url`]: url })
    } else {
      update(index, { [device === 'desktop' ? 'image_url' : `${device}_image_url`]: url })
    }

    if (expected && meta?.width && meta?.height) {
      const isExact = meta.width === expected.width && meta.height === expected.height
      const isRetina = meta.width === expected.width * 2 && meta.height === expected.height * 2

      setDeviceStatus(prev => ({
        ...prev,
        [statusKey]: {
          type: isExact || isRetina ? 'success' : 'warning',
          detected: `${meta.width} × ${meta.height} px`,
          required: `${expected.width} × ${expected.height} px`
        }
      }))
    } else {
      const img = new Image()
      img.onload = () => {
        if (expected) {
          const isExact = img.naturalWidth === expected.width && img.naturalHeight === expected.height
          const isRetina = img.naturalWidth === expected.width * 2 && img.naturalHeight === expected.height * 2
          setDeviceStatus(prev => ({
            ...prev,
            [statusKey]: {
              type: isExact || isRetina ? 'success' : 'warning',
              detected: `${img.naturalWidth} × ${img.naturalHeight} px`,
              required: `${expected.width} × ${expected.height} px`
            }
          }))
        }
      }
      img.src = url
    }
  }

  function chooseFile(index: number, device: Device, secIdx?: number) {
    openMediaLibrary(index, device, secIdx)
  }

  function removeImage(index: number, device: Device, secIdx?: number) {
    const field = device === 'desktop' ? 'image_url' : (`${device}_image_url` as keyof Slide)
    const statusKey = secIdx !== undefined ? `${secIdx}-${index}-${device}` : `${index}-${device}`

    if (secIdx !== undefined) {
      updateMiddleSlide(secIdx, index, { [field]: '' })
    } else {
      update(index, { [field]: '' })
    }

    setDeviceStatus(prev => {
      const copy = { ...prev }
      delete copy[statusKey]
      return copy
    })
  }

  async function upload(file: File) {
    const { index, device, secIdx } = uploadTarget.current
    const expected = (SIZES[placement] || SIZES['home-hero'])?.[device]
    const statusKey = secIdx !== undefined ? `${secIdx}-${index}-${device}` : `${index}-${device}`

    // Validação estrita de dimensões
    if (expected) {
      try {
        const dim = await getImageDimensions(file)
        const isExact = dim.width === expected.width && dim.height === expected.height
        const isRetina2x = dim.width === expected.width * 2 && dim.height === expected.height * 2

        if (!isExact && !isRetina2x) {
          setDeviceStatus(prev => ({
            ...prev,
            [statusKey]: {
              type: 'error',
              detected: `${dim.width} × ${dim.height} px`,
              required: `${expected.width} × ${expected.height} px`
            }
          }))
          return
        } else {
          setDeviceStatus(prev => ({
            ...prev,
            [statusKey]: {
              type: 'success',
              detected: `${dim.width} × ${dim.height} px`,
              required: `${expected.width} × ${expected.height} px`
            }
          }))
        }
      } catch (err) {
        console.warn('Não foi possível verificar as dimensões da imagem:', err)
      }
    }

    setUploading(`${index}-${device}`)
    const path = `ads/${Date.now()}-${device}.${file.name.split('.').pop()}`
    let bucket = 'media'
    let res = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    if (res.error) {
      bucket = 'uploads'
      res = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
    }
    if (res.error) {
      alert('Não foi possível enviar a imagem.')
      setUploading('')
      return
    }
    const url = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
    if (secIdx !== undefined) {
      updateMiddleSlide(secIdx, index, { [device === 'desktop' ? 'image_url' : `${device}_image_url`]: url })
    } else {
      update(index, { [device === 'desktop' ? 'image_url' : `${device}_image_url`]: url })
    }
    setUploading('')
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setNameError('O nome interno é obrigatório para identificar o anúncio no painel.')
      return
    }
    setNameError('')

    setSaving(true)

    // Tratamento especial para Meio da Tela (3 blocos em 1 container)
    if (placement === 'middle_screen' || placement === 'home-middle') {
      const configuredSections = middleSections.map(sec => ({
        ...sec,
        slides: sec.slides.map(s => ({ ...s, interval_seconds: Math.max(1, sec.interval) }))
      }))
      const flatItems = configuredSections.map(sec => sec.slides[0] || emptySlide(1))
      const first = flatItems[0]

      const legacyConfig = {
        type: 'sections',
        sections: configuredSections,
        items: flatItems,
        destination_link: first?.link || '#',
        width_mode: widthMode
      }
      const payload = {
        name: name.trim(),
        placement,
        type: 'single',
        interval_seconds: 5,
        image_url: first?.image_url || '',
        link: first?.link || '#',
        target: first?.target || '_self',
        items: flatItems,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        is_active: active,
        updated_at: new Date().toISOString()
      }

      let result = editing
        ? await supabase.from('ads').update(payload).eq('id', id)
        : await supabase.from('ads').insert({ ...payload, created_at: new Date().toISOString() })

      if (result.error?.message.includes('schema cache')) {
        const compatiblePayload = {
          name: payload.name,
          placement: payload.placement,
          image_url: payload.image_url,
          link: encodeLegacyAdConfig(legacyConfig),
          start_date: payload.start_date,
          end_date: payload.end_date,
          is_active: payload.is_active,
          updated_at: payload.updated_at
        }
        result = editing
          ? await supabase.from('ads').update(compatiblePayload).eq('id', id)
          : await supabase.from('ads').insert({ ...compatiblePayload, created_at: new Date().toISOString() })
      }

      setSaving(false)
      if (result.error) return alert(`Erro ao salvar: ${result.error.message}`)

      setPublished(true)
      setToast('Anúncio do Meio da Tela publicado com sucesso!')
      setTimeout(() => setPublished(false), 4000)
      return
    }

    // Demais posições convencionais
    if (placement !== 'promo-bar' && !slides[0]?.image_url) return alert('Envie ao menos a imagem para desktop.')
    if (placement !== 'promo-bar' && type === 'carousel' && slides.some(s => !s.image_url))
      return alert('Cada slide precisa de imagem desktop.')

    const first = slides[0]
    const configuredSlides = slides.map(s => ({ ...s, interval_seconds: Math.max(1, interval) }))
    const legacyConfig = {
      type,
      interval_seconds: Math.max(1, interval),
      target: first.target,
      items: configuredSlides,
      show_arrows: showArrows,
      show_dots: showDots,
      arrows_position: arrowsPosition,
      destination_link: first.link || '#',
      width_mode: widthMode
    }
    const payload = {
      name: name.trim(),
      placement,
      type,
      interval_seconds: Math.max(1, interval),
      image_url: first.image_url,
      link: first.link || '#',
      target: first.target,
      items: configuredSlides,
      start_date: startDate ? new Date(startDate).toISOString() : null,
      end_date: endDate ? new Date(endDate).toISOString() : null,
      is_active: active,
      updated_at: new Date().toISOString()
    }

    let result = editing
      ? await supabase.from('ads').update(payload).eq('id', id)
      : await supabase.from('ads').insert({ ...payload, created_at: new Date().toISOString() })

    if (result.error?.message.includes('schema cache')) {
      const compatiblePayload = {
        name: payload.name,
        placement: payload.placement,
        image_url: payload.image_url,
        link: encodeLegacyAdConfig(legacyConfig),
        start_date: payload.start_date,
        end_date: payload.end_date,
        is_active: payload.is_active,
        updated_at: payload.updated_at
      }
      result = editing
        ? await supabase.from('ads').update(compatiblePayload).eq('id', id)
        : await supabase.from('ads').insert({ ...compatiblePayload, created_at: new Date().toISOString() })
    }

    setSaving(false)
    if (result.error) return alert(`Erro ao salvar: ${result.error.message}`)

    setPublished(true)
    setToast('Anúncio publicado com sucesso!')
    setTimeout(() => {
      setPublished(false)
    }, 4000)
  }

  return (
    <div className="ads-editor-page">
      <header className="ads-editor-header">
        <div>
          <span className="ads-editor-kicker">PUBLICIDADE</span>
          <h1>{editing ? 'Editar anúncio' : 'Novo anúncio'}</h1>
          <p>Configure formatos, dispositivos, período e destino.</p>
        </div>
        <div className="ads-editor-actions">
          <a
            href="http://localhost:5173/?ads-edit=1"
            target="_blank"
            rel="noreferrer"
            className="ads-btn secondary"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Abre o site destacando as áreas e margens onde os anúncios são exibidos"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Ver Áreas no Site
          </a>
          <button type="button" className="ads-btn secondary" onClick={() => navigate('/hub/ads')}>
            Voltar para lista
          </button>
          <button
            className={`ads-btn primary ${published ? 'published' : ''}`}
            form="ads-editor-form"
            disabled={saving}
          >
            {saving ? 'Salvando…' : published ? '✓ Publicado!' : 'Publicar anúncio'}
          </button>
        </div>
      </header>

      {placement === 'promo-bar' && (
        <section className="ads-editor-card ads-promo-settings">
          <h2>Conteúdo do Desconto OFF</h2>
          <p>Use texto e cores, uma imagem por dispositivo, ou combine os dois.</p>
          <div className="ads-fields two">
            <label>
              Selo
              <input
                value={slides[0].promo_badge || ''}
                onChange={e => update(0, { promo_badge: e.target.value })}
                placeholder="10% OFF"
              />
            </label>
            <label>
              Texto da promoção
              <input
                value={slides[0].promo_text || ''}
                onChange={e => update(0, { promo_text: e.target.value })}
                placeholder="Compre à vista com 10% de desconto"
              />
            </label>
            <label>
              Cor do fundo
              <input
                type="color"
                value={slides[0].background_color || '#b5f500'}
                onChange={e => update(0, { background_color: e.target.value })}
              />
            </label>
            <label>
              Cor do texto
              <input
                type="color"
                value={slides[0].text_color || '#111111'}
                onChange={e => update(0, { text_color: e.target.value })}
              />
            </label>
          </div>
        </section>
      )}

      <form id="ads-editor-form" onSubmit={save} className="ads-editor-form">
        <section className="ads-editor-card">
          <h2>Informações e posição</h2>
          <div className="ads-fields two">
            <label>
              Nome interno *
              <input
                value={name}
                onChange={e => { setName(e.target.value); if (e.target.value.trim()) setNameError('') }}
                placeholder="Ex: Vitrine Tripla do Meio da Tela"
                aria-invalid={Boolean(nameError)}
              />
              {nameError && <span className="ads-field-error">{nameError}</span>}
            </label>
            <label>
              Posição *
              <select value={placement} onChange={e => setPlacement(e.target.value)}>
                {PLACEMENTS.map(p => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className={`ads-placement-preview preview-${placement}`}>
            <div className="ads-preview-browser">
              <span className="ads-preview-header">Cabeçalho</span>
              <span className="ads-preview-hero">Conteúdo da página</span>
              <span className="ads-preview-slot">Esta é a posição selecionada</span>
              <span className="ads-preview-content">Conteúdo</span>
              <span className="ads-preview-footer">Rodapé</span>
            </div>
            <div><strong>{PLACEMENTS.find(p => p.value === placement)?.label}</strong><p>{PLACEMENTS.find(p => p.value === placement)?.desc}</p></div>
          </div>

          {placement === 'promo-bar' && (
            <div className="ads-width-mode">
              <strong>Largura da faixa</strong>
              <label><input type="radio" name="width-mode" checked={widthMode === 'full'} onChange={() => setWidthMode('full')} /> Tela inteira</label>
              <label><input type="radio" name="width-mode" checked={widthMode === 'container'} onChange={() => setWidthMode('container')} /> Container do site</label>
              <span>A altura permanece em 44 px nos dois modos.</span>
            </div>
          )}

          <div className="ads-size-guide">
            <strong>Tamanhos obrigatórios do sistema</strong>
            {(['desktop', 'tablet', 'mobile'] as Device[]).map(d => (
              <div key={d}>
                <span>{d === 'desktop' ? 'Desktop / notebook' : d === 'tablet' ? 'Tablet' : 'Celular'}</span>
                <b>{sizes[d].label}</b>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================
            MODO ESPECIAL: MEIO DA TELA (3 BLOCOS LADO A LADO)
            ======================================================== */}
        {placement === 'middle_screen' || placement === 'home-middle' ? (
          <section className="ads-editor-card">
            <div className="ads-middle-blocks-intro">
              <div style={{ flex: 1 }}>
                <h3>3 Seções do Meio da Tela (Colunas lado a lado no Container)</h3>
                <p>
                  Esta vitrine é composta por 3 blocos lado a lado no container de 1440px. Cada bloco mede <strong>470 × 360 px</strong> no desktop e pode ter imagem fixa ou carrossel individual.
                </p>
              </div>
            </div>

            <div className="ads-middle-blocks-grid">
              {middleSections.map((sec, secIdx) => (
                <div className="ads-middle-block-card" key={sec.id}>
                  <div className="ads-middle-block-header">
                    <span className="ads-middle-block-title">
                      <span className={`ads-block-pill pos-${secIdx + 1}`}>Bloco {secIdx + 1}</span>
                      {sec.title}
                    </span>
                    <div className="ads-type-tabs" style={{ margin: 0 }}>
                      <button
                        type="button"
                        className={sec.type === 'single' ? 'active' : ''}
                        onClick={() =>
                          updateMiddleSection(secIdx, {
                            type: 'single',
                            slides: [sec.slides[0] || emptySlide(1)]
                          })
                        }
                      >
                        Fixa
                      </button>
                      <button
                        type="button"
                        className={sec.type === 'carousel' ? 'active' : ''}
                        onClick={() => updateMiddleSection(secIdx, { type: 'carousel' })}
                      >
                        Carrossel
                      </button>
                    </div>
                  </div>

                  {sec.type === 'carousel' && (
                    <div className="ads-carousel-options" style={{ margin: '4px 0 10px', padding: '10px' }}>
                      <label className="ads-interval" style={{ fontSize: '12px' }}>
                        Tempo{' '}
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={sec.interval}
                          onChange={e => updateMiddleSection(secIdx, { interval: Number(e.target.value) })}
                          style={{ width: '50px', height: '30px' }}
                        />{' '}
                        segundos
                      </label>
                    </div>
                  )}

                  {sec.slides.map((slide, slideIdx) => (
                    <div className="ads-slide" key={slide.id} style={{ marginTop: 0, padding: '14px' }}>
                      {sec.type === 'carousel' && (
                        <div className="ads-slide-title" style={{ marginBottom: '8px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 700 }}>Slide {slideIdx + 1}</span>
                          {sec.slides.length > 1 && (
                            <button type="button" onClick={() => removeMiddleSlide(secIdx, slideIdx)}>
                              Remover
                            </button>
                          )}
                        </div>
                      )}

                      <div className="ads-device-grid">
                        {(['desktop', 'tablet', 'mobile'] as Device[]).map(device => {
                          const field = device === 'desktop' ? 'image_url' : (`${device}_image_url` as keyof Slide)
                          const visibleField = (device === 'desktop' ? 'show_desktop' : device === 'tablet' ? 'show_tablet' : 'show_mobile') as keyof Slide
                          const url = String(slide[field] || '')
                          const statusKey = `${secIdx}-${slideIdx}-${device}`
                          const status = deviceStatus[statusKey]
                          const hasError = status?.type === 'error'
                          const expected = sizes[device]

                          return (
                            <div className={`ads-device-card ${hasError ? 'has-error' : ''}`} key={device}>
                              <div className="ads-device-head">
                                <b>{device === 'desktop' ? 'Desktop' : device === 'tablet' ? 'Tablet' : 'Celular'}</b>
                                <span>{expected.label}</span>
                              </div>
                              <div className="ads-upload-wrapper">
                                <button
                                  type="button"
                                  className="ads-upload"
                                  onClick={() => openMediaLibrary(slideIdx, device, secIdx)}
                                >
                                  {url ? (
                                    /\.(mp4|webm|mov)(\?|$)/i.test(url)
                                      ? <video src={url} muted loop autoPlay playsInline />
                                      : <img src={url} alt="" />
                                  ) : (
                                    <span>+ Selecionar imagem</span>
                                  )}
                                </button>
                                {url && (
                                  <button
                                    type="button"
                                    className="ads-remove-image-btn"
                                    title="Excluir imagem deste dispositivo"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      e.preventDefault()
                                      removeImage(slideIdx, device, secIdx)
                                    }}
                                  >
                                    <Trash2 size={13} />
                                    <span>Excluir</span>
                                  </button>
                                )}
                              </div>

                              {status?.type === 'error' && (
                                <div className="ads-device-alert error">
                                  <div className="alert-badge">⚠️ Tamanho fora do padrão!</div>
                                  <div className="alert-details">
                                    <span>Detectado: <strong>{status.detected}</strong></span>
                                    <span>Exigido: <strong>{status.required}</strong></span>
                                  </div>
                                  <p className="alert-action">Ajuste para {status.required}.</p>
                                </div>
                              )}

                              {status?.type === 'warning' && (
                                <div className="ads-device-alert warning">
                                  <div className="alert-badge">⚠️ Dimensão diferente</div>
                                  <div className="alert-details">
                                    <span>Atual: <strong>{status.detected}</strong></span>
                                    <span>Padrão: <strong>{status.required}</strong></span>
                                  </div>
                                </div>
                              )}

                              {status?.type === 'success' && (
                                <div className="ads-device-alert success">
                                  <span>✓ Aprovada: <strong>{status.detected}</strong></span>
                                </div>
                              )}

                              <label className="ads-device-toggle">
                                <input
                                  type="checkbox"
                                  checked={Boolean(slide[visibleField])}
                                  onChange={e => updateMiddleSlide(secIdx, slideIdx, { [visibleField]: e.target.checked })}
                                />{' '}
                                Exibir neste dispositivo
                              </label>
                            </div>
                          )
                        })}
                      </div>

                      <div className="ads-fields" style={{ marginTop: '10px' }}>
                        <label style={{ fontSize: '12px' }}>
                          Link de destino
                          <input
                            value={slide.link}
                            onChange={e => updateMiddleSlide(secIdx, slideIdx, { link: e.target.value })}
                            placeholder="/produtos/... ou https://..."
                          />
                        </label>
                        <label style={{ fontSize: '12px' }}>
                          Abertura
                          <select
                            value={slide.target}
                            onChange={e => updateMiddleSlide(secIdx, slideIdx, { target: e.target.value as '_self' | '_blank' })}
                          >
                            <option value="_self">Mesma página</option>
                            <option value="_blank">Nova aba</option>
                          </select>
                        </label>
                      </div>
                    </div>
                  ))}

                  {sec.type === 'carousel' && (
                    <button
                      type="button"
                      className="ads-add-slide"
                      onClick={() => addMiddleSlide(secIdx)}
                      style={{ padding: '8px', fontSize: '12px' }}
                    >
                      + Adicionar slide ao Bloco {secIdx + 1}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        ) : (
          /* ========================================================
             MODO PADRÃO: HOME HERO, RODAPÉ, CABEÇALHO, PRODUTO
             ======================================================== */
          <section className="ads-editor-card">
            <div className="ads-card-heading">
              <div>
                <h2>Formato e imagens</h2>
                <p>Todos os espaços aceitam imagem única ou carrossel.</p>
              </div>
              <div className="ads-type-tabs">
                <button
                  type="button"
                  className={type === 'single' ? 'active' : ''}
                  onClick={() => {
                    setType('single')
                    setSlides(v => [v[0] || emptySlide()])
                  }}
                >
                  Imagem única
                </button>
                <button
                  type="button"
                  className={type === 'carousel' ? 'active' : ''}
                  onClick={() => setType('carousel')}
                >
                  Carrossel
                </button>
              </div>
            </div>

            {type === 'carousel' && (
              <div className="ads-carousel-options">
                <label className="ads-interval">
                  Tempo entre imagens{' '}
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={interval}
                    onChange={e => setIntervalValue(Number(e.target.value))}
                  />{' '}
                  segundos
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showArrows}
                    onChange={e => setShowArrows(e.target.checked)}
                  />{' '}
                  Exibir setas
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={showDots}
                    onChange={e => setShowDots(e.target.checked)}
                  />{' '}
                  Exibir bolinhas
                </label>
                <label>
                  Posição das setas{' '}
                  <select
                    value={arrowsPosition}
                    onChange={e => setArrowsPosition(e.target.value as 'inside' | 'outside')}
                  >
                    <option value="inside">Dentro da imagem</option>
                    <option value="outside">Fora da imagem</option>
                  </select>
                </label>
              </div>
            )}

            {slides.map((slide, index) => (
              <div className="ads-slide" key={slide.id}>
                <div className="ads-slide-title">
                  <strong>{type === 'carousel' ? `Slide ${index + 1}` : 'Imagem do anúncio'}</strong>
                  {type === 'carousel' && slides.length > 1 && (
                    <button type="button" onClick={() => setSlides(v => v.filter((_, i) => i !== index))}>
                      Remover
                    </button>
                  )}
                </div>

                <div className="ads-device-grid">
                  {(['desktop', 'tablet', 'mobile'] as Device[]).map(device => {
                    const field = device === 'desktop' ? 'image_url' : (`${device}_image_url` as keyof Slide)
                    const visibleField = (device === 'desktop' ? 'show_desktop' : device === 'tablet' ? 'show_tablet' : 'show_mobile') as keyof Slide
                    const url = String(slide[field] || '')
                    const statusKey = `${index}-${device}`
                    const status = deviceStatus[statusKey]
                    const hasError = status?.type === 'error'
                    const expected = (SIZES[placement] || SIZES['home-hero'])?.[device]

                    return (
                      <div className={`ads-device-card ${hasError ? 'has-error' : ''}`} key={device}>
                        <div className="ads-device-head">
                          <b>{device === 'desktop' ? 'Desktop / notebook' : device === 'tablet' ? 'Tablet' : 'Celular'}</b>
                          <span>{sizes[device].label}</span>
                        </div>
                        <div className="ads-upload-wrapper">
                          <button
                            type="button"
                            className="ads-upload"
                            onClick={() => chooseFile(index, device)}
                          >
                            {url ? (
                              /\.(mp4|webm|mov)(\?|$)/i.test(url) ? (
                                <video src={url} muted loop autoPlay playsInline />
                              ) : <img
                                src={url}
                                alt=""
                                onLoad={e => {
                                  const imgEl = e.currentTarget
                                  if (!status && imgEl.naturalWidth && expected) {
                                    const exact = imgEl.naturalWidth === expected.width && imgEl.naturalHeight === expected.height
                                    const retina = imgEl.naturalWidth === expected.width * 2 && imgEl.naturalHeight === expected.height * 2
                                    if (!exact && !retina) {
                                      setDeviceStatus(prev => ({
                                        ...prev,
                                        [statusKey]: {
                                          type: 'warning',
                                          detected: `${imgEl.naturalWidth} × ${imgEl.naturalHeight} px`,
                                          required: `${expected.width} × ${expected.height} px`
                                        }
                                      }))
                                    }
                                  }
                                }}
                              />
                            ) : (
                              <span>{uploading === `${index}-${device}` ? 'Enviando…' : '+ Selecionar imagem'}</span>
                            )}
                          </button>
                          {url && (
                            <button
                              type="button"
                              className="ads-remove-image-btn"
                              title="Excluir imagem deste dispositivo"
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                removeImage(index, device)
                              }}
                            >
                              <Trash2 size={13} />
                              <span>Excluir</span>
                            </button>
                          )}
                        </div>

                        {/* Mensagem direta no próprio card avisando sobre o tamanho */}
                        {status?.type === 'error' && (
                          <div className="ads-device-alert error">
                            <div className="alert-badge">⚠️ Tamanho fora do padrão!</div>
                            <div className="alert-details">
                              <span>Detectado: <strong>{status.detected}</strong></span>
                              <span>Exigido: <strong>{status.required}</strong></span>
                            </div>
                            <p className="alert-action">Ajuste a imagem para {status.required} para poder enviar.</p>
                          </div>
                        )}

                        {status?.type === 'warning' && (
                          <div className="ads-device-alert warning">
                            <div className="alert-badge">⚠️ Dimensão fora do padrão</div>
                            <div className="alert-details">
                              <span>Atual: <strong>{status.detected}</strong></span>
                              <span>Padrão oficial: <strong>{status.required}</strong></span>
                            </div>
                            <p className="alert-action">Recomendado substituir por arte em {status.required}.</p>
                          </div>
                        )}

                        {status?.type === 'success' && (
                          <div className="ads-device-alert success">
                            <span>✓ Dimensão aprovada: <strong>{status.detected}</strong></span>
                          </div>
                        )}

                        <label className="ads-device-toggle">
                          <input
                            type="checkbox"
                            checked={Boolean(slide[visibleField])}
                            onChange={e => update(index, { [visibleField]: e.target.checked })}
                          />{' '}
                          Exibir neste dispositivo
                        </label>
                      </div>
                    )
                  })}
                </div>

                <div className="ads-fields two">
                  <label>
                    Link de destino
                    <input
                      value={slide.link}
                      onChange={e => update(index, { link: e.target.value })}
                      placeholder="/produtos/... ou https://..."
                    />
                  </label>
                  <label>
                    Abertura
                    <select
                      value={slide.target}
                      onChange={e => update(index, { target: e.target.value as '_self' | '_blank' })}
                    >
                      <option value="_self">Mesma página</option>
                      <option value="_blank">Nova aba</option>
                    </select>
                  </label>
                </div>
              </div>
            ))}

            {type === 'carousel' && (
              <button
                type="button"
                className="ads-add-slide"
                onClick={() => setSlides(v => [...v, emptySlide(v.length + 1)])}
              >
                + Adicionar imagem ao carrossel
              </button>
            )}

            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
              hidden
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) upload(f)
                e.currentTarget.value = ''
              }}
            />
          </section>
        )}

        <section className="ads-editor-card">
          <h2>Exibição</h2>
          <div className="ads-fields three">
            <label>
              Início
              <input
                type="datetime-local"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
              />
            </label>
            <label>
              Término
              <input
                type="datetime-local"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
              />
            </label>
            <label className="ads-active-toggle">
              <input
                type="checkbox"
                checked={active}
                onChange={e => setActive(e.target.checked)}
              />{' '}
              Publicar como ativo
            </label>
          </div>
        </section>
      </form>

      <MediaLibraryModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelectMedia={handleMediaSelected}
        deviceLabel={
          activeTarget?.device === 'desktop'
            ? 'Desktop / notebook'
            : activeTarget?.device === 'tablet'
            ? 'Tablet'
            : 'Celular'
        }
        expectedSize={
          activeTarget ? (SIZES[placement] || SIZES['home-hero'])?.[activeTarget.device] : undefined
        }
      />

      {toast && (
        <div className="ads-bottom-toast">
          <div className="ads-toast-content">
            <CheckCircle2 size={20} className="ads-toast-icon" />
            <div>
              <strong>{toast}</strong>
              <p>O anúncio já está salvo e publicado na loja.</p>
            </div>
          </div>
          <div className="ads-toast-actions">
            <button
              type="button"
              className="ads-toast-btn"
              onClick={() => navigate('/hub/ads')}
            >
              Ver todos os anúncios
            </button>
            <button
              type="button"
              className="ads-toast-close"
              onClick={() => setToast(null)}
              aria-label="Fechar"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
