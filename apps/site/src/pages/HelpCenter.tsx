import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ChevronRight, CircleHelp, PackageCheck, RotateCcw, Search, Truck, MessageCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import './HelpCenter.css'

const SHORTCUTS = [
  { icon: RotateCcw, label: 'Devolver ou trocar um produto', description: 'Consulte condições, prazos e acompanhe sua solicitação.', href: '/ajuda/devolucoes' },
  { icon: PackageCheck, label: 'Acompanhar meus pedidos', description: 'Veja o status da compra, pagamento e entrega.', href: '/pedidos' },
  { icon: Truck, label: 'Gerenciar vendas, envios e etiquetas', description: 'Acesse vendas, envios e informações das etiquetas.', href: '/ajuda/entregas' },
  { icon: PackageCheck, label: 'Quando recebo minha compra?', description: 'Consulte a previsão e as atualizações do transporte.', href: '/ajuda/entregas' },
  { icon: ShieldCheck, label: 'Garantia dos produtos', description: 'Saiba os prazos e como solicitar assistência.', href: '/ajuda/garantia-produto' },
  { icon: CircleHelp, label: 'Pagamentos e reembolsos', description: 'Entenda confirmações, cancelamentos e estornos.', href: '/ajuda/pagamentos' },
  { icon: CircleHelp, label: 'Produto com problema', description: 'Encontre orientações para defeitos e suporte técnico.', href: '/ajuda/assistencia-tecnica' },
  { icon: CircleHelp, label: 'Conheça as perguntas frequentes', description: 'Respostas rápidas para as principais dúvidas.', href: '/ajuda/perguntas-anuncio' },
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
        <section className="help-panel" aria-labelledby="help-shortcuts-title"><div className="help-panel-heading"><h2 id="help-shortcuts-title">Atalhos personalizados</h2></div><div className="help-shortcuts">{SHORTCUTS.map(({ icon: Icon, label, description, href }) => <Link className="help-shortcut" to={href} key={label}><Icon size={20} strokeWidth={1.8} aria-hidden="true" /><span><strong>{label}</strong><small>{description}</small></span><ChevronRight size={19} aria-hidden="true" /></Link>)}</div></section>
        <section className="help-contact-card" aria-label="Contato"><div><h2>Você precisa de mais ajuda?</h2><p>Fale com a equipe TEKNIX para receber atendimento.</p></div><Link to="/contato" className="help-contact-button"><MessageCircle size={18} /> Fale conosco <ArrowRight size={15} /></Link></section>
      </div>
    </main>
  )
}
