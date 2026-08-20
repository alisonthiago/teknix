'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, CheckCircle2 } from 'lucide-react'
import type { OrderDetail } from '@/lib/detail-types'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

export default function PrintLabelClient({ order }: { order: OrderDetail }) {
  const router = useRouter()

  useEffect(() => {
    // Automatically trigger print on load if requested
    const timer = setTimeout(() => {
      window.print()
    }, 600)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 sm:p-8 flex flex-col items-center">
      {/* Top Action Bar (hidden on print) */}
      <div className="w-full max-w-[400px] mb-4 flex items-center justify-between print:hidden">
        <button
          onClick={() => router.push(`/pedidos/${order.id}`)}
          className="inline-flex items-center gap-1.5 text-xs text-[#666] hover:text-[#111] bg-white px-3 py-1.5 rounded-lg border border-[#e6e6e6] shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Pedido
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#3483fa] hover:bg-[#2968c8] px-4 py-1.5 rounded-lg shadow-sm cursor-pointer"
        >
          <Printer className="w-3.5 h-3.5" /> Imprimir Etiqueta
        </button>
      </div>

      {/* 100x150mm Standard Thermal Shipping Label */}
      <div className="w-full max-w-[400px] bg-white border-2 border-black rounded-lg p-4 font-sans text-black shadow-lg print:shadow-none print:border-black print:m-0 print:p-4 print:w-[100mm] print:h-[150mm] print:rounded-none">
        {/* Header */}
        <div className="border-b-2 border-black pb-2 mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#ffe600] flex items-center justify-center p-1 border border-black">
              <MarketplaceLogo name={order.marketplace} className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-black tracking-wide uppercase leading-tight">{order.marketplace || 'Mercado Envios'}</p>
              <p className="text-[9px] font-semibold text-gray-700">ENVIOS • LOGÍSTICA</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-black border border-black px-1.5 py-0.5 rounded uppercase">
              {order.shipping.method || 'PADRÃO'}
            </span>
          </div>
        </div>

        {/* Tracking & Barcode Simulation */}
        <div className="text-center my-3">
          <p className="text-[10px] uppercase font-bold tracking-widest text-gray-800">Código de Rastreamento</p>
          <p className="text-[15px] font-mono font-black tracking-wider my-0.5">
            {order.shipping.tracking || `MEL${order.order_number.replace(/\D/g, '')}`}
          </p>
          {/* Visual Barcode */}
          <div className="h-12 w-full bg-[repeating-linear-gradient(90deg,#000,#000_2px,transparent_2px,transparent_4px,#000_4px,#000_7px,transparent_7px,transparent_8px,#000_8px,#000_12px,transparent_12px,transparent_14px)] my-1 border-t border-b border-black" />
          <p className="text-[9px] font-mono text-gray-600">*{order.order_number}*</p>
        </div>

        {/* Recipient Box (Destinatário) */}
        <div className="border-2 border-black rounded p-2 mb-3 bg-gray-50/50">
          <div className="flex items-center justify-between border-b border-gray-300 pb-1 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider">DESTINATÁRIO</span>
            <span className="text-[9px] font-bold">CEP: {order.shipping.zip || '06412-270'}</span>
          </div>
          <p className="text-[12px] font-black uppercase text-black leading-snug">{order.customer.name}</p>
          <p className="text-[11px] font-bold text-gray-900 mt-0.5 leading-snug">{order.shipping.address}</p>
          <p className="text-[11px] font-bold text-gray-900 leading-snug">
            {order.shipping.city} - {order.shipping.state}
          </p>
          {order.customer.phone && (
            <p className="text-[9px] text-gray-700 mt-1">Tel: {order.customer.phone}</p>
          )}
        </div>

        {/* Sender Box (Remetente) */}
        <div className="border border-black rounded p-2 mb-3 text-[10px]">
          <div className="flex items-center justify-between border-b border-gray-200 pb-0.5 mb-1">
            <span className="font-black uppercase tracking-wider text-[9px]">REMETENTE</span>
            <span className="text-[8px] font-bold">TEKNIXBRASIL</span>
          </div>
          <p className="font-bold uppercase">TEKNIX COMERCIO ELETRONICO</p>
          <p className="text-gray-800">Rua Vitorino Calegare, 141 - Barueri / SP</p>
          <p className="text-gray-800 font-mono">CEP: 06412-270</p>
        </div>

        {/* Items Summary (Declaração de Conteúdo) */}
        <div className="border-t-2 border-dashed border-black pt-2 text-[9px]">
          <p className="font-black uppercase text-[9px] mb-1">DECLARAÇÃO DE CONTEÚDO</p>
          <div className="space-y-0.5 max-h-[80px] overflow-hidden">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-gray-800">
                <span className="truncate max-w-[240px]">{item.quantity}x {item.name}</span>
                <span className="font-mono font-bold shrink-0">R$ {item.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between items-center pt-1 mt-1 border-t border-gray-300 font-black">
            <span>TOTAL DO PEDIDO</span>
            <span>R$ {order.payment.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
