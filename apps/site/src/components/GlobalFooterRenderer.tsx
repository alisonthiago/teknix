import { useState } from 'react'
import {
  Check, Phone,
  Wrench, ShieldCheck, Send, Globe, Edit3, Smartphone, Apple
} from 'lucide-react'
import './GlobalHeaderFooter.css'

export type FooterModel =
  | 'apple_directory_5cols_light'
  | 'apple_directory_5cols_dark'
  | 'apple_minimal_clean'
  | 'apple_glassmorphism'
  | 'editorial_dark_studio'
  | 'ecommerce_enterprise'
  | 'modern_tech_grid'
  | 'compact_app_store'

export interface FooterConfig {
  model?: FooterModel
  showSosumiNotes?: boolean
  notes?: string[]
  companyName?: string
  copyrightYear?: number
  showCountryFlag?: boolean
  countryText?: string
  newsletterTitle?: string
  newsletterSub?: string
  contactTitle?: string
  columns?: Array<{
    id: string
    sections: Array<{
      title: string
      links: Array<{ label: string; url: string }>
    }>
  }>
  phone?: string
  shopText?: string
  legalLinks?: Array<{ label: string; url: string }>
}

const DEFAULT_FOOTER_NOTES = [
  'Ofertas válidas por tempo limitado para compras qualificadas. Sujeito a aprovação de crédito e termos de serviço.',
  'Parcelamento em até 12x sem juros no cartão ou 5% de desconto à vista no Pix. Consulte condições na finalização da compra.',
  'A durabilidade da bateria e especificações de torque variam de acordo com o uso e a configuração. Para mais informações, consulte a página técnica do produto.',
  'A tecnologia TEKNIX Brushless e os recursos avançados estão disponíveis em dispositivos compatíveis com o ecossistema oficial.'
]

const DEFAULT_FOOTER_COLUMNS = [
  {
    id: 'col1',
    sections: [
      { title: 'Compre e aprenda', links: [
        { label: 'Loja Oficial', url: '/loja' },
        { label: 'Parafusadeiras', url: '/produtos/parafusadeiras' },
        { label: 'Furadeiras de Impacto', url: '/produtos/furadeiras' },
        { label: 'Esmerilhadeiras', url: '/produtos/esmerilhadeiras' },
        { label: 'Iluminação Solar', url: '/produtos/iluminacao-solar' },
        { label: 'Refletores LED', url: '/produtos/refletores' },
        { label: 'Acessórios & Baterias', url: '/produtos/acessorios' },
      ]},
      { title: 'Carteira TEKNIX', links: [
        { label: 'Conta TEKNIX', url: '/minha-conta' },
        { label: 'TEKNIX Pay', url: '/checkout' },
        { label: 'Cashback & Pontos', url: '/minha-conta' },
      ]}
    ]
  },
  {
    id: 'col2',
    sections: [
      { title: 'Conta', links: [
        { label: 'Gerencie sua conta', url: '/minha-conta' },
        { label: 'Conta da TEKNIX Store', url: '/minha-conta' },
        { label: 'Garantia Técnica', url: '/minha-conta' },
      ]},
      { title: 'Entretenimento & Mídia', links: [
        { label: 'TEKNIX Plus+', url: '/loja' },
        { label: 'Catálogo Interativo', url: '/loja' },
        { label: 'Comunidade Pro', url: '/loja' },
      ]}
    ]
  },
  {
    id: 'col3',
    sections: [
      { title: 'TEKNIX Store', links: [
        { label: 'Encontre uma loja / Distribuidor', url: '/contato' },
        { label: 'Assistência Autorizada', url: '/contato' },
        { label: 'Hoje na TEKNIX (Workshops)', url: '/contato' },
        { label: 'Financiamento & Parcelamento', url: '/checkout' },
        { label: 'Status do Pedido', url: '/minha-conta' },
        { label: 'Ajuda para Compras', url: '/contato' },
      ]}
    ]
  },
  {
    id: 'col4',
    sections: [
      { title: 'Para empresas', links: [
        { label: 'TEKNIX e Negócios (B2B)', url: '/contato' },
        { label: 'Faturamento Direto', url: '/contato' },
        { label: 'Projetos Industriais', url: '/contato' },
      ]},
      { title: 'Para fins profissionais', links: [
        { label: 'Programa de Instaladores', url: '/contato' },
        { label: 'Treinamento Especializado', url: '/contato' },
        { label: 'Engenharia & Manutenção', url: '/contato' },
      ]}
    ]
  },
  {
    id: 'col5',
    sections: [
      { title: 'Valores da TEKNIX', links: [
        { label: 'Acessibilidade', url: '/contato' },
        { label: 'Meio Ambiente & Solar', url: '/contato' },
        { label: 'Privacidade e Dados', url: '/contato' },
        { label: 'Inovação e Qualidade', url: '/contato' },
      ]},
      { title: 'Sobre a TEKNIX', links: [
        { label: 'Sala de Imprensa', url: '/contato' },
        { label: 'Liderança TEKNIX', url: '/contato' },
        { label: 'Oportunidades de Carreira', url: '/contato' },
        { label: 'Investidores', url: '/contato' },
        { label: 'Ética e Conformidade', url: '/contato' },
        { label: 'Entre em contato', url: '/contato' },
      ]}
    ]
  }
]

const DEFAULT_LEGAL_LINKS = [
  { label: 'Política de Privacidade', url: '/contato' },
  { label: 'Termos de Uso', url: '/contato' },
  { label: 'Vendas e reembolsos', url: '/contato' },
  { label: 'Jurídico', url: '/contato' },
  { label: 'Mapa do site', url: '/contato' },
]

export interface GlobalFooterRendererProps {
  config?: FooterConfig
  isEditor?: boolean
  isSelected?: boolean
  onSelect?: () => void
  onChangeConfig?: (cfg: FooterConfig) => void
  onHideFooter?: () => void
  viewport?: 'desktop' | 'tablet' | 'mobile'
}

export default function GlobalFooterRenderer({
  config = {},
  isEditor = false,
  isSelected = false,
  onSelect,
  viewport = 'desktop'
}: GlobalFooterRendererProps) {
  const model: FooterModel = config.model || 'apple_directory_5cols_light'
  const notes = config.notes && config.notes.length > 0 ? config.notes : DEFAULT_FOOTER_NOTES
  const columns = config.columns && config.columns.length > 0 ? config.columns : DEFAULT_FOOTER_COLUMNS
  const legalLinks = config.legalLinks && config.legalLinks.length > 0 ? config.legalLinks : DEFAULT_LEGAL_LINKS
  const showSosumi = config.showSosumiNotes !== false
  const isMobile = viewport === 'mobile' || viewport === 'tablet'

  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSent, setNewsletterSent] = useState(false)

  return (
    <div
      className={`teknix-global-footer-root ${isEditor ? 'is-editor-mode' : ''} ${isSelected ? 'is-selected' : ''} ${isMobile ? 'viewport-mobile' : ''}`}
      onClick={isEditor ? (e) => { e.stopPropagation(); onSelect?.() } : undefined}
      style={{ position: 'relative', cursor: isEditor ? 'pointer' : 'default' }}
    >
      {/* Selection pill inside Hub editor */}
      {isEditor && isSelected && (
        <ul className="elementor-editor-section-settings is-header-badge" style={{ top: -14, left: 16 }}>
          <li className="elementor-editor-element-setting elementor-editor-element-edit" title="Rodapé Global Ativo">
            <Edit3 size={10} strokeWidth={2.5} style={{ marginRight: 4 }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Rodapé</span>
          </li>
        </ul>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODEL 1 & 2: OFFICIAL APPLE 5-COLUMN DIRECTORY (LIGHT & DARK) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {(model === 'apple_directory_5cols_light' || model === 'apple_directory_5cols_dark') && (
        <footer id="ac-globalfooter" className={`ac-globalfooter model-${model} ${isMobile ? 'is-mobile-footer' : ''}`} role="contentinfo">
          <div className="ac-gf-content">
            {showSosumi && notes.length > 0 && (
              <section className="ac-gf-sosumi" aria-label="Notas de rodapé">
                <ul>
                  {notes.map((note, idx) => (
                    <li key={idx}><small>{idx + 1}.</small> {note}</li>
                  ))}
                </ul>
              </section>
            )}

            <nav className={`ac-gf-directory ${isMobile ? 'is-mobile-directory' : ''}`} aria-label="Diretório TEKNIX">
              {columns.map((col, cIdx) => (
                <div key={col.id || cIdx} className="ac-gf-directory-column">
                  {col.sections.map((sec, sIdx) => (
                    <div key={sIdx} className="ac-gf-directory-column-section">
                      <h3 className="ac-gf-directory-title">{sec.title}</h3>
                      <ul className="ac-gf-directory-list">
                        {sec.links.map((lk, lIdx) => (
                          <li key={lIdx}><a href={lk.url} onClick={e => isEditor && e.preventDefault()}>{lk.label}</a></li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </nav>

            <section className="ac-gf-footer">
              <div className="ac-gf-footer-shop">
                {config.shopText || 'Mais opções de compra:'}{' '}
                <a href="/contato" onClick={e => isEditor && e.preventDefault()}>Encontre uma loja perto de você</a>.{' '}
                Ou ligue para <a href={`tel:${(config.phone || '08007610880').replace(/\s/g, '')}`}>{config.phone || '0800 761 0880'}</a>.
              </div>
              <div className="ac-gf-footer-legal">
                <div className="ac-gf-footer-legal-copyright">
                  Copyright © {config.copyrightYear || new Date().getFullYear()} {config.companyName || 'TEKNIX Inc.'} Todos os direitos reservados.
                </div>
                <ul className="ac-gf-footer-legal-links">
                  {legalLinks.map((lk, i) => (
                    <li key={i}><a href={lk.url} onClick={e => isEditor && e.preventDefault()}>{lk.label}</a></li>
                  ))}
                </ul>
                <div className="ac-gf-footer-locale">{config.countryText || 'Brasil'}</div>
              </div>
            </section>
          </div>
        </footer>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODEL 3: APPLE MINIMAL CLEAN (1 LINHA) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {model === 'apple_minimal_clean' && (
        <footer className="teknix-footer-minimal-clean" role="contentinfo">
          <div className="minimal-clean-inner">
            <div className="minimal-clean-logo-group">
              <strong style={{ fontSize: 13, color: '#1d1d1f' }}>{config.companyName || 'TEKNIX'}</strong>
              <span style={{ fontSize: 11, color: '#86868b' }}>• {config.countryText || 'Brasil'}</span>
            </div>
            <ul className="minimal-clean-links">
              <li><a href="/produtos" onClick={e => isEditor && e.preventDefault()}>Produtos</a></li>
              <li><a href="/sobre" onClick={e => isEditor && e.preventDefault()}>Sobre</a></li>
              <li><a href="/suporte" onClick={e => isEditor && e.preventDefault()}>Suporte</a></li>
              <li><a href="/contato" onClick={e => isEditor && e.preventDefault()}>Contato</a></li>
            </ul>
            <div className="minimal-clean-copy">
              © {config.copyrightYear || new Date().getFullYear()} {config.companyName || 'TEKNIX Inc.'}
            </div>
          </div>
        </footer>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODEL 4: APPLE GLASSMORPHISM TRANSLÚCIDO */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {model === 'apple_glassmorphism' && (
        <footer className="teknix-footer-glassmorphism" role="contentinfo">
          <div className="glass-footer-inner">
            <div className="glass-footer-grid">
              {columns.map((col, cIdx) => (
                <div key={col.id || cIdx}>
                  {col.sections.map((sec, sIdx) => (
                    <div key={sIdx} style={{ marginBottom: 14 }}>
                      <h4 className="glass-col-title">{sec.title}</h4>
                      <ul className="glass-col-list">
                        {sec.links.map((lk, lIdx) => (
                          <li key={lIdx}><a href={lk.url} onClick={e => isEditor && e.preventDefault()}>{lk.label}</a></li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="glass-bottom-bar">
              <span>Copyright © {config.copyrightYear || new Date().getFullYear()} {config.companyName || 'TEKNIX Inc.'}</span>
              <span>{config.countryText || 'Brasil'}</span>
            </div>
          </div>
        </footer>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODEL 5: STUDIO EDITORIAL DARK */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {model === 'editorial_dark_studio' && (
        <footer className="teknix-footer-editorial-studio" role="contentinfo">
          <div className="studio-footer-inner">
            <div className="studio-footer-grid">
              <div className="studio-col studio-newsletter-box">
                <div className="studio-brand-tag">TEKNIX INDUSTRIAL PRO</div>
                <h3 className="studio-title">{config.newsletterTitle || 'Receba lançamentos e especificações técnicas exclusivas'}</h3>
                <p className="studio-desc">{config.newsletterSub || 'Cadastre seu e-mail institucional para ter acesso em primeira mão a novos catálogos e condições para faturamento.'}</p>
                {newsletterSent ? (
                  <div className="studio-success-badge"><Check size={16} /> E-mail cadastrado com sucesso!</div>
                ) : (
                  <form className="studio-newsletter-form" onSubmit={(e) => { e.preventDefault(); if (newsletterEmail) setNewsletterSent(true) }}>
                    <input type="email" required className="studio-input" placeholder="seu.email@empresa.com.br" value={newsletterEmail} onChange={(e) => setNewsletterEmail(e.target.value)} />
                    <button type="submit" className="studio-submit-btn">Cadastrar <Send size={14} /></button>
                  </form>
                )}
              </div>
              <div className="studio-col studio-contact-box">
                <h4 className="studio-box-subtitle">{config.contactTitle || 'Contato Rápido com Engenharia'}</h4>
                <div className="studio-form-row">
                  <input type="text" placeholder="Nome" className="studio-input" />
                  <input type="tel" placeholder="Telefone / WhatsApp" className="studio-input" />
                </div>
                <textarea rows={2} placeholder="Descreva sua demanda técnica..." className="studio-textarea" />
                <button type="button" className="studio-submit-btn secondary">Enviar Solicitação</button>
              </div>
            </div>
            <div className="studio-bottom-bar">
              <div className="studio-copy">© {config.copyrightYear || new Date().getFullYear()} {config.companyName || 'TEKNIX Industrial Inc.'}</div>
              <div className="studio-locale"><Globe size={14} /> {config.countryText || 'Brasil / Português'}</div>
            </div>
          </div>
        </footer>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODEL 6: ECOMMERCE ENTERPRISE */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {model === 'ecommerce_enterprise' && (
        <footer className="teknix-footer-ecommerce-enterprise" role="contentinfo">
          <div className="enterprise-footer-inner">
            <div className="enterprise-trust-bar">
              <div className="trust-item">
                <ShieldCheck size={20} className="trust-icon" />
                <div><strong>Garantia Oficial TEKNIX</strong><span>Suporte e assistência em todo o país</span></div>
              </div>
              <div className="trust-item">
                <Wrench size={20} className="trust-icon" />
                <div><strong>Peças Genuínas</strong><span>Disponibilidade imediata de reposição</span></div>
              </div>
              <div className="trust-item">
                <Phone size={20} className="trust-icon" />
                <div><strong>Atendimento B2B</strong><span>{config.phone || '0800 761 0880'}</span></div>
              </div>
            </div>
            <div className="enterprise-columns-grid">
              {columns.map((col, cIdx) => (
                <div key={col.id || cIdx} className="enterprise-col">
                  {col.sections.map((sec, sIdx) => (
                    <div key={sIdx} style={{ marginBottom: 16 }}>
                      <h4 className="enterprise-col-title">{sec.title}</h4>
                      <ul className="enterprise-col-list">
                        {sec.links.map((lk, lIdx) => (
                          <li key={lIdx}><a href={lk.url} onClick={e => isEditor && e.preventDefault()}>{lk.label}</a></li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="enterprise-copyright-row">
              <span>© {config.copyrightYear || new Date().getFullYear()} {config.companyName || 'TEKNIX Industrial Inc.'}</span>
              <span>{config.countryText || 'Brasil'}</span>
            </div>
          </div>
        </footer>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODEL 7: MODERN TECH GRID */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {model === 'modern_tech_grid' && (
        <footer className="teknix-footer-tech-grid" role="contentinfo">
          <div className="tech-grid-inner">
            <div className="tech-grid-top-bar">
              <strong style={{ fontSize: 16, color: '#f8fafc' }}>{config.companyName || 'TEKNIX Ecosystem'}</strong>
              <span style={{ fontSize: 12, color: '#38bdf8' }}>Inovação & Alta Performance</span>
            </div>
            <div className="tech-grid-cols">
              {columns.slice(0, 4).map((col, cIdx) => (
                <div key={col.id || cIdx}>
                  <h4 className="tech-col-title">{col.sections[0]?.title || 'Links'}</h4>
                  <ul className="tech-col-list">
                    {col.sections[0]?.links.map((lk, lIdx) => (
                      <li key={lIdx}><a href={lk.url} onClick={e => isEditor && e.preventDefault()}>{lk.label}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="tech-grid-bottom">
              <span>© {config.copyrightYear || new Date().getFullYear()} {config.companyName || 'TEKNIX Inc.'}</span>
              <span>{config.countryText || 'Brasil'}</span>
            </div>
          </div>
        </footer>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODEL 8: COMPACT MOBILE & APP */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {model === 'compact_app_store' && (
        <footer className="teknix-footer-compact-app" role="contentinfo">
          <div className="compact-app-inner">
            <div className="compact-app-badges">
              <a href="#" onClick={e => e.preventDefault()} className="compact-store-badge">
                <Apple size={16} /> App Store
              </a>
              <a href="#" onClick={e => e.preventDefault()} className="compact-store-badge">
                <Smartphone size={16} /> Google Play
              </a>
            </div>
            <ul className="compact-nav-links">
              <li><a href="/produtos" onClick={e => isEditor && e.preventDefault()}>Produtos</a></li>
              <li><a href="/suporte" onClick={e => isEditor && e.preventDefault()}>Suporte</a></li>
              <li><a href="/privacidade" onClick={e => isEditor && e.preventDefault()}>Privacidade</a></li>
              <li><a href="/termos" onClick={e => isEditor && e.preventDefault()}>Termos</a></li>
              <li><a href="/contato" onClick={e => isEditor && e.preventDefault()}>Contato</a></li>
            </ul>
            <div className="compact-app-copy">
              © {config.copyrightYear || new Date().getFullYear()} {config.companyName || 'TEKNIX Inc.'} Todos os direitos reservados.
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
