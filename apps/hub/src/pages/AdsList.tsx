import AdsPageLocations from '../components/editor/AdsPageLocations'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './AdsList.css'

export interface AdCarouselItem {
  id: string
  title: string
  image_url: string
  link: string
  target: '_self' | '_blank'
  sort_order: number
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
  created_at: string
  updated_at: string
}

export const PLACEMENTS = [
  { value: 'promo-bar', label: 'Global — Faixa promocional', group: 'Global', desc: 'Faixa estreita abaixo do cabeçalho em desktop, tablet e celular' },
  { value: 'global-header', label: 'Global — Header (todas as páginas)', group: 'Global', desc: 'Topo fixo ou anúncio global' },
  { value: 'home-hero', label: 'Home — Full banner (1620 × 219 px)', group: 'Home', desc: 'Largura total da tela, na proporção 1620 × 219. Aceita imagem única ou carrossel.' },
  { value: 'home-promo-strip', label: 'Home — Faixa promocional (2080 × 185 px)', group: 'Home', desc: 'Faixa compacta entre o banner principal e as Ofertas Relâmpago. Aceita imagem única ou carrossel, com exibição proporcional sem cortes.' },
  { value: 'home-middle', label: 'Home — Meio da página', group: 'Home', desc: 'Faixa intermediária da Home' },
  { value: 'middle_screen', label: 'Meio da Tela (middle_screen)', group: 'Geral', desc: 'Espaço no centro da página para carrossel ou produtos menores' },
  { value: 'profession-showcase', label: 'Home — Explore por profissão', group: 'Home', desc: 'Substitui a seção Explore por profissão por mídia administrável' },
  { value: 'home-footer', label: 'Home — Rodapé', group: 'Home', desc: 'Faixa antes do rodapé da Home' },
  { value: 'product-header', label: 'Produto — Topo', group: 'Produto', desc: 'Topo da página de detalhes do produto' },
  { value: 'product-middle', label: 'Produto — Meio', group: 'Produto', desc: 'Meio da página de produto' },
  { value: 'product', label: 'Espaço de Produto (product)', group: 'Geral', desc: 'Anúncio limpo e integrado, sem bordas' },
  { value: 'product-footer', label: 'Produto — Rodapé', group: 'Produto', desc: 'Rodapé da página de produto' },
  { value: 'blog-header', label: 'Blog — Topo', group: 'Blog', desc: 'Topo da página de blog' },
  { value: 'blog-middle', label: 'Blog — Meio do conteúdo', group: 'Blog', desc: 'Meio dos artigos' },
  { value: 'blog-footer', label: 'Blog — Rodapé', group: 'Blog', desc: 'Rodapé do blog' },
  { value: 'global-footer', label: 'Global — Footer (todas as páginas)', group: 'Global', desc: 'Rodapé global' },
]

export function getPlacementLabel(value: string) {
  return PLACEMENTS.find(p => p.value === value)?.label || value
}

const LEGACY_PREFIX = '__TEKNIX_AD_V2__'
function decodeLegacyAdConfig(value?: string) {
  if (!value?.startsWith(LEGACY_PREFIX)) return null
  try { return JSON.parse(decodeURIComponent(value.slice(LEGACY_PREFIX.length))) }
  catch { return null }
}

export default function AdsList() {
  const navigate = useNavigate()
  const [ads, setAds] = useState<Ad[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAd, setEditingAd] = useState<Ad | null>(null)
  const [previewAd, setPreviewAd] = useState<Ad | null>(null)
  const [filterPlacement, setFilterPlacement] = useState('all')
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Form state
  const [formName, setFormName] = useState('')
  const [formPlacement, setFormPlacement] = useState('middle_screen')
  const [formType, setFormType] = useState<'single' | 'carousel'>('single')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formLink, setFormLink] = useState('')
  const [formTarget, setFormTarget] = useState<'_self' | '_blank'>('_self')
  const [formInterval, setFormInterval] = useState(5)
  const [formStartDate, setFormStartDate] = useState('')
  const [formEndDate, setFormEndDate] = useState('')
  const [formItems, setFormItems] = useState<AdCarouselItem[]>([])

  const [formUploading, setFormUploading] = useState(false)
  const [formSaving, setFormSaving] = useState(false)
  const [uploadingItemIndex, setUploadingItemIndex] = useState<number | null>(null)

  const imgInputRef = useRef<HTMLInputElement>(null)
  const itemImgInputRef = useRef<HTMLInputElement>(null)

  // Preview Carousel State
  const [previewIndex, setPreviewIndex] = useState(0)

  useEffect(() => { loadAds() }, [])

  async function loadAds() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('sort_order', { ascending: true })
      if (!error && data) {
        setAds(data.map((ad: any) => {
          const saved = decodeLegacyAdConfig(ad.link)
          const items = Array.isArray(saved?.items) && saved.items.length ? saved.items : Array.isArray(ad.items) ? ad.items : []
          return {...ad,link:saved?.destination_link||ad.link,type:saved?.type||ad.type||(items.length>1?'carousel':'single'),target:saved?.target||ad.target||'_self',interval_seconds:saved?.interval_seconds||ad.interval_seconds||5,items,show_arrows:saved?.show_arrows!==false,show_dots:saved?.show_dots!==false,arrows_position:saved?.arrows_position||'inside'}
        }))
      } else {
        setAds([])
      }
    } catch {
      setAds([])
    } finally {
      setLoading(false)
    }
  }

  function openCreateModal() {
    setEditingAd(null)
    setFormName('')
    setFormPlacement('middle_screen')
    setFormType('single')
    setFormImageUrl('')
    setFormLink('')
    setFormTarget('_self')
    setFormInterval(5)
    setFormStartDate('')
    setFormEndDate('')
    setFormItems([
      { id: '1', title: 'Produto 1', image_url: '', link: '', target: '_self', sort_order: 1 },
      { id: '2', title: 'Produto 2', image_url: '', link: '', target: '_self', sort_order: 2 },
    ])
    setShowModal(true)
  }

  function openEditModal(ad: Ad) {
    setEditingAd(ad)
    setFormName(ad.name)
    setFormPlacement(ad.placement || 'middle_screen')
    setFormType(ad.type || 'single')
    setFormImageUrl(ad.image_url || '')
    setFormLink(ad.link || '')
    setFormTarget(ad.target || '_self')
    setFormInterval(ad.interval_seconds || 5)
    setFormStartDate(ad.start_date ? ad.start_date.slice(0, 16) : '')
    setFormEndDate(ad.end_date ? ad.end_date.slice(0, 16) : '')
    setFormItems(
      Array.isArray(ad.items) && ad.items.length > 0
        ? ad.items
        : [
            { id: '1', title: 'Produto 1', image_url: ad.image_url || '', link: ad.link || '', target: ad.target || '_self', sort_order: 1 }
          ]
    )
    setShowModal(true)
  }

  function handleDuplicate(ad: Ad) {
    const duplicatedAd: Ad = {
      ...ad,
      id: '',
      name: `${ad.name} (Cópia)`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    openEditModal(duplicatedAd)
    setEditingAd(null) // tratar como novo
  }

  async function handleImageUpload(file: File, isForCarousel = false, itemIdx = 0) {
    if (isForCarousel) setUploadingItemIndex(itemIdx)
    else setFormUploading(true)

    try {
      const ext = file.name.split('.').pop()
      const path = `ads/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
      const { error: uploadError } = await supabase.storage.from('media').upload(path, file, { upsert: true })
      
      let publicUrl = ''
      if (!uploadError) {
        const { data } = supabase.storage.from('media').getPublicUrl(path)
        publicUrl = data.publicUrl
      } else {
        // Fallback para blob URL ou uploads se bucket 'media' falhar
        const { error: uploadError2 } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
        if (!uploadError2) {
          const { data } = supabase.storage.from('uploads').getPublicUrl(path)
          publicUrl = data.publicUrl
        } else {
          // Último recurso: FileReader data url para não travar
          publicUrl = await new Promise((res) => {
            const reader = new FileReader()
            reader.onload = () => res(reader.result as string)
            reader.readAsDataURL(file)
          })
        }
      }

      if (isForCarousel) {
        setFormItems(prev => prev.map((it, idx) => idx === itemIdx ? { ...it, image_url: publicUrl } : it))
      } else {
        setFormImageUrl(publicUrl)
      }
    } catch {
      alert('Erro ao enviar imagem. Verifique sua conexão.')
    } finally {
      setFormUploading(false)
      setUploadingItemIndex(null)
    }
  }

  function handleAddCarouselItem() {
    const nextOrder = formItems.length + 1
    setFormItems(prev => [
      ...prev,
      {
        id: String(Date.now()),
        title: `Produto ${nextOrder}`,
        image_url: '',
        link: '',
        target: '_self',
        sort_order: nextOrder
      }
    ])
  }

  function handleRemoveCarouselItem(idx: number) {
    if (formItems.length <= 1) {
      alert('O carrossel deve conter pelo menos 1 imagem.')
      return
    }
    setFormItems(prev => prev.filter((_, i) => i !== idx))
  }

  function handleUpdateCarouselItem(idx: number, field: keyof AdCarouselItem, value: any) {
    setFormItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it))
  }

  async function handleSave() {
    if (!formName.trim()) return alert('O Nome do anúncio é obrigatório.')

    if (formType === 'single') {
      if (!formImageUrl.trim()) return alert('A Imagem do anúncio é obrigatória.')
      if (!formLink.trim()) return alert('O Link de destino é obrigatório.')
    } else {
      if (formItems.length === 0) return alert('Adicione pelo menos uma imagem ao carrossel.')
      const hasEmptyImg = formItems.some(it => !it.image_url.trim())
      if (hasEmptyImg) return alert('Todas as imagens do carrossel devem possuir imagem válida.')
    }

    setFormSaving(true)
    try {
      const payload = {
        name: formName.trim(),
        placement: formPlacement,
        type: formType,
        image_url: formType === 'single' ? formImageUrl.trim() : (formItems[0]?.image_url || ''),
        link: formType === 'single' ? formLink.trim() : (formItems[0]?.link || '#'),
        target: formTarget,
        interval_seconds: Number(formInterval) || 5,
        items: formType === 'carousel' ? formItems : [],
        start_date: formStartDate ? new Date(formStartDate).toISOString() : null,
        end_date: formEndDate ? new Date(formEndDate).toISOString() : null,
        updated_at: new Date().toISOString(),
      }

      if (editingAd && editingAd.id) {
        const { error } = await supabase.from('ads').update(payload).eq('id', editingAd.id)
        if (error) throw error
        setAds(prev => prev.map(a => a.id === editingAd.id ? { ...a, ...payload } : a))
      } else {
        const { data, error } = await supabase
          .from('ads')
          .insert({ ...payload, is_active: true, created_at: new Date().toISOString() })
          .select()
          .single()
        if (error) throw error
        if (data) {
          setAds(prev => [
            {
              ...data,
              type: data.type || formType,
              target: data.target || formTarget,
              interval_seconds: data.interval_seconds || formInterval,
              items: Array.isArray(data.items) ? data.items : formItems
            },
            ...prev
          ])
        }
      }
      setShowModal(false)
    } catch (e: any) {
      alert(`Erro ao salvar anúncio: ${e.message || 'Tente novamente'}`)
    } finally {
      setFormSaving(false)
    }
  }

  async function handleToggleActive(ad: Ad) {
    const newActive = !ad.is_active
    try {
      await supabase.from('ads').update({ is_active: newActive }).eq('id', ad.id)
      setAds(prev => prev.map(a => a.id === ad.id ? { ...a, is_active: newActive } : a))
    } catch {
      alert('Erro ao alterar status do anúncio.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este anúncio permanentemente?')) return
    try {
      const { error } = await supabase.from('ads').delete().eq('id', id)
      if (error) throw error
      setAds(prev => prev.filter(a => a.id !== id))
    } catch {
      alert('Erro ao excluir anúncio.')
    }
  }

  // Preview timer
  useEffect(() => {
    if (!previewAd || previewAd.type !== 'carousel' || !previewAd.items || previewAd.items.length <= 1) return
    const timer = setInterval(() => {
      setPreviewIndex(prev => (prev + 1) % previewAd.items.length)
    }, (previewAd.interval_seconds || 5) * 1000)
    return () => clearInterval(timer)
  }, [previewAd])

  const filtered = ads.filter(ad => {
    const matchSearch = ad.name.toLowerCase().includes(search.toLowerCase())
    const matchPlacement = filterPlacement === 'all' || ad.placement === filterPlacement
    return matchSearch && matchPlacement
  })

  const activeCount = ads.filter(a => a.is_active).length
  const inactiveCount = ads.filter(a => !a.is_active).length
  const middleCount = ads.filter(a => a.placement === 'middle_screen' || a.placement === 'home-middle').length
  const carouselCount = ads.filter(a => a.type === 'carousel').length
  const placementCounts = ads.reduce<Record<string, number>>((counts, ad) => {
    counts[ad.placement] = (counts[ad.placement] || 0) + 1
    return counts
  }, {})

  return (
    <div className="ads-list-page">
      <AdsPageLocations/>
      {/* Header */}
      <div className="ads-list-header">
        <div>
          <div className="ads-header-badge">Centro de Publicidade & ADS</div>
          <h2 className="ads-list-title">Gerenciador de ADS (/hub/ads)</h2>
          <p className="ads-list-subtitle">Cadastre, edite e posicione anúncios, vitrines do meio da tela e carrosséis no sistema</p>
        </div>
        <div className="ads-header-actions">
          <a
            href="http://localhost:5173/?ads-edit=1"
            target="_blank"
            rel="noreferrer"
            className="ads-preview-site-btn"
            title="Abre o site destacando com margens e linhas todas as áreas onde os anúncios são exibidos"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Ver Áreas de ADS no Site
          </a>
          <button className="ads-analytics-btn" onClick={() => navigate('/hub/ads/analytics')}>Analytics</button>
          <button className="ads-new-btn" onClick={() => navigate('/hub/ads/add')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Novo ADS
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="ads-stats-row">
        <div className="ads-stat-card">
          <span className="ads-stat-num">{ads.length}</span>
          <span className="ads-stat-label">Total de Anúncios</span>
        </div>
        <div className="ads-stat-card active">
          <span className="ads-stat-num">{activeCount}</span>
          <span className="ads-stat-label">Anúncios Ativos</span>
        </div>
        <div className="ads-stat-card middle">
          <span className="ads-stat-num">{middleCount}</span>
          <span className="ads-stat-label">Meio da Tela</span>
        </div>
        <div className="ads-stat-card carousel">
          <span className="ads-stat-num">{carouselCount}</span>
          <span className="ads-stat-label">Carrosséis</span>
        </div>
        <div className="ads-stat-card inactive">
          <span className="ads-stat-num">{inactiveCount}</span>
          <span className="ads-stat-label">Inativos / Bloqueados</span>
        </div>
      </div>

      {/* Filters */}
      <div className="ads-filters-row">
        <div className="ads-search-wrap">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="16" height="16">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome do anúncio ou produto..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="ads-search-input"
          />
        </div>
        <select
          className="ads-placement-filter"
          value={filterPlacement}
          onChange={e => setFilterPlacement(e.target.value)}
        >
          <option value="all">Todas as posições</option>
          {PLACEMENTS.map(p => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
        <div className="ads-view-toggle" aria-label="Modo de visualização">
          <button type="button" className={viewMode==='grid'?'active':''} onClick={()=>setViewMode('grid')} title="Ver como cards">▦</button>
          <button type="button" className={viewMode==='list'?'active':''} onClick={()=>setViewMode('list')} title="Ver como lista">☷</button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="ads-loading">
          <div className="ads-loading-spinner" />
          <span>Carregando anúncios...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="ads-empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" width="56" height="56">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <h3>{search ? 'Nenhum anúncio encontrado' : 'Nenhum anúncio cadastrado ainda'}</h3>
          <p>Clique em "Novo ADS" para adicionar vitrines no meio da tela ou banners do sistema.</p>
          {!search && (
            <button className="ads-new-btn" onClick={() => navigate('/hub/ads/add')}>
              Criar primeiro ADS
            </button>
          )}
        </div>
      ) : (
        <div className={`ads-grid ${viewMode==='list'?'list-view':''}`}>
          {filtered.map(ad => {
            const isCarousel = ad.type === 'carousel'
            const previewImg = isCarousel && ad.items?.[0]?.image_url ? ad.items[0].image_url : ad.image_url
            const itemsCount = isCarousel ? (ad.items?.length || 0) : 1

            return (
              <div key={ad.id} className={`ads-card ${!ad.is_active ? 'disabled' : ''}`}>
                <div className="ads-card-preview" onClick={() => { setPreviewAd(ad); setPreviewIndex(0); }}>
                  {previewImg ? (
                    <img src={previewImg} alt={ad.name} />
                  ) : (
                    <div className="ads-no-img">Sem imagem cadastrada</div>
                  )}

                  {/* Badges de Tipo e Posição */}
                  <div className="ads-card-overlay-top">
                    <span className={`ads-type-pill ${isCarousel ? 'carousel' : 'single'}`}>
                      {isCarousel ? `Carrossel (${itemsCount})` : 'Imagem única'}
                    </span>
                    {ad.placement === 'middle_screen' && (
                      <span className="ads-pos-pill middle">Meio da Tela</span>
                    )}
                  </div>

                  {!ad.is_active && (
                    <div className="ads-card-blocked-overlay">
                      <span>INATIVO / BLOQUEADO</span>
                    </div>
                  )}

                  <div className="ads-preview-hint">Clique para pré-visualizar</div>
                </div>

                <div className="ads-card-body">
                  <div className="ads-card-top">
                    <h3 className="ads-card-name" title={ad.name}>{ad.name}</h3>
                    <label className="ads-toggle" title={ad.is_active ? 'Desativar anúncio' : 'Ativar anúncio'}>
                      <input
                        type="checkbox"
                        checked={ad.is_active}
                        onChange={() => handleToggleActive(ad)}
                      />
                      <span className="ads-toggle-slider"></span>
                    </label>
                  </div>

                  <div className="ads-card-meta">
                    <span className={`ads-badge ${ad.is_active ? 'active' : 'blocked'}`}>
                      {ad.is_active ? '● Ativo no Site' : '○ Inativo'}
                    </span>
                    <span className="ads-placement-tag">
                      {getPlacementLabel(ad.placement)}
                    </span>
                  </div>
                  {placementCounts[ad.placement] > 1 && ad.placement !== 'middle_screen' && ad.placement !== 'home-middle' && (
                    <div className="ads-placement-warning">Atenção: existem {placementCounts[ad.placement]} anúncios nesta posição. Para alternar imagens, reúna tudo em um único carrossel.</div>
                  )}

                  {isCarousel ? (
                    <div className="ads-carousel-info-tag">
                      {ad.interval_seconds || 5}s por imagem • {itemsCount} produtos/slides
                    </div>
                  ) : (
                    <div className="ads-card-link">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="12" height="12">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                      </svg>
                      <span className="ads-link-text">{ad.link || '#'}</span>
                      <span className="ads-target-pill">{ad.target === '_blank' ? 'Nova aba' : 'Mesma aba'}</span>
                    </div>
                  )}

                  {(ad.start_date || ad.end_date) && (
                    <div className="ads-schedule-tag">
                      {ad.start_date ? new Date(ad.start_date).toLocaleDateString('pt-BR') : 'Agora'} até {ad.end_date ? new Date(ad.end_date).toLocaleDateString('pt-BR') : 'Permanente'}
                    </div>
                  )}
                </div>

                <div className="ads-card-actions">
                  <button className="ads-action-btn preview" onClick={() => { setPreviewAd(ad); setPreviewIndex(0); }} title="Pré-visualizar">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Ver
                  </button>
                  <button className="ads-action-btn edit" onClick={() => navigate(`/hub/ads/edit/${ad.id}`)} title="Editar anúncio">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                    Editar
                  </button>
                  <button className="ads-action-btn duplicate" onClick={() => handleDuplicate(ad)} title="Duplicar anúncio">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    Duplicar
                  </button>
                  <button className="ads-action-btn delete" onClick={() => handleDelete(ad.id)} title="Excluir">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── MODAL Criar/Editar Anúncio ── */}
      {showModal && (
        <div className="ads-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ads-modal ads-modal-lg" onClick={e => e.stopPropagation()}>
            <div className="ads-modal-header">
              <div>
                <h3>{editingAd ? 'Editar Anúncio' : 'Novo Anúncio (ADS)'}</h3>
                <p className="ads-modal-header-desc">Defina a posição, modo (imagem única ou carrossel), produtos e regras de exibição.</p>
              </div>
              <button className="ads-modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="ads-modal-body">
              {/* Nome */}
              <div className="ads-form-field">
                <label>Nome interno do anúncio *</label>
                <input
                  type="text"
                  className="ads-form-input"
                  placeholder="Ex: Vitrine Meio da Tela - Lançamentos ou Banner Produto"
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                />
              </div>

              {/* Posição e Modo lado a lado */}
              <div className="ads-form-row-2">
                <div className="ads-form-field">
                  <label>Posição onde será exibido *</label>
                  <select
                    className="ads-form-select"
                    value={formPlacement}
                    onChange={e => setFormPlacement(e.target.value)}
                  >
                    {PLACEMENTS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                  <small>
                    {PLACEMENTS.find(p => p.value === formPlacement)?.desc || 'Escolha onde o anúncio aparecerá no sistema'}
                  </small>
                </div>

                <div className="ads-form-field">
                  <label>Tipo de Anúncio / Formato *</label>
                  <div className="ads-type-selector">
                    <button
                      type="button"
                      className={`ads-type-btn ${formType === 'single' ? 'active' : ''}`}
                      onClick={() => setFormType('single')}
                    >
                      <span>Imagem Única</span>
                      <small>1 imagem estática</small>
                    </button>
                    <button
                      type="button"
                      className={`ads-type-btn ${formType === 'carousel' ? 'active' : ''}`}
                      onClick={() => setFormType('carousel')}
                    >
                      <span>Carrossel</span>
                      <small>Vários produtos/fotos</small>
                    </button>
                  </div>
                </div>
              </div>

              {/* ── MODO 1: IMAGEM ÚNICA ── */}
              {formType === 'single' && (
                <div className="ads-single-config-card">
                  <h4 className="ads-section-title">Configuração da Imagem</h4>

                  <div className="ads-form-field">
                    <label>Imagem do anúncio *</label>
                    <div
                      className="ads-image-upload"
                      onClick={() => imgInputRef.current?.click()}
                      onDragOver={e => e.preventDefault()}
                      onDrop={e => {
                        e.preventDefault()
                        const file = e.dataTransfer.files[0]
                        if (file?.type.startsWith('image/')) handleImageUpload(file, false)
                      }}
                    >
                      {formImageUrl ? (
                        <div className="ads-image-preview">
                          <img src={formImageUrl} alt="Preview" />
                          <div className="ads-image-overlay">
                            <span>Trocar imagem</span>
                          </div>
                        </div>
                      ) : (
                        <div className="ads-image-placeholder">
                          {formUploading ? (
                            <span>Enviando mídia para o storage...</span>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" width="32" height="32">
                                <rect x="3" y="3" width="18" height="18" rx="2" />
                                <circle cx="8.5" cy="8.5" r="1.5" />
                                <polyline points="21 15 16 10 5 21" />
                              </svg>
                              <span>Clique ou arraste uma imagem (PNG, JPG, WebP)</span>
                              <small>Dica: use PNG transparente para integração perfeita sem bordas</small>
                            </>
                          )}
                        </div>
                      )}
                      <input
                        ref={imgInputRef}
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const f = e.target.files?.[0]
                          if (f) handleImageUpload(f, false)
                        }}
                      />
                    </div>
                  </div>

                  <div className="ads-form-row-2">
                    <div className="ads-form-field">
                      <label>Link de destino *</label>
                      <input
                        type="text"
                        className="ads-form-input"
                        placeholder="Ex: /produtos/sandisk-extreme ou https://..."
                        value={formLink}
                        onChange={e => setFormLink(e.target.value)}
                      />
                    </div>
                    <div className="ads-form-field">
                      <label>Destino do clique</label>
                      <select
                        className="ads-form-select"
                        value={formTarget}
                        onChange={e => setFormTarget(e.target.value as '_self' | '_blank')}
                      >
                        <option value="_self">Abrir na mesma página (_self)</option>
                        <option value="_blank">Abrir em nova aba (_blank)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ── MODO 2: CARROSSEL DE IMAGENS / PRODUTOS ── */}
              {formType === 'carousel' && (
                <div className="ads-carousel-config-card">
                  <div className="ads-carousel-header">
                    <div>
                      <h4 className="ads-section-title">Imagens & Produtos do Carrossel ({formItems.length})</h4>
                      <p className="ads-section-subtitle">Cada item pode ter sua própria imagem, título e link individual.</p>
                    </div>
                    <div className="ads-carousel-timing">
                      <label>Tempo por imagem:</label>
                      <select
                        className="ads-form-select-sm"
                        value={formInterval}
                        onChange={e => setFormInterval(Number(e.target.value))}
                      >
                        <option value={3}>3 segundos</option>
                        <option value={5}>5 segundos (padrão)</option>
                        <option value={8}>8 segundos</option>
                        <option value={10}>10 segundos</option>
                        <option value={15}>15 segundos</option>
                      </select>
                    </div>
                  </div>

                  <div className="ads-carousel-items-list">
                    {formItems.map((item, idx) => (
                      <div key={item.id || idx} className="ads-carousel-item-row">
                        <div className="ads-item-order-badge">#{idx + 1}</div>

                        {/* Thumbnail / Upload */}
                        <div className="ads-item-thumb-box">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.title} className="ads-item-thumb-img" />
                          ) : (
                            <div className="ads-item-thumb-empty">Sem foto</div>
                          )}
                          <label className="ads-item-upload-btn">
                            {uploadingItemIndex === idx ? 'Enviando...' : 'Foto'}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => {
                                const f = e.target.files?.[0]
                                if (f) handleImageUpload(f, true, idx)
                              }}
                            />
                          </label>
                        </div>

                        {/* Campos */}
                        <div className="ads-item-fields">
                          <div className="ads-form-row-2">
                            <input
                              type="text"
                              className="ads-form-input ads-form-input-sm"
                              placeholder="Nome/Título (ex: SSD Portátil Extreme)"
                              value={item.title}
                              onChange={e => handleUpdateCarouselItem(idx, 'title', e.target.value)}
                            />
                            <select
                              className="ads-form-select ads-form-select-sm"
                              value={item.target}
                              onChange={e => handleUpdateCarouselItem(idx, 'target', e.target.value)}
                            >
                              <option value="_self">Mesma aba</option>
                              <option value="_blank">Nova aba</option>
                            </select>
                          </div>
                          <input
                            type="text"
                            className="ads-form-input ads-form-input-sm"
                            placeholder="Link de destino (ex: /produtos/ssd-sandisk ou URL externa)"
                            value={item.link}
                            onChange={e => handleUpdateCarouselItem(idx, 'link', e.target.value)}
                          />
                        </div>

                        {/* Remover */}
                        <button
                          type="button"
                          className="ads-item-remove-btn"
                          onClick={() => handleRemoveCarouselItem(idx)}
                          title="Remover produto do carrossel"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="ads-add-item-btn"
                    onClick={handleAddCarouselItem}
                  >
                    + Adicionar outro produto/imagem ao carrossel
                  </button>
                </div>
              )}

              {/* Agendamento de Campanha (opcional) */}
              <div className="ads-schedule-box">
                <h4 className="ads-section-title">Período de Exibição (Opcional)</h4>
                <div className="ads-form-row-2">
                  <div className="ads-form-field">
                    <label>Data & Hora de Início</label>
                    <input
                      type="datetime-local"
                      className="ads-form-input"
                      value={formStartDate}
                      onChange={e => setFormStartDate(e.target.value)}
                    />
                  </div>
                  <div className="ads-form-field">
                    <label>Data & Hora de Término</label>
                    <input
                      type="datetime-local"
                      className="ads-form-input"
                      value={formEndDate}
                      onChange={e => setFormEndDate(e.target.value)}
                    />
                  </div>
                </div>
                <small>Se não preenchido, o anúncio será exibido permanentemente enquanto estiver com status Ativo.</small>
              </div>
            </div>

            <div className="ads-modal-footer">
              <button className="ads-modal-cancel" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                className="ads-modal-save"
                onClick={handleSave}
                disabled={formSaving || !formName}
              >
                {formSaving ? 'Salvando...' : editingAd ? 'Salvar alterações' : 'Criar anúncio'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DE PRÉ-VISUALIZAÇÃO EM TEMPO REAL ── */}
      {previewAd && (
        <div className="ads-modal-overlay" onClick={() => setPreviewAd(null)}>
          <div className="ads-modal ads-preview-modal" onClick={e => e.stopPropagation()}>
            <div className="ads-modal-header">
              <div>
                <h3>Pré-visualização: {previewAd.name}</h3>
                <span className="ads-preview-sub">
                  Posição: <strong>{getPlacementLabel(previewAd.placement)}</strong> • {previewAd.type === 'carousel' ? `Carrossel (${previewAd.items?.length || 0} itens)` : 'Imagem Única'}
                </span>
              </div>
              <button className="ads-modal-close" onClick={() => setPreviewAd(null)}>✕</button>
            </div>

            <div className="ads-preview-body">
              {previewAd.type === 'carousel' && previewAd.items && previewAd.items.length > 0 ? (
                <div className="ads-live-carousel-view">
                  <div className="ads-live-slide">
                    <img
                      src={previewAd.items[previewIndex]?.image_url || previewAd.image_url}
                      alt={previewAd.items[previewIndex]?.title || previewAd.name}
                      className="ads-live-img"
                    />
                    <div className="ads-live-caption">
                      <h4>{previewAd.items[previewIndex]?.title || previewAd.name}</h4>
                      <a
                        href={previewAd.items[previewIndex]?.link || '#'}
                        target={previewAd.items[previewIndex]?.target || '_self'}
                        className="ads-live-cta"
                      >
                        Acessar Link ›
                      </a>
                    </div>
                  </div>

                  {/* Indicadores de slide */}
                  <div className="ads-live-dots">
                    {previewAd.items.map((_, i) => (
                      <span
                        key={i}
                        className={`ads-live-dot ${i === previewIndex ? 'active' : ''}`}
                        onClick={() => setPreviewIndex(i)}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="ads-live-single-view">
                  <img src={previewAd.image_url} alt={previewAd.name} className="ads-live-img" />
                  <div className="ads-live-caption">
                    <a href={previewAd.link || '#'} target={previewAd.target || '_self'} className="ads-live-cta">
                      Ver Anúncio ›
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
