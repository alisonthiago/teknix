import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import WidgetRenderer from '../components/WidgetRenderer'
import { getProducts } from '../services/products'
import type { Product } from '../types/database'
import { SiteLayout } from '../App'

interface Page {
  id: string
  title: string
  slug: string
  status: string
  type: string
  seo_title?: string
  seo_description?: string
  is_landing_mode?: boolean
}

interface PageSection {
  id: string
  page_id: string
  order: number
  layout?: string
  direction?: string
  gap?: string
  max_width?: string
  min_height?: string
  bg_type?: string
  bg_color?: string
  bg_image?: string
  bg_gradient?: string
  padding_top?: string
  padding_bottom?: string
  padding_left?: string
  padding_right?: string
  margin_top?: string
  margin_bottom?: string
  hide_on_desktop?: boolean
  hide_on_tablet?: boolean
  hide_on_mobile?: boolean
}

interface PageContainer {
  id: string
  section_id: string
  order: number
  direction?: string
  gap?: string
  align_items?: string
  justify_content?: string
  flex_wrap?: string
  flex_grow?: string
  flex_shrink?: string
  width?: string
  max_width?: string
  min_height?: string
  bg_type?: string
  bg_color?: string
  padding_top?: string
  padding_bottom?: string
  padding_left?: string
  padding_right?: string
  border?: string
  border_radius?: string
  hide_on_desktop?: boolean
  hide_on_tablet?: boolean
  hide_on_mobile?: boolean
}

interface PageWidget {
  id: string
  container_id: string
  type: string
  order: number
  content: Record<string, unknown>
  style: Record<string, unknown>
}

export default function PagePreview() {
  const { id } = useParams<{ id: string }>()
  const [page, setPage] = useState<Page | null>(null)
  const [sections, setSections] = useState<PageSection[]>([])
  const [containers, setContainers] = useState<Record<string, PageContainer[]>>({})
  const [widgets, setWidgets] = useState<Record<string, PageWidget[]>>({})
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  useEffect(() => {
    if (!id) return
    setLoading(true)

    async function fetchPage() {
      try {
        const { data: pageData, error: pageError } = await supabase
          .from('pages')
          .select('*')
          .eq('id', id)
          .maybeSingle()

        if (pageError || !pageData) {
          setPage(null)
          setLoading(false)
          return
        }

        setPage(pageData)

        if (pageData.type === 'segment' || pageData.type === 'category') {
          const seg = pageData.slug.split('/')[0]
          if (seg) {
            const segmentProducts = await getProducts({ segment: seg, limit: 20 })
            setProducts(segmentProducts)
          }
        }

        const { data: sectionsData } = await supabase
          .from('page_sections')
          .select('*')
          .eq('page_id', pageData.id)
          .order('order')

        if (!sectionsData) {
          setLoading(false)
          return
        }

        setSections(sectionsData)

        const sectionIds = sectionsData.map((s) => s.id)
        const { data: containersData } = await supabase
          .from('page_containers')
          .select('*')
          .in('section_id', sectionIds)
          .order('order')

        if (!containersData) {
          setLoading(false)
          return
        }

        const containerMap: Record<string, PageContainer[]> = {}
        for (const c of containersData) {
          if (!containerMap[c.section_id]) containerMap[c.section_id] = []
          containerMap[c.section_id].push(c)
        }
        setContainers(containerMap)

        const containerIds = containersData.map((c) => c.id)
        const { data: widgetsData } = await supabase
          .from('page_widgets')
          .select('*')
          .in('container_id', containerIds)
          .order('order')

        const widgetMap: Record<string, PageWidget[]> = {}
        if (widgetsData) {
          for (const w of widgetsData) {
            if (!widgetMap[w.container_id]) widgetMap[w.container_id] = []
            widgetMap[w.container_id].push(w)
          }
        }
        setWidgets(widgetMap)
      } catch (err) {
        console.error('Preview fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchPage()
  }, [id])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#fff' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!page) {
    return (
      <div style={{ textAlign: 'center', padding: '120px 24px', background: '#fff' }}>
        <h1 style={{ fontSize: 72, fontWeight: 700, color: '#1d1d1f' }}>404</h1>
        <p style={{ fontSize: 18, color: '#6e6e73', marginTop: 8 }}>Página não encontrada no modo Preview</p>
      </div>
    )
  }

  const viewportWidthMap = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  }

  const content = (
    <div style={{
      maxWidth: viewportWidthMap[viewport],
      margin: '0 auto',
      transition: 'max-width 0.3s ease',
      boxShadow: viewport !== 'desktop' ? '0 0 40px rgba(0,0,0,0.1)' : 'none',
      background: '#fff',
      minHeight: '100vh'
    }}>
      {sections.map((section) => {
        const sectionStyle: React.CSSProperties = {
          padding: `${section.padding_top || '80px'} ${section.padding_right || '0'} ${section.padding_bottom || '80px'} ${section.padding_left || '0'}`,
          minHeight: section.min_height || undefined,
          maxWidth: section.max_width || undefined,
          margin: `${section.margin_top || '0'} auto ${section.margin_bottom || '0'}`,
          background: section.bg_type === 'color' ? section.bg_color
            : section.bg_type === 'gradient' ? section.bg_gradient
            : section.bg_type === 'image' ? `url(${section.bg_image}) center/cover`
            : undefined,
        }

        const sectionClasses = []
        if (section.hide_on_desktop) sectionClasses.push('hide-desktop')
        if (section.hide_on_tablet) sectionClasses.push('hide-tablet')
        if (section.hide_on_mobile) sectionClasses.push('hide-mobile')

        return (
          <section key={section.id} style={sectionStyle} className={sectionClasses.join(' ')}>
            <div style={{
              display: 'flex',
              flexDirection: section.direction === 'row' ? 'row' : 'column',
              gap: section.gap || '0'
            }}>
              {(containers[section.id] || []).map((container) => {
                const isBoxed = (container as any).content_width !== 'full'
                const containerStyle: React.CSSProperties = {
                  display: 'flex',
                  flexDirection: container.direction === 'row' ? 'row' : 'column',
                  gap: container.gap || '16px',
                  alignItems: container.align_items as any || 'stretch',
                  justifyContent: container.justify_content as any || 'flex-start',
                  flex: container.flex_grow || '1',
                  padding: `${container.padding_top || '0'} ${container.padding_right || '0'} ${container.padding_bottom || '0'} ${container.padding_left || '0'}`,
                  backgroundColor: container.bg_color || (container.bg_type === 'color' ? container.bg_color : undefined),
                  border: container.border || undefined,
                  borderRadius: container.border_radius || undefined,
                  boxSizing: 'border-box',
                }

                const containerClasses = []
                if (container.hide_on_desktop) containerClasses.push('hide-desktop')
                if (container.hide_on_tablet) containerClasses.push('hide-tablet')
                if (container.hide_on_mobile) containerClasses.push('hide-mobile')

                return (
                  <div key={container.id} style={containerStyle} className={`e-con ${isBoxed ? 'e-con-boxed' : 'e-con-full'} ${containerClasses.join(' ')}`}>
                    {(widgets[container.id] || []).map((widget) => (
                      <WidgetRenderer key={widget.id} widget={widget} />
                    ))}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {products.length > 0 && (
        <section style={{ padding: '60px 24px', maxWidth: 1200, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em', margin: '0 0 32px' }}>
            Produtos
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {products.map((product) => {
              const displayPrice = product.promo_price || product.price || product.sell_price || product.cost_purchase || 0
              return (

                <Link
                  key={product.id}
                  to={`/produtos/${product.sku || product.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <div style={{ background: '#fff', borderRadius: 18, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', transition: 'all 0.3s ease' }}>
                    <div style={{ background: '#f5f5f7', aspectRatio: '1', overflow: 'hidden' }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontSize: '3rem' }}>📦</div>
                      )}
                    </div>
                    <div style={{ padding: 20 }}>
                      {product.brand && <span style={{ display: 'block', fontSize: '0.75rem', color: '#6e6e73', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{product.brand}</span>}
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1d1d1f', margin: '0 0 8px', lineHeight: 1.3 }}>{product.name}</h3>
                      {displayPrice > 0 && (
                        <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1d1d1f' }}>
                          {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(displayPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )

  return (
    <div style={{ background: viewport !== 'desktop' ? '#e5e5e7' : '#fff', minHeight: '100vh' }}>
      {/* Sticky Banner de Preview */}
      <div style={{
        background: '#1d1d1f',
        color: '#fff',
        padding: '8px 24px',
        fontSize: 13,
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            background: '#00cc6a',
            color: '#000',
            padding: '3px 8px',
            borderRadius: 980,
            fontWeight: 800,
            fontSize: 10,
            letterSpacing: '0.05em'
          }}>
            MODO PRÉ-VISUALIZAÇÃO
          </span>
          <span style={{ fontWeight: 600 }}>{page.title}</span>
          <span style={{ color: '#86868b', fontSize: 12 }}>
            (Status: <strong style={{ color: page.status === 'published' ? '#00cc6a' : '#f59e0b' }}>{page.status === 'published' ? 'Publicada' : 'Rascunho'}</strong> | URL: /{page.slug})
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setViewport('desktop')}
            style={{
              background: viewport === 'desktop' ? '#333' : 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Desktop
          </button>
          <button
            onClick={() => setViewport('tablet')}
            style={{
              background: viewport === 'tablet' ? '#333' : 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Tablet
          </button>
          <button
            onClick={() => setViewport('mobile')}
            style={{
              background: viewport === 'mobile' ? '#333' : 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              cursor: 'pointer',
              fontWeight: 600
            }}
          >
            Mobile
          </button>
        </div>
      </div>

      {page.is_landing_mode ? content : <SiteLayout>{content}</SiteLayout>}
    </div>
  )
}
