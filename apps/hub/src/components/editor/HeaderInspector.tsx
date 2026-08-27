import React, { useState, useRef } from 'react'
import {
  Sparkles, Layers, Plus, Trash2, Check, ArrowUpDown, ChevronDown, ChevronRight,
  Sliders, Paintbrush, ShieldCheck, Eye, EyeOff, Layout, Globe, Search, ShoppingBag,
  Image as ImageIcon, Type, Bell, BellOff, Megaphone, X, Link2, RotateCcw,
  Edit2, Monitor, Tablet, Smartphone, MoveHorizontal, Link as LinkIcon, Unlink, Zap,
  UploadCloud, Upload
} from 'lucide-react'
import type { HeaderConfig, HeaderModel, MobileMenuModel } from './GlobalHeaderRenderer'
import MediaLibraryModal from './MediaLibraryModal'
import MenuPickerModal from './MenuPickerModal'
import './HeaderInspector.css'

interface Props {
  config: HeaderConfig
  onChangeConfig: (newConfig: HeaderConfig) => void
  onOpenLibrary: () => void
  onClose: () => void
}

/* ── Color Swatch Picker Row ── */
function ColorControl({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputVal, setInputVal] = useState(value || '')

  React.useEffect(() => {
    setInputVal(value || '')
  }, [value])

  return (
    <div className="elementor-control-row stacked" style={{ marginTop: 12 }}>
      <div className="elementor-control-label">
        <span>{label}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
        {/* Color Swatch */}
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 5,
            border: '1px solid #d2d2d7',
            background: inputVal || '#e5e5ea',
            cursor: 'pointer',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}
          onClick={() => inputRef.current?.click()}
          title="Clicar para escolher cor"
        >
          <input
            ref={inputRef}
            type="color"
            style={{
              position: 'absolute',
              width: '200%',
              height: '200%',
              top: '-50%',
              left: '-50%',
              border: 'none',
              cursor: 'pointer',
              opacity: 0,
            }}
            value={inputVal.startsWith('#') && inputVal.length === 7 ? inputVal : '#000000'}
            onChange={(e) => {
              setInputVal(e.target.value)
              onChange(e.target.value)
            }}
          />
        </div>
        {/* Hex Text Input */}
        <input
          type="text"
          className="elementor-input"
          style={{ flex: 1 }}
          value={inputVal}
          placeholder={placeholder || 'Ex: #ffffff ou rgba(...)'}
          onChange={(e) => {
            setInputVal(e.target.value)
            onChange(e.target.value)
          }}
          onBlur={(e) => onChange(e.target.value)}
        />
        {inputVal && (
          <button
            type="button"
            style={{
              background: 'none',
              border: 'none',
              color: '#86868b',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
              alignItems: 'center',
            }}
            title="Limpar cor"
            onClick={() => {
              setInputVal('')
              onChange('')
            }}
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

/* ── 4 Dimensions Box Model (Margin / Padding) ── */
function DimensionsControl({
  label,
  top,
  right,
  bottom,
  left,
  onChange,
}: {
  label: string
  top?: string
  right?: string
  bottom?: string
  left?: string
  onChange: (values: { top: string; right: string; bottom: string; left: string }) => void
}) {
  const [isLinked, setIsLinked] = useState(false)

  const currentValues = {
    top: top ?? '',
    right: right ?? '',
    bottom: bottom ?? '',
    left: left ?? '',
  }

  const handleChange = (side: 'top' | 'right' | 'bottom' | 'left', val: string) => {
    if (isLinked) {
      onChange({ top: val, right: val, bottom: val, left: val })
    } else {
      onChange({ ...currentValues, [side]: val })
    }
  }

  return (
    <div className="elementor-control-row stacked" style={{ marginTop: 12 }}>
      <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
        <span>{label}</span>
        <span style={{ fontSize: 10, color: '#86868b', fontWeight: 600 }}>px</span>
      </div>
      <div style={{ display: 'flex', gap: 4, alignItems: 'center', marginTop: 4 }}>
        {[
          { key: 'top' as const, label: 'Superior', val: top ?? '' },
          { key: 'right' as const, label: 'Direita', val: right ?? '' },
          { key: 'bottom' as const, label: 'Inferior', val: bottom ?? '' },
          { key: 'left' as const, label: 'Esquerda', val: left ?? '' },
        ].map(item => (
          <div key={item.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <input
              type="number"
              className="elementor-input"
              style={{ textAlign: 'center', padding: '5px 2px', width: '100%' }}
              value={item.val}
              placeholder="0"
              onChange={e => handleChange(item.key, e.target.value)}
            />
            <span style={{ fontSize: 9, color: '#86868b' }}>{item.label}</span>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setIsLinked(!isLinked)}
          title={isLinked ? 'Valores Vinculados' : 'Desvincular Valores'}
          style={{
            background: isLinked ? '#28a745' : '#f5f5f7',
            color: isLinked ? '#fff' : '#86868b',
            border: '1px solid ' + (isLinked ? '#28a745' : '#d2d2d7'),
            borderRadius: 5,
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            marginTop: -14,
            transition: 'all 0.15s',
          }}
        >
          {isLinked ? <LinkIcon size={12} /> : <Unlink size={12} />}
        </button>
      </div>
    </div>
  )
}

export default function HeaderInspector({
  config,
  onChangeConfig,
  onOpenLibrary,
  onClose
}: Props) {
  const [activeTab, setActiveTab] = useState<'content' | 'style' | 'advanced'>('content')
  const [showLogoMediaModal, setShowLogoMediaModal] = useState(false)
  const [showMenuPickerModal, setShowMenuPickerModal] = useState(false)
  const [showTypographyPopover, setShowTypographyPopover] = useState(false)
  const [logoUrlInput, setLogoUrlInput] = useState('')
  const [isDraggingLogo, setIsDraggingLogo] = useState(false)
  const logoFileInputRef = useRef<HTMLInputElement>(null)

  const handleLogoFileUpload = (file: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (dataUrl) {
        onChangeConfig({
          ...config,
          logoImage: dataUrl,
          logoType: 'image'
        })
      }
    }
    reader.readAsDataURL(file)
  }

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    menu: true,
    mobile: false,
    announcement: false,
    style: true,
    typography: true,
    layout: true,
    sticky: true,
  })

  const toggleSection = (key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const model = config.model || 'apple_dark'
  const links = config.links || [
    { label: 'Store', url: '/produtos' },
    { label: 'Mac', url: '/mac' },
    { label: 'iPad', url: '/ipad' },
    { label: 'iPhone', url: '/iphone' },
    { label: 'Watch', url: '/watch' },
    { label: 'Vision', url: '/vision' },
    { label: 'AirPods', url: '/airpods' },
    { label: 'Suporte', url: '/contato' },
  ]

  const update = (key: keyof HeaderConfig, val: any) => {
    onChangeConfig({ ...config, [key]: val })
  }

  const updateMultiple = (updates: Partial<HeaderConfig>) => {
    onChangeConfig({ ...config, ...updates })
  }

  const handleUpdateLink = (index: number, field: string, value: string) => {
    const updated = [...links]
    updated[index] = { ...updated[index], [field]: value }
    update('links', updated)
  }

  const handleAddLink = () => {
    const updated = [...links, { label: 'Novo Link', url: '/produtos' }]
    update('links', updated)
  }

  const handleRemoveLink = (index: number) => {
    const updated = links.filter((_, idx) => idx !== index)
    update('links', updated)
  }

  return (
    <div className="inspector-panel-elementor header-inspector">
      {/* ── TOP HEADER ── */}
      <div className="inspector-top-badge header-cyan">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="badge-pill cyan">Header</span>
          <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#083b32' }}>
            Editar Header
          </h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="header-done-btn"
          title="Concluir edição do Header"
        >
          Concluído
        </button>
      </div>

      {/* ── TABS (Conteúdo | Estilo | Avançado) ── */}
      <div className="elementor-inspector-tabs">
        <button
          type="button"
          className={`inspector-tab-btn ${activeTab === 'content' ? 'active' : ''}`}
          onClick={() => setActiveTab('content')}
        >
          Conteúdo
        </button>
        <button
          type="button"
          className={`inspector-tab-btn ${activeTab === 'style' ? 'active' : ''}`}
          onClick={() => setActiveTab('style')}
        >
          Estilo
        </button>
        <button
          type="button"
          className={`inspector-tab-btn ${activeTab === 'advanced' ? 'active' : ''}`}
          onClick={() => setActiveTab('advanced')}
        >
          Avançado
        </button>
      </div>

      <div className="inspector-body-elementor">
        {activeTab === 'content' && (
          <>
            <div className="inspector-accordion">
              <button
                type="button"
                className="inspector-accordion-header"
                onClick={() => toggleSection('logo')}
              >
                <div className="accordion-title-wrap">
                  {openSections.logo !== false ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>Logotipo &amp; Nome da Marca</span>
                </div>
              </button>

              {openSections.logo !== false && (
                <div className="inspector-accordion-content">
                  {/* Nome da Marca / Logotipo */}
                  {config.logoType !== 'image' && config.logoType !== 'none' && (
                    <div className="elementor-control-row stacked" style={{ marginBottom: 12 }}>
                      <span className="elementor-control-label">Nome do Logotipo</span>
                      <input
                        type="text"
                        className="elementor-input"
                        value={config.logoText ?? 'TEKNIX'}
                        onChange={e => update('logoText', e.target.value)}
                        placeholder="TEKNIX"
                      />
                    </div>
                  )}

                  {/* Tipo de Logotipo */}
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label">
                      <span>Tipo de Logotipo</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
                      <button
                        type="button"
                        className={`logo-type-btn ${(config.logoType === 'full_logo' || config.logoType === 'tek_icon_text' || !config.logoType) ? 'active' : ''}`}
                        onClick={() => update('logoType', 'full_logo')}
                        title="Ícone SVG TEKNIX Oficial + Texto"
                        style={{ fontSize: '11px', padding: '7px 4px' }}
                      >
                        <Zap size={13} />
                        <span>Ícone + Texto</span>
                      </button>

                      <button
                        type="button"
                        className={`logo-type-btn ${config.logoType === 'image' ? 'active' : ''}`}
                        onClick={() => update('logoType', 'image')}
                        title="Imagem personalizada / Logotipo da marca"
                        style={{ fontSize: '11px', padding: '7px 4px' }}
                      >
                        <ImageIcon size={13} />
                        <span>Imagem / Logo</span>
                      </button>

                      <button
                        type="button"
                        className={`logo-type-btn ${config.logoType === 'text' ? 'active' : ''}`}
                        onClick={() => update('logoType', 'text')}
                        title="Apenas Nome / Marca em Texto"
                        style={{ fontSize: '11px', padding: '7px 4px' }}
                      >
                        <Type size={13} />
                        <span>Apenas Texto</span>
                      </button>

                      <button
                        type="button"
                        className={`logo-type-btn ${config.logoType === 'none' ? 'active' : ''}`}
                        onClick={() => update('logoType', 'none')}
                        title="Ocultar logotipo do cabeçalho"
                        style={{ fontSize: '11px', padding: '7px 4px' }}
                      >
                        <EyeOff size={13} />
                        <span>Ocultar</span>
                      </button>
                    </div>
                  </div>

                  {/* Configurações de Imagem do Logotipo */}
                  {config.logoType === 'image' && (
                    <div style={{ marginTop: 12, padding: '12px', background: '#f8f9fa', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
                      <input
                        ref={logoFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/svg+xml,image/webp,image/gif"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleLogoFileUpload(file)
                        }}
                      />

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span className="elementor-control-label" style={{ fontSize: '11px', fontWeight: 700 }}>
                          Imagem do Logotipo
                        </span>
                        {config.logoImage && (
                          <span style={{ fontSize: '10px', color: '#0071e3', fontWeight: 600 }}>Ativo</span>
                        )}
                      </div>

                      {config.logoImage ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Preview Box */}
                          <div style={{
                            padding: '10px',
                            background: '#ffffff',
                            borderRadius: '8px',
                            border: '1px solid #d2d2d7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: '60px',
                            position: 'relative',
                            backgroundImage: 'radial-gradient(#e5e5ea 1px, transparent 1px)',
                            backgroundSize: '8px 8px',
                          }}>
                            <img
                              src={config.logoImage}
                              alt="Logotipo"
                              style={{ maxHeight: '44px', maxWidth: '100%', objectFit: 'contain' }}
                            />
                          </div>

                          {/* Botões de Troca e Remoção */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6 }}>
                            <button
                              type="button"
                              className="elementor-btn-secondary"
                              style={{ fontSize: '11px', padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                              onClick={() => logoFileInputRef.current?.click()}
                              title="Subir outro arquivo do seu computador"
                            >
                              <Upload size={13} />
                              <span>Fazer Upload</span>
                            </button>

                            <button
                              type="button"
                              className="elementor-btn-secondary"
                              style={{ fontSize: '11px', padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
                              onClick={() => setShowLogoMediaModal(true)}
                              title="Escolher imagem da biblioteca"
                            >
                              <ImageIcon size={13} />
                              <span>Biblioteca</span>
                            </button>

                            <button
                              type="button"
                              className="elementor-btn-danger"
                              style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => update('logoImage', '')}
                              title="Remover logotipo e limpar imagem"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Dropzone de Upload Direto */}
                          <div
                            onDragOver={(e) => { e.preventDefault(); setIsDraggingLogo(true) }}
                            onDragLeave={() => setIsDraggingLogo(false)}
                            onDrop={(e) => {
                              e.preventDefault()
                              setIsDraggingLogo(false)
                              const file = e.dataTransfer.files?.[0]
                              if (file) handleLogoFileUpload(file)
                            }}
                            onClick={() => logoFileInputRef.current?.click()}
                            style={{
                              padding: '16px 12px',
                              borderRadius: '8px',
                              border: isDraggingLogo ? '2px dashed #0071e3' : '2px dashed #d2d2d7',
                              background: isDraggingLogo ? '#eff6ff' : '#ffffff',
                              textAlign: 'center',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <UploadCloud size={24} style={{ color: '#0071e3', margin: '0 auto 6px', display: 'block' }} />
                            <div style={{ fontSize: '12px', fontWeight: 600, color: '#1d1d1f' }}>
                              Clique para subir a foto
                            </div>
                            <div style={{ fontSize: '10px', color: '#86868b', marginTop: 2 }}>
                              ou arraste o arquivo aqui (PNG, SVG, JPG, WebP)
                            </div>
                          </div>

                          {/* Botão de Biblioteca */}
                          <button
                            type="button"
                            className="elementor-btn-secondary"
                            style={{ width: '100%', fontSize: '11px', padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                            onClick={() => setShowLogoMediaModal(true)}
                          >
                            <ImageIcon size={13} />
                            <span>Ou Selecionar da Biblioteca de Mídia</span>
                          </button>

                          {/* Colar Link / URL da Imagem */}
                          <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                            <input
                              type="text"
                              className="elementor-input"
                              placeholder="https://.../logo.png"
                              value={logoUrlInput}
                              onChange={(e) => setLogoUrlInput(e.target.value)}
                              style={{ fontSize: '11px', padding: '5px 8px', flex: 1 }}
                            />
                            <button
                              type="button"
                              className="elementor-btn-secondary"
                              style={{ fontSize: '11px', padding: '5px 10px', whiteSpace: 'nowrap' }}
                              onClick={() => {
                                if (logoUrlInput.trim()) {
                                  update('logoImage', logoUrlInput.trim())
                                  setLogoUrlInput('')
                                }
                              }}
                            >
                              Aplicar
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Dimensões da Imagem */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12, paddingTop: 10, borderTop: '1px solid #e5e7eb' }}>
                        <div>
                          <span className="elementor-control-label" style={{ fontSize: '10px' }}>Altura (px)</span>
                          <input
                            type="number"
                            className="elementor-input"
                            value={config.logoHeight || 28}
                            onChange={e => update('logoHeight', parseInt(e.target.value) || 28)}
                            placeholder="28"
                          />
                        </div>
                        <div>
                          <span className="elementor-control-label" style={{ fontSize: '10px' }}>Largura Max (px)</span>
                          <input
                            type="number"
                            className="elementor-input"
                            value={config.logoWidth || 160}
                            onChange={e => update('logoWidth', parseInt(e.target.value) || 160)}
                            placeholder="160"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Configurações de SVG / Texto */}
                  {config.logoType !== 'image' && config.logoType !== 'none' && (
                    <div style={{ marginTop: 10 }}>
                      <div className="elementor-control-row stacked">
                        <span className="elementor-control-label" style={{ fontSize: '10px' }}>Código SVG Personalizado (Opcional)</span>
                        <textarea
                          className="elementor-input"
                          rows={2}
                          value={config.logoSvgCode || ''}
                          onChange={e => update('logoSvgCode', e.target.value)}
                          placeholder="Deixe vazio para usar o SVG Oficial TEKNIX"
                          style={{ fontSize: '10px', fontFamily: 'monospace', resize: 'vertical' }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Modo Mobile: Exibir apenas Ícone */}
                  <div style={{ marginTop: 12, padding: '10px 12px', background: '#f5f5f7', borderRadius: '8px', border: '1px solid #e5e5ea' }}>
                    <div className="elementor-control-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Smartphone size={14} style={{ color: '#0071e3' }} />
                        <div>
                          <span style={{ fontSize: '12px', fontWeight: 600, color: '#1d1d1f', display: 'block' }}>Modo Mobile</span>
                          <span style={{ fontSize: '11px', color: '#86868b' }}>Exibir apenas o Ícone no Celular</span>
                        </div>
                      </div>
                      <label className="header-toggle-switch">
                        <input
                          type="checkbox"
                          checked={config.mobileForceIcon !== false}
                          onChange={e => update('mobileForceIcon', e.target.checked)}
                        />
                        <span className="toggle-track" />
                      </label>
                    </div>
                  </div>

                  {/* Preview do Logotipo */}
                  {config.logoType !== 'none' && (
                    <div style={{
                      marginTop: 12,
                      padding: '10px 14px',
                      background: '#161617',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}>
                      <span style={{ fontSize: 9, color: '#86868b', textTransform: 'uppercase', fontWeight: 700 }}>Preview:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ffffff' }}>
                        {config.logoType === 'image' && config.logoImage ? (
                          <img src={config.logoImage} alt="Logo" style={{ height: 24, maxWidth: 120, objectFit: 'contain' }} />
                        ) : config.logoType === 'text' ? (
                          <span style={{ fontWeight: 800, fontSize: 15, color: '#ffffff' }}>{config.logoText || 'TEKNIX'}</span>
                        ) : (
                          <>
                            <svg width="20" height="20" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="28" height="28" rx="6" fill="#0071e3" />
                              <path d="M7 9h14v3.5H16v8.5h-4V12.5H7V9z" fill="#ffffff" />
                              <path d="M19 14.5l-3.5 5.5h4.5l-5 6.5 1-4.5h-3.5l4.5-7.5h2z" fill="#ffcc00" />
                            </svg>
                            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em', color: '#ffffff' }}>
                              {config.logoText || 'TEKNIX'}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="inspector-accordion">
              <button
                type="button"
                className="inspector-accordion-header"
                onClick={() => toggleSection('general')}
              >
                <div className="accordion-title-wrap">
                  {openSections.general ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>Modelo de Layout</span>
                </div>
              </button>

              {openSections.general && (
                <div className="inspector-accordion-content">
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Modelo de Layout</span>
                      <button
                        type="button"
                        className="header-ai-btn"
                        onClick={() => setShowMenuPickerModal(true)}
                        title="Ver e trocar modelo na Biblioteca"
                      >
                        <Sparkles size={12} />
                        <span>Biblioteca</span>
                      </button>
                    </div>
                    <select
                      className="elementor-select"
                      value={model}
                      onChange={e => update('model', e.target.value as HeaderModel)}
                    >
                      <option value="apple_dark">1. Apple Dark Translúcido (#161617)</option>
                      <option value="apple_light">2. Apple Light Editorial (#ffffff)</option>
                      <option value="industrial_pro">3. Industrial Pro Solid (#000000)</option>
                      <option value="ecommerce_search">4. E-commerce Search Express</option>
                    </select>
                  </div>

                  <div className="elementor-control-row stacked" style={{ marginTop: 12 }}>
                    <div className="elementor-control-label">
                      <span>Escopo do Header</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '11px', marginTop: 4 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#1d1d1f' }}>
                        <input
                          type="radio"
                          name="header_scope"
                          checked={!config.isLocalOnly}
                          onChange={() => update('isLocalOnly', false)}
                          style={{ accentColor: '#0071e3' }}
                        />
                        <span style={{ fontWeight: 600 }}>Global</span> — visível em todas as páginas do site
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#1d1d1f' }}>
                        <input
                          type="radio"
                          name="header_scope"
                          checked={!!config.isLocalOnly}
                          onChange={() => update('isLocalOnly', true)}
                          style={{ accentColor: '#0071e3' }}
                        />
                        <span style={{ fontWeight: 600 }}>Local</span> — exclusivo desta página
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="inspector-accordion">
              <button
                type="button"
                className="inspector-accordion-header"
                onClick={() => toggleSection('menu')}
              >
                <div className="accordion-title-wrap">
                  {openSections.menu ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>Itens do Menu ({links.length})</span>
                </div>
              </button>

              {openSections.menu && (
                <div className="inspector-accordion-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: '11px', color: '#86868b' }}>Links da barra de navegação</span>
                    <button
                      type="button"
                      className="elementor-btn-primary"
                      style={{ fontSize: '11px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                      onClick={() => {
                        const newLinks = [...links, { label: 'Novo Link', url: '/novo' }]
                        update('links', newLinks)
                      }}
                    >
                      <Plus size={12} />
                      <span>Adicionar</span>
                    </button>
                  </div>

                  <div className="header-links-list">
                    {links.map((link, idx) => (
                      <div key={idx} className="header-link-item-row" style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
                        <input
                          type="text"
                          className="elementor-input"
                          value={link.label}
                          onChange={e => {
                            const updated = [...links]
                            updated[idx] = { ...updated[idx], label: e.target.value }
                            update('links', updated)
                          }}
                          placeholder="Rótulo"
                          style={{ flex: 1 }}
                        />
                        <input
                          type="text"
                          className="elementor-input"
                          value={link.url}
                          onChange={e => {
                            const updated = [...links]
                            updated[idx] = { ...updated[idx], url: e.target.value }
                            update('links', updated)
                          }}
                          placeholder="/pagina"
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          className="header-link-del-btn"
                          onClick={() => {
                            const updated = links.filter((_, i) => i !== idx)
                            update('links', updated)
                          }}
                          title="Remover link"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="inspector-accordion">
              <button
                type="button"
                className="inspector-accordion-header"
                onClick={() => toggleSection('mobile')}
              >
                <div className="accordion-title-wrap">
                  {openSections.mobile ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>Mega Menu Mobile</span>
                </div>
              </button>

              {openSections.mobile && (
                <div className="inspector-accordion-content">
                  <div className="elementor-control-row stacked">
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Layout do Menu Mobile</span>
                      <button
                        type="button"
                        className="header-ai-btn"
                        onClick={() => setShowMenuPickerModal(true)}
                        title="Ver 12 modelos na biblioteca"
                      >
                        <Sparkles size={12} />
                        <span>Ver 12 Modelos</span>
                      </button>
                    </div>
                    <select
                      className="elementor-select"
                      value={config.mobileModel || 'apple_drawer'}
                      onChange={e => update('mobileModel', e.target.value as MobileMenuModel)}
                    >
                      <optgroup label="Modelos Clássicos &amp; Dark">
                        <option value="apple_drawer">1. Apple Dark Clássico (#161617)</option>
                        <option value="app_dark_sidebar">2. Dark Sidebar c/ Ícones</option>
                        <option value="fullscreen_overlay">3. Full Screen Overlay Translúcido</option>
                        <option value="dark_settings_drawer">4. Dark Configurações &amp; Toggles</option>
                        <option value="compact_card">5. Compact Card Flutuante</option>
                        <option value="bottom_sheet">6. Bottom Sheet</option>
                      </optgroup>
                      <optgroup label="Modelos App &amp; Coloridos">
                        <option value="profile_blue_drawer">7. Profile Blue Drawer</option>
                        <option value="profile_purple_drawer">8. Profile Purple Social Drawer</option>
                        <option value="app_glass_glassmorphism">9. Glassmorphism Translúcido</option>
                        <option value="app_clean_white">10. Clean White iOS Minimal</option>
                        <option value="app_tab_bar_bottom">11. Tab Bar Inferior com Badges</option>
                        <option value="app_floating_fab">12. Floating Action Circle</option>
                      </optgroup>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <div className="inspector-accordion">
              <button
                type="button"
                className="inspector-accordion-header"
                onClick={() => toggleSection('announcement')}
              >
                <div className="accordion-title-wrap">
                  {openSections.announcement ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>Barra de Anúncio Superior</span>
                </div>
              </button>

              {openSections.announcement && (
                <div className="inspector-accordion-content">
                  <div className="elementor-control-row" style={{ justifyContent: 'space-between' }}>
                    <span className="elementor-control-label">Exibir Barra de Anúncio</span>
                    <label className="header-toggle-switch">
                      <input
                        type="checkbox"
                        checked={!!config.showAnnouncementRibbon}
                        onChange={e => update('showAnnouncementRibbon', e.target.checked)}
                      />
                      <span className="toggle-track" />
                    </label>
                  </div>

                  {config.showAnnouncementRibbon && (
                    <>
                      <div className="elementor-control-row stacked" style={{ marginTop: 10 }}>
                        <span className="elementor-control-label">Texto do Anúncio</span>
                        <input
                          type="text"
                          className="elementor-input"
                          value={config.announcementText || ''}
                          onChange={e => update('announcementText', e.target.value)}
                          placeholder="Ex: Frete Grátis acima de R$ 299 para todo o Brasil."
                        />
                      </div>
                      <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                        <span className="elementor-control-label">Link do Anúncio</span>
                        <input
                          type="text"
                          className="elementor-input"
                          value={config.announcementLink || ''}
                          onChange={e => update('announcementLink', e.target.value)}
                          placeholder="/promocoes"
                        />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'style' && (
          <>
            <div className="inspector-accordion">
              <button
                type="button"
                className="inspector-accordion-header"
                onClick={() => toggleSection('typography')}
              >
                <div className="accordion-title-wrap">
                  {openSections.typography !== false ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>Tipografia dos Links</span>
                </div>
              </button>

              {openSections.typography !== false && (
                <div className="inspector-accordion-content">
                  <div className="elementor-control-row stacked">
                    <label className="elementor-control-label">Família da Fonte</label>
                    <select
                      className="elementor-select"
                      value={config.fontFamily || ''}
                      onChange={e => update('fontFamily', e.target.value)}
                    >
                      <option value="">Padrão (SF Pro Apple)</option>
                      <option value="Inter, -apple-system, sans-serif">Inter</option>
                      <option value="Roboto, -apple-system, sans-serif">Roboto</option>
                      <option value="Outfit, -apple-system, sans-serif">Outfit</option>
                      <option value="Montserrat, sans-serif">Montserrat</option>
                      <option value="Poppins, sans-serif">Poppins</option>
                      <option value='"Plus Jakarta Sans", sans-serif'>Plus Jakarta Sans</option>
                      <option value="system-ui, -apple-system, sans-serif">System UI</option>
                    </select>
                  </div>

                  <div className="elementor-control-row stacked" style={{ marginTop: 10 }}>
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Tamanho da Fonte (px)</span>
                      <span style={{ fontSize: 10, color: '#86868b', fontWeight: 600 }}>{config.fontSize || '12'}px</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="range"
                        min="9"
                        max="24"
                        step="1"
                        value={parseInt(String(config.fontSize || 12)) || 12}
                        onChange={e => update('fontSize', e.target.value)}
                        style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                      />
                      <input
                        type="number"
                        className="elementor-input"
                        style={{ width: 54, textAlign: 'center' }}
                        value={config.fontSize || 12}
                        onChange={e => update('fontSize', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="elementor-control-row stacked" style={{ marginTop: 10 }}>
                    <label className="elementor-control-label">Peso da Fonte</label>
                    <select
                      className="elementor-select"
                      value={config.fontWeight || '400'}
                      onChange={e => update('fontWeight', e.target.value)}
                    >
                      <option value="300">300 (Light)</option>
                      <option value="400">400 (Regular)</option>
                      <option value="500">500 (Medium)</option>
                      <option value="600">600 (Semi-Bold)</option>
                      <option value="700">700 (Bold)</option>
                      <option value="800">800 (Extra Bold)</option>
                    </select>
                  </div>

                  <div className="elementor-control-row stacked" style={{ marginTop: 10 }}>
                    <label className="elementor-control-label">Transformação</label>
                    <select
                      className="elementor-select"
                      value={config.textTransform || 'none'}
                      onChange={e => update('textTransform', e.target.value)}
                    >
                      <option value="none">Padrão</option>
                      <option value="uppercase">MAIÚSCULAS</option>
                      <option value="lowercase">minúsculas</option>
                      <option value="capitalize">Capitalizada</option>
                    </select>
                  </div>

                  <div className="elementor-control-row stacked" style={{ marginTop: 10 }}>
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Espaçamento entre Letras</span>
                      <span style={{ fontSize: 10, color: '#86868b' }}>{config.letterSpacing || '0px'}</span>
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="10"
                      step="0.5"
                      value={parseFloat(String(config.letterSpacing || '0').replace(/[^0-9.-]/g, '')) || 0}
                      onChange={e => update('letterSpacing', `${e.target.value}px`)}
                      style={{ width: '100%', accentColor: '#0071e3', cursor: 'pointer', marginTop: 4 }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="inspector-accordion">
              <button
                type="button"
                className="inspector-accordion-header"
                onClick={() => toggleSection('style')}
              >
                <div className="accordion-title-wrap">
                  {openSections.style !== false ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>Aparência &amp; Cores</span>
                </div>
              </button>

              {openSections.style !== false && (
                <div className="inspector-accordion-content">
                  <ColorControl
                    label="Cor do Texto e Links"
                    value={config.textColor || ''}
                    onChange={(v) => update('textColor', v)}
                    placeholder="Ex: #ffffff ou #1d1d1f"
                  />

                  <div className="elementor-control-row" style={{ justifyContent: 'space-between', marginTop: 12, marginBottom: 8 }}>
                    <span className="elementor-control-label">Fundo Transparente</span>
                    <label className="header-toggle-switch">
                      <input
                        type="checkbox"
                        checked={!!config.headerTransparent}
                        onChange={e => update('headerTransparent', e.target.checked)}
                      />
                      <span className="toggle-track" />
                    </label>
                  </div>

                  {!config.headerTransparent && (
                    <ColorControl
                      label="Cor de Fundo"
                      value={config.bgColor || ''}
                      onChange={(v) => update('bgColor', v)}
                      placeholder="Ex: rgba(22,22,23,0.85) ou #161617"
                    />
                  )}

                  <div className="elementor-control-row stacked" style={{ marginTop: 12 }}>
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Espaçamento dos Links (Gap)</span>
                      <span style={{ fontSize: 10, color: '#86868b', fontWeight: 600 }}>{config.menuItemGap || 24}px</span>
                    </div>
                    <input
                      type="range"
                      min="8"
                      max="60"
                      step="2"
                      value={config.menuItemGap || 24}
                      onChange={e => update('menuItemGap', parseInt(e.target.value) || 24)}
                      style={{ width: '100%', accentColor: '#0071e3', cursor: 'pointer', marginTop: 4 }}
                    />
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      borderRadius: 8,
                      overflow: 'hidden',
                      border: '1px solid #e5e5ea',
                    }}
                  >
                    <div style={{ padding: '6px 8px', background: '#f5f5f7', fontSize: 10, fontWeight: 600, color: '#86868b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Pré-visualização
                    </div>
                    <div
                      style={{
                        background: config.headerTransparent ? 'transparent' : (config.bgColor || (model === 'apple_dark' ? '#161617' : '#ffffff')),
                        color: config.textColor || (model === 'apple_dark' ? '#f5f5f7' : '#1d1d1f'),
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: config.fontSize ? `${config.fontSize}px` : '11px',
                        fontWeight: config.fontWeight || 600,
                        fontFamily: config.fontFamily || 'inherit',
                      }}
                    >
                      <span style={{ fontWeight: 800, fontSize: '12px' }}>{config.logoText || 'TEKNIX'}</span>
                      <div style={{ display: 'flex', gap: `${(config.menuItemGap ? Number(config.menuItemGap) / 2.5 : 8)}px`, fontSize: '10px', opacity: 0.85 }}>
                        <span>Store</span>
                        <span>Mac</span>
                        <span>iPhone</span>
                      </div>
                      <span style={{ opacity: 0.7 }}>🔍 🛍️</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ═════════ ABA AVANÇADO ═════════ */}
        {activeTab === 'advanced' && (
          <>
            {/* Layout, Margem, Padding e Dimensões */}
            <div className="inspector-accordion">
              <button
                type="button"
                className="inspector-accordion-header"
                onClick={() => toggleSection('layout')}
              >
                <div className="accordion-title-wrap">
                  {openSections.layout ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>Layout &amp; Dimensões</span>
                </div>
              </button>

              {openSections.layout && (
                <div className="inspector-accordion-content">
                  {/* Margem */}
                  <DimensionsControl
                    label="Margem"
                    top={config.marginTop}
                    right={config.marginRight}
                    bottom={config.marginBottom}
                    left={config.marginLeft}
                    onChange={(vals) => {
                      updateMultiple({
                        marginTop: vals.top,
                        marginRight: vals.right,
                        marginBottom: vals.bottom,
                        marginLeft: vals.left,
                      })
                    }}
                  />

                  {/* Preenchimento / Padding */}
                  <DimensionsControl
                    label="Preenchimento (Padding)"
                    top={config.paddingTop}
                    right={config.paddingRight}
                    bottom={config.paddingBottom}
                    left={config.paddingLeft}
                    onChange={(vals) => {
                      updateMultiple({
                        paddingTop: vals.top,
                        paddingRight: vals.right,
                        paddingBottom: vals.bottom,
                        paddingLeft: vals.left,
                      })
                    }}
                  />

                  {/* Altura do Header */}
                  <div className="elementor-control-row stacked" style={{ marginTop: 12 }}>
                    <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                      <span>Altura do Header</span>
                      <span style={{ fontSize: 10, color: '#86868b', fontWeight: 600 }}>{config.headerHeight || 44}px</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4 }}>
                      <input
                        type="range"
                        min="36"
                        max="90"
                        step="2"
                        value={config.headerHeight || 44}
                        onChange={e => update('headerHeight', parseInt(e.target.value) || 44)}
                        style={{ flex: 1, accentColor: '#0071e3', cursor: 'pointer' }}
                      />
                      <input
                        type="number"
                        className="elementor-input"
                        style={{ width: 54, textAlign: 'center' }}
                        value={config.headerHeight || 44}
                        onChange={e => update('headerHeight', parseInt(e.target.value) || 44)}
                      />
                    </div>
                  </div>

                  {/* Largura da Seção: Boxed vs Largura Total */}
                  <div className="elementor-control-row stacked" style={{ marginTop: 12 }}>
                    <label className="elementor-control-label">Largura da Seção</label>
                    <select
                      className="elementor-select"
                      value={config.headerWidthMode || 'boxed'}
                      onChange={e => update('headerWidthMode', e.target.value as any)}
                    >
                      <option value="boxed">Boxed (Contido no Centro)</option>
                      <option value="full">Largura Total (100% Full Width)</option>
                    </select>
                  </div>

                  {config.headerWidthMode !== 'full' && (
                    <div className="elementor-control-row stacked" style={{ marginTop: 8 }}>
                      <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                        <span>Largura Máxima do Conteúdo</span>
                        <span style={{ fontSize: 10, color: '#86868b' }}>{config.headerMaxWidth || 1024}px</span>
                      </div>
                      <input
                        type="number"
                        className="elementor-input"
                        value={config.headerMaxWidth || 1024}
                        onChange={e => update('headerMaxWidth', parseInt(e.target.value) || 1024)}
                        placeholder="1024"
                      />
                    </div>
                  )}

                  {/* Z-Index */}
                  <div className="elementor-control-row stacked" style={{ marginTop: 12 }}>
                    <span className="elementor-control-label">Z-Index</span>
                    <input
                      type="number"
                      className="elementor-input"
                      value={config.zIndex ?? ''}
                      onChange={e => update('zIndex', e.target.value)}
                      placeholder="Padrão (40)"
                    />
                  </div>

                  {/* ID CSS */}
                  <div className="elementor-control-row stacked" style={{ marginTop: 12 }}>
                    <span className="elementor-control-label">ID CSS</span>
                    <input
                      type="text"
                      className="elementor-input"
                      value={config.cssId || ''}
                      onChange={e => update('cssId', e.target.value)}
                      placeholder="ex: meu-header-principal"
                    />
                  </div>

                  {/* Classes CSS */}
                  <div className="elementor-control-row stacked" style={{ marginTop: 12 }}>
                    <span className="elementor-control-label">Classes CSS</span>
                    <input
                      type="text"
                      className="elementor-input"
                      value={config.cssClasses || ''}
                      onChange={e => update('cssClasses', e.target.value)}
                      placeholder="ex: header-custom classe-2"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sticky Header Effects */}
            <div className="inspector-accordion">
              <button
                type="button"
                className="inspector-accordion-header"
                onClick={() => toggleSection('sticky')}
              >
                <div className="accordion-title-wrap">
                  {openSections.sticky ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <span>📌 Cabeçalho Fixo (Sticky Header)</span>
                </div>
              </button>

              {openSections.sticky && (
                <div className="inspector-accordion-content">
                  {/* Ativar/Desativar Fixo */}
                  <div className="elementor-control-row" style={{ justifyContent: 'space-between' }}>
                    <div>
                      <span className="elementor-control-label" style={{ fontWeight: 700 }}>Ativar Cabeçalho Fixo (Sticky)</span>
                      <span style={{ fontSize: '11px', color: '#86868b', display: 'block' }}>Permanece visível conforme o usuário rola a página</span>
                    </div>
                    <label className="header-toggle-switch">
                      <input
                        type="checkbox"
                        checked={config.isSticky !== false}
                        onChange={e => update('isSticky', e.target.checked)}
                      />
                      <span className="toggle-track" />
                    </label>
                  </div>

                  {config.isSticky !== false && (
                    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* 1. Distância de Rolagem (Offset px) */}
                      <div className="elementor-control-row stacked">
                        <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                          <span>Distância de Rolagem (Offset)</span>
                          <span style={{ fontSize: '11px', color: '#0071e3', fontWeight: 600 }}>{config.stickyOffset ?? 0} px</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={800}
                          step={25}
                          className="elementor-slider"
                          value={config.stickyOffset ?? 0}
                          onChange={e => update('stickyOffset', parseInt(e.target.value) || 0)}
                        />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginTop: 6 }}>
                          {[
                            { label: '0px (Imediato)', val: 0 },
                            { label: '150px', val: 150 },
                            { label: '300px', val: 300 },
                            { label: '500px', val: 500 },
                          ].map(preset => (
                            <button
                              key={preset.val}
                              type="button"
                              className={`logo-type-btn ${(config.stickyOffset ?? 0) === preset.val ? 'active' : ''}`}
                              onClick={() => update('stickyOffset', preset.val)}
                              style={{ fontSize: '10px', padding: '4px 2px' }}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                        <p className="elementor-note-caption" style={{ marginTop: 4 }}>
                          Define quando o cabeçalho fixará: 0px para fixar imediatamente ou 200px para entrar somente após rolar.
                        </p>
                      </div>

                      {/* 2. Tempo de Animação / Transição (em Milissegundos / ms) */}
                      <div className="elementor-control-row stacked">
                        <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                          <span>Tempo de Transição (Duração)</span>
                          <span style={{ fontSize: '11px', color: '#0071e3', fontWeight: 600 }}>{config.stickyDuration ?? 350} ms</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="range"
                            min={100}
                            max={1500}
                            step={50}
                            className="elementor-slider"
                            style={{ flex: 1 }}
                            value={config.stickyDuration ?? 350}
                            onChange={e => update('stickyDuration', parseInt(e.target.value) || 350)}
                          />
                          <input
                            type="number"
                            className="elementor-input"
                            style={{ width: '70px', textAlign: 'center', padding: '4px' }}
                            value={config.stickyDuration ?? 350}
                            onChange={e => update('stickyDuration', parseInt(e.target.value) || 350)}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginTop: 6 }}>
                          {[
                            { label: '200ms', val: 200 },
                            { label: '350ms', val: 350 },
                            { label: '600ms', val: 600 },
                            { label: '1000ms', val: 1000 },
                          ].map(preset => (
                            <button
                              key={preset.val}
                              type="button"
                              className={`logo-type-btn ${(config.stickyDuration ?? 350) === preset.val ? 'active' : ''}`}
                              onClick={() => update('stickyDuration', preset.val)}
                              style={{ fontSize: '10px', padding: '4px 2px' }}
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 3. Atraso / Delay para Aparecer (em Milissegundos / ms) */}
                      <div className="elementor-control-row stacked">
                        <div className="elementor-control-label" style={{ justifyContent: 'space-between' }}>
                          <span>Atraso / Delay para Aparecer</span>
                          <span style={{ fontSize: '11px', color: '#0071e3', fontWeight: 600 }}>{config.stickyDelay ?? 0} ms</span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input
                            type="range"
                            min={0}
                            max={1000}
                            step={50}
                            className="elementor-slider"
                            style={{ flex: 1 }}
                            value={config.stickyDelay ?? 0}
                            onChange={e => update('stickyDelay', parseInt(e.target.value) || 0)}
                          />
                          <input
                            type="number"
                            className="elementor-input"
                            style={{ width: '70px', textAlign: 'center', padding: '4px' }}
                            value={config.stickyDelay ?? 0}
                            onChange={e => update('stickyDelay', parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      {/* 4. Efeito Visual ao Fixar */}
                      <div className="elementor-control-row stacked">
                        <span className="elementor-control-label">Efeito Visual ao Fixar</span>
                        <select
                          className="elementor-select"
                          value={config.stickyEffect || 'slide'}
                          onChange={e => update('stickyEffect', e.target.value as any)}
                        >
                          <option value="slide">Slide Suave (Desce do Topo)</option>
                          <option value="fade">Fade In Suave</option>
                          <option value="immediate">Imediato (Sem Transição)</option>
                        </select>
                      </div>

                      {/* 5. Revelar ao Rolar para Cima */}
                      <div className="elementor-control-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <span className="elementor-control-label">Ocultar ao Descer / Revelar ao Subir</span>
                          <span style={{ fontSize: '10.5px', color: '#86868b', display: 'block' }}>Esconde ao rolar para baixo e reaparece ao rolar para cima</span>
                        </div>
                        <label className="header-toggle-switch">
                          <input
                            type="checkbox"
                            checked={!!config.stickyOnScrollUp}
                            onChange={e => update('stickyOnScrollUp', e.target.checked)}
                          />
                          <span className="toggle-track" />
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── MODAL DE MÍDIA / LOGO ── */}
      {showLogoMediaModal && (
        <MediaLibraryModal
          isOpen={showLogoMediaModal}
          onClose={() => setShowLogoMediaModal(false)}
          onSelectMedia={(url) => {
            update('logoImage', url)
            update('logoType', 'image')
            setShowLogoMediaModal(false)
          }}
        />
      )}

      {/* ── MODAL SELETOR DE MENUS (DESKTOP & CELULAR) ── */}
      {showMenuPickerModal && (
        <MenuPickerModal
          onClose={() => setShowMenuPickerModal(false)}
          currentMobileModel={config.mobileModel}
          currentDesktopModel={config.model}
          onSelectMobile={(m) => update('mobileModel', m)}
          onSelectDesktop={(d) => update('model', d)}
        />
      )}
    </div>
  )
}
