import { BaseMarketplaceIntegration } from './base'
import { IntegrationCapability } from './types'

export class ShopeeIntegration extends BaseMarketplaceIntegration {
  readonly marketplaceCode = 'SHOPEE'
  readonly marketplaceName = 'Shopee'
  readonly capabilities: IntegrationCapability[] = ['getOrders', 'getListings', 'syncOrders']
}

export class AmazonIntegration extends BaseMarketplaceIntegration {
  readonly marketplaceCode = 'AMAZON'
  readonly marketplaceName = 'Amazon'
  readonly capabilities: IntegrationCapability[] = ['getOrders', 'getListings', 'syncOrders']
}

export class TikTokShopIntegration extends BaseMarketplaceIntegration {
  readonly marketplaceCode = 'TIKTOK_SHOP'
  readonly marketplaceName = 'TikTok Shop'
  readonly capabilities: IntegrationCapability[] = []
}

export class MagaluIntegration extends BaseMarketplaceIntegration {
  readonly marketplaceCode = 'MAGALU'
  readonly marketplaceName = 'Magazine Luiza'
  readonly capabilities: IntegrationCapability[] = ['getListings']
}

export class TemuIntegration extends BaseMarketplaceIntegration {
  readonly marketplaceCode = 'TEMU'
  readonly marketplaceName = 'Temu'
  readonly capabilities: IntegrationCapability[] = []
}

export class SheinIntegration extends BaseMarketplaceIntegration {
  readonly marketplaceCode = 'SHEIN'
  readonly marketplaceName = 'Shein'
  readonly capabilities: IntegrationCapability[] = []
}

export class AliExpressIntegration extends BaseMarketplaceIntegration {
  readonly marketplaceCode = 'ALIEXPRESS'
  readonly marketplaceName = 'AliExpress'
  readonly capabilities: IntegrationCapability[] = []
}

export class CasasBahiaIntegration extends BaseMarketplaceIntegration {
  readonly marketplaceCode = 'CASAS_BAHIA'
  readonly marketplaceName = 'Casas Bahia'
  readonly capabilities: IntegrationCapability[] = []
}

export class AmericanasIntegration extends BaseMarketplaceIntegration {
  readonly marketplaceCode = 'AMERICANAS'
  readonly marketplaceName = 'Americanas'
  readonly capabilities: IntegrationCapability[] = []
}

export class OLXIntegration extends BaseMarketplaceIntegration {
  readonly marketplaceCode = 'OLX'
  readonly marketplaceName = 'OLX'
  readonly capabilities: IntegrationCapability[] = []
}

export class OtherMarketplaceIntegration extends BaseMarketplaceIntegration {
  readonly marketplaceCode = 'OUTROS'
  readonly marketplaceName = 'Outros'
  readonly capabilities: IntegrationCapability[] = []
}
