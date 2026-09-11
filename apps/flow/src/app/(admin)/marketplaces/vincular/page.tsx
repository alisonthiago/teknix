'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertCircle, Link2, PlusCircle, EyeOff, RefreshCw, Layers, ExternalLink, Package } from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

function formatBRL(val: number) {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface PendingMatch {
  id: string
  channel: string
  external_id: string
  seller_sku: string | null
  title: string
  price: number
  stock: number
  gtin: string | null
  brand: string | null
  model: string | null
  thumbnail_url: string | null
  permalink: string | null
  suggested_product_id: string | null
  confidence_score: number
  match_reason: string | null
  created_at: string
  suggested_product?: {
    id: string
    name: string
    sku: string
    brand: string
    model: string
    ean: string
    image_url: string | null
    stock: number
    cost_purchase: number
  } | null
}

export default function VincularPage() {
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<PendingMatch[]>([])
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ id: string; text: string; type: 'success' | 'error' } | null>(null)

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketplaces/match')
      const data = await res.json()
      if (res.ok) {
        setItems(data.pending || [])
      }
    } catch (err) {
      console.error('Erro ao carregar itens pendentes:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleAction = async (matchId: string, action: 'LINK' | 'CREATE_NEW' | 'IGNORE', targetProductId?: string) => {
    setActionLoadingId(matchId)
    setFeedback(null)
    try {
      const res = await fetch('/api/marketplaces/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId, action, targetProductId })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Erro ao processar ação')

      setFeedback({
        id: matchId,
        text: json.message || 'Operação realizada com sucesso!',
        type: 'success'
      })

      setTimeout(() => {
        setItems(prev => prev.filter(i => i.id !== matchId))
        setFeedback(null)
      }, 1000)
    } catch (err: any) {
      setFeedback({
        id: matchId,
        text: err.message || 'Falha ao executar ação',
        type: 'error'
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/operacao" className="text-xs text-[#64748b] hover:text-[#0f172a] flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Operação
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#0f172a] tracking-tight">
            Anúncios para Vincular ao Catálogo
          </h1>
          <p className="text-xs text-[#64748b] mt-0.5">
            Motor Anti-Duplicação: Garanta que múltiplos anúncios apontem para 1 único produto físico central.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="px-4 py-2 bg-white border border-[#cbd5e1] hover:bg-[#f8fafc] text-xs font-bold text-[#0f172a] rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar Fila
        </button>
      </div>

      {/* Regra de Arquitetura */}
      <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-4 sm:p-5 shadow-2xs">
        <div className="flex items-start gap-3">
          <Layers className="w-5 h-5 text-[#2563eb] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-extrabold text-[#0f172a]">
              Como funciona a Vinculação Inteligente
            </h4>
            <p className="text-xs text-[#64748b] leading-relaxed">
              Quando novos anúncios são importados do Mercado Livre, Shopee ou outros canais, o sistema busca correspondência por <strong>Código de Barras (EAN/GTIN)</strong>, <strong>SKU</strong> ou <strong>Catalog ID</strong>. Casos que geraram dúvida (confiança &lt; 90%) aparecem nesta lista para sua conferência antes de qualquer decisão.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Pendências */}
      {loading ? (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-12 text-center text-xs text-[#64748b] flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-[#0f172a]" />
          Carregando anúncios pendentes...
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-[#e2e8f0] rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0] flex items-center justify-center mx-auto mb-3">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-extrabold text-[#0f172a]">Nenhum Anúncio Pendente de Vinculação</h3>
          <p className="text-xs text-[#64748b] mt-1 max-w-md mx-auto">
            Todos os anúncios dos marketplaces estão devidamente mapeados e associados ao catálogo central de produtos.
          </p>
          <div className="mt-5">
            <Link
              href="/operacao"
              className="px-4 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-2"
            >
              Ir para Catálogo de Produtos
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-xs font-bold text-[#64748b] px-1">
            {items.length} {items.length === 1 ? 'anúncio aguardando' : 'anúncios aguardando'} decisão:
          </div>

          {items.map(item => {
            const isLoading = actionLoadingId === item.id
            const candidate = item.suggested_product

            return (
              <div
                key={item.id}
                className="bg-white border border-[#e2e8f0] rounded-2xl p-5 shadow-xs transition-all hover:border-[#cbd5e1]"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Coluna Esquerda: Anúncio Externo Detectado */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MarketplaceLogo name={item.channel === 'mercadolivre' ? 'Mercado Livre' : item.channel} className="w-5 h-5" />
                        <span className="text-xs font-bold text-[#0f172a] uppercase tracking-wider">
                          Anúncio Externo ({item.channel})
                        </span>
                      </div>
                      <span className="text-xs font-mono bg-[#f1f5f9] px-2 py-0.5 rounded text-[#475569] font-bold">
                        {item.external_id}
                      </span>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] flex items-center justify-center shrink-0 overflow-hidden">
                        {item.thumbnail_url ? (
                          <img src={item.thumbnail_url} alt="" className="w-full h-full object-contain p-1" />
                        ) : (
                          <Package className="w-6 h-6 text-[#94a3b8]" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-[#0f172a] leading-snug">
                          {item.title}
                        </h4>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#64748b] mt-1.5 font-mono">
                          {item.seller_sku && <span>SKU: <strong>{item.seller_sku}</strong></span>}
                          {item.gtin && <span>EAN: <strong>{item.gtin}</strong></span>}
                          {item.brand && <span className="font-sans">Marca: <strong>{item.brand}</strong></span>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#f1f5f9]">
                      <div className="p-2.5 bg-[#f8fafc] rounded-xl">
                        <div className="text-[10px] text-[#64748b] uppercase font-bold">Preço do Anúncio</div>
                        <div className="text-sm font-black text-[#0f172a] mt-0.5">{formatBRL(item.price)}</div>
                      </div>
                      <div className="p-2.5 bg-[#f8fafc] rounded-xl">
                        <div className="text-[10px] text-[#64748b] uppercase font-bold">Estoque no Canal</div>
                        <div className="text-sm font-bold text-[#0f172a] mt-0.5">{item.stock} un</div>
                      </div>
                      <div className="p-2.5 bg-[#f8fafc] rounded-xl col-span-2 sm:col-span-1">
                        <div className="text-[10px] text-[#64748b] uppercase font-bold">Link Externo</div>
                        {item.permalink ? (
                          <a
                            href={item.permalink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#2563eb] hover:underline inline-flex items-center gap-1 mt-0.5"
                          >
                            Abrir <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-xs text-[#94a3b8]">—</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Coluna Direita: Sugestão do Motor & Ações */}
                  <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-[#f1f5f9] lg:pl-6 pt-4 lg:pt-0">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[#0f172a] flex items-center gap-1.5">
                          <Layers className="w-4 h-4 text-[#2563eb]" /> Sugestão de Produto Central
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
                          item.confidence_score >= 80 ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#f1f5f9] text-[#475569]'
                        }`}>
                          Confiança: {item.confidence_score}%
                        </span>
                      </div>

                      {candidate ? (
                        <div className="p-3.5 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl space-y-2">
                          <div className="flex items-start gap-3">
                            <div className="w-12 h-12 rounded-lg bg-white border border-[#e2e8f0] flex items-center justify-center shrink-0 overflow-hidden">
                              {candidate.image_url ? (
                                <img src={candidate.image_url} alt="" className="w-full h-full object-contain p-1" />
                              ) : (
                                <Package className="w-5 h-5 text-[#94a3b8]" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-bold text-[#0f172a] truncate">{candidate.name}</div>
                              <div className="text-[11px] text-[#64748b] font-mono mt-0.5">SKU: {candidate.sku} • Estoque: {candidate.stock} un</div>
                            </div>
                          </div>
                          {item.match_reason && (
                            <div className="text-[11px] text-[#475569] bg-white p-2 rounded-lg border border-[#e2e8f0]">
                              Motivo: <strong>{item.match_reason}</strong>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-xl text-center text-xs text-[#64748b]">
                          Nenhum produto central correspondente encontrado com segurança.
                        </div>
                      )}
                    </div>

                    {/* Feedback e Botões de Decisão */}
                    <div className="mt-4 space-y-2.5">
                      {feedback?.id === item.id && (
                        <div className={`p-2.5 rounded-xl text-xs font-medium ${
                          feedback.type === 'success'
                            ? 'bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]'
                            : 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]'
                        }`}>
                          {feedback.text}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2">
                        {candidate && (
                          <button
                            onClick={() => handleAction(item.id, 'LINK', candidate.id)}
                            disabled={isLoading}
                            className="px-4 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <Link2 className="w-3.5 h-3.5" /> Vincular a este Produto
                          </button>
                        )}

                        <button
                          onClick={() => handleAction(item.id, 'CREATE_NEW')}
                          disabled={isLoading}
                          className="px-4 py-2 bg-white border border-[#cbd5e1] hover:bg-[#f8fafc] text-[#0f172a] text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <PlusCircle className="w-3.5 h-3.5" /> Criar como Novo Produto
                        </button>

                        <button
                          onClick={() => handleAction(item.id, 'IGNORE')}
                          disabled={isLoading}
                          className="px-3 py-2 text-[#64748b] hover:text-[#dc2626] text-xs font-medium rounded-xl transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                        >
                          <EyeOff className="w-3.5 h-3.5" /> Ignorar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
