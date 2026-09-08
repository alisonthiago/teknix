import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Editable, useWidgetEdit } from './page-widgets/PageWidgets'
import './CasasBahiaFooter.css'

export default function TeknixFooter() {
  const [isExpanded, setIsExpanded] = useState(false)
  const footerEdit = useWidgetEdit('chrome:footer', 'chrome:footer')

  const footerContent = (footerEdit?.content || {}) as Record<string, any>
  const whatsapp = String(footerContent.whatsapp || '(46) 99915-5875')
  const whatsappClean = whatsapp.replace(/\D/g, '')

  if (footerEdit?.hidden) return null

  return (
    <Editable
      as="footer"
      widgetType="footer"
      widgetId="chrome:footer"
      globalKey="chrome:footer"
      label="Rodapé Oficial TEKNIX"
      editorKind="container"
      renderContent={false}
      className="mgl-footer-root"
      data-qa="footer"
    >
      {/* ── BOTÃO DE ABA SUPERIOR CENTRALIZADO (EXPANDIR / RECOLHER) ── */}
      <div className="mgl-footer-toggle-wrap">
        <button
          type="button"
          aria-expanded={isExpanded}
          aria-label={isExpanded ? 'Menos informações' : 'Mais informações'}
          className="mgl-footer-toggle-btn"
          data-testid="footer-expandable-extra-content-button"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{isExpanded ? 'Menos Informações' : 'Mais Informações'}</span>
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`mgl-chevron-icon ${isExpanded ? 'rotated' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* ── SEÇÃO EXPANSÍVEL: 4 COLUNAS DE LINKS + CERTIFICADOS ── */}
      {isExpanded && (
        <div className="mgl-footer-expanded-panel">
          <div className="mgl-footer-container">
            <div className="mgl-footer-grid">
              {/* Coluna 1: TEKNIX */}
              <div className="mgl-footer-col">
                <h4 className="mgl-footer-col-title">TEKNIX</h4>
                <ul className="mgl-footer-col-list">
                  <li><Link to="/news/sobre-nos">Quem somos</Link></li>
                  <li><Link to="/conta/lojas-fisicas">Nossas lojas</Link></li>
                  <li><Link to="/news/sobre-nos#colaboradores">Trabalhe conosco</Link></li>
                  <li><Link to="/conta">Programa Ouro &amp; VIP</Link></li>
                  <li><Link to="/noticias">Assessoria de imprensa</Link></li>
                  <li><Link to="/produtos">Catálogo para e-commerce</Link></li>
                </ul>
              </div>

              {/* Coluna 2: Para sua empresa */}
              <div className="mgl-footer-col">
                <h4 className="mgl-footer-col-title">Para sua empresa</h4>
                <ul className="mgl-footer-col-list">
                  <li><Link to="/produtos">Compre online aqui</Link></li>
                  <li><Link to="/news/nosso-ecossistema">Nossas soluções</Link></li>
                  <li><Link to="/contato">Vendas corporativas</Link></li>
                  <li><Link to="/conta">Incentivo e fidelidade</Link></li>
                  <li><Link to="/conta">Programas de benefício</Link></li>
                  <li><Link to="/contato">Televendas corporativas</Link></li>
                </ul>
              </div>

              {/* Coluna 3: Atendimento */}
              <div className="mgl-footer-col">
                <h4 className="mgl-footer-col-title">Atendimento</h4>
                <ul className="mgl-footer-col-list">
                  <li><Link to="/ajuda/atendimento">Atendimento ao cliente</Link></li>
                  <li><Link to="/ajuda/termo-compra-venda">Termo de compra e venda</Link></li>
                  <li><Link to="/ajuda/direito-arrependimento">Arrependimento ou desistência</Link></li>
                  <li><Link to="/ajuda/devolucoes">Trocas e devoluções</Link></li>
                  <li><Link to="/ajuda/assistencia-tecnica">Assistência técnica de fábrica</Link></li>
                  <li><Link to="/ajuda/politica-privacidade">Política de privacidade</Link></li>
                  <li><Link to="/ajuda/regulamentos">Regulamentos</Link></li>
                </ul>
              </div>

              {/* Coluna 4: Seja nosso parceiro */}
              <div className="mgl-footer-col">
                <h4 className="mgl-footer-col-title">Seja nosso parceiro</h4>
                <ul className="mgl-footer-col-list">
                  <li><Link to="/contato">Venda seus produtos</Link></li>
                  <li><Link to="/contato">Seja revendedor TEKNIX</Link></li>
                  <li><Link to="/news/sobre-nos">Proteção de marcas</Link></li>
                  <li><Link to="/login">Portal do parceiro</Link></li>
                </ul>
              </div>

              {/* Coluna 5: Certificados e Segurança */}
              <div className="mgl-footer-col mgl-footer-badges-col">
                <div className="mgl-cert-card">
                  <div className="mgl-cert-seal-ebit">
                    <span className="mgl-seal-badge">ÓTIMO</span>
                    <span className="mgl-seal-stars">★★★★★</span>
                    <span className="mgl-seal-sub">E-BIT</span>
                  </div>
                  <div className="mgl-cert-seal-ra">
                    <span className="mgl-ra-badge">RA 1000</span>
                    <span className="mgl-ra-sub">Reclame AQUI</span>
                  </div>
                  <div className="mgl-cert-seal-ssl">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                    <span>Certificados &amp; Segurança</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BARRA FIXA PRINCIPAL DO RODAPÉ (1:1 MAGALU) ── */}
      <div className="mgl-footer-main" data-testid="footer-container">
        <div className="mgl-footer-container">
          {/* Navegação Horizontal */}
          <nav className="mgl-footer-nav" data-testid="footer-nav">
            <Link to="/blog">Blog da TEKNIX</Link>
            <Link to="/conta/lojas-fisicas">Nossas lojas</Link>
            <a
              href={`https://api.whatsapp.com/send?phone=${whatsappClean.startsWith('55') ? whatsappClean : `55${whatsappClean}`}&text=Ol%C3%A1%2C%20vim%20pelo%20site%20da%20TEKNIX`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp Oficial
            </a>
            <Link to="/legal/regulamento">Regulamento</Link>
            <Link to="/legal/acessibilidade">Acessibilidade</Link>
            <Link to="/legal/seguranca-privacidade">Segurança e Privacidade</Link>
          </nav>

          {/* Conteúdo Legal + Botão de Chat / Televendas */}
          <div className="mgl-footer-content" data-testid="footer-content">
            <div className="mgl-footer-text-col" data-testid="footer-text">
              <span>
                Preços e condições de pagamento exclusivos para compras via internet, podendo variar nas lojas físicas ou revendedores. Ofertas válidas até o término dos nossos estoques para internet. Caso os produtos apresentem divergências de valores, o preço válido é o da sacola de compras.
              </span>
            </div>

            <div className="mgl-footer-text-col" data-testid="footer-text">
              <span>
                A TEKNIX comercializa ferramentas industriais, máquinas elétricas e equipamentos técnicos com procedência garantida, nota fiscal eletrônica e conformidade integral com a legislação do consumidor e regras de comércio eletrônico no Brasil.
              </span>
            </div>

            <div className="mgl-footer-buttons-col" data-testid="footer-buttons">
              <a
                href={`https://api.whatsapp.com/send?phone=${whatsappClean.startsWith('55') ? whatsappClean : `55${whatsappClean}`}&text=Ol%C3%A1%2C%20gostaria%20de%20comprar%20pelo%20chat`}
                target="_blank"
                rel="noreferrer"
                className="mgl-btn-outline"
                data-testid="button"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Compre pelo chat</span>
              </a>
              <div className="mgl-phone-wrap" data-testid="footer-text">
                <span>ou compre pelo telefone:</span>
                <strong>{whatsapp}</strong>
              </div>
            </div>
          </div>

          {/* Razão Social e Direitos Reservados */}
          <div className="mgl-footer-about" data-testid="footer-about">
            TEKNIX FERRAMENTAS LTDA - CNPJ: 63.623.515/0001-68 - Endereço: Rodovia Governador Mário Covas, Km 281, Cariacica/ES - CEP 29157-100 ® TEKNIX – Todos os direitos reservados.
          </div>
        </div>
      </div>
    </Editable>
  )
}

TeknixFooter.editorLabel = "Rodapé"
