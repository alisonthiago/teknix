import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import WidgetRenderer from '../components/WidgetRenderer'

interface Page {
  id: string
  title: string
  slug: string
  status: string
  meta_title?: string
  meta_description?: string
}

interface PageSection {
  id: string
  page_id: string
  name?: string
  order: number
  bg_type?: 'color' | 'image' | 'gradient'
  bg_value?: string
  padding_top?: number
  padding_bottom?: number
  padding_left?: number
  padding_right?: number
  min_height?: number
  max_width?: number
}

interface PageContainer {
  id: string
  section_id: string
  order: number
  columns?: number
  width?: string
  max_width?: number
  alignment?: string
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)

    async function fetchPage() {
      const { data: pageData } = await supabase
        .from('pages')
        .select('*')
        .eq('id', id)
        .single()

      if (!pageData) {
        setPage(null)
        setLoading(false)
        return
      }

      setPage(pageData)

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

      setLoading(false)
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
        <p style={{ fontSize: 18, color: '#6e6e73', marginTop: 8 }}>Página não encontrada</p>
      </div>
    )
  }

  return (
    <div style={{ background: '#fff', minHeight: '100vh' }}>
      <div style={{ background: '#1d1d1f', color: '#fff', padding: '8px 16px', fontSize: 12, position: 'sticky', top: 0, zIndex: 100, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ background: '#00ff88', color: '#1d1d1f', padding: '2px 8px', borderRadius: 980, fontWeight: 700, fontSize: 10 }}>PREVIEW</span>
        {page.title} ({page.status})
      </div>
      {sections.map((section) => {
        const sectionStyle: React.CSSProperties = {}

        if (section.bg_type === 'color' && section.bg_value) {
          sectionStyle.backgroundColor = section.bg_value
        } else if (section.bg_type === 'image' && section.bg_value) {
          sectionStyle.backgroundImage = `url(${section.bg_value})`
          sectionStyle.backgroundSize = 'cover'
          sectionStyle.backgroundPosition = 'center'
        } else if (section.bg_type === 'gradient' && section.bg_value) {
          sectionStyle.background = section.bg_value
        }

        if (section.padding_top != null) sectionStyle.paddingTop = section.padding_top
        if (section.padding_bottom != null) sectionStyle.paddingBottom = section.padding_bottom
        if (section.padding_left != null) sectionStyle.paddingLeft = section.padding_left
        if (section.padding_right != null) sectionStyle.paddingRight = section.padding_right
        if (section.min_height != null) sectionStyle.minHeight = section.min_height

        return (
          <section key={section.id} style={{ padding: '80px 24px', ...sectionStyle }}>
            <div style={{ maxWidth: section.max_width || 1200, margin: '0 auto' }}>
              {(containers[section.id] || []).map((container) => (
                <div
                  key={container.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${container.columns || 1}, 1fr)`,
                    maxWidth: container.max_width,
                    margin: '0 auto',
                    gap: 24,
                  }}
                >
                  {(widgets[container.id] || []).map((widget) => (
                    <WidgetRenderer key={widget.id} widget={widget} />
                  ))}
                </div>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
