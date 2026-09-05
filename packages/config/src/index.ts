/* ==========================================================================
   TEKNIX MONOREPO — CENTRAL DOMAINS & ENVIRONMENT CONFIG (@teknix/config)
   Fonte oficial e única de domínios, portas locais, CORS e Webhooks
   ========================================================================== */

export type AppEnvironment = 'development' | 'preview' | 'production'

/**
 * Tabela Oficial de Domínios de Produção
 */
export const TEKNIX_PRODUCTION_DOMAINS = {
  SITE: 'https://teknixbrasil.com.br',
  SITE_WWW: 'https://www.teknixbrasil.com.br',
  API: 'https://api.teknixbrasil.com.br',
  AUTH: 'https://auth.teknixbrasil.com.br',
  FLOW: 'https://flow.teknixbrasil.com.br',
  HUB: 'https://hub.teknixbrasil.com.br',
  MAIL: 'https://mail.teknixbrasil.com.br',
  MAIL_DOMAIN: 'mail.teknixbrasil.com.br',
  PLAY: 'https://play.teknixbrasil.com.br',
  PLAY_CHECKOUT: 'https://play.teknixbrasil.com.br',
  SECURITY: 'https://security.teknixbrasil.com.br',
  NOTIFICATIONS: 'https://notifications.teknixbrasil.com.br',
} as const

/**
 * Tabela Oficial de Portas e URLs Locais de Desenvolvimento
 */
export const TEKNIX_DEVELOPMENT_DOMAINS = {
  SITE: 'http://localhost:5173',
  SITE_WWW: 'http://localhost:5173',
  API: 'http://localhost:3000/api',
  AUTH: 'http://localhost:5173/login',
  FLOW: 'http://localhost:3000',
  HUB: 'http://localhost:5174',
  MAIL: 'http://localhost:3000/api/mail',
  MAIL_DOMAIN: 'localhost',
  PLAY: 'http://localhost:5173/checkout',
  PLAY_CHECKOUT: 'http://localhost:5173/checkout',
  SECURITY: 'http://localhost:3000/api/security',
  NOTIFICATIONS: 'http://localhost:3000/api/notifications',
} as const

/**
 * Mapeamento Detalhado do Ecossistema TEKNIX
 */
export const TEKNIX_ECOSYSTEM = [
  {
    domain: 'teknixbrasil.com.br',
    role: 'Site oficial / e-commerce da Teknix',
    devUrl: 'http://localhost:5173',
    app: 'site'
  },
  {
    domain: 'api.teknixbrasil.com.br',
    role: 'API central — concentra as APIs e integrações do ecossistema',
    devUrl: 'http://localhost:3000/api',
    app: 'flow'
  },
  {
    domain: 'auth.teknixbrasil.com.br',
    role: 'Autenticação — login, sessão, tokens, 2FA e recuperação de acesso',
    devUrl: 'http://localhost:5173/login',
    app: 'auth'
  },
  {
    domain: 'flow.teknixbrasil.com.br',
    role: 'Teknix Flow — operação de marketplaces, pedidos, vendas, estoque, expedição etc.',
    devUrl: 'http://localhost:3000',
    app: 'flow'
  },
  {
    domain: 'hub.teknixbrasil.com.br',
    role: 'Teknix Hub — administração e gerenciamento da loja/site',
    devUrl: 'http://localhost:5174',
    app: 'hub'
  },
  {
    domain: 'mail.teknixbrasil.com.br',
    role: 'Serviço de e-mails transacionais e comunicações',
    devUrl: 'localhost',
    app: 'mail'
  },
  {
    domain: 'play.teknixbrasil.com.br',
    role: 'Teknix Play — checkout e fluxo de pagamento',
    devUrl: 'http://localhost:5173/checkout',
    app: 'play'
  },
  {
    domain: 'security.teknixbrasil.com.br',
    role: 'Central de Segurança — segurança da conta e do ecossistema',
    devUrl: 'http://localhost:3000/api/security',
    app: 'security'
  }
] as const

export const TEKNIX_WEBHOOK_ENDPOINTS = {
  MERCADO_LIVRE: 'https://api.teknixbrasil.com.br/webhooks/mercadolivre',
  SHOPEE: 'https://api.teknixbrasil.com.br/webhooks/shopee',
  AMAZON: 'https://api.teknixbrasil.com.br/webhooks/amazon',
  PAYMENTS: 'https://api.teknixbrasil.com.br/webhooks/payment',
  BREVO: 'https://api.teknixbrasil.com.br/webhooks/brevo'
} as const

/**
 * Origens autorizadas para CORS em Produção e Desenvolvimento
 */
export const TEKNIX_CORS_ALLOWED_ORIGINS = [
  'https://teknixbrasil.com.br',
  'https://www.teknixbrasil.com.br',
  'https://flow.teknixbrasil.com.br',
  'https://hub.teknixbrasil.com.br',
  'https://play.teknixbrasil.com.br',
  'https://auth.teknixbrasil.com.br',
  'https://api.teknixbrasil.com.br',
  'https://notifications.teknixbrasil.com.br',
  'https://security.teknixbrasil.com.br',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000'
] as const

/**
 * URLs de Redirecionamento e Callback Autorizadas no Supabase Auth
 */
export const SUPABASE_AUTH_REDIRECT_URLS = [
  'https://teknixbrasil.com.br/conta',
  'https://teknixbrasil.com.br/login',
  'https://auth.teknixbrasil.com.br',
  'https://flow.teknixbrasil.com.br',
  'https://hub.teknixbrasil.com.br',
  'https://play.teknixbrasil.com.br',
  'http://localhost:5173/conta',
  'http://localhost:5173/login',
  'http://localhost:5174',
  'http://localhost:3000'
] as const

export const APP_PROJECTS = {
  SITE: 'site',
  FLOW: 'flow',
  HUB: 'hub',
  PLAY: 'play',
  AUTH: 'auth',
  API: 'api'
} as const

export const SYSTEM_DEFAULTS = {
  CURRENCY: 'BRL',
  LOCALE: 'pt-BR',
  COUNTRY: 'Brasil',
  STORE_NAME: 'TEKNIX Store'
} as const

export function getAppUrl(
  app: keyof typeof TEKNIX_PRODUCTION_DOMAINS,
  env: AppEnvironment = 'production'
): string {
  if (env === 'development') {
    return TEKNIX_DEVELOPMENT_DOMAINS[app] || TEKNIX_PRODUCTION_DOMAINS[app]
  }
  return TEKNIX_PRODUCTION_DOMAINS[app]
}
