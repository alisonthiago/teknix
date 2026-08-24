'use client'

import { useState } from 'react'
import { X, CheckCircle2, Loader2, ArrowRight, Zap, ExternalLink, Key, Store, RefreshCw, AlertCircle } from 'lucide-react'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'
import { createClient } from '@/utils/supabase/client'
import { useNotification } from '@/contexts/NotificationContext'

interface ConnectMarketplaceModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

interface PlatformConfig {
  id: string
  name: string
  code: string
  tagline: string
  color: string
  bgColor: string
  borderColor: string
  authType: 'oauth' | 'token' | 'shopify'
  authUrl?: string
  tokenLabel?: string
  tokenPlaceholder?: string
  fields?: { key: string; label: string; placeholder: string; type?: string; required?: boolean }[]
  disabled?: boolean
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    code: 'MERCADO_LIVRE',
    tagline: 'Vendas, anúncios, estoque e etiquetas de envio',
    color: '#FFE600',
    bgColor: 'bg-[#FFFDE7]',
    borderColor: 'border-[#FFE600]',
    authType: 'oauth',
    authUrl: '/api/auth/mercadolivre',
    fields: [
      { key: 'account_name', label: 'Nome / Apelido da Conta', placeholder: 'Ex: TEKNIXBRASIL', required: true },
      { key: 'seller_id', label: 'ID do Vendedor (User ID)', placeholder: 'Ex: 470831049', required: true },
      { key: 'access_token', label: 'Token de Acesso / Access Token (Opcional se clicar no botão acima)', placeholder: 'APP_USR-8874323668438382-...', type: 'password' },
    ]
  },
  {
    id: 'shopify',
    name: 'Shopify',
    code: 'SHOPIFY',
    tagline: 'Integração em desenvolvimento',
    color: '#95BF47',
    bgColor: 'bg-[#F4F9EC]',
    borderColor: 'border-[#95BF47]',
    authType: 'shopify',
    disabled: true,
    fields: []
  },
  {
    id: 'tiktok',
    name: 'TikTok Shop',
    code: 'TIKTOK_SHOP',
    tagline: 'Integração em desenvolvimento',
    color: '#000000',
    bgColor: 'bg-[#F5F5F5]',
    borderColor: 'border-[#333333]',
    authType: 'token',
    disabled: true,
    fields: []
  },
  {
    id: 'magalu',
    name: 'Magazine Luiza',
    code: 'MAGALU',
    tagline: 'Integração em desenvolvimento',
    color: '#0086FF',
    bgColor: 'bg-[#EBF5FF]',
    borderColor: 'border-[#0086FF]',
    authType: 'token',
    disabled: true,
    fields: []
  },
]

export default function ConnectMarketplaceModal({ open, onClose, onSuccess }: ConnectMarketplaceModalProps) {
  const { notify } = useNotification()
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformConfig | null>(null)
  const [formData, setFormData] = useState<Record<string, string>>({})
  const [connecting, setConnecting] = useState(false)
  const [showOther, setShowOther] = useState(false)

  if (!open) return null

  const handleSelect = (p: PlatformConfig) => {
    if (p.disabled) return
    setSelectedPlatform(p)
    setFormData({ account_name: `Minha Loja ${p.name}` })
  }

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlatform || selectedPlatform.disabled) return

    setConnecting(true)
    const supabase = createClient()

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // 1. Garantir que o marketplace existe na tabela de marketplaces
      let marketplaceId: string | null = null
      const { data: existingMp } = await supabase
        .from('marketplaces')
        .select('id')
        .eq('code', selectedPlatform.code)
        .single()

      if (existingMp) {
        marketplaceId = existingMp.id
      } else {
        const { data: createdMp } = await supabase
          .from('marketplaces')
          .insert({
            name: selectedPlatform.name,
            code: selectedPlatform.code,
            type: 'MARKETPLACE',
            api_available: !selectedPlatform.disabled,
            oauth_available: selectedPlatform.authType === 'oauth',
            webhook_available: !selectedPlatform.disabled,
            status: 'ACTIVE',
            logo: `/logos/${selectedPlatform.id === 'mercadolivre' ? 'mercado-livre' : selectedPlatform.id}.svg`
          })
          .select('id')
          .single()
        
        if (createdMp) marketplaceId = createdMp.id
      }

      // 2. Criar ou atualizar a conexão em marketplace_connections
      const accountName = formData.account_name || `Loja ${selectedPlatform.name}`
      const sellerId = formData.seller_id || formData.store_domain
      const accessToken = formData.access_token

      if (!accessToken && selectedPlatform.authType !== 'oauth') {
        throw new Error('Token de acesso é obrigatório para esta plataforma.')
      }

      const { error: connError } = await supabase
        .from('marketplace_connections')
        .upsert({
          user_id: user?.id,
          marketplace_id: selectedPlatform.id,
          seller_id: sellerId,
          account_name: accountName,
          access_token: accessToken || '',
          is_active: true,
          status: 'CONNECTED',
          last_sync_at: new Date().toISOString()
        })

      if (connError) console.warn('Conn table warning:', connError.message)

      // 3. Criar a conta em marketplace_accounts se a tabela existir
      if (marketplaceId) {
        await supabase
          .from('marketplace_accounts')
          .upsert({
            marketplace_id: marketplaceId,
            user_id: user?.id,
            account_name: accountName,
            seller_id: sellerId,
            status: 'ACTIVE',
            auto_sync_stock: true,
            auto_sync_prices: true,
            auto_import_orders: true,
            access_token: accessToken || null,
            last_sync_at: new Date().toISOString()
          }, { onConflict: 'seller_id' })
      }

      // 4. Se for Mercado Livre, dispara a sincronização dos anúncios e produtos reais
      if (selectedPlatform.id === 'mercadolivre') {
        try {
          await fetch('/api/sync/mercadolivre', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sellerId })
          })
        } catch (e) {
          console.warn('Initial sync warning:', e)
        }
      }

      notify({
        type: 'success',
        title: 'Conexão Estabelecida!',
        message: `${selectedPlatform.name} foi conectado com sucesso.`
      })

      onSuccess()
      onClose()
      setSelectedPlatform(null)
    } catch (err: unknown) {
      console.error('Erro na conexão:', err)
      notify({
        type: 'error',
        title: 'Erro na Conexão',
        message: err instanceof Error ? err.message : 'Não foi possível concluir a autenticação do canal.'
      })
    } finally {
      setConnecting(false)
    }
  }

  const handleOAuthRedirect = (url: string) => {
    window.location.href = url
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-[#e6e6e6]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eeeeee]">
          <div>
            <h2 className="text-[17px] font-bold text-[#1f2328] flex items-center gap-2">
              <Zap className="w-5 h-5 text-[#3483fa]" />
              Conectar Canal de Venda
            </h2>
            <p className="text-[12px] text-[#999] mt-0.5">
              Selecione o marketplace para autenticar e sincronizar estoque e pedidos automaticamente.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#999] hover:bg-[#f5f5f5] hover:text-[#333] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!selectedPlatform ? (
            <>
              <p className="text-[11px] font-semibold uppercase text-[#999] tracking-wider mb-2">
                Canais Disponíveis para Integração Direta
              </p>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 {PLATFORMS.map(p => (
                   <div
                     key={p.id}
                     onClick={() => handleSelect(p)}
                     className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                       p.disabled
                         ? 'border-[#e6e6e6] bg-[#fafafa] opacity-70 cursor-not-allowed'
                         : 'border-[#e6e6e6] hover:border-[#3483fa] hover:shadow-md cursor-pointer bg-white group'
                     }`}
                   >
                     <div>
                       <div className="flex items-center justify-between mb-3">
                         <div className="w-12 h-12 rounded-xl bg-[#fafafa] border border-[#f0f0f0] p-2 flex items-center justify-center">
                           <MarketplaceLogo name={p.name} className="w-8 h-8" />
                         </div>
                         {p.disabled ? (
                           <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#f5f5f5] text-[#999]">
                             Em breve
                           </span>
                         ) : (
                           <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-[#f0f7ff] text-[#3483fa] group-hover:bg-[#3483fa] group-hover:text-white transition-colors">
                             Conectar →
                           </span>
                         )}
                       </div>
                       <h3 className="text-[14px] font-bold text-[#333] group-hover:text-[#3483fa] transition-colors">
                         {p.name}
                       </h3>
                       <p className="text-[11px] text-[#888] mt-1 leading-relaxed line-clamp-2">
                         {p.tagline}
                       </p>
                     </div>

                     <div className="mt-4 pt-3 border-t border-[#f5f5f5] flex items-center justify-between text-[10px] text-[#999]">
                       <span>API & Webhook</span>
                       {p.disabled ? (
                         <span className="flex items-center gap-1 text-[#999]">
                           <span className="w-1.5 h-1.5 rounded-full bg-[#ccc]" />
                           Em desenvolvimento
                         </span>
                       ) : (
                         <span className="flex items-center gap-1 text-[#38a169]">
                           <span className="w-1.5 h-1.5 rounded-full bg-[#38a169] animate-pulse" />
                           Disponível
                         </span>
                       )}
                     </div>
                   </div>
                 ))}
               </div>

               {/* Shopee & Amazon — em desenvolvimento */}
               <div className="mt-4 p-4 rounded-2xl bg-[#fafafa] border border-[#eeeeee] opacity-70">
                 <div className="flex items-center gap-2.5">
                   <Store className="w-4 h-4 text-[#999]" />
                   <span className="text-[12px] font-semibold text-[#666]">Outros Canais (Shopee, Amazon)</span>
                   <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f5f5] text-[#999]">Em breve</span>
                 </div>
               </div>
            </>
          ) : (
            /* Selected Platform Form */
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f8f9fa] border border-[#e6e6e6]">
                <div className="w-10 h-10 rounded-xl bg-white p-1.5 border border-[#e6e6e6] flex items-center justify-center shrink-0">
                  <MarketplaceLogo name={selectedPlatform.name} className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[14px] font-bold text-[#333]">{selectedPlatform.name}</h3>
                  <p className="text-[11px] text-[#888]">{selectedPlatform.tagline}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlatform(null)}
                  className="text-[11px] text-[#3483fa] hover:underline font-medium"
                >
                  Trocar
                </button>
              </div>

              {selectedPlatform.disabled ? (
                <div className="p-6 rounded-2xl bg-[#f5f5f5] border border-[#e6e6e6] text-center">
                  <p className="text-[13px] text-[#666]">Esta integração ainda não está disponível.</p>
                  <p className="text-[11px] text-[#999] mt-1">Estamos trabalhando para disponibilizar em breve.</p>
                </div>
              ) : selectedPlatform.authType === 'oauth' ? (
                <div className="p-6 rounded-2xl bg-[#f0f7ff] border border-[#d0e4ff] space-y-4 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-white shadow-xs border border-[#d0e4ff] mx-auto flex items-center justify-center p-2.5">
                    <MarketplaceLogo name={selectedPlatform.name} className="w-9 h-9" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-[#1f2328]">Conectar com 1 Clique</h4>
                    <p className="text-[12px] text-[#555] mt-1 max-w-sm mx-auto leading-relaxed">
                      Você será redirecionado com segurança para a página oficial do <strong>{selectedPlatform.name}</strong> para autorizar a sincronização de vendas e estoque.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPlatform.authUrl) {
                        window.location.href = selectedPlatform.authUrl
                      }
                    }}
                    className="w-full py-3.5 px-5 bg-[#FFE600] hover:bg-[#F5DC00] text-[#111] text-[14px] font-extrabold rounded-xl flex items-center justify-center gap-2.5 shadow-md transition-all cursor-pointer"
                  >
                    <span>Entrar no {selectedPlatform.name} e Autorizar</span>
                    <ExternalLink className="w-4 h-4 text-[#111]" />
                  </button>

                  <div className="p-3 rounded-xl bg-white/80 border border-[#d0e4ff] flex items-center gap-2 text-[11px] text-[#276749] text-left">
                    <CheckCircle2 className="w-4 h-4 text-[#38a169] shrink-0" />
                    <span>Ao autorizar, suas vendas de hoje e catálogo de produtos serão sincronizados automaticamente.</span>
                  </div>
                </div>
              ) : (
                <form id="connect-mp-form" onSubmit={handleConnect} className="space-y-3">
                  {selectedPlatform.fields?.map(f => (
                    <div key={f.key}>
                      <label className="block text-[11px] font-semibold text-[#666] mb-1">
                        {f.label} {f.required && <span className="text-[#e74c3c]">*</span>}
                      </label>
                      <input
                        type={f.type || 'text'}
                        required={f.required}
                        placeholder={f.placeholder}
                        value={formData[f.key] || ''}
                        onChange={e => setFormData({ ...formData, [f.key]: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-[#d0d7de] bg-white text-[13px] text-[#333] focus:outline-none focus:ring-2 focus:ring-[#3483fa]/20 focus:border-[#3483fa] transition-all"
                      />
                    </div>
                  ))}

                  <div className="p-3 rounded-xl bg-[#f0fff4] border border-[#c6f6d5] flex items-center gap-2 text-[11px] text-[#276749]">
                    <CheckCircle2 className="w-4 h-4 text-[#38a169] shrink-0" />
                    <span>Ao conectar, o TEKNIX sincronizará automaticamente estoque, pedidos e preços.</span>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#eeeeee] bg-[#fafafa] flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (selectedPlatform) setSelectedPlatform(null)
              else onClose()
            }}
            disabled={connecting}
            className="px-4 py-2 text-[12px] font-semibold text-[#666] hover:bg-[#eee] rounded-xl transition-colors cursor-pointer"
          >
            {selectedPlatform ? '← Voltar aos Canais' : 'Cancelar'}
          </button>

          {selectedPlatform && (
            selectedPlatform.disabled ? (
              <button
                type="button"
                disabled
                className="px-5 py-2.5 bg-[#e6e6e6] text-[#999] text-[12px] font-bold rounded-xl cursor-not-allowed"
              >
                Em breve
              </button>
            ) : selectedPlatform.authType === 'oauth' ? (
              <button
                type="button"
                onClick={() => {
                  if (selectedPlatform.authUrl) {
                    window.location.href = selectedPlatform.authUrl
                  }
                }}
                className="px-5 py-2.5 bg-[#FFE600] hover:bg-[#F5DC00] text-[#111] text-[12px] font-extrabold rounded-xl shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                Autorizar no {selectedPlatform.name}
              </button>
            ) : (
              <button
                type="submit"
                form="connect-mp-form"
                disabled={connecting}
                className="px-5 py-2.5 bg-[#3483fa] hover:bg-[#2968c8] text-white text-[12px] font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {connecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Conectando API...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Conectar {selectedPlatform.name}
                  </>
                )}
              </button>
            )
          )}
        </div>

      </div>
    </div>
  )
}
