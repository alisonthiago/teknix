'use client'

import React from 'react'
import Link from 'next/link'
import { InternalMessage } from '@/types/internal-chat'
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
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

interface MessageCardRendererProps {
  message: InternalMessage
  isMe: boolean
}

export default function MessageCardRenderer({ message, isMe }: MessageCardRendererProps) {
  const meta = message.metadata || {}

  const renderContent = () => {
    switch (message.message_type) {
      case 'CARD_ORDER':
        return (
          <div className="p-5 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm space-y-4 w-full text-left">
            <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#3483fa]" />
                <span className="font-mono font-bold text-sm text-[#1e293b]">{meta.order_number || 'Pedido'}</span>
              </div>
              {meta.marketplace_name && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#fafafa] border border-[#eee] text-[12px] font-semibold text-[#555]">
                  <MarketplaceLogo name={meta.marketplace_name} className="w-3.5 h-3.5" />
                  <span>{meta.marketplace_name}</span>
                </div>
              )}
            </div>

            <div className="flex items-start gap-3.5">
              {meta.product_image ? (
                <img src={meta.product_image} alt="" className="w-14 h-14 object-contain rounded-xl border border-[#eee] bg-[#f8fafc] p-0.5 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-[#f1f5f9] flex items-center justify-center text-[#64748b] shrink-0">
                  <Package className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0 space-y-1">
                <p className="font-bold text-[14px] text-[#1e293b] line-clamp-2 leading-snug">{meta.product_name || 'Produto'}</p>
                {meta.product_sku && <p className="font-mono text-[12px] text-[#64748b]">SKU: {meta.product_sku}</p>}
                {meta.customer_name && <p className="text-[12px] text-[#475569] font-medium">Cliente: {meta.customer_name}</p>}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[15px] font-black text-[#16a34a]">
                R$ {Number(meta.total_amount || 0).toFixed(2).replace('.', ',')}
              </span>
              <Link
                href={`/pedidos`}
                className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-[13px] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Abrir Pedido</span>
                <ExternalLink className="w-3.5 h-3.5 text-white" />
              </Link>
            </div>
          </div>
        )

      case 'CARD_PRODUCT':
        return (
          <div className="p-5 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm space-y-4 w-full text-left">
            <div className="flex items-center gap-2 pb-3 border-b border-[#f1f5f9]">
              <Package className="w-4 h-4 text-[#16a34a]" />
              <span className="font-bold text-[14px] text-[#1e293b]">Produto Operacional</span>
            </div>

            <div className="flex items-start gap-3.5">
              {meta.product_image ? (
                <img src={meta.product_image} alt="" className="w-14 h-14 object-contain rounded-xl border border-[#eee] bg-[#f8fafc] p-0.5 shrink-0" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-[#f1f5f9] flex items-center justify-center text-[#64748b] shrink-0">
                  <Package className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0 space-y-1">
                <p className="font-bold text-[14px] text-[#1e293b] line-clamp-2 leading-snug">{meta.product_name}</p>
                <p className="font-mono text-[12px] text-[#64748b]">SKU: {meta.product_sku}</p>
                <p className="text-[12px] font-bold text-[#d97706]">Estoque: {meta.total_amount || 8} un.</p>
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <Link
                href={meta.product_id ? `/produtos/${meta.product_id}` : `/operacao`}
                className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-[13px] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Abrir Produto</span>
                <ExternalLink className="w-3.5 h-3.5 text-white" />
              </Link>
            </div>
          </div>
        )

      case 'CARD_CUSTOMER':
        return (
          <div className="p-3.5 bg-white rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-2.5 max-w-sm text-left">
            <div className="flex items-center gap-1.5 pb-2 border-b border-[#f1f5f9]">
              <User className="w-4 h-4 text-[#6366f1]" />
              <span className="font-bold text-xs text-[#1e293b]">Cliente 360°</span>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-xs text-[#1e293b]">{meta.customer_name}</p>
              {meta.order_number && <p className="font-mono text-[11px] text-[#64748b]">Último Pedido: {meta.order_number}</p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <Link
                href={`/clientes`}
                className="px-3 py-1 bg-[#16a34a] hover:bg-[#15803d] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all shadow-2xs"
              >
                <span>Ver Cliente</span>
                <ExternalLink className="w-3 h-3 text-white" />
              </Link>
            </div>
          </div>
        )

      case 'CARD_INVOICE':
        return (
          <div className="p-3.5 bg-white rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-2.5 max-w-sm text-left">
            <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-[#0284c7]" />
                <span className="font-bold text-xs text-[#1e293b]">{meta.invoice_number || 'Nota Fiscal'}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-[#ecfdf5] text-[#16a34a] border border-[#bbf7d0]">
                Emitida
              </span>
            </div>

            <div className="space-y-1 text-xs text-[#475569]">
              <p className="font-medium">Pedido: <strong className="font-mono text-[#1e293b]">{meta.order_number}</strong></p>
              {meta.customer_name && <p className="font-medium">Comprador: <strong>{meta.customer_name}</strong></p>}
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button 
                onClick={() => alert('Download do XML e PDF da NF-e')}
                className="px-3 py-1 bg-[#f8fafc] hover:bg-[#f1f5f9] border border-[#e2e8f0] text-[#334155] text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                <Download className="w-3 h-3" /> Baixar PDF
              </button>
            </div>
          </div>
        )

      case 'CARD_SHIPPING':
        return (
          <div className="p-5 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm space-y-4 w-full text-left">
            <div className="flex items-center gap-2 pb-3 border-b border-[#f1f5f9]">
              <Truck className="w-4 h-4 text-[#d97706]" />
              <span className="font-bold text-[14px] text-[#1e293b]">Rastreamento & Logística</span>
            </div>

            <div className="space-y-2 text-[13px] text-[#475569] leading-relaxed">
              <p className="font-medium">Código: <strong className="font-mono text-[#1e293b] text-[14px]">{meta.tracking_code || 'MEL47814652332'}</strong></p>
              <p className="font-medium">Transportadora: <strong className="text-[#1e293b]">{meta.carrier || 'Mercado Envios'}</strong></p>
            </div>

            <div className="flex items-center justify-end pt-1">
              <Link
                href="/pedidos"
                className="px-4 py-2 bg-[#16a34a] hover:bg-[#15803d] text-white text-[13px] font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Acompanhar Pedido</span>
                <ExternalLink className="w-3.5 h-3.5 text-white" />
              </Link>
            </div>
          </div>
        )

      case 'CARD_TASK':
        return (
          <div className="p-3.5 bg-white rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-2.5 max-w-sm text-left">
            <div className="flex items-center justify-between pb-2 border-b border-[#f1f5f9]">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-[#8b5cf6]" />
                <span className="font-bold text-xs text-[#1e293b]">Atividade Operacional</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border ${
                meta.priority === 'URGENT' ? 'bg-[#fee2e2] text-[#dc2626] border-[#fecaca]' :
                meta.priority === 'HIGH' ? 'bg-[#fef3c7] text-[#d97706] border-[#fde68a]' :
                'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]'
              }`}>
                {meta.priority || 'NORMAL'}
              </span>
            </div>

            <p className="text-xs font-bold text-[#1e293b]">{meta.task_title || message.content}</p>

            <div className="flex justify-end pt-1">
              <Link
                href="/atividades"
                className="px-3 py-1 bg-[#16a34a] hover:bg-[#15803d] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all shadow-2xs"
              >
                <span>Ver na Central</span>
                <ExternalLink className="w-3 h-3 text-white" />
              </Link>
            </div>
          </div>
        )

      case 'FILE':
        return (
          <div className="p-3 bg-white rounded-2xl border border-[#e2e8f0] shadow-2xs space-y-2 max-w-xs text-left">
            {meta.file_url && meta.file_url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
              <img src={meta.file_url} alt="" className="w-full h-36 object-cover rounded-xl border border-[#eee]" />
            ) : (
              <div className="flex items-center gap-2.5 p-2 bg-[#f8fafc] rounded-xl border border-[#eee]">
                <Paperclip className="w-4 h-4 text-[#3483fa]" />
                <span className="text-xs font-bold text-[#1e293b] truncate">{meta.file_name || 'Documento.pdf'}</span>
              </div>
            )}
            <p className="text-xs text-[#333]">{message.content}</p>
          </div>
        )

      default:
        return (
          <p className="text-[13px] leading-relaxed whitespace-pre-wrap">{message.content}</p>
        )
    }
  }

  const isCard = message.message_type !== 'TEXT'

  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2.5 w-full items-end`}>
      {!isMe && (
        <div className="shrink-0 mb-1">
          {message.sender_photo ? (
            <img
              src={message.sender_photo}
              alt={message.sender_name}
              className="w-8 h-8 rounded-full object-cover border border-[#e2e8f0] shadow-xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#ecfdf5] border border-[#bbf7d0] text-[#16a34a] flex items-center justify-center font-bold text-xs shadow-xs">
              {message.sender_name?.slice(0, 1).toUpperCase() || 'C'}
            </div>
          )}
        </div>
      )}

      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1 max-w-[82%]`}>
        {/* Nome + hora */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8] px-1">
          <span className="font-bold text-[#334155]">{message.sender_name}</span>
          <span>·</span>
          <span>{new Date(message.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>

        {isCard ? (
          <div className="w-full">
            {renderContent()}
          </div>
        ) : (
          <div
            className={`rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed shadow-xs ${
              isMe
                ? 'bg-[#16a34a] text-white rounded-br-xs'
                : 'bg-white border border-[#e2e8f0] text-[#1e293b] rounded-bl-xs'
            }`}
          >
            <p className="whitespace-pre-wrap">{message.content}</p>
          </div>
        )}
      </div>

      {isMe && (
        <div className="shrink-0 mb-1">
          {message.sender_photo ? (
            <img
              src={message.sender_photo}
              alt={message.sender_name}
              className="w-8 h-8 rounded-full object-cover border border-[#e2e8f0] shadow-xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] text-[#475569] flex items-center justify-center font-bold text-xs shadow-xs">
              {message.sender_name?.slice(0, 1).toUpperCase() || 'E'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
