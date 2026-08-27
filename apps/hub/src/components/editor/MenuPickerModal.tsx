import React, { useState } from 'react'
import { X, Smartphone, Monitor, Tablet, Search, ShoppingBag } from 'lucide-react'
import './MenuPickerModal.css'
import type { MobileMenuModel, HeaderModel } from './GlobalHeaderRenderer'

// ─── Mobile Menu Catalog ───────────────────────────────────────────────────
const MOBILE_MENUS: {
  id: MobileMenuModel
  name: string
  desc: string
  group: string
  preview: React.ReactNode
}[] = [
  {
    id: 'apple_drawer',
    name: 'Apple Drawer Clássico',
    desc: 'Dark vertical com links de conta no rodapé',
    group: 'Clássicos',
    preview: (
      <div className="mprev dark-drawer">
        {['Store', 'Mac', 'iPad', 'iPhone', 'Watch', 'AirPods'].map(l => (
          <div key={l} className="mprev-link">{l}</div>
        ))}
        <div className="mprev-footer-links"><span>Minha Conta</span><span>Pedido</span></div>
      </div>
    ),
  },
  {
    id: 'categories_accordion',
    name: 'Categorias Acordeão',
    desc: 'Cards com chevron por categoria',
    group: 'Clássicos',
    preview: (
      <div className="mprev light-accordion">
        {['Departamentos', 'Store', 'Mac', 'iPhone', 'iPad'].map((l, i) => (
          <div key={l} className={`mprev-cat-card ${i === 0 ? 'header' : ''}`}>
            <span>{l}</span>
            {i > 0 && <span className="mprev-chevron">›</span>}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'dark_pro',
    name: 'Dark Pro Imersivo',
    desc: 'Hero text + links com dot indicador',
    group: 'Clássicos',
    preview: (
      <div className="mprev dark-pro">
        <div className="mprev-hero-text">
          <strong>TEKNIX Store</strong>
          <small>Tecnologia de alta precisão</small>
        </div>
        {['Store', 'Mac', 'iPad', 'iPhone'].map(l => (
          <div key={l} className="mprev-pro-link">
            <span>{l}</span><span className="mprev-dot" />
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'compact_grid',
    name: 'Compact Grid 2×2',
    desc: 'Grade compacta de categorias',
    group: 'Clássicos',
    preview: (
      <div className="mprev grid-compact">
        {['Store', 'Mac', 'iPad', 'iPhone', 'Watch', 'Vision'].map(l => (
          <div key={l} className="mprev-grid-card">{l}</div>
        ))}
      </div>
    ),
  },
  {
    id: 'profile_blue_drawer',
    name: 'Profile Blue Drawer',
    desc: 'Azul com avatar, ícones e seta por item',
    group: 'App Sidebar Dark',
    preview: (
      <div className="mprev blue-drawer">
        <div className="mprev-profile-row">
          <div className="mprev-avatar blue" />
          <div><div className="mprev-name">Minha Conta</div><div className="mprev-email">cliente@tecnix.com.br</div></div>
        </div>
        {['Home', 'Produtos', 'Favoritos', 'Notificações', 'Configurações'].map(l => (
          <div key={l} className="mprev-icon-row"><span className="mprev-icon-dot blue" /><span>{l}</span><span className="mprev-chevron">›</span></div>
        ))}
      </div>
    ),
  },
  {
    id: 'profile_purple_drawer',
    name: 'Profile Purple + Redes',
    desc: 'Roxo com item ativo teal e ícones sociais',
    group: 'App Sidebar Dark',
    preview: (
      <div className="mprev purple-drawer">
        <div className="mprev-profile-row">
          <div className="mprev-avatar purple" />
          <div><div className="mprev-name">Minha Conta</div><div className="mprev-email">cliente@teknix.com.br</div></div>
        </div>
        {['Home', 'Perfil', 'Favoritos', 'Mensagens', 'Sair'].map((l, i) => (
          <div key={l} className={`mprev-icon-row ${i === 0 ? 'active-teal' : ''}`}><span className="mprev-icon-dot purple" /><span>{l}</span></div>
        ))}
        <div className="mprev-social-row">
          {['fb', 'tw', 'yt', 'ig'].map(s => <span key={s} className="mprev-social">{s}</span>)}
        </div>
      </div>
    ),
  },
  {
    id: 'fullscreen_overlay',
    name: 'Fullscreen Overlay',
    desc: 'Tela cheia translúcida, itens centralizados',
    group: 'App Sidebar Dark',
    preview: (
      <div className="mprev fullscreen">
        <div className="mprev-overlay-profile">
          <div className="mprev-avatar large" />
          <div className="mprev-name">Minha Conta</div>
          <div className="mprev-email">Cliente TEKNIX</div>
        </div>
        {['Home', 'Produtos', 'Favoritos', 'Mensagens', 'Configurações'].map(l => (
          <div key={l} className="mprev-overlay-link">{l}</div>
        ))}
        <div className="mprev-overlay-close">x</div>
      </div>
    ),
  },
  {
    id: 'dark_settings_drawer',
    name: 'Dark Settings',
    desc: 'Preto puro, estilo Configurações do celular',
    group: 'App Sidebar Dark',
    preview: (
      <div className="mprev dark-settings">
        <div className="mprev-profile-row dark">
          <div className="mprev-avatar dark" />
          <div><div className="mprev-name light">Minha Conta</div><div className="mprev-email dim">@cliente</div></div>
          <span className="mprev-chevron dim">›</span>
        </div>
        {['Home', 'Produtos', 'Notificações', 'Configurações', 'Suporte'].map(l => (
          <div key={l} className="mprev-settings-item"><span className="mprev-icon-dot dark" /><span>{l}</span><span className="mprev-chevron dim">›</span></div>
        ))}
        <div className="mprev-logout-btn">Sair da Conta</div>
      </div>
    ),
  },
  {
    id: 'clean_light_drawer',
    name: 'Clean Light + Toggles',
    desc: 'Branco clean, alguns itens com toggle',
    group: 'Light / App Style',
    preview: (
      <div className="mprev clean-light">
        <div className="mprev-profile-row">
          <div className="mprev-avatar violet" />
          <div><div className="mprev-name dark">Creative Jeff</div><div className="mprev-email">jeff@teknix.com.br</div></div>
        </div>
        {[['Home', false], ['Produtos', false], ['Notificações', true], ['Mensagens', true], ['Configurações', false]].map(([l, tog]) => (
          <div key={String(l)} className="mprev-toggle-row">
            <span className="mprev-icon-dot violet" /><span className="dark">{String(l)}</span>
            {tog ? <span className="mprev-toggle-on" /> : <span className="mprev-chevron">›</span>}
          </div>
        ))}
      </div>
    ),
  },
  {
    id: 'light_tabbed_drawer',
    name: 'Light Tabbed Drawer',
    desc: 'Tabs no topo, cards com ícones, bottom bar',
    group: 'Light / App Style',
    preview: (
      <div className="mprev light-tabs">
        <div className="mprev-profile-row">
          <div className="mprev-avatar blue" />
          <div><div className="mprev-name dark">Julian Hart</div><div className="mprev-email">julian@teknix.com.br</div></div>
        </div>
        <div className="mprev-tabs-row">
          {['Store', 'Categ.', 'Sacola', 'Conta'].map((t, i) => (
            <span key={t} className={`mprev-tab ${i === 1 ? 'active' : ''}`}>{t}</span>
          ))}
        </div>
        <div className="mprev-cards-grid">
          {['Home', 'Grid', 'Sacola', 'Favorito', 'Estrela', 'Msg'].map(l => (
            <div key={l} className="mprev-icon-card"><span className="mprev-icon-dot blue" /><span>{l}</span></div>
          ))}
        </div>
        <div className="mprev-bottom-bar">
          <span className="mprev-bb-btn active">Home</span>
          <span className="mprev-bb-btn">Config</span>
          <span className="mprev-bb-btn">→</span>
        </div>
      </div>
    ),
  },
  {
    id: 'tab_grid_bottom',
    name: 'Tab Grid + Bottom Bar',
    desc: 'Grid 3 colunas com tabs e rodapé',
    group: 'Light / App Style',
    preview: (
      <div className="mprev tab-grid">
        <div className="mprev-profile-row compact">
          <div className="mprev-avatar blue small" />
          <div><div className="mprev-name dark small">Julian Hart</div></div>
        </div>
        <div className="mprev-tabs-row">
          {['Store', 'Categorias', 'Sacola'].map((t, i) => (
            <span key={t} className={`mprev-tab ${i === 1 ? 'active' : ''}`}>{t}</span>
          ))}
        </div>
        <div className="mprev-3x2-grid">
          {['Home', 'Grid', 'Sacola', 'Sino', 'Msg', 'Config'].map(l => (
            <div key={l} className="mprev-3x2-card"><span className="mprev-icon-dot blue" /><span>{l}</span></div>
          ))}
        </div>
        <div className="mprev-bottom-links">
          <span>Perfil</span><span>Config</span><span className="danger">Sair</span>
        </div>
      </div>
    ),
  },
  {
    id: 'grouped_sections_drawer',
    name: 'Grouped Sections',
    desc: 'Sidebar com grupos (PRODUTOS/CONTA/SUPORTE)',
    group: 'Light / App Style',
    preview: (
      <div className="mprev grouped">
        <div className="mprev-app-logo"><div className="mprev-logo-icon">TK</div><span className="mprev-app-name">TEKNIX</span></div>
        <div className="mprev-group-label">PRODUTOS</div>
        {['Catálogo', 'Loja', 'Destaque'].map((l, i) => (
          <div key={l} className={`mprev-gs-item ${i === 2 ? 'active' : ''}`}><span>{l}</span>{i === 1 && <span className="mprev-badge">14</span>}</div>
        ))}
        <div className="mprev-group-label">CONTA</div>
        {['Perfil', 'Notificações', 'Config'].map((l, i) => (
          <div key={l} className="mprev-gs-item"><span>{l}</span>{i === 1 && <span className="mprev-badge">3</span>}</div>
        ))}
        <div className="mprev-user-bottom">
          <div className="mprev-avatar small gray" />
          <div><div className="mprev-name dark small">Minha Conta</div><div className="mprev-email tiny">cliente@teknix.com.br</div></div>
        </div>
      </div>
    ),
  },
]

// ─── Desktop Menu Catalog ──────────────────────────────────────────────────
const DESKTOP_MENUS: {
  id: HeaderModel
  name: string
  desc: string
  preview: React.ReactNode
}[] = [
  {
    id: 'apple_dark',
    name: 'Apple Dark Translúcido',
    desc: 'Dark #161617 com blur oficial Apple',
    preview: (
      <div className="mprev-header dark">
        <div className="mprev-header-inner">
          <div className="mprev-header-brand">TK <strong>TEKNIX</strong></div>
          <div className="mprev-header-links">
            {['Store', 'Mac', 'iPad', 'iPhone', 'Watch'].map(l => <span key={l}>{l}</span>)}
          </div>
          <div className="mprev-header-icons"><Search size={13} /><ShoppingBag size={13} /></div>
        </div>
        <div className="mprev-header-tag">Dark Translúcido</div>
      </div>
    ),
  },
  {
    id: 'apple_light',
    name: 'Apple Light Editorial',
    desc: 'Branco clean com borda suave',
    preview: (
      <div className="mprev-header light">
        <div className="mprev-header-inner light">
          <div className="mprev-header-brand light">TK <strong>TEKNIX</strong></div>
          <div className="mprev-header-links light">
            {['Store', 'Mac', 'iPad', 'iPhone', 'Watch'].map(l => <span key={l}>{l}</span>)}
          </div>
          <div className="mprev-header-icons light"><Search size={13} /><ShoppingBag size={13} /></div>
        </div>
        <div className="mprev-header-tag light">Light Editorial</div>
      </div>
    ),
  },
  {
    id: 'industrial_pro',
    name: 'Industrial Pro Solid',
    desc: 'Preto sólido com destaque azul TEKNIX',
    preview: (
      <div className="mprev-header industrial">
        <div className="mprev-header-inner">
          <div className="mprev-header-brand"><span style={{ color: '#0071e3' }}>TK</span> <strong style={{ color: '#0071e3' }}>TEKNIX PRO</strong></div>
          <div className="mprev-header-links">
            {['Linha Pro', 'Brushless', 'Baterias'].map(l => <span key={l}>{l}</span>)}
          </div>
          <div className="mprev-header-icons"><ShoppingBag size={13} /></div>
        </div>
        <div className="mprev-header-tag">Black + Azul Elétrico</div>
      </div>
    ),
  },
  {
    id: 'ecommerce_search',
    name: 'E-commerce Search Express',
    desc: 'Barra de busca central, foco em conversão',
    preview: (
      <div className="mprev-header search">
        <div className="mprev-header-inner">
          <div className="mprev-header-brand">TK <strong>TEKNIX</strong></div>
          <div className="mprev-search-bar">Buscar ferramentas...</div>
          <div className="mprev-header-icons"><ShoppingBag size={13} /></div>
        </div>
        <div className="mprev-header-tag">E-commerce com Busca</div>
      </div>
    ),
  },
]

// ─── Component ────────────────────────────────────────────────────────────
interface MenuPickerModalProps {
  onClose: () => void
  currentMobileModel?: MobileMenuModel
  currentDesktopModel?: HeaderModel
  onSelectMobile: (model: MobileMenuModel) => void
  onSelectDesktop: (model: HeaderModel) => void
}

type DeviceTab = 'mobile' | 'desktop' | 'tablet'

export default function MenuPickerModal({
  onClose,
  currentMobileModel,
  currentDesktopModel,
  onSelectMobile,
  onSelectDesktop,
}: MenuPickerModalProps) {
  const [device, setDevice] = useState<DeviceTab>('mobile')
  const [activeGroup, setActiveGroup] = useState<string>('Todos')

  const mobileGroups = ['Todos', 'Clássicos', 'App Sidebar Dark', 'Light / App Style']
  const filteredMobile = activeGroup === 'Todos'
    ? MOBILE_MENUS
    : MOBILE_MENUS.filter(m => m.group === activeGroup)

  return (
    <div className="mpicker-backdrop" onClick={onClose}>
      <div className="mpicker-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="mpicker-header">
          <div className="mpicker-header-left">
            <div className="mpicker-brand">
              <span className="mpicker-brand-icon">☰</span>
              <span className="mpicker-title">Modelos de Menu</span>
            </div>
          </div>

          {/* Device Tabs */}
          <div className="mpicker-device-tabs">
            <button
              className={`mpicker-device-tab ${device === 'mobile' ? 'active' : ''}`}
              onClick={() => setDevice('mobile')}
            >
              <Smartphone size={14} />
              Celular
            </button>
            <button
              className={`mpicker-device-tab ${device === 'desktop' ? 'active' : ''}`}
              onClick={() => setDevice('desktop')}
            >
              <Monitor size={14} />
              Desktop
            </button>
            <button
              className={`mpicker-device-tab ${device === 'tablet' ? 'active' : ''}`}
              onClick={() => setDevice('tablet')}
            >
              <Tablet size={14} />
              Tablet
            </button>
          </div>

          <button className="mpicker-close" onClick={onClose} title="Fechar">
            <X size={18} />
          </button>
        </div>

        {/* Subbar — Mobile groups */}
        {device === 'mobile' && (
          <div className="mpicker-subbar">
            {mobileGroups.map(g => (
              <button
                key={g}
                className={`mpicker-group-pill ${activeGroup === g ? 'active' : ''}`}
                onClick={() => setActiveGroup(g)}
              >
                {g}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="mpicker-body">
          {/* ─── MOBILE ─── */}
          {device === 'mobile' && (
            <div className="mpicker-grid">
              {filteredMobile.map(menu => (
                <div
                  key={menu.id}
                  className={`mpicker-card ${currentMobileModel === menu.id ? 'selected' : ''}`}
                  onClick={() => { onSelectMobile(menu.id); onClose() }}
                >
                  <div className="mpicker-preview">{menu.preview}</div>
                  <div className="mpicker-card-footer">
                    <div className="mpicker-card-name">{menu.name}</div>
                    <div className="mpicker-card-desc">{menu.desc}</div>
                    <div className="mpicker-card-group">{menu.group}</div>
                  </div>
                  {currentMobileModel === menu.id && (
                    <div className="mpicker-selected-badge">✓ Ativo</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ─── DESKTOP ─── */}
          {device === 'desktop' && (
            <div className="mpicker-grid desktop">
              {DESKTOP_MENUS.map(menu => (
                <div
                  key={menu.id}
                  className={`mpicker-card desktop ${currentDesktopModel === menu.id ? 'selected' : ''}`}
                  onClick={() => { onSelectDesktop(menu.id); onClose() }}
                >
                  <div className="mpicker-preview desktop">{menu.preview}</div>
                  <div className="mpicker-card-footer">
                    <div className="mpicker-card-name">{menu.name}</div>
                    <div className="mpicker-card-desc">{menu.desc}</div>
                  </div>
                  {currentDesktopModel === menu.id && (
                    <div className="mpicker-selected-badge">✓ Ativo</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ─── TABLET ─── */}
          {device === 'tablet' && (
            <div className="mpicker-empty-state">
              <Tablet size={48} strokeWidth={1} />
              <h3>Modelos de Tablet</h3>
              <p>Em breve você poderá escolher layouts específicos para tablet.<br />Por enquanto, o tablet utiliza o mesmo menu desktop.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
