import React from 'react'

interface PageWidget {
  id: string
  container_id: string
  type: string
  order: number
  content: Record<string, unknown>
  style: Record<string, unknown>
}

function buildInlineStyle(style: Record<string, unknown>): React.CSSProperties {
  if (!style) return {}
  const s: React.CSSProperties = {}
  if (style.font_size) s.fontSize = style.font_size
  if (style.color) s.color = style.color
  if (style.font_weight) s.fontWeight = style.font_weight as React.CSSProperties['fontWeight']
  if (style.text_align) s.textAlign = style.text_align as React.CSSProperties['textAlign']
  if (style.padding) s.padding = style.padding
  if (style.margin) s.margin = style.margin
  if (style.background_color) s.backgroundColor = style.background_color
  if (style.border_radius) s.borderRadius = style.border_radius
  if (style.border) s.border = style.border
  if (style.max_width) s.maxWidth = style.max_width
  if (style.width) s.width = style.width
  if (style.display) s.display = style.display as React.CSSProperties['display']
  if (style.gap) s.gap = style.gap
  if (style.flex_direction) s.flexDirection = style.flex_direction as React.CSSProperties['flexDirection']
  if (style.align_items) s.alignItems = style.align_items as React.CSSProperties['alignItems']
  if (style.justify_content) s.justifyContent = style.justify_content as React.CSSProperties['justifyContent']
  if (style.line_height) s.lineHeight = style.line_height
  if (style.letter_spacing) s.letterSpacing = style.letter_spacing
  if (style.text_transform) s.textTransform = style.text_transform as React.CSSProperties['textTransform']
  if (style.box_shadow) s.boxShadow = style.box_shadow
  if (style.opacity) s.opacity = style.opacity
  return s
}

export default function WidgetRenderer({ widget }: { widget: PageWidget }) {
  const { type, content, style } = widget
  const s = buildInlineStyle(style)

  switch (type) {
    case 'heading': {
      const Tag = ((content.tag as string) || 'h2') as keyof JSX.IntrinsicElements
      return <Tag style={{ letterSpacing: '-0.03em', lineHeight: '1.1', ...s }}>{content.text as string}</Tag>
    }

    case 'text':
      return (
        <div style={{ color: '#6e6e73', lineHeight: '1.7', ...s }} dangerouslySetInnerHTML={{ __html: (content.text as string) || '' }} />
      )

    case 'image':
      return (
        <img src={content.image as string} alt={(content.alt as string) || ''} style={{ maxWidth: '100%', borderRadius: 12, ...s }} />
      )

    case 'button':
      return (
        <a href={content.button_link as string || '#'} style={{ textDecoration: 'none' }}>
          <button style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontWeight: 600, fontSize: '0.9rem', padding: '14px 28px', borderRadius: 980, border: 'none', cursor: 'pointer', background: '#1d1d1f', color: '#fff', transition: 'all 0.3s ease', ...s }}>
            {content.label as string}
          </button>
        </a>
      )

    case 'spacer':
      return <div style={{ height: (content.height as number) || 50, ...s }} />

    case 'divider':
      return <hr style={{ border: 'none', borderTop: '1px solid #e8e8ed', ...s }} />

    case 'video':
      return content.url ? (
        <iframe src={content.url as string} style={{ width: '100%', aspectRatio: '16/9', border: 'none', borderRadius: 12, ...s }} allowFullScreen />
      ) : (
        <div style={{ background: '#f5f5f7', padding: 40, textAlign: 'center', borderRadius: 12, color: '#86868b', ...s }}>
          Vídeo
        </div>
      )

    case 'icon':
      return <span style={{ fontSize: '2rem', ...s }}>{content.icon as string}</span>

    case 'product':
      return (
        <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', ...s }}>
          {content.image && <img src={content.image as string} alt="" style={{ width: '100%', aspectRatio: '1', objectFit: 'cover' }} />}
          <div style={{ padding: 20 }}>
            <p style={{ fontWeight: 600, fontSize: '1rem', marginBottom: 4, color: '#1d1d1f' }}>{content.name as string || 'Produto'}</p>
            {content.price && <p style={{ fontWeight: 700, color: '#1d1d1f' }}>{content.price}</p>}
          </div>
        </div>
      )

    case 'productGrid':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20, ...s }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', textAlign: 'center' }}>
              <div style={{ background: '#f5f5f7', height: 180, borderRadius: '18px 18px 0 0' }} />
              <div style={{ padding: 20 }}>
                <p style={{ fontWeight: 600, color: '#1d1d1f' }}>Produto {i}</p>
              </div>
            </div>
          ))}
        </div>
      )

    case 'categories':
      return (
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', ...s }}>
          {['Categoria 1', 'Categoria 2', 'Categoria 3'].map((cat) => (
            <div key={cat} style={{ background: '#f5f5f7', borderRadius: 18, padding: 20, minWidth: 140, textAlign: 'center', fontWeight: 600, color: '#1d1d1f' }}>
              {cat}
            </div>
          ))}
        </div>
      )

    case 'cta':
      return (
        <div style={{ background: (content.bg_color as string) || '#1d1d1f', color: '#fff', padding: '60px 32px', textAlign: 'center', borderRadius: 24, ...s }}>
          {content.cta_title && <h2 style={{ margin: '0 0 12px', fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.03em' }}>{content.cta_title as string}</h2>}
          {content.cta_text && <p style={{ margin: '0 0 24px', color: 'rgba(255,255,255,0.7)' }}>{content.cta_text as string}</p>}
          {content.cta_button && (
            <a href={content.cta_link as string || '#'} style={{ textDecoration: 'none' }}>
              <button style={{ background: '#fff', color: (content.bg_color as string) || '#1d1d1f', border: 'none', padding: '14px 28px', borderRadius: 980, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                {content.cta_button as string}
              </button>
            </a>
          )}
        </div>
      )

    case 'html':
      return <div style={s} dangerouslySetInnerHTML={{ __html: (content.html_code as string) || '' }} />

    case 'gallery':
      return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, ...s }}>
          {(Array.isArray(content.images) ? content.images : []).map((img, i) => (
            <img key={i} src={img as string} alt="" style={{ width: '100%', borderRadius: 12, objectFit: 'cover', aspectRatio: '1' }} />
          ))}
        </div>
      )

    case 'carousel':
      return (
        <div style={{ display: 'flex', overflowX: 'auto', gap: 16, scrollSnapType: 'x mandatory', paddingBottom: 8, ...s }}>
          {(Array.isArray(content.images) ? content.images : []).map((img, i) => (
            <img key={i} src={img as string} alt="" style={{ minWidth: 320, borderRadius: 12, scrollSnapAlign: 'start', objectFit: 'cover' }} />
          ))}
        </div>
      )

    case 'faq':
      return (
        <div style={{ maxWidth: 720, ...s }}>
          {(Array.isArray(content.items) ? content.items : []).map((item: Record<string, unknown>, i: number) => (
            <details key={i} style={{ borderBottom: '1px solid #e8e8ed', padding: '20px 0' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#1d1d1f', fontSize: '1.05rem', listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {item.question as string}
                <span style={{ color: '#86868b', fontSize: '1.2rem' }}>+</span>
              </summary>
              <p style={{ marginTop: 12, color: '#6e6e73', lineHeight: 1.7 }}>{item.answer as string}</p>
            </details>
          ))}
        </div>
      )

    case 'testimonials':
      return (
        <div style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 8, ...s }}>
          {(Array.isArray(content.items) ? content.items : []).map((item: Record<string, unknown>, i: number) => (
            <div key={i} style={{ minWidth: 280, background: '#f5f5f7', borderRadius: 18, padding: 28 }}>
              <p style={{ fontStyle: 'italic', color: '#1d1d1f', lineHeight: 1.6 }}>"{item.text as string}"</p>
              <p style={{ fontWeight: 600, marginTop: 12, color: '#6e6e73', fontSize: '0.9rem' }}>— {item.author as string}</p>
            </div>
          ))}
        </div>
      )

    case 'specifications':
      return (
        <div style={{ maxWidth: 720, ...s }}>
          {(Array.isArray(content.items) ? content.items : []).map((item: Record<string, unknown>, i: number) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid #e8e8ed' }}>
              <span style={{ fontWeight: 600, color: '#1d1d1f', width: '40%' }}>{item.label as string}</span>
              <span style={{ color: '#6e6e73', width: '60%', textAlign: 'right' }}>{item.value as string}</span>
            </div>
          ))}
        </div>
      )

    case 'banner':
      return (
        <div style={{
          background: content.image ? `url(${content.image}) center/cover` : (content.bg_color as string) || '#f5f5f7',
          color: content.image ? '#fff' : '#1d1d1f',
          padding: '80px 32px',
          textAlign: 'center',
          borderRadius: 24,
          ...s,
        }}>
          {content.title && <h1 style={{ margin: '0 0 12px', fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.03em' }}>{content.title as string}</h1>}
          {content.subtitle && <p style={{ margin: 0, opacity: 0.8 }}>{content.subtitle as string}</p>}
        </div>
      )

    case 'newsletter':
      return (
        <div style={{ background: '#f5f5f7', padding: 48, borderRadius: 24, textAlign: 'center', ...s }}>
          {content.title && <h3 style={{ margin: '0 0 8px', fontSize: '1.5rem', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>{content.title as string}</h3>}
          {content.text && <p style={{ margin: '0 0 24px', color: '#6e6e73' }}>{content.text as string}</p>}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', maxWidth: 420, margin: '0 auto' }}>
            <input type="email" placeholder="Seu e-mail" style={{ flex: 1, padding: '12px 16px', borderRadius: 980, border: '1px solid #d2d2d7', fontSize: '0.9rem', outline: 'none' }} />
            <button style={{ background: '#1d1d1f', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 980, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
              {content.btn_text as string || 'Inscrever'}
            </button>
          </div>
        </div>
      )

    case 'price':
      return (
        <div style={s}>
          {content.original_price && (
            <span style={{ textDecoration: 'line-through', color: '#86868b', marginRight: 8 }}>
              R$ {content.original_price}
            </span>
          )}
          <span style={{ fontSize: 36, fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
            R$ {content.price as string}
          </span>
          {content.installment && (
            <p style={{ color: '#6e6e73', margin: '4px 0 0' }}>ou {content.installment as string}</p>
          )}
        </div>
      )

    case 'buyButton':
      return (
        <button style={{
          background: '#1d1d1f',
          color: '#fff',
          border: 'none',
          padding: '16px 32px',
          borderRadius: 980,
          fontSize: 16,
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          ...s,
        }}>
          {content.label as string || 'Comprar Agora'}
        </button>
      )

    case 'quote':
      return (
        <blockquote style={{
          borderLeft: `3px solid #d2d2d7`,
          margin: 0,
          padding: '20px 28px',
          background: '#f5f5f7',
          borderRadius: '0 12px 12px 0',
          fontStyle: 'italic',
          color: '#1d1d1f',
          lineHeight: 1.7,
          ...s,
        }}>
          {content.text as string}
          {content.author && <cite style={{ display: 'block', marginTop: 12, fontStyle: 'normal', fontWeight: 600, fontSize: '0.9rem', color: '#6e6e73' }}>— {content.author as string}</cite>}
        </blockquote>
      )

    case 'list':
      return (
        <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 8, color: '#6e6e73', lineHeight: 1.7, ...s }}>
          {(Array.isArray(content.items) ? content.items : []).map((item: string, i: number) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )

    case 'table':
      return (
        <div style={{ overflowX: 'auto', ...s }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            {content.headers && (
              <thead>
                <tr>
                  {(content.headers as string[]).map((h, i) => (
                    <th key={i} style={{ borderBottom: '2px solid #e8e8ed', padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#1d1d1f', fontSize: '0.85rem' }}>{h}</th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {(Array.isArray(content.rows) ? content.rows : []).map((row: string[], i: number) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} style={{ borderBottom: '1px solid #e8e8ed', padding: '12px 16px', color: '#6e6e73' }}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )

    default:
      return <div style={{ padding: 20, background: '#f5f5f7', borderRadius: 12, color: '#86868b' }}>Widget: {type}</div>
  }
}
