import React, { useState } from 'react'
import type { PageSection, PageContainer, PageWidget, EditorTab } from '../../types/pageBuilder'
import { WIDGET_DEFINITIONS } from '../../types/pageBuilder'
import {
  ChevronLeft, ChevronRight, Trash2, Monitor, Tablet, Smartphone, Globe, Link, Unlink,
  Edit2, X, Upload, HelpCircle, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  ArrowDown, ArrowRight, ArrowUp, ArrowLeft, Paintbrush, Video, Image as ImageIcon,
  MoveHorizontal, GitBranch, Plus, Sparkles, RotateCcw
} from 'lucide-react'
import MediaLibraryModal from './MediaLibraryModal'
import './Inspector.css'

export const ViewportContext = React.createContext<{
  viewportMode: 'desktop' | 'tablet' | 'mobile'
  onViewportChange?: (mode: 'desktop' | 'tablet' | 'mobile') => void
}>({ viewportMode: 'desktop' })

interface InspectorItem {
  type: 'section' | 'container' | 'widget'
  item: PageSection | PageContainer | PageWidget
  sectionId?: string
  containerId?: string
}

interface Props {
  item: InspectorItem
  tab: EditorTab
  viewportMode?: 'desktop' | 'tablet' | 'mobile'
  onViewportChange?: (mode: 'desktop' | 'tablet' | 'mobile') => void
  onTabChange: (tab: EditorTab) => void
  onUpdateSection: (updates: Partial<PageSection>) => void
  onUpdateContainer: (updates: Partial<PageContainer>) => void
  onUpdateWidget: (updates: Partial<PageWidget>) => void
  onDelete: () => void
  onBack?: () => void
}

export default function Inspector({
  item, tab, viewportMode = 'desktop', onViewportChange, onTabChange,
  onUpdateSection, onUpdateContainer, onUpdateWidget, onDelete, onBack
}: Props) {
  const [bgHoverTab, setBgHoverTab] = useState<'normal' | 'hover'>('normal')
  const [openTypography, setOpenTypography] = useState(false)
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    layout: true,
    background: true,
    overlay: false,
    border: false,
    shape: false,
    motion: false,
    sticky: false,
    transform: false,
    responsive: false,
    customCss: false,
    widgetContent: true,
    widgetStyle: true,
    onepage: false
  })

  const toggleAccordion = (key: string) => {
    setOpenAccordions(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const obj = item.item as any

  // Helper to read value considering active viewport
  function getVal(key: string, defaultVal: any = '') {
    if (viewportMode !== 'desktop') {
      const respVal = obj.responsive?.[viewportMode]?.[key] ?? obj[`${key}_${viewportMode}`]
      if (respVal !== undefined && respVal !== '') return respVal
    }
    return obj[key] ?? obj.settings?.[key] ?? obj.style?.[key] ?? defaultVal
  }

  // Update responsive properties per viewport
  function updateResponsive(key: string, value: any) {
    if (viewportMode === 'desktop') {
      update(key, value)
    } else {
      const currentResp = obj.responsive || {}
      const deviceResp = currentResp[viewportMode] || {}
      const newResponsive = {
        ...currentResp,
        [viewportMode]: {
          ...deviceResp,
          [key]: value
        }
      }
      if (item.type === 'section') {
        onUpdateSection({
          responsive: newResponsive,
          [`${key}_${viewportMode}`]: value
        } as any)
      } else if (item.type === 'container') {
        onUpdateContainer({
          responsive: newResponsive,
          [`${key}_${viewportMode}`]: value
        } as any)
      } else if (item.type === 'widget') {
        const prevSettings = obj.settings || {}
        const prevStyle = obj.style || {}
        onUpdateWidget({
          responsive: newResponsive,
          [`${key}_${viewportMode}`]: value,
          settings: { ...prevSettings, [`${key}_${viewportMode}`]: value },
          style: { ...prevStyle, [`${key}_${viewportMode}`]: value }
        } as any)
      }
    }
  }

  // Update top-level, settings, and style fields uniformly across all consumers
  function update(key: string, value: any) {
    if (item.type === 'section') {
      onUpdateSection({ [key]: value } as any)
    } else if (item.type === 'container') {
      onUpdateContainer({ [key]: value } as any)
    } else if (item.type === 'widget') {
      const prevSettings = obj.settings || {}
      const prevStyle = obj.style || {}
      onUpdateWidget({
        [key]: value,
        settings: { ...prevSettings, [key]: value },
        style: { ...prevStyle, [key]: value }
      } as any)
    }
  }

  // Update widget content properties cleanly (never exposing raw JSON to user)
  function updateWidgetContent(key: string, value: any) {
    const prevContent = typeof obj.content === 'object' && obj.content !== null
      ? obj.content
      : { text: String(obj.content || '') }
    const updated = { ...prevContent, [key]: value }
    onUpdateWidget({ content: updated } as any)
  }

  // Update widget styling in all places
  function updateWidgetStyle(key: string, value: any) {
    const prevSettings = obj.settings || {}
    const prevStyle = obj.style || {}
    onUpdateWidget({
      [key]: value,
      settings: { ...prevSettings, [key]: value },
      style: { ...prevStyle, [key]: value }
    } as any)
  }

  const isLayoutType = item.type === 'container' || item.type === 'section'
  const isImage = obj.type === 'image' || obj.type === 'imageBox' || obj.type === 'featuredImage' || obj.type === 'gallery' || obj.type === 'svg' || obj.type === 'gif' || obj.type === 'logo'
  const isVideo = obj.type === 'video' || obj.type === 'videoPlaylist'
  const isTextOrHeading = obj.type === 'heading' || obj.type === 'title' || obj.type === 'text' || obj.type === 'paragraph' || obj.type === 'rich_text'
  const isButton = obj.type === 'button' || obj.type === 'buyButton' || obj.type === 'cta'
  const hasTypography = item.type === 'widget' && !isImage && !isVideo && (
    isTextOrHeading || isButton ||
    obj.type === 'iconBox' || obj.type === 'accordion' || obj.type === 'faq' ||
    obj.type === 'priceTable' || obj.type === 'priceList' || obj.type === 'animatedHeadline' ||
    obj.type === 'starRating' || obj.type === 'counter' || obj.type === 'testimonial' ||
    !!obj.content?.text || !!obj.content?.title || !!obj.content?.label || !!obj.content?.heading
  )

  const [showTypographyPopover, setShowTypographyPopover] = useState(false)
  const [imageWidthUnit, setImageWidthUnit] = useState<'%' | 'px' | 'vw'>('%')
  const [imageHeightUnit, setImageHeightUnit] = useState<'px' | 'vh' | 'auto'>('px')
  const [fontSizeUnit, setFontSizeUnit] = useState<'px' | 'rem' | 'em' | 'vw'>('px')

  const itemTitle = item.type === 'widget'
    ? (WIDGET_DEFINITIONS.find(w => w.type === obj.type)?.label || obj.type)
    : item.type === 'container' ? 'Contêiner' : 'Seção'

  // Current alignment computed from active viewport and all fallback source fields
  const currentAlign = (viewportMode !== 'desktop' && (obj.responsive?.[viewportMode]?.text_align || obj[`text_align_${viewportMode}`]))
    || obj.text_align || obj.settings?.text_align || obj.content?.align || obj.content?.text_align || obj.style?.textAlign || 'left'

  return (
    <ViewportContext.Provider value={{ viewportMode, onViewportChange }}>
      <div className="elementor-dark-inspector">
        {/* ── 1. TITLEBAR (Elementor exact) ── */}
        <div className="inspector-titlebar-elementor">
          {onBack && (
            <button onClick={onBack} className="inspector-titlebar-back" title="Voltar">
              <ChevronLeft size={18} />
            </button>
          )}
          <span className="inspector-titlebar-heading">Editar {itemTitle}</span>
          <button onClick={onDelete} className="inspector-titlebar-delete" title="Excluir">
            <Trash2 size={15} />
          </button>
        </div>

        {/* ── 2. TABS BAR (Layout/Conteúdo, Estilo, Avançado) ── */}
        <div className="inspector-tabs-elementor">
          <button
            className={`inspector-tab-btn-elementor ${tab === 'content' ? 'active' : ''}`}
            onClick={() => onTabChange('content')}
          >
            {isLayoutType ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" /></svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
            )}
            {isLayoutType ? 'Layout' : 'Conteúdo'}
          </button>
          <button
            className={`inspector-tab-btn-elementor ${tab === 'style' ? 'active' : ''}`}
            onClick={() => onTabChange('style')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10" /><path d="M12 2a10 10 0 0 1 0 20Z" fill="currentColor" /></svg>
            Estilo
          </button>
          <button
            className={`inspector-tab-btn-elementor ${tab === 'advanced' ? 'active' : ''}`}
            onClick={() => onTabChange('advanced')}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
            Avançado
          </button>
        </div>

        {/* ── 3. INSPECTOR BODY ── */}
        <div className="inspector-body-elementor">
          {/* ============================================================
              TAB 1: CONTENT / LAYOUT
             ============================================================ */}
          {tab === 'content' && (
            <>
              {/* Section / Container Layout */}
              {isLayoutType && (
                <AccordionSection
                  title="Contêiner"
                  isOpen={openAccordions.layout}
                  onToggle={() => toggleAccordion('layout')}
                >
                  <ControlRow label="Largura do conteúdo">
                    <select
                      className="elementor-select"
                      value={obj.content_width || (obj.layout === 'full' ? 'full' : 'boxed')}
                      onChange={e => {
                        const val = e.target.value
                        update('content_width', val)
                        update('layout', val)
                      }}
                    >
                      <option value="boxed">Boxed</option>
                      <option value="full">Largura total (Full Width)</option>
                    </select>
                  </ControlRow>

                  <ControlRow label="Largura" responsive>
                    <input
                      className="elementor-input"
                      value={obj.content_width_value || obj.max_width || '1200'}
                      onChange={e => {
                        update('content_width_value', e.target.value)
                        update('max_width', e.target.value.includes('px') || e.target.value.includes('%') ? e.target.value : `${e.target.value}px`)
                      }}
                      placeholder="1200"
                    />
                  </ControlRow>

                  <ControlRow label="Altura mínima" responsive>
                    <input
                      className="elementor-input"
                      value={obj.min_height || ''}
                      onChange={e => update('min_height', e.target.value)}
                      placeholder="auto ou 500px"
                    />
                  </ControlRow>

                  {/* Direção: 4 vetores SVG [ → ] [ ↓ ] [ ← ] [ ↑ ] */}
                  <ControlRow label="Direção" responsive>
                    <IconGroupSelector
                      value={obj.direction || 'column'}
                      onChange={v => update('direction', v)}
                      options={[
                        { value: 'row', icon: <ArrowRight size={13} />, title: 'Linha (Horizontal)' },
                        { value: 'column', icon: <ArrowDown size={13} />, title: 'Coluna (Vertical)' },
                        { value: 'row-reverse', icon: <ArrowLeft size={13} />, title: 'Linha Invertida' },
                        { value: 'column-reverse', icon: <ArrowUp size={13} />, title: 'Coluna Invertida' },
                      ]}
                    />
                  </ControlRow>

                  {/* Justificar conteúdo: 6 vetores SVG */}
                  <ControlRow label="Justificar conteúdo" responsive>
                    <IconGroupSelector
                      value={obj.justify_content || 'flex-start'}
                      onChange={v => update('justify_content', v)}
                      options={[
                        {
                          value: 'flex-start',
                          title: 'Início',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 8h10M4 12h14" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'center',
                          title: 'Centro',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M7 8h10M5 12h14" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'flex-end',
                          title: 'Fim',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M10 8h10M6 12h14" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'space-between',
                          title: 'Espaço entre',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 20h16M4 10h6M14 10h6" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'space-around',
                          title: 'Espaço ao redor',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 20h16M6 11h4M14 11h4" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'space-evenly',
                          title: 'Espaço uniforme',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 20h16M8 12h8" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                      ]}
                    />
                  </ControlRow>

                  {/* Alinhar itens: 4 vetores SVG */}
                  <ControlRow label="Alinhar itens" responsive>
                    <IconGroupSelector
                      value={obj.align_items || 'stretch'}
                      onChange={v => update('align_items', v)}
                      options={[
                        {
                          value: 'flex-start',
                          title: 'Início',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 8v10M8 8v6M12 8v8" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'center',
                          title: 'Centro',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 12h16M6 7v10M10 9v6M14 8v8" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'flex-end',
                          title: 'Fim',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 20h16M4 6v10M8 10v6M12 8v8" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                        {
                          value: 'stretch',
                          title: 'Esticar',
                          icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 20h16M8 4v16M16 4v16" stroke="currentColor" strokeWidth="2.5" /></svg>
                        },
                      ]}
                    />
                  </ControlRow>

                  <div className="elementor-divider-row" />

                  {/* Espaçamentos: 2 caixas Coluna e Linha vinculadas */}
                  <GapsTwoControl
                    label="Espaçamentos"
                    responsive
                    colValue={obj.gap_column || obj.gap || '20'}
                    rowValue={obj.gap_row || obj.gap || '20'}
                    onChange={(col, row) => {
                      update('gap_column', col)
                      update('gap_row', row)
                      update('gap', `${row}px ${col}px`)
                    }}
                  />

                  <ControlRow label="Quebra de linha (Wrap)">
                    <select
                      className="elementor-select"
                      value={obj.wrap || 'nowrap'}
                      onChange={e => update('wrap', e.target.value)}
                    >
                      <option value="nowrap">Não quebrar</option>
                      <option value="wrap">Quebrar (Wrap)</option>
                    </select>
                  </ControlRow>

                  <ControlRow label="Tag HTML">
                    <select
                      className="elementor-select"
                      value={obj.html_tag || 'div'}
                      onChange={e => update('html_tag', e.target.value)}
                    >
                      <option value="div">div</option>
                      <option value="header">header</option>
                      <option value="footer">footer</option>
                      <option value="main">main</option>
                      <option value="article">article</option>
                      <option value="section">section</option>
                      <option value="aside">aside</option>
                      <option value="nav">nav</option>
                    </select>
                  </ControlRow>
                </AccordionSection>
              )}

              {/* Image Widget (Primeiro na lista e aberto por padrão) */}
              {item.type === 'widget' && isImage && (
                <AccordionSection
                  title="Imagem"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Escolher Imagem</span>
                        <ResponsiveLabelSwitcher />
                      </div>
                      <button
                        type="button"
                        style={{ background: 'transparent', border: 'none', color: '#ea9cfb', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                        title="Variações com IA"
                        onClick={() => {
                          const randomAssets = [
                            'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=1200&auto=format&fit=crop&q=80',
                            'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1200&auto=format&fit=crop&q=80',
                            'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1200&auto=format&fit=crop&q=80'
                          ]
                          const next = randomAssets[Math.floor(Math.random() * randomAssets.length)]
                          updateWidgetContent('image', next)
                          updateWidgetContent('url', next)
                        }}
                      >
                        <Sparkles size={14} />
                      </button>
                    </div>
                    <ImageThumbnailBox
                      src={obj.content?.image || obj.content?.url || ''}
                      onChange={url => {
                        updateWidgetContent('image', url)
                        updateWidgetContent('url', url)
                      }}
                    />
                  </div>

                  <ControlRow label="Alinhamento" responsive>
                    <IconGroupSelector
                      value={currentAlign === 'right' ? 'right' : currentAlign === 'center' ? 'center' : 'left'}
                      onChange={v => {
                        updateResponsive('text_align', v)
                        updateWidgetStyle('text_align', v)
                        updateWidgetContent('align', v)
                        updateWidgetContent('text_align', v)
                      }}
                      options={[
                        { value: 'left', icon: <AlignLeft size={13} />, title: 'Esquerda' },
                        { value: 'center', icon: <AlignCenter size={13} />, title: 'Centro' },
                        { value: 'right', icon: <AlignRight size={13} />, title: 'Direita' },
                      ]}
                    />
                  </ControlRow>

                  <ControlRow label="Texto Alternativo (Alt)">
                    <input
                      className="elementor-input"
                      value={obj.content?.alt || ''}
                      onChange={e => updateWidgetContent('alt', e.target.value)}
                      placeholder="Descrição da imagem"
                    />
                  </ControlRow>
                </AccordionSection>
              )}

              {/* Text / Heading Widgets (Título / Editor de Texto) */}
              {item.type === 'widget' && isTextOrHeading && (
                <AccordionSection
                  title={itemTitle}
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Título</span>
                    <textarea
                      className="elementor-textarea"
                      value={obj.content?.text || (typeof obj.content === 'string' ? obj.content : '') || ''}
                      onChange={e => updateWidgetContent('text', e.target.value)}
                      placeholder="Digite seu texto ou título..."
                      rows={3}
                    />
                  </div>

                  <ControlRow label="Link">
                    <input
                      className="elementor-input"
                      value={obj.content?.link || ''}
                      onChange={e => updateWidgetContent('link', e.target.value)}
                      placeholder="https://seusite.com"
                    />
                  </ControlRow>

                  <ControlRow label="Tag HTML">
                    <select
                      className="elementor-select"
                      value={obj.content?.tag || (obj.type === 'text' ? 'p' : 'h2')}
                      onChange={e => updateWidgetContent('tag', e.target.value)}
                    >
                      <option value="h1">H1</option>
                      <option value="h2">H2</option>
                      <option value="h3">H3</option>
                      <option value="h4">H4</option>
                      <option value="h5">H5</option>
                      <option value="h6">H6</option>
                      <option value="div">div</option>
                      <option value="span">span</option>
                      <option value="p">p</option>
                    </select>
                  </ControlRow>

                  {/* Alinhamento de Texto */}
                  <ControlRow label="Alinhamento" responsive>
                    <IconGroupSelector
                      value={currentAlign}
                      onChange={v => {
                        updateResponsive('text_align', v)
                        updateWidgetContent('align', v)
                        updateWidgetContent('text_align', v)
                      }}
                      options={[
                        { value: 'left', icon: <AlignLeft size={13} />, title: 'Esquerda' },
                        { value: 'center', icon: <AlignCenter size={13} />, title: 'Centro' },
                        { value: 'right', icon: <AlignRight size={13} />, title: 'Direita' },
                        { value: 'justify', icon: <AlignJustify size={13} />, title: 'Justificado' },
                      ]}
                    />
                  </ControlRow>
                </AccordionSection>
              )}

              {/* Button Widget */}
              {item.type === 'widget' && isButton && (
                <AccordionSection
                  title="Botão"
                  isOpen={openAccordions.widgetContent !== false}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <div className="elementor-control-row stacked">
                    <span className="elementor-control-label">Texto do Botão</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.label || obj.content?.text || ''}
                      onChange={e => {
                        updateWidgetContent('label', e.target.value)
                        updateWidgetContent('text', e.target.value)
                      }}
                      placeholder="Comprar agora"
                    />
                  </div>

                  <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                    <span className="elementor-control-label">Link / URL</span>
                    <input
                      className="elementor-input"
                      value={obj.content?.link || obj.content?.url || ''}
                      onChange={e => {
                        updateWidgetContent('link', e.target.value)
                        updateWidgetContent('url', e.target.value)
                      }}
                      placeholder="https://... ou /produtos"
                    />
                  </div>

                  {/* Opções de Link: Nova Aba e Nofollow */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, margin: '8px 0', background: '#f5f5f7', padding: '8px 10px', borderRadius: 6, border: '1px solid #e5e5ea' }}>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', cursor: 'pointer' }}>
                      <span>Abrir em Nova Aba</span>
                      <input
                        type="checkbox"
                        checked={!!obj.content?.open_in_new_tab}
                        onChange={e => updateWidgetContent('open_in_new_tab', e.target.checked)}
                        style={{ accentColor: '#0071e3' }}
                      />
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', cursor: 'pointer' }}>
                      <span>Adicionar nofollow</span>
                      <input
                        type="checkbox"
                        checked={!!obj.content?.nofollow}
                        onChange={e => updateWidgetContent('nofollow', e.target.checked)}
                        style={{ accentColor: '#0071e3' }}
                      />
                    </label>
                  </div>

                  {/* Ícone do Botão */}
                  <ControlRow label="Ícone">
                    <select
                      className="elementor-select"
                      value={obj.content?.icon || 'none'}
                      onChange={e => updateWidgetContent('icon', e.target.value)}
                    >
                      <option value="none">Nenhum</option>
                      <option value="shopping-bag">Sacola / Carrinho</option>
                      <option value="arrow-right">Seta para Direita</option>
                      <option value="chevron-right">Chevron Direita</option>
                      <option value="sparkles">Brilho (IA / Destaque)</option>
                      <option value="zap">Raio (Ação Rápida)</option>
                      <option value="star">Estrela</option>
                      <option value="heart">Coração (Favorito)</option>
                      <option value="check">Check (Confirmar)</option>
                      <option value="download">Download</option>
                      <option value="play">Play (Vídeo)</option>
                      <option value="external-link">Link Externo</option>
                      <option value="phone">Telefone / WhatsApp</option>
                      <option value="mail">E-mail</option>
                    </select>
                  </ControlRow>

                  {obj.content?.icon && obj.content.icon !== 'none' && (
                    <>
                      <ControlRow label="Posição do Ícone">
                        <select
                          className="elementor-select"
                          value={obj.content?.icon_position || 'before'}
                          onChange={e => updateWidgetContent('icon_position', e.target.value)}
                        >
                          <option value="before">Antes do Texto (Esquerda)</option>
                          <option value="after">Depois do Texto (Direita)</option>
                        </select>
                      </ControlRow>

                      <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                        <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                          <span>Espaçamento do Ícone</span>
                          <span style={{ fontSize: 10, color: '#86868b' }}>{obj.content?.icon_spacing ?? 8}px</span>
                        </div>
                        <input
                          type="range"
                          min="2"
                          max="32"
                          value={obj.content?.icon_spacing ?? 8}
                          onChange={e => updateWidgetContent('icon_spacing', parseInt(e.target.value) || 8)}
                          style={{ width: '100%', accentColor: '#0071e3', cursor: 'pointer' }}
                        />
                      </div>

                      <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                        <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                          <span>Tamanho do Ícone</span>
                          <span style={{ fontSize: 10, color: '#86868b' }}>{obj.content?.icon_size ?? 16}px</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="36"
                          value={obj.content?.icon_size ?? 16}
                          onChange={e => updateWidgetContent('icon_size', parseInt(e.target.value) || 16)}
                          style={{ width: '100%', accentColor: '#0071e3', cursor: 'pointer' }}
                        />
                      </div>
                    </>
                  )}

                  <ControlRow label="Alinhamento" responsive>
                    <IconGroupSelector
                      value={currentAlign}
                      onChange={v => {
                        updateResponsive('text_align', v)
                        updateWidgetStyle('text_align', v)
                        updateWidgetContent('align', v)
                        updateWidgetContent('text_align', v)
                      }}
                      options={[
                        { value: 'left', icon: <AlignLeft size={13} />, title: 'Esquerda' },
                        { value: 'center', icon: <AlignCenter size={13} />, title: 'Centro' },
                        { value: 'right', icon: <AlignRight size={13} />, title: 'Direita' },
                        { value: 'justify', icon: <AlignJustify size={13} />, title: 'Justificado' },
                      ]}
                    />
                  </ControlRow>

                  <ControlRow label="Tamanho">
                    <select
                      className="elementor-select"
                      value={obj.content?.button_size || 'md'}
                      onChange={e => updateWidgetContent('button_size', e.target.value)}
                    >
                      <option value="xs">Extra Pequeno</option>
                      <option value="sm">Pequeno</option>
                      <option value="md">Médio</option>
                      <option value="lg">Grande</option>
                      <option value="xl">Extra Grande</option>
                    </select>
                  </ControlRow>

                  <div className="elementor-control-row" style={{ justifyContent: 'space-between', marginTop: 10 }}>
                    <span className="elementor-control-label">Largura Total (100%)</span>
                    <label className="header-toggle-switch">
                      <input
                        type="checkbox"
                        checked={obj.content?.full_width || obj.width === '100%'}
                        onChange={e => {
                          updateWidgetContent('full_width', e.target.checked)
                          if (e.target.checked) {
                            update('width', '100%')
                            updateWidgetStyle('width', '100%')
                          } else {
                            update('width', '')
                            updateWidgetStyle('width', '')
                          }
                        }}
                      />
                      <span className="toggle-track" />
                    </label>
                  </div>
                </AccordionSection>
              )}

              {/* Video Widget */}
              {item.type === 'widget' && isVideo && (
                <AccordionSection
                  title="Vídeo"
                  isOpen={openAccordions.widgetContent}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <ControlRow label="Origem">
                    <select
                      className="elementor-select"
                      value={obj.content?.provider || 'youtube'}
                      onChange={e => updateWidgetContent('provider', e.target.value)}
                    >
                      <option value="youtube">YouTube</option>
                      <option value="vimeo">Vimeo</option>
                      <option value="self">Auto-hospedado (MP4)</option>
                    </select>
                  </ControlRow>

                  <ControlRow label="Link do Vídeo">
                    <input
                      className="elementor-input"
                      value={obj.content?.url || ''}
                      onChange={e => updateWidgetContent('url', e.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                    />
                  </ControlRow>
                </AccordionSection>
              )}

              {/* Fallback for other widgets */}
              {item.type === 'widget' && !isTextOrHeading && !isButton && !isImage && !isVideo && (
                <AccordionSection
                  title={itemTitle}
                  isOpen={openAccordions.widgetContent}
                  onToggle={() => toggleAccordion('widgetContent')}
                >
                  <ControlRow label="Alinhamento" responsive>
                    <IconGroupSelector
                      value={currentAlign}
                      onChange={v => {
                        updateResponsive('text_align', v)
                        updateWidgetContent('align', v)
                        updateWidgetContent('text_align', v)
                      }}
                      options={[
                        { value: 'left', icon: <AlignLeft size={13} />, title: 'Esquerda' },
                        { value: 'center', icon: <AlignCenter size={13} />, title: 'Centro' },
                        { value: 'right', icon: <AlignRight size={13} />, title: 'Direita' },
                      ]}
                    />
                  </ControlRow>
                </AccordionSection>
              )}
            </>
          )}

          {/* ============================================================
              TAB 2: STYLE (Estilo)
             ============================================================ */}
          {tab === 'style' && (
            <>
              {/* ── SEÇÃO: IMAGEM (ESTILO & DIMENSÕES) QUANDO FOR WIDGET DE IMAGEM ── */}
              {item.type === 'widget' && isImage && (
                <AccordionSection
                  title="Imagem"
                  isOpen={openAccordions.widgetStyle !== false}
                  onToggle={() => toggleAccordion('widgetStyle')}
                >
                  {/* Largura (Width) */}
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Largura</span>
                        <ResponsiveLabelSwitcher />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {(['%', 'px', 'vw'] as const).map(u => (
                          <button
                            key={u}
                            type="button"
                            className={`elementor-segmented-btn ${imageWidthUnit === u ? 'active' : ''}`}
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                            onClick={() => setImageWidthUnit(u)}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="range"
                        min="1"
                        max={imageWidthUnit === '%' ? 100 : (imageWidthUnit === 'vw' ? 100 : 1600)}
                        value={parseInt(String(getVal('width', '100%')).replace(/[^0-9]/g, ''), 10) || (imageWidthUnit === '%' ? 100 : 400)}
                        onChange={e => {
                          const val = `${e.target.value}${imageWidthUnit}`
                          updateResponsive('width', val)
                          updateWidgetStyle('width', val)
                        }}
                        style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                      />
                      <div style={{ width: '90px' }}>
                        <StepperNumberInput
                          value={getVal('width', `100${imageWidthUnit}`)}
                          onChange={v => {
                            const formatted = v.includes('%') || v.includes('px') || v.includes('vw') ? v : `${v}${imageWidthUnit}`
                            updateResponsive('width', formatted)
                            updateWidgetStyle('width', formatted)
                          }}
                          placeholder={`100${imageWidthUnit}`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Largura Máxima (Max Width) */}
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Largura Máxima</span>
                        <ResponsiveLabelSwitcher />
                      </div>
                      <span style={{ fontSize: '11px', color: '#86868b' }}>
                        {getVal('max_width', '100%')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={parseInt(String(getVal('max_width', '100%')).replace(/[^0-9]/g, ''), 10) || 100}
                        onChange={e => {
                          const val = `${e.target.value}%`
                          updateResponsive('max_width', val)
                          updateWidgetStyle('max_width', val)
                        }}
                        style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                      />
                      <div style={{ width: '90px' }}>
                        <StepperNumberInput
                          value={getVal('max_width', '100%')}
                          onChange={v => {
                            const formatted = v.includes('%') || v.includes('px') ? v : `${v}%`
                            updateResponsive('max_width', formatted)
                            updateWidgetStyle('max_width', formatted)
                          }}
                          placeholder="100%"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Altura (Height) */}
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>Altura</span>
                        <ResponsiveLabelSwitcher />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {(['px', 'vh', 'auto'] as const).map(u => (
                          <button
                            key={u}
                            type="button"
                            className={`elementor-segmented-btn ${imageHeightUnit === u ? 'active' : ''}`}
                            style={{ padding: '2px 6px', fontSize: '10px' }}
                            onClick={() => {
                              setImageHeightUnit(u)
                              if (u === 'auto') {
                                updateResponsive('height', 'auto')
                                updateWidgetStyle('height', 'auto')
                              }
                            }}
                          >
                            {u}
                          </button>
                        ))}
                      </div>
                    </div>
                    {imageHeightUnit !== 'auto' && (
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input
                          type="range"
                          min="50"
                          max={imageHeightUnit === 'vh' ? 100 : 1200}
                          value={parseInt(String(getVal('height', '400px')).replace(/[^0-9]/g, ''), 10) || 400}
                          onChange={e => {
                            const val = `${e.target.value}${imageHeightUnit}`
                            updateResponsive('height', val)
                            updateWidgetStyle('height', val)
                          }}
                          style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                        />
                        <div style={{ width: '90px' }}>
                          <StepperNumberInput
                            value={getVal('height', `400${imageHeightUnit}`)}
                            onChange={v => {
                              const formatted = v.includes('px') || v.includes('vh') || v === 'auto' ? v : `${v}${imageHeightUnit}`
                              updateResponsive('height', formatted)
                              updateWidgetStyle('height', formatted)
                            }}
                            placeholder={`400${imageHeightUnit}`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Ajuste do Objeto (Object Fit) */}
                  <ControlRow label="Ajuste do Objeto (Object Fit)">
                    <select
                      className="elementor-select"
                      value={obj.object_fit || obj.settings?.object_fit || obj.style?.objectFit || 'cover'}
                      onChange={e => {
                        update('object_fit', e.target.value)
                        updateWidgetStyle('object_fit', e.target.value)
                      }}
                    >
                      <option value="cover">Preencher (Cover — sem distorcer)</option>
                      <option value="contain">Conter (Contain — imagem inteira)</option>
                      <option value="fill">Preenchimento Total (Fill)</option>
                      <option value="none">Padrão Original (None)</option>
                      <option value="scale-down">Reduzir Proporcional (Scale Down)</option>
                    </select>
                  </ControlRow>

                  {/* Posição do Objeto (Object Position) */}
                  <ControlRow label="Posição do Objeto">
                    <select
                      className="elementor-select"
                      value={obj.object_position || obj.settings?.object_position || obj.style?.objectPosition || 'center center'}
                      onChange={e => {
                        update('object_position', e.target.value)
                        updateWidgetStyle('object_position', e.target.value)
                      }}
                    >
                      <option value="center center">Centro ao centro</option>
                      <option value="top center">Superior ao centro</option>
                      <option value="bottom center">Inferior ao centro</option>
                      <option value="center left">Centro à esquerda</option>
                      <option value="center right">Centro à direita</option>
                      <option value="top left">Superior à esquerda</option>
                      <option value="top right">Superior à direita</option>
                      <option value="bottom left">Inferior à esquerda</option>
                      <option value="bottom right">Inferior à direita</option>
                    </select>
                  </ControlRow>

                  {/* Opacidade */}
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Opacidade</span>
                      <span style={{ fontSize: '11px', color: '#86868b' }}>
                        {obj.opacity !== undefined ? obj.opacity : '1.0'}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1.0"
                      step="0.05"
                      value={parseFloat(String(obj.opacity !== undefined ? obj.opacity : 1.0)) || 1.0}
                      onChange={e => {
                        update('opacity', e.target.value)
                        updateWidgetStyle('opacity', e.target.value)
                      }}
                      style={{ width: '100%', accentColor: '#0071e3', cursor: 'pointer' }}
                    />
                  </div>

                  {/* Arredondamento da Borda (Border Radius) */}
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Arredondamento da Borda (Radius)</span>
                      <span style={{ fontSize: '11px', color: '#86868b' }}>
                        {getVal('border_radius', '12px')}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={parseInt(String(getVal('border_radius', '12')).replace(/[^0-9]/g, ''), 10) || 12}
                        onChange={e => {
                          const val = `${e.target.value}px`
                          updateResponsive('border_radius', val)
                          updateWidgetStyle('border_radius', val)
                        }}
                        style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                      />
                      <div style={{ width: '90px' }}>
                        <StepperNumberInput
                          value={getVal('border_radius', '12px')}
                          onChange={v => {
                            const formatted = v.includes('px') || v.includes('%') ? v : `${v}px`
                            updateResponsive('border_radius', formatted)
                            updateWidgetStyle('border_radius', formatted)
                          }}
                          placeholder="12px"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sombra da Imagem */}
                  <ControlRow label="Sombra da imagem">
                    <ColorControl
                      value={obj.box_shadow || ''}
                      onChange={v => {
                        const shadowVal = v ? `0 8px 24px ${v}` : ''
                        update('box_shadow', shadowVal)
                        updateWidgetStyle('box_shadow', shadowVal)
                      }}
                    />
                  </ControlRow>
                  {/* Máscara de Imagem (Image Mask) */}
                  <ControlRow label="Máscara de Imagem (Mask)">
                    <select
                      className="elementor-select"
                      value={obj.mask_shape || obj.settings?.mask_shape || 'none'}
                      onChange={e => {
                        update('mask_shape', e.target.value)
                        updateWidgetStyle('mask_shape', e.target.value)
                      }}
                    >
                      <option value="none">Nenhuma</option>
                      <option value="circle">Círculo</option>
                      <option value="blob">Blob Orgânico</option>
                      <option value="hexagon">Hexágono</option>
                      <option value="triangle">Triângulo</option>
                      <option value="custom">URL / SVG Personalizado</option>
                    </select>
                  </ControlRow>

                  {(obj.mask_shape === 'custom' || obj.settings?.mask_shape === 'custom') && (
                    <ControlRow label="URL da Máscara SVG">
                      <input
                        className="elementor-input"
                        value={obj.mask_custom_url || obj.settings?.mask_custom_url || ''}
                        onChange={e => {
                          update('mask_custom_url', e.target.value)
                          updateWidgetStyle('mask_custom_url', e.target.value)
                        }}
                        placeholder="https://.../mascara.svg"
                      />
                    </ControlRow>
                  )}
                </AccordionSection>
              )}

              {/* ── TIPOGRAFIA & ESTILOS DE TEXTO DO WIDGET (QUANDO FOR WIDGET DE TEXTO/TÍTULO/BOTÃO) ── */}
              {hasTypography && (
                <AccordionSection
                  title="Título / Tipografia"
                  isOpen={openAccordions.widgetStyle !== false}
                  onToggle={() => toggleAccordion('widgetStyle')}
                >
                  {/* Cor do Texto (Color) */}
                  <ControlRow label="Cor">
                    <ColorControl
                      value={obj.color || obj.settings?.color || obj.style?.color || '#1d1d1f'}
                      onChange={v => {
                        update('color', v)
                        updateWidgetStyle('color', v)
                      }}
                    />
                  </ControlRow>

                  {/* Cor ao passar o mouse (Hover Color) */}
                  <ControlRow label="Cor ao passar o mouse">
                    <ColorControl
                      value={obj.hover_color || obj.settings?.hover_color || ''}
                      onChange={v => {
                        update('hover_color', v)
                        updateWidgetStyle('hover_color', v)
                      }}
                    />
                  </ControlRow>

                  {/* Sombra do texto */}
                  <ControlRow label="Sombra do texto">
                    <ColorControl
                      value={obj.text_shadow_color || ''}
                      onChange={v => {
                        update('text_shadow_color', v)
                        updateWidgetStyle('text_shadow_color', v)
                      }}
                    />
                  </ControlRow>

                  {/* Alinhamento com switcher responsivo */}
                  <ControlRow label="Alinhamento" responsive>
                    <IconGroupSelector
                      value={
                        (viewportMode !== 'desktop' && (obj.responsive?.[viewportMode]?.text_align || obj[`text_align_${viewportMode}`]))
                        || obj.text_align || obj.settings?.text_align || obj.content?.align || obj.content?.text_align || obj.style?.textAlign || 'left'
                      }
                      onChange={v => {
                        updateResponsive('text_align', v)
                        updateWidgetStyle('text_align', v)
                        updateWidgetContent('align', v)
                      }}
                      options={[
                        { value: 'left', icon: <AlignLeft size={13} />, title: 'Alinhar à esquerda' },
                        { value: 'center', icon: <AlignCenter size={13} />, title: 'Centralizar' },
                        { value: 'right', icon: <AlignRight size={13} />, title: 'Alinhar à direita' },
                        { value: 'justify', icon: <AlignJustify size={13} />, title: 'Justificar' },
                      ]}
                    />
                  </ControlRow>

                  {/* Tipografia Trigger Row (Ícone Global 🌐 e Lápis ✏️) */}
                  <div className="elementor-control-row" style={{ alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <span className="elementor-control-label" style={{ fontWeight: 600, color: '#1d1d1f' }}>
                      Tipografia
                    </span>
                    <div className="elementor-typography-trigger-group">
                      <button
                        type="button"
                        className="elementor-typography-trigger-btn"
                        title="Fontes Globais"
                        onClick={() => {
                          update('font_family', 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif')
                          updateWidgetStyle('font_family', 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif')
                        }}
                      >
                        <Globe size={13} />
                      </button>
                      <button
                        type="button"
                        className={`elementor-typography-trigger-btn ${showTypographyPopover ? 'active' : ''}`}
                        title="Editar Tipografia Completa"
                        onClick={() => setShowTypographyPopover(!showTypographyPopover)}
                      >
                        <Edit2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* ── FLOATING / INLINE TYPOGRAPHY POPOVER (LIGHT THEME MATCHING SYSTEM) ── */}
                  {showTypographyPopover && (
                    <div className="elementor-typography-popover">
                      <div className="elementor-typography-popover-header">
                        <span className="elementor-typography-popover-title">Tipografia</span>
                        <div className="elementor-typography-popover-actions">
                          <button
                            type="button"
                            title="Redefinir tipografia"
                            onClick={() => {
                              update('font_family', '')
                              update('font_size', '')
                              update('font_weight', '')
                              update('line_height', '')
                              update('letter_spacing', '')
                              update('text_transform', '')
                              updateWidgetStyle('font_family', '')
                              updateWidgetStyle('font_size', '')
                              updateWidgetStyle('font_weight', '')
                              updateWidgetStyle('line_height', '')
                              updateWidgetStyle('letter_spacing', '')
                              updateWidgetStyle('text_transform', '')
                            }}
                          >
                            <RotateCcw size={12} />
                          </button>
                          <button
                            type="button"
                            title="Fechar"
                            onClick={() => setShowTypographyPopover(false)}
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>

                      {/* Família */}
                      <div className="elementor-control-row">
                        <label className="elementor-control-label">Família</label>
                        <select
                          value={obj.font_family || obj.settings?.font_family || obj.style?.fontFamily || ''}
                          onChange={e => {
                            update('font_family', e.target.value)
                            updateWidgetStyle('font_family', e.target.value)
                          }}
                        >
                          <option value="">Padrão (SF Pro Apple)</option>
                          <option value='Inter, -apple-system, sans-serif'>Inter</option>
                          <option value='Roboto, -apple-system, sans-serif'>Roboto</option>
                          <option value='Outfit, -apple-system, sans-serif'>Outfit</option>
                          <option value='Montserrat, sans-serif'>Montserrat</option>
                          <option value='Poppins, sans-serif'>Poppins</option>
                          <option value='"Plus Jakarta Sans", sans-serif'>Plus Jakarta Sans</option>
                          <option value='system-ui, -apple-system, sans-serif'>System UI</option>
                          <option value='Georgia, serif'>Georgia</option>
                          <option value='"SF Mono", Menlo, monospace'>SF Mono</option>
                        </select>
                      </div>

                      {/* Tamanho */}
                      <div className="elementor-control-row">
                        <div className="elementor-control-label">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>Tamanho</span>
                            <ResponsiveLabelSwitcher />
                          </div>
                          <div style={{ display: 'flex', gap: 2 }}>
                            {(['px', 'rem', 'em', 'vw'] as const).map(u => (
                              <button
                                key={u}
                                type="button"
                                style={{
                                  background: fontSizeUnit === u ? '#0071e3' : '#f5f5f7',
                                  color: fontSizeUnit === u ? '#fff' : '#6e6e73',
                                  border: '1px solid #e5e5ea',
                                  borderRadius: 3,
                                  fontSize: 9,
                                  fontWeight: 600,
                                  padding: '1px 4px',
                                  cursor: 'pointer'
                                }}
                                onClick={() => setFontSizeUnit(u)}
                              >
                                {u}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="range"
                            min="8"
                            max={fontSizeUnit === 'rem' || fontSizeUnit === 'em' ? 8 : (fontSizeUnit === 'vw' ? 10 : 120)}
                            step={fontSizeUnit === 'rem' || fontSizeUnit === 'em' ? '0.1' : '1'}
                            value={parseFloat(String(getVal('font_size', '16')).replace(/[^0-9.]/g, '')) || 16}
                            onChange={e => {
                              const val = `${e.target.value}${fontSizeUnit}`
                              updateResponsive('font_size', val)
                              updateWidgetStyle('font_size', val)
                            }}
                            style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                          />
                          <input
                            type="text"
                            style={{ width: '60px', textAlign: 'center' }}
                            value={getVal('font_size', `16${fontSizeUnit}`)}
                            onChange={e => {
                              const v = e.target.value
                              const formatted = v.includes('px') || v.includes('rem') || v.includes('em') || v.includes('vw') ? v : `${v}${fontSizeUnit}`
                              updateResponsive('font_size', formatted)
                              updateWidgetStyle('font_size', formatted)
                            }}
                          />
                        </div>
                      </div>

                      {/* Peso */}
                      <div className="elementor-control-row">
                        <label className="elementor-control-label">Peso</label>
                        <select
                          value={obj.font_weight || obj.settings?.font_weight || obj.style?.fontWeight || '400'}
                          onChange={e => {
                            update('font_weight', e.target.value)
                            updateWidgetStyle('font_weight', e.target.value)
                          }}
                        >
                          <option value="100">100 (Fininho)</option>
                          <option value="200">200 (Extra Fino)</option>
                          <option value="300">300 (Fino / Light)</option>
                          <option value="400">400 (Normal / Regular)</option>
                          <option value="500">500 (Médio / Medium)</option>
                          <option value="600">600 (Semi-Bold)</option>
                          <option value="700">700 (Negrito / Bold)</option>
                          <option value="800">800 (Extra Bold)</option>
                          <option value="900">900 (Preto / Black)</option>
                        </select>
                      </div>

                      {/* Transformação */}
                      <div className="elementor-control-row">
                        <label className="elementor-control-label">Transformação</label>
                        <select
                          value={obj.text_transform || obj.settings?.text_transform || 'none'}
                          onChange={e => {
                            update('text_transform', e.target.value)
                            updateWidgetStyle('text_transform', e.target.value)
                          }}
                        >
                          <option value="none">Padrão</option>
                          <option value="uppercase">Maiúsculas</option>
                          <option value="lowercase">Minúsculas</option>
                          <option value="capitalize">Capitalizada</option>
                        </select>
                      </div>

                      {/* Estilo */}
                      <div className="elementor-control-row">
                        <label className="elementor-control-label">Estilo</label>
                        <select
                          value={obj.font_style || obj.settings?.font_style || 'normal'}
                          onChange={e => {
                            update('font_style', e.target.value)
                            updateWidgetStyle('font_style', e.target.value)
                          }}
                        >
                          <option value="normal">Padrão (Normal)</option>
                          <option value="italic">Itálico</option>
                          <option value="oblique">Oblíquo</option>
                        </select>
                      </div>

                      {/* Decoração */}
                      <div className="elementor-control-row">
                        <label className="elementor-control-label">Decoração</label>
                        <select
                          value={obj.text_decoration || obj.settings?.text_decoration || 'none'}
                          onChange={e => {
                            update('text_decoration', e.target.value)
                            updateWidgetStyle('text_decoration', e.target.value)
                          }}
                        >
                          <option value="none">Padrão</option>
                          <option value="underline">Sublinhado</option>
                          <option value="line-through">Tachado</option>
                          <option value="overline">Sobrelinha</option>
                        </select>
                      </div>

                      {/* Altura da Linha */}
                      <div className="elementor-control-row">
                        <div className="elementor-control-label">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>Altura da linha</span>
                            <ResponsiveLabelSwitcher />
                          </div>
                          <span className="elementor-unit-badge">em</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="range"
                            min="0.8"
                            max="3.0"
                            step="0.05"
                            value={parseFloat(String(obj.line_height || obj.settings?.line_height || '1.2')) || 1.2}
                            onChange={e => {
                              update('line_height', e.target.value)
                              updateWidgetStyle('line_height', e.target.value)
                            }}
                            style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                          />
                          <input
                            type="text"
                            style={{ width: '60px', textAlign: 'center' }}
                            value={obj.line_height || obj.settings?.line_height || '1.2'}
                            onChange={e => {
                              update('line_height', e.target.value)
                              updateWidgetStyle('line_height', e.target.value)
                            }}
                          />
                        </div>
                      </div>

                      {/* Espaçamento entre Letras */}
                      <div className="elementor-control-row">
                        <div className="elementor-control-label">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>Espaçamento entre letras</span>
                            <ResponsiveLabelSwitcher />
                          </div>
                          <span className="elementor-unit-badge">px</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="range"
                            min="-5"
                            max="20"
                            step="0.5"
                            value={parseFloat(String(obj.letter_spacing || obj.settings?.letter_spacing || '0').replace(/[^0-9.-]/g, '')) || 0}
                            onChange={e => {
                              const val = `${e.target.value}px`
                              update('letter_spacing', val)
                              updateWidgetStyle('letter_spacing', val)
                            }}
                            style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                          />
                          <input
                            type="text"
                            style={{ width: '60px', textAlign: 'center' }}
                            value={obj.letter_spacing || obj.settings?.letter_spacing || '0px'}
                            onChange={e => {
                              const v = e.target.value
                              const formatted = v.includes('px') || v.includes('em') ? v : `${v}px`
                              update('letter_spacing', formatted)
                              updateWidgetStyle('letter_spacing', formatted)
                            }}
                          />
                        </div>
                      </div>

                      {/* Espaçamento entre Palavras */}
                      <div className="elementor-control-row">
                        <div className="elementor-control-label">
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span>Espaçamento entre palavras</span>
                            <ResponsiveLabelSwitcher />
                          </div>
                          <span className="elementor-unit-badge">em</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={parseFloat(String(obj.word_spacing || obj.settings?.word_spacing || '0').replace(/[^0-9.-]/g, '')) || 0}
                            onChange={e => {
                              const val = `${e.target.value}em`
                              update('word_spacing', val)
                              updateWidgetStyle('word_spacing', val)
                            }}
                            style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                          />
                          <input
                            type="text"
                            style={{ width: '60px', textAlign: 'center' }}
                            value={obj.word_spacing || obj.settings?.word_spacing || '0em'}
                            onChange={e => {
                              const v = e.target.value
                              const formatted = v.includes('em') || v.includes('px') ? v : `${v}em`
                              update('word_spacing', formatted)
                              updateWidgetStyle('word_spacing', formatted)
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </AccordionSection>
              )}

              {/* ── PLANO DE FUNDO ── */}
              <AccordionSection
                title="Plano de fundo"
                isOpen={openAccordions.background}
                onToggle={() => toggleAccordion('background')}
              >
                {/* Normal / Ao passar o mouse */}
                <SegmentedTabs
                  active={bgHoverTab}
                  onChange={setBgHoverTab}
                  options={[
                    { value: 'normal', label: 'Normal' },
                    { value: 'hover', label: 'Ao passar o mouse' },
                  ]}
                />

                {/* Tipo de plano de fundo */}
                <ControlRow label="Tipo de plano de fundo">
                  <IconGroupSelector
                    value={obj.bg_type || 'color'}
                    onChange={v => {
                      update('bg_type', v)
                      updateWidgetStyle('bg_type', v)
                    }}
                    options={[
                      { value: 'color', icon: <Paintbrush size={13} />, title: 'Clássico (Cor ou Imagem)' },
                      { value: 'gradient', icon: <svg width="13" height="13" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" fill="none" strokeWidth="2" /><path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" /></svg>, title: 'Gradiente' },
                      { value: 'video', icon: <Video size={13} />, title: 'Vídeo' },
                      { value: 'slideshow', icon: <ImageIcon size={13} />, title: 'Slideshow' },
                    ]}
                  />
                </ControlRow>

                {/* ── 1. CLÁSSICO (COR OU IMAGEM) ── */}
                {(!obj.bg_type || obj.bg_type === 'color') && (
                  <>
                    {/* Cor */}
                    <ControlRow label="Cor">
                      <ColorControl
                        value={obj.bg_color || obj.settings?.bg_color || obj.style?.backgroundColor || ''}
                        onChange={v => {
                          update('bg_color', v)
                          if (item.type === 'widget') {
                            updateWidgetStyle('bg_color', v)
                            updateWidgetStyle('backgroundColor', v)
                          }
                        }}
                      />
                    </ControlRow>

                    {/* Imagem */}
                    <div className="elementor-control-row stacked">
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>Imagem</span>
                          <ResponsiveLabelSwitcher />
                        </div>
                        <button
                          type="button"
                          style={{ background: 'transparent', border: 'none', color: '#ea9cfb', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                          title="Variações com IA"
                          onClick={() => {
                            const randomAssets = [
                              'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
                              'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=1200&auto=format&fit=crop&q=80',
                              'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
                              'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80'
                            ]
                            const next = randomAssets[Math.floor(Math.random() * randomAssets.length)]
                            update('bg_image', next)
                            if (item.type === 'widget') updateWidgetStyle('bg_image', next)
                          }}
                        >
                          <Sparkles size={14} />
                        </button>
                      </div>
                      <ImageThumbnailBox
                        src={obj.bg_image || obj.settings?.bg_image || ''}
                        onChange={url => {
                          update('bg_image', url)
                          if (item.type === 'widget') updateWidgetStyle('bg_image', url)
                        }}
                      />
                    </div>

                    {/* Resolução da imagem */}
                    <ControlRow label="Resolução da imagem">
                      <select
                        className="elementor-select"
                        value={obj.bg_resolution || 'full'}
                        onChange={e => update('bg_resolution', e.target.value)}
                      >
                        <option value="full">Completo</option>
                        <option value="large">Grande (1024x1024)</option>
                        <option value="medium">Médio (300x300)</option>
                        <option value="thumbnail">Miniatura (150x150)</option>
                      </select>
                    </ControlRow>

                    <p className="elementor-note-caption">
                      As configurações de tamanho da imagem não se aplicam a imagens dinâmicas.
                    </p>

                    {/* Posição */}
                    <ControlRow label="Posição" responsive>
                      <select
                        className="elementor-select"
                        value={obj.bg_position || 'center center'}
                        onChange={e => update('bg_position', e.target.value)}
                      >
                        <option value="default">Padrão</option>
                        <option value="center center">Centro ao centro</option>
                        <option value="center left">Centro à esquerda</option>
                        <option value="center right">Centro à direita</option>
                        <option value="top center">Superior ao centro</option>
                        <option value="top left">Superior à esquerda</option>
                        <option value="top right">Superior à direita</option>
                        <option value="bottom center">Inferior ao centro</option>
                        <option value="bottom left">Inferior à esquerda</option>
                        <option value="bottom right">Inferior à direita</option>
                        <option value="custom">Personalizado</option>
                      </select>
                    </ControlRow>

                    {/* Anexo */}
                    <ControlRow label="Anexo">
                      <select
                        className="elementor-select"
                        value={obj.bg_attachment || 'scroll'}
                        onChange={e => update('bg_attachment', e.target.value)}
                      >
                        <option value="scroll">Padrão</option>
                        <option value="fixed">Fixo (Parallax)</option>
                        <option value="local">Rolar</option>
                      </select>
                    </ControlRow>

                    {/* Repetir */}
                    <ControlRow label="Repetir" responsive>
                      <select
                        className="elementor-select"
                        value={obj.bg_repeat || 'no-repeat'}
                        onChange={e => update('bg_repeat', e.target.value)}
                      >
                        <option value="no-repeat">Não repetir</option>
                        <option value="repeat">Repetir</option>
                        <option value="repeat-x">Repetir-x</option>
                        <option value="repeat-y">Repetir-y</option>
                      </select>
                    </ControlRow>

                    {/* Tamanho de exibição */}
                    <ControlRow label="Tamanho de exibição" responsive>
                      <select
                        className="elementor-select"
                        value={obj.bg_size || 'cover'}
                        onChange={e => update('bg_size', e.target.value)}
                      >
                        <option value="cover">Cobertura</option>
                        <option value="contain">Conter</option>
                        <option value="auto">Automático</option>
                        <option value="custom">Personalizado</option>
                      </select>
                    </ControlRow>
                  </>
                )}

                {/* ── 2. GRADIENTE (COR 1, COR 2, ÂNGULO, TIPO) ── */}
                {obj.bg_type === 'gradient' && (
                  <>
                    <ControlRow label="Cor Principal">
                      <ColorControl
                        value={obj.bg_gradient_color1 || '#0071e3'}
                        onChange={v => {
                          const l1 = obj.bg_gradient_loc1 ?? 0
                          const c2 = obj.bg_gradient_color2 || '#000000'
                          const l2 = obj.bg_gradient_loc2 ?? 100
                          const angle = obj.bg_gradient_angle ?? 90
                          const grad = `linear-gradient(${angle}deg, ${v} ${l1}%, ${c2} ${l2}%)`
                          update('bg_gradient_color1', v)
                          update('bg_gradient', grad)
                          if (item.type === 'widget') {
                            updateWidgetStyle('bg_gradient_color1', v)
                            updateWidgetStyle('bg_gradient', grad)
                          }
                        }}
                      />
                    </ControlRow>

                    <SliderRangeControl
                      label="Localização 1"
                      value={obj.bg_gradient_loc1 ?? 0}
                      min={0}
                      max={100}
                      unit="%"
                      onChange={v => {
                        const c1 = obj.bg_gradient_color1 || '#0071e3'
                        const c2 = obj.bg_gradient_color2 || '#000000'
                        const l2 = obj.bg_gradient_loc2 ?? 100
                        const angle = obj.bg_gradient_angle ?? 90
                        const grad = `linear-gradient(${angle}deg, ${c1} ${v}%, ${c2} ${l2}%)`
                        update('bg_gradient_loc1', v)
                        update('bg_gradient', grad)
                        if (item.type === 'widget') {
                          updateWidgetStyle('bg_gradient_loc1', v)
                          updateWidgetStyle('bg_gradient', grad)
                        }
                      }}
                    />

                    <ControlRow label="Segunda Cor">
                      <ColorControl
                        value={obj.bg_gradient_color2 || '#000000'}
                        onChange={v => {
                          const c1 = obj.bg_gradient_color1 || '#0071e3'
                          const l1 = obj.bg_gradient_loc1 ?? 0
                          const l2 = obj.bg_gradient_loc2 ?? 100
                          const angle = obj.bg_gradient_angle ?? 90
                          const grad = `linear-gradient(${angle}deg, ${c1} ${l1}%, ${v} ${l2}%)`
                          update('bg_gradient_color2', v)
                          update('bg_gradient', grad)
                          if (item.type === 'widget') {
                            updateWidgetStyle('bg_gradient_color2', v)
                            updateWidgetStyle('bg_gradient', grad)
                          }
                        }}
                      />
                    </ControlRow>

                    <SliderRangeControl
                      label="Localização 2"
                      value={obj.bg_gradient_loc2 ?? 100}
                      min={0}
                      max={100}
                      unit="%"
                      onChange={v => {
                        const c1 = obj.bg_gradient_color1 || '#0071e3'
                        const l1 = obj.bg_gradient_loc1 ?? 0
                        const c2 = obj.bg_gradient_color2 || '#000000'
                        const angle = obj.bg_gradient_angle ?? 90
                        const grad = `linear-gradient(${angle}deg, ${c1} ${l1}%, ${c2} ${v}%)`
                        update('bg_gradient_loc2', v)
                        update('bg_gradient', grad)
                        if (item.type === 'widget') {
                          updateWidgetStyle('bg_gradient_loc2', v)
                          updateWidgetStyle('bg_gradient', grad)
                        }
                      }}
                    />

                    <ControlRow label="Tipo">
                      <select
                        className="elementor-select"
                        value={obj.bg_gradient_type || 'linear'}
                        onChange={e => {
                          const t = e.target.value
                          const c1 = obj.bg_gradient_color1 || '#0071e3'
                          const l1 = obj.bg_gradient_loc1 ?? 0
                          const c2 = obj.bg_gradient_color2 || '#000000'
                          const l2 = obj.bg_gradient_loc2 ?? 100
                          const angle = obj.bg_gradient_angle ?? 90
                          const grad = t === 'radial'
                            ? `radial-gradient(circle, ${c1} ${l1}%, ${c2} ${l2}%)`
                            : `linear-gradient(${angle}deg, ${c1} ${l1}%, ${c2} ${l2}%)`
                          update('bg_gradient_type', t)
                          update('bg_gradient', grad)
                          if (item.type === 'widget') {
                            updateWidgetStyle('bg_gradient_type', t)
                            updateWidgetStyle('bg_gradient', grad)
                          }
                        }}
                      >
                        <option value="linear">Linear</option>
                        <option value="radial">Radial</option>
                      </select>
                    </ControlRow>

                    {(!obj.bg_gradient_type || obj.bg_gradient_type === 'linear') && (
                      <SliderRangeControl
                        label="Ângulo"
                        value={obj.bg_gradient_angle ?? 90}
                        min={0}
                        max={360}
                        unit="°"
                        onChange={v => {
                          const c1 = obj.bg_gradient_color1 || '#0071e3'
                          const l1 = obj.bg_gradient_loc1 ?? 0
                          const c2 = obj.bg_gradient_color2 || '#000000'
                          const l2 = obj.bg_gradient_loc2 ?? 100
                          const grad = `linear-gradient(${v}deg, ${c1} ${l1}%, ${c2} ${l2}%)`
                          update('bg_gradient_angle', v)
                          update('bg_gradient', grad)
                          if (item.type === 'widget') {
                            updateWidgetStyle('bg_gradient_angle', v)
                            updateWidgetStyle('bg_gradient', grad)
                          }
                        }}
                      />
                    )}

                    {/* Gradient preview swatch */}
                    <div style={{
                      height: 28,
                      borderRadius: 6,
                      border: '1px solid rgba(0,0,0,0.12)',
                      background: obj.bg_gradient || `linear-gradient(${obj.bg_gradient_angle ?? 90}deg, ${obj.bg_gradient_color1 || '#0071e3'} ${obj.bg_gradient_loc1 ?? 0}%, ${obj.bg_gradient_color2 || '#000000'} ${obj.bg_gradient_loc2 ?? 100}%)`,
                      marginTop: 6,
                      marginBottom: 10,
                      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.08)'
                    }} />
                  </>
                )}

                {/* ── 3. VÍDEO (LINK DO VÍDEO, START, END, LOOP, MOBILE FALLBACK) ── */}
                {obj.bg_type === 'video' && (
                  <>
                    <ControlRow label="Formato do Vídeo">
                      <SegmentedTabs
                        active={obj.bg_video_source || 'link'}
                        onChange={v => {
                          update('bg_video_source', v)
                          if (item.type === 'widget') updateWidgetStyle('bg_video_source', v)
                        }}
                        options={[
                          { value: 'link', label: 'Link Externo' },
                          { value: 'upload', label: 'Upload / GIF' },
                        ]}
                      />
                    </ControlRow>

                    {(obj.bg_video_source !== 'upload') ? (
                      <>
                        <ControlRow label="Link do Vídeo">
                          <input
                            className="elementor-input"
                            value={obj.bg_video_url || ''}
                            onChange={e => {
                              update('bg_video_url', e.target.value)
                              if (item.type === 'widget') updateWidgetStyle('bg_video_url', e.target.value)
                            }}
                            placeholder="YouTube, Vimeo ou link MP4..."
                          />
                        </ControlRow>
                        <p className="elementor-note-caption">
                          Insira o link de um vídeo do YouTube/Vimeo ou a URL direta de um arquivo .mp4 hospedado.
                        </p>
                      </>
                    ) : (
                      <div className="elementor-control-row stacked">
                        <div className="elementor-control-label">
                          <span>Vídeo Leve / GIF Animado</span>
                        </div>
                        <ImageThumbnailBox
                          src={obj.bg_video_file || obj.bg_video_url || ''}
                          title="Vídeo ou GIF"
                          onChange={url => {
                            update('bg_video_file', url)
                            update('bg_video_url', url)
                            if (item.type === 'widget') {
                              updateWidgetStyle('bg_video_file', url)
                              updateWidgetStyle('bg_video_url', url)
                            }
                          }}
                        />
                        <p className="elementor-note-caption">
                          Selecione um arquivo de vídeo leve (.mp4 / .webm) ou GIF animado da biblioteca de mídia.
                        </p>
                      </div>
                    )}

                    <ControlRow label="Hora de Início (s)">
                      <StepperNumberInput
                        value={obj.bg_video_start || 0}
                        min={0}
                        max={3600}
                        step={1}
                        className="elementor-input"
                        onChange={v => update('bg_video_start', parseInt(v, 10) || 0)}
                      />
                    </ControlRow>

                    <ControlRow label="Hora de Término (s)">
                      <StepperNumberInput
                        value={obj.bg_video_end || 30}
                        min={0}
                        max={3600}
                        step={1}
                        className="elementor-input"
                        onChange={v => update('bg_video_end', parseInt(v, 10) || 0)}
                      />
                    </ControlRow>

                    <ControlRow label="Repetir (Loop)">
                      <ToggleSwitch
                        checked={obj.bg_video_loop !== false}
                        onChange={v => update('bg_video_loop', v)}
                      />
                    </ControlRow>

                    <ControlRow label="Reproduzir uma vez">
                      <ToggleSwitch
                        checked={!!obj.bg_video_play_once}
                        onChange={v => update('bg_video_play_once', v)}
                      />
                    </ControlRow>

                    {/* Mobile Fallback Image */}
                    <div className="elementor-control-row stacked">
                      <div className="elementor-control-label">
                        <span>Fallback para celular (Imagem)</span>
                      </div>
                      <ImageThumbnailBox
                        src={obj.bg_video_fallback || obj.bg_image || ''}
                        onChange={url => {
                          update('bg_video_fallback', url)
                          update('bg_image', url)
                          if (item.type === 'widget') updateWidgetStyle('bg_image', url)
                        }}
                      />
                      <p className="elementor-note-caption">
                        Esta imagem de capa substituirá o vídeo em dispositivos móveis e conexões lentas.
                      </p>
                    </div>
                  </>
                )}

                {/* ── 4. SLIDESHOW (GALERIA DE IMAGENS, DURAÇÃO, TRANSIÇÃO) ── */}
                {obj.bg_type === 'slideshow' && (
                  <>
                    <div className="elementor-control-row stacked">
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Imagens do Slideshow</span>
                        <button
                          type="button"
                          style={{ background: 'transparent', border: 'none', color: '#ea9cfb', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                          title="Inserir imagens com IA"
                          onClick={() => {
                            const sampleImages = 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80, https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=1200&q=80, https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80'
                            update('bg_slideshow_images', sampleImages)
                            update('bg_image', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&q=80')
                          }}
                        >
                          <Sparkles size={14} />
                        </button>
                      </div>
                      <ImageThumbnailBox
                        src={obj.bg_image || (typeof obj.bg_slideshow_images === 'string' ? obj.bg_slideshow_images.split(',')[0]?.trim() : '') || ''}
                        onChange={url => {
                          update('bg_image', url)
                          update('bg_slideshow_images', url)
                        }}
                      />
                    </div>

                    <SliderRangeControl
                      label="Duração do Slide"
                      value={obj.bg_slideshow_duration || 5000}
                      min={1000}
                      max={10000}
                      step={500}
                      unit="ms"
                      onChange={v => update('bg_slideshow_duration', v)}
                    />

                    <ControlRow label="Transição">
                      <select
                        className="elementor-select"
                        value={obj.bg_slideshow_transition || 'fade'}
                        onChange={e => update('bg_slideshow_transition', e.target.value)}
                      >
                        <option value="fade">Fade</option>
                        <option value="slide_right">Deslizar para a Direita</option>
                        <option value="slide_left">Deslizar para a Esquerda</option>
                        <option value="slide_up">Deslizar para Cima</option>
                        <option value="slide_down">Deslizar para Baixo</option>
                        <option value="ken_burns">Ken Burns (Zoom Suave)</option>
                      </select>
                    </ControlRow>

                    <SliderRangeControl
                      label="Duração da Transição"
                      value={obj.bg_slideshow_transition_duration || 500}
                      min={200}
                      max={3000}
                      step={100}
                      unit="ms"
                      onChange={v => update('bg_slideshow_transition_duration', v)}
                    />

                    <ControlRow label="Tamanho de exibição">
                      <select
                        className="elementor-select"
                        value={obj.bg_slideshow_size || 'cover'}
                        onChange={e => update('bg_slideshow_size', e.target.value)}
                      >
                        <option value="cover">Cobertura</option>
                        <option value="contain">Conter</option>
                        <option value="auto">Automático</option>
                      </select>
                    </ControlRow>
                  </>
                )}

                {/* Scrolling Effects */}
                <ControlRow label="Scrolling Effects">
                  <ToggleSwitch
                    checked={!!obj.scrolling_effects}
                    onChange={v => update('scrolling_effects', v)}
                  />
                </ControlRow>

                {/* Mouse Effects */}
                <ControlRow label="Mouse Effects">
                  <ToggleSwitch
                    checked={!!obj.mouse_effects}
                    onChange={v => update('mouse_effects', v)}
                  />
                </ControlRow>
              </AccordionSection>

              {/* ── SOBREPOSIÇÃO DE FUNDO ── */}
              <AccordionSection
                title="Sobreposição de fundo"
                isOpen={openAccordions.overlay}
                onToggle={() => toggleAccordion('overlay')}
              >
                <ControlRow label="Cor">
                  <ColorControl
                    value={obj.bg_overlay || ''}
                    onChange={v => update('bg_overlay', v)}
                  />
                </ControlRow>
                <ControlRow label="Opacidade">
                  <input
                    className="elementor-input"
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={obj.bg_opacity !== undefined ? String(obj.bg_opacity) : '0.5'}
                    onChange={e => update('bg_opacity', parseFloat(e.target.value))}
                  />
                </ControlRow>
              </AccordionSection>

              {/* ── BORDA ── */}
              <AccordionSection
                title="Borda"
                isOpen={openAccordions.border}
                onToggle={() => toggleAccordion('border')}
              >
                <ControlRow label="Tipo de borda">
                  <select
                    className="elementor-select"
                    value={obj.border_style || obj.border_type || 'none'}
                    onChange={e => {
                      update('border_style', e.target.value)
                      update('border_type', e.target.value)
                    }}
                  >
                    <option value="none">Nenhuma</option>
                    <option value="solid">Sólida</option>
                    <option value="double">Dupla</option>
                    <option value="dashed">Tracejada</option>
                    <option value="dotted">Pontilhada</option>
                  </select>
                </ControlRow>

                <DimensionsFourControl
                  label="Largura da borda"
                  top={obj.border_width_top || '0'}
                  right={obj.border_width_right || '0'}
                  bottom={obj.border_width_bottom || '0'}
                  left={obj.border_width_left || '0'}
                  onChange={(side, val) => update(`border_width_${side}`, val)}
                />

                <ControlRow label="Cor da borda">
                  <ColorControl
                    value={obj.border_color || ''}
                    onChange={v => update('border_color', v)}
                  />
                </ControlRow>

                <DimensionsFourControl
                  label="Raio da borda (Border Radius)"
                  top={obj.border_radius_top || obj.border_radius || '0'}
                  right={obj.border_radius_right || obj.border_radius || '0'}
                  bottom={obj.border_radius_bottom || obj.border_radius || '0'}
                  left={obj.border_radius_left || obj.border_radius || '0'}
                  onChange={(side, val) => {
                    update(`border_radius_${side}`, val)
                    update('border_radius', val)
                  }}
                />
              </AccordionSection>

              {/* ── DIVISOR DE FORMA ── */}
              <AccordionSection
                title="Divisor de forma"
                isOpen={openAccordions.shape}
                onToggle={() => toggleAccordion('shape')}
              >
                <ControlRow label="Tipo superior">
                  <select
                    className="elementor-select"
                    value={obj.shape_divider_top || 'none'}
                    onChange={e => update('shape_divider_top', e.target.value)}
                  >
                    <option value="none">Nenhum</option>
                    <option value="waves">Ondas</option>
                    <option value="curve">Curva</option>
                    <option value="tilt">Inclinação</option>
                  </select>
                </ControlRow>
              </AccordionSection>
            </>
          )}

          {/* ============================================================
              TAB 3: ADVANCED
             ============================================================ */}
          {tab === 'advanced' && (
            <>
              {/* ── LAYOUT ── */}
              <AccordionSection
                title="Layout"
                isOpen={openAccordions.layout}
                onToggle={() => toggleAccordion('layout')}
              >
                {/* Margem: 4 inputs conectados + [ 🔗 ] */}
                <DimensionsFourControl
                  label="Margem"
                  responsive
                  top={getVal('margin_top', '0')}
                  right={getVal('margin_right', '0')}
                  bottom={getVal('margin_bottom', '0')}
                  left={getVal('margin_left', '0')}
                  onChange={(side, val) => {
                    updateResponsive(`margin_${side}`, val)
                  }}
                />

                {/* Preenchimento: 4 inputs conectados + [ 🔗 ] */}
                <DimensionsFourControl
                  label="Preenchimento"
                  responsive
                  top={getVal('padding_top', '0')}
                  right={getVal('padding_right', '0')}
                  bottom={getVal('padding_bottom', '0')}
                  left={getVal('padding_left', '0')}
                  onChange={(side, val) => {
                    updateResponsive(`padding_${side}`, val)
                  }}
                />

                {/* Alinhar-se: 4 vetores SVG */}
                <ControlRow label="Alinhar-se" responsive>
                  <IconGroupSelector
                    value={obj.align_self || 'auto'}
                    onChange={v => update('align_self', v)}
                    options={[
                      { value: 'auto', title: 'Auto', icon: <svg width="13" height="13" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" strokeWidth="2" /><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" /></svg> },
                      { value: 'flex-start', title: 'Início', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 8v10M8 8v6M12 8v8" stroke="currentColor" strokeWidth="2.5" /></svg> },
                      { value: 'center', title: 'Centro', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 12h16M6 7v10M10 9v6M14 8v8" stroke="currentColor" strokeWidth="2.5" /></svg> },
                      { value: 'flex-end', title: 'Fim', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 20h16M4 6v10M8 10v6M12 8v8" stroke="currentColor" strokeWidth="2.5" /></svg> },
                      { value: 'stretch', title: 'Esticar', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4h16M4 20h16M8 4v16M16 4v16" stroke="currentColor" strokeWidth="2.5" /></svg> },
                    ]}
                  />
                </ControlRow>
                <p className="elementor-note-caption">
                  Este controle afetará apenas os elementos contidos.
                </p>

                {/* Ordem: 3 vetores SVG */}
                <ControlRow label="Ordem" responsive>
                  <IconGroupSelector
                    value={obj.order_mode || 'start'}
                    onChange={v => update('order_mode', v)}
                    options={[
                      { value: 'start', title: 'Início', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 4v16M20 12H8m0 0l4-4m-4 4l4 4" stroke="currentColor" strokeWidth="2.5" fill="none" /></svg> },
                      { value: 'end', title: 'Fim', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M20 4v16M4 12h12m0 0l-4-4m4 4l-4 4" stroke="currentColor" strokeWidth="2.5" fill="none" /></svg> },
                      { value: 'custom', title: 'Personalizado', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 5v9M12 18h.01" stroke="currentColor" strokeWidth="3" /></svg> },
                    ]}
                  />
                </ControlRow>
                <p className="elementor-note-caption">
                  Este controle afetará apenas os elementos contidos.
                </p>

                {/* Tamanho: 4 vetores SVG */}
                <ControlRow label="Tamanho" responsive>
                  <IconGroupSelector
                    value={obj.size_mode || 'default'}
                    onChange={v => update('size_mode', v)}
                    options={[
                      { value: 'default', title: 'Padrão', icon: <svg width="13" height="13" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke="currentColor" fill="none" strokeWidth="2" /><line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" /></svg> },
                      { value: 'full', title: 'Total (100%)', icon: <MoveHorizontal size={13} /> },
                      { value: 'inline', title: 'Linha', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M4 12h16M8 8l-4 4 4 4M16 8l4 4-4 4" stroke="currentColor" strokeWidth="2" fill="none" /></svg> },
                      { value: 'custom', title: 'Personalizado', icon: <svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 5v9M12 18h.01" stroke="currentColor" strokeWidth="3" /></svg> },
                    ]}
                  />
                </ControlRow>

                {/* Posição */}
                <ControlRow label="Posição" responsive>
                  <select
                    className="elementor-select"
                    value={getVal('position', 'static')}
                    onChange={e => updateResponsive('position', e.target.value)}
                  >
                    <option value="static">Padrão</option>
                    <option value="relative">Relativa</option>
                    <option value="absolute">Absoluta</option>
                    <option value="fixed">Fixa (Viewport / Flutuante)</option>
                    <option value="sticky">Aderente (Sticky no Container)</option>
                  </select>
                </ControlRow>

                {/* Coordenadas de Posicionamento Fixo ou Absoluto */}
                {(getVal('position', '') === 'fixed' || getVal('position', '') === 'absolute') && (
                  <>
                    <div style={{ background: '#1c2128', padding: '10px 12px', borderRadius: 6, margin: '8px 0', border: '1px solid #30363d' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: '#58a6ff', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Coordenadas de Posicionamento ({getVal('position', '') === 'fixed' ? 'Fixed Viewport' : 'Absolute'})</span>
                        <ResponsiveLabelSwitcher />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <label style={{ fontSize: '10px', color: '#8b949e', display: 'block', marginBottom: 2 }}>Superior (Top)</label>
                          <input
                            className="elementor-input"
                            value={getVal('top', '')}
                            onChange={e => updateResponsive('top', e.target.value)}
                            placeholder="ex: 20px ou auto"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: '#8b949e', display: 'block', marginBottom: 2 }}>Direita (Right)</label>
                          <input
                            className="elementor-input"
                            value={getVal('right', '')}
                            onChange={e => updateResponsive('right', e.target.value)}
                            placeholder="ex: 24px"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: '#8b949e', display: 'block', marginBottom: 2 }}>Inferior (Bottom)</label>
                          <input
                            className="elementor-input"
                            value={getVal('bottom', '')}
                            onChange={e => updateResponsive('bottom', e.target.value)}
                            placeholder="ex: 24px"
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: '#8b949e', display: 'block', marginBottom: 2 }}>Esquerda (Left)</label>
                          <input
                            className="elementor-input"
                            value={getVal('left', '')}
                            onChange={e => updateResponsive('left', e.target.value)}
                            placeholder="ex: 20px"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Sticky Position Offset */}
                {getVal('position', '') === 'sticky' && (
                  <ControlRow label="Distância do Topo (Offset)" responsive>
                    <input
                      className="elementor-input"
                      value={getVal('top', '20px')}
                      onChange={e => updateResponsive('top', e.target.value)}
                      placeholder="20px"
                    />
                  </ControlRow>
                )}

                {/* Z-Index */}
                <ControlRow label="Z-Index" responsive>
                  <input
                    className="elementor-input"
                    type="number"
                    value={getVal('z_index', '')}
                    onChange={e => updateResponsive('z_index', parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </ControlRow>

                {/* ID CSS */}
                <ControlRow label="ID CSS">
                  <input
                    className="elementor-input"
                    value={obj.css_id || ''}
                    onChange={e => update('css_id', e.target.value)}
                    placeholder="meu-id"
                  />
                </ControlRow>

                {/* Classes CSS */}
                <ControlRow label="Classes CSS">
                  <input
                    className="elementor-input"
                    value={obj.css_class || ''}
                    onChange={e => update('css_class', e.target.value)}
                    placeholder="classe-1 classe-2"
                  />
                </ControlRow>

                {/* Display Conditions */}
                <ControlRow label="Display Conditions">
                  <button type="button" className="elementor-icon-btn" title="Condições de exibição">
                    <GitBranch size={13} />
                  </button>
                </ControlRow>
              </AccordionSection>

              {/* ── EFEITOS DE MOVIMENTO (MOTION EFFECTS) ── */}
              <AccordionSection
                title="Efeitos de movimento"
                isOpen={openAccordions.motion}
                onToggle={() => toggleAccordion('motion')}
              >
                <ControlRow label="Animação de entrada">
                  <select
                    className="elementor-select"
                    value={obj.animation_entrance || obj.animation_type || 'none'}
                    onChange={e => {
                      update('animation_entrance', e.target.value)
                      update('animation_type', e.target.value)
                    }}
                  >
                    <option value="none">Nenhuma</option>
                    <optgroup label="Fading (Desvanecer)">
                      <option value="fadeIn">Fade In</option>
                      <option value="fadeInUp">Fade In Up</option>
                      <option value="fadeInDown">Fade In Down</option>
                      <option value="fadeInLeft">Fade In Left</option>
                      <option value="fadeInRight">Fade In Right</option>
                    </optgroup>
                    <optgroup label="Sliding (Deslizar)">
                      <option value="slideInUp">Slide In Up</option>
                      <option value="slideInDown">Slide In Down</option>
                      <option value="slideInLeft">Slide In Left</option>
                      <option value="slideInRight">Slide In Right</option>
                    </optgroup>
                    <optgroup label="Zoom">
                      <option value="zoomIn">Zoom In</option>
                      <option value="zoomOut">Zoom Out</option>
                    </optgroup>
                    <optgroup label="Especiais">
                      <option value="bounceIn">Bounce In</option>
                      <option value="rotateIn">Rotate In</option>
                      <option value="flipInX">Flip In X</option>
                      <option value="flipInY">Flip In Y</option>
                      <option value="rollIn">Roll In</option>
                    </optgroup>
                  </select>
                </ControlRow>

                <ControlRow label="Duração da animação">
                  <input
                    className="elementor-input"
                    value={obj.animation_duration || '800ms'}
                    onChange={e => update('animation_duration', e.target.value)}
                    placeholder="800ms ou slow, normal, fast"
                  />
                </ControlRow>

                <ControlRow label="Atraso / Delay">
                  <input
                    className="elementor-input"
                    value={obj.animation_delay || '0ms'}
                    onChange={e => update('animation_delay', e.target.value)}
                    placeholder="200ms"
                  />
                </ControlRow>

                {/* Rolagem Vertical / Parallax */}
                <ControlRow label="Efeito Parallax / Rolagem">
                  <ToggleSwitch
                    checked={!!obj.vertical_scroll}
                    onChange={v => update('vertical_scroll', v)}
                  />
                </ControlRow>

                {obj.vertical_scroll && (
                  <>
                    <ControlRow label="Direção do Parallax">
                      <select
                        className="elementor-select"
                        value={obj.vertical_scroll_dir || 'up'}
                        onChange={e => update('vertical_scroll_dir', e.target.value)}
                      >
                        <option value="up">Para Cima</option>
                        <option value="down">Para Baixo</option>
                      </select>
                    </ControlRow>
                    <ControlRow label="Velocidade (1 a 10)">
                      <input
                        className="elementor-input"
                        type="number"
                        min="1"
                        max="10"
                        value={obj.vertical_scroll_speed ?? 4}
                        onChange={e => update('vertical_scroll_speed', parseInt(e.target.value) || 4)}
                      />
                    </ControlRow>
                  </>
                )}

                {/* Efeito Mouse Tilt 3D */}
                <ControlRow label="Efeito Mouse Tilt 3D">
                  <ToggleSwitch
                    checked={!!obj.mouse_tilt}
                    onChange={v => update('mouse_tilt', v)}
                  />
                </ControlRow>

                {/* Opacidade ao Rolar */}
                <ControlRow label="Opacidade ao Rolar">
                  <ToggleSwitch
                    checked={!!obj.opacity_scroll}
                    onChange={v => update('opacity_scroll', v)}
                  />
                </ControlRow>

                {/* Escala ao Rolar */}
                <ControlRow label="Escala ao Rolar">
                  <ToggleSwitch
                    checked={!!obj.scale_scroll}
                    onChange={v => update('scale_scroll', v)}
                  />
                </ControlRow>
              </AccordionSection>

              {/* ── STICKY HEADER EFFECTS (PRO) ── */}
              <AccordionSection
                title="Sticky Header Effects"
                proBadge
                isOpen={openAccordions.sticky}
                onToggle={() => toggleAccordion('sticky')}
              >
                <ControlRow label="Ativar Header Fixo (Sticky)">
                  <ToggleSwitch
                    checked={obj.sticky_header !== false && obj.sticky_header !== undefined ? !!obj.sticky_header : true}
                    onChange={v => update('sticky_header', v)}
                  />
                </ControlRow>

                <ControlRow label="Distância para ativar (Offset px)">
                  <input
                    type="number"
                    className="elementor-input"
                    value={obj.sticky_offset ?? 0}
                    onChange={e => update('sticky_offset', parseInt(e.target.value) || 0)}
                    placeholder="0px (Imediato)"
                  />
                </ControlRow>

                <ControlRow label="Efeito de Transição">
                  <select
                    className="elementor-select"
                    value={obj.sticky_effect || 'fade'}
                    onChange={e => update('sticky_effect', e.target.value)}
                  >
                    <option value="immediate">Imediato (Sem animação)</option>
                    <option value="fade">Fade suave</option>
                    <option value="slide">Slide Down do topo</option>
                  </select>
                </ControlRow>

                <ControlRow label="Aparecer ao rolar para cima">
                  <ToggleSwitch
                    checked={!!obj.sticky_on_scroll_up}
                    onChange={v => update('sticky_on_scroll_up', v)}
                  />
                </ControlRow>

                <ControlRow label="Efeito Blur Translúcido">
                  <ToggleSwitch
                    checked={obj.sticky_blur !== false}
                    onChange={v => update('sticky_blur', v)}
                  />
                </ControlRow>

                <ControlRow label="Dispositivos Ativos">
                  <div style={{ display: 'flex', gap: 6, fontSize: '11px', color: '#c9d1d9' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={obj.sticky_desktop !== false}
                        onChange={e => update('sticky_desktop', e.target.checked)}
                      />
                      Desktop
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={obj.sticky_tablet !== false}
                        onChange={e => update('sticky_tablet', e.target.checked)}
                      />
                      Tablet
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={obj.sticky_mobile !== false}
                        onChange={e => update('sticky_mobile', e.target.checked)}
                      />
                      Mobile
                    </label>
                  </div>
                </ControlRow>
              </AccordionSection>

              {/* ── TRANSFORMAR ── */}
              <AccordionSection
                title="Transformar"
                isOpen={openAccordions.transform}
                onToggle={() => toggleAccordion('transform')}
              >
                <ControlRow label="Girar (Rotate)" responsive>
                  <input
                    className="elementor-input"
                    value={getVal('transform_rotate', '')}
                    onChange={e => updateResponsive('transform_rotate', e.target.value)}
                    placeholder="ex: 45deg"
                  />
                </ControlRow>
                <ControlRow label="Escala (Scale)" responsive>
                  <input
                    className="elementor-input"
                    value={getVal('transform_scale', '')}
                    onChange={e => updateResponsive('transform_scale', e.target.value)}
                    placeholder="ex: 1.05"
                  />
                </ControlRow>
                <ControlRow label="Translação X (Translate X)" responsive>
                  <input
                    className="elementor-input"
                    value={getVal('transform_translate_x', '')}
                    onChange={e => updateResponsive('transform_translate_x', e.target.value)}
                    placeholder="ex: 10px"
                  />
                </ControlRow>
                <ControlRow label="Translação Y (Translate Y)" responsive>
                  <input
                    className="elementor-input"
                    value={getVal('transform_translate_y', '')}
                    onChange={e => updateResponsive('transform_translate_y', e.target.value)}
                    placeholder="ex: -10px"
                  />
                </ControlRow>
              </AccordionSection>

              {/* ── RESPONSIVO ── */}
              <AccordionSection
                title="Responsivo (Visibilidade)"
                isOpen={openAccordions.responsive}
                onToggle={() => toggleAccordion('responsive')}
              >
                <ControlRow label="Ocultar no Desktop">
                  <ToggleSwitch
                    checked={!!(obj.hide_desktop || obj.hide_on_desktop)}
                    onChange={v => {
                      update('hide_desktop', v)
                      update('hide_on_desktop', v)
                    }}
                  />
                </ControlRow>
                <ControlRow label="Ocultar no Tablet">
                  <ToggleSwitch
                    checked={!!(obj.hide_tablet || obj.hide_on_tablet)}
                    onChange={v => {
                      update('hide_tablet', v)
                      update('hide_on_tablet', v)
                    }}
                  />
                </ControlRow>
                <ControlRow label="Ocultar no Mobile">
                  <ToggleSwitch
                    checked={!!(obj.hide_mobile || obj.hide_on_mobile)}
                    onChange={v => {
                      update('hide_mobile', v)
                      update('hide_on_mobile', v)
                    }}
                  />
                </ControlRow>
              </AccordionSection>

              {/* ── CUSTOM CSS ── */}
              <AccordionSection
                title="Custom CSS (Escopado)"
                isOpen={openAccordions.customCss}
                onToggle={() => toggleAccordion('customCss')}
              >
                <div className="elementor-control-row stacked">
                  <span className="elementor-control-label">Adicionar CSS Personalizado</span>
                  <p style={{ fontSize: '11px', color: '#8b949e', margin: '4px 0 8px 0', lineHeight: '1.4' }}>
                    Use <code>selector &#123; ... &#125;</code> para aplicar estilos isolados apenas neste elemento.
                  </p>
                  <textarea
                    className="elementor-textarea"
                    value={obj.custom_css || ''}
                    onChange={e => update('custom_css', e.target.value)}
                    placeholder="selector { color: #0071e3; border: 1px solid #0071e3; }"
                    rows={4}
                  />
                </div>
              </AccordionSection>
            </>
          )}

          {/* ── 4. FOOTER HELP ── */}
          <div className="elementor-inspector-footer">
            <span>Preciso de ajuda</span>
            <HelpCircle size={14} />
          </div>
        </div>
      </div>
    </ViewportContext.Provider>
  )
}

// ============================================================
// ELEMENTOR 1:1 REUSABLE UI PRIMITIVES (100% SVG VECTORS)
// ============================================================

function AccordionSection({
  title, children, isOpen, onToggle, proBadge
}: {
  title: string
  children: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  proBadge?: boolean
}) {
  return (
    <div className="inspector-accordion">
      <button className="inspector-accordion-header" onClick={onToggle} type="button">
        <div className="accordion-title-left">
          <span className={`accordion-arrow ${isOpen ? 'open' : ''}`}>
            <ChevronRight size={12} />
          </span>
          <span>{title}</span>
        </div>
        {proBadge && <span className="accordion-pro-badge">PRO</span>}
      </button>
      {isOpen && <div className="inspector-accordion-content">{children}</div>}
    </div>
  )
}

function ControlRow({
  label, children, responsive, stacked
}: {
  label: string
  children: React.ReactNode
  responsive?: boolean
  stacked?: boolean
}) {
  return (
    <div className={`elementor-control-row ${stacked ? 'stacked' : ''}`}>
      <div className="elementor-control-label">
        <span>{label}</span>
        {responsive && <ResponsiveLabelSwitcher />}
      </div>
      <div className={`elementor-control-field ${stacked ? 'full-width' : ''}`}>
        {children}
      </div>
    </div>
  )
}

function ResponsiveLabelSwitcher() {
  const { viewportMode, onViewportChange } = React.useContext(ViewportContext)
  return (
    <div className="responsive-label-switcher">
      <button
        type="button"
        className={`responsive-mini-btn ${viewportMode === 'desktop' ? 'active' : ''}`}
        onClick={e => { e.stopPropagation(); onViewportChange?.('desktop') }}
        title="Desktop (100%)"
      >
        <Monitor size={10} />
      </button>
      <button
        type="button"
        className={`responsive-mini-btn ${viewportMode === 'tablet' ? 'active' : ''}`}
        onClick={e => { e.stopPropagation(); onViewportChange?.('tablet') }}
        title="Tablet (768px)"
      >
        <Tablet size={10} />
      </button>
      <button
        type="button"
        className={`responsive-mini-btn ${viewportMode === 'mobile' ? 'active' : ''}`}
        onClick={e => { e.stopPropagation(); onViewportChange?.('mobile') }}
        title="Mobile (375px)"
      >
        <Smartphone size={10} />
      </button>
    </div>
  )
}

function SegmentedTabs({
  active, onChange, options
}: {
  active: string
  onChange: (val: any) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="elementor-segmented-tabs">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`elementor-segmented-btn ${active === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function IconGroupSelector({
  value, onChange, options
}: {
  value: string
  onChange: (val: string) => void
  options: { value: string; icon: React.ReactNode; title?: string }[]
}) {
  return (
    <div className="elementor-icon-group">
      {options.map(opt => (
        <button
          key={opt.value}
          type="button"
          className={`elementor-icon-btn ${value === opt.value ? 'active' : ''}`}
          onClick={() => onChange(opt.value)}
          title={opt.title}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  )
}

function ColorControl({
  value, onChange
}: {
  value: string
  onChange: (val: string) => void
}) {
  return (
    <div className="elementor-color-control">
      <button type="button" className="elementor-global-btn" title="Cores Globais do Tema">
        <Globe size={13} />
      </button>
      <div className="elementor-color-swatch-box" title="Escolher cor">
        {value ? (
          <div className="elementor-color-preview-fill" style={{ background: value }} />
        ) : (
          <div className="elementor-color-transparent-line" />
        )}
        <input
          type="color"
          className="elementor-color-picker-input"
          value={value && value.startsWith('#') ? value : '#000000'}
          onChange={e => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

function ImageThumbnailBox({
  src, onChange, title = 'Imagem'
}: {
  src: string
  onChange: (url: string) => void
  title?: string
}) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="elementor-control-media-box">
      <div
        className="elementor-control-media__preview"
        onClick={() => setShowModal(true)}
        title="Clique para escolher uma imagem da biblioteca"
      >
        {src ? (
          <div className="elementor-control-media__filled">
            <img src={src} alt="Preview" className="elementor-control-media__image" />
            <div className="elementor-control-media__overlay-actions" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="elementor-control-media__action-btn"
                onClick={() => setShowModal(true)}
                title="Alterar mídia"
              >
                <Edit2 size={12} />
                <span>Alterar</span>
              </button>
              <button
                type="button"
                className="elementor-control-media__action-btn delete"
                onClick={() => onChange('')}
                title="Remover imagem"
              >
                <Trash2 size={12} />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="elementor-control-media__empty-btn" title="Inserir mídia">
            <Plus size={20} strokeWidth={2.5} />
          </div>
        )}
      </div>

      <MediaLibraryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelectMedia={(url) => {
          onChange(url)
          setShowModal(false)
        }}
        title={`Inserir ${title}`}
      />
    </div>
  )
}

function DimensionsFourControl({
  label, top, right, bottom, left, onChange, responsive
}: {
  label: string
  top: string
  right: string
  bottom: string
  left: string
  onChange: (side: 'top' | 'right' | 'bottom' | 'left', val: string) => void
  responsive?: boolean
}) {
  const [linked, setLinked] = useState(true)

  const handleValChange = (side: 'top' | 'right' | 'bottom' | 'left', val: string) => {
    if (linked) {
      onChange('top', val)
      onChange('right', val)
      onChange('bottom', val)
      onChange('left', val)
    } else {
      onChange(side, val)
    }
  }

  return (
    <div className="elementor-dimensions-control">
      <div className="dimensions-header-row">
        <div className="elementor-control-label">
          <span>{label}</span>
          {responsive && <ResponsiveLabelSwitcher />}
        </div>
        <span className="dimensions-unit-tag">px ▾</span>
      </div>

      <div className="dimensions-boxes-row">
        <div className="dimension-single-box">
          <StepperNumberInput
            className="dimension-input"
            value={top}
            onChange={v => handleValChange('top', v)}
          />
          <span className="dimension-box-caption">Superior</span>
        </div>

        <div className="dimension-single-box">
          <StepperNumberInput
            className="dimension-input"
            value={right}
            onChange={v => handleValChange('right', v)}
          />
          <span className="dimension-box-caption">Direita</span>
        </div>

        <div className="dimension-single-box">
          <StepperNumberInput
            className="dimension-input"
            value={bottom}
            onChange={v => handleValChange('bottom', v)}
          />
          <span className="dimension-box-caption">Inferior</span>
        </div>

        <div className="dimension-single-box">
          <StepperNumberInput
            className="dimension-input"
            value={left}
            onChange={v => handleValChange('left', v)}
          />
          <span className="dimension-box-caption">Esquerda</span>
        </div>

        <button
          type="button"
          className={`dimension-link-btn ${linked ? 'linked' : ''}`}
          onClick={() => setLinked(!linked)}
          title={linked ? 'Valores vinculados' : 'Valores independentes'}
        >
          {linked ? <Link size={12} /> : <Unlink size={12} />}
        </button>
      </div>
    </div>
  )
}

function GapsTwoControl({
  label, colValue, rowValue, onChange, responsive
}: {
  label: string
  colValue: string
  rowValue: string
  onChange: (col: string, row: string) => void
  responsive?: boolean
}) {
  const [linked, setLinked] = useState(true)

  const handleValChange = (side: 'col' | 'row', val: string) => {
    if (linked) {
      onChange(val, val)
    } else if (side === 'col') {
      onChange(val, rowValue)
    } else {
      onChange(colValue, val)
    }
  }

  return (
    <div className="elementor-gaps-control">
      <div className="dimensions-header-row">
        <div className="elementor-control-label">
          <span>{label}</span>
          {responsive && <ResponsiveLabelSwitcher />}
        </div>
        <span className="dimensions-unit-tag">px ▾</span>
      </div>

      <div className="gaps-boxes-row">
        <div className="gaps-single-box">
          <StepperNumberInput
            className="gaps-input"
            value={colValue}
            onChange={v => handleValChange('col', v)}
          />
          <span className="gaps-box-caption">Coluna</span>
        </div>

        <div className="gaps-single-box">
          <StepperNumberInput
            className="gaps-input"
            value={rowValue}
            onChange={v => handleValChange('row', v)}
          />
          <span className="gaps-box-caption">Linha</span>
        </div>

        <button
          type="button"
          className={`dimension-link-btn ${linked ? 'linked' : ''}`}
          onClick={() => setLinked(!linked)}
          title={linked ? 'Valores vinculados' : 'Valores independentes'}
        >
          {linked ? <Link size={12} /> : <Unlink size={12} />}
        </button>
      </div>
    </div>
  )
}

function StepperNumberInput({
  value,
  onChange,
  className = 'dimension-input',
  min = 0,
  max = 9999,
  step = 1,
  placeholder
}: {
  value: string | number
  onChange: (val: string) => void
  className?: string
  min?: number
  max?: number
  step?: number
  placeholder?: string
}) {
  const numVal = parseFloat(String(value)) || 0

  const increment = (delta: number) => {
    const next = Math.max(min, Math.min(max, numVal + delta))
    onChange(String(next))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      increment(e.shiftKey ? step * 10 : step)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      increment(e.shiftKey ? -(step * 10) : -step)
    }
  }

  return (
    <div className="stepper-input-container">
      <input
        type="text"
        className={className}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
      />
      <div className="stepper-buttons-col">
        <button
          type="button"
          tabIndex={-1}
          className="stepper-btn up"
          onClick={() => increment(step)}
          title="Aumentar (Seta Cima / ArrowUp)"
        >
          ▲
        </button>
        <button
          type="button"
          tabIndex={-1}
          className="stepper-btn down"
          onClick={() => increment(-step)}
          title="Diminuir (Seta Baixo / ArrowDown)"
        >
          ▼
        </button>
      </div>
    </div>
  )
}

function ToggleSwitch({
  checked, onChange
}: {
  checked: boolean
  onChange: (val: boolean) => void
}) {
  return (
    <div
      className={`elementor-toggle-switch-wrapper ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    >
      <div className="elementor-switch-track">
        <div className="elementor-switch-thumb" />
      </div>
      <span className="elementor-switch-state-text">{checked ? 'On' : 'Off'}</span>
    </div>
  )
}

function SliderRangeControl({
  label, value, min = 0, max = 100, step = 1, unit = '%', onChange, responsive
}: {
  label: string
  value: number | string
  min?: number
  max?: number
  step?: number
  unit?: string
  onChange: (val: number) => void
  responsive?: boolean
}) {
  const num = typeof value === 'number' ? value : (parseFloat(String(value)) || min)
  return (
    <div className="elementor-control-row stacked" style={{ gap: 6 }}>
      <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span>{label}</span>
          {responsive && <ResponsiveLabelSwitcher />}
        </div>
        <span style={{ fontSize: 11, color: '#86868b', fontWeight: 600 }}>{num}{unit}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={num}
          onChange={e => onChange(parseFloat(e.target.value))}
          style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
        />
        <input
          type="number"
          className="elementor-input"
          style={{ width: 54, padding: '4px 6px', textAlign: 'center', fontSize: 11 }}
          min={min}
          max={max}
          step={step}
          value={num}
          onChange={e => onChange(parseFloat(e.target.value) || min)}
        />
      </div>
    </div>
  )
}

