import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTheme, createTheme, updateTheme } from '../services/pageBuilder'
import type { Theme } from '../types/pageBuilder'
import './ThemeEditor.css'

type SectionKey =
  | 'typography'
  | 'colors'
  | 'spacing'
  | 'radius'
  | 'shadows'
  | 'container'
  | 'buttons'
  | 'headings'
  | 'body'

const SECTIONS: { key: SectionKey; label: string; icon: string }[] = [
  { key: 'typography', label: 'Tipografia', icon: 'Aa' },
  { key: 'colors', label: 'Cores', icon: '◉' },
  { key: 'spacing', label: 'Espaçamento', icon: '↔' },
  { key: 'radius', label: 'Raio', icon: '▢' },
  { key: 'shadows', label: 'Sombras', icon: '▧' },
  { key: 'container', label: 'Container', icon: '□' },
  { key: 'buttons', label: 'Botões', icon: '▣' },
  { key: 'headings', label: 'Títulos', icon: 'H' },
  { key: 'body', label: 'Corpo', icon: '¶' },
]

const FONT_OPTIONS = [
  'Inter',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Lato',
  'Nunito',
  'Work Sans',
  'DM Sans',
  'Space Grotesk',
  'Sora',
  'Outfit',
  'Manrope',
]

function createDefaultTheme(): Theme {
  return {
    id: '',
    name: 'Novo Tema',
    slug: 'novo-tema',
    is_default: false,
    status: 'active',
    font_heading: 'Inter',
    font_body: 'Inter',
    font_button: 'Inter',
    font_input: 'Inter',
    font_accent: 'Inter',
    font_scale: 1,
    color_primary: '#0066FF',
    color_secondary: '#6B7280',
    color_accent: '#00D4AA',
    color_background: '#FFFFFF',
    color_surface: '#F9FAFB',
    color_text: '#111827',
    color_text_muted: '#6B7280',
    color_text_light: '#9CA3AF',
    color_border: '#E5E7EB',
    color_success: '#10B981',
    color_warning: '#F59E0B',
    color_error: '#EF4444',
    spacing_xs: '0.25rem',
    spacing_sm: '0.5rem',
    spacing_md: '1rem',
    spacing_lg: '1.5rem',
    spacing_xl: '2rem',
    spacing_2xl: '3rem',
    spacing_3xl: '4rem',
    spacing_4xl: '6rem',
    radius_sm: '0.25rem',
    radius_md: '0.5rem',
    radius_lg: '0.75rem',
    radius_xl: '1rem',
    radius_full: '9999px',
    shadow_sm: '0 1px 2px rgba(0,0,0,0.05)',
    shadow_md: '0 4px 6px rgba(0,0,0,0.07)',
    shadow_lg: '0 10px 15px rgba(0,0,0,0.1)',
    shadow_xl: '0 20px 25px rgba(0,0,0,0.15)',
    container_width: '1200px',
    container_width_narrow: '800px',
    container_width_wide: '1400px',
    container_padding: '1.5rem',
    button_font_size: '0.875rem',
    button_font_weight: '600',
    button_padding_x: '1.5rem',
    button_padding_y: '0.625rem',
    button_radius: '0.5rem',
    button_bg: '#0066FF',
    button_color: '#FFFFFF',
    button_hover_bg: '#0052CC',
    button_hover_color: '#FFFFFF',
    h1_size: '3rem',
    h1_weight: '800',
    h1_line_height: '1.1',
    h2_size: '2.25rem',
    h2_weight: '700',
    h2_line_height: '1.2',
    h3_size: '1.875rem',
    h3_weight: '700',
    h3_line_height: '1.3',
    h4_size: '1.5rem',
    h4_weight: '600',
    h5_size: '1.25rem',
    h5_weight: '600',
    h6_size: '1rem',
    h6_weight: '600',
    body_size: '1rem',
    body_line_height: '1.6',
    body_letter_spacing: '0',
    custom: {},
    created_at: '',
    updated_at: '',
  }
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

export default function ThemeEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = id === 'novo'

  const [theme, setTheme] = useState<Theme>(createDefaultTheme)
  const [activeSection, setActiveSection] = useState<SectionKey>('typography')
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!isNew && id) {
      getTheme(id)
        .then(setTheme)
        .catch(() => {
          setToast('Erro ao carregar tema')
          navigate('/hub/temas')
        })
        .finally(() => setLoading(false))
    }
  }, [id, isNew, navigate])

  const update = (field: keyof Theme, value: string | number) => {
    setTheme((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'name') {
        next.slug = slugify(value as string)
      }
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (isNew) {
        const created = await createTheme(theme)
        setToast('Tema criado com sucesso!')
        navigate(`/hub/temas/editar/${created.id}`, { replace: true })
      } else {
        await updateTheme(id!, theme)
        setToast('Tema salvo com sucesso!')
      }
    } catch {
      setToast('Erro ao salvar tema')
    } finally {
      setSaving(false)
      setTimeout(() => setToast(''), 2500)
    }
  }

  if (loading) {
    return (
      <div className="theme-editor">
        <div className="theme-editor-loading">Carregando tema...</div>
      </div>
    )
  }

  return (
    <div className="theme-editor">
      <header className="theme-editor-header">
        <button className="theme-editor-back" onClick={() => navigate('/hub/temas')}>
          ← Voltar
        </button>
        <input
          className="theme-editor-name"
          value={theme.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Nome do tema"
        />
        <button className="theme-editor-save" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </header>

      <div className="theme-editor-body">
        <nav className="theme-editor-nav">
          <div className="theme-editor-nav-title">Seções</div>
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              className={`theme-editor-nav-item ${activeSection === s.key ? 'active' : ''}`}
              onClick={() => setActiveSection(s.key)}
            >
              <span>{s.icon}</span>
              {s.label}
            </button>
          ))}
        </nav>

        <div className="theme-editor-content">
          {activeSection === 'typography' && (
            <TypographySection theme={theme} update={update} />
          )}
          {activeSection === 'colors' && (
            <ColorsSection theme={theme} update={update} />
          )}
          {activeSection === 'spacing' && (
            <SpacingSection theme={theme} update={update} />
          )}
          {activeSection === 'radius' && (
            <RadiusSection theme={theme} update={update} />
          )}
          {activeSection === 'shadows' && (
            <ShadowsSection theme={theme} update={update} />
          )}
          {activeSection === 'container' && (
            <ContainerSection theme={theme} update={update} />
          )}
          {activeSection === 'buttons' && (
            <ButtonsSection theme={theme} update={update} />
          )}
          {activeSection === 'headings' && (
            <HeadingsSection theme={theme} update={update} />
          )}
          {activeSection === 'body' && (
            <BodySection theme={theme} update={update} />
          )}
        </div>
      </div>

      <PreviewBar theme={theme} />

      {toast && <div className="theme-editor-toast">{toast}</div>}
    </div>
  )
}

// ──────────────────────────────────────────────
// SECTIONS
// ──────────────────────────────────────────────

function FontSelect({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="theme-editor-field">
      <span className="theme-editor-label">{label}</span>
      <select className="theme-editor-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {FONT_OPTIONS.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
    </div>
  )
}

function TypographySection({
  theme,
  update,
}: {
  theme: Theme
  update: (f: keyof Theme, v: string | number) => void
}) {
  return (
    <div>
      <h2 className="theme-editor-section-title">Tipografia</h2>
      <div className="theme-editor-group">
        <div className="theme-editor-group-title">Fontes</div>
        <div className="theme-editor-row">
          <FontSelect
            label="Títulos"
            value={theme.font_heading}
            onChange={(v) => update('font_heading', v)}
          />
          <FontSelect
            label="Corpo"
            value={theme.font_body}
            onChange={(v) => update('font_body', v)}
          />
          <FontSelect
            label="Botões"
            value={theme.font_button}
            onChange={(v) => update('font_button', v)}
          />
          <FontSelect
            label="Inputs"
            value={theme.font_input}
            onChange={(v) => update('font_input', v)}
          />
          <FontSelect
            label="Destaque"
            value={theme.font_accent}
            onChange={(v) => update('font_accent', v)}
          />
        </div>
      </div>
      <div className="theme-editor-group">
        <div className="theme-editor-group-title">Escala</div>
        <div className="theme-editor-row">
          <div className="theme-editor-field">
            <span className="theme-editor-label">Font Scale</span>
            <div className="theme-editor-range">
              <input
                type="range"
                min={0.8}
                max={1.4}
                step={0.05}
                value={theme.font_scale}
                onChange={(e) => update('font_scale', parseFloat(e.target.value))}
              />
              <span className="theme-editor-range-value">{theme.font_scale.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="theme-editor-field">
      <span className="theme-editor-label">{label}</span>
      <div className="theme-editor-color-group">
        <input
          className="theme-editor-color-picker"
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          className="theme-editor-color-hex"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  )
}

function ColorsSection({
  theme,
  update,
}: {
  theme: Theme
  update: (f: keyof Theme, v: string | number) => void
}) {
  return (
    <div>
      <h2 className="theme-editor-section-title">Cores</h2>
      <div className="theme-editor-group">
        <div className="theme-editor-group-title">Principais</div>
        <div className="theme-editor-row">
          <ColorField label="Primária" value={theme.color_primary} onChange={(v) => update('color_primary', v)} />
          <ColorField label="Secundária" value={theme.color_secondary} onChange={(v) => update('color_secondary', v)} />
          <ColorField label="Destaque" value={theme.color_accent} onChange={(v) => update('color_accent', v)} />
        </div>
      </div>
      <div className="theme-editor-group">
        <div className="theme-editor-group-title">Superfícies</div>
        <div className="theme-editor-row">
          <ColorField label="Fundo" value={theme.color_background} onChange={(v) => update('color_background', v)} />
          <ColorField label="Superfície" value={theme.color_surface} onChange={(v) => update('color_surface', v)} />
          <ColorField label="Borda" value={theme.color_border} onChange={(v) => update('color_border', v)} />
        </div>
      </div>
      <div className="theme-editor-group">
        <div className="theme-editor-group-title">Texto</div>
        <div className="theme-editor-row">
          <ColorField label="Texto" value={theme.color_text} onChange={(v) => update('color_text', v)} />
          <ColorField label="Texto muted" value={theme.color_text_muted} onChange={(v) => update('color_text_muted', v)} />
          <ColorField label="Texto light" value={theme.color_text_light} onChange={(v) => update('color_text_light', v)} />
        </div>
      </div>
      <div className="theme-editor-group">
        <div className="theme-editor-group-title">Status</div>
        <div className="theme-editor-row">
          <ColorField label="Sucesso" value={theme.color_success} onChange={(v) => update('color_success', v)} />
          <ColorField label="Aviso" value={theme.color_warning} onChange={(v) => update('color_warning', v)} />
          <ColorField label="Erro" value={theme.color_error} onChange={(v) => update('color_error', v)} />
        </div>
      </div>
    </div>
  )
}

function SpacingSection({
  theme,
  update,
}: {
  theme: Theme
  update: (f: keyof Theme, v: string | number) => void
}) {
  const tokens = [
    { key: 'spacing_xs' as const, label: 'XS' },
    { key: 'spacing_sm' as const, label: 'SM' },
    { key: 'spacing_md' as const, label: 'MD' },
    { key: 'spacing_lg' as const, label: 'LG' },
    { key: 'spacing_xl' as const, label: 'XL' },
    { key: 'spacing_2xl' as const, label: '2XL' },
    { key: 'spacing_3xl' as const, label: '3XL' },
    { key: 'spacing_4xl' as const, label: '4XL' },
  ]

  return (
    <div>
      <h2 className="theme-editor-section-title">Espaçamento</h2>
      <div className="theme-editor-row">
        {tokens.map((t) => (
          <div key={t.key} className="theme-editor-field">
            <span className="theme-editor-label">{t.label}</span>
            <input
              className="theme-editor-input"
              value={theme[t.key]}
              onChange={(e) => update(t.key, e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function RadiusSection({
  theme,
  update,
}: {
  theme: Theme
  update: (f: keyof Theme, v: string | number) => void
}) {
  const tokens = [
    { key: 'radius_sm' as const, label: 'SM' },
    { key: 'radius_md' as const, label: 'MD' },
    { key: 'radius_lg' as const, label: 'LG' },
    { key: 'radius_xl' as const, label: 'XL' },
    { key: 'radius_full' as const, label: 'Full' },
  ]

  return (
    <div>
      <h2 className="theme-editor-section-title">Raio de Borda</h2>
      <div className="theme-editor-row">
        {tokens.map((t) => (
          <div key={t.key} className="theme-editor-field">
            <span className="theme-editor-label">{t.label}</span>
            <input
              className="theme-editor-input"
              value={theme[t.key]}
              onChange={(e) => update(t.key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="theme-editor-group" style={{ marginTop: 24 }}>
        <div className="theme-editor-group-title">Preview</div>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {tokens.map((t) => (
            <div
              key={t.key}
              style={{
                width: 64,
                height: 64,
                background: theme.color_primary,
                borderRadius: theme[t.key],
                transition: 'border-radius 0.2s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ShadowsSection({
  theme,
  update,
}: {
  theme: Theme
  update: (f: keyof Theme, v: string | number) => void
}) {
  const tokens = [
    { key: 'shadow_sm' as const, label: 'SM' },
    { key: 'shadow_md' as const, label: 'MD' },
    { key: 'shadow_lg' as const, label: 'LG' },
    { key: 'shadow_xl' as const, label: 'XL' },
  ]

  return (
    <div>
      <h2 className="theme-editor-section-title">Sombras</h2>
      <div className="theme-editor-row">
        {tokens.map((t) => (
          <div key={t.key} className="theme-editor-field">
            <span className="theme-editor-label">{t.label}</span>
            <input
              className="theme-editor-input"
              value={theme[t.key]}
              onChange={(e) => update(t.key, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="theme-editor-group" style={{ marginTop: 24 }}>
        <div className="theme-editor-group-title">Preview</div>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {tokens.map((t) => (
            <div
              key={t.key}
              style={{
                width: 80,
                height: 80,
                background: '#fff',
                borderRadius: '8px',
                boxShadow: theme[t.key],
                transition: 'box-shadow 0.2s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function ContainerSection({
  theme,
  update,
}: {
  theme: Theme
  update: (f: keyof Theme, v: string | number) => void
}) {
  return (
    <div>
      <h2 className="theme-editor-section-title">Container</h2>
      <div className="theme-editor-row">
        <div className="theme-editor-field">
          <span className="theme-editor-label">Largura</span>
          <input
            className="theme-editor-input"
            value={theme.container_width}
            onChange={(e) => update('container_width', e.target.value)}
          />
        </div>
        <div className="theme-editor-field">
          <span className="theme-editor-label">Largura Narrow</span>
          <input
            className="theme-editor-input"
            value={theme.container_width_narrow}
            onChange={(e) => update('container_width_narrow', e.target.value)}
          />
        </div>
        <div className="theme-editor-field">
          <span className="theme-editor-label">Largura Wide</span>
          <input
            className="theme-editor-input"
            value={theme.container_width_wide}
            onChange={(e) => update('container_width_wide', e.target.value)}
          />
        </div>
        <div className="theme-editor-field">
          <span className="theme-editor-label">Padding</span>
          <input
            className="theme-editor-input"
            value={theme.container_padding}
            onChange={(e) => update('container_padding', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

function ButtonsSection({
  theme,
  update,
}: {
  theme: Theme
  update: (f: keyof Theme, v: string | number) => void
}) {
  return (
    <div>
      <h2 className="theme-editor-section-title">Botões</h2>
      <div className="theme-editor-group">
        <div className="theme-editor-group-title">Tipografia</div>
        <div className="theme-editor-sub-row">
          <div className="theme-editor-field">
            <span className="theme-editor-label">Font Size</span>
            <input
              className="theme-editor-input"
              value={theme.button_font_size}
              onChange={(e) => update('button_font_size', e.target.value)}
            />
          </div>
          <div className="theme-editor-field">
            <span className="theme-editor-label">Font Weight</span>
            <input
              className="theme-editor-input"
              value={theme.button_font_weight}
              onChange={(e) => update('button_font_weight', e.target.value)}
            />
          </div>
          <div className="theme-editor-field">
            <span className="theme-editor-label">Padding X</span>
            <input
              className="theme-editor-input"
              value={theme.button_padding_x}
              onChange={(e) => update('button_padding_x', e.target.value)}
            />
          </div>
          <div className="theme-editor-field">
            <span className="theme-editor-label">Padding Y</span>
            <input
              className="theme-editor-input"
              value={theme.button_padding_y}
              onChange={(e) => update('button_padding_y', e.target.value)}
            />
          </div>
          <div className="theme-editor-field">
            <span className="theme-editor-label">Radius</span>
            <input
              className="theme-editor-input"
              value={theme.button_radius}
              onChange={(e) => update('button_radius', e.target.value)}
            />
          </div>
        </div>
      </div>
      <div className="theme-editor-group">
        <div className="theme-editor-group-title">Cores</div>
        <div className="theme-editor-sub-row">
          <ColorField label="Background" value={theme.button_bg} onChange={(v) => update('button_bg', v)} />
          <ColorField label="Texto" value={theme.button_color} onChange={(v) => update('button_color', v)} />
          <ColorField label="Hover BG" value={theme.button_hover_bg} onChange={(v) => update('button_hover_bg', v)} />
          <ColorField label="Hover Texto" value={theme.button_hover_color} onChange={(v) => update('button_hover_color', v)} />
        </div>
      </div>
    </div>
  )
}

function HeadingsSection({
  theme,
  update,
}: {
  theme: Theme
  update: (f: keyof Theme, v: string | number) => void
}) {
  const headings = [
    { h: 'h1', size: 'h1_size' as const, weight: 'h1_weight' as const, lineHeight: 'h1_line_height' as const },
    { h: 'H2', size: 'h2_size' as const, weight: 'h2_weight' as const, lineHeight: 'h2_line_height' as const },
    { h: 'H3', size: 'h3_size' as const, weight: 'h3_weight' as const, lineHeight: 'h3_line_height' as const },
    { h: 'H4', size: 'h4_size' as const, weight: 'h4_weight' as const, lineHeight: '' as const },
    { h: 'H5', size: 'h5_size' as const, weight: 'h5_weight' as const, lineHeight: '' as const },
    { h: 'H6', size: 'h6_size' as const, weight: 'h6_weight' as const, lineHeight: '' as const },
  ]

  return (
    <div>
      <h2 className="theme-editor-section-title">Títulos</h2>
      {headings.map((item) => (
        <div key={item.h} className="theme-editor-group">
          <div className="theme-editor-group-title">{item.h}</div>
          <div className="theme-editor-sub-row">
            <div className="theme-editor-field">
              <span className="theme-editor-label">Tamanho</span>
              <input
                className="theme-editor-input"
                value={theme[item.size]}
                onChange={(e) => update(item.size, e.target.value)}
              />
            </div>
            <div className="theme-editor-field">
              <span className="theme-editor-label">Peso</span>
              <input
                className="theme-editor-input"
                value={theme[item.weight]}
                onChange={(e) => update(item.weight, e.target.value)}
              />
            </div>
            {item.lineHeight && (
              <div className="theme-editor-field">
                <span className="theme-editor-label">Line Height</span>
                <input
                  className="theme-editor-input"
                  value={theme[item.lineHeight as keyof Theme] as string}
                  onChange={(e) => update(item.lineHeight as keyof Theme, e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function BodySection({
  theme,
  update,
}: {
  theme: Theme
  update: (f: keyof Theme, v: string | number) => void
}) {
  return (
    <div>
      <h2 className="theme-editor-section-title">Corpo</h2>
      <div className="theme-editor-row">
        <div className="theme-editor-field">
          <span className="theme-editor-label">Tamanho</span>
          <input
            className="theme-editor-input"
            value={theme.body_size}
            onChange={(e) => update('body_size', e.target.value)}
          />
        </div>
        <div className="theme-editor-field">
          <span className="theme-editor-label">Line Height</span>
          <input
            className="theme-editor-input"
            value={theme.body_line_height}
            onChange={(e) => update('body_line_height', e.target.value)}
          />
        </div>
        <div className="theme-editor-field">
          <span className="theme-editor-label">Letter Spacing</span>
          <input
            className="theme-editor-input"
            value={theme.body_letter_spacing}
            onChange={(e) => update('body_letter_spacing', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────
// PREVIEW BAR
// ──────────────────────────────────────────────

function PreviewBar({ theme }: { theme: Theme }) {
  return (
    <div className="theme-editor-preview">
      <div className="theme-editor-preview-title">Preview</div>
      <div className="theme-editor-preview-row">
        <div className="theme-editor-preview-buttons">
          <button
            style={{
              fontFamily: theme.font_button,
              fontSize: theme.button_font_size,
              fontWeight: theme.button_font_weight,
              padding: `${theme.button_padding_y} ${theme.button_padding_x}`,
              borderRadius: theme.button_radius,
              background: theme.button_bg,
              color: theme.button_color,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Botão Primário
          </button>
          <button
            style={{
              fontFamily: theme.font_button,
              fontSize: theme.button_font_size,
              fontWeight: theme.button_font_weight,
              padding: `${theme.button_padding_y} ${theme.button_padding_x}`,
              borderRadius: theme.button_radius,
              background: 'transparent',
              color: theme.color_primary,
              border: `2px solid ${theme.color_primary}`,
              cursor: 'pointer',
            }}
          >
            Outline
          </button>
        </div>

        <div>
          <h2
            className="theme-editor-preview-heading"
            style={{
              fontFamily: theme.font_heading,
              fontSize: `calc(${theme.h2_size} * ${theme.font_scale})`,
              fontWeight: theme.h2_weight,
              lineHeight: theme.h2_line_height,
            }}
          >
            Heading 2
          </h2>
        </div>

        <div>
          <h3
            className="theme-editor-preview-heading"
            style={{
              fontFamily: theme.font_heading,
              fontSize: `calc(${theme.h4_size} * ${theme.font_scale})`,
              fontWeight: theme.h4_weight,
              lineHeight: 1.3,
            }}
          >
            Heading 4
          </h3>
        </div>

        <div>
          <p
            className="theme-editor-preview-text"
            style={{
              fontFamily: theme.font_body,
              fontSize: `calc(${theme.body_size} * ${theme.font_scale})`,
              lineHeight: theme.body_line_height,
              letterSpacing: theme.body_letter_spacing,
              margin: 0,
            }}
          >
            Texto de exemplo para visualizar o corpo com a tipografia definida no tema.
          </p>
        </div>
      </div>
    </div>
  )
}
