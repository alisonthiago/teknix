import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, CircleHelp, PackageCheck, RotateCcw, Search, Truck, MessageCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import './HelpCenter.css'

const SHORTCUTS = [
  { icon: RotateCcw, label: 'Devolver um produto', href: '/ajuda/devolucoes' },
  { icon: Truck, label: 'Gerenciar vendas, envios e etiquetas', href: '/ajuda/entregas' },
  { icon: PackageCheck, label: 'Quando recebo minhas compras', href: '/ajuda/entregas' },
  { icon: ShieldCheck, label: 'Como funciona a garantia dos produtos', href: '/ajuda/garantia-produto' },
  { icon: CircleHelp, label: 'Conheça as perguntas frequentes', href: '/ajuda/perguntas-anuncio' },
]

export default function HelpCenter() {
  const [search, setSearch] = useState('')
  const { user } = useAuth()
  const accountName = String(user?.user_metadata?.first_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'TEKNIX').split(' ')[0]
  return (
    <main className="help-center">
      <section className="help-intro"><p className="help-greeting">Olá, {accountName}.</p><h1>Como podemos te ajudar?</h1><div className="help-search-bar"><Search size={21} aria-hidden="true" /><input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Busque uma dúvida, por exemplo: como alterar minha senha?" aria-label="Buscar ajuda" /><button type="button">Buscar</button></div></section>
      <div className="help-content">
        <section className="help-panel help-order-panel" aria-labelledby="help-order-title"><div className="help-panel-heading"><h2 id="help-order-title">Estado da sua compra</h2><Link to="/pedidos">Ir para meus pedidos <ArrowRight size={15} /></Link></div><Link className="help-order-row" to="/pedidos"><span className="help-order-icon"><PackageCheck size={20} /></span><span><strong>Consulte seus pedidos</strong><small>Acompanhe entrega, pagamento e status da sua compra</small></span><ChevronRight size={20} aria-hidden="true" /></Link></section>
        <section className="help-panel" aria-labelledby="help-shortcuts-title"><div className="help-panel-heading"><h2 id="help-shortcuts-title">Atalhos personalizados</h2></div><div className="help-shortcuts">{SHORTCUTS.map(({ icon: Icon, label, href }) => <Link className="help-shortcut" to={href} key={label}><Icon size={20} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span><ChevronRight size={19} aria-hidden="true" /></Link>)}</div></section>
        <section className="help-contact-card" aria-label="Contato"><div><h2>Você precisa de mais ajuda?</h2><p>Fale com a equipe TEKNIX para receber atendimento.</p></div><Link to="/contato" className="help-contact-button"><MessageCircle size={18} /> Fale conosco <ArrowRight size={15} /></Link></section>
      </div>
    </main>
  )
}
