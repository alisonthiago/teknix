import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import PageRenderer from '../components/PageRenderer'
import './Home.css'

export default function Home() {
  const [publishedHomeId, setPublishedHomeId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPublishedHome() {
      setLoading(true)
      try {
        // Busca exclusivamente a página com slug '/' ou '' que esteja publicada
        const { data, error } = await supabase
          .from('pages')
          .select('id, slug, status, type')
          .or('slug.eq./,slug.eq.,type.eq.home')
          .eq('status', 'published')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (!error && data?.id) {
          setPublishedHomeId(data.id)
        } else {
          setPublishedHomeId(null)
        }
      } catch (err) {
        console.error('Erro ao buscar Home publicada no Supabase:', err)
        setPublishedHomeId(null)
      } finally {
        setLoading(false)
      }
    }

    fetchPublishedHome()
  }, [])

  // Estado de Carregamento
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
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

  // Se houver Home publicada no Supabase, renderiza dinamicamente 1:1 via PageRenderer
  if (publishedHomeId) {
    return (
      <div className="teknix-published-home-root">
        <PageRenderer pageId={publishedHomeId} />
      </div>
    )
  }

  // Se NÃO existir Home publicada no Supabase (NÃO renderiza código mockado nem template falso)
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '65vh', 
      padding: '60px 24px', 
      textAlign: 'center',
      background: '#fbfbfd'
    }}>
      <div style={{
        maxWidth: 540,
        background: '#ffffff',
        padding: '48px 36px',
        borderRadius: 24,
        boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
        border: '1px solid #e5e5ea'
      }}>
        <div style={{ fontSize: 44, marginBottom: 16 }}>🚀</div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em', margin: 0 }}>
          Loja TEKNIX Oficial
        </h1>
        <p style={{ fontSize: 16, color: '#6e6e73', marginTop: 12, lineHeight: 1.5, fontWeight: 400 }}>
          Nenhuma página inicial publicada no momento. Crie e publique a página inicial no painel administrativo do <strong>HUB</strong> para exibi-la aqui.
        </p>
        <div style={{ marginTop: 28, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a
            href="/produtos"
            style={{
              display: 'inline-block',
              padding: '10px 24px',
              background: '#0071e3',
              color: '#ffffff',
              borderRadius: 980,
              textDecoration: 'none',
              fontWeight: 500,
              fontSize: 14
            }}
          >
            Ver Catálogo de Produtos
          </a>
        </div>
      </div>
    </div>
  )
}
