'use client'

import { useState, useEffect, useRef } from 'react'
import {
  MessageSquare,
  Send,
  ExternalLink,
  RefreshCw,
  Search,
  Package,
  ShoppingBag,
  Store,
  Check,
  CheckCheck,
  User,
  Clock,
  Loader2,
  Paperclip,
  Smile,
  Zap,
  Tag,
  ShieldCheck,
  FileText,
  Truck,
  AlertCircle,
  Bot,
  Sliders,
  Sparkles,
  Save,
  Plus
} from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { useNotification } from '@/contexts/NotificationContext'

interface MessageItem {
  id: string
  text: string
  from: { user_id: number }
  to: { user_id: number }
  message_date: {
    received?: string
    created?: string
    read?: string
  }
}

interface PostSaleConversation {
  order_id: string
  order_number: string
  customer_name: string
  total_amount: number
  status: string
  created_at: string
  conversation_status: any
  messages_count: number
  last_message: MessageItem
  messages: MessageItem[]
  product?: {
    title: string
    thumbnail: string
    price: number
    quantity: number
    sku: string
    shipping_status?: string
  }
}

interface AutomationRule {
  id: string
  trigger: string
  title: string
  description: string
  enabled: boolean
  marketplaces: string[]
  template: string
}

const QUICK_TEMPLATES = [
  'Olá! Seu pedido já está sendo preparado com muito cuidado e será enviado rapidamente.',
  'Trabalhamos apenas com produtos 100% originais, novos, lacrados e com Nota Fiscal.',
  'Qualquer dúvida sobre a instalação ou uso do produto, estamos à disposição por aqui!',
  'Recebemos sua solicitação e já estamos providenciando o suporte para você.'
]

export default function AtendimentoChatPage() {
  const { notify } = useNotification()
  const [mainView, setMainView] = useState<'CHAT' | 'AUTOMATIONS'>('CHAT')

  // Chat State
  const [conversations, setConversations] = useState<PostSaleConversation[]>([])
  const [selectedConv, setSelectedConv] = useState<PostSaleConversation | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [marketplaceFilter, setMarketplaceFilter] = useState<'ALL' | 'mercadolivre' | 'shopee' | 'amazon'>('ALL')
  const [messageInput, setMessageInput] = useState('')
  const [sending, setSending] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const chatBottomRef = useRef<HTMLDivElement>(null)

  // Automations State
  const [automations, setAutomations] = useState<AutomationRule[]>([])
  const [loadingAutomations, setLoadingAutomations] = useState(false)
  const [savingAutomations, setSavingAutomations] = useState(false)

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchConversations = async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    else setRefreshing(true)

    try {
      const res = await fetch('/api/mercadolivre/messages')
      if (!res.ok) throw new Error('Falha ao carregar mensagens')
      const data = await res.json()
      const convs = data.conversations || []

      const enrichedConvs: PostSaleConversation[] = convs.map((c: any) => ({
        ...c,
        product: {
          title: 'Lava Jato Lavadora Portátil De Alta Pressão',
          thumbnail: 'https://http2.mlstatic.com/D_NQ_NP_2X_789396-MLB78028328731_072024-F.webp',
          price: Number(c.total_amount) || 219.9,
          quantity: 1,
          sku: 'MLB5090385757',
          shipping_status: c.status === 'CANCELADO' ? 'Envio cancelado' : 'Pronto para envio'
        }
      }))

      setConversations(enrichedConvs)

      if (enrichedConvs.length > 0) {
        if (!selectedConv) {
          setSelectedConv(enrichedConvs[0])
        } else {
          const current = enrichedConvs.find(c => c.order_id === selectedConv.order_id)
          if (current) setSelectedConv(current)
        }
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchAutomations = async () => {
    setLoadingAutomations(true)
    try {
      const res = await fetch('/api/atendimento/automations')
      const data = await res.json()
      if (data.automations) {
        setAutomations(data.automations)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingAutomations(false)
    }
  }

  // 2-second background polling for Chat
  useEffect(() => {
    fetchConversations(false)
    fetchAutomations()
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchConversations(true)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedConv && mainView === 'CHAT') {
      scrollToBottom()
    }
  }, [selectedConv?.messages?.length, selectedConv?.order_id, mainView])

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || messageInput).trim()
    if (!selectedConv || !text) return

    setSending(true)
    try {
      const res = await fetch('/api/mercadolivre/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedConv.order_id,
          text
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar mensagem')

      // Optimistic update
      const newMsg: MessageItem = {
        id: 'temp-' + Date.now(),
        text,
        from: { user_id: 470831049 },
        to: { user_id: 31025195 },
        message_date: {
          created: new Date().toISOString()
        }
      }

      setSelectedConv(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMsg],
        last_message: newMsg
      } : null)

      setMessageInput('')
      setShowTemplates(false)
      notify({
        type: 'success',
        title: 'Mensagem Enviada!',
        message: 'O comprador recebeu no chat do Mercado Livre com sucesso.'
      })

      fetchConversations(true)
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Erro no Envio',
        message: err.message || 'Não foi possível enviar a mensagem.'
      })
    } finally {
      setSending(false)
    }
  }

  const handleSaveAutomations = async () => {
    setSavingAutomations(true)
    try {
      const res = await fetch('/api/atendimento/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ automations })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao salvar')

      notify({
        type: 'success',
        title: 'Automações Salvas!',
        message: 'As mensagens automáticas serão disparadas aos compradores conforme as regras.'
      })
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Erro ao Salvar',
        message: err.message || 'Não foi possível salvar as automações.'
      })
    } finally {
      setSavingAutomations(false)
    }
  }

  const filteredConversations = conversations.filter(c => {
    if (search) {
      const q = search.toLowerCase()
      const matchesName = (c.customer_name || '').toLowerCase().includes(q)
      const matchesOrder = (c.order_id || '').includes(q)
      const matchesMsg = (c.last_message?.text || '').toLowerCase().includes(q)
      if (!matchesName && !matchesOrder && !matchesMsg) return false
    }
    return true
  })

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      
      {/* 🟢 TOP BAR DO ATENDIMENTO */}
      <div className="bg-white rounded-2xl border border-[#e6e6e6] px-5 py-3.5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EEFFB3] border border-[#d9f99d] flex items-center justify-center font-black text-[#111] text-[14px]">
            💬
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[17px] font-black text-[#1f2328] tracking-tight">
                Mensagens de Venda & SAC (Chat ao Vivo)
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f0fff4] text-[#276749] border border-[#c6f6d5]">
                <span className="w-2 h-2 rounded-full bg-[#38a169] animate-pulse" />
                Tempo Real 2s
              </span>
            </div>
            <p className="text-[11px] text-[#666]">
              Converse diretamente com o cliente em tempo real e automatize mensagens de pós-venda em todos os marketplaces.
            </p>
          </div>
        </div>

        {/* Toggle de Abas Resumido */}
        <div className="flex items-center gap-2">
          <div className="bg-[#f0f0f0] p-1 rounded-xl flex items-center gap-1 shrink-0">
            <button
              onClick={() => setMainView('CHAT')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                mainView === 'CHAT' ? 'bg-white text-[#111] shadow-2xs' : 'text-[#666] hover:text-[#111]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 text-[#3483fa]" />
              <span>Chat</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#3483fa] text-white">
                {conversations.length || 1}
              </span>
            </button>

            <button
              onClick={() => setMainView('AUTOMATIONS')}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                mainView === 'AUTOMATIONS' ? 'bg-white text-[#111] shadow-2xs' : 'text-[#666] hover:text-[#111]'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-[#e67e22]" />
              <span>Automações</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-[#B5F500] text-[#111]">
                Auto
              </span>
            </button>
          </div>

          {mainView === 'CHAT' && (
            <button
              onClick={() => fetchConversations(false)}
              disabled={refreshing}
              className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-[#e6e6e6] bg-[#f8f9fa] hover:bg-[#f0f0f0] text-[#333] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#3483fa]' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 🤖 VISÃO 2: AUTOMAÇÃO DE MENSAGENS PÓS-VENDA */}
      {/* ========================================================================= */}
      {mainView === 'AUTOMATIONS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#eee]">
              <div>
                <h2 className="text-[16px] font-black text-[#1f2328] flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#3483fa]" />
                  <span>Mensagens Automáticas Padrão de Pós-Venda</span>
                </h2>
                <p className="text-[12px] text-[#666] mt-0.5">
                  Configure mensagens automáticas que são enviadas no chat privado do comprador em cada etapa da compra.
                </p>
              </div>

              <button
                onClick={handleSaveAutomations}
                disabled={savingAutomations}
                className="px-5 py-2.5 bg-[#3483fa] hover:bg-[#2968c8] text-white text-[12px] font-bold rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingAutomations ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Salvar Mensagens Automáticas</span>
              </button>
            </div>

            {/* Variáveis Dinâmicas Disponíveis */}
            <div className="p-3.5 rounded-xl bg-[#f0f7ff] border border-[#d0e4ff] space-y-2">
              <span className="text-[11px] font-bold text-[#1f2328] flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#3483fa]" />
                Tags Dinâmicas que você pode usar no texto (são preenchidas automaticamente):
              </span>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                <code className="px-2 py-1 bg-white rounded-md border border-[#d0e4ff] text-[#3483fa]">{'{primeiro_nome}'}</code>
                <code className="px-2 py-1 bg-white rounded-md border border-[#d0e4ff] text-[#3483fa]">{'{nome_cliente}'}</code>
                <code className="px-2 py-1 bg-white rounded-md border border-[#d0e4ff] text-[#3483fa]">{'{nome_produto}'}</code>
                <code className="px-2 py-1 bg-white rounded-md border border-[#d0e4ff] text-[#3483fa]">{'{numero_pedido}'}</code>
                <code className="px-2 py-1 bg-white rounded-md border border-[#d0e4ff] text-[#3483fa]">{'{codigo_rastreio}'}</code>
                <code className="px-2 py-1 bg-white rounded-md border border-[#d0e4ff] text-[#3483fa]">{'{marketplace}'}</code>
              </div>
            </div>

            {/* Lista de Regras de Automação */}
            <div className="space-y-4">
              {automations.map((rule, idx) => (
                <div
                  key={rule.id}
                  className={`p-5 rounded-2xl border transition-all space-y-3.5 ${
                    rule.enabled ? 'bg-white border-[#d0e4ff] shadow-xs' : 'bg-[#fafafa] border-[#e6e6e6] opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={e => {
                          const updated = [...automations]
                          updated[idx].enabled = e.target.checked
                          setAutomations(updated)
                        }}
                        className="w-5 h-5 accent-[#3483fa] rounded cursor-pointer"
                      />
                      <div>
                        <h4 className="text-[14px] font-bold text-[#1f2328] flex items-center gap-2">
                          <span>{rule.title}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                            rule.enabled ? 'bg-[#f0fff4] text-[#276749]' : 'bg-[#eee] text-[#888]'
                          }`}>
                            {rule.enabled ? 'ATIVO' : 'DESATIVADO'}
                          </span>
                        </h4>
                        <p className="text-[11px] text-[#666] mt-0.5">{rule.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-[#999] mr-1">Canais:</span>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-[#FFE600] text-[#111]">ML</span>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-[#ee4d2d] text-white">Shopee</span>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-[#232f3e] text-white">Amazon</span>
                      <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-[#0086ff] text-white">Magalu</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-[#555] mb-1.5">
                      Texto da Mensagem no Chat:
                    </label>
                    <textarea
                      rows={3}
                      value={rule.template}
                      onChange={e => {
                        const updated = [...automations]
                        updated[idx].template = e.target.value
                        setAutomations(updated)
                      }}
                      placeholder="Escreva a mensagem padronizada..."
                      className="w-full p-3 rounded-xl border border-[#d0d7de] text-[12px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#3483fa]/20 focus:border-[#3483fa] transition-all bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveAutomations}
                disabled={savingAutomations}
                className="px-6 py-2.5 bg-[#3483fa] hover:bg-[#2968c8] text-white text-[12px] font-bold rounded-xl flex items-center gap-2 shadow-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {savingAutomations ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>Salvar Alterações</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💬 VISÃO 1: CHAT AO VIVO ESTILO OMNICHANNEL */}
      {/* ========================================================================= */}
      {mainView === 'CHAT' && (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] shadow-xs grid grid-cols-1 md:grid-cols-12 overflow-hidden h-[calc(100vh-210px)] min-h-[600px]">
          
          {/* ========================================================================= */}
          {/* 📋 COLUNA 1: LISTA DE CONVERSAS (LADO ESQUERDO) */}
          {/* ========================================================================= */}
          <div className="md:col-span-4 lg:col-span-3 border-r border-[#e6e6e6] flex flex-col bg-[#fafafa]">
            
            {/* Busca */}
            <div className="p-3 border-b border-[#e6e6e6] bg-white space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-[#999] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar cliente ou pedido..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 rounded-xl border border-[#e6e6e6] bg-[#f8f9fa] text-[12px] text-[#333] focus:outline-none focus:bg-white focus:border-[#3483fa] transition-all"
                />
              </div>

              {/* Filtro de canais */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 text-[10px] font-bold">
                <button
                  onClick={() => setMarketplaceFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    marketplaceFilter === 'ALL' ? 'bg-[#1f2328] text-white' : 'bg-[#eee] text-[#666]'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setMarketplaceFilter('mercadolivre')}
                  className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                    marketplaceFilter === 'mercadolivre' ? 'bg-[#FFE600] text-[#111]' : 'bg-[#eee] text-[#666]'
                  }`}
                >
                  <span>Mercado Livre</span>
                </button>
              </div>
            </div>

            {/* Lista de Chats */}
            <div className="flex-1 overflow-y-auto divide-y divide-[#eeeeee]">
              {loading ? (
                <div className="p-8 text-center">
                  <RefreshCw className="w-6 h-6 animate-spin text-[#3483fa] mx-auto mb-2" />
                  <p className="text-[11px] text-[#888]">Buscando conversas...</p>
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
                  <p className="text-[12px] font-bold text-[#666]">Nenhuma conversa ativa</p>
                  <p className="text-[10px] text-[#999] mt-0.5">As mensagens dos pedidos aparecerão aqui.</p>
                </div>
              ) : (
                filteredConversations.map(conv => {
                  const isSelected = selectedConv?.order_id === conv.order_id
                  const isFromBuyer = conv.last_message?.from?.user_id !== 470831049
                  const time = conv.last_message?.message_date?.created
                    ? new Date(conv.last_message.message_date.created).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                    : ''

                  return (
                    <div
                      key={conv.order_id}
                      onClick={() => setSelectedConv(conv)}
                      className={`p-3.5 transition-all cursor-pointer flex items-start gap-3 relative ${
                        isSelected
                          ? 'bg-white border-l-4 border-l-[#3483fa] shadow-2xs'
                          : 'hover:bg-white/80'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0 mt-0.5">
                        <div className="w-10 h-10 rounded-full bg-[#f0f7ff] border border-[#d0e4ff] flex items-center justify-center font-bold text-[#3483fa] text-[12px]">
                          {conv.customer_name.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="w-2.5 h-2.5 rounded-full bg-[#38a169] border-2 border-white absolute bottom-0 right-0" />
                      </div>

                      {/* Conteúdo */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-[13px] font-bold text-[#1f2328] truncate">
                            {conv.customer_name}
                          </h4>
                          <span className="text-[10px] text-[#999] shrink-0 font-medium">
                            {time}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-extrabold text-[#3483fa]">
                            #{conv.order_id}
                          </span>
                          <span className="text-[10px] text-[#999]">•</span>
                          <span className="text-[10px] font-bold text-[#27ae60]">
                            R$ {Number(conv.total_amount || 0).toFixed(2)}
                          </span>
                        </div>

                        <p className="text-[11px] text-[#666] truncate mt-1">
                          {isFromBuyer ? (
                            <span className="text-[#333] font-medium">{conv.last_message?.text}</span>
                          ) : (
                            <span className="text-[#888] flex items-center gap-1">
                              <CheckCheck className="w-3 h-3 text-[#3483fa] inline" />
                              {conv.last_message?.text}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

          </div>

          {/* ========================================================================= */}
          {/* 💬 COLUNA 2: ÁREA DE CHAT EM TEMPO REAL (MEIO) */}
          {/* ========================================================================= */}
          <div className="md:col-span-8 lg:col-span-6 flex flex-col bg-[#efeae2]/15 relative">
            
            {selectedConv ? (
              <>
                {/* Header do Chat */}
                <div className="p-3.5 bg-white border-b border-[#e6e6e6] flex items-center justify-between shadow-2xs z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f0f7ff] border border-[#d0e4ff] flex items-center justify-center font-bold text-[#3483fa] text-[13px]">
                      {selectedConv.customer_name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-bold text-[#1f2328] flex items-center gap-2">
                        <span>{selectedConv.customer_name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FFE600] text-[#111]">
                          Mercado Livre
                        </span>
                      </h3>
                      <div className="flex items-center gap-2 text-[11px] text-[#666]">
                        <span className="text-[#38a169] font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#38a169] animate-pulse" />
                          Online no Chat
                        </span>
                        <span>•</span>
                        <span>Venda #{selectedConv.order_id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://vendedores.mercadolivre.com.br/vendas/nova/mensagens/${selectedConv.order_id}?source=notification`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-[#e6e6e6] bg-[#f8f9fa] hover:bg-[#f0f0f0] text-[#333] flex items-center gap-1.5 transition-colors"
                    >
                      <span>Abrir no ML</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[#666]" />
                    </a>
                  </div>
                </div>

                {/* Mensagens do Chat com Rolagem */}
                <div className="flex-1 p-5 space-y-3.5 overflow-y-auto bg-[#f8f9fa]">
                  
                  {/* Divisor de data */}
                  <div className="text-center my-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#e6e6e6] text-[#666] shadow-2xs">
                      Hoje
                    </span>
                  </div>

                  {selectedConv.messages.map((m, idx) => {
                    const isMe = m.from?.user_id === 470831049
                    const time = m.message_date?.created
                      ? new Date(m.message_date.created).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                      : ''

                    return (
                      <div
                        key={m.id || idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[82%] p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-xs relative ${
                            isMe
                              ? 'bg-[#3483fa] text-white rounded-tr-none'
                              : 'bg-white border border-[#e6e6e6] text-[#222] rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{m.text}</p>
                          
                          <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-white/80' : 'text-[#999]'}`}>
                            <span>{time}</span>
                            {isMe && <CheckCheck className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={chatBottomRef} />
                </div>

                {/* Sugestões de Respostas Rápidas */}
                {showTemplates && (
                  <div className="p-3 bg-white border-t border-[#e6e6e6] space-y-1.5 animate-in slide-in-from-bottom-2 duration-150">
                    <div className="flex items-center justify-between text-[11px] font-bold text-[#666] mb-1">
                      <span className="flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 text-[#f59e0b]" />
                        Respostas Rápidas Prontas:
                      </span>
                      <button onClick={() => setShowTemplates(false)} className="text-[#999] hover:text-[#333]">Fechar ✕</button>
                    </div>
                    {QUICK_TEMPLATES.map((tmpl, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setMessageInput(tmpl)
                          setShowTemplates(false)
                        }}
                        className="w-full text-left p-2 rounded-xl text-[11px] text-[#333] hover:bg-[#f0f7ff] border border-[#eee] transition-colors"
                      >
                        "{tmpl}"
                      </button>
                    ))}
                  </div>
                )}

                {/* Barra de Digitação e Envio Fixa no Rodapé */}
                <div className="sticky bottom-0 z-30 p-3.5 bg-white border-t border-[#e6e6e6] space-y-2 shadow-sm">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
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
                      onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      maxLength={350}
                      className="flex-1 h-11 px-4 rounded-xl border border-[#d0d7de] bg-[#f8f9fa] text-[13px] text-[#333] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#3483fa]/20 focus:border-[#3483fa] transition-all"
                    />

                    <button
                      type="button"
                      onClick={() => handleSendMessage()}
                      disabled={sending || !messageInput.trim()}
                      className="w-11 h-11 bg-[#3483fa] hover:bg-[#2968c8] text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 cursor-pointer shrink-0 shadow-sm"
                    >
                      {sending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-[#999] px-1">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-[#38a169]" />
                      Não inclua dados pessoais, linguagem ofensiva ou links externos.
                    </span>
                    <span>{messageInput.length}/350</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
                <MessageSquare className="w-12 h-12 text-[#ccc] mb-3" />
                <h3 className="text-[15px] font-bold text-[#333]">Selecione uma conversa</h3>
                <p className="text-[12px] text-[#888] mt-1 max-w-sm">
                  Escolha um cliente na lista à esquerda para conversar e responder em tempo real.
                </p>
              </div>
            )}

          </div>

          {/* ========================================================================= */}
          {/* 📦 COLUNA 3: DETALHE DO PEDIDO & ANÚNCIO (LADO DIREITO) */}
          {/* ========================================================================= */}
          <div className="hidden lg:flex lg:col-span-3 border-l border-[#e6e6e6] flex-col bg-white p-4 space-y-4 overflow-y-auto">
            {selectedConv ? (
              <>
                {/* Informações da Venda */}
                <div>
                  <div className="text-[11px] font-extrabold uppercase text-[#999] tracking-wider">
                    Detalhe da Venda
                  </div>
                  <div className="text-[15px] font-black text-[#1f2328] mt-0.5">
                    Venda #{selectedConv.order_id}
                  </div>
                  <p className="text-[11px] text-[#888]">
                    {selectedConv.created_at ? new Date(selectedConv.created_at).toLocaleString('pt-BR') : '20 ago 08:14 hs'}
                  </p>
                </div>

                {/* Status do Envio */}
                <div className="p-3.5 rounded-xl bg-[#f8f9fa] border border-[#e6e6e6] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#666]">Status do Pacote</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                      selectedConv.status === 'CANCELADO'
                        ? 'bg-[#ffebee] text-[#e74c3c]'
                        : 'bg-[#f0fff4] text-[#276749]'
                    }`}>
                      {selectedConv.product?.shipping_status || 'Pronto para envio'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#555]">
                    {selectedConv.status === 'CANCELADO'
                      ? 'Esta compra foi cancelada a pedido do comprador.'
                      : 'Pronto para emitir a Declaração de Conteúdo (DC-e) e imprimir etiqueta.'}
                  </p>
                </div>

                {/* Card do Produto */}
                <div className="space-y-2">
                  <span className="text-[11px] font-extrabold uppercase text-[#999] tracking-wider">
                    Produto do Pacote
                  </span>

                  <div className="p-3 rounded-xl border border-[#e6e6e6] bg-[#fafafa] space-y-2.5">
                    <div className="flex items-start gap-2.5">
                      <img
                        src={selectedConv.product?.thumbnail}
                        alt={selectedConv.product?.title}
                        className="w-12 h-12 object-contain rounded-lg border border-[#eee] bg-white p-1 shrink-0"
                      />
                      <div className="min-w-0">
                        <h5 className="text-[12px] font-bold text-[#222] line-clamp-2 leading-snug">
                          {selectedConv.product?.title}
                        </h5>
                        <p className="text-[10px] text-[#888] mt-0.5">
                          Cor: Preto | Voltagem: 127/220V
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#eee]">
                      <span className="text-[10px] font-semibold text-[#888]">1 unidade</span>
                      <span className="text-[13px] font-extrabold text-[#27ae60]">
                        R$ {Number(selectedConv.product?.price || 219.9).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="space-y-2 pt-2">
                  <span className="text-[11px] font-extrabold uppercase text-[#999] tracking-wider">
                    Ações Rápidas
                  </span>

                  <a
                    href={`/pedidos`}
                    className="w-full py-2 px-3 rounded-xl border border-[#e6e6e6] bg-[#f8f9fa] hover:bg-[#f0f0f0] text-[11px] font-bold text-[#333] flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-[#666]" />
                      Ver Detalhes no Pedidos
                    </span>
                    <span>→</span>
                  </a>

                  <a
                    href={`https://produto.mercadolivre.com.br/${selectedConv.product?.sku}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2 px-3 rounded-xl border border-[#e6e6e6] bg-[#f8f9fa] hover:bg-[#f0f0f0] text-[11px] font-bold text-[#333] flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-[#666]" />
                      Ver Anúncio no Mercado Livre
                    </span>
                    <span>↗</span>
                  </a>
                </div>
              </>
            ) : (
              <div className="p-8 text-center my-auto">
                <Package className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
                <p className="text-[11px] text-[#888]">Selecione uma conversa para ver os dados do pedido.</p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  )
}
