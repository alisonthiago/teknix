'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  useInternalChat,
  getDirectConvId,
  getConversationDisplayName,
  getConversationColab
} from '@/contexts/InternalChatContext'
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
  MessageSquarePlus,
  Hash,
  Search,
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
    createConversation,
    markAsRead,
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

  // Se abrir o chat e ainda estiver no Geral vazio enquanto há conversas diretas ativas, seleciona a direta
  useEffect(() => {
    if (isFloatingOpen && (!activeConversation || activeConversation.id === 'conv-geral')) {
      const directWithMsgs = conversations.find(c => (c.type === 'DIRECT' || c.id.startsWith('direct-')) && c.last_message)
      if (directWithMsgs) {
        setActiveConversation(directWithMsgs)
      } else {
        const anyDirect = conversations.find(c => c.type === 'DIRECT' || c.id.startsWith('direct-'))
        if (anyDirect) {
          setActiveConversation(anyDirect)
        }
      }
    }
  }, [isFloatingOpen, conversations, activeConversation, setActiveConversation])

  const handleSend = async () => {
    if (!input.trim() || !activeConversation) return
    const text = input
    setInput('')
    await sendMessage(activeConversation.id, text, 'TEXT')
  }

  const handleSelectCollaborator = async (colabId: string, colabName: string) => {
    if (!currentUser) return
    const directId = getDirectConvId(currentUser.id, colabId)
    let conv = conversations.find(c => c.id === directId)
    if (!conv) {
      const created = await createConversation(colabName, 'DIRECT', [colabId], directId)
      if (created) conv = created
    }
    if (conv) {
      setActiveConversation(conv)
      markAsRead(conv.id)
    }
    setIsFloatingOpen(true)
    setIsFloatingMinimized(false)
    setShowChannelSelect(false)
  }

  // Identificação dinâmica da conversa ativa atual (para Header)
  const activeDisplayName = useMemo(() => {
    if (!activeConversation) return 'Conversas'
    return getConversationDisplayName(activeConversation, currentUser?.id, collaborators)
  }, [activeConversation, currentUser?.id, collaborators])

  const activeColab = useMemo(() => {
    if (!activeConversation) return undefined
    return getConversationColab(activeConversation, currentUser?.id, collaborators)
  }, [activeConversation, currentUser?.id, collaborators])

  const isOnline = useMemo(() => {
    if (!activeConversation || activeConversation.type === 'GROUP') {
      return collaborators.some(c => c.online)
    }
    return activeColab ? !!activeColab.online : false
  }, [activeConversation, activeColab, collaborators])

  // Divisão organizada das conversas para o menu dropdown
  const systemChannels = useMemo(() => {
    return conversations.filter(c => c.type === 'GROUP' || c.id.startsWith('conv-'))
  }, [conversations])

  const directChats = useMemo(() => {
    const map = new Map<string, typeof conversations[0]>()
    conversations
      .filter(c => c.type === 'DIRECT' || c.id.startsWith('direct-'))
      .forEach(c => {
        if (!map.has(c.id)) map.set(c.id, c)
      })
    return Array.from(map.values())
  }, [conversations])

  const otherCollaborators = useMemo(() => {
    return collaborators.filter(c => c.id !== currentUser?.id)
  }, [collaborators, currentUser?.id])

  // ── Botão flutuante (minimizado) ─────────────────────────────────────────
  if (!isFloatingOpen || isFloatingMinimized) {
    const hasUnread = totalUnreadCount > 0
    return (
      <div className="fixed bottom-6 right-6 z-[100]">
        <button
          onClick={() => { setIsFloatingOpen(true); setIsFloatingMinimized(false) }}
          className={`relative w-12 h-12 bg-white rounded-2xl shadow-lg border border-[#e2e8f0] flex items-center justify-center hover:shadow-xl hover:scale-[1.05] transition-all cursor-pointer ${hasUnread ? 'animate-bounce' : ''}`}
          title="Chat Interno TEKNIX"
        >
          {hasUnread && (
            <span className="absolute inset-0 rounded-2xl ring-4 ring-[#16a34a]/40 animate-ping" />
          )}
          <TeknixT className="w-6 h-6 text-[#1e293b]" />
          {hasUnread && (
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

      {/* ── Header Principal ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#f0f0f0] shrink-0 bg-white">
        <div className="relative">
          <button
            onClick={() => setShowChannelSelect(!showChannelSelect)}
            className="flex items-center gap-3 cursor-pointer hover:opacity-85 transition-opacity text-left"
          >
            {/* Foto ou Avatar do Contato / Canal */}
            <div className="relative shrink-0">
              {activeConversation?.type === 'GROUP' ? (
                <div className="w-10 h-10 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[#475569] font-bold shadow-xs">
                  <Users className="w-5 h-5 text-[#64748b]" />
                </div>
              ) : activeColab?.photo_url ? (
                <img
                  src={activeColab.photo_url}
                  alt={activeDisplayName}
                  className="w-10 h-10 rounded-full object-cover border border-[#e2e8f0] shadow-xs"
                />
              ) : (
                <div className={`w-10 h-10 rounded-full border flex items-center justify-center font-bold shadow-xs ${
                  isOnline 
                    ? 'bg-[#ecfdf5] border-[#bbf7d0] text-[#16a34a]' 
                    : 'bg-[#f1f5f9] border-[#e2e8f0] text-[#64748b]'
                }`}>
                  <span className="text-[15px] font-extrabold">
                    {activeDisplayName.slice(0, 1).toUpperCase()}
                  </span>
                </div>
              )}
              <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white ${
                isOnline ? 'bg-[#16a34a]' : 'bg-[#94a3b8]'
              }`} />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] font-bold text-[#0f172a] leading-tight line-clamp-1 max-w-[200px]">
                  {activeDisplayName}
                </span>
                <ChevronDown className="w-4 h-4 text-[#94a3b8] shrink-0" />
              </div>
              <p className={`text-[12px] font-medium mt-0.5 ${
                activeConversation?.type === 'GROUP'
                  ? 'text-[#64748b]'
                  : isOnline
                    ? 'text-[#16a34a]'
                    : 'text-[#94a3b8]'
              }`}>
                {activeConversation?.type === 'GROUP'
                  ? (systemChannels.find(s => s.id === activeConversation.id)?.description || 'Canal da Empresa')
                  : `${isOnline ? '● Online agora' : '○ Offline'}${activeColab?.role ? ` · ${activeColab.role}` : ''}`}
              </p>
            </div>
          </button>

          {/* ── Dropdown de Seleção de Canal e Contatos ─────────────────── */}
          {showChannelSelect && (
            <div className="absolute top-14 left-0 w-80 bg-white rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.14)] border border-[#e2e8f0] py-2 z-50 max-h-[460px] overflow-y-auto">
              
              {/* Conversas Diretas Ativas com histórico */}
              {directChats.length > 0 && (
                <>
                  <p className="text-[11px] font-black uppercase tracking-wider text-[#94a3b8] px-4 pt-1 pb-1 flex items-center gap-1.5">
                    <MessageSquarePlus className="w-3.5 h-3.5 text-[#3b82f6]" /> Conversas Diretas
                  </p>
                  {directChats.map(c => {
                    const isCurrent = activeConversation?.id === c.id
                    const displayName = getConversationDisplayName(c, currentUser?.id, collaborators)
                    const colab = getConversationColab(c, currentUser?.id, collaborators)
                    const colabOnline = colab ? colab.online : false

                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setActiveConversation(c)
                          markAsRead(c.id)
                          setShowChannelSelect(false)
                        }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-[#f8fafc] text-[13px] font-medium flex items-center justify-between cursor-pointer transition-colors ${
                          isCurrent ? 'bg-[#f0fdf4] text-[#16a34a]' : 'text-[#334155]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="relative shrink-0">
                            {colab?.photo_url ? (
                              <img
                                src={colab.photo_url}
                                alt={displayName}
                                className="w-8 h-8 rounded-full object-cover border border-[#e2e8f0]"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[12px] font-bold text-[#334155]">
                                {displayName.slice(0, 1).toUpperCase()}
                              </div>
                            )}
                            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-1 ring-white ${
                              colabOnline ? 'bg-[#16a34a]' : 'bg-[#cbd5e1]'
                            }`} />
                          </div>
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="truncate font-semibold text-[#1e293b] leading-tight">{displayName}</p>
                            {c.last_message && (
                              <p className="truncate text-[11px] text-[#94a3b8] mt-0.5">
                                {c.last_message.content}
                              </p>
                            )}
                          </div>
                        </div>
                        {c.unread_count > 0 && (
                          <span className="min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-black bg-[#16a34a] text-white flex items-center justify-center shrink-0 ml-2">
                            {c.unread_count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                  <div className="border-t border-[#f1f5f9] my-2" />
                </>
              )}

              {/* Canais Operacionais da Empresa */}
              <p className="text-[11px] font-black uppercase tracking-wider text-[#94a3b8] px-4 pt-1 pb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#16a34a]" /> Canais da Empresa
              </p>
              {systemChannels.map(c => {
                const isCurrent = activeConversation?.id === c.id
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setActiveConversation(c)
                      markAsRead(c.id)
                      setShowChannelSelect(false)
                    }}
                    className={`w-full text-left px-4 py-2.5 hover:bg-[#f8fafc] text-[13px] font-semibold flex items-center justify-between cursor-pointer transition-colors ${
                      isCurrent ? 'bg-[#f0fdf4] text-[#16a34a]' : 'text-[#334155]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-[#16a34a]' : 'bg-[#cbd5e1]'}`} />
                      <span>{c.name}</span>
                    </div>
                    {c.unread_count > 0 && (
                      <span className="min-w-[18px] h-4.5 px-1.5 rounded-full text-[10px] font-black bg-[#16a34a] text-white flex items-center justify-center">
                        {c.unread_count}
                      </span>
                    )}
                  </button>
                )
              })}

              {/* Equipe / Iniciar Conversa */}
              <div className="border-t border-[#f1f5f9] my-2" />
              <p className="text-[11px] font-black uppercase tracking-wider text-[#94a3b8] px-4 pt-1 pb-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#64748b]" /> Iniciar com Colaborador
              </p>
              {otherCollaborators.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCollaborator(c.id, c.name)}
                  className="w-full text-left px-4 py-2 hover:bg-[#f8fafc] text-[13px] font-medium text-[#475569] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative shrink-0">
                      {c.photo_url ? (
                        <img
                          src={c.photo_url}
                          alt={c.name}
                          className="w-7 h-7 rounded-full object-cover border border-[#e2e8f0]"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-[#f1f5f9] flex items-center justify-center text-[11px] font-bold text-[#334155]">
                          {c.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ring-1 ring-white ${
                        c.online ? 'bg-[#16a34a]' : 'bg-[#cbd5e1]'
                      }`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-[#1e293b] truncate">{c.name}</p>
                      <p className="text-[11px] text-[#94a3b8] truncate">{c.role || 'Colaborador'}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-medium shrink-0 ml-2 ${
                    c.online ? 'text-[#16a34a]' : 'text-[#94a3b8]'
                  }`}>
                    {c.online ? 'Online' : 'Offline'}
                  </span>
                </button>
              ))}

            </div>
          )}
        </div>

        {/* Controles de Fechar / Minimizar */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsFloatingMinimized(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94a3b8] hover:bg-[#f5f5f5] hover:text-[#475569] transition-colors cursor-pointer"
            title="Minimizar"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFloatingOpen(false)}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94a3b8] hover:bg-[#fee2e2] hover:text-[#dc2626] transition-colors cursor-pointer"
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
            <div className="w-16 h-16 rounded-2xl bg-white border border-[#e2e8f0] flex items-center justify-center mb-5 shadow-xs">
              <TeknixT className="w-8 h-8 text-[#c8d6e5]" />
            </div>
            <p className="text-[16px] font-bold text-[#334155] mb-2">Nenhuma mensagem ainda</p>
            <p className="text-[14px] text-[#94a3b8] leading-relaxed max-w-[260px]">
              Envie uma mensagem para conversar com <strong>{activeDisplayName}</strong> em tempo real.
            </p>
          </div>
        ) : (
          <div className="px-4 pt-6 pb-4 space-y-6">
            {messages.map(msg => (
              <MessageCardRenderer
                key={msg.id}
                message={msg}
                isMe={msg.sender_id === currentUser?.id || (!currentUser?.id && msg.sender_name === currentUser?.name)}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* ── Input ────────────────────────────────────────────────────────── */}
      <div className="px-5 pt-3.5 pb-4 bg-white border-t border-[#f0f0f0] shrink-0">
        {/* Campo de texto */}
        <div className="flex items-center gap-3 bg-[#f4f6f8] rounded-2xl px-4 pr-2 py-1.5 border border-transparent focus-within:border-[#16a34a]/30 focus-within:bg-white transition-all">
          <input
            type="text"
            placeholder={`Conversar com ${activeDisplayName}...`}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            className="flex-1 bg-transparent text-[14px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none py-1.5"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-9 h-9 bg-[#16a34a] hover:bg-[#15803d] disabled:opacity-30 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Ações secundárias */}
        <div className="flex items-center justify-between mt-2.5 px-1">
          <div className="flex items-center gap-4">
            <button
              onClick={() => alert('Envio de foto')}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#94a3b8] hover:text-[#16a34a] transition-colors cursor-pointer"
            >
              <ImageIcon className="w-4 h-4 text-[#16a34a]" />
              Foto
            </button>
            <button
              onClick={() => alert('Envio de arquivo')}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[#94a3b8] hover:text-[#3483fa] transition-colors cursor-pointer"
            >
              <Paperclip className="w-4 h-4 text-[#3483fa]" />
              Arquivo
            </button>
          </div>
          <span className="text-[11px] text-[#94a3b8]">Enter para enviar</span>
        </div>
      </div>

    </div>
  )
}
