import type { CanvasLayout, CanvasNode } from '../../../../packages/core/src/pageWidgets'

/**
 * Converte a estrutura de dados JSON oficial do Elementor (pro-elements)
 * para a estrutura CanvasLayout e CanvasNode do TEKNIX Page Builder.
 */
export function convertElementorNode(raw: any): CanvasNode {
  const elType = raw.elType || (raw.elements ? 'container' : 'widget')
  const widgetTypeRaw = raw.widgetType || raw.type || ''

  // Mapeamento completo de nomes de widgets Elementor -> TEKNIX
  const widgetTypeMap: Record<string, string> = {
    'heading': 'heading',
    'text-editor': 'text',
    'text': 'text',
    'image': 'image',
    'button': 'button',
    'divider': 'divider',
    'spacer': 'spacer',
    'google_maps': 'googleMaps',
    'icon': 'icon',
    'image-box': 'imageBox',
    'icon-box': 'iconBox',
    'star-rating': 'starRating',
    'image-carousel': 'carousel',
    'basic-gallery': 'gallery',
    'icon-list': 'list',
    'counter': 'counter',
    'progress': 'progressBar',
    'testimonial': 'testimonials',
    'tabs': 'tabs',
    'accordion': 'accordion',
    'toggle': 'accordion',
    'social-icons': 'socialIcons',
    'alert': 'alert',
    'audio': 'audio',
    'shortcode': 'html',
    'html': 'html',
    'menu-anchor': 'anchor',
    'sidebar': 'sidebar',
    'read-more': 'button',
    // Elementor Pro widgets
    'posts': 'posts',
    'portfolio': 'portfolio',
    'gallery': 'gallery',
    'form': 'form',
    'login': 'login',
    'slides': 'slides',
    'nav-menu': 'navMenu',
    'animated-headline': 'animatedHeadline',
    'price-list': 'priceList',
    'price-table': 'priceTable',
    'flip-box': 'flipBox',
    'call-to-action': 'cta',
    'media-carousel': 'carousel',
    'testimonial-carousel': 'testimonials',
    'reviews': 'reviews',
    'table-of-contents': 'tableOfContents',
    'countdown': 'countdown',
    'share-buttons': 'shareButtons',
    'blockquote': 'quote',
    'lottie': 'lottie',
    'code-highlight': 'code',
    'hotspot': 'hotspot',
    'video-playlist': 'video',
    'progress-tracker': 'progressTracker',
    'nested-carousel': 'carousel',
    'mega-menu': 'megaMenu',
    'loop-grid': 'loopGrid',
    'loop-carousel': 'loopCarousel'
  }

  const isStructure = elType === 'container' || elType === 'section' || elType === 'column'
  const type = isStructure ? (raw.isGrid ? 'grid' : 'container') : (widgetTypeMap[widgetTypeRaw] || widgetTypeRaw || 'widget')
  const settings = raw.settings || {}

  // Extrair propriedades de estilo e conteúdo
  const content: Record<string, any> = { ...settings }

  // Mapear propriedades de texto e títulos
  if (settings.title) content.title = settings.title
  if (settings.editor) content.text = settings.editor
  if (settings.text) content.label = settings.text
  if (settings.image?.url) content.image = settings.image.url
  if (settings.link?.url) content.link = settings.link.url
  if (settings.align) content.align = settings.align

  // Tratamento de estilos de tipografia e cores vindos do Elementor
  if (settings.title_color) content.color = settings.title_color
  if (settings.text_color) content.color = settings.text_color
  if (settings.background_color) content.background = settings.background_color
  if (settings.typography_font_family) content.font_family = settings.typography_font_family
  if (settings.typography_font_size?.size) {
    content.font_size = `${settings.typography_font_size.size}${settings.typography_font_size.unit || 'px'}`
  }
  if (settings.typography_font_weight) content.font_weight = settings.typography_font_weight
  if (settings.typography_text_transform) content.text_transform = settings.typography_text_transform

  // Configurações de container / layout flexbox
  if (isStructure) {
    content.direction = settings.flex_direction || (elType === 'column' ? 'column' : 'row')
    content.wrap = settings.flex_wrap || 'wrap'
    content.justify = settings.justify_content || 'flex-start'
    content.align = settings.align_items || 'stretch'
    content.gap = settings.flex_gap?.size ? `${settings.flex_gap.size}${settings.flex_gap.unit || 'px'}` : '16px'
    content.width_type = settings.boxed_width || 'boxed'
  }

  const children: CanvasNode[] | undefined = raw.elements && Array.isArray(raw.elements)
    ? raw.elements.map(convertElementorNode)
    : undefined

  return {
    id: raw.id ? `el_${raw.id}` : crypto.randomUUID(),
    label: raw.title || raw.name || raw.label || (isStructure ? (elType === 'column' ? 'Coluna' : 'Contêiner') : type),
    type,
    content,
    children
  }
}

/**
 * Converte um template ou exportação JSON completa do Elementor para CanvasLayout
 */
export function convertElementorTemplateToLayout(json: any): CanvasLayout {
  if (!json) return { nodes: [] }

  const rootList = Array.isArray(json)
    ? json
    : Array.isArray(json.content)
    ? json.content
    : Array.isArray(json.elements)
    ? json.elements
    : [json]

  const nodes = rootList.map(convertElementorNode)
  return { nodes }
}

/**
 * Modelos Oficiais importados do Elementor Pro (referencias/elementor)
 */
export interface ElementorBuiltinTemplate {
  id: string
  title: string
  category: 'pro' | 'loop' | 'marketing' | 'ecommerce'
  description: string
  badge: string
  thumbnailUrl?: string
  layout: CanvasLayout
}

export const ELEMENTOR_BUILTIN_TEMPLATES: ElementorBuiltinTemplate[] = [
  {
    id: 'elementor_taxonomy_loop',
    title: 'Loop de Taxonomia / Categorias (Oficial Elementor)',
    category: 'loop',
    badge: 'Elementor Pro',
    description: 'Template oficial de loop extraído de referencias/elementor/pro-elements/sample-data com cabeçalho, descrição, imagens e botão CTA.',
    layout: {
      nodes: [
        {
          id: 'con_elementor_tax_1',
          label: 'Contêiner de Categoria',
          type: 'container',
          content: {
            direction: 'column',
            align: 'center',
            justify: 'center',
            gap: '16px',
            width_type: 'boxed',
            background: '#ffffff',
            padding: '40px 24px',
            border_radius: '16px',
            box_shadow: '0 4px 20px rgba(0,0,0,0.06)'
          },
          children: [
            {
              id: 'w_tax_heading',
              label: 'Título da Categoria',
              type: 'heading',
              content: {
                text: 'CATEGORIA EM DESTAQUE',
                tag: 'h2',
                align: 'center',
                color: '#E46EC0',
                font_family: 'Assistant, sans-serif',
                font_weight: '700',
                text_transform: 'uppercase',
                font_size: '28px'
              }
            },
            {
              id: 'w_tax_desc',
              label: 'Descrição do Arquivo',
              type: 'text',
              content: {
                text: 'Explore as melhores ferramentas de precisão e potência para sua oficina ou indústria, com garantia e entrega rápida.',
                align: 'center',
                color: '#64748b',
                font_size: '15px'
              }
            },
            {
              id: 'w_tax_img',
              label: 'Imagem do Produto / Taxonomia',
              type: 'image',
              content: {
                image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=800&q=80',
                alt: 'Ferramenta de precisão',
                align: 'center',
                border_radius: '12px'
              }
            },
            {
              id: 'w_tax_btn',
              label: 'Botão de Acesso',
              type: 'button',
              content: {
                text: 'VER PRODUTOS DA CATEGORIA',
                label: 'VER PRODUTOS DA CATEGORIA',
                align: 'center',
                button_link: '/ferramentas',
                background: '#CE61B2',
                color: '#ffffff',
                font_weight: '700',
                font_size: '14px',
                border_radius: '980px',
                padding: '12px 32px'
              }
            }
          ]
        }
      ]
    }
  },
  {
    id: 'elementor_price_table_pro',
    title: 'Tabela de Preços Comparativa (Elementor Pro)',
    category: 'marketing',
    badge: 'Pro Widget',
    description: 'Grade comparativa de planos com 3 tabelas de preços, ribbons de destaque, lista de recursos e botões de chamada para ação.',
    layout: {
      nodes: [
        {
          id: 'con_pricing_row',
          label: 'Linha de Planos',
          type: 'container',
          content: {
            direction: 'row',
            wrap: 'wrap',
            justify: 'center',
            align: 'stretch',
            gap: '24px',
            width_type: 'boxed',
            padding: '48px 16px'
          },
          children: [
            {
              id: 'pt_basic',
              label: 'Plano Básico',
              type: 'priceTable',
              content: {
                plan: 'Iniciante',
                subtitle: 'Para pequenas oficinas',
                currency: 'R$',
                price: '99',
                period: '/mês',
                features: ['Até 5 colaboradores\nSuporte por email\nCatálogo de peças\nGarantia de 3 meses'],
                button_label: 'Começar Agora',
                button_link: '#',
                card_bg: '#ffffff'
              }
            },
            {
              id: 'pt_pro',
              label: 'Plano Profissional',
              type: 'priceTable',
              content: {
                plan: 'Profissional',
                subtitle: 'O mais escolhido por oficinas',
                currency: 'R$',
                price: '199',
                original_price: '249',
                period: '/mês',
                ribbon_title: 'MAIS POPULAR',
                ribbon_bg: '#0071e3',
                features: ['Colaboradores ilimitados\nSuporte VIP 24/7\nEstoque integrado em tempo real\nFrete grátis em reposições\nGarantia estendida TEKNIX'],
                button_label: 'Escolher Pro',
                button_link: '#',
                card_bg: '#ffffff',
                featured: true
              }
            },
            {
              id: 'pt_enterprise',
              label: 'Plano Indústria',
              type: 'priceTable',
              content: {
                plan: 'Empresarial',
                subtitle: 'Para linhas de montagem',
                currency: 'R$',
                price: '499',
                period: '/mês',
                features: ['SLA garantido de 99.9%\nConsultor técnico dedicado\nFaturamento por boleto faturado\nTreinamento para equipe'],
                button_label: 'Falar com Consultor',
                button_link: '#',
                card_bg: '#ffffff'
              }
            }
          ]
        }
      ]
    }
  },
  {
    id: 'elementor_hero_animated',
    title: 'Hero com Título Animado & Contador (Elementor Pro)',
    category: 'marketing',
    badge: 'Pro Effects',
    description: 'Seção de grande impacto com título animado com rabisco SVG, cronômetro regressivo com dias/horas/min/seg e botão de compra.',
    layout: {
      nodes: [
        {
          id: 'con_hero_animated',
          label: 'Hero com Efeitos',
          type: 'container',
          content: {
            direction: 'column',
            align: 'center',
            justify: 'center',
            gap: '24px',
            width_type: 'boxed',
            padding: '60px 24px',
            background: 'linear-gradient(135deg, #0b0f19 0%, #1e293b 100%)',
            border_radius: '20px',
            color: '#ffffff'
          },
          children: [
            {
              id: 'w_headline_pro',
              label: 'Título Animado',
              type: 'animatedHeadline',
              content: {
                headline_style: 'highlight',
                shape: 'underline',
                before_text: 'A revolução em',
                highlighted_text: 'Ferramentas Industriais',
                after_text: 'chegou ao Brasil.',
                stroke_color: '#a2e000',
                color: '#ffffff',
                font_size: '36px',
                align: 'center'
              }
            },
            {
              id: 'w_hero_desc',
              label: 'Subtítulo',
              type: 'text',
              content: {
                text: 'Descontos de até 40% em toda a linha de parafusadeiras, furadeiras de bancada e instrumentos de medição a laser.',
                color: '#cbd5e1',
                align: 'center',
                font_size: '16px'
              }
            },
            {
              id: 'w_hero_countdown',
              label: 'Contador Regressivo',
              type: 'countdown',
              content: {
                title: 'A OFERTA RELÂMPAGO TERMINA EM:',
                end_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 16),
                show_days: true,
                show_hours: true,
                show_minutes: true,
                show_seconds: true
              }
            },
            {
              id: 'w_hero_cta_btn',
              label: 'Botão de Ação',
              type: 'button',
              content: {
                text: 'GARANTIR MINHA OFERTA AGORA',
                label: 'GARANTIR MINHA OFERTA AGORA',
                button_link: '/ferramentas',
                background: '#a2e000',
                color: '#000000',
                font_weight: '800',
                font_size: '16px',
                padding: '16px 36px',
                border_radius: '980px'
              }
            }
          ]
        }
      ]
    }
  },
  {
    id: 'elementor_flipbox_showcase',
    title: 'Vitrine 3D Flip Box (Elementor Pro)',
    category: 'pro',
    badge: '3D Flip',
    description: 'Grade de 3 cartões tridimensionais interativos que giram no hover com ícone frontal e verso com descrição e botão de acesso.',
    layout: {
      nodes: [
        {
          id: 'con_flipbox_grid',
          label: 'Grade de Flip Boxes',
          type: 'container',
          content: {
            direction: 'row',
            wrap: 'wrap',
            justify: 'center',
            align: 'stretch',
            gap: '24px',
            width_type: 'boxed',
            padding: '40px 16px'
          },
          children: [
            {
              id: 'fb_1',
              label: 'Flip Box - Parafusadeiras',
              type: 'flipBox',
              content: {
                effect: 'flip',
                direction: 'right',
                is_3d: true,
                front_title: 'Parafusadeiras a Bateria',
                front_subtitle: 'Passe o mouse para ver os diferenciais',
                front_bg: '#1e293b',
                front_color: '#ffffff',
                front_icon: 'wrench',
                back_title: 'Motor Brushless',
                back_description: 'Até 4x mais durabilidade com baterias intercambiáveis de 20V Max.',
                back_bg: '#2563eb',
                back_color: '#ffffff',
                button_text: 'Ver Catálogo',
                button_link: '/ferramentas'
              }
            },
            {
              id: 'fb_2',
              label: 'Flip Box - Medição a Laser',
              type: 'flipBox',
              content: {
                effect: 'flip',
                direction: 'right',
                is_3d: true,
                front_title: 'Medidores a Laser',
                front_subtitle: 'Precisão milimétrica garantida',
                front_bg: '#0f172a',
                front_color: '#ffffff',
                front_icon: 'crosshair',
                back_title: 'Alcance de 100 Metros',
                back_description: 'Conectividade Bluetooth com cálculo instantâneo de área e volume no app.',
                back_bg: '#059669',
                back_color: '#ffffff',
                button_text: 'Explorar Linha',
                button_link: '/ferramentas'
              }
            },
            {
              id: 'fb_3',
              label: 'Flip Box - Serras de Esquadria',
              type: 'flipBox',
              content: {
                effect: 'flip',
                direction: 'right',
                is_3d: true,
                front_title: 'Corte de Alta Performance',
                front_subtitle: 'Linha profissional TEKNIX',
                front_bg: '#18181b',
                front_color: '#ffffff',
                front_icon: 'shield',
                back_title: 'Cortes em Ângulo Duplo',
                back_description: 'Guia com luz LED sombra e mesa usinada em alumínio naval.',
                back_bg: '#d97706',
                back_color: '#ffffff',
                button_text: 'Conhecer Mais',
                button_link: '/ferramentas'
              }
            }
          ]
        }
      ]
    }
  }
]
