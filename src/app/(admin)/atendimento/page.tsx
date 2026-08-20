'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquareQuote,
  CheckCircle2,
  Clock,
  Send,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  Package,
  AlertTriangle,
  Sparkles,
  Store,
  ChevronRight,
  Loader2,
  Check
} from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
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

export default function AtendimentoPage() {
  const { notify } = useNotification()
  const [questions, setQuestions] = useState<QuestionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState<'ALL' | 'UNANSWERED' | 'ANSWERED'>('ALL')
  const [search, setSearch] = useState('')
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({})
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchQuestions = async (isBackground = false) => {
    if (!isBackground) setLoading(true)
    else setRefreshing(true)

    try {
      const res = await fetch('/api/mercadolivre/questions')
      if (!res.ok) throw new Error('Falha ao buscar perguntas')
      const data = await res.json()
      setQuestions(data.questions || [])
      setLastUpdate(new Date())
    } catch (err: any) {
      if (!isBackground) {
        notify({
          type: 'error',
          title: 'Erro ao Carregar Perguntas',
          message: err.message || 'Não foi possível carregar as perguntas do Mercado Livre.'
        })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // 1. Initial fetch & continuous 2-second background polling
  useEffect(() => {
    fetchQuestions(false)
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchQuestions(true)
      }
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleSendReply = async (questionId: string) => {
    const text = (replyTextMap[questionId] || '').trim()
    if (!text) {
      notify({
        type: 'warning',
        title: 'Texto Vazio',
        message: 'Por favor, digite uma resposta para enviar.'
      })
      return
    }

    setSendingId(questionId)
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
      fetchQuestions(true)
    } catch (err: any) {
      console.error(err)
      notify({
        type: 'error',
        title: 'Erro ao Enviar Resposta',
        message: err.message || 'Não foi possível enviar a resposta ao Mercado Livre.'
      })
    } finally {
      setSendingId(null)
    }
  }

  const unansweredCount = questions.filter(q => q.status === 'UNANSWERED').length
  const answeredCount = questions.filter(q => q.status === 'ANSWERED').length

  const filteredQuestions = questions.filter(q => {
    if (filter === 'UNANSWERED' && q.status !== 'UNANSWERED') return false
    if (filter === 'ANSWERED' && q.status !== 'ANSWERED') return false
    if (search) {
      const query = search.toLowerCase()
      const matchesText = q.text.toLowerCase().includes(query)
      const matchesTitle = (q.item?.title || '').toLowerCase().includes(query)
      const matchesAnswer = (q.answer?.text || '').toLowerCase().includes(query)
      if (!matchesText && !matchesTitle && !matchesAnswer) return false
    }
    return true
  })

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* 🔴 HEADER PRINCIPAL */}
      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#EEFFB3] border border-[#d9f99d] flex items-center justify-center shrink-0">
            <MessageSquareQuote className="w-6 h-6 text-[#111]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-[20px] font-black text-[#1f2328] tracking-tight">
                Perguntas & Atendimento (SAC)
              </h1>
              {unansweredCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#ffebee] text-[#e74c3c] border border-[#ffcdd2] flex items-center gap-1 animate-pulse">
                  {unansweredCount} a responder
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#666] mt-0.5">
              Responda perguntas de clientes e comentários do Mercado Livre diretamente por aqui em tempo real.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => fetchQuestions(false)}
            disabled={loading || refreshing}
            className="px-3.5 py-2 rounded-xl text-[12px] font-bold border border-[#e6e6e6] bg-[#f8f9fa] hover:bg-[#f0f0f0] text-[#444] flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? 'animate-spin text-[#3483fa]' : ''}`} />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* 📊 STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          onClick={() => setFilter('UNANSWERED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filter === 'UNANSWERED' 
              ? 'bg-[#fff5f5] border-[#feb2b2] shadow-xs' 
              : 'bg-white border-[#e6e6e6] hover:border-[#3483fa]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#999]">Aguardando Resposta</span>
            <span className="w-2.5 h-2.5 rounded-full bg-[#e74c3c] animate-ping" />
          </div>
          <div className="text-[28px] font-black text-[#e74c3c] mt-1">
            {unansweredCount}
          </div>
          <p className="text-[11px] text-[#888] mt-0.5">Perguntas pré-venda pendentes</p>
        </div>

        <div 
          onClick={() => setFilter('ANSWERED')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filter === 'ANSWERED' 
              ? 'bg-[#f0fff4] border-[#9ae6b4] shadow-xs' 
              : 'bg-white border-[#e6e6e6] hover:border-[#3483fa]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#999]">Respondidas</span>
            <CheckCircle2 className="w-4 h-4 text-[#38a169]" />
          </div>
          <div className="text-[28px] font-black text-[#38a169] mt-1">
            {answeredCount}
          </div>
          <p className="text-[11px] text-[#888] mt-0.5">Perguntas com resposta enviada</p>
        </div>

        <div 
          onClick={() => setFilter('ALL')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            filter === 'ALL' 
              ? 'bg-[#f0f7ff] border-[#b8daff] shadow-xs' 
              : 'bg-white border-[#e6e6e6] hover:border-[#3483fa]/40'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#999]">Total de Mensagens</span>
            <Store className="w-4 h-4 text-[#3483fa]" />
          </div>
          <div className="text-[28px] font-black text-[#1f2328] mt-1">
            {questions.length}
          </div>
          <p className="text-[11px] text-[#888] mt-0.5">Histórico completo de perguntas</p>
        </div>
      </div>

      {/* 🔍 BARRA DE FILTROS */}
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
            onClick={() => setFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filter === 'ALL' ? 'bg-white text-[#111] shadow-2xs' : 'text-[#666] hover:text-[#111]'
            }`}
          >
            Todas ({questions.length})
          </button>
          <button
            onClick={() => setFilter('UNANSWERED')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filter === 'UNANSWERED' ? 'bg-[#e74c3c] text-white shadow-2xs' : 'text-[#666] hover:text-[#111]'
            }`}
          >
            Pendentes ({unansweredCount})
          </button>
          <button
            onClick={() => setFilter('ANSWERED')}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              filter === 'ANSWERED' ? 'bg-white text-[#38a169] shadow-2xs' : 'text-[#666] hover:text-[#111]'
            }`}
          >
            Respondidas ({answeredCount})
          </button>
        </div>
      </div>

      {/* 📋 LISTA DE PERGUNTAS */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-12 text-center shadow-xs">
          <RefreshCw className="w-8 h-8 animate-spin text-[#3483fa] mx-auto mb-3" />
          <p className="text-[13px] font-bold text-[#333]">Carregando comentários e perguntas do Mercado Livre...</p>
          <p className="text-[11px] text-[#888] mt-1">Conectando à API oficial de atendimento.</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-12 text-center shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-[#38a169] mx-auto mb-3" />
          <h3 className="text-[15px] font-bold text-[#333]">Nenhuma pergunta encontrada</h3>
          <p className="text-[12px] text-[#888] mt-1">
            {filter === 'UNANSWERED' ? 'Parabéns! Todas as perguntas foram respondidas.' : 'Nenhum comentário corresponde aos filtros selecionados.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map(q => {
            const isUnanswered = q.status === 'UNANSWERED'
            const isSending = sendingId === q.id
            const dateFormatted = q.date_created ? new Date(q.date_created).toLocaleString('pt-BR') : 'Hoje'

            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl border transition-all overflow-hidden ${
                  isUnanswered ? 'border-[#ffcdd2] shadow-xs' : 'border-[#e6e6e6]'
                }`}
              >
                {/* Top Banner: Anúncio do Produto */}
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
                        title="Abrir anúncio no Mercado Livre"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Pergunta do Cliente */}
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

                  {/* Campo para Responder (se não respondida) */}
                  {isUnanswered && (
                    <div className="pt-3 border-t border-[#f0f0f0] space-y-3">
                      <label className="block text-[11px] font-bold text-[#333]">
                        Escrever Resposta Oficial para o Mercado Livre:
                      </label>

                      <div className="flex gap-2">
                        <textarea
                          rows={2}
                          placeholder="Digite sua resposta com clareza e cordialidade..."
                          value={replyTextMap[q.id] || ''}
                          onChange={e => setReplyTextMap({ ...replyTextMap, [q.id]: e.target.value })}
                          className="flex-1 p-3 rounded-xl border border-[#d0d7de] text-[12px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#3483fa]/20 focus:border-[#3483fa] transition-all resize-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSendReply(q.id)}
                          disabled={isSending}
                          className="px-5 bg-[#3483fa] hover:bg-[#2968c8] text-white text-[12px] font-bold rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                        >
                          {isSending ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Enviando...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Responder no Mercado Livre
                            </>
                          )}
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
  )
}
