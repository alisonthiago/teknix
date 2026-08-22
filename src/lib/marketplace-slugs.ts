/** Slug usado em marketplace_connections e webhooks (TEXT). */
const CODE_TO_SLUG: Record<string, string> = {
  MERCADO_LIVRE: 'mercadolivre',
  SHOPIFY: 'shopify',
  SHOPEE: 'shopee',
  AMAZON: 'amazon',
  MAGALU: 'magalu',
  TIKTOK_SHOP: 'tiktok',
  TEMU: 'temu',
  SHEIN: 'shein',
  OLX: 'olx',
}

export function marketplaceSlug(code: string): string {
  const upper = code.toUpperCase()
  if (CODE_TO_SLUG[upper]) return CODE_TO_SLUG[upper]
  return upper.toLowerCase().replace(/_/g, '')
}

/** Plataformas com integração real (sync/OAuth/webhooks funcionais). */
export const IMPLEMENTED_MARKETPLACE_CODES = new Set(['MERCADO_LIVRE'])

export function isMarketplaceImplemented(code: string): boolean {
  return IMPLEMENTED_MARKETPLACE_CODES.has(code.toUpperCase())
}
