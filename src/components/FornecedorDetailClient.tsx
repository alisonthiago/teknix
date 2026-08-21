'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { 
  ArrowLeft, Truck, Clock, Phone, Mail, MessageCircle, 
  MoreVertical, Plus, FileText, Link as LinkIcon, Loader2, 
  Copy, Check, MapPin, Building2, ExternalLink, Edit3, CreditCard,
  Trash2, Upload
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { createClient } from '@/utils/supabase/client'
import SupplierCatalogsEditor from '@/components/SupplierCatalogsEditor'
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
      className="text-[11px] font-medium text-[#666] hover:text-[#333] hover:underline flex items-center gap-1 cursor-pointer"
      title={`Copiar ${label}`}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-[#38a169]" />
          <span className="text-[#38a169]">Copiado!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 text-[#999]" />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}

function SupplierCatalogsDisplay({ supplierId }: { supplierId: string }) {
  const [catalogs, setCatalogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchCatalogs = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('supplier_catalogs')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })
    setCatalogs(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchCatalogs()
  }, [supplierId])

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const file = files[0]
      if (file.size > 50 * 1024 * 1024) {
        alert('O arquivo excede o limite máximo de 50MB.')
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('supplierId', supplierId)

      const res = await fetch('/api/upload/catalog', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Falha ao enviar arquivo.')
      }

      await fetchCatalogs()
    } catch (err: any) {
      console.error(err)
      alert(err.message || 'Erro no upload do catálogo.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteCatalog = async (e: React.MouseEvent, id: string, fileUrl: string, fileType?: string) => {
    e.preventDefault()
    e.stopPropagation()

    if (!confirm('Deseja realmente apagar este catálogo?')) return

    try {
      const supabase = createClient()
      await supabase.from('supplier_catalogs').delete().eq('id', id)

      if (fileType === 'PDF' || fileType === 'IMAGEM' || (fileUrl && fileUrl.includes('supplier-catalogs'))) {
        const urlParts = (fileUrl || '').split('/')
        const fileName = urlParts.slice(-2).join('/')
        await supabase.storage.from('supplier-catalogs').remove([fileName])
      }

      setCatalogs(prev => prev.filter(c => c.id !== id))
    } catch (err) {
      console.error(err)
      alert('Não foi possível excluir o catálogo.')
    }
  }

  if (loading) return (
    <div className="bg-white border border-[#e6e6e6] rounded-md p-4 flex justify-center py-6">
      <Loader2 className="w-5 h-5 animate-spin text-[#999]" />
    </div>
  )

  return (
    <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold text-[#333]">Catálogos</h3>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleUploadFile}
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-[28px] px-2.5 bg-[#f5f5f5] hover:bg-[#ebebeb] text-[#333] border border-[#e0e0e0] rounded-md text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin text-[#333]" />
                <span>Enviando...</span>
              </>
            ) : (
              <>
                <Upload className="w-3 h-3 text-[#666]" />
                <span>+ Enviar Catálogo</span>
              </>
            )}
          </button>
        </div>
      </div>

      {catalogs.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-[#e6e6e6] rounded-md bg-[#fafafa]">
          <FileText className="w-7 h-7 text-[#ccc] mx-auto mb-1.5" />
          <p className="text-[12px] text-[#666] font-medium">Nenhum catálogo cadastrado</p>
          <p className="text-[11px] text-[#999] mt-0.5">Faça upload de tabelas de preços ou PDFs</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-2 text-[11px] text-[#3483fa] hover:underline font-semibold"
          >
            + Enviar arquivo PDF / Imagem
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {catalogs.map(cat => {
            const url = cat.file_url || cat.url || ''
            const isPdf = (cat.file_type || '').toUpperCase() === 'PDF' || url.toLowerCase().includes('.pdf')
            return (
              <div 
                key={cat.id} 
                className="group relative border border-[#e6e6e6] rounded-md p-3 flex flex-col items-center justify-center bg-[#fafafa] hover:bg-[#f5f5f5] transition-colors"
              >
                {/* Botão de Excluir / Apagar Catálogo */}
                <button
                  onClick={(e) => handleDeleteCatalog(e, cat.id, url, cat.file_type)}
                  className="absolute top-2 right-2 p-1 rounded-md bg-white border border-[#e6e6e6] text-[#999] hover:text-[#e74c3c] hover:border-[#ffcdd2] opacity-0 group-hover:opacity-100 transition-all cursor-pointer shadow-xs z-10"
                  title="Apagar este catálogo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center w-full text-center cursor-pointer"
                >
                  {isPdf ? (
                    <FileText className="w-7 h-7 text-[#e74c3c] mb-2" />
                  ) : (
                    <LinkIcon className="w-7 h-7 text-[#666] mb-2" />
                  )}
                  <span className="text-[11px] text-center font-medium text-[#333] line-clamp-2 w-full" title={cat.title}>
                    {cat.title}
                  </span>
                  <span className="text-[10px] text-[#3483fa] mt-1 group-hover:underline">
                    Abrir / Baixar ↗
                  </span>
                </a>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function VisaoGeralTab({ supplier }: { supplier: SupplierDetail }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
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
                  <th className="text-right py-2 px-3 text-[10px] font-medium text-[#999] uppercase">Nota</th>
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
                        <span className="inline-flex px-2 py-[2px] rounded text-[10px] font-medium bg-[#f0fff4] text-[#38a169]">
                          {p.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <Link 
                          href={`/purchases/${p.id}/nota`} 
                          className="inline-flex items-center justify-center w-7 h-7 rounded bg-[#f5f5f5] text-[#666] hover:bg-[#3483fa] hover:text-white transition-colors" 
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

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Condições Comerciais</SectionTitle>
          <div className="space-y-1">
            <InfoRow label="Prazo de entrega" value={`${supplier.delivery_time} dias`} />
            <InfoRow label="Pedido mínimo" value={formatBRL(supplier.min_order)} />
            <InfoRow label="Condição de pagamento" value={supplier.payment_terms} />
            <InfoRow label="Cidade / Matriz" value={`${supplier.city}/${supplier.state}`} />
          </div>
        </div>

        <div className="bg-white border border-[#e6e6e6] rounded-md p-4">
          <SectionTitle>Contatos</SectionTitle>
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
                {supplier.phone && supplier.phone !== '—' && <InfoRow label="Telefone" value={supplier.phone} />}
                {supplier.whatsapp && supplier.whatsapp !== '—' && <InfoRow label="WhatsApp" value={supplier.whatsapp} />}
              </>
            )}
            {supplier.email && supplier.email !== '—' && <InfoRow label="E-mail" value={supplier.email} />}
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
      <div className="bg-white border border-[#e6e6e6] rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#f5f5f5]">
          <SectionTitle>Dados Cadastrais & Fiscais</SectionTitle>
          <CopyButton text={supplier.cnpj} label="Copiar CNPJ" />
        </div>
        <div className="space-y-1">
          <InfoRow label="Razão Social / Nome" value={supplier.name} bold />
          <InfoRow label="CNPJ" value={supplier.cnpj} mono bold />
          <InfoRow label="Status" value={supplier.status === 'ACTIVE' || !supplier.status ? 'Ativo' : 'Inativo'} />
          <InfoRow label="Cadastro no Sistema" value={supplier.created_at} />
          <InfoRow label="Matriz Fiscal" value={`${supplier.city}/${supplier.state}`} />
          {supplier.address && <InfoRow label="Endereço Fiscal" value={supplier.address} />}
        </div>
      </div>

      {/* Locais de Coleta e Distribuição */}
      <div className="bg-white border border-[#e6e6e6] rounded-md p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#f5f5f5]">
          <SectionTitle>Endereços & Locais de Retirada</SectionTitle>
          {pickupAddr && <CopyButton text={pickupAddr} label="Copiar Endereço" />}
        </div>
        <div className="space-y-2">
          <div>
            <span className="text-[11px] text-[#999]">Endereço para Retirada / Coleta</span>
            <p className="text-[13px] font-medium text-[#333] mt-0.5">{pickupAddr || 'Não informado'}</p>
            {pickupAddr && pickupAddr !== '—' && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupAddr)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-[#666] hover:text-[#333] hover:underline mt-1"
              >
                <span>Ver no Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {supplier.distributor_city && (
            <div className="pt-2 border-t border-[#f5f5f5]">
              <span className="text-[11px] text-[#999]">Distribuidor Regional</span>
              <p className="text-[13px] font-medium text-[#333] mt-0.5">{supplier.distributor_city}/{supplier.distributor_state}</p>
            </div>
          )}
        </div>
      </div>

      {/* Condições Comerciais */}
      <div className="bg-white border border-[#e6e6e6] rounded-md p-4 space-y-3">
        <div className="pb-2 border-b border-[#f5f5f5]">
          <SectionTitle>Prazos & Condições Comerciais</SectionTitle>
        </div>
        <div className="space-y-1">
          <InfoRow label="Prazo Médio de Entrega" value={`${supplier.delivery_time} dias`} bold />
          <InfoRow label="Pedido Mínimo" value={formatBRL(supplier.min_order)} bold />
          <InfoRow label="Condição de Pagamento" value={supplier.payment_terms || 'À vista'} />
          <InfoRow label="Frete" value={supplier.freight && supplier.freight > 0 ? formatBRL(supplier.freight) : 'FOB / A combinar'} />
        </div>
      </div>

      {/* Contatos e Canais Diretos */}
      <div className="bg-white border border-[#e6e6e6] rounded-md p-4 space-y-3">
        <div className="pb-2 border-b border-[#f5f5f5]">
          <SectionTitle>Contatos & Canais de Atendimento</SectionTitle>
        </div>
        <div className="space-y-2">
          {supplier.contacts && supplier.contacts.length > 0 ? (
            supplier.contacts.map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-md bg-[#fafafa] border border-[#eeeeee]">
                <div>
                  <span className="text-[12px] font-medium text-[#333] block">{c.name || (c.is_whatsapp ? 'WhatsApp' : 'Telefone')}</span>
                  <span className="text-[11px] text-[#999] font-mono">{c.phone}</span>
                </div>
                {c.is_whatsapp ? (
                  <a
                    href={`https://wa.me/55${c.phone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#f0fff4] text-[#38a169] text-[11px] font-medium hover:bg-[#dcfce7]"
                  >
                    <MessageCircle className="w-3 h-3 text-[#38a169]" />
                    Chamar
                  </a>
                ) : (
                  <a
                    href={`tel:${c.phone.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white text-[#666] border border-[#e6e6e6] text-[11px] font-medium hover:bg-[#f5f5f5]"
                  >
                    <Phone className="w-3 h-3 text-[#999]" />
                    Ligar
                  </a>
                )}
              </div>
            ))
          ) : (
            <div className="space-y-1">
              <InfoRow label="Responsável" value={supplier.contact} bold />
              {supplier.phone && supplier.phone !== '—' && <InfoRow label="Telefone" value={supplier.phone} />}
              {supplier.whatsapp && supplier.whatsapp !== '—' && <InfoRow label="WhatsApp" value={supplier.whatsapp} />}
            </div>
          )}
          {supplier.email && supplier.email !== '—' && (
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
      {/* Card Chave PIX — Padrão do Sistema */}
      <div className="bg-white border border-[#e6e6e6] rounded-md p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-2 border-b border-[#f5f5f5] mb-3">
            <SectionTitle>Chave PIX</SectionTitle>
            {supplier.pix_key && supplier.pix_key !== '—' && (
              <CopyButton text={supplier.pix_key} label="Copiar Chave" />
            )}
          </div>

          <div className="bg-[#fafafa] rounded-md p-3 border border-[#eeeeee] mb-3">
            <span className="text-[10px] font-medium text-[#999] uppercase tracking-wider block mb-1">Chave Cadastrada</span>
            <div className="text-[14px] font-mono font-medium text-[#333] select-all break-all">
              {supplier.pix_key || 'Chave PIX não cadastrada'}
            </div>
          </div>

          <div className="space-y-1">
            <InfoRow label="Favorecido" value={supplier.name} bold />
            <InfoRow label="CNPJ do Favorecido" value={supplier.cnpj} mono />
          </div>
        </div>
      </div>

      {/* Card Dados da Conta Bancária — Padrão do Sistema */}
      <div className="bg-white border border-[#e6e6e6] rounded-md p-4 space-y-3">
        <div className="pb-2 border-b border-[#f5f5f5]">
          <SectionTitle>Conta Bancária (TED / Transferência)</SectionTitle>
        </div>

        <div className="space-y-1">
          <InfoRow label="Banco" value={supplier.bank} bold />
          <InfoRow label="Agência" value={supplier.agency} mono />
          <InfoRow label="Conta Corrente" value={supplier.account} mono />
          <InfoRow label="Titular" value={supplier.name} />
          <InfoRow label="CNPJ" value={supplier.cnpj} mono />
          <InfoRow label="Condição de Pagamento" value={supplier.payment_terms || 'À vista'} />
        </div>
      </div>
    </div>
  )
}

function CatalogosTab({ supplier }: { supplier: SupplierDetail }) {
  return (
    <div className="bg-white border border-[#e6e6e6] rounded-md p-5">
      <SectionTitle>Gerenciar Catálogos do Fornecedor</SectionTitle>
      <p className="text-[12px] text-[#666] mb-4">
        Faça upload de arquivos PDF ou imagens de catálogos (até 50MB), adicione links externos ou exclua catálogos antigos.
      </p>
      <SupplierCatalogsEditor supplierId={supplier.id} />
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
        {supplier.timeline.length === 0 ? (
          <div className="p-8 text-center text-[#999] text-[12px]">Nenhum histórico de atividade registrado.</div>
        ) : (
          supplier.timeline.map((h, i) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3 hover:bg-[#fafafa] transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3483fa] mt-1.5 shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-medium text-[#333]">{h.action}</span>
                </div>
                <div className="text-[11px] text-[#666] mt-0.5">{h.details}</div>
              </div>
              <div className="text-[10px] text-[#ccc] text-right shrink-0">
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

  const rawWhatsApp = supplier.contacts?.find(c => c.is_whatsapp)?.phone || supplier.whatsapp
  const rawPhone = supplier.contacts?.find(c => !c.is_whatsapp)?.phone || supplier.phone

  const hasWhatsApp = Boolean(rawWhatsApp && rawWhatsApp !== '—' && rawWhatsApp.replace(/\D/g, '').length >= 8)
  const hasPhone = Boolean(rawPhone && rawPhone !== '—' && rawPhone.replace(/\D/g, '').length >= 8 && rawPhone !== rawWhatsApp)
  
  const mainWhatsApp = hasWhatsApp ? rawWhatsApp : null
  const mainPhone = hasPhone ? rawPhone : null
  const pickupAddr = supplier.pickup_address || supplier.address

  return (
    <div>
      <div className="mb-4">
        <Link href="/operacao" className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#333] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Operação / Fornecedores
        </Link>
      </div>

      {/* Cartão do Fornecedor — Padrão Visual do Sistema */}
      <div className="bg-white border border-[#e6e6e6] rounded-md p-5 mb-4">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <div className="w-16 h-16 rounded-md bg-[#f5f5f5] border border-[#e6e6e6] flex items-center justify-center shrink-0 overflow-hidden">
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
                  {supplier.distributor_city && (
                    <>
                      <span className="text-[10px] text-[#ccc]">•</span>
                      <span className="text-[12px] text-[#999]">Distr: {supplier.distributor_city}/{supplier.distributor_state}</span>
                    </>
                  )}
                  <span className="text-[10px] text-[#ccc]">•</span>
                  <span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${
                    supplier.status === 'ACTIVE' || !supplier.status
                      ? 'bg-[#f0fff4] text-[#38a169]'
                      : 'bg-[#fff5f5] text-[#e74c3c]'
                  }`}>
                    {supplier.status === 'ACTIVE' || !supplier.status ? 'Ativo' : 'Inativo'}
                  </span>
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
                <Link
                  href={`/fornecedores/${supplier.id}/editar`}
                  className="h-[30px] inline-flex items-center gap-1.5 px-3 bg-white hover:bg-[#f5f5f5] text-[#666] text-[12px] font-medium rounded-md border border-[#e6e6e6] transition-colors"
                  title="Editar Fornecedor"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Editar
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
                    <Edit3 className="w-3 h-3" />
                    Editar
                  </Link>
                  <Link href={`/purchases/new?supplier=${supplier.id}`} className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#333] hover:bg-[#f5f5f5]">
                    <Plus className="w-3 h-3" />
                    Nova compra
                  </Link>
                  {mainWhatsApp && (
                    <a href={`https://wa.me/55${mainWhatsApp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#38a169] hover:bg-[#f5f5f5]">
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp
                    </a>
                  )}
                  {supplier.email && supplier.email !== '—' && (
                    <a href={`mailto:${supplier.email}`} className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#666] hover:text-[#333] hover:bg-[#f5f5f5]">
                      <Mail className="w-3 h-3" />
                      E-mail
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Informações em Destaque — Padrão do Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 mt-4 border-t border-[#f5f5f5]">
          {/* Card 1: CNPJ */}
          <div className="bg-[#fafafa] border border-[#eeeeee] rounded-md p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-[#999] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#999]" />
                  CNPJ
                </span>
                {supplier.cnpj && supplier.cnpj !== '—' && (
                  <button
                    onClick={() => copyToClipboard(supplier.cnpj, 'cnpj')}
                    className="text-[11px] font-medium text-[#666] hover:text-[#333] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'cnpj' ? (
                      <>
                        <Check className="w-3 h-3 text-[#38a169]" />
                        <span className="text-[#38a169]">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#999]" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="text-[13px] font-mono font-medium text-[#333] select-all">
                {supplier.cnpj || '—'}
              </div>
            </div>
            <div className="mt-1.5 text-[11px] text-[#999]">
              Matriz: <span className="text-[#666]">{supplier.city}/{supplier.state}</span>
            </div>
          </div>

          {/* Card 2: Endereço para Retirada */}
          <div className="bg-[#fafafa] border border-[#eeeeee] rounded-md p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-[#999] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#999]" />
                  Endereço para Retirada
                </span>
                {pickupAddr && pickupAddr !== '—' && (
                  <button
                    onClick={() => copyToClipboard(pickupAddr, 'address')}
                    className="text-[11px] font-medium text-[#666] hover:text-[#333] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'address' ? (
                      <>
                        <Check className="w-3 h-3 text-[#38a169]" />
                        <span className="text-[#38a169]">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 text-[#999]" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <div className="text-[12px] font-medium text-[#333] line-clamp-2" title={pickupAddr || 'Não cadastrado'}>
                {pickupAddr || 'Endereço não informado'}
              </div>
            </div>
            {pickupAddr && pickupAddr !== '—' ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pickupAddr)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-[#666] hover:text-[#333] hover:underline"
              >
                <span>Ver no Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <div className="mt-1.5 text-[11px] text-[#ccc]">Cadastre ao editar</div>
            )}
          </div>

          {/* Card 3: Telefone & WhatsApp */}
          <div className="bg-[#fafafa] border border-[#eeeeee] rounded-md p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-[#999] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#999]" />
                  Telefone & WhatsApp
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                {mainWhatsApp && (
                  <a
                    href={`https://wa.me/55${mainWhatsApp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f0fff4] text-[#38a169] text-[11px] font-medium hover:bg-[#dcfce7] transition-colors"
                    title="Chamar no WhatsApp"
                  >
                    <MessageCircle className="w-3 h-3 text-[#38a169]" />
                    <span>{mainWhatsApp}</span>
                  </a>
                )}
                {mainPhone && (
                  <a
                    href={`tel:${mainPhone.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white text-[#666] border border-[#e6e6e6] text-[11px] font-medium hover:bg-[#f5f5f5] transition-colors"
                  >
                    <Phone className="w-3 h-3 text-[#999]" />
                    <span>{mainPhone}</span>
                  </a>
                )}
                {!mainWhatsApp && !mainPhone && (
                  <span className="text-[11px] text-[#999]">Nenhum telefone informado</span>
                )}
              </div>
            </div>
            {supplier.email && supplier.email !== '—' && (
              <div className="mt-1.5 text-[11px] text-[#999] flex items-center gap-1 truncate">
                <Mail className="w-3 h-3 shrink-0 text-[#999]" />
                <a href={`mailto:${supplier.email}`} className="text-[#666] hover:text-[#333] hover:underline truncate" title={supplier.email}>
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
