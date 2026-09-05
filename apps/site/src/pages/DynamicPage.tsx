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
  hide_header?: boolean
  hide_footer?: boolean
  page_layout?: 'default' | 'elementor_canvas' | 'full_width'
  page_bg?: string
  seo_title?: string
  seo_description?: string
}

export default function DynamicPage() {
  const location = useLocation()

  const [page, setPage] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,setError]=useState('')

  useEffect(() => {
    const rawPath = location.pathname
    const possibleSlugs = [rawPath, rawPath.replace(/^\//, '')]
    let cancelled = false
    window.scrollTo(0, 0)
    setLoading(true);setPage(null);setError('')

    async function fetchPage() {
      // Carrega exclusivamente páginas com status 'published'
      const { data: pageData, error:loadError } = await supabase
        .from('pages')
        .select('id,page_styles')
        .in('slug', possibleSlugs)
        .eq('status', 'published')
        .neq('type', 'widget_overrides')
        .limit(1)
        .maybeSingle()

      if (cancelled) return
      if(loadError)setError('Não foi possível carregar esta página. Tente novamente.')
      setPage(pageData?.page_styles?.published_snapshot_v2?.page || null)
      setLoading(false)
    }

    fetchPage()
    return () => { cancelled = true }
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

  if(error)return <p role="alert" style={{padding:32}}>{error}</p>
  if (!page) {
    return (
      <SiteLayout>
        <main>
          <div style={{ textAlign: 'center', padding: '140px 24px', minHeight: '60vh' }}>
            <h1 style={{ fontSize: 72, fontWeight: 'var(--tkn-weight-medium)', color: '#1d1d1f', letterSpacing: '-0.04em', margin: 0 }}>404</h1>
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
        </main>
      </SiteLayout>
    )
  }

  const isCanvas = page.page_layout === 'elementor_canvas' || !!page.is_landing_mode || (!!page.hide_header && !!page.hide_footer)
  const hideHeader = isCanvas || !!page.hide_header
  const hideFooter = isCanvas || !!page.hide_footer

  return (
    <SiteLayout hideHeader={hideHeader} hideFooter={hideFooter}>
      <div className="dynamic-page-root" style={{ background: page.page_bg || undefined, minHeight: isCanvas ? '100vh' : undefined }}>
        {page.seo_title && <title>{page.seo_title}</title>}
        {page.seo_description && <meta name="description" content={page.seo_description} />}
        <PageRenderer pageId={page.id} />
      </div>
    </SiteLayout>
  )
}
