import React, { useState, useRef, useEffect, useMemo } from 'react'
import {
  useInternalChat,
  getDirectConvId,
  getConversationDisplayName,
  getConversationColab
} from '../../contexts/InternalChatContext'
import MessageCardRenderer from './MessageCardRenderer'
import { TeknixT } from '../TeknixT'
import {
  X,
  Minus,
  Send,
  Paperclip,
  Image as ImageIcon,
  Users,
  Hash,
  Search,
  ArrowLeft,
  MessageCircle
} from 'lucide-react'
import './FloatingMessenger.css'

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

  // ── Botão flutuante (minimizado ou fechado) ──────────────────────────────
  if (!isFloatingOpen || isFloatingMinimized) {
    const hasUnread = totalUnreadCount > 0
    return (
      <div className="hub-chat-floating-btn-container">
        <button
          onClick={handleOpenMessenger}
          className={`hub-chat-floating-btn ${hasUnread ? 'has-unread' : ''}`}
          title="Chat Interno TEKNIX"
          aria-label="Chat Interno TEKNIX"
        >
          <TeknixT width={20} height={20} style={{ color: '#1e293b' }} />
          {hasUnread && (
            <span className="hub-chat-floating-badge">
              {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
            </span>
          )}
        </button>
      </div>
    )
  }

  // ── Gaveta Lateral do Messenger ──────────────────────────────────────────
  return (
    <div className="hub-chat-drawer">
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* VISTA 1: LISTA DE CONVERSAS (INBOX)                                   */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {currentView === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header Inbox */}
          <div className="hub-chat-header">
            <div className="hub-chat-header-info">
              <div className="hub-chat-brand-icon">
                <TeknixT width={18} height={18} />
              </div>
              <div>
                <h2 className="hub-chat-header-title">Chat Interno</h2>
                <p className="hub-chat-header-subtitle">Equipe & Operação TEKNIX</p>
              </div>
            </div>

            <div className="hub-chat-header-actions">
              <button
                onClick={handleMinimizeMessenger}
                className="hub-chat-icon-btn"
                title="Minimizar"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={handleCloseMessenger}
                className="hub-chat-icon-btn close"
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Campo de Busca */}
          <div className="hub-chat-search-wrap">
            <div className="hub-chat-search-box">
              <Search size={15} color="#94a3b8" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Buscar conversa ou colega..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="hub-chat-search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Lista de Conversas com Scroll */}
          <div className="hub-chat-list-body">
            {/* Seção 1: Conversas Recentes / Diretas */}
            {filteredDirectChats.length > 0 && (
              <div className="hub-chat-list-section">
                <p className="hub-chat-section-label">
                  <MessageCircle size={14} color="#3b82f6" /> Conversas Diretas
                </p>
                {filteredDirectChats.map(c => {
                  const displayName = getConversationDisplayName(c, currentUser?.id, collaborators)
                  const colab = getConversationColab(c, currentUser?.id, collaborators)
                  const colabOnline = colab ? colab.online : false

                  return (
                    <button
                      key={c.id}
                      onClick={() => handleOpenChat(c)}
                      className="hub-chat-item-btn"
                    >
                      <div className="hub-chat-item-left">
                        <div className="hub-chat-avatar-wrap">
                          {colab?.photo_url ? (
                            <img
                              src={colab.photo_url}
                              alt={displayName}
                              className="hub-chat-avatar-img"
                            />
                          ) : (
                            <div className="hub-chat-avatar-placeholder">
                              {displayName.slice(0, 1).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`hub-chat-presence-indicator ${colabOnline ? 'online' : 'offline'}`}
                            title={colab?.presenceStatus || (colabOnline ? 'Online' : 'Offline')}
                          />
                        </div>
                        <div className="hub-chat-item-text">
                          <div className="hub-chat-item-top">
                            <p className={`hub-chat-item-name ${c.unread_count > 0 ? 'unread' : ''}`}>
                              {displayName}
                            </p>
                            {c.last_message?.created_at && (
                              <span className={`hub-chat-item-time ${c.unread_count > 0 ? 'unread' : ''}`}>
                                {new Date(c.last_message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          <p className={`hub-chat-item-msg ${c.unread_count > 0 ? 'unread' : ''}`}>
                            {c.last_message?.content || 'Nenhuma mensagem ainda'}
                          </p>
                        </div>
                      </div>
                      {c.unread_count > 0 && (
                        <span className="hub-chat-unread-badge">
                          {c.unread_count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Seção 2: Canais da Empresa */}
            <div className="hub-chat-list-section">
              <p className="hub-chat-section-label">
                <Hash size={14} color="#16a34a" /> Canais da Empresa
              </p>
              {filteredChannels.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleOpenChat(c)}
                  className="hub-chat-item-btn"
                >
                  <div className="hub-chat-item-left">
                    <div className="hub-chat-channel-icon">
                      <Hash size={20} />
                    </div>
                    <div className="hub-chat-item-text">
                      <p className="hub-chat-item-name" style={{ fontWeight: 700 }}>
                        {c.name}
                      </p>
                      <p className="hub-chat-item-msg">
                        {c.last_message?.content || c.description || 'Canal de comunicação da equipe'}
                      </p>
                    </div>
                  </div>
                  {c.unread_count > 0 && (
                    <span className="hub-chat-unread-badge">
                      {c.unread_count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Seção 3: Iniciar com Colaboradores */}
            <div className="hub-chat-list-section">
              <p className="hub-chat-section-label">
                <Users size={14} color="#64748b" /> Iniciar com Colaborador
              </p>
              {filteredCollaborators.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCollaborator(c.id, c.name)}
                  className="hub-chat-item-btn"
                  style={{ padding: '10px 18px' }}
                >
                  <div className="hub-chat-item-left">
                    <div className="hub-chat-avatar-wrap">
                      {c.photo_url ? (
                        <img
                          src={c.photo_url}
                          alt={c.name}
                          className="hub-chat-avatar-img"
                          style={{ width: 36, height: 36 }}
                        />
                      ) : (
                        <div className="hub-chat-avatar-placeholder" style={{ width: 36, height: 36, fontSize: 13 }}>
                          {c.name.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <span
                        className={`hub-chat-presence-indicator ${c.online ? 'online' : 'offline'}`}
                        title={c.presenceStatus || (c.online ? 'Online' : 'Offline')}
                      />
                    </div>
                    <div className="hub-chat-item-text">
                      <p className="hub-chat-item-name" style={{ fontSize: 13 }}>{c.name}</p>
                      <p className="hub-chat-item-msg" style={{ fontSize: 11 }}>{c.role || 'Colaborador'}</p>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 9999,
                      marginLeft: 8,
                      flexShrink: 0,
                      backgroundColor: c.online ? '#ecfdf5' : '#f1f5f9',
                      color: c.online ? '#16a34a' : '#94a3b8'
                    }}
                  >
                    {c.presenceStatus || (c.online ? 'Online' : 'Offline')}
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
        <div className="hub-chat-room">
          {/* Header da Conversa */}
          <div className="hub-chat-header">
            <div className="hub-chat-header-info">
              <button
                onClick={handleBackToList}
                className="hub-chat-icon-btn"
                title="Voltar para a lista"
              >
                <ArrowLeft size={18} />
              </button>

              {/* Avatar do Contato / Canal */}
              <div className="hub-chat-avatar-wrap">
                {activeConversation?.type === 'GROUP' ? (
                  <div className="hub-chat-channel-icon" style={{ width: 36, height: 36, borderRadius: 12 }}>
                    <Hash size={18} />
                  </div>
                ) : activeColab?.photo_url ? (
                  <img
                    src={activeColab.photo_url}
                    alt={activeDisplayName}
                    className="hub-chat-avatar-img"
                    style={{ width: 36, height: 36 }}
                  />
                ) : (
                  <div className="hub-chat-avatar-placeholder" style={{ width: 36, height: 36, fontSize: 13 }}>
                    {activeDisplayName.slice(0, 1).toUpperCase()}
                  </div>
                )}
                {activeConversation?.type !== 'GROUP' && (
                  <span
                    className={`hub-chat-presence-indicator ${isOnline ? 'online' : 'offline'}`}
                    title={activeColab?.presenceStatus || (isOnline ? 'Online' : 'Offline')}
                  />
                )}
              </div>

              <div style={{ minWidth: 0 }}>
                <p className="hub-chat-header-title" style={{ maxWidth: 210, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {activeDisplayName}
                </p>
                <p className="hub-chat-header-subtitle">
                  {activeConversation?.type === 'GROUP'
                    ? (systemChannels.find(s => s.id === activeConversation.id)?.description || 'Canal da Empresa')
                    : (activeColab?.presenceStatus || (isOnline ? '● Online agora' : '○ Offline'))}
                </p>
              </div>
            </div>

            {/* Ações Minimizar / Fechar */}
            <div className="hub-chat-header-actions">
              <button
                onClick={handleMinimizeMessenger}
                className="hub-chat-icon-btn"
                title="Minimizar"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={handleCloseMessenger}
                className="hub-chat-icon-btn close"
                title="Fechar"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── Área de mensagens com scroll ──────────────────────────────── */}
          <div className="hub-chat-room-messages">
            {messages.length === 0 ? (
              <div className="hub-chat-empty-state">
                <div className="hub-chat-empty-icon">
                  <TeknixT width={28} height={28} />
                </div>
                <p className="hub-chat-empty-title">Nenhuma mensagem ainda</p>
                <p className="hub-chat-empty-desc">
                  Envie uma mensagem para conversar com <strong>{activeDisplayName}</strong> em tempo real.
                </p>
              </div>
            ) : (
              messages.map(msg => {
                const isGeral = activeConversation?.id === 'conv-geral'
                const convId = (msg as any).conversation_id || ''
                let channelLabel = ''
                if (isGeral && convId && convId !== 'conv-geral') {
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
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Input e Controles ─────────────────────────────────────────── */}
          <div className="hub-chat-input-container">
            <div className="hub-chat-input-bar">
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
                className="hub-chat-text-input"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="hub-chat-send-btn"
                title="Enviar mensagem"
              >
                <Send size={15} />
              </button>
            </div>

            <div className="hub-chat-input-actions">
              <div className="hub-chat-quick-actions">
                <button
                  type="button"
                  onClick={() => alert('Envio de foto em desenvolvimento')}
                  className="hub-chat-quick-btn"
                >
                  <ImageIcon size={14} color="#16a34a" /> Foto
                </button>
                <button
                  type="button"
                  onClick={() => alert('Envio de arquivo em desenvolvimento')}
                  className="hub-chat-quick-btn"
                >
                  <Paperclip size={14} color="#64748b" /> Arquivo
                </button>
              </div>
              <span className="hub-chat-input-hint">Enter para enviar</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
