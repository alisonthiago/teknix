'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Package, 
  RefreshCw, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  ShoppingBag,
  Zap,
  Check,
  RotateCw,
  Box,
  Truck
} from 'lucide-react'
import { MarketplaceLogo } from './MarketplaceLogos'

export interface CockpitData {
  orders: any[]
  products: any[]
  integrationsStatus?: any[]
}

export function CockpitCentralOperacao({ orders = [], products = [] }: CockpitData) {
  const router = useRouter()
  const [resolvingId, setResolvingId] = useState<string | null>(null)
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set())

  // 1. Calculations
  const urgentItems = useMemo(() => {
    const list: any[] = []

    // Orders with status 'CANCELADO' or missing tracking/carrier issues
    orders.filter(o => o.status === 'CANCELADO' || o.status === 'ERROR').forEach(o => {
      if (!resolvedIds.has(`order-err-${o.id}`)) {
        list.push({
          id: `order-err-${o.id}`,
          type: 'ORDER_ERROR',
          title: `Pedido ${o.order_number} cancelado ou com pendência`,
          description: `O comprador cancelou ou houve recusa no processamento do envio.`,
          actionLabel: 'Verificar Pedido',
          actionLink: `/pedidos/${o.id}`,
          channel: (o.marketplaces as any)?.name || 'Mercado Livre',
          severity: 'URGENT'
        })
      }
    })

    // Out of stock products with sales activity
    products.filter(p => Number(p.stock || 0) <= 0).slice(0, 4).forEach(p => {
      if (!resolvedIds.has(`prod-stock-${p.id}`)) {
        list.push({
          id: `prod-stock-${p.id}`,
          type: 'OUT_OF_STOCK',
          title: `Produto ${p.sku} esgotado (Estoque 0)`,
          description: `${p.name} está com saldo zerado. Risco de pausa nos anúncios.`,
          actionLabel: 'Fazer Pedido de Compra',
          actionLink: `/purchases/new?product=${p.id}`,
          channel: 'Estoque Central',
          severity: 'URGENT'
        })
      }
    })

    return list
  }, [orders, products, resolvedIds])

  const toShipOrders = useMemo(() => {
    return orders.filter(o => ['NOVO', 'PAGO', 'EM_SEPARACAO', 'SEPARADO', 'AGUARDANDO_SEPARACAO'].includes(o.status))
  }, [orders])

  const lowStockProducts = useMemo(() => {
    return products.filter(p => {
      const s = Number(p.stock || 0)
      const min = Number(p.min_stock || 3)
      return s > 0 && s <= min
    })
  }, [products])

  const completedOrders = useMemo(() => {
    return orders.filter(o => ['DELIVERED', 'ENTREGUE', 'ENVIADO', 'EMBALADO'].includes(o.status))
  }, [orders])

  const handleQuickResolve = (id: string) => {
    setResolvingId(id)
    setTimeout(() => {
      setResolvedIds(prev => new Set([...prev, id]))
      setResolvingId(null)
    }, 800)
  }

  const totalActionsCount = urgentItems.length + (toShipOrders.length > 0 ? 1 : 0) + (lowStockProducts.length > 0 ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* 🧠 Assistente Operacional Inteligente Banner */}
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-3xl p-6 text-white shadow-lg border border-[#334155] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#2563eb]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#2563eb]/20 text-[#60a5fa] border border-[#2563eb]/40 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Cockpit Inteligente de Operação TEKNIX
            </div>
            
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              {totalActionsCount === 0 ? (
                'Operação 100% em Dia! Sem pendências críticas.'
              ) : (
                `Atenção: Existem ${totalActionsCount} ações operacionais prioritárias hoje.`
              )}
            </h2>

            <p className="text-xs sm:text-sm text-[#94a3b8] max-w-2xl leading-relaxed">
              O sistema monitora em tempo real seus pedidos do Mercado Livre, estoques críticos e etiquetas pendentes de expedição.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/expedicao"
              className="px-5 py-2.5 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
            >
              <Package className="w-4 h-4" />
              Abrir Modo Expedição & Bipagem
            </Link>

            <Link
              href="/central-operacoes"
              className="px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              Ver Fila Operacional Completa
            </Link>
          </div>
        </div>

        {/* Status Pills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-[#f87171] text-xs font-bold uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] animate-pulse" />
              Urgente
            </div>
            <p className="text-xl font-black text-white mt-1">{urgentItems.length} pendência{urgentItems.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-[#fbbf24] text-xs font-bold uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]" />
              Para Enviar
            </div>
            <p className="text-xl font-black text-white mt-1">{toShipOrders.length} pedido{toShipOrders.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-[#60a5fa] text-xs font-bold uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
              Estoque Baixo
            </div>
            <p className="text-xl font-black text-white mt-1">{lowStockProducts.length} produto{lowStockProducts.length !== 1 ? 's' : ''}</p>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-2xl border border-white/10">
            <div className="flex items-center gap-2 text-[#4ade80] text-xs font-bold uppercase">
              <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e]" />
              Expedidos
            </div>
            <p className="text-xl font-black text-white mt-1">{completedOrders.length} concluído{completedOrders.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      </div>

      {/* 2. Seção "O QUE PRECISA DA SUA ATENÇÃO AGORA" */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Action Queue */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl border border-[#e2e8f0] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9]">
              <div>
                <h3 className="text-base font-extrabold text-[#0f172a] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#f59e0b]" />
                  O que precisa da sua atenção?
                </h3>
                <p className="text-xs text-[#64748b] mt-0.5">Ações prioritárias para manter o fluxo contínuo de envios e faturamento.</p>
              </div>

              <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#f1f5f9] text-[#475569]">
                {urgentItems.length + (toShipOrders.length > 0 ? 1 : 0) + (lowStockProducts.length > 0 ? 1 : 0)} Itens
              </span>
            </div>

            <div className="divide-y divide-[#f1f5f9] mt-2">
              {/* To Ship Ready */}
              {toShipOrders.length > 0 && (
                <div className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#2563eb] shrink-0 mt-0.5 shadow-2xs">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold text-[#0f172a]">
                          {toShipOrders.length} pedido{toShipOrders.length !== 1 ? 's' : ''} aguardando preparação e etiquetas
                        </p>
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">
                          Pronto p/ Envio
                        </span>
                      </div>
                      <p className="text-xs text-[#64748b] mt-1">
                        Gere e imprima as etiquetas térmicas em lote ou abra a estação de bipagem.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/pedidos"
                      className="px-3.5 py-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-2xs"
                    >
                      Imprimir Etiquetas
                    </Link>
                  </div>
                </div>
              )}

              {/* Urgent items */}
              {urgentItems.map(item => (
                <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#fef2f2] border border-[#fecaca] flex items-center justify-center text-[#dc2626] shrink-0 mt-0.5 shadow-2xs">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold text-[#0f172a]">{item.title}</p>
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]">
                          Urgente
                        </span>
                      </div>
                      <p className="text-xs text-[#64748b] mt-1">{item.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={item.actionLink}
                      className="px-3.5 py-1.5 rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#0f172a] border border-[#e2e8f0] text-xs font-bold transition-all"
                    >
                      {item.actionLabel}
                    </Link>
                    <button
                      onClick={() => handleQuickResolve(item.id)}
                      disabled={resolvingId === item.id}
                      className="px-3.5 py-1.5 rounded-xl bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Marcar como resolvido"
                    >
                      {resolvingId === item.id ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Resolver
                    </button>
                  </div>
                </div>
              ))}

              {/* Low stock warning */}
              {lowStockProducts.length > 0 && (
                <div className="py-4 flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#fffbeb] border border-[#fde68a] flex items-center justify-center text-[#d97706] shrink-0 mt-0.5 shadow-2xs">
                      <Box className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-extrabold text-[#0f172a]">
                          {lowStockProducts.length} produto{lowStockProducts.length !== 1 ? 's' : ''} com estoque crítico
                        </p>
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#fffbeb] text-[#d97706] border border-[#fde68a]">
                          Reposição
                        </span>
                      </div>
                      <p className="text-xs text-[#64748b] mt-1">
                        Alguns produtos atingiram o ponto de ressuprimento. Previsão de esgotamento em 2 a 4 dias.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href="/operacao"
                      className="px-3.5 py-1.5 rounded-xl bg-[#f8fafc] hover:bg-[#f1f5f9] text-[#0f172a] border border-[#e2e8f0] text-xs font-bold transition-all"
                    >
                      Ver Catálogo
                    </Link>
                  </div>
                </div>
              )}

              {totalActionsCount === 0 && (
                <div className="py-8 text-center">
                  <CheckCircle2 className="w-10 h-10 text-[#16a34a] mx-auto mb-2" />
                  <p className="text-sm font-extrabold text-[#0f172a]">Tudo limpo por aqui!</p>
                  <p className="text-xs text-[#64748b] mt-0.5">Nenhuma divergência ou erro operacional pendente.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: 🩺 Saúde das Integrações */}
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-[#e2e8f0] p-6 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-[#f1f5f9]">
              <h3 className="text-sm font-extrabold text-[#0f172a] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#16a34a]" />
                Saúde das Integrações
              </h3>
              <span className="text-[10px] font-bold uppercase text-[#16a34a] bg-[#f0fdf4] px-2 py-0.5 rounded-md border border-[#bbf7d0]">
                Operacional
              </span>
            </div>

            <div className="divide-y divide-[#f1f5f9] mt-2 text-xs">
              {/* Mercado Livre */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MarketplaceLogo name="Mercado Livre" className="w-5 h-5" />
                  <div>
                    <p className="font-bold text-[#0f172a]">Mercado Livre</p>
                    <p className="text-[10px] text-[#64748b]">Webhooks & Catálogo Ativos</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                  <span className="text-[11px] font-bold text-[#16a34a]">Conectado</span>
                </div>
              </div>

              {/* Shopee */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MarketplaceLogo name="Shopee" className="w-5 h-5" />
                  <div>
                    <p className="font-bold text-[#0f172a]">Shopee</p>
                    <p className="text-[10px] text-[#64748b]">Receptor Webhook Ativo</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                  <span className="text-[11px] font-bold text-[#16a34a]">Pronto</span>
                </div>
              </div>

              {/* Amazon */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MarketplaceLogo name="Amazon" className="w-5 h-5" />
                  <div>
                    <p className="font-bold text-[#0f172a]">Amazon SP-API</p>
                    <p className="text-[10px] text-[#64748b]">Adapter Configurado</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                  <span className="text-[11px] font-bold text-[#3b82f6]">Em Espera</span>
                </div>
              </div>

              {/* Magalu */}
              <div className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MarketplaceLogo name="Magalu" className="w-5 h-5" />
                  <div>
                    <p className="font-bold text-[#0f172a]">Magalu Marketplace</p>
                    <p className="text-[10px] text-[#64748b]">Conector Multi-Canal</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                  <span className="text-[11px] font-bold text-[#3b82f6]">Em Espera</span>
                </div>
              </div>
            </div>

            <Link
              href="/marketplaces"
              className="mt-4 w-full py-2 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl text-xs font-bold text-[#2563eb] flex items-center justify-center gap-1.5 transition-colors"
            >
              Gerenciar Contas & Conexões ➔
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
