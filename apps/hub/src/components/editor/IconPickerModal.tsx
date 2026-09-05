import React, { useState, useMemo } from 'react'
import {
  X, Search, Star, Heart, Sparkles, Zap, Check, CheckSquare, Shield, Award, Clock,
  Search as SearchIcon, Settings, Filter, Eye, EyeOff, User, Users, Lock, Unlock, Key, Bell, Bookmark, Flag,
  ShoppingBag, ShoppingCart, CreditCard, DollarSign, Tag, Gift, Percent, Package, Truck, Box, Store, Layers,
  Mail, Phone, MessageSquare, MessageCircle, Send, Share2, Globe, MapPin, Navigation, Compass, Headphones, ThumbsUp,
  Play, Video, Image as ImageIcon, Music, Volume2, Camera, Film, Download, Upload, FileText, Folder, BookOpen,
  Laptop, Smartphone, Tablet, Monitor, Cpu, Wifi, Battery, HardDrive, Bluetooth, Tv, Watch,
  ArrowRight, ArrowLeft, ArrowUp, ArrowDown, ChevronRight, ChevronLeft, MoveHorizontal, ExternalLink, RefreshCw,
  Wrench, Hammer, Palette, Sliders, Code, Terminal
} from 'lucide-react'

export interface IconDefinition {
  id: string
  name: string
  category: string
  keywords: string[]
  icon: React.ComponentType<{ size?: number; color?: string; strokeWidth?: number; style?: React.CSSProperties }>
}

export const ICON_LIBRARY: IconDefinition[] = [
  // Geral & Interface
  { id: 'star', name: 'Estrela', category: 'general', keywords: ['estrela', 'star', 'favorito', 'classificacao'], icon: Star },
  { id: 'heart', name: 'Coração', category: 'general', keywords: ['coracao', 'heart', 'amor', 'curtir', 'favorito'], icon: Heart },
  { id: 'sparkles', name: 'Brilho / IA', category: 'general', keywords: ['brilho', 'sparkles', 'ia', 'magica', 'novo', 'destaque'], icon: Sparkles },
  { id: 'zap', name: 'Raio / Energia', category: 'general', keywords: ['raio', 'zap', 'energia', 'rapido', 'velocidade', 'eletricidade'], icon: Zap },
  { id: 'check', name: 'Check', category: 'general', keywords: ['check', 'sucesso', 'ok', 'correto', 'confirmar'], icon: Check },
  { id: 'check-square', name: 'Check Box', category: 'general', keywords: ['check', 'quadrado', 'lista', 'tarefa'], icon: CheckSquare },
  { id: 'shield', name: 'Escudo / Proteção', category: 'general', keywords: ['escudo', 'shield', 'seguranca', 'protecao', 'garantia'], icon: Shield },
  { id: 'award', name: 'Prêmio / Selo', category: 'general', keywords: ['premio', 'award', 'trofeu', 'qualidade', 'certificado'], icon: Award },
  { id: 'clock', name: 'Relógio / Tempo', category: 'general', keywords: ['relogio', 'clock', 'tempo', 'hora', 'agilidade'], icon: Clock },
  { id: 'search', name: 'Buscar / Lupa', category: 'general', keywords: ['buscar', 'search', 'lupa', 'pesquisar'], icon: SearchIcon },
  { id: 'settings', name: 'Configurações', category: 'general', keywords: ['configuracoes', 'settings', 'ajustes', 'engrenagem'], icon: Settings },
  { id: 'filter', name: 'Filtro', category: 'general', keywords: ['filtro', 'filter', 'ordenar'], icon: Filter },
  { id: 'eye', name: 'Olho / Visualizar', category: 'general', keywords: ['olho', 'eye', 'ver', 'visualizar'], icon: Eye },
  { id: 'eye-off', name: 'Ocultar', category: 'general', keywords: ['ocultar', 'eye-off', 'esconder'], icon: EyeOff },
  { id: 'user', name: 'Usuário', category: 'general', keywords: ['usuario', 'user', 'perfil', 'cliente', 'pessoa'], icon: User },
  { id: 'users', name: 'Equipe / Clientes', category: 'general', keywords: ['usuarios', 'users', 'equipe', 'grupo', 'comunidade'], icon: Users },
  { id: 'lock', name: 'Cadeado / Seguro', category: 'general', keywords: ['cadeado', 'lock', 'seguro', 'privacidade'], icon: Lock },
  { id: 'unlock', name: 'Desbloqueado', category: 'general', keywords: ['desbloqueado', 'unlock', 'aberto'], icon: Unlock },
  { id: 'key', name: 'Chave / Acesso', category: 'general', keywords: ['chave', 'key', 'acesso', 'senha'], icon: Key },
  { id: 'bell', name: 'Notificações / Sino', category: 'general', keywords: ['sino', 'bell', 'notificacao', 'alerta'], icon: Bell },
  { id: 'bookmark', name: 'Salvar / Marcador', category: 'general', keywords: ['salvar', 'bookmark', 'marcador'], icon: Bookmark },
  { id: 'flag', name: 'Bandeira / Destaque', category: 'general', keywords: ['bandeira', 'flag', 'meta', 'aviso'], icon: Flag },

  // Comércio & Vendas
  { id: 'shopping-bag', name: 'Sacola de Compras', category: 'commerce', keywords: ['sacola', 'bag', 'compras', 'loja', 'store'], icon: ShoppingBag },
  { id: 'shopping-cart', name: 'Carrinho de Compras', category: 'commerce', keywords: ['carrinho', 'cart', 'compras', 'checkout'], icon: ShoppingCart },
  { id: 'credit-card', name: 'Cartão de Crédito', category: 'commerce', keywords: ['cartao', 'credit-card', 'pagamento', 'parcelas'], icon: CreditCard },
  { id: 'dollar-sign', name: 'Preço / Pagamento', category: 'commerce', keywords: ['dinheiro', 'dolar', 'real', 'preco', 'custo'], icon: DollarSign },
  { id: 'tag', name: 'Etiqueta / Oferta', category: 'commerce', keywords: ['etiqueta', 'tag', 'oferta', 'desconto', 'promocao'], icon: Tag },
  { id: 'gift', name: 'Presente / Brinde', category: 'commerce', keywords: ['presente', 'gift', 'brinde', 'bonus', 'natal'], icon: Gift },
  { id: 'percent', name: 'Desconto %', category: 'commerce', keywords: ['porcentagem', 'percent', 'desconto', 'cupom', 'black-friday'], icon: Percent },
  { id: 'package', name: 'Pacote / Pedido', category: 'commerce', keywords: ['pacote', 'package', 'caixa', 'produto', 'entrega'], icon: Package },
  { id: 'truck', name: 'Caminhão / Frete', category: 'commerce', keywords: ['caminhao', 'truck', 'frete', 'envio', 'transportadora', 'correios'], icon: Truck },
  { id: 'box', name: 'Estoque / Caixa', category: 'commerce', keywords: ['caixa', 'box', 'estoque', 'armazenamento'], icon: Box },
  { id: 'store', name: 'Loja Física / Store', category: 'commerce', keywords: ['loja', 'store', 'comercio', 'unidade'], icon: Store },
  { id: 'layers', name: 'Coleções / Camadas', category: 'commerce', keywords: ['camadas', 'layers', 'colecao', 'variacoes'], icon: Layers },

  // Comunicação & Contato
  { id: 'mail', name: 'E-mail / Mensagem', category: 'communication', keywords: ['email', 'mail', 'mensagem', 'contato', 'carta'], icon: Mail },
  { id: 'phone', name: 'Telefone / Chamada', category: 'communication', keywords: ['telefone', 'phone', 'ligar', 'whatsapp', 'atendimento'], icon: Phone },
  { id: 'message-square', name: 'Chat / Mensagem', category: 'communication', keywords: ['chat', 'mensagem', 'conversa', 'suporte'], icon: MessageSquare },
  { id: 'message-circle', name: 'WhatsApp / Comentário', category: 'communication', keywords: ['whatsapp', 'comentario', 'balao'], icon: MessageCircle },
  { id: 'send', name: 'Enviar', category: 'communication', keywords: ['enviar', 'send', 'aviao', 'disparo'], icon: Send },
  { id: 'share-2', name: 'Compartilhar', category: 'communication', keywords: ['compartilhar', 'share', 'redes'], icon: Share2 },
  { id: 'globe', name: 'Globo / Site', category: 'communication', keywords: ['globo', 'globe', 'mundo', 'site', 'idioma', 'internet'], icon: Globe },
  { id: 'map-pin', name: 'Localização / Pin', category: 'communication', keywords: ['localizacao', 'map-pin', 'mapa', 'endereco', 'onde-estamos'], icon: MapPin },
  { id: 'navigation', name: 'Navegação / GPS', category: 'communication', keywords: ['navegacao', 'navigation', 'gps', 'rota'], icon: Navigation },
  { id: 'compass', name: 'Bússola', category: 'communication', keywords: ['bussola', 'compass', 'direcao', 'explorar'], icon: Compass },
  { id: 'headphones', name: 'Suporte / Fone', category: 'communication', keywords: ['suporte', 'headphones', 'fone', 'atendimento', 'ajuda'], icon: Headphones },
  { id: 'thumbs-up', name: 'Curtir / Aprovação', category: 'communication', keywords: ['like', 'curtir', 'positivo', 'aprovado'], icon: ThumbsUp },

  // Mídia & Entretenimento
  { id: 'play', name: 'Play / Vídeo', category: 'media', keywords: ['play', 'video', 'iniciar', 'reproduzir'], icon: Play },
  { id: 'video', name: 'Câmera de Vídeo', category: 'media', keywords: ['video', 'camera', 'gravacao', 'filme'], icon: Video },
  { id: 'image', name: 'Imagem / Foto', category: 'media', keywords: ['imagem', 'image', 'foto', 'galeria', 'banner'], icon: ImageIcon },
  { id: 'music', name: 'Música / Áudio', category: 'media', keywords: ['musica', 'music', 'som', 'audio'], icon: Music },
  { id: 'volume-2', name: 'Volume / Alto-falante', category: 'media', keywords: ['volume', 'som', 'audio'], icon: Volume2 },
  { id: 'camera', name: 'Câmera Fotográfica', category: 'media', keywords: ['camera', 'foto', 'lente'], icon: Camera },
  { id: 'film', name: 'Filme / Cinema', category: 'media', keywords: ['filme', 'film', 'cinema', 'trailer'], icon: Film },
  { id: 'download', name: 'Download / Baixar', category: 'media', keywords: ['download', 'baixar', 'arquivo', 'salvar'], icon: Download },
  { id: 'upload', name: 'Upload / Enviar', category: 'media', keywords: ['upload', 'enviar', 'carregar'], icon: Upload },
  { id: 'file-text', name: 'Documento / PDF', category: 'media', keywords: ['documento', 'file', 'texto', 'manual', 'contrato'], icon: FileText },
  { id: 'folder', name: 'Pasta / Diretório', category: 'media', keywords: ['pasta', 'folder', 'arquivos'], icon: Folder },
  { id: 'book-open', name: 'Livro / Manual', category: 'media', keywords: ['livro', 'book', 'manual', 'guia', 'tutorial'], icon: BookOpen },

  // Dispositivos & Tech
  { id: 'laptop', name: 'MacBook / Notebook', category: 'devices', keywords: ['laptop', 'notebook', 'macbook', 'computador'], icon: Laptop },
  { id: 'smartphone', name: 'iPhone / Celular', category: 'devices', keywords: ['smartphone', 'iphone', 'celular', 'mobile'], icon: Smartphone },
  { id: 'tablet', name: 'iPad / Tablet', category: 'devices', keywords: ['tablet', 'ipad', 'touch'], icon: Tablet },
  { id: 'monitor', name: 'iMac / Monitor', category: 'devices', keywords: ['monitor', 'tela', 'imac', 'display'], icon: Monitor },
  { id: 'cpu', name: 'Processador / Chip', category: 'devices', keywords: ['chip', 'cpu', 'processador', 'apple-silicon', 'm1', 'm2', 'm3', 'm4'], icon: Cpu },
  { id: 'wifi', name: 'Wi-Fi / Conexão', category: 'devices', keywords: ['wifi', 'internet', 'rede', 'sem-fio'], icon: Wifi },
  { id: 'battery', name: 'Bateria / Autonomia', category: 'devices', keywords: ['bateria', 'battery', 'carga', 'durabilidade'], icon: Battery },
  { id: 'hard-drive', name: 'SSD / Armazenamento', category: 'devices', keywords: ['ssd', 'hd', 'armazenamento', 'memoria'], icon: HardDrive },
  { id: 'bluetooth', name: 'Bluetooth', category: 'devices', keywords: ['bluetooth', 'pareamento', 'sem-fio'], icon: Bluetooth },
  { id: 'tv', name: 'Apple TV / Tela', category: 'devices', keywords: ['tv', 'televisao', 'apple-tv'], icon: Tv },
  { id: 'watch', name: 'Apple Watch / Smartwatch', category: 'devices', keywords: ['watch', 'relogio', 'apple-watch', 'sensor'], icon: Watch },

  // Setas & Navegação
  { id: 'arrow-right', name: 'Seta Direita', category: 'arrows', keywords: ['seta', 'arrow', 'proximo', 'seguir', 'avancar'], icon: ArrowRight },
  { id: 'arrow-left', name: 'Seta Esquerda', category: 'arrows', keywords: ['seta', 'arrow', 'voltar', 'anterior'], icon: ArrowLeft },
  { id: 'arrow-up', name: 'Seta Cima', category: 'arrows', keywords: ['seta', 'arrow', 'topo', 'subir'], icon: ArrowUp },
  { id: 'arrow-down', name: 'Seta Baixo', category: 'arrows', keywords: ['seta', 'arrow', 'descer'], icon: ArrowDown },
  { id: 'chevron-right', name: 'Chevron Direita', category: 'arrows', keywords: ['chevron', 'setinha', 'saiba-mais'], icon: ChevronRight },
  { id: 'chevron-left', name: 'Chevron Esquerda', category: 'arrows', keywords: ['chevron', 'voltar'], icon: ChevronLeft },
  { id: 'external-link', name: 'Link Externo', category: 'arrows', keywords: ['link', 'external-link', 'abrir-nova-aba'], icon: ExternalLink },
  { id: 'refresh-cw', name: 'Recarregar / Atualizar', category: 'arrows', keywords: ['atualizar', 'refresh', 'sincronizar'], icon: RefreshCw },

  // Ferramentas & Configurações
  { id: 'wrench', name: 'Chave Inglesa / Ferramenta', category: 'tools', keywords: ['ferramenta', 'wrench', 'manutencao', 'conserto'], icon: Wrench },
  { id: 'hammer', name: 'Martelo / Construção', category: 'tools', keywords: ['martelo', 'hammer', 'obra', 'ferramenta'], icon: Hammer },
  { id: 'palette', name: 'Paleta / Cores', category: 'tools', keywords: ['paleta', 'palette', 'cor', 'design', 'tema'], icon: Palette },
  { id: 'sliders', name: 'Ajustes / Equalizador', category: 'tools', keywords: ['ajustes', 'sliders', 'parametros'], icon: Sliders },
  { id: 'code', name: 'Código / Dev', category: 'tools', keywords: ['codigo', 'code', 'html', 'programacao'], icon: Code },
  { id: 'terminal', name: 'Terminal / CLI', category: 'tools', keywords: ['terminal', 'comando', 'desenvolvimento'], icon: Terminal },
]

export function renderDynamicIcon(name: string, size: number = 24, color?: string, strokeWidth: number = 1.6) {
  const found = ICON_LIBRARY.find(i => i.id === name)
  const IconComp = found?.icon || Star
  return <IconComp size={size} strokeWidth={strokeWidth} style={{ color }} />
}

export const ICON_CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'general', label: 'Geral & Interface' },
  { id: 'commerce', label: 'Comércio & Vendas' },
  { id: 'communication', label: 'Comunicação' },
  { id: 'devices', label: 'Dispositivos & Tech' },
  { id: 'media', label: 'Mídia & Áudio' },
  { id: 'arrows', label: 'Setas' },
  { id: 'tools', label: 'Ferramentas' },
]

interface IconPickerModalProps {
  isOpen: boolean
  currentIcon?: string
  onClose: () => void
  onSelectIcon: (iconId: string) => void
}

export default function IconPickerModal({ isOpen, currentIcon = 'star', onClose, onSelectIcon }: IconPickerModalProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [tempSelected, setTempSelected] = useState(currentIcon)

  const filteredIcons = useMemo(() => {
    const q = search.toLowerCase().trim()
    return ICON_LIBRARY.filter(item => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory
      if (!matchCat) return false
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.keywords.some(k => k.toLowerCase().includes(q))
      )
    })
  }, [search, selectedCategory])

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          maxHeight: '85vh',
          backgroundColor: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.22), 0 0 0 1px rgba(0, 0, 0, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'teknixModalIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid #f0f0f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1d1d1f', letterSpacing: '-0.02em' }}>
              Biblioteca de Ícones
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#86868b' }}>
              Selecione um ícone com traços refinados e harmônicos
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: '#f5f5f7',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#86868b',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#e8e8ed'; (e.currentTarget as HTMLElement).style.color = '#1d1d1f' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = '#f5f5f7'; (e.currentTarget as HTMLElement).style.color = '#86868b' }}
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Search & Categories */}
        <div style={{ padding: '16px 24px 12px', borderBottom: '1px solid #f0f0f2', backgroundColor: '#fafafc' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <SearchIcon
              size={16}
              strokeWidth={1.75}
              style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#86868b' }}
            />
            <input
              type="text"
              placeholder="Buscar ícone por nome ou palavra-chave (ex: estrela, sacola, frete, raio)..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '10px 14px 10px 38px',
                borderRadius: 10,
                border: '1px solid #d2d2d7',
                backgroundColor: '#ffffff',
                fontSize: 14,
                color: '#1d1d1f',
                outline: 'none',
                boxSizing: 'border-box',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              }}
              onFocus={e => { e.currentTarget.style.borderColor = '#0071e3'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0, 113, 227, 0.15)' }}
              onBlur={e => { e.currentTarget.style.borderColor = '#d2d2d7'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>

          {/* Categories Pill Tabs */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {ICON_CATEGORIES.map(cat => {
              const active = selectedCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 980,
                    border: 'none',
                    fontSize: 12,
                    fontWeight: active ? 600 : 500,
                    backgroundColor: active ? '#0071e3' : '#ffffff',
                    color: active ? '#ffffff' : '#6e6e73',
                    boxShadow: active ? '0 2px 6px rgba(0, 113, 227, 0.3)' : '0 1px 2px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.06)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Icons Grid Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 24,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
            gap: 12,
            alignContent: 'start',
            minHeight: 320,
          }}
        >
          {filteredIcons.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px 0', color: '#86868b' }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>🔍</div>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1d1d1f' }}>Nenhum ícone encontrado</p>
              <p style={{ margin: '4px 0 0', fontSize: 13 }}>Tente buscar com outros termos ou selecione "Todos".</p>
            </div>
          ) : (
            filteredIcons.map(item => {
              const IconComp = item.icon
              const isSelected = tempSelected === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setTempSelected(item.id)
                  }}
                  onDoubleClick={() => {
                    onSelectIcon(item.id)
                    onClose()
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '14px 8px 10px',
                    borderRadius: 14,
                    border: isSelected ? '2px solid #0071e3' : '1px solid #f0f0f2',
                    backgroundColor: isSelected ? '#f0f7ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                    gap: 8,
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.06)'
                      e.currentTarget.style.borderColor = '#d2d2d7'
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = 'none'
                      e.currentTarget.style.borderColor = '#f0f0f2'
                    }
                  }}
                >
                  <IconComp
                    size={28}
                    strokeWidth={1.6}
                    style={{ color: isSelected ? '#0071e3' : '#1d1d1f', transition: 'color 0.15s ease' }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? '#0071e3' : '#6e6e73',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      width: '100%',
                    }}
                  >
                    {item.name}
                  </span>
                </button>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            borderTop: '1px solid #f0f0f2',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#fafafc',
          }}
        >
          <span style={{ fontSize: 13, color: '#86868b' }}>
            {filteredIcons.length} ícones disponíveis
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #d2d2d7',
                backgroundColor: '#ffffff',
                fontSize: 13,
                fontWeight: 500,
                color: '#1d1d1f',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                onSelectIcon(tempSelected)
                onClose()
              }}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#0071e3',
                fontSize: 13,
                fontWeight: 600,
                color: '#ffffff',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0, 113, 227, 0.3)',
              }}
            >
              Inserir Ícone
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes teknixModalIn {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
