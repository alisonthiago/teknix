import { Editable, useWidgetEdit } from './page-widgets/PageWidgets'
import EditableFlow from './page-widgets/EditableFlow'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import './CasasBahiaFooter.css'

export default function TeknixFooter() {
  const [isGlossaryOpen, setIsGlossaryOpen] = useState(false)
  const footerEdit = useWidgetEdit('chrome:footer', 'chrome:footer')
  const whatsapp = String(footerEdit?.content?.whatsapp || '(46) 99915-5875')
  const whatsappClean = whatsapp.replace(/\D/g, '')
  const email = String(footerEdit?.content?.email || 'sac@teknix.com.br')
  const footerBg = (footerEdit?.schema as any)?.footer_bg
  const textColor = (footerEdit?.schema as any)?.footer_text_color

  const alphabet = ['0-9', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']

  if (footerEdit?.hidden) return null

  return (
    <Editable
      as="footer"
      widgetType="footer"
      widgetId="chrome:footer"
      globalKey="chrome:footer"
      label="Rodapé"
      editorKind="container"
      renderContent={false}
      className="cb-footer-root"
      data-qa="footer"
      style={{
        backgroundColor: footerBg,
        color: textColor
      }}
    >
      <EditableFlow id="footer-layout" label="Estrutura do rodapé" globalKey="layout:chrome:footer" compact>
      {/* ── SEÇÃO 0: CANAIS DE ATENDIMENTO (3 CAIXAS 1:1) ── */}
      <Editable as="section" widgetId="chrome:footer:support" globalKey="chrome:footer:support" label="Canais de atendimento" widgetType="container" editorKind="container" renderContent={false} className="cb-footer-support-section" aria-label="Canais de Atendimento TEKNIX">
        <div className="cb-footer-container">
          <div className="cb-support-grid">
            <a
              href={`https://api.whatsapp.com/send?phone=${whatsappClean ? (whatsappClean.startsWith('55') ? whatsappClean : `55${whatsappClean}`) : '5546999155875'}&text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20TEKNIX`}
              target="_blank"
              rel="noopener noreferrer"
              className="cb-support-card"
            >
              <div className="cb-support-icon-wrap">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                </svg>
              </div>
              <div className="cb-support-text-wrap">
                <h3 className="cb-support-title">CENTRAL DE VENDAS</h3>
                <p className="cb-support-desc">Compre pelo WhatsApp: {whatsapp}</p>
              </div>
            </a>

            <a
              href={`mailto:${email}`}
              className="cb-support-card"
            >
              <div className="cb-support-icon-wrap">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div className="cb-support-text-wrap">
                <h3 className="cb-support-title">CENTRAL DE ATENDIMENTO</h3>
                <p className="cb-support-desc">{email} • Seg. a Sex. das 8h30 às 18h</p>
              </div>
            </a>

            <Link to="/contato" className="cb-support-card">
              <div className="cb-support-icon-wrap">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                </svg>
              </div>
              <div className="cb-support-text-wrap">
                <h3 className="cb-support-title">TEKNIX PARA EMPRESAS</h3>
                <p className="cb-support-desc">Condições especiais para Revenda e CNPJ</p>
              </div>
            </Link>
          </div>
        </div>
      </Editable>

      {/* ── SEÇÃO 1: PRODUTOS MAIS BUSCADOS (SEO TEKNIX EM 7 COLUNAS) ── */}
      <Editable as="section" widgetId="chrome:footer:searched" globalKey="chrome:footer:searched" label="Produtos mais buscados" widgetType="container" editorKind="container" renderContent={false} className="cb-footer-searched-section" aria-label="Produtos Mais Buscados">
        <div className="cb-footer-container">
          <h2 className="cb-footer-heading">PRODUTOS MAIS BUSCADOS</h2>
          <div className="cb-searched-columns-grid">
            <div className="cb-searched-col">
              <Link to="/produtos?q=furadeira+de+impacto">Furadeira de impacto</Link>
              <Link to="/produtos?q=parafusadeira+bateria">Parafusadeira a bateria</Link>
              <Link to="/produtos?q=serra+circular">Serra circular</Link>
              <Link to="/produtos?q=serra+tico-tico">Serra tico-tico</Link>
              <Link to="/produtos?q=esmerilhadeira+angular">Esmerilhadeira angular</Link>
              <Link to="/produtos?q=martelete+perfurador">Martelete perfurador</Link>
            </div>
            <div className="cb-searched-col">
              <Link to="/produtos?q=chave+de+impacto">Chave de impacto</Link>
              <Link to="/produtos?q=jogo+de+ferramentas">Jogo de ferramentas</Link>
              <Link to="/produtos?q=maleta+de+ferramentas">Maleta de ferramentas</Link>
              <Link to="/produtos?q=nivel+laser">Nível laser</Link>
              <Link to="/produtos?q=trena+laser">Trena a laser</Link>
              <Link to="/produtos?q=lixadeira+orbital">Lixadeira orbital</Link>
            </div>
            <div className="cb-searched-col">
              <Link to="/produtos?q=compressor+de+ar">Compressor de ar</Link>
              <Link to="/produtos?q=inversora+de+solda">Inversora de solda</Link>
              <Link to="/produtos?q=lavadora+alta+pressao">Lavadora alta pressão</Link>
              <Link to="/produtos?q=aspirador+industrial">Aspirador profissional</Link>
              <Link to="/produtos?q=politriz">Politriz automotiva</Link>
              <Link to="/produtos?q=plaina+eletrica">Plaina elétrica</Link>
            </div>
            <div className="cb-searched-col">
              <Link to="/produtos?q=bateria+20v">Bateria 20V Max</Link>
              <Link to="/produtos?q=carregador+rapido">Carregador rápido</Link>
              <Link to="/produtos?q=brocas+e+pontas">Brocas e pontas</Link>
              <Link to="/produtos?q=disco+de+corte">Discos de corte</Link>
              <Link to="/produtos?q=maleta+organizadora">Caixa organizadora</Link>
              <Link to="/produtos?q=kit+marcenaria">Kit marcenaria</Link>
            </div>
            <div className="cb-searched-col">
              <Link to="/produtos?q=ferramentas+a+bateria">Ferramentas a bateria</Link>
              <Link to="/produtos?q=ferramentas+eletricas">Ferramentas elétricas</Link>
              <Link to="/produtos?q=acessorios">Acessórios para ferramentas</Link>
              <Link to="/produtos?q=equipamentos">Equipamentos industriais</Link>
              <Link to="/produtos?q=kits+profissionais">Kits profissionais</Link>
              <Link to="/produtos?q=bancada+de+trabalho">Bancadas de trabalho</Link>
            </div>
            <div className="cb-searched-col">
              <Link to="/produtos?q=furadeira+12">Furadeira 1/2 Pol.</Link>
              <Link to="/produtos?q=parafusadeira+12v">Parafusadeira 12V</Link>
              <Link to="/produtos?q=parafusadeira+20v">Parafusadeira 20V Brushless</Link>
              <Link to="/produtos?q=serra+esquadria">Serra de esquadria</Link>
              <Link to="/produtos?q=soprador+termico">Soprador térmico</Link>
              <Link to="/produtos?q=tupia+coluna">Tupia de coluna</Link>
            </div>
            <div className="cb-searched-col">
              <Link to="/produtos?q=gerador+energia">Gerador de energia</Link>
              <Link to="/produtos?q=multimetro">Multímetro digital</Link>
              <Link to="/produtos?q=alicate+amperimetro">Alicate amperímetro</Link>
              <Link to="/produtos?q=chave+combinada">Chaves combinadas</Link>
              <Link to="/produtos?q=caixa+sanfonada">Caixa metálica sanfonada</Link>
              <Link to="/produtos?q=torquimetro">Torquímetro profissional</Link>
            </div>
          </div>
        </div>
      </Editable>

      {/* ── SEÇÃO 2: GLOSSÁRIO ALFABÉTICO (A-Z) ── */}
      <Editable as="section" widgetId="chrome:footer:glossary" globalKey="chrome:footer:glossary" label="Glossário" widgetType="container" editorKind="container" renderContent={false} className="cb-footer-glossary-section" aria-label="Glossário">
        <div className="cb-footer-container">
          <h2 className="cb-footer-heading">GLOSSÁRIO</h2>
          <div className="cb-glossary-alphabet-row">
            {alphabet.map((letter) => (
              <Link to={`/produtos?letra=${letter}`} key={letter} className="cb-glossary-letter">
                {letter}
              </Link>
            ))}
          </div>

          <div className="cb-glossary-btn-wrap">
            <button
              type="button"
              className="cb-glossary-toggle-btn"
              aria-expanded={isGlossaryOpen}
              aria-controls="footer-details"
              onClick={() => setIsGlossaryOpen(!isGlossaryOpen)}
            >
              <span>{isGlossaryOpen ? 'VER MENOS' : 'VER OS MAIS BUSCADOS'}</span>
              <svg
                viewBox="0 0 24 24"
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                style={{ transform: isGlossaryOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
          </div>
        </div>
      </Editable>

      {/* ── SEÇÃO 3: DIRETÓRIO DE LINKS INSTITUCIONAIS (5 COLUNAS) ── */}
      <Editable as="div" widgetId="chrome:footer:details" globalKey="chrome:footer:details" label="Diretório e informações legais" widgetType="container" editorKind="container" renderContent={false} id="footer-details" hidden={!isGlossaryOpen}>
        <section className="cb-footer-nav-section" aria-label="Links Institucionais">
          <div className="cb-footer-container">
            <div className="cb-footer-links-grid">
              {/* Coluna 1: MEUS PEDIDOS */}
              <div className="cb-links-col">
                <h3 className="cb-links-title">MEUS PEDIDOS</h3>
                <ul className="cb-links-list">
                  <li><Link to="/pedidos">Acompanhe seus pedidos</Link></li>
                  <li><Link to="/buscar-pedido">Localizador de entrega</Link></li>
                  <li><Link to="/conta">Minha Conta</Link></li>
                  <li><Link to="/itens-salvos">Itens Salvos</Link></li>
                </ul>
              </div>

              {/* Coluna 2: PRODUTOS & SERVIÇOS */}
              <div className="cb-links-col">
                <h3 className="cb-links-title">PRODUTOS & SERVIÇOS</h3>
                <ul className="cb-links-list">
                  <li><Link to="/produtos">Catálogo de Ferramentas</Link></li>
                  <li><Link to="/sacola">Sacola de Compras</Link></li>
                  <li><Link to="/itens-salvos">Meus Favoritos</Link></li>
                  <li><Link to="/comparar">Comparador de Produtos</Link></li>
                </ul>
              </div>

              {/* Coluna 3: ATENDIMENTO & SUPORTE */}
              <div className="cb-links-col">
                <h3 className="cb-links-title">ATENDIMENTO & SUPORTE</h3>
                <ul className="cb-links-list">
                  <li><Link to="/contato">Central de Atendimento</Link></li>
                  <li><Link to="/contato">Vendas para Empresas (CNPJ)</Link></li>
                  <li><Link to="/contato">Suporte e Dúvidas</Link></li>
                  <li><Link to="/buscar-pedido">Rastrear Entrega</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── SEÇÃO 4: FORMAS DE PAGAMENTOS ── */}
        <section className="cb-footer-payment-section" aria-label="Formas de Pagamentos">
          <div className="cb-footer-container">
            <h2 className="cb-footer-heading">FORMAS DE PAGAMENTOS</h2>
            <div className="cb-payment-methods-grid">
              {/* À Vista & Digital */}
              <div className="cb-payment-group">
                <h3 className="cb-payment-sub">À Vista & Digital</h3>
                <div className="cb-badges-row">
                  <span className="cb-payment-badge pix">Pix • Desconto Especial</span>
                  <span className="cb-payment-badge">Boleto Bancário</span>
                </div>
              </div>

              {/* Cartões de Crédito */}
              <div className="cb-payment-group">
                <h3 className="cb-payment-sub">Cartão de Crédito</h3>
                <div className="cb-badges-row">
                  <span className="cb-payment-badge">Visa</span>
                  <span className="cb-payment-badge">Mastercard</span>
                  <span className="cb-payment-badge">Elo</span>
                  <span className="cb-payment-badge">Hipercard</span>
                  <span className="cb-payment-badge">Amex</span>
                </div>
              </div>

              {/* B2B & Parcelamento */}
              <div className="cb-payment-group">
                <h3 className="cb-payment-sub">Condições de Pagamento</h3>
                <div className="cb-badges-row">
                  <span className="cb-payment-badge brand-tkn">Até 10x sem juros</span>
                  <span className="cb-payment-badge">Faturado para CNPJ</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SEÇÃO 5: REDES SOCIAIS, CANAIS DIGITAIS & CERTIFICADOS ── */}
        <section className="cb-footer-social-apps-section" aria-label="Redes Sociais e Segurança">
          <div className="cb-footer-container">
            <div className="cb-social-apps-grid">
              {/* Redes Sociais */}
              <div className="cb-social-col">
                <h3 className="cb-social-title">ACOMPANHE A TEKNIX</h3>
                <div className="cb-social-icons-row">
                  <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram" className="cb-social-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  </a>
                  <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook" className="cb-social-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube" className="cb-social-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.1c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43zM9.75 15.02V8.53l5.88 3.25-5.88 3.24z"/></svg>
                  </a>
                  <a href="https://linkedin.com" target="_blank" rel="noreferrer" aria-label="LinkedIn" className="cb-social-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.64a1.64 1.64 0 1 0 1.64 1.64c0-.9-.74-1.64-1.64-1.64z"/></svg>
                  </a>
                </div>
              </div>

              {/* Atendimento & Suporte Direto */}
              <div className="cb-apps-col">
                <h3 className="cb-social-title">ATENDIMENTO DIRETO</h3>
                <div className="cb-app-buttons-row">
                  <a
                    href="https://api.whatsapp.com/send?phone=5546999155875"
                    target="_blank"
                    rel="noreferrer"
                    className="cb-app-badge-btn"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
                    </svg>
                    <span>WhatsApp Oficial</span>
                  </a>
                  <Link to="/contato" className="cb-app-badge-btn">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <span>Central de Ajuda</span>
                  </Link>
                </div>
              </div>

              {/* Certificados e Segurança */}
              <div className="cb-certs-col">
                <div className="cb-cert-badge-box">
                  <span className="cb-cert-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#2563eb" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </span>
                  <div className="cb-cert-text">
                    <strong>Site Seguro</strong>
                    <span>Certificado SSL 256 bits</span>
                  </div>
                </div>
                <div className="cb-cert-badge-box">
                  <span className="cb-cert-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#16a34a" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <div className="cb-cert-text">
                    <strong>Compra Protegida</strong>
                    <span>Privacidade e Segurança</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SEÇÃO 6: FAIXA INFERIOR DE INFORMAÇÕES LEGAIS E COPYRIGHT TEKNIX ── */}
        <section className="cb-footer-legal-bottom-bar" aria-label="Informações Legais TEKNIX">
          <div className="cb-footer-container">
            <p className="cb-legal-disclaimer">
              Preços e condições de pagamento exclusivos para compras via internet, podendo variar em relação a parceiros comerciais ou revendedores autorizados.
            </p>
            <p className="cb-legal-company">
              {String(footerEdit?.content?.company_info || 'TEKNIX FERRAMENTAS LTDA • Rodovia Governador Mário Covas, Km 281, Padre Mathias, Cariacica - ES • CEP: 29157-100 • CNPJ: 63.623.515/0001-68')} • {String(footerEdit?.content?.copyright || 'Todos os direitos reservados.')}
            </p>
          </div>
        </section>
      </Editable>
      </EditableFlow>
    </Editable>
  )
}

TeknixFooter.editorLabel = "Rodapé"
