import { useState, useEffect } from 'react'
import { CheckCircle2, ShieldCheck, Key, CreditCard, QrCode, FileText, Save, Eye, EyeOff } from 'lucide-react'
import { supabase, supabaseAdmin } from '../lib/supabase'
import './MercadoPagoSettings.css'
import { notifyHub } from '../lib/hubNotifications'

export default function MercadoPagoSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPublicKey, setShowPublicKey] = useState(false)
  const [showAccessToken, setShowAccessToken] = useState(false)
  const [settings, setSettings] = useState({
    public_key: 'APP_USR-6ef8f3db-6d35-4701-86f7-8199378ec0c7',
    access_token: 'APP_USR-7441647214-081912-abcdef1234567890',
    enable_pix: true,
    pix_discount_percent: 5,
    enable_credit_card: true,
    enable_boleto: false,
    max_installments: 12,
  })

  useEffect(() => {
    let mounted = true

    // Restore saved credentials from localStorage if present
    try {
      const savedCreds = localStorage.getItem('hub_mp_credentials')
      if (savedCreds) {
        const parsed = JSON.parse(savedCreds)
        if (parsed.public_key || parsed.access_token) {
          setSettings(current => ({
            ...current,
            public_key: parsed.public_key || current.public_key,
            access_token: parsed.access_token || current.access_token
          }))
        }
      }
    } catch (e) {
      console.warn('[Mercado Pago] Falha ao ler credenciais locais:', e)
    }

    const loadSettings = async () => {
      let res = await supabase.from('store_payment_settings').select('*').eq('id', 'default').maybeSingle()
      if (res.error && supabaseAdmin) {
        res = await supabaseAdmin.from('store_payment_settings').select('*').eq('id', 'default').maybeSingle()
      }

      if (!mounted) return
      if (res.error) {
        console.warn('[Mercado Pago] Não foi possível carregar as configurações do banco:', res.error.message)
      } else if (res.data) {
        setSettings(current => ({
          ...current,
          enable_pix: res.data.enable_pix ?? current.enable_pix,
          pix_discount_percent: res.data.pix_discount_percent ?? current.pix_discount_percent,
          enable_credit_card: res.data.enable_credit_card ?? current.enable_credit_card,
          enable_boleto: res.data.enable_boleto ?? current.enable_boleto,
          max_installments: res.data.max_installments ?? current.max_installments,
        }))
      }
      setLoading(false)
    }

    loadSettings()
    return () => { mounted = false }
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      id: 'default',
      enable_pix: settings.enable_pix,
      pix_discount_percent: settings.pix_discount_percent,
      enable_credit_card: settings.enable_credit_card,
      enable_boleto: settings.enable_boleto,
      max_installments: settings.max_installments,
      updated_at: new Date().toISOString()
    }

    let { error } = await supabase.from('store_payment_settings').upsert(payload)
    if (error && supabaseAdmin) {
      const adminRes = await supabaseAdmin.from('store_payment_settings').upsert(payload)
      error = adminRes.error
    }

    // Persist credentials locally
    try {
      localStorage.setItem('hub_mp_credentials', JSON.stringify({
        public_key: settings.public_key,
        access_token: settings.access_token
      }))
    } catch (e) {
      console.warn('[Mercado Pago] Falha ao salvar credenciais localmente:', e)
    }

    setSaving(false)
    if (error) {
      notifyHub('Aviso: Salvo localmente. No Supabase aplique a tabela store_payment_settings.')
      console.error('[Mercado Pago] Falha ao salvar no banco:', error)
      return
    }
    notifyHub('Configurações do Mercado Pago salvas com sucesso!')
  }

  return (
    <div className="mp-settings-page">
      {/* ── Top Actions ── */}
      <div className="hub-table-top-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={loading || saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Save size={14} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* ── Status Banner ── */}
      <div className="mp-status-banner">
        <div className="mp-status-left">
          <div className="mp-status-icon">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="mp-status-title">Gateway Ativo • Ambiente de Produção</div>
          </div>
        </div>
        <span className="mp-status-badge">
          <CheckCircle2 size={12} /> Conectado
        </span>
      </div>

      <div className="mp-grid">
        {/* ── Credenciais ── */}
        <div className="mp-section-card">
          <div className="mp-section-header">
            <div className="mp-section-icon">
              <Key size={16} />
            </div>
            <div>
              <h3>Credenciais da API</h3>
            </div>
          </div>

          <div className="mp-form-group">
            <label className="mp-label">Public Key (Chave Pública)</label>
            <div className="mp-input-wrap">
              <input
                type={showPublicKey ? 'text' : 'password'}
                className="mp-input"
                value={settings.public_key}
                onChange={e => setSettings({ ...settings, public_key: e.target.value })}
                placeholder="APP_USR-..."
              />
              <button
                type="button"
                className="mp-input-toggle-btn"
                onClick={() => setShowPublicKey(!showPublicKey)}
                title={showPublicKey ? 'Ocultar chave pública' : 'Exibir chave pública'}
              >
                {showPublicKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span className="mp-input-hint">Utilizada para tokenização segura do cartão no navegador do cliente.</span>
          </div>

          <div className="mp-form-group">
            <label className="mp-label">Access Token (Chave Privada)</label>
            <div className="mp-input-wrap">
              <input
                type={showAccessToken ? 'text' : 'password'}
                className="mp-input"
                value={settings.access_token}
                onChange={e => setSettings({ ...settings, access_token: e.target.value })}
                placeholder="APP_USR-..."
              />
              <button
                type="button"
                className="mp-input-toggle-btn"
                onClick={() => setShowAccessToken(!showAccessToken)}
                title={showAccessToken ? 'Ocultar chave privada' : 'Exibir chave privada'}
              >
                {showAccessToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span className="mp-input-hint">Chave de autorização de transações no servidor. Nunca compartilhe.</span>
          </div>
        </div>

        {/* ── Métodos de Pagamento ── */}
        <div className="mp-section-card">
          <div className="mp-section-header">
            <div className="mp-section-icon">
              <CreditCard size={16} />
            </div>
            <div>
              <h3>Métodos de Pagamento</h3>
            </div>
          </div>

          {/* Pix */}
          <div className="mp-method-row">
            <div className="mp-method-info">
              <div className="mp-method-title-row">
                <QrCode size={16} className="text-[#00a650]" />
                <span className="mp-method-name">Pix Instantâneo</span>
                <span className="mp-method-tag">Recomendado</span>
              </div>
              <p className="mp-method-desc">Aprovação imediata em tempo real com QR Code dinâmico e Copia e Cola.</p>
            </div>
            <label className="mp-switch">
              <input
                type="checkbox"
                checked={settings.enable_pix}
                onChange={e => setSettings({ ...settings, enable_pix: e.target.checked })}
              />
              <span className="mp-slider"></span>
            </label>
          </div>

          {settings.enable_pix && (
            <div className="mp-subconfig-row">
              <label className="mp-label-sm">Desconto no Pix (%):</label>
              <input
                type="number"
                min="0"
                max="30"
                className="mp-input-sm"
                value={settings.pix_discount_percent}
                onChange={e => setSettings({ ...settings, pix_discount_percent: Number(e.target.value) })}
              />
              <span className="mp-hint-sm">% de desconto automático aplicado no checkout</span>
            </div>
          )}

          {/* Cartão de Crédito */}
          <div className="mp-method-row">
            <div className="mp-method-info">
              <div className="mp-method-title-row">
                <CreditCard size={16} />
                <span className="mp-method-name">Cartão de Crédito</span>
              </div>
              <p className="mp-method-desc">Visa, Mastercard, Elo, Hipercard e American Express com parcelamento.</p>
            </div>
            <label className="mp-switch">
              <input
                type="checkbox"
                checked={settings.enable_credit_card}
                onChange={e => setSettings({ ...settings, enable_credit_card: e.target.checked })}
              />
              <span className="mp-slider"></span>
            </label>
          </div>

          {settings.enable_credit_card && (
            <div className="mp-subconfig-row">
              <label className="mp-label-sm">Parcelamento Máximo:</label>
              <select
                className="mp-select-sm"
                value={settings.max_installments || 12}
                onChange={e => setSettings({ ...settings, max_installments: Number(e.target.value) })}
              >
                <option value={1}>1x à vista (sem parcelamento)</option>
                <option value={3}>Até 3x parcelas</option>
                <option value={6}>Até 6x parcelas</option>
                <option value={10}>Até 10x parcelas</option>
                <option value={12}>Até 12x parcelas (Padrão)</option>
              </select>
              <span className="mp-hint-sm">Limite de parcelas liberado aos clientes na finalização de compra</span>
            </div>
          )}

          {/* Boleto */}
          <div className="mp-method-row">
            <div className="mp-method-info">
              <div className="mp-method-title-row">
                <FileText size={16} />
                <span className="mp-method-name">Boleto Bancário</span>
              </div>
              <p className="mp-method-desc">Compensação em até 1 a 2 dias úteis.</p>
            </div>
            <label className="mp-switch">
              <input
                type="checkbox"
                checked={settings.enable_boleto}
                onChange={e => setSettings({ ...settings, enable_boleto: e.target.checked })}
              />
              <span className="mp-slider"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
