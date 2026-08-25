'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, ShoppingCart, DollarSign, Search, MapPin, Phone, ArrowUpRight, Store } from 'lucide-react'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-md border border-[#e6e6e6] p-4">
      <p className="text-sm font-medium text-[#999] mb-1">{label}</p>
      <p className="text-[18px] font-semibold text-[#333]">{value}</p>
      {sub && <p className="text-xs text-[#ccc] mt-0.5">{sub}</p>}
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
    <div className="space-y-4">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard label="Total de Clientes" value={String(customers.length)} />
        <StatCard label="Faturamento Total" value={formatBRL(totalSpentAll)} />
        <StatCard label="Ticket Médio" value={formatBRL(avgTicket)} />
        <StatCard label="Canais Conectados" value="Mercado Livre" sub="Shopee • Amazon" />
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-md border border-[#e6e6e6]">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#999]" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou endereço..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#fafafa] border border-[#e6e6e6] rounded-md text-sm text-[#333] focus:outline-none focus:border-[#ccc]"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[#999]">Canal:</span>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="bg-[#fafafa] border border-[#e6e6e6] rounded-md px-3 py-1.5 text-sm text-[#333] focus:outline-none"
          >
            <option value="ALL">Todos os Canais</option>
            <option value="Mercado Livre">Mercado Livre</option>
            <option value="Shopee">Shopee</option>
            <option value="Amazon">Amazon</option>
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-md border border-[#e6e6e6] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-[#999]">Carregando clientes...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-sm text-[#999]">Nenhum cliente encontrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#fafafa] border-b border-[#eeeeee]">
                  <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Cliente / Comprador</th>
                  <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Origem / Canal</th>
                  <th className="text-center py-3.5 px-5 font-medium text-[#999] text-xs">Compras</th>
                  <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Total Gasto</th>
                  <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Entrega / Localização</th>
                  <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Último Pedido</th>
                  <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eeeeee]">
                {filtered.map((c, idx) => {
                  const customerSlug = encodeURIComponent(c.name.trim().toLowerCase().replace(/\s+/g, '-'))

                  return (
                    <tr key={idx} className="hover:bg-[#fafafa] transition-colors group">
                      <td className="py-3 px-4 font-medium text-[#333] text-[13px]">
                        <Link href={`/clientes/${customerSlug}`} className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-[#f5f5f5] border border-[#e6e6e6] flex items-center justify-center text-[#666] font-medium uppercase shrink-0">
                            {c.name.slice(0, 1)}
                          </div>
                          <div>
                            <p className="leading-tight font-medium text-[#333] hover:underline">
                              {c.name}
                            </p>
                            {c.phone !== '—' && (
                              <p className="text-[12px] text-[#999] flex items-center gap-1 mt-0.5 font-normal">
                                <Phone className="w-3 h-3 text-[#ccc]" /> {c.phone}
                              </p>
                            )}
                          </div>
                        </Link>
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex flex-wrap items-center gap-1">
                          {Array.from(c.marketplaces).map((mp, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#fffde7] text-[#856404] border border-[#ffeeba] text-xs font-medium">
                              <MarketplaceLogo name={mp} className="w-3 h-3" /> {mp}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <Link href={`/clientes/${customerSlug}`}>
                          <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-[#f0fff4] text-[#38a169]">
                            {c.ordersCount} {c.ordersCount === 1 ? 'pedido' : 'pedidos'}
                          </span>
                        </Link>
                      </td>

                      <td className="py-4 px-4 text-right font-medium text-[#333]">
                        {formatBRL(c.totalSpent)}
                      </td>

                      <td className="py-3 px-4 text-[#999]">
                        <p className="truncate max-w-[200px] flex items-center gap-1 text-[12px]">
                          <MapPin className="w-3 h-3 text-[#ccc] shrink-0" />
                          {c.address}
                        </p>
                      </td>

                      <td className="py-4 px-4 text-right text-[#999] text-sm">
                        {c.lastOrderDate}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/clientes/${customerSlug}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-[#f5f5f5] text-[#666] hover:text-[#333] border border-[#e6e6e6] rounded-md text-sm font-medium transition-colors"
                        >
                          Ver Perfil <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
