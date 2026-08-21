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
  User,
  Plus
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
    if (conv) {
      setActiveConversation(conv)
    }
    setIsFloatingOpen(true)
    setIsFloatingMinimized(false)
  }

  // =========================================================================
  // 🔘 BOTÃO FLUTUANTE PERSISTENTE NO CANTO INFERIOR DIREITO
  // =========================================================================
  if (!isFloatingOpen || isFloatingMinimized) {
    return (
      <div className="fixed bottom-5 right-5 z-[100] flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
        <button
          onClick={() => {
            setIsFloatingOpen(true)
            setIsFloatingMinimized(false)
          }}
          className="group px-4 py-2.5 bg-[#111] hover:bg-[#222] text-white rounded-full shadow-2xl flex items-center gap-3 cursor-pointer border border-[#333] transition-all hover:scale-[1.03]"
          title="Chat Interno de Colaboradores"
        >
          {/* Ícone com Badge */}
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-[#B5F500]" />
            {totalUnreadCount > 0 ? (
              <span className="absolute -top-2 -right-2 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-[#16a34a] text-white">
                {totalUnreadCount}
              </span>
            ) : (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#16a34a] rounded-full ring-2 ring-[#111]" />
            )}
          </div>

          {/* Avatares dos Usuários Conectados */}
          <div className="flex items-center -space-x-2">
            {collaborators.slice(0, 3).map((c, i) => (
              <div
                key={c.id || i}
                className="w-5 h-5 rounded-full bg-[#333] border border-[#111] text-[9px] font-extrabold flex items-center justify-center text-white"
                title={`${c.name} (${c.role})`}
              >
                {c.name.slice(0, 1)}
              </div>
            ))}
          </div>

          <div className="text-left">
            <p className="text-xs font-black leading-none">Chat Interno</p>
            <p className="text-[10px] text-[#16a34a] font-bold leading-none mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a] animate-pulse" />
              {collaborators.length} online
            </p>
          </div>
        </button>
      </div>
    )
  }

  // =========================================================================
  // 🪟 JANELA ABERTA DO MESSENGER FLUTUANTE
  // =========================================================================
  return (
    <div className="fixed bottom-5 right-5 z-[100] w-80 sm:w-96 h-[530px] bg-white rounded-2xl shadow-2xl border border-[#e2e8f0] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
      
      {/* 1. Header do Messenger */}
      <div className="p-3 bg-[#111] text-white flex items-center justify-between shadow-xs">
        <div className="relative">
          <button
            onClick={() => setShowChannelSelect(!showChannelSelect)}
            className="flex items-center gap-2 text-left hover:opacity-90 transition-opacity cursor-pointer"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-[#222] border border-[#444] flex items-center justify-center text-xs font-extrabold text-[#B5F500]">
                {activeConversation?.type === 'GROUP' ? <Users className="w-4 h-4 text-[#B5F500]" /> : activeConversation?.name?.slice(0, 1) || 'C'}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#16a34a] rounded-full ring-2 ring-[#111]" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-xs font-black truncate max-w-[140px]">{activeConversation?.name || 'Chat'}</span>
                <ChevronDown className="w-3 h-3 text-[#999]" />
              </div>
              <p className="text-[10px] text-[#16a34a] font-bold leading-none mt-0.5">Online agora</p>
            </div>
          </button>

          {/* Menu Dropdown de Conversas */}
          {showChannelSelect && (
            <div className="absolute top-12 left-0 w-64 bg-white text-[#111] rounded-xl shadow-2xl border border-[#e2e8f0] p-1.5 z-50 divide-y divide-[#f1f5f9]">
              <p className="text-[10px] font-black uppercase text-[#94a3b8] px-2 py-1 tracking-wider">Canais & Conversas</p>
              {conversations.map(c => (
                <button
                  key={c.id}
                  onClick={() => {
                    setActiveConversation(c)
                    setShowChannelSelect(false)
                  }}
                  className="w-full text-left p-2 rounded-lg hover:bg-[#f8fafc] text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full bg-[#16a34a]" />
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Controles da Janela */}
        <div className="flex items-center gap-1 text-[#aaa]">
          <button
            onClick={() => setIsFloatingMinimized(true)}
            className="p-1 rounded-lg hover:bg-[#222] hover:text-white transition-colors cursor-pointer"
            title="Minimizar"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFloatingOpen(false)}
            className="p-1 rounded-lg hover:bg-[#222] hover:text-white transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Barra de Colaboradores Conectados no Sistema */}
      <div className="px-3 py-2 bg-[#fafafa] border-b border-[#eee] flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[10px] font-extrabold uppercase text-[#94a3b8] shrink-0">Equipe:</span>
        {collaborators.map(c => {
          const isCurrent = activeConversation?.members?.some(m => m.id === c.id)
          return (
            <button
              key={c.id}
              onClick={() => handleSelectCollaborator(c.id, c.name)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                isCurrent
                  ? 'bg-[#111] text-white shadow-2xs'
                  : 'bg-white border border-[#e2e8f0] text-[#334155] hover:border-[#111]'
              }`}
              title={`${c.name} — ${c.role}`}
            >
              <div className="relative">
                <div className="w-4 h-4 rounded-full bg-[#e2e8f0] text-[#111] flex items-center justify-center text-[9px] font-black">
                  {c.name.slice(0, 1)}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 bg-[#16a34a] rounded-full ring-1 ring-white" />
              </div>
              <span className="truncate max-w-[80px]">{c.name.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>

      {/* 3. Linha do Tempo de Mensagens */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#f8fafc]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-[#94a3b8]">
            <MessageSquare className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs font-bold text-[#475569]">Nenhuma mensagem ainda</p>
            <p className="text-[11px] mt-0.5">Envie uma mensagem ou compartilhe um pedido para iniciar.</p>
          </div>
        ) : (
          messages.map(msg => (
            <MessageCardRenderer
              key={msg.id}
              message={msg}
              isMe={msg.sender_id === 'user-alison'}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Barra de Digitação */}
      <div className="p-2.5 bg-white border-t border-[#e2e8f0] space-y-2">
        <div className="flex items-center gap-1.5">
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
            className="flex-1 h-9 px-3 bg-[#f1f5f9] rounded-xl text-xs text-[#1e293b] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#111] transition-all"
          />

          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-9 h-9 bg-[#111] hover:bg-[#222] text-white rounded-xl flex items-center justify-center transition-all disabled:opacity-40 cursor-pointer shadow-2xs shrink-0"
          >
            <Send className="w-3.5 h-3.5 text-[#B5F500]" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[#64748b] px-1 text-[10px]">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => alert('Selecione uma imagem ou foto de pedido')}
              className="p-0.5 hover:text-[#111] transition-colors cursor-pointer flex items-center gap-1 font-bold" 
            >
              <ImageIcon className="w-3 h-3 text-[#16a34a]" /> Foto
            </button>
            <button 
              onClick={() => alert('Selecione um PDF ou documento')}
              className="p-0.5 hover:text-[#111] transition-colors cursor-pointer flex items-center gap-1 font-bold" 
            >
              <Paperclip className="w-3 h-3 text-[#3483fa]" /> Arquivo
            </button>
          </div>
          <span className="text-[#94a3b8]">Enter para enviar</span>
        </div>
      </div>

    </div>
  )
}
