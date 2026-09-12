import React from 'react'
import { Link } from 'react-router-dom'
import { InternalMessage } from '../../types/internal-chat'
import {
  Package,
  ShoppingCart,
  User,
  FileText,
  Truck,
  CheckSquare,
  Download,
  ExternalLink,
  ShieldCheck,
  Tag,
  Paperclip
} from 'lucide-react'
import { useInternalChat } from '../../contexts/InternalChatContext'

interface MessageCardRendererProps {
  message: InternalMessage
  isMe: boolean
  showChannel?: boolean
  channelName?: string
}

export default function MessageCardRenderer({ message, isMe, showChannel, channelName }: MessageCardRendererProps) {
  const { currentUser, collaborators } = useInternalChat()
  const meta = message.metadata || {}

  const resolvedPhoto = 
    message.sender_photo || 
    (isMe ? currentUser?.photo_url : collaborators.find(c => c.id === message.sender_id || c.name.toLowerCase() === (message.sender_name || '').toLowerCase())?.photo_url) ||
    (message.sender_name?.toLowerCase().includes('alison') ? 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/3af9068a-4b78-4c9c-8657-f83b93c01588-1787179225140.jpg' : undefined) ||
    (message.sender_name?.toLowerCase().includes('nádia') || message.sender_name?.toLowerCase().includes('nadia') ? 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/6f58029b-c770-4f25-a9f9-86dec6fb6137-1787168051706.jpeg' : undefined)

  const renderContent = () => {
    switch (message.message_type) {
      case 'CARD_ORDER':
        return (
          <div className="chat-card-box">
            <div className="chat-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ShoppingCart size={16} color="#111111" />
                <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: '#111111' }}>
                  {meta.order_number || 'Pedido'}
                </span>
              </div>
              {meta.marketplace_name && (
                <span className="chat-badge-pill">{meta.marketplace_name}</span>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {meta.product_image ? (
                <img src={meta.product_image} alt="" className="chat-card-thumb" />
              ) : (
                <div className="chat-card-thumb-placeholder">
                  <Package size={22} color="#64748b" />
                </div>
              )}
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <p style={{ fontWeight: 600, fontSize: '13.5px', color: '#111111', margin: 0 }}>
                  {meta.product_name || 'Produto'}
                </p>
                {meta.product_sku && <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#64748b' }}>SKU: {meta.product_sku}</span>}
                {meta.customer_name && <span style={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>Cliente: {meta.customer_name}</span>}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 4 }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#16a34a' }}>
                R$ {Number(meta.total_amount || 0).toFixed(2).replace('.', ',')}
              </span>
              <Link
                to="/hub/pedidos"
                className="btn-chat-card-action"
              >
                <span>Abrir Pedido</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        )

      case 'CARD_PRODUCT':
        return (
          <div className="chat-card-box">
            <div className="chat-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Package size={16} color="#16a34a" />
                <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#111111' }}>Produto Operacional</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              {meta.product_image ? (
                <img src={meta.product_image} alt="" className="chat-card-thumb" />
              ) : (
                <div className="chat-card-thumb-placeholder">
                  <Package size={22} color="#64748b" />
                </div>
              )}
              <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <p style={{ fontWeight: 600, fontSize: '13.5px', color: '#111111', margin: 0 }}>{meta.product_name}</p>
                <span style={{ fontFamily: 'monospace', fontSize: '11.5px', color: '#64748b' }}>SKU: {meta.product_sku}</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#d97706' }}>Estoque: {meta.total_amount || 8} un.</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
              <Link
                to={meta.product_id ? `/hub/produtos/editar/${meta.product_id}` : `/hub/produtos`}
                className="btn-chat-card-action"
              >
                <span>Abrir Produto</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        )

      case 'CARD_CUSTOMER':
        return (
          <div className="chat-card-box">
            <div className="chat-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <User size={16} color="#0284c7" />
                <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#111111' }}>Ficha de Cliente</span>
              </div>
            </div>
            <div>
              <p style={{ fontWeight: 600, fontSize: '14px', color: '#111111', margin: 0 }}>{meta.customer_name || 'Cliente TEKNIX'}</p>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '3px 0 0' }}>{meta.customer_id || 'Documento cadastrado'}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
              <Link to="/hub/clientes" className="btn-chat-card-action">
                <span>Ver Cadastro</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        )

      case 'CARD_INVOICE':
        return (
          <div className="chat-card-box">
            <div className="chat-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} color="#7c3aed" />
                <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#111111' }}>Nota Fiscal Emitida</span>
              </div>
              <span className="chat-badge-pill" style={{ color: '#059669', background: '#ecfdf5', borderColor: '#a7f3d0' }}>
                <ShieldCheck size={11} /> SEFAZ Autorizada
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#111111', margin: 0 }}>
              NF-e Nº <strong>{meta.invoice_number || '104'}</strong> referente ao pedido <strong>{meta.order_number || ''}</strong>.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
              <Link to="/hub/configuracoes/fiscal" className="btn-chat-card-action">
                <span>Painel Fiscal</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        )

      case 'CARD_SHIPPING':
        return (
          <div className="chat-card-box">
            <div className="chat-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Truck size={16} color="#ea580c" />
                <span style={{ fontWeight: 600, fontSize: '13.5px', color: '#111111' }}>Envio & Logística</span>
              </div>
              <span className="chat-badge-pill">{meta.carrier || 'Correios / Jadlog'}</span>
            </div>
            <p style={{ fontSize: '13px', color: '#111111', margin: 0 }}>
              Código de rastreio: <strong style={{ fontFamily: 'monospace' }}>{meta.tracking_code || 'TK987654321BR'}</strong>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
              <Link to="/hub/entregas" className="btn-chat-card-action">
                <span>Rastrear Envio</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>
        )

      default:
        return (
          <p className="chat-text-content">
            {message.content}
          </p>
        )
    }
  }

  const appOrigin = meta.sent_from_app

  return (
    <div className={`chat-message-row ${isMe ? 'is-me' : 'is-other'}`}>
      {!isMe && (
        <div className="chat-avatar-wrap">
          {resolvedPhoto ? (
            <img src={resolvedPhoto} alt="" className="chat-avatar-img" />
          ) : (
            <div className="chat-avatar-fallback">
              {(message.sender_name || 'U').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}

      <div className="chat-message-bubble-group">
        <div className="chat-sender-info">
          {!isMe && <span className="chat-sender-name">{message.sender_name}</span>}
          {showChannel && channelName && (
            <span className="chat-channel-tag">#{channelName}</span>
          )}
          {appOrigin && (
            <span className={`chat-app-origin-pill ${appOrigin.toLowerCase()}`}>
              via {appOrigin}
            </span>
          )}
          <span className="chat-time-text">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className={`chat-bubble ${isMe ? 'bubble-me' : 'bubble-other'} ${message.message_type !== 'TEXT' ? 'card-type' : ''}`}>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
