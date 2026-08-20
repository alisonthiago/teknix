'use client'

import { useState, useRef, useMemo } from 'react'
import Link from 'next/link'
import { 
  BarChart3, 
  FileInput, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  File, 
  TrendingUp, 
  DollarSign, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Trophy,
  Flame,
  Moon,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Layers,
  Sparkles,
  ShoppingBag,
  ShoppingCart
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader, StatCard } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { createClient } from '@/utils/supabase/client'
import { importFromExcel, exportToExcel } from '@/utils/excel'
import { useNotification } from '@/contexts/NotificationContext'
import { 
  calculateRealProfit, 
  rankProducts, 
  compareMarketplaces, 
  generatePurchaseSuggestions 
} from '@/lib/intelligence-engine'

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default function AnalisesPage() {
  const { data: rawData, loading } = useSupabaseQuery(async (s) => {
    const [ordersRes, productsRes, orderItemsRes] = await Promise.all([
      s.from('orders').select('*, marketplaces(name, logo)').order('created_at', { ascending: false }),
      s.from('products').select('*').order('name'),
      s.from('order_items').select('*, products(id, name, sku, cost_purchase, price)')
    ])

    return {
      orders: ordersRes.data || [],
      products: productsRes.data || [],
      orderItems: orderItemsRes.data || []
    }
  })

  const orders = rawData?.orders || []
  const products = rawData?.products || []
  const orderItems = rawData?.orderItems || []

  // Calculated metrics
  const profitMetrics = useMemo(() => calculateRealProfit(orders), [orders])
  const ranked = useMemo(() => rankProducts(products, orderItems), [products, orderItems])
  const mpComparison = useMemo(() => compareMarketplaces(orders), [orders])
  const purchaseSuggestions = useMemo(() => generatePurchaseSuggestions(products, orderItems, 30), [products, orderItems])

  return (
    <div className="mp-stack max-w-7xl mx-auto pb-12">
      <PageHeader 
        title="Central de Análises & Inteligência" 
        description="Controle de lucro líquido real, ranking de produtos, comparação entre marketplaces e previsão de reposição." 
      />

      <Tabs defaultValue="lucro-real">
        <TabsList className="flex flex-wrap gap-1 mb-4">
          <TabsTrigger value="lucro-real">
            <DollarSign className="w-3.5 h-3.5 mr-1 inline text-[#16a34a]" /> Lucro Real & DRE
          </TabsTrigger>
          <TabsTrigger value="ranking">
            <Trophy className="w-3.5 h-3.5 mr-1 inline text-[#f59e0b]" /> Ranking de Produtos
          </TabsTrigger>
          <TabsTrigger value="marketplaces">
            <Layers className="w-3.5 h-3.5 mr-1 inline text-[#2563eb]" /> Comparação de Marketplaces
          </TabsTrigger>
          <TabsTrigger value="sugestao-compras">
            <ShoppingBag className="w-3.5 h-3.5 mr-1 inline text-[#9333ea]" /> Sugestão de Compras
          </TabsTrigger>
          <TabsTrigger value="import-export">
            <FileInput className="w-3.5 h-3.5 mr-1 inline text-[#64748b]" /> Importar / Exportar
          </TabsTrigger>
        </TabsList>

        {/* 1. ABA LUCRO REAL & DRE */}
        <TabsContent value="lucro-real">
          <div className="space-y-6">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Faturamento Bruto" value={formatBRL(profitMetrics.totalRevenue)} subtitle={`${profitMetrics.ordersCount} pedidos faturados`} />
              <StatCard label="Custos de Produtos (CMV)" value={formatBRL(profitMetrics.totalCOGS)} subtitle="Custo das mercadorias vendidas" />
              <StatCard label="Taxas & Comissões ML/Canais" value={formatBRL(profitMetrics.totalFees)} subtitle="Tarifas e fretes debitados" />
              <StatCard label="Lucro Líquido Real" value={formatBRL(profitMetrics.netProfit)} subtitle={`Margem Líquida: ${profitMetrics.netMarginPercentage.toFixed(1)}%`} />
            </div>

            {/* DRE Decomposed Card */}
            <div className="bg-white rounded-2xl border border-[#e6e6e6] p-6 shadow-xs">
              <h3 className="text-base font-bold text-[#333] mb-1">Demonstrativo de Resultado do Exercício (DRE Operacional)</h3>
              <p className="text-xs text-[#666] mb-6">Decomposição matemática de cada centavo faturado nos marketplaces.</p>

              <div className="space-y-3 font-mono text-xs max-w-2xl">
                <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0]">
                  <span className="font-bold text-[#333]">(+) Receita Bruta de Vendas</span>
                  <span className="font-bold text-[#333] text-sm">{formatBRL(profitMetrics.totalRevenue)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0] text-[#e74c3c]">
                  <span>(-) Custo da Mercadoria Vendida (CMV)</span>
                  <span>- {formatBRL(profitMetrics.totalCOGS)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0] text-[#e74c3c]">
                  <span>(-) Comissões e Tarifas dos Marketplaces</span>
                  <span>- {formatBRL(profitMetrics.totalFees)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0] text-[#e74c3c]">
                  <span>(-) Fretes e Envios Pagos</span>
                  <span>- {formatBRL(profitMetrics.totalFreight)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-[#f0f0f0] text-[#e74c3c]">
                  <span>(-) Impostos e Tributos Calculados</span>
                  <span>- {formatBRL(profitMetrics.totalTaxes)}</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-[#f0fff4] border border-[#bbf7d0] rounded-xl px-4 text-[#16a34a]">
                  <span className="font-black text-sm">(=) LUCRO LÍQUIDO REAL</span>
                  <span className="font-black text-base">{formatBRL(profitMetrics.netProfit)} ({profitMetrics.netMarginPercentage.toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 2. ABA RANKING DE PRODUTOS */}
        <TabsContent value="ranking">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#e6e6e6] overflow-hidden shadow-xs">
              <div className="p-5 border-b border-[#f0f0f0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-[#333]">Classificação & Velocidade de Vendas</h3>
                  <p className="text-xs text-[#666]">Produtos ordenados por receita, velocidade de saída e margem real.</p>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#f0f7ff] text-[#3483fa]">
                  {ranked.length} Produtos Analisados
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#eeeeee] text-[10px] font-bold text-[#999] uppercase">
                      <th className="py-3 px-4">Classificação</th>
                      <th className="py-3 px-4">Produto / SKU</th>
                      <th className="py-3 px-4 text-center">Estoque</th>
                      <th className="py-3 px-4 text-right">Vendas (Qtd)</th>
                      <th className="py-3 px-4 text-right">Faturamento</th>
                      <th className="py-3 px-4 text-right">Lucro Estimado</th>
                      <th className="py-3 px-4 text-right">Giro Diário</th>
                      <th className="py-3 px-4 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f5f5]">
                    {ranked.map((p, idx) => {
                      return (
                        <tr key={p.id} className="hover:bg-[#fafafa] transition-colors">
                          <td className="py-3.5 px-4">
                            {p.category === 'TOP_SELLER' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fef3c7] text-[#92400e]">
                                <Trophy className="w-3 h-3 text-[#d97706]" /> Mais Vendido
                              </span>
                            )}
                            {p.category === 'HIGH_REVENUE' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#eff6ff] text-[#1e40af]">
                                <DollarSign className="w-3 h-3 text-[#2563eb]" /> Alta Receita
                              </span>
                            )}
                            {p.category === 'FAST_MOVER' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fef2f2] text-[#991b1b]">
                                <Flame className="w-3 h-3 text-[#ef4444]" /> Alto Giro
                              </span>
                            )}
                            {p.category === 'LOW_MARGIN' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fff1f2] text-[#e11d48]">
                                <AlertTriangle className="w-3 h-3 text-[#f43f5e]" /> Baixa Margem
                              </span>
                            )}
                            {p.category === 'DEAD_STOCK' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f5f9] text-[#475569]">
                                <Moon className="w-3 h-3 text-[#64748b]" /> Sem Saída
                              </span>
                            )}
                            {p.category === 'NORMAL' && (
                              <span className="text-[11px] text-[#999]">Padrão #{idx + 1}</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 font-semibold text-[#333]">
                            <Link href={`/produtos/${p.id}`} className="hover:text-[#3483fa] hover:underline">
                              <p className="truncate max-w-xs">{p.name}</p>
                              <p className="text-[10px] font-mono text-[#999] font-normal">{p.sku}</p>
                            </Link>
                          </td>

                          <td className="py-3.5 px-4 text-center font-bold">
                            <span className={p.stock <= 0 ? 'text-[#e74c3c]' : (p.stock <= p.minStock ? 'text-[#f39c12]' : 'text-[#27ae60]')}>
                              {p.stock} un
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-[#333]">
                            {p.unitsSold}
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-[#333]">
                            {formatBRL(p.revenue)}
                          </td>

                          <td className="py-3.5 px-4 text-right font-bold text-[#16a34a]">
                            {formatBRL(p.profit)}
                          </td>

                          <td className="py-3.5 px-4 text-right text-[#666] font-mono">
                            {p.dailyVelocity.toFixed(1)} /dia
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <Link
                              href={`/produtos/${p.id}`}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#3483fa] hover:underline"
                            >
                              Ver Análise <ArrowUpRight className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 3. ABA COMPARAÇÃO DE MARKETPLACES */}
        <TabsContent value="marketplaces">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#e6e6e6] p-6 shadow-xs">
              <h3 className="text-base font-bold text-[#333] mb-1">Comparação de Desempenho por Marketplace</h3>
              <p className="text-xs text-[#666] mb-6">Compare qual plataforma gera mais volume, maior faturamento e melhor margem líquida.</p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-[#fafafa] border-b border-[#eeeeee] text-[10px] font-bold text-[#999] uppercase">
                      <th className="py-3 px-4">Canal de Venda</th>
                      <th className="py-3 px-4 text-center">Pedidos</th>
                      <th className="py-3 px-4 text-center">Unidades</th>
                      <th className="py-3 px-4 text-right">Faturamento</th>
                      <th className="py-3 px-4 text-right">Taxas & Tarifas</th>
                      <th className="py-3 px-4 text-right">Lucro Líquido</th>
                      <th className="py-3 px-4 text-right">Margem %</th>
                      <th className="py-3 px-4 text-right">Ticket Médio</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f5f5f5]">
                    {mpComparison.map((mp, i) => (
                      <tr key={i} className="hover:bg-[#fafafa] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <MarketplaceLogo name={mp.name} className="w-5 h-5" />
                            <span className="font-bold text-[#333]">{mp.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold">{mp.ordersCount}</td>
                        <td className="py-3.5 px-4 text-center text-[#666]">{mp.unitsSold}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#333]">{formatBRL(mp.revenue)}</td>
                        <td className="py-3.5 px-4 text-right text-[#e74c3c]">- {formatBRL(mp.fees)}</td>
                        <td className="py-3.5 px-4 text-right font-black text-[#16a34a]">{formatBRL(mp.netProfit)}</td>
                        <td className="py-3.5 px-4 text-right font-bold text-[#3483fa]">{mp.netMargin.toFixed(1)}%</td>
                        <td className="py-3.5 px-4 text-right font-mono text-[#666]">{formatBRL(mp.averageTicket)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* 4. ABA SUGESTÃO DE COMPRAS */}
        <TabsContent value="sugestao-compras">
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-[#e6e6e6] p-6 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                  <h3 className="text-base font-bold text-[#333]">Sugestões Automáticas de Reposição de Estoque</h3>
                  <p className="text-xs text-[#666]">Baseado na velocidade média de saída dos últimos 30 dias para evitar ruptura.</p>
                </div>
                <Link
                  href="/purchases/new"
                  className="px-4 py-2 bg-[#3483fa] hover:bg-[#2968c8] text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 self-start sm:self-auto"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Criar Pedido de Compra
                </Link>
              </div>

              {purchaseSuggestions.length === 0 ? (
                <div className="p-8 text-center bg-[#f9fafb] rounded-xl border border-[#f0f0f0] text-xs text-[#666]">
                  Nenhum produto em risco de ruptura no momento. Todos os estoques estão equilibrados!
                </div>
              ) : (
                <div className="divide-y divide-[#f5f5f5]">
                  {purchaseSuggestions.map((s, idx) => (
                    <div key={idx} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            s.urgency === 'CRITICAL' ? 'bg-[#fee2e2] text-[#dc2626]' : 'bg-[#fef3c7] text-[#d97706]'
                          }`}>
                            {s.urgency === 'CRITICAL' ? 'Estoque Zerado' : `Ruptura em ${s.daysUntilStockout} dias`}
                          </span>
                          <span className="font-bold text-xs text-[#333]">{s.productName}</span>
                        </div>
                        <p className="text-xs text-[#666]">
                          SKU: <strong className="font-mono text-[#333]">{s.sku}</strong> • Estoque atual: <strong className="text-[#333]">{s.stock} un</strong> • Giro: <strong>{s.dailyVelocity.toFixed(1)} un/dia</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <p className="text-[10px] uppercase font-bold text-[#999]">Comprar Sugerido</p>
                          <p className="text-base font-black text-[#2563eb]">{s.suggestedQuantity} unidades</p>
                          <p className="text-[10px] text-[#666]">Inv. estimado: {formatBRL(s.estimatedInvestment)}</p>
                        </div>

                        <Link
                          href={`/purchases/new?product=${s.productId}&qty=${s.suggestedQuantity}`}
                          className="px-4 py-2 bg-[#f0fff4] hover:bg-[#dcfce7] text-[#16a34a] border border-[#bbf7d0] text-xs font-bold rounded-xl transition-all"
                        >
                          Comprar ➔
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* 5. ABA IMPORT / EXPORT */}
        <TabsContent value="import-export">
          <ImportExportTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function ImportExportTab() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importTarget, setImportTarget] = useState<'produtos' | 'fornecedores' | 'vendas' | 'estoque' | null>(null)
  const { notify } = useNotification()

  const handleOpenImport = (target: 'produtos' | 'fornecedores' | 'vendas' | 'estoque') => {
    setImportTarget(target)
    fileInputRef.current?.click()
  }

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !importTarget) return

    setLoadingAction(`import_${importTarget}`)
    const supabase = createClient()

    try {
      if (importTarget === 'produtos') {
        const rawRows = await importFromExcel(file, {
          sku: ['sku', 'código', 'codigo', 'referência', 'referencia'],
          name: ['nome', 'título', 'titulo', 'produto', 'descrição', 'descricao', 'name'],
          ean: ['ean', 'gtin', 'código de barras', 'codigo de barras', 'barcode'],
          cost_purchase: ['custo', 'preço de custo', 'preco de custo', 'custo de compra', 'cost'],
          stock: ['estoque', 'quantidade', 'saldo', 'físico', 'fisico', 'stock']
        })

        if (!rawRows.length) throw new Error('Nenhum dado válido encontrado na planilha.')

        let insertedCount = 0
        for (const r of rawRows) {
          if (!r.sku && !r.name) continue
          const cleanSku = (r.sku ? String(r.sku).trim() : `SKU-${Date.now()}`).toUpperCase()
          const cleanCost = typeof r.cost_purchase === 'number' ? r.cost_purchase : parseFloat(String(r.cost_purchase || '0').replace(',', '.')) || 0
          const cleanStock = parseInt(String(r.stock || '0')) || 0

          const { error } = await supabase.from('products').upsert({
            sku: cleanSku,
            name: String(r.name || cleanSku).trim(),
            ean: r.ean ? String(r.ean).trim() : null,
            cost_purchase: cleanCost,
            stock: cleanStock,
            status: 'ACTIVE'
          }, { onConflict: 'sku' })

          if (!error) insertedCount++
        }

        notify({
          type: 'success',
          title: 'Planilha Processada!',
          message: `${insertedCount} produto(s) sincronizados com sucesso.`
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
        const { data, error } = await supabase.from('products').select('sku, name, ean, cost_purchase, stock, status')
        if (error) throw error
        exportToExcel(data, 'teknix_produtos')
        notify({ type: 'success', title: 'Exportado!', message: `${data.length} produtos exportados para Excel.` })
      } else if (target === 'vendas') {
        const { data, error } = await supabase.from('orders').select('order_number, total_amount, status, customer_name, created_at')
        if (error) throw error
        exportToExcel(data, 'teknix_pedidos')
        notify({ type: 'success', title: 'Exportado!', message: `${data.length} vendas exportadas para Excel.` })
      }
    } catch (err: unknown) {
      console.error(err)
    } finally {
      setLoadingAction(null)
    }
  }

  const importItems = [
    { id: 'produtos' as const, label: 'Produtos', desc: 'Mercado Livre, Shopee ou Excel' },
    { id: 'estoque' as const, label: 'Estoque', desc: 'Atualização de saldos por SKU' },
  ]

  const exportItems = [
    { id: 'produtos' as const, label: 'Produtos', desc: 'Catálogo completo com custos e estoque' },
    { id: 'vendas' as const, label: 'Vendas', desc: 'Pedidos e receitas por canal' },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelected}
        accept=".xlsx, .xls, .csv"
        className="hidden"
      />

      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <Upload className="w-4 h-4 text-[#3483fa]" />
          <div>
            <h3 className="text-[13px] font-semibold text-[#333]">Importar Dados</h3>
            <p className="text-[11px] text-[#999]">Selecione uma planilha (.xlsx, .csv) do Mercado Livre ou Excel</p>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          {importItems.map(item => (
            <div
              key={item.id}
              onClick={() => !loadingAction && handleOpenImport(item.id)}
              className="flex items-center gap-3 p-3 rounded-xl border border-[#eeeeee] hover:bg-[#fafafa] transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-[#38a169]" />
              <div className="flex-1 min-w-0">
                <span className="text-[12px] font-semibold text-[#333]">{item.label}</span>
                <p className="text-[10px] text-[#999]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <Download className="w-4 h-4 text-[#38a169]" />
          <div>
            <h3 className="text-[13px] font-semibold text-[#333]">Exportar Dados</h3>
            <p className="text-[11px] text-[#999]">Baixe seus dados atualizados em formato Excel (.xlsx)</p>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          {exportItems.map(item => (
            <div
              key={item.id}
              onClick={() => !loadingAction && handleExport(item.id)}
              className="flex items-center gap-3 p-3 rounded-xl border border-[#eeeeee] hover:bg-[#fafafa] transition-all cursor-pointer"
            >
              <File className="w-4 h-4 text-[#3483fa]" />
              <div className="flex-1 min-w-0">
                <span className="text-[12px] font-semibold text-[#333]">{item.label}</span>
                <p className="text-[10px] text-[#999]">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
