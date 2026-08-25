import { createClient } from '@/utils/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import { requirePermission } from '@/lib/permissions'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import OrderStatusActions from './OrderStatusActions'

const STATUS_LABELS: Record<string, string> = {
  NOVO: 'Novo', PAGO: 'Pago', AGUARDANDO_SEPARACAO: 'Aguardando Separação',
  EM_SEPARACAO: 'Em Separação', SEPARADO: 'Separado', AGUARDANDO_EXPEDICAO: 'Aguardando Expedição',
  EMBALADO: 'Embalado', ENVIADO: 'Enviado', ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado', DEVOLVIDO: 'Devolvido', PROBLEMA: 'Problema',
}

const STATUS_COLORS: Record<string, string> = {
  NOVO: 'bg-[#f5f5f5] text-[#111827]', PAGO: 'bg-[#e6f9ef] text-[#00a650]',
  AGUARDANDO_SEPARACAO: 'bg-lime-100 text-lime-700', EM_SEPARACAO: 'bg-orange-100 text-orange-700',
  SEPARADO: 'bg-purple-100 text-purple-700', ENVIADO: 'bg-[#f5f5f5] text-[#111827]',
  ENTREGUE: 'bg-green-100 text-green-700', CANCELADO: 'bg-red-100 text-red-700',
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('orders.view')
  const { id } = await params
  const supabase = await createClient()
  const userPerms = await getUserPermissions()

  const { data: order } = await supabase
    .from('orders')
    .select('*, marketplaces(name, code)')
    .eq('id', id)
    .single()

  if (!order) notFound()

  const { data: items } = await supabase
    .from('order_items')
    .select('*, products(name, sku)')
    .eq('order_id', id)

  const { data: history } = await supabase
    .from('order_status_history')
    .select('*, profiles(name)')
    .eq('order_id', id)
    .order('created_at', { ascending: false })

  const canViewFinancial = userPerms?.permissions.has('orders.financial_view') ?? false

  return (
    <div className="mp-stack">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#333]">Pedido #{order.order_number}</h2>
          <p className="text-sm text-[#999] mt-1">{order.marketplaces?.name || 'Sem marketplace'}</p>
        </div>
        <Badge variant="outline" className={STATUS_COLORS[order.status] || 'bg-[#f5f5f5] text-[#666]'}>
          {STATUS_LABELS[order.status] || order.status}
        </Badge>
      </div>

      <OrderStatusActions orderId={order.id} currentStatus={order.status} />

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-[#e6e6e6]">
          <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#999]">Cliente</span><span>{order.customer_name || '-'}</span></div>
            <div className="flex justify-between"><span className="text-[#999]">Criado em</span><span>{new Date(order.created_at).toLocaleString('pt-BR')}</span></div>
            {order.notes && <div className="pt-2 border-t border-[#e6e6e6]"><span className="text-[#999]">Obs:</span> <span>{order.notes}</span></div>}
          </CardContent>
        </Card>

        {canViewFinancial && (
          <Card className="rounded-2xl border-[#e6e6e6]">
            <CardHeader><CardTitle>Financeiro</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#999]">Valor Total</span><span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount || 0)}</span></div>
              <div className="flex justify-between"><span className="text-[#999]">Custo</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_cost || 0)}</span></div>
              <div className="flex justify-between"><span className="text-[#999]">Taxas</span><span>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_fees || 0)}</span></div>
              <div className="flex justify-between"><span className="text-[#999]">Lucro</span><span className={Number(order.profit) >= 0 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.profit || 0)}</span></div>
              <div className="flex justify-between"><span className="text-[#999]">Margem</span><span>{Number(order.margin || 0).toFixed(1)}%</span></div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="rounded-2xl border-[#e6e6e6]">
        <CardHeader><CardTitle>Itens</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead className="text-center">Qtd</TableHead>
                {canViewFinancial && <TableHead className="text-right">Preço</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items?.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm">{item.products?.name || '-'}</TableCell>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell className="text-center text-sm">{item.quantity}</TableCell>
                  {canViewFinancial && (
                    <TableCell className="text-right text-sm">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.unit_price || 0)}
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {history && history.length > 0 && (
        <Card className="rounded-2xl border-[#e6e6e6]">
          <CardHeader><CardTitle>Histórico</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-[#1f2328] shrink-0" />
                  <span className="text-[#999]">{new Date(h.created_at).toLocaleString('pt-BR')}</span>
                  <span className="font-medium">{h.profiles?.name || 'Sistema'}</span>
                  <span>{h.from_status ? `${STATUS_LABELS[h.from_status] || h.from_status} → ` : ''}{STATUS_LABELS[h.to_status] || h.to_status}</span>
                  {h.notes && <span className="text-[#999]">({h.notes})</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
