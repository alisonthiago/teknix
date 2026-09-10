// Alias interno para deployments do FLOW. A URL pública continua sendo
// /webhooks/melhor-envio e não deve ser confundida com o callback OAuth.
export {
  GET,
  POST,
} from '../../../webhooks/melhor-envio/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'