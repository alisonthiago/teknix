'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { InternalConversation, InternalMessage, InternalTask, ChatMember, MessageType } from '@/types/internal-chat'
import { useNotification } from '@/contexts/NotificationContext'
import { playNotificationSound } from '@/utils/audio-chime'

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
  collaborators: ChatMember[]
  tasks: InternalTask[]
  currentUser: { id: string; name: string; email?: string; role?: string; photo_url?: string } | null
  sendMessage: (conversationId: string, content: string, messageType?: MessageType, metadata?: any, replyTo?: any) => Promise<void>
  shareToChat: (params: {
    targetType: 'DIRECT' | 'GROUP'
    targetId: string
    content?: string
    messageType: MessageType
    metadata: any
  }) => Promise<void>
  createConversation: (name: string, type: 'DIRECT' | 'GROUP', memberIds: string[], explicitId?: string) => Promise<InternalConversation | null>
  createTask: (task: Partial<InternalTask>) => Promise<void>
  updateTaskStatus: (taskId: string, status: InternalTask['status']) => Promise<void>
  markAsRead: (conversationId: string) => void
}

const InternalChatContext = createContext<InternalChatContextData>({} as InternalChatContextData)

// Função utilitária para remover qualquer emoji de strings
export function removeEmojis(str: string): string {
  if (!str) return ''
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Gera um ID determinístico para conversas DIRETAS entre 2 usuários
export function getDirectConvId(a: string, b: string): string {
  return 'direct-' + [a, b].sort().join('__')
}

// Retorna o nome dinâmico da conversa (para DIRECT mostra o nome do OUTRO interlocutor)
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

// Retorna o colaborador associado a uma conversa direta (para avatar e status)
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

export function InternalChatProvider({ children }: { children: React.ReactNode }) {
  const { notify } = useNotification()
  const [conversations, setConversations] = useState<InternalConversation[]>(DEFAULT_SYSTEM_CONVERSATIONS)
  const [activeConversation, setActiveConversationState] = useState<InternalConversation | null>(DEFAULT_SYSTEM_CONVERSATIONS[0])
  
  const setActiveConversation = useCallback((c: InternalConversation | null) => {
    setActiveConversationState(c)
    if (c?.id && typeof window !== 'undefined') {
      localStorage.setItem('teknix_last_active_conv_id', c.id)
    }
  }, [])

  const [messagesMap, setMessagesMap] = useState<Record<string, InternalMessage[]>>({})
  const [tasks, setTasks] = useState<InternalTask[]>([])
  const [collaborators, setCollaborators] = useState<ChatMember[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email?: string; role?: string; photo_url?: string } | null>(null)
  
  const [isFloatingOpen, setIsFloatingOpen] = useState(false)
  const [isFloatingMinimized, setIsFloatingMinimized] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const activeConvRef = useRef<InternalConversation | null>(activeConversation)
  activeConvRef.current = activeConversation

  const floatingOpenRef = useRef(isFloatingOpen)
  floatingOpenRef.current = isFloatingOpen
  const floatingMinRef = useRef(isFloatingMinimized)
  floatingMinRef.current = isFloatingMinimized
  
  const currentUserRef = useRef(currentUser)
  currentUserRef.current = currentUser

  const channelRef = useRef<any>(null)
  const onlineUserIdsRef = useRef<Set<string>>(new Set())

  // 1. Carregar usuário logado atual do Supabase Auth + Profile
  useEffect(() => {
    const supabase = createClient()

    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, email, role, avatar_url, photo_url')
            .eq('id', user.id)
            .single()

          const userName = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Colaborador'
          setCurrentUser({
            id: user.id,
            name: removeEmojis(userName),
            email: user.email || profile?.email,
            role: profile?.role || 'Operador',
            photo_url: profile?.avatar_url || profile?.photo_url || user.user_metadata?.avatar_url
          })
        }
      } catch (err) {
        console.error('Erro ao carregar usuário autenticado:', err)
      }
    }

    fetchUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUser()
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // 2. Carregar conversas e colaboradores via API Route (100% garantido sem RLS)
  const refreshConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations')
      if (!res.ok) return
      const data = await res.json()

      const dbConversations = data.conversations || []
      const profiles = data.profiles || []
      const recentMsgs = data.recentMessages || []

      // Atualiza colaboradores reais respeitando o status online real via Presence
      if (profiles && profiles.length > 0) {
        const currentUid = currentUserRef.current?.id
        const realMembers: ChatMember[] = profiles.map((p: any) => {
          const isOnline = onlineUserIdsRef.current.has(p.id) || (currentUid ? p.id === currentUid : false)
          return {
            id: p.id,
            name: removeEmojis(p.name || p.email?.split('@')[0] || 'Colaborador'),
            email: p.email || '',
            role: p.role || 'Operador',
            photo_url: p.avatar_url || p.photo_url,
            online: isOnline,
            last_activity: isOnline ? 'Online agora' : 'Offline'
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

      const convMap = new Map<string, InternalConversation>()
      
      // Adiciona canais padrão
      DEFAULT_SYSTEM_CONVERSATIONS.forEach(c => {
        const last = lastMsgMap.get(c.id)
        convMap.set(c.id, {
          ...c,
          last_message: last || c.last_message
        })
      })
      
      // Adiciona conversas do banco
      dbConversations.forEach((c: any) => {
        const existing = convMap.get(c.id)
        const last = lastMsgMap.get(c.id)
        convMap.set(c.id, {
          id: c.id,
          type: c.type || (c.id.startsWith('direct-') ? 'DIRECT' : 'GROUP'),
          name: removeEmojis(c.name),
          description: removeEmojis(c.description || ''),
          members: c.members || [],
          unread_count: existing?.unread_count || 0,
          last_message: last || existing?.last_message,
          created_at: c.created_at
        })
      })

      const merged = Array.from(convMap.values())

      setConversations(prev => {
        return merged.map(m => {
          const old = prev.find(p => p.id === m.id)
          return old ? { ...m, unread_count: old.unread_count } : m
        })
      })

      // Define Geral como padrão caso não haja conversa ativa
      if (!activeConvRef.current) {
        const geral = convMap.get('conv-geral') || DEFAULT_SYSTEM_CONVERSATIONS[0]
        setActiveConversationState(geral)
      }
    } catch (err) {
      console.warn('Erro ao carregar conversas via API:', err)
    }
  }, [])

  useEffect(() => {
    refreshConversations()
  }, [refreshConversations])

  // 3. Carregar mensagens da conversa ativa via API Route (merge seguro sem apagar otimistas)
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

          // 1. Adiciona mensagens vindas do Banco
          data.messages.forEach((m: InternalMessage) => msgMap.set(m.id, m))

          // 2. Preserva mensagens otimistas locais que ainda não retornaram do Banco
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
    } catch {}
  }, [])

  useEffect(() => {
    if (!activeConversation?.id) return
    setLoadingMessages(true)
    refreshActiveMessages().finally(() => setLoadingMessages(false))
  }, [activeConversation?.id, refreshActiveMessages])

  // 4. Polling contínuo em segundo plano (2 segundos)
  useEffect(() => {
    const interval = setInterval(() => {
      refreshActiveMessages()
      refreshConversations()
    }, 2000)
    return () => clearInterval(interval)
  }, [refreshActiveMessages, refreshConversations])

  // 5. Supabase Realtime Presence, Broadcast e Postgres Changes
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('internal-chat-realtime', {
      config: {
        presence: {
          key: currentUser?.id || 'anon-' + Math.random().toString(36).substring(2, 7)
        },
        broadcast: {
          self: true
        }
      }
    })
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const onlineIds = new Set<string>()
        Object.values(state).forEach((presences: any) => {
          presences.forEach((p: any) => {
            if (p.user_id) onlineIds.add(p.user_id)
          })
        })
        onlineUserIdsRef.current = onlineIds

        setCollaborators(prev => prev.map(c => {
          const isOnline = onlineIds.has(c.id) || (currentUserRef.current?.id ? c.id === currentUserRef.current.id : false)
          return {
            ...c,
            online: !!isOnline,
            last_activity: isOnline ? 'Online agora' : 'Offline'
          }
        }))
      })

    // Handler central para qualquer mensagem recebida em tempo real
    const handleIncoming = (msg: any) => {
      if (!msg || !msg.conversation_id) return
      const currentUserId = currentUserRef.current?.id
      const isOwn = currentUserId && msg.sender_id === currentUserId

      if (!isOwn) {
        playNotificationSound()
      }

      // 1. Atualizar mensagens no canal específico
      setMessagesMap(prev => {
        const updated = { ...prev }
        
        // Adiciona na conversa específica
        const currentList = updated[msg.conversation_id] || []
        if (!currentList.some(m => m.id === msg.id)) {
          updated[msg.conversation_id] = [...currentList, msg]
        }
        
        // Também adiciona no feed Geral (conv-geral) se existir
        if (msg.conversation_id !== 'conv-geral' && updated['conv-geral']) {
          const geralList = updated['conv-geral']
          if (!geralList.some(m => m.id === msg.id)) {
            updated['conv-geral'] = [...geralList, msg]
          }
        }
        
        return updated
      })

      // 2. Atualizar lista de conversas
      setConversations(prev => {
        const exists = prev.some(c => c.id === msg.conversation_id)
        if (exists) {
          return prev.map(c => {
            if (c.id === msg.conversation_id) {
              const isViewing = floatingOpenRef.current && !floatingMinRef.current && activeConvRef.current?.id === c.id
              return {
                ...c,
                last_message: {
                  content: msg.content || 'Mensagem recebida',
                  sender_name: msg.sender_name,
                  created_at: msg.created_at
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
              created_at: msg.created_at
            },
            created_at: msg.created_at || new Date().toISOString()
          }
          return [newConv, ...prev]
        }
      })
    }

    channel
      .on('broadcast', { event: 'new_message' }, ({ payload }) => handleIncoming(payload))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED' && currentUser) {
          await channel.track({
            user_id: currentUser.id,
            user_name: currentUser.name,
            online_at: new Date().toISOString()
          })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser?.id])

  const markAsRead = useCallback((convId: string) => {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c))
  }, [])

  // 6. Enviar mensagem e persistir via API Route
  const sendMessage = async (
    conversationId: string,
    content: string,
    messageType: MessageType = 'TEXT',
    metadata?: any,
    replyTo?: any
  ) => {
    const senderId = currentUser?.id || 'user-current'
    const senderName = currentUser?.name || 'Alison Thiago'

    const newMessage: InternalMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      conversation_id: conversationId,
      sender_id: senderId,
      sender_name: senderName,
      sender_photo: currentUser?.photo_url,
      content,
      message_type: messageType,
      metadata,
      reply_to: replyTo,
      created_at: new Date().toISOString()
    }

    // 1. Atualização otimista imediata
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

    // 2. Persistir Conversa e Mensagem via API Route no Supabase
    try {
      const conv = conversations.find(c => c.id === conversationId)
      if (conv) {
        await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conv)
        })
      }

      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMessage)
      })
    } catch (err) {
      console.warn('Erro persistência Supabase:', err)
    }

    // 3. Broadcast em tempo real
    try {
      if (channelRef.current) {
        await channelRef.current.send({
          type: 'broadcast',
          event: 'new_message',
          payload: newMessage
        })
      }
    } catch (err) {
      console.warn('Realtime broadcast:', err)
    }
  }

  const shareToChat = async (params: {
    targetType: 'DIRECT' | 'GROUP'
    targetId: string
    content?: string
    messageType: MessageType
    metadata: any
  }) => {
    const directId = (params.targetType === 'DIRECT' && currentUser)
      ? getDirectConvId(currentUser.id, params.targetId)
      : params.targetId

    let conv = conversations.find(c => c.id === directId || c.members.some(m => m.id === params.targetId))

    if (!conv) {
      const colab = collaborators.find(c => c.id === params.targetId)
      conv = {
        id: directId,
        type: params.targetType,
        name: removeEmojis(colab?.name || 'Nova Conversa'),
        members: colab ? [colab] : [],
        unread_count: 0,
        created_at: new Date().toISOString()
      }
      setConversations(prev => [conv!, ...prev])

      try {
        await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conv)
        })
      } catch {}
    }

    setActiveConversation(conv)
    setIsFloatingOpen(true)
    setIsFloatingMinimized(false)

    await sendMessage(
      conv.id,
      params.content || `Compartilhamento operacional: ${params.messageType}`,
      params.messageType,
      params.metadata
    )

    notify({
      type: 'success',
      title: 'Compartilhado no Chat',
      message: `Enviado com sucesso para ${conv.name}.`
    })
  }

  const createConversation = async (name: string, type: 'DIRECT' | 'GROUP', memberIds: string[], explicitId?: string) => {
    const selectedMembers = collaborators.filter(c => memberIds.includes(c.id))
    const cleanName = removeEmojis(name)
    const newConvId = explicitId
      || ((type === 'DIRECT' && currentUser && memberIds.length > 0)
        ? getDirectConvId(currentUser.id, memberIds[0])
        : `conv-${Date.now()}`)

    const existingConv = conversations.find(c => c.id === newConvId)
    if (existingConv) {
      setActiveConversation(existingConv)
      return existingConv
    }

    const newConv: InternalConversation = {
      id: newConvId,
      type,
      name: cleanName,
      members: type === 'DIRECT'
        ? (currentUser ? [currentUser, ...selectedMembers] : selectedMembers)
        : selectedMembers,
      unread_count: 0,
      created_at: new Date().toISOString()
    }

    setConversations(prev => [newConv, ...prev])
    setActiveConversation(newConv)

    try {
      await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConv)
      })
    } catch {}

    return newConv
  }

  const createTask = async (task: Partial<InternalTask>) => {
    const defaultAssignee = collaborators[0] || {
      id: currentUser?.id || 'user-1',
      name: currentUser?.name || 'Alison Thiago',
      role: 'Responsável'
    }

    const newTask: InternalTask = {
      id: `task-${Date.now()}`,
      title: removeEmojis(task.title || 'Nova Atividade Operacional'),
      description: task.description || '',
      status: task.status || 'TODO',
      priority: task.priority || 'MEDIUM',
      assigned_to: task.assigned_to || defaultAssignee,
      created_by: { id: currentUser?.id || 'user-current', name: currentUser?.name || 'Alison Thiago' },
      due_date: task.due_date,
      related_order_number: task.related_order_number,
      related_customer_name: task.related_customer_name,
      related_product_name: task.related_product_name,
      created_at: new Date().toISOString()
    }

    setTasks(prev => [newTask, ...prev])

    if (task.conversation_id) {
      await sendMessage(
        task.conversation_id,
        `Nova tarefa atribuída: ${newTask.title}`,
        'CARD_TASK',
        {
          task_id: newTask.id,
          task_title: newTask.title,
          priority: newTask.priority,
          order_number: newTask.related_order_number
        }
      )
    }

    notify({
      type: 'success',
      title: 'Tarefa Atribuída',
      message: `Atividade enviada para ${newTask.assigned_to.name}.`
    })
  }

  const updateTaskStatus = async (taskId: string, status: InternalTask['status']) => {
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status,
          completed_at: status === 'DONE' ? new Date().toISOString() : undefined
        }
      }
      return t
    }))

    notify({
      type: 'success',
      title: 'Status Atualizado',
      message: `Tarefa marcada como ${status === 'DONE' ? 'Concluída' : status}.`
    })
  }

  const totalUnreadCount = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
  const currentMessages = activeConversation ? (messagesMap[activeConversation.id] || []) : []

  return (
    <InternalChatContext.Provider
      value={{
        conversations,
        activeConversation,
        setActiveConversation,
        messages: currentMessages,
        loadingMessages,
        totalUnreadCount,
        isFloatingOpen,
        setIsFloatingOpen,
        isFloatingMinimized,
        setIsFloatingMinimized,
        collaborators,
        tasks,
        currentUser,
        sendMessage,
        shareToChat,
        createConversation,
        createTask,
        updateTaskStatus,
        markAsRead
      }}
    >
      {children}
    </InternalChatContext.Provider>
  )
}

export function useInternalChat() {
  return useContext(InternalChatContext)
}
