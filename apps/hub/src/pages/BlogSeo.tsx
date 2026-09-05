import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './BlogTools.css'

type Post = { id:string;title:string;slug:string;summary?:string;cover_image?:string;seo_title?:string;seo_description?:string;status:string }
export default function BlogSeo(){
  const navigate=useNavigate(); const [posts,setPosts]=useState<Post[]>([])
  useEffect(()=>{void supabase.from('blog_posts').select('*').order('updated_at',{ascending:false}).then(({data})=>setPosts((data||[]) as Post[]))},[])
  const score=(p:Post)=>[p.title,p.slug,p.summary,p.cover_image,p.seo_title,p.seo_description].filter(Boolean).length
  const ready=posts.filter(p=>score(p)===6).length
  return <div className="blog-tool-page"><header><div><span>BLOG</span><h1>SEO do Blog</h1><p>Diagnóstico dos campos essenciais para busca e compartilhamento.</p></div><button onClick={()=>navigate('/hub/blog')}>Voltar ao Blog</button></header><section className="blog-tool-stats"><div><strong>{posts.length}</strong><span>Artigos analisados</span></div><div><strong>{ready}</strong><span>SEO completo</span></div><div><strong>{posts.length-ready}</strong><span>Precisam de ajustes</span></div></section><section className="blog-tool-card"><h2>Checklist por artigo</h2><table><thead><tr><th>Artigo</th><th>Nota</th><th>Campos pendentes</th><th>Ação</th></tr></thead><tbody>{posts.map(p=>{const missing=[!p.seo_title&&'Título SEO',!p.seo_description&&'Descrição SEO',!p.summary&&'Resumo',!p.cover_image&&'Capa',!p.slug&&'URL'].filter(Boolean);return <tr key={p.id}><td><strong>{p.title}</strong><small>{p.status==='published'?'Publicado':'Rascunho'}</small></td><td><b>{Math.round(score(p)/6*100)}%</b></td><td>{missing.length?missing.join(' · '):'Completo'}</td><td><Link to={`/hub/blog/editar/${p.id}`}>Corrigir SEO</Link></td></tr>})}</tbody></table></section></div>
}
