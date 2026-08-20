'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, ShoppingCart, DollarSign, Search, MapPin, Phone, ArrowUpRight, Store } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4 shadow-2xs">
      <p className="text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1">{label}</p>
      <p className="text-xl font-bold text-[#0f172a]">{value}</p>
      {sub && <p className="text-[11px] text-[#94a3b8] mt-0.5">{sub}</p>}
    </div>
  )
}

function formatBRL(val: number) {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface CustomerItem {
  name: string
  phone: string
  address: string
  totalSpent: number
  ordersCount: number
  marketplaces: Set<string>
  lastOrderDate: string
  ordersList: Array<{ id: string; order_number: string; total_amount: number; status: string; date: string; marketplace: string }>
}

export default function ClientesPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedChannel, setSelectedChannel] = useState('ALL')

  const { data: orders, loading } = useSupabaseQuery(async (s) => {
    const { data, error } = await s
      .from('orders')
      .select('id, order_number, customer_name, customer_phone, total_amount, status, notes, tracking_code, created_at, marketplaces(name, logo)')
      .order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  })

  // Group orders by customer
  const customers = useMemo(() => {
    if (!orders) return []

    const map = new Map<string, CustomerItem>()

    for (const o of orders) {
      const name = (o.customer_name as string) || 'Comprador Anônimo'
      const key = name.trim().toLowerCase()
      const mpName = (o.marketplaces as any)?.name || 'Mercado Livre'

      let existing = map.get(key)
      if (!existing) {
        existing = {
          name,
          phone: (o.customer_phone as string) || '—',
          address: (o.notes as string) || '—',
          totalSpent: 0,
          ordersCount: 0,
          marketplaces: new Set<string>(),
          lastOrderDate: o.created_at ? new Date(o.created_at as string).toLocaleDateString('pt-BR') : '—',
          ordersList: []
        }
        map.set(key, existing)
      }

      existing.totalSpent += Number(o.total_amount || 0)
      existing.ordersCount += 1
      existing.marketplaces.add(mpName)
      existing.ordersList.push({
        id: o.id as string,
        order_number: o.order_number as string,
        total_amount: Number(o.total_amount || 0),
        status: o.status as string,
        date: o.created_at ? new Date(o.created_at as string).toLocaleDateString('pt-BR') : '—',
        marketplace: mpName
      })
    }

    return Array.from(map.values())
  }, [orders])

  const filtered = useMemo(() => {
    return customers.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search) || c.address.toLowerCase().includes(search.toLowerCase())
      const matchChannel = selectedChannel === 'ALL' || Array.from(c.marketplaces).includes(selectedChannel)
      return matchSearch && matchChannel
    })
  }, [customers, search, selectedChannel])

  const totalSpentAll = customers.reduce((a, b) => a + b.totalSpent, 0)
  const avgTicket = customers.length > 0 ? totalSpentAll / customers.length : 0

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#0f172a]">Central de Clientes & Compradores</h1>
        <p className="text-xs text-[#64748b] mt-0.5">
          Histórico unificado de clientes originados pelo Mercado Livre e outros marketplaces.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total de Clientes" value={String(customers.length)} />
        <StatCard label="Faturamento Total" value={formatBRL(totalSpentAll)} />
        <StatCard label="Ticket Médio" value={formatBRL(avgTicket)} />
        <StatCard label="Canais Conectados" value="Mercado Livre" sub="Shopee • Amazon" />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-[#e2e8f0] shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#94a3b8]" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou endereço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl text-xs focus:outline-none focus:border-[#3483fa]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#64748b]">Canal:</span>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="bg-[#f8fafc] border border-[#e2e8f0] rounded-xl px-3 py-1.5 text-xs text-[#0f172a] focus:outline-none"
          >
            <option value="ALL">Todos os Canais</option>
            <option value="Mercado Livre">Mercado Livre</option>
            <option value="Shopee">Shopee</option>
            <option value="Amazon">Amazon</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-2xl border border-[#e2e8f0] overflow-hidden shadow-2xs">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#94a3b8]">Carregando clientes...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#94a3b8]">Nenhum cliente encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0] text-[10px] font-bold text-[#64748b] uppercase">
                  <th className="py-3 px-4">Cliente / Comprador</th>
                  <th className="py-3 px-4">Origem / Canal</th>
                  <th className="py-3 px-4 text-center">Compras</th>
                  <th className="py-3 px-4 text-right">Total Gasto</th>
                  <th className="py-3 px-4">Entrega / Localização</th>
                  <th className="py-3 px-4 text-right">Último Pedido</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {filtered.map((c, idx) => (
                  <tr key={idx} className="hover:bg-[#f8fafc] transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-[#0f172a]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-[#f1f5f9] border border-[#e2e8f0] flex items-center justify-center text-[#64748b] font-bold uppercase shrink-0">
                          {c.name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="leading-tight font-bold text-[#0f172a]">{c.name}</p>
                          {c.phone !== '—' && (
                            <p className="text-[11px] text-[#64748b] flex items-center gap-1 mt-0.5">
                              <Phone className="w-3 h-3 text-[#94a3b8]" /> {c.phone}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1">
                        {Array.from(c.marketplaces).map((mp, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#fffde7] text-[#856404] border border-[#ffeeba] text-[10px] font-bold">
                            <MarketplaceLogo name={mp} className="w-3 h-3" /> {mp}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full font-bold bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">
                        {c.ordersCount} {c.ordersCount === 1 ? 'pedido' : 'pedidos'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-black text-[#0f172a]">
                      {formatBRL(c.totalSpent)}
                    </td>

                    <td className="py-3.5 px-4 text-[#64748b]">
                      <p className="truncate max-w-xs flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#94a3b8] shrink-0" />
                        {c.address}
                      </p>
                    </td>

                    <td className="py-3.5 px-4 text-right text-[#64748b] font-mono text-[11px]">
                      {c.lastOrderDate}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {c.ordersList[0]?.id && (
                        <Link
                          href={`/pedidos/${c.ordersList[0].id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#3483fa] hover:underline"
                        >
                          Ver Pedido <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
