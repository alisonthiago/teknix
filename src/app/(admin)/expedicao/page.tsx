'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import { 
  Package, 
  Scan, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Search, 
  Check, 
  Sparkles, 
  RefreshCw,
  Truck,
  Box
} from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

function formatBRL(val: number) {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ExpedicaoPage() {
  const [scanInput, setScanInput] = useState('')
  const [scanFeedback, setScanFeedback] = useState<{ type: 'SUCCESS' | 'ERROR' | 'INFO'; message: string } | null>(null)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [packedOrders, setPackedOrders] = useState<Set<string>>(new Set())
  const [isUpdating, setIsUpdating] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const { data: orders, loading, refetch } = useSupabaseQuery(async (s) => {
    const { data, error } = await s
      .from('orders')
      .select('*, marketplaces(name, logo), order_items(*, products(id, name, sku, ean, image_url))')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  })

  // Group ready to ship
  const toShipOrders = useMemo(() => {
    return (orders || []).filter(o => !packedOrders.has(o.id) && ['NOVO', 'PAGO', 'AGUARDANDO_SEPARACAO', 'EM_SEPARACAO', 'SEPARADO'].includes(o.status))
  }, [orders, packedOrders])

  // Select active order
  const activeOrder = useMemo(() => {
    if (selectedOrderId) {
      return toShipOrders.find(o => o.id === selectedOrderId) || toShipOrders[0]
    }
    return toShipOrders[0]
  }, [toShipOrders, selectedOrderId])

  // Group by channel
  const channelSummary = useMemo(() => {
    const map = new Map<string, number>()
    for (const o of toShipOrders) {
      const ch = (o.marketplaces as any)?.name || 'Mercado Livre'
      map.set(ch, (map.get(ch) || 0) + 1)
    }
    return Array.from(map.entries())
  }, [toShipOrders])

  // Handle barcode scanning
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanInput.trim() || !activeOrder) return

    const query = scanInput.trim().toLowerCase()
    const items = activeOrder.order_items || []

    const matchedItem = items.find((it: any) => {
      const prod = it.products
      const sku = (it.sku || prod?.sku || '').toLowerCase()
      const ean = (prod?.ean || '').toLowerCase()
      const tracking = (activeOrder.tracking_code || '').toLowerCase()
      const orderNum = (activeOrder.order_number || '').toLowerCase()

      return query === sku || query === ean || query === tracking || query === orderNum || query.includes(sku)
    })

    if (matchedItem) {
      setScanFeedback({
        type: 'SUCCESS',
        message: `✅ PRODUTO CORRETO: ${(matchedItem.products?.name || matchedItem.sku).slice(0, 45)} (Qtd: ${matchedItem.quantity})`
      })
    } else {
      setScanFeedback({
        type: 'ERROR',
        message: `🚨 PRODUTO INCORRETO! O código "${scanInput}" não pertence ao pedido ${activeOrder.order_number}.`
      })
    }

    setScanInput('')
    inputRef.current?.focus()
  }

  const handleConfirmPacking = async () => {
    if (!activeOrder) return
    setIsUpdating(true)

    try {
      await fetch('/api/shipments/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: activeOrder.id, newStatus: 'EMBALADO' })
      })

      setPackedOrders(prev => new Set([...prev, activeOrder.id]))
      setScanFeedback({
        type: 'SUCCESS',
        message: `📦 Pedido ${activeOrder.order_number} conferido e embalado com sucesso!`
      })
      setSelectedOrderId(null)
    } catch (e) {
      console.error(e)
    } finally {
      setIsUpdating(false)
      inputRef.current?.focus()
    }
  }

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#0f172a]">Estação de Expedição & Bipagem</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
              Modo Packing Station
            </span>
          </div>
          <p className="text-xs text-[#64748b] mt-0.5">
            Conferência de mercadorias por scanner, validação de itens e impressão centralizada de etiquetas térmicas.
          </p>
        </div>

        {/* Batch Print All Labels */}
        {toShipOrders.length > 0 && (
          <Link
            href={`/pedidos?batchPrint=true`}
            className="px-5 py-2.5 rounded-2xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <Printer className="w-4 h-4" />
            Imprimir Todas as Etiquetas ({toShipOrders.length})
          </Link>
        )}
      </div>

      {/* Channel Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {channelSummary.length > 0 ? (
          channelSummary.map(([ch, count], i) => (
            <div key={i} className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-2xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <MarketplaceLogo name={ch} className="w-5 h-5" />
                <div>
                  <p className="font-bold text-xs text-[#0f172a]">{ch}</p>
                  <p className="text-[11px] text-[#64748b]">{count} etiqueta{count !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <span className="text-lg font-black text-[#2563eb]">{count}</span>
            </div>
          ))
        ) : (
          <div className="col-span-full bg-white p-4 rounded-2xl border border-[#e2e8f0] text-center text-xs text-[#64748b]">
            Nenhum pedido pendente de envio.
          </div>
        )}
      </div>

      {/* Main Packing Station UI */}
      {loading ? (
        <div className="p-12 text-center text-xs text-[#94a3b8] bg-white rounded-3xl border border-[#e2e8f0]">
          Carregando pedidos da esteira de expedição...
        </div>
      ) : !activeOrder ? (
        <div className="p-16 text-center bg-white rounded-3xl border border-[#e2e8f0]">
          <CheckCircle2 className="w-12 h-12 text-[#16a34a] mx-auto mb-3" />
          <h2 className="text-lg font-extrabold text-[#0f172a]">Todos os pedidos foram expedidos!</h2>
          <p className="text-xs text-[#64748b] mt-1">Nenhum pacote pendente de conferência no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Active Order Being Packed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl border-2 border-[#2563eb] p-6 shadow-md relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#2563eb] font-bold shrink-0">
                    <MarketplaceLogo name={(activeOrder.marketplaces as any)?.name || 'Mercado Livre'} className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg font-black text-[#0f172a] font-mono">{activeOrder.order_number}</h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
                        {activeOrder.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#64748b] mt-0.5">
                      Cliente: <strong className="text-[#0f172a]">{activeOrder.customer_name}</strong> • Destino: {activeOrder.shipping_city || 'PR'}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/pedidos/${activeOrder.id}/etiqueta`}
                  target="_blank"
                  className="px-4 py-2 rounded-xl bg-[#eff6ff] hover:bg-[#dbeafe] text-[#2563eb] border border-[#bfdbfe] text-xs font-bold flex items-center gap-1.5 transition-colors self-start sm:self-auto"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Etiqueta (PDF)
                </Link>
              </div>

              {/* Barcode Scanner Input Form */}
              <div className="my-5 p-4 bg-[#f8fafc] rounded-2xl border border-[#e2e8f0]">
                <form onSubmit={handleBarcodeSubmit} className="space-y-2">
                  <label className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                    <Scan className="w-4 h-4 text-[#2563eb]" />
                    Bipar Código de Barras (SKU / EAN / Rastreio):
                  </label>
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      placeholder="Escaneie o código de barras ou digite o SKU..."
                      value={scanInput}
                      onChange={(e) => setScanInput(e.target.value)}
                      className="flex-1 px-4 py-2.5 bg-white border-2 border-[#2563eb] rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                    />
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Verificar
                    </button>
                  </div>
                </form>

                {/* Scan Feedback Message */}
                {scanFeedback && (
                  <div className={`mt-3 p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    scanFeedback.type === 'SUCCESS' ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]' : 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]'
                  }`}>
                    {scanFeedback.type === 'SUCCESS' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{scanFeedback.message}</span>
                  </div>
                )}
              </div>

              {/* Products in this package */}
              <div className="space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Produtos a Conferir e Embalar:</p>

                {(activeOrder.order_items || []).map((it: any, idx: number) => {
                  const prod = it.products
                  const pic = prod?.image_url || it.image_url || '/placeholder-product.png'
                  const title = prod?.name || it.product_name || 'Produto'

                  return (
                    <div key={idx} className="flex items-center justify-between gap-4 p-3.5 bg-white rounded-2xl border border-[#e2e8f0] shadow-2xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] overflow-hidden flex items-center justify-center shrink-0">
                          {pic ? (
                            <img src={pic} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-[#94a3b8]" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-extrabold text-[#0f172a] truncate">{title}</p>
                          <p className="text-xs text-[#64748b] font-mono mt-0.5">
                            SKU: <strong className="text-[#0f172a]">{it.sku || prod?.sku}</strong>
                            {prod?.ean && <span> • EAN: {prod.ean}</span>}
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-flex px-3 py-1 rounded-xl text-xs font-black bg-[#eff6ff] text-[#2563eb] border border-[#bfdbfe]">
                          {it.quantity} UNIDADE{it.quantity > 1 ? 'S' : ''}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Confirm Packing Button */}
              <div className="mt-6 pt-4 border-t border-[#f1f5f9] flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs text-[#64748b]">
                    Rastreamento: <strong className="font-mono text-[#0f172a]">{activeOrder.tracking_code || 'Etiqueta Gerada'}</strong>
                  </p>
                </div>

                <button
                  onClick={handleConfirmPacking}
                  disabled={isUpdating}
                  className="px-6 py-3 rounded-2xl bg-[#16a34a] hover:bg-[#15803d] text-white text-sm font-black transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-[1.02]"
                >
                  {isUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  CONFIRMAR SEPARAÇÃO & EMBALAR
                </button>
              </div>
            </div>
          </div>

          {/* Right Col: Orders Queue */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-[#e2e8f0] p-5 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#f1f5f9]">
                <h3 className="text-sm font-bold text-[#0f172a]">Fila de Espera ({toShipOrders.length})</h3>
                <span className="text-[11px] text-[#64748b]">Próximos envios</span>
              </div>

              <div className="divide-y divide-[#f1f5f9] max-h-[520px] overflow-y-auto mt-2">
                {toShipOrders.map((ord) => {
                  const isSelected = ord.id === activeOrder.id

                  return (
                    <div
                      key={ord.id}
                      onClick={() => {
                        setSelectedOrderId(ord.id)
                        setScanFeedback(null)
                      }}
                      className={`p-3.5 rounded-2xl my-1 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#eff6ff] border-2 border-[#2563eb] shadow-xs'
                          : 'hover:bg-[#f8fafc] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <MarketplaceLogo name={(ord.marketplaces as any)?.name || 'Mercado Livre'} className="w-5 h-5 shrink-0" />
                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#2563eb]' : 'text-[#0f172a]'}`}>
                            {ord.order_number}
                          </p>
                          <p className="text-[11px] text-[#64748b] truncate">{ord.customer_name}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-extrabold text-[#0f172a]">{formatBRL(Number(ord.total_amount || 0))}</p>
                        <p className="text-[10px] text-[#94a3b8] font-mono">
                          {ord.created_at ? new Date(ord.created_at).toLocaleDateString('pt-BR') : '—'}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
