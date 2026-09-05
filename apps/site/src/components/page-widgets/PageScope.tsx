import {useEffect,useState,type ReactNode} from 'react'
import {PageWidgets} from './PageWidgets'
import {getProductById} from '../../services/products'
import {supabase} from '../../lib/supabase'
export default function PageScope({path,children}:{path:string;children:ReactNode}){
 const urlScope = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('editorScope') : null
 const [scope,setScope]=useState<string|null>(urlScope)
 useEffect(()=>{
  if (urlScope) { setScope(urlScope); return }
  let cancelled=false;setScope(null);async function resolve(){
   const preview=path.match(/^\/(?:__widget-preview|preview)\/([^/]+)$/)
   if(preview)return `page:${preview[1]}`
   if(/^\/produtos?\//.test(path)){const product=await getProductById(decodeURIComponent(path.split('/').filter(Boolean).pop()!));if(product)return `product:${product.id}`}
   if(path!=='/'){const {data}=await supabase.from('pages').select('id').in('slug',[path,path.slice(1)]).eq('status','published').neq('type','widget_overrides').limit(1).maybeSingle();if(data)return `page:${data.id}`}
   return `native:${path}`
  };resolve().then(value=>{if(!cancelled)setScope(value)}).catch(()=>{if(!cancelled)setScope(`native:${path}`)});return()=>{cancelled=true}
 },[path, urlScope])
 return scope?<PageWidgets scope={scope}>{children}</PageWidgets>:null
}
