import { useState } from 'react'
import './Contact.css'

export default function Contact() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const message = encodeURIComponent(
      `Olá! Vim pelo site da Teknix.\n\n` +
      `*Nome:* ${form.name}\n` +
      `*Email:* ${form.email}\n` +
      `*Telefone:* ${form.phone}\n` +
      `*Mensagem:* ${form.message}`
    )
    window.open(`https://wa.me/5511999999999?text=${message}`, '_blank')
  }

  return (
    <div className="contact-page">
      <div className="contact-header">
        <h1>Contato</h1>
        <p>Fale com a Teknix. Estamos prontos para ajudar.</p>
      </div>

      <div className="contact-grid">
        <form className="contact-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome</label>
            <input
              type="text"
              id="name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Telefone</label>
            <input
              type="tel"
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Mensagem</label>
            <textarea
              id="message"
              rows={5}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full">
            Enviar via WhatsApp
          </button>
        </form>

        <div className="contact-info">
          <div className="info-card">
            <h3>WhatsApp</h3>
            <p>(11) 99999-9999</p>
            <a
              href="https://wa.me/5511999999999"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-outline"
            >
              Abrir WhatsApp
            </a>
          </div>

          <div className="info-card">
            <h3>Email</h3>
            <p>contato@teknix.com.br</p>
          </div>

          <div className="info-card">
            <h3>Horário</h3>
            <p>Segunda a Sexta: 9h às 18h</p>
            <p>Sábado: 9h às 13h</p>
          </div>
        </div>
      </div>
    </div>
  )
}
