import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import PageRenderer from '../components/PageRenderer'
import { SiteLayout } from '../App'

interface PageData {
  id: string
  title: string
  slug: string
  status: string
  type: string
  is_landing_mode?: boolean
  seo_title?: string
  seo_description?: string
}

export default function DynamicPage() {
  const location = useLocation()
  const rawPath = location.pathname
  const cleanPath = rawPath.replace(/^\//, '')
  const possibleSlugs = [rawPath, `/${cleanPath}`, cleanPath]

  const [page, setPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    window.scrollTo(0, 0)
    setLoading(true)

    async function fetchPage() {
      // Carrega exclusivamente páginas com status 'published'
      const { data: pageData } = await supabase
        .from('pages')
        .select('id, title, slug, status, type, is_landing_mode, seo_title, seo_description')
        .in('slug', possibleSlugs)
        .eq('status', 'published')
        .limit(1)
        .maybeSingle()

      setPage(pageData || null)
      setLoading(false)
    }

    fetchPage()
  }, [location.pathname])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid #e5e5ea',
          borderTopColor: '#0071e3',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    )
  }

  if (!page) {
    return (
      <SiteLayout>
        <div style={{ textAlign: 'center', padding: '140px 24px', minHeight: '60vh' }}>
          <h1 style={{ fontSize: 72, fontWeight: 800, color: '#1d1d1f', letterSpacing: '-0.04em', margin: 0 }}>404</h1>
          <p style={{ fontSize: 18, color: '#6e6e73', marginTop: 12, fontWeight: 500 }}>Página não encontrada</p>
          <a
            href="/"
            style={{
              display: 'inline-block',
              marginTop: 24,
              padding: '10px 24px',
              background: '#0071e3',
              color: '#ffffff',
              borderRadius: 980,
              textDecoration: 'none',
              fontWeight: 600,
              fontSize: 14
            }}
          >
            Voltar para o Início
          </a>
        </div>
      </SiteLayout>
    )
  }

  const content = (
    <div className="dynamic-page-root">
      {page.seo_title && <title>{page.seo_title}</title>}
      {page.seo_description && <meta name="description" content={page.seo_description} />}
      <PageRenderer pageId={page.id} />
    </div>
  )

  if (page.is_landing_mode) {
    return content
  }

  return <SiteLayout>{content}</SiteLayout>
}
