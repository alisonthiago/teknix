import {useEffect,useState} from 'react'
import {getProductById,getProducts} from '../../services/products'
import StorefrontProductCard from '../StorefrontProductCard'
import type {Product} from '../../types/database'
export default function CatalogWidget({id,content,shelf=false}:{id:string;content:Record<string,any>;shelf?:boolean}){
 const [products,setProducts]=useState<Product[]>([])
 useEffect(()=>{let cancelled=false;const query=content.productId?getProductById(String(content.productId)).then(p=>p?[p]:[]):getProducts({limit:shelf?Math.max(1,Math.min(24,Number(content.limit)||4)):1});query.then(data=>{if(!cancelled)setProducts(data)});return()=>{cancelled=true}},[content.productId,content.limit,shelf])
 return <div style={{display:'grid',gridTemplateColumns:`repeat(${shelf?Math.max(1,Math.min(6,Number(content.columns)||4)):1},minmax(0,1fr))`,gap:16}}>{products.map(p=><StorefrontProductCard key={p.id} instance={id} product={{id:p.id,title:p.name,img:p.image_url||'',images:p.images,to:`/produtos/${p.id}`,commerceProduct:p,reviews:'',pricePix:String(p.price)}} to={`/produtos/${p.id}`}/>)}</div>
}
