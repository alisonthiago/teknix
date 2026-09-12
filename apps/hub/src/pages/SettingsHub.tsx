import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard, Truck, MapPin, FileText, Phone, MessageSquare, Mail,
  ShoppingCart, Users, Globe, Code, Shuffle, Edit3, ChevronLeft, Save, ShieldCheck
} from 'lucide-react'
import CollaboratorsPermissionsTab from '../components/CollaboratorsPermissionsTab'
import { notifyHub } from '../lib/hubNotifications'
import { DEFAULT_WHATSAPP_SETTINGS, loadWhatsappSettings, saveWhatsappSettings } from '../services/storeSettings'
import './SettingsHub.css'

export default function SettingsHub() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('contact')
  const [saving, setSaving] = useState(false)

  // Mock form states
  const [contactData, setContactData] = useState({
    storeName: 'TEKNIX Ferramentas & Iluminação',
    phone: '(11) 99888-7766',
    whatsapp: '5511998887766',
    email: 'sac@teknix.com.br',
    cnpj: '12.345.678/0001-90',
    address: 'Av. Paulista, 1000 - São Paulo/SP'
  })

  const [whatsappData, setWhatsappData] = useState(DEFAULT_WHATSAPP_SETTINGS)

  const [checkoutData, setCheckoutData] = useState({
    requireCpf: true,
    requirePhone: true,
    allowGuest: true,
    customMessage: 'Agradecemos sua preferência pela TEKNIX! Seu pedido será postado em até 24h úteis.'
  })

  const [nfeData, setNfeData] = useState({
    autoEmit: true,
    serie: '1',
    nextNumber: '104',
    natureza: 'Venda de mercadoria adquirida de terceiros',
    certStatus: 'Certificado A1 Válido até 12/2027'
  })

  const [scriptsData, setScriptsData] = useState({
    gtmId: 'GTM-TKNX123',
    ga4Id: 'G-99887766',
    fbPixelId: '123456789012345',
    tiktokPixelId: 'TT-987654321'
  })

  const [domainData, setDomainData] = useState({
    customDomain: 'loja.teknix.com.br',
    sslStatus: 'Ativo e Seguro (HTTPS)'
  })

  const [checkoutMessage, setCheckoutMessage] = useState('Agradecemos sua preferência pela TEKNIX! Seu pedido será postado em até 24h úteis.')

  useEffect(() => {
    loadWhatsappSettings().then(setWhatsappData).catch(() => notifyHub('Não foi possível carregar as configurações do WhatsApp.', 'error'))
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('teknix:hub:settings')
      if (!saved) return
      const data = JSON.parse(saved)
      if (data.contactData) setContactData(prev => ({ ...prev, ...data.contactData }))
      if (data.checkoutData) setCheckoutData(prev => ({ ...prev, ...data.checkoutData }))
      if (typeof data.checkoutMessage === 'string') setCheckoutMessage(data.checkoutMessage)
      if (data.nfeData) setNfeData(prev => ({ ...prev, ...data.nfeData }))
      if (data.scriptsData) setScriptsData(prev => ({ ...prev, ...data.scriptsData }))
      if (data.domainData) setDomainData(prev => ({ ...prev, ...data.domainData }))
    } catch {
      notifyHub('Não foi possível carregar as configurações salvas.', 'error')
    }
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await saveWhatsappSettings(whatsappData)
      localStorage.setItem('teknix:hub:settings', JSON.stringify({
        contactData, checkoutData, checkoutMessage, nfeData, scriptsData, domainData
      }))
      window.dispatchEvent(new Event('teknix:settings-updated'))
      setSaving(false)
      notifyHub('Configurações salvas com sucesso!')
    } catch {
      setSaving(false)
      notifyHub('Não foi possível salvar as configurações no Supabase.', 'error')
    }
  }

  return (
    <div className="settings-page-layout">
      {/* Settings Navigation Sidebar */}
      <aside className="settings-nav-sidebar">
        <div className="settings-back-header" onClick={() => navigate('/hub')}>
          <ChevronLeft size={18} /> Configurações
        </div>

        {/* Pagamentos e Envios */}
        <div className="settings-group">
          <div className="settings-group-title">Pagamentos e envios</div>
          <button
            className={`settings-nav-item ${activeSection === 'payments' ? 'active' : ''}`}
            onClick={() => navigate('/hub/pagamentos')}
          >
            <CreditCard size={16} /> Meios de pagamento
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'shipping' ? 'active' : ''}`}
            onClick={() => navigate('/hub/entregas')}
          >
            <Truck size={16} /> Meios de envio
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'distribution' ? 'active' : ''}`}
            onClick={() => setActiveSection('distribution')}
          >
            <MapPin size={16} /> Centros de distribuição
          </button>
        </div>

        {/* Documentos Fiscais */}
        <div className="settings-group">
          <div className="settings-group-title">Documentos fiscais</div>
          <button
            className="settings-nav-item"
            onClick={() => navigate('/hub/configuracoes/fiscal')}
          >
            <FileText size={16} /> NF-e (Nota Fiscal & SEFAZ)
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'dce' ? 'active' : ''}`}
            onClick={() => setActiveSection('dce')}
          >
            <FileText size={16} /> DC-e (Declaração)
          </button>
        </div>

        {/* Comunicação */}
        <div className="settings-group">
          <div className="settings-group-title">Comunicação</div>
          <button
            className={`settings-nav-item ${activeSection === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveSection('contact')}
          >
            <Phone size={16} /> Informação de contato
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'whatsapp' ? 'active' : ''}`}
            onClick={() => setActiveSection('whatsapp')}
          >
            <MessageSquare size={16} /> Botão de WhatsApp
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'emails' ? 'active' : ''}`}
            onClick={() => setActiveSection('emails')}
          >
            <Mail size={16} /> E-mails automáticos
          </button>
        </div>

        {/* Checkout */}
        <div className="settings-group">
          <div className="settings-group-title">Checkout</div>
          <button
            className={`settings-nav-item ${activeSection === 'checkout' ? 'active' : ''}`}
            onClick={() => setActiveSection('checkout')}
          >
            <ShoppingCart size={16} /> Opções de checkout
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'checkout-message' ? 'active' : ''}`}
            onClick={() => setActiveSection('checkout-message')}
          >
            <MessageSquare size={16} /> Mensagem para clientes
          </button>
        </div>

        {/* Outros / Equipe */}
        <div className="settings-group">
          <div className="settings-group-title">Equipe e Permissões</div>
          <button
            className={`settings-nav-item ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => setActiveSection('users')}
          >
            <ShieldCheck size={16} /> Permissões dos colaboradores
          </button>
        </div>

        {/* Outros */}
        <div className="settings-group">
          <div className="settings-group-title">Outros</div>
          <button
            className={`settings-nav-item ${activeSection === 'domains' ? 'active' : ''}`}
            onClick={() => setActiveSection('domains')}
          >
            <Globe size={16} /> Domínios
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'scripts' ? 'active' : ''}`}
            onClick={() => setActiveSection('scripts')}
          >
            <Code size={16} /> Códigos externos
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'languages' ? 'active' : ''}`}
            onClick={() => setActiveSection('languages')}
          >
            <Globe size={16} /> Idiomas e moedas
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'redirects' ? 'active' : ''}`}
            onClick={() => setActiveSection('redirects')}
          >
            <Shuffle size={16} /> Redirecionamentos 301
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'custom-fields' ? 'active' : ''}`}
            onClick={() => setActiveSection('custom-fields')}
          >
            <Edit3 size={16} /> Campos personalizados
          </button>
        </div>
      </aside>

      {/* Main Settings Content Area */}
      <main className="settings-content-area">
        <div className="settings-content-wrapper">
          
          {/* Informação de Contato */}
          {activeSection === 'contact' && (
            <>
              <div className="settings-header-box">
                <div className="settings-title-with-back">
                  <button
                    type="button"
                    className="btn-back-to-settings"
                    onClick={() => navigate('/hub')}
                    title="Voltar ao Painel"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h1 className="settings-main-title">Informação de contato</h1>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div className="settings-form-group">
                  <label className="settings-label">
                    Nome da empresa / Nome do responsável
                  </label>
                  <input
                    className="settings-input"
                    value={contactData.storeName}
                    onChange={(e) => setContactData({ ...contactData, storeName: e.target.value })}
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">
                    CNPJ ou CPF
                  </label>
                  <input
                    className="settings-input"
                    value={contactData.cnpj}
                    onChange={(e) => setContactData({ ...contactData, cnpj: e.target.value })}
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">
                    E-mail da loja
                  </label>
                  <input
                    className="settings-input"
                    value={contactData.email}
                    onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                  />
                  <span className="settings-hint">
                    Pode ser diferente do e-mail que você usa para acessar seu painel administrador.
                  </span>
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">
                    Endereço da loja
                  </label>
                  <input
                    className="settings-input"
                    value={contactData.address}
                    onChange={(e) => setContactData({ ...contactData, address: e.target.value })}
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">
                    Telefone da sua loja
                  </label>
                  <input
                    className="settings-input"
                    value={contactData.phone}
                    onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                  />
                </div>

                <div className="settings-form-group">
                  <label className="settings-label">
                    Texto informativo para contato
                  </label>
                  <textarea
                    className="settings-textarea"
                    rows={3}
                    placeholder="Informação adicional que você queira exibir no formulário de contato."
                    defaultValue="Atendimento de Segunda a Sexta, das 08h às 18h."
                  />
                  <span className="settings-hint">
                    Informação adicional que você queira exibir no formulário de contato.
                  </span>
                </div>

                <div className="settings-actions-footer">
                  <button className="btn btn-secondary" onClick={() => navigate('/hub')}>Cancelar</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'center', marginTop: 8 }}>
                <a href="#" className="settings-footer-link">
                  Mais sobre Informação de contato ↗
                </a>
              </div>
            </>
          )}

          {/* Botão de WhatsApp */}
          {activeSection === 'whatsapp' && (
            <>
              <div className="settings-header-box">
                <div className="settings-title-with-back">
                  <button
                    type="button"
                    className="btn-back-to-settings"
                    onClick={() => navigate('/hub')}
                    title="Voltar ao Painel"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h1 className="settings-main-title">Botão de WhatsApp</h1>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <label className="toggle-switch-label">
                  <input
                    type="checkbox"
                    className="toggle-switch-input"
                    checked={whatsappData.enabled}
                    onChange={(e) => setWhatsappData({ ...whatsappData, enabled: e.target.checked })}
                  />
                  Ativar botão flutuante de WhatsApp na loja
                </label>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Número do WhatsApp com DDD</label>
                  <input
                    className="settings-input"
                    placeholder="5511999999999"
                    value={whatsappData.phoneNumber}
                    onChange={(e) => setWhatsappData({ ...whatsappData, phoneNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Mensagem Inicial Padrão</label>
                  <textarea
                    className="settings-textarea"
                    rows={3}
                    value={whatsappData.defaultMessage}
                    onChange={(e) => setWhatsappData({ ...whatsappData, defaultMessage: e.target.value })}
                  />
                </div>

                <div>
                  <label className="settings-label" htmlFor="whatsapp-position">Posição na tela</label>
                  <select
                    id="whatsapp-position"
                    className="settings-select"
                    value={whatsappData.position}
                    onChange={(e) => setWhatsappData({ ...whatsappData, position: e.target.value as 'br' | 'bl' })}
                  >
                    <option value="br">Canto inferior direito</option>
                    <option value="bl">Canto inferior esquerdo</option>
                  </select>
                </div>

                <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
              </div>
            </>
          )}

          {/* NF-e */}
          {activeSection === 'nfe' && (
            <>
              <div className="settings-header-box">
                <div className="settings-title-with-back">
                  <button
                    type="button"
                    className="btn-back-to-settings"
                    onClick={() => navigate('/hub')}
                    title="Voltar ao Painel"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h1 className="settings-main-title">Nota Fiscal Eletrônica (NF-e)</h1>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div style={{ background: '#e6f9f0', padding: '12px 16px', borderRadius: 8, color: '#00a854', fontWeight: 600, fontSize: '0.85rem' }}>
                  ✓ {nfeData.certStatus}
                </div>

                <label className="toggle-switch-label">
                  <input
                    type="checkbox"
                    className="toggle-switch-input"
                    checked={nfeData.autoEmit}
                    onChange={(e) => setNfeData({ ...nfeData, autoEmit: e.target.checked })}
                  />
                  Emitir NF-e automaticamente ao aprovar pagamento
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Série da NF-e</label>
                    <input
                      className="settings-input"
                      value={nfeData.serie}
                      onChange={(e) => setNfeData({ ...nfeData, serie: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Próximo Número</label>
                    <input
                      className="settings-input"
                      value={nfeData.nextNumber}
                      onChange={(e) => setNfeData({ ...nfeData, nextNumber: e.target.value })}
                    />
                  </div>
                </div>

                <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar Dados Fiscais'}
                </button>
              </div>
            </>
          )}

          {/* Opções do Checkout (Prints 2 & 3) */}
          {activeSection === 'checkout' && (
            <>
              <div className="settings-header-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="settings-title-with-back">
                  <button
                    type="button"
                    className="btn-back-to-settings"
                    onClick={() => navigate('/hub')}
                    title="Voltar ao Painel"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h1 className="settings-main-title">Opções do checkout</h1>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>

              {/* Layout */}
              <div className="settings-card">
                <h3 className="settings-card-title">Layout</h3>
                <label className="toggle-switch-label">
                  <input type="checkbox" className="toggle-switch-input" defaultChecked />
                  Usar as cores do seu layout no checkout
                </label>
              </div>

              {/* Dados do cliente */}
              <div className="settings-card">
                <h3 className="settings-card-title">Dados do cliente</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#000000' }}>Telefone</div>
                  <label className="toggle-switch-label">
                    <input type="checkbox" className="toggle-switch-input" />
                    Pedir telefone de contato
                  </label>

                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#000000', marginTop: 4 }}>Emissão de notas fiscais</div>
                  <label className="toggle-switch-label">
                    <input type="checkbox" className="toggle-switch-input" defaultChecked />
                    Pedir endereço para emissão de nota fiscal
                  </label>
                </div>
              </div>

              {/* Mensagem do cliente */}
              <div className="settings-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="settings-card-title" style={{ margin: 0 }}>Mensagem do cliente</h3>
                  <input type="checkbox" className="toggle-switch-input" defaultChecked />
                </div>
                
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Nome do campo</label>
                  <input className="settings-input" defaultValue="Instruções sobre o pedido" />
                </div>

                <label className="toggle-switch-label">
                  <input type="checkbox" className="toggle-switch-input" />
                  Marcar campo como obrigatório
                </label>
              </div>

              {/* ClearSale */}
              <div className="settings-card">
                <h3 className="settings-card-title">ClearSale</h3>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Código de integração</label>
                  <input className="settings-input" placeholder="Insira o código de integração" />
                </div>
              </div>

              {/* Restringir compras */}
              <div className="settings-card">
                <h3 className="settings-card-title">Restringir compras</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                    <input type="radio" name="restrict" defaultChecked /> Todos os clientes
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                    <input type="radio" name="restrict" /> Somente clientes autorizados (B2B / Atacado)
                  </label>
                </div>
              </div>

              {/* Alterar meio de pagamento */}
              <div className="settings-card">
                <h3 className="settings-card-title">Alterar meio de pagamento</h3>
                <label className="toggle-switch-label">
                  <input type="checkbox" className="toggle-switch-input" defaultChecked />
                  Permita que seus clientes escolham outro meio de pagamento pela página de acompanhamento e aumente suas vendas.
                </label>
                <a href="#" style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                  Mais sobre alteração de meio de pagamento ↗
                </a>
              </div>

              {/* Checkout acelerado */}
              <div className="settings-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 className="settings-card-title" style={{ margin: 0 }}>Checkout acelerado TEKNIX Pay</h3>
                  <input type="checkbox" className="toggle-switch-input" defaultChecked />
                </div>
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e40af' }}>Benefício exclusivo TEKNIX Pay</div>
                  <div style={{ fontSize: '0.8rem', color: '#3b82f6', marginTop: 4 }}>Preenchimento automático de dados e cartões salvos. Aumente em até 7% a conversão.</div>
                </div>
              </div>

              <div style={{ textAlign: 'center', margin: '10px 0 20px' }}>
                <a href="#" style={{ fontSize: '0.82rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                  Mais sobre checkout ↗
                </a>
              </div>
            </>
          )}

          {activeSection === 'checkout-message' && (
            <>
              <div className="settings-header-box">
                <div className="settings-title-with-back">
                  <button
                    type="button"
                    className="btn-back-to-settings"
                    onClick={() => navigate('/hub')}
                    title="Voltar ao Painel"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h1 className="settings-main-title">Mensagem para clientes</h1>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
              <div className="settings-card">
                <label className="settings-label" htmlFor="checkout-message">Mensagem de confirmação</label>
                <textarea
                  id="checkout-message"
                  className="settings-textarea"
                  value={checkoutMessage}
                  onChange={event => setCheckoutMessage(event.target.value)}
                  maxLength={240}
                />
                <span className="settings-hint">{checkoutMessage.length}/240 caracteres</span>
              </div>
            </>
          )}

          {/* Permissões dos Colaboradores (Equipe) */}
          {activeSection === 'users' && (
            <CollaboratorsPermissionsTab />
          )}

          {/* Idiomas e moedas (Print 1) */}
          {activeSection === 'languages' && (
            <>
              <div className="settings-header-box" style={{ marginBottom: 16 }}>
                <div className="settings-title-with-back">
                  <button
                    type="button"
                    className="btn-back-to-settings"
                    onClick={() => navigate('/hub')}
                    title="Voltar ao Painel"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h1 className="settings-main-title">Idiomas e moedas</h1>
                  </div>
                </div>
              </div>

              {/* Países habilitados */}
              <div className="settings-card">
                <h3 className="settings-card-title">Países habilitados</h3>
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#2563eb', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textAlign: 'left', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                  onClick={() => notifyHub('A habilitação de novos países será configurada em breve.', 'info')}
                >
                  ⊕ Habilitar outro país
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 16px', marginTop: 8 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#000000' }}>🇧🇷 Brasil</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Reais (BRL) • Português (PT-BR)</div>
                  </div>
                  <button className="btn-secondary-action" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>Editar</button>
                </div>
              </div>

              {/* País padrão da loja */}
              <div className="settings-card">
                <h3 className="settings-card-title">País padrão da loja</h3>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>País padrão</label>
                  <select className="settings-input">
                    <option value="br">🇧🇷 Brasil</option>
                    <option value="us">🇺🇸 Estados Unidos (USD)</option>
                    <option value="es">🇪🇸 Espanha / Europa (EUR)</option>
                  </select>
                </div>
              </div>

              {/* Moeda do administrador */}
              <div className="settings-card">
                <h3 className="settings-card-title">Moeda do administrador</h3>
                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Moeda padrão</label>
                  <select className="settings-input">
                    <option value="brl">Reais (R$ / BRL)</option>
                    <option value="usd">Dólares (US$ / USD)</option>
                  </select>
                </div>
                <button className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 6 }} onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </>
          )}

          {/* Códigos externos (Print 5) */}
          {activeSection === 'scripts' && (
            <>
              <div className="settings-header-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="settings-title-with-back">
                  <button
                    type="button"
                    className="btn-back-to-settings"
                    onClick={() => navigate('/hub')}
                    title="Voltar ao Painel"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h1 className="settings-main-title">Códigos externos</h1>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>

              <div className="settings-card" style={{ gap: 20 }}>
                <div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#000000', margin: '0 0 16px 0' }}>Google</h2>
                  
                  {/* Google Tag Manager */}
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#000000', margin: '0 0 4px 0' }}>Google Tag Manager</h3>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 8px 0' }}>Insira aqui a ID gerada pelo Google Tag Manager para sua loja.</p>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Google GTM ID:</label>
                    <input
                      className="settings-input"
                      placeholder="Ex.: GTM-XXXXXXX"
                      value={scriptsData.gtmId}
                      onChange={(e) => setScriptsData({ ...scriptsData, gtmId: e.target.value })}
                    />
                  </div>

                  {/* Google Analytics 4 */}
                  <div style={{ marginBottom: 16 }}>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#000000', margin: '0 0 4px 0' }}>Google Analytics 4</h3>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 8px 0' }}>Se você já tem uma conta de Google Analytics 4, adicione o código para medir o tráfego da sua loja e a efetividade de suas campanhas.</p>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>ID de medição</label>
                        <input
                          className="settings-input"
                          placeholder="Ex.: G-Y4JC6GH7G5"
                          value={scriptsData.ga4Id}
                          onChange={(e) => setScriptsData({ ...scriptsData, ga4Id: e.target.value })}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Valor secreto da API</label>
                        <input
                          className="settings-input"
                          placeholder="Ex.: lEUt6nSbRHeWfjM2vbZZGg"
                          value="IEUt6nSbRHeWfjM2vbZZGg"
                          onChange={() => {}}
                        />
                      </div>

                      <a href="#" style={{ fontSize: '0.8rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
                        Como vincular com Google Analytics ↗
                      </a>
                    </div>
                  </div>

                  {/* Verificação de propriedade */}
                  <div>
                    <h3 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#000000', margin: '0 0 4px 0' }}>Verificação de propriedade da loja no Google</h3>
                    <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: '0 0 8px 0' }}>Além de validar a propriedade do domínio, você poderá saber que palavras-chave seus clientes usaram para te encontrar.</p>
                    <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Metaetiqueta do Google</label>
                    <textarea
                      className="settings-textarea"
                      rows={3}
                      placeholder='Ex.: <meta name="google-site-verification" content="contenido" />'
                      value='<meta name="google-site-verification" content="teknix-verification-code-2026" />'
                      onChange={() => {}}
                    />
                  </div>

                </div>
              </div>
            </>
          )}

          {/* Domínios */}
          {activeSection === 'domains' && (
            <>
              <div className="settings-header-box">
                <div className="settings-title-with-back">
                  <button
                    type="button"
                    className="btn-back-to-settings"
                    onClick={() => navigate('/hub')}
                    title="Voltar ao Painel"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h1 className="settings-main-title">Domínios e SSL</h1>
                  </div>
                </div>
              </div>

              <div className="settings-card">
                <div style={{ background: '#e6f9f0', padding: '12px 16px', borderRadius: 8, color: '#00a854', fontWeight: 600, fontSize: '0.85rem' }}>
                  ✓ Certificado SSL {domainData.sslStatus}
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151' }}>Domínio Próprio Principal</label>
                  <input
                    className="settings-input"
                    value={domainData.customDomain}
                    onChange={(e) => setDomainData({ ...domainData, customDomain: e.target.value })}
                  />
                </div>

                <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Atualizar Domínio'}
                </button>
              </div>
            </>
          )}

          {/* E-mails automáticos */}
          {activeSection === 'emails' && (
            <>
              <div className="settings-header-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="settings-title-with-back">
                  <button
                    type="button"
                    className="btn-back-to-settings"
                    onClick={() => navigate('/hub')}
                    title="Voltar ao Painel"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h1 className="settings-main-title">E-mails automáticos</h1>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>

              <div className="settings-card" style={{ gap: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#000000' }}>Confirmação de pedido realizado</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Enviado assim que o cliente finaliza o checkout.</div>
                  </div>
                  <input type="checkbox" className="toggle-switch-input" defaultChecked />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#000000' }}>Pagamento confirmado</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Enviado quando o PIX ou Cartão é aprovado.</div>
                  </div>
                  <input type="checkbox" className="toggle-switch-input" defaultChecked />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#000000' }}>Pedido enviado com código de rastreio</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Enviado ao despachar a mercadoria com link dos Correios / Transportadora.</div>
                  </div>
                  <input type="checkbox" className="toggle-switch-input" defaultChecked />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#000000' }}>Recuperação de carrinho abandonado</div>
                    <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>Enviado 2 horas após o abandono com incentivo de cupom.</div>
                  </div>
                  <input type="checkbox" className="toggle-switch-input" defaultChecked />
                </div>
              </div>
            </>
          )}

          {/* DC-e */}
          {activeSection === 'dce' && (
            <>
              <div className="settings-header-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="settings-title-with-back">
                  <button
                    type="button"
                    className="btn-back-to-settings"
                    onClick={() => navigate('/hub')}
                    title="Voltar ao Painel"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h1 className="settings-main-title">DC-e (Declaração de Conteúdo Eletrônica)</h1>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>

              <div className="settings-card">
                <label className="toggle-switch-label">
                  <input type="checkbox" className="toggle-switch-input" defaultChecked />
                  Gerar Declaração de Conteúdo automaticamente nas etiquetas dos Correios
                </label>
              </div>
            </>
          )}

          {/* Redirecionamentos 301 */}
          {activeSection === 'redirects' && (
            <>
              <div className="settings-header-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="settings-title-with-back">
                  <button
                    type="button"
                    className="btn-back-to-settings"
                    onClick={() => navigate('/hub')}
                    title="Voltar ao Painel"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h1 className="settings-main-title">Redirecionamentos 301 (SEO)</h1>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>

              <div className="settings-card">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'center' }}>
                  <input className="settings-input" placeholder="URL antiga (Ex: /produto-antigo)" />
                  <input className="settings-input" placeholder="Nova URL (Ex: /produtos/novo-modelo)" />
                  <button className="btn-secondary-action">+ Adicionar 301</button>
                </div>
              </div>
            </>
          )}

          {/* Campos Personalizados */}
          {activeSection === 'custom-fields' && (
            <>
              <div className="settings-header-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div className="settings-title-with-back">
                  <button
                    type="button"
                    className="btn-back-to-settings"
                    onClick={() => navigate('/hub')}
                    title="Voltar ao Painel"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h1 className="settings-main-title">Campos personalizados</h1>
                  </div>
                </div>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>

              <div className="settings-card">
                <button className="btn-secondary-action" style={{ alignSelf: 'flex-start' }}>+ Novo Campo Personalizado</button>
              </div>
            </>
          )}

          {/* Centros de Distribuição / Outros fallback */}
          {activeSection === 'distribution' && (
            <>
              <div className="settings-header-box">
                <div className="settings-title-with-back">
                  <button
                    type="button"
                    className="btn-back-to-settings"
                    onClick={() => navigate('/hub')}
                    title="Voltar ao Painel"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <div>
                    <h1 className="settings-main-title">Centros de Distribuição</h1>
                  </div>
                </div>
              </div>
              <div className="settings-card">
                <h3 className="settings-card-title">Matriz Principal</h3>
                <p className="settings-card-desc">CEP de Origem: 01310-100 — São Paulo, SP</p>
                <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>Ativo para cálculo dos Correios e Transportadoras</div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  )
}
