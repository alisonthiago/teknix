import type { Product } from '../types/database'
import type { ProductSignalsData, ProductReview } from './productPresentation'
import { DEFAULT_COMMERCE } from '../../../../packages/core/src/productCommerce'

export const DEMO_REVIEWS: ProductReview[] = [
  { id: 'sample-1', author: 'Cliente exemplo 1', rating: 5, date: '2026-09-03', text: 'Exemplo de comentário positivo para visualizar o espaço de avaliação do produto.', recommended: true },
  { id: 'sample-2', author: 'Cliente exemplo 2', rating: 4, date: '2026-09-02', text: 'Exemplo de avaliação com uma observação sobre a experiência de uso.', recommended: true },
  { id: 'sample-3', author: 'Cliente exemplo 3', rating: 3, date: '2026-09-01', text: 'Exemplo de comentário com pontos que poderiam melhorar.', recommended: false },
]

// Fixtures visuais: nunca derivar estes selos para o catálogo real.
export const DEMO_SIGNALS: ProductSignalsData = { demo: true, bestSeller: true, stock: 1, offerEndsAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString() }

export const DEMO_PRODUCT: Product = {
  commerce: {...DEFAULT_COMMERCE,installments:12},
  id: 'demo-pistola-lavagem',
  name: 'Pistola de lavagem — Demonstração',
  sku: 'DEMO-LAVAGEM',
  brand: 'Demonstração',
  category: 'Lavagem',
  price: 199.90,
  promo_price: 179.91,
  image_url: '/images/referencias/pistola-de-lavagem.webp',
  images: ['/images/referencias/pistola-de-lavagem.webp'],
  created_at: '2026-09-03T00:00:00Z',
  stock: 0,
  description: 'Exemplo visual com a imagem enviada. Preços, parcelamento e condições são ilustrativos e não constituem uma oferta de venda.',
  short_description: 'Prévia da página de produto. Compra, favoritos e cálculo de frete desativados.',
  specifications: ['Tipo: Pistola de lavagem', 'Cadastro: Demonstração local', 'Dados técnicos: A confirmar no cadastro real'],
}
