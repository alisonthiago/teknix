import './Footer.css'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="logo-teknix">TEKNIX</span>
              <span className="logo-ferramentas">FERRAMENTAS</span>
            </div>
            <p className="footer-tagline">Feito para fazer.</p>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-whatsapp"
            >
              Fale conosco no WhatsApp
            </a>
          </div>

          <div className="footer-links">
            <h3>Links</h3>
            <ul>
              <li><a href="/">Home</a></li>
              <li><a href="/produtos">Produtos</a></li>
              <li><a href="/contato">Contato</a></li>
            </ul>
          </div>

          <div className="footer-links">
            <h3>Categorias</h3>
            <ul>
              <li><a href="/produtos?categoria=ferramentas-eletricas">Ferramentas Elétricas</a></li>
              <li><a href="/produtos?categoria=ferramentas-manuais">Ferramentas Manuais</a></li>
              <li><a href="/produtos?categoria=kits">Kits</a></li>
              <li><a href="/produtos?categoria=acessorios">Acessórios</a></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h3>Contato</h3>
            <ul>
              <li>WhatsApp: (11) 99999-9999</li>
              <li>Email: contato@teknix.com.br</li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} Teknix Ferramentas. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}
