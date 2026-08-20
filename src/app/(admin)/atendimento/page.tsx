'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquareQuote,
  MessageSquare,
  CheckCircle2,
  Send,
  ExternalLink,
  RefreshCw,
  Search,
  Package,
  AlertTriangle,
  ShoppingBag,
  Store,
  Check,
  User,
  Clock,
  Loader2
} from 'lucide-react'
import { useNotification } from '@/contexts/NotificationContext'

interface QuestionItem {
  id: string
  text: string
  status: 'UNANSWERED' | 'ANSWERED' | 'CLOSED_UNANSWERED'
  date_created: string
  answer: {
    text: string
    status: string
    date_created: string
  } | null
  buyer_id?: number
  item_id: string
  item: {
    title: string
    price: number
    thumbnail: string
    permalink: string
    status: string
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
  last_message: any
  messages: Array<{
    id: string
    text: string
    from: { user_id: number }
    to: { user_id: number }
    message_date: {
      received?: string
      created?: string
      read?: string
    }
  }>
}

export default function AtendimentoPage() {
  const { notify } = useNotification()
  const [activeTab, setActiveTab] = useState<'QUESTIONS' | 'POST_SALE'>('POST_SALE')

  // Questions state
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [loadingQuestions, setLoadingQuestions] = useState(true)
  const [questionFilter, setQuestionFilter] = useState<'ALL' | 'UNANSWERED' | 'ANSWERED'>('ALL')
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({})
  const [sendingQuestionId, setSendingQuestionId] = useState<string | null>(null)

  // Post sale state
  const [conversations, setConversations] = useState<PostSaleConversation[]>([])
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [selectedConv, setSelectedConv] = useState<PostSaleConversation | null>(null)
  const [postSaleReply, setPostSaleReply] = useState('')
  const [sendingPostSale, setSendingPostSale] = useState(false)

  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  const fetchAll = async (isBackground = false) => {
    if (!isBackground) {
      setLoadingQuestions(true)
      setLoadingConversations(true)
    } else {
      setRefreshing(true)
    }

    try {
      const [qRes, cRes] = await Promise.all([
        fetch('/api/mercadolivre/questions'),
        fetch('/api/mercadolivre/messages')
      ])

      if (qRes.ok) {
        const qData = await qRes.json()
        setQuestions(qData.questions || [])
      }

      if (cRes.ok) {
        const cData = await cRes.json()
        const convs = cData.conversations || []
        setConversations(convs)
        if (convs.length > 0 && !selectedConv) {
          setSelectedConv(convs[0])
        } else if (selectedConv) {
          const updated = convs.find((c: any) => c.order_id === selectedConv.order_id)
          if (updated) setSelectedConv(updated)
        }
      }
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoadingQuestions(false)
      setLoadingConversations(false)
      setRefreshing(false)
    }
  }

  // 2-second auto update
  useEffect(() => {
    fetchAll(false)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchAll(true)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleSendQuestionReply = async (questionId: string) => {
    const text = (replyTextMap[questionId] || '').trim()
    if (!text) {
      notify({
        type: 'warning',
        title: 'Texto Vazio',
        message: 'Por favor, digite uma resposta para enviar.'
      })
      return
    }

    setSendingQuestionId(questionId)
    try {
      const res = await fetch('/api/mercadolivre/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_id: questionId, text })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar resposta')

      notify({
        type: 'success',
        title: 'Resposta Enviada!',
        message: 'Sua resposta foi publicada no anúncio do Mercado Livre com sucesso.'
      })

      setReplyTextMap(prev => ({ ...prev, [questionId]: '' }))
      fetchAll(true)
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Erro ao Enviar Resposta',
        message: err.message || 'Não foi possível enviar a resposta ao Mercado Livre.'
      })
    } finally {
      setSendingQuestionId(null)
    }
  }

  const handleSendPostSaleMessage = async () => {
    if (!selectedConv || !postSaleReply.trim()) return

    setSendingPostSale(true)
    try {
      const res = await fetch('/api/mercadolivre/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: selectedConv.order_id,
          text: postSaleReply.trim()
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar mensagem')

      notify({
        type: 'success',
        title: 'Mensagem Enviada!',
        message: 'Sua mensagem foi enviada ao comprador no Mercado Livre.'
      })

      setPostSaleReply('')
      fetchAll(true)
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Erro no Envio',
        message: err.message || 'Não foi possível enviar a mensagem.'
      })
    } finally {
      setSendingPostSale(false)
    }
  }

  const unansweredQuestionsCount = questions.filter(q => q.status === 'UNANSWERED').length

  const filteredQuestions = questions.filter(q => {
    if (questionFilter === 'UNANSWERED' && q.status !== 'UNANSWERED') return false
    if (questionFilter === 'ANSWERED' && q.status !== 'ANSWERED') return false
    if (search) {
      const query = search.toLowerCase()
      return (
        q.text.toLowerCase().includes(query) ||
        (q.item?.title || '').toLowerCase().includes(query) ||
        (q.answer?.text || '').toLowerCase().includes(query)
      )
    }
    return true
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* 🔴 HEADER PRINCIPAL */}
      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EEFFB3] border border-[#d9f99d] flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6 text-[#111]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-black text-[#1f2328] tracking-tight">
                Central de Mensagens & Atendimento
              </h1>
              {unansweredQuestionsCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#ffebee] text-[#e74c3c] border border-[#ffcdd2] flex items-center gap-1 animate-pulse">
                  {unansweredQuestionsCount} pergunta(s) pendente(s)
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#666] mt-0.5">
              Acompanhe o chat de pós-venda dos pedidos e responda dúvidas dos anúncios em tempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchAll(false)}
            disabled={refreshing}
            className="px-3.5 py-2 rounded-xl text-[12px] font-bold border border-[#e6e6e6] bg-[#f8f9fa] hover:bg-[#f0f0f0] text-[#444] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#3483fa]' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* 🔘 NAVEGAÇÃO ENTRE ABAS */}
      <div className="flex items-center gap-2 border-b border-[#e6e6e6] pb-3">
        <button
          onClick={() => setActiveTab('POST_SALE')}
          className={`px-4 py-2.5 rounded-xl text-[13px] font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'POST_SALE'
              ? 'bg-[#1f2328] text-white shadow-xs'
              : 'bg-white border border-[#e6e6e6] text-[#666] hover:text-[#111]'
          }`}
        >
          <ShoppingBag className="w-4 h-4 text-[#B5F500]" />
          <span>Mensagens dos Pedidos (Pós-Venda)</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'POST_SALE' ? 'bg-white/20 text-white' : 'bg-[#f0f0f0] text-[#666]'}`}>
            {conversations.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('QUESTIONS')}
          className={`px-4 py-2.5 rounded-xl text-[13px] font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'QUESTIONS'
              ? 'bg-[#1f2328] text-white shadow-xs'
              : 'bg-white border border-[#e6e6e6] text-[#666] hover:text-[#111]'
          }`}
        >
          <MessageSquareQuote className="w-4 h-4 text-[#B5F500]" />
          <span>Perguntas dos Anúncios (Pré-Venda)</span>
          {unansweredQuestionsCount > 0 ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#e74c3c] text-white font-bold animate-pulse">
              {unansweredQuestionsCount}
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'QUESTIONS' ? 'bg-white/20 text-white' : 'bg-[#f0f0f0] text-[#666]'}`}>
              {questions.length}
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 📦 ABA 1: CHAT PÓS-VENDA (MENSAGENS DO PEDIDO / COMPRADOR) */}
      {/* ========================================================================= */}
      {activeTab === 'POST_SALE' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[560px]">
          
          {/* Lista de Conversas Recentes */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-[#e6e6e6] p-4 shadow-xs flex flex-col space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-[14px] font-extrabold text-[#1f2328]">Pedidos com Mensagens</h3>
              <span className="text-[11px] text-[#888]">{conversations.length} conversa(s)</span>
            </div>

            {loadingConversations ? (
              <div className="p-8 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-[#3483fa] mx-auto mb-2" />
                <p className="text-[12px] text-[#666]">Carregando conversas do Mercado Livre...</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center bg-[#fafafa] rounded-xl border border-[#eee]">
                <ShoppingBag className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
                <p className="text-[12px] font-bold text-[#666]">Nenhuma conversa pós-venda encontrada</p>
                <p className="text-[11px] text-[#999] mt-0.5">As conversas de novos pedidos aparecerão aqui.</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1">
                {conversations.map(c => {
                  const isSelected = selectedConv?.order_id === c.order_id
                  const lastText = c.last_message?.text || 'Sem mensagens'
                  const isFromBuyer = c.last_message?.from?.user_id !== 470831049

                  return (
                    <div
                      key={c.order_id}
                      onClick={() => setSelectedConv(c)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#f0f7ff] border-[#3483fa] shadow-2xs'
                          : 'bg-[#fafafa] border-[#eee] hover:border-[#3483fa]/40 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-[#3483fa]">
                          Venda #{c.order_id}
                        </span>
                        <span className="text-[10px] text-[#999]">
                          {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : ''}
                        </span>
                      </div>

                      <div className="text-[13px] font-bold text-[#222] truncate mt-1">
                        {c.customer_name}
                      </div>

                      <p className="text-[11px] text-[#555] line-clamp-2 mt-1 bg-white p-2 rounded-lg border border-[#eee]">
                        {isFromBuyer && <span className="font-bold text-[#e74c3c]">Comprador: </span>}
                        {!isFromBuyer && <span className="font-bold text-[#38a169]">Você: </span>}
                        {lastText}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#eee]">
                        <span className="text-[11px] font-extrabold text-[#27ae60]">
                          R$ {Number(c.total_amount || 0).toFixed(2)}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-[#e6fffa] text-[#234e52]">
                          {c.messages_count} mensagem(ns)
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Área do Chat do Pedido */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-[#e6e6e6] shadow-xs flex flex-col overflow-hidden">
            {selectedConv ? (
              <>
                {/* Chat Top Banner */}
                <div className="p-4 bg-[#fafafa] border-b border-[#eeeeee] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#f0f7ff] border border-[#d0e4ff] flex items-center justify-center font-bold text-[#3483fa] text-[13px]">
                      👤
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-[#1f2328]">
                        {selectedConv.customer_name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-[#666]">
                        <span>Venda #{selectedConv.order_id}</span>
                        <span>•</span>
                        <span className="font-bold text-[#27ae60]">
                          R$ {Number(selectedConv.total_amount || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`https://vendedores.mercadolivre.com.br/vendas/nova/mensagens/${selectedConv.order_id}?source=notification`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold border border-[#e6e6e6] bg-white hover:bg-[#f5f5f5] text-[#333] flex items-center gap-1.5 transition-colors"
                  >
                    <span>Ver no ML</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#666]" />
                  </a>
                </div>

                {/* Mensagens do Chat */}
                <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[380px] bg-[#fdfdfd]">
                  {selectedConv.messages.map((m, idx) => {
                    const isMe = m.from?.user_id === 470831049
                    const time = m.message_date?.created ? new Date(m.message_date.created).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''

                    return (
                      <div
                        key={m.id || idx}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-1 px-1">
                          <span className="text-[10px] font-bold text-[#888]">
                            {isMe ? 'TEKNIXBRASIL (Você)' : selectedConv.customer_name}
                          </span>
                          <span className="text-[9px] text-[#bbb]">{time}</span>
                        </div>

                        <div
                          className={`max-w-[80%] p-3.5 rounded-2xl text-[13px] leading-relaxed shadow-2xs ${
                            isMe
                              ? 'bg-[#3483fa] text-white rounded-tr-none'
                              : 'bg-white border border-[#e6e6e6] text-[#222] rounded-tl-none'
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Input de Envio de Mensagem */}
                <div className="p-4 border-t border-[#eee] bg-[#fafafa] space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Escreva uma mensagem para o comprador..."
                      value={postSaleReply}
                      onChange={e => setPostSaleReply(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendPostSaleMessage()}
                      className="flex-1 h-11 px-4 rounded-xl border border-[#d0d7de] bg-white text-[13px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#3483fa]/20 focus:border-[#3483fa]"
                    />
                    <button
                      type="button"
                      onClick={handleSendPostSaleMessage}
                      disabled={sendingPostSale || !postSaleReply.trim()}
                      className="px-5 bg-[#3483fa] hover:bg-[#2968c8] text-white text-[13px] font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {sendingPostSale ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Enviar</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-[#999]">
                    Mensagem enviada com segurança através da API oficial de pós-venda do Mercado Livre.
                  </p>
                </div>
              </>
            ) : (
              <div className="p-12 text-center my-auto">
                <MessageSquare className="w-10 h-10 text-[#ccc] mx-auto mb-3" />
                <h4 className="text-[14px] font-bold text-[#666]">Selecione uma conversa ao lado</h4>
                <p className="text-[11px] text-[#999] mt-0.5">Veja todas as mensagens trocadas com o comprador deste pedido.</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 💬 ABA 2: PERGUNTAS DOS ANÚNCIOS (PRÉ-VENDA) */}
      {/* ========================================================================= */}
      {activeTab === 'QUESTIONS' && (
        <div className="space-y-4">
          
          {/* Barra de Filtros */}
          <div className="bg-white rounded-2xl border border-[#e6e6e6] p-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#999] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por texto da pergunta ou nome do produto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 pl-9 pr-4 rounded-xl border border-[#e6e6e6] text-[12px] text-[#333] focus:outline-none focus:border-[#3483fa]"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-[#f5f5f5] p-1 rounded-xl">
              <button
                onClick={() => setQuestionFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  questionFilter === 'ALL' ? 'bg-white text-[#111] shadow-2xs' : 'text-[#666] hover:text-[#111]'
                }`}
              >
                Todas ({questions.length})
              </button>
              <button
                onClick={() => setQuestionFilter('UNANSWERED')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  questionFilter === 'UNANSWERED' ? 'bg-[#e74c3c] text-white shadow-2xs' : 'text-[#666] hover:text-[#111]'
                }`}
              >
                Pendentes ({unansweredQuestionsCount})
              </button>
              <button
                onClick={() => setQuestionFilter('ANSWERED')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  questionFilter === 'ANSWERED' ? 'bg-white text-[#38a169] shadow-2xs' : 'text-[#666] hover:text-[#111]'
                }`}
              >
                Respondidas
              </button>
            </div>
          </div>

          {loadingQuestions ? (
            <div className="bg-white rounded-2xl border border-[#e6e6e6] p-12 text-center shadow-xs">
              <RefreshCw className="w-8 h-8 animate-spin text-[#3483fa] mx-auto mb-3" />
              <p className="text-[13px] font-bold text-[#333]">Carregando perguntas dos anúncios...</p>
            </div>
          ) : filteredQuestions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e6e6e6] p-12 text-center shadow-xs">
              <CheckCircle2 className="w-12 h-12 text-[#38a169] mx-auto mb-3" />
              <h3 className="text-[15px] font-bold text-[#333]">Nenhuma pergunta pendente</h3>
              <p className="text-[12px] text-[#888] mt-1">Todas as perguntas dos seus anúncios foram respondidas.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map(q => {
                const isUnanswered = q.status === 'UNANSWERED'
                const isSending = sendingQuestionId === q.id
                const dateFormatted = q.date_created ? new Date(q.date_created).toLocaleString('pt-BR') : 'Hoje'

                return (
                  <div
                    key={q.id}
                    className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                      isUnanswered ? 'border-[#ffcdd2] shadow-xs' : 'border-[#e6e6e6]'
                    }`}
                  >
                    {/* Top Anúncio */}
                    <div className="p-4 bg-[#fafafa] border-b border-[#eeeeee] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-[#e6e6e6] p-1 flex items-center justify-center shrink-0 overflow-hidden">
                          {q.item?.thumbnail && q.item.thumbnail !== '/placeholder.png' ? (
                            <img src={q.item.thumbnail} alt={q.item.title} className="w-full h-full object-contain" />
                          ) : (
                            <Package className="w-5 h-5 text-[#ccc]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#f0f7ff] text-[#3483fa] border border-[#d0e4ff]">
                              MLB #{q.item_id}
                            </span>
                            {q.item?.price > 0 && (
                              <span className="text-[11px] font-bold text-[#27ae60]">
                                R$ {Number(q.item.price).toFixed(2)}
                              </span>
                            )}
                          </div>
                          <h4 className="text-[13px] font-bold text-[#222] truncate max-w-lg mt-0.5">
                            {q.item?.title || `Anúncio ${q.item_id}`}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {isUnanswered ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#ffebee] text-[#e74c3c] border border-[#ffcdd2]">
                            <span className="w-2 h-2 rounded-full bg-[#e74c3c] animate-pulse" />
                            Pendente de Resposta
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-[#f0fff4] text-[#276749] border border-[#c6f6d5]">
                            <Check className="w-3.5 h-3.5" />
                            Respondida
                          </span>
                        )}

                        {q.item?.permalink && (
                          <a
                            href={q.item.permalink}
                            target="_blank"
                            rel="noreferrer"
                            className="p-1.5 text-[#666] hover:text-[#3483fa] hover:bg-[#f0f7ff] rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Pergunta */}
                    <div className="p-5 space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#f5f5f5] flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold text-[#666]">
                          👤
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-bold text-[#1f2328]">Cliente / Comprador</span>
                            <span className="text-[10px] text-[#999]">{dateFormatted}</span>
                          </div>
                          <p className="text-[13px] text-[#333] mt-1.5 leading-relaxed bg-[#f8f9fa] p-3.5 rounded-2xl border border-[#eeeeee]">
                            "{q.text}"
                          </p>
                        </div>
                      </div>

                      {/* Resposta Existente */}
                      {q.answer && (
                        <div className="flex items-start gap-3 pl-8">
                          <div className="w-8 h-8 rounded-full bg-[#EEFFB3] border border-[#d9f99d] flex items-center justify-center shrink-0 mt-0.5 text-[11px] font-bold text-[#111]">
                            TK
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-bold text-[#111]">Sua Resposta Oficial</span>
                              <span className="text-[10px] text-[#999]">
                                {q.answer.date_created ? new Date(q.answer.date_created).toLocaleString('pt-BR') : 'Enviada'}
                              </span>
                            </div>
                            <p className="text-[13px] text-[#111] mt-1.5 leading-relaxed bg-[#f0fff4] p-3.5 rounded-2xl border border-[#c6f6d5]">
                              {q.answer.text}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Campo para Responder */}
                      {isUnanswered && (
                        <div className="pt-3 border-t border-[#f0f0f0] space-y-3">
                          <label className="block text-[11px] font-bold text-[#333]">
                            Escrever Resposta Oficial para o Anúncio:
                          </label>

                          <div className="flex gap-2">
                            <textarea
                              rows={2}
                              placeholder="Digite sua resposta..."
                              value={replyTextMap[q.id] || ''}
                              onChange={e => setReplyTextMap({ ...replyTextMap, [q.id]: e.target.value })}
                              className="flex-1 p-3 rounded-xl border border-[#d0d7de] text-[12px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#3483fa]/20 focus:border-[#3483fa] transition-all resize-none"
                            />
                            <button
                              type="button"
                              onClick={() => handleSendQuestionReply(q.id)}
                              disabled={isSending}
                              className="px-5 bg-[#3483fa] hover:bg-[#2968c8] text-white text-[12px] font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                            >
                              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                              <span>Responder no ML</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

        </div>
      )}

    </div>
  )
}
