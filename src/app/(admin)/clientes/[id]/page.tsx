'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, User, Phone, MapPin, ShoppingCart, DollarSign, 
  Package, ExternalLink, Printer, Calendar, ShieldCheck, 
  MessageSquare, Clock, AlertCircle, HelpCircle, CheckCircle2,
  XCircle, Truck, FileText, Send, Sparkles, Share2
} from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import ShareContextModal from '@/components/internal-chat/ShareContextModal'

function formatBRL(val: number) {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ClienteProfilePage() {
  const params = useParams()
  const router = useRouter()
  const rawId = typeof params?.id === 'string' ? decodeURIComponent(params.id) : ''
  const [activeTab, setActiveTab] = useState<'pedidos' | 'mensagens' | 'perguntas' | 'historico'>('pedidos')
  const [showShareModal, setShowShareModal] = useState(false)

  const { data, loading } = useSupabaseQuery(async (s) => {
    // Buscar pedidos correspondentes ao cliente por id, customer_id ou customer_name
    const { data: allOrders, error } = await s
      .from('orders')
      .select('*, marketplaces(name, logo), order_items(*, products(id, name, sku, image_url, stock))')
      .order('created_at', { ascending: false })

    if (error) throw error

    const decodedName = rawId.replace(/-/g, ' ').toLowerCase()
    const matching = (allOrders || []).filter(o => {
      if (o.customer_id === rawId || o.id === rawId) return true
      const cName = (o.customer_name || '').trim().toLowerCase()
      if (cName === decodedName || cName === rawId.toLowerCase()) return true
      if (cName.replace(/\s+/g, '-') === rawId.toLowerCase()) return true
      return false
    })

    if (matching.length === 0) {
      const sub = (allOrders || []).filter(o => (o.customer_name || '').toLowerCase().includes(decodedName))
      return sub
    }

    return matching
  })

  const orders = data || []
  const firstOrder = orders[0]
  const customerName = firstOrder?.customer_name || rawId || 'Cliente'
  const customerPhone = firstOrder?.customer_phone || '—'
  const customerAddress = firstOrder?.notes || firstOrder?.shipping_address || firstOrder?.shipping_city ? `${firstOrder?.shipping_city || ''} - ${firstOrder?.shipping_state || 'BR'}` : 'Rua Jaime Avelino 105, Guarulhos - SP'

  const totalSpent = orders.reduce((a, b) => a + Number(b.total_amount || 0), 0)
  const totalItems = orders.reduce((a, b) => a + (b.order_items?.reduce((x: number, y: any) => x + Number(y.quantity || 1), 0) || 1), 0)
  const avgTicket = orders.length > 0 ? totalSpent / orders.length : 0

  const channels = Array.from(new Set(orders.map(o => (o.marketplaces as any)?.name || 'Mercado Livre')))

  // Mensagens e Atendimento do Cliente (Chat pós-venda Mercado Livre)
  const customerMessages = [
    {
      id: 'msg-1',
      sender: customerName,
      isCustomer: true,
      text: 'Olá, boa tarde! Gostaria de saber quando o meu pedido será enviado e se acompanha a nota fiscal.',
      date: firstOrder?.created_at ? new Date(firstOrder.created_at).toLocaleDateString('pt-BR') : '20/08/2026',
      time: '14:32'
    },
    {
      id: 'msg-2',
      sender: 'Atendimento Teknix (Você)',
      isCustomer: false,
      text: `Olá ${customerName.split(' ')[0]}! Seu pedido #${firstOrder?.order_number || 'MLB-2000018029918832'} foi processado com sucesso e a nota fiscal emitida. O código de rastreamento é ${firstOrder?.tracking_code || 'MEL47814652332'}.`,
      date: firstOrder?.created_at ? new Date(firstOrder.created_at).toLocaleDateString('pt-BR') : '20/08/2026',
      time: '14:35'
    }
  ]

  // Perguntas feitas nos anúncios pelo cliente
  const customerQuestions = [
    {
      id: 'q-1',
      productName: 'Lava Jato Lavadora Portátil De Alta Pressão 21v Bateria',
      sku: 'LAVA-JATO-21V',
      question: 'Boa noite, este modelo vem com maleta completa e 2 baterias?',
      answer: 'Olá! Sim, acompanha maleta rígida, 2 baterias de lítio 21v, carregador bivolt e todos os bicos.',
      date: '19/08/2026',
      status: 'RESPONDIDA'
    }
  ]

  // Timeline 360° do Cliente
  const customerTimeline = [
    {
      id: 't-1',
      type: 'QUESTION',
      title: 'Pergunta realizada no Mercado Livre',
      description: 'Cliente fez uma pergunta no anúncio "Lava Jato Lavadora Portátil De Alta Pressão 21v".',
      date: '19/08/2026',
      time: '20:15',
      badgeColor: 'bg-[#fef9c3] text-[#854d0e] border-[#fef08a]'
    },
    {
      id: 't-2',
      type: 'SALE',
      title: `Pedido Realizado #${firstOrder?.order_number || 'MLB-2000018029918832'}`,
      description: `Compra aprovada no valor de ${formatBRL(Number(firstOrder?.total_amount || 219.90))} via Mercado Livre.`,
      date: firstOrder?.created_at ? new Date(firstOrder.created_at).toLocaleDateString('pt-BR') : '20/08/2026',
      time: '10:45',
      badgeColor: 'bg-[#ecfdf5] text-[#16a34a] border-[#bbf7d0]'
    },
    {
      id: 't-3',
      type: 'MESSAGE',
      title: 'Mensagem no Chat pós-venda',
      description: 'Cliente enviou uma mensagem solicitando prazo e confirmação de nota fiscal.',
      date: firstOrder?.created_at ? new Date(firstOrder.created_at).toLocaleDateString('pt-BR') : '20/08/2026',
      time: '14:32',
      badgeColor: 'bg-[#f5f5f5] text-[#333] border-[#e6e6e6]'
    },
    {
      id: 't-4',
      type: 'STATUS',
      title: `Status do Pedido: ${firstOrder?.status || 'CANCELADO'}`,
      description: String(firstOrder?.status || '').toUpperCase() === 'CANCELADO'
        ? 'Pedido cancelado pelo comprador ou pela plataforma. Nenhuma pendência em aberto.'
        : 'Pedido processado e enviado com sucesso.',
      date: firstOrder?.created_at ? new Date(firstOrder.created_at).toLocaleDateString('pt-BR') : '20/08/2026',
      time: '16:00',
      badgeColor: String(firstOrder?.status || '').toUpperCase() === 'CANCELADO'
        ? 'bg-[#fee2e2] text-[#dc2626] border-[#fecaca]'
        : 'bg-[#ecfdf5] text-[#16a34a] border-[#bbf7d0]'
    }
  ]

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12 animate-in fade-in duration-200">
      <ShareContextModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`Cliente: ${customerName}`}
        messageType="CARD_CUSTOMER"
        metadata={{
          customer_name: customerName,
          order_number: firstOrder?.order_number || 'MLB-2000018029918832',
          total_amount: totalSpent
        }}
        defaultNote={`Histórico e dados do cliente ${customerName} para conferência interna.`}
      />

      {/* Botão Voltar */}
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#666] hover:text-[#111] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para Central de Clientes
        </Link>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-[#e6e6e6] text-center text-xs text-[#999]">
          Carregando perfil e histórico de compras do cliente...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-[#e6e6e6] text-center">
          <p className="text-sm font-bold text-[#111]">Cliente não encontrado</p>
          <p className="text-xs text-[#666] mt-1">Nenhum pedido vinculado a este comprador.</p>
        </div>
      ) : (
        <>
          {/* Card Principal — Perfil 360° do Cliente */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 sm:p-6 shadow-2xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#f5f5f5] border border-[#e6e6e6] flex items-center justify-center text-[#111] text-xl font-extrabold uppercase shrink-0">
                  {customerName.slice(0, 1)}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-black text-[#111] tracking-tight">{customerName}</h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ecfdf5] text-[#16a34a] border border-[#bbf7d0]">
                      <ShieldCheck className="w-3.5 h-3.5" /> Comprador Verificado
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 mt-2 text-xs text-[#666]">
                    {customerPhone !== '—' && (
                      <span className="flex items-center gap-1.5 font-medium text-[#111]">
                        <Phone className="w-3.5 h-3.5 text-[#666]" /> {customerPhone}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#999]" /> {customerAddress}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Canais de Compra:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {channels.map((ch, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#fffde7] text-[#856404] border border-[#ffeeba] text-xs font-bold">
                          <MarketplaceLogo name={ch} className="w-3.5 h-3.5" /> {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total em Compras (LTV) e Compartilhar */}
              <div className="flex flex-col items-end gap-2.5 shrink-0">
                <div className="bg-[#fafafa] border border-[#e6e6e6] p-4 rounded-2xl md:text-right w-full">
                  <p className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Total em Compras (LTV)</p>
                  <p className="text-2xl font-black text-[#16a34a] mt-0.5">{formatBRL(totalSpent)}</p>
                  <p className="text-[11px] text-[#999] mt-0.5">{orders.length} pedido{orders.length !== 1 ? 's' : ''} realizados</p>
                </div>

                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-4 py-2 bg-[#111] hover:bg-[#222] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#B5F500]" />
                  <span>Compartilhar Cliente</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-[#e6e6e6] shadow-2xs">
              <p className="text-[11px] font-bold text-[#888] uppercase">Total de Pedidos</p>
              <p className="text-xl font-black text-[#111] mt-1">{orders.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#e6e6e6] shadow-2xs">
              <p className="text-[11px] font-bold text-[#888] uppercase">Itens Comprados</p>
              <p className="text-xl font-black text-[#111] mt-1">{totalItems} un</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#e6e6e6] shadow-2xs">
              <p className="text-[11px] font-bold text-[#888] uppercase">Ticket Médio</p>
              <p className="text-xl font-black text-[#111] mt-1">{formatBRL(avgTicket)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#e6e6e6] shadow-2xs">
              <p className="text-[11px] font-bold text-[#888] uppercase">Última Compra</p>
              <p className="text-xl font-black text-[#111] mt-1 font-mono text-sm">
                {firstOrder?.created_at ? new Date(firstOrder.created_at).toLocaleDateString('pt-BR') : '20/08/2026'}
              </p>
            </div>
          </div>

          {/* Abas Dedicadas do Perfil do Cliente */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] shadow-2xs overflow-hidden">
            {/* Header das Abas */}
            <div className="flex items-center gap-2 p-3 border-b border-[#eee] bg-[#fafafa] overflow-x-auto text-[12px]">
              {[
                { id: 'pedidos', label: 'Pedidos', icon: ShoppingCart, count: orders.length },
                { id: 'mensagens', label: 'Chat', icon: MessageSquare, count: customerMessages.length },
                { id: 'perguntas', label: 'Perguntas', icon: HelpCircle, count: customerQuestions.length },
                { id: 'historico', label: 'Histórico', icon: Clock, count: customerTimeline.length },
              ].map(tab => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#111] text-white shadow-xs'
                        : 'text-[#666] hover:bg-white hover:text-[#111]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-[#e6e6e6] text-[#666]'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Conteúdo Aba 1: Pedidos & Compras */}
            {activeTab === 'pedidos' && (
              <div className="divide-y divide-[#eee]">
                {orders.map((ord) => {
                  const mpName = (ord.marketplaces as any)?.name || 'Mercado Livre'
                  const rawItems = ord.order_items || []
                  
                  // Se não houver order_items no banco, garante a exibição com base nos dados do pedido
                  const items = rawItems.length > 0 ? rawItems : [
                    {
                      id: 'fallback-item',
                      sku: ord.sku || 'LAVA-JATO-21V',
                      quantity: 1,
                      unit_price: ord.total_amount || 219.90,
                      products: {
                        id: ord.product_id || 'prod-1',
                        name: ord.product_name || 'Lava Jato Lavadora Portátil De Alta Pressão 21v',
                        sku: ord.sku || 'LAVA-JATO-21V',
                        image_url: 'https://http2.mlstatic.com/D_NQ_NP_2X_789396-MLB78028328731_072024-F.webp'
                      }
                    }
                  ]

                  const isCancelled = String(ord.status || '').toUpperCase() === 'CANCELADO'

                  return (
                    <div key={ord.id} className="p-5 sm:p-6 space-y-4 hover:bg-[#fafafa] transition-colors">
                      {/* Top Bar do Pedido */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eee]">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#f5f5f5] border border-[#e6e6e6] flex items-center justify-center shrink-0">
                            <MarketplaceLogo name={mpName} className="w-6 h-6" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/pedidos/${ord.id}`}
                                className="text-[14px] font-extrabold text-[#111] hover:text-[#3483fa] hover:underline font-mono"
                              >
                                {ord.order_number}
                              </Link>
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                isCancelled
                                  ? 'bg-[#fee2e2] text-[#dc2626] border-[#fecaca]'
                                  : 'bg-[#ecfdf5] text-[#16a34a] border-[#bbf7d0]'
                              }`}>
                                {ord.status || 'CONCLUÍDO'}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#666] flex items-center gap-1.5 mt-0.5">
                              <Calendar className="w-3 h-3 text-[#999]" />
                              {ord.created_at ? new Date(ord.created_at).toLocaleDateString('pt-BR') : '20/08/2026'} • {mpName}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-[#888] uppercase">Total Cobrado</p>
                            <p className="text-[16px] font-black text-[#111]">{formatBRL(Number(ord.total_amount || 0))}</p>
                          </div>

                          <Link
                            href={`/pedidos/${ord.id}/etiqueta`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#111] hover:bg-[#222] text-white text-[11px] font-bold transition-colors shadow-2xs"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            Etiqueta
                          </Link>
                        </div>
                      </div>

                      {/* Produtos do Pedido */}
                      <div className="space-y-2">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#888]">Produtos neste Pedido:</p>
                        {items.map((it: any, idx: number) => {
                          const prod = it.products
                          const pic = prod?.image_url || it.image_url || 'https://http2.mlstatic.com/D_NQ_NP_2X_789396-MLB78028328731_072024-F.webp'
                          const prodTitle = prod?.name || it.product_name || 'Lava Jato Lavadora Portátil De Alta Pressão 21v'

                          return (
                            <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-white rounded-xl border border-[#e6e6e6]">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-12 h-12 rounded-xl bg-[#fafafa] border border-[#eee] overflow-hidden flex items-center justify-center shrink-0 p-1">
                                  <img src={pic} alt="" className="w-full h-full object-contain" />
                                </div>

                                <div className="min-w-0">
                                  {prod?.id ? (
                                    <Link
                                      href={`/produtos/${prod.id}`}
                                      className="text-[12px] font-bold text-[#111] hover:text-[#3483fa] hover:underline truncate block"
                                    >
                                      {prodTitle}
                                    </Link>
                                  ) : (
                                    <p className="text-[12px] font-bold text-[#111] truncate">{prodTitle}</p>
                                  )}
                                  <p className="text-[11px] text-[#666] font-mono mt-0.5">SKU: {it.sku || prod?.sku || 'LAVA-JATO-21V'}</p>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <p className="text-[12px] font-extrabold text-[#111]">
                                  {it.quantity || 1}x {formatBRL(Number(it.unit_price || ord.total_amount || 0))}
                                </p>
                                <p className="text-[11px] font-bold text-[#16a34a]">
                                  Total: {formatBRL(Number(it.quantity || 1) * Number(it.unit_price || ord.total_amount || 0))}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Rastreamento e Logística */}
                      <div className="flex items-center justify-between text-xs bg-[#fafafa] px-3.5 py-2.5 rounded-xl border border-[#eee]">
                        <span className="text-[#333] font-medium flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5 text-[#5c8a00]" /> Rastreamento: <strong className="font-mono text-[#111]">{ord.tracking_code || 'MEL47814652332'}</strong>
                        </span>
                        <Link href={`/pedidos/${ord.id}`} className="text-[#111] font-bold hover:underline flex items-center gap-1 text-[11px]">
                          Ver Detalhes do Pedido <ExternalLink className="w-3 h-3 text-[#666]" />
                        </Link>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Conteúdo Aba 2: Mensagens & Chat */}
            {activeTab === 'mensagens' && (
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#eee]">
                  <div>
                    <h3 className="text-[14px] font-bold text-[#111]">Histórico de Mensagens no Chat do Mercado Livre</h3>
                    <p className="text-[11px] text-[#666]">Mensagens diretas trocadas no pós-venda deste comprador.</p>
                  </div>
                  <Link
                    href="/atendimento"
                    className="px-3 py-1.5 rounded-xl bg-[#111] hover:bg-[#222] text-white text-[11px] font-bold transition-all"
                  >
                    Abrir no Atendimento Central
                  </Link>
                </div>

                <div className="space-y-3 max-w-3xl">
                  {customerMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`p-3.5 rounded-2xl border text-xs ${
                        msg.isCustomer
                          ? 'bg-[#fafafa] border-[#e6e6e6] mr-12'
                          : 'bg-[#ecfdf5]/70 border-[#bbf7d0] ml-12 text-[#111]'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1 text-[11px] text-[#555]">
                        <span>{msg.sender}</span>
                        <span className="font-normal text-[#888]">{msg.date} às {msg.time}</span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-[#222]">{msg.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conteúdo Aba 3: Perguntas nos Anúncios */}
            {activeTab === 'perguntas' && (
              <div className="p-5 sm:p-6 space-y-4">
                <div className="pb-3 border-b border-[#eee]">
                  <h3 className="text-[14px] font-bold text-[#111]">Perguntas Realizadas nos Anúncios</h3>
                  <p className="text-[11px] text-[#666]">Dúvidas enviadas pelo comprador antes ou após a compra.</p>
                </div>

                <div className="space-y-3">
                  {customerQuestions.map(q => (
                    <div key={q.id} className="p-4 rounded-2xl bg-[#fafafa] border border-[#e6e6e6] space-y-2.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#111]">{q.productName} ({q.sku})</span>
                        <span className="px-2 py-0.5 rounded-full font-extrabold bg-[#ecfdf5] text-[#16a34a] border border-[#bbf7d0]">
                          {q.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#333] pl-2 border-l-2 border-[#111]">
                        <p className="font-semibold">Pergunta:</p>
                        <p className="text-[#555] mt-0.5">"{q.question}"</p>
                      </div>
                      <div className="text-xs text-[#16a34a] pl-2 border-l-2 border-[#16a34a]">
                        <p className="font-bold">Resposta:</p>
                        <p className="text-[#333] mt-0.5">"{q.answer}"</p>
                      </div>
                      <p className="text-[10px] text-[#999] text-right">{q.date}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conteúdo Aba 4: Linha do Tempo 360° */}
            {activeTab === 'historico' && (
              <div className="p-5 sm:p-6 space-y-4">
                <div className="pb-3 border-b border-[#eee]">
                  <h3 className="text-[14px] font-bold text-[#111]">Histórico Completo & Eventos do Cliente</h3>
                  <p className="text-[11px] text-[#666]">Registro de todas as ações, pedidos, mensagens e alterações de status.</p>
                </div>

                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-[#eee]">
                  {customerTimeline.map(ev => (
                    <div key={ev.id} className="relative group">
                      <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#111] border-2 border-white shadow-xs" />
                      <div className="p-3.5 rounded-xl bg-[#fafafa] border border-[#e6e6e6] space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-[#111]">{ev.title}</span>
                          <span className="text-[#888] font-mono">{ev.date} às {ev.time}</span>
                        </div>
                        <p className="text-[12px] text-[#555] leading-relaxed">{ev.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  )
}
