import {createContext,useContext,useEffect,useState,type ReactNode} from 'react'
import {supabase} from '../../lib/supabase'
import {GLOBAL_EDITOR_SCOPE,readWidgetEdits,scopeSlug,type WidgetEdits} from '../../../../../packages/core/src/pageWidgets'
const Standards=createContext<WidgetEdits>({})
export const useSiteStandards=()=>useContext(Standards)
export default function SiteStandards({children}:{children:ReactNode}){
 const [edits,setEdits]=useState<WidgetEdits>({})
  useEffect(() => {
    if (window.parent !== window && new URLSearchParams(window.location.search).get('widgetPreview') === '1') return
    let cancelled = false
    supabase
      .from('pages')
      .select('page_styles, status')
      .eq('slug', scopeSlug(GLOBAL_EDITOR_SCOPE))
      .maybeSingle()
      .then(({ data, error }) => {
        if (!cancelled && !error && data) {
          const raw = data.page_styles?.published_snapshot_v2?.page?.page_styles || data.page_styles?.published_snapshot_v2?.page_styles || data.page_styles
          let parsed = readWidgetEdits(raw)
          if (!parsed || Object.keys(parsed).length === 0) {
            parsed = readWidgetEdits(data.page_styles)
          }
          if (parsed && Object.keys(parsed).length > 0) {
            setEdits(parsed)
          }
        }
      })
    return () => { cancelled = true }
  }, [])
 useEffect(()=>{
  const origin=import.meta.env.VITE_HUB_URL || (import.meta.env.DEV?'http://localhost:5174':'')
  const receive=(event:MessageEvent)=>{if(window.parent!==window&&event.origin===origin&&event.source===window.parent&&event.data?.type==='teknix:global-patches'&&event.data.scope===GLOBAL_EDITOR_SCOPE)setEdits(event.data.edits||{})}
  window.addEventListener('message',receive);return()=>window.removeEventListener('message',receive)
 },[])
 const tokens=edits['site:tokens']?.content || {}
 const mapping:Record<string,string>={accent:'--site-accent',accentHover:'--site-accent-hover',buttonText:'--site-button-text',text:'--site-text',background:'--site-background',favorite:'--site-favorite-active',font:'--site-font'}
 const rules=Object.entries(mapping).filter(([key])=>typeof tokens[key]==='string'&&String(tokens[key]).trim()&&!/[;{}<>]|url\(/i.test(String(tokens[key]))).map(([key,css])=>`${css}:${tokens[key]}`).join(';')
 return <Standards.Provider value={edits}>{rules&&<style>{`:root{${rules}}body{font-family:var(--site-font);color:var(--site-text);background:var(--site-background)}`}</style>}{children}</Standards.Provider>
}
