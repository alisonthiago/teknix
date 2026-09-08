import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import NewsHeader from '../components/NewsHeader'
import NewsFooter from '../components/NewsFooter'
import './News.css'
import './NewsIndex.css'
import './NewsIndexFix.css'

const posts = [
  { tag: 'RESULTADOS', title: 'Receita da Teknix no 2º trimestre de 2026 alcança novo patamar', summary: 'Resultados, inovação e crescimento sustentável para fortalecer nosso ecossistema.', image: '/news-reference/blog-hero-teknix.png', slug: 'resultados-segundo-trimestre-2026' },
  { tag: 'TECNOLOGIA', title: 'Tecnologia que transforma ideias em realizações', summary: 'Soluções simples, acessíveis e pensadas para pessoas e negócios.', image: '/news-reference/fifty-fifty-teknix.png', slug: 'noticia-1' },
  { tag: 'SUSTENTABILIDADE', title: 'Construindo um futuro mais responsável', summary: 'Ações concretas para gerar impacto positivo nas comunidades e no planeta.', image: '/news-reference/sustainability-hero-v2.png', slug: 'noticia-2' },
  { tag: 'CULTURA', title: 'Pessoas no centro de cada inovação', summary: 'Conheça as histórias e os times que fazem a Teknix avançar.', image: '/news-reference/historias.png', slug: 'noticia-3' },
]

export default function NewsIndex() {
  const [publishedPosts, setPublishedPosts] = useState(posts)
  useEffect(() => {
    document.title = 'Notícias | Teknix News'
    window.scrollTo(0, 0)
    void supabase.from('blog_posts').select('title,summary,cover_image,slug,published_at').eq('status', 'published').order('published_at', { ascending: false }).then(({ data }) => {
      if (data?.length) setPublishedPosts(data.map(item => ({ tag: 'TEKNIX NEWS', title: item.title, summary: item.summary || 'Conteúdo Teknix', image: item.cover_image || '/news-reference/blog-hero-teknix.png', slug: item.slug })))
    })
  }, [])
  return <div className="news-page-root teknix-news-index">
    <NewsHeader activePage="noticias" />
    <main>
      <section className="teknix-news-hero"><div><span>RELATÓRIOS E NOTÍCIAS</span><p>Compartilhamos nossas <strong>ações e notícias corporativas</strong>.</p></div></section>
      <section className="teknix-news-panel"><div className="teknix-news-search"><input aria-label="O que você está procurando?" placeholder="O que você está procurando?" /><select aria-label="País"><option>País</option><option>Brasil</option></select><button>PROCURAR →</button></div><div className="teknix-news-filters">{['Mercado Pago','Novidades','Marketplace','Cultura','Histórias que inspiram','Resultados','Tecnologia','Sustentabilidade','Logística','Relações com investidores','Educação','Ambiente','Diversidade'].map(tag => <button key={tag}>{tag}</button>)}</div><section className="teknix-news-grid">{publishedPosts.map((post,i) => <article key={`${post.slug}-${i}`}><Link to={`/blog/${post.slug}`}><img src={post.image} alt="" /><div><span>{post.tag}</span><h2>{post.title}</h2><p>{post.summary}</p><b>VER MAIS →</b></div></Link></article>)}</section><div className="teknix-news-pagination"><b>1</b><span>2</span><span>3</span><span>4</span><span>5</span><span>…</span><span>›</span></div></section>
      <section className="teknix-news-story"><img src="/news-reference/historias.png" alt="Histórias inspiradoras" /><div><h2>Histórias Inspiradoras</h2>{['Tecnologia que transforma pessoas','Crescimento impulsionado pela inovação','Inovação que percorre o Brasil'].map(item => <Link key={item} to="/blog">{item}<b>→</b></Link>)}<Link className="story-all" to="/blog">VER TODAS AS HISTÓRIAS</Link></div></section>
    </main>
    <NewsFooter />
  </div>
}
