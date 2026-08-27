import { Link } from 'react-router-dom'
import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer id="ac-globalfooter" className="ac-globalfooter" role="contentinfo">
      <div className="ac-gf-content">
        <h2 className="visuallyhidden">Rodapé da Apple</h2>

        {/* Footnotes / Notas de rodapé */}
        <section className="ac-gf-sosumi" aria-label="Notas de rodapé">
          <ul>
            <li id="footnote-1">
              <small>*</small> Ofertas válidas por tempo limitado para compras qualificadas. Sujeito a aprovação de crédito e termos de serviço.
            </li>
            <li id="footnote-2">
              <small>**</small> Parcelamento em até 12x sem juros no cartão ou 5% de desconto à vista no Pix. Consulte condições na finalização da compra.
            </li>
            <li>
              <small>1.</small> A duração da bateria varia de acordo com o uso e a configuração. Para mais informações, consulte a página técnica do produto.
            </li>
            <li>
              <small>2.</small> A tela tem cantos arredondados. Quando medida como um retângulo padrão, a área visual real pode ser ligeiramente menor.
            </li>
            <li>
              <small>3.</small> A Inteligência Apple e os recursos avançados estão disponíveis em dispositivos compatíveis com o software mais recente.
            </li>
          </ul>
        </section>

        {/* Directory 5 Columns */}
        <nav className="ac-gf-directory" aria-label="Diretório da Apple">
          <div className="ac-gf-directory-column">
            <div className="ac-gf-directory-column-section">
              <h3 className="ac-gf-directory-title">Compre e aprenda</h3>
              <ul className="ac-gf-directory-list">
                <li><Link to="/produtos">Loja</Link></li>
                <li><Link to="/mac">Mac</Link></li>
                <li><Link to="/ipad">iPad</Link></li>
                <li><Link to="/iphone">iPhone</Link></li>
                <li><Link to="/watch">Watch</Link></li>
                <li><Link to="/vision">Vision</Link></li>
                <li><Link to="/airpods">AirPods</Link></li>
                <li><Link to="/produtos?cat=tv-home">TV e Casa</Link></li>
                <li><Link to="/produtos?cat=airtag">AirTag</Link></li>
                <li><Link to="/produtos?cat=acessorios">Acessórios</Link></li>
                <li><Link to="/produtos">Cartões-presente</Link></li>
              </ul>
            </div>
            <div className="ac-gf-directory-column-section">
              <h3 className="ac-gf-directory-title">Carteira da Apple</h3>
              <ul className="ac-gf-directory-list">
                <li><Link to="/minha-conta">Carteira</Link></li>
                <li><Link to="/minha-conta">Cartão Apple</Link></li>
                <li><Link to="/checkout">Apple Pay</Link></li>
                <li><Link to="/minha-conta">Apple Cash</Link></li>
              </ul>
            </div>
          </div>

          <div className="ac-gf-directory-column">
            <div className="ac-gf-directory-column-section">
              <h3 className="ac-gf-directory-title">Conta</h3>
              <ul className="ac-gf-directory-list">
                <li><Link to="/minha-conta">Gerencie sua conta</Link></li>
                <li><Link to="/minha-conta">Conta da Apple Store</Link></li>
                <li><Link to="/minha-conta">iCloud.com</Link></li>
              </ul>
            </div>
            <div className="ac-gf-directory-column-section">
              <h3 className="ac-gf-directory-title">Entretenimento</h3>
              <ul className="ac-gf-directory-list">
                <li><Link to="/produtos">Apple One</Link></li>
                <li><Link to="/produtos">Apple TV+</Link></li>
                <li><Link to="/produtos">Apple Music</Link></li>
                <li><Link to="/produtos">Apple Arcade</Link></li>
                <li><Link to="/produtos">Apple Fitness+</Link></li>
                <li><Link to="/produtos">Apple Podcasts</Link></li>
                <li><Link to="/produtos">Apple Books</Link></li>
                <li><Link to="/produtos">App Store</Link></li>
              </ul>
            </div>
          </div>

          <div className="ac-gf-directory-column">
            <div className="ac-gf-directory-column-section">
              <h3 className="ac-gf-directory-title">Apple Store</h3>
              <ul className="ac-gf-directory-list">
                <li><Link to="/produtos">Encontre uma loja</Link></li>
                <li><Link to="/contato">Genius Bar</Link></li>
                <li><Link to="/produtos">Hoje na Apple</Link></li>
                <li><Link to="/produtos">Reservas para grupos</Link></li>
                <li><Link to="/produtos">Acampamento da Apple</Link></li>
                <li><Link to="/produtos">Recondicionado certificado</Link></li>
                <li><Link to="/produtos">Atualização da Apple</Link></li>
                <li><Link to="/produtos">Troca de produtos (Trade In)</Link></li>
                <li><Link to="/checkout">Financiamento</Link></li>
                <li><Link to="/minha-conta">Status do pedido</Link></li>
                <li><Link to="/contato">Ajuda para compras</Link></li>
              </ul>
            </div>
          </div>

          <div className="ac-gf-directory-column">
            <div className="ac-gf-directory-column-section">
              <h3 className="ac-gf-directory-title">Para empresas</h3>
              <ul className="ac-gf-directory-list">
                <li><Link to="/produtos">Apple e Negócios</Link></li>
                <li><Link to="/produtos">Compre para sua empresa</Link></li>
              </ul>
            </div>
            <div className="ac-gf-directory-column-section">
              <h3 className="ac-gf-directory-title">Para fins educacionais</h3>
              <ul className="ac-gf-directory-list">
                <li><Link to="/produtos">Apple e Educação</Link></li>
                <li><Link to="/produtos">Compre para estudantes</Link></li>
                <li><Link to="/produtos">Ofertas universitárias</Link></li>
              </ul>
            </div>
            <div className="ac-gf-directory-column-section">
              <h3 className="ac-gf-directory-title">Para a área da saúde</h3>
              <ul className="ac-gf-directory-list">
                <li><Link to="/produtos">Apple e a área da saúde</Link></li>
                <li><Link to="/watch">Saúde no Apple Watch</Link></li>
              </ul>
            </div>
          </div>

          <div className="ac-gf-directory-column">
            <div className="ac-gf-directory-column-section">
              <h3 className="ac-gf-directory-title">Valores da Apple</h3>
              <ul className="ac-gf-directory-list">
                <li><Link to="/contato">Acessibilidade</Link></li>
                <li><Link to="/contato">Educação</Link></li>
                <li><Link to="/contato">Meio Ambiente</Link></li>
                <li><Link to="/contato">Privacidade</Link></li>
                <li><Link to="/contato">Inclusão e Diversidade</Link></li>
              </ul>
            </div>
            <div className="ac-gf-directory-column-section">
              <h3 className="ac-gf-directory-title">Sobre a Apple</h3>
              <ul className="ac-gf-directory-list">
                <li><Link to="/contato">Sala de imprensa</Link></li>
                <li><Link to="/contato">Liderança da Apple</Link></li>
                <li><Link to="/contato">Oportunidades de Carreira</Link></li>
                <li><Link to="/contato">Investidores</Link></li>
                <li><Link to="/contato">Ética e Conformidade</Link></li>
                <li><Link to="/contato">Eventos</Link></li>
                <li><Link to="/contato">Entre em contato</Link></li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Footer Bottom / Legal */}
        <section className="ac-gf-footer">
          <div className="ac-gf-footer-shop">
            Mais opções de compra: <Link to="/produtos">Encontre uma loja</Link> perto de você. Ou ligue para <a href="tel:0800-761-0880">0800-761-0880</a>.
          </div>
          <div className="ac-gf-footer-legal">
            <div className="ac-gf-footer-legal-copyright">
              Copyright © {year} Apple Inc. Todos os direitos reservados.
            </div>
            <ul className="ac-gf-footer-legal-links">
              <li><Link to="/contato">Política de Privacidade</Link></li>
              <li><Link to="/contato">Termos de Uso</Link></li>
              <li><Link to="/contato">Vendas e reembolsos</Link></li>
              <li><Link to="/contato">Jurídico</Link></li>
              <li><Link to="/contato">Mapa do site</Link></li>
            </ul>
            <div className="ac-gf-footer-locale">
              <span className="locale-flag">🇧🇷</span> Brasil
            </div>
          </div>
        </section>
      </div>
    </footer>
  )
}
