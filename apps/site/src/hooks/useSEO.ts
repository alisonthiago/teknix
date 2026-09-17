/**
 * useSEO — Hook central de SEO do TEKNIX SITE
 *
 * Atualiza dinamicamente document.title e todas as meta tags:
 * - title / description / keywords / canonical
 * - Open Graph (og:title, og:description, og:image, og:url, og:type)
 * - Twitter Card
 * - robots (noindex / nofollow)
 *
 * Uso:
 *   useSEO({ title: 'Produto X | TEKNIX', description: '...', image: '...' })
 */

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_NAME = 'TEKNIX Ferramentas'
const BASE_URL = 'https://teknixbrasil.com.br'
const DEFAULT_IMAGE = 'https://teknixbrasil.com.br/teknix-og-default.png'

export interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  ogType?: 'website' | 'product' | 'article' | 'blog'
  canonical?: string
  noindex?: boolean
  nofollow?: boolean
  /** Schema.org JSON-LD — injetado como <script type="application/ld+json"> */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name') {
  if (!content) return
  const selector = `meta[${attr}="${name}"]`
  let el = document.querySelector<HTMLMetaElement>(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, name)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  if (!href) return
  const selector = `link[rel="${rel}"]`
  let el = document.querySelector<HTMLLinkElement>(selector)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function removeJsonLd() {
  document.querySelectorAll('script[type="application/ld+json"][data-teknix]').forEach(el => el.remove())
}

function injectJsonLd(data: Record<string, unknown> | Record<string, unknown>[]) {
  removeJsonLd()
  const items = Array.isArray(data) ? data : [data]
  items.forEach(schema => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.setAttribute('data-teknix', 'true')
    script.textContent = JSON.stringify(schema)
    document.head.appendChild(script)
  })
}

export function useSEO(props: SEOProps) {
  const location = useLocation()

  useEffect(() => {
    const {
      title,
      description,
      keywords,
      image,
      ogType = 'website',
      canonical,
      noindex = false,
      nofollow = false,
      jsonLd
    } = props

    // === Title ===
    const fullTitle = title
      ? title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
      : SITE_NAME
    document.title = fullTitle

    // === Description ===
    const desc = description || 'Ferramentas profissionais com a qualidade que você precisa. Feito para fazer.'
    setMeta('description', desc)

    // === Keywords ===
    if (keywords) setMeta('keywords', keywords)

    // === Canonical ===
    const canonicalUrl = canonical || `${BASE_URL}${location.pathname}`
    setLink('canonical', canonicalUrl)

    // === Open Graph ===
    setMeta('og:title', fullTitle, 'property')
    setMeta('og:description', desc, 'property')
    setMeta('og:image', image || DEFAULT_IMAGE, 'property')
    setMeta('og:url', canonicalUrl, 'property')
    setMeta('og:type', ogType, 'property')
    setMeta('og:site_name', SITE_NAME, 'property')
    setMeta('og:locale', 'pt_BR', 'property')

    // === Twitter Card ===
    setMeta('twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('twitter:title', fullTitle)
    setMeta('twitter:description', desc)
    setMeta('twitter:image', image || DEFAULT_IMAGE)

    // === Robots ===
    const robotsContent = [
      noindex ? 'noindex' : 'index',
      nofollow ? 'nofollow' : 'follow'
    ].join(', ')
    setMeta('robots', robotsContent)

    // === JSON-LD ===
    if (jsonLd) {
      injectJsonLd(jsonLd)
    } else {
      removeJsonLd()
    }

    // Cleanup ao desmontar
    return () => {
      // Restaura title padrão ao sair da página
      document.title = SITE_NAME
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    props.title,
    props.description,
    props.keywords,
    props.image,
    props.ogType,
    props.canonical,
    props.noindex,
    props.nofollow,
    // jsonLd é objeto — não deve entrar na dep array diretamente
    location.pathname
  ])
}
