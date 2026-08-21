'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Truck, Clock, Phone, Mail, MessageCircle, MoreVertical, Plus, FileText, Link as LinkIcon, Loader2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { createClient } from '@/utils/supabase/client'
import type { SupplierDetail } from '@/lib/detail-types'

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-[13px] font-semibold text-[#333] mb-3">{children}</h3>
}

function InfoRow({ label, value, mono, bold }: { label: string; value: string; mono?: boolean; bold?: boolean }) {
  return (
    <div className="flex justify-between py-1.5 border-b border-[#f5f5f5] last:border-0">
      <span className="text-[12px] text-[#999]">{label}</span>
      <span className={`text-[12px] ${mono ? 'font-mono' : ''} ${bold ? 'font-medium text-[#333]' : 'text-[#666]'}`}>{value}</span>
    </div>
  )
}

function StatBox({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-[#e6e6e6] rounded-md p-3">
      <div className="text-[11px] text-[#999] mb-1">{label}</div>
      <div className="text-[16px] font-semibold text-[#333]">{value}</div>
      {sub && <div className="text-[10px] text-[#ccc] mt-0.5">{sub}</div>}
    </div>
  )
}

function SupplierCatalogsDisplay({ supplierId }: { supplierId: string }) {
  const [catalogs, setCatalogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchCatalogs() {
      const supabase = createClient()
      const { data } = await supabase
        .from('supplier_catalogs')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false })
      setCatalogs(data || [])
      setLoading(false)
    }
    fetchCatalogs()
  }, [supplierId])

  if (loading) return (
    <div className="bg-white border border-[#e6e6e6] rounded-md p-4 flex justify-center py-6">
      <Loader2 className="w-5 h-5 animate-spin text-[#999]" />
    </div>
  )

  if (catalogs.length === 0) return null

  return (
    <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
      <SectionTitle>Catálogos</SectionTitle>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {catalogs.map(cat => {
          const url = cat.file_url || cat.url || ''
          const isPdf = (cat.file_type || '').toUpperCase() === 'PDF' || url.toLowerCase().includes('.pdf')
          return (
            <a 
              key={cat.id} 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="border border-[#e6e6e6] rounded-xl p-3 flex flex-col items-center justify-center bg-[#fcfcfc] hover:bg-[#f5f5f5] transition-colors cursor-pointer"
            >
              {isPdf ? (
                <FileText className="w-8 h-8 text-[#e74c3c] mb-2" />
              ) : (
                <LinkIcon className="w-8 h-8 text-[#3483fa] mb-2" />
              )}
              <span className="text-[11px] text-center font-bold text-[#333] line-clamp-2 w-full" title={cat.title}>
                {cat.title}
              </span>
            </a>
          )
        })}
      </div>
    </div>
  )
}

function VisaoGeralTab({ supplier }: { supplier: SupplierDetail }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Produtos fornecidos</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#f5f5f5]">
                  <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">SKU</th>
                  <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Produto</th>
                  <th className="text-right py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Custo</th>
                  <th className="text-right py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeee]">
                {supplier.products.map(p => (
                  <tr key={p.id} className="hover:bg-[#fafafa] transition-colors cursor-pointer">
                    <td className="py-2.5 px-3 font-mono text-[#999]">{p.sku}</td>
                    <td className="py-2.5 px-3 text-[#333] font-medium">{p.name}</td>
                    <td className="py-2.5 px-3 text-right text-[#999]">{formatBRL(p.cost)}</td>
                    <td className="py-2.5 px-3 text-right"><span className={`font-medium ${p.stock === 0 ? 'text-[#e74c3c]' : p.stock <= 10 ? 'text-[#e67e22]' : 'text-[#333]'}`}>{p.stock}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Histórico de compras</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-b border-[#f5f5f5]">
                  <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Data</th>
                  <th className="text-left py-2 px-3 text-[10px] font-medium text-[#999] uppercase">NF</th>
                  <th className="text-right py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Itens</th>
                  <th className="text-right py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Total</th>
                  <th className="text-center py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Status</th>
                  <th className="text-right py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Nota Interna</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeee]">
                {supplier.purchases.map(p => (
                  <tr key={p.id} className="hover:bg-[#fafafa] transition-colors">
                    <td className="py-2.5 px-3 text-[#999]">{p.date}</td>
                    <td className="py-2.5 px-3 font-mono text-[#333]">{p.invoice || 'S/N'}</td>
                    <td className="py-2.5 px-3 text-right text-[#999]">{p.items}</td>
                    <td className="py-2.5 px-3 text-right font-medium text-[#333]">{formatBRL(p.total)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-flex px-2 py-[2px] rounded text-[10px] font-medium bg-[#f0fff4] text-[#38a169]">{p.status}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Link href={`/purchases/${p.id}/nota`} className="inline-flex items-center justify-center w-7 h-7 rounded bg-[#f5f5f5] text-[#666] hover:bg-[#3483fa] hover:text-white transition-colors" title="Ver Nota Interna">
                        <FileText className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <SupplierCatalogsDisplay supplierId={supplier.id} />
        
        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Contato</SectionTitle>
          <div className="space-y-1">
            {supplier.contacts?.map(c => (
               <InfoRow 
                 key={c.id} 
                 label={c.name || (c.is_whatsapp ? 'WhatsApp' : 'Telefone')} 
                 value={c.phone} 
                 bold={!!c.name}
               />
            ))}
            {/* Fallback for legacy data */}
            {(!supplier.contacts || supplier.contacts.length === 0) && (
              <>
                <InfoRow label="Responsável" value={supplier.contact} bold />
                <InfoRow label="Telefone" value={supplier.phone} />
                <InfoRow label="WhatsApp" value={supplier.whatsapp} />
              </>
            )}
            <InfoRow label="E-mail" value={supplier.email} />
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {supplier.contacts?.filter(c => c.is_whatsapp).map(c => (
              <a key={c.id} href={`https://wa.me/55${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-md border border-[#e6e6e6] text-[#999] hover:bg-[#f5f5f5] hover:text-[#38a169] transition-colors" title={`WhatsApp ${c.name || ''}`}>
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            ))}
            {/* Fallback */}
            {(!supplier.contacts || supplier.contacts.length === 0) && supplier.whatsapp && (
              <a href={`https://wa.me/55${supplier.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="p-2 rounded-md border border-[#e6e6e6] text-[#999] hover:bg-[#f5f5f5] hover:text-[#38a169] transition-colors">
                <MessageCircle className="w-3.5 h-3.5" />
              </a>
            )}
            <a href={`mailto:${supplier.email}`} className="p-2 rounded-md border border-[#e6e6e6] text-[#999] hover:bg-[#f5f5f5] hover:text-[#3483fa] transition-colors">
              <Mail className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Dados bancários</SectionTitle>
          <div className="space-y-1">
            <InfoRow label="Banco" value={supplier.bank} />
            <InfoRow label="Agência" value={supplier.agency} mono />
            <InfoRow label="Conta" value={supplier.account} mono />
            <InfoRow label="Chave PIX" value={supplier.pix_key || '—'} mono />
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Informações</SectionTitle>
          <div className="space-y-1">
            <InfoRow label="CNPJ" value={supplier.cnpj} mono />
            <InfoRow label="Matriz (Receita)" value={`${supplier.city}/${supplier.state}`} />
            {supplier.distributor_city && supplier.distributor_state && (
              <InfoRow label="Distribuidor" value={`${supplier.distributor_city}/${supplier.distributor_state}`} />
            )}
            {supplier.pickup_address && (
              <InfoRow label="Retirada/Coleta" value={supplier.pickup_address} />
            )}
            <InfoRow label="Prazo entrega" value={`${supplier.delivery_time} dias`} />
            <InfoRow label="Pedido mínimo" value={formatBRL(supplier.min_order)} />
            <InfoRow label="Condição pagamento" value={supplier.payment_terms} />
            <InfoRow label="Cadastro" value={supplier.created_at} />
          </div>
        </div>
      </div>
    </div>
  )
}

function TimelineTab({ supplier }: { supplier: SupplierDetail }) {
  return (
    <div className="bg-white border border-[#e6e6e6] rounded-md overflow-hidden">
      <div className="px-4 py-3 border-b border-[#e6e6e6]">
        <SectionTitle>Histórico de atividades</SectionTitle>
      </div>
      <div className="divide-y divide-[#eeeeee]">
        {supplier.timeline.map((h, i) => (
          <div key={i} className="px-4 py-3 flex items-start gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#3483fa] mt-1.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-medium text-[#333]">{h.action}</span>
              </div>
              <div className="text-[11px] text-[#666] mt-0.5">{h.details}</div>
            </div>
            <div className="text-[10px] text-[#ccc] text-right flex-shrink-0">
              <div>{h.date}</div>
              <div>{h.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FornecedorDetailClient({ supplier }: { supplier: SupplierDetail }) {
  return (
    <div>
      <div className="mb-4">
        <Link href="/operacao" className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#333] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Operação / Fornecedores
        </Link>
      </div>

      <div className="bg-white border border-[#e6e6e6] rounded-md p-5 mb-4">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-full sm:w-16 sm:h-16 h-16 rounded-md bg-[#f5f5f5] border border-[#e6e6e6] flex items-center justify-center flex-shrink-0 overflow-hidden">
            {supplier.logo_url ? (
              <img src={supplier.logo_url} alt={supplier.name} className="w-full h-full object-cover" />
            ) : (
              <Truck className="w-8 h-8 text-[#ccc]" />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
               <div>
                 <h1 className="text-[18px] font-semibold text-[#333]">{supplier.name}</h1>
                 <div className="flex flex-wrap items-center gap-2 mt-1">
                   <span className="text-[11px] font-mono text-[#999]">{supplier.cnpj}</span>
                   <span className="text-[10px] text-[#ccc]">•</span>
                   <span className="text-[12px] text-[#999]">{supplier.city}/{supplier.state}</span>
                   <span className="text-[10px] text-[#ccc]">•</span>
                   <span className="inline-flex px-2 py-[2px] rounded text-[10px] font-medium bg-[#f0fff4] text-[#38a169]">Ativo</span>
                 </div>
               </div>
               <div className="flex items-center gap-2 relative">
                 <Link 
                   href={`/purchases/new?supplier=${supplier.id}`}
                   className="h-[30px] inline-flex items-center gap-1.5 px-3 bg-[#3483fa] hover:bg-[#2968c8] text-white text-[12px] font-medium rounded-md transition-colors"
                 >
                   <Plus className="w-3.5 h-3.5" />
                   Comprar
                 </Link>
                 <button
                   onClick={(e) => {
                     const menu = e.currentTarget.nextElementSibling
                     if (menu) menu.classList.toggle('hidden')
                   }}
                   className="p-1.5 rounded-md border border-[#e6e6e6] text-[#666] hover:bg-[#f5f5f5] transition-colors"
                 >
                   <MoreVertical className="w-4 h-4" />
                 </button>
                 <div className="absolute right-0 mt-1 w-40 bg-white border border-[#e6e6e6] rounded-md shadow-lg hidden z-10">
                   <Link href={`/fornecedores/${supplier.id}/editar`} className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#333] hover:bg-[#f5f5f5]">
                     <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5l9 9m-3 0l-9 9 1.5-9 9-1.5z" /></svg>
                     Editar
                   </Link>
                   <Link href={`/purchases/new?supplier=${supplier.id}`} className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#333] hover:bg-[#f5f5f5]">
                     <Plus className="w-3 h-3" />
                     Nova compra
                   </Link>
                   <a href={`https://wa.me/55${supplier.contacts?.[0]?.phone.replace(/\D/g, '') || supplier.whatsapp?.replace(/\D/g, '')}`} className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#38a169] hover:bg-[#f5f5f5]">
                     <MessageCircle className="w-3 h-3" />
                     WhatsApp
                   </a>
                   <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#3483fa] hover:bg-[#f5f5f5]">
                     <Mail className="w-3 h-3" />
                     E-mail
                   </a>
                 </div>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <StatBox label="Produtos" value={String(supplier.stats.products_count)} />
        <StatBox label="Total compras" value={formatBRL(supplier.stats.total_purchased)} />
        <StatBox label="Pedidos" value={String(supplier.stats.total_orders)} />
        <StatBox label="Ticket médio" value={formatBRL(supplier.stats.avg_ticket)} />
      </div>

      <Tabs defaultValue="visao-geral">
        <TabsList>
          <TabsTrigger value="visao-geral"><Truck className="w-3.5 h-3.5 mr-1 inline" /> Visão geral</TabsTrigger>
          <TabsTrigger value="timeline"><Clock className="w-3.5 h-3.5 mr-1 inline" /> Histórico</TabsTrigger>
        </TabsList>
        <TabsContent value="visao-geral"><VisaoGeralTab supplier={supplier} /></TabsContent>
        <TabsContent value="timeline"><TimelineTab supplier={supplier} /></TabsContent>
      </Tabs>
    </div>
  )
}
