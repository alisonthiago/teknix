import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './BlogTools.css'

type Post = { id: string; title: string; slug: string; status: string; published_at?: string }
type Event = { post_id: string; event_type: string; created_at: string }

export default function BlogAnalytics() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [period, setPeriod] = useState(30)
  useEffect(() => { void Promise.all([
    supabase.from('blog_posts').select('id,title,slug,status,published_at'),
    supabase.from('blog_events').select('post_id,event_type,created_at').order('created_at',{ascending:false}).limit(5000)
  ]).then(([p,e]) => { setPosts((p.data || []) as Post[]); setEvents((e.data || []) as Event[]) }) }, [])
  const recent = useMemo(() => events.filter(e => new Date(e.created_at).getTime() >= Date.now() - period * 86400000), [events, period])
  const rows = posts.map(post => ({...post, views: recent.filter(e => e.post_id === post.id && e.event_type === 'view').length})) .sort((a,b) => b.views-a.views)
  return <div className="blog-tool-page">
    <header><div><span>BLOG</span><h1>Analytics do Blog</h1><p>Visualizações e desempenho dos artigos publicados.</p></div><div><select value={period} onChange={e=>setPeriod(Number(e.target.value))}><option value={7}>7 dias</option><option value={30}>30 dias</option><option value={365}>1 ano</option></select><button onClick={()=>navigate('/hub/blog')}>Voltar ao Blog</button></div></header>
    <section className="blog-tool-stats"><div><strong>{recent.filter(e=>e.event_type==='view').length}</strong><span>Visualizações</span></div><div><strong>{posts.filter(p=>p.status==='published').length}</strong><span>Publicados</span></div><div><strong>{rows.filter(r=>r.views>0).length}</strong><span>Artigos acessados</span></div></section>
    <section className="blog-tool-card"><h2>Desempenho por artigo</h2><table><thead><tr><th>Artigo</th><th>Status</th><th>Visualizações</th><th>Publicado em</th></tr></thead><tbody>{rows.map(row=><tr key={row.id}><td><strong>{row.title}</strong><small>/blog/{row.slug}</small></td><td>{row.status==='published'?'Publicado':'Rascunho'}</td><td><b>{row.views}</b></td><td>{row.published_at?new Date(row.published_at).toLocaleDateString('pt-BR'):'—'}</td></tr>)}</tbody></table>{!rows.length&&<p className="blog-tool-empty">Nenhum artigo encontrado.</p>}</section>
  </div>
}
