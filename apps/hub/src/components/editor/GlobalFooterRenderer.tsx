import React, { useState } from 'react'
import {
  Layers, Check, EyeOff, MessageSquare, Mail, Phone,
  Wrench, ShieldCheck, ChevronUp, Send, Heart, Globe, ArrowUpRight, Edit3
} from 'lucide-react'
import './GlobalHeaderFooter.css'

export type FooterModel =
  | 'apple_directory_5cols_light'
  | 'apple_directory_5cols_dark'
  | 'editorial_dark_studio'
  | 'ecommerce_enterprise'

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
}

const DEFAULT_FOOTER_NOTES = [
  'Ofertas válidas por tempo limitado para compras qualificadas. Sujeito a aprovação de crédito e termos de serviço.',
  'Parcelamento em até 12x sem juros no cartão ou 5% de desconto à vista no Pix. Consulte condições na finalização da compra.',
  'A durabilidade da bateria e especificações de torque variam de acordo com o uso e a configuração. Para mais informações, consulte a página técnica do produto.',
  'A tecnologia TEKNIX Brushless e os recursos avançados estão disponíveis em dispositivos compatíveis com o ecossistema oficial.'
]

interface Props {
  config?: FooterConfig
  isEditor?: boolean
  isSelected?: boolean
  viewportMode?: string
  onSelect?: () => void
  onChangeConfig?: (newConfig: FooterConfig) => void
  onHideFooter?: () => void
}

export default function GlobalFooterRenderer({
  config = {},
  isEditor = false,
  isSelected = false,
  viewportMode = 'desktop',
  onSelect,
  onChangeConfig,
  onHideFooter
}: Props) {
  const model: FooterModel = config.model || 'apple_directory_5cols_light'
  const notes = config.notes || DEFAULT_FOOTER_NOTES
  const [showModelPicker, setShowModelPicker] = useState(false)

  // Newsletter & Form states (decorative for interactive preview)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterSent, setNewsletterSent] = useState(false)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [contactSubject, setContactSubject] = useState('')
  const [contactMsg, setContactMsg] = useState('')
  const [contactSent, setContactSent] = useState(false)

  const modelsList: { id: FooterModel; label: string; desc: string }[] = [
    {
      id: 'apple_directory_5cols_light',
      label: '1. Apple Directory Light (5 Colunas Oficial)',
      desc: 'Notas legais Sosumi numeradas + 5 colunas de diretório editorial claro (#f5f5f7)'
    },
    {
      id: 'apple_directory_5cols_dark',
      label: '2. Apple Directory Dark (5 Colunas Premium)',
      desc: 'Tema dark premium (#161617) de alto contraste com notas Sosumi'
    },
    {
      id: 'editorial_dark_studio',
      label: '3. Studio Editorial Dark (Newsletter & Contato)',
      desc: 'Layout black (#000000) com Newsletter, formulário de contato, redes e bandeiras'
    },
    {
      id: 'ecommerce_enterprise',
      label: '4. Tech Enterprise (Samsung Style)',
      desc: 'Botão Voltar ao Topo, suporte com ícones, redes sociais e barra de dados corporativos'
    }
  ]

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div
      className={`teknix-global-footer-wrapper footer-model-${model} ${isSelected ? 'editor-selected' : ''}`}
      onClick={(e) => {
        if (isEditor && onSelect) {
          e.stopPropagation()
          onSelect()
        }
      }}
    >
      {/* ── ELEMENTOR 1:1 HOVER HANDLE (Aparece no topo ao passar o mouse) ── */}
      {isEditor && (
        <ul
          className={`elementor-editor-element-settings elementor-editor-container-settings elementor-editor-element-overlay-settings elementor-footer-hover-handle ${isSelected ? 'selected' : ''}`}
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.()
          }}
          title="Clique para editar o Rodapé"
        >
          <li
            className="elementor-editor-element-setting elementor-editor-element-edit ui-sortable-handle"
            aria-label="Editar Rodapé"
          >
            <Edit3 size={10} strokeWidth={2.5} style={{ marginRight: 4 }} />
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Editar</span>
          </li>
        </ul>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODEL 1 & MODEL 2: OFFICIAL APPLE 5-COLUMN DIRECTORY (LIGHT & DARK) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {(model === 'apple_directory_5cols_light' || model === 'apple_directory_5cols_dark') && (
        <footer id="ac-globalfooter" className={`ac-globalfooter model-${model}`} role="contentinfo">
          <div className="ac-gf-content">
            {/* Sosumi Footnotes */}
            <section className="ac-gf-sosumi" aria-label="Notas de rodapé">
              <ul>
                {notes.map((note, idx) => (
                  <li key={idx}>
                    <small>{idx + 1}.</small> {note}
                  </li>
                ))}
              </ul>
            </section>

            {/* 5 Directory Columns */}
            <nav className="ac-gf-directory" aria-label="Diretório TEKNIX">
              {/* Col 1 */}
              <div className="ac-gf-directory-column">
                <div className="ac-gf-directory-column-section">
                  <h3 className="ac-gf-directory-title">Compre e aprenda</h3>
                  <ul className="ac-gf-directory-list">
                    <li><a href="/loja">Loja Oficial</a></li>
                    <li><a href="/produtos/parafusadeiras">Parafusadeiras</a></li>
                    <li><a href="/produtos/furadeiras">Furadeiras de Impacto</a></li>
                    <li><a href="/produtos/esmerilhadeiras">Esmerilhadeiras</a></li>
                    <li><a href="/produtos/iluminacao-solar">Iluminação Solar</a></li>
                    <li><a href="/produtos/refletores">Refletores LED</a></li>
                    <li><a href="/produtos/acessorios">Acessórios &amp; Baterias</a></li>
                  </ul>
                </div>
                <div className="ac-gf-directory-column-section">
                  <h3 className="ac-gf-directory-title">Carteira TEKNIX</h3>
                  <ul className="ac-gf-directory-list">
                    <li><a href="/minha-conta">Conta TEKNIX</a></li>
                    <li><a href="/checkout">TEKNIX Pay</a></li>
                    <li><a href="/minha-conta">Cashback &amp; Pontos</a></li>
                  </ul>
                </div>
              </div>

              {/* Col 2 */}
              <div className="ac-gf-directory-column">
                <div className="ac-gf-directory-column-section">
                  <h3 className="ac-gf-directory-title">Conta</h3>
                  <ul className="ac-gf-directory-list">
                    <li><a href="/minha-conta">Gerencie sua conta</a></li>
                    <li><a href="/minha-conta">Conta da TEKNIX Store</a></li>
                    <li><a href="/minha-conta">Garantia Técnica</a></li>
                  </ul>
                </div>
                <div className="ac-gf-directory-column-section">
                  <h3 className="ac-gf-directory-title">Entretenimento &amp; Mídia</h3>
                  <ul className="ac-gf-directory-list">
                    <li><a href="/loja">TEKNIX Plus+</a></li>
                    <li><a href="/loja">Catálogo Interativo</a></li>
                    <li><a href="/loja">Comunidade Pro</a></li>
                  </ul>
                </div>
              </div>

              {/* Col 3 */}
              <div className="ac-gf-directory-column">
                <div className="ac-gf-directory-column-section">
                  <h3 className="ac-gf-directory-title">TEKNIX Store</h3>
                  <ul className="ac-gf-directory-list">
                    <li><a href="/contato">Encontre uma loja / Distribuidor</a></li>
                    <li><a href="/contato">Assistência Autorizada</a></li>
                    <li><a href="/contato">Hoje na TEKNIX (Workshops)</a></li>
                    <li><a href="/checkout">Financiamento &amp; Parcelamento</a></li>
                    <li><a href="/minha-conta">Status do Pedido</a></li>
                    <li><a href="/contato">Ajuda para Compras</a></li>
                  </ul>
                </div>
              </div>

              {/* Col 4 */}
              <div className="ac-gf-directory-column">
                <div className="ac-gf-directory-column-section">
                  <h3 className="ac-gf-directory-title">Para empresas</h3>
                  <ul className="ac-gf-directory-list">
                    <li><a href="/contato">TEKNIX e Negócios (B2B)</a></li>
                    <li><a href="/contato">Faturamento Direto</a></li>
                    <li><a href="/contato">Projetos Industriais</a></li>
                  </ul>
                </div>
                <div className="ac-gf-directory-column-section">
                  <h3 className="ac-gf-directory-title">Para fins profissionais</h3>
                  <ul className="ac-gf-directory-list">
                    <li><a href="/contato">Programa de Instaladores</a></li>
                    <li><a href="/contato">Treinamento Especializado</a></li>
                    <li><a href="/contato">Engenharia &amp; Manutenção</a></li>
                  </ul>
                </div>
              </div>

              {/* Col 5 */}
              <div className="ac-gf-directory-column">
                <div className="ac-gf-directory-column-section">
                  <h3 className="ac-gf-directory-title">Valores da TEKNIX</h3>
                  <ul className="ac-gf-directory-list">
                    <li><a href="/contato">Acessibilidade</a></li>
                    <li><a href="/contato">Meio Ambiente &amp; Solar</a></li>
                    <li><a href="/contato">Privacidade e Dados</a></li>
                    <li><a href="/contato">Inovação e Qualidade</a></li>
                  </ul>
                </div>
                <div className="ac-gf-directory-column-section">
                  <h3 className="ac-gf-directory-title">Sobre a TEKNIX</h3>
                  <ul className="ac-gf-directory-list">
                    <li><a href="/contato">Sala de Imprensa</a></li>
                    <li><a href="/contato">Liderança TEKNIX</a></li>
                    <li><a href="/contato">Oportunidades de Carreira</a></li>
                    <li><a href="/contato">Investidores</a></li>
                    <li><a href="/contato">Ética e Conformidade</a></li>
                    <li><a href="/contato">Entre em contato</a></li>
                  </ul>
                </div>
              </div>
            </nav>

            {/* Bottom Legal Copyright Row */}
            <section className="ac-gf-footer">
              <div className="ac-gf-footer-shop">
                Mais opções de compra: <a href="/contato">Encontre uma loja perto de você</a>. Ou ligue para <a href="tel:08007610880">0800 761 0880</a>.
              </div>
              <div className="ac-gf-footer-legal">
                <div className="ac-gf-footer-legal-copyright">
                  Copyright © {config.copyrightYear || 2026} TEKNIX Inc. Todos os direitos reservados.
                </div>
                <ul className="ac-gf-footer-legal-links">
                  <li><a href="/contato">Política de Privacidade</a></li>
                  <li><a href="/contato">Termos de Uso</a></li>
                  <li><a href="/contato">Vendas e reembolsos</a></li>
                  <li><a href="/contato">Jurídico</a></li>
                  <li><a href="/contato">Mapa do site</a></li>
                </ul>
                <div className="ac-gf-footer-locale">
                  {config.countryText || 'Brasil'}
                </div>
              </div>
            </section>
          </div>
        </footer>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODEL 3: STUDIO EDITORIAL DARK (NEWSLETTER & CONTATO - PRINT 4) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {model === 'editorial_dark_studio' && (
        <footer className="teknix-footer-editorial-studio" role="contentinfo">
          <div className="studio-footer-inner">
            <div className="studio-footer-grid">
              {/* Left Box: Newsletter */}
              <div className="studio-col studio-newsletter-col">
                <div className="studio-section-header">
                  <h3>Newsletter registration —</h3>
                  <p>Love letters &amp; tech updates only</p>
                </div>

                <form
                  className="studio-form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (newsletterEmail) setNewsletterSent(true)
                  }}
                >
                  <div className="studio-input-group">
                    <input
                      type="email"
                      placeholder="Email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      required
                    />
                    <button type="submit" className="studio-submit-btn">
                      {newsletterSent ? 'Enviado!' : 'Send'}
                    </button>
                  </div>
                </form>

                <div className="studio-meta-links">
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="studio-handle-link">
                    @teknix_official
                  </a>
                  <a href="/" className="studio-url-link">
                    www.teknix.com.br
                  </a>
                </div>
              </div>

              {/* Right Box: Direct Contact Form */}
              <div className="studio-col studio-contact-col">
                <div className="studio-section-header">
                  <h3>Talk to us with flowers</h3>
                  <p>Direto com nossos especialistas técnicos</p>
                </div>

                <form
                  className="studio-contact-form"
                  onSubmit={(e) => {
                    e.preventDefault()
                    setContactSent(true)
                  }}
                >
                  <div className="studio-field-row">
                    <input
                      type="text"
                      placeholder="Name *"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="studio-field-row">
                    <input
                      type="email"
                      placeholder="Email *"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="studio-field-row">
                    <input
                      type="text"
                      placeholder="Subject"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                    />
                  </div>
                  <div className="studio-field-row studio-msg-row">
                    <input
                      type="text"
                      placeholder="Message"
                      value={contactMsg}
                      onChange={(e) => setContactMsg(e.target.value)}
                    />
                    <button type="submit" className="studio-submit-btn">
                      {contactSent ? 'Enviado!' : 'Send'}
                    </button>
                  </div>
                </form>

                <div className="studio-service-links">
                  <a href="/contato">Shipping info</a>
                  <a href="/contato">Returns Policy</a>
                  <a href="/contato">Assistência</a>
                </div>
              </div>
            </div>

            {/* Emblem & Payment Badges */}
            <div className="studio-footer-bottom">
              <div className="studio-emblem-badge">
                <span className="studio-butterfly" style={{ fontWeight: 800 }}>TK</span>
              </div>
              <div className="studio-payment-row">
                <span className="payment-pill">VISA</span>
                <span className="payment-pill">MASTERCARD</span>
                <span className="payment-pill">PIX</span>
                <span className="payment-pill">PAYPAL</span>
              </div>
              <div className="studio-copyright">
                © TEKNIX Studio {config.copyrightYear || 2026} somewhere, else. Todos os direitos reservados.
              </div>
            </div>
          </div>
        </footer>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* MODEL 4: TECH ENTERPRISE (SAMSUNG STYLE - PRINT 5) */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {model === 'ecommerce_enterprise' && (
        <footer className="teknix-footer-enterprise" role="contentinfo">
          <div className="enterprise-footer-top">
            <div className="enterprise-top-inner">
              <button type="button" className="btn-back-to-top" onClick={scrollToTop}>
                <span>Voltar ao topo</span>
                <ChevronUp size={14} />
              </button>
            </div>
          </div>

          <div className="enterprise-content-wrapper">
            <div className="enterprise-directory-grid">
              {/* Col 1 */}
              <div className="enterprise-col">
                <h4 className="enterprise-col-title">MAPA DO SITE &gt;</h4>
                <ul className="enterprise-links-list">
                  <li><a href="/contato">Quem somos <ArrowUpRight size={10} /></a></li>
                  <li><a href="/contato">Investidores <ArrowUpRight size={10} /></a></li>
                  <li><a href="/contato">Notícias <ArrowUpRight size={10} /></a></li>
                  <li><a href="/loja">Promoções</a></li>
                  <li><a href="/contato">FAQ Loja Online</a></li>
                  <li><a href="/contato">Celular &amp; Ferramenta Legal <ArrowUpRight size={10} /></a></li>
                </ul>
              </div>

              {/* Col 2 */}
              <div className="enterprise-col">
                <h4 className="enterprise-col-title">NOSSAS LOJAS</h4>
                <ul className="enterprise-links-list">
                  <li><a href="/contato">Lojas TEKNIX</a></li>
                  <li><a href="/contato">Do What You Can't <ArrowUpRight size={10} /></a></li>
                  <li><a href="/contato">TEKNIX Club <ArrowUpRight size={10} /></a></li>
                  <li><a href="/contato">TEKNIX Social <ArrowUpRight size={10} /></a></li>
                  <li><a href="/contato">TEKNIX Industrial <ArrowUpRight size={10} /></a></li>
                </ul>
              </div>

              {/* Col 3: Support */}
              <div className="enterprise-col">
                <h4 className="enterprise-col-title">PRECISA DE SUPORTE?</h4>
                <ul className="enterprise-support-list">
                  <li>
                    <a href="/contato">
                      <MessageSquare size={13} />
                      <span>Chat Online</span>
                      <ArrowUpRight size={10} />
                    </a>
                  </li>
                  <li>
                    <a href="/contato">
                      <Mail size={13} />
                      <span>E-mail</span>
                      <ArrowUpRight size={10} />
                    </a>
                  </li>
                  <li>
                    <a href="/contato">
                      <Phone size={13} />
                      <span>Fale Conosco (0800)</span>
                    </a>
                  </li>
                  <li>
                    <a href="/contato">
                      <Wrench size={13} />
                      <span>Assistência Online</span>
                      <ArrowUpRight size={10} />
                    </a>
                  </li>
                  <li>
                    <a href="/contato">
                      <ShieldCheck size={13} />
                      <span>TEKNIX Care</span>
                      <ArrowUpRight size={10} />
                    </a>
                  </li>
                </ul>
              </div>

              {/* Col 4: Social */}
              <div className="enterprise-col">
                <h4 className="enterprise-col-title">SIGA-NOS</h4>
                <div className="enterprise-social-icons">
                  <a href="https://facebook.com" target="_blank" rel="noreferrer" className="social-circle-btn" title="Facebook">FB</a>
                  <a href="https://twitter.com" target="_blank" rel="noreferrer" className="social-circle-btn" title="Twitter">X</a>
                  <a href="https://youtube.com" target="_blank" rel="noreferrer" className="social-circle-btn" title="YouTube">YT</a>
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" className="social-circle-btn" title="Instagram">IG</a>
                </div>
              </div>
            </div>

            <div className="enterprise-middle-copyright">
              Copyright© 1995-2026 TEKNIX. Todos os direitos reservados.
            </div>
          </div>

          {/* Bottom Dark Contrast Bar */}
          <div className="enterprise-bottom-bar">
            <div className="enterprise-bottom-inner">
              <div className="enterprise-legal-nav">
                <a href="/contato">ACESSIBILIDADE</a>
                <span className="divider">|</span>
                <a href="/contato">TERMOS &amp; CONDIÇÕES LOJA ONLINE</a>
                <span className="divider">|</span>
                <a href="/contato">PRIVACIDADE</a>
                <span className="divider">|</span>
                <a href="/contato">LEGAL</a>
                <span className="divider">|</span>
                <span className="locale-btn">BRASIL / PORTUGUÊS &gt;</span>
              </div>

              <div className="enterprise-corp-details">
                <p>
                  TEKNIX ELETRÔNICA DA AMAZÔNIA LTDA. , com sede em Av. dos Oitis, nº 1.460, Distrito Industrial, Manaus/AM, 69.007-002, inscrita no CNPJ/MF sob o nº. 00.280.275/0001-37.
                </p>
                <p>
                  LOJA ONLINE TEKNIX, operada pela MAGAZINE TEKNIX S/A, com endereço na Av. Wilson Tavares Ribeiro, Nº 1400, Contagem/MG, 32183-680, inscrita no CNPJ/MF sob o nº. 47.960.950/0945-17.
                  <a href="/contato"> CONTATO ELETRÔNICO</a> para compras na Loja Online.
                </p>
                <p className="browser-note">
                  Esse website é melhor visualizado nas versões Microsoft Edge, Google Chrome e Mozilla Firefox mais recentes.
                </p>
              </div>
            </div>
          </div>
        </footer>
      )}
    </div>
  )
}
