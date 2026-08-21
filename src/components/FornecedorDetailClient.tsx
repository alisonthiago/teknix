'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Truck, Clock, Phone, Mail, MessageCircle, 
  MoreVertical, Plus, FileText, Link as LinkIcon, Loader2, 
  Copy, Check, MapPin, Building2, ExternalLink, Edit3, CreditCard,
  Wallet, ShieldAlert, Sparkles, CheckCircle2
} from 'lucide-react'
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

function CopyButton({ text, label = 'Copiar' }: { text?: string | null; label?: string }) {
  const [copied, setCopied] = useState(false)
  if (!text || text === '—') return null
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="text-[11px] font-bold text-[#3483fa] hover:underline flex items-center gap-1 cursor-pointer"
      title={`Copiar ${label}`}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-[#16a34a]" />
          <span className="text-[#16a34a]">Copiado!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3" />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}

function VisaoGeralTab({ supplier }: { supplier: SupplierDetail }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-[#e6e6e6] rounded-xl p-5 shadow-2xs">
          <SectionTitle>Produtos fornecidos ({supplier.products.length})</SectionTitle>
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
                {supplier.products.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#999]">Nenhum produto vinculado a este fornecedor.</td>
                  </tr>
                ) : (
                  supplier.products.map(p => (
                    <tr key={p.id} className="hover:bg-[#fafafa] transition-colors cursor-pointer">
                      <td className="py-2.5 px-3 font-mono text-[#999]">{p.sku}</td>
                      <td className="py-2.5 px-3 text-[#333] font-medium">{p.name}</td>
                      <td className="py-2.5 px-3 text-right text-[#999]">{formatBRL(p.cost)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`font-medium ${p.stock === 0 ? 'text-[#e74c3c]' : p.stock <= 10 ? 'text-[#e67e22]' : 'text-[#333]'}`}>
                          {p.stock}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-xl p-5 shadow-2xs">
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
                  <th className="text-right py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeee]">
                {supplier.purchases.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-[#999]">Nenhuma compra registrada ainda.</td>
                  </tr>
                ) : (
                  supplier.purchases.map(p => (
                    <tr key={p.id} className="hover:bg-[#fafafa] transition-colors">
                      <td className="py-2.5 px-3 text-[#999]">{p.date}</td>
                      <td className="py-2.5 px-3 font-mono text-[#333]">{p.invoice || 'S/N'}</td>
                      <td className="py-2.5 px-3 text-right text-[#999]">{p.items}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#333]">{formatBRL(p.total)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex px-2 py-[2px] rounded-full text-[10px] font-bold bg-[#f0fff4] text-[#16a34a] border border-[#bbf7d0]">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link 
                          href={`/purchases/${p.id}/nota`} 
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-[#f5f5f5] text-[#666] hover:bg-[#3483fa] hover:text-white transition-colors" 
                          title="Ver Nota Interna"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <SupplierCatalogsDisplay supplierId={supplier.id} />

        {/* Resumo Rápido de Condições */}
        <div className="bg-white border border-[#e6e6e6] rounded-xl p-5 shadow-2xs">
          <SectionTitle>Condições Comerciais</SectionTitle>
          <div className="space-y-1">
            <InfoRow label="Prazo de entrega" value={`${supplier.delivery_time} dias`} />
            <InfoRow label="Pedido mínimo" value={formatBRL(supplier.min_order)} />
            <InfoRow label="Condição de pagamento" value={supplier.payment_terms} />
            <InfoRow label="Cidade / Matriz" value={`${supplier.city}/${supplier.state}`} />
          </div>
        </div>

        {/* Contato Rápido */}
        <div className="bg-white border border-[#e6e6e6] rounded-xl p-5 shadow-2xs">
          <SectionTitle>Contatos Cadastrados</SectionTitle>
          <div className="space-y-1">
            {supplier.contacts?.map(c => (
              <InfoRow 
                key={c.id} 
                label={c.name || (c.is_whatsapp ? 'WhatsApp' : 'Telefone')} 
                value={c.phone} 
                bold={!!c.name}
              />
            ))}
            {(!supplier.contacts || supplier.contacts.length === 0) && (
              <>
                <InfoRow label="Responsável" value={supplier.contact} bold />
                <InfoRow label="Telefone" value={supplier.phone} />
                <InfoRow label="WhatsApp" value={supplier.whatsapp} />
              </>
            )}
            <InfoRow label="E-mail" value={supplier.email} />
          </div>
        </div>
      </div>
    </div>
  )
}

function InformacoesTab({ supplier }: { supplier: SupplierDetail }) {
  const pickupAddr = supplier.pickup_address || supplier.address

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Dados Cadastrais & Fiscais */}
      <div className="bg-white border border-[#e6e6e6] rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#f0f0f0]">
          <h3 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#3483fa]" />
            Dados Cadastrais & Fiscais
          </h3>
          <CopyButton text={supplier.cnpj} label="Copiar CNPJ" />
        </div>
        <div className="space-y-1">
          <InfoRow label="Nome / Razão Social" value={supplier.name} bold />
          <InfoRow label="CNPJ" value={supplier.cnpj} mono bold />
          <InfoRow label="Status" value={supplier.status === 'ACTIVE' || !supplier.status ? 'Ativo' : 'Inativo'} />
          <InfoRow label="Data de Cadastro" value={supplier.created_at} />
          <InfoRow label="Matriz Fiscal" value={`${supplier.city}/${supplier.state}`} />
          {supplier.address && <InfoRow label="Endereço Fiscal" value={supplier.address} />}
        </div>
      </div>

      {/* Locais de Coleta e Distribuição */}
      <div className="bg-white border border-[#e6e6e6] rounded-xl p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#f0f0f0]">
          <h3 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#e74c3c]" />
            Endereços & Locais de Retirada
          </h3>
          {pickupAddr && <CopyButton text={pickupAddr} label="Copiar Endereço" />}
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Endereço para Retirada / Coleta</span>
            <p className="text-[13px] font-medium text-[#1f2328] mt-0.5">{pickupAddr || 'Não informado'}</p>
            {pickupAddr && pickupAddr !== '—' && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupAddr)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3483fa] hover:underline mt-1"
              >
                <span>Abrir no Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {supplier.distributor_city && (
            <div className="pt-2 border-t border-[#f5f5f5]">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Distribuidor Regional</span>
              <p className="text-[13px] font-medium text-[#1f2328] mt-0.5">{supplier.distributor_city}/{supplier.distributor_state}</p>
            </div>
          )}
        </div>
      </div>

      {/* Condições Comerciais */}
      <div className="bg-white border border-[#e6e6e6] rounded-xl p-5 shadow-2xs space-y-3">
        <div className="pb-2 border-b border-[#f0f0f0]">
          <h3 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
            <Truck className="w-4 h-4 text-[#16a34a]" />
            Prazos & Condições Comerciais
          </h3>
        </div>
        <div className="space-y-1">
          <InfoRow label="Prazo Médio de Entrega" value={`${supplier.delivery_time} dias úteis`} bold />
          <InfoRow label="Pedido Mínimo" value={formatBRL(supplier.min_order)} bold />
          <InfoRow label="Condição de Pagamento" value={supplier.payment_terms || 'À vista'} />
          <InfoRow label="Frete" value={supplier.freight && supplier.freight > 0 ? formatBRL(supplier.freight) : 'FOB / A combinar'} />
        </div>
      </div>

      {/* Contatos e Canais Diretos */}
      <div className="bg-white border border-[#e6e6e6] rounded-xl p-5 shadow-2xs space-y-3">
        <div className="pb-2 border-b border-[#f0f0f0]">
          <h3 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
            <Phone className="w-4 h-4 text-[#3483fa]" />
            Contatos & Canais de Atendimento
          </h3>
        </div>
        <div className="space-y-2">
          {supplier.contacts && supplier.contacts.length > 0 ? (
            supplier.contacts.map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-[#f8fafc] border border-[#e2e8f0]">
                <div>
                  <span className="text-xs font-bold text-[#1f2328] block">{c.name || (c.is_whatsapp ? 'WhatsApp' : 'Telefone')}</span>
                  <span className="text-[11px] text-[#64748b] font-mono">{c.phone}</span>
                </div>
                {c.is_whatsapp ? (
                  <a
                    href={`https://wa.me/55${c.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#25d366]/10 text-[#128c7e] text-xs font-bold hover:bg-[#25d366]/20"
                  >
                    <MessageCircle className="w-3 h-3 text-[#25d366]" />
                    Chamar
                  </a>
                ) : (
                  <a
                    href={`tel:${c.phone.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white text-[#333] border border-[#e2e8f0] text-xs font-bold hover:bg-[#f1f5f9]"
                  >
                    <Phone className="w-3 h-3 text-[#64748b]" />
                    Ligar
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="space-y-1">
              <InfoRow label="Responsável" value={supplier.contact} bold />
              <InfoRow label="Telefone" value={supplier.phone} />
              <InfoRow label="WhatsApp" value={supplier.whatsapp} />
            </div>
          )}
          {supplier.email && (
            <div className="pt-2 border-t border-[#f5f5f5]">
              <InfoRow label="E-mail de Pedidos" value={supplier.email} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DadosBancariosTab({ supplier }: { supplier: SupplierDetail }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Card Chave PIX em Destaque */}
      <div className="bg-gradient-to-br from-[#1f2328] to-[#111827] text-white rounded-xl p-6 shadow-md flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#B5F500]/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-[#B5F500]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Chave PIX</h4>
                <span className="text-[11px] text-[#94a3b8]">Transferência instantânea</span>
              </div>
            </div>
            {supplier.pix_key && supplier.pix_key !== '—' && (
              <CopyButton text={supplier.pix_key} label="Copiar Chave" />
            )}
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/10">
            <span className="text-[10px] uppercase font-bold text-[#94a3b8] tracking-wider block mb-1">Chave Cadastrada</span>
            <div className="text-base font-mono font-bold text-[#B5F500] select-all break-all">
              {supplier.pix_key || 'Chave PIX não cadastrada'}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-[#94a3b8]">
          <span>Favorecido: <strong className="text-white">{supplier.name}</strong></span>
          <span>CNPJ: <strong className="text-white font-mono">{supplier.cnpj}</strong></span>
        </div>
      </div>

      {/* Card Dados da Conta Bancária */}
      <div className="bg-white border border-[#e6e6e6] rounded-xl p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#f0f0f0]">
          <h3 className="text-sm font-bold text-[#1f2328] flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#3483fa]" />
            Conta Bancária para Transferência / TED
          </h3>
        </div>

        <div className="space-y-1">
          <InfoRow label="Banco" value={supplier.bank} bold />
          <InfoRow label="Agência" value={supplier.agency} mono bold />
          <InfoRow label="Conta Corrente" value={supplier.account} mono bold />
          <InfoRow label="Titular / Razão Social" value={supplier.name} />
          <InfoRow label="CNPJ do Titular" value={supplier.cnpj} mono />
        </div>

        <div className="pt-3 border-t border-[#f5f5f5]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] block mb-1">Condição de Pagamento Acordada</span>
          <p className="text-sm font-semibold text-[#1f2328]">{supplier.payment_terms || 'À vista ou conforme negociação'}</p>
        </div>
      </div>
    </div>
  )
}

function CatalogosTab({ supplier }: { supplier: SupplierDetail }) {
  return (
    <div className="space-y-4">
      <SupplierCatalogsDisplay supplierId={supplier.id} />
    </div>
  )
}

function TimelineTab({ supplier }: { supplier: SupplierDetail }) {
  return (
    <div className="bg-white border border-[#e6e6e6] rounded-xl overflow-hidden shadow-2xs">
      <div className="px-5 py-4 border-b border-[#e6e6e6]">
        <SectionTitle>Histórico de atividades</SectionTitle>
      </div>
      <div className="divide-y divide-[#eeeeee]">
        {supplier.timeline.length === 0 ? (
          <div className="p-8 text-center text-[#999] text-sm">Nenhum histórico de atividade registrado.</div>
        ) : (
          supplier.timeline.map((h, i) => (
            <div key={i} className="px-5 py-3.5 flex items-start gap-3 hover:bg-[#fafafa] transition-colors">
              <div className="w-2 h-2 rounded-full bg-[#3483fa] mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-bold text-[#1f2328]">{h.action}</span>
                </div>
                <div className="text-[11px] text-[#666] mt-0.5">{h.details}</div>
              </div>
              <div className="text-[10px] text-[#999] text-right shrink-0">
                <div>{h.date}</div>
                <div>{h.time}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default function FornecedorDetailClient({ supplier }: { supplier: SupplierDetail }) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = (text: string, field: string) => {
    if (!text || text === '—') return
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const mainWhatsApp = supplier.contacts?.find(c => c.is_whatsapp)?.phone || supplier.whatsapp
  const mainPhone = supplier.contacts?.find(c => !c.is_whatsapp)?.phone || supplier.phone || mainWhatsApp
  const pickupAddr = supplier.pickup_address || supplier.address

  return (
    <div>
      <div className="mb-4">
        <Link href="/operacao" className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#333] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Operação / Fornecedores
        </Link>
      </div>

      {/* Cartão de Destaque da Empresa */}
      <div className="bg-white border border-[#e6e6e6] rounded-xl p-5 mb-4 shadow-xs">
        {/* Topo: Logo, Nome, Status e Botões de Ação */}
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 pb-5 border-b border-[#f0f0f0]">
          <div className="w-16 h-16 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
            {supplier.logo_url ? (
              <img src={supplier.logo_url} alt={supplier.name} className="w-full h-full object-contain p-1" />
            ) : (
              <Building2 className="w-8 h-8 text-[#94a3b8]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-[#1f2328]">{supplier.name}</h1>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    supplier.status === 'ACTIVE' || !supplier.status
                      ? 'bg-[#f0fff4] text-[#16a34a] border border-[#bbf7d0]'
                      : 'bg-[#fff1f2] text-[#e11d48] border border-[#fecdd3]'
                  }`}>
                    {supplier.status === 'ACTIVE' || !supplier.status ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <p className="text-xs text-[#666] mt-0.5">
                  {supplier.city && supplier.state ? `${supplier.city}/${supplier.state}` : 'Cadastro Nacional'}
                  {supplier.distributor_city && ` • Distribuidor: ${supplier.distributor_city}/${supplier.distributor_state}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link 
                  href={`/purchases/new?supplier=${supplier.id}`}
                  className="h-9 inline-flex items-center gap-1.5 px-4 bg-[#3483fa] hover:bg-[#2968c8] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Comprar
                </Link>
                <Link
                  href={`/fornecedores/${supplier.id}/editar`}
                  className="h-9 inline-flex items-center gap-1.5 px-3 bg-[#f5f5f5] hover:bg-[#ebebeb] text-[#333] text-xs font-semibold rounded-xl border border-[#e6e6e6] transition-colors"
                  title="Editar Fornecedor"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar
                </Link>
                <div className="relative">
                  <button
                    onClick={(e) => {
                      const menu = e.currentTarget.nextElementSibling
                      if (menu) menu.classList.toggle('hidden')
                    }}
                    className="h-9 w-9 flex items-center justify-center rounded-xl border border-[#e6e6e6] text-[#666] hover:bg-[#f5f5f5] transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                  <div className="absolute right-0 mt-1 w-44 bg-white border border-[#e6e6e6] rounded-xl shadow-lg hidden z-20 py-1">
                    <Link href={`/fornecedores/${supplier.id}/editar`} className="flex items-center gap-2 px-3.5 py-2 text-[12px] text-[#333] hover:bg-[#f5f5f5]">
                      <Edit3 className="w-3.5 h-3.5" />
                      Editar cadastro
                    </Link>
                    <Link href={`/purchases/new?supplier=${supplier.id}`} className="flex items-center gap-2 px-3.5 py-2 text-[12px] text-[#333] hover:bg-[#f5f5f5]">
                      <Plus className="w-3.5 h-3.5" />
                      Nova compra
                    </Link>
                    {mainWhatsApp && (
                      <a href={`https://wa.me/55${mainWhatsApp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3.5 py-2 text-[12px] text-[#16a34a] hover:bg-[#f5f5f5]">
                        <MessageCircle className="w-3.5 h-3.5" />
                        Conversar no WhatsApp
                      </a>
                    )}
                    {supplier.email && (
                      <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 px-3.5 py-2 text-[12px] text-[#3483fa] hover:bg-[#f5f5f5]">
                        <Mail className="w-3.5 h-3.5" />
                        Enviar E-mail
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 🌟 DADOS DA EMPRESA EM DESTAQUE (CNPJ, RETIRADA, TELEFONE/WHATSAPP) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4">
          {/* Card 1: CNPJ & Fiscal */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5 flex flex-col justify-between hover:border-[#cbd5e1] transition-colors">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#3483fa]" />
                  CNPJ
                </span>
                {supplier.cnpj && supplier.cnpj !== '—' && (
                  <button
                    onClick={() => copyToClipboard(supplier.cnpj, 'cnpj')}
                    className="text-[10px] font-bold text-[#3483fa] hover:underline flex items-center gap-1 cursor-pointer"
                    title="Copiar CNPJ"
                  >
                    {copiedField === 'cnpj' ? (
                      <>
                        <Check className="w-3 h-3 text-[#16a34a]" />
                        <span className="text-[#16a34a]">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="text-[15px] font-mono font-bold text-[#1f2328] select-all">
                {supplier.cnpj || '—'}
              </div>
            </div>
            <div className="mt-2 text-[11px] text-[#64748b]">
              Matriz: <span className="text-[#333] font-medium">{supplier.city}/{supplier.state}</span>
            </div>
          </div>

          {/* Card 2: Endereço para Retirada / Coleta */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5 flex flex-col justify-between hover:border-[#cbd5e1] transition-colors">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#e74c3c]" />
                  Endereço para Retirada
                </span>
                {pickupAddr && pickupAddr !== '—' && (
                  <button
                    onClick={() => copyToClipboard(pickupAddr, 'address')}
                    className="text-[10px] font-bold text-[#3483fa] hover:underline flex items-center gap-1 cursor-pointer"
                    title="Copiar Endereço"
                  >
                    {copiedField === 'address' ? (
                      <>
                        <Check className="w-3 h-3 text-[#16a34a]" />
                        <span className="text-[#16a34a]">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="text-[13px] font-semibold text-[#1f2328] line-clamp-2" title={pickupAddr || 'Não cadastrado'}>
                {pickupAddr || 'Endereço de retirada não informado'}
              </div>
            </div>
            {pickupAddr && pickupAddr !== '—' ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupAddr)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[#3483fa] hover:underline"
              >
                <span>Ver no Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <div className="mt-2 text-[11px] text-[#999]">Cadastre o local de coleta ao editar</div>
            )}
          </div>

          {/* Card 3: Telefone & WhatsApp */}
          <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl p-3.5 flex flex-col justify-between hover:border-[#cbd5e1] transition-colors">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#16a34a]" />
                  Telefone & WhatsApp
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {mainWhatsApp && (
                  <a
                    href={`https://wa.me/55${mainWhatsApp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#25d366]/10 text-[#128c7e] border border-[#25d366]/20 text-xs font-bold hover:bg-[#25d366]/20 transition-colors cursor-pointer"
                    title="Chamar no WhatsApp"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-[#25d366]" />
                    <span>{mainWhatsApp}</span>
                  </a>
                )}
                {mainPhone && mainPhone !== mainWhatsApp && (
                  <a
                    href={`tel:${mainPhone.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white text-[#333] border border-[#e2e8f0] text-xs font-bold hover:bg-[#f1f5f9] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#64748b]" />
                    <span>{mainPhone}</span>
                  </a>
                )}
                {!mainWhatsApp && !mainPhone && (
                  <span className="text-xs text-[#999]">Nenhum telefone informado</span>
                )}
              </div>
            </div>
            {supplier.email && supplier.email !== '—' && (
              <div className="mt-2 text-[11px] text-[#64748b] flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 shrink-0" />
                <a href={`mailto:${supplier.email}`} className="text-[#3483fa] hover:underline truncate" title={supplier.email}>
                  {supplier.email}
                </a>
              </div>
            )}
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
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="visao-geral">
            <Truck className="w-3.5 h-3.5 mr-1.5 inline" /> Visão geral
          </TabsTrigger>
          <TabsTrigger value="informacoes">
            <Building2 className="w-3.5 h-3.5 mr-1.5 inline" /> Informações da Empresa
          </TabsTrigger>
          <TabsTrigger value="dados-bancarios">
            <CreditCard className="w-3.5 h-3.5 mr-1.5 inline" /> Dados Bancários
          </TabsTrigger>
          <TabsTrigger value="catalogos">
            <FileText className="w-3.5 h-3.5 mr-1.5 inline" /> Catálogos
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="w-3.5 h-3.5 mr-1.5 inline" /> Histórico
          </TabsTrigger>
        </TabsList>
        <TabsContent value="visao-geral"><VisaoGeralTab supplier={supplier} /></TabsContent>
        <TabsContent value="informacoes"><InformacoesTab supplier={supplier} /></TabsContent>
        <TabsContent value="dados-bancarios"><DadosBancariosTab supplier={supplier} /></TabsContent>
        <TabsContent value="catalogos"><CatalogosTab supplier={supplier} /></TabsContent>
        <TabsContent value="timeline"><TimelineTab supplier={supplier} /></TabsContent>
      </Tabs>
    </div>
  )
}
