import { SectionSchema } from '../types/pageBuilder'

export interface PresetDefinition {
  id: string
  name: string
  category: 'hero' | 'promos' | 'columns' | 'media' | 'cta' | 'ecommerce' | 'faq' | 'header' | 'footer'
  description?: string
  schema: SectionSchema
  thumbnail?: string
}

export const PRESETS: PresetDefinition[] = [
  // ── 1. RIBBONS & AVISOS ──
  {
    id: 'ribbon-announcement',
    name: 'Ribbon Promocional (Apple-like)',
    category: 'cta',
    description: 'Faixa superior de anúncio oficial com texto informativo e link de ação.',
    schema: {
      type: 'section',
      settings: {
        layout: 'full',
        direction: 'row',
        gap: '0px',
        bg_color: '#f5f5f7',
        padding_top: '12px',
        padding_bottom: '12px',
        padding_left: '24px',
        padding_right: '24px',
        border_bottom: '1px solid #e5e5e7'
      },
      containers: [
        {
          settings: {
            direction: 'row',
            align_items: 'center',
            justify_content: 'center',
            gap: '8px',
            max_width: '1024px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%'
          },
          widgets: [
            {
              type: 'text',
              content: {
                text: 'Estamos doando US$ 10 para a National Park Foundation para cada compra feita com Apple Pay até 28 de agosto. *',
                tag: 'p'
              },
              settings: {
                font_size: '14px',
                font_weight: '400',
                color: '#1d1d1f',
                text_align: 'center'
              }
            },
            {
              type: 'button',
              content: {
                label: 'Compre agora >',
                button_variant: 'link',
                button_size: 'sm',
                link: '/produtos'
              },
              settings: {
                color: '#0066cc',
                font_size: '14px',
                font_weight: '400'
              }
            }
          ]
        }
      ]
    }
  },

  // ── 2. HEROES FULL-WIDTH OFICIAIS DA HOME ──
  {
    id: 'hero-mac-mini',
    name: 'Hero 01 — Mac mini (Showcase Principal)',
    category: 'hero',
    description: 'Hero full-width oficial da Home com Headline 56px, Subhead, Callout, 2 CTAs e Imagem de destaque.',
    schema: {
      type: 'hero',
      settings: {
        layout: 'full',
        direction: 'column',
        gap: '0px',
        bg_color: '#f5f5f7',
        padding_top: '55px',
        padding_bottom: '0px',
        min_height: '650px',
        margin_bottom: '12px'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            align_items: 'center',
            justify_content: 'flex-start',
            max_width: '980px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%',
            padding_left: '20px',
            padding_right: '20px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'Mac mini', tag: 'h2' },
              settings: {
                font_size: '56px',
                font_weight: '700',
                text_align: 'center',
                letter_spacing: '-0.015em',
                line_height: '1.08',
                color: '#1d1d1f',
                margin_bottom: '6px'
              }
            },
            {
              type: 'text',
              content: { text: 'Agora com M6 e M5 Pro.', tag: 'p' },
              settings: {
                font_size: '28px',
                font_weight: '400',
                text_align: 'center',
                letter_spacing: '0.004em',
                line_height: '1.14',
                color: '#1d1d1f',
                margin_bottom: '6px'
              }
            },
            {
              type: 'text',
              content: { text: 'Disponível a partir de 22/09.', tag: 'p' },
              settings: {
                font_size: '19px',
                font_weight: '400',
                text_align: 'center',
                color: '#86868b',
                margin_bottom: '18px'
              }
            },
            {
              type: 'button',
              content: { label: 'Saber mais', button_variant: 'primary', link: '/produtos' },
              settings: {
                bg_color: '#0071e3',
                color: '#ffffff',
                border_radius: '980px',
                font_size: '14px',
                font_weight: '400',
                padding_top: '8px',
                padding_bottom: '8px',
                padding_left: '16px',
                padding_right: '16px'
              }
            },
            {
              type: 'image',
              content: {
                image: 'https://www.apple.com/v/home/images/mac-mini/a/hero_mac_mini_m6__cyyrlmnibxea_large.jpg',
                alt: 'Vista frontal do Mac mini equilibrado na ponta dos dedos'
              },
              settings: {
                width: '100%',
                max_width: '1060px',
                margin_top: '16px'
              }
            }
          ]
        }
      ]
    }
  },

  {
    id: 'hero-mac-studio',
    name: 'Hero 02 — Estúdio Mac (Linha Pro)',
    category: 'hero',
    description: 'Hero full-width com chips de alto desempenho, CTAs duplos e visual imponente.',
    schema: {
      type: 'hero',
      settings: {
        layout: 'full',
        direction: 'column',
        gap: '0px',
        bg_color: '#f5f5f7',
        padding_top: '55px',
        padding_bottom: '0px',
        min_height: '650px',
        margin_bottom: '12px'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            align_items: 'center',
            justify_content: 'flex-start',
            max_width: '980px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%',
            padding_left: '20px',
            padding_right: '20px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'Estúdio Mac', tag: 'h2' },
              settings: {
                font_size: '56px',
                font_weight: '700',
                text_align: 'center',
                letter_spacing: '-0.015em',
                line_height: '1.08',
                color: '#1d1d1f',
                margin_bottom: '6px'
              }
            },
            {
              type: 'text',
              content: { text: 'Agora com M5 Max e M5 Ultra.', tag: 'p' },
              settings: {
                font_size: '28px',
                font_weight: '400',
                text_align: 'center',
                color: '#1d1d1f',
                margin_bottom: '6px'
              }
            },
            {
              type: 'text',
              content: { text: 'Disponível a partir de 22/09.', tag: 'p' },
              settings: {
                font_size: '19px',
                font_weight: '400',
                text_align: 'center',
                color: '#86868b',
                margin_bottom: '18px'
              }
            },
            {
              type: 'button',
              content: { label: 'Saber mais', button_variant: 'primary', link: '/produtos' },
              settings: {
                bg_color: '#0071e3',
                color: '#ffffff',
                border_radius: '980px',
                font_size: '14px',
                padding_top: '8px',
                padding_bottom: '8px',
                padding_left: '16px',
                padding_right: '16px'
              }
            },
            {
              type: 'image',
              content: {
                image: 'https://www.apple.com/v/home/images/mac-studio/a/hero_mac_studio_m5__dmmzuuasyo2u_large.jpg',
                alt: 'Mac Studio vista frontal cor prateada'
              },
              settings: {
                width: '100%',
                max_width: '1060px',
                margin_top: '20px'
              }
            }
          ]
        }
      ]
    }
  },

  {
    id: 'hero-back-to-school',
    name: 'Hero 03 — Campanha / Volta às Aulas',
    category: 'hero',
    description: 'Hero editorial com foco em benefício de desconto e estilo de vida.',
    schema: {
      type: 'hero',
      settings: {
        layout: 'full',
        direction: 'column',
        bg_color: '#f5f5f7',
        padding_top: '55px',
        padding_bottom: '0px',
        min_height: '620px',
        margin_bottom: '12px'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            align_items: 'center',
            max_width: '980px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%',
            padding_left: '20px',
            padding_right: '20px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'Faculdade, resolvido.', tag: 'h2' },
              settings: {
                font_size: '56px',
                font_weight: '700',
                text_align: 'center',
                color: '#1d1d1f',
                margin_bottom: '8px'
              }
            },
            {
              type: 'text',
              content: {
                text: 'Ganhe um cartão-presente de US$ 100 a US$ 150 ** na compra de um Mac ou iPad com desconto para estudantes.',
                tag: 'p'
              },
              settings: {
                font_size: '21px',
                font_weight: '400',
                text_align: 'center',
                color: '#1d1d1f',
                max_width: '640px',
                margin_bottom: '18px'
              }
            },
            {
              type: 'button',
              content: { label: 'Comprar', button_variant: 'primary', link: '/produtos' },
              settings: {
                bg_color: '#0071e3',
                color: '#ffffff',
                border_radius: '980px',
                font_size: '14px',
                padding_top: '8px',
                padding_bottom: '8px',
                padding_left: '16px',
                padding_right: '16px'
              }
            },
            {
              type: 'image',
              content: {
                image: 'https://www.apple.com/v/home/images/back-to-school-2026/a/hero_back_to_school_2026__cz07tzsg14sy_large.jpg',
                alt: 'Estudantes com Mac e iPad'
              },
              settings: {
                width: '100%',
                max_width: '1060px',
                margin_top: '24px'
              }
            }
          ]
        }
      ]
    }
  },

  {
    id: 'hero-dark-pro',
    name: 'Hero 04 — Imersivo Dark (Linha Pro)',
    category: 'hero',
    description: 'Hero com fundo preto profundo (#000000), tipografia em branco e imagem OLED de alto impacto.',
    schema: {
      type: 'hero',
      settings: {
        layout: 'full',
        direction: 'column',
        bg_color: '#000000',
        padding_top: '60px',
        padding_bottom: '40px',
        min_height: '650px',
        margin_bottom: '12px'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            align_items: 'center',
            max_width: '980px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'iPad Pro', tag: 'h2' },
              settings: {
                font_size: '56px',
                font_weight: '700',
                text_align: 'center',
                color: '#f5f5f7',
                margin_bottom: '6px'
              }
            },
            {
              type: 'text',
              content: { text: 'Desempenho avançado de IA e capacidades revolucionárias.', tag: 'p' },
              settings: {
                font_size: '24px',
                font_weight: '400',
                text_align: 'center',
                color: '#a1a1a6',
                margin_bottom: '20px'
              }
            },
            {
              type: 'button',
              content: { label: 'Saber mais', button_variant: 'primary', link: '/produtos' },
              settings: {
                bg_color: '#0071e3',
                color: '#ffffff',
                border_radius: '980px',
                font_size: '14px',
                padding_top: '8px',
                padding_bottom: '8px',
                padding_left: '16px',
                padding_right: '16px'
              }
            },
            {
              type: 'image',
              content: {
                image: 'https://www.apple.com/v/home/images/ipad-pro/a/promo_ipad_pro__emtduc920o02_large.jpg',
                alt: 'Dois iPads Pro com tela exibindo arte multicolorida em fundo preto'
              },
              settings: {
                width: '100%',
                max_width: '1000px',
                margin_top: '24px'
              }
            }
          ]
        }
      ]
    }
  },

  // ── 3. PROMOS & MOSAICO (GRID 2 COLUNAS DA HOME) ──
  {
    id: 'promo-grid-complete',
    name: 'Mosaico 2x2 — Grid de Promos Oficial da Home',
    category: 'promos',
    description: 'Estrutura completa de 2 colunas com 2 cards lado a lado com bordas arredondadas e CTAs.',
    schema: {
      type: 'section',
      settings: {
        layout: 'boxed',
        direction: 'row',
        gap: '12px',
        padding_top: '0px',
        padding_bottom: '12px',
        max_width: '1440px',
        margin_left: 'auto',
        margin_right: 'auto'
      },
      containers: [
        // Coluna 1: iPhone
        {
          settings: {
            direction: 'column',
            align_items: 'center',
            width: '50%',
            bg_color: '#f5f5f7',
            border_radius: '18px',
            padding_top: '48px',
            padding_bottom: '0px',
            padding_left: '24px',
            padding_right: '24px',
            min_height: '540px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'iPhone', tag: 'h3' },
              settings: {
                font_size: '40px',
                font_weight: '700',
                color: '#1d1d1f',
                text_align: 'center',
                margin_bottom: '4px'
              }
            },
            {
              type: 'text',
              content: { text: 'Conheça a mais recente linha de iPhones.', tag: 'p' },
              settings: {
                font_size: '19px',
                color: '#1d1d1f',
                text_align: 'center',
                margin_bottom: '16px'
              }
            },
            {
              type: 'button',
              content: { label: 'Saber mais', button_variant: 'primary', link: '/produtos' },
              settings: {
                bg_color: '#0071e3',
                color: '#ffffff',
                border_radius: '980px',
                font_size: '14px',
                padding_top: '8px',
                padding_bottom: '8px',
                padding_left: '16px',
                padding_right: '16px'
              }
            },
            {
              type: 'image',
              content: {
                image: 'https://www.apple.com/v/home/images/iphone-family/a/promo_iphone_family__ftpjp9fda2uu_large.jpg',
                alt: 'Linha completa de iPhones'
              },
              settings: {
                width: '100%',
                max_width: '480px',
                margin_top: '20px'
              }
            }
          ]
        },
        // Coluna 2: MacBook Air
        {
          settings: {
            direction: 'column',
            align_items: 'center',
            width: '50%',
            bg_color: '#e8f2f8',
            border_radius: '18px',
            padding_top: '48px',
            padding_bottom: '0px',
            padding_left: '24px',
            padding_right: '24px',
            min_height: '540px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'MacBook Air', tag: 'h3' },
              settings: {
                font_size: '40px',
                font_weight: '700',
                color: '#1d1d1f',
                text_align: 'center',
                margin_bottom: '4px'
              }
            },
            {
              type: 'text',
              content: { text: 'Agora turbinado pelo M5.', tag: 'p' },
              settings: {
                font_size: '19px',
                color: '#1d1d1f',
                text_align: 'center',
                margin_bottom: '16px'
              }
            },
            {
              type: 'button',
              content: { label: 'Saber mais', button_variant: 'primary', link: '/produtos' },
              settings: {
                bg_color: '#0071e3',
                color: '#ffffff',
                border_radius: '980px',
                font_size: '14px',
                padding_top: '8px',
                padding_bottom: '8px',
                padding_left: '16px',
                padding_right: '16px'
              }
            },
            {
              type: 'image',
              content: {
                image: 'https://www.apple.com/v/home/images/macbook-air-m5/a/promo_macbook_air_m5__e5xk2yysqiie_large.jpg',
                alt: 'MacBook Air na cor azul celeste'
              },
              settings: {
                width: '100%',
                max_width: '480px',
                margin_top: '20px'
              }
            }
          ]
        }
      ]
    }
  },

  {
    id: 'promo-card-dark',
    name: 'Promo Card — iPad Pro (Tema Dark)',
    category: 'promos',
    description: 'Card 50% de largura com fundo preto, texto em branco e imagem contrastante.',
    schema: {
      type: 'section',
      settings: {
        layout: 'boxed',
        direction: 'row',
        gap: '12px',
        padding_top: '0px',
        padding_bottom: '12px',
        max_width: '1440px'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            align_items: 'center',
            width: '100%',
            bg_color: '#000000',
            border_radius: '18px',
            padding_top: '48px',
            padding_bottom: '0px',
            padding_left: '24px',
            padding_right: '24px',
            min_height: '540px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'iPad Pro', tag: 'h3' },
              settings: {
                font_size: '40px',
                font_weight: '700',
                color: '#ffffff',
                text_align: 'center',
                margin_bottom: '4px'
              }
            },
            {
              type: 'text',
              content: { text: 'Desempenho avançado de IA e capacidades revolucionárias.', tag: 'p' },
              settings: {
                font_size: '19px',
                color: '#f5f5f7',
                text_align: 'center',
                margin_bottom: '16px'
              }
            },
            {
              type: 'button',
              content: { label: 'Saber mais', button_variant: 'primary', link: '/produtos' },
              settings: {
                bg_color: '#0071e3',
                color: '#ffffff',
                border_radius: '980px',
                font_size: '14px',
                padding_top: '8px',
                padding_bottom: '8px',
                padding_left: '16px',
                padding_right: '16px'
              }
            },
            {
              type: 'image',
              content: {
                image: 'https://www.apple.com/v/home/images/ipad-pro/a/promo_ipad_pro__emtduc920o02_large.jpg',
                alt: 'iPad Pro arte OLED'
              },
              settings: {
                width: '100%',
                max_width: '500px',
                margin_top: '20px'
              }
            }
          ]
        }
      ]
    }
  },

  {
    id: 'promo-card-services',
    name: 'Promo Card —  Card & Finanças',
    category: 'promos',
    description: 'Card de destaque para serviços financeiros com  símbolo e percentual de cashback.',
    schema: {
      type: 'section',
      settings: {
        layout: 'boxed',
        direction: 'row',
        gap: '12px',
        padding_top: '0px',
        padding_bottom: '12px',
        max_width: '1440px'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            align_items: 'center',
            width: '100%',
            bg_color: '#f5f5f7',
            border_radius: '18px',
            padding_top: '48px',
            padding_bottom: '0px',
            padding_left: '24px',
            padding_right: '24px',
            min_height: '540px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: ' Card', tag: 'h3' },
              settings: {
                font_size: '40px',
                font_weight: '700',
                color: '#1d1d1f',
                text_align: 'center',
                margin_bottom: '4px'
              }
            },
            {
              type: 'text',
              content: { text: 'Receba até 3% de reembolso diário em todas as suas compras.', tag: 'p' },
              settings: {
                font_size: '19px',
                color: '#1d1d1f',
                text_align: 'center',
                margin_bottom: '16px'
              }
            },
            {
              type: 'button',
              content: { label: 'Candidate-se agora', button_variant: 'primary', link: '/produtos' },
              settings: {
                bg_color: '#0071e3',
                color: '#ffffff',
                border_radius: '980px',
                font_size: '14px',
                padding_top: '8px',
                padding_bottom: '8px',
                padding_left: '16px',
                padding_right: '16px'
              }
            },
            {
              type: 'image',
              content: {
                image: 'https://www.apple.com/v/home/images/apple-card/a/promo_apple_card__d8xz4kd4evwy_large.jpg',
                alt: 'Cartão de titânio'
              },
              settings: {
                width: '100%',
                max_width: '460px',
                margin_top: '20px'
              }
            }
          ]
        }
      ]
    }
  },

  // ── 4. CARROSSEL & MÍDIA ──
  {
    id: 'carousel-entertainment',
    name: 'Carrossel — Entretenimento Sem Fim',
    category: 'media',
    description: 'Galeria cinematográfica oficial com botões dotnav, indicador e cards de mídia sobrepostos.',
    schema: {
      type: 'carousel',
      settings: {
        layout: 'full',
        direction: 'column',
        bg_color: '#ffffff',
        padding_top: '40px',
        padding_bottom: '60px',
        gap: '24px'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            align_items: 'center',
            max_width: '1280px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'Entretenimento sem fim.', tag: 'h2' },
              settings: {
                font_size: '32px',
                font_weight: '700',
                color: '#1d1d1f',
                text_align: 'center',
                margin_bottom: '24px'
              }
            },
            {
              type: 'mediaCarousel',
              content: {
                title: 'Destaques do Streaming',
                autoplay: true,
                items: [
                  {
                    title: 'Ted Lasso',
                    genre: 'Comédia.',
                    description: 'A comédia de sucesso está de volta e mais divertida do que nunca.',
                    button_text: 'Assista agora',
                    image: 'https://is1-ssl.mzstatic.com/image/thumb/eD8DZGJ170t3MyFhlWOkdw/1250x668sr.jpg'
                  },
                  {
                    title: 'Formula 1',
                    genre: 'Esportes',
                    description: 'Todos os Grandes Prêmios™, ao vivo e sob demanda o ano todo.',
                    button_text: 'F1 na Apple TV',
                    image: 'https://is1-ssl.mzstatic.com/image/thumb/Features/v4/47/76/ea/4776ea5e-5e00-a76b-c8f1-6fda44050f30/3dd9b6d8-a87a-4a15-80bb-0cc06dfa62d4.png/1250x668sr.jpg'
                  },
                  {
                    title: 'Silo',
                    genre: 'Ficção científica:',
                    description: 'A verdade está no passado.',
                    button_text: 'Assista agora',
                    image: 'https://is1-ssl.mzstatic.com/image/thumb/hRaOrIKahRFcNlKt6UV4Ow/1250x668sr.jpg'
                  }
                ]
              },
              settings: {
                width: '100%',
                max_width: '1200px'
              }
            }
          ]
        }
      ]
    }
  },

  // ── 5. ESTRUTURA DE COLUNAS UNIVERSAIS ──
  {
    id: 'cols-2-split-text-image',
    name: '2 Colunas — Texto à Esquerda + Imagem à Direita',
    category: 'columns',
    description: 'Layout clássico 50/50 para apresentação editorial de produtos ou benefícios.',
    schema: {
      type: 'imageText',
      settings: {
        layout: 'boxed',
        direction: 'row',
        gap: '48px',
        padding_top: '80px',
        padding_bottom: '80px',
        bg_color: '#ffffff',
        max_width: '1200px',
        margin_left: 'auto',
        margin_right: 'auto'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            justify_content: 'center',
            width: '50%',
            padding_right: '16px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'PERFORMANCE', tag: 'h4' },
              settings: {
                font_size: '14px',
                font_weight: '600',
                color: '#0066cc',
                letter_spacing: '0.08em',
                margin_bottom: '8px'
              }
            },
            {
              type: 'text',
              content: { text: 'Velocidade que redefine padrões.', tag: 'h2' },
              settings: {
                font_size: '44px',
                font_weight: '700',
                line_height: '1.1',
                color: '#1d1d1f',
                margin_bottom: '16px'
              }
            },
            {
              type: 'text',
              content: {
                text: 'Projetado com arquitetura de ponta para entregar eficiência extrema sem aquecimento e autonomia impressionante.',
                tag: 'p'
              },
              settings: {
                font_size: '17px',
                color: '#6e6e73',
                line_height: '1.5',
                margin_bottom: '24px'
              }
            },
            {
              type: 'button',
              content: { label: 'Conheça todos os detalhes >', button_variant: 'link', link: '/produtos' },
              settings: {
                color: '#0066cc',
                font_size: '16px'
              }
            }
          ]
        },
        {
          settings: {
            direction: 'column',
            justify_content: 'center',
            align_items: 'center',
            width: '50%'
          },
          widgets: [
            {
              type: 'image',
              content: {
                image: 'https://www.apple.com/v/macbook-air/s/images/overview/design/design_top__e14t7g8b3m2e_large.jpg',
                alt: 'Design elegante'
              },
              settings: {
                width: '100%',
                border_radius: '16px'
              }
            }
          ]
        }
      ]
    }
  },

  {
    id: 'cols-3-features',
    name: '3 Colunas — Diferenciais e Recursos',
    category: 'columns',
    description: '3 containers com 33.3% de largura com ícones, títulos e textos explicativos.',
    schema: {
      type: 'section',
      settings: {
        layout: 'boxed',
        direction: 'row',
        gap: '24px',
        padding_top: '80px',
        padding_bottom: '80px',
        bg_color: '#f5f5f7',
        max_width: '1200px',
        margin_left: 'auto',
        margin_right: 'auto'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            width: '33.33%',
            bg_color: '#ffffff',
            border_radius: '16px',
            padding_top: '32px',
            padding_bottom: '32px',
            padding_left: '24px',
            padding_right: '24px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'Desempenho Veloz', tag: 'h3' },
              settings: {
                font_size: '22px',
                font_weight: '600',
                color: '#1d1d1f',
                margin_bottom: '8px'
              }
            },
            {
              type: 'text',
              content: { text: 'Chips com arquitetura unificada de memória que aceleram fluxos de trabalho pesados.', tag: 'p' },
              settings: {
                font_size: '15px',
                color: '#6e6e73',
                line_height: '1.5'
              }
            }
          ]
        },
        {
          settings: {
            direction: 'column',
            width: '33.33%',
            bg_color: '#ffffff',
            border_radius: '16px',
            padding_top: '32px',
            padding_bottom: '32px',
            padding_left: '24px',
            padding_right: '24px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'Bateria para o dia todo', tag: 'h3' },
              settings: {
                font_size: '22px',
                font_weight: '600',
                color: '#1d1d1f',
                margin_bottom: '8px'
              }
            },
            {
              type: 'text',
              content: { text: 'Até 18 horas de autonomia para você produzir de qualquer lugar sem se preocupar com tomadas.', tag: 'p' },
              settings: {
                font_size: '15px',
                color: '#6e6e73',
                line_height: '1.5'
              }
            }
          ]
        },
        {
          settings: {
            direction: 'column',
            width: '33.33%',
            bg_color: '#ffffff',
            border_radius: '16px',
            padding_top: '32px',
            padding_bottom: '32px',
            padding_left: '24px',
            padding_right: '24px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'Tela Liquid Retina', tag: 'h3' },
              settings: {
                font_size: '22px',
                font_weight: '600',
                color: '#1d1d1f',
                margin_bottom: '8px'
              }
            },
            {
              type: 'text',
              content: { text: 'Milhões de cores e tecnologia True Tone para uma experiência visual confortável e realista.', tag: 'p' },
              settings: {
                font_size: '15px',
                color: '#6e6e73',
                line_height: '1.5'
              }
            }
          ]
        }
      ]
    }
  },

  // ── 6. ECOMMERCE & VITRINE DE PRODUTOS ──
  {
    id: 'product-grid-official',
    name: 'Vitrine — Grid de Produtos da Loja',
    category: 'ecommerce',
    description: 'Grid responsivo de cartões de produto integrados com preço, foto e botão de compra.',
    schema: {
      type: 'productGrid',
      settings: {
        layout: 'boxed',
        direction: 'column',
        bg_color: '#ffffff',
        padding_top: '60px',
        padding_bottom: '60px',
        max_width: '1200px',
        margin_left: 'auto',
        margin_right: 'auto'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            align_items: 'center',
            width: '100%'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'Produtos em Destaque', tag: 'h2' },
              settings: {
                font_size: '36px',
                font_weight: '700',
                color: '#1d1d1f',
                text_align: 'center',
                margin_bottom: '32px'
              }
            },
            {
              type: 'productGrid',
              content: {
                columns: 4,
                limit: 4,
                category_id: ''
              },
              settings: {
                width: '100%'
              }
            }
          ]
        }
      ]
    }
  },

  // ── 7. FAQ & SUPORTE ──
  {
    id: 'faq-official',
    name: 'FAQ — Dúvidas Frequentes',
    category: 'faq',
    description: 'Acordeão limpo com perguntas e respostas oficiais da loja.',
    schema: {
      type: 'faq',
      settings: {
        layout: 'boxed',
        direction: 'column',
        bg_color: '#f5f5f7',
        padding_top: '60px',
        padding_bottom: '60px',
        max_width: '900px',
        margin_left: 'auto',
        margin_right: 'auto',
        border_radius: '18px'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            width: '100%',
            padding_left: '32px',
            padding_right: '32px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'Perguntas Frequentes', tag: 'h2' },
              settings: {
                font_size: '32px',
                font_weight: '700',
                color: '#1d1d1f',
                text_align: 'center',
                margin_bottom: '32px'
              }
            },
            {
              type: 'accordion',
              content: {
                items: [
                  {
                    title: 'Como funciona o envio e a entrega?',
                    content: 'Enviamos para todo o Brasil com rastreamento detalhado em tempo real. Os prazos variam conforme sua região e são calculados no checkout.'
                  },
                  {
                    title: 'Quais são as formas de pagamento aceitas?',
                    content: 'Aceitamos Pix (com aprovação imediata), Cartão de Crédito em até 12x e Boleto Bancário.'
                  },
                  {
                    title: 'Os produtos possuem garantia oficial?',
                    content: 'Sim, todos os nossos produtos contam com garantia legal de fábrica de 1 ano e suporte técnico dedicado.'
                  },
                  {
                    title: 'Como solicitar troca ou devolução?',
                    content: 'Você tem até 7 dias corridos após o recebimento para solicitar troca ou devolução gratuita através do nosso suporte.'
                  }
                ]
              },
              settings: {
                width: '100%'
              }
            }
          ]
        }
      ]
    }
  },

  // ── 8. HEADERS & MENUS DE NAVEGAÇÃO ──
  {
    id: 'header-apple-dark',
    name: 'Header 01 — Apple Dark Translúcido',
    category: 'header',
    description: 'Header translúcido escuro (#161617) com backdrop blur oficial Apple, logotipo TEKNIX e ícones de busca/sacola.',
    schema: {
      type: 'section',
      settings: {
        layout: 'full',
        direction: 'row',
        gap: '0px',
        bg_color: 'rgba(22, 22, 23, 0.85)',
        padding_top: '0px',
        padding_bottom: '0px',
        padding_left: '20px',
        padding_right: '20px',
        border_bottom: '1px solid rgba(255, 255, 255, 0.12)'
      },
      containers: [
        {
          settings: {
            direction: 'row',
            align_items: 'center',
            justify_content: 'space-between',
            max_width: '1024px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%',
            min_height: '44px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'TEKNIX', tag: 'span' },
              settings: { font_size: '15px', font_weight: '800', color: '#ffffff' }
            },
            {
              type: 'nav',
              content: {
                links: [
                  { label: 'Store', url: '/produtos' },
                  { label: 'Mac', url: '/mac' },
                  { label: 'iPad', url: '/ipad' },
                  { label: 'iPhone', url: '/iphone' },
                  { label: 'Watch', url: '/watch' },
                  { label: 'Suporte', url: '/contato' }
                ]
              },
              settings: { color: '#f5f5f7' }
            }
          ]
        }
      ]
    }
  },
  {
    id: 'header-apple-light',
    name: 'Header 02 — Apple Light Editorial',
    category: 'header',
    description: 'Header translúcido branco clean (#ffffff) com borda suave, tipografia escura e visual refinado.',
    schema: {
      type: 'section',
      settings: {
        layout: 'full',
        direction: 'row',
        gap: '0px',
        bg_color: 'rgba(255, 255, 255, 0.88)',
        padding_top: '0px',
        padding_bottom: '0px',
        padding_left: '20px',
        padding_right: '20px',
        border_bottom: '1px solid rgba(0, 0, 0, 0.08)'
      },
      containers: [
        {
          settings: {
            direction: 'row',
            align_items: 'center',
            justify_content: 'space-between',
            max_width: '1024px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%',
            min_height: '44px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'TEKNIX', tag: 'span' },
              settings: { font_size: '15px', font_weight: '800', color: '#1d1d1f' }
            },
            {
              type: 'nav',
              content: {
                links: [
                  { label: 'Store', url: '/produtos' },
                  { label: 'Mac', url: '/mac' },
                  { label: 'iPad', url: '/ipad' },
                  { label: 'iPhone', url: '/iphone' },
                  { label: 'Watch', url: '/watch' },
                  { label: 'Suporte', url: '/contato' }
                ]
              },
              settings: { color: '#1d1d1f' }
            }
          ]
        }
      ]
    }
  },
  {
    id: 'header-industrial-pro',
    name: 'Header 03 — Industrial Pro Solid',
    category: 'header',
    description: 'Header preto sólido (#000000) de alto contraste com detalhes e destaque em azul elétrico TEKNIX.',
    schema: {
      type: 'section',
      settings: {
        layout: 'full',
        direction: 'row',
        gap: '0px',
        bg_color: '#000000',
        padding_top: '0px',
        padding_bottom: '0px',
        padding_left: '20px',
        padding_right: '20px',
        border_bottom: '2px solid #0071e3'
      },
      containers: [
        {
          settings: {
            direction: 'row',
            align_items: 'center',
            justify_content: 'space-between',
            max_width: '1024px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%',
            min_height: '48px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'TEKNIX PRO', tag: 'span' },
              settings: { font_size: '15px', font_weight: '800', color: '#0071e3' }
            }
          ]
        }
      ]
    }
  },
  {
    id: 'header-ecommerce-search',
    name: 'Header 04 — E-commerce Search Express',
    category: 'header',
    description: 'Header focado em vendas com barra de busca visível, acesso rápido à conta e sacola.',
    schema: {
      type: 'section',
      settings: {
        layout: 'full',
        direction: 'row',
        gap: '0px',
        bg_color: '#111418',
        padding_top: '0px',
        padding_bottom: '0px',
        padding_left: '20px',
        padding_right: '20px',
        border_bottom: '1px solid #282f3a'
      },
      containers: [
        {
          settings: {
            direction: 'row',
            align_items: 'center',
            justify_content: 'space-between',
            max_width: '1200px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%',
            min_height: '52px'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'TEKNIX STORE', tag: 'span' },
              settings: { font_size: '15px', font_weight: '800', color: '#ffffff' }
            }
          ]
        }
      ]
    }
  },

  // ── 9. RODAPÉS & FOOTERS ──
  {
    id: 'footer-apple-directory-light',
    name: 'Rodapé 01 — Apple Directory 5 Colunas (Light)',
    category: 'footer',
    description: 'Rodapé oficial completo com notas legais Sosumi numeradas, diretório de 5 colunas e copyright.',
    schema: {
      type: 'section',
      settings: {
        layout: 'full',
        direction: 'column',
        gap: '0px',
        bg_color: '#f5f5f7',
        padding_top: '32px',
        padding_bottom: '32px',
        padding_left: '24px',
        padding_right: '24px',
        border_top: '1px solid #d2d2d7'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            max_width: '1024px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'Copyright © 2026 TEKNIX Industrial Inc. Todos os direitos reservados.', tag: 'p' },
              settings: { font_size: '11px', color: '#6e6e73' }
            }
          ]
        }
      ]
    }
  },
  {
    id: 'footer-apple-directory-dark',
    name: 'Rodapé 02 — Apple Directory 5 Colunas (Dark)',
    category: 'footer',
    description: 'Rodapé estilo dark premium (#161617) com alto contraste, notas Sosumi e 5 colunas.',
    schema: {
      type: 'section',
      settings: {
        layout: 'full',
        direction: 'column',
        gap: '0px',
        bg_color: '#161617',
        padding_top: '32px',
        padding_bottom: '32px',
        padding_left: '24px',
        padding_right: '24px',
        border_top: '1px solid #2e343d'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            max_width: '1024px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'Copyright © 2026 TEKNIX Industrial Inc. Todos os direitos reservados.', tag: 'p' },
              settings: { font_size: '11px', color: '#86868b' }
            }
          ]
        }
      ]
    }
  },
  {
    id: 'footer-ecommerce-express',
    name: 'Rodapé 03 — E-commerce Express (Selos & Pagamento)',
    category: 'footer',
    description: 'Rodapé focado em conversão com selos de garantia 12 meses, parcelamento em 12x, Pix e frete seguro.',
    schema: {
      type: 'section',
      settings: {
        layout: 'full',
        direction: 'column',
        gap: '0px',
        bg_color: '#1a1d21',
        padding_top: '36px',
        padding_bottom: '36px',
        padding_left: '24px',
        padding_right: '24px',
        border_top: '1px solid #2e343d'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            max_width: '1200px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'Garantia de 1 ano direta de fábrica em todo o território nacional.', tag: 'p' },
              settings: { font_size: '12px', color: '#86868b' }
            }
          ]
        }
      ]
    }
  },
  {
    id: 'footer-landing-minimal',
    name: 'Rodapé 04 — Landing Page Minimal',
    category: 'footer',
    description: 'Rodapé limpo e direto para Landing Pages com links de termos, privacidade e copyright.',
    schema: {
      type: 'section',
      settings: {
        layout: 'full',
        direction: 'column',
        gap: '0px',
        bg_color: '#fbfbfd',
        padding_top: '20px',
        padding_bottom: '20px',
        padding_left: '20px',
        padding_right: '20px',
        border_top: '1px solid #e5e5e7'
      },
      containers: [
        {
          settings: {
            direction: 'row',
            justify_content: 'space-between',
            align_items: 'center',
            max_width: '1024px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%'
          },
          widgets: [
            {
              type: 'text',
              content: { text: 'Copyright © 2026 TEKNIX. Todos os direitos reservados.', tag: 'span' },
              settings: { font_size: '11px', color: '#6e6e73' }
            }
          ]
        }
      ]
    }
  },

  // ── 12. MODELOS OFICIAIS APPLE STORE (BIBLIOTECA DE SEÇÕES) ──
  {
    id: 'apple-store-header-specialist',
    name: 'Store Header — Título & Especialista (1:1 Apple)',
    category: 'header',
    description: 'Header oficial da Store com título 48px em degradê, subtítulo e links diretos para Especialista e Lojas.',
    schema: {
      type: 'section',
      settings: {
        layout: 'boxed',
        direction: 'row',
        gap: '24px',
        bg_color: '#ffffff',
        padding_top: '48px',
        padding_bottom: '32px',
        padding_left: '24px',
        padding_right: '24px',
        max_width: '1024px'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            align_items: 'flex-start',
            gap: '8px',
            width: '65%'
          },
          widgets: [
            {
              type: 'heading',
              content: { text: 'Loja', tag: 'h1' },
              settings: {
                font_size: '48px',
                font_weight: '700',
                line_height: '1.08',
                letter_spacing: '-0.025em',
                color: '#1d1d1f'
              }
            }
          ]
        },
        {
          settings: {
            direction: 'column',
            align_items: 'flex-start',
            justify_content: 'center',
            gap: '10px',
            width: '35%'
          },
          widgets: [
            {
              type: 'text',
              content: {
                text: 'A melhor maneira de comprar os produtos que você ama.',
                tag: 'p'
              },
              settings: {
                font_size: '17px',
                font_weight: '600',
                color: '#6e6e73',
                line_height: '1.4'
              }
            },
            {
              type: 'button',
              content: {
                label: '💬 Fale com um especialista ↗',
                button_variant: 'link',
                button_size: 'sm',
                link: '/contato'
              },
              settings: {
                color: '#0071e3',
                font_size: '14px',
                font_weight: '400'
              }
            },
            {
              type: 'button',
              content: {
                label: '📍 Encontre uma Loja TEKNIX ↗',
                button_variant: 'link',
                button_size: 'sm',
                link: '/produtos'
              },
              settings: {
                color: '#0071e3',
                font_size: '14px',
                font_weight: '400'
              }
            }
          ]
        }
      ]
    }
  },

  {
    id: 'apple-cards-scroller-the-latest',
    name: 'The Latest — Carrossel de Cards com Fotos & Preços (1:1 Apple)',
    category: 'ecommerce',
    description: 'Scroller horizontal 1:1 Apple Store com cards arredondados, imagens imersivas, badges (Pre-order, New), preços e parcelamento.',
    schema: {
      type: 'section',
      settings: {
        layout: 'full',
        direction: 'column',
        gap: '24px',
        bg_color: '#f5f5f7',
        padding_top: '56px',
        padding_bottom: '56px',
        padding_left: '24px',
        padding_right: '24px'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            align_items: 'flex-start',
            max_width: '1024px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%',
            margin_bottom: '16px'
          },
          widgets: [
            {
              type: 'heading',
              content: { text: 'O que há de mais novo.', tag: 'h2' },
              settings: {
                font_size: '28px',
                font_weight: '700',
                color: '#1d1d1f',
                letter_spacing: '-0.015em'
              }
            },
            {
              type: 'text',
              content: { text: 'Dê uma olhada nos lançamentos mais recentes.', tag: 'p' },
              settings: {
                font_size: '17px',
                color: '#86868b',
                margin_top: '4px'
              }
            }
          ]
        },
        {
          settings: {
            direction: 'row',
            gap: '20px',
            align_items: 'stretch',
            flex_wrap: 'nowrap',
            max_width: '1024px',
            margin_left: 'auto',
            margin_right: 'auto',
            width: '100%'
          },
          widgets: [
            {
              type: 'product',
              content: {
                badge: 'PRÉ-VENDA',
                title: 'Mac mini',
                subtitle: 'Agora com chips M6 e M5 Pro.',
                price_text: 'A partir de R$ 7.499 ou R$ 624,91/mês em 12x',
                image_url: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/store-card-40-mac-mini-202609?wid=800&hei=1000&fmt=p-jpg&qlt=80',
                link: '/produtos'
              },
              settings: {
                bg_color: '#ffffff',
                border_radius: '18px',
                padding_top: '28px',
                padding_bottom: '28px',
                padding_left: '24px',
                padding_right: '24px',
                box_shadow: '0 4px 20px rgba(0,0,0,0.06)',
                width: '320px',
                min_height: '460px'
              }
            },
            {
              type: 'product',
              content: {
                badge: 'NOVO',
                title: 'MacBook Neo',
                subtitle: 'A magia do Mac por um preço surpreendente.',
                price_text: 'A partir de R$ 5.999 ou R$ 499,91/mês em 12x',
                image_url: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/store-card-40-macbook-neo-202603?wid=800&hei=1000&fmt=p-jpg&qlt=80',
                link: '/produtos'
              },
              settings: {
                bg_color: '#ffffff',
                border_radius: '18px',
                padding_top: '28px',
                padding_bottom: '28px',
                padding_left: '24px',
                padding_right: '24px',
                box_shadow: '0 4px 20px rgba(0,0,0,0.06)',
                width: '320px',
                min_height: '460px'
              }
            },
            {
              type: 'product',
              content: {
                badge: 'DESTAQUE PRO',
                title: 'iPhone 17 Pro',
                subtitle: 'O ápice da inovação e potência.',
                price_text: 'A partir de R$ 10.499 ou R$ 874,91/mês em 12x',
                image_url: 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/store-card-40-iphone-17-pro-202509?wid=800&hei=1000&fmt=p-jpg&qlt=80',
                link: '/produtos'
              },
              settings: {
                bg_color: '#000000',
                color: '#ffffff',
                border_radius: '18px',
                padding_top: '28px',
                padding_bottom: '28px',
                padding_left: '24px',
                padding_right: '24px',
                box_shadow: '0 4px 20px rgba(0,0,0,0.12)',
                width: '320px',
                min_height: '460px'
              }
            }
          ]
        }
      ]
    }
  },

  {
    id: 'apple-store-difference-shelf',
    name: 'The Store Difference — Vantagens & Benefícios (1:1 Apple)',
    category: 'promos',
    description: 'Grade e carrossel de vantagens exclusivas da loja (Trade-in, Entrega em 2h, Parcelamento inteligente, Gravação grátis).',
    schema: {
      type: 'section',
      settings: {
        layout: 'boxed',
        direction: 'column',
        gap: '32px',
        bg_color: '#ffffff',
        padding_top: '64px',
        padding_bottom: '64px',
        padding_left: '24px',
        padding_right: '24px',
        max_width: '1024px'
      },
      containers: [
        {
          settings: {
            direction: 'column',
            align_items: 'flex-start',
            width: '100%'
          },
          widgets: [
            {
              type: 'heading',
              content: { text: 'A diferença da Loja TEKNIX.', tag: 'h2' },
              settings: {
                font_size: '28px',
                font_weight: '700',
                color: '#1d1d1f',
                letter_spacing: '-0.015em'
              }
            },
            {
              type: 'text',
              content: { text: 'Ainda mais motivos para comprar com a gente.', tag: 'p' },
              settings: {
                font_size: '17px',
                color: '#86868b',
                margin_top: '4px'
              }
            }
          ]
        },
        {
          settings: {
            direction: 'row',
            gap: '20px',
            align_items: 'stretch',
            flex_wrap: 'wrap',
            width: '100%'
          },
          widgets: [
            {
              type: 'text',
              content: {
                text: '🔄 **Troca TEKNIX Trade-in**\n\nEntregue seu aparelho usado e ganhe crédito imediato na compra de um novo.',
                tag: 'div'
              },
              settings: {
                bg_color: '#f5f5f7',
                border_radius: '18px',
                padding_top: '28px',
                padding_bottom: '28px',
                padding_left: '24px',
                padding_right: '24px',
                width: '48%',
                min_height: '180px',
                font_size: '15px',
                line_height: '1.4'
              }
            },
            {
              type: 'text',
              content: {
                text: '🚚 **Entrega Expressa ou Retirada**\n\nAproveite entrega em até 2 horas em capitais, frete grátis ou retirada rápida.',
                tag: 'div'
              },
              settings: {
                bg_color: '#f5f5f7',
                border_radius: '18px',
                padding_top: '28px',
                padding_bottom: '28px',
                padding_left: '24px',
                padding_right: '24px',
                width: '48%',
                min_height: '180px',
                font_size: '15px',
                line_height: '1.4'
              }
            },
            {
              type: 'text',
              content: {
                text: '💳 **Opções de Pagamento Flexíveis**\n\nPague à vista com 10% de desconto no Pix ou parcele em até 12x sem juros no cartão.',
                tag: 'div'
              },
              settings: {
                bg_color: '#f5f5f7',
                border_radius: '18px',
                padding_top: '28px',
                padding_bottom: '28px',
                padding_left: '24px',
                padding_right: '24px',
                width: '48%',
                min_height: '180px',
                font_size: '15px',
                line_height: '1.4'
              }
            },
            {
              type: 'text',
              content: {
                text: '✨ **Personalização Gratuita**\n\nGrave nomes, números e emojis personalizados sem nenhum custo adicional.',
                tag: 'div'
              },
              settings: {
                bg_color: '#f5f5f7',
                border_radius: '18px',
                padding_top: '28px',
                padding_bottom: '28px',
                padding_left: '24px',
                padding_right: '24px',
                width: '48%',
                min_height: '180px',
                font_size: '15px',
                line_height: '1.4'
              }
            }
          ]
        }
      ]
    }
  }
]
