'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  ArrowLeft, Building2, Phone, MessageCircle, 
  Plus, FileText, Copy, Check, MapPin, 
  Edit3, CreditCard, Clock, Package, ShoppingCart, 
  DollarSign, CheckCircle2, ChevronRight, ExternalLink, Trash2
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import SupplierCatalogsEditor from '@/components/SupplierCatalogsEditor'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import { createClient } from '@/utils/supabase/client'
import type { SupplierDetail } from '@/lib/detail-types'

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M17.5 14.39c-.28-.14-1.66-.82-1.92-.91-.26-.1-.45-.14-.64.14-.19.28-.73.91-.9 1.1-.17.18-.34.2-.62.07-.28-.14-1.18-.43-2.24-1.38-.83-.74-1.39-1.65-1.55-1.93-.16-.28-.02-.43.12-.57.13-.13.28-.34.42-.51.14-.17.19-.29.28-.48.09-.19.05-.36-.02-.5-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.48-.64-.49-.17-.01-.36-.01-.55-.01-.19 0-.5.07-.76.36-.26.28-1 1-1 2.43s1.02 2.81 1.16 3c.14.19 2.01 3.07 4.87 4.31.68.29 1.21.46 1.63.6.68.22 1.3.19 1.79.12.55-.08 1.66-.68 1.89-1.33.24-.65.24-1.22.17-1.33-.07-.12-.26-.19-.54-.33z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.48 2 2 6.48 2 12c0 1.82.49 3.53 1.34 5L2 22l5.17-1.32A9.94 9.94 0 0 0 12 22c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.2c-1.58 0-3.07-.44-4.35-1.22l-.31-.19-3.07.78.82-2.99-.2-.32A8.17 8.17 0 0 1 3.8 12c0-4.52 3.68-8.2 8.2-8.2 4.52 0 8.2 3.68 8.2 8.2 0 4.52-3.68 8.2-8.2 8.2z"
        fill="currentColor"
      />
    </svg>
  )
}

function StatusBadge({ status }: { status: string }) {
  const s = String(status || 'ACTIVE').toUpperCase()
  const isActive = s === 'ACTIVE'
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-2xs ${
      isActive ? 'bg-[#ecfdf5] border-[#bbf7d0] text-[#16a34a]' : 'bg-[#fef2f2] border-[#fecaca] text-[#dc2626]'
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-[#16a34a]' : 'bg-[#dc2626]'}`} />
      {isActive ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function CopyButton({ text, label = 'Copiar' }: { text?: string | null; label?: string }) {
  const [copied, setCopied] = useState(false)
  if (!text || text === '—') return null
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#64748b] hover:text-[#0f172a] hover:underline cursor-pointer transition-colors"
      title={`Copiar ${label}`}
    >
      {copied ? (
        <>
          <Check className="w-3 h-3 text-[#16a34a]" />
          <span className="text-[#16a34a] font-bold">Copiado!</span>
        </>
      ) : (
        <>
          <Copy className="w-3 h-3 text-[#94a3b8]" />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}

function StatBox({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon?: any }) {
  return (
    <div className="bg-white border border-[#e6e6e6] rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-[#cbd5e1] transition-all flex flex-col justify-between min-w-0 overflow-hidden">
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <span className="text-xs font-semibold text-[#64748b] truncate" title={label}>{label}</span>
        {Icon && <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#94a3b8] shrink-0" />}
      </div>
      <div className="text-lg sm:text-2xl font-black text-[#111111] tracking-tight truncate" title={value}>{value}</div>
      {sub && <div className="text-[11px] text-[#999999] mt-0.5 truncate">{sub}</div>}
    </div>
  )
}

export default function FornecedorDetailClient({ supplier }: { supplier: SupplierDetail }) {
  const router = useRouter()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const rawWhatsApp = supplier.contacts?.find(c => c.is_whatsapp)?.phone || supplier.whatsapp
  const rawPhone = supplier.contacts?.find(c => !c.is_whatsapp)?.phone || supplier.phone

  const hasWhatsApp = Boolean(rawWhatsApp && rawWhatsApp !== '—' && rawWhatsApp.replace(/\D/g, '').length >= 8)
  const hasPhone = Boolean((rawPhone && rawPhone !== '—' && rawPhone.replace(/\D/g, '').length >= 8) || (rawWhatsApp && rawWhatsApp !== '—' && rawWhatsApp.replace(/\D/g, '').length >= 8))
  
  const mainWhatsApp = hasWhatsApp ? rawWhatsApp : null
  const mainPhone = (rawPhone && rawPhone !== '—' && rawPhone.replace(/\D/g, '').length >= 8) ? rawPhone : (hasWhatsApp ? rawWhatsApp : null)
  const pickupAddr = supplier.pickup_address || supplier.address

  const handleDelete = async () => {
    try {
      const supabase = createClient()
      const { error } = await supabase.from('suppliers').delete().eq('id', supplier.id)
      if (error) throw error
      router.push('/operacao')
    } catch (err) {
      console.error('Erro ao excluir fornecedor:', err)
      alert('Erro ao excluir fornecedor.')
    }
  }

  return (
    <div className="pb-24 max-w-7xl mx-auto">
      {/* Header com Navegação */}
      <div className="flex items-center justify-between gap-4 border-b border-[#eeeeee] pb-4 mb-6 sm:mb-8">
        <div className="hub-mobile-header-title-row lg:hidden !justify-start gap-2.5 mb-2.5">
          <button 
            type="button" 
            className="hub-mobile-back-btn" 
            aria-label="Voltar" 
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="hub-mobile-page-title !text-[15px] truncate font-bold text-[#111111]">
            {supplier.name}
          </h1>
        </div>
        <Link 
          href="/operacao" 
          className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold text-[#888888] hover:text-[#111111] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Operação / Fornecedores
        </Link>
      </div>

      {/* Main Supplier Hero (1:1 Padrão da Tela de Produto) */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 lg:gap-10 w-full mt-6 sm:mt-8 mb-10 sm:mb-12 pb-4 sm:pb-6">
        {/* Foto / Logo do Fornecedor */}
        <div className="w-full sm:w-40 lg:w-48 flex flex-col items-center gap-3 shrink-0">
          <div className="relative w-40 sm:w-full max-w-[240px] sm:max-w-none aspect-square rounded-2xl bg-white border border-[#e6e6e6] overflow-hidden flex items-center justify-center p-3 sm:p-4 shadow-2xs group">
            {supplier.logo_url ? (
              <img 
                src={supplier.logo_url} 
                alt={supplier.name} 
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105" 
              />
            ) : (
              <Building2 className="w-16 h-16 text-[#94a3b8]" />
            )}
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded-md bg-[#1f2328] text-white text-[10px] font-bold shadow-xs">
                Fornecedor
              </span>
            </div>
          </div>
        </div>

        {/* Detalhes do Fornecedor e Ações */}
        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch w-full">
          <div>
            {/* Topo: Badges & Botões de Ação */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-5">
              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#F7F7F7] text-[#1f2328] border border-[#e5e7eb] text-xs font-semibold shadow-2xs">
                  <Building2 className="w-3.5 h-3.5 text-[#1f2328]" />
                  {supplier.city || 'Brasil'}/{supplier.state || 'BR'}
                </span>
                {supplier.distributor_city && (
                  <span className="inline-flex items-center px-3 py-1.5 rounded-xl bg-[#F7F7F7] text-[#4b5563] text-xs font-semibold border border-[#e5e7eb]">
                    Distr: {supplier.distributor_city}/{supplier.distributor_state}
                  </span>
                )}
                <StatusBadge status={supplier.status} />
              </div>

              {/* Botões de Ação (1:1 com os 4 botões do produto) */}
              <div className="product-action-icons flex items-center justify-center sm:justify-end gap-2.5 shrink-0 flex-wrap w-full sm:w-auto">
                {/* Botão 1: WhatsApp */}
                {mainWhatsApp ? (
                  <a
                    href={`https://wa.me/55${mainWhatsApp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-10 w-10 sm:h-10.5 sm:w-10.5 flex items-center justify-center bg-white text-[#16a34a] border border-[#bbf7d0] rounded-xl sm:rounded-2xl hover:bg-[#ecfdf5] hover:border-[#16a34a] transition-all cursor-pointer shadow-xs shrink-0"
                    title="Conversar no WhatsApp"
                  >
                    <WhatsAppIcon className="w-5 h-5 text-[#16a34a] shrink-0" />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="h-10 w-10 sm:h-10.5 sm:w-10.5 flex items-center justify-center bg-white text-[#cbd5e1] border border-[#e5e7eb] rounded-xl sm:rounded-2xl cursor-not-allowed opacity-50 shrink-0"
                    title="WhatsApp não cadastrado"
                  >
                    <WhatsAppIcon className="w-5 h-5 text-[#cbd5e1] shrink-0" />
                  </button>
                )}

                {/* Botão 2: Comprar */}
                <Link 
                  href={`/purchases/new?supplier=${supplier.id}`}
                  className="h-10 px-4 sm:h-10.5 sm:px-4.5 flex items-center gap-2 bg-white text-[#374151] border border-[#e5e7eb] rounded-xl sm:rounded-2xl hover:bg-[#f9fafb] hover:border-[#111] hover:text-[#111] text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs shrink-0"
                  title="Fazer Pedido de Compra"
                >
                  <ShoppingCart size={18} strokeWidth={2} className="w-4.5 h-4.5 text-[#374151] shrink-0" style={{ width: '18px', height: '18px', minWidth: '18px', minHeight: '18px', display: 'block' }} />
                  <span className="hidden sm:inline">Comprar</span>
                </Link>

                {/* Botão 3: Editar */}
                <Link 
                  href={`/fornecedores/${supplier.id}/editar`}
                  className="h-10 px-4.5 sm:h-10.5 sm:px-5 flex items-center gap-2 bg-[#1f2328] hover:bg-black text-white rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-xs shrink-0"
                  title="Editar Fornecedor"
                >
                  <Edit3 size={18} strokeWidth={2} className="w-4.5 h-4.5 text-white shrink-0" style={{ width: '18px', height: '18px', minWidth: '18px', minHeight: '18px', display: 'block' }} />
                  <span>Editar</span>
                </Link>

                {/* Botão 4: Ligar / Telefone */}
                {mainPhone ? (
                  <a
                    href={`tel:${mainPhone.replace(/\D/g, '')}`}
                    className="h-10 w-10 sm:h-10.5 sm:w-10.5 flex items-center justify-center bg-white text-[#374151] border border-[#e5e7eb] rounded-xl sm:rounded-2xl hover:bg-[#f9fafb] hover:border-[#111] hover:text-[#111] transition-all cursor-pointer shadow-xs shrink-0"
                    title="Ligar para fornecedor"
                  >
                    <Phone size={19} strokeWidth={2} className="w-5 h-5 text-[#374151] shrink-0" style={{ width: '19px', height: '19px', minWidth: '19px', minHeight: '19px', display: 'block' }} />
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="h-10 w-10 sm:h-10.5 sm:w-10.5 flex items-center justify-center bg-white text-[#cbd5e1] border border-[#e5e7eb] rounded-xl sm:rounded-2xl cursor-not-allowed opacity-50 shrink-0"
                    title="Telefone não cadastrado"
                  >
                    <Phone size={19} strokeWidth={2} className="w-5 h-5 text-[#cbd5e1] shrink-0" style={{ width: '19px', height: '19px', minWidth: '19px', minHeight: '19px', display: 'block' }} />
                  </button>
                )}

                {/* Botão 5: Excluir */}
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(true)}
                  className="h-10 w-10 sm:h-10.5 sm:w-10.5 flex items-center justify-center bg-white text-[#ef4444] border border-[#fecaca] hover:bg-[#fef2f2] hover:border-[#ef4444] rounded-xl sm:rounded-2xl transition-all focus:outline-none cursor-pointer shadow-xs shrink-0"
                  title="Excluir fornecedor"
                >
                  <Trash2 size={19} strokeWidth={2} className="w-5 h-5 text-[#ef4444] shrink-0" style={{ width: '19px', height: '19px', minWidth: '19px', minHeight: '19px', display: 'block' }} />
                </button>
              </div>
            </div>

            {/* Nome do Fornecedor */}
            <h1 className="text-xl sm:text-2xl font-black text-[#111111] leading-snug mb-3 text-center sm:text-left">
              {supplier.name}
            </h1>

            {/* Chips de Metadados (Marca / SKU / EAN equivalente) */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs mb-5">
              <span className="inline-flex items-center gap-1.5 bg-[#F7F7F7] px-3 py-1.5 rounded-xl border border-[#e5e7eb] text-[#1f2328] font-mono">
                <span className="text-[#888] font-sans">CNPJ:</span>
                <strong className="text-[#111] font-bold">{supplier.cnpj || '—'}</strong>
                {supplier.cnpj && supplier.cnpj !== '—' && (
                  <CopyButton text={supplier.cnpj} label="Copiar" />
                )}
              </span>

              <span className="inline-flex items-center gap-1.5 bg-[#F7F7F7] px-3 py-1.5 rounded-xl border border-[#e5e7eb] text-[#1f2328] font-medium">
                <span className="text-[#888]">Retirada:</span>
                <strong className="text-[#111] font-bold truncate max-w-[180px] sm:max-w-xs" title={pickupAddr || 'Matriz'}>
                  {pickupAddr || 'Matriz'}
                </strong>
                {pickupAddr && pickupAddr !== '—' && (
                  <CopyButton text={pickupAddr} label="Copiar" />
                )}
              </span>

              <span className="inline-flex items-center gap-1.5 bg-[#F7F7F7] px-3 py-1.5 rounded-xl border border-[#e5e7eb] text-[#1f2328] font-medium">
                <span className="text-[#888]">Prazo:</span>
                <strong className="text-[#16a34a] font-bold">
                  {supplier.delivery_time ? `${supplier.delivery_time} dias` : 'A combinar'}
                </strong>
              </span>

              <span className="inline-flex items-center gap-1.5 bg-[#F7F7F7] px-3 py-1.5 rounded-xl border border-[#e5e7eb] text-[#1f2328] font-medium">
                <span className="text-[#888]">Mínimo:</span>
                <strong className="text-[#111] font-bold">{formatBRL(supplier.min_order || 0)}</strong>
              </span>
            </div>

            {/* Highlight Cards Rápidos (Oculto no mobile, 1:1 com a página do produto) */}
            <div className="hidden sm:grid sm:grid-cols-3 gap-4 sm:gap-6 p-5 sm:p-6 bg-white border border-[#e6e6e6] rounded-2xl mt-4 sm:mt-5 mb-2 shadow-2xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-[#888888] tracking-wider">Produtos Vinculados</span>
                <div className="text-xl font-black mt-1 text-[#111111]">
                  {supplier.stats.products_count} itens
                </div>
                <div className="text-xs text-[#666666] mt-0.5">Catálogo cadastrado</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#888888] tracking-wider">Total Comprado (LTV)</span>
                <div className="text-xl font-black text-[#16a34a] mt-1">
                  {formatBRL(supplier.stats.total_purchased)}
                </div>
                <div className="text-xs text-[#666666] mt-0.5">Volume acumulado</div>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-[#888888] tracking-wider">Condição Padrão</span>
                <div className="text-xl font-black text-[#111111] mt-1">
                  {supplier.payment_terms || 'À vista'}
                </div>
                <div className="text-xs text-[#666666] mt-0.5">Prazo de faturamento</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Cards de Métricas (Mobile: 2x2, Desktop: 1x4) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 mb-8 sm:mb-10">
        <StatBox 
          label="Produtos" 
          value={`${supplier.stats.products_count} un`} 
          sub="No catálogo"
          icon={Package} 
        />
        <StatBox 
          label="Total Compras" 
          value={formatBRL(supplier.stats.total_purchased)} 
          sub="Volume total"
          icon={DollarSign} 
        />
        <StatBox 
          label="Pedidos" 
          value={`${supplier.stats.total_orders} ped`} 
          sub="Compras feitas"
          icon={ShoppingCart} 
        />
        <StatBox 
          label="Ticket Médio" 
          value={formatBRL(supplier.stats.avg_ticket)} 
          sub="Média p/ compra"
          icon={CheckCircle2} 
        />
      </div>

      {/* Abas de Navegação */}
      <Tabs defaultValue="produtos">
        <TabsList>
          <TabsTrigger value="produtos">
            <Package className="w-3.5 h-3.5 mr-1.5 inline" />
            Produtos ({supplier.products.length})
          </TabsTrigger>
          <TabsTrigger value="compras">
            <ShoppingCart className="w-3.5 h-3.5 mr-1.5 inline" />
            Compras ({supplier.purchases.length})
          </TabsTrigger>
          <TabsTrigger value="dados-bancarios">
            <CreditCard className="w-3.5 h-3.5 mr-1.5 inline" />
            Dados Bancários
          </TabsTrigger>
          <TabsTrigger value="catalogos">
            <FileText className="w-3.5 h-3.5 mr-1.5 inline" />
            Catálogos
          </TabsTrigger>
          <TabsTrigger value="historico">
            <Clock className="w-3.5 h-3.5 mr-1.5 inline" />
            Linha do Tempo
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: PRODUTOS FORNECIDOS */}
        <TabsContent value="produtos">
          <div className="bg-white border border-[#e6e6e6] rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Catálogo de Produtos do Fornecedor</h3>
                <p className="text-xs text-[#666666] mt-0.5">Produtos vinculados para compras e reposição.</p>
              </div>
              <span className="px-2.5 py-1 bg-[#f8fafc] text-[#334155] border border-[#e2e8f0] rounded-lg text-xs font-bold shrink-0">
                {supplier.products.length} itens
              </span>
            </div>

            {supplier.products.length === 0 ? (
              <div className="p-8 text-center text-[#888888]">
                <Package className="w-10 h-10 mx-auto text-[#cbd5e1] mb-2" />
                <p className="text-sm font-semibold text-[#334155]">Nenhum produto vinculado a este fornecedor</p>
                <p className="text-xs text-[#94a3b8] mt-1">Ao cadastrar ou editar produtos, selecione este fornecedor para vinculá-los.</p>
              </div>
            ) : (
              <>
                {/* Visualização em Lista / Cards para Mobile (< 640px) */}
                <div className="block sm:hidden divide-y divide-[#f1f5f9] rounded-xl border border-[#e2e8f0] overflow-hidden bg-white">
                  {supplier.products.map(p => (
                    <Link
                      key={p.id}
                      href={`/produtos/${p.id}`}
                      className="p-3.5 flex items-center gap-3 hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="w-11 h-11 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-center shrink-0 overflow-hidden p-1">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                        ) : (
                          <Package className="w-5 h-5 text-[#94a3b8]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[10px] font-mono font-semibold text-[#475569] bg-[#f1f5f9] px-1.5 py-0.5 rounded border border-[#e2e8f0]">
                            {p.sku}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            p.stock === 0 ? 'bg-[#fee2e2] text-[#dc2626]' : p.stock <= 10 ? 'bg-[#fef3c7] text-[#d97706]' : 'bg-[#ecfdf5] text-[#16a34a]'
                          }`}>
                            {p.stock} un
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-[#111111] truncate">{p.name}</p>
                        <p className="text-xs font-bold text-[#16a34a] mt-0.5">Custo: {formatBRL(p.cost)}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#cbd5e1] shrink-0" />
                    </Link>
                  ))}
                </div>

                {/* Tabela para Telas Maiores (>= 640px) */}
                <div className="hidden sm:block overflow-x-auto rounded-xl border border-[#e2e8f0]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-xs font-bold text-[#64748b]">
                        <th className="text-left py-3 px-4">Produto</th>
                        <th className="text-left py-3 px-4">Código SKU</th>
                        <th className="text-right py-3 px-4">Custo Unitário</th>
                        <th className="text-right py-3 px-4">Estoque Central</th>
                        <th className="text-center py-3 px-4 w-20">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {supplier.products.map(p => (
                        <tr key={p.id} className="hover:bg-[#fafafa] transition-colors group">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center shrink-0 overflow-hidden p-0.5">
                                {p.image ? (
                                  <img src={p.image} alt={p.name} className="w-full h-full object-contain" />
                                ) : (
                                  <Package className="w-4 h-4 text-[#94a3b8]" />
                                )}
                              </div>
                              <span className="font-semibold text-xs text-[#111111] group-hover:underline">
                                {p.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-[#475569]">
                            {p.sku}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-xs text-[#16a34a]">
                            {formatBRL(p.cost)}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`inline-block font-bold text-xs px-2 py-0.5 rounded ${
                              p.stock === 0 ? 'bg-[#fee2e2] text-[#dc2626]' : p.stock <= 10 ? 'bg-[#fef3c7] text-[#d97706]' : 'bg-[#ecfdf5] text-[#16a34a]'
                            }`}>
                              {p.stock} un
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link 
                              href={`/produtos/${p.id}`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#64748b] hover:text-[#111111] hover:bg-[#f1f5f9] transition-colors"
                              title="Ver Detalhes"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ABA 2: HISTÓRICO DE COMPRAS */}
        <TabsContent value="compras">
          <div className="bg-white border border-[#e6e6e6] rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f0f0]">
              <div>
                <h3 className="text-sm font-bold text-[#111111]">Histórico de Pedidos de Compra</h3>
                <p className="text-xs text-[#666666] mt-0.5">Todas as aquisições realizadas com este fornecedor.</p>
              </div>
              <Link
                href={`/purchases/new?supplier=${supplier.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#1f2328] hover:bg-black text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nova Compra</span>
              </Link>
            </div>

            {supplier.purchases.length === 0 ? (
              <div className="p-8 text-center text-[#888888]">
                <ShoppingCart className="w-10 h-10 mx-auto text-[#cbd5e1] mb-2" />
                <p className="text-sm font-semibold text-[#334155]">Nenhuma compra registrada</p>
                <p className="text-xs text-[#94a3b8] mt-1">Crie a primeira compra para movimentar o histórico e faturamento deste fornecedor.</p>
              </div>
            ) : (
              <>
                {/* Mobile: Cards de Compra */}
                <div className="block sm:hidden divide-y divide-[#f1f5f9] rounded-xl border border-[#e2e8f0] overflow-hidden bg-white">
                  {supplier.purchases.map(p => (
                    <Link
                      key={p.id}
                      href={`/purchases/${p.id}/nota`}
                      className="p-3.5 flex items-center justify-between gap-3 hover:bg-[#fafafa] transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-[#111111]">
                            NF: {p.invoice || 'S/N'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]">
                            {p.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-[#64748b]">
                          <span>{p.date}</span>
                          <span>•</span>
                          <span>{p.items} {p.items === 1 ? 'item' : 'itens'}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs font-bold text-[#111111] block">
                          {formatBRL(p.total)}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#cbd5e1] shrink-0" />
                    </Link>
                  ))}
                </div>

                {/* Desktop: Tabela de Compras */}
                <div className="hidden sm:block overflow-x-auto rounded-xl border border-[#e2e8f0]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-xs font-bold text-[#64748b]">
                        <th className="text-left py-3 px-4">Nota Fiscal</th>
                        <th className="text-left py-3 px-4">Data</th>
                        <th className="text-center py-3 px-4">Itens</th>
                        <th className="text-center py-3 px-4">Status</th>
                        <th className="text-right py-3 px-4">Total</th>
                        <th className="text-center py-3 px-4 w-20">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {supplier.purchases.map(p => (
                        <tr key={p.id} className="hover:bg-[#fafafa] transition-colors group">
                          <td className="py-3 px-4 font-mono font-bold text-xs text-[#111111]">
                            {p.invoice || 'S/N'}
                          </td>
                          <td className="py-3 px-4 text-xs text-[#64748b]">
                            {p.date}
                          </td>
                          <td className="py-3 px-4 text-center text-xs text-[#475569]">
                            {p.items} un
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]">
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-xs text-[#111111]">
                            {formatBRL(p.total)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <Link 
                              href={`/purchases/${p.id}/nota`}
                              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-[#64748b] hover:text-[#111111] hover:bg-[#f1f5f9] transition-colors"
                              title="Ver Nota"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        {/* ABA 3: DADOS BANCÁRIOS & FATURAMENTO */}
        <TabsContent value="dados-bancarios">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Card PIX */}
            <div className="bg-white border border-[#e6e6e6] rounded-2xl p-4 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9] mb-4">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#16a34a]" />
                    <h3 className="text-sm font-bold text-[#111111]">Chave PIX Cadastrada</h3>
                  </div>
                  {supplier.pix_key && supplier.pix_key !== '—' && (
                    <CopyButton text={supplier.pix_key} label="Copiar Chave" />
                  )}
                </div>

                <div className="bg-[#f8fafc] rounded-xl p-3.5 border border-[#e2e8f0] mb-3">
                  <span className="text-[10px] font-bold text-[#64748b] uppercase tracking-wider block mb-1">
                    Chave para Pagamento
                  </span>
                  <div className="text-sm sm:text-base font-mono font-bold text-[#0f172a] select-all break-all">
                    {supplier.pix_key || 'Nenhuma chave cadastrada'}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1.5 border-b border-[#f1f5f9]">
                    <span className="text-[#64748b]">Favorecido:</span>
                    <strong className="text-[#111111] font-semibold">{supplier.name}</strong>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-[#f1f5f9]">
                    <span className="text-[#64748b]">CNPJ do Favorecido:</span>
                    <strong className="font-mono text-[#111111]">{supplier.cnpj}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Card Transferência Bancária */}
            <div className="bg-white border border-[#e6e6e6] rounded-2xl p-4 sm:p-6 shadow-2xs">
              <div className="flex items-center gap-2 pb-3 border-b border-[#f1f5f9] mb-4">
                <Building2 className="w-4 h-4 text-[#2563eb]" />
                <h3 className="text-sm font-bold text-[#111111]">Dados Bancários (TED / DOC)</h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-[#f1f5f9]">
                  <span className="text-[#64748b]">Banco:</span>
                  <strong className="text-[#111111] font-semibold">{supplier.bank || '—'}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f1f5f9]">
                  <span className="text-[#64748b]">Agência:</span>
                  <strong className="font-mono text-[#111111]">{supplier.agency || '—'}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f1f5f9]">
                  <span className="text-[#64748b]">Conta Corrente:</span>
                  <strong className="font-mono text-[#111111]">{supplier.account || '—'}</strong>
                </div>
                <div className="flex justify-between py-1.5 border-b border-[#f1f5f9]">
                  <span className="text-[#64748b]">Titular da Conta:</span>
                  <strong className="text-[#111111]">{supplier.name}</strong>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-[#64748b]">Condição de Pagamento:</span>
                  <strong className="text-[#16a34a] font-bold">{supplier.payment_terms || 'À vista'}</strong>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ABA 4: CATÁLOGOS & ARQUIVOS */}
        <TabsContent value="catalogos">
          <div className="bg-white border border-[#e6e6e6] rounded-2xl p-4 sm:p-6 shadow-2xs">
            <div className="pb-3 mb-4 border-b border-[#f1f5f9]">
              <h3 className="text-sm sm:text-base font-bold text-[#111111]">Catálogos e Tabelas de Preço</h3>
              <p className="text-xs text-[#666666] mt-0.5">
                Faça upload de arquivos PDF, tabelas e catálogos de produtos deste fornecedor.
              </p>
            </div>
            <SupplierCatalogsEditor supplierId={supplier.id} />
          </div>
        </TabsContent>

        {/* ABA 5: HISTÓRICO / LINHA DO TEMPO */}
        <TabsContent value="historico">
          <div className="bg-white border border-[#e6e6e6] rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 sm:p-5 border-b border-[#f1f5f9]">
              <h3 className="text-sm font-bold text-[#111111]">Linha do Tempo de Atividades</h3>
              <p className="text-xs text-[#666666] mt-0.5">Histórico recente de pedidos e compras realizadas.</p>
            </div>

            <div className="divide-y divide-[#f1f5f9]">
              {supplier.timeline.length === 0 ? (
                <div className="p-8 text-center text-[#888888] text-xs">
                  Nenhuma atividade registrada até o momento.
                </div>
              ) : (
                supplier.timeline.map((h, i) => (
                  <div key={i} className="p-3.5 flex items-start gap-3 hover:bg-[#fafafa] transition-colors">
                    <div className="w-2 h-2 rounded-full bg-[#1f2328] mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-[#111111]">{h.action}</p>
                      <p className="text-xs text-[#64748b] mt-0.5">{h.details}</p>
                    </div>
                    <div className="text-right text-xs text-[#94a3b8] shrink-0">
                      <div>{h.date}</div>
                      <div>{h.time}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Confirmação com EXCLUIR */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        itemName={supplier.name}
        description="Esta ação excluirá o fornecedor permanentemente do sistema TEKNIX."
        actionWord="EXCLUIR"
        actionTitle="Excluir Fornecedor"
        buttonText="Sim, Excluir"
      />
    </div>
  )
}
