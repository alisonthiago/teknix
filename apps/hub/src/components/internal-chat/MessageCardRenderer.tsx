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
    (message.sender_id === 'bad56b70-dcfd-44a9-a76b-76469e84db1c' || message.sender_name?.toLowerCase().includes('admin demo') ? 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/bad56b70-dcfd-44a9-a76b-76469e84db1c-1788492640182.png' : undefined) ||
    (message.sender_id === '3af9068a-4b78-4c9c-8657-f83b93c01588' || message.sender_name?.toLowerCase().includes('alison') ? 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/3af9068a-4b78-4c9c-8657-f83b93c01588-1787179225140.jpg' : undefined) ||
    (message.sender_id === 'cea2102a-360f-44bb-9e86-75c878650bab' || message.sender_name?.toLowerCase().includes('nádia') || message.sender_name?.toLowerCase().includes('nadia') ? 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/6f58029b-c770-4f25-a9f9-86dec6fb6137-1787168051706.jpeg' : undefined)

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

      case 'FILE': {
        const fileUrl = meta.file_url || ''
        const fileName = meta.file_name || message.content || 'Arquivo'
        const fileSize = meta.file_size || ''
        const isVideo = meta.is_video || /\.(mp4|webm|mov|ogg)$/i.test(fileUrl) || /\.(mp4|webm|mov|ogg)$/i.test(fileName)
        const isImage = /\.(jpg|jpeg|png|webp|gif)$/i.test(fileUrl) || /\.(jpg|jpeg|png|webp|gif)$/i.test(fileName)
        const isPdf = /\.pdf$/i.test(fileName)
        const isSheet = /\.(xlsx|xls|csv)$/i.test(fileName)

        if (isVideo && fileUrl) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 280 }}>
              <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', background: '#000' }}>
                <video src={fileUrl} controls playsInline style={{ width: '100%', maxHeight: 280, borderRadius: 12 }} />
              </div>
              {fileName && <p style={{ fontSize: '11px', color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</p>}
            </div>
          )
        }

        if (isImage && fileUrl) {
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 280 }}>
              <a href={fileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', overflow: 'hidden', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.04)' }}>
                <img src={fileUrl} alt={fileName} style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block', borderRadius: 12 }} loading="lazy" />
              </a>
              {fileName && <p style={{ fontSize: '11px', color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fileName}</p>}
            </div>
          )
        }

        return (
          <div className="chat-card-box" style={{ maxWidth: 280, padding: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, background: '#fafafa', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isPdf ? (
                  <FileText size={18} color="#ef4444" />
                ) : isSheet ? (
                  <FileText size={18} color="#16a34a" />
                ) : (
                  <Paperclip size={18} color="#2563eb" />
                )}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <p style={{ margin: 0, fontSize: '12.5px', fontWeight: 700, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2 }}>{fileName}</p>
                {fileSize && <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>{fileSize}</p>}
              </div>
            </div>
            {fileUrl && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 6 }}>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={fileName}
                  className="btn-chat-card-action"
                  style={{ textDecoration: 'none' }}
                >
                  <Download size={13} />
                  <span>Baixar Arquivo</span>
                </a>
              </div>
            )}
          </div>
        )
      }

      case 'IMAGE': {
        const imageUrl = meta.image_url || message.content
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 280 }}>
            <a href={imageUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', overflow: 'hidden', borderRadius: 12, border: '1px solid rgba(0,0,0,0.08)', background: 'rgba(0,0,0,0.04)' }}>
              <img
                src={imageUrl}
                alt={meta.file_name || 'Foto'}
                style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block', borderRadius: 12 }}
                loading="lazy"
              />
            </a>
            {message.content && message.content !== 'Imagem enviada' && message.content !== imageUrl && (
              <p className="chat-text-content" style={{ margin: 0, paddingTop: 2 }}>
                {message.content}
              </p>
            )}
          </div>
        )
      }

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

      <div className={`chat-message-bubble-group ${isMe ? 'align-end' : 'align-start'}`}>
        <div className="chat-sender-info">
          <span className="chat-sender-name">{message.sender_name}</span>
          <span className="chat-sender-sep">·</span>
          <span className="chat-time-text">
            {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          {showChannel && channelName && (
            <span className="chat-channel-tag">#{channelName}</span>
          )}
          {appOrigin && (
            <span className={`chat-app-origin-pill ${appOrigin.toLowerCase()}`}>
              via {appOrigin}
            </span>
          )}
        </div>

        <div className={`chat-bubble ${isMe ? 'bubble-me' : 'bubble-other'} ${message.message_type !== 'TEXT' && message.message_type !== 'IMAGE' ? 'card-type' : ''}`}>
          {renderContent()}
        </div>
      </div>

      {isMe && (
        <div className="chat-avatar-wrap">
          {resolvedPhoto ? (
            <img src={resolvedPhoto} alt="" className="chat-avatar-img" />
          ) : (
            <div className="chat-avatar-fallback">
              {(message.sender_name || 'E').charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
