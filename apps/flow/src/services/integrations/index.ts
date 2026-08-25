import { BaseMarketplaceIntegration } from './base'
import { MercadoLivreIntegration } from './mercadolivre'
import {
  ShopeeIntegration,
  AmazonIntegration,
  TikTokShopIntegration,
  MagaluIntegration,
  TemuIntegration,
  SheinIntegration,
  AliExpressIntegration,
  CasasBahiaIntegration,
  AmericanasIntegration,
  OLXIntegration,
  OtherMarketplaceIntegration
} from './others'

const integrations: Record<string, BaseMarketplaceIntegration> = {
  MERCADO_LIVRE: new MercadoLivreIntegration(),
  SHOPEE: new ShopeeIntegration(),
  AMAZON: new AmazonIntegration(),
  TIKTOK_SHOP: new TikTokShopIntegration(),
  MAGALU: new MagaluIntegration(),
  TEMU: new TemuIntegration(),
  SHEIN: new SheinIntegration(),
  ALIEXPRESS: new AliExpressIntegration(),
  CASAS_BAHIA: new CasasBahiaIntegration(),
  AMERICANAS: new AmericanasIntegration(),
  OLX: new OLXIntegration(),
  OUTROS: new OtherMarketplaceIntegration(),
}

export function getIntegration(marketplaceCode: string): BaseMarketplaceIntegration {
  const integration = integrations[marketplaceCode.toUpperCase()]
  if (!integration) return integrations.OUTROS
  return integration
}

export function getAllIntegrations(): BaseMarketplaceIntegration[] {
  return Object.values(integrations)
}

export function getActiveIntegrations(): BaseMarketplaceIntegration[] {
  return Object.values(integrations).filter(i => i.capabilities.length > 0)
}

export { BaseMarketplaceIntegration }
export type { MarketplaceOrder, MarketplaceOrderItem, MarketplaceListing, MarketplaceProduct, IntegrationResult } from './types'
export { NOT_SUPPORTED } from './types'
