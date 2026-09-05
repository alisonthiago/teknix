import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './Blog.css'

type BlogBlock = { id: string; type: string; content?: string; imageUrl?: string; imageCaption?: string; listItems?: string[] }
type BlogPost = { id: string; title: string; slug: string; summary?: string; cover_image?: string; author_name?: string; published_at?: string; seo_title?: string; seo_description?: string; blocks?: BlogBlock[] }

function RenderBlock({ block }: { block: BlogBlock }) {
  if (block.type === 'heading1') return <h1>{block.content}</h1>
  if (block.type === 'heading2') return <h2>{block.content}</h2>
  if (block.type === 'heading3') return <h3>{block.content}</h3>
  if (block.type === 'quote') return <blockquote>{block.content}</blockquote>
  if (block.type === 'divider') return <hr />
  if (block.type === 'image') return <figure>{block.imageUrl && <img src={block.imageUrl} alt={block.imageCaption || ''} />}{block.imageCaption && <figcaption>{block.imageCaption}</figcaption>}</figure>
  if (block.type === 'list') return <ul>{(block.listItems || []).filter(Boolean).map((item, i) => <li key={i}>{item}</li>)}</ul>
  return <p>{block.content}</p>
}

export default function Blog() {
  const { slug } = useParams()
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    void (async () => {
      const query = supabase.from('blog_posts').select('*').eq('status', 'published')
      const { data } = await (slug ? query.eq('slug', slug).single() : query.order('published_at', { ascending: false }))
      if (slug) setPost((data as BlogPost) || null); else setPosts((data as BlogPost[]) || [])
      setLoading(false)
    })()
  }, [slug])

  useEffect(() => {
    if (!post) return
    document.title = post.seo_title || `${post.title} | TEKNIX`
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta) }
    meta.content = post.seo_description || post.summary || ''
    void supabase.from('blog_events').insert({ post_id: post.id, event_type: 'view', page_url: window.location.href })
  }, [post])

  if (loading) return <div className="public-blog-state">Carregando…</div>
  if (slug && !post) return <div className="public-blog-state"><h1>Artigo não encontrado</h1><Link to="/blog">Voltar ao Blog</Link></div>

  if (!slug) return (
    <div className="public-blog-index">
      <header><span>TEKNIX BLOG</span><h1>Conteúdo para quem faz acontecer.</h1></header>
      <div className="public-blog-grid">{posts.map(item => <article key={item.id}><Link to={`/blog/${item.slug}`}>{item.cover_image && <img src={item.cover_image} alt="" />}<div><small>{item.published_at ? new Date(item.published_at).toLocaleDateString('pt-BR') : ''}</small><h2>{item.title}</h2><p>{item.summary}</p><strong>Ler artigo →</strong></div></Link></article>)}</div>
    </div>
  )

  return <article className="public-blog-post">
    <header><Link to="/blog">← Blog</Link><h1>{post!.title}</h1>{post!.summary && <p>{post!.summary}</p>}<small>{post!.author_name || 'TEKNIX'} · {post!.published_at ? new Date(post!.published_at).toLocaleDateString('pt-BR') : ''}</small></header>
    {post!.cover_image && <img className="public-blog-cover" src={post!.cover_image} alt={post!.title} />}
    <div className="public-blog-content">{(post!.blocks || []).map(block => <RenderBlock key={block.id} block={block} />)}</div>
  </article>
}
