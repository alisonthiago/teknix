import React, { useState } from 'react'
import { Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import type { Page } from '../../types/pageBuilder'
import ImageThumbnailBox from './ImageThumbnailBox'
import './Inspector.css'

interface PageSettingsSidebarProps {
  page: Page
  onUpdatePage: (updates: Partial<Page>) => void
}

export default function PageSettingsSidebar({ page, onUpdatePage }: PageSettingsSidebarProps) {
  const [openGeneral, setOpenGeneral] = useState(true)

  const [title, setTitle] = useState(page.title || '')
  const [status, setStatus] = useState<string>(page.status || 'published')
  const [summary, setSummary] = useState(page.seo_description || '')
  const [featuredImage, setFeaturedImage] = useState(page.seo_image || '')
  const [order, setOrder] = useState<number>(0)
  const [allowComments, setAllowComments] = useState(false)
  const [hideTitle, setHideTitle] = useState(true)
  const [pageLayout, setPageLayout] = useState(page.is_landing_mode ? 'elementor_canvas' : 'default')

  function handleTitleChange(val: string) {
    setTitle(val)
    onUpdatePage({ title: val, seo_title: `${val} — TEKNIX` })
  }

  function handleStatusChange(val: string) {
    setStatus(val)
    onUpdatePage({ status: val as any })
  }

  function handleSummaryChange(val: string) {
    setSummary(val)
    onUpdatePage({ seo_description: val })
  }

  function handleImageChange(url: string) {
    setFeaturedImage(url)
    onUpdatePage({ seo_image: url })
  }

  function handleLayoutChange(val: string) {
    setPageLayout(val)
    onUpdatePage({ is_landing_mode: val === 'elementor_canvas' })
  }

  return (
    <div className="inspector-panel-elementor page-settings-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div className="inspector-top-badge" style={{ padding: '14px 16px', borderBottom: '1px solid #2e343d' }}>
        <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#f0f0f1' }}>
          Configurações do Página
        </h3>
      </div>

      <div className="inspector-body-elementor" style={{ flex: 1, overflowY: 'auto' }}>
        {/* Accordion: Configurações gerais */}
        <div className="inspector-accordion">
          <button
            type="button"
            className="inspector-accordion-header"
            onClick={() => setOpenGeneral(!openGeneral)}
          >
            <div className="accordion-title-wrap">
              {openGeneral ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <span>Configurações gerais</span>
            </div>
          </button>

          {openGeneral && (
            <div className="inspector-accordion-content">
              {/* Título */}
              <div className="elementor-control-row stacked">
                <div className="elementor-control-label" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Título</span>
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ea9cfb',
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontWeight: 600
                    }}
                    onClick={() => {
                      const suggestions = ['Mega Promoção de Ferramentas TEKNIX', 'Coleções Exclusivas TEKNIX 2026', 'Catálogo Industrial & Ferramentas', 'Ofertas Especiais e Lançamentos']
                      const random = suggestions[Math.floor(Math.random() * suggestions.length)]
                      handleTitleChange(random)
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Escrever com IA</span>
                  </button>
                </div>
                <input
                  className="elementor-input"
                  value={title}
                  onChange={e => handleTitleChange(e.target.value)}
                  placeholder="Nome da página..."
                />
              </div>

              {/* Status */}
              <div className="elementor-control-row">
                <div className="elementor-control-label">
                  <span>Status</span>
                </div>
                <div className="elementor-control-field">
                  <select
                    className="elementor-select"
                    value={status}
                    onChange={e => handleStatusChange(e.target.value)}
                  >
                    <option value="published">Publicado</option>
                    <option value="draft">Rascunho</option>
                    <option value="private">Privado</option>
                  </select>
                </div>
              </div>

              {/* Resumo */}
              <div className="elementor-control-row stacked">
                <div className="elementor-control-label" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Resumo</span>
                  <button
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#ea9cfb',
                      cursor: 'pointer',
                      fontSize: '11px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontWeight: 600
                    }}
                    onClick={() => {
                      const desc = 'Confira as melhores ofertas e produtos de alta tecnologia e iluminação na loja oficial TEKNIX com garantia de fábrica e entrega rápida.'
                      handleSummaryChange(desc)
                    }}
                  >
                    <Sparkles size={12} />
                    <span>Escrever com IA</span>
                  </button>
                </div>
                <textarea
                  className="elementor-textarea"
                  rows={3}
                  value={summary}
                  onChange={e => handleSummaryChange(e.target.value)}
                  placeholder="Descrição da página..."
                  style={{ minHeight: '80px' }}
                />
              </div>

              {/* Imagem destacada */}
              <div className="elementor-control-row stacked">
                <div className="elementor-control-label" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Imagem destacada</span>
                  <Sparkles size={13} style={{ color: '#ea9cfb' }} />
                </div>
                <ImageThumbnailBox
                  src={featuredImage}
                  onChange={handleImageChange}
                  title="Imagem destacada"
                />
              </div>

              {/* Ordem */}
              <div className="elementor-control-row">
                <div className="elementor-control-label">
                  <span>Ordem</span>
                </div>
                <div className="elementor-control-field">
                  <input
                    type="number"
                    className="elementor-input"
                    value={order}
                    onChange={e => setOrder(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Permitir comentários */}
              <div className="elementor-control-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="elementor-control-label">
                  <span>Permitir comentários</span>
                </div>
                <label className="elementor-toggle-switch">
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={e => setAllowComments(e.target.checked)}
                  />
                  <span className="elementor-toggle-slider" />
                  <span className="elementor-toggle-text">{allowComments ? 'Sim' : 'Não'}</span>
                </label>
              </div>

              {/* Ocultar título */}
              <div className="elementor-control-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="elementor-control-label">
                  <span>Ocultar título</span>
                </div>
                <label className="elementor-toggle-switch">
                  <input
                    type="checkbox"
                    checked={hideTitle}
                    onChange={e => setHideTitle(e.target.checked)}
                  />
                  <span className="elementor-toggle-slider" />
                  <span className="elementor-toggle-text">{hideTitle ? 'Sim' : 'Não'}</span>
                </label>
              </div>
              <p className="elementor-note-caption" style={{ marginTop: 2, marginBottom: 12 }}>
                Defina um seletor diferente para o título no painel <em>Layout</em>.
              </p>

              {/* Layout da página */}
              <div className="elementor-control-row">
                <div className="elementor-control-label">
                  <span>Layout da página</span>
                </div>
                <div className="elementor-control-field">
                  <select
                    className="elementor-select"
                    value={pageLayout}
                    onChange={e => handleLayoutChange(e.target.value)}
                  >
                    <option value="default">Padrão</option>
                    <option value="full_width">Elementor largura total</option>
                    <option value="elementor_canvas">Tela do Elementor</option>
                    <option value="theme">Tema</option>
                  </select>
                </div>
              </div>
              <p className="elementor-note-caption" style={{ marginTop: 4 }}>
                O modelo de página padrão, conforme definido no Painel do Elementor → Menu de hambúrguer → Configurações do site.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
