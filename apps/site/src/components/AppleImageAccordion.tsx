import React, { useState } from 'react'

export interface AccordionImageItem {
  id: string
  title: string
  description: string
  image_url: string
  image_alt?: string
}

export interface AppleImageAccordionProps {
  content?: {
    headline?: string
    headline_tag?: 'h1' | 'h2' | 'h3' | 'div'
    image_position?: 'right' | 'left'
    default_active_index?: number
    items?: AccordionImageItem[]
    card_bg_color?: string
    text_color?: string
    title_font_size?: number
    image_border_radius?: number
  }
  style?: React.CSSProperties
  className?: string
}

export const DEFAULT_ACCORDION_ITEMS: AccordionImageItem[] = [
  {
    id: 'item-ipad-iphone',
    title: 'iPad e iPhone',
    description: 'O iPad é perfeito para pegar o conteúdo que você captura no iPhone e dar vida a ele em uma tela imersiva. Grave vídeos e fotos no seu iPhone e use a tela ampla do iPad para editar, criar animações e muito mais com o Handoff.',
    image_url: 'https://www.apple.com/v/ipad/home/ck/images/overview/significant-others/ipad_iphone__fe7dacf06_large.jpg',
    image_alt: 'iPad e iPhone lado a lado'
  },
  {
    id: 'item-ipad-mac',
    title: 'iPad e Mac',
    description: 'O iPad e o Mac foram feitos para trabalhar juntos no setup criativo definitivo. Desenhe no seu iPad e veja aparecer instantaneamente no Mac com o Sidecar. O Controle Universal permite usar um único mouse ou trackpad entre os dois aparelhos com total fluidez.',
    image_url: 'https://www.apple.com/v/ipad/home/ck/images/overview/significant-others/ipad_mac__173801b7c_large.jpg',
    image_alt: 'iPad e Mac integrados'
  },
  {
    id: 'item-ipad-watch',
    title: 'iPad e Apple Watch',
    description: 'O iPad é uma ótima maneira de otimizar seus treinos enquanto acompanha seu progresso no Apple Watch. Veja métricas pessoais integradas na tela em tempo real pelo Apple Fitness+ e app Saúde.',
    image_url: 'https://www.apple.com/v/ipad/home/ck/images/overview/significant-others/ipad_watch__0802b0a9c_large.jpg',
    image_alt: 'iPad e Apple Watch'
  }
]

export default function AppleImageAccordion({
  content = {},
  style = {},
  className = ''
}: AppleImageAccordionProps) {
  const headline = content.headline || 'Significant others.'
  const HeadlineTag = content.headline_tag || 'h2'
  const items = Array.isArray(content.items) && content.items.length > 0 ? content.items : DEFAULT_ACCORDION_ITEMS
  const imagePosition = content.image_position || 'right'
  const [activeIndex, setActiveIndex] = useState<number>(Number(content.default_active_index ?? 0))

  const activeItem = items[activeIndex] || items[0]

  return (
    <section
      className={`ImageAccordion_section ${className}`.trim()}
      style={{
        backgroundColor: '#ffffff',
        padding: '72px 0 80px',
        boxSizing: 'border-box',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
        ...style
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        {/* ── HEADER DA SEÇÃO ── */}
        {headline && (
          <HeadlineTag
            style={{
              fontSize: 'clamp(28px, 4vw, 44px)',
              fontWeight: 'var(--tkn-weight-medium)',
              letterSpacing: '-0.02em',
              color: '#1d1d1f',
              margin: '0 0 36px',
              lineHeight: 1.1
            }}
          >
            {headline}
          </HeadlineTag>
        )}

        {/* ── CARD CONTAINER PRINCIPAL ── */}
        <div
          style={{
            backgroundColor: content.card_bg_color || '#fafafc',
            borderRadius: 32,
            padding: '48px',
            boxSizing: 'border-box',
            display: 'grid',
            gridTemplateColumns: imagePosition === 'left' ? '1.15fr 1fr' : '1fr 1.15fr',
            gap: 48,
            alignItems: 'center',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.03)',
            border: '1px solid rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* LADO DO ACORDEÃO / FAQ */}
          <div style={{ order: imagePosition === 'left' ? 2 : 1 }}>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {items.map((item, idx) => {
                const isOpen = idx === activeIndex
                return (
                  <li
                    key={item.id || idx}
                    style={{
                      borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
                      padding: '24px 0',
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <button
                      onClick={() => setActiveIndex(idx)}
                      style={{
                        width: '100%',
                        background: 'transparent',
                        border: 'none',
                        padding: 0,
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16
                      }}
                    >
                      <span
                        style={{
                          fontSize: 'clamp(18px, 2.2vw, 24px)',
                          fontWeight: 'var(--tkn-weight-medium)',
                          color: '#1d1d1f',
                          letterSpacing: '-0.02em'
                        }}
                      >
                        {item.title}
                      </span>
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1d1d1f',
                          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.3s cubic-bezier(0.25, 1, 0.5, 1)'
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </span>
                    </button>

                    {/* Descrição expandida com animação de altura */}
                    {isOpen && (
                      <div style={{ marginTop: 14, animation: 'fadeIn 0.35s ease' }}>
                        <p
                          style={{
                            fontSize: '15px',
                            lineHeight: 1.55,
                            color: '#424245',
                            margin: 0,
                            maxWidth: 520
                          }}
                        >
                          {item.description}
                        </p>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          {/* LADO DA IMAGEM SINCRONIZADA */}
          <div
            style={{
              order: imagePosition === 'left' ? 1 : 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 400
            }}
          >
            {activeItem && activeItem.image_url ? (
              <img
                key={activeItem.image_url}
                src={activeItem.image_url}
                alt={activeItem.image_alt || activeItem.title}
                style={{
                  width: '100%',
                  maxHeight: 520,
                  objectFit: 'contain',
                  borderRadius: content.image_border_radius ?? 20,
                  animation: 'crossFade 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 380,
                  backgroundColor: '#e8e8ed',
                  borderRadius: 20,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#86868b',
                  fontSize: 14
                }}
              >
                Selecione uma imagem no Inspector
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes crossFade {
          from { opacity: 0.6; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (max-width: 860px) {
          .ImageAccordion_section div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
            padding: 28px !important;
          }
        }
      `}</style>
    </section>
  )
}
