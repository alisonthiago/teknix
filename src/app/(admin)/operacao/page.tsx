'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Download, Upload, Package, Truck, ShoppingCart, Warehouse, Eye, Edit, Trash2, ClipboardCheck, CheckCircle2, AlertTriangle, Building2 } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader, PrimaryButton, SecondaryButton, StatCard, SearchInput, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { createClient } from '@/utils/supabase/client'
import dynamic from 'next/dynamic'

const ProductCreateModal = dynamic(() => import('@/components/ProductCreateModal'), { ssr: false })
const SupplierCreateModal = dynamic(() => import('@/components/SupplierCreateModal'), { ssr: false })
const PurchaseCreateModal = dynamic(() => import('@/components/PurchaseCreateModal'), { ssr: false })

function ProductsTab() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const { data: products, loading, refetch } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('products').select('*, suppliers(name), product_images(url)').order('created_at', { ascending: false }).limit(100)
    if (error) throw error
    return data || []
  })

  const filtered = (products || []).filter((p: Record<string, unknown>) =>
    !search || 
    String(p.name).toLowerCase().includes(search.toLowerCase()) || 
    String(p.sku).toLowerCase().includes(search.toLowerCase()) ||
    String(p.brand || '').toLowerCase().includes(search.toLowerCase())
  )

  function calcCost(p: Record<string, unknown>) {
    return (Number(p.cost_purchase) || 0) + (Number(p.freight_purchase) || 0) + (Number(p.packaging_cost) || 0) + (Number(p.other_costs) || 0)
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Produtos" value={String(products?.length || 0)} />
        <StatCard label="Estoque Total" value={String(products?.reduce((a: number, b: Record<string, unknown>) => a + (Number(b.stock) || 0), 0) || 0)} />
        <StatCard label="Estoque Baixo" value={String(products?.filter((p: Record<string, unknown>) => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= (Number(p.min_stock) || 0)).length || 0)} />
        <StatCard label="Sem Estoque" value={String(products?.filter((p: Record<string, unknown>) => Number(p.stock) === 0).length || 0)} />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-4">
        <SearchInput placeholder="Buscar produto..." value={search} onChange={setSearch} />
        <div className="flex flex-wrap items-center gap-2">
          <SecondaryButton><Upload className="w-3.5 h-3.5" /> Importar</SecondaryButton>
          <SecondaryButton><Download className="w-3.5 h-3.5" /> Exportar</SecondaryButton>
          <PrimaryButton onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5" /> Novo produto</PrimaryButton>
        </div>
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando...</div>
      ) : (
        <ModuleTable>
          <TableHead>
            <Th>SKU</Th><Th>Produto</Th><Th>Fornecedor</Th><Th className="text-right">Custo</Th><Th className="text-right">Estoque</Th><Th className="text-center">Status</Th><Th className="text-right">Ações</Th>
          </TableHead>
          <tbody className="divide-y divide-[#eeeeee]">
            {filtered.map((p: Record<string, unknown>) => {
              const cost = calcCost(p)
              const stock = Number(p.stock) || 0
              const minStock = Number(p.min_stock) || 0
              const supplierName = (p.suppliers as Record<string, unknown>)?.name as string || '—'
              return (
                <tr key={p.id as string} onClick={() => router.push(`/produtos/${p.id}`)} className="hover:bg-[#fafafa] transition-colors cursor-pointer">
                  <Td className="font-mono text-[#999]">{p.sku as string}</Td>
                  <Td>
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-[#f5f5f5] border-2 border-[#e6e6e6] overflow-hidden flex items-center justify-center flex-shrink-0">
                        {(p.product_images as any)?.[0]?.url ? (
                          <img src={(p.product_images as any)[0].url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-5 h-5 text-[#ccc]" />
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="font-semibold text-[#1f2328] text-[14px] leading-tight mb-0.5">{p.name as string}</p>
                        <p className="text-[13px] text-[#656d76] leading-tight">{p.brand as string || 'Sem marca'}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-[#999]">{supplierName}</Td>
                  <Td className="text-right">R$ {cost.toFixed(2)}</Td>
                  <Td className="text-right"><span className={`font-medium ${stock === 0 ? 'text-[#e74c3c]' : stock <= minStock ? 'text-[#e67e22]' : 'text-[#333]'}`}>{stock}</span></Td>
                  <Td className="text-center"><span className={`inline-flex px-2 py-[2px] rounded text-[10px] font-medium ${p.status === 'ACTIVE' ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#fff5f5] text-[#e74c3c]'}`}>{p.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}</span></Td>
                  <Td className="text-right"><div className="flex items-center justify-end gap-0.5" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <button onClick={() => router.push(`/produtos/${p.id}`)} className="p-1.5 rounded hover:bg-[#f5f5f5] text-[#ccc] hover:text-[#666] transition-colors"><Eye className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); router.push(`/produtos/${p.id}/editar`); }} className="p-1.5 rounded hover:bg-[#f5f5f5] text-[#ccc] hover:text-[#666] transition-colors"><Edit className="w-3.5 h-3.5" /></button>
                    <button className="p-1.5 rounded hover:bg-[#fff5f5] text-[#ccc] hover:text-[#e74c3c] transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div></Td>
                </tr>
              )
            })}
          </tbody>
        </ModuleTable>
      )}
      {showCreate && <ProductCreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { refetch() }} />}
    </div>
  )
}

function SuppliersTab() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const { data: suppliers, loading, refetch } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('suppliers').select('*').order('created_at', { ascending: false }).limit(100)
    if (error) throw error
    return data || []
  })

  const filtered = (suppliers || []).filter((s: Record<string, unknown>) =>
    !search || String(s.name).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <StatCard label="Fornecedores" value={String(suppliers?.length || 0)} />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-4">
        <SearchInput placeholder="Buscar fornecedor..." value={search} onChange={setSearch} />
        <PrimaryButton onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5" /> Novo fornecedor</PrimaryButton>
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando...</div>
      ) : (
        <ModuleTable>
          <TableHead><Th>Fornecedor</Th><Th>Contato</Th><Th>Cidade</Th><Th className="text-right">Prazo</Th><Th className="text-right">Ações</Th></TableHead>
          <tbody className="divide-y divide-[#eeeeee]">
            {filtered.map((s: Record<string, unknown>) => (
              <tr key={s.id as string} onClick={() => router.push(`/fornecedores/${s.id}`)} className="hover:bg-[#fafafa] transition-colors cursor-pointer">
                <Td>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-[#f5f5f5] border-2 border-[#e6e6e6] overflow-hidden flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-5 h-5 text-[#ccc]" />
                    </div>
                    <div className="flex flex-col justify-center">
                      <p className="font-semibold text-[#1f2328] text-[14px] leading-tight mb-0.5">{s.name as string}</p>
                      <p className="text-[13px] text-[#656d76] leading-tight">{s.cnpj as string || s.email as string || 'Sem CNPJ'}</p>
                    </div>
                  </div>
                </Td>
                <Td>{s.contact as string || '—'}</Td>
                <Td className="text-[#999]">{[s.city, s.state].filter(Boolean).join('/') || '—'}</Td>
                <Td className="text-right text-[#999]">{s.delivery_time ? `${s.delivery_time} dias` : '—'}</Td>
                <Td className="text-right"><div onClick={(e: React.MouseEvent) => e.stopPropagation()}><button className="p-1.5 rounded hover:bg-[#f5f5f5] text-[#ccc] hover:text-[#666]"><Edit className="w-3.5 h-3.5" /></button></div></Td>
              </tr>
            ))}
          </tbody>
        </ModuleTable>
      )}
      {showCreate && <SupplierCreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { refetch() }} />}
    </div>
  )
}

function PurchasesTab() {
  const [showCreate, setShowCreate] = useState(false)
  const { data: purchases, loading, refetch } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('purchases').select('*, suppliers(name), profiles(name), purchase_items(*)').order('created_at', { ascending: false }).limit(100)
    if (error) throw error
    return data || []
  })

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <StatCard label="Total Compras" value={String(purchases?.length || 0)} />
        <StatCard label="Valor Total" value={`R$ ${(purchases || []).reduce((a: number, b: Record<string, unknown>) => a + (Number(b.total_cost) || 0), 0).toLocaleString('pt-BR')}`} />
      </div>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-4">
        <SearchInput placeholder="Buscar compra..." />
        <PrimaryButton onClick={() => setShowCreate(true)}><Plus className="w-3.5 h-3.5" /> Nova compra</PrimaryButton>
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando...</div>
      ) : (
        <ModuleTable>
          <TableHead><Th>Data</Th><Th>Fornecedor</Th><Th>Comprador</Th><Th className="text-right">Custo Total</Th><Th className="text-center">Status</Th></TableHead>
          <tbody className="divide-y divide-[#eeeeee]">
            {(purchases || []).map((p: Record<string, unknown>) => {
              const supplierName = (p.suppliers as Record<string, unknown>)?.name as string || '—'
              const buyerName = (p.profiles as Record<string, unknown>)?.name as string || '—'
              return (
                <tr key={p.id as string} className="hover:bg-[#fafafa] transition-colors">
                  <Td>{new Date(p.date as string).toLocaleDateString('pt-BR')}</Td>
                  <Td>
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-[#f5f5f5] border-2 border-[#e6e6e6] overflow-hidden flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="w-5 h-5 text-[#ccc]" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="font-semibold text-[#1f2328] text-[14px] leading-tight mb-0.5">{supplierName}</p>
                        <p className="text-[13px] text-[#656d76] leading-tight">Nota: {(p.invoice as string) || 'S/N'}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-[#666]">{buyerName}</Td>
                  <Td className="text-right font-medium text-[#333]">R$ {Number(p.total_cost).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</Td>
                  <Td className="text-center"><span className="inline-flex px-2 py-[2px] rounded text-[10px] font-medium bg-[#f0fff4] text-[#38a169]">Concluída</span></Td>
                </tr>
              )
            })}
          </tbody>
        </ModuleTable>
      )}
      {showCreate && <PurchaseCreateModal open={showCreate} onClose={() => setShowCreate(false)} onCreated={() => { refetch() }} />}
    </div>
  )
}

function StockTab() {
  const router = useRouter()
  const { data: products, loading } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('products').select('*, product_images(url)').order('name').limit(200)
    if (error) throw error
    return data || []
  })

  function calcCost(p: Record<string, unknown>) {
    return (Number(p.cost_purchase) || 0) + (Number(p.freight_purchase) || 0) + (Number(p.packaging_cost) || 0) + (Number(p.other_costs) || 0)
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StatCard label="Produtos" value={String(products?.length || 0)} />
        <StatCard label="Estoque Total" value={String(products?.reduce((a: number, b: Record<string, unknown>) => a + (Number(b.stock) || 0), 0) || 0)} />
        <StatCard label="Críticos" value={String(products?.filter((p: Record<string, unknown>) => (Number(p.stock) || 0) > 0 && (Number(p.stock) || 0) <= (Number(p.min_stock) || 0)).length || 0)} />
      </div>
      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando...</div>
      ) : (
        <ModuleTable>
          <TableHead><Th>SKU</Th><Th>Produto</Th><Th className="text-right">Estoque</Th><Th className="text-right">Mínimo</Th><Th className="text-right">Valor Unit.</Th><Th className="text-right">Valor Total</Th><Th className="text-center">Status</Th></TableHead>
          <tbody className="divide-y divide-[#eeeeee]">
            {(products || []).map((p: Record<string, unknown>) => {
              const stock = Number(p.stock) || 0
              const minStock = Number(p.min_stock) || 0
              const cost = calcCost(p)
              return (
                <tr key={p.id as string} onClick={() => router.push(`/produtos/${p.id}`)} className="hover:bg-[#fafafa] transition-colors cursor-pointer">
                  <Td className="font-mono text-[#999]">{p.sku as string}</Td>
                  <Td>
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-full bg-[#f5f5f5] border-2 border-[#e6e6e6] overflow-hidden flex items-center justify-center flex-shrink-0">
                        {(p.product_images as any)?.[0]?.url ? (
                          <img src={(p.product_images as any)[0].url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <Package className="w-5 h-5 text-[#ccc]" />
                        )}
                      </div>
                      <div className="flex flex-col justify-center">
                        <p className="font-semibold text-[#1f2328] text-[14px] leading-tight mb-0.5">{p.name as string}</p>
                        <p className="text-[13px] text-[#656d76] leading-tight">{p.brand as string || 'Sem marca'}</p>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-right"><span className={`font-medium ${stock === 0 ? 'text-[#e74c3c]' : stock <= minStock ? 'text-[#e67e22]' : 'text-[#333]'}`}>{stock}</span></Td>
                  <Td className="text-right text-[#999]">{minStock}</Td>
                  <Td className="text-right text-[#999]">R$ {cost.toFixed(2)}</Td>
                  <Td className="text-right font-medium text-[#333]">R$ {(cost * stock).toFixed(2)}</Td>
                  <Td className="text-center">
                    {stock === 0 && <span className="inline-flex px-2 py-[2px] rounded text-[10px] font-medium bg-[#fff5f5] text-[#e74c3c]">Esgotado</span>}
                    {stock > 0 && stock <= minStock && <span className="inline-flex px-2 py-[2px] rounded text-[10px] font-medium bg-[#fffaf0] text-[#e67e22]">Crítico</span>}
                    {stock > minStock && <span className="inline-flex px-2 py-[2px] rounded text-[10px] font-medium bg-[#f0fff4] text-[#38a169]">Normal</span>}
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

function StockCountTab() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [saved, setSaved] = useState(false)
  const { data: products, loading } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('products').select('id, sku, name, stock, min_stock, status').eq('status', 'ACTIVE').order('name')
    if (error) throw error
    return data || []
  })

  const productList = (products || []) as Record<string, unknown>[]
  const counted = Object.keys(counts).length
  const discrepancies = productList.filter(p => {
    const countedVal = counts[p.id as string]
    return countedVal !== undefined && countedVal !== Number(p.stock)
  })
  const systemTotal = productList.reduce((a, p) => a + (Number(p.stock) || 0), 0)
  const countedTotal = Object.values(counts).reduce((a, b) => a + b, 0)

  const updateCount = (productId: string, value: string) => {
    const num = parseInt(value, 10)
    setCounts(prev => {
      const next = { ...prev }
      if (value === '' || isNaN(num)) {
        delete next[productId]
      } else {
        next[productId] = num
      }
      return next
    })
    setSaved(false)
  }

  const handleSave = async () => {
    const supabase = createClient()
    for (const [productId, physicalCount] of Object.entries(counts)) {
      const product = productList.find(p => p.id === productId)
      if (!product) continue
      const systemStock = Number(product.stock) || 0
      const diff = physicalCount - systemStock
      if (diff === 0) continue

      await supabase.from('products').update({ stock: physicalCount }).eq('id', productId)
      await supabase.from('inventory_movements').insert({
        product_id: productId,
        type: 'ADJUSTMENT',
        quantity: diff,
        notes: `Conferência de estoque — sistema: ${systemStock}, físico: ${physicalCount}`,
      })
    }
    setSaved(true)
  }

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <StatCard label="Produtos" value={String(productList.length)} />
        <StatCard label="Conferidos" value={String(counted)} />
        <StatCard label="Diferenças" value={String(discrepancies.length)} />
        <StatCard label="Estoque Sistema" value={String(systemTotal)} />
        <StatCard label="Contagem Física" value={counted > 0 ? String(countedTotal) : '—'} />
      </div>

      {discrepancies.length > 0 && (
        <div className="bg-[#fffaf0] border border-[#f59e0b]/20 rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-[#f59e0b] shrink-0" />
          <span className="text-xs text-[#92400e]">
            <strong>{discrepancies.length} produto{discrepancies.length !== 1 ? 's' : ''}</strong> com diferença entre estoque do sistema e contagem física.
          </span>
        </div>
      )}

      {saved && (
        <div className="bg-[#f0fff4] border border-[#38a169]/20 rounded-lg p-3 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#38a169] shrink-0" />
          <span className="text-xs text-[#276749]">Conferência salva. Ajustes de estoque serão registrados como movimentação.</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando produtos...</div>
      ) : (
        <>
          <ModuleTable>
            <TableHead>
              <Th>SKU</Th><Th>Produto</Th><Th className="text-right">Estoque Sistema</Th><Th className="text-center">Contagem Física</Th><Th className="text-center">Diferença</Th><Th className="text-center">Status</Th>
            </TableHead>
            <tbody className="divide-y divide-[#eeeeee]">
              {productList.map(p => {
                const systemStock = Number(p.stock) || 0
                const countedVal = counts[p.id as string]
                const diff = countedVal !== undefined ? countedVal - systemStock : null
                return (
                  <tr key={p.id as string} className="hover:bg-[#fafafa] transition-colors">
                    <Td className="font-mono text-[#999]">{p.sku as string}</Td>
                    <Td className="font-medium text-[#333]">{p.name as string}</Td>
                    <Td className="text-right font-medium text-[#333]">{systemStock}</Td>
                    <Td className="text-center">
                      <input
                        type="number"
                        min="0"
                        value={counts[p.id as string] ?? ''}
                        onChange={e => updateCount(p.id as string, e.target.value)}
                        placeholder="—"
                        className="w-20 px-2 py-1 text-center border border-[#e6e6e6] rounded-md text-[13px] text-[#333] focus:outline-none focus:border-[#3483fa] transition-colors min-h-[44px] sm:min-h-[34px] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </Td>
                    <Td className="text-center">
                      {diff !== null ? (
                        <span className={`text-[13px] font-semibold ${diff === 0 ? 'text-[#38a169]' : 'text-[#e74c3c]'}`}>
                          {diff === 0 ? '✓' : diff > 0 ? `+${diff}` : diff}
                        </span>
                      ) : '—'}
                    </Td>
                    <Td className="text-center">
                      {diff !== null && (
                        diff === 0
                          ? <span className="inline-flex px-2 py-[2px] rounded text-[10px] font-medium bg-[#f0fff4] text-[#38a169]">Correto</span>
                          : <span className="inline-flex px-2 py-[2px] rounded text-[10px] font-medium bg-[#fff5f5] text-[#e74c3c]">Diferente</span>
                      )}
                    </Td>
                  </tr>
                )
              })}
            </tbody>
          </ModuleTable>

          {counted > 0 && (
            <div className="flex flex-col sm:flex-row justify-end mt-4 gap-2">
              <button
                onClick={handleSave}
                className="inline-flex items-center justify-center gap-2 bg-[#3483fa] text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-[#2968c8] transition-colors min-h-[44px]"
              >
                <CheckCircle2 className="w-4 h-4" /> Salvar Conferência
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function OperacaoPage() {
  return (
    <div className="mp-stack">
      <PageHeader title="Operação" description="Gerencie produtos, fornecedores, compras e estoque" />
      <Tabs defaultValue="produtos">
        <TabsList>
          <TabsTrigger value="produtos"><Package className="w-3.5 h-3.5 mr-1 inline" /> Produtos</TabsTrigger>
          <TabsTrigger value="fornecedores"><Truck className="w-3.5 h-3.5 mr-1 inline" /> Fornecedores</TabsTrigger>
          <TabsTrigger value="compras"><ShoppingCart className="w-3.5 h-3.5 mr-1 inline" /> Compras</TabsTrigger>
          <TabsTrigger value="estoque"><Warehouse className="w-3.5 h-3.5 mr-1 inline" /> Estoque</TabsTrigger>
          <TabsTrigger value="conferencia"><ClipboardCheck className="w-3.5 h-3.5 mr-1 inline" /> Conferência</TabsTrigger>
        </TabsList>
        <TabsContent value="produtos"><ProductsTab /></TabsContent>
        <TabsContent value="fornecedores"><SuppliersTab /></TabsContent>
        <TabsContent value="compras"><PurchasesTab /></TabsContent>
        <TabsContent value="estoque"><StockTab /></TabsContent>
        <TabsContent value="conferencia"><StockCountTab /></TabsContent>
      </Tabs>
    </div>
  )
}
