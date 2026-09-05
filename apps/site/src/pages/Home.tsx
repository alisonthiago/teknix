import {useEffect,useState} from 'react'
import StorefrontHome from '../components/StorefrontHome'
import PageRenderer from '../components/PageRenderer'
import {supabase} from '../lib/supabase'
import TeknixHeader from '../components/TeknixHeader'
import TeknixFooter from '../components/TeknixFooter'
import './Home.css'
export default function Home() {
  const [pageId, setPageId] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) setReady(true)
    }, 2000)

    async function loadHome() {
      try {
        const { data, error } = await supabase
          .from('pages')
          .select('id,page_styles')
          .eq('status', 'published')
          .neq('type', 'widget_overrides')
          .neq('type', 'editor_draft')
          .in('slug', ['/', ''])
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (cancelled) return
        if (error) console.error('Erro ao carregar a página inicial:', error)
        if (data?.page_styles?.published_snapshot_v2?.page?.page_styles?.render_source === 'builder') {
          setPageId(data.id)
        }
      } catch (err) {
        if (cancelled) return
        console.error('Falha ao conectar com banco na Home:', err)
      } finally {
        if (!cancelled) {
          clearTimeout(timeout)
          setReady(true)
        }
      }
    }

    loadHome()

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
  }, [])

  if (pageId && ready) {
    return (
      <>
        <TeknixHeader />
        <PageRenderer pageId={pageId} />
        <TeknixFooter />
      </>
    )
  }

  return <StorefrontHome />
}

