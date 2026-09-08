import { Link } from 'react-router-dom'
import './NewsFooter.css'

export default function NewsFooter() {
  return (
    <footer className="page-footer" role="contentinfo">
      <div className="logo_footer">
        <Link className="home-link" to="/news" data-discover="true">
          <img className="footer-logo-svg" alt="TEKNIX" src="/teknix-logo.svg" />
        </Link>
      </div>

      <div className="meli-wrap-wide">
        <div className="footer-content">
          <nav role="navigation" aria-label="Pie de página">
            <ul className="menu">
              <li className="menu-item menu-item--expanded">
                <Link to="/news/sobre-nos">Sobre o Meli</Link>
                <ul className="menu">
                  <li className="menu-item"><Link to="/news/sobre-nos#missao">Nossa Missão</Link></li>
                  <li className="menu-item"><Link to="/news/sobre-nos#historia">Nossa História</Link></li>
                  <li className="menu-item"><Link to="/news/sobre-nos#colaboradores">Nossos Colaboradores</Link></li>
                  <li className="menu-item"><span>Como Trabalhamos</span></li>
                  <li className="menu-item"><Link to="/news/sobre-nos#carreiras">Carreiras Meli</Link></li>
                </ul>
              </li>

              <li className="menu-item menu-item--expanded">
                <Link to="/news/nosso-ecossistema">Nosso Ecossistema</Link>
                <ul className="menu">
                  <li className="menu-item"><Link to="/news/nosso-ecossistema">Mercado Livre</Link></li>
                  <li className="menu-item"><Link to="/news/nosso-ecossistema">Mercado Pago</Link></li>
                  <li className="menu-item"><Link to="/news/nosso-ecossistema">Relatórios e Resultados</Link></li>
                </ul>
              </li>

              <li className="menu-item menu-item--expanded">
                <Link to="/news">Tecnologia</Link>
                <ul className="menu">
                  <li className="menu-item"><Link to="/noticias">Blog de Medium</Link></li>
                  <li className="menu-item"><Link to="/noticias">Bootcamps</Link></li>
                </ul>
              </li>

              <li className="menu-item menu-item--expanded">
                <Link to="/news/investidores">Investidores</Link>
                <ul className="menu">
                  <li className="menu-item"><Link to="/news/investidores">Resultados</Link></li>
                </ul>
              </li>

              <li className="menu-item menu-item--expanded">
                <Link to="/news/sustentabilidade">Sustentabilidade</Link>
                <ul className="menu">
                  <li className="menu-item"><Link to="/news/sustentabilidade">Ecossistema Empreendedor</Link></li>
                  <li className="menu-item"><Link to="/news/sustentabilidade">Empoderamento Social</Link></li>
                  <li className="menu-item"><Link to="/news/sustentabilidade">Ambiente</Link></li>
                </ul>
              </li>

              <li className="menu-item menu-item--expanded">
                <Link to="/noticias">Notícias</Link>
                <ul className="menu">
                  <li className="menu-item"><Link to="/noticias">Histórias que inspiram</Link></li>
                </ul>
              </li>
            </ul>
          </nav>

          <div className="social-networks">
            <div className="social-networks-wrapper">
              <ul>
                <li className="linkedin-social-link">
                  <a href="https://www.linkedin.com" target="_blank" rel="noreferrer">LinkedIn</a>
                </li>
                <li className="facebook-social-link">
                  <a href="https://www.facebook.com" target="_blank" rel="noreferrer">Facebook</a>
                </li>
                <li className="twitter-social-link">
                  <a href="https://www.twitter.com" target="_blank" rel="noreferrer">Twitter</a>
                </li>
                <li className="instagram-social-link">
                  <a href="https://www.instagram.com" target="_blank" rel="noreferrer">Instagram</a>
                </li>
              </ul>
            </div>
          </div>

          <div className="legal-footer">
            <div className="terms">
              <nav>
                <a href="#termos">Terms and conditions</a>
                <a href="#privacidade">Privacy policy</a>
              </nav>
              <p>Copyright © 1999-2026 Teknix S.R.L.</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
