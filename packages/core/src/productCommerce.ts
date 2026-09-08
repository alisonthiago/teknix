/** Contrato HUB → SITE. Configuração editorial separada dos dados do marketplace. */
export interface ProductCommerce {
  offerEnabled: boolean
  offerEndsAt: string | null
  badge: 'none' | 'daily' | 'special' | 'bestseller'
  showLastUnit: boolean
  installments: number
  pixDiscountPercent: number
  freeShipping: boolean
  condition?: string
  soldCount?: number | string
}
export const DEFAULT_COMMERCE: ProductCommerce = {
  offerEnabled: false, offerEndsAt: null, badge: 'none', showLastUnit: false,
  installments: 1, pixDiscountPercent: 0, freeShipping: false,
  condition: 'Novo', soldCount: '+10 mil vendidos'
}
export function normalizeCommerce(value: unknown): ProductCommerce {
  const p = value && typeof value === 'object' ? value as Partial<ProductCommerce> : {}
  return {
    offerEnabled: p.offerEnabled === true,
    offerEndsAt: typeof p.offerEndsAt === 'string' && Number.isFinite(Date.parse(p.offerEndsAt)) ? p.offerEndsAt : null,
    badge: ['daily','special','bestseller'].includes(p.badge || '') ? p.badge! : 'none',
    showLastUnit: p.showLastUnit === true,
    installments: Number.isInteger(p.installments) && p.installments! >= 1 && p.installments! <= 24 ? p.installments! : 1,
    pixDiscountPercent: typeof p.pixDiscountPercent === 'number' && Number.isFinite(p.pixDiscountPercent) && p.pixDiscountPercent >= 0 && p.pixDiscountPercent < 100 ? p.pixDiscountPercent : 0,
    freeShipping: p.freeShipping === true,
    condition: typeof p.condition === 'string' && p.condition.trim() ? p.condition.trim() : 'Novo',
    soldCount: p.soldCount != null ? p.soldCount : '+10 mil vendidos'
  }
}
export function validateCommerce(p: ProductCommerce, price: number, promo: number | null, now = Date.now()): string | null {
  if (!Number.isFinite(price) || price < 0) return 'Informe um preço de venda válido.'
  if (promo !== null && (!Number.isFinite(promo) || promo <= 0 || promo >= price)) return 'O preço promocional deve ser maior que zero e menor que o preço de venda.'
  if (p.offerEnabled && (!p.offerEndsAt || !Number.isFinite(Date.parse(p.offerEndsAt)) || Date.parse(p.offerEndsAt) <= now)) return 'A oferta precisa de uma data de término no futuro.'
  if (!Number.isInteger(p.installments) || p.installments < 1 || p.installments > 24) return 'Escolha de 1 a 24 parcelas sem juros.'
  if (!Number.isFinite(p.pixDiscountPercent) || p.pixDiscountPercent < 0 || p.pixDiscountPercent >= 100) return 'O desconto no Pix deve ser de 0 a menos de 100%.'
  return null
}
export function productPricing(price = 0, promo: number | null | undefined, settings: unknown, now = Date.now()) {
  const commerce = normalizeCommerce(settings)
  const base = Number.isFinite(Number(price)) ? Math.max(0, Number(price)) : 0
  const offerActive = commerce.offerEnabled && !!commerce.offerEndsAt && Date.parse(commerce.offerEndsAt) > now
  const promotionActive = !commerce.offerEnabled || offerActive
  const current = promotionActive && promo != null && promo > 0 && promo < base ? Number(promo) : base
  const pix = Math.round(current * (1 - commerce.pixDiscountPercent / 100) * 100) / 100
  return { base, current, pix, discount: base > pix ? Math.round((base - pix) / base * 100) : 0,
    installment: Math.round(current / commerce.installments * 100) / 100, commerce, offerActive }
}

/**
 * Remove palavras repetidas, termos duplicados e repetições de SEO de títulos de produtos.
 * Ex: "Brocas Parafusadeira Kit Brocas De Madeira Jogo De Brocas Concreto Jogo De Brocas..."
 * -> "Kit Jogo de Brocas Parafusadeira Madeira Concreto..."
 */
export function cleanProductTitle(rawTitle?: string | null): string {
  if (!rawTitle || typeof rawTitle !== 'string') return ''
  const trimmed = rawTitle.trim()
  if (!trimmed) return ''

  const words = trimmed.split(/\s+/)
  if (words.length <= 3) return trimmed

  const connectors = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'com', 'sem', 'para', 'a', 'o', 'as', 'os', '+'])
  const seenWords = new Set<string>()
  const filteredWords: string[] = []

  for (let i = 0; i < words.length; i++) {
    const rawWord = words[i]
    const normalized = rawWord
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '')

    if (!normalized) {
      filteredWords.push(rawWord)
      continue
    }

    if (connectors.has(normalized)) {
      const prevNorm = filteredWords[filteredWords.length - 1]
        ?.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '')
      if (prevNorm && connectors.has(prevNorm)) continue
      filteredWords.push(rawWord)
      continue
    }

    if (seenWords.has(normalized)) {
      continue
    }

    seenWords.add(normalized)
    filteredWords.push(rawWord)
  }

  let cleaned = filteredWords.join(' ')
  cleaned = cleaned
    .replace(/^(de|da|do|e|com|para|em)\s+/i, '')
    .replace(/\s+(de|da|do|e|com|para|em)\s*$/i, '')
    .trim()

  return cleaned || trimmed
}

/* ==========================================================================
   TEKNIX SHOWCASE EDITORIAL & STORYTELLING DO PRODUTO (1:1 APPLE STORE)
   ========================================================================== */

export interface EditorialBenefit {
  icon: 'zap' | 'battery' | 'shield' | 'wrench' | 'truck' | 'star'
  title: string
  desc: string
}

export interface EditorialFeature {
  title: string
  desc: string
}

export interface EditorialModelCard {
  badge: string
  name: string
  specs: string
  image_url: string
  link?: string
}

export interface EditorialComparisonRow {
  attr: string
  col1_val: string
  col2_val: string
}

export interface EditorialFaq {
  q: string
  a: string
}

export interface ProductEditorialShowcase {
  enabled: boolean
  hero: {
    eyebrow: string
    title: string
    description: string
    benefits: EditorialBenefit[]
    cta_primary_text: string
    cta_secondary_text: string
    top_badge: string
    bottom_badge: string
    image_url: string
  }
  performance: {
    title: string
    description: string
    image_url: string
    features: EditorialFeature[]
  }
  explore_models: {
    title: string
    models: EditorialModelCard[]
  }
  comparison: {
    title: string
    col1_title: string
    col2_title: string
    rows: EditorialComparisonRow[]
  }
  faqs: EditorialFaq[]
}

export function createDefaultShowcase(
  productName?: string,
  category?: string,
  images?: string[]
): ProductEditorialShowcase {
  const cleanTitle = cleanProductTitle(productName || 'Chave de Impacto 21V') || 'este equipamento'
  const img1 = images && images[0] ? images[0] : ''
  const img2 = images && images[1] ? images[1] : img1

  return {
    enabled: true,
    hero: {
      eyebrow: 'MÁXIMA EFICIÊNCIA & PRODUTIVIDADE',
      title: `Por que você precisa da ${cleanTitle}?`,
      description: 'Elimine de vez o esforço manual e a perda de tempo com parafusos emperrados. Tenha potência imediata e autonomia completa para realizar manutenções automotivas, montagens pesadas e reparos em uma fração do tempo — com ergonomia e sem cansar os braços.',
      benefits: [
        {
          icon: 'zap',
          title: 'Mais força com menos esforço',
          desc: 'solta porcas e parafusos difíceis em 2 segundos.'
        },
        {
          icon: 'battery',
          title: 'Trabalho sem interrupções',
          desc: '2 baterias 21V para usar o dia todo sem depender de fios.'
        },
        {
          icon: 'shield',
          title: 'Kit completo reforçado',
          desc: 'estojo rígido com todas as ferramentas e soquetes necessários.'
        }
      ],
      cta_primary_text: 'Garantir agora',
      cta_secondary_text: 'Comparar versões',
      top_badge: 'Alto Torque 350 N.m',
      bottom_badge: '2x Baterias 21V Lítio',
      image_url: img1
    },
    performance: {
      title: 'Melhore seu rendimento com equipamentos de alta velocidade',
      description: 'Projetado para superar limites nos fluxos operacionais mais exigentes, proporcionando torque contínuo, resposta imediata e autonomia ininterrupta para não parar o seu dia a dia.',
      image_url: img2,
      features: [
        {
          title: 'Mecanismo de alto impacto e transmissão reforçada',
          desc: 'Engrenagens em aço temperado com mancal blindado, garantindo transmissão de torque contínuo e sem oscilações sob cargas severas de fixação.'
        },
        {
          title: 'Velocidade de rotação controlada e gatilho progressivo',
          desc: 'Ajuste instantâneo de rotação conforme a pressão do acionador eletrônico, permitindo desde fixações delicadas até desapertos velozes em parafusos emperrados.'
        },
        {
          title: 'Construção robusta com controle térmico inteligente',
          desc: 'Sistema de ventilação axial e dissipador térmico integrado, mantendo a temperatura de operação estável mesmo em longas jornadas de trabalho.'
        }
      ]
    },
    explore_models: {
      title: 'Explore os modelos e configurações',
      models: [
        {
          badge: 'Disponível com 1 Bateria Lítio • Carregador Bivolt',
          name: `${cleanTitle} Essential`,
          specs: 'Torque 280 N.m • Encaixe Quadrado 1/2" Pol.',
          image_url: img1
        },
        {
          badge: 'Edição Pro Completa • 2 Baterias 21V + Maleta 46 Peças',
          name: `Kit ${cleanTitle} Pro + Maleta 46 Peças`,
          specs: 'Torque 350 N.m • 2 Baterias 21V • Jogo Completo',
          image_url: img2
        }
      ]
    },
    comparison: {
      title: 'Comparar versões e configurações',
      col1_title: 'Edição Standard (1 Bateria)',
      col2_title: 'Edição Pro (2 Baterias + 46 Peças)',
      rows: [
        {
          attr: 'Aplicação Recomendada',
          col1_val: 'Montagens & Serviços Leves',
          col2_val: 'Uso Profissional Contínuo & Oficinas'
        },
        {
          attr: 'Tensão e Alimentação',
          col1_val: '21V Lítio (1 Bateria Inclusa)',
          col2_val: '21V Lítio (2 Baterias Inclusas)'
        },
        {
          attr: 'Torque Máximo',
          col1_val: '280 N.m',
          col2_val: '350 N.m com Impacto Reforçado'
        },
        {
          attr: 'Velocidade de Rotação',
          col1_val: '0 a 2.400 RPM',
          col2_val: '0 a 2.800 RPM (Gatilho Variável)'
        },
        {
          attr: 'Encaixe do Mandril',
          col1_val: 'Quadrado Universal 1/2" Pol.',
          col2_val: 'Quadrado 1/2" + Adaptadores e Mandril'
        },
        {
          attr: 'Maleta e Acessórios',
          col1_val: 'Maleta Básica + Carregador',
          col2_val: 'Estojo Rígido + Jogo 46 Peças Soquetes/Bits'
        },
        {
          attr: 'Iluminação Auxiliar LED',
          col1_val: 'LED simples automático',
          col2_val: 'LED de alto brilho integrado'
        },
        {
          attr: 'Garantia e Procedência',
          col1_val: '12 Meses com Nota Fiscal TEKNIX',
          col2_val: '12 Meses com Nota Fiscal TEKNIX'
        }
      ]
    },
    faqs: [
      {
        q: 'O equipamento acompanha baterias e carregador?',
        a: 'Sim. O kit vem completo com baterias recarregáveis de íons de lítio de alta durabilidade e carregador bivolt automático, pronto para uso imediato.'
      },
      {
        q: 'Quais tipos de soquetes e pontas estão inclusos no kit?',
        a: 'Acompanha estojo rígido organizador com conjunto completo de soquetes em aço cromo-vanádio temperado, prolongadores e adaptadores para as mais diversas fixações.'
      },
      {
        q: 'O produto possui garantia oficial TEKNIX e Nota Fiscal?',
        a: 'Sim. Todos os nossos produtos são 100% novos e originais, despachados com Nota Fiscal Eletrônica (NF-e) emitida no seu CPF/CNPJ e garantia oficial de fábrica.'
      },
      {
        q: 'É recomendado para uso profissional e automotivo?',
        a: 'Com certeza. Desenvolvido com carcaça reforçada e motor de alto torque para atender oficinas mecânicas, marcenarias, montagens estruturais e serviços pesados contínuos.'
      },
      {
        q: 'Qual é o prazo de despacho e política de devolução?',
        a: 'Despacho ágil com código de rastreamento oficial. Você conta também com 30 dias para devolução garantida pelo Código de Defesa do Consumidor caso mude de ideia.'
      }
    ]
  }
}

export function normalizeShowcase(raw: unknown, productName?: string, images?: string[]): ProductEditorialShowcase {
  const fallback = createDefaultShowcase(productName, undefined, images)
  if (!raw || typeof raw !== 'object') return fallback

  const s = raw as any
  return {
    enabled: s.enabled !== false,
    hero: {
      eyebrow: typeof s.hero?.eyebrow === 'string' && s.hero.eyebrow.trim() ? s.hero.eyebrow : fallback.hero.eyebrow,
      title: typeof s.hero?.title === 'string' && s.hero.title.trim() ? s.hero.title : fallback.hero.title,
      description: typeof s.hero?.description === 'string' && s.hero.description.trim() ? s.hero.description : fallback.hero.description,
      benefits: Array.isArray(s.hero?.benefits) && s.hero.benefits.length > 0 ? s.hero.benefits : fallback.hero.benefits,
      cta_primary_text: typeof s.hero?.cta_primary_text === 'string' && s.hero.cta_primary_text.trim() ? s.hero.cta_primary_text : fallback.hero.cta_primary_text,
      cta_secondary_text: typeof s.hero?.cta_secondary_text === 'string' && s.hero.cta_secondary_text.trim() ? s.hero.cta_secondary_text : fallback.hero.cta_secondary_text,
      top_badge: typeof s.hero?.top_badge === 'string' ? s.hero.top_badge : fallback.hero.top_badge,
      bottom_badge: typeof s.hero?.bottom_badge === 'string' ? s.hero.bottom_badge : fallback.hero.bottom_badge,
      image_url: typeof s.hero?.image_url === 'string' && s.hero.image_url.trim() ? s.hero.image_url : fallback.hero.image_url
    },
    performance: {
      title: typeof s.performance?.title === 'string' && s.performance.title.trim() ? s.performance.title : fallback.performance.title,
      description: typeof s.performance?.description === 'string' && s.performance.description.trim() ? s.performance.description : fallback.performance.description,
      image_url: typeof s.performance?.image_url === 'string' && s.performance.image_url.trim() ? s.performance.image_url : fallback.performance.image_url,
      features: Array.isArray(s.performance?.features) && s.performance.features.length > 0 ? s.performance.features : fallback.performance.features
    },
    explore_models: {
      title: typeof s.explore_models?.title === 'string' && s.explore_models.title.trim() ? s.explore_models.title : fallback.explore_models.title,
      models: Array.isArray(s.explore_models?.models) && s.explore_models.models.length > 0 ? s.explore_models.models : fallback.explore_models.models
    },
    comparison: {
      title: typeof s.comparison?.title === 'string' && s.comparison.title.trim() ? s.comparison.title : fallback.comparison.title,
      col1_title: typeof s.comparison?.col1_title === 'string' && s.comparison.col1_title.trim() ? s.comparison.col1_title : fallback.comparison.col1_title,
      col2_title: typeof s.comparison?.col2_title === 'string' && s.comparison.col2_title.trim() ? s.comparison.col2_title : fallback.comparison.col2_title,
      rows: Array.isArray(s.comparison?.rows) && s.comparison.rows.length > 0 ? s.comparison.rows : fallback.comparison.rows
    },
    faqs: Array.isArray(s.faqs) && s.faqs.length > 0 ? s.faqs : fallback.faqs
  }
}

