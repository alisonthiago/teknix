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
  MessageSquarePlus,
  Hash,
  Search,
  ArrowLeft,
  MessageCircle,
  Clock
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
    currentUser,
    activeChatRoomId,
    setActiveChatRoomId
  } = useInternalChat()

  const [input, setInput] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentView, setCurrentView] = useState<'list' | 'chat'>('list')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isFloatingOpen && !isFloatingMinimized && currentView === 'chat') {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [messages, isFloatingOpen, isFloatingMinimized, currentView])

  // Abre a lista de conversas ao acionar o messenger
  const handleOpenMessenger = () => {
    setIsFloatingOpen(true)
    setIsFloatingMinimized(false)
    if (currentView === 'chat' && activeConversation) {
      setActiveChatRoomId(activeConversation.id)
    } else {
      setActiveChatRoomId(null)
    }
  }

  const handleOpenChat = (conv: typeof conversations[0]) => {
    setActiveConversation(conv)
    setActiveChatRoomId(conv.id)
    markAsRead(conv.id)
    setCurrentView('chat')
  }

  const handleBackToList = () => {
    setActiveChatRoomId(null)
    setCurrentView('list')
  }

  const handleCloseMessenger = () => {
    setActiveChatRoomId(null)
    setIsFloatingOpen(false)
  }

  const handleMinimizeMessenger = () => {
    setActiveChatRoomId(null)
    setIsFloatingMinimized(true)
  }

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
      setActiveChatRoomId(conv.id)
      markAsRead(conv.id)
      setCurrentView('chat')
    }
  }

  // Identificação dinâmica da conversa ativa atual (para Header)
  const activeDisplayName = useMemo(() => {
    if (!activeConversation) return 'Geral'
    return getConversationDisplayName(activeConversation, currentUser?.id, collaborators)
  }, [activeConversation, currentUser?.id, collaborators])

  const activeColab = useMemo(() => {
    if (!activeConversation) return undefined
    return getConversationColab(activeConversation, currentUser?.id, collaborators)
  }, [activeConversation, currentUser?.id, collaborators])

  const isOnline = useMemo(() => {
    if (!activeConversation || activeConversation.type === 'GROUP') {
      return false
    }
    return activeColab ? !!activeColab.online : false
  }, [activeConversation, activeColab])

  // Divisão organizada das conversas
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

  // Filtragem pela busca
  const filteredDirectChats = useMemo(() => {
    if (!searchQuery.trim()) return directChats
    const q = searchQuery.toLowerCase()
    return directChats.filter(c => {
      const name = getConversationDisplayName(c, currentUser?.id, collaborators).toLowerCase()
      const lastMsg = c.last_message?.content?.toLowerCase() || ''
      return name.includes(q) || lastMsg.includes(q)
    })
  }, [directChats, searchQuery, currentUser?.id, collaborators])

  const filteredChannels = useMemo(() => {
    if (!searchQuery.trim()) return systemChannels
    const q = searchQuery.toLowerCase()
    return systemChannels.filter(c => c.name.toLowerCase().includes(q))
  }, [systemChannels, searchQuery])

  const filteredCollaborators = useMemo(() => {
    if (!searchQuery.trim()) return otherCollaborators
    const q = searchQuery.toLowerCase()
    return otherCollaborators.filter(c => c.name.toLowerCase().includes(q) || (c.role && c.role.toLowerCase().includes(q)))
  }, [otherCollaborators, searchQuery])

  // ── Botão flutuante (minimizado) ─────────────────────────────────────────
  if (!isFloatingOpen || isFloatingMinimized) {
    const hasUnread = totalUnreadCount > 0
    return (
      <div className="fixed bottom-6 right-6 z-[100]">
        <button
          onClick={handleOpenMessenger}
          className={`relative w-12 h-12 bg-white rounded-2xl shadow-lg border border-[#e2e8f0] flex items-center justify-center hover:shadow-xl hover:scale-[1.08] transition-all cursor-pointer ${hasUnread ? 'ring-4 ring-[#16a34a]/30' : ''}`}
          title="Chat Interno TEKNIX"
        >
          {hasUnread && (
            <span className="absolute inset-0 rounded-2xl ring-4 ring-[#16a34a]/40 animate-ping pointer-events-none" />
          )}
          <TeknixT className="w-6 h-6 text-[#1e293b]" />
          {hasUnread && (
            <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-black bg-[#e74c3c] text-white flex items-center justify-center shadow-md ring-2 ring-white animate-bounce">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          )}
        </button>
      </div>
    )
  }

  // ── Painel Lateral do Messenger ──────────────────────────────────────────
  return (
    <div
      className="fixed top-0 right-0 z-[100] flex flex-col bg-white border-l border-[#e8e8e8] shadow-[-8px_0_40px_rgba(0,0,0,0.08)] animate-in slide-in-from-right-4 duration-200"
      style={{ width: 'min(420px, 100vw)', height: '100dvh' }}
    >
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* VISTA 1: LISTA DE CONVERSAS (INBOX)                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {currentView === 'list' ? (
        <div className="flex flex-col h-full bg-white">
          {/* Header Inbox */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#f0f0f0] shrink-0 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#ecfdf5] border border-[#bbf7d0] flex items-center justify-center shadow-2xs">
                <TeknixT className="w-5 h-5 text-[#16a34a]" />
              </div>
              <div>
                <h2 className="text-[16px] font-bold text-[#0f172a] leading-tight">Chat Interno</h2>
                <p className="text-[11px] text-[#94a3b8] font-medium">Equipe & Operação TEKNIX</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleMinimizeMessenger}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94a3b8] hover:bg-[#f5f5f5] hover:text-[#475569] transition-colors cursor-pointer"
                title="Minimizar"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={handleCloseMessenger}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94a3b8] hover:bg-[#fee2e2] hover:text-[#dc2626] transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Campo de Busca */}
          <div className="px-4 py-3 border-b border-[#f1f5f9] bg-[#fafafa]">
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-[#e2e8f0] focus-within:border-[#16a34a]/40 focus-within:ring-2 focus-within:ring-[#16a34a]/10 transition-all">
              <Search className="w-4 h-4 text-[#94a3b8] shrink-0" />
              <input
                type="text"
                placeholder="Buscar conversa ou colega..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-transparent text-[13px] text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-[#94a3b8] hover:text-[#475569]">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Lista de Conversas com Scroll */}
          <div className="flex-1 overflow-y-auto divide-y divide-[#f8fafc]">
            {/* Seção 1: Conversas Recentes / Diretas */}
            {filteredDirectChats.length > 0 && (
              <div className="py-2">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#94a3b8] px-5 py-1.5 flex items-center gap-1.5">
                  <MessageCircle className="w-3.5 h-3.5 text-[#3b82f6]" /> Conversas Diretas
                </p>
                {filteredDirectChats.map(c => {
                  const displayName = getConversationDisplayName(c, currentUser?.id, collaborators)
                  const colab = getConversationColab(c, currentUser?.id, collaborators)
                  const colabOnline = colab ? colab.online : false

                  return (
                    <button
                      key={c.id}
                      onClick={() => handleOpenChat(c)}
                      className="w-full text-left px-5 py-3 hover:bg-[#f5f5f5] text-[13px] font-medium flex items-center justify-between cursor-pointer transition-colors border-b border-[#f1f5f9]/60 last:border-0"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          {colab?.photo_url ? (
                            <img
                              src={colab.photo_url}
                              alt={displayName}
                              className="w-11 h-11 rounded-full object-cover border border-[#e2e8f0] shadow-xs"
                            />
                          ) : (
                            <div className="w-11 h-11 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[14px] font-bold text-[#334155] shadow-xs">
                              {displayName.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          {colabOnline ? (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white" title="Online agora">
                              <span className="absolute inset-0 rounded-full bg-[#16a34a] animate-ping opacity-60" />
                              <span className="relative block w-3 h-3 rounded-full bg-[#16a34a]" />
                            </span>
                          ) : (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white bg-[#cbd5e1]" title="Offline" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1 pr-2">
                          <div className="flex items-center justify-between">
                            <p className={`truncate text-[14px] leading-tight ${c.unread_count > 0 ? 'font-black text-[#0f172a]' : 'font-bold text-[#1e293b]'}`}>{displayName}</p>
                            {c.last_message?.created_at && (
                              <span className={`text-[11px] shrink-0 ${c.unread_count > 0 ? 'font-bold text-[#16a34a]' : 'font-normal text-[#94a3b8]'}`}>
                                {new Date(c.last_message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className={`truncate text-[12px] mt-1 ${c.unread_count > 0 ? 'font-bold text-[#0f172a]' : 'text-[#64748b] font-normal'}`}>
                            {c.last_message?.content || 'Nenhuma mensagem ainda'}
                          </p>
                        </div>
                      </div>
                      {c.unread_count > 0 && (
                        <span className="min-w-[22px] h-[22px] px-1.5 rounded-full text-[11px] font-black bg-[#16a34a] text-white flex items-center justify-center shrink-0 ml-2 shadow-sm ring-2 ring-white animate-bounce">
                          {c.unread_count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Seção 2: Canais da Empresa */}
            <div className="py-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#94a3b8] px-5 py-1.5 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-[#16a34a]" /> Canais da Empresa
              </p>
              {filteredChannels.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleOpenChat(c)}
                  className="w-full text-left px-5 py-3 hover:bg-[#f5f5f5] text-[13px] font-semibold flex items-center justify-between cursor-pointer transition-colors border-b border-[#f1f5f9]/60 last:border-0"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-2xl bg-[#ecfdf5] border border-[#bbf7d0] flex items-center justify-center text-[#16a34a] font-bold shrink-0 shadow-2xs">
                      <Hash className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-[14px] text-[#1e293b] leading-tight">{c.name}</p>
                      <p className="text-[12px] text-[#94a3b8] font-normal truncate mt-0.5">
                        {c.last_message?.content || c.description || 'Canal de comunicação da equipe'}
                      </p>
                    </div>
                  </div>
                  {c.unread_count > 0 && (
                    <span className="min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-black bg-[#16a34a] text-white flex items-center justify-center shrink-0 shadow-xs">
                      {c.unread_count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Seção 3: Iniciar com Colaboradores */}
            <div className="py-2">
              <p className="text-[11px] font-black uppercase tracking-wider text-[#94a3b8] px-5 py-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-[#64748b]" /> Iniciar com Colaborador
              </p>
              {filteredCollaborators.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCollaborator(c.id, c.name)}
                  className="w-full text-left px-5 py-2.5 hover:bg-[#f5f5f5] text-[13px] font-medium text-[#475569] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative shrink-0">
                      {c.photo_url ? (
                        <img
                          src={c.photo_url}
                          alt={c.name}
                          className="w-9 h-9 rounded-full object-cover border border-[#e2e8f0] shadow-xs"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[12px] font-bold text-[#334155] shadow-xs">
                          {c.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-1 ring-white ${
                        c.online ? 'bg-[#16a34a]' : 'bg-[#cbd5e1]'
                      }`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-bold text-[#1e293b] truncate">{c.name}</p>
                      <p className="text-[11px] text-[#94a3b8] truncate">{c.role || 'Colaborador'}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 ml-2 ${
                    c.online ? 'bg-[#ecfdf5] text-[#16a34a]' : 'bg-[#f1f5f9] text-[#94a3b8]'
                  }`}>
                    {c.online ? 'Online' : 'Offline'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* ══════════════════════════════════════════════════════════════════════ */
        /* VISTA 2: JANELA DE CONVERSA SELECIONADA                               */
        /* ══════════════════════════════════════════════════════════════════════ */
        <div className="flex flex-col h-full bg-white">
          {/* Header da Conversa */}
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#f0f0f0] shrink-0 bg-white shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={handleBackToList}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#475569] hover:bg-[#f1f5f9] transition-colors cursor-pointer shrink-0"
                title="Voltar para a lista de conversas"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Foto ou Avatar do Contato / Canal */}
              <div className="relative shrink-0">
                {activeConversation?.type === 'GROUP' ? (
                  <div className="w-9 h-9 rounded-full bg-[#ecfdf5] border border-[#bbf7d0] flex items-center justify-center text-[#16a34a] font-bold shadow-xs">
                    <Hash className="w-5 h-5" />
                  </div>
                ) : activeColab?.photo_url ? (
                  <img
                    src={activeColab.photo_url}
                    alt={activeDisplayName}
                    className="w-9 h-9 rounded-full object-cover border border-[#e2e8f0] shadow-xs"
                  />
                ) : (
                  <div className={`w-9 h-9 rounded-full border flex items-center justify-center font-bold shadow-xs ${
                    isOnline 
                      ? 'bg-[#ecfdf5] border-[#bbf7d0] text-[#16a34a]' 
                      : 'bg-[#f1f5f9] border-[#e2e8f0] text-[#64748b]'
                  }`}>
                    <span className="text-[14px] font-extrabold">
                      {activeDisplayName.slice(0, 1).toUpperCase()}
                    </span>
                  </div>
                )}
                {activeConversation?.type !== 'GROUP' && (
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${
                    isOnline ? 'bg-[#16a34a]' : 'bg-[#94a3b8]'
                  }`} />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[15px] font-bold text-[#0f172a] leading-tight truncate max-w-[200px]">
                  {activeDisplayName}
                </p>
                <p className={`text-[11px] font-medium mt-0.5 truncate ${
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
            </div>

            {/* Controles de Fechar / Minimizar */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={handleMinimizeMessenger}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[#94a3b8] hover:bg-[#f5f5f5] hover:text-[#475569] transition-colors cursor-pointer"
                title="Minimizar"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={handleCloseMessenger}
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
                {messages.map(msg => {
                  const isGeral = activeConversation?.id === 'conv-geral'
                  const convId = (msg as any).conversation_id || ''
                  let channelLabel = ''
                  if (isGeral && convId && convId !== 'conv-geral') {
                    // Map conversation_id to a human label
                    if (convId === 'conv-expedicao') channelLabel = 'Expedição'
                    else if (convId === 'conv-financeiro') channelLabel = 'Financeiro'
                    else if (convId.startsWith('direct-')) channelLabel = 'Direto'
                    else {
                      const found = conversations.find(c => c.id === convId)
                      channelLabel = found?.name || convId
                    }
                  }
                  return (
                    <MessageCardRenderer
                      key={msg.id}
                      message={msg}
                      isMe={msg.sender_id === currentUser?.id || (!currentUser?.id && msg.sender_name === currentUser?.name)}
                      showChannel={isGeral && !!channelLabel}
                      channelName={channelLabel}
                    />
                  )
                })}
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
      )}
    </div>
  )
}
