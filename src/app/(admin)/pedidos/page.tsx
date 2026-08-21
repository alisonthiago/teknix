'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClipboardList, Pickaxe, Send, CheckCircle2, Download, Trash2, Printer } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader, StatCard, SearchInput, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { createClient } from '@/utils/supabase/client'
import { exportToExcel, importFromExcel } from '@/utils/excel'


type StatusConfig = { l: string; c: string }
const SC: Record<string, StatusConfig> = {
  NOVO: { l: 'Novo', c: 'bg-[#f0f7ff] text-[#3483fa]' },
  PAGO: { l: 'Pago', c: 'bg-[#f0f7ff] text-[#3483fa]' },
  AGUARDANDO_SEPARACAO: { l: 'Aguardando', c: 'bg-[#fffaf0] text-[#e67e22]' },
  EM_SEPARACAO: { l: 'Separação', c: 'bg-[#fffaf0] text-[#e67e22]' },
  SEPARADO: { l: 'Separado', c: 'bg-[#f0f0ff] text-[#6c5ce7]' },
  AGUARDANDO_EXPEDICAO: { l: 'Expedição', c: 'bg-[#f0f0ff] text-[#6c5ce7]' },
  EMBALADO: { l: 'Embalado', c: 'bg-[#f0f7ff] text-[#3483fa]' },
  ENVIADO: { l: 'Enviado', c: 'bg-[#f0f7ff] text-[#3483fa]' },
  ENTREGUE: { l: 'Entregue', c: 'bg-[#f0fff4] text-[#38a169]' },
  CANCELADO: { l: 'Cancelado', c: 'bg-[#fff5f5] text-[#e74c3c]' },
  DEVOLVIDO: { l: 'Devolvido', c: 'bg-[#fff5f5] text-[#e74c3c]' },
}

function getStatus(status: string): StatusConfig {
  return SC[status] || { l: status, c: 'bg-[#f5f5f5] text-[#666]' }
}

function OrdersTab() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const { data: orders, loading, refetch } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('orders').select('*, marketplaces(name, code, logo), order_items(*)').order('created_at', { ascending: false })
    if (error) {
      const { data: fbData } = await s.from('orders').select('*, marketplaces(name, code, logo)').order('created_at', { ascending: false })
      return fbData || []
    }
    return data || []
  })

  const filtered = (orders || []).filter((o: Record<string, unknown>) =>
    !search || String(o.order_number).toLowerCase().includes(search.toLowerCase()) || String(o.customer_name).toLowerCase().includes(search.toLowerCase())
  )

  const toggleSelectAll = () => {
    if (selectedItems.length === filtered.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filtered.map((o: any) => o.id as string))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter(i => i !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  const handleDeleteSelected = async () => {
    if (!confirm(`Tem certeza que deseja excluir ${selectedItems.length} pedido(s)?`)) return
    const supabase = createClient()
    await supabase.from('orders').delete().in('id', selectedItems)
    setSelectedItems([])
    refetch()
  }

  const handleExportSelected = () => {
    if (selectedItems.length === 0) return
    const dataToExport = orders?.filter((o: any) => selectedItems.includes(o.id)) || []
    exportToExcel(dataToExport, 'pedidos_selecionados')
    setSelectedItems([])
  }

  const handleExportAll = () => {
    exportToExcel(orders || [], 'todos_os_pedidos')
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Total" value={String(orders?.length || 0)} />
        <StatCard label="Aguardando" value={String(orders?.filter((o: Record<string, unknown>) => ['AGUARDANDO_SEPARACAO', 'PAGO'].includes(o.status as string)).length || 0)} />
        <StatCard label="Enviados" value={String(orders?.filter((o: Record<string, unknown>) => ['ENVIADO', 'ENTREGUE'].includes(o.status as string)).length || 0)} />
        <StatCard label="Cancelados" value={String(orders?.filter((o: Record<string, unknown>) => o.status === 'CANCELADO').length || 0)} />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <SearchInput placeholder="Buscar pedido..." value={search} onChange={setSearch} />
        {selectedItems.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2 bg-[#f0f7ff] px-3 py-1.5 rounded-xl border border-[#3483fa]/20 shadow-xs">
            <span className="text-[12px] font-bold text-[#3483fa] mr-1">{selectedItems.length} selecionado(s)</span>
            <button 
              onClick={() => window.open(`/api/shipments/mercadolivre/label?orderIds=${selectedItems.join(',')}`, '_blank')}
              className="flex items-center gap-1.5 text-[12px] font-bold text-white bg-[#3483fa] px-3 py-1.5 rounded-lg hover:bg-[#2968c8] transition-colors shadow-xs cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Imprimir Etiquetas Selecionadas
            </button>
            <button onClick={handleExportSelected} className="flex items-center gap-1.5 text-[12px] font-medium text-[#3483fa] bg-white px-2.5 py-1.5 rounded-lg border border-[#3483fa]/20 hover:bg-[#3483fa] hover:text-white transition-colors cursor-pointer"><Download className="w-3.5 h-3.5" /> Exportar</button>
            <button onClick={handleDeleteSelected} className="flex items-center gap-1.5 text-[12px] font-medium text-[#e74c3c] bg-white px-2.5 py-1.5 rounded-lg border border-[#e74c3c]/20 hover:bg-[#e74c3c] hover:text-white transition-colors cursor-pointer"><Trash2 className="w-3.5 h-3.5" /> Excluir</button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={() => document.getElementById('import-orders')?.click()} className="flex items-center gap-1.5 text-[12px] font-medium text-[#666] bg-white px-2.5 py-1.5 rounded border border-[#ccc] hover:bg-[#f5f5f5] transition-colors"><Download className="w-3.5 h-3.5 rotate-180" /> Importar</button>
            <input 
              type="file" 
              id="import-orders" 
              className="hidden" 
              accept=".xlsx,.xls,.csv" 
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                try {
                  const data = await importFromExcel(file, {
                    order_number: ['pedido', 'número', 'order'],
                    customer_name: ['cliente', 'comprador', 'nome', 'customer'],
                    total_amount: ['total', 'valor', 'price', 'preço']
                  })
                  if (data.length > 0) {
                    const supabase = createClient()
                    await supabase.from('orders').insert(data)
                    refetch()
                    alert(`${data.length} pedidos importados com sucesso!`)
                  }
                } catch (err) {
                  alert('Erro ao importar arquivo.')
                }
                e.target.value = ''
              }} 
            />
            <button onClick={handleExportAll} className="flex items-center gap-1.5 text-[12px] font-medium text-[#666] bg-white px-2.5 py-1.5 rounded border border-[#ccc] hover:bg-[#f5f5f5] transition-colors"><Download className="w-3.5 h-3.5" /> Exportar</button>
          </div>
        )}
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando...</div>
      ) : (
        <ModuleTable>
          <TableHead>
            <Th className="w-10">
              <input 
                type="checkbox" 
                checked={filtered.length > 0 && selectedItems.length === filtered.length}
                onChange={toggleSelectAll}
                className="rounded border-[#ccc] text-[#3483fa] focus:ring-[#3483fa]"
              />
            </Th>
            <Th>Pedido</Th><Th>Marketplace</Th><Th>Conta</Th><Th>Cliente</Th><Th className="text-right">Total</Th><Th className="text-center">Status</Th><Th className="text-right w-12">Ações</Th>
          </TableHead>
          <tbody className="divide-y divide-[#eeeeee]">
            {filtered.map((o: Record<string, unknown>) => {
              const mp = o.marketplaces as Record<string, unknown> | null
              const acc = o.marketplace_accounts as Record<string, unknown> | null
              return (
                <tr key={o.id as string} onClick={() => router.push(`/pedidos/${o.id}`)} className="hover:bg-[#fafafa] transition-colors cursor-pointer">
                  <Td>
                    <div onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedItems.includes(o.id as string)}
                        onChange={() => toggleSelect(o.id as string)}
                        className="rounded border-[#ccc] text-[#3483fa] focus:ring-[#3483fa]"
                      />
                    </div>
                  </Td>
                  <Td className="font-mono font-medium text-[#333]">{o.order_number as string}</Td>
                  <Td className="text-[#999]"><div className="flex items-center gap-1.5">{typeof mp?.logo === 'string' && <MarketplaceLogo name={mp.name as string} className="w-4 h-4" />}{(mp?.name as string) || '—'}</div></Td>
                  <Td className="text-[11px] text-[#999]">{(acc?.account_name as string) || '—'}</Td>
                  <Td className="font-medium text-[#333]">{(o.customer_name as string) || '—'}</Td>
                  <Td className="text-right font-medium text-[#333]">R$ {Number(o.total_amount || 0).toFixed(2)}</Td>
                  <Td className="text-center"><span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${getStatus(o.status as string).c}`}>{getStatus(o.status as string).l}</span></Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => router.push(`/pedidos/${o.id}/etiqueta`)}
                        className="px-2 py-1 bg-[#f0f7ff] text-[#3483fa] hover:bg-[#3483fa] hover:text-white rounded-md text-[10px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        title="Imprimir Etiqueta de Envio (100x150mm)"
                      >
                        <Printer className="w-3 h-3" />
                        Etiqueta
                      </button>
                      <button 
                        onClick={() => router.push(`/pedidos/${o.id}/nota`)} 
                        className="p-1 text-[#999] hover:text-[#333] hover:bg-[#f5f5f5] rounded-md transition-colors cursor-pointer" 
                        title="Imprimir Comprovante / DANFE"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </ModuleTable>
      )}
    </div>
  )
}

function PickingTab() {
  const router = useRouter()
  const { data: orders, loading, refetch } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('orders').select('*, marketplaces(name, logo), marketplace_accounts(account_name), order_items(*)').order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  })

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient()
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    refetch()
  }

  const pending = (orders || []).filter((o: Record<string, unknown>) => 
    ['AGUARDANDO_SEPARACAO', 'EM_SEPARACAO', 'PAGO', 'PAID', 'NOVO', 'approved'].includes(o.status as string)
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Aguardando Separação" value={String(pending.filter(o => ['AGUARDANDO_SEPARACAO', 'PAGO', 'PAID', 'NOVO', 'approved'].includes(o.status as string)).length)} />
        <StatCard label="Em Separação" value={String(pending.filter(o => o.status === 'EM_SEPARACAO').length)} />
        <StatCard label="Separados" value={String((orders || []).filter((o: Record<string, unknown>) => o.status === 'SEPARADO').length)} />
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando...</div>
      ) : pending.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-12 text-center shadow-2xs">
          <CheckCircle2 className="w-10 h-10 text-[#16a34a] mx-auto mb-2" />
          <p className="text-[14px] font-black text-[#111]">Tudo separado!</p>
          <p className="text-[11px] text-[#777] mt-0.5">Nenhum pedido pendente de separação no momento</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {pending.map((o: Record<string, unknown>) => {
            const mp = o.marketplaces as Record<string, unknown> | null
            const acc = o.marketplace_accounts as Record<string, unknown> | null
            return (
              <div key={o.id as string} onClick={() => router.push(`/pedidos/${o.id}`)} className="bg-white rounded-2xl border border-[#e6e6e6] p-5 cursor-pointer hover:border-[#111] transition-all shadow-2xs group">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[13px] font-black text-[#111]">{o.order_number as string}</span>
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-black ${getStatus(o.status as string).c}`}>{getStatus(o.status as string).l}</span>
                </div>
                <p className="text-[12px] font-bold text-[#333] mb-1 flex items-center gap-1.5">{typeof mp?.logo === 'string' && <MarketplaceLogo name={mp.name as string} className="w-4 h-4" />}{(o.customer_name as string) || 'Comprador'}</p>
                {typeof acc?.account_name === 'string' && acc.account_name && <p className="text-[11px] text-[#777] mb-1 font-medium">{acc.account_name}</p>}
                <p className="text-[13px] font-black text-[#111] mb-3">R$ {Number(o.total_amount || 0).toFixed(2)}</p>
                {['AGUARDANDO_SEPARACAO', 'PAGO', 'PAID', 'NOVO', 'approved'].includes(o.status as string) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateOrderStatus(o.id as string, 'EM_SEPARACAO') }} 
                    className="w-full bg-[#f59e0b] hover:bg-[#d97706] text-white py-2 rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    Iniciar Separação
                  </button>
                )}
                {o.status === 'EM_SEPARACAO' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateOrderStatus(o.id as string, 'SEPARADO') }} 
                    className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white py-2 rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    Marcar como Separado
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function ShippingTab() {
  const router = useRouter()
  const { data: orders, loading, refetch } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('orders').select('*, marketplaces(name, logo), marketplace_accounts(account_name)').order('created_at', { ascending: false })
    if (error) throw error
    return data || []
  })

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const supabase = createClient()
    await supabase.from('orders').update({ status: newStatus }).eq('id', orderId)
    refetch()
  }

  const ready = (orders || []).filter((o: Record<string, unknown>) => 
    ['SEPARADO', 'EMBALADO', 'ENVIADO', 'AGUARDANDO_EXPEDICAO'].includes(o.status as string)
  )

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Prontos para Envio" value={String(ready.filter(o => ['SEPARADO', 'EMBALADO', 'AGUARDANDO_EXPEDICAO'].includes(o.status as string)).length)} />
        <StatCard label="Enviados / Despachados" value={String(ready.filter(o => o.status === 'ENVIADO').length)} />
        <StatCard label="Entregues ao Cliente" value={String((orders || []).filter((o: Record<string, unknown>) => o.status === 'ENTREGUE').length)} />
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando...</div>
      ) : ready.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-12 text-center shadow-2xs">
          <Send className="w-10 h-10 text-[#bbb] mx-auto mb-2" />
          <p className="text-[14px] font-black text-[#111]">Nenhum pedido na expedição</p>
          <p className="text-[11px] text-[#777] mt-0.5">Os pedidos separados aparecerão aqui para conferência e despacho</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ready.map((o: Record<string, unknown>) => {
            const mp = o.marketplaces as Record<string, unknown> | null
            const acc = o.marketplace_accounts as Record<string, unknown> | null
            return (
              <div key={o.id as string} onClick={() => router.push(`/pedidos/${o.id}`)} className="bg-white rounded-2xl border border-[#e6e6e6] p-5 cursor-pointer hover:border-[#111] transition-all shadow-2xs group">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[13px] font-black text-[#111]">{o.order_number as string}</span>
                  <span className="text-[11px] font-bold text-[#555] flex items-center gap-1.5">{typeof mp?.logo === 'string' && <MarketplaceLogo name={mp.name as string} className="w-4 h-4" />}{(mp?.name as string) || '—'}</span>
                </div>
                <p className="text-[12px] font-semibold text-[#333] mb-1">{(o.customer_name as string) || 'Comprador'}</p>
                {typeof acc?.account_name === 'string' && acc.account_name && <p className="text-[11px] text-[#777] mb-1">{acc.account_name}</p>}
                <p className="text-[13px] font-black text-[#111] mb-3">R$ {Number(o.total_amount || 0).toFixed(2)}</p>
                {['SEPARADO', 'AGUARDANDO_EXPEDICAO'].includes(o.status as string) && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateOrderStatus(o.id as string, 'EMBALADO') }} 
                    className="w-full bg-[#0284c7] hover:bg-[#0369a1] text-white py-2 rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    Embalar & Colar Etiqueta
                  </button>
                )}
                {o.status === 'EMBALADO' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateOrderStatus(o.id as string, 'ENVIADO') }} 
                    className="w-full bg-[#111] hover:bg-[#222] text-white py-2 rounded-xl text-[11px] font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    Despachar Pedido
                  </button>
                )}
                {o.status === 'ENVIADO' && (
                  <span className="block text-center text-[11px] text-[#16a34a] font-extrabold py-2 bg-[#ecfdf5] rounded-xl border border-[#bbf7d0]">
                    ✓ Despachado
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function PedidosPage() {
  return (
    <div className="mp-stack">
      <PageHeader title="Pedidos" description="Gerencie pedidos, separação e expedição" />
      <Tabs defaultValue="pedidos">
        <TabsList>
          <TabsTrigger value="pedidos"><ClipboardList className="w-3.5 h-3.5 mr-1 inline" /> Pedidos</TabsTrigger>
          <TabsTrigger value="separacao"><Pickaxe className="w-3.5 h-3.5 mr-1 inline" /> Separação</TabsTrigger>
          <TabsTrigger value="expedicao"><Send className="w-3.5 h-3.5 mr-1 inline" /> Expedição</TabsTrigger>
        </TabsList>
        <TabsContent value="pedidos"><OrdersTab /></TabsContent>
        <TabsContent value="separacao"><PickingTab /></TabsContent>
        <TabsContent value="expedicao"><ShippingTab /></TabsContent>
      </Tabs>
    </div>
  )
}
