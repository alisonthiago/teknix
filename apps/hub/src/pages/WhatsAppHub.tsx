import { useState } from 'react'
import { MessageSquare, Zap, CheckCircle2, Send, Users, Save } from 'lucide-react'
import './WhatsAppHub.css'

export default function WhatsAppHub() {
  const [activeTab, setActiveTab] = useState<'bot' | 'recovery' | 'notifications' | 'templates'>('bot')
  const [whatsappNumber, setWhatsappNumber] = useState('(11) 99888-7766')
  const [saving, setSaving] = useState(false)

  function handleSave() {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      alert('Configurações do WhatsApp salvas com sucesso!')
    }, 600)
  }

  return (
    <div className="whatsapp-page-container">
      {/* ── Top Actions ── */}
      <div className="hub-table-top-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginBottom: 16 }}>
        <span className="badge-success" style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <CheckCircle2 size={13} /> Conectado
        </span>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Save size={14} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>

      {/* ── FLOW Tabs ── */}
      <div className="whatsapp-tabs">
        <button
          className={`w-tab-btn ${activeTab === 'bot' ? 'active' : ''}`}
          onClick={() => setActiveTab('bot')}
        >
          <MessageSquare size={15} /> Botão Flutuante
        </button>
        <button
          className={`w-tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Zap size={15} /> Notificações de Pedido
        </button>
        <button
          className={`w-tab-btn ${activeTab === 'recovery' ? 'active' : ''}`}
          onClick={() => setActiveTab('recovery')}
        >
          <Users size={15} /> Recuperação Automática
        </button>
        <button
          className={`w-tab-btn ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          <Send size={15} /> Mensagens &amp; Modelos
        </button>
      </div>

      {/* ── 1. Botão Flutuante ── */}
      {activeTab === 'bot' && (
        <div className="w-grid">
          <div className="w-card">
            <h3 className="w-card-title">Configurações do Botão no Site</h3>

            <div className="w-form-content">
              <div className="w-toggle-row">
                <div>
                  <div className="w-toggle-title">Ativar botão de WhatsApp no site</div>
                </div>
                <label className="w-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="w-slider"></span>
                </label>
              </div>

              <div className="w-field">
                <label className="w-label">Número Oficial (com DDD)</label>
                <input
                  className="w-input"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div className="w-field">
                <label className="w-label">Mensagem Padrão de Início</label>
                <textarea
                  className="w-textarea"
                  rows={3}
                  defaultValue="Olá! Gostaria de mais informações sobre os produtos da TEKNIX."
                />
              </div>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="w-card preview-box">
            <h3 className="w-card-title">Pré-visualização no Site</h3>

            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="mock-site-header">TEKNIX Store</div>
                <div className="mock-site-content">
                  <div className="mock-banner"></div>
                  <div className="mock-prod-row">
                    <div className="mock-prod"></div>
                    <div className="mock-prod"></div>
                  </div>
                </div>
                {/* Floating WA button */}
                <div className="floating-wa-btn">
                  <MessageSquare size={18} color="white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Notificações de Pedido ── */}
      {activeTab === 'notifications' && (
        <div className="w-card">
          <h3 className="w-card-title">Disparos Automáticos de Pedido</h3>

          <div className="w-notifs-list">
            <div className="w-notif-item">
              <div>
                <div className="w-notif-name">Pedido Realizado (Aguardando Pagamento)</div>
                <div className="w-notif-sub">Envia o código Pix Copia e Cola para pagamento rápido.</div>
              </div>
              <label className="w-switch">
                <input type="checkbox" defaultChecked />
                <span className="w-slider"></span>
              </label>
            </div>

            <div className="w-notif-item">
              <div>
                <div className="w-notif-name">Pagamento Aprovado</div>
                <div className="w-notif-sub">Notifica que o pagamento foi confirmado e o pedido está em separação.</div>
              </div>
              <label className="w-switch">
                <input type="checkbox" defaultChecked />
                <span className="w-slider"></span>
              </label>
            </div>

            <div className="w-notif-item">
              <div>
                <div className="w-notif-name">Pedido Enviado com Rastreio</div>
                <div className="w-notif-sub">Envia o código de rastreamento dos Correios / Transportadora.</div>
              </div>
              <label className="w-switch">
                <input type="checkbox" defaultChecked />
                <span className="w-slider"></span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Recuperação Automática ── */}
      {activeTab === 'recovery' && (
        <div className="w-card">
          <h3 className="w-card-title">Recuperação de Carrinho Abandonado</h3>

          <div className="w-form-content">
            <div className="w-toggle-row">
              <div>
                <div className="w-toggle-title">Ativar recuperação automática via WhatsApp</div>
                <div className="w-toggle-sub">Dispara após 15 minutos de abandono de carrinho.</div>
              </div>
              <label className="w-switch">
                <input type="checkbox" defaultChecked />
                <span className="w-slider"></span>
              </label>
            </div>

            <div className="w-field">
              <label className="w-label">Cupom de Desconto de Recuperação</label>
              <input className="w-input" defaultValue="VOLTA5" placeholder="Ex: VOLTA5" />
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Templates ── */}
      {activeTab === 'templates' && (
        <div className="w-card">
          <h3 className="w-card-title">Modelos de Mensagem Aprovados</h3>

          <div className="w-template-box">
            <div className="w-template-label">Modelo: Confirmação de Pedido</div>
            <pre className="w-template-code">
{`Olá {{nome}}, seu pedido #{{pedido_id}} foi confirmado com sucesso na TEKNIX!
Valor total: R$ {{valor_total}}
Estamos preparando o envio.`}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}
