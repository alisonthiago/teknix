import { SectionSchema } from '../types/pageBuilder'
import { PRESETS } from './index'

export interface PageTemplateDefinition {
  id: string
  name: string
  description: string
  type: 'home' | 'product' | 'landing' | 'institutional' | 'blank'
  thumbnail?: string
  sections: SectionSchema[]
}

// Encontrar preset por ID para compor templates de forma limpa
function getPresetSchema(presetId: string): SectionSchema {
  const p = PRESETS.find(item => item.id === presetId)
  if (!p) {
    throw new Error(`Preset with ID "${presetId}" not found`)
  }
  return JSON.parse(JSON.stringify(p.schema))
}

export const PAGE_TEMPLATES: PageTemplateDefinition[] = [
  {
    id: 'template-home-teknix',
    name: 'Home Oficial TEKNIX',
    description: 'A estrutura visual completa da Home oficial com Ribbon, Heroes, Promos 2x2 e Galeria.',
    type: 'home',
    sections: [
      getPresetSchema('ribbon-announcement'),
      getPresetSchema('hero-mac-mini'),
      getPresetSchema('hero-mac-studio'),
      getPresetSchema('hero-back-to-school'),
      getPresetSchema('promo-grid-complete'),
      getPresetSchema('promo-card-dark'),
      getPresetSchema('promo-card-services'),
      getPresetSchema('carousel-entertainment'),
      getPresetSchema('faq-official')
    ]
  },
  {
    id: 'template-product-presentation',
    name: 'Página de Apresentação de Produto',
    description: 'Layout editorial focado em contar a história de um produto com specs, diferenciais e CTA.',
    type: 'product',
    sections: [
      getPresetSchema('hero-dark-pro'),
      getPresetSchema('cols-2-split-text-image'),
      getPresetSchema('cols-3-features'),
      getPresetSchema('product-grid-official'),
      getPresetSchema('faq-official')
    ]
  },
  {
    id: 'template-landing-campaign',
    name: 'Landing Page de Campanha / Ofertas',
    description: 'Página de alta conversão para eventos, descontos ou lançamentos sazonais.',
    type: 'landing',
    sections: [
      getPresetSchema('ribbon-announcement'),
      getPresetSchema('hero-back-to-school'),
      getPresetSchema('promo-grid-complete'),
      getPresetSchema('cols-3-features'),
      getPresetSchema('faq-official')
    ]
  },
  {
    id: 'template-store-apple',
    name: 'Store Oficial TEKNIX (1:1 Apple Store)',
    description: 'Template oficial da Store com Header de Especialista, Carrossel The Latest e Shelf de Benefícios.',
    type: 'home',
    sections: [
      getPresetSchema('ribbon-announcement'),
      getPresetSchema('apple-store-header-specialist'),
      getPresetSchema('apple-cards-scroller-the-latest'),
      getPresetSchema('apple-store-difference-shelf'),
      getPresetSchema('promo-grid-complete'),
      getPresetSchema('faq-official')
    ]
  },
  {
    id: 'template-blank',
    name: 'Página em Branco',
    description: 'Inicie uma página limpa do zero adicionando suas próprias seções.',
    type: 'blank',
    sections: []
  }
]
