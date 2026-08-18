'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingCart, Store, Bell, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface DashboardMetrics {
  totalSalesCount: number
  totalRevenue: number
  totalProfit: number
  avgMargin: number
  totalCosts: number
  lowStockCount: number
  chartData: Array<{ name: string; revenue: number; count: number }>
  salesByMarketplace: Array<{
    name: string
    code: string
    status: string
    revenue: number
    count: number
  }>
  connections: Array<{
    status: string
    updated_at: string
    marketplace_id: string
  }>
  recentSalesFeed: Array<{
    id: string
    products?: { name?: string }
    channel?: string
    sale_date: string
    sale_price: number
    sale_items?: Array<{ profit?: number }>
    marketplaces?: { name?: string }
    order_id?: string
    total_revenue?: number
  }>
  recentNotifications: Array<{
    id: string
    type: string
    title: string
    message: string
    created_at: string
  }>
  permissions: {
    canViewRevenue: boolean
    canViewProfit: boolean
    canViewMargin: boolean
    canViewCost: boolean
  }
}

export default function DashboardClient({ metrics }: { metrics: DashboardMetrics }) {
  const data = metrics.chartData
  const p = metrics.permissions

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Performance Overview (Bar Chart) */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {p.canViewRevenue ? 'Performance de Faturamento' : 'Performance de Vendas'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eeeeee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#999' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#999' }} tickFormatter={(val) => p.canViewRevenue ? `${val/1000}k` : `${val}`} />
                <Tooltip
                  cursor={{ fill: '#f5f5f5' }}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e6e6e6', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey={p.canViewRevenue ? 'revenue' : 'count'} fill="#dbeafe" radius={[4, 4, 0, 0]} barSize={40} activeBar={{ fill: '#3483fa' }} name={p.canViewRevenue ? 'Faturamento' : 'Vendas'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Sales Overview / Margin Gauge */}
      <Card className="flex flex-col justify-between">
        <CardHeader className="flex flex-row items-center justify-between pb-0">
          <CardTitle>Resumo</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {p.canViewMargin ? (
            <div className="relative flex justify-center items-center h-40">
              <div className="w-64 h-32 overflow-hidden relative">
                <div className="w-64 h-64 border-[30px] border-[#f5f5f5] rounded-full absolute top-0 left-0"></div>
                <div
                  className="w-64 h-64 border-[30px] border-[#3483fa] rounded-full absolute top-0 left-0 border-b-transparent border-r-transparent"
                  style={{ transform: 'rotate(25deg)' }}
                ></div>
              </div>
              <div className="absolute bottom-2 flex flex-col items-center">
                <span className="text-4xl font-bold text-[#333]">{metrics.avgMargin.toFixed(1)}%</span>
                <span className="text-sm text-[#999] font-medium">Margem Média</span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center items-center h-40">
              <div className="text-center">
                <span className="text-4xl font-bold text-[#333]">{metrics.totalSalesCount}</span>
                <p className="text-sm text-[#999] font-medium mt-2">Vendas Realizadas</p>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-[#eeeeee]">
            <div>
              <p className="text-xs text-[#999] font-medium mb-1">Total de Vendas</p>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-[#333]">{metrics.totalSalesCount}</span>
              </div>
            </div>
            {p.canViewRevenue && (
              <div>
                <p className="text-xs text-[#999] font-medium mb-1">Faturamento Total</p>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-[#333]">R$ {(metrics.totalRevenue/1000).toFixed(1)}k</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* VENDAS POR MARKETPLACE + STATUS */}
      <Card>
        <CardHeader>
          <CardTitle>Vendas por Canal</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.salesByMarketplace.length === 0 ? (
              <p className="text-sm text-[#999] text-center py-4">Nenhuma venda registrada ainda.</p>
            ) : (
              metrics.salesByMarketplace.map((mp) => {
                const conn = metrics.connections.find(c => c.marketplace_id === mp.code.toLowerCase())
                const isConnected = conn?.status === 'CONNECTED'
                return (
                  <div key={mp.code} className="flex items-center justify-between p-4 bg-[#fafafa] rounded-xl border border-[#eeeeee]">
                    <div className="flex items-center gap-3">
                      <Store className="w-5 h-5 text-[#666]" strokeWidth={1.75} />
                      <div>
                        <h4 className="font-semibold text-[#333] text-sm">{mp.name}</h4>
                        <p className="text-xs text-[#999]">{mp.count} venda{mp.count !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {p.canViewRevenue ? (
                        <span className="font-bold text-[#333] text-sm">
                          R$ {mp.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      ) : (
                        <span className="font-bold text-[#333] text-sm">{mp.count}</span>
                      )}
                      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-[#00a650]' : 'bg-[#ccc]'}`}></span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
          <Link href="/settings/integrations" className="mt-4 flex items-center justify-center text-sm text-[#3483fa] hover:text-[#2968c8] gap-1 font-medium">
            Gerenciar Integrações <ArrowRight className="w-4 h-4" />
          </Link>
        </CardContent>
      </Card>

      {/* VENDAS EM TEMPO REAL E NOTIFICAÇÕES */}
      <div className="lg:col-span-3 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimas atividades</CardTitle>
            <Link href="/sales" className="text-sm text-[#3483fa] hover:text-[#2968c8] flex items-center gap-1 font-medium">
              Conferir todas →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {metrics.recentSalesFeed?.length === 0 ? (
                <p className="text-sm text-[#999] text-center py-4">Nenhuma venda recente.</p>
              ) : (
                metrics.recentSalesFeed?.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between py-5 border-b border-[#eeeeee] last:border-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="mp-icon-circle">
                        <ShoppingCart className="w-5 h-5 text-[#666]" strokeWidth={1.75} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[#333] text-sm truncate">{sale.products?.name || 'Produto'}</p>
                        <p className="text-xs text-[#999]">{sale.channel} • {format(new Date(sale.sale_date), "HH:mm")}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="font-bold text-[#333]">R$ {Number(sale.sale_price).toFixed(2)}</p>
                      <p className="text-xs font-semibold text-[#00a650]">+R$ {sale.sale_items?.[0]?.profit || '0.00'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Notificações</CardTitle>
            <Link href="/notifications" className="text-sm text-[#3483fa] hover:text-[#2968c8] flex items-center gap-1 font-medium">
              Conferir todas →
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-0">
              {metrics.recentNotifications?.length === 0 ? (
                <p className="text-sm text-[#999] text-center py-4">Nenhuma notificação.</p>
              ) : (
                metrics.recentNotifications?.map((notif) => (
                  <div key={notif.id} className="flex gap-3 py-4 border-b border-[#eeeeee] last:border-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${notif.type === 'NEW_SALE' ? 'bg-[#e6f9ef] text-[#00a650]' : notif.type === 'WARNING' ? 'bg-[#EEFFB3] text-[#e67e22]' : 'bg-[#ecf3fe] text-[#3483fa]'}`}>
                      {notif.type === 'NEW_SALE' ? <CheckCircle2 className="w-4 h-4" strokeWidth={2} /> : notif.type === 'WARNING' ? <AlertCircle className="w-4 h-4" strokeWidth={2} /> : <Bell className="w-4 h-4" strokeWidth={2} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#333]">{notif.title}</p>
                      <p className="text-xs text-[#999] line-clamp-1">{notif.message}</p>
                      <p className="text-[11px] text-[#999] mt-1">{format(new Date(notif.created_at), "dd/MM 'às' HH:mm")}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
