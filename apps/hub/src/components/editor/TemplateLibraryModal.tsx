import React, { useState } from 'react'
import { X, Search, Heart, Sparkles, Layers, Eye, Download, Check, Zap, Battery, Truck, CreditCard, ShieldCheck } from 'lucide-react'
import { PRESETS, PresetDefinition } from '../../presets'
import { PAGE_TEMPLATES, PageTemplateDefinition } from '../../presets/templates'
import './TemplateLibraryModal.css'

interface TemplateLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onInsertPreset: (preset: PresetDefinition) => void
  onApplyTemplate: (template: PageTemplateDefinition) => void
}

const BLOCK_CATEGORIES = [
  { key: 'all', label: 'Todas as Categorias' },
  { key: 'header', label: 'Headers & Menus (Apple)' },
  { key: 'footer', label: 'Rodapés & Footers' },
  { key: 'hero', label: 'Hero / Destaques' },
  { key: 'promos', label: 'Promos 2x2 (Apple)' },
  { key: 'columns', label: 'Colunas & Recursos' },
  { key: 'media', label: 'Mídia & Carrossel' },
  { key: 'ecommerce', label: 'E-commerce / Loja' },
  { key: 'cta', label: 'Avisos & CTAs' },
  { key: 'faq', label: 'FAQ / Suporte' },
]

export default function TemplateLibraryModal({
  isOpen,
  onClose,
  onInsertPreset,
  onApplyTemplate,
}: TemplateLibraryModalProps) {
  const [mainTab, setMainTab] = useState<'blocks' | 'pages' | 'my_templates'>('blocks')
  const [filterTab, setFilterTab] = useState<'new' | 'trend' | 'popular' | 'favorites'>('new')
  const [blockCategory, setBlockCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('teknix_library_favorites') || '[]')
    } catch {
      return []
    }
  })
  const [previewItem, setPreviewItem] = useState<{ type: 'preset' | 'template'; item: any } | null>(null)
  const [insertedId, setInsertedId] = useState<string | null>(null)

  if (!isOpen) return null

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const next = favorites.includes(id) ? favorites.filter(f => f !== id) : [...favorites, id]
    setFavorites(next)
    try {
      localStorage.setItem('teknix_library_favorites', JSON.stringify(next))
    } catch {}
  }

  const handleInsertBlock = (preset: PresetDefinition) => {
    setInsertedId(preset.id)
    onInsertPreset(preset)
    setTimeout(() => {
      onClose()
      setInsertedId(null)
    }, 400)
  }

  const handleInsertPage = (template: PageTemplateDefinition) => {
    setInsertedId(template.id)
    onApplyTemplate(template)
    setTimeout(() => {
      onClose()
      setInsertedId(null)
    }, 400)
  }

  // Filtered Blocks
  const filteredBlocks = PRESETS.filter(p => {
    if (blockCategory !== 'all' && p.category !== blockCategory) return false
    if (filterTab === 'favorites' && !favorites.includes(p.id)) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return p.name.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q))
    }
    return true
  })

  // Filtered Templates
  const filteredTemplates = PAGE_TEMPLATES.filter(t => {
    if (filterTab === 'favorites' && !favorites.includes(t.id)) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return t.name.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
    }
    return true
  })

  return (
    <div className="elementor-library-backdrop" onClick={onClose}>
      <div className="elementor-library-modal" onClick={e => e.stopPropagation()}>
        {/* ── HEADER ── */}
        <div className="elementor-library-header">
          <div className="library-header-left">
            <div className="library-brand-badge">
              <span className="brand-letter">E</span>
            </div>
            <h2 className="library-title">BIBLIOTECA</h2>
          </div>

          <div className="library-nav-tabs">
            <button
              className={`library-nav-tab ${mainTab === 'blocks' ? 'active' : ''}`}
              onClick={() => setMainTab('blocks')}
            >
              Blocos
            </button>
            <button
              className={`library-nav-tab ${mainTab === 'pages' ? 'active' : ''}`}
              onClick={() => setMainTab('pages')}
            >
              Páginas
            </button>
            <button
              className={`library-nav-tab ${mainTab === 'my_templates' ? 'active' : ''}`}
              onClick={() => setMainTab('my_templates')}
            >
              Meus Modelos
            </button>
          </div>

          <div className="library-header-right">
            <button className="library-close-btn" onClick={onClose} title="Fechar Biblioteca">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ── SUBHEADER / FILTER BAR ── */}
        <div className="elementor-library-subbar">
          <div className="library-filter-pills">
            <button
              className={`filter-pill ${filterTab === 'new' ? 'active' : ''}`}
              onClick={() => setFilterTab('new')}
            >
              NOVO
            </button>
            <button
              className={`filter-pill ${filterTab === 'trend' ? 'active' : ''}`}
              onClick={() => setFilterTab('trend')}
            >
              TENDÊNCIA
            </button>
            <button
              className={`filter-pill ${filterTab === 'popular' ? 'active' : ''}`}
              onClick={() => setFilterTab('popular')}
            >
              POPULAR
            </button>
            <button
              className={`filter-pill ${filterTab === 'favorites' ? 'active' : ''}`}
              onClick={() => setFilterTab('favorites')}
            >
              <Heart size={13} style={{ fill: filterTab === 'favorites' ? '#ff3b30' : 'none' }} /> MEUS FAVORITOS
            </button>
          </div>

          {mainTab === 'blocks' && (
            <div className="library-category-select">
              <select
                value={blockCategory}
                onChange={e => setBlockCategory(e.target.value)}
                className="library-cat-dropdown"
              >
                {BLOCK_CATEGORIES.map(c => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="library-search-box">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="PESQUISAR..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* ── CONTENT GRID ── */}
        <div className="elementor-library-body">
          {mainTab === 'blocks' && (
            <div className="library-cards-grid">
              {filteredBlocks.length === 0 ? (
                <div className="library-empty-state">
                  <Layers size={48} />
                  <p>Nenhum bloco encontrado nesta categoria ou pesquisa.</p>
                </div>
              ) : (
                filteredBlocks.map(preset => {
                  const isFav = favorites.includes(preset.id)
                  const isJustInserted = insertedId === preset.id

                  return (
                    <div key={preset.id} className="library-block-card">
                      {/* Real Visual Live Thumbnail Preview */}
                      <div className="block-card-preview">
                        <div className="block-preview-canvas">
                          <LivePresetThumbnail preset={preset} />
                        </div>

                        {/* Hover Overlay */}
                        <div className="block-card-overlay">
                          <button
                            className="overlay-insert-btn"
                            onClick={() => handleInsertBlock(preset)}
                          >
                            {isJustInserted ? <Check size={16} /> : <Download size={16} />}
                            {isJustInserted ? 'Inserido!' : 'Inserir'}
                          </button>
                          <button
                            className="overlay-preview-btn"
                            onClick={() => setPreviewItem({ type: 'preset', item: preset })}
                            title="Visualizar Detalhes"
                          >
                            <Eye size={15} />
                          </button>
                        </div>

                        <button
                          className={`card-fav-btn ${isFav ? 'is-fav' : ''}`}
                          onClick={(e) => toggleFavorite(preset.id, e)}
                          title="Favoritar"
                        >
                          <Heart size={15} style={{ fill: isFav ? '#ff3b30' : 'none' }} />
                        </button>
                      </div>

                      {/* Card Info Footer */}
                      <div className="block-card-footer">
                        <div className="block-card-title-row">
                          <span className="block-card-name" title={preset.name}>{preset.name}</span>
                          <span className="block-card-badge">{preset.category.toUpperCase()}</span>
                        </div>
                        {preset.description && (
                          <p className="block-card-desc">{preset.description}</p>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {mainTab === 'pages' && (
            <div className="library-pages-grid">
              {filteredTemplates.length === 0 ? (
                <div className="library-empty-state">
                  <Layers size={48} />
                  <p>Nenhuma página template encontrada.</p>
                </div>
              ) : (
                filteredTemplates.map(template => {
                  const isFav = favorites.includes(template.id)
                  const isJustInserted = insertedId === template.id

                  return (
                    <div key={template.id} className="library-page-card">
                      <div className="page-card-preview">
                        <div className="page-preview-mockup">
                          <LiveTemplateThumbnail template={template} />
                        </div>

                        <div className="page-card-overlay">
                          <button
                            className="overlay-insert-btn"
                            onClick={() => handleInsertPage(template)}
                          >
                            {isJustInserted ? <Check size={16} /> : <Sparkles size={16} />}
                            {isJustInserted ? 'Aplicado!' : 'Inserir Página'}
                          </button>
                          <button
                            className="overlay-preview-btn"
                            onClick={() => setPreviewItem({ type: 'template', item: template })}
                            title="Visualizar"
                          >
                            <Eye size={15} />
                          </button>
                        </div>

                        <button
                          className={`card-fav-btn ${isFav ? 'is-fav' : ''}`}
                          onClick={(e) => toggleFavorite(template.id, e)}
                          title="Favoritar"
                        >
                          <Heart size={15} style={{ fill: isFav ? '#ff3b30' : 'none' }} />
                        </button>
                      </div>

                      <div className="page-card-footer">
                        <div className="page-card-title-row">
                          <span className="page-card-name">{template.name}</span>
                          <span className="page-card-count">{template.sections.length} seções</span>
                        </div>
                        <p className="page-card-desc">{template.description}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {mainTab === 'my_templates' && (
            <div className="library-empty-state">
              <Sparkles size={48} style={{ color: '#0071e3' }} />
              <h3>Nenhum Modelo Pessoal Salvo</h3>
              <p>Você pode salvar qualquer seção ou página como modelo próprio clicando na seta ao lado do botão Publicar no topo.</p>
            </div>
          )}
        </div>

        {/* ── PREVIEW POPUP ── */}
        {previewItem && (
          <div className="library-preview-modal" onClick={() => setPreviewItem(null)}>
            <div className="preview-modal-content" onClick={e => e.stopPropagation()}>
              <div className="preview-modal-header">
                <h3>{previewItem.item.name}</h3>
                <button className="preview-close-btn" onClick={() => setPreviewItem(null)}>
                  <X size={18} />
                </button>
              </div>
              <div className="preview-modal-body">
                <p style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: 16 }}>
                  {previewItem.item.description || 'Seção completa pronta para inserção com estilização Apple 1:1 e suporte dinâmico.'}
                </p>
                <div className="preview-modal-details">
                  <span className="badge">Categoria: {previewItem.item.category || 'Página'}</span>
                  {previewItem.item.schema?.containers && (
                    <span className="badge">{previewItem.item.schema.containers.length} Contêineres</span>
                  )}
                </div>
              </div>
              <div className="preview-modal-actions">
                <button
                  className="preview-cancel-btn"
                  onClick={() => setPreviewItem(null)}
                >
                  Fechar
                </button>
                <button
                  className="preview-insert-action-btn"
                  onClick={() => {
                    if (previewItem.type === 'preset') handleInsertBlock(previewItem.item)
                    else handleInsertPage(previewItem.item)
                    setPreviewItem(null)
                  }}
                >
                  <Download size={15} /> Inserir no Canvas
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================================
// REAL LIVE VISUAL THUMBNAILS FOR PRESETS & TEMPLATES
// ============================================================

function LivePresetThumbnail({ preset }: { preset: PresetDefinition }) {
  const { id } = preset

  if (id === 'ribbon-announcement') {
    return (
      <div className="live-preview-ribbon">
        <span className="live-ribbon-text">Estamos doando US$ 10 para cada compra com Apple Pay</span>
        <span className="live-ribbon-link">Compre agora &gt;</span>
      </div>
    )
  }

  if (id === 'hero-mac-mini') {
    return (
      <div className="live-preview-hero hero-macmini">
        <div className="live-hero-content">
          <h4 className="live-hero-title">Mac mini</h4>
          <p className="live-hero-sub">M6 e M5 Pro.</p>
          <div className="live-hero-btn">Saber mais</div>
        </div>
        <div className="live-hero-img-box">
          <img src="https://www.apple.com/v/home/images/mac-mini/a/hero_mac_mini_m6__cyyrlmnibxea_large.jpg" alt="Mac mini" className="live-real-img" />
        </div>
      </div>
    )
  }

  if (id === 'hero-mac-studio') {
    return (
      <div className="live-preview-hero hero-studio">
        <div className="live-hero-content">
          <h4 className="live-hero-title">Estúdio Mac</h4>
          <p className="live-hero-sub">M5 Max e M5 Ultra.</p>
          <div className="live-hero-btn">Comprar</div>
        </div>
        <div className="live-hero-img-box">
          <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60" alt="Mac Studio" className="live-real-img" />
        </div>
      </div>
    )
  }

  if (id === 'hero-back-to-school') {
    return (
      <div className="live-preview-hero hero-school">
        <div className="live-hero-content">
          <span className="live-hero-badge">VOLTA ÀS AULAS</span>
          <h4 className="live-hero-title" style={{ fontSize: '12px' }}>Economize no Mac ou iPad</h4>
          <div className="live-hero-btn" style={{ background: '#0071e3' }}>Aproveitar</div>
        </div>
        <div className="live-hero-img-box">
          <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&auto=format&fit=crop&q=60" alt="Estudantes" className="live-real-img" />
        </div>
      </div>
    )
  }

  if (id === 'hero-dark-pro') {
    return (
      <div className="live-preview-hero hero-dark-pro">
        <div className="live-hero-content">
          <span className="live-hero-badge dark">NOVO LANÇAMENTO</span>
          <h4 className="live-hero-title dark">MacBook Pro</h4>
          <p className="live-hero-sub dark">Poder Monstruoso.</p>
          <div className="live-hero-btn dark">Ver Detalhes</div>
        </div>
        <div className="live-hero-img-box">
          <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500&auto=format&fit=crop&q=60" alt="Pro" className="live-real-img" />
        </div>
      </div>
    )
  }

  if (id === 'promo-grid-complete') {
    return (
      <div className="live-preview-mosaic-grid">
        <div className="live-mosaic-card dark">
          <span className="live-mosaic-tag">iPad Pro</span>
          <span className="live-mosaic-sub">Fino e Poderoso</span>
          <img src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&auto=format&fit=crop&q=60" alt="iPad" className="live-tile-img" />
        </div>
        <div className="live-mosaic-card light">
          <span className="live-mosaic-tag">WATCH 10</span>
          <span className="live-mosaic-sub">Fino no pulso</span>
          <img src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=300&auto=format&fit=crop&q=60" alt="Watch" className="live-tile-img" />
        </div>
        <div className="live-mosaic-card light">
          <span className="live-mosaic-tag">MacBook Air</span>
          <span className="live-mosaic-sub">Superleve. M3.</span>
          <img src="https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=300&auto=format&fit=crop&q=60" alt="MacBook" className="live-tile-img" />
        </div>
        <div className="live-mosaic-card white">
          <span className="live-mosaic-tag">Card</span>
          <span className="live-mosaic-sub">3% Cashback</span>
          <div className="live-card-badge">FINANCE</div>
        </div>
      </div>
    )
  }

  if (id === 'promo-card-dark') {
    return (
      <div className="live-preview-single-promo dark">
        <div className="live-promo-text">
          <span className="live-promo-title">iPad Pro</span>
          <p className="live-promo-desc">Design incrivelmente fino e display Ultra Retina XDR.</p>
          <span className="live-promo-link">Saber mais &gt;</span>
        </div>
        <img src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&auto=format&fit=crop&q=60" alt="iPad" className="live-single-img" />
      </div>
    )
  }

  if (id === 'promo-card-services') {
    return (
      <div className="live-preview-single-promo services">
        <div className="live-promo-text">
          <span className="live-promo-title" style={{ color: '#1d1d1f' }}>TEKNIX Card</span>
          <p className="live-promo-desc" style={{ color: '#6e6e73' }}>Ganhe até 3% de cashback diário em todas as compras.</p>
          <span className="live-promo-link">Pedir cartão &gt;</span>
        </div>
        <div className="live-credit-card-mockup">
          <span>TEKNIX</span>
        </div>
      </div>
    )
  }

  if (id === 'carousel-entertainment') {
    return (
      <div className="live-preview-carousel">
        <div className="live-carousel-stream-tag">TV &amp; CINEMA</div>
        <div className="live-carousel-cards-row">
          <div className="live-stream-card" style={{ background: 'linear-gradient(135deg, #1c1c1e, #2c2c2e)' }}>
            <span className="live-stream-title">Séries Originais</span>
          </div>
          <div className="live-stream-card active" style={{ background: 'linear-gradient(135deg, #0a84ff, #0040dd)' }}>
            <span className="live-stream-title">Mundial ao Vivo</span>
          </div>
          <div className="live-stream-card" style={{ background: 'linear-gradient(135deg, #30d158, #148030)' }}>
            <span className="live-stream-title">Documentários</span>
          </div>
        </div>
      </div>
    )
  }

  if (id === 'cols-2-split-text-image') {
    return (
      <div className="live-preview-split2">
        <div className="live-split-left">
          <span className="live-split-title">Performance Extrema</span>
          <p className="live-split-desc">Projetado com arquitetura de 3 nanômetros para velocidade sem precedentes.</p>
          <div className="live-split-btn">Ver Especificações</div>
        </div>
        <div className="live-split-right">
          <img src="https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=300&auto=format&fit=crop&q=60" alt="Processador" className="live-split-img" />
        </div>
      </div>
    )
  }

  if (id === 'cols-3-features') {
    return (
      <div className="live-preview-cols3">
        <div className="live-feature-item">
          <div className="live-feature-icon" style={{ background: '#e3f2fd', color: '#0071e3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Zap size={14} /></div>
          <span className="live-feature-title">Desempenho</span>
          <p className="live-feature-desc">Até 2.5x mais veloz</p>
        </div>
        <div className="live-feature-item">
          <div className="live-feature-icon" style={{ background: '#f3e5f5', color: '#9c27b0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={14} /></div>
          <span className="live-feature-title">Apple IA</span>
          <p className="live-feature-desc">Inteligência Pessoal</p>
        </div>
        <div className="live-feature-item">
          <div className="live-feature-icon" style={{ background: '#e8f5e9', color: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Battery size={14} /></div>
          <span className="live-feature-title">Bateria</span>
          <p className="live-feature-desc">Até 22h de uso</p>
        </div>
      </div>
    )
  }

  if (id === 'product-grid-official') {
    return (
      <div className="live-preview-store-grid">
        <div className="live-store-card">
          <img src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=200&auto=format&fit=crop&q=60" alt="iPad" className="live-prod-img" />
          <span className="live-prod-name">iPad Pro 13"</span>
          <span className="live-prod-price">R$ 12.999</span>
          <div className="live-prod-btn">Comprar</div>
        </div>
        <div className="live-store-card">
          <img src="https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=200&auto=format&fit=crop&q=60" alt="Watch" className="live-prod-img" />
          <span className="live-prod-name">Apple Watch 10</span>
          <span className="live-prod-price">R$ 4.499</span>
          <div className="live-prod-btn">Comprar</div>
        </div>
      </div>
    )
  }

  if (id === 'faq-official') {
    return (
      <div className="live-preview-faq">
        <div className="live-faq-item active">
          <span>Como funciona a entrega expressa?</span>
          <span className="live-faq-arrow">−</span>
        </div>
        <div className="live-faq-ans">Entregamos em até 24h para capitais com rastreamento ativo.</div>
        <div className="live-faq-item">
          <span>Quais as opções de parcelamento?</span>
          <span className="live-faq-arrow">+</span>
        </div>
        <div className="live-faq-item">
          <span>Os produtos têm garantia oficial?</span>
          <span className="live-faq-arrow">+</span>
        </div>
      </div>
    )
  }

  // ── HEADERS ──
  if (id === 'header-apple-dark') {
    return (
      <div className="live-preview-header dark">
        <div className="live-header-bar dark">
          <div className="live-header-brand">
            <span className="live-brand-badge">T</span>
            <strong>TEKNIX</strong>
          </div>
          <div className="live-header-links">
            <span>Store</span>
            <span>Mac</span>
            <span>iPad</span>
            <span>iPhone</span>
          </div>
          <div className="live-header-icons">
            <div className="live-icon-dot" />
            <div className="live-icon-dot" />
          </div>
        </div>
        <div className="live-header-backdrop-preview">
          <span>Dark Translúcido (#161617) • 1:1 Apple Style</span>
        </div>
      </div>
    )
  }

  if (id === 'header-apple-light') {
    return (
      <div className="live-preview-header light">
        <div className="live-header-bar light">
          <div className="live-header-brand light">
            <span className="live-brand-badge">T</span>
            <strong>TEKNIX</strong>
          </div>
          <div className="live-header-links light">
            <span>Store</span>
            <span>Mac</span>
            <span>iPad</span>
            <span>iPhone</span>
          </div>
          <div className="live-header-icons light">
            <div className="live-icon-dot dark" />
            <div className="live-icon-dot dark" />
          </div>
        </div>
        <div className="live-header-backdrop-preview light">
          <span>Light Editorial (#ffffff) • Clean & Elegante</span>
        </div>
      </div>
    )
  }

  if (id === 'header-industrial-pro') {
    return (
      <div className="live-preview-header industrial">
        <div className="live-header-bar industrial">
          <div className="live-header-brand industrial">
            <span className="live-brand-badge blue">T</span>
            <strong style={{ color: '#0071e3' }}>TEKNIX PRO</strong>
          </div>
          <div className="live-header-links industrial">
            <span>Linha Pro</span>
            <span>Brushless</span>
            <span>Baterias</span>
          </div>
          <div className="live-header-icons">
            <div className="live-icon-dot blue" />
          </div>
        </div>
        <div className="live-header-backdrop-preview industrial">
          <span>Black Solid (#000000) • Destaque Azul Elétrico</span>
        </div>
      </div>
    )
  }

  if (id === 'header-ecommerce-search') {
    return (
      <div className="live-preview-header search">
        <div className="live-header-bar search">
          <div className="live-header-brand">
            <span className="live-brand-badge">T</span>
            <strong>TEKNIX</strong>
          </div>
          <div className="live-header-search-bar">
            <span>Buscar ferramentas...</span>
          </div>
          <div className="live-header-icons">
            <div className="live-icon-dot" />
          </div>
        </div>
        <div className="live-header-backdrop-preview">
          <span>E-commerce Express com Barra de Busca Ativa</span>
        </div>
      </div>
    )
  }

  // ── FOOTERS ──
  if (id === 'footer-apple-directory-light') {
    return (
      <div className="live-preview-footer light">
        <div className="live-footer-sosumi light">
          <div className="live-line short" />
          <div className="live-line" />
        </div>
        <div className="live-footer-cols light">
          <div className="live-footer-col"><div className="col-title" /><div className="col-line" /><div className="col-line" /></div>
          <div className="live-footer-col"><div className="col-title" /><div className="col-line" /><div className="col-line" /></div>
          <div className="live-footer-col"><div className="col-title" /><div className="col-line" /><div className="col-line" /></div>
          <div className="live-footer-col"><div className="col-title" /><div className="col-line" /><div className="col-line" /></div>
        </div>
        <div className="live-footer-bottom light">
          <span>Copyright © 2026 TEKNIX • Brasil</span>
        </div>
      </div>
    )
  }

  if (id === 'footer-apple-directory-dark') {
    return (
      <div className="live-preview-footer dark">
        <div className="live-footer-sosumi dark">
          <div className="live-line short dark" />
          <div className="live-line dark" />
        </div>
        <div className="live-footer-cols dark">
          <div className="live-footer-col dark"><div className="col-title dark" /><div className="col-line dark" /><div className="col-line dark" /></div>
          <div className="live-footer-col dark"><div className="col-title dark" /><div className="col-line dark" /><div className="col-line dark" /></div>
          <div className="live-footer-col dark"><div className="col-title dark" /><div className="col-line dark" /><div className="col-line dark" /></div>
          <div className="live-footer-col dark"><div className="col-title dark" /><div className="col-line dark" /><div className="col-line dark" /></div>
        </div>
        <div className="live-footer-bottom dark">
          <span>Copyright © 2026 TEKNIX Dark • Brasil</span>
        </div>
      </div>
    )
  }

  if (id === 'footer-ecommerce-express') {
    return (
      <div className="live-preview-footer express">
        <div className="live-express-badges">
          <div className="badge-item"><span className="badge-icon"><Truck size={12} /></span><span>Frete Seguro</span></div>
          <div className="badge-item"><span className="badge-icon"><CreditCard size={12} /></span><span>12x Sem Juros</span></div>
          <div className="badge-item"><span className="badge-icon"><ShieldCheck size={12} /></span><span>1 Ano Garantia</span></div>
        </div>
        <div className="live-footer-bottom express">
          <span>Atendimento: 0800 761 0880 • TEKNIX Pay</span>
        </div>
      </div>
    )
  }

  if (id === 'footer-landing-minimal') {
    return (
      <div className="live-preview-footer minimal">
        <div className="live-minimal-row">
          <strong>TEKNIX</strong>
          <div className="minimal-links">
            <span>Privacidade</span>
            <span>Termos</span>
            <span>Contato</span>
          </div>
        </div>
        <div className="live-footer-bottom minimal">
          <span>Copyright © 2026 Todos os direitos reservados.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="live-preview-generic">
      <div className="generic-icon-box">
        <Layers size={20} color="#ea9cfb" />
      </div>
      <span className="live-generic-title">{preset.name}</span>
      <span className="live-generic-sub">{preset.description}</span>
    </div>
  )
}

function LiveTemplateThumbnail({ template }: { template: PageTemplateDefinition }) {
  return (
    <div className="live-template-sheet">
      <div className="sheet-ribbon" />
      <div className="sheet-header">
        <div className="sheet-logo" />
        <div className="sheet-nav-dots">
          <span /><span /><span /><span />
        </div>
      </div>
      <div className="sheet-hero">
        <span className="sheet-hero-title">{template.name}</span>
        <span className="sheet-hero-sub">Experiência Oficial TEKNIX</span>
        <div className="sheet-hero-btn" />
      </div>
      <div className="sheet-mosaic">
        <div className="sheet-tile" />
        <div className="sheet-tile" />
      </div>
      <div className="sheet-footer" />
    </div>
  )
}
