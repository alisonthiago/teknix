/**
 * SEOHead — Componente de SEO do TEKNIX SITE
 *
 * Wrapper declarativo do hook useSEO.
 * Use em qualquer página para configurar o SEO daquela rota:
 *
 * <SEOHead
 *   title="Furadeira X | TEKNIX"
 *   description="..."
 *   image="https://..."
 *   ogType="product"
 *   noindex={false}
 * />
 */

import { useSEO, type SEOProps } from '../hooks/useSEO'

export default function SEOHead(props: SEOProps) {
  useSEO(props)
  return null
}
