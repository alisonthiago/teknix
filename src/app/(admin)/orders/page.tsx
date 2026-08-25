import { createClient } from '@/utils/supabase/server'
import { getUserPermissions } from '@/lib/permissions'
import { requirePermission } from '@/lib/permissions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  NOVO: 'bg-[#f5f5f5] text-[#111827]',
  PAGO: 'bg-[#e6f9ef] text-[#00a650]',
  AGUARDANDO_SEPARACAO: 'bg-lime-100 text-lime-700',
  EM_SEPARACAO: 'bg-orange-100 text-orange-700',
  SEPARADO: 'bg-purple-100 text-purple-700',
  AGUARDANDO_EXPEDICAO: 'bg-[#f5f5f5] text-[#1f2328]',
  EMBALADO: 'bg-cyan-100 text-cyan-700',
  ENVIADO: 'bg-[#f5f5f5] text-[#111827]',
  ENTREGUE: 'bg-green-100 text-green-700',
  CANCELADO: 'bg-red-100 text-red-700',
  DEVOLVIDO: 'bg-amber-100 text-amber-700',
  PROBLEMA: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  NOVO: 'Novo',
  PAGO: 'Pago',
  AGUARDANDO_SEPARACAO: 'Aguardando Separação',
  EM_SEPARACAO: 'Em Separação',
  SEPARADO: 'Separado',
  AGUARDANDO_EXPEDICAO: 'Aguardando Expedição',
  EMBALADO: 'Embalado',
  ENVIADO: 'Enviado',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
  DEVOLVIDO: 'Devolvido',
  PROBLEMA: 'Problema',
}

export default async function OrdersPage() {
  await requirePermission('orders.view')
  const supabase = await createClient()
  const userPerms = await getUserPermissions()

  const canViewFinancial = userPerms?.permissions.has('orders.financial_view') ?? false

  const { data: orders } = await supabase
    .from('orders')
    .select('*, marketplaces(name, code)')
    .order('created_at', { ascending: false })

  const stats = {
    total: orders?.length || 0,
    aguardandoSeparacao: orders?.filter(o => o.status === 'AGUARDANDO_SEPARACAO').length || 0,
    emSeparacao: orders?.filter(o => o.status === 'EM_SEPARACAO').length || 0,
    aguardandoExpedicao: orders?.filter(o => o.status === 'SEPARADO').length || 0,
    enviados: orders?.filter(o => o.status === 'ENVIADO').length || 0,
  }

  return (
    <div className="mp-stack">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-sm text-[#999]">Gerencie todos os pedidos da operação.</p>
        <Link href="/orders/new" className="mp-btn-primary">
          <Plus className="w-4 h-4" /> Novo Pedido
        </Link>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card className="rounded-xl border-[#e6e6e6]">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#333]">{stats.total}</p>
            <p className="text-xs text-[#999]">Total</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-lime-100 bg-lime-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-lime-700">{stats.aguardandoSeparacao}</p>
            <p className="text-xs text-lime-600">Aguardando Separação</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-orange-100 bg-orange-50/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-700">{stats.emSeparacao}</p>
            <p className="text-xs text-orange-600">Em Separação</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-[#dbeafe] bg-[#f5f5f5]/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#1f2328]">{stats.aguardandoExpedicao}</p>
            <p className="text-xs text-[#1f2328]">Para Expedição</p>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-[#dbeafe] bg-[#f5f5f5]/50">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-[#111827]">{stats.enviados}</p>
            <p className="text-xs text-[#1f2328]">Enviados</p>
          </CardContent>
        </Card>
      </div>

      <Card className="">
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Marketplace</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                {canViewFinancial && <TableHead className="text-right">Valor</TableHead>}
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!orders?.length && (
                <TableRow>
                  <TableCell colSpan={canViewFinancial ? 6 : 5} className="text-center py-8 text-[#999]">
                    Nenhum pedido encontrado.
                  </TableCell>
                </TableRow>
              )}
              {orders?.map(order => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/orders/${order.id}`} className="font-medium text-[#1f2328] hover:underline">
                      #{order.order_number}
                    </Link>
                  </TableCell>
                  <TableCell>{order.marketplaces?.name || '-'}</TableCell>
                  <TableCell>{order.customer_name || '-'}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_COLORS[order.status] || 'bg-[#f5f5f5] text-[#666]'}>
                      {STATUS_LABELS[order.status] || order.status}
                    </Badge>
                  </TableCell>
                  {canViewFinancial && (
                    <TableCell className="text-right">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.total_amount || 0)}
                    </TableCell>
                  )}
                  <TableCell>{new Date(order.created_at).toLocaleDateString('pt-BR')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
