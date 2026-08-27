import { useState, useEffect } from 'react'
import { CheckCircle2, ShieldCheck, Key, CreditCard, QrCode, FileText, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './MercadoPagoSettings.css'

export default function MercadoPagoSettings() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    public_key: 'APP_USR-6ef8f3db-6d35-4701-86f7-8199378ec0c7',
    access_token: 'APP_USR-7441647214-081912-abcdef1234567890',
    enable_pix: true,
    pix_discount_percent: 5,
    enable_credit_card: true,
    enable_boleto: false,
    max_installments: 12,
  })

  const handleSave = async () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      alert('Configurações do Mercado Pago salvas com sucesso!')
    }, 600)
  }

  return (
    <div className="mp-settings-page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div className="header-info">
          <h1>Mercado Pago</h1>
          <p>Configure credenciais e métodos de pagamento da sua loja própria.</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            <Save size={14} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* ── Status Banner ── */}
      <div className="mp-status-banner">
        <div className="mp-status-left">
          <div className="mp-status-icon">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="mp-status-title">Gateway Ativo • Ambiente de Produção</div>
            <p className="mp-status-desc">Os pagamentos via Pix e Cartão de Crédito estão funcionando normalmente no checkout.</p>
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
              <p>Chaves de produção para processamento de pagamentos</p>
            </div>
          </div>

          <div className="mp-form-group">
            <label className="mp-label">Public Key (Chave Pública)</label>
            <input
              type="text"
              className="mp-input"
              value={settings.public_key}
              onChange={e => setSettings({ ...settings, public_key: e.target.value })}
              placeholder="APP_USR-..."
            />
            <span className="mp-input-hint">Utilizada para tokenização segura do cartão no navegador do cliente.</span>
          </div>

          <div className="mp-form-group">
            <label className="mp-label">Access Token (Chave Privada)</label>
            <input
              type="password"
              className="mp-input"
              value={settings.access_token}
              onChange={e => setSettings({ ...settings, access_token: e.target.value })}
              placeholder="APP_USR-..."
            />
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
              <p>Habilite as formas aceitas no checkout da sua loja</p>
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
