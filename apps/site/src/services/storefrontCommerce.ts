import { productPricing } from '../../../../packages/core/src/productCommerce'
import type { Product } from '../types/database'
import type { CbProductItem } from '../components/StorefrontProductCard'
import type { ProductSignalsData } from './productPresentation'

export function commerceSignals(product: Product, now = Date.now()): ProductSignalsData {
  const {commerce,offerActive} = productPricing(product.price,product.promo_price,product.commerce,now)
  return { badge: commerce.offerEnabled && !offerActive && commerce.badge !== 'bestseller' ? 'none' : commerce.badge,
    offerEndsAt: offerActive ? commerce.offerEndsAt! : undefined,
    stock: commerce.showLastUnit && product.manage_stock !== false ? product.stock : undefined }
}
const money = (value: number) => value.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})
export function storefrontCard(product: Product): CbProductItem {
  const pricing = productPricing(product.price,product.promo_price,product.commerce)
  return {id:product.id,title:product.name,img:product.image_url || '',images:product.images,
    to:`/produtos/${encodeURIComponent(product.sku || product.id)}`,
    signals:commerceSignals(product),reviews:'',oldPrice:pricing.base>pricing.pix ? money(pricing.base) : null,
    pricePix:money(pricing.pix),hasNoPixLabel:true,discountBadge:pricing.discount ? `${pricing.discount}% OFF` : null,
    installments:pricing.commerce.installments>1 ? `${pricing.commerce.installments}x de ${money(pricing.installment)} sem juros` : null,
    bottomTags:pricing.commerce.freeShipping ? [{text:'Frete grátis',type:'green'}] : [], commerceProduct:product}
}
