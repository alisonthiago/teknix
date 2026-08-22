'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, Download, ExternalLink, RefreshCw, AlertCircle } from 'lucide-react'
import type { OrderDetail } from '@/lib/detail-types'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

export default function PrintLabelClient({ order }: { order: OrderDetail }) {
  const router = useRouter()
  const [loadError, setLoadError] = useState(false)
  const pdfUrl = `/api/shipments/mercadolivre/label?orderId=${order.id}`

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-white border-b border-[#e2e8f0] px-4 py-3 shadow-2xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/pedidos/${order.id}`)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475569] hover:text-[#0f172a] bg-[#f1f5f9] hover:bg-[#e2e8f0] px-3 py-2 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar ao Pedido
            </button>
            <div className="flex items-center gap-2 border-l border-[#cbd5e1] pl-3">
              <MarketplaceLogo name={order.marketplace} className="w-5 h-5" />
              <div>
                <h1 className="text-sm font-bold text-[#0f172a] leading-tight">
                  Etiqueta Oficial • Pedido {order.order_number}
                </h1>
                <p className="text-[11px] text-[#64748b] font-medium">
                  {order.customer.name} • {order.shipping.city}/{order.shipping.state}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#334155] bg-white border border-[#cbd5e1] hover:bg-[#f5f5f5] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Abrir em Nova Aba
            </a>
            <a
              href={pdfUrl}
              download={`etiqueta-${order.order_number}.pdf`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#334155] bg-white border border-[#cbd5e1] hover:bg-[#f5f5f5] px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" /> Baixar PDF
            </a>
            <button
              onClick={() => {
                const iframe = document.getElementById('label-pdf-frame') as HTMLIFrameElement
                if (iframe?.contentWindow) {
                  iframe.contentWindow.focus()
                  iframe.contentWindow.print()
                } else {
                  window.open(pdfUrl, '_blank')?.print()
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-[#3483fa] hover:bg-[#2968c8] px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" /> Imprimir Etiqueta Térmica
            </button>
          </div>
        </div>
      </div>

      {/* Main Official PDF Embed Viewer */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col">
        {!loadError ? (
          <div className="flex-1 bg-white rounded-2xl border border-[#cbd5e1] overflow-hidden shadow-sm flex flex-col min-h-[82vh]">
            <iframe
              id="label-pdf-frame"
              src={pdfUrl}
              className="w-full flex-1 border-0 rounded-2xl min-h-[80vh]"
              title="Etiqueta Oficial Mercado Livre"
              onError={() => setLoadError(true)}
            />
          </div>
        ) : (
          <div className="flex-1 bg-white rounded-2xl border border-[#cbd5e1] p-12 text-center flex flex-col items-center justify-center">
            <AlertCircle className="w-12 h-12 text-[#e67e22] mb-3" />
            <h3 className="text-base font-bold text-[#0f172a] mb-1">
              Etiqueta não disponível para reimpressão
            </h3>
            <p className="text-xs text-[#64748b] max-w-md mb-4">
              O Mercado Livre só permite gerar o PDF enquanto o envio estiver pendente ou em trânsito. Pedidos já entregues ou cancelados têm o arquivo arquivado pelo marketplace.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLoadError(false)}
                className="px-4 py-2 bg-[#3483fa] text-white text-xs font-semibold rounded-xl hover:bg-[#2968c8] transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Tentar Novamente
              </button>
              <button
                onClick={() => router.push(`/pedidos/${order.id}/nota`)}
                className="px-4 py-2 bg-white border border-[#cbd5e1] text-xs font-semibold text-[#334155] rounded-xl hover:bg-[#f8fafc] transition-colors"
              >
                Ver Comprovante / DANFE
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
