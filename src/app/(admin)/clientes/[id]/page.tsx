'use client'

import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Phone, MapPin, ShoppingCart, DollarSign, Package, ExternalLink, Printer, Calendar, ShieldCheck } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

function formatBRL(val: number) {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function ClienteProfilePage() {
  const params = useParams()
  const router = useRouter()
  const rawId = typeof params?.id === 'string' ? decodeURIComponent(params.id) : ''

  const { data, loading } = useSupabaseQuery(async (s) => {
    // Search orders matching customer name or id
    const { data: allOrders, error } = await s
      .from('orders')
      .select('*, marketplaces(name, logo), order_items(*, products(id, name, sku, image_url))')
      .order('created_at', { ascending: false })

    if (error) throw error

    // Find orders for this customer
    const decodedName = rawId.replace(/-/g, ' ').toLowerCase()
    const matching = (allOrders || []).filter(o => {
      if (o.customer_id === rawId || o.id === rawId) return true
      const cName = (o.customer_name || '').trim().toLowerCase()
      if (cName === decodedName || cName === rawId.toLowerCase()) return true
      if (cName.replace(/\s+/g, '-') === rawId.toLowerCase()) return true
      return false
    })

    if (matching.length === 0) {
      // fallback: try substring match
      const sub = (allOrders || []).filter(o => (o.customer_name || '').toLowerCase().includes(decodedName))
      return sub
    }

    return matching
  })

  const orders = data || []
  const firstOrder = orders[0]
  const customerName = firstOrder?.customer_name || rawId
  const customerPhone = firstOrder?.customer_phone || '—'
  const customerAddress = firstOrder?.notes || firstOrder?.shipping_address || '—'

  const totalSpent = orders.reduce((a, b) => a + Number(b.total_amount || 0), 0)
  const totalItems = orders.reduce((a, b) => a + (b.order_items?.reduce((x: number, y: any) => x + Number(y.quantity || 1), 0) || 1), 0)
  const avgTicket = orders.length > 0 ? totalSpent / orders.length : 0

  const channels = Array.from(new Set(orders.map(o => (o.marketplaces as any)?.name || 'Mercado Livre')))

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Back button */}
      <div>
        <Link
          href="/clientes"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748b] hover:text-[#0f172a] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar para Central de Clientes
        </Link>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-[#e2e8f0] text-center text-xs text-[#94a3b8]">
          Carregando perfil e histórico de compras do cliente...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-[#e2e8f0] text-center">
          <p className="text-sm font-bold text-[#0f172a]">Cliente não encontrado</p>
          <p className="text-xs text-[#64748b] mt-1">Nenhum pedido vinculado a este comprador.</p>
        </div>
      ) : (
        <>
          {/* Customer Profile Hero Card */}
          <div className="bg-white rounded-3xl border border-[#e2e8f0] p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-[#eff6ff] border border-[#bfdbfe] flex items-center justify-center text-[#2563eb] text-2xl font-black uppercase shadow-xs shrink-0">
                  {customerName.slice(0, 1)}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-[#0f172a]">{customerName}</h1>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
                      <ShieldCheck className="w-3.5 h-3.5" /> Comprador Verificado
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-y-1.5 gap-x-4 mt-2 text-xs text-[#64748b]">
                    {customerPhone !== '—' && (
                      <span className="flex items-center gap-1.5 font-medium text-[#0f172a]">
                        <Phone className="w-3.5 h-3.5 text-[#2563eb]" /> {customerPhone}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#64748b]" /> {customerAddress}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Canais de Compra:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {channels.map((ch, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#fffde7] text-[#856404] border border-[#ffeeba] text-xs font-bold">
                          <MarketplaceLogo name={ch} className="w-3.5 h-3.5" /> {ch}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Spent Badge */}
              <div className="bg-[#f8fafc] border border-[#e2e8f0] p-4 rounded-2xl md:text-right shrink-0">
                <p className="text-[11px] font-bold text-[#64748b] uppercase tracking-wider">Total em Compras (LTV)</p>
                <p className="text-2xl font-black text-[#16a34a] mt-0.5">{formatBRL(totalSpent)}</p>
                <p className="text-[11px] text-[#94a3b8] mt-0.5">{orders.length} pedido{orders.length !== 1 ? 's' : ''} realizados</p>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-2xs">
              <p className="text-[11px] font-bold text-[#64748b] uppercase">Total de Pedidos</p>
              <p className="text-xl font-extrabold text-[#0f172a] mt-1">{orders.length}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-2xs">
              <p className="text-[11px] font-bold text-[#64748b] uppercase">Itens Comprados</p>
              <p className="text-xl font-extrabold text-[#0f172a] mt-1">{totalItems} un</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-2xs">
              <p className="text-[11px] font-bold text-[#64748b] uppercase">Ticket Médio</p>
              <p className="text-xl font-extrabold text-[#0f172a] mt-1">{formatBRL(avgTicket)}</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-[#e2e8f0] shadow-2xs">
              <p className="text-[11px] font-bold text-[#64748b] uppercase">Última Compra</p>
              <p className="text-xl font-extrabold text-[#0f172a] mt-1 font-mono text-sm">
                {firstOrder?.created_at ? new Date(firstOrder.created_at).toLocaleDateString('pt-BR') : '—'}
              </p>
            </div>
          </div>

          {/* Orders & Purchased Items Table */}
          <div className="bg-white rounded-3xl border border-[#e2e8f0] overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-[#e2e8f0] flex items-center justify-between bg-[#fafafa]">
              <div>
                <h3 className="text-sm font-bold text-[#0f172a]">Histórico Completo de Pedidos do Cliente</h3>
                <p className="text-[11px] text-[#64748b] mt-0.5">Todos os pedidos consolidados de todas as plataformas.</p>
              </div>
              <span className="text-xs font-bold text-[#2563eb] bg-[#eff6ff] px-3 py-1 rounded-xl border border-[#bfdbfe]">
                {orders.length} Pedido{orders.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="divide-y divide-[#f1f5f9]">
              {orders.map((ord) => {
                const mpName = (ord.marketplaces as any)?.name || 'Mercado Livre'
                const items = ord.order_items || []

                return (
                  <div key={ord.id} className="p-6 hover:bg-[#f8fafc] transition-colors">
                    {/* Order Top Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#f1f5f9]">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-[#e2e8f0] flex items-center justify-center shrink-0 shadow-2xs">
                          <MarketplaceLogo name={mpName} className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/pedidos/${ord.id}`}
                              className="text-sm font-extrabold text-[#2563eb] hover:underline font-mono"
                            >
                              {ord.order_number}
                            </Link>
                            <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
                              {ord.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#64748b] flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-[#94a3b8]" />
                            {ord.created_at ? new Date(ord.created_at).toLocaleDateString('pt-BR') : '—'} • {mpName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 self-end sm:self-center">
                        <div className="text-right">
                          <p className="text-[10px] font-bold text-[#64748b] uppercase">Total Cobrado</p>
                          <p className="text-base font-black text-[#0f172a]">{formatBRL(Number(ord.total_amount || 0))}</p>
                        </div>

                        <Link
                          href={`/pedidos/${ord.id}/etiqueta`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-colors shadow-2xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          Etiqueta
                        </Link>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="mt-4 space-y-2.5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Produtos neste Pedido:</p>
                      {items.map((it: any, idx: number) => {
                        const prod = it.products
                        const pic = prod?.image_url || it.image_url || '/placeholder-product.png'
                        const prodTitle = prod?.name || it.product_name || 'Produto Mercado Livre'

                        return (
                          <div key={idx} className="flex items-center justify-between gap-4 p-3 bg-white rounded-2xl border border-[#e2e8f0]">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] overflow-hidden flex items-center justify-center shrink-0">
                                {pic ? (
                                  <img src={pic} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <Package className="w-5 h-5 text-[#94a3b8]" />
                                )}
                              </div>

                              <div className="min-w-0">
                                {prod?.id ? (
                                  <Link
                                    href={`/produtos/${prod.id}`}
                                    className="text-xs font-bold text-[#0f172a] hover:text-[#2563eb] hover:underline truncate block"
                                  >
                                    {prodTitle}
                                  </Link>
                                ) : (
                                  <p className="text-xs font-bold text-[#0f172a] truncate">{prodTitle}</p>
                                )}
                                <p className="text-[11px] text-[#64748b] font-mono mt-0.5">SKU: {it.sku || prod?.sku || '—'}</p>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <p className="text-xs font-extrabold text-[#0f172a]">
                                {it.quantity}x {formatBRL(Number(it.unit_price || 0))}
                              </p>
                              <p className="text-[11px] font-bold text-[#16a34a]">
                                Total: {formatBRL(Number(it.quantity || 1) * Number(it.unit_price || 0))}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* Delivery & Tracking Details */}
                    {ord.tracking_code && (
                      <div className="mt-3 flex items-center justify-between text-xs bg-[#eff6ff]/60 px-3 py-2 rounded-xl border border-[#bfdbfe]">
                        <span className="text-[#2563eb] font-semibold flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5" /> Rastreamento: <strong className="font-mono">{ord.tracking_code}</strong>
                        </span>
                        <Link href={`/pedidos/${ord.id}`} className="text-[#2563eb] font-bold hover:underline flex items-center gap-1">
                          Ver Detalhes <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
