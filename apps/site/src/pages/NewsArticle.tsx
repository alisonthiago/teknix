import { Link, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import NewsHeader from '../components/NewsHeader'
import NewsFooter from '../components/NewsFooter'
import './News.css'
import './NewsArticle.css'
import './NewsArticleHeader.css'
import './NewsArticleHeaderDetails.css'
import './NewsArticleOverrides.css'

type Post = { id: string; title: string; summary?: string; cover_image?: string; published_at?: string; blocks?: { id:string; type:string; content?:string; imageUrl?:string }[] }

const fallback: Post = {
  id: 'featured',
  title: 'Receita da Teknix no 2º trimestre de 2026 alcança novo patamar, à medida que o maior engajamento fortalece sua vantagem competitiva',
  summary: 'Financeiro: A receita líquida e os rendimentos cresceram consecutivamente, consolidando a posição da Teknix como referência em ferramentas.',
  cover_image: '/news-reference/blog-hero-teknix.png',
  published_at: '2026-08-05',
  blocks: [
    { id: '1', type: 'p', content: 'A Teknix segue avançando com foco em inovação, eficiência e em experiências cada vez mais simples para seus clientes. O resultado reflete uma estratégia construída com proximidade, qualidade e visão de longo prazo.' },
    { id: '2', type: 'h2', content: 'Resultados que fortalecem o nosso propósito' },
    { id: '3', type: 'p', content: 'Nosso ecossistema cresce quando nossos produtos ajudam mais pessoas a transformar ideias em realizações. Continuamos investindo em tecnologia, comunidade e excelência operacional.' },
    { id: '4', type: 'p', content: 'Esse avanço é resultado do trabalho próximo com clientes e parceiros, da evolução contínua das nossas soluções e do compromisso em tornar a tecnologia mais acessível, prática e relevante para o dia a dia.' }
  ]
}

function NewsDownloads() {
  return <section className="article-downloads">
    <h2>Materiais descargáveis</h2>
    <div>{['Logos e aplicações de marca', 'Imagens institucionais', 'Últimas novidades em Youtube'].map(item => <a key={item} href="http://localhost:5174/hub/blog">{item}<b>VER MATERIAL →</b></a>)}</div>
  </section>
}

export default function NewsArticle() {
  const { slug } = useParams()
  const [post, setPost] = useState<Post>(fallback)

  useEffect(() => {
    void supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug || '')
      .eq('status', 'published')
      .maybeSingle()
      .then(({ data }) => { if (data) setPost(data as Post) })
    document.title = `${fallback.title} | TEKNIX`
  }, [slug])

  return (
    <div className="news-article-site">
      <NewsHeader activePage="noticias" />

      <main>
        <div className="article-cover">
          <img src={post.cover_image || fallback.cover_image} alt="" />
        </div>

        <section className="article-hero">
          <div className="article-meta">
            <Link to="/news">← &nbsp; VOLTAR</Link>
            <time>
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                : '05 Agosto 2026'}
            </time>
          </div>
          <span className="article-tag">RESULTADOS</span>
          <h1>{post.title}</h1>
          {post.summary && (
            <ul>
              <li><strong>Financeiro:</strong> {post.summary.replace(/^Financeiro:\s*/, '')}</li>
            </ul>
          )}
          <aside>in<br />f<br />𝕏<br />◉</aside>
        </section>

        <article className="article-content">
          {(post.blocks || fallback.blocks || []).map((b, i) =>
            b.type === 'h2'
              ? <h2 key={b.id || i}>{b.content}</h2>
              : <p key={b.id || i}>{b.content}</p>
          )}
        </article>

        <NewsDownloads />
        <section className="related">
          <div className="related-heading">
            <h2>Notícias relacionadas</h2>
            <Link to="/blog">VER TODAS AS NOTÍCIAS</Link>
          </div>
          <div className="related-grid">
            {[fallback, ...Array(2).fill(fallback)].map((item, i) => (
              <Link
                to={`/blog/${i ? 'noticia-' + i : 'resultados-segundo-trimestre-2026'}`}
                className="related-card"
                key={i}
              >
                <span>RESULTADOS</span>
                <img src={item.cover_image || fallback.cover_image} alt="" />
                <h3>{i ? 'Mercado Teknix encerra o ano com crescimento e novas conquistas' : item.title}</h3>
                <b>VER MAIS →</b>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* ── FOOTER OFICIAL PADRONIZADO ── */}
      <NewsFooter />
    </div>
  )
}
