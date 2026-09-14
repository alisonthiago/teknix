import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CreditCard, Truck, MapPin, FileText, Phone, MessageSquare, Mail,
  ShoppingCart, Users, Globe, Code, Shuffle, Edit3, ChevronLeft, Save, ShieldCheck,
  Eye, EyeOff, Check, Sparkles
} from 'lucide-react'
import CollaboratorsPermissionsTab from '../components/CollaboratorsPermissionsTab'
import PaymentMethods from './PaymentMethods'
import ShippingSettings from './ShippingSettings'
import FiscalSettings from './FiscalSettings'
import { notifyHub } from '../lib/hubNotifications'
import { DEFAULT_WHATSAPP_SETTINGS, loadWhatsappSettings, saveWhatsappSettings } from '../services/storeSettings'
import './SettingsHub.css'

interface PageOption {
  id: string
  label: string
  path: string
  desc: string
}

const AVAILABLE_PAGES: PageOption[] = [
  { id: 'home', label: 'Página Inicial (Home)', path: '/', desc: 'Vitrine principal e página de entrada da loja' },
  { id: 'products', label: 'Páginas de Produtos', path: '/produto/*', desc: 'Página de detalhes, fotos e compra de produtos' },
  { id: 'categories', label: 'Categorias & Departamentos', path: '/ferramentas, /mac, etc.', desc: 'Listagens de produtos por departamento' },
  { id: 'cart', label: 'Sacola de Compras', path: '/sacola', desc: 'Carrinho de compras antes do checkout' },
  { id: 'checkout', label: 'Página de Checkout', path: '/checkout', desc: 'Finalização do pedido e pagamento' },
  { id: 'institutional', label: 'Institucional & Ajuda', path: '/ajuda, /sobre-nos', desc: 'Central de ajuda, notícias e páginas legais' },
  { id: 'account', label: 'Área do Cliente & Pedidos', path: '/conta, /pedidos', desc: 'Painel do cliente logado e histórico de compras' }
]

export default function SettingsHub() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeSection, setActiveSection] = useState(tabParam || 'contact')
  const [saving, setSaving] = useState(false)
  const [previewSimulatedPage, setPreviewSimulatedPage] = useState<'home' | 'products' | 'categories' | 'cart' | 'checkout' | 'institutional'>('home')
  const [previewPopupOpen, setPreviewPopupOpen] = useState(true)

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      if (tab === 'fiscal') setActiveSection('nfe')
      else setActiveSection(tab)
    }
  }, [searchParams])

  const handleSelectSection = (sec: string) => {
    setActiveSection(sec)
    setSearchParams({ tab: sec })
  }

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
            onClick={() => handleSelectSection('payments')}
          >
            <CreditCard size={16} /> Meios de pagamento
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'shipping' ? 'active' : ''}`}
            onClick={() => handleSelectSection('shipping')}
          >
            <Truck size={16} /> Meios de envio
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'distribution' ? 'active' : ''}`}
            onClick={() => handleSelectSection('distribution')}
          >
            <MapPin size={16} /> Centros de distribuição
          </button>
        </div>

        {/* Documentos Fiscais */}
        <div className="settings-group">
          <div className="settings-group-title">Documentos fiscais</div>
          <button
            className={`settings-nav-item ${activeSection === 'nfe' ? 'active' : ''}`}
            onClick={() => handleSelectSection('nfe')}
          >
            <FileText size={16} /> NF-e (Nota Fiscal & SEFAZ)
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'dce' ? 'active' : ''}`}
            onClick={() => handleSelectSection('dce')}
          >
            <FileText size={16} /> DC-e (Declaração)
          </button>
        </div>

        {/* Comunicação */}
        <div className="settings-group">
          <div className="settings-group-title">Comunicação</div>
          <button
            className={`settings-nav-item ${activeSection === 'contact' ? 'active' : ''}`}
            onClick={() => handleSelectSection('contact')}
          >
            <Phone size={16} /> Informação de contato
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'whatsapp' ? 'active' : ''}`}
            onClick={() => handleSelectSection('whatsapp')}
          >
            <MessageSquare size={16} /> Botão de WhatsApp
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'emails' ? 'active' : ''}`}
            onClick={() => handleSelectSection('emails')}
          >
            <Mail size={16} /> E-mails automáticos
          </button>
        </div>

        {/* Checkout */}
        <div className="settings-group">
          <div className="settings-group-title">Checkout</div>
          <button
            className={`settings-nav-item ${activeSection === 'checkout' ? 'active' : ''}`}
            onClick={() => handleSelectSection('checkout')}
          >
            <ShoppingCart size={16} /> Opções de checkout
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'checkout-message' ? 'active' : ''}`}
            onClick={() => handleSelectSection('checkout-message')}
          >
            <MessageSquare size={16} /> Mensagem para clientes
          </button>
        </div>

        {/* Outros / Equipe */}
        <div className="settings-group">
          <div className="settings-group-title">Equipe e Permissões</div>
          <button
            className={`settings-nav-item ${activeSection === 'users' ? 'active' : ''}`}
            onClick={() => handleSelectSection('users')}
          >
            <ShieldCheck size={16} /> Permissões dos colaboradores
          </button>
        </div>

        {/* Outros */}
        <div className="settings-group">
          <div className="settings-group-title">Outros</div>
          <button
            className={`settings-nav-item ${activeSection === 'domains' ? 'active' : ''}`}
            onClick={() => handleSelectSection('domains')}
          >
            <Globe size={16} /> Domínios
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'scripts' ? 'active' : ''}`}
            onClick={() => handleSelectSection('scripts')}
          >
            <Code size={16} /> Códigos externos
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'languages' ? 'active' : ''}`}
            onClick={() => handleSelectSection('languages')}
          >
            <Globe size={16} /> Idiomas e moedas
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'redirects' ? 'active' : ''}`}
            onClick={() => handleSelectSection('redirects')}
          >
            <Shuffle size={16} /> Redirecionamentos 301
          </button>
          <button
            className={`settings-nav-item ${activeSection === 'custom-fields' ? 'active' : ''}`}
            onClick={() => handleSelectSection('custom-fields')}
          >
            <Edit3 size={16} /> Campos personalizados
          </button>
        </div>
      </aside>

      {/* Main Settings Content Area */}
      <main className="settings-content-area">
        <div className="settings-content-wrapper">
          
          {/* Meios de Pagamento */}
          {activeSection === 'payments' && (
            <PaymentMethods embedded />
          )}

          {/* Meios de Envio */}
          {activeSection === 'shipping' && (
            <ShippingSettings embedded />
          )}

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
          {activeSection === 'whatsapp' && (() => {
            const isButtonVisibleInPreview = (() => {
              if (!whatsappData.enabled) return false
              const mode = whatsappData.pageDisplayMode || 'all'
              if (mode === 'all') return true
              const selected = whatsappData.selectedPages || []
              const isSelected = selected.includes(previewSimulatedPage)
              if (mode === 'specific') return isSelected
              if (mode === 'exclude') return !isSelected
              return true
            })()

            return (
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
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>
                        Configure o botão flutuante de atendimento, regras de visibilidade por página e visualize em tempo real.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="whatsapp-config-grid">
                  {/* Coluna Esquerda: Formulário de Configuração */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Card 1: Comportamento & Contato */}
                    <div className="settings-card" style={{ margin: 0 }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px', color: '#111827' }}>
                        Comportamento & Contato
                      </h3>

                      <label className="toggle-switch-label">
                        <input
                          type="checkbox"
                          className="toggle-switch-input"
                          checked={whatsappData.enabled}
                          onChange={(e) => setWhatsappData({ ...whatsappData, enabled: e.target.checked })}
                        />
                        Ativar botão flutuante de WhatsApp na loja
                      </label>

                      <div style={{ marginTop: 14 }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                          Número do WhatsApp com DDD
                        </label>
                        <input
                          className="settings-input"
                          placeholder="Ex: 5511998887766 (código do país + DDD + número)"
                          value={whatsappData.phoneNumber}
                          onChange={(e) => setWhatsappData({ ...whatsappData, phoneNumber: e.target.value })}
                        />
                        <span style={{ fontSize: '11px', color: '#6b7280', marginTop: 4, display: 'block' }}>
                          Utilize apenas números com DDI e DDD (exemplo: 5511998887766).
                        </span>
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>
                          Mensagem Inicial Padrão
                        </label>
                        <textarea
                          className="settings-textarea"
                          rows={3}
                          value={whatsappData.defaultMessage}
                          onChange={(e) => setWhatsappData({ ...whatsappData, defaultMessage: e.target.value })}
                          placeholder="Mensagem pré-preenchida que o cliente enviará ao iniciar a conversa..."
                        />
                      </div>

                      <div style={{ marginTop: 14 }}>
                        <label className="settings-label" htmlFor="whatsapp-position">Posição na tela</label>
                        <select
                          id="whatsapp-position"
                          className="settings-select"
                          value={whatsappData.position}
                          onChange={(e) => setWhatsappData({ ...whatsappData, position: e.target.value as 'br' | 'bl' })}
                        >
                          <option value="br">Canto inferior direito (Padrão e recomendado)</option>
                          <option value="bl">Canto inferior esquerdo</option>
                        </select>
                      </div>
                    </div>

                    {/* Card 2: Regras de Exibição por Página */}
                    <div className="settings-card" style={{ margin: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#111827' }}>
                          Onde exibir o botão flutuante?
                        </h3>
                        <span style={{ fontSize: '11.5px', color: '#0071e3', background: '#eff6ff', padding: '2px 8px', borderRadius: 12, fontWeight: 600 }}>
                          Regras de Páginas
                        </span>
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#6b7280', margin: '0 0 12px', lineHeight: 1.4 }}>
                        Escolha se deseja que o WhatsApp apareça em todo o site ou restrinja a páginas estratégicas para não atrapalhar conversões.
                      </p>

                      <div className="display-modes-container">
                        <div
                          className={`display-mode-card ${(!whatsappData.pageDisplayMode || whatsappData.pageDisplayMode === 'all') ? 'active' : ''}`}
                          onClick={() => setWhatsappData({ ...whatsappData, pageDisplayMode: 'all' })}
                        >
                          <div className="display-mode-radio-circle">
                            {(!whatsappData.pageDisplayMode || whatsappData.pageDisplayMode === 'all') && <div className="display-mode-radio-dot" />}
                          </div>
                          <div className="display-mode-info">
                            <span className="display-mode-title">Todas as páginas da loja</span>
                            <span className="display-mode-desc">O botão ficará visível permanentemente em qualquer página do e-commerce.</span>
                          </div>
                        </div>

                        <div
                          className={`display-mode-card ${whatsappData.pageDisplayMode === 'specific' ? 'active' : ''}`}
                          onClick={() => setWhatsappData({ ...whatsappData, pageDisplayMode: 'specific' })}
                        >
                          <div className="display-mode-radio-circle">
                            {whatsappData.pageDisplayMode === 'specific' && <div className="display-mode-radio-dot" />}
                          </div>
                          <div className="display-mode-info">
                            <span className="display-mode-title">Apenas nas páginas selecionadas</span>
                            <span className="display-mode-desc">O botão só aparecerá nas páginas que você marcar abaixo.</span>
                          </div>
                        </div>

                        <div
                          className={`display-mode-card ${whatsappData.pageDisplayMode === 'exclude' ? 'active' : ''}`}
                          onClick={() => setWhatsappData({ ...whatsappData, pageDisplayMode: 'exclude' })}
                        >
                          <div className="display-mode-radio-circle">
                            {whatsappData.pageDisplayMode === 'exclude' && <div className="display-mode-radio-dot" />}
                          </div>
                          <div className="display-mode-info">
                            <span className="display-mode-title">Em todas as páginas, EXCETO nas selecionadas</span>
                            <span className="display-mode-desc">Oculta o WhatsApp em páginas críticas (como checkout ou sacola) para foco na compra.</span>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Páginas para seleção caso mode !== 'all' */}
                      {whatsappData.pageDisplayMode && whatsappData.pageDisplayMode !== 'all' && (
                        <div className="pages-selection-list">
                          <div style={{ fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                            {whatsappData.pageDisplayMode === 'specific'
                              ? 'Marque as páginas onde o WhatsApp DEVE aparecer:'
                              : 'Marque as páginas onde o WhatsApp NÃO DEVE aparecer (Ocultar):'}
                          </div>

                          {AVAILABLE_PAGES.map(page => {
                            const isSelected = (whatsappData.selectedPages || []).includes(page.id)
                            return (
                              <div
                                key={page.id}
                                className={`page-select-checkbox-item ${isSelected ? 'selected' : ''}`}
                                onClick={() => {
                                  const current = whatsappData.selectedPages || []
                                  const next = isSelected
                                    ? current.filter(id => id !== page.id)
                                    : [...current, page.id]
                                  setWhatsappData({ ...whatsappData, selectedPages: next })
                                }}
                              >
                                <div className="page-checkbox-left">
                                  <div className="page-checkbox-custom">
                                    {isSelected && <Check size={12} strokeWidth={3} />}
                                  </div>
                                  <div>
                                    <div className="page-item-title">{page.label}</div>
                                    <div style={{ fontSize: '11px', color: '#64748b' }}>{page.desc}</div>
                                  </div>
                                </div>
                                <span className="page-item-path">{page.path}</span>
                              </div>
                            )
                          })}
                        </div>
                      )}

                      <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10 }}>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                          {saving ? 'Salvando...' : 'Salvar Configurações'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Coluna Direita: Prévia Interativa em Tempo Real */}
                  <div className="whatsapp-preview-card">
                    <div className="whatsapp-preview-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Eye size={16} color="#0071e3" />
                        <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#111827' }}>
                          Prévia da Loja em Tempo Real
                        </h3>
                      </div>
                      <span className="preview-badge-live">
                        <span className="preview-pulse-dot" /> Ao Vivo
                      </span>
                    </div>

                    {/* Moldura de Janela de Navegador */}
                    <div className="browser-window-mockup">
                      <div className="browser-top-bar">
                        <div className="browser-traffic-dots">
                          <div className="browser-dot red" />
                          <div className="browser-dot yellow" />
                          <div className="browser-dot green" />
                        </div>
                        <div className="browser-url-pill">
                          <Globe size={11} color="#94a3b8" />
                          <span>teknixbrasil.com.br{AVAILABLE_PAGES.find(p => p.id === previewSimulatedPage)?.path || ''}</span>
                        </div>
                      </div>

                      {/* Abas para alternar a página simulada na prévia */}
                      <div className="preview-page-tabs">
                        <button
                          type="button"
                          className={`preview-tab-btn ${previewSimulatedPage === 'home' ? 'active' : ''}`}
                          onClick={() => setPreviewSimulatedPage('home')}
                        >
                          Home
                        </button>
                        <button
                          type="button"
                          className={`preview-tab-btn ${previewSimulatedPage === 'products' ? 'active' : ''}`}
                          onClick={() => setPreviewSimulatedPage('products')}
                        >
                          Produto
                        </button>
                        <button
                          type="button"
                          className={`preview-tab-btn ${previewSimulatedPage === 'categories' ? 'active' : ''}`}
                          onClick={() => setPreviewSimulatedPage('categories')}
                        >
                          Categorias
                        </button>
                        <button
                          type="button"
                          className={`preview-tab-btn ${previewSimulatedPage === 'cart' ? 'active' : ''}`}
                          onClick={() => setPreviewSimulatedPage('cart')}
                        >
                          Sacola
                        </button>
                        <button
                          type="button"
                          className={`preview-tab-btn ${previewSimulatedPage === 'checkout' ? 'active' : ''}`}
                          onClick={() => setPreviewSimulatedPage('checkout')}
                        >
                          Checkout
                        </button>
                        <button
                          type="button"
                          className={`preview-tab-btn ${previewSimulatedPage === 'institutional' ? 'active' : ''}`}
                          onClick={() => setPreviewSimulatedPage('institutional')}
                        >
                          Ajuda
                        </button>
                      </div>

                      {/* Viewport da Loja */}
                      <div className="browser-viewport-content">
                        {/* Header Simulado da Loja */}
                        <div className="viewport-store-header">
                          <span className="viewport-logo-text">TEKNIX</span>
                          <div className="viewport-nav-items">
                            <span>Ferramentas</span>
                            <span>Mac</span>
                            <span>Áudio</span>
                          </div>
                        </div>

                        {/* Conteúdo Dinâmico por Página Simulada */}
                        <div className="viewport-body-mock">
                          {previewSimulatedPage === 'home' && (
                            <>
                              <div className="viewport-hero-banner">
                                <div className="viewport-hero-title" />
                                <div className="viewport-hero-desc" />
                              </div>
                              <div className="viewport-cards-row">
                                <div className="viewport-card-box"><div className="viewport-card-img" /><div className="viewport-card-line" /></div>
                                <div className="viewport-card-box"><div className="viewport-card-img" /><div className="viewport-card-line" /></div>
                                <div className="viewport-card-box"><div className="viewport-card-img" /><div className="viewport-card-line" /></div>
                              </div>
                            </>
                          )}
                          {previewSimulatedPage === 'products' && (
                            <div style={{ display: 'flex', gap: 12, padding: 10, background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', height: 180 }}>
                              <div style={{ width: '45%', background: '#f8fafc', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#94a3b8' }}>
                                Foto do Produto
                              </div>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                                <div style={{ height: 12, background: '#0f172a', width: '80%', borderRadius: 3 }} />
                                <div style={{ height: 16, background: '#10b981', width: '40%', borderRadius: 4 }} />
                                <div style={{ height: 26, background: '#0071e3', borderRadius: 6, width: '90%', marginTop: 6 }} />
                              </div>
                            </div>
                          )}
                          {previewSimulatedPage === 'cart' && (
                            <div style={{ padding: 12, background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Sua Sacola de Compras (1 item)</div>
                              <div style={{ height: 32, background: '#f8fafc', borderRadius: 4, border: '1px solid #f1f5f9' }} />
                              <div style={{ height: 24, background: '#0071e3', borderRadius: 4, width: '100%', marginTop: 8 }} />
                            </div>
                          )}
                          {previewSimulatedPage === 'checkout' && (
                            <div style={{ padding: 12, background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, color: '#0f172a' }}>Finalização de Pagamento (PIX / Cartão)</div>
                              <div style={{ height: 20, background: '#f1f5f9', borderRadius: 4 }} />
                              <div style={{ height: 20, background: '#f1f5f9', borderRadius: 4 }} />
                              <div style={{ height: 26, background: '#16a34a', borderRadius: 6, marginTop: 6 }} />
                            </div>
                          )}
                          {(previewSimulatedPage === 'categories' || previewSimulatedPage === 'institutional') && (
                            <div style={{ padding: 14, background: '#ffffff', borderRadius: 8, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                              <div style={{ height: 12, background: '#64748b', width: '50%', borderRadius: 3 }} />
                              <div style={{ height: 8, background: '#e2e8f0', width: '90%', borderRadius: 2 }} />
                              <div style={{ height: 8, background: '#e2e8f0', width: '80%', borderRadius: 2 }} />
                            </div>
                          )}
                        </div>

                        {/* Se o botão estiver desativado ou oculto na página */}
                        {!isButtonVisibleInPreview && (
                          <div className="preview-hidden-overlay">
                            <div className="preview-hidden-badge">
                              <EyeOff size={13} />
                              <span>{!whatsappData.enabled ? 'Botão desativado nas configurações' : 'Oculto nesta página por regra de visibilidade'}</span>
                            </div>
                            <span style={{ fontSize: '11px', color: '#64748b', maxWidth: 220 }}>
                              {!whatsappData.enabled
                                ? 'Ative o interruptor acima para exibir o botão.'
                                : `Configurado para não exibir em ${AVAILABLE_PAGES.find(p => p.id === previewSimulatedPage)?.label}.`}
                            </span>
                          </div>
                        )}

                        {/* Botão Flutuante e Popup Interativo na Prévia */}
                        {isButtonVisibleInPreview && (
                          <>
                            {/* Balão Popup Simulado */}
                            {previewPopupOpen && (
                              <div className={`preview-whatsapp-popup pos-${whatsappData.position || 'br'}`}>
                                <div className="preview-popup-top">
                                  <div>
                                    <h4>Fale com a Teknix</h4>
                                    <span>Resposta rápida</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => setPreviewPopupOpen(false)}
                                    style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', fontSize: 13, lineHeight: 1 }}
                                  >
                                    ×
                                  </button>
                                </div>
                                <div className="preview-popup-content">
                                  <div className="preview-speech-bubble">
                                    {whatsappData.defaultMessage || 'Olá! Vim do site TEKNIX e gostaria de tirar uma dúvida sobre os produtos.'}
                                  </div>
                                  <button type="button" className="preview-send-btn-mock">
                                    Iniciar Conversa
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Botão Flutuante */}
                            <button
                              type="button"
                              className={`preview-whatsapp-btn pos-${whatsappData.position || 'br'}`}
                              onClick={() => setPreviewPopupOpen(!previewPopupOpen)}
                              title="Clique para testar abertura e fechamento do balão"
                            >
                              <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                                  </svg>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#64748b' }}>
                          <span>💡 Clique no botão verde na prévia para testar a abertura</span>
                          <span>Posição: {whatsappData.position === 'bl' ? 'Esquerda' : 'Direita'}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )
              })()}

          {/* NF-e (Nota Fiscal & SEFAZ) */}
          {activeSection === 'nfe' && (
            <FiscalSettings embedded />
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
                <div style={{ background: '#F7F7F7', border: '1px solid #e5e7eb', borderRadius: 8, padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1f2328' }}>Benefício exclusivo TEKNIX Pay</div>
                  <div style={{ fontSize: '0.8rem', color: '#666666', marginTop: 4 }}>Preenchimento automático de dados e cartões salvos. Aumente em até 7% a conversão.</div>
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
