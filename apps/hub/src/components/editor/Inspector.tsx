import type { PageSection, PageContainer, PageWidget, EditorTab } from '../../types/pageBuilder'

interface InspectorItem {
  type: 'section' | 'container' | 'widget'
  item: PageSection | PageContainer | PageWidget
  sectionId?: string
  containerId?: string
}

interface Props {
  item: InspectorItem
  tab: EditorTab
  onTabChange: (tab: EditorTab) => void
  onUpdateSection: (updates: Partial<PageSection>) => void
  onUpdateContainer: (updates: Partial<PageContainer>) => void
  onUpdateWidget: (updates: Partial<PageWidget>) => void
  onDelete: () => void
}

export default function Inspector({ item, tab, onTabChange, onUpdateSection, onUpdateContainer, onUpdateWidget, onDelete }: Props) {
  function update(key: string, value: any) {
    if (item.type === 'section') onUpdateSection({ [key]: value } as any)
    if (item.type === 'container') onUpdateContainer({ [key]: value } as any)
    if (item.type === 'widget') onUpdateWidget({ [key]: value } as any)
  }

  const obj = item.item as any

  return (
    <div className="inspector-panel">
      {/* Tab bar */}
      <div className="inspector-tabs">
        {(['content', 'style', 'advanced'] as EditorTab[]).map(t => (
          <button
            key={t}
            className={`inspector-tab ${tab === t ? 'active' : ''}`}
            onClick={() => onTabChange(t)}
          >
            {t === 'content' ? 'Conteúdo' : t === 'style' ? 'Estilo' : 'Avançado'}
          </button>
        ))}
      </div>

      <div className="inspector-body">
        {/* ===== CONTENT TAB ===== */}
        {tab === 'content' && (
          <>
            {item.type === 'section' && (
              <>
                <Group label="Layout">
                  <Field label="Largura">
                    <Select value={obj.layout || 'boxed'} onChange={(v) => update('layout', v)} options={[
                      { value: 'boxed', label: 'Boxed' },
                      { value: 'full', label: 'Full Width' },
                      { value: 'wide', label: 'Wide' },
                    ]} />
                  </Field>
                  <Field label="Direção">
                    <Select value={obj.direction || 'column'} onChange={(v) => update('direction', v)} options={[
                      { value: 'column', label: 'Coluna' },
                      { value: 'row', label: 'Linha' },
                    ]} />
                  </Field>
                  <Field label="Largura Máxima">
                    <Input value={obj.max_width || ''} onChange={(v) => update('max_width', v)} placeholder="1200px" />
                  </Field>
                  <Field label="Gap">
                    <Input value={obj.gap || '0'} onChange={(v) => update('gap', v)} placeholder="16px" />
                  </Field>
                  <Field label="Altura Mínima">
                    <Input value={obj.min_height || ''} onChange={(v) => update('min_height', v)} placeholder="auto" />
                  </Field>
                </Group>
              </>
            )}

            {item.type === 'container' && (
              <>
                <Group label="Layout">
                  <Field label="Direção">
                    <Select value={obj.direction || 'row'} onChange={(v) => update('direction', v)} options={[
                      { value: 'row', label: 'Linha (row)' },
                      { value: 'column', label: 'Coluna (column)' },
                    ]} />
                  </Field>
                  <Field label="Gap">
                    <Input value={obj.gap || '16px'} onChange={(v) => update('gap', v)} />
                  </Field>
                  <Field label="Alinhar Itens">
                    <Select value={obj.align_items || 'stretch'} onChange={(v) => update('align_items', v)} options={[
                      { value: 'stretch', label: 'Stretch' },
                      { value: 'flex-start', label: 'Início' },
                      { value: 'center', label: 'Centro' },
                      { value: 'flex-end', label: 'Fim' },
                    ]} />
                  </Field>
                  <Field label="Justificar Conteúdo">
                    <Select value={obj.justify_content || 'flex-start'} onChange={(v) => update('justify_content', v)} options={[
                      { value: 'flex-start', label: 'Início' },
                      { value: 'center', label: 'Centro' },
                      { value: 'flex-end', label: 'Fim' },
                      { value: 'space-between', label: 'Espaço Entre' },
                      { value: 'space-around', label: 'Espaço Ao Redor' },
                    ]} />
                  </Field>
                </Group>
              </>
            )}

            {item.type === 'widget' && (
              <>
                {item.item.type === 'heading' && (
                  <Group label="Título">
                    <Field label="Texto">
                      <Input value={obj.content?.text || ''} onChange={(v) => update('content', { ...obj.content, text: v })} />
                    </Field>
                    <Field label="Tag">
                      <Select value={obj.content?.tag || 'h2'} onChange={(v) => update('content', { ...obj.content, tag: v })} options={[
                        { value: 'h1', label: 'H1' },
                        { value: 'h2', label: 'H2' },
                        { value: 'h3', label: 'H3' },
                        { value: 'h4', label: 'H4' },
                        { value: 'h5', label: 'H5' },
                        { value: 'h6', label: 'H6' },
                      ]} />
                    </Field>
                  </Group>
                )}

                {(item.item.type === 'text') && (
                  <Group label="Texto">
                    <Field label="Conteúdo">
                      <Textarea value={obj.content?.text || obj.content?.html || ''} onChange={(v) => update('content', { ...obj.content, text: v })} rows={6} />
                    </Field>
                  </Group>
                )}

                {item.item.type === 'button' && (
                  <Group label="Botão">
                    <Field label="Texto">
                      <Input value={obj.content?.label || ''} onChange={(v) => update('content', { ...obj.content, label: v })} />
                    </Field>
                    <Field label="Link">
                      <Input value={obj.content?.button_link || ''} onChange={(v) => update('content', { ...obj.content, button_link: v })} placeholder="/url" />
                    </Field>
                    <Field label="Variante">
                      <Select value={obj.content?.button_variant || 'primary'} onChange={(v) => update('content', { ...obj.content, button_variant: v })} options={[
                        { value: 'primary', label: 'Primário' },
                        { value: 'secondary', label: 'Secundário' },
                        { value: 'outline', label: 'Outline' },
                        { value: 'ghost', label: 'Ghost' },
                        { value: 'link', label: 'Link' },
                      ]} />
                    </Field>
                    <Field label="Tamanho">
                      <Select value={obj.content?.button_size || 'md'} onChange={(v) => update('content', { ...obj.content, button_size: v })} options={[
                        { value: 'sm', label: 'Pequeno' },
                        { value: 'md', label: 'Médio' },
                        { value: 'lg', label: 'Grande' },
                      ]} />
                    </Field>
                  </Group>
                )}

                {item.item.type === 'image' && (
                  <Group label="Imagem">
                    <Field label="URL">
                      <Input value={obj.content?.image || ''} onChange={(v) => update('content', { ...obj.content, image: v })} placeholder="https://..." />
                    </Field>
                    <Field label="Alt Text">
                      <Input value={obj.content?.alt || ''} onChange={(v) => update('content', { ...obj.content, alt: v })} />
                    </Field>
                    <Field label="Link">
                      <Input value={obj.content?.link || ''} onChange={(v) => update('content', { ...obj.content, link: v })} />
                    </Field>
                  </Group>
                )}

                {item.item.type === 'video' && (
                  <Group label="Vídeo">
                    <Field label="URL">
                      <Input value={obj.content?.video_url || ''} onChange={(v) => update('content', { ...obj.content, video_url: v })} placeholder="YouTube/Vimeo URL" />
                    </Field>
                    <Field label="Tipo">
                      <Select value={obj.content?.video_type || 'youtube'} onChange={(v) => update('content', { ...obj.content, video_type: v })} options={[
                        { value: 'youtube', label: 'YouTube' },
                        { value: 'vimeo', label: 'Vimeo' },
                        { value: 'mp4', label: 'MP4' },
                        { value: 'embed', label: 'Embed' },
                      ]} />
                    </Field>
                  </Group>
                )}

                {item.item.type === 'spacer' && (
                  <Group label="Espaço">
                    <Field label="Altura">
                      <Input value={obj.content?.height || '40px'} onChange={(v) => update('content', { ...obj.content, height: v })} />
                    </Field>
                  </Group>
                )}

                {item.item.type === 'cta' && (
                  <Group label="CTA">
                    <Field label="Título">
                      <Input value={obj.content?.cta_title || ''} onChange={(v) => update('content', { ...obj.content, cta_title: v })} />
                    </Field>
                    <Field label="Texto">
                      <Input value={obj.content?.cta_text || ''} onChange={(v) => update('content', { ...obj.content, cta_text: v })} />
                    </Field>
                    <Field label="Botão">
                      <Input value={obj.content?.cta_button || ''} onChange={(v) => update('content', { ...obj.content, cta_button: v })} />
                    </Field>
                    <Field label="Link">
                      <Input value={obj.content?.cta_link || ''} onChange={(v) => update('content', { ...obj.content, cta_link: v })} />
                    </Field>
                  </Group>
                )}

                {item.item.type === 'icon' && (
                  <Group label="Ícone">
                    <Field label="Ícone">
                      <Input value={obj.content?.icon || ''} onChange={(v) => update('content', { ...obj.content, icon: v })} placeholder="★" />
                    </Field>
                  </Group>
                )}

                {item.item.type === 'html' && (
                  <Group label="HTML">
                    <Field label="Código">
                      <Textarea value={obj.content?.html_code || ''} onChange={(v) => update('content', { ...obj.content, html_code: v })} rows={10} />
                    </Field>
                  </Group>
                )}
              </>
            )}
          </>
        )}

        {/* ===== STYLE TAB ===== */}
        {tab === 'style' && (
          <>
            {/* Background */}
            {(item.type === 'section' || item.type === 'container') && (
              <Group label="Fundo">
                <Field label="Tipo">
                  <Select value={obj.bg_type || 'none'} onChange={(v) => update('bg_type', v)} options={[
                    { value: 'none', label: 'Nenhum' },
                    { value: 'color', label: 'Cor' },
                    { value: 'image', label: 'Imagem' },
                    { value: 'gradient', label: 'Gradiente' },
                  ]} />
                </Field>
                {obj.bg_type === 'color' && (
                  <Field label="Cor">
                    <ColorInput value={obj.bg_color || ''} onChange={(v) => update('bg_color', v)} />
                  </Field>
                )}
                {obj.bg_type === 'image' && (
                  <Field label="URL da Imagem">
                    <Input value={obj.bg_image || ''} onChange={(v) => update('bg_image', v)} />
                  </Field>
                )}
                {obj.bg_type === 'gradient' && (
                  <Field label="Gradiente CSS">
                    <Input value={obj.bg_gradient || ''} onChange={(v) => update('bg_gradient', v)} placeholder="linear-gradient(...)" />
                  </Field>
                )}
              </Group>
            )}

            {/* Typography (widget only for simplicity) */}
            {item.type === 'widget' && (
              <Group label="Tipografia">
                <Field label="Família">
                  <Input value={obj.font_family || ''} onChange={(v) => update('font_family', v)} placeholder="Herdado do tema" />
                </Field>
                <Field label="Tamanho">
                  <Input value={obj.font_size || ''} onChange={(v) => update('font_size', v)} placeholder="ex: 1.5rem" />
                </Field>
                <Field label="Peso">
                  <Select value={obj.font_weight || ''} onChange={(v) => update('font_weight', v)} options={[
                    { value: '', label: 'Herdado' },
                    { value: '400', label: '400' },
                    { value: '500', label: '500' },
                    { value: '600', label: '600' },
                    { value: '700', label: '700' },
                  ]} />
                </Field>
                <Field label="Line Height">
                  <Input value={obj.line_height || ''} onChange={(v) => update('line_height', v)} placeholder="ex: 1.5" />
                </Field>
                <Field label="Letter Spacing">
                  <Input value={obj.letter_spacing || ''} onChange={(v) => update('letter_spacing', v)} />
                </Field>
                <Field label="Cor">
                  <ColorInput value={obj.color || ''} onChange={(v) => update('color', v)} />
                </Field>
                <Field label="Alinhamento">
                  <Select value={obj.text_align || ''} onChange={(v) => update('text_align', v)} options={[
                    { value: '', label: 'Herdado' },
                    { value: 'left', label: 'Esquerda' },
                    { value: 'center', label: 'Centro' },
                    { value: 'right', label: 'Direita' },
                  ]} />
                </Field>
                <Field label="Transform">
                  <Select value={obj.text_transform || ''} onChange={(v) => update('text_transform', v)} options={[
                    { value: '', label: 'Nenhum' },
                    { value: 'uppercase', label: 'UPPERCASE' },
                    { value: 'lowercase', label: 'lowercase' },
                    { value: 'capitalize', label: 'Capitalize' },
                  ]} />
                </Field>
              </Group>
            )}

            {/* Widget background */}
            {item.type === 'widget' && (
              <Group label="Fundo">
                <Field label="Tipo">
                  <Select value={obj.bg_type || 'none'} onChange={(v) => update('bg_type', v)} options={[
                    { value: 'none', label: 'Nenhum' },
                    { value: 'color', label: 'Cor' },
                    { value: 'image', label: 'Imagem' },
                    { value: 'gradient', label: 'Gradiente' },
                  ]} />
                </Field>
                {obj.bg_type === 'color' && (
                  <Field label="Cor">
                    <ColorInput value={obj.bg_color || ''} onChange={(v) => update('bg_color', v)} />
                  </Field>
                )}
              </Group>
            )}

            {/* Border */}
            <Group label="Borda">
              <Field label="Estilo">
                <Select value={obj.border_style || (item.type === 'container' ? obj.border : '') || ''} onChange={(v) => update(item.type === 'container' ? 'border' : 'border_style', v)} options={[
                  { value: '', label: 'Nenhuma' },
                  { value: 'solid', label: 'Sólida' },
                  { value: 'dashed', label: 'Tracejada' },
                  { value: 'dotted', label: 'Pontilhada' },
                ]} />
              </Field>
              {(obj.border_style || obj.border) && (
                <>
                  <Field label="Espessura">
                    <Input value={obj.border_width || ''} onChange={(v) => update('border_width', v)} placeholder="1px" />
                  </Field>
                  <Field label="Cor">
                    <ColorInput value={obj.border_color || ''} onChange={(v) => update('border_color', v)} />
                  </Field>
                </>
              )}
              <Field label="Raio">
                <Input value={obj.border_radius || ''} onChange={(v) => update('border_radius', v)} placeholder="8px" />
              </Field>
              <Field label="Sombra">
                <Input value={obj.box_shadow || ''} onChange={(v) => update('box_shadow', v)} placeholder="0 4px 6px rgba(0,0,0,0.1)" />
              </Field>
            </Group>

            {/* Hover (widget only) */}
            {item.type === 'widget' && (
              <Group label="Hover">
                <Field label="Cor do Texto">
                  <ColorInput value={obj.hover?.color || ''} onChange={(v) => update('hover', { ...obj.hover, color: v })} />
                </Field>
                <Field label="Cor de Fundo">
                  <ColorInput value={obj.hover?.bg_color || ''} onChange={(v) => update('hover', { ...obj.hover, bg_color: v })} />
                </Field>
                <Field label="Transform">
                  <Input value={obj.hover?.transform || ''} onChange={(v) => update('hover', { ...obj.hover, transform: v })} placeholder="scale(1.05)" />
                </Field>
                <Field label="Transição">
                  <Input value={obj.hover?.transition || ''} onChange={(v) => update('hover', { ...obj.hover, transition: v })} placeholder="all 0.3s" />
                </Field>
              </Group>
            )}
          </>
        )}

        {/* ===== ADVANCED TAB ===== */}
        {tab === 'advanced' && (
          <>
            {/* Spacing */}
            <Group label="Espaçamento">
              {item.type === 'widget' ? (
                <>
                  <FourField
                    top={obj.margin_top || ''} right={obj.margin_right || ''} bottom={obj.margin_bottom || ''} left={obj.margin_left || ''}
                    onChange={(side, v) => update(`margin_${side}`, v)}
                    label="Margin"
                  />
                  <FourField
                    top={obj.padding_top || ''} right={obj.padding_right || ''} bottom={obj.padding_bottom || ''} left={obj.padding_left || ''}
                    onChange={(side, v) => update(`padding_${side}`, v)}
                    label="Padding"
                  />
                </>
              ) : (
                <>
                  <FourField
                    top={obj.padding_top || ''} right={obj.padding_right || ''} bottom={obj.padding_bottom || ''} left={obj.padding_left || ''}
                    onChange={(side, v) => update(`padding_${side}`, v)}
                    label="Padding"
                  />
                  {item.type === 'section' && (
                    <>
                      <Field label="Margin Top">
                        <Input value={obj.margin_top || ''} onChange={(v) => update('margin_top', v)} placeholder="0" />
                      </Field>
                      <Field label="Margin Bottom">
                        <Input value={obj.margin_bottom || ''} onChange={(v) => update('margin_bottom', v)} placeholder="0" />
                      </Field>
                    </>
                  )}
                </>
              )}
            </Group>

            {/* Sizing (widget) */}
            {item.type === 'widget' && (
              <Group label="Dimensões">
                <Field label="Largura">
                  <Input value={obj.width || ''} onChange={(v) => update('width', v)} placeholder="100%" />
                </Field>
                <Field label="Largura Máxima">
                  <Input value={obj.max_width || ''} onChange={(v) => update('max_width', v)} />
                </Field>
                <Field label="Altura Mínima">
                  <Input value={obj.min_height || ''} onChange={(v) => update('min_height', v)} />
                </Field>
              </Group>
            )}

            {/* Position (widget) */}
            {item.type === 'widget' && (
              <Group label="Posição">
                <Field label="Posição">
                  <Select value={obj.position || 'default'} onChange={(v) => update('position', v)} options={[
                    { value: 'default', label: 'Normal' },
                    { value: 'relative', label: 'Relativo' },
                    { value: 'absolute', label: 'Absoluto' },
                    { value: 'fixed', label: 'Fixo' },
                    { value: 'sticky', label: 'Sticky' },
                  ]} />
                </Field>
                <Field label="Z-Index">
                  <Input value={obj.z_index || ''} onChange={(v) => update('z_index', v)} />
                </Field>
                <Field label="Overflow">
                  <Select value={obj.overflow || ''} onChange={(v) => update('overflow', v)} options={[
                    { value: '', label: 'Visível' },
                    { value: 'hidden', label: 'Hidden' },
                    { value: 'scroll', label: 'Scroll' },
                    { value: 'auto', label: 'Auto' },
                  ]} />
                </Field>
              </Group>
            )}

            {/* Responsive */}
            <Group label="Responsividade">
              <Field label="Ocultar no Desktop">
                <Toggle checked={obj.hide_on_desktop || false} onChange={(v) => update('hide_on_desktop', v)} />
              </Field>
              <Field label="Ocultar no Tablet">
                <Toggle checked={obj.hide_on_tablet || false} onChange={(v) => update('hide_on_tablet', v)} />
              </Field>
              <Field label="Ocultar no Mobile">
                <Toggle checked={obj.hide_on_mobile || false} onChange={(v) => update('hide_on_mobile', v)} />
              </Field>
            </Group>

            {/* Animation */}
            <Group label="Animação">
              <Field label="Tipo">
                <Select value={obj.animation_type || 'none'} onChange={(v) => update('animation_type', v)} options={[
                  { value: 'none', label: 'Nenhuma' },
                  { value: 'fade', label: 'Fade' },
                  { value: 'slide-up', label: 'Slide Up' },
                  { value: 'slide-down', label: 'Slide Down' },
                  { value: 'slide-left', label: 'Slide Left' },
                  { value: 'slide-right', label: 'Slide Right' },
                  { value: 'scale', label: 'Scale' },
                  { value: 'reveal', label: 'Reveal' },
                ]} />
              </Field>
              {obj.animation_type !== 'none' && (
                <>
                  <Field label="Duração">
                    <Input value={obj.animation_duration || '0.6s'} onChange={(v) => update('animation_duration', v)} />
                  </Field>
                  <Field label="Delay">
                    <Input value={obj.animation_delay || '0s'} onChange={(v) => update('animation_delay', v)} />
                  </Field>
                </>
              )}
            </Group>

            {/* Custom CSS */}
            <Group label="CSS Personalizado">
              <Field label="Classe CSS">
                <Input value={obj.custom_class || ''} onChange={(v) => update('custom_class', v)} placeholder="minha-classe" />
              </Field>
              {item.type === 'widget' && (
                <Field label="ID HTML">
                  <Input value={obj.html_id || ''} onChange={(v) => update('html_id', v)} />
                </Field>
              )}
              <Field label="CSS Custom">
                <Textarea value={obj.custom_css || ''} onChange={(v) => update('custom_css', v)} rows={6} placeholder=".meu-elemento { ... }" />
              </Field>
            </Group>
          </>
        )}

        {/* Delete */}
        <div className="inspector-divider" />
        <button className="inspector-delete-btn" onClick={onDelete}>
          Excluir {item.type === 'section' ? 'seção' : item.type === 'container' ? 'container' : 'widget'}
        </button>
      </div>
    </div>
  )
}

// ============================================================
// REUSABLE FORM COMPONENTS
// ============================================================

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="inspector-group">
      <button className="group-header" onClick={() => setOpen(!open)}>
        <span className={`group-arrow ${open ? 'open' : ''}`}>›</span>
        {label}
      </button>
      {open && <div className="group-body">{children}</div>}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="inspector-field">
      <label>{label}</label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input className="inspector-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
}

function Textarea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea className="inspector-textarea" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} />
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select className="inspector-select" value={value} onChange={(e) => onChange(e.target.value)}>
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="inspector-color-row">
      <input type="color" className="inspector-color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)} />
      <input className="inspector-input" value={value} onChange={(e) => onChange(e.target.value)} placeholder="#000000" />
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="inspector-toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-slider" />
    </label>
  )
}

function FourField({ top, right, bottom, left, onChange, label }: {
  top: string; right: string; bottom: string; left: string;
  onChange: (side: string, v: string) => void; label: string
}) {
  return (
    <div className="inspector-four-field">
      <span className="four-field-label">{label}</span>
      <div className="four-field-grid">
        <input placeholder="Top" value={top} onChange={(e) => onChange('top', e.target.value)} />
        <input placeholder="Right" value={right} onChange={(e) => onChange('right', e.target.value)} />
        <input placeholder="Bottom" value={bottom} onChange={(e) => onChange('bottom', e.target.value)} />
        <input placeholder="Left" value={left} onChange={(e) => onChange('left', e.target.value)} />
      </div>
    </div>
  )
}
