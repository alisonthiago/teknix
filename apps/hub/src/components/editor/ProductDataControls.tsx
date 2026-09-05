import {useEffect,useState} from 'react'
import {supabase} from '../../lib/supabase'
/** Store-only metadata: never writes the shared operational product row. */
export default function ProductDataControls({productId}:{productId:string}){
 const [record,setRecord]=useState<any>(null),[form,setForm]=useState<any>({}),[error,setError]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 useEffect(()=>{let cancelled=false;setRecord(null);setError('');setMessage('');Promise.all([supabase.from('products').select('id,name,price,image_url').eq('id',productId).single(),supabase.from('product_store_metadata').select('*').eq('product_id',productId).maybeSingle()]).then(([p,m])=>{if(cancelled)return;if(p.error||m.error)throw p.error||m.error;const meta=m.data;setRecord({product:p.data,meta});setForm({name:meta?.seo?.store_name||p.data.name,price:meta?.sale_price??p.data.price??0,promo:meta?.promotional_price??'',image:meta?.seo?.store_image||p.data.image_url||'',description:meta?.store_description||'',short:meta?.short_description||''})}).catch(e=>{if(!cancelled)setError(e.message)});return()=>{cancelled=true}},[productId])
 async function save(){if(!record||busy)return;setBusy(true);setError('');setMessage('');try{
  if(!form.name.trim()||!Number.isFinite(Number(form.price))||Number(form.price)<0)throw new Error('Informe nome e preço de venda válidos.')
  if(form.promo!==''&&(!Number.isFinite(Number(form.promo))||Number(form.promo)<0||Number(form.promo)>Number(form.price)))throw new Error('O preço promocional deve estar entre zero e o preço de venda.')
  if(form.image&&!/^(https?:\/\/|\/(?!\/))/.test(form.image))throw new Error('Informe um endereço válido para a imagem.')
  const meta=record.meta;const updates={product_id:productId,sale_price:Number(form.price),promotional_price:form.promo===''?null:Number(form.promo),short_description:form.short,store_description:form.description,seo:{...meta?.seo,store_name:form.name.trim(),store_image:form.image},updated_at:new Date().toISOString()}
  let query=meta?supabase.from('product_store_metadata').update(updates).eq('id',meta.id):supabase.from('product_store_metadata').insert(updates)
  if(meta?.updated_at)query=query.eq('updated_at',meta.updated_at)
  const result=await query.select('*').maybeSingle();if(result.error)throw result.error;if(!result.data)throw new Error('O produto foi alterado em outra tela. Reabra os dados antes de salvar.')
  setRecord({...record,meta:result.data});setMessage('Dados deste produto salvos no catálogo da loja. Recarregue a prévia para visualizar.')
 }catch(e:any){setError(e.message)}finally{setBusy(false)}}
 return <details className="restored-controls"><summary>Dados deste produto no catálogo</summary><p>Nome, imagem e preço acompanham este produto em todas as vitrines. O salvamento dos dados é separado do layout da página.</p>{error&&<p role="alert">{error}</p>}{record&&<>{[['name','Nome do produto'],['image','Imagem principal (URL)'],['price','Preço de venda'],['promo','Preço promocional'],['short','Descrição curta'],['description','Descrição completa']].map(([key,label])=><label key={key}>{label}{key==='description'?<textarea value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}/>:<input value={form[key]} type={['price','promo'].includes(key)?'number':'text'} step="0.01" min="0" onChange={e=>setForm({...form,[key]:e.target.value})}/>}</label>)}<button disabled={busy} onClick={save}>{busy?'Salvando…':'Salvar dados deste produto'}</button></>}{message&&<p role="status">{message}</p>}</details>
}
