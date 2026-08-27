import { useState } from 'react'
import { Check, ExternalLink, Settings, Key, CheckCircle2 } from 'lucide-react'
import './PaymentMethods.css'

interface Gateway {
  id: string
  name: string
  logoText: string
  logoColor: string
  logoBg: string
  isFeatured?: boolean
  status: 'active' | 'inactive' | 'pending'
  features: string[]
  rates: { method: string; terms: string; rate: string; fixed: string }[]
  linkUrl: string
  credentials?: Record<string, string>
}

export default function PaymentMethods() {
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive' | 'pending'>('all')
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null)
  const [credentialsForm, setCredentialsForm] = useState<Record<string, string>>({})
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)

  const [gateways, setGateways] = useState<Gateway[]>([
    {
      id: 'teknix_pay',
      name: 'TEKNIX Pay',
      logoText: 'TEKNIX Pay',
      logoColor: '#00a854',
      logoBg: '#e6f9f0',
      isFeatured: true,
      status: 'active',
      features: ['PIX com QR Code dinâmico', 'Gestão integrada no painel', 'Checkout transparente', 'Antifraude integrado'],
      rates: [
        { method: 'Cartão de crédito', terms: '2 dias', rate: '4.69%', fixed: '+ R$ 0,35' },
        { method: 'Cartão de crédito', terms: '14 dias', rate: '4.19%', fixed: '+ R$ 0,35' },
        { method: 'Cartão de crédito', terms: '30 dias', rate: '3.69%', fixed: '+ R$ 0,35' },
        { method: 'Boleto bancário', terms: '2 dias', rate: '2.39%', fixed: 'fixo' },
        { method: 'PIX Instantâneo', terms: 'Na hora', rate: '0.99%', fixed: 'sem taxa fixa' },
      ],
      linkUrl: 'https://teknix.com.br',
      credentials: {
        clientId: 'tkn_live_cli_88492019',
        secretKey: '••••••••••••••••••••••••',
        pixKey: '12.345.678/0001-90'
      }
    },
    {
      id: 'mercado_pago',
      name: 'Mercado Pago',
      logoText: 'Mercado Pago',
      logoColor: '#009ee3',
      logoBg: '#e5f6fd',
      status: 'active',
      features: ['Checkout transparente', 'Cartão, Boleto e PIX', 'Carteira virtual Mercado Pago'],
      rates: [
        { method: 'Cartão de crédito', terms: 'Na hora', rate: '4.98%', fixed: '+ taxa fixa' },
        { method: 'Cartão de crédito', terms: '14 dias', rate: '4.45%', fixed: '+ taxa fixa' },
        { method: 'Cartão de crédito', terms: '30 dias', rate: '3.98%', fixed: '+ taxa fixa' },
      ],
      linkUrl: 'https://mercadopago.com.br',
      credentials: {
        publicKey: 'APP_USR-67294819-2049-4819-9481-948194819481',
        accessToken: 'APP_USR-••••••••••••••••••••••••••••••••',
        installments: '12',
        environment: 'production'
      }
    },
    {
      id: 'paypal',
      name: 'PayPal',
      logoText: 'PayPal',
      logoColor: '#003087',
      logoBg: '#e6eef7',
      status: 'inactive',
      features: ['Cartões internacionais', 'Carteira virtual PayPal', 'Proteção ao comprador'],
      rates: [
        { method: 'Cartão de crédito', terms: '1 dia', rate: '4.69%', fixed: '+ R$ 0,60' },
        { method: 'Cartão de crédito', terms: '30 dias', rate: '3.60%', fixed: '+ R$ 0,60' },
      ],
      linkUrl: 'https://paypal.com/br',
      credentials: {
        clientId: '',
        secret: ''
      }
    },
    {
      id: 'cielo',
      name: 'Cielo',
      logoText: 'Cielo',
      logoColor: '#00a6ce',
      logoBg: '#e6f7fa',
      status: 'inactive',
      features: ['Taxas exclusivas', 'Checkout transparente', 'Débito e Crédito'],
      rates: [
        { method: 'Cartão de crédito', terms: '30 dias', rate: '3.29%', fixed: 'fixo' },
        { method: 'Boleto bancário', terms: '1 dia', rate: 'R$ 0,00', fixed: 'R$ 2,50' },
      ],
      linkUrl: 'https://cielo.com.br',
      credentials: {
        merchantId: '',
        merchantKey: ''
      }
    },
    {
      id: 'custom_transfer',
      name: 'Personalizado / Transferência / Depósito',
      logoText: 'Manual / PIX',
      logoColor: '#4b5563',
      logoBg: '#f3f4f6',
      status: 'active',
      features: ['A combinar com o cliente', 'Transferência em conta', 'PIX chave manual', 'Sem taxas de intermediação'],
      rates: [
        { method: 'Transferência bancária', terms: 'Na hora', rate: '0.00%', fixed: 'Sem custo' },
        { method: 'PIX Chave Direta', terms: 'Na hora', rate: '0.00%', fixed: 'Sem custo' },
      ],
      linkUrl: '#',
      credentials: {
        pixKey: 'pix@teknix.com.br',
        bankName: 'Banco Inter (077)',
        agency: '0001',
        account: '1234567-8',
        instructions: 'Após o pagamento via PIX, envie o comprovante no WhatsApp (11) 99888-7766 informando o número do seu pedido.'
      }
    },
    {
      id: 'pagarme',
      name: 'Pagar.me / Stone',
      logoText: 'Pagar.me',
      logoColor: '#5856d6',
      logoBg: '#f4f3ff',
      status: 'inactive',
      features: ['Multiadquirência', 'Checkout transparente', 'PIX e Boleto rápido'],
      rates: [
        { method: 'Cartão de crédito', terms: '30 dias', rate: '3.19%', fixed: '+ R$ 0,40' },
      ],
      linkUrl: 'https://pagar.me',
      credentials: {
        merchantId: '',
        merchantKey: ''
      }
    }
  ])

  function handleOpenConfig(gw: Gateway) {
    setSelectedGateway(gw)
    setCredentialsForm(gw.credentials || {})
    setTestResult(null)
  }

  function handleSaveCredentials() {
    if (!selectedGateway) return
    setGateways(gateways.map(g => {
      if (g.id === selectedGateway.id) {
        return {
          ...g,
          credentials: credentialsForm,
          status: 'active'
        }
      }
      return g
    }))
    alert(`Credenciais da API do ${selectedGateway.name} salvas com sucesso! Gateway ativado.`)
    setSelectedGateway(null)
  }

  function handleTestConnection() {
    setTesting(true)
    setTestResult(null)
    setTimeout(() => {
      setTesting(false)
      setTestResult('success')
    }, 800)
  }

  function handleToggleGateway(id: string) {
    setGateways(gateways.map(g => {
      if (g.id === id) {
        const nextStatus = g.status === 'active' ? 'inactive' : 'active'
        return { ...g, status: nextStatus }
      }
      return g
    }))
  }

  const filteredGateways = gateways.filter(g => {
    if (activeTab === 'all') return true
    return g.status === activeTab
  })

  return (
    <div className="payments-page-container">
      <div className="payments-wrapper">
        
        {/* Header */}
        <div className="payments-header">
          <h1 className="payments-title">Meios de pagamento</h1>
          <p className="payments-subtitle">Configure as credenciais das APIs de pagamento para receber via PIX, Cartão e Boleto na sua loja.</p>
        </div>

        {/* Tabs */}
        <div className="payments-tabs">
          <button
            className={`payment-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Todos <span className="tab-badge">{gateways.length}</span>
          </button>
          <button
            className={`payment-tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            Ativados <span className="tab-badge">{gateways.filter(g => g.status === 'active').length}</span>
          </button>
          <button
            className={`payment-tab-btn ${activeTab === 'inactive' ? 'active' : ''}`}
            onClick={() => setActiveTab('inactive')}
          >
            Desativados <span className="tab-badge">{gateways.filter(g => g.status === 'inactive').length}</span>
          </button>
        </div>

        {/* List of Gateways */}
        <div className="gateways-list">
          {filteredGateways.map(gw => (
            <div key={gw.id} className="gateway-card">
              <div className="gateway-card-top">
                <div className="gateway-brand">
                  <div className="gateway-logo-box" style={{ color: gw.logoColor, background: gw.logoBg }}>
                    {gw.logoText}
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>{gw.name}</h3>
                  </div>
                </div>
                <div className="gateway-badges">
                  {gw.isFeatured && <span className="badge-featured">★ Mais usado</span>}
                  <span className={`badge-status ${gw.status}`}>
                    {gw.status === 'active' ? '● Ativado' : '○ Desativado'}
                  </span>
                </div>
              </div>

              <div className="gateway-features">
                {gw.features.map((f, i) => (
                  <div key={i} className="feature-item">
                    <Check size={14} color="#059669" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>

              <table className="gateway-rates-table">
                <thead>
                  <tr>
                    <th>Em vendas com</th>
                    <th>Receba em</th>
                    <th>Taxas</th>
                    <th>Fixo</th>
                  </tr>
                </thead>
                <tbody>
                  {gw.rates.map((r, i) => (
                    <tr key={i}>
                      <td><strong>{r.method}</strong></td>
                      <td>{r.terms}</td>
                      <td><span style={{ color: '#059669', fontWeight: 700 }}>{r.rate}</span></td>
                      <td>{r.fixed}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bottom Actions */}
              <div className="gateway-card-bottom">
                <a href={gw.linkUrl} target="_blank" rel="noopener noreferrer" className="gateway-link">
                  Ir para {gw.name} <ExternalLink size={12} />
                </a>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="btn-configure"
                    style={{ background: '#f3f4f6', color: '#111827', border: '1px solid #d1d5db', borderRadius: 20, padding: '6px 14px', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    onClick={() => handleOpenConfig(gw)}
                  >
                    <Settings size={13} /> Configurar API
                  </button>
                  <button
                    type="button"
                    className={gw.status === 'active' ? 'btn-configure' : 'btn-activate'}
                    onClick={() => handleToggleGateway(gw.id)}
                  >
                    {gw.status === 'active' ? 'Desativar' : 'Ativar Gateway'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Modal de Integração de API de Pagamento */}
      {selectedGateway && (
        <div className="modal-overlay" onClick={() => setSelectedGateway(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Key size={18} color="#2563eb" /> Integração API — {selectedGateway.name}
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#6b7280' }}>Insira suas credenciais oficiais para processamento seguro</span>
              </div>
            </div>

            <div className="modal-body" style={{ gap: 14 }}>
              
              {/* Mercado Pago */}
              {selectedGateway.id === 'mercado_pago' && (
                <>
                  <div className="form-group">
                    <label>Ambiente de Execução</label>
                    <select
                      className="form-select"
                      value={credentialsForm.environment || 'production'}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, environment: e.target.value })}
                    >
                      <option value="production">Produção (Vendas Reais)</option>
                      <option value="sandbox">Sandbox (Ambiente de Testes)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Public Key (Chave Pública)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="APP_USR-67294819-2049-..."
                      value={credentialsForm.publicKey || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, publicKey: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Access Token (Chave Privada de Acesso)</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="APP_USR-xxxxxxxxxxxxxxxxxxxx"
                      value={credentialsForm.accessToken || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, accessToken: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Parcelamento Máximo Sem Juros</label>
                    <select
                      className="form-select"
                      value={credentialsForm.installments || '12'}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, installments: e.target.value })}
                    >
                      <option value="1">1x à vista</option>
                      <option value="3">Até 3x sem juros</option>
                      <option value="6">Até 6x sem juros</option>
                      <option value="10">Até 10x sem juros</option>
                      <option value="12">Até 12x sem juros</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Webhook URL (Notificação Instantânea de Pedidos Pagos)</label>
                    <input
                      type="text"
                      className="form-input"
                      readOnly
                      value="https://api.teknix.com.br/webhooks/mercadopago"
                      style={{ background: '#f9fafb', color: '#6b7280' }}
                    />
                  </div>
                </>
              )}

              {/* TEKNIX Pay */}
              {selectedGateway.id === 'teknix_pay' && (
                <>
                  <div className="form-group">
                    <label>Client ID TEKNIX Pay</label>
                    <input
                      type="text"
                      className="form-input"
                      value={credentialsForm.clientId || 'tkn_live_cli_88492019'}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, clientId: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Secret Key</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="tkn_sec_xxxxxxxxxxxx"
                      value={credentialsForm.secretKey || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, secretKey: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Chave PIX Recebedora (CNPJ)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={credentialsForm.pixKey || '12.345.678/0001-90'}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, pixKey: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* PayPal */}
              {selectedGateway.id === 'paypal' && (
                <>
                  <div className="form-group">
                    <label>Client ID PayPal</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="AYSq38js9283..."
                      value={credentialsForm.clientId || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, clientId: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Secret Key PayPal</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="EDj38491029..."
                      value={credentialsForm.secret || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, secret: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Manual PIX / Transferência */}
              {selectedGateway.id === 'custom_transfer' && (
                <>
                  <div className="form-group">
                    <label>Chave PIX</label>
                    <input
                      type="text"
                      className="form-input"
                      value={credentialsForm.pixKey || 'pix@teknix.com.br'}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, pixKey: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Banco e Conta</label>
                    <input
                      type="text"
                      className="form-input"
                      value={credentialsForm.bankName || 'Banco Inter (077) - Ag: 0001 CC: 1234567-8'}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, bankName: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Instruções de envio do comprovante</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={credentialsForm.instructions || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, instructions: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Cielo / Pagarme fallback */}
              {(selectedGateway.id === 'cielo' || selectedGateway.id === 'pagarme') && (
                <>
                  <div className="form-group">
                    <label>Merchant / API Key</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Chave de API do gateway"
                      value={credentialsForm.merchantId || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, merchantId: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Secret / Encryption Key</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Chave de criptografia"
                      value={credentialsForm.merchantKey || ''}
                      onChange={(e) => setCredentialsForm({ ...credentialsForm, merchantKey: e.target.value })}
                    />
                  </div>
                </>
              )}

              {/* Status de Teste */}
              {testResult === 'success' && (
                <div style={{ background: '#e6f9f0', border: '1px solid #b7eb8f', borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, color: '#00a854', fontSize: '0.82rem', fontWeight: 600 }}>
                  <CheckCircle2 size={16} /> Conexão com a API estabelecida com sucesso! Chaves válidas.
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                <button
                  type="button"
                  className="btn-secondary-action"
                  onClick={handleTestConnection}
                  disabled={testing}
                >
                  {testing ? 'Testando...' : 'Testar Conexão'}
                </button>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn-secondary-action" onClick={() => setSelectedGateway(null)}>Cancelar</button>
                  <button type="button" className="btn-primary-action" onClick={handleSaveCredentials}>Salvar Credenciais</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  )
}
