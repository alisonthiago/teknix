'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Calculator, TrendingUp, Search, Package, Info } from 'lucide-react'
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
  shipping_fee_pct: number
  other_fees_pct: number
}

interface MarketplaceModality {
  id: string
  name: string
  comissao: number
  juros: number
}

interface MarketplaceConfig {
  id: string
  name: string
  modalities: MarketplaceModality[]
  getFreightAndFee: (preco: number) => { frete: number, tarifa: number }
}

const MARKETPLACE_CONFIG: MarketplaceConfig[] = [
  {
    id: 'mercado_livre',
    name: 'Mercado Livre',
    modalities: [
      { id: 'classico', name: 'Clássico (12%)', comissao: 12, juros: 0 },
      { id: 'premium', name: 'Premium (17%)', comissao: 17, juros: 0 }
    ],
    getFreightAndFee: (preco) => preco < 79 ? { frete: 0, tarifa: 6.00 } : { frete: 18.85, tarifa: 0 }
  },
  {
    id: 'shopee',
    name: 'Shopee',
    modalities: [
      { id: 'padrao', name: 'Padrão (20%)', comissao: 20, juros: 0 }
    ],
    getFreightAndFee: (preco) => ({ frete: 0, tarifa: 4.00 })
  },
  {
    id: 'tiktok_shop',
    name: 'TikTok Shop',
    modalities: [
      { id: 'padrao', name: 'Padrão (12%)', comissao: 12, juros: 0 }
    ],
    getFreightAndFee: (preco) => ({ frete: 0, tarifa: 3.00 })
  },
  {
    id: 'amazon',
    name: 'Amazon',
    modalities: [
      { id: 'padrao', name: 'Padrão (15%)', comissao: 15, juros: 0 }
    ],
    getFreightAndFee: (preco) => ({ frete: 0, tarifa: 0 })
  },
  {
    id: 'magalu',
    name: 'Magalu',
    modalities: [
      { id: 'padrao', name: 'Padrão (16%)', comissao: 16, juros: 0 }
    ],
    getFreightAndFee: (preco) => ({ frete: 0, tarifa: 0 })
  }
]

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function ResultCard({ label, value, color, large, tooltip }: { label: string; value: string; color?: string; large?: boolean, tooltip?: string }) {
  return (
    <div className="flex justify-between items-center py-0.5" title={tooltip}>
      <span className={`text-[#666] ${large ? 'text-sm font-semibold' : 'text-xs'}`}>{label}</span>
      <span className={`${large ? 'text-lg font-bold' : 'text-xs font-medium'} ${color || 'text-[#333]'}`}>{value}</span>
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



function SimulatorTab({ initialProduct }: { initialProduct?: Product | null }) {
  const [custo, setCusto] = useState(40)
  const [freteLogistica, setFreteLogistica] = useState(0)
  const [embalagem, setEmbalagem] = useState(0)
  
  const [margemLiquida, setMargemLiquida] = useState(30)
  const [imposto, setImposto] = useState(6)
  const [publicidade, setPublicidade] = useState(0)
  const [reserva, setReserva] = useState(0)
  
  // Marketplaces auto configurations
  const [selectedMktId, setSelectedMktId] = useState<string | null>(null)
  const [selectedModalityId, setSelectedModalityId] = useState<string | null>(null)

  // Fields that get auto-filled when a Marketplace is selected
  const [comissaoMkt, setComissaoMkt] = useState(16)
  const [juros, setJuros] = useState(0)
  const [freteMarketplace, setFreteMarketplace] = useState(0)
  const [tarifaFixa, setTarifaFixa] = useState(0)

  useEffect(() => {
    if (initialProduct) {
      setCusto(initialProduct.cost_purchase || 0)
      setFreteLogistica(initialProduct.freight_purchase || 0)
      setEmbalagem(initialProduct.packaging_cost || 0)
    }
  }, [initialProduct])

  const handleSelectMkt = (mpId: string) => {
    if (selectedMktId === mpId) {
      setSelectedMktId(null)
      setSelectedModalityId(null)
    } else {
      setSelectedMktId(mpId)
      const mpConf = MARKETPLACE_CONFIG.find(m => m.id === mpId)
      if (mpConf) {
        const firstMod = mpConf.modalities[0]
        setSelectedModalityId(firstMod?.id || null)
        
        // Preset values once, allowing user to overwrite later
        if (firstMod) {
          setComissaoMkt(firstMod.comissao)
          setJuros(firstMod.juros)
        }
        // Preset freight/fee based on current price (assuming zero initially)
        const extras = mpConf.getFreightAndFee(custo + freteLogistica + embalagem)
        setFreteMarketplace(extras.frete)
        setTarifaFixa(extras.tarifa)
      }
    }
  }

  const handleSelectModality = (modId: string) => {
    setSelectedModalityId(modId)
    const mpConf = MARKETPLACE_CONFIG.find(m => m.id === selectedMktId)
    if (mpConf) {
      const modConf = mpConf.modalities.find(m => m.id === modId)
      if (modConf) {
        setComissaoMkt(modConf.comissao)
        setJuros(modConf.juros)
      }
    }
  }

  const custoBaseFixo = custo + freteLogistica + embalagem
  const sumPct = (margemLiquida + imposto + publicidade + juros + reserva + comissaoMkt) / 100
  const sumPctSemMargem = (imposto + publicidade + juros + reserva + comissaoMkt) / 100

  // Sincroniza dinamicamente as tarifas SE o usuário não tiver alterado manualmente recentemente,
  // mas para simplificar e garantir 100% de controle sem divergência: usaremos os valores do input diretamente!
  // Os botões de marketplace apenas pré-preenchem os inputs.
  let precoMinimo = 0
  let precoSugerido = 0
  const finalFrete = freteMarketplace
  const finalTarifa = tarifaFixa

  if (sumPctSemMargem < 1) {
    precoMinimo = (custoBaseFixo + finalFrete + finalTarifa) / (1 - sumPctSemMargem)
  }
  if (sumPct < 1) {
    precoSugerido = (custoBaseFixo + finalFrete + finalTarifa) / (1 - sumPct)
  }

  // Dynamic Freight check (like ML crossing R$ 79) to alert user or auto-update if they want
  // However, the user specifically requested exact match with their input, so we use finalFrete as typed.


  const custoFixo = custoBaseFixo + finalFrete + finalTarifa
  const valImposto = precoSugerido * (imposto / 100)
  const valComissao = precoSugerido * (comissaoMkt / 100)
  const valPublicidade = precoSugerido * (publicidade / 100)
  const valReserva = precoSugerido * (reserva / 100)
  const valJuros = precoSugerido * (juros / 100)
  const lucroLiq = precoSugerido - custoFixo - valImposto - valComissao - valPublicidade - valReserva - valJuros

  const activeMpConfig = MARKETPLACE_CONFIG.find(m => m.id === selectedMktId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="space-y-4">
        {initialProduct && (
          <div className="bg-[#ecf3fe] border border-[#c1d9fd] rounded-xl px-3 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#3483fa]" />
              <span className="text-xs font-semibold text-[#3483fa]">Produto carregado: {initialProduct.name}</span>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-[#333] mb-2 flex items-center justify-between">
            <span>Marketplace (Auto-Config)</span>
            {selectedMktId && <span className="text-[10px] text-[#00a650] bg-[#e6fce5] px-2 py-0.5 rounded-full flex items-center gap-1"><Info className="w-3 h-3"/> Aplicando regras de {activeMpConfig?.name}</span>}
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {MARKETPLACE_CONFIG.map(mp => (
              <button
                key={mp.id}
                title={mp.name}
                onClick={() => handleSelectMkt(mp.id)}
                className={`flex-shrink-0 flex items-center justify-center w-12 h-10 rounded-xl border transition-all ${
                  selectedMktId === mp.id 
                    ? 'border-[#3483fa] bg-[#ecf3fe] text-[#3483fa]' 
                    : 'border-[#e6e6e6] hover:border-[#3483fa] text-[#666]'
                }`}
              >
                <MarketplaceLogo name={mp.name} className="w-6 h-6" />
              </button>
            ))}
          </div>

          {activeMpConfig && activeMpConfig.modalities.length > 1 && (
            <div className="mt-3 bg-[#f5f5f5] p-2.5 rounded-xl border border-[#e6e6e6] flex flex-wrap gap-2">
              <span className="text-xs font-semibold text-[#666] w-full mb-1">Modalidade:</span>
              {activeMpConfig.modalities.map(mod => (
                <button
                  key={mod.id}
                  onClick={() => handleSelectModality(mod.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                    selectedModalityId === mod.id
                      ? 'bg-white border-[#3483fa] text-[#3483fa] shadow-sm'
                      : 'bg-transparent border-transparent text-[#666] hover:bg-[#e6e6e6]'
                  }`}
                >
                  {mod.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#333] mb-2">Custos Fixos (Valores em R$)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-[#999] mb-1 uppercase tracking-wider">Custo Fornec.</label>
              <input type="number" value={custo || ''} onChange={e => setCusto(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-1.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#999] mb-1 uppercase tracking-wider">Frete Logística</label>
              <input type="number" value={freteLogistica || ''} onChange={e => setFreteLogistica(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-1.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#999] mb-1 uppercase tracking-wider">Embalagem</label>
              <input type="number" value={embalagem || ''} onChange={e => setEmbalagem(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-1.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
            </div>
            <div className="">
              <label className="block text-[10px] font-medium text-[#999] mb-1 uppercase tracking-wider">Frete MKT</label>
              <input type="number" value={freteMarketplace || ''} onChange={e => setFreteMarketplace(+e.target.value)}  className="w-full border border-[#e6e6e6] rounded-xl px-3 py-1.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
            </div>
            <div className="">
              <label className="block text-[10px] font-medium text-[#999] mb-1 uppercase tracking-wider">Tarifa Fixa</label>
              <input type="number" value={tarifaFixa || ''} onChange={e => setTarifaFixa(+e.target.value)}  className="w-full border border-[#e6e6e6] rounded-xl px-3 py-1.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-[#333] mb-2">Variáveis (Porcentagens %)</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-[#999] mb-1 uppercase tracking-wider text-[#3483fa]">Margem Líquida</label>
              <input type="number" value={margemLiquida || ''} onChange={e => setMargemLiquida(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-1.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#999] mb-1 uppercase tracking-wider">Imposto</label>
              <input type="number" value={imposto || ''} onChange={e => setImposto(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-1.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
            </div>
            <div className="">
              <label className="block text-[10px] font-medium text-[#999] mb-1 uppercase tracking-wider">Comissão MKT</label>
              <input type="number" value={comissaoMkt || ''} onChange={e => setComissaoMkt(+e.target.value)}  className="w-full border border-[#e6e6e6] rounded-xl px-3 py-1.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#999] mb-1 uppercase tracking-wider">Publicidade (Ads)</label>
              <input type="number" value={publicidade || ''} onChange={e => setPublicidade(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-1.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
            </div>
            <div className="">
              <label className="block text-[10px] font-medium text-[#999] mb-1 uppercase tracking-wider">Juros (Premium)</label>
              <input type="number" value={juros || ''} onChange={e => setJuros(+e.target.value)}  className="w-full border border-[#e6e6e6] rounded-xl px-3 py-1.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
            </div>
            <div>
              <label className="block text-[10px] font-medium text-[#999] mb-1 uppercase tracking-wider">Reserva (Garantia)</label>
              <input type="number" value={reserva || ''} onChange={e => setReserva(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-1.5 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#f5f5f5] rounded-xl p-4 flex flex-col h-full">
        {sumPct >= 1 ? (
          <div className="p-4 text-center text-[#f23d4f] font-medium text-sm flex-1 flex items-center justify-center">Margem inatingível (&gt;=100%)</div>
        ) : (
          <div className="space-y-0.5 flex-1 flex flex-col justify-center">
            <h4 className="text-[11px] font-bold text-[#333] uppercase tracking-wider mb-2">Detalhamento da Venda</h4>
            <ResultCard label="Custo do Produto" value={formatCurrency(custo)} />
            <ResultCard label="Comissão MKT" value={formatCurrency(valComissao)} />
            <ResultCard label="Tarifa Fixa" value={formatCurrency(finalTarifa)} />
            <ResultCard label="Imposto" value={formatCurrency(valImposto)} />
            <ResultCard label="Publicidade" value={formatCurrency(valPublicidade)} />
            <ResultCard label="Reserva devolução" value={formatCurrency(valReserva)} />
            <ResultCard label="Juros" value={formatCurrency(valJuros)} />
            <ResultCard label="Embalagem" value={formatCurrency(embalagem)} />
            <ResultCard label="Frete Fornecedor" value={formatCurrency(freteLogistica)} />
            <ResultCard label="Frete Marketplace" value={formatCurrency(finalFrete)} />
            <div className="border-t border-[#e6e6e6] my-1.5" />
            
            <div className="bg-[#e6fce5] px-3 py-2 rounded-lg border border-[#c3f5c8] my-2">
              <ResultCard label="VOCÊ RECEBE (REPASSE)" value={formatCurrency(precoSugerido - finalTarifa - valComissao - finalFrete)} color="text-[#00a650]" large tooltip="Valor que entra na sua conta (Preço - Tarifas - Frete Marketplace)" />
              <ResultCard label="MARGEM OPERACIONAL (ML)" value={precoSugerido > 0 ? `${(((precoSugerido - finalTarifa - valComissao - finalFrete) / precoSugerido) * 100).toFixed(2)}%` : '0%'} color="text-[#00a650]" tooltip="Igual a margem mostrada no painel do Mercado Livre (Repasse / Preço de Venda)" />
            </div>

            <div className="border-t border-[#e6e6e6] my-1.5" />
            <ResultCard label="CUSTO TOTAL DA VENDA" value={formatCurrency(custoFixo + valImposto + valComissao + valPublicidade + valReserva + valJuros)} />
            <ResultCard label="LUCRO LÍQUIDO" value={formatCurrency(lucroLiq)} color={lucroLiq >= 0 ? 'text-[#333]' : 'text-[#f23d4f]'} />
            <ResultCard label="MARGEM LÍQUIDA (LUCRO)" value={precoSugerido > 0 ? `${((lucroLiq / precoSugerido) * 100).toFixed(1)}%` : '0%'} />
            <div className="border-t border-[#e6e6e6] my-1.5" />
            <ResultCard label="PREÇO MÍNIMO (0% Margem)" value={formatCurrency(precoMinimo)} color="text-[#666]" large tooltip="Preço onde a operação não gera nem lucro nem prejuízo." />
            <ResultCard label="PREÇO SUGERIDO DE VENDA" value={formatCurrency(precoSugerido)} color="text-[#3483fa]" large tooltip="Preço necessário para alcançar a margem desejada." />
          </div>
        )}
      </div>
    </div>
  )
}

function ProductsTab({ onSelectProduct }: { onSelectProduct: (product: Product) => void }) {
  const supabase = createClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [products, setProducts] = useState<Product[]>([])
  const [showDropdown, setShowDropdown] = useState(false)

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

  return (
    <div className="space-y-5 h-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#999]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Buscar produto por nome para puxar os custos..."
          className="w-full border border-[#e6e6e6] rounded-xl pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#3483fa] transition-colors"
        />
        {showDropdown && products.length > 0 && (
          <div className="absolute top-full mt-1 w-full bg-white border border-[#e6e6e6] rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
            {products.map(p => (
              <button key={p.id} onClick={() => { onSelectProduct(p); setShowDropdown(false) }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-[#f5f5f5] text-left transition-colors border-b border-[#e6e6e6] last:border-0">
                {p.product_images?.[0]?.url ? (
                  <img src={p.product_images[0].url} alt={p.name} className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#f5f5f5] flex items-center justify-center"><Package className="w-4 h-4 text-[#999]" /></div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#333] truncate">{p.name}</p>
                  <p className="text-xs text-[#999]">SKU: {p.sku} · Estoque: {p.stock}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#00a650]">{formatCurrency(p.cost_purchase || 0)}</p>
                  <p className="text-[10px] text-[#999]">Custo</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="bg-[#f5f5f5] rounded-xl p-6 text-center">
        <Package className="w-10 h-10 text-[#999] mx-auto mb-3 opacity-50" />
        <h4 className="text-sm font-semibold text-[#333] mb-1">Pesquise um produto</h4>
        <p className="text-xs text-[#666] max-w-sm mx-auto">Ao selecionar um produto, ele será automaticamente carregado no Simulador Avançado para que você faça a engenharia reversa do preço.</p>
      </div>
    </div>
  )
}

function CompareTab() {
  const supabase = createClient()
  const [custo, setCusto] = useState(40)
  const [freteLogistica, setFreteLogistica] = useState(0)
  const [embalagem, setEmbalagem] = useState(0)
  
  const [margemLiquida, setMargemLiquida] = useState(30)
  const [imposto, setImposto] = useState(6)
  
  const [feeRules, setFeeRules] = useState<Record<string, FeeRule>>({})
  const [loadingFees, setLoadingFees] = useState(false)

  const custoBaseFixo = custo + freteLogistica + embalagem

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
    return rule ? rule.commission_pct : MARKETPLACE_CONFIG.find(m => m.id === mpId)?.modalities[0]?.comissao || 13
  }
  
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-[#999] mb-1.5 uppercase tracking-wider">Custo Fornecedor</label>
          <input type="number" value={custo || ''} onChange={e => setCusto(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#999] mb-1.5 uppercase tracking-wider">Margem Líquida (%)</label>
          <input type="number" value={margemLiquida || ''} onChange={e => setMargemLiquida(+e.target.value)} className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2 text-sm outline-none focus:border-[#3483fa] transition-colors text-[#333]" />
        </div>
      </div>

      <div>
        <h4 className="text-xs font-medium text-[#999] mb-2 flex items-center justify-between">
          <span>Comparativo de Venda (Automático)</span>
          <span className="text-[#3483fa] cursor-pointer hover:underline text-[11px]" onClick={loadAllFees}>Sincronizar APIs</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {MARKETPLACE_CONFIG.map(mp => {
            const comissaoMkt = getFee(mp.id)
            let preco = 0
            let freteMkt = 0
            let tarifaFixa = 0
            
            const sumPct = (margemLiquida + imposto + comissaoMkt) / 100
            if (sumPct < 1) {
              preco = custoBaseFixo / (1 - sumPct)
              const extras = mp.getFreightAndFee(preco)
              freteMkt = extras.frete
              tarifaFixa = extras.tarifa
              
              const custoFixoTotal = custoBaseFixo + freteMkt + tarifaFixa
              preco = custoFixoTotal / (1 - sumPct)
              
              const extrasFinais = mp.getFreightAndFee(preco)
              if (extrasFinais.frete !== freteMkt || extrasFinais.tarifa !== tarifaFixa) {
                preco = (custoBaseFixo + extrasFinais.frete + extrasFinais.tarifa) / (1 - sumPct)
              }
            }
            
            const lucro = sumPct < 1 ? preco * (margemLiquida / 100) : 0

            return (
              <button
                key={mp.id}
                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-[#e6e6e6] hover:border-[#3483fa] hover:bg-[#ecf3fe]/30 transition-all text-center relative"
              >
                {mp.id === 'mercado_livre' && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" title="API Sincronizada"></div>
                )}
                <MarketplaceLogo name={mp.name} className="w-6 h-6" />
                <span className="text-[10px] font-medium text-[#666]">{mp.name}</span>
                <span className="text-[10px] text-[#999]">{comissaoMkt}% taxa</span>
                <span className="text-xs font-bold text-[#3483fa]">{formatCurrency(preco)}</span>
                <span className={`text-[10px] font-medium ${lucro >= 0 ? 'text-[#00a650]' : 'text-[#f23d4f]'}`}>
                  Lucro: {formatCurrency(lucro)}
                </span>
              </button>
            )
          })}
        </div>
        {loadingFees && <p className="text-xs text-[#999] mt-2 text-center animate-pulse">Consultando taxas nas APIs oficiais...</p>}
      </div>
    </div>
  )
}

export default function MarginCalculator({ open, onClose }: MarginCalculatorProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'simulador' | 'produtos' | 'comparar'>('simulador')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  if (!open) return null

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    setActiveTab('simulador')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" ref={overlayRef}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" onClick={onClose} />

      <div className="relative bg-white rounded-2xl w-[calc(100%-24px)] md:w-[90vw] md:max-w-4xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col overflow-hidden max-h-[90vh]">
        
        
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-4 py-3 border-b border-[#e6e6e6] flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-[#333] flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#3483fa]" />
              Precificação Inteligente
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-[#f5f5f5] text-[#999] flex items-center justify-center transition-colors"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#e6e6e6] px-4 flex gap-0 overflow-x-auto">
          <TabButton active={activeTab === 'simulador'} onClick={() => setActiveTab('simulador')} icon={TrendingUp} label="Simulador Avançado" />
          <TabButton active={activeTab === 'produtos'} onClick={() => setActiveTab('produtos')} icon={Package} label="Meus Produtos" />
          <TabButton active={activeTab === 'comparar'} onClick={() => setActiveTab('comparar')} icon={Search} label="Comparar APIs" />
        </div>

        {/* Tab Content */}
        <div className="p-4 overflow-y-auto">
          {activeTab === 'simulador' && <SimulatorTab initialProduct={selectedProduct} />}
          {activeTab === 'produtos' && <ProductsTab onSelectProduct={handleSelectProduct} />}
          {activeTab === 'comparar' && <CompareTab />}
        </div>
      </div>
    </div>
  )
}
