'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useInternalChat } from '@/contexts/InternalChatContext'
import MessageCardRenderer from './MessageCardRenderer'
import {
  MessageSquare,
  X,
  Minus,
  Send,
  Paperclip,
  Image as ImageIcon,
  Users,
  ChevronDown,
} from 'lucide-react'

export default function FloatingMessenger() {
  const {
    isFloatingOpen,
    setIsFloatingOpen,
    isFloatingMinimized,
    setIsFloatingMinimized,
    activeConversation,
    setActiveConversation,
    conversations,
    collaborators,
    messages,
    sendMessage,
    totalUnreadCount,
    createConversation
  } = useInternalChat()

  const [input, setInput] = useState('')
  const [showChannelSelect, setShowChannelSelect] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isFloatingOpen && !isFloatingMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isFloatingOpen, isFloatingMinimized])

  const handleSend = async () => {
    if (!input.trim() || !activeConversation) return
    const text = input
    setInput('')
    await sendMessage(activeConversation.id, text, 'TEXT')
  }

  const handleSelectCollaborator = async (colabId: string, colabName: string) => {
    let conv = conversations.find(c => c.members.some(m => m.id === colabId))
    if (!conv) {
      const created = await createConversation(colabName, 'DIRECT', [colabId])
      if (created) conv = created
    }
    if (conv) setActiveConversation(conv)
    setIsFloatingOpen(true)
    setIsFloatingMinimized(false)
  }

  // =========================================================================
  // Botão flutuante — minimizado
  // =========================================================================
  if (!isFloatingOpen || isFloatingMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-150">
        <button
          onClick={() => {
            setIsFloatingOpen(true)
            setIsFloatingMinimized(false)
          }}
          className="group px-5 py-3 bg-white hover:bg-[#f8fafc] text-[#111] rounded-full shadow-xl flex items-center gap-3 cursor-pointer border border-[#e2e8f0] transition-all hover:scale-[1.02] hover:shadow-2xl"
          title="Chat Interno de Colaboradores"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-[#16a34a]" />
            {totalUnreadCount > 0 ? (
              <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-[#16a34a] text-white leading-none">
                {totalUnreadCount}
              </span>
            ) : (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#16a34a] rounded-full ring-2 ring-white" />
            )}
          </div>

          {/* Avatares dos colaboradores */}
          <div className="flex items-center -space-x-2">
            {collaborators.slice(0, 4).map((c, i) => (
              <div key={c.id || i} className="relative">
                <div
                  className="w-7 h-7 rounded-full bg-[#f1f5f9] border-2 border-white text-[10px] font-extrabold flex items-center justify-center text-[#334155]"
                  title={`${c.name} (${c.role})`}
                >
                  {c.name.slice(0, 1)}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#16a34a] rounded-full ring-[1.5px] ring-white" />
              </div>
            ))}
          </div>

          <div className="text-left">
            <p className="text-sm font-bold leading-none text-[#111]">Chat Interno</p>
            <p className="text-[11px] text-[#16a34a] font-semibold leading-none mt-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
              {collaborators.length} online
            </p>
          </div>
        </button>
      </div>
    )
  }

  // =========================================================================
  // Janela do Chat — altura quase total da viewport, limpa e espaçada
  // =========================================================================
  return (
    <div className="fixed bottom-0 right-6 z-[100] w-[400px] max-w-[calc(100vw-1.5rem)] flex flex-col bg-white rounded-t-2xl shadow-[0_-4px_40px_rgba(0,0,0,0.12)] border border-[#e2e8f0] border-b-0 animate-in slide-in-from-bottom-4 duration-200"
      style={{ height: 'min(680px, calc(100vh - 1.5rem))' }}
    >

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0] shrink-0">
        {/* Conversa ativa */}
        <div className="relative">
          <button
            onClick={() => setShowChannelSelect(!showChannelSelect)}
            className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity cursor-pointer"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-sm font-extrabold text-[#16a34a]">
                {activeConversation?.type === 'GROUP'
                  ? <Users className="w-5 h-5 text-[#16a34a]" />
                  : activeConversation?.name?.slice(0, 1) || 'C'}
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#16a34a] rounded-full ring-2 ring-white" />
            </div>

            {/* Nome + status */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-bold truncate max-w-[180px] text-[#111] leading-tight">
                  {activeConversation?.name || 'Chat'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />
              </div>
              <p className="text-[12px] text-[#16a34a] font-medium leading-none mt-0.5">Online agora</p>
            </div>
          </button>

          {/* Dropdown de canais */}
          {showChannelSelect && (
            <div className="absolute top-14 left-0 w-72 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#e2e8f0] p-2 z-50">
              <p className="text-[11px] font-extrabold uppercase text-[#94a3b8] px-3 py-2 tracking-wider">
                Canais & Conversas
              </p>
              {conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveConversation(c)
                    setShowChannelSelect(false)
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-[#f8fafc] text-sm font-medium flex items-center gap-2.5 cursor-pointer transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-[#16a34a] shrink-0" />
                  <span className="truncate text-[#1e293b]">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="flex items-center gap-1 text-[#94a3b8]">
          <button
            onClick={() => setIsFloatingMinimized(true)}
            className="w-8 h-8 rounded-xl hover:bg-[#f1f5f9] hover:text-[#334155] transition-colors cursor-pointer flex items-center justify-center"
            title="Minimizar"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFloatingOpen(false)}
            className="w-8 h-8 rounded-xl hover:bg-[#fee2e2] hover:text-[#dc2626] transition-colors cursor-pointer flex items-center justify-center"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Barra de Equipe ─────────────────────────────────────────────── */}
      <div className="px-5 py-3 bg-[#fafafa] border-b border-[#f0f0f0] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] shrink-0 mr-1">
          Equipe
        </span>
        {collaborators.map(c => {
          const isCurrent = activeConversation?.members?.some(m => m.id === c.id)
          return (
            <button
              key={c.id}
              onClick={() => handleSelectCollaborator(c.id, c.name)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all shrink-0 cursor-pointer ${
                isCurrent
                  ? 'bg-[#16a34a] text-white shadow-sm'
                  : 'bg-white border border-[#e2e8f0] text-[#475569] hover:border-[#16a34a] hover:text-[#16a34a]'
              }`}
              title={`${c.name} — ${c.role}`}
            >
              <div className="relative">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isCurrent ? 'bg-white/25 text-white' : 'bg-[#f1f5f9] text-[#475569]'
                }`}>
                  {c.name.slice(0, 1)}
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#16a34a] rounded-full ring-1 ${
                  isCurrent ? 'ring-[#16a34a]' : 'ring-white'
                }`} />
              </div>
              <span className="truncate max-w-[72px]">{c.name.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>

      {/* ── Mensagens ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[#f8fafc]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-8 py-12 text-[#94a3b8]">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#e2e8f0] flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare className="w-7 h-7 opacity-40" />
            </div>
            <p className="text-[15px] font-bold text-[#475569] mb-1">Nenhuma mensagem ainda</p>
            <p className="text-[13px] text-[#94a3b8] leading-relaxed">
              Envie uma mensagem ou compartilhe um pedido para iniciar a conversa.
            </p>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-6">
            {messages.map(msg => (
              <MessageCardRenderer
                key={msg.id}
                message={msg}
                isMe={msg.sender_id === 'user-alison'}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-4 bg-white border-t border-[#f0f0f0] shrink-0 space-y-3">
        {/* Campo + botão enviar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Escreva uma mensagem..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="flex-1 h-11 px-4 bg-[#f1f5f9] rounded-2xl text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#16a34a]/30 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-11 h-11 bg-[#16a34a] hover:bg-[#15803d] text-white rounded-2xl flex items-center justify-center transition-all disabled:opacity-35 cursor-pointer shadow-sm shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Ações secundárias */}
        <div className="flex items-center justify-between text-[#94a3b8] px-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('Selecione uma imagem ou foto de pedido')}
              className="flex items-center gap-1.5 text-[12px] font-medium hover:text-[#16a34a] transition-colors cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#16a34a]" />
              Foto
            </button>
            <button
              onClick={() => alert('Selecione um PDF ou documento')}
              className="flex items-center gap-1.5 text-[12px] font-medium hover:text-[#3483fa] transition-colors cursor-pointer"
            >
              <Paperclip className="w-3.5 h-3.5 text-[#3483fa]" />
              Arquivo
            </button>
          </div>
          <span className="text-[11px]">Enter para enviar</span>
        </div>
      </div>

    </div>
  )
}
