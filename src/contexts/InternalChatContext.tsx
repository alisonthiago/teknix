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
  currentUser: { id: string; name: string; email?: string; role?: string } | null
  sendMessage: (conversationId: string, content: string, messageType?: MessageType, metadata?: any, replyTo?: any) => Promise<void>
  shareToChat: (params: {
    targetType: 'DIRECT' | 'GROUP'
    targetId: string
    content?: string
    messageType: MessageType
    metadata: any
  }) => Promise<void>
  createConversation: (name: string, type: 'DIRECT' | 'GROUP', memberIds: string[]) => Promise<InternalConversation | null>
  createTask: (task: Partial<InternalTask>) => Promise<void>
  updateTaskStatus: (taskId: string, status: InternalTask['status']) => Promise<void>
  markAsRead: (conversationId: string) => void
}

const InternalChatContext = createContext<InternalChatContextData>({} as InternalChatContextData)

// Função utilitária para remover qualquer emoji de strings
function removeEmojis(str: string): string {
  if (!str) return ''
  return str
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F700}-\u{1F77F}\u{1F780}-\u{1F7FF}\u{1F800}-\u{1F8FF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{2300}-\u{23FF}]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Canais operacionais padrão reais (sem emojis)
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
  const [activeConversation, setActiveConversation] = useState<InternalConversation | null>(DEFAULT_SYSTEM_CONVERSATIONS[0])
  const [messagesMap, setMessagesMap] = useState<Record<string, InternalMessage[]>>({})
  const [tasks, setTasks] = useState<InternalTask[]>([])
  const [collaborators, setCollaborators] = useState<ChatMember[]>([])
  const [currentUser, setCurrentUser] = useState<{ id: string; name: string; email?: string; role?: string } | null>(null)
  
  const [isFloatingOpen, setIsFloatingOpen] = useState(false)
  const [isFloatingMinimized, setIsFloatingMinimized] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const activeConvRef = useRef<InternalConversation | null>(activeConversation)
  activeConvRef.current = activeConversation

  // 1. Carregar o usuário logado atual do Supabase Auth + Profile
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, name, email, role')
            .eq('id', user.id)
            .single()

          const userName = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Colaborador'
          setCurrentUser({
            id: user.id,
            name: userName,
            email: user.email || profile?.email,
            role: profile?.role || 'Operador'
          })
        }
      } catch (err) {
        console.error('Erro ao carregar usuário autenticado:', err)
      }
    }
    loadCurrentUser()
  }, [])

  // 2. Carregar SOMENTE os colaboradores reais cadastrados no Supabase (tabela profiles)
  useEffect(() => {
    const loadRealCollaborators = async () => {
      try {
        const supabase = createClient()
        const { data: profiles, error } = await supabase
          .from('profiles')
          .select('id, name, email, role, avatar_url, photo_url, status')
          .order('name')

        if (error) {
          console.error('Erro ao buscar profiles:', error)
          return
        }

        if (profiles && profiles.length > 0) {
          const realMembers: ChatMember[] = profiles.map(p => ({
            id: p.id,
            name: removeEmojis(p.name || p.email?.split('@')[0] || 'Colaborador'),
            email: p.email || '',
            role: p.role || 'Operador',
            photo_url: p.avatar_url || p.photo_url,
            online: true,
            last_activity: 'Online agora'
          }))

          setCollaborators(realMembers)
        }
      } catch (err) {
        console.error('Erro ao carregar colaboradores reais:', err)
      }
    }
    loadRealCollaborators()
  }, [])

  // 3. Carregar conversas do Supabase (internal_conversations)
  useEffect(() => {
    const loadConversations = async () => {
      try {
        const supabase = createClient()
        const { data: dbConversations, error } = await supabase
          .from('internal_conversations')
          .select('*')
          .order('created_at', { ascending: false })

        if (!error && dbConversations && dbConversations.length > 0) {
          const cleanConvs: InternalConversation[] = dbConversations.map(c => ({
            id: c.id,
            type: c.type || 'GROUP',
            name: removeEmojis(c.name),
            description: removeEmojis(c.description || ''),
            members: c.members || [],
            unread_count: 0,
            created_at: c.created_at
          }))
          setConversations(cleanConvs)
          if (!activeConversation) {
            setActiveConversation(cleanConvs[0])
          }
        }
      } catch {}
    }
    loadConversations()
  }, [])

  // 4. Carregar mensagens da conversa ativa do Supabase (internal_messages)
  useEffect(() => {
    if (!activeConversation) return

    const loadMessages = async () => {
      setLoadingMessages(true)
      try {
        const supabase = createClient()
        const { data: dbMessages, error } = await supabase
          .from('internal_messages')
          .select('*')
          .eq('conversation_id', activeConversation.id)
          .order('created_at', { ascending: true })

        if (!error && dbMessages) {
          setMessagesMap(prev => ({
            ...prev,
            [activeConversation.id]: dbMessages
          }))
        }
      } catch {}
      setLoadingMessages(false)
    }

    loadMessages()
  }, [activeConversation?.id])

  // 5. Supabase Realtime Listener (para mensagens em tempo real entre usuários reais)
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('internal-chat-realtime')
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        if (payload && payload.conversation_id) {
          playNotificationSound()

          setMessagesMap(prev => {
            const currentList = prev[payload.conversation_id] || []
            if (currentList.some(m => m.id === payload.id)) return prev
            return {
              ...prev,
              [payload.conversation_id]: [...currentList, payload]
            }
          })

          setConversations(prev => prev.map(c => {
            if (c.id === payload.conversation_id) {
              const isCurrent = activeConvRef.current?.id === c.id
              return {
                ...c,
                last_message: {
                  content: payload.content || 'Mensagem recebida',
                  sender_name: payload.sender_name,
                  created_at: payload.created_at
                },
                unread_count: isCurrent ? 0 : (c.unread_count + 1)
              }
            }
            return c
          }))
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const markAsRead = useCallback((convId: string) => {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c))
  }, [])

  // 6. Enviar mensagem real e persistir no Supabase
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
      content,
      message_type: messageType,
      metadata,
      reply_to: replyTo,
      created_at: new Date().toISOString()
    }

    // Atualização otimista local
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

    // Persistir no Supabase
    try {
      const supabase = createClient()
      await supabase.from('internal_messages').insert({
        id: newMessage.id,
        conversation_id: conversationId,
        sender_id: senderId,
        sender_name: senderName,
        content: newMessage.content,
        message_type: newMessage.message_type,
        metadata: newMessage.metadata || {},
        reply_to: newMessage.reply_to || null,
        created_at: newMessage.created_at
      })
    } catch (err) {
      console.warn('Persistência via banco:', err)
    }

    // Broadcast em tempo real para os outros colaboradores conectados
    try {
      const supabase = createClient()
      await supabase.channel('internal-chat-realtime').send({
        type: 'broadcast',
        event: 'new_message',
        payload: newMessage
      })
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
    let conv = conversations.find(c => c.id === params.targetId || c.members.some(m => m.id === params.targetId))

    if (!conv) {
      const colab = collaborators.find(c => c.id === params.targetId)
      conv = {
        id: `conv-${params.targetId}`,
        type: params.targetType,
        name: removeEmojis(colab?.name || 'Nova Conversa'),
        members: colab ? [colab] : [],
        unread_count: 0,
        created_at: new Date().toISOString()
      }
      setConversations(prev => [conv!, ...prev])

      try {
        const supabase = createClient()
        await supabase.from('internal_conversations').insert({
          id: conv.id,
          type: conv.type,
          name: conv.name,
          members: conv.members,
          created_at: conv.created_at
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

  const createConversation = async (name: string, type: 'DIRECT' | 'GROUP', memberIds: string[]) => {
    const selectedMembers = collaborators.filter(c => memberIds.includes(c.id))
    const cleanName = removeEmojis(name)
    const newConv: InternalConversation = {
      id: `conv-${Date.now()}`,
      type,
      name: cleanName,
      members: selectedMembers,
      unread_count: 0,
      created_at: new Date().toISOString()
    }

    setConversations(prev => [newConv, ...prev])
    setActiveConversation(newConv)

    try {
      const supabase = createClient()
      await supabase.from('internal_conversations').insert({
        id: newConv.id,
        type: newConv.type,
        name: newConv.name,
        members: newConv.members,
        created_at: newConv.created_at
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
