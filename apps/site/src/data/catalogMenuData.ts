/* ==========================================================================
   TEKNIX SITE — Catálogo Oficial de Categorias e Departamentos do Menu
   Estrutura 1:1 com referência Hagor / TEKNIX Industrial
   100% livre de emojis (Clean Design)
   ========================================================================== */

export interface MenuSubcategory {
  title: string
  slug: string
  level?: string
}

export interface MenuDepartment {
  title: string
  slug: string
  level: string
  subcategories: MenuSubcategory[]
}

export const CATALOG_MENU_DEPARTMENTS: MenuDepartment[] = [
  {
    title: 'Ferramentas Elétricas',
    slug: 'ferramentas-eletricas',
    level: '01',
    subcategories: [
      { title: 'Baterias e Carregadores', slug: 'baterias-e-carregadores', level: '0101' },
      { title: 'Chave de Impacto', slug: 'chave-de-impacto', level: '0102' },
      { title: 'Compressor de Ar', slug: 'compressor-de-ar', level: '0103' },
      { title: 'Esmerilhadeira', slug: 'esmerilhadeira', level: '0104' },
      { title: 'Ferramentas para Cabos', slug: 'ferramentas-para-cabos', level: '0105' },
      { title: 'Furadeira Elétrica', slug: 'furadeira-eletrica', level: '0106' },
      { title: 'Grampeador/Pinador Elétrico', slug: 'grampeador-pinador-eletrico', level: '0107' },
      { title: 'Lixadeira e Politriz', slug: 'lixadeira-e-politriz', level: '0108' },
      { title: 'Martelete Elétrico', slug: 'martelete-eletrico', level: '0109' },
      { title: 'Mini Geladeira', slug: 'mini-geladeira', level: '0110' },
      { title: 'Moto Esmeril', slug: 'moto-esmeril', level: '0111' },
      { title: 'Máquina de Solda', slug: 'maquina-de-solda', level: '0112' },
      { title: 'Parafusadeira Elétrica', slug: 'parafusadeira-eletrica', level: '0113' },
      { title: 'Retificadeira Elétrica', slug: 'retificadeira-eletrica', level: '0114' },
      { title: 'Rosqueadeira', slug: 'rosqueadeira', level: '0115' },
      { title: 'Serra Elétrica', slug: 'serra-eletrica', level: '0116' },
      { title: 'Soprador Térmico', slug: 'soprador-termico', level: '0117' },
      { title: 'Tupias e Plainas', slug: 'tupias-e-plainas', level: '0118' }
    ]
  },
  {
    title: 'Construção e Obra',
    slug: 'construcao-e-obra',
    level: '02',
    subcategories: [
      { title: 'Corta Vergalhão', slug: 'corta-vergalhao', level: '0201' },
      { title: 'Vibrador de Concreto', slug: 'vibrador-de-concreto', level: '0202' }
    ]
  },
  {
    title: 'Equipamentos Automotivos',
    slug: 'equipamentos-automotivos',
    level: '03',
    subcategories: [
      { title: 'Alicate Hidráulico', slug: 'alicate-hidraulico', level: '0301' },
      { title: 'Aplicador de Graxa', slug: 'aplicador-de-graxa', level: '0302' },
      { title: 'Cavalete de Apoio', slug: 'cavalete-de-apoio', level: '0303' },
      { title: 'Macaco Hidráulico', slug: 'macaco-hidraulico', level: '0304' },
      { title: 'Macaco Jacaré', slug: 'macaco-jacare', level: '0305' },
      { title: 'Móveis Para Oficina', slug: 'moveis-para-oficina', level: '0306' },
      { title: 'Prensa Hidráulica', slug: 'prensa-hidraulica', level: '0307' },
      { title: 'Desforcímetro', slug: 'desforcimetro', level: '0308' }
    ]
  },
  {
    title: 'Ferramentas Manuais e Bancada',
    slug: 'ferramentas-manuais-e-bancada',
    level: '04',
    subcategories: [
      { title: 'Caixa de Ferramentas', slug: 'caixa-de-ferramentas', level: '0401' },
      { title: 'Chave Catraca', slug: 'chave-catraca', level: '0402' },
      { title: 'Lanterna', slug: 'lanterna', level: '0403' },
      { title: 'Rebitador Manual', slug: 'rebitador-manual', level: '0404' }
    ]
  },
  {
    title: 'Jardim e Paisagismo',
    slug: 'jardim-e-paisagismo',
    level: '05',
    subcategories: [
      { title: 'Aparador', slug: 'aparador', level: '0501' },
      { title: 'Bomba de Água', slug: 'bomba-de-agua', level: '0502' },
      { title: 'Gerador de Energia', slug: 'gerador-de-energia', level: '0503' },
      { title: 'Motosserra', slug: 'motosserra', level: '0504' },
      { title: 'Roçadeira', slug: 'rocadeira', level: '0505' },
      { title: 'Soprador de Folhas', slug: 'soprador-de-folhas', level: '0506' }
    ]
  },
  {
    title: 'Lavagem e Limpeza',
    slug: 'lavagem-e-limpeza',
    level: '06',
    subcategories: [
      { title: 'Acessórios', slug: 'acessorios', level: '0601' },
      { title: 'Aspirador de Pó e Água', slug: 'aspirador-de-po-e-agua', level: '0602' },
      { title: 'Lavadora de Alta Pressão', slug: 'lavadora-de-alta-pressao', level: '0603' },
      { title: 'Shampoozeira', slug: 'shampoozeira', level: '0604' }
    ]
  },
  {
    title: 'Linha Pneumática',
    slug: 'linha-pneumatica',
    level: '07',
    subcategories: [
      { title: 'Aplicador', slug: 'aplicador', level: '0701' },
      { title: 'Balancim', slug: 'balancim', level: '0702' },
      { title: 'Calibrador', slug: 'calibrador', level: '0703' },
      { title: 'Chave de Impacto', slug: 'chave-de-impacto-pneumatica', level: '0704' },
      { title: 'Engraxadeira', slug: 'engraxadeira', level: '0705' },
      { title: 'Esmerilhadeira', slug: 'esmerilhadeira-pneumatica', level: '0706' },
      { title: 'Filtro Regulador', slug: 'filtro-regulador', level: '0707' },
      { title: 'Furadeira', slug: 'furadeira-pneumatica', level: '0708' },
      { title: 'Grampeador', slug: 'grampeador-pneumatico', level: '0709' },
      { title: 'Lixadeira', slug: 'lixadeira-pneumatica', level: '0710' },
      { title: 'Martelete', slug: 'martelete-pneumatico', level: '0711' },
      { title: 'Parafusadeira', slug: 'parafusadeira-pneumatica', level: '0712' },
      { title: 'Pistolas', slug: 'pistolas-pneumaticas', level: '0713' },
      { title: 'Retífica', slug: 'retifica-pneumatica', level: '0714' },
      { title: 'Serra', slug: 'serra-pneumatica', level: '0715' },
      { title: 'Tornador', slug: 'tornador', level: '0716' }
    ]
  },
  {
    title: 'Movimentação de Cargas',
    slug: 'movimentacao-de-cargas',
    level: '08',
    subcategories: [
      { title: 'Transpalete', slug: 'transpalete', level: '0801' }
    ]
  },
  {
    title: 'Pintura e Repintura',
    slug: 'pintura-e-repintura',
    level: '09',
    subcategories: [
      { title: 'Acessórios para Pintura', slug: 'acessorios-para-pintura', level: '0901' },
      { title: 'Pistola Para Pintura', slug: 'pistola-para-pintura', level: '0902' },
      { title: 'Tanque de Pintura', slug: 'tanque-de-pintura', level: '0903' }
    ]
  },
  {
    title: 'Informática e Tecnologia',
    slug: 'informatica',
    level: '10',
    subcategories: [
      { title: 'Notebooks', slug: 'notebooks', level: '1001' },
      { title: 'Monitores', slug: 'monitores', level: '1002' },
      { title: 'Teclados', slug: 'teclados', level: '1003' },
      { title: 'Mouses', slug: 'mouses', level: '1004' }
    ]
  }
]

export const TOTAL_MENU_CATEGORIES_COUNT = CATALOG_MENU_DEPARTMENTS.reduce(
  (sum, dept) => sum + dept.subcategories.length,
  0
) + CATALOG_MENU_DEPARTMENTS.length // ~71 total
