'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, Calculator, TrendingUp, Search, Package, Info, Share2, Send, CheckCircle2, ChevronDown, ChevronUp, Sparkles, DollarSign, Check } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { MarketplaceLogo } from './MarketplaceLogos'
import BasicCalculatorPopup from './BasicCalculatorPopup'
import { useInternalChat, getDirectConvId } from '@/contexts/InternalChatContext'

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
      className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 sm:py-1.5 rounded-lg text-xs sm:text-[13px] font-semibold transition-all cursor-pointer select-none ${
        active
          ? 'bg-white text-[#0071e3] shadow-xs'
          : 'text-[#666666] hover:text-[#111111]'
      }`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  )
}



function SimulatorTab({ initialProduct, onShare }: { initialProduct?: Product | null; onShare: (summary: string) => void }) {
  const [custo, setCusto] = useState(40)
  const [freteLogistica, setFreteLogistica] = useState(0)
  const [embalagem, setEmbalagem] = useState(0)
  
  const [margemLiquida, setMargemLiquida] = useState(30)
  const [imposto, setImposto] = useState(6)
  const [publicidade, setPublicidade] = useState(0)
  const [reserva, setReserva] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  
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
        
        if (firstMod) {
          setComissaoMkt(firstMod.comissao)
          setJuros(firstMod.juros)
        }
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

  // Cenário de Maior Margem (ex: +15% de margem ou 45%)
  const margemAltaPct = Math.min(margemLiquida + 15, 60)
  const sumPctAlta = (margemAltaPct + imposto + publicidade + juros + reserva + comissaoMkt) / 100
  const precoAlto = sumPctAlta < 1 ? (custoBaseFixo + finalFrete + finalTarifa) / (1 - sumPctAlta) : 0
  const lucroAlto = precoAlto > 0 ? precoAlto * (margemAltaPct / 100) : 0

  const custoFixo = custoBaseFixo + finalFrete + finalTarifa
  const valImposto = precoSugerido * (imposto / 100)
  const valComissao = precoSugerido * (comissaoMkt / 100)
  const valPublicidade = precoSugerido * (publicidade / 100)
  const valReserva = precoSugerido * (reserva / 100)
  const valJuros = precoSugerido * (juros / 100)
  
  const outrosCustosVal = freteLogistica + embalagem + finalFrete + finalTarifa + valPublicidade + valReserva + valJuros
  const custoTotal = custoFixo + valImposto + valComissao + valPublicidade + valReserva + valJuros
  const lucroLiq = precoSugerido - custoTotal
  const repasseMkt = precoSugerido - finalTarifa - valComissao - finalFrete

  const activeMpConfig = MARKETPLACE_CONFIG.find(m => m.id === selectedMktId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 lg:gap-8 items-start">
      {/* Coluna Esquerda: Entradas de Dados */}
      <div className="lg:col-span-6 space-y-5">
        {initialProduct && (
          <div className="bg-[#fafafa] border border-[#e2e8f0] rounded-xl px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Package className="w-4 h-4 text-[#0071e3]" />
              <span className="text-xs font-semibold text-[#111111]">Produto carregado: {initialProduct.name}</span>
            </div>
          </div>
        )}

        <div>
          <h3 className="text-[11px] sm:text-[12.5px] font-semibold text-[#111111] mb-2 flex items-center justify-between">
            <span></span>
            {selectedMktId && (
              <span className="text-[10px] font-medium text-[#16a34a] bg-[#ecfdf5] border border-[#bbf7d0] px-2 py-0.5 rounded-full flex items-center gap-1">
                <Info className="w-3 h-3"/> {activeMpConfig?.name}
              </span>
            )}
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {MARKETPLACE_CONFIG.map(mp => (
              <button
                key={mp.id}
                title={mp.name}
                onClick={() => handleSelectMkt(mp.id)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  selectedMktId === mp.id 
                    ? 'border-[#0071e3] bg-[#0071e3]/10 text-[#0071e3] ring-1 ring-[#0071e3] font-semibold shadow-2xs' 
                    : 'border-[#e6e6e6] bg-white text-[#333333] hover:border-[#111111] hover:bg-[#fafafa]'
                }`}
              >
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <MarketplaceLogo name={mp.name} className="w-5 h-5" />
                </div>
                <span className="text-[12px] font-medium whitespace-nowrap">{mp.name}</span>
              </button>
            ))}
          </div>

          {activeMpConfig && activeMpConfig.modalities.length > 1 && (
            <div className="mt-2 bg-[#f8f9fa] p-2 rounded-xl border border-[#e6e6e6] flex flex-wrap gap-1.5">
              <span className="text-[10.5px] font-semibold text-[#666666] w-full mb-0.5">Modalidade:</span>
              {activeMpConfig.modalities.map(mod => (
                <button
                  key={mod.id}
                  onClick={() => handleSelectModality(mod.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors border cursor-pointer ${
                    selectedModalityId === mod.id
                      ? 'bg-white border-[#0071e3] text-[#0071e3] shadow-none font-semibold'
                      : 'bg-transparent border-transparent text-[#666] hover:bg-[#eef2f6]'
                  }`}
                >
                  {mod.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Custos (R$) */}
        <div className="space-y-1.5">
          <h3 style={{ fontSize: '16px', lineHeight: '1.25' }} className="text-[16px] sm:text-[16px] font-semibold sm:font-bold text-[#888888] uppercase tracking-wider">Custos (R$)</h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10.5px] font-medium text-[#666666] mb-1">Produto</label>
              <input type="number" inputMode="decimal" value={custo || ''} onChange={e => setCusto(+e.target.value)} className="w-full h-[36px] border border-[#e6e6e6] rounded-lg px-2.5 text-[13px] outline-none focus:border-[#0071e3] transition-colors text-[#111111] bg-white" />
            </div>
            <div>
              <label className="block text-[10.5px] font-medium text-[#666666] mb-1">Frete</label>
              <input type="number" inputMode="decimal" value={freteLogistica || ''} onChange={e => setFreteLogistica(+e.target.value)} className="w-full h-[36px] border border-[#e6e6e6] rounded-lg px-2.5 text-[13px] outline-none focus:border-[#0071e3] transition-colors text-[#111111] bg-white" />
            </div>
            <div>
              <label className="block text-[10.5px] font-medium text-[#666666] mb-1">Embalagem</label>
              <input type="number" inputMode="decimal" value={embalagem || ''} onChange={e => setEmbalagem(+e.target.value)} className="w-full h-[36px] border border-[#e6e6e6] rounded-lg px-2.5 text-[13px] outline-none focus:border-[#0071e3] transition-colors text-[#111111] bg-white" />
            </div>
            <div>
              <label className="block text-[10.5px] font-medium text-[#666666] mb-1">Frete MKT</label>
              <input type="number" inputMode="decimal" value={freteMarketplace || ''} onChange={e => setFreteMarketplace(+e.target.value)} className="w-full h-[36px] border border-[#e6e6e6] rounded-lg px-2.5 text-[13px] outline-none focus:border-[#0071e3] transition-colors text-[#111111] bg-white" />
            </div>
            <div>
              <label className="block text-[10.5px] font-medium text-[#666666] mb-1">Tarifa Fixa</label>
              <input type="number" inputMode="decimal" value={tarifaFixa || ''} onChange={e => setTarifaFixa(+e.target.value)} className="w-full h-[36px] border border-[#e6e6e6] rounded-lg px-2.5 text-[13px] outline-none focus:border-[#0071e3] transition-colors text-[#111111] bg-white" />
            </div>
          </div>
        </div>

        {/* Variáveis (%) */}
        <div className="space-y-1.5">
          <h3 style={{ fontSize: '16px', lineHeight: '1.25' }} className="text-[16px] sm:text-[16px] font-semibold sm:font-bold text-[#888888] uppercase tracking-wider">Variáveis (%)</h3>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-[10.5px] font-bold text-[#0071e3] mb-1">Margem</label>
              <input type="number" inputMode="decimal" value={margemLiquida || ''} onChange={e => setMargemLiquida(+e.target.value)} className="w-full h-[36px] border-2 border-[#0071e3] rounded-lg px-2.5 text-[13px] font-semibold outline-none transition-colors text-[#111111] bg-white" />
            </div>
            <div>
              <label className="block text-[10.5px] font-medium text-[#666666] mb-1">Imposto</label>
              <input type="number" inputMode="decimal" value={imposto || ''} onChange={e => setImposto(+e.target.value)} className="w-full h-[36px] border border-[#e6e6e6] rounded-lg px-2.5 text-[13px] outline-none focus:border-[#0071e3] transition-colors text-[#111111] bg-white" />
            </div>
            <div>
              <label className="block text-[10.5px] font-medium text-[#666666] mb-1">Comissão</label>
              <input type="number" inputMode="decimal" value={comissaoMkt || ''} onChange={e => setComissaoMkt(+e.target.value)} className="w-full h-[36px] border border-[#e6e6e6] rounded-lg px-2.5 text-[13px] outline-none focus:border-[#0071e3] transition-colors text-[#111111] bg-white" />
            </div>
            <div>
              <label className="block text-[10.5px] font-medium text-[#666666] mb-1">Ads</label>
              <input type="number" inputMode="decimal" value={publicidade || ''} onChange={e => setPublicidade(+e.target.value)} className="w-full h-[36px] border border-[#e6e6e6] rounded-lg px-2.5 text-[13px] outline-none focus:border-[#0071e3] transition-colors text-[#111111] bg-white" />
            </div>
            <div>
              <label className="block text-[10.5px] font-medium text-[#666666] mb-1">Juros</label>
              <input type="number" inputMode="decimal" value={juros || ''} onChange={e => setJuros(+e.target.value)} className="w-full h-[36px] border border-[#e6e6e6] rounded-lg px-2.5 text-[13px] outline-none focus:border-[#0071e3] transition-colors text-[#111111] bg-white" />
            </div>
            <div>
              <label className="block text-[10.5px] font-medium text-[#666666] mb-1">Reserva</label>
              <input type="number" inputMode="decimal" value={reserva || ''} onChange={e => setReserva(+e.target.value)} className="w-full h-[36px] border border-[#e6e6e6] rounded-lg px-2.5 text-[13px] outline-none focus:border-[#0071e3] transition-colors text-[#111111] bg-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Painel de Decisão */}
      <div className="lg:col-span-6 bg-[#f8f9fa] rounded-2xl p-4 sm:p-5 border border-[#e6e6e6] flex flex-col justify-between gap-2.5">
        {sumPct >= 1 ? (
          <div className="p-4 text-center text-[#dc2626] font-medium text-sm flex-1 flex items-center justify-center">
            Margem inatingível (&gt;=100%)
          </div>
        ) : (
          <div className="space-y-2.5 flex-1 flex flex-col justify-between">
            {/* Resumo direto */}
            <div className="bg-[#ecfdf5] border border-[#bbf7d0] rounded-xl p-2.5 flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-[#16a34a] text-white flex items-center justify-center shrink-0">
                <Check className="w-3 h-3" />
              </div>
              <p className="text-[10px] font-semibold text-[#15803d] leading-snug">
                Venda: <span className="underline decoration-2">{formatCurrency(precoSugerido)}</span> · Lucro: <span className="underline decoration-2">{formatCurrency(lucroLiq)}</span>
              </p>
            </div>

            {/* Preço e Lucro */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-white border border-[#e6e6e6] rounded-xl p-3 shadow-none">
                <span className="text-[9.5px] font-semibold uppercase tracking-wider text-[#777777]">Preço de Venda</span>
                <p className="text-xl font-bold text-[#111111] mt-0.5 tracking-tight">{formatCurrency(precoSugerido)}</p>
              </div>
              <div className="bg-[#16a34a] text-white rounded-xl p-3 shadow-none">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-semibold uppercase tracking-wider text-emerald-100">Lucro Real</span>
                  <span className="text-[9.5px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">{margemLiquida}%</span>
                </div>
                <p className="text-xl font-bold mt-0.5 tracking-tight">{formatCurrency(lucroLiq)}</p>
              </div>
            </div>

            {/* Custos resumidos */}
            <div className="bg-white rounded-xl border border-[#e6e6e6] p-3 shadow-none space-y-1">
              <div className="flex items-center justify-between pb-1 border-b border-[#f0f0f0]">
                <span className="text-[10.5px] font-bold text-[#111111] uppercase tracking-wider">Custos Totais</span>
                <span className="text-xs font-bold text-[#111111]">{formatCurrency(custoTotal)}</span>
              </div>
              <div className="space-y-0.5 text-[10.5px] text-[#666666]">
                <div className="flex justify-between"><span>Produto</span><span className="font-medium text-[#111111]">{formatCurrency(custo)}</span></div>
                <div className="flex justify-between"><span>Comissão ({comissaoMkt}%)</span><span className="font-medium text-[#111111]">{formatCurrency(valComissao)}</span></div>
                <div className="flex justify-between"><span>Imposto ({imposto}%)</span><span className="font-medium text-[#111111]">{formatCurrency(valImposto)}</span></div>
                <div className="flex justify-between"><span>Outros</span><span className="font-medium text-[#111111]">{formatCurrency(outrosCustosVal)}</span></div>
              </div>
            </div>

            {/* Cenários */}
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[#888888] mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#111111]" /> Cenários
              </p>
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white border border-[#e6e6e6] rounded-xl p-2.5 sm:p-3 text-center shadow-none">
                  <span className="text-[10px] font-semibold text-[#888888] block">Mínimo</span>
                  <span className="text-[13px] sm:text-[13.5px] font-bold text-[#333333] block mt-0.5">{formatCurrency(precoMinimo)}</span>
                  <span className="text-[9.5px] font-medium text-[#999999] block mt-0.5">Lucro: R$ 0</span>
                </div>
                <div className="bg-white border-2 border-[#111111] rounded-xl p-2.5 sm:p-3 text-center shadow-none relative">
                  <span className="text-[8.5px] font-black text-white bg-[#111111] px-2 py-0.5 rounded-full absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap">Ideal</span>
                  <span className="text-[10px] font-bold text-[#111111] block">Recomendado</span>
                  <span className="text-[13px] sm:text-[13.5px] font-extrabold text-[#111111] block mt-0.5">{formatCurrency(precoSugerido)}</span>
                  <span className="text-[10px] sm:text-[10.5px] font-bold text-[#16a34a] block mt-0.5">{formatCurrency(lucroLiq)}</span>
                </div>
                <div className="bg-white border border-[#e6e6e6] rounded-xl p-2.5 sm:p-3 text-center shadow-none">
                  <span className="text-[10px] font-semibold text-[#888888] block">+ Margem</span>
                  <span className="text-[13px] sm:text-[13.5px] font-bold text-[#333333] block mt-0.5">{formatCurrency(precoAlto)}</span>
                  <span className="text-[10px] sm:text-[10.5px] font-bold text-[#16a34a] block mt-0.5">{formatCurrency(lucroAlto)}</span>
                </div>
              </div>
            </div>

            {/* Detalhamento colapsável */}
            <div className="border-t border-[#e6e6e6] pt-1">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full flex items-center justify-between py-0.5 text-[10.5px] font-semibold text-[#666666] hover:text-[#111111] transition-colors cursor-pointer"
              >
                <span>Ver detalhamento</span>
                {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showDetails && (
                <div className="mt-1.5 p-2.5 bg-white rounded-xl border border-[#e6e6e6] space-y-1 text-[10.5px] animate-in fade-in duration-150 max-h-40 overflow-y-auto">
                  <ResultCard label="Custo do Produto" value={formatCurrency(custo)} />
                  <ResultCard label="Comissão MKT" value={formatCurrency(valComissao)} />
                  <ResultCard label="Tarifa Fixa" value={formatCurrency(finalTarifa)} />
                  <ResultCard label="Imposto" value={formatCurrency(valImposto)} />
                  <ResultCard label="Publicidade (Ads)" value={formatCurrency(valPublicidade)} />
                  <ResultCard label="Reserva Devolução" value={formatCurrency(valReserva)} />
                  <ResultCard label="Juros" value={formatCurrency(valJuros)} />
                  <ResultCard label="Embalagem" value={formatCurrency(embalagem)} />
                  <ResultCard label="Frete Fornecedor" value={formatCurrency(freteLogistica)} />
                  <ResultCard label="Frete Marketplace" value={formatCurrency(finalFrete)} />
                  <div className="border-t border-[#eeeeee] my-1" />
                  <div className="bg-[#f8f9fa] p-2 rounded-lg border border-[#e6e6e6]">
                    <div className="flex justify-between items-center text-[10.5px] font-semibold text-[#111111]">
                      <span>Repasse do Marketplace</span>
                      <span className="text-[#16a34a] font-bold">{formatCurrency(repasseMkt)}</span>
                    </div>
                    <p className="text-[9.5px] text-[#888888] mt-0.5 leading-relaxed">
                      Valor depositado na conta (Preço - Tarifas/Frete MKT). Repasse não é o lucro líquido final.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Compartilhar (Desktop) */}
            <div className="pt-1 hidden lg:block">
              <button
                onClick={() => {
                  const summary =
                    `*PRECIFICAÇÃO INTELIGENTE — SIMULAÇÃO*

PREÇO DE VENDA: ${formatCurrency(precoSugerido)}

CUSTOS TOTAIS: ${formatCurrency(custoTotal)}
- Produto: ${formatCurrency(custo)}
- Comissão MKT (${comissaoMkt}%): ${formatCurrency(valComissao)}
- Imposto (${imposto}%): ${formatCurrency(valImposto)}
- Outros Custos: ${formatCurrency(outrosCustosVal)}

━━━━━━━━━━━━━━━━━━━━
MEU LUCRO REAL: ${formatCurrency(lucroLiq)} (Margem: ${margemLiquida}%)
━━━━━━━━━━━━━━━━━━━━
Vendendo por ${formatCurrency(precoSugerido)}, você ganha ${formatCurrency(lucroLiq)} por venda.`
                  onShare(summary)
                }}
                className="w-full h-[38px] flex items-center justify-center gap-2 px-4 bg-[#0071e3] hover:bg-[#0062c4] active:bg-[#004f9e] text-white text-[13.5px] font-semibold rounded-lg transition-all cursor-pointer shadow-none"
              >
                <Share2 className="w-3.5 h-3.5" />
                Compartilhar Precificação
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Barra Fixa Inferior no Mobile (visível apenas em telas menores < lg) */}
      <div className="lg:hidden sticky -bottom-8 sm:-bottom-9 -mx-4 sm:-mx-8 bg-white/95 backdrop-blur-md border-t border-[#e6e6e6] px-4 pt-4 pb-2.5 flex items-center justify-between gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] z-20">
        <div className="flex flex-col min-w-0">
          <span className="text-[9.5px] font-semibold text-[#888888] uppercase tracking-wider">Venda / Lucro</span>
          <div className="flex items-baseline gap-1.5 truncate">
            <span className="text-[21px] font-extrabold text-[#111111] tracking-[-0.02em]">{formatCurrency(precoSugerido)}</span>
            <span className="text-[11px] font-bold text-[#16a34a]">+{formatCurrency(lucroLiq)} ({margemLiquida}%)</span>
          </div>
        </div>
        <button
          onClick={() => {
            const summary =
              `*PRECIFICAÇÃO INTELIGENTE — SIMULAÇÃO*

PREÇO DE VENDA: ${formatCurrency(precoSugerido)}

CUSTOS TOTAIS: ${formatCurrency(custoTotal)}
- Produto: ${formatCurrency(custo)}
- Comissão MKT (${comissaoMkt}%): ${formatCurrency(valComissao)}
- Imposto (${imposto}%): ${formatCurrency(valImposto)}
- Outros Custos: ${formatCurrency(outrosCustosVal)}

━━━━━━━━━━━━━━━━━━━━
MEU LUCRO REAL: ${formatCurrency(lucroLiq)} (Margem: ${margemLiquida}%)
━━━━━━━━━━━━━━━━━━━━
Vendendo por ${formatCurrency(precoSugerido)}, você ganha ${formatCurrency(lucroLiq)} por venda.`
            onShare(summary)
          }}
          aria-label="Compartilhar precificação"
          title="Compartilhar precificação"
          className="h-[38px] w-[42px] px-0 flex items-center justify-center bg-[#0071e3] hover:bg-[#0062c4] active:bg-[#004f9e] text-white rounded-lg transition-all cursor-pointer shrink-0 shadow-sm"
        >
          <Share2 className="w-4 h-4" />
        </button>
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
    <div className="space-y-6 h-full">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
        <input
          type="text"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Buscar produto por nome para puxar os custos..."
          className="w-full h-[42px] border border-[#e6e6e6] rounded-xl pl-10 pr-3.5 text-[13.5px] outline-none focus:border-[#0071e3] transition-colors text-[#111111] bg-white placeholder:text-[#999999]"
        />
        {showDropdown && products.length > 0 && (
          <div className="absolute top-full mt-1.5 w-full bg-white border border-[#e6e6e6] rounded-xl shadow-lg z-20 max-h-64 overflow-y-auto">
            {products.map(p => (
              <button key={p.id} onClick={() => { onSelectProduct(p); setShowDropdown(false) }} className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-[#fafafa] text-left transition-colors border-b border-[#f0f0f0] last:border-0 cursor-pointer">
                {p.product_images?.[0]?.url ? (
                  <img src={p.product_images[0].url} alt={p.name} className="w-9 h-9 rounded-lg object-contain border border-[#e6e6e6] bg-white p-0.5" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-[#f5f5f5] border border-[#e6e6e6] flex items-center justify-center"><Package className="w-4 h-4 text-[#999]" /></div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-[#111111] truncate">{p.name}</p>
                  <p className="text-[11px] text-[#777777]">SKU: {p.sku} · Estoque: {p.stock}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-[#16a34a]">{formatCurrency(p.cost_purchase || 0)}</p>
                  <p className="text-[10px] text-[#999999]">Custo</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="bg-[#fafafa] border border-[#e6e6e6] rounded-2xl p-8 text-center">
        <Package className="w-10 h-10 text-[#999999] mx-auto mb-3 opacity-60" />
        <h4 className="text-[14px] font-semibold text-[#111111] mb-1">Pesquise um produto</h4>
        <p className="text-xs text-[#666666] max-w-sm mx-auto leading-relaxed">Ao selecionar um produto, ele será automaticamente carregado no Simulador Avançado para que você faça a engenharia reversa do preço.</p>
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
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-[#666666] mb-1.5 uppercase tracking-wider">Custo Fornecedor</label>
          <input type="number" value={custo || ''} onChange={e => setCusto(+e.target.value)} className="w-full h-[40px] border border-[#e6e6e6] rounded-xl px-3 text-[13.5px] outline-none focus:border-[#0071e3] transition-colors text-[#111111] bg-white" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-[#666666] mb-1.5 uppercase tracking-wider">Margem Líquida (%)</label>
          <input type="number" value={margemLiquida || ''} onChange={e => setMargemLiquida(+e.target.value)} className="w-full h-[40px] border border-[#e6e6e6] rounded-xl px-3 text-[13.5px] outline-none focus:border-[#0071e3] transition-colors text-[#111111] bg-white" />
        </div>
      </div>

      <div>
        <h4 className="text-[13px] font-semibold text-[#666666] mb-3 flex items-center justify-between gap-2">
          <span>Comparar preços</span>
          <span className="text-[#0071e3] font-semibold cursor-pointer hover:underline text-[11px] whitespace-nowrap" onClick={loadAllFees}>Atualizar taxas</span>
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-[#e6e6e6] hover:border-[#1f2328] hover:bg-[#f5f5f5]/30 transition-all text-center relative"
              >
                {mp.id === 'mercado_livre' && (
                  <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-500 animate-pulse" title="API Sincronizada"></div>
                )}
                <MarketplaceLogo name={mp.name} className="w-6 h-6" />
                <span className="text-[10px] font-medium text-[#666]">{mp.name}</span>
                <span className="text-[10px] text-[#999]">Taxa {comissaoMkt}%</span>
                <span className="text-xs font-bold text-[#1f2328]">{formatCurrency(preco)}</span>
                <span className={`text-[10px] font-medium ${lucro >= 0 ? 'text-[#00a650]' : 'text-[#f23d4f]'}`}>
                  Lucro {formatCurrency(lucro)}
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

// Share Modal Component
function SharePricingModal({ summary, onClose }: { summary: string; onClose: () => void }) {
  const { collaborators, conversations, sendMessage, createConversation, currentUser, setIsFloatingOpen, setIsFloatingMinimized, setActiveConversation } = useInternalChat()
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [note, setNote] = useState('')

  // Show only direct collaborators (not self) + groups
  const targets = [
    ...collaborators
      .filter(c => c.id !== currentUser?.id)
      .map(c => ({ id: `colab:${c.id}`, label: c.name, sublabel: c.role || 'Colaborador', type: 'DIRECT' as const, colabId: c.id, online: c.online })),
    ...conversations
      .filter(c => c.type === 'GROUP')
      .map(c => ({ id: `conv:${c.id}`, label: c.name, sublabel: 'Grupo', type: 'GROUP' as const, convId: c.id, online: false }))
  ]

  const handleSend = async () => {
    if (!selectedTarget) return
    setSending(true)
    try {
      const fullMessage = note
        ? `${note}\n\n${summary}`
        : summary

      const target = targets.find(t => t.id === selectedTarget)
      if (!target) return

      let convId: string
      let activeTargetConv: any = null

      if (target.type === 'DIRECT' && 'colabId' in target) {
        const myId = currentUser?.id || '3af9068a-4b78-4c9c-8657-f83b93c01588'
        convId = getDirectConvId(myId, target.colabId)

        activeTargetConv = conversations.find(c => c.id === convId || (c.type === 'DIRECT' && c.members?.some(m => m.id === target.colabId)))
        if (!activeTargetConv) {
          const colab = collaborators.find(c => c.id === target.colabId)
          activeTargetConv = await createConversation(colab?.name || target.label, 'DIRECT', [target.colabId], convId)
        }
        if (activeTargetConv) convId = activeTargetConv.id
      } else if ('convId' in target) {
        convId = target.convId
        activeTargetConv = conversations.find(c => c.id === convId)
      } else return

      if (activeTargetConv) {
        setActiveConversation(activeTargetConv)
      }

      setIsFloatingOpen(true)
      setIsFloatingMinimized(false)

      await sendMessage(convId, fullMessage)

      setSent(true)
      setTimeout(onClose, 1200)
    } catch (err) {
      console.error('Erro ao enviar precificação:', err)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-2xl w-full max-w-md shadow-[0_16px_64px_rgba(0,0,0,0.16)] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#eeeeee]">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-[#f5f5f5] flex items-center justify-center">
              <Share2 className="w-4 h-4 text-[#1f2328]" />
            </span>
            <div>
              <h3 className="font-bold text-[14px] text-[#1f2328]">Compartilhar Precificação</h3>
              <p className="text-[11px] text-[#666]">Envie o resultado para um colaborador ou grupo</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#f5f5f5] flex items-center justify-center text-[#999] hover:text-[#555] transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target selection */}
        <div className="px-5 py-4 space-y-3 max-h-64 overflow-y-auto">
          <p className="text-[11px] font-bold text-[#999] uppercase tracking-wider">Enviar para:</p>
          {targets.length === 0 && (
            <p className="text-sm text-[#999] text-center py-4">Nenhum colaborador disponível</p>
          )}
          {targets.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTarget(t.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer text-left ${
                selectedTarget === t.id
                  ? 'border-[#1f2328] bg-[#f5f5f5] shadow-xs'
                  : 'border-[#eeeeee] hover:border-[#e6e6e6] hover:bg-[#f5f5f5]'
              }`}
            >
              <div className="relative shrink-0">
                <div className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center text-[13px] font-bold text-[#333]">
                  {t.label.slice(0, 1).toUpperCase()}
                </div>
                {t.type === 'DIRECT' && (
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${'online' in t && t.online ? 'bg-[#16a34a]' : 'bg-[#cbd5e1]'}`} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] text-[#1f2328] truncate">{t.label}</p>
                <p className="text-[11px] text-[#666]">{t.sublabel}</p>
              </div>
              {selectedTarget === t.id && <CheckCircle2 className="w-4 h-4 text-[#1f2328] shrink-0" />}
            </button>
          ))}
        </div>

        {/* Optional note */}
        <div className="px-5 pb-4">
          <label className="block text-[11px] font-bold text-[#999] uppercase tracking-wider mb-1.5">Mensagem adicional (opcional)</label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ex: Segue a simulação que fizemos para esse produto..."
            rows={2}
            className="w-full border border-[#e6e6e6] rounded-xl px-3 py-2 text-sm text-[#1f2328] placeholder:text-[#999] resize-none focus:outline-none focus:border-[#1f2328] transition-colors"
          />
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex items-center gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm font-bold text-[#666] border border-[#e6e6e6] rounded-xl hover:bg-[#f5f5f5] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            disabled={!selectedTarget || sending || sent}
            className={`flex-1 py-2.5 text-sm font-bold text-white rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer ${
              sent ? 'bg-[#16a34a]' : 'bg-[#111111] hover:bg-[#222222]'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {sent ? (
              <><CheckCircle2 className="w-4 h-4" /> Enviado!</>
            ) : sending ? (
              <span className="animate-pulse">Enviando...</span>
            ) : (
              <><Send className="w-4 h-4" /> Enviar no Chat</>  
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function MarginCalculator({ open, onClose }: MarginCalculatorProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [activeTab, setActiveTab] = useState<'simulador' | 'produtos' | 'comparar'>('simulador')
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [calcOpen, setCalcOpen] = useState(false)
  const [shareSummary, setShareSummary] = useState<string | null>(null)

  if (!open) return null

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product)
    setActiveTab('simulador')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" ref={overlayRef}>
      <div className="absolute inset-0 bg-slate-900/65 backdrop-blur-[4px]" onClick={onClose} />

      <div className="relative bg-white rounded-2xl border border-[#e6e6e6] w-full max-w-5xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col overflow-hidden max-h-[88vh] p-4 sm:p-6">
        
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 px-4 sm:px-8 py-3.5 sm:py-4 border-b border-[#e6e6e6] flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-[14px] sm:text-[16.5px] font-semibold text-[#111111] flex items-center gap-2.5">
              <Calculator className="w-4 h-4 text-[#0071e3]" />
              Precificação Inteligente
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCalcOpen(!calcOpen)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors border border-transparent cursor-pointer ${calcOpen ? 'bg-[#f5f5f5] text-[#111] border-[#111]' : 'hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#111]'}`}
              title="Abrir Calculadora Básica"
            >
              <Calculator className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] hover:text-[#111] flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#e6e6e6] px-4 sm:px-8 py-4 sm:py-5 flex items-center justify-start bg-white shrink-0">
          <div className="bg-[#f0f2f5] p-1 rounded-xl flex items-center w-full sm:w-auto gap-1">
            <TabButton active={activeTab === 'simulador'} onClick={() => setActiveTab('simulador')} icon={TrendingUp} label="Simulador" />
            <TabButton active={activeTab === 'produtos'} onClick={() => setActiveTab('produtos')} icon={Package} label="Produtos" />
            <TabButton active={activeTab === 'comparar'} onClick={() => setActiveTab('comparar')} icon={Search} label="Comparar" />
          </div>
        </div>

        {/* Tab Content */}
        <div className="px-4 sm:px-8 py-4 sm:py-5 overflow-y-auto lg:overflow-y-hidden max-h-[calc(88vh-115px)] flex-1">
          {activeTab === 'simulador' && <SimulatorTab initialProduct={selectedProduct} onShare={setShareSummary} />}
          {activeTab === 'produtos' && <ProductsTab onSelectProduct={handleSelectProduct} />}
          {activeTab === 'comparar' && <CompareTab />}
        </div>
      </div>
      {calcOpen && <BasicCalculatorPopup onClose={() => setCalcOpen(false)} initialPosition={{ x: typeof window !== 'undefined' ? window.innerWidth - 300 : 800, y: 150 }} />}
      {shareSummary && <SharePricingModal summary={shareSummary} onClose={() => setShareSummary(null)} />}
    </div>
  )
}
