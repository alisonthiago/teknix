/* ============================================================
   TEKNIX HUB — CONTEXTO GLOBAL DO CHAT INTERNO EM TEMPO REAL
   Mesma base, mesmas conversas, mesma presença do FLOW.
   ============================================================ */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { InternalConversation, InternalMessage, InternalTask, ChatMember, MessageType } from '../types/internal-chat'
import { notifyHub } from '../lib/hubNotifications'

interface InternalChatContextData {
  conversations: InternalConversation[]
  activeConversation: InternalConversation | null
  setActiveConversation: (c: InternalConversation | null) => void
  messages: InternalMessage[]
  loadingMessages: boolean
  totalUnreadCount: number
  isFloatingOpen: boolean
  setIsFloatingOpen: (open: boolean) => void
  isFloatingMinimized: boolean
  setIsFloatingMinimized: (min: boolean) => void
  activeChatRoomId: string | null
  setActiveChatRoomId: (id: string | null) => void
  collaborators: ChatMember[]
  currentUser: { id: string; name: string; email?: string; role?: string; photo_url?: string } | null
  sendMessage: (conversationId: string, content: string, messageType?: MessageType, metadata?: any, replyTo?: any) => Promise<void>
  createConversation: (name: string, type: 'DIRECT' | 'GROUP', memberIds: string[], explicitId?: string) => Promise<InternalConversation | null>
  markAsRead: (conversationId: string) => void
}

const InternalChatContext = createContext<InternalChatContextData>({} as InternalChatContextData)

export function useInternalChat() {
  return useContext(InternalChatContext)
}

// Remove emojis de títulos para padronização visual
export function removeEmojis(str: string): string {
  if (!str) return ''
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Gera ID determinístico para DMs compartilhadas entre FLOW e HUB
export function getDirectConvId(a: string, b: string): string {
  return 'direct-' + [a, b].sort().join('__')
}

// Retorna nome exibido da conversa
export function getConversationDisplayName(
  conv: InternalConversation,
  currentUserId?: string,
  collaborators: ChatMember[] = []
): string {
  if (conv.type === 'GROUP') {
    return conv.name
  }
  if (conv.id.startsWith('direct-')) {
    const ids = conv.id.replace('direct-', '').split('__')
    const otherId = ids.find(id => id !== currentUserId) || ids[0]
    const otherColab = collaborators.find(c => c.id === otherId)
    if (otherColab) return otherColab.name
  }
  const otherMember = conv.members?.find(m => m.id !== currentUserId)
  if (otherMember) {
    const colab = collaborators.find(c => c.id === otherMember.id)
    return colab?.name || otherMember.name
  }
  return conv.name
}

// Retorna o colaborador associado a uma conversa direta
export function getConversationColab(
  conv: InternalConversation,
  currentUserId?: string,
  collaborators: ChatMember[] = []
): ChatMember | undefined {
  if (conv.type === 'GROUP') return undefined
  if (conv.id.startsWith('direct-')) {
    const ids = conv.id.replace('direct-', '').split('__')
    const otherId = ids.find(id => id !== currentUserId) || ids[0]
    return collaborators.find(c => c.id === otherId)
  }
  const otherMember = conv.members?.find(m => m.id !== currentUserId)
  if (otherMember) {
    return collaborators.find(c => c.id === otherMember.id) || otherMember
  }
  return undefined
}

// Canais operacionais padrão da empresa
const DEFAULT_SYSTEM_CONVERSATIONS: InternalConversation[] = [
  {
    id: 'conv-geral',
    type: 'GROUP',
    name: 'Geral',
    description: 'Canal principal de comunicação da equipe',
    members: [],
    unread_count: 0,
    created_at: new Date().toISOString()
  },
  {
    id: 'conv-expedicao',
    type: 'GROUP',
    name: 'Expedição & Logística',
    description: 'Separação, embalagem e envio de pedidos',
    members: [],
    unread_count: 0,
    created_at: new Date().toISOString()
  },
  {
    id: 'conv-financeiro',
    type: 'GROUP',
    name: 'Financeiro & Notas Fiscais',
    description: 'Emissão de notas fiscais, faturamento e custos',
    members: [],
    unread_count: 0,
    created_at: new Date().toISOString()
  }
]

function getLastReadMap(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem('chat_last_read_timestamps') || '{}')
  } catch {
    return {}
  }
}

function setLastReadMap(convId: string) {
  if (typeof window === 'undefined') return
  try {
    const map = getLastReadMap()
    map[convId] = new Date().toISOString()
    localStorage.setItem('chat_last_read_timestamps', JSON.stringify(map))
  } catch {}
}

export function InternalChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<InternalConversation[]>(DEFAULT_SYSTEM_CONVERSATIONS)
  const [activeConversation, setActiveConversationState] = useState<InternalConversation | null>(DEFAULT_SYSTEM_CONVERSATIONS[0])
  const [messagesMap, setMessagesMap] = useState<Record<string, InternalMessage[]>>({})
  const [collaborators, setCollaborators] = useState<ChatMember[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email?: string; role?: string; photo_url?: string } | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('teknix_chat_current_user')
        if (cached) return JSON.parse(cached)
      } catch {}
    }
    return null
  })

  const [isFloatingOpen, setIsFloatingOpen] = useState(false)
  const [isFloatingMinimized, setIsFloatingMinimized] = useState(false)
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const activeConvRef = useRef<InternalConversation | null>(activeConversation)
  const floatingOpenRef = useRef(isFloatingOpen)
  const floatingMinRef = useRef(isFloatingMinimized)
  const activeChatRoomIdRef = useRef<string | null>(activeChatRoomId)
  const currentUserRef = useRef(currentUser)
  const channelRef = useRef<any>(null)
  const onlineUserIdsRef = useRef<Set<string>>(new Set())
  const userPresenceAppsRef = useRef<Map<string, Set<string>>>(new Map())
  const sessionIdRef = useRef<string>(typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'hub-sess-' + Math.random().toString(36).substring(2, 9))

  useEffect(() => {
    activeConvRef.current = activeConversation
    floatingOpenRef.current = isFloatingOpen
    floatingMinRef.current = isFloatingMinimized
    activeChatRoomIdRef.current = activeChatRoomId
    currentUserRef.current = currentUser
  }, [activeConversation, isFloatingOpen, isFloatingMinimized, activeChatRoomId, currentUser])

  const setActiveConversation = useCallback((c: InternalConversation | null) => {
    setActiveConversationState(c)
    if (c && floatingOpenRef.current && !floatingMinRef.current) {
      setLastReadMap(c.id)
      setConversations(prev => prev.map(item => item.id === c.id ? { ...item, unread_count: 0 } : item))
    }
  }, [])

  // 1. Identificar Usuário Autenticado no Supabase
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, email, role, avatar_url, photo_url')
            .eq('id', user.id)
            .maybeSingle()

          const userName = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Alison Thiago'
          const userObj = {
            id: user.id,
            name: removeEmojis(userName),
            email: user.email || profile?.email || 'alison@teknix.com.br',
            role: profile?.role || 'ADMIN',
            photo_url: profile?.avatar_url || profile?.photo_url || user.user_metadata?.avatar_url || 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/3af9068a-4b78-4c9c-8657-f83b93c01588-1787179225140.jpg'
          }
          setCurrentUser(userObj)
          try {
            localStorage.setItem('teknix_chat_current_user', JSON.stringify(userObj))
          } catch {}
        } else {
          // Fallback seguro de perfil logado do HUB
          const userObj = {
            id: '3af9068a-4b78-4c9c-8657-f83b93c01588',
            name: 'Alison Thiago',
            email: 'alison@teknix.com.br',
            role: 'ADMIN',
            photo_url: 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/3af9068a-4b78-4c9c-8657-f83b93c01588-1787179225140.jpg'
          }
          setCurrentUser(userObj)
          try {
            localStorage.setItem('teknix_chat_current_user', JSON.stringify(userObj))
          } catch {}
        }
      } catch (err) {
        console.warn('[InternalChat] Erro ao carregar usuário autenticado:', err)
      }
    }

    fetchUser()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })
    return () => subscription.unsubscribe()
  }, [])

  // Filtro de colaboradores autorizados (remove clientes e contas de teste)
  const isInternalCollaborator = useCallback((p: any) => {
    if (!p) return false
    const role = (p.role || '').toUpperCase()
    const name = (p.name || '').toLowerCase()
    if (role === 'CLIENTE' || role === 'CUSTOMER' || role === 'CLIENT') return false
    if (name.includes('cliente a') || name.includes('cliente b') || name.includes('admin demo teknix')) return false
    return true
  }, [])

  // 2. Carregar Conversas e Colaboradores via API Centralizada (mesma do FLOW)
  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations')
      if (!res.ok) return
      const data = await res.json()

      const dbConversations = data.conversations || []
      const allProfiles = data.profiles || []
      const recentMsgs = data.recentMessages || []

      // Filtra clientes externos e contas de teste
      const profiles = allProfiles.filter(isInternalCollaborator)

      // Atualiza colaboradores com presença real
      if (profiles && profiles.length > 0) {
        const currentUid = currentUserRef.current?.id
        const realMembers: ChatMember[] = profiles.map((p: any) => {
          const apps = userPresenceAppsRef.current.get(p.id) || (currentUid && p.id === currentUid ? new Set(['HUB']) : new Set())
          const hasHub = apps.has('HUB')
          const hasFlow = apps.has('FLOW')
          const isOnline = apps.size > 0

          let lastActivity = 'Offline'
          if (hasHub && hasFlow) lastActivity = 'Online no HUB e FLOW'
          else if (hasHub) lastActivity = 'Online no HUB'
          else if (hasFlow) lastActivity = 'Online no FLOW'
          else if (isOnline) lastActivity = 'Online agora'

          return {
            id: p.id,
            name: removeEmojis(p.name || p.email?.split('@')[0] || 'Colaborador'),
            email: p.email || '',
            role: p.role || 'Operador',
            photo_url: p.avatar_url || p.photo_url,
            online: isOnline,
            last_activity: lastActivity
          }
        })
        setCollaborators(realMembers)
      }

      // Mapeia a última mensagem de cada conversa
      const lastMsgMap = new Map<string, { content: string; sender_name: string; created_at: string }>()
      recentMsgs.forEach((m: any) => {
        if (m.conversation_id && !lastMsgMap.has(m.conversation_id)) {
          lastMsgMap.set(m.conversation_id, {
            content: m.content || 'Mensagem enviada',
            sender_name: m.sender_name || 'Colaborador',
            created_at: m.created_at
          })
        }
      })

      const lastReadMap = getLastReadMap()
      const currentUid = currentUserRef.current?.id
      const convMap = new Map<string, InternalConversation>()

      // 1. Canais do Sistema
      DEFAULT_SYSTEM_CONVERSATIONS.forEach(c => {
        const last = lastMsgMap.get(c.id)
        const unreadCount = recentMsgs.filter((m: any) => {
          if (m.conversation_id !== c.id) return false
          if (currentUid && m.sender_id === currentUid) return false
          const lastRead = lastReadMap[c.id]
          if (!lastRead) return false
          return new Date(m.created_at).getTime() > new Date(lastRead).getTime()
        }).length

        convMap.set(c.id, {
          ...c,
          unread_count: unreadCount,
          last_message: last || c.last_message
        })
      })

      // 2. Conversas Salvas no Banco
      dbConversations.forEach((c: any) => {
        const isDirect = c.type === 'DIRECT' || c.id.startsWith('direct-')
        if (isDirect && currentUid) {
          // Garante que o usuário atual é participante desta conversa direta
          const isParticipant = c.id.includes(currentUid) ||
            (Array.isArray(c.members) && c.members.some((m: any) => m.id === currentUid))
          if (!isParticipant) {
            return // Ignora DMs privadas de outros colaboradores
          }
        }

        const existing = convMap.get(c.id)
        const last = lastMsgMap.get(c.id)

        const unreadCount = recentMsgs.filter((m: any) => {
          if (m.conversation_id !== c.id) return false
          if (currentUid && m.sender_id === currentUid) return false
          const lastRead = lastReadMap[c.id]
          if (!lastRead) return true
          return new Date(m.created_at).getTime() > new Date(lastRead).getTime()
        }).length

        const isViewing = activeChatRoomIdRef.current === c.id

        convMap.set(c.id, {
          id: c.id,
          type: c.type || (c.id.startsWith('direct-') ? 'DIRECT' : 'GROUP'),
          name: removeEmojis(c.name),
          description: removeEmojis(c.description || ''),
          members: c.members || [],
          unread_count: isViewing ? 0 : Math.max(unreadCount, existing?.unread_count || 0),
          last_message: last || existing?.last_message,
          created_at: c.created_at
        })
      })

      // 3. Conversas Diretas Determinísticas com mensagens ou ativa no momento
      if (currentUid && profiles && profiles.length > 0) {
        profiles.forEach((p: any) => {
          if (p.id !== currentUid) {
            const directId = getDirectConvId(currentUid, p.id)
            const last = lastMsgMap.get(directId)
            const isViewingDirect = activeChatRoomIdRef.current === directId

            // Só insere no mapa se houver mensagem real ou se for a conversa aberta atualmente
            if (!convMap.has(directId) && (last || isViewingDirect)) {
              const unreadCount = recentMsgs.filter((m: any) => {
                if (m.conversation_id !== directId) return false
                if (m.sender_id === currentUid) return false
                const lastRead = lastReadMap[directId]
                if (!lastRead) return true
                return new Date(m.created_at).getTime() > new Date(lastRead).getTime()
              }).length

              convMap.set(directId, {
                id: directId,
                type: 'DIRECT',
                name: removeEmojis(p.name || 'Colaborador'),
                description: '',
                members: [
                  { id: currentUid, name: currentUserRef.current?.name || 'Eu' },
                  { id: p.id, name: p.name || 'Colaborador', photo_url: p.photo_url || p.avatar_url }
                ],
                unread_count: isViewingDirect ? 0 : unreadCount,
                last_message: last,
                created_at: new Date().toISOString()
              })
            }
          }
        })
      }

      const merged = Array.from(convMap.values())

      setConversations(prev => {
        return merged.map(m => {
          const old = prev.find(p => p.id === m.id)
          const latestLastMessage = (m.last_message && old?.last_message)
            ? (new Date(m.last_message.created_at).getTime() >= new Date(old.last_message.created_at).getTime() ? m.last_message : old.last_message)
            : (m.last_message || old?.last_message)

          const isViewing = activeChatRoomIdRef.current === m.id
          const preservedUnreadCount = isViewing ? 0 : Math.max(m.unread_count || 0, old?.unread_count || 0)

          return {
            ...m,
            last_message: latestLastMessage,
            unread_count: preservedUnreadCount
          }
        })
      })

      if (!activeConvRef.current) {
        const geral = convMap.get('conv-geral') || DEFAULT_SYSTEM_CONVERSATIONS[0]
        setActiveConversationState(geral)
      }
    } catch (err) {
      console.warn('[InternalChat] Erro ao carregar conversas:', err)
    }
  }, [isInternalCollaborator])

  useEffect(() => {
    refreshConversations()
  }, [refreshConversations])

  // 3. Carregar Mensagens da Conversa Ativa via API Centralizada
  const refreshActiveMessages = useCallback(async () => {
    const activeId = activeConvRef.current?.id
    if (!activeId) return

    try {
      const res = await fetch(`/api/chat/messages?conversation_id=${encodeURIComponent(activeId)}`)
      if (!res.ok) return
      const data = await res.json()

      if (data.messages && Array.isArray(data.messages)) {
        setMessagesMap(prev => {
          const currentList = prev[activeId] || []
          const msgMap = new Map<string, InternalMessage>()

          // 1. Mensagens vindas do banco
          data.messages.forEach((m: InternalMessage) => msgMap.set(m.id, m))

          // 2. Preserva mensagens otimistas locais
          currentList.forEach((m: InternalMessage) => {
            if (!msgMap.has(m.id)) {
              msgMap.set(m.id, m)
            }
          })

          const merged = Array.from(msgMap.values()).sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          )

          return {
            ...prev,
            [activeId]: merged
          }
        })
      }
    } catch (err) {
      console.warn('[InternalChat] Erro ao carregar mensagens:', err)
    }
  }, [])

  useEffect(() => {
    if (!activeConversation?.id) return
    setLoadingMessages(true)
    refreshActiveMessages().finally(() => setLoadingMessages(false))
  }, [activeConversation?.id, refreshActiveMessages])

  // 4. Polling Suave de Fundo (a cada 3s)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshActiveMessages()
      refreshConversations()
    }, 3000)
    return () => clearInterval(interval)
  }, [refreshActiveMessages, refreshConversations])

  // 5. Supabase Realtime (Presence + Broadcast + Postgres Changes)
  useEffect(() => {
    const channel = supabase.channel('internal-chat-realtime', {
      config: {
        presence: {
          key: currentUser?.id || 'hub-anon-' + Math.random().toString(36).substring(2, 7)
        },
        broadcast: {
          self: true
        }
      }
    })
    channelRef.current = channel

    // ── PRESENCE SYNC (Multi-sessão FLOW + HUB) ──────────────────────────
    channel.on('presence', { event: 'sync' }, () => {
      const state = channel.presenceState()
      const onlineIds = new Set<string>()
      const presenceMap = new Map<string, Set<string>>()

      Object.values(state).forEach((presences: any) => {
        presences.forEach((p: any) => {
          if (p.user_id) {
            onlineIds.add(p.user_id)
            const apps = presenceMap.get(p.user_id) || new Set<string>()
            apps.add(p.app || 'HUB')
            presenceMap.set(p.user_id, apps)
          }
        })
      })

      onlineUserIdsRef.current = onlineIds
      userPresenceAppsRef.current = presenceMap

      setCollaborators(prev => prev.map(c => {
        const apps = presenceMap.get(c.id) || (currentUserRef.current?.id && c.id === currentUserRef.current.id ? new Set(['HUB']) : new Set())
        const hasHub = apps.has('HUB')
        const hasFlow = apps.has('FLOW')
        const isOnline = apps.size > 0

        let lastActivity = 'Offline'
        if (hasHub && hasFlow) lastActivity = 'Online no HUB e FLOW'
        else if (hasHub) lastActivity = 'Online no HUB'
        else if (hasFlow) lastActivity = 'Online no FLOW'
        else if (isOnline) lastActivity = 'Online agora'

        return {
          ...c,
          online: isOnline,
          last_activity: lastActivity
        }
      }))
    })

    // ── RECEBIMENTO DE MENSAGENS EM TEMPO REAL ───────────────────────────
    const handleIncoming = (msg: any) => {
      if (!msg || !msg.conversation_id) return
      const currentUserId = currentUserRef.current?.id
      const isOwn = currentUserId && msg.sender_id === currentUserId

      // Notificação sonora / toast se a mensagem for de outro colaborador
      if (!isOwn) {
        notifyHub(`${msg.sender_name || 'Chat Interno'}: ${msg.content || 'Nova mensagem'}`, 'info')
      }

      // Atualiza mensagens da conversa
      setMessagesMap(prev => {
        const updated = { ...prev }
        const currentList = updated[msg.conversation_id] || []
        if (!currentList.some(m => m.id === msg.id)) {
          updated[msg.conversation_id] = [...currentList, msg]
        }

        if (msg.conversation_id !== 'conv-geral' && updated['conv-geral']) {
          const geralList = updated['conv-geral']
          if (!geralList.some(m => m.id === msg.id)) {
            updated['conv-geral'] = [...geralList, msg]
          }
        }
        return updated
      })

      // Atualiza badge de não lidas e preview da conversa
      setConversations(prev => {
        const exists = prev.some(c => c.id === msg.conversation_id)
        if (exists) {
          return prev.map(c => {
            if (c.id === msg.conversation_id) {
              const isViewing = activeChatRoomIdRef.current === msg.conversation_id
              return {
                ...c,
                last_message: {
                  content: msg.content || 'Mensagem recebida',
                  sender_name: msg.sender_name,
                  created_at: msg.created_at || new Date().toISOString()
                },
                unread_count: (isViewing || isOwn) ? 0 : (c.unread_count + 1)
              }
            }
            return c
          })
        } else {
          const newConv: InternalConversation = {
            id: msg.conversation_id,
            type: msg.conversation_id.startsWith('direct-') ? 'DIRECT' : 'GROUP',
            name: msg.sender_name || 'Conversa',
            members: [{ id: msg.sender_id, name: msg.sender_name }],
            unread_count: isOwn ? 0 : 1,
            last_message: {
              content: msg.content || 'Mensagem recebida',
              sender_name: msg.sender_name,
              created_at: msg.created_at || new Date().toISOString()
            },
            created_at: msg.created_at || new Date().toISOString()
          }
          return [newConv, ...prev]
        }
      })
    }

    // Escuta Broadcast direto
    channel.on('broadcast', { event: 'new_message' }, ({ payload }) => handleIncoming(payload))

    // Escuta mudanças reais no Postgres (internal_messages)
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'internal_messages'
      },
      (payload) => {
        handleIncoming(payload.new)
      }
    )

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED' && currentUser) {
        await channel.track({
          user_id: currentUser.id,
          user_name: currentUser.name,
          app: 'HUB',
          session_id: sessionIdRef.current,
          online_at: new Date().toISOString()
        })
      }
    })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id])

  const markAsRead = useCallback((convId: string) => {
    setLastReadMap(convId)
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c))
  }, [])

  // 6. Enviar Mensagem no HUB (Persistência + Broadcast + Postgres)
  const sendMessage = async (
    conversationId: string,
    content: string,
    messageType: MessageType = 'TEXT',
    metadata?: any,
    replyTo?: any
  ) => {
    const senderId = currentUser?.id || '3af9068a-4b78-4c9c-8657-f83b93c01588'
    const senderName = currentUser?.name || 'Alison Thiago'
    const senderPhoto = currentUser?.photo_url

    const newMessage: InternalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversation_id: conversationId,
      sender_id: senderId,
      sender_name: senderName,
      sender_photo: senderPhoto,
      content,
      message_type: messageType,
      metadata: {
        ...(metadata || {}),
        sent_from_app: 'HUB',
        ...(senderPhoto ? { sender_photo: senderPhoto } : {})
      },
      reply_to: replyTo,
      created_at: new Date().toISOString()
    }

    // 1. Atualização Otimista Imediata
    setMessagesMap(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage]
    }))

    setConversations(prev => prev.map(c => {
      if (c.id === conversationId) {
        return {
          ...c,
          last_message: {
            content: content || 'Mensagem enviada',
            sender_name: senderName,
            created_at: newMessage.created_at
          }
        }
      }
      return c
    }))

    // 2. Persistir Conversa se necessário
    const conv = conversations.find(c => c.id === conversationId)
    if (conv) {
      fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: conv.id,
          type: conv.type,
          name: conv.name,
          description: conv.description || null,
          members: conv.members || [],
          created_at: conv.created_at || new Date().toISOString()
        })
      }).catch(() => {})
    }

    // 3. Persistir Mensagem no Banco via API
    try {
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newMessage.id,
          conversation_id: newMessage.conversation_id,
          sender_id: newMessage.sender_id,
          sender_name: newMessage.sender_name,
          content: newMessage.content,
          message_type: newMessage.message_type,
          metadata: newMessage.metadata,
          reply_to: newMessage.reply_to || null,
          created_at: newMessage.created_at
        })
      })
    } catch (err) {
      console.warn('[InternalChat] Erro ao persistir mensagem via API:', err)
    }

    // 4. Enviar Broadcast no Realtime para o FLOW receber instantaneamente
    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: newMessage
        })
      }
    } catch (err) {
      console.warn('[InternalChat] Erro ao enviar broadcast:', err)
    }
  }

  // 7. Criar Conversa (Direta ou Grupo)
  const createConversation = async (name: string, type: 'DIRECT' | 'GROUP', memberIds: string[], explicitId?: string): Promise<InternalConversation | null> => {
    const currentUid = currentUser?.id || '3af9068a-4b78-4c9c-8657-f83b93c01588'
    const convId = explicitId || (type === 'DIRECT' && memberIds.length === 1 ? getDirectConvId(currentUid, memberIds[0]) : `conv-${Date.now()}`)

    const members: ChatMember[] = [
      { id: currentUid, name: currentUser?.name || 'Eu' },
      ...memberIds.map(id => {
        const found = collaborators.find(c => c.id === id)
        return {
          id,
          name: found?.name || 'Colaborador',
          photo_url: found?.photo_url
        }
      })
    ]

    const newConv: InternalConversation = {
      id: convId,
      type,
      name,
      members,
      unread_count: 0,
      created_at: new Date().toISOString()
    }

    setConversations(prev => {
      if (prev.some(c => c.id === convId)) return prev
      return [newConv, ...prev]
    })

    try {
      await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: newConv.id,
          type: newConv.type,
          name: newConv.name,
          members: newConv.members,
          created_at: newConv.created_at
        })
      })
    } catch {}

    return newConv
  }

  const totalUnreadCount = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
  const messages = (activeConversation ? messagesMap[activeConversation.id] : []) || []

  return (
    <InternalChatContext.Provider
      value={{
        conversations,
        activeConversation,
        setActiveConversation,
        messages,
        loadingMessages,
        totalUnreadCount,
        isFloatingOpen,
        setIsFloatingOpen,
        isFloatingMinimized,
        setIsFloatingMinimized,
        activeChatRoomId,
        setActiveChatRoomId,
        collaborators,
        currentUser,
        sendMessage,
        createConversation,
        markAsRead
      }}
    >
      {children}
    </InternalChatContext.Provider>
  )
}
