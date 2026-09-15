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
  MessageCircle,
  Package,
  ShoppingCart
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
    let targetConv = conv
    const isDirect = targetConv.type === 'DIRECT' || targetConv.id.startsWith('direct-')
    if (isDirect && currentUser?.id) {
      const colab = getConversationColab(targetConv, currentUser.id, collaborators)
      if (colab?.id) {
        const correctDirectId = getDirectConvId(currentUser.id, colab.id)
        if (targetConv.id !== correctDirectId) {
          const existing = conversations.find(c => c.id === correctDirectId)
          if (existing) {
            targetConv = existing
          } else {
            targetConv = {
              ...targetConv,
              id: correctDirectId,
              name: colab.name
            }
          }
        }
      }
    }
    setActiveConversation(targetConv)
    setActiveChatRoomId(targetConv.id)
    markAsRead(targetConv.id)
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

function formatBytes(bytes: number, decimals = 1) {
  if (!+bytes) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function getChannelCollaborators(channel: { id: string; name?: string; members?: any[] }, collaborators: any[]) {
  const channelId = channel.id.toLowerCase()
  const name = (channel.name || '').toLowerCase()

  if (channelId === 'conv-geral' || name.includes('geral')) {
    return collaborators
  }

  if (channelId === 'conv-financeiro' || name.includes('financeiro') || name.includes('fiscal')) {
    const matched = collaborators.filter(c => {
      const r = (c.role || '').toLowerCase()
      const n = (c.name || '').toLowerCase()
      return (
        r.includes('finan') ||
        r.includes('fisc') ||
        r.includes('contab') ||
        r.includes('master') ||
        r.includes('admin') ||
        r.includes('propriet') ||
        n.includes('alison')
      )
    })
    return matched.length > 0 ? matched : collaborators
  }

  if (channelId === 'conv-expedicao' || name.includes('exped') || name.includes('logíst') || name.includes('estoq')) {
    const matched = collaborators.filter(c => {
      const r = (c.role || '').toLowerCase()
      const n = (c.name || '').toLowerCase()
      return (
        r.includes('exped') ||
        r.includes('logist') ||
        r.includes('estoq') ||
        r.includes('oper') ||
        r.includes('master') ||
        r.includes('admin') ||
        r.includes('propriet') ||
        n.includes('alison')
      )
    })
    return matched.length > 0 ? matched : collaborators
  }

  return collaborators
}

  // Estados para envio de imagem / arquivo
  const fileInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [imageCaption, setImageCaption] = useState('')
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [isUploadingDoc, setIsUploadingDoc] = useState(false)
  const [isImageModalOpen, setIsImageModalOpen] = useState(false)

  const handleOpenPhotoPicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    setIsImageModalOpen(true)
  }

  const handleOpenDocPicker = () => {
    if (docInputRef.current) {
      docInputRef.current.value = ''
      docInputRef.current.click()
    }
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedImageFile(file)
    setImagePreviewUrl(URL.createObjectURL(file))
    setIsImageModalOpen(true)
  }

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false)
    setSelectedImageFile(null)
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
      setImagePreviewUrl(null)
    }
    setImageCaption('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSendImage = async () => {
    if (!selectedImageFile || !activeConversation) return
    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedImageFile)
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) {
        throw new Error('Falha no upload da imagem')
      }
      const data = await res.json()
      if (data.url) {
        await sendMessage(
          activeConversation.id,
          imageCaption.trim() || 'Imagem enviada',
          'IMAGE',
          {
            image_url: data.url,
            file_name: data.fileName || selectedImageFile.name,
            file_size: formatBytes(selectedImageFile.size)
          }
        )
      }
      handleCloseImageModal()
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar imagem')
    } finally {
      setIsUploadingImage(false)
    }
  }

  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeConversation) return

    if (file.size > 50 * 1024 * 1024) {
      alert('O arquivo selecionado excede o limite de 50MB')
      return
    }

    setIsUploadingDoc(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/chat/upload', {
        method: 'POST',
        body: formData
      })
      if (!res.ok) {
        throw new Error('Falha no upload do arquivo')
      }
      const data = await res.json()
      if (data.url) {
        const isVideo = file.type.startsWith('video/') || /\.(mp4|mov|webm|avi|mkv)$/i.test(file.name)
        await sendMessage(
          activeConversation.id,
          file.name,
          'FILE',
          {
            file_url: data.url,
            file_name: data.fileName || file.name,
            file_size: formatBytes(file.size),
            mime_type: file.type,
            is_video: isVideo
          }
        )
      }
    } catch (err: any) {
      alert(err.message || 'Erro ao enviar arquivo')
    } finally {
      setIsUploadingDoc(false)
      if (docInputRef.current) {
        docInputRef.current.value = ''
      }
    }
  }

  const handleShareProduct = async () => {
    if (!activeConversation) return
    await sendMessage(
      activeConversation.id,
      'Produto compartilhado na conversa',
      'CARD_PRODUCT',
      {
        product_name: 'Parafusadeira / Furadeira de Impacto TEKNIX Pro 20V',
        product_sku: 'TK-FUR-20V-PRO',
        product_image: 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/bad56b70-dcfd-44a9-a76b-76469e84db1c-1788492640182.png',
        total_amount: 14
      }
    )
  }

  const handleShareOrder = async () => {
    if (!activeConversation) return
    await sendMessage(
      activeConversation.id,
      'Comprovante / Pedido compartilhado',
      'CARD_ORDER',
      {
        order_number: 'TK-' + Math.floor(100000 + Math.random() * 900000),
        marketplace_name: 'TEKNIX Store',
        total_amount: 489.90,
        customer_name: 'Alison Thiago',
        product_name: 'Kit de Ferramentas Industriais 128 Peças',
        invoice_number: 'NF-e 004.892'
      }
    )
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
    if (!conv) {
      conv = {
        id: directId,
        type: 'DIRECT',
        name: colabName,
        members: [{ id: currentUser.id, name: currentUser.name }, { id: colabId, name: colabName }],
        unread_count: 0,
        created_at: new Date().toISOString()
      }
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
      .filter(c => {
        const isDirect = c.type === 'DIRECT' || c.id.startsWith('direct-')
        if (!isDirect) return false
        if (!currentUser?.id) return false
        const isParticipant = c.id.includes(currentUser.id) ||
          (Array.isArray(c.members) && c.members.some((m: any) => m.id === currentUser.id))
        if (!isParticipant) return false
        // Apenas conversas com mensagens OU que sejam a conversa aberta no momento
        return !!c.last_message || c.id === activeConversation?.id
      })
      .forEach(c => {
        const colab = getConversationColab(c, currentUser?.id, collaborators)
        if (!colab?.id) return
        const partnerKey = colab.id
        if (!map.has(partnerKey)) {
          map.set(partnerKey, c)
        } else {
          // Mantém a que tiver a mensagem mais recente
          const existing = map.get(partnerKey)!
          const existingTime = existing.last_message?.created_at ? new Date(existing.last_message.created_at).getTime() : 0
          const curTime = c.last_message?.created_at ? new Date(c.last_message.created_at).getTime() : 0
          if (curTime > existingTime) {
            map.set(partnerKey, c)
          }
        }
      })
    return Array.from(map.values())
  }, [conversations, currentUser?.id, collaborators, activeConversation?.id])

  const activeColabIds = useMemo(() => {
    const ids = new Set<string>()
    directChats.forEach(c => {
      const colab = getConversationColab(c, currentUser?.id, collaborators)
      if (colab?.id) ids.add(colab.id)
    })
    return ids
  }, [directChats, currentUser?.id, collaborators])

  const otherCollaborators = useMemo(() => {
    return collaborators.filter(c => {
      if (c.id === currentUser?.id) return false
      if (currentUser?.email && c.email?.toLowerCase() === currentUser.email.toLowerCase()) return false
      if (currentUser?.name && c.name.toLowerCase() === currentUser.name.toLowerCase()) return false
      // Se já possui conversa ativa acima, não duplica na seção de iniciar
      if (activeColabIds.has(c.id)) return false
      return true
    })
  }, [collaborators, currentUser?.id, currentUser?.email, currentUser?.name, activeColabIds])

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
                      {(() => {
                        const channelColabs = getChannelCollaborators(c, collaborators)
                        const maxAvatars = 5
                        const displayed = channelColabs.slice(0, maxAvatars)
                        const remaining = channelColabs.length - maxAvatars

                        return (
                          <div className="hub-chat-channel-avatars-row">
                            <div className="hub-chat-channel-avatars-stack">
                              {displayed.map(colab => (
                                <div
                                  key={colab.id}
                                  className="hub-chat-channel-avatar-item"
                                  title={`${colab.name}${colab.role ? ` (${colab.role})` : ''}${colab.online ? ' • Online' : ''}`}
                                >
                                  {colab.photo_url ? (
                                    <img
                                      src={colab.photo_url}
                                      alt={colab.name}
                                      className="hub-chat-channel-avatar-img"
                                    />
                                  ) : (
                                    <div className="hub-chat-channel-avatar-fallback">
                                      {colab.name.slice(0, 1).toUpperCase()}
                                    </div>
                                  )}
                                  {colab.online && (
                                    <span className="hub-chat-channel-online-dot" />
                                  )}
                                </div>
                              ))}
                            </div>
                            {remaining > 0 && (
                              <span className="hub-chat-channel-more-badge">
                                +{remaining}
                              </span>
                            )}
                            <span className="hub-chat-channel-count-tag">
                              {channelColabs.length} {channelColabs.length === 1 ? 'membro' : 'membros'}
                            </span>
                          </div>
                        )
                      })()}
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
            {filteredCollaborators.length > 0 && (
              <div className="hub-chat-list-section">
                <p className="hub-chat-section-label">
                  <Users size={14} color="#64748b" /> Iniciar com Colaborador
                </p>
                {filteredCollaborators.map(c => (
                  <button
                    key={c.id}
                    onClick={() => handleSelectCollaborator(c.id, c.name)}
                    className="hub-chat-item-btn colab"
                  >
                    <div className="hub-chat-item-left">
                      <div className="hub-chat-avatar-wrap">
                        {c.photo_url ? (
                          <img
                            src={c.photo_url}
                            alt={c.name}
                            className="hub-chat-avatar-img"
                          />
                        ) : (
                          <div className="hub-chat-avatar-placeholder">
                            {c.name.slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`hub-chat-presence-indicator ${c.online ? 'online' : 'offline'}`}
                          title={c.presenceStatus || (c.online ? 'Online' : 'Offline')}
                        />
                      </div>
                      <div className="hub-chat-item-text">
                        <p className="hub-chat-item-name">{c.name}</p>
                        <p className="hub-chat-item-msg">{c.role || 'Colaborador'}</p>
                      </div>
                    </div>
                    <span className={`hub-chat-colab-status ${c.online ? 'online' : 'offline'}`}>
                      {c.presenceStatus || (c.online ? 'Online' : 'Offline')}
                    </span>
                  </button>
                ))}
              </div>
            )}
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
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleImageFileChange}
                style={{ display: 'none' }}
              />
              <input
                type="file"
                ref={docInputRef}
                accept=".pdf,.xlsx,.xls,.doc,.docx,.csv,.txt,.zip,.rar,.mp4,.mov,application/pdf,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,text/plain,video/mp4,video/quicktime"
                onChange={handleDocFileChange}
                style={{ display: 'none' }}
              />
              <div className="hub-chat-quick-actions">
                <button
                  type="button"
                  onClick={handleOpenPhotoPicker}
                  className="hub-chat-quick-btn"
                >
                  <ImageIcon size={14} color="#16a34a" /> Foto
                </button>
                <button
                  type="button"
                  onClick={handleOpenDocPicker}
                  disabled={isUploadingDoc}
                  className="hub-chat-quick-btn"
                  style={{ opacity: isUploadingDoc ? 0.5 : 1 }}
                >
                  <Paperclip size={14} color="#64748b" /> {isUploadingDoc ? 'Enviando...' : 'Arquivo'}
                </button>
                <button
                  type="button"
                  onClick={handleShareProduct}
                  className="hub-chat-quick-btn"
                  title="Compartilhar Produto"
                >
                  <Package size={14} color="#d97706" /> Produto
                </button>
                <button
                  type="button"
                  onClick={handleShareOrder}
                  className="hub-chat-quick-btn"
                  title="Compartilhar Pedido / NF-e"
                >
                  <ShoppingCart size={14} color="#3b82f6" /> Pedido
                </button>
              </div>
              <span className="hub-chat-input-hint">Enter para enviar</span>
            </div>
          </div>

          {/* Modal de Upload de Foto */}
          {isImageModalOpen && (
            <div className="hub-chat-upload-modal">
              <div className="hub-chat-upload-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#ecfdf5', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ImageIcon size={16} color="#16a34a" />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Enviar Foto</h3>
                    <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Para {activeDisplayName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseImageModal}
                  className="hub-chat-icon-btn"
                  title="Fechar"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="hub-chat-upload-body">
                {imagePreviewUrl ? (
                  <div className="hub-chat-upload-preview-box">
                    <img
                      src={imagePreviewUrl}
                      alt="Prévia"
                      className="hub-chat-upload-preview-img"
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    style={{ width: '100%', maxWidth: 320, height: 180, border: '2px dashed #cbd5e1', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f8fafc', gap: 8 }}
                  >
                    <ImageIcon size={32} color="#94a3b8" />
                    <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>Clique para escolher uma imagem</span>
                    <span style={{ fontSize: 11, color: '#94a3b8' }}>PNG, JPG, WEBP até 10MB</span>
                  </div>
                )}

                {imagePreviewUrl && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#475569', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 8, cursor: 'pointer' }}
                    >
                      Trocar Foto
                    </button>
                  </div>
                )}

                <input
                  type="text"
                  placeholder="Escreva uma legenda opcional..."
                  value={imageCaption}
                  onChange={e => setImageCaption(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSendImage()
                    }
                  }}
                  className="hub-chat-upload-caption-input"
                />
              </div>

              <div className="hub-chat-upload-footer">
                <button
                  type="button"
                  onClick={handleCloseImageModal}
                  className="hub-chat-upload-btn-cancel"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSendImage}
                  disabled={!selectedImageFile || isUploadingImage}
                  className="hub-chat-upload-btn-send"
                >
                  {isUploadingImage ? 'Enviando...' : 'Enviar Foto'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
