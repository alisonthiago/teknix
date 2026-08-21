'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useInternalChat } from '@/contexts/InternalChatContext'
import MessageCardRenderer from './MessageCardRenderer'
import { TeknixT } from '@/components/TeknixT'
import {
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
    createConversation,
    currentUser
  } = useInternalChat()

  const [input, setInput] = useState('')
  const [showChannelSelect, setShowChannelSelect] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isFloatingOpen && !isFloatingMinimized) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
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

  // ── Botão flutuante (minimizado) ─────────────────────────────────────────
  if (!isFloatingOpen || isFloatingMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-[100]">
        <button
          onClick={() => { setIsFloatingOpen(true); setIsFloatingMinimized(false) }}
          className="relative w-12 h-12 bg-white rounded-2xl shadow-lg border border-[#e2e8f0] flex items-center justify-center hover:shadow-xl hover:scale-[1.05] transition-all cursor-pointer"
          title="Chat Interno"
        >
          <TeknixT className="w-6 h-6 text-[#1e293b]" />
          {totalUnreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-black bg-[#16a34a] text-white flex items-center justify-center shadow-sm">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          )}
        </button>
      </div>
    )
  }

  // ── Painel lateral de chat — altura total ─────────────────────────────────
  return (
    <div
      className="fixed top-0 right-0 z-[100] flex flex-col bg-white border-l border-[#e8e8e8] shadow-[-8px_0_40px_rgba(0,0,0,0.08)] animate-in slide-in-from-right-4 duration-200"
      style={{ width: 'min(420px, 100vw)', height: '100dvh' }}
    >

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-[#f0f0f0] shrink-0 bg-white">
        <div className="relative">
          <button
            onClick={() => setShowChannelSelect(!showChannelSelect)}
            className="flex items-center gap-3 cursor-pointer hover:opacity-75 transition-opacity"
          >
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-10 h-10 rounded-full bg-[#ecfdf5] border border-[#bbf7d0] flex items-center justify-center font-bold text-[#16a34a]">
                {activeConversation?.type === 'GROUP'
                  ? <Users className="w-5 h-5" />
                  : <span className="text-[15px]">{activeConversation?.name?.slice(0, 1) || 'C'}</span>}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#16a34a] rounded-full ring-2 ring-white" />
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1.5">
                <span className="text-[16px] font-bold text-[#111] leading-tight">
                  {activeConversation?.name || 'Chat'}
                </span>
                <ChevronDown className="w-4 h-4 text-[#94a3b8]" />
              </div>
              <p className="text-[13px] text-[#16a34a] font-medium mt-0.5">● Online agora</p>
            </div>
          </button>

          {/* Dropdown de canais */}
          {showChannelSelect && (
            <div className="absolute top-16 left-0 w-72 bg-white rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] border border-[#e2e8f0] py-2 z-50">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#94a3b8] px-4 py-2">
                Conversas
              </p>
              {conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setActiveConversation(c); setShowChannelSelect(false) }}
                  className="w-full text-left px-4 py-3 hover:bg-[#f8fafc] text-[14px] font-medium text-[#1e293b] flex items-center gap-3 cursor-pointer transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                  {c.name}
                </button>
              ))}
              <div className="border-t border-[#f0f0f0] mt-2 pt-2 px-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#94a3b8] px-2 py-1.5">Equipe online</p>
                {collaborators.map(c => (
                  <button
                    key={c.id}
                    onClick={() => { handleSelectCollaborator(c.id, c.name); setShowChannelSelect(false) }}
                    className="w-full text-left px-2 py-2.5 hover:bg-[#f8fafc] text-[13px] font-medium text-[#475569] flex items-center gap-2.5 cursor-pointer rounded-xl transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[11px] font-bold text-[#334155]">
                      {c.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-[#1e293b]">{c.name}</p>
                      <p className="text-[11px] text-[#94a3b8]">{c.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Controles */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFloatingMinimized(true)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#94a3b8] hover:bg-[#f5f5f5] hover:text-[#475569] transition-colors cursor-pointer"
            title="Minimizar"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFloatingOpen(false)}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[#94a3b8] hover:bg-[#fee2e2] hover:text-[#dc2626] transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Área de mensagens ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-[#fafafa]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#e2e8f0] flex items-center justify-center mb-5 shadow-sm">
              <TeknixT className="w-8 h-8 text-[#c8d6e5]" />
            </div>
            <p className="text-[16px] font-bold text-[#334155] mb-2">Nenhuma mensagem ainda</p>
            <p className="text-[14px] text-[#94a3b8] leading-relaxed max-w-[260px]">
              Envie uma mensagem ou compartilhe um pedido para iniciar.
            </p>
          </div>
        ) : (
          <div className="px-6 pt-6 pb-4 space-y-8">
            {messages.map(msg => (
              <MessageCardRenderer
                key={msg.id}
                message={msg}
                isMe={msg.sender_id === currentUser?.id || (!currentUser?.id && msg.sender_id === 'user-alison')}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input ────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-4 pb-5 bg-white border-t border-[#f0f0f0] shrink-0">
        {/* Campo de texto */}
        <div className="flex items-center gap-3 bg-[#f4f6f8] rounded-2xl px-4 pr-2 py-2 border border-transparent focus-within:border-[#16a34a]/30 focus-within:bg-white transition-all">
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
            className="flex-1 bg-transparent text-[14px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none py-1"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-30 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-sm"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Ações secundárias */}
        <div className="flex items-center justify-between mt-3 px-1">
          <div className="flex items-center gap-4">
            <button
              onClick={() => alert('Selecione uma imagem')}
              className="flex items-center gap-1.5 text-[13px] font-medium text-[#94a3b8] hover:text-[#16a34a] transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-[#16a34a]" />
              Foto
            </button>
            <button
              onClick={() => alert('Selecione um arquivo')}
              className="flex items-center gap-1.5 text-[13px] font-medium text-[#94a3b8] hover:text-[#3483fa] transition-colors cursor-pointer"
            >
              <Paperclip className="w-4 h-4 text-[#3483fa]" />
              Arquivo
            </button>
          </div>
          <span className="text-[12px] text-[#c0c8d4]">Enter para enviar</span>
        </div>
      </div>

    </div>
  )
}
