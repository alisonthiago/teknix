import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface Page {
  id: string
  title: string
  slug: string
  status: string
  meta_title?: string
  meta_description?: string
}

interface PageSection {
  id: string
  page_id: string
  name?: string
  order: number
  bg_type?: 'color' | 'image' | 'gradient'
  bg_value?: string
  padding_top?: number
  padding_bottom?: number
  padding_left?: number
  padding_right?: number
  min_height?: number
  max_width?: number
}

interface PageContainer {
  id: string
  section_id: string
  order: number
  columns?: number
  width?: string
  max_width?: number
  alignment?: string
}

interface PageWidget {
  id: string
  container_id: string
  type: string
  order: number
  content: Record<string, unknown>
  style: Record<string, unknown>
}

interface WidgetRendererProps {
  widget: PageWidget
}

function WidgetRenderer({ widget }: WidgetRendererProps) {
  const { type, content, style } = widget

  const inlineStyle: React.CSSProperties = {}
  if (style) {
    if (style.font_size) inlineStyle.fontSize = style.font_size
    if (style.color) inlineStyle.color = style.color
    if (style.font_weight) inlineStyle.fontWeight = style.font_weight as React.CSSProperties['fontWeight']
    if (style.text_align) inlineStyle.textAlign = style.text_align as React.CSSProperties['textAlign']
    if (style.padding) inlineStyle.padding = style.padding
    if (style.margin) inlineStyle.margin = style.margin
    if (style.background_color) inlineStyle.backgroundColor = style.background_color
    if (style.border_radius) inlineStyle.borderRadius = style.border_radius
    if (style.border) inlineStyle.border = style.border
    if (style.max_width) inlineStyle.maxWidth = style.max_width
    if (style.width) inlineStyle.width = style.width
    if (style.display) inlineStyle.display = style.display as React.CSSProperties['display']
    if (style.gap) inlineStyle.gap = style.gap
    if (style.flex_direction) inlineStyle.flexDirection = style.flex_direction as React.CSSProperties['flexDirection']
    if (style.align_items) inlineStyle.alignItems = style.align_items as React.CSSProperties['alignItems']
    if (style.justify_content) inlineStyle.justifyContent = style.justify_content as React.CSSProperties['justifyContent']
    if (style.line_height) inlineStyle.lineHeight = style.line_height
    if (style.letter_spacing) inlineStyle.letterSpacing = style.letter_spacing
    if (style.text_transform) inlineStyle.textTransform = style.text_transform as React.CSSProperties['textTransform']
    if (style.box_shadow) inlineStyle.boxShadow = style.box_shadow
    if (style.opacity) inlineStyle.opacity = style.opacity
  }

  switch (type) {
    case 'heading': {
      const Tag = ((content.tag as string) || 'h2') as keyof JSX.IntrinsicElements
      return <Tag style={inlineStyle}>{content.text as string}</Tag>
    }

    case 'text':
      return (
        <div
          style={inlineStyle}
          dangerouslySetInnerHTML={{ __html: (content.text as string) || '' }}
        />
      )

    case 'image':
      return (
        <img
          src={content.image as string}
          alt={(content.alt as string) || ''}
          style={{ maxWidth: '100%', ...inlineStyle }}
        />
      )

    case 'button':
      return (
        <a href={content.button_link as string || '#'} style={{ textDecoration: 'none' }}>
          <button style={inlineStyle}>
            {content.label as string}
          </button>
        </a>
      )

    case 'spacer':
      return <div style={{ height: (content.height as number) || 50, ...inlineStyle }} />

    case 'divider':
      return <hr style={{ border: 'none', borderTop: '1px solid #ccc', ...inlineStyle }} />

    case 'video':
      return content.url ? (
        <iframe
          src={content.url as string}
          style={{ width: '100%', aspectRatio: '16/9', border: 'none', ...inlineStyle }}
          allowFullScreen
        />
      ) : (
        <div style={{ background: '#f0f0f0', padding: 40, textAlign: 'center', ...inlineStyle }}>
          Video placeholder
        </div>
      )

    case 'icon':
      return <span style={inlineStyle}>{content.icon as string}</span>

    case 'product':
      return (
        <div style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, ...inlineStyle }}>
          {content.image && <img src={content.image as string} alt="" style={{ width: '100%', borderRadius: 4 }} />}
          <p style={{ fontWeight: 600, marginTop: 8 }}>{content.name as string || 'Product'}</p>
          {content.price && <p>{content.price}</p>}
        </div>
      )

    case 'productGrid':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, ...inlineStyle }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, textAlign: 'center' }}>
              <div style={{ background: '#f5f5f5', height: 120, borderRadius: 4 }} />
              <p style={{ fontWeight: 600, marginTop: 8 }}>Product {i}</p>
            </div>
          ))}
        </div>
      )

    case 'categories':
      return (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', ...inlineStyle }}>
          {['Category 1', 'Category 2', 'Category 3'].map((cat) => (
            <div key={cat} style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, minWidth: 120, textAlign: 'center' }}>
              <p>{cat}</p>
            </div>
          ))}
        </div>
      )

    case 'cta':
      return (
        <div style={{ background: (content.bg_color as string) || '#007bff', color: '#fff', padding: '40px 20px', textAlign: 'center', borderRadius: 8, ...inlineStyle }}>
          {content.cta_title && <h2 style={{ margin: '0 0 12px' }}>{content.cta_title as string}</h2>}
          {content.cta_text && <p style={{ margin: '0 0 20px' }}>{content.cta_text as string}</p>}
          {content.cta_button && (
            <a href={content.cta_link as string || '#'} style={{ textDecoration: 'none' }}>
              <button style={{ background: '#fff', color: (content.bg_color as string) || '#007bff', border: 'none', padding: '12px 24px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>
                {content.cta_button as string}
              </button>
            </a>
          )}
        </div>
      )

    case 'html':
      return (
        <div
          style={inlineStyle}
          dangerouslySetInnerHTML={{ __html: (content.html_code as string) || '' }}
        />
      )

    case 'gallery':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8, ...inlineStyle }}>
          {(Array.isArray(content.images) ? content.images : []).map((img, i) => (
            <img key={i} src={img as string} alt="" style={{ width: '100%', borderRadius: 4 }} />
          ))}
        </div>
      )

    case 'carousel':
      return (
        <div style={{ display: 'flex', overflowX: 'auto', gap: 16, ...inlineStyle }}>
          {(Array.isArray(content.images) ? content.images : []).map((img, i) => (
            <img key={i} src={img as string} alt="" style={{ minWidth: 300, borderRadius: 4 }} />
          ))}
        </div>
      )

    case 'faq':
      return (
        <div style={inlineStyle}>
          {(Array.isArray(content.items) ? content.items : []).map((item: Record<string, unknown>, i: number) => (
            <details key={i} style={{ borderBottom: '1px solid #eee', padding: '12px 0' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600 }}>{item.question as string}</summary>
              <p style={{ marginTop: 8, color: '#555' }}>{item.answer as string}</p>
            </details>
          ))}
        </div>
      )

    case 'testimonials':
      return (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', ...inlineStyle }}>
          {(Array.isArray(content.items) ? content.items : []).map((item: Record<string, unknown>, i: number) => (
            <div key={i} style={{ minWidth: 250, background: '#f9f9f9', borderRadius: 8, padding: 16 }}>
              <p style={{ fontStyle: 'italic' }}>"{item.text as string}"</p>
              <p style={{ fontWeight: 600, marginTop: 8 }}>— {item.author as string}</p>
            </div>
          ))}
        </div>
      )

    case 'specifications':
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', ...inlineStyle }}>
          <tbody>
            {(Array.isArray(content.items) ? content.items : []).map((item: Record<string, unknown>, i: number) => (
              <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: '8px 12px', fontWeight: 600, width: '40%' }}>{item.label as string}</td>
                <td style={{ padding: '8px 12px' }}>{item.value as string}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )

    case 'banner':
      return (
        <div style={{
          background: content.image ? `url(${content.image}) center/cover` : (content.bg_color as string) || '#333',
          color: '#fff',
          padding: '60px 20px',
          textAlign: 'center',
          ...inlineStyle,
        }}>
          {content.title && <h1 style={{ margin: '0 0 12px' }}>{content.title as string}</h1>}
          {content.subtitle && <p style={{ margin: 0 }}>{content.subtitle as string}</p>}
        </div>
      )

    case 'newsletter':
      return (
        <div style={{ background: '#f5f5f5', padding: 32, borderRadius: 8, textAlign: 'center', ...inlineStyle }}>
          {content.title && <h3 style={{ margin: '0 0 8px' }}>{content.title as string}</h3>}
          {content.text && <p style={{ margin: '0 0 16px', color: '#666' }}>{content.text as string}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', maxWidth: 400, margin: '0 auto' }}>
            <input type="email" placeholder="Seu e-mail" style={{ flex: 1, padding: '10px 14px', borderRadius: 4, border: '1px solid #ccc' }} />
            <button style={{ background: (content.btn_color as string) || '#007bff', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 4, cursor: 'pointer' }}>
              {content.btn_text as string || 'Inscrever'}
            </button>
          </div>
        </div>
      )

    case 'price':
      return (
        <div style={inlineStyle}>
          {content.original_price && (
            <span style={{ textDecoration: 'line-through', color: '#999', marginRight: 8 }}>
              R$ {content.original_price}
            </span>
          )}
          <span style={{ fontSize: 32, fontWeight: 700, color: (content.color as string) || '#00a65a' }}>
            R$ {content.price as string}
          </span>
          {content.installment && (
            <p style={{ color: '#666', margin: '4px 0 0' }}>ou {content.installment as string}</p>
          )}
        </div>
      )

    case 'buyButton':
      return (
        <button style={{
          background: (content.bg_color as string) || '#00a65a',
          color: '#fff',
          border: 'none',
          padding: '14px 32px',
          borderRadius: 6,
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          ...inlineStyle,
        }}>
          {content.label as string || 'Comprar Agora'}
        </button>
      )

    case 'quote':
      return (
        <blockquote style={{
          borderLeft: `4px solid ${(content.border_color as string) || '#007bff'}`,
          margin: 0,
          padding: '16px 24px',
          background: (content.bg_color as string) || '#f9f9f9',
          fontStyle: 'italic',
          ...inlineStyle,
        }}>
          {content.text as string}
          {content.author && <cite style={{ display: 'block', marginTop: 8, fontStyle: 'normal', fontWeight: 600 }}>— {content.author as string}</cite>}
        </blockquote>
      )

    case 'list':
      return (
        <ul style={{ paddingLeft: 20, ...inlineStyle }}>
          {(Array.isArray(content.items) ? content.items : []).map((item: string, i: number) => (
            <li key={i} style={{ marginBottom: 4 }}>{item}</li>
          ))}
        </ul>
      )

    case 'table':
      return (
        <table style={{ width: '100%', borderCollapse: 'collapse', ...inlineStyle }}>
          {content.headers && (
            <thead>
              <tr>
                {(content.headers as string[]).map((h, i) => (
                  <th key={i} style={{ borderBottom: '2px solid #333', padding: '8px 12px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {(Array.isArray(content.rows) ? content.rows : []).map((row: string[], i: number) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} style={{ borderBottom: '1px solid #eee', padding: '8px 12px' }}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )

    default:
      return <div style={{ padding: 16, background: '#fff3cd', color: '#856404' }}>Unknown widget type: {type}</div>
  }
}

export default function PagePreview() {
  const { id } = useParams<{ id: string }>()
  const [page, setPage] = useState<Page | null>(null)
  const [sections, setSections] = useState<PageSection[]>([])
  const [containers, setContainers] = useState<Record<string, PageContainer[]>>({})
  const [widgets, setWidgets] = useState<Record<string, PageWidget[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    setLoading(true)

    async function fetchPage() {
      const { data: pageData } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id)
        .single()

      if (!pageData) {
        setPage(null)
        setLoading(false)
        return
      }

      setPage(pageData)

      const { data: sectionsData } = await supabase
        .from('page_sections')
        .select('*')
        .eq('page_id', pageData.id)
        .order('order')

      if (!sectionsData) {
        setLoading(false)
        return
      }

      setSections(sectionsData)

      const sectionIds = sectionsData.map((s) => s.id)
      const { data: containersData } = await supabase
        .from('page_containers')
        .select('*')
        .in('section_id', sectionIds)
        .order('order')

      if (!containersData) {
        setLoading(false)
        return
      }

      const containerMap: Record<string, PageContainer[]> = {}
      for (const c of containersData) {
        if (!containerMap[c.section_id]) containerMap[c.section_id] = []
        containerMap[c.section_id].push(c)
      }
      setContainers(containerMap)

      const containerIds = containersData.map((c) => c.id)
      const { data: widgetsData } = await supabase
        .from('page_widgets')
        .select('*')
        .in('container_id', containerIds)
        .order('order')

      const widgetMap: Record<string, PageWidget[]> = {}
      if (widgetsData) {
        for (const w of widgetsData) {
          if (!widgetMap[w.container_id]) widgetMap[w.container_id] = []
          widgetMap[w.container_id].push(w)
        }
      }
      setWidgets(widgetMap)

      setLoading(false)
    }

    fetchPage()
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{
          width: 40,
          height: 40,
          border: '4px solid #e0e0e0',
          borderTopColor: '#007bff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  if (!page) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <h1 style={{ fontSize: 48, fontWeight: 700, marginBottom: 12 }}>404</h1>
        <p style={{ fontSize: 18, color: '#666' }}>Página não encontrada</p>
      </div>
    )
  }

  return (
    <div style={{ border: '2px dashed #007bff', minHeight: '100vh' }}>
      <div style={{ background: '#007bff', color: '#fff', padding: '8px 16px', fontSize: 12, position: 'sticky', top: 0, zIndex: 100 }}>
        Preview: {page.title} ({page.status})
      </div>
      {sections.map((section) => {
        const sectionStyle: React.CSSProperties = {}

        if (section.bg_type === 'color' && section.bg_value) {
          sectionStyle.backgroundColor = section.bg_value
        } else if (section.bg_type === 'image' && section.bg_value) {
          sectionStyle.backgroundImage = `url(${section.bg_value})`
          sectionStyle.backgroundSize = 'cover'
          sectionStyle.backgroundPosition = 'center'
        } else if (section.bg_type === 'gradient' && section.bg_value) {
          sectionStyle.background = section.bg_value
        }

        if (section.padding_top != null) sectionStyle.paddingTop = section.padding_top
        if (section.padding_bottom != null) sectionStyle.paddingBottom = section.padding_bottom
        if (section.padding_left != null) sectionStyle.paddingLeft = section.padding_left
        if (section.padding_right != null) sectionStyle.paddingRight = section.padding_right
        if (section.min_height != null) sectionStyle.minHeight = section.min_height

        return (
          <section key={section.id} style={sectionStyle}>
            <div style={{ maxWidth: section.max_width || 1200, margin: '0 auto' }}>
              {(containers[section.id] || []).map((container) => (
                <div
                  key={container.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${container.columns || 1}, 1fr)`,
                    maxWidth: container.max_width,
                    margin: '0 auto',
                    gap: 16,
                  }}
                >
                  {(widgets[container.id] || []).map((widget) => (
                    <WidgetRenderer key={widget.id} widget={widget} />
                  ))}
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
