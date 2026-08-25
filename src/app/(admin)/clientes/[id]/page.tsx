'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Phone, MapPin, ShoppingCart,
  Package, ExternalLink, ShieldCheck, 
  MessageSquare, Clock, HelpCircle, CheckCircle2,
  Truck, FileText, Send, Share2, Zap, Loader2, RefreshCw, CheckCheck,
  Calendar, Printer
} from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import ShareContextModal from '@/components/internal-chat/ShareContextModal'
import { useNotification } from '@/contexts/NotificationContext'

const QUICK_TEMPLATES = [
  'Olá! Seu pedido já está sendo preparado com muito cuidado e será enviado rapidamente.',
  'Trabalhamos apenas com produtos 100% originais, novos, lacrados e com Nota Fiscal.',
  'Qualquer dúvida sobre a instalação ou uso do produto, estamos à disposição por aqui!',
  'Recebemos sua solicitação e já estamos providenciando o suporte para você.'
]

function formatBRL(val: number) {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ClienteProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { notify } = useNotification()
  const rawId = typeof params?.id === 'string' ? decodeURIComponent(params.id) : ''
  const [activeTab, setActiveTab] = useState<'pedidos' | 'mensagens' | 'perguntas' | 'historico'>('pedidos')
  const [showShareModal, setShowShareModal] = useState(false)

  // Chat states
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [loadingChat, setLoadingChat] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)
  const chatLenRef = useRef(0)

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
  const selectedOrder = orders.find(o => (o.order_id || o.id) === selectedOrderId) || firstOrder
  const customerName = firstOrder?.customer_name || rawId || 'Cliente'
  const customerPhone = firstOrder?.customer_phone || '—'
  const customerAddress = firstOrder?.notes || firstOrder?.shipping_address || firstOrder?.shipping_city ? `${firstOrder?.shipping_city || ''} - ${firstOrder?.shipping_state || 'BR'}` : 'Rua Jaime Avelino 105, Guarulhos - SP'

  const totalSpent = orders.reduce((a, b) => a + Number(b.total_amount || 0), 0)
  const totalItems = orders.reduce((a, b) => a + (b.order_items?.reduce((x: number, y: any) => x + Number(y.quantity || 1), 0) || 1), 0)
  const avgTicket = orders.length > 0 ? totalSpent / orders.length : 0

  const channels = Array.from(new Set(orders.map(o => (o.marketplaces as any)?.name || 'Mercado Livre')))

  // ── Real chat fetch ────────────────────────────────────────────────────────
  const fetchChatMessages = useCallback(async (orderId: string) => {
    setLoadingChat(true)
    try {
      const res = await fetch(`/api/mercadolivre/messages?order_id=${orderId}`)
      if (!res.ok) throw new Error('Erro ao carregar mensagens')
      const data = await res.json()
      const msgs = data.conversations?.[0]?.messages || data.messages || []
      const prevLen = chatLenRef.current
      chatLenRef.current = msgs.length
      setChatMessages(msgs)
      // Só rola p/ o fim quando chega mensagem nova
      if (msgs.length > prevLen) {
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80)
      }
    } catch (e) {
      setChatMessages([])
    } finally {
      setLoadingChat(false)
    }
  }, [])

  // ── Polling em tempo real (2s) enquanto a aba Chat está aberta ─────────────
  useEffect(() => {
    if (activeTab === 'mensagens' && selectedOrderId) {
      const iv = setInterval(() => {
        if (typeof document !== 'undefined' && !document.hidden) {
          fetchChatMessages(selectedOrderId)
        }
      }, 2000)
      return () => clearInterval(iv)
    }
  }, [activeTab, selectedOrderId, fetchChatMessages])

  // Select first order when tab opens
  useEffect(() => {
    if (activeTab === 'mensagens' && orders.length > 0 && !selectedOrderId) {
      const firstId = orders[0]?.order_id || orders[0]?.id
      setSelectedOrderId(firstId)
      fetchChatMessages(firstId)
    }
  }, [activeTab, orders.length])

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    fetchChatMessages(orderId)
  }

  const handleSendMessage = async () => {
    const text = messageInput.trim()
    if (!selectedOrderId || !text) return
    setSending(true)
    try {
      const res = await fetch('/api/mercadolivre/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: selectedOrderId, text })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar')
      setMessageInput('')
      setShowTemplates(false)
      notify({ type: 'success', title: 'Mensagem Enviada!', message: 'Comprador notificado no chat do Mercado Livre.' })
      fetchChatMessages(selectedOrderId)
    } catch (err: any) {
      notify({ type: 'error', title: 'Erro no Envio', message: err.message })
    } finally {
      setSending(false)
    }
  }

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
      title: `Pedido Realizado #${firstOrder?.order_number || 'MLB-NOVO'}`,
      description: `Compra aprovada no valor de ${formatBRL(Number(firstOrder?.total_amount || 0))} via Mercado Livre.`,
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
                  className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
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
                { id: 'mensagens', label: 'Chat ML', icon: MessageSquare, count: chatMessages.length },
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
                        ? 'bg-[#16a34a] text-white shadow-sm'
                        : 'text-[#666] hover:bg-[#f1f5f9] hover:text-[#111]'
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
                      unit_price: ord.total_amount || 0,
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
                                className="text-[14px] font-extrabold text-[#111] hover:text-[#1f2328] hover:underline font-mono"
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] border border-[#e2e8f0] text-[11px] font-bold transition-colors"
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
                                      className="text-[12px] font-bold text-[#111] hover:text-[#1f2328] hover:underline truncate block"
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

            {/* Conteúdo Aba 2: Chat Mercado Livre (Experiência completa de Atendimento) */}
            {activeTab === 'mensagens' && (
              <div className="flex flex-col">
                {/* Seletor de pedido */}
                {orders.length > 1 && (
                  <div className="px-5 pt-4 pb-3 border-b border-[#eee] flex items-center gap-3 flex-wrap">
                    <span className="text-[11px] font-bold text-[#888]">Pedido:</span>
                    {orders.map(ord => (
                      <button
                        key={ord.id}
                        onClick={() => handleSelectOrder(ord.order_id || ord.id)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          selectedOrderId === (ord.order_id || ord.id)
                            ? 'bg-[#16a34a] text-white'
                            : 'bg-[#f1f5f9] text-[#333] hover:bg-[#e2e8f0]'
                        }`}
                      >
                        #{ord.order_number || ord.id}
                      </button>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden" style={{ minHeight: 560 }}>
                  {/* ── Coluna Chat ─────────────────────────────────────────── */}
                  <div className="lg:col-span-8 flex flex-col border-r border-[#eee]">
                    {/* Header do Chat */}
                    <div className="p-3.5 bg-white border-b border-[#eee] flex items-center justify-between shadow-2xs z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#f5f5f5] border border-[#d0e4ff] flex items-center justify-center font-bold text-[#1f2328] text-[13px]">
                          {customerName.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-[14px] font-bold text-[#1f2328] flex items-center gap-2">
                            <span>{customerName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFE600] text-[#111]">Mercado Livre</span>
                          </h3>
                          <div className="flex items-center gap-2 text-[11px] text-[#666]">
                            <span className="text-[#38a169] font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#38a169] animate-pulse" /> Online no Chat
                            </span>
                            <span>•</span>
                            <span>Venda #{selectedOrder?.order_number || selectedOrderId}</span>
                          </div>
                        </div>
                      </div>
                      {selectedOrderId && (
                        <div className="flex items-center gap-2">
                          <a
                            href={`https://vendedores.mercadolivre.com.br/vendas/nova/mensagens/${selectedOrderId}?source=notification`}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-[#e6e6e6] bg-[#f8f9fa] hover:bg-[#f0f0f0] text-[#333] flex items-center gap-1.5 transition-colors"
                          >
                            <span>Abrir no ML</span>
                            <ExternalLink className="w-3.5 h-3.5 text-[#666]" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Mensagens */}
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#f8f9fa]" style={{ minHeight: 320 }}>
                      <div className="text-center mb-2">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#e6e6e6] text-[#666] shadow-2xs">Hoje</span>
                      </div>
                      {loadingChat ? (
                        <div className="flex items-center justify-center h-40">
                          <Loader2 className="w-6 h-6 animate-spin text-[#1f2328]" />
                        </div>
                      ) : chatMessages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center">
                          <MessageSquare className="w-10 h-10 text-[#ddd] mb-2" />
                          <p className="text-[12px] font-bold text-[#999]">Nenhuma mensagem encontrada</p>
                          <p className="text-[11px] text-[#bbb] mt-0.5">As mensagens do Mercado Livre aparecerão aqui.</p>
                        </div>
                      ) : (
                        chatMessages.map((m: any, idx: number) => {
                          const isMe = m.from?.user_id === 470831049
                          const time = m.message_date?.created
                            ? new Date(m.message_date.created).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                            : ''
                          return (
                            <div key={m.id || idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                              <div className={`max-w-[82%] p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-xs relative ${
                                isMe
                                  ? 'bg-[#1f2328] text-white rounded-tr-none'
                                  : 'bg-white border border-[#e6e6e6] text-[#222] rounded-tl-none'
                              }`}>
                                <p className="whitespace-pre-wrap">{m.text}</p>
                                <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-white/80' : 'text-[#999]'}`}>
                                  <span>{time}</span>
                                  {isMe && <CheckCheck className="w-3.5 h-3.5 text-white" />}
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={chatBottomRef} />
                    </div>

                    {/* Templates rápidos */}
                    {showTemplates && (
                      <div className="px-4 py-3 border-t border-[#eee] bg-white space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#666] mb-1">
                          <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5 text-[#f59e0b]" /> Respostas Rápidas:</span>
                          <button onClick={() => setShowTemplates(false)} className="text-[#999] hover:text-[#333]">✕</button>
                        </div>
                        {QUICK_TEMPLATES.map((tmpl, i) => (
                          <button
                            key={i}
                            onClick={() => { setMessageInput(tmpl); setShowTemplates(false) }}
                            className="w-full text-left p-2 rounded-xl text-[11px] text-[#333] hover:bg-[#f5f5f5] border border-[#eee] transition-colors"
                          >
                            "{tmpl}"
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Input de resposta */}
                    <div className="px-4 pb-4 pt-3 border-t border-[#eee] bg-white space-y-2 shadow-sm">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setShowTemplates(!showTemplates)}
                          className="p-2 rounded-xl border border-[#e6e6e6] hover:bg-[#f5f5f5] text-[#666] transition-colors"
                          title="Respostas Rápidas"
                        >
                          <Zap className="w-4 h-4 text-[#f59e0b]" />
                        </button>
                        <input
                          type="text"
                          placeholder="Escreva ao comprador..."
                          value={messageInput}
                          onChange={e => setMessageInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage() } }}
                          maxLength={350}
                          className="flex-1 h-11 px-4 rounded-xl border border-[#d0d7de] bg-[#f8f9fa] text-[13px] text-[#333] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#1f2328]/20 focus:border-[#1f2328] transition-all"
                        />
                        <button
                          onClick={handleSendMessage}
                          disabled={sending || !messageInput.trim()}
                          className="w-11 h-11 bg-[#1f2328] hover:bg-[#111827] text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                        >
                          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#999] px-1">
                        <span className="flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-[#38a169]" /> Não inclua dados pessoais, linguagem ofensiva ou links externos.
                        </span>
                        <span>{messageInput.length}/350</span>
                      </div>
                    </div>
                  </div>

                  {/* ── Coluna Detalhe do Pedido ──────────────────────────── */}
                  <div className="hidden lg:flex lg:col-span-4 flex-col bg-white p-4 space-y-4 overflow-y-auto">
                    {selectedOrder ? (
                      (() => {
                        const ord = selectedOrder
                        const rawItems = ord.order_items || []
                        const it = rawItems.length > 0 ? rawItems[0] : null
                        const prod = it?.products || null
                        const pic = prod?.image_url || it?.image_url || 'https://http2.mlstatic.com/D_NQ_NP_2X_789396-MLB78028328731_072024-F.webp'
                        const prodTitle = prod?.name || it?.product_name || ord.product_name || 'Produto do Pedido'
                        const sku = it?.sku || prod?.sku || ord.sku || ''
                        const isCancelled = String(ord.status || '').toUpperCase() === 'CANCELADO'
                        return (
                          <>
                            <div>
                              <div className="text-[11px] font-extrabold uppercase text-[#999] tracking-wider">Detalhe da Venda</div>
                              <div className="text-[15px] font-black text-[#1f2328] mt-0.5">Venda #{ord.order_number || ord.id}</div>
                              <p className="text-[11px] text-[#888]">{ord.created_at ? new Date(ord.created_at).toLocaleString('pt-BR') : ''}</p>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#e6e6e6] space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-[#666]">Status do Pacote</span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                  isCancelled ? 'bg-[#ffebee] text-[#e74c3c]' : 'bg-[#f0fff4] text-[#276749]'
                                }`}>
                                  {isCancelled ? 'Envio cancelado' : 'Pronto para envio'}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#555]">
                                {isCancelled ? 'Esta compra foi cancelada a pedido do comprador.' : 'Pronto para emitir a Declaração de Conteúdo (DC-e) e imprimir etiqueta.'}
                              </p>
                            </div>

                            <div className="space-y-2">
                              <span className="text-[11px] font-extrabold uppercase text-[#999] tracking-wider">Produto do Pacote</span>
                              <div className="p-3 rounded-xl border border-[#e6e6e6] bg-[#fafafa] space-y-2.5">
                                <div className="flex items-start gap-2.5">
                                  <img src={pic} alt={prodTitle} className="w-12 h-12 object-contain rounded-lg border border-[#eee] bg-white p-1 shrink-0" />
                                  <div className="min-w-0">
                                    <h5 className="text-[12px] font-bold text-[#222] line-clamp-2 leading-snug">{prodTitle}</h5>
                                    <p className="text-[10px] text-[#888] mt-0.5">SKU: {sku || '—'}</p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-[#eee]">
                                  <span className="text-[10px] font-semibold text-[#888]">{it?.quantity || 1} unidade(s)</span>
                                  <span className="text-[13px] font-extrabold text-[#27ae60]">{formatBRL(Number(it?.unit_price || ord.total_amount || 0))}</span>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-2 pt-2">
                              <span className="text-[11px] font-extrabold uppercase text-[#999] tracking-wider">Ações Rápidas</span>
                              <Link href={`/pedidos/${ord.id}`} className="w-full py-2 px-3 rounded-xl border border-[#e6e6e6] bg-[#f8f9fa] hover:bg-[#f0f0f0] text-[11px] font-bold text-[#333] flex items-center justify-between transition-colors">
                                <span className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-[#666]" /> Ver Detalhes no Pedidos</span>
                                <span>→</span>
                              </Link>
                              {sku && (
                                <a href={`https://produto.mercadolivre.com.br/${sku}`} target="_blank" rel="noreferrer" className="w-full py-2 px-3 rounded-xl border border-[#e6e6e6] bg-[#f8f9fa] hover:bg-[#f0f0f0] text-[11px] font-bold text-[#333] flex items-center justify-between transition-colors">
                                  <span className="flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5 text-[#666]" /> Ver Anúncio no Mercado Livre</span>
                                  <span>↗</span>
                                </a>
                              )}
                            </div>
                          </>
                        )
                      })()
                    ) : (
                      <div className="p-8 text-center my-auto">
                        <Package className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
                        <p className="text-[11px] text-[#888]">Selecione um pedido para ver os dados da venda.</p>
                      </div>
                    )}
                  </div>
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
                      <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-[#16a34a] border-2 border-white shadow-xs" />
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
