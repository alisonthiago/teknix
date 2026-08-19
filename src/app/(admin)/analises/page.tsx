'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { BarChart3, FileInput, Download, Upload, FileSpreadsheet, File, TrendingUp, DollarSign, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader, StatCard } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { createClient } from '@/utils/supabase/client'
import { importFromExcel, exportToExcel } from '@/utils/excel'
import { useNotification } from '@/contexts/NotificationContext'

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function RelatoriosTab() {
  const { data: sales } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('sales').select('*, marketplaces(name, logo), marketplace_accounts(account_name), sale_items(cogs, fees, taxes, other_costs)')
    if (error) throw error
    return data || []
  })

  const { data: orders } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('orders').select('id, status')
    if (error) throw error
    return data || []
  })

  const allSales = (sales || []) as Record<string, unknown>[]

  function getCost(s: Record<string, unknown>) {
    const items = s.sale_items as Record<string, unknown>[] | null
    return (items || []).reduce((a: number, i: Record<string, unknown>) => a + Number(i.cogs || 0), 0)
  }
  function getFees(s: Record<string, unknown>) {
    const items = s.sale_items as Record<string, unknown>[] | null
    return (items || []).reduce((a: number, i: Record<string, unknown>) => a + Number(i.fees || 0) + Number(i.taxes || 0) + Number(i.other_costs || 0), 0)
  }

  const totalRevenue = allSales.reduce((a, s) => a + Number(s.total_revenue || 0), 0)
  const totalProfit = allSales.reduce((a, s) => {
    const r = Number(s.total_revenue || 0)
    const c = getCost(s)
    const f = getFees(s)
    return a + r - c - f
  }, 0)
  const avgMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : '0'

  const mpBreakdown = new Map<string, { name: string; logo: string; revenue: number; orders: number }>()
  for (const s of allSales) {
    const mp = s.marketplaces as Record<string, unknown> | null
    const name = (mp?.name as string) || 'Desconhecido'
    const logo = (mp?.logo as string) || ''
    if (!mpBreakdown.has(name)) mpBreakdown.set(name, { name, logo, revenue: 0, orders: 0 })
    mpBreakdown.get(name)!.revenue += Number(s.total_revenue || 0)
    mpBreakdown.get(name)!.orders += 1
  }
  const mpRows = [...mpBreakdown.values()].sort((a, b) => b.revenue - a.revenue)
  const maxMpRev = mpRows[0]?.revenue || 1

  const reports = [
    { name: 'Vendas por Marketplace', description: 'Análise de performance por canal', icon: TrendingUp, color: 'bg-[#f0f7ff]', textColor: 'text-[#3483fa]' },
    { name: 'Margem por Produto', description: 'Margem de lucro detalhada', icon: DollarSign, color: 'bg-[#f0fff4]', textColor: 'text-[#38a169]' },
    { name: 'Relatório por Conta', description: 'Desempenho individual de cada conta', icon: BarChart3, color: 'bg-[#f0f0ff]', textColor: 'text-[#6c5ce7]', href: '/analises/relatorio-contas' },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <StatCard label="Receita Total" value={formatBRL(totalRevenue)} />
        <StatCard label="Total Pedidos" value={String((orders || []).length)} />
        <StatCard label="Margem Média" value={`${avgMargin}%`} />
      </div>

      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-4 mb-4">
        <h3 className="text-[12px] font-semibold text-[#333] mb-3">Performance por Marketplace</h3>
        <div className="space-y-2.5">
          {mpRows.map(m => (
            <div key={m.name} className="flex items-center gap-2.5">
              <MarketplaceLogo name={m.name} className="w-5 h-5 flex-shrink-0" />
              <span className="w-28 text-[11px] text-[#333]">{m.name}</span>
              <div className="flex-1 h-4 rounded bg-[#f5f5f5] relative overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-[#3483fa]/[0.2] rounded flex items-center pl-2" style={{ width: `${(m.revenue / maxMpRev) * 100}%` }}>
                  <span className="text-[9px] text-[#3483fa] font-medium">{formatBRL(m.revenue)}</span>
                </div>
              </div>
              <span className="w-16 text-[10px] text-[#999] text-right">{m.orders} pedidos</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {reports.map(r => (
          <div key={r.name} className="bg-white rounded-2xl border border-[#e6e6e6] p-3.5 flex items-center gap-3 hover:bg-[#fafafa] transition-colors">
            <div className={`w-7 h-7 rounded ${r.color} flex items-center justify-center shrink-0`}><r.icon className={`w-3.5 h-3.5 ${r.textColor}`} /></div>
            <div className="flex-1 min-w-0"><h4 className="text-[12px] font-semibold text-[#333]">{r.name}</h4><p className="text-[10px] text-[#999]">{r.description}</p></div>
            {r.href ? (
              <Link href={r.href} className="text-[11px] text-[#3483fa] font-medium hover:text-[#2968c8] shrink-0">Ver</Link>
            ) : (
              <button className="text-[11px] text-[#3483fa] font-medium hover:text-[#2968c8] shrink-0">Gerar</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ImportExportTab() {
  const { notify } = useNotification()
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importTarget, setImportTarget] = useState<'produtos' | 'fornecedores' | 'vendas' | 'estoque'>('produtos')

  const handleOpenImport = (target: 'produtos' | 'fornecedores' | 'vendas' | 'estoque') => {
    setImportTarget(target)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoadingAction(`import_${importTarget}`)
    const supabase = createClient()

    try {
      if (importTarget === 'produtos') {
        const rawRows = await importFromExcel(file, {
          name: ['nome', 'titulo', 'título', 'title', 'título do anúncio', 'titulo do anuncio', 'produto', 'descrição', 'descricao', 'nome do produto'],
          sku: ['sku', 'código', 'codigo', 'código do produto', 'codigo do produto', 'seller_sku', 'sku do vendedor', 'referência', 'referencia'],
          ean: ['ean', 'código universal', 'codigo universal', 'gtin', 'código de barras', 'codigo de barras', 'barcode'],
          cost_purchase: ['custo', 'custo de compra', 'custo unitário', 'valor de custo', 'preço de custo', 'preco de custo', 'cost', 'cost_purchase'],
          stock: ['estoque', 'quantidade', 'saldo', 'qtd', 'stock', 'quantidade disponível', 'quantidade em estoque'],
          min_stock: ['estoque mínimo', 'estoque minimo', 'min_stock', 'mínimo', 'minimo'],
          brand: ['marca', 'brand', 'fabricante'],
          model: ['modelo', 'model'],
          category: ['categoria', 'category', 'departamento'],
        })

        if (!rawRows.length) throw new Error('Nenhum dado encontrado na planilha.')

        let insertedCount = 0
        for (const r of rawRows) {
          if (!r.name && !r.sku) continue
          const cleanSku = String(r.sku || `SKU-${Date.now()}-${Math.floor(Math.random() * 1000)}`).trim()
          const cleanName = String(r.name || cleanSku).trim()
          const cleanCost = typeof r.cost_purchase === 'number' ? r.cost_purchase : parseFloat(String(r.cost_purchase || '0').replace(',', '.')) || 0
          const cleanStock = parseInt(String(r.stock || '0')) || 0
          const cleanMinStock = parseInt(String(r.min_stock || '0')) || 0

          const { error } = await supabase.from('products').upsert({
            sku: cleanSku,
            name: cleanName,
            ean: r.ean ? String(r.ean).trim() : null,
            brand: r.brand ? String(r.brand).trim() : null,
            model: r.model ? String(r.model).trim() : null,
            category: r.category ? String(r.category).trim() : null,
            cost_purchase: cleanCost,
            stock: cleanStock,
            min_stock: cleanMinStock,
            status: 'ACTIVE'
          }, { onConflict: 'sku' })

          if (!error) insertedCount++
        }

        notify({
          type: 'success',
          title: 'Produtos Importados!',
          message: `${insertedCount} produto(s) importados/atualizados com sucesso a partir da planilha.`
        })
      } else if (importTarget === 'fornecedores') {
        const rawRows = await importFromExcel(file, {
          name: ['nome', 'nome fantasia', 'fornecedor', 'razão social', 'razao social', 'empresa'],
          cnpj: ['cnpj', 'documento', 'cpf/cnpj'],
          phone: ['telefone', 'celular', 'whatsapp', 'fone', 'contato'],
          email: ['email', 'e-mail'],
          city: ['cidade', 'município', 'municipio'],
          state: ['estado', 'uf']
        })

        if (!rawRows.length) throw new Error('Nenhum fornecedor encontrado na planilha.')

        let insertedCount = 0
        for (const r of rawRows) {
          if (!r.name) continue
          const { error } = await supabase.from('suppliers').insert({
            name: String(r.name).trim(),
            cnpj: r.cnpj ? String(r.cnpj).trim() : null,
            phone: r.phone ? String(r.phone).trim() : null,
            email: r.email ? String(r.email).trim() : null,
            city: r.city ? String(r.city).trim() : null,
            state: r.state ? String(r.state).trim() : null
          })
          if (!error) insertedCount++
        }

        notify({
          type: 'success',
          title: 'Fornecedores Importados!',
          message: `${insertedCount} fornecedor(es) cadastrados com sucesso.`
        })
      } else if (importTarget === 'estoque') {
        const rawRows = await importFromExcel(file, {
          sku: ['sku', 'código', 'codigo', 'referência', 'referencia'],
          stock: ['estoque', 'quantidade', 'saldo', 'físico', 'fisico', 'stock']
        })

        if (!rawRows.length) throw new Error('Nenhum registro de estoque encontrado.')

        let updatedCount = 0
        for (const r of rawRows) {
          if (!r.sku) continue
          const cleanStock = parseInt(String(r.stock || '0')) || 0
          const { error } = await supabase.from('products').update({ stock: cleanStock }).eq('sku', String(r.sku).trim())
          if (!error) updatedCount++
        }

        notify({
          type: 'success',
          title: 'Estoque Atualizado!',
          message: `${updatedCount} produto(s) tiveram o saldo de estoque atualizado.`
        })
      } else if (importTarget === 'vendas') {
        const rawRows = await importFromExcel(file, {
          order_id: ['pedido', 'número do pedido', 'numero do pedido', 'order_id', 'id pedido', 'código da venda'],
          date: ['data', 'data da venda', 'date', 'criado em'],
          total_revenue: ['valor', 'valor total', 'receita', 'total', 'preço total', 'preco total'],
          status: ['status', 'situação', 'situacao']
        })

        if (!rawRows.length) throw new Error('Nenhuma venda encontrada na planilha.')

        let insertedCount = 0
        for (const r of rawRows) {
          const cleanRevenue = typeof r.total_revenue === 'number' ? r.total_revenue : parseFloat(String(r.total_revenue || '0').replace(',', '.')) || 0
          const { error } = await supabase.from('sales').insert({
            order_id: r.order_id ? String(r.order_id).trim() : `ORD-${Date.now()}`,
            date: r.date ? String(r.date).split('T')[0] : new Date().toISOString().split('T')[0],
            total_revenue: cleanRevenue,
            status: r.status ? String(r.status).trim() : 'COMPLETED'
          })
          if (!error) insertedCount++
        }

        notify({
          type: 'success',
          title: 'Vendas Importadas!',
          message: `${insertedCount} venda(s) registradas com sucesso.`
        })
      }
    } catch (err: unknown) {
      console.error(err)
      notify({
        type: 'error',
        title: 'Erro na Importação',
        message: err instanceof Error ? err.message : 'Não foi possível ler a planilha.'
      })
    } finally {
      setLoadingAction(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleExport = async (target: 'produtos' | 'vendas' | 'financeiro' | 'relatorios') => {
    setLoadingAction(`export_${target}`)
    const supabase = createClient()

    try {
      if (target === 'produtos') {
        const { data, error } = await supabase.from('products').select('sku, name, ean, brand, model, category, cost_purchase, stock, min_stock, status')
        if (error) throw error
        if (!data?.length) throw new Error('Nenhum produto cadastrado para exportar.')
        exportToExcel(data, 'teknix_produtos')
        notify({ type: 'success', title: 'Exportado!', message: `${data.length} produtos exportados para Excel.` })
      } else if (target === 'vendas') {
        const { data, error } = await supabase.from('sales').select('order_id, date, total_revenue, status, marketplaces(name)')
        if (error) throw error
        if (!data?.length) throw new Error('Nenhuma venda cadastrada para exportar.')
        const formatted = data.map(d => ({
          Pedido: d.order_id,
          Data: d.date,
          Receita: d.total_revenue,
          Marketplace: (d.marketplaces as any)?.name || 'Direto',
          Status: d.status
        }))
        exportToExcel(formatted, 'teknix_vendas')
        notify({ type: 'success', title: 'Exportado!', message: `${data.length} vendas exportadas para Excel.` })
      } else if (target === 'financeiro') {
        const { data: sales } = await supabase.from('sales').select('order_id, date, total_revenue, status')
        const { data: purchases } = await supabase.from('purchases').select('invoice, date, total_cost, status, suppliers(name)')
        const finData = [
          ...(sales || []).map(s => ({ Tipo: 'Venda/Receita', Referencia: s.order_id, Data: s.date, Valor: s.total_revenue, Status: s.status })),
          ...(purchases || []).map(p => ({ Tipo: 'Compra/Despesa', Referencia: p.invoice || 'S/N', Data: p.date, Valor: -p.total_cost, Status: p.status }))
        ]
        if (!finData.length) throw new Error('Nenhum dado financeiro para exportar.')
        exportToExcel(finData, 'teknix_financeiro')
        notify({ type: 'success', title: 'Exportado!', message: 'Relatório financeiro exportado com sucesso.' })
      } else if (target === 'relatorios') {
        const { data: products } = await supabase.from('products').select('sku, name, stock, cost_purchase')
        const { data: sales } = await supabase.from('sales').select('order_id, date, total_revenue')
        const repData = (products || []).map(p => ({
          SKU: p.sku,
          Produto: p.name,
          Estoque: p.stock,
          CustoUnitario: p.cost_purchase,
          ValorEstoqueTotal: (p.stock || 0) * (p.cost_purchase || 0)
        }))
        exportToExcel(repData, 'teknix_relatorio_geral')
        notify({ type: 'success', title: 'Exportado!', message: 'Relatório geral exportado com sucesso.' })
      }
    } catch (err: unknown) {
      console.error(err)
      notify({
        type: 'error',
        title: 'Erro na Exportação',
        message: err instanceof Error ? err.message : 'Não foi possível exportar os dados.'
      })
    } finally {
      setLoadingAction(null)
    }
  }

  const importItems = [
    { id: 'produtos' as const, label: 'Produtos', desc: 'Mercado Livre, TikTok, Shopee ou Excel' },
    { id: 'fornecedores' as const, label: 'Fornecedores', desc: 'Contatos e empresas' },
    { id: 'vendas' as const, label: 'Vendas', desc: 'Histórico de pedidos e faturamento' },
    { id: 'estoque' as const, label: 'Estoque', desc: 'Atualização de saldos por SKU' },
  ]

  const exportItems = [
    { id: 'produtos' as const, label: 'Produtos', desc: 'Catálogo completo com custos e estoque' },
    { id: 'vendas' as const, label: 'Vendas', desc: 'Pedidos e receitas por canal' },
    { id: 'financeiro' as const, label: 'Financeiro', desc: 'Receitas, despesas e margens' },
    { id: 'relatorios' as const, label: 'Relatórios', desc: 'Consolidação e balanço de estoque' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      {/* IMPORT SECTION */}
      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#f0f7ff] flex items-center justify-center">
            <Upload className="w-4 h-4 text-[#3483fa]" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-[#333]">Importar Dados</h3>
            <p className="text-[11px] text-[#999]">Selecione uma planilha (.xlsx, .csv) do Mercado Livre, TikTok, Shopee ou Excel</p>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          {importItems.map(item => {
            const isLoading = loadingAction === `import_${item.id}`
            return (
              <div
                key={item.id}
                onClick={() => !loadingAction && handleOpenImport(item.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border border-[#eeeeee] transition-all cursor-pointer ${
                  isLoading ? 'bg-[#f0f7ff] border-[#3483fa]/30 cursor-wait' : 'hover:bg-[#fafafa] hover:border-[#3483fa]/40'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#f0fff4] flex items-center justify-center shrink-0">
                  {isLoading ? <Loader2 className="w-4 h-4 text-[#3483fa] animate-spin" /> : <FileSpreadsheet className="w-4 h-4 text-[#38a169]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-[#333]">{item.label}</span>
                    <span className="text-[10px] text-[#3483fa] font-medium hover:underline">Selecionar arquivo →</span>
                  </div>
                  <p className="text-[10px] text-[#999] truncate">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* EXPORT SECTION */}
      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#f0fff4] flex items-center justify-center">
            <Download className="w-4 h-4 text-[#38a169]" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-[#333]">Exportar Dados</h3>
            <p className="text-[11px] text-[#999]">Baixe seus dados atualizados em formato Excel (.xlsx)</p>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          {exportItems.map(item => {
            const isLoading = loadingAction === `export_${item.id}`
            return (
              <div
                key={item.id}
                onClick={() => !loadingAction && handleExport(item.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border border-[#eeeeee] transition-all cursor-pointer ${
                  isLoading ? 'bg-[#f0f7ff] border-[#3483fa]/30 cursor-wait' : 'hover:bg-[#fafafa] hover:border-[#38a169]/40'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#f0f7ff] flex items-center justify-center shrink-0">
                  {isLoading ? <Loader2 className="w-4 h-4 text-[#3483fa] animate-spin" /> : <File className="w-4 h-4 text-[#3483fa]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-[#333]">{item.label}</span>
                    <span className="text-[10px] text-[#38a169] font-medium hover:underline">Baixar .xlsx ↓</span>
                  </div>
                  <p className="text-[10px] text-[#999] truncate">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function AnalisesPage() {
  return (
    <div className="mp-stack">
      <PageHeader title="Análises" description="Relatórios e importação/exportação" />
      <Tabs defaultValue="relatorios">
        <TabsList>
          <TabsTrigger value="relatorios"><BarChart3 className="w-3.5 h-3.5 mr-1 inline" /> Relatórios</TabsTrigger>
          <TabsTrigger value="import-export"><FileInput className="w-3.5 h-3.5 mr-1 inline" /> Importar / Exportar</TabsTrigger>
        </TabsList>
        <TabsContent value="relatorios"><RelatoriosTab /></TabsContent>
        <TabsContent value="import-export"><ImportExportTab /></TabsContent>
      </Tabs>
    </div>
  )
}
