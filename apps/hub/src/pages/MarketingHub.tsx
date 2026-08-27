import { useState } from 'react'
import { Megaphone, TrendingUp, Mail, ShoppingCart, Share2, Sparkles, ArrowRight, CheckCircle2, DollarSign, Target, Gift } from 'lucide-react'
import './MarketingHub.css'

export default function MarketingHub() {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'integrations' | 'recovery' | 'popups'>('campaigns')

  return (
    <div className="marketing-page-container">
      <div className="marketing-wrapper">
        
        {/* Header */}
        <div className="page-header">
          <div className="header-info">
            <h1>Marketing</h1>
            <p>Gerencie canais de aquisição, recuperação de carrinhos e campanhas da loja.</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary">
              <Sparkles size={16} /> Nova campanha
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="marketing-tabs">
          <button className={`m-tab-btn ${activeTab === 'campaigns' ? 'active' : ''}`} onClick={() => setActiveTab('campaigns')}>
            <Megaphone size={15} /> Canais de Divulgação
          </button>
          <button className={`m-tab-btn ${activeTab === 'recovery' ? 'active' : ''}`} onClick={() => setActiveTab('recovery')}>
            <ShoppingCart size={15} /> Carrinho Abandonado
          </button>
          <button className={`m-tab-btn ${activeTab === 'popups' ? 'active' : ''}`} onClick={() => setActiveTab('popups')}>
            <Gift size={15} /> Pop-ups & Descontos
          </button>
          <button className={`m-tab-btn ${activeTab === 'integrations' ? 'active' : ''}`} onClick={() => setActiveTab('integrations')}>
            <Target size={15} /> Pixels & Rastreamento
          </button>
        </div>

        {/* 1. Canais de Divulgação */}
        {activeTab === 'campaigns' && (
          <div className="marketing-grid">
            
            {/* Google Shopping & Ads */}
            <div className="m-card">
              <div className="m-card-top">
                <div className="m-icon-box google">G</div>
                <div>
                  <h3 className="m-card-title">Google Shopping & Performance Max</h3>
                  <span className="m-card-badge active">● Conectado</span>
                </div>
              </div>
              <p className="m-card-desc">Exiba seus produtos no topo das pesquisas do Google com feed XML sincronizado automaticamente.</p>
              <div className="m-card-stats">
                <div>
                  <div className="stat-num">482</div>
                  <div className="stat-lbl">Produtos no Feed</div>
                </div>
                <div>
                  <div className="stat-num">1.840</div>
                  <div className="stat-lbl">Cliques no Mês</div>
                </div>
              </div>
              <button className="m-card-btn">Gerenciar Feed XML</button>
            </div>

            {/* Meta Ads (Instagram & Facebook) */}
            <div className="m-card">
              <div className="m-card-top">
                <div className="m-icon-box meta">M</div>
                <div>
                  <h3 className="m-card-title">Instagram & Facebook Shopping</h3>
                  <span className="m-card-badge active">● Catálogo Ativo</span>
                </div>
              </div>
              <p className="m-card-desc">Marque seus produtos nas publicações do Instagram (Sacolinha) e anuncie com o Pixel do Meta.</p>
              <div className="m-card-stats">
                <div>
                  <div className="stat-num">482</div>
                  <div className="stat-lbl">Produtos Sincronizados</div>
                </div>
                <div>
                  <div className="stat-num">2.4x</div>
                  <div className="stat-lbl">ROAS Médio</div>
                </div>
              </div>
              <button className="m-card-btn">Configurar Catálogo Meta</button>
            </div>

            {/* TikTok Ads */}
            <div className="m-card">
              <div className="m-card-top">
                <div className="m-icon-box tiktok">TT</div>
                <div>
                  <h3 className="m-card-title">TikTok for Business</h3>
                  <span className="m-card-badge ready">Pronto para ativar</span>
                </div>
              </div>
              <p className="m-card-desc">Crie anúncios em vídeo no TikTok e alcance milhões de compradores com campanhas dinâmicas.</p>
              <div className="m-card-stats">
                <div>
                  <div className="stat-num">—</div>
                  <div className="stat-lbl">Campanhas</div>
                </div>
                <div>
                  <div className="stat-num">Ativo</div>
                  <div className="stat-lbl">Pixel ID</div>
                </div>
              </div>
              <button className="m-card-btn primary">Conectar TikTok Ads</button>
            </div>

          </div>
        )}

        {/* 2. Recuperação de Carrinho Abandonado */}
        {activeTab === 'recovery' && (
          <div className="recovery-section">
            <div className="m-card large">
              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800 }}>Fluxos Automáticos de Recuperação</h3>
              <p style={{ color: '#6b7280', fontSize: '0.84rem', margin: '0 0 20px 0' }}>
                Dispare e-mails e mensagens de WhatsApp para clientes que não concluíram a compra.
              </p>

              <div className="recovery-rules-list">
                <div className="rule-item">
                  <div className="rule-info">
                    <Mail size={20} color="#2563eb" />
                    <div>
                      <div className="rule-title">E-mail 1: Lembrete Rápido (Após 1 hora)</div>
                      <div className="rule-desc">"Você esqueceu alguns itens no seu carrinho! Finalize agora com 5% de desconto."</div>
                    </div>
                  </div>
                  <label className="toggle-switch-label">
                    <input type="checkbox" className="toggle-switch-input" defaultChecked />
                  </label>
                </div>

                <div className="rule-item">
                  <div className="rule-info">
                    <Mail size={20} color="#7c3aed" />
                    <div>
                      <div className="rule-title">E-mail 2: Cupom Exclusivo (Após 24 horas)</div>
                      <div className="rule-desc">"Última chance: Seu cupom VOLTA10 de 10% OFF expira em 12 horas."</div>
                    </div>
                  </div>
                  <label className="toggle-switch-label">
                    <input type="checkbox" className="toggle-switch-input" defaultChecked />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Pop-ups */}
        {activeTab === 'popups' && (
          <div className="popups-grid">
            <div className="m-card">
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1rem', fontWeight: 700 }}>Pop-up de Primeira Compra</h3>
              <p style={{ fontSize: '0.82rem', color: '#6b7280' }}>Ofereça 10% OFF no primeiro pedido em troca do e-mail/WhatsApp do cliente.</p>
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 14, margin: '14px 0', textAlign: 'center' }}>
                <div style={{ fontWeight: 800, color: '#111827' }}>🎁 Ganhe 10% de Desconto</div>
                <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 4 }}>Cadastre seu e-mail e receba o cupom BEMVINDO</div>
              </div>
              <button className="m-card-btn primary">Personalizar Pop-up</button>
            </div>
          </div>
        )}

        {/* 4. Pixels */}
        {activeTab === 'integrations' && (
          <div className="m-card">
            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem', fontWeight: 700 }}>Status dos Pixels Instalados</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span>Google Tag Manager (GTM)</span><strong>GTM-TK92849 (Ativo)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span>Google Analytics 4 (GA4)</span><strong>G-Y4JC6GH7G5 (Ativo)</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span>Meta Pixel (Facebook/Instagram)</span><strong>184920194819 (Ativo)</strong>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
