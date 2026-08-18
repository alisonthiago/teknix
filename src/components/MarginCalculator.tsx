'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Calculator, TrendingUp, Search, Package, ChevronDown } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { MarketplaceLogo } from './MarketplaceLogos'

interface MarginCalculatorProps {
  open: boolean
  onClose: () => void
}

interface Product {
  id: string
  sku: string
  name: string
  cost_purchase: number
  freight_purchase: number
  packaging_cost: number
  other_costs: number
  stock: number
  product_images: { url: string; is_primary: boolean }[]
}

interface FeeRule {
  id: string
  name: string
  marketplace_id: string
  commission_pct: number
  fixed_fee: number
  subsidized_freight: number
  tax_pct: number
}

const MARKETPLACES = [
  { id: 'mercado_livre', name: 'Mercado Livre', defaultCommission: 13 },
  { id: 'shopee', name: 'Shopee', defaultCommission: 14 },
  { id: 'tiktok_shop', name: 'TikTok Shop', defaultCommission: 8 },
  { id: 'amazon', name: 'Amazon', defaultCommission: 15 },
  { id: 'magalu', name: 'Magalu', defaultCommission: 12 },
]

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ResultCard({ label, value, color, large }: { label: string; value: string; color?: string; large?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2">
      <span className={`text-[#666] ${large ? 'text-sm font-semibold' : 'text-sm'}`}>{label}</span>
      <span className={`${large ? 'text-xl font-bold' : 'text-sm font-medium'} ${color || 'text-[#333]'}`}>{value}</span>
    </div>
  )
}

function TabButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 whitespace-nowrap ${
        active
          ? 'text-[#3483fa] border-[#3483fa]'
          : 'text-[#999] border-transparent hover:text-[#666]'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  )
}

function SimulatorTab() {
  const [custo, setCusto] = useState(45)
  const [frete, setFrete] = useState(10)
  const [margem, setMargem] = useState(30)
  const [taxa, setTaxa] = useState(16)

  const custoTotal = custo + frete
  const precoSugerido = custoTotal > 0 ? custoTotal / (1 - (margem + taxa) / 100) : 0
  const totalTaxas = (precoSugerido * taxa) / 100
  const lucro = precoSugerido - custoTotal - totalTaxas

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#999] mb-1.5">Custo (R$)</label>
          <input
            type="number"
            value={custo || ''}
            onChange={e => setCusto(+e.target.value)}
            className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#999] mb-1.5">Frete (R$)</label>
          <input
            type="number"
            value={frete || ''}
            onChange={e => setFrete(+e.target.value)}
            className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#999] mb-1.5">Margem (%)</label>
          <input
            type="number"
            value={margem || ''}
            onChange={e => setMargem(+e.target.value)}
            className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#999] mb-1.5">Taxa (%)</label>
          <input
            type="number"
            value={taxa || ''}
            onChange={e => setTaxa(+e.target.value)}
            className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]"
          />
        </div>
      </div>

      <div className="bg-[#f5f5f5] rounded-xl p-4 space-y-1">
        <ResultCard label="Custo Total" value={formatCurrency(custoTotal)} />
        <div className="border-t border-[#e6e6e6]" />
        <ResultCard label="Preço Sugerido" value={formatCurrency(precoSugerido)} color="text-[#3483fa]" large />
        <ResultCard label="Lucro" value={formatCurrency(lucro)} color={lucro >= 0 ? 'text-[#00a650]' : 'text-[#f23d4f]'} large />
        <div className="border-t border-[#e6e6e6]" />
        <ResultCard label="Total Taxas" value={formatCurrency(totalTaxas)} color="text-[#f23d4f]" />
        <ResultCard label="Margem Real" value={precoSugerido > 0 ? `${((lucro / precoSugerido) * 100).toFixed(1)}%` : '0%'} />
      </div>
    </div>
  )
}

function CalculatorTab() {
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  const [custo, setCusto] = useState(0)
  const [frete, setFrete] = useState(0)
  const [embalagem, setEmbalagem] = useState(0)
  const [outros, setOutros] = useState(0)
  const [margem, setMargem] = useState(30)
  const [taxa, setTaxa] = useState(16)

  const custoTotal = custo + frete + embalagem + outros
  const precoSugerido = custoTotal > 0 ? custoTotal / (1 - (margem + taxa) / 100) : 0
  const totalTaxas = (precoSugerido * taxa) / 100
  const lucro = precoSugerido - custoTotal - totalTaxas
  const markup = custoTotal > 0 ? precoSugerido / custoTotal : 0
  const precoMinimo = custoTotal > 0 ? custoTotal / (1 - taxa / 100) : 0

  const searchProducts = useCallback(
    async (query: string) => {
      if (query.length < 2) { setProducts([]); return }
      const { data } = await supabase
        .from('products')
        .select('id, sku, name, cost_purchase, freight_purchase, packaging_cost, other_costs, stock, product_images(url, is_primary)')
        .ilike('name', `%${query}%`)
        .limit(8)
      if (data) setProducts(data)
    },
    [supabase]
  )

  useEffect(() => {
    const timer = setTimeout(() => searchProducts(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery, searchProducts])

  const selectProduct = (p: Product) => {
    setSelectedProduct(p)
    setCusto(p.cost_purchase || 0)
    setFrete(p.freight_purchase || 0)
    setEmbalagem(p.packaging_cost || 0)
    setOutros(p.other_costs || 0)
    setShowDropdown(false)
    setSearchQuery(p.name)
  }

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); if (!e.target.value) setSelectedProduct(null) }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Buscar produto por nome..."
          className="w-full border border-[#e6e6e6] rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#3483fa] transition-colors"
        />
        {showDropdown && products.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-white border border-[#e6e6e6] rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
            {products.map(p => (
              <button key={p.id} onClick={() => selectProduct(p)} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#f5f5f5] text-left transition-colors">
                {p.product_images?.[0]?.url ? (
                  <img src={p.product_images[0].url} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] flex items-center justify-center"><Package className="w-4 h-4 text-[#999]" /></div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#333] truncate">{p.name}</p>
                  <p className="text-xs text-[#999]">SKU: {p.sku} · Estoque: {p.stock}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedProduct && (
        <div className="flex items-center gap-3 p-3 bg-[#f5f5f5] rounded-xl">
          {selectedProduct.product_images?.[0]?.url ? (
            <img src={selectedProduct.product_images[0].url} alt={selectedProduct.name} className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-[#e6e6e6]"><Package className="w-4 h-4 text-[#999]" /></div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[#333] truncate">{selectedProduct.name}</p>
            <p className="text-xs text-[#999]">SKU: {selectedProduct.sku}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#999] mb-1.5">Custo (R$)</label>
          <input type="number" value={custo || ''} onChange={e => setCusto(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#999] mb-1.5">Frete (R$)</label>
          <input type="number" value={frete || ''} onChange={e => setFrete(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#999] mb-1.5">Embalagem (R$)</label>
          <input type="number" value={embalagem || ''} onChange={e => setEmbalagem(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#999] mb-1.5">Outros (R$)</label>
          <input type="number" value={outros || ''} onChange={e => setOutros(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#999] mb-1.5">Margem (%)</label>
          <input type="number" value={margem || ''} onChange={e => setMargem(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#999] mb-1.5">Taxa (%)</label>
          <input type="number" value={taxa || ''} onChange={e => setTaxa(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
        </div>
      </div>

      <div className="bg-[#f5f5f5] rounded-xl p-4 space-y-1">
        <ResultCard label="Custo Real" value={formatCurrency(custoTotal)} />
        <div className="border-t border-[#e6e6e6]" />
        <ResultCard label="Preço Sugerido" value={formatCurrency(precoSugerido)} color="text-[#3483fa]" large />
        <ResultCard label="Lucro" value={formatCurrency(lucro)} color={lucro >= 0 ? 'text-[#00a650]' : 'text-[#f23d4f]'} large />
        <div className="border-t border-[#e6e6e6]" />
        <ResultCard label="Total Taxas" value={formatCurrency(totalTaxas)} color="text-[#f23d4f]" />
        <ResultCard label="Markup" value={`${markup.toFixed(2)}x`} />
        <ResultCard label="Preço Mínimo" value={formatCurrency(precoMinimo)} color="text-[#3483fa]" />
      </div>
    </div>
  )
}

function CompareTab() {
  const supabase = createClient()
  const [custo, setCusto] = useState(45)
  const [frete, setFrete] = useState(10)
  const [margem, setMargem] = useState(30)
  const [feeRules, setFeeRules] = useState<Record<string, FeeRule>>({})
  const [loadingFees, setLoadingFees] = useState(false)

  const custoTotal = custo + frete

  const loadAllFees = useCallback(async () => {
    setLoadingFees(true)
    const { data } = await supabase
      .from('marketplace_fee_rules')
      .select('*')
      .eq('is_active', true)

    if (data) {
      const byMarketplace: Record<string, FeeRule> = {}
      for (const rule of data) {
        if (!byMarketplace[rule.marketplace_id]) {
          byMarketplace[rule.marketplace_id] = rule
        }
      }
      setFeeRules(byMarketplace)
    }
    setLoadingFees(false)
  }, [supabase])

  useEffect(() => {
    loadAllFees()
  }, [loadAllFees])

  const getFee = (mpId: string) => {
    const rule = feeRules[mpId]
    return rule ? rule.commission_pct : MARKETPLACES.find(m => m.id === mpId)?.defaultCommission || 13
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#999] mb-1.5">Custo (R$)</label>
          <input type="number" value={custo || ''} onChange={e => setCusto(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#999] mb-1.5">Frete (R$)</label>
          <input type="number" value={frete || ''} onChange={e => setFrete(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-[#999] mb-1.5">Margem (%)</label>
          <input type="number" value={margem || ''} onChange={e => setMargem(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-[#999] mb-2">Clique no marketplace para ver os valores</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MARKETPLACES.map(mp => {
            const taxa = getFee(mp.id)
            const preco = custoTotal > 0 ? custoTotal / (1 - (margem + taxa) / 100) : 0
            const totalTaxas = (preco * taxa) / 100
            const lucro = preco - custoTotal - totalTaxas

            return (
              <button
                key={mp.id}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[#e6e6e6] hover:border-[#3483fa] hover:bg-[#ecf3fe]/30 transition-all text-center"
              >
                <MarketplaceLogo name={mp.name} className="w-6 h-6" />
                <span className="text-[10px] font-medium text-[#666]">{mp.name}</span>
                <span className="text-[10px] text-[#999]">{taxa}% taxa</span>
                <span className="text-xs font-bold text-[#3483fa]">{formatCurrency(preco)}</span>
                <span className={`text-[10px] font-medium ${lucro >= 0 ? 'text-[#00a650]' : 'text-[#f23d4f]'}`}>
                  Lucro: {formatCurrency(lucro)}
                </span>
              </button>
            )
          })}
        </div>
        {loadingFees && <p className="text-xs text-[#999] mt-2 text-center">Carregando taxas do banco...</p>}
      </div>
    </div>
  )
}

export default function MarginCalculator({ open, onClose }: MarginCalculatorProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'simulador' | 'calculadora' | 'comparar'>('simulador')

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" ref={overlayRef}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-[calc(100%-24px)] sm:w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.12)]">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-[#e6e6e6] flex items-center justify-between">
          <h2 className="text-base font-semibold text-[#333] flex items-center gap-2">
            <Calculator className="w-5 h-5 text-[#3483fa]" />
            Calculadora TEKNIX
          </h2>
          <button
            onClick={onClose}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full hover:bg-[#f5f5f5] text-[#999] flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#e6e6e6] px-5 flex gap-0 overflow-x-auto">
          <TabButton active={activeTab === 'simulador'} onClick={() => setActiveTab('simulador')} icon={TrendingUp} label="Simulador" />
          <TabButton active={activeTab === 'calculadora'} onClick={() => setActiveTab('calculadora')} icon={Calculator} label="Calculadora" />
          <TabButton active={activeTab === 'comparar'} onClick={() => setActiveTab('comparar')} icon={Search} label="Comparar" />
        </div>

        {/* Tab Content */}
        <div className="p-5">
          {activeTab === 'simulador' && <SimulatorTab />}
          {activeTab === 'calculadora' && <CalculatorTab />}
          {activeTab === 'comparar' && <CompareTab />}
        </div>
      </div>
    </div>
  )
}
