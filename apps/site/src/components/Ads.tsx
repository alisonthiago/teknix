import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getActiveAdsByPosition, recordAdEvent, type Ad, type AdCarouselItem } from '../services/ads'
import './Ads.css'

interface AdsProps {
  position: string
  className?: string
  style?: React.CSSProperties
  fallback?: React.ReactNode
}

export function Ads({ position = 'middle_screen', className = '', style, fallback }: AdsProps) {
  const [ads, setAds] = useState<Ad[]>([])
  const [activeAdIndex] = useState(0)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>(() => window.innerWidth < 640 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop')
  const query = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null
  const isEditorPreview = query?.get('widgetPreview') === '1' || query?.get('ads-edit') === '1' || query?.get('editor') === '1'

  const editorPlaceholder = () => (
    <section
      className={`teknix-ads-editor-slot teknix-ads-editor-slot--${position} ${className}`}
      style={style}
    >
      {position === 'middle_screen' ? (
        <div className="teknix-ads-editor-weekly">
          {[1, 2, 3].map(number => <div key={number}><strong>SEÇÃO {number}</strong><span>PROMOÇÃO DA SEMANA</span></div>)}
        </div>
      ) : (
        <span className="teknix-ads-editor-slot__label">{position === 'home-promo-strip' ? 'FAIXA PROMOCIONAL — 2080 × 185 PX' : position === 'promo-bar' ? 'DESCONTO OFF' : position === 'home-hero' ? 'BANNERS E PROMOÇÕES' : position === 'home-footer' || position === 'global-footer' ? 'RODAPÉ — ANÚNCIOS' : 'SEÇÃO — ESPAÇO RESERVADO'}</span>
      )}
    </section>
  )

  useEffect(() => {
    let mounted = true
    getActiveAdsByPosition(position)
      .then(data => {
        if (mounted) {
          setAds(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (mounted) setLoading(false)
      })
    return () => { mounted = false }
  }, [position])

  useEffect(() => {
    const sync = () => setDevice(window.innerWidth < 640 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop')
    window.addEventListener('resize', sync)
    return () => window.removeEventListener('resize', sync)
  }, [])

  const currentAd = ads[activeAdIndex]
  const currentAsset: AdCarouselItem | undefined = currentAd?.type === 'carousel' ? currentAd.items?.[activeSlideIndex] : currentAd?.items?.[0]
  const isVisibleOnDevice = currentAsset ? currentAsset[`show_${device}`] !== false : true
  const responsiveImage = currentAsset
    ? (device === 'mobile' ? currentAsset.mobile_image_url : device === 'tablet' ? currentAsset.tablet_image_url : currentAsset.image_url) || currentAsset.image_url || currentAd?.image_url
    : currentAd?.image_url

  useEffect(() => {
    if (!currentAd || isEditorPreview || !isVisibleOnDevice) return
    void recordAdEvent(currentAd.id, 'impression', position)
  }, [currentAd?.id, activeSlideIndex, device, isEditorPreview, isVisibleOnDevice, position])

  const trackClick = () => {
    if (currentAd) void recordAdEvent(currentAd.id, 'click', position)
  }
  const renderMedia = (url: string, alt: string, className = 'teknix-ads-clean-img') =>
    /\.(mp4|webm|mov)(\?|$)/i.test(url)
      ? <video src={url} className={className} muted autoPlay loop playsInline />
      : <img src={url} alt={alt} className={className} />

  // Rotação automática para Carrossel
  useEffect(() => {
    if (!currentAd || currentAd.type !== 'carousel' || !currentAd.items || currentAd.items.length <= 1) return

    const intervalSec = currentAd.interval_seconds || 5
    const timer = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % currentAd.items.length)
    }, intervalSec * 1000)

    return () => clearInterval(timer)
  }, [currentAd, currentAd?.items?.length, currentAd?.interval_seconds])

  if (loading) {
    return isEditorPreview ? editorPlaceholder() : null
  }

  // No modo de edição mostramos somente a área física reservada.
  // O conteúdo real do anúncio continua disponível apenas na visualização normal.
  if (isEditorPreview) {
    return editorPlaceholder()
  }

  if (currentAd && !isVisibleOnDevice) return null

  if (position === 'promo-bar' && currentAd && !responsiveImage) {
    const promo = currentAd.items?.[0] as (AdCarouselItem & { promo_badge?: string; promo_text?: string; background_color?: string; text_color?: string }) | undefined
    return <div className={`teknix-ads-promo-width ${currentAd.width_mode === 'container' ? 'is-container' : 'is-full'}`}><a className="teknix-ads-promo-text" href={promo?.link || currentAd.link || '#'} target={promo?.target || currentAd.target || '_self'} rel="noreferrer" onClick={trackClick} style={{ backgroundColor: promo?.background_color || '#b5f500', color: promo?.text_color || '#111' }}><strong>{promo?.promo_badge || '10% OFF'}</strong><span>{promo?.promo_text || currentAd.name}</span></a></div>
  }

  // ── HOME: EXPLORE POR PROFISSÃO (GERENCIÁVEL VIA HUB / ADS) ──
  if (position === 'profession-showcase') {
    const rawItems = currentAd?.items && currentAd.items.length > 0
      ? currentAd.items
      : null

    const defaultProfissoes = [
      {
        title: 'Mecânica',
        desc: 'Ferramentas e equipamentos para quem precisa de precisão, resistência e confiança na rotina da oficina.',
        img: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80',
        link: '/categoria/equipamentos-automotivos'
      },
      {
        title: 'Borracharia',
        desc: 'Equipamentos e ferramentas para agilizar o atendimento e manter o serviço sempre em movimento.',
        img: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=800&auto=format&fit=crop&q=80',
        link: '/categoria/equipamentos-automotivos'
      },
      {
        title: 'Construção Civil',
        desc: 'Soluções para obras, reformas e instalações, com produtos que acompanham cada etapa do trabalho.',
        img: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
        link: '/categoria/construcao-e-obra'
      },
      {
        title: 'Elétrica',
        desc: 'Soluções para instalações, manutenções e reparos elétricos com praticidade e máxima segurança.',
        img: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80',
        link: '/categoria/ferramentas-eletricas'
      }
    ]

    const cards = rawItems && rawItems.length > 0
      ? rawItems.map((item, idx) => ({
          title: item.title || `Profissão ${idx + 1}`,
          desc: (item as any).promo_text || item.title || '',
          img: (device === 'mobile' ? item.mobile_image_url : device === 'tablet' ? item.tablet_image_url : item.image_url) || item.image_url || defaultProfissoes[idx % defaultProfissoes.length].img,
          link: item.link || defaultProfissoes[idx % defaultProfissoes.length].link
        }))
      : defaultProfissoes

    return (
      <div className="ui container fluid profissao">
        <div className="ui container">
          <div className="profissao-container">
            <h2 className="title">{currentAd?.name && !currentAd.name.startsWith('ad-') ? currentAd.name : 'Explore por profissão'}</h2>
            <div className="profissao-grid">
              {cards.map((p, idx) => (
                <Link
                  to={p.link}
                  key={idx}
                  className="profissao-card"
                  onClick={() => currentAd && void recordAdEvent(currentAd.id, 'click', position)}
                >
                  <div className="profissao-bg-img" style={{ backgroundImage: `url(${p.img})` }}></div>
                  <div className="profissao-overlay"></div>
                  <div className="profissao-content">
                    <h3>{p.title}</h3>
                    <p>{p.desc}</p>
                    <span className="profissao-cta">Ver produtos ›</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

function MiddleScreenSectionColumn({
  section,
  device,
  adId,
  position
}: {
  section: any
  device: 'desktop' | 'tablet' | 'mobile'
  adId: string
  position: string
}) {
  const slides = section.slides || section.items || []
  const isCarousel = section.type === 'carousel' && slides.length > 1
  const [slideIdx, setSlideIdx] = useState(0)

  useEffect(() => {
    if (!isCarousel) return
    const sec = Math.max(2, section.interval_seconds || section.interval || 5)
    const timer = setInterval(() => {
      setSlideIdx(prev => (prev + 1) % slides.length)
    }, sec * 1000)
    return () => clearInterval(timer)
  }, [isCarousel, slides.length, section.interval_seconds, section.interval])

  const currentSlide = slides[slideIdx] || slides[0]
  if (!currentSlide) return null

  const visible = currentSlide[`show_${device}`] !== false
  if (!visible) return null

  const image =
    (device === 'mobile'
      ? currentSlide.mobile_image_url
      : device === 'tablet'
      ? currentSlide.tablet_image_url
      : currentSlide.image_url) ||
    currentSlide.image_url ||
    ''

  return (
    <a
      href={currentSlide.link || '#'}
      target={currentSlide.target || '_self'}
      rel="noreferrer"
      onClick={() => void recordAdEvent(adId, 'click', position)}
      className="teknix-ads-middle-col-link"
    >
      {renderMedia(image, currentSlide.title || section.title || '', 'teknix-ads-middle-media')}
    </a>
  )
}

  if (position === 'middle_screen') {
    if (currentAd && Array.isArray((currentAd as any).sections) && (currentAd as any).sections.length > 0) {
      const sections = (currentAd as any).sections
      const displaySections = [...sections]
      while (displaySections.length < 3 && sections.length > 0) {
        displaySections.push(sections[displaySections.length % sections.length])
      }

      return (
        <section className="teknix-ads-section teknix-ads-weekly-wrap">
          <div className="ui container">
            <div className="teknix-ads-weekly-grid">
              {displaySections.slice(0, 3).map((sec: any, idx: number) => (
                <MiddleScreenSectionColumn
                  key={sec.id || idx}
                  section={sec}
                  device={device}
                  adId={currentAd.id}
                  position={position}
                />
              ))}
            </div>
          </div>
        </section>
      )
    }

    if (ads.length > 0) {
      // Garante sempre 3 itens para preencher as 3 colunas perfeitamente alinhadas
      const displayAds: Ad[] = []
      for (let i = 0; i < 3; i++) {
        displayAds.push(ads[i % ads.length])
      }

      return (
        <section className="teknix-ads-section teknix-ads-weekly-wrap">
          <div className="ui container">
            <div className="teknix-ads-weekly-grid">
              {displayAds.map((ad, idx) => {
                const asset = ad.items?.[0]
                const visible = asset ? asset[`show_${device}`] !== false : true
                const image = asset
                  ? (device === 'mobile'
                      ? asset.mobile_image_url
                      : device === 'tablet'
                      ? asset.tablet_image_url
                      : asset.image_url) ||
                    asset.image_url ||
                    ad.image_url
                  : ad.image_url
                if (!visible) return null
                return (
                  <a
                    key={`${ad.id}-${idx}`}
                    href={asset?.link || ad.link || '#'}
                    target={asset?.target || ad.target || '_self'}
                    rel="noreferrer"
                    onClick={() => void recordAdEvent(ad.id, 'click', position)}
                  >
                    {renderMedia(image, ad.name, 'teknix-ads-middle-media')}
                  </a>
                )
              })}
            </div>
          </div>
        </section>
      )
    }
  }

  // Se houver anúncios configurados no /hub/ads para esta posição
  if (currentAd) {
    if (currentAd.type === 'carousel' && currentAd.items && currentAd.items.length > 0) {
      const itemsWithMedia = currentAd.items.filter(item => {
        const itemImg = (device === 'mobile' ? item.mobile_image_url : device === 'tablet' ? item.tablet_image_url : item.image_url) || item.image_url
        return Boolean(itemImg)
      })

      if (itemsWithMedia.length === 0 && !responsiveImage && !currentAd.image_url) {
        return isEditorPreview ? editorPlaceholder() : null
      }

      const activeItem = itemsWithMedia[activeSlideIndex] || itemsWithMedia[0] || currentAd.items[0]
      const mediaToRender = (device === 'mobile' ? activeItem.mobile_image_url : device === 'tablet' ? activeItem.tablet_image_url : activeItem.image_url) || activeItem.image_url || currentAd.image_url

      if (!mediaToRender) {
        return isEditorPreview ? editorPlaceholder() : null
      }

      return (
        <section className={`teknix-ads-section teknix-ads-carousel-wrap teknix-ads-position-${position} ${position === 'promo-bar' && currentAd.width_mode === 'container' ? 'ads-width-container' : ''} ${isEditorPreview ? 'teknix-ads-editor-active-highlight' : ''} ${className}`} style={style}>
          {isEditorPreview && (
            <div className="teknix-ads-editor-indicator-badge">
              Área de ADS: {position}
            </div>
          )}
          <div className="ui container">
            <div className={`teknix-ads-carousel-box ${currentAd.arrows_position === 'outside' ? 'arrows-outside' : ''}`}>
              <a
                href={activeItem.link || currentAd.link || '#'}
                target={activeItem.target || currentAd.target || '_self'}
                rel="noreferrer"
                className="teknix-ads-slide-link"
                onClick={trackClick}
              >
                <div className="teknix-ads-image-container">
                  {renderMedia(mediaToRender, activeItem.title || currentAd.name)}
                </div>
                {activeItem.title && (
                  <div className="teknix-ads-caption">
                    <span className="teknix-ads-caption-title">{activeItem.title}</span>
                  </div>
                )}
              </a>

              {/* Controles de Navegação */}
              {itemsWithMedia.length > 1 && (
                <>
                  {currentAd.show_arrows !== false && <button
                    className="teknix-ads-nav-btn prev"
                    onClick={() => setActiveSlideIndex(prev => (prev - 1 + itemsWithMedia.length) % itemsWithMedia.length)}
                    aria-label="Slide anterior"
                  >
                    ‹
                  </button>}
                  {currentAd.show_arrows !== false && <button
                    className="teknix-ads-nav-btn next"
                    onClick={() => setActiveSlideIndex(prev => (prev + 1) % itemsWithMedia.length)}
                    aria-label="Próximo slide"
                  >
                    ›
                  </button>}
                  {currentAd.show_dots !== false && <div className="teknix-ads-dots">
                    {itemsWithMedia.map((_, idx) => (
                      <button
                        key={idx}
                        className={`teknix-ads-dot ${idx === activeSlideIndex ? 'active' : ''}`}
                        onClick={() => setActiveSlideIndex(idx)}
                        aria-label={`Ir para slide ${idx + 1}`}
                      />
                    ))}
                  </div>}
                </>
              )}
            </div>
          </div>
        </section>
      )
    }

    // Modo Imagem Única
    const singleMedia = responsiveImage || currentAd.image_url
    if (!singleMedia) {
      return isEditorPreview ? editorPlaceholder() : null
    }

    return (
      <section className={`teknix-ads-section teknix-ads-single-wrap teknix-ads-position-${position} ${position === 'promo-bar' && currentAd.width_mode === 'container' ? 'ads-width-container' : ''} ${isEditorPreview ? 'teknix-ads-editor-active-highlight' : ''} ${className}`} style={style}>
        {isEditorPreview && (
          <div className="teknix-ads-editor-indicator-badge">
            Área de ADS: {position}
          </div>
        )}
        <div className="ui container">
          <a
            href={currentAd.link || '#'}
            target={currentAd.target || '_self'}
            rel="noreferrer"
            className="teknix-ads-single-link"
            onClick={trackClick}
          >
            <div className="teknix-ads-image-container">
              {renderMedia(singleMedia, currentAd.name)}
            </div>
          </a>
        </div>
      </section>
    )
  }

  // Fallback ou Tray de Comparação de Produtos no Meio da Tela
  if (fallback) {
    return <>{fallback}</>
  }

  return isEditorPreview ? editorPlaceholder() : null
}
