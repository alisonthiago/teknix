import { useState, useMemo } from 'react'
import { renderTemplate, NOTIFICATION_TEMPLATES } from '../../../../packages/core/src/notifications/templates'
import './EmailPreview.css'

interface TemplateMeta {
  title: string
  tag: string
  category: 'Conta' | 'Pedidos' | 'Financeiro' | 'Segurança' | 'Operação'
  icon: string
}

const TEMPLATE_METADATA: Record<string, TemplateMeta> = {
  'user.created': {
    title: 'Boas-vindas à TEKNIX',
    tag: 'user.created',
    category: 'Conta',
    icon: '👋'
  },
  'order.created': {
    title: 'Pedido Recebido',
    tag: 'order.created',
    category: 'Pedidos',
    icon: '🛒'
  },
  'order.paid': {
    title: 'Pagamento Confirmado',
    tag: 'order.paid',
    category: 'Financeiro',
    icon: '✅'
  },
  'order.shipped': {
    title: 'Pedido Enviado (Rastreio)',
    tag: 'order.shipped',
    category: 'Pedidos',
    icon: '🚚'
  },
  'order.delivered': {
    title: 'Pedido Entregue',
    tag: 'order.delivered',
    category: 'Pedidos',
    icon: '🎉'
  },
  'order.cancelled': {
    title: 'Pedido Cancelado',
    tag: 'order.cancelled',
    category: 'Pedidos',
    icon: '❌'
  },
  'payment.failed': {
    title: 'Falha no Pagamento',
    tag: 'payment.failed',
    category: 'Financeiro',
    icon: '⚠️'
  },
  'user.2fa.required': {
    title: 'Código 2FA (Segurança)',
    tag: 'user.2fa.required',
    category: 'Segurança',
    icon: '🔐'
  },
  'user.password.reset': {
    title: 'Redefinição de Senha',
    tag: 'user.password.reset',
    category: 'Segurança',
    icon: '🔑'
  },
  'user.email.verified': {
    title: 'E-mail Verificado',
    tag: 'user.email.verified',
    category: 'Conta',
    icon: '✉️'
  },
  'security.alert': {
    title: 'Alerta de Segurança',
    tag: 'security.alert',
    category: 'Segurança',
    icon: '🚨'
  },
  'marketplace.sale': {
    title: 'Nova Venda (Lojista)',
    tag: 'marketplace.sale',
    category: 'Operação',
    icon: '💰'
  },
  'system.notice': {
    title: 'Aviso do Sistema',
    tag: 'system.notice',
    category: 'Conta',
    icon: '📢'
  }
}

const MOCK_VARIABLES = {
  name: 'Alison Thiago',
  orderNumber: 'TK-92841',
  total: 'R$ 1.849,00',
  date: '08 de Setembro de 2026',
  itemsCount: '2',
  trackingCode: 'BR849204128TK',
  carrier: 'Correios Sedex Express',
  deliveryEstimate: '11 a 14 de setembro',
  code: '492 108',
  expiresInMinutes: '10',
  resetLink: 'https://teknixbrasil.com.br/login?mode=reset&token=tk92841xyz',
  email: 'alisonsilvathiago@gmail.com',
  alertDescription: 'Novo acesso registrado em São Paulo / Safari macOS',
  timestamp: '08/09/2026 às 20:38',
  ipAddress: '189.120.45.12',
  marketplace: 'Loja Oficial TEKNIX',
  title: 'Atualização Programada dos Termos de Serviço',
  message: 'Atualizamos nossa política de garantia e entrega para proporcionar maior transparência em suas compras.'
}

export default function EmailPreview() {
  const [selectedKey, setSelectedKey] = useState<string>('user.created')
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop')
  const [activeCategory, setActiveCategory] = useState<string>('Todos')

  const categories = ['Todos', 'Conta', 'Pedidos', 'Financeiro', 'Segurança', 'Operação']

  const templateKeys = useMemo(() => {
    const keys = Object.keys(NOTIFICATION_TEMPLATES)
    if (activeCategory === 'Todos') return keys
    return keys.filter(k => TEMPLATE_METADATA[k]?.category === activeCategory)
  }, [activeCategory])

  const currentTemplate = useMemo(() => {
    return renderTemplate(selectedKey, MOCK_VARIABLES)
  }, [selectedKey])

  const currentMeta = TEMPLATE_METADATA[selectedKey] || {
    title: selectedKey,
    tag: selectedKey,
    category: 'Conta',
    icon: '📄'
  }

  return (
    <div className="email-preview-container">
      {/* SIDEBAR */}
      <aside className="ep-sidebar">
        <div className="ep-sidebar-brand">
          <div className="ep-logo-badge">TEKNIX</div>
          <span className="ep-brand-sub">Transational Mail Engine</span>
        </div>

        {/* Categorias Pills */}
        <div className="ep-category-filter">
          {categories.map(cat => (
            <button
              key={cat}
              className={`ep-cat-pill ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Lista de Templates */}
        <div className="ep-templates-nav">
          {templateKeys.map(key => {
            const meta = TEMPLATE_METADATA[key] || { title: key, tag: key, icon: '📄' }
            const isSelected = selectedKey === key
            return (
              <button
                key={key}
                className={`ep-template-item ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedKey(key)}
              >
                <span className="ep-template-icon">{meta.icon}</span>
                <div className="ep-template-info">
                  <span className="ep-template-title">{meta.title}</span>
                  <span className="ep-template-tag">{key}</span>
                </div>
              </button>
            )
          })}
        </div>

        <div className="ep-sidebar-footer">
          <div className="ep-status-pill">
            <span className="ep-status-dot" />
            <span>Brevo SMTP Conectado</span>
          </div>
          <p className="ep-footer-text">De: nao-responda@teknixbrasil.com.br</p>
        </div>
      </aside>

      {/* ÁREA DE VISUALIZAÇÃO */}
      <main className="ep-viewport">
        <header className="ep-viewport-header">
          <div className="ep-subject-block">
            <div className="ep-subject-badge">Assunto do E-mail</div>
            <h2 className="ep-subject-text">{currentTemplate.subject}</h2>
          </div>

          <div className="ep-device-switch">
            <button
              className={`ep-switch-btn ${deviceMode === 'desktop' ? 'active' : ''}`}
              onClick={() => setDeviceMode('desktop')}
            >
              🖥️ Desktop (600px)
            </button>
            <button
              className={`ep-switch-btn ${deviceMode === 'mobile' ? 'active' : ''}`}
              onClick={() => setDeviceMode('mobile')}
            >
              📱 Mobile (375px)
            </button>
          </div>
        </header>

        <div className="ep-canvas">
          <div className={`ep-device-wrapper ${deviceMode}`}>
            <iframe
              title="Email Preview"
              className="ep-iframe"
              srcDoc={currentTemplate.bodyHtml}
            />
          </div>
        </div>
      </main>
    </div>
  )
}
