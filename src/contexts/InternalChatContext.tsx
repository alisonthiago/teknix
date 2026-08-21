'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import { InternalConversation, InternalMessage, InternalTask, ChatMember, MessageType } from '@/types/internal-chat'
import { useNotification } from '@/contexts/NotificationContext'

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

// Dados base de colaboradores do sistema
const INITIAL_COLLABORATORS: ChatMember[] = [
  { id: 'colab-1', name: 'João Silva', role: 'Financeiro & Fiscal', email: 'joao.financeiro@teknix.com', online: true, last_activity: 'Agora' },
  { id: 'colab-2', name: 'Maria Souza', role: 'Expedição & Estoque', email: 'maria.expedicao@teknix.com', online: true, last_activity: 'Há 2 min' },
  { id: 'colab-3', name: 'Carlos Eduardo', role: 'Atendimento & SAC', email: 'carlos.sac@teknix.com', online: false, last_activity: 'Há 15 min' },
  { id: 'colab-4', name: 'Ana Paula', role: 'Compras & Fornecedores', email: 'ana.compras@teknix.com', online: true, last_activity: 'Agora' },
]

const INITIAL_CONVERSATIONS: InternalConversation[] = [
  {
    id: 'conv-expedicao',
    type: 'GROUP',
    name: '📦 Expedição & Logística',
    description: 'Canal operacional para separação, embalagem e envio de pedidos.',
    members: INITIAL_COLLABORATORS,
    last_message: {
      content: 'Etiqueta do pedido #MLB-2000008741 já foi impressa para coleta.',
      sender_name: 'Maria Souza',
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    },
    unread_count: 1,
    created_at: new Date(Date.now() - 1000 * 3600 * 24 * 3).toISOString(),
  },
  {
    id: 'conv-financeiro',
    type: 'GROUP',
    name: '💰 Financeiro & Notas Fiscais',
    description: 'Emissão de notas fiscais, conferência de pagamentos e custos.',
    members: [INITIAL_COLLABORATORS[0], INITIAL_COLLABORATORS[3]],
    last_message: {
      content: 'Nota fiscal emitida com sucesso para o cliente João Silva.',
      sender_name: 'João Silva',
      created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    },
    unread_count: 0,
    created_at: new Date(Date.now() - 1000 * 3600 * 24 * 5).toISOString(),
  },
  {
    id: 'conv-joao',
    type: 'DIRECT',
    name: 'João Silva',
    members: [INITIAL_COLLABORATORS[0]],
    last_message: {
      content: 'Pode deixar que eu já gero a declaração de conteúdo do pedido.',
      sender_name: 'João Silva',
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    unread_count: 0,
    created_at: new Date(Date.now() - 1000 * 3600 * 24 * 2).toISOString(),
  }
]

const INITIAL_MESSAGES: Record<string, InternalMessage[]> = {
  'conv-expedicao': [
    {
      id: 'm-1',
      conversation_id: 'conv-expedicao',
      sender_id: 'colab-2',
      sender_name: 'Maria Souza',
      content: 'Bom dia equipe! Iniciando a fila de separação dos pedidos da madrugada.',
      message_type: 'TEXT',
      created_at: new Date(Date.now() - 1000 * 3600 * 3).toISOString(),
    },
    {
      id: 'm-2',
      conversation_id: 'conv-expedicao',
      sender_id: 'user-alison',
      sender_name: 'Alison Thiago',
      content: 'Cliente solicitou agilidade no envio deste pedido:',
      message_type: 'CARD_ORDER',
      metadata: {
        order_id: 'ord-1',
        order_number: 'MLB-2000008741',
        customer_name: 'João Silva',
        product_name: 'Lava Jato Lavadora Portátil De Alta Pressão 21v',
        product_sku: 'LAVA-JATO-21V',
        product_image: 'https://http2.mlstatic.com/D_NQ_NP_2X_789396-MLB78028328731_072024-F.webp',
        total_amount: 219.90,
        marketplace_name: 'Mercado Livre'
      },
      created_at: new Date(Date.now() - 1000 * 3600 * 1).toISOString(),
    },
    {
      id: 'm-3',
      conversation_id: 'conv-expedicao',
      sender_id: 'colab-2',
      sender_name: 'Maria Souza',
      content: 'Etiqueta do pedido #MLB-2000008741 já foi impressa para coleta.',
      message_type: 'CARD_SHIPPING',
      metadata: {
        order_number: 'MLB-2000008741',
        tracking_code: 'MEL47814652332',
        carrier: 'Mercado Envios Coleta'
      },
      created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    }
  ],
  'conv-financeiro': [
    {
      id: 'm-f1',
      conversation_id: 'conv-financeiro',
      sender_id: 'user-alison',
      sender_name: 'Alison Thiago',
      content: 'João, cliente João Silva está precisando da Nota Fiscal do pedido #MLB-2000008741.',
      message_type: 'TEXT',
      created_at: new Date(Date.now() - 1000 * 3600 * 2).toISOString(),
    },
    {
      id: 'm-f2',
      conversation_id: 'conv-financeiro',
      sender_id: 'colab-1',
      sender_name: 'João Silva',
      content: 'Nota fiscal emitida com sucesso para o cliente João Silva.',
      message_type: 'CARD_INVOICE',
      metadata: {
        order_number: 'MLB-2000008741',
        invoice_number: 'NF-e 000.412.980',
        customer_name: 'João Silva',
        invoice_url: '#'
      },
      created_at: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    }
  ]
}

const INITIAL_TASKS: InternalTask[] = [
  {
    id: 't-1',
    title: 'Emitir NF-e do Pedido #MLB-2000008741',
    description: 'Cliente solicitou a nota fiscal no chat do pós-venda para garantia.',
    status: 'DONE',
    priority: 'HIGH',
    assigned_to: INITIAL_COLLABORATORS[0],
    created_by: { id: 'user-alison', name: 'Alison Thiago' },
    related_order_id: 'ord-1',
    related_order_number: 'MLB-2000008741',
    related_customer_name: 'João Silva',
    created_at: new Date(Date.now() - 1000 * 3600 * 4).toISOString(),
    completed_at: new Date(Date.now() - 1000 * 60 * 20).toISOString()
  },
  {
    id: 't-2',
    title: 'Separar e embalar 2x Carrinho de Mão',
    description: 'Conferir rodas e travas antes de colar a etiqueta de despacho.',
    status: 'IN_PROGRESS',
    priority: 'URGENT',
    assigned_to: INITIAL_COLLABORATORS[1],
    created_by: { id: 'user-alison', name: 'Alison Thiago' },
    related_order_number: 'MLB-2000008740',
    related_product_name: 'Carrinho De Mão Manual Bomvink',
    created_at: new Date(Date.now() - 1000 * 3600 * 2).toISOString()
  },
  {
    id: 't-3',
    title: 'Cotar reposição de estoque com Fornecedor Bomvink',
    description: 'Estoque do Lava Jato 21V está abaixo do ponto de reposição mínimo (8 unidades restantes).',
    status: 'TODO',
    priority: 'MEDIUM',
    assigned_to: INITIAL_COLLABORATORS[3],
    created_by: { id: 'user-alison', name: 'Alison Thiago' },
    related_product_name: 'Lava Jato Lavadora Portátil 21v',
    created_at: new Date(Date.now() - 1000 * 3600 * 5).toISOString()
  }
]

import { playNotificationSound } from '@/utils/audio-chime'

export function InternalChatProvider({ children }: { children: React.ReactNode }) {
  const { notify } = useNotification()
  const [conversations, setConversations] = useState<InternalConversation[]>(INITIAL_CONVERSATIONS)
  const [activeConversation, setActiveConversation] = useState<InternalConversation | null>(INITIAL_CONVERSATIONS[0])
  const [messagesMap, setMessagesMap] = useState<Record<string, InternalMessage[]>>(INITIAL_MESSAGES)
  const [tasks, setTasks] = useState<InternalTask[]>(INITIAL_TASKS)
  const [collaborators, setCollaborators] = useState<ChatMember[]>(INITIAL_COLLABORATORS)
  
  const [isFloatingOpen, setIsFloatingOpen] = useState(false)
  const [isFloatingMinimized, setIsFloatingMinimized] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)

  const totalUnreadCount = conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0)
  const currentMessages = activeConversation ? (messagesMap[activeConversation.id] || []) : []

  // Carregar todos os colaboradores cadastrados no sistema dinamicamente
  useEffect(() => {
    const loadDynamicCollaborators = async () => {
      try {
        const supabase = createClient()
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, email, role, avatar_url, photo_url')
          .limit(50)

        if (profiles && profiles.length > 0) {
          const dbMembers: ChatMember[] = profiles.map(p => ({
            id: p.id,
            name: p.name || p.email?.split('@')[0] || 'Colaborador',
            email: p.email,
            role: p.role || 'Operador',
            photo_url: p.avatar_url || p.photo_url,
            online: true,
            last_activity: 'Online agora'
          }))

          setCollaborators(prev => {
            const dbIds = new Set(dbMembers.map(m => m.id))
            const combined = [...dbMembers, ...prev.filter(m => !dbIds.has(m.id))]
            return combined
          })
        }
      } catch {}
    }
    loadDynamicCollaborators()
  }, [])

  // Supabase Realtime Listener com som de notificação
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('internal-chat-realtime')
      .on('broadcast', { event: 'new_message' }, ({ payload }) => {
        if (payload && payload.conversation_id) {
          // Tocar barulho / som de nova mensagem
          playNotificationSound()

          setMessagesMap(prev => ({
            ...prev,
            [payload.conversation_id]: [...(prev[payload.conversation_id] || []), payload]
          }))
          // Atualiza preview na lista
          setConversations(prev => prev.map(c => {
            if (c.id === payload.conversation_id) {
              return {
                ...c,
                last_message: {
                  content: payload.content || 'Novo anexo/card compartilhado',
                  sender_name: payload.sender_name,
                  created_at: payload.created_at
                },
                unread_count: (activeConversation?.id === c.id) ? 0 : (c.unread_count + 1)
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
  }, [activeConversation])

  const markAsRead = useCallback((convId: string) => {
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, unread_count: 0 } : c))
  }, [])

  const sendMessage = async (
    conversationId: string,
    content: string,
    messageType: MessageType = 'TEXT',
    metadata?: any,
    replyTo?: any
  ) => {
    const newMessage: InternalMessage = {
      id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: 'user-alison',
      sender_name: 'Alison Thiago',
      content,
      message_type: messageType,
      metadata,
      reply_to: replyTo,
      created_at: new Date().toISOString()
    }

    setMessagesMap(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage]
    }))

    setConversations(prev => prev.map(c => {
      if (c.id === conversationId) {
        return {
          ...c,
          last_message: {
            content: content || 'Card operacional compartilhado',
            sender_name: 'Alison Thiago',
            created_at: newMessage.created_at
          }
        }
      }
      return c
    }))

    // Broadcast via Realtime
    try {
      const supabase = createClient()
      await supabase.channel('internal-chat-realtime').send({
        type: 'broadcast',
        event: 'new_message',
        payload: newMessage
      })
    } catch {}
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
        id: `conv-auto-${Date.now()}`,
        type: params.targetType,
        name: colab?.name || 'Nova Conversa',
        members: colab ? [colab] : [],
        unread_count: 0,
        created_at: new Date().toISOString()
      }
      setConversations(prev => [conv!, ...prev])
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
      title: 'Compartilhado no Chat!',
      message: `Enviado com sucesso para ${conv.name}.`
    })
  }

  const createConversation = async (name: string, type: 'DIRECT' | 'GROUP', memberIds: string[]) => {
    const selectedMembers = collaborators.filter(c => memberIds.includes(c.id))
    const newConv: InternalConversation = {
      id: `conv-new-${Date.now()}`,
      type,
      name,
      members: selectedMembers,
      unread_count: 0,
      created_at: new Date().toISOString()
    }
    setConversations(prev => [newConv, ...prev])
    setActiveConversation(newConv)
    return newConv
  }

  const createTask = async (task: Partial<InternalTask>) => {
    const newTask: InternalTask = {
      id: `task-${Date.now()}`,
      title: task.title || 'Nova Atividade Operacional',
      description: task.description || '',
      status: task.status || 'TODO',
      priority: task.priority || 'MEDIUM',
      assigned_to: task.assigned_to || INITIAL_COLLABORATORS[0],
      created_by: { id: 'user-alison', name: 'Alison Thiago' },
      due_date: task.due_date,
      related_order_number: task.related_order_number,
      related_customer_name: task.related_customer_name,
      related_product_name: task.related_product_name,
      created_at: new Date().toISOString()
    }

    setTasks(prev => [newTask, ...prev])

    // Se houver conversa vinculada, envia card no chat
    if (task.conversation_id) {
      await sendMessage(
        task.conversation_id,
        `📋 Nova tarefa atribuída: ${newTask.title}`,
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
      title: 'Tarefa Atribuída!',
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
