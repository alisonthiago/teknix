import './Footer.css'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-mark">T</span>
              <span className="logo-text">TEKNIX</span>
            </div>
            <p className="footer-tagline">Feito para fazer.</p>
          </div>

          <div className="footer-columns">
            <div className="footer-col">
              <h4>Produtos</h4>
              <ul>
                <li><a href="/produtos?segmento=ferramentas">Ferramentas</a></li>
                <li><a href="/produtos?segmento=informatica">Informática</a></li>
                <li><a href="/produtos?segmento=casa">Casa</a></li>
                <li><a href="/produtos?segmento=automotivo">Automotivo</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Institucional</h4>
              <ul>
                <li><a href="#sobre">Sobre nós</a></li>
                <li><a href="/contato">Contato</a></li>
                <li><a href="#">Política de Privacidade</a></li>
                <li><a href="#">Termos de Uso</a></li>
              </ul>
            </div>

            <div className="footer-col">
              <h4>Atendimento</h4>
              <ul>
                <li>
                  <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </li>
                <li><a href="mailto:contato@teknix.com.br">contato@teknix.com.br</a></li>
                <li>Seg-Sex: 9h às 18h</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {year} Teknix Ferramentas. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
