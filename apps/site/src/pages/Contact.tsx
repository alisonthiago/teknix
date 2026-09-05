import { Editable } from '../components/page-widgets/PageWidgets'
import EditableFlow from '../components/page-widgets/EditableFlow'
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
      <EditableFlow id="contact-content" label="Conteúdo da página Contato">
        <EditableFlow id="contact-header" label="Cabeçalho do contato" as="div" className="contact-header" compact>
          <Editable as="h1" widgetId="contact-1">Contato</Editable>
          <Editable as="p" widgetId="contact-2">Fale com a Teknix. Estamos prontos para ajudar.</Editable>
        </EditableFlow>

        <Editable as="div" widgetId="contact-grid" label="Colunas de contato" widgetType="container" editorKind="container" className="contact-grid" renderContent={false}>
          <EditableFlow id="contact-columns" label="Colunas do contato" compact>
            <Editable as="form" widgetId="contact-form" label="Formulário de contato" widgetType="container" editorKind="container" className="contact-form" onSubmit={handleSubmit} renderContent={false}>
              <EditableFlow id="contact-form-fields" label="Campos do formulário" compact>
                <Editable as="div" widgetId="contact-field-name" label="Campo Nome" widgetType="container" editorKind="container" className="form-group" renderContent={false}>
                  <Editable as="label" widgetId="contact-label-name" htmlFor="name">Nome</Editable>
                  <Editable
                    as="input"
                    widgetId="contact-input-name"
                    label="Input Nome"
                    widgetType="input"
                    content={{ input_type: 'text', placeholder: '' }}
                    type="text"
                    id="name"
                    value={form.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </Editable>

                <Editable as="div" widgetId="contact-field-email" label="Campo Email" widgetType="container" editorKind="container" className="form-group" renderContent={false}>
                  <Editable as="label" widgetId="contact-label-email" htmlFor="email">Email</Editable>
                  <Editable
                    as="input"
                    widgetId="contact-input-email"
                    label="Input Email"
                    widgetType="input"
                    content={{ input_type: 'email', placeholder: '' }}
                    type="email"
                    id="email"
                    value={form.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </Editable>

                <Editable as="div" widgetId="contact-field-phone" label="Campo Telefone" widgetType="container" editorKind="container" className="form-group" renderContent={false}>
                  <Editable as="label" widgetId="contact-label-phone" htmlFor="phone">Telefone</Editable>
                  <Editable
                    as="input"
                    widgetId="contact-input-phone"
                    label="Input Telefone"
                    widgetType="input"
                    content={{ input_type: 'tel', placeholder: '' }}
                    type="tel"
                    id="phone"
                    value={form.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })}
                    required
                  />
                </Editable>

                <Editable as="div" widgetId="contact-field-message" label="Campo Mensagem" widgetType="container" editorKind="container" className="form-group" renderContent={false}>
                  <Editable as="label" widgetId="contact-label-message" htmlFor="message">Mensagem</Editable>
                  <Editable
                    as="textarea"
                    widgetId="contact-input-message"
                    label="Input Mensagem"
                    widgetType="input"
                    content={{ input_type: 'textarea', placeholder: '' }}
                    id="message"
                    rows={5}
                    value={form.message}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, message: e.target.value })}
                    required
                  />
                </Editable>

                <Editable as="button" widgetId="contact-submit" label="Botão Enviar via WhatsApp" widgetType="button" type="submit" className="btn btn-primary btn-full">
                  Enviar via WhatsApp
                </Editable>
              </EditableFlow>
            </Editable>

            <Editable as="div" widgetId="contact-info" label="Informações de contato" widgetType="container" editorKind="container" className="contact-info" renderContent={false}>
              <EditableFlow id="contact-info-cards" label="Cartões de contato" compact>
                <EditableFlow id="contact-whatsapp-card" label="Card WhatsApp" as="div" className="info-card" compact>
                  <Editable as="h3" widgetId="contact-3">WhatsApp</Editable>
                  <Editable as="p" widgetId="contact-4">(11) 99999-9999</Editable>
                  <Editable as="a" widgetId="contact-whatsapp-button" label="Botão Abrir WhatsApp" widgetType="button" href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                    Abrir WhatsApp
                  </Editable>
                </EditableFlow>

                <EditableFlow id="contact-email-card" label="Card Email" as="div" className="info-card" compact>
                  <Editable as="h3" widgetId="contact-5">Email</Editable>
                  <Editable as="p" widgetId="contact-6">contato@teknix.com.br</Editable>
                </EditableFlow>

                <EditableFlow id="contact-hours-card" label="Card Horário" as="div" className="info-card" compact>
                  <Editable as="h3" widgetId="contact-7">Horário</Editable>
                  <Editable as="p" widgetId="contact-8">Segunda a Sexta: 9h às 18h</Editable>
                  <Editable as="p" widgetId="contact-9">Sábado: 9h às 13h</Editable>
                </EditableFlow>
              </EditableFlow>
            </Editable>
          </EditableFlow>
        </Editable>
      </EditableFlow>
    </div>
  )
}
