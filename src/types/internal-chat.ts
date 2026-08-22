export type MessageType = 
  | 'TEXT'
  | 'CARD_ORDER'
  | 'CARD_PRODUCT'
  | 'CARD_CUSTOMER'
  | 'CARD_INVOICE'
  | 'CARD_SHIPPING'
  | 'CARD_LABEL'
  | 'CARD_TASK'
  | 'FILE'

export type ChannelType = 'DIRECT' | 'GROUP' | 'CONTEXT_ORDER'

export interface ChatMember {
  id: string
  name: string
  email?: string
  role?: string
  photo_url?: string
  online?: boolean
  last_activity?: string
}

export interface InternalMessage {
  id: string
  conversation_id: string
  sender_id: string
  sender_name: string
  sender_photo?: string
  content: string
  message_type: MessageType
  metadata?: {
    order_id?: string
    order_number?: string
    customer_name?: string
    customer_id?: string
    product_id?: string
    product_name?: string
    product_sku?: string
    product_image?: string
    total_amount?: number
    invoice_number?: string
    invoice_url?: string
    danfe_url?: string
    label_url?: string
    tracking_code?: string
    carrier?: string
    marketplace_name?: string
    file_url?: string
    file_name?: string
    file_size?: string
    task_id?: string
    task_title?: string
    priority?: string
  }
  reply_to?: {
    id: string
    sender_name: string
    content: string
  }
  created_at: string
  read_by?: string[]
}

export interface InternalConversation {
  id: string
  type: ChannelType
  name: string
  description?: string
  order_id?: string
  members: ChatMember[]
  last_message?: {
    content: string
    sender_name: string
    created_at: string
  }
  unread_count: number
  created_at: string
}

export interface InternalTask {
  id: string
  title: string
  description: string
  status: 'TODO' | 'IN_PROGRESS' | 'WAITING' | 'DONE' | 'CANCELLED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  assigned_to: {
    id: string
    name: string
    photo_url?: string
    role?: string
  }
  created_by: {
    id: string
    name: string
  }
  due_date?: string
  related_order_id?: string
  related_order_number?: string
  related_customer_name?: string
  related_product_name?: string
  conversation_id?: string
  created_at: string
  completed_at?: string
}
