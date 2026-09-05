import MediaLibraryModal from '../components/MediaLibraryModal'
import ProductDataControls from '../components/editor/ProductDataControls'
import { WIDGET_DEFINITIONS } from '../types/pageBuilder'
import ImageEditorModal from '../components/editor/ImageEditorModal'
import IconPickerModal, { renderDynamicIcon } from '../components/editor/IconPickerModal'
import TeknixLogo from '../components/TeknixLogo'
import { supabase } from '../lib/supabase'
import Navigator from '../components/editor/Navigator'
import { Children, cloneElement, createContext, isValidElement, useContext, useId, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import {
  Save, Monitor, Tablet, Smartphone, Undo2, Redo2, RotateCcw, Menu, Layers, Settings,
  ChevronLeft, ChevronRight, Search, Plus, Type, Image as ImageIcon, MousePointer2, Eye, EyeOff,
  Layout, FileText, Megaphone, ShoppingBag, Grid, LayoutTemplate, Zap, Globe, Box,
  AlignLeft, AlignCenter, AlignRight, AlignJustify, Heading, MousePointerClick, Minus, MoveVertical,
  ExternalLink, Palette, Tag, Check, SlidersHorizontal, Copy, Clipboard, Trash2, Link2, Unlink,
  Video, MapPin, Star, HelpCircle, Edit3, Sliders, Maximize2, Code, Contrast,
  AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, ChevronDown,
  Clock, Share2, MessageSquare, AlertCircle, Activity, PlusCircle, LayoutGrid, List,
  ClipboardList, Lock, PlaySquare, Table, Paintbrush, Download, FolderOpen, Upload, Sparkles,
  ArrowUp, ArrowDown
} from 'lucide-react'
import { loadEditorTarget, saveEditorTarget, type EditorTarget } from '../services/widgetEditor'
import {
  convertElementorTemplateToLayout,
  ELEMENTOR_BUILTIN_TEMPLATES,
  type ElementorBuiltinTemplate
} from '../services/elementorImporter'
import {
  type WidgetEdits, type WidgetEdit, type WidgetDescriptor, type CanvasLayout, type CanvasNode,
  moveCanvasNode, matchNode, findNodePath, duplicateCanvasNode, removeCanvasNode, mergeWidgetEdit, GLOBAL_EDITOR_SCOPE
} from '../../../../packages/core/src/pageWidgets'
import './PageEditor.css'
import './EditorControls.css'

const EditorDeviceContext = createContext<{ mode: string; select: (mode: 'desktop' | 'tablet' | 'mobile') => void }>({ mode: 'desktop', select: () => {} })

const siteOrigin = import.meta.env.VITE_SITE_URL || (import.meta.env.DEV ? 'http://localhost:5173' : '')

// Categorias Oficiais do Elementor
const ELEMENTOR_LAYOUT_WIDGETS = [
  { type: 'container', label: 'Contêiner', icon: Box, desc: 'Contêiner Flexbox flexível' },
  { type: 'grid', label: 'Grade (Grid)', icon: Grid, desc: 'Grade CSS com colunas' },
]

const ELEMENTOR_BASIC_WIDGETS = [
  { type: 'heading', label: 'Título', icon: Heading, desc: 'Títulos H1 a H6' },
  { type: 'image', label: 'Imagem', icon: ImageIcon, desc: 'Imagens e Fotos' },
  { type: 'text', label: 'Editor de texto', icon: FileText, desc: 'Parágrafos e textos' },
  { type: 'video', label: 'Vídeo', icon: Video, desc: 'YouTube, Vimeo e vídeo' },
  { type: 'button', label: 'Botão', icon: MousePointerClick, desc: 'Chamadas para ação' },
  { type: 'divider', label: 'Divisor', icon: Minus, desc: 'Linha separadora' },
  { type: 'spacer', label: 'Espaçador', icon: MoveVertical, desc: 'Espaço em branco' },
  { type: 'googleMaps', label: 'Google Maps', icon: MapPin, desc: 'Mapa incorporado' },
  { type: 'icon', label: 'Ícone', icon: Star, desc: 'Ícones vetoriais' },
  { type: 'form', label: 'WPForms', icon: ClipboardList, desc: 'Formulários' },
]

const ELEMENTOR_PRO_WIDGETS = [
  { type: 'flipBox', label: 'Flip Box', icon: Layers, desc: 'Cartão interativo 3D com frente e verso' },
  { type: 'priceTable', label: 'Tabela de Preços', icon: Table, desc: 'Planos, preços e lista de recursos' },
  { type: 'priceList', label: 'Lista de Preços', icon: List, desc: 'Lista de itens com preços' },
  { type: 'countdown', label: 'Contador Regressivo', icon: Clock, desc: 'Cronômetro com dias/horas/min/seg' },
  { type: 'animatedHeadline', label: 'Título Animado', icon: Heading, desc: 'Efeito rabisco SVG e rotação' },
  { type: 'cta', label: 'Chamada para Ação', icon: Megaphone, desc: 'Caixa de CTA com ribbon e botão' },
  { type: 'reviews', label: 'Avaliações', icon: Star, desc: 'Grade de reviews e depoimentos' },
  { type: 'loopGrid', label: 'Loop Grid', icon: Grid, desc: 'Grade dinâmica' },
  { type: 'loopCarousel', label: 'Loop Carousel', icon: SlidersHorizontal, desc: 'Carrossel dinâmico' },
  { type: 'posts', label: 'Posts', icon: Layers, desc: 'Lista de publicações' },
  { type: 'portfolio', label: 'Portfolio', icon: LayoutGrid, desc: 'Grade de portfólio' },
  { type: 'gallery', label: 'Gallery', icon: ImageIcon, desc: 'Galeria justificada' },
  { type: 'form', label: 'Form', icon: ClipboardList, desc: 'Formulário Pro' },
  { type: 'login', label: 'Login', icon: Lock, desc: 'Acesso do cliente' },
  { type: 'slides', label: 'Slides', icon: PlaySquare, desc: 'Apresentação de slides' },
  { type: 'navMenu', label: 'Menu TEKNIX', icon: Menu, desc: 'Navegação do site' },
  { type: 'shareButtons', label: 'Share Buttons', icon: Share2, desc: 'Compartilhamento' },
]

const ELEMENTOR_GENERAL_WIDGETS = [
  { type: 'tabs', label: 'Abas', icon: Layers, desc: 'Abas de conteúdo' },
  { type: 'accordion', label: 'Sanfona', icon: ChevronDown, desc: 'Sanfona / FAQ' },
  { type: 'imageBox', label: 'Caixa da imagem', icon: ImageIcon, desc: 'Imagem com texto' },
  { type: 'iconBox', label: 'Caixa de ícone', icon: Star, desc: 'Ícone com texto' },
  { type: 'imageCarousel', label: 'Carrossel de imagens', icon: SlidersHorizontal, desc: 'Slider de imagens' },
  { type: 'basicGallery', label: 'Galeria básica', icon: Grid, desc: 'Grid de fotos' },
  { type: 'iconList', label: 'Lista de ícones', icon: List, desc: 'Itens com ícones' },
  { type: 'counter', label: 'Contador', icon: PlusCircle, desc: 'Contador numérico' },
  { type: 'progress', label: 'Barra de progresso', icon: Activity, desc: 'Progresso percentual' },
  { type: 'testimonial', label: 'Depoimento', icon: MessageSquare, desc: 'Depoimento de cliente' },
  { type: 'socialIcons', label: 'Ícones sociais', icon: Share2, desc: 'Redes sociais' },
  { type: 'alert', label: 'Alerta', icon: AlertCircle, desc: 'Caixa de aviso' },
]

const ELEMENTOR_STORE_WIDGETS = [
  { type: 'storefrontCard', label: 'Card de produto', icon: ShoppingBag, desc: 'Card comercial TEKNIX' },
  { type: 'storefrontShelf', label: 'Vitrine de produtos', icon: Grid, desc: 'Grid ou carrossel' },
  { type: 'ads', label: 'Espaço de anúncio', icon: Megaphone, desc: 'Campanhas de anúncios' },
  { type: 'categoryMosaic', label: 'Mosaico de categorias', icon: LayoutTemplate, desc: 'Grid 2x2 de categorias' },
  { type: 'flashSaleSection', label: 'Oferta relâmpago', icon: Zap, desc: 'Contador e ofertas' },
]

function initialWidgetContent(type: string): Record<string, any> {
  switch (type) {
    case 'heading': return { text: 'Título', tag: 'h2' }
    case 'text': return { text: 'Insira aqui a descrição detalhada do seu produto, serviço ou diferencial da TEKNIX. Este bloco suporta formatação de texto e parágrafos completos.' }
    case 'button': return { text: 'Comprar Agora', label: 'Comprar Agora', button_link: '#', button_size: 'md' }
    case 'image': return { src: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80', alt: 'Imagem TEKNIX' }
    case 'video': return { url: 'https://www.youtube.com/watch?v=XHTrA56kH10', title: 'Vídeo Demonstrativo TEKNIX' }
    case 'divider': return { color: '#d1d5db', thickness: 1, width: '100%' }
    case 'spacer': return { height: 48 }
    case 'icon': return { icon: 'star', icon_size: 28, icon_color: '#0071e3' }
    case 'googleMaps':
    case 'googleMapsPro':
    case 'google-maps': return { address: 'Av. Paulista, 1000 - Bela Vista, São Paulo - SP', zoom: 15, height: 350, width: '100%' }
    case 'form':
    case 'formPro':
    case 'form-pro': return {
      title: 'Fale com a TEKNIX',
      subtitle: 'Preencha o formulário abaixo e retornaremos em até 2 horas úteis.',
      submit_label: 'Enviar Mensagem',
      button_text: 'Enviar Mensagem',
      show_labels: true,
      form_fields: [
        { id: '1', field_type: 'text', field_label: 'Nome Completo', placeholder: 'Digite seu nome', column_width: '100%', required: true },
        { id: '2', field_type: 'email', field_label: 'E-mail', placeholder: 'seu@email.com', column_width: '50%', required: true },
        { id: '3', field_type: 'tel', field_label: 'Telefone / WhatsApp', placeholder: '(11) 99999-9999', column_width: '50%', required: false },
        { id: '4', field_type: 'textarea', field_label: 'Mensagem', placeholder: 'Como podemos te ajudar?', column_width: '100%', required: false }
      ]
    }
    case 'tabs': return { tabs: [{ title: 'Visão Geral', content: 'Desenvolvido para máxima durabilidade e performance industrial em qualquer trabalho.' }, { title: 'Especificações', content: 'Potência: 21V Max | Bateria: 4.0Ah Li-Ion | Mandril: 1/2" metálico | Peso: 1.6kg.' }, { title: 'Garantia', content: '12 meses de garantia oficial com suporte direto TEKNIX e troca expressa.' }] }
    case 'accordion':
    case 'toggle': return { items: [{ title: 'Qual é o prazo de entrega?', content: 'Enviamos todos os pedidos em até 24h úteis para todo o Brasil.' }, { title: 'As ferramentas possuem garantia de fábrica?', content: 'Sim, todas as ferramentas TEKNIX contam com 12 meses de garantia oficial e rede de assistência técnica.' }, { title: 'Como funciona o suporte técnico?', content: 'Nosso suporte funciona via WhatsApp e telefone direto com engenheiros especializados.' }] }
    case 'imageBox': return { title: 'Qualidade Extrema', text: 'Engenharia de precisão com componentes forjados e garantia vitalícia no chassi.', image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80' }
    case 'iconBox': return { title: 'Entrega Imediata', text: 'Estoque próprio com envio expresso e seguro total da carga até o seu endereço.', icon: 'truck', icon_size: 36, icon_color: '#0071e3' }
    case 'imageCarousel':
    case 'basicGallery':
    case 'carousel':
    case 'gallery': return {
      images: [
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
        'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&auto=format&fit=crop&q=80'
      ],
      columns: 3,
      gap: 16
    }
    case 'iconList': return { items: ['Motor Brushless 21V de alto torque', 'Bateria Íon-Lítio com autonomia estendida', 'Mandril de aperto rápido metálico 1/2"', 'Garantia oficial de 12 meses TEKNIX'] }
    case 'counter': return { number: 10000, suffix: '+', title: 'Clientes Satisfeitos no Brasil', prefix: '' }
    case 'progress':
    case 'progressBar': return { title: 'Meta de Produtividade', percent: 85, color: '#0071e3' }
    case 'testimonial':
    case 'reviews':
    case 'reviewsPro': return {
      reviews: [
        { author: 'Carlos Silva', role: 'Mestre de Obras', text: 'Ferramentas com torque sensacional, aguentam o dia a dia pesado sem oscilar bateria.', rating: 5 },
        { author: 'Mariana Costa', role: 'Arquiteta', text: 'Excelente acabamento e precisão nos cortes. Atendimento impecável da equipe TEKNIX.', rating: 5 },
        { author: 'Roberto Lima', role: 'Oficina Mecânica', text: 'Substituí todo meu ferramental antigo pela TEKNIX e a produtividade subiu 100%. Recomendo!', rating: 5 }
      ]
    }
    case 'socialIcons':
    case 'shareButtons': return { title: 'Compartilhar', networks: ['facebook', 'whatsapp', 'linkedin', 'instagram', 'twitter'] }
    case 'alert': return { title: 'Aviso Importante', description: 'Frete grátis para compras acima de R$ 299 em compras realizadas hoje.', alert_type: 'info' }
    case 'loopGrid': return { title: 'Grade Dinâmica', columns: 3, count: 6, data_source: 'products' }
    case 'loopCarousel': return { title: 'Carrossel Dinâmico', count: 6, data_source: 'products' }
    case 'posts':
    case 'postsCarousel': return { title: 'Últimas Dicas e Notícias TEKNIX', limit: 3, count: 3, columns: 3 }
    case 'portfolio': return { title: 'Projetos e Aplicações Reais', columns: 3 }
    case 'login':
    case 'loginPro':
    case 'login-pro': return {
      title: 'Acesse sua Conta TEKNIX',
      subtitle: 'Entre com seu e-mail e senha para acompanhar seus pedidos e orçamentos.',
      submit_label: 'Entrar',
      register_link: '/cadastro',
      forgot_link: '/recuperar-senha'
    }
    case 'slides': return {
      title: 'Tecnologia Industrial TEKNIX',
      subtitle: 'Ferramentas Brushless de alta performance e máxima autonomia para quem exige perfeição.',
      button_text: 'Conhecer Linha Completa',
      button_link: '/ferramentas',
      bg_color: '#0071e3',
      bg_color2: '#00b4d8'
    }
    case 'navMenu':
    case 'megaMenu': return {
      title: 'Menu de Navegação',
      items: [
        { label: 'Início', url: '/' },
        { label: 'Ferramentas', url: '/ferramentas' },
        { label: 'Máquinas', url: '/maquinas' },
        { label: 'Acessórios', url: '/acessorios' },
        { label: 'Suporte', url: '/suporte' }
      ]
    }
    case 'priceList':
    case 'priceListPro': return {
      title: 'Lista de Preços TEKNIX',
      items: [
        { name: 'Parafusadeira Brushless 21V', label: 'Parafusadeira Brushless 21V', price: 'R$ 489,90', description: 'Mandril 1/2", 2 baterias 4.0Ah e maleta rígida.' },
        { name: 'Jogo de Brocas Titânio 13 Peças', label: 'Jogo de Brocas Titânio 13 Peças', price: 'R$ 79,90', description: 'Brocas de alta resistência para metal e alvenaria.' },
        { name: 'Esmerilhadeira Angular 900W', label: 'Esmerilhadeira Angular 900W', price: 'R$ 329,00', description: 'Disco de 4.1/2" com punho auxiliar antivibração.' }
      ]
    }
    case 'priceTable':
    case 'priceTablePro': return {
      plan: 'Plano Profissional',
      subtitle: 'O plano mais escolhido por oficinas e indústrias',
      currency: 'R$',
      price: '199',
      original_price: '249',
      period: '/mês',
      ribbon_title: 'MAIS POPULAR',
      ribbon_bg: '#0071e3',
      features: ['Acesso a todo o catálogo TEKNIX', 'Suporte prioritário 24/7', 'Garantia estendida oficial', 'Frete rápido incluso'],
      button_label: 'Escolher Plano',
      button_link: '#'
    }
    case 'countdown':
    case 'countdownPro': return {
      title: 'Oferta Especial Termina Em',
      end_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
      show_days: true,
      show_hours: true,
      show_minutes: true,
      show_seconds: true
    }
    case 'flipBox':
    case 'flipBoxPro': return {
      front_title: 'Diferenciais Exclusivos',
      front_subtitle: 'Passe o mouse para ver os detalhes',
      front_bg: '#1e293b',
      front_color: '#ffffff',
      front_icon: 'star',
      back_title: 'Garantia TEKNIX',
      back_description: 'Assistência técnica permanente e peças de reposição imediatas.',
      back_bg: '#0071e3',
      back_color: '#ffffff',
      button_text: 'Saber Mais',
      button_link: '#',
      effect: 'flip',
      direction: 'right',
      is_3d: true,
      height: 280
    }
    case 'animatedHeadline':
    case 'animatedHeadlinePro': return {
      headline_style: 'highlight',
      shape: 'circle',
      before_text: 'A maior linha de',
      highlighted_text: 'Ferramentas',
      after_text: 'do Brasil',
      stroke_color: '#a2e000',
      color: '#1d1d1f'
    }
    case 'cta':
    case 'call-to-action': return {
      title: 'Oferta Especial TEKNIX',
      description: 'Garanta até 40% de desconto em kits selecionados.',
      button_label: 'Aproveitar Agora',
      button_link: '#',
      ribbon_title: 'OFERTA'
    }
    case 'tableOfContents':
    case 'tableOfContentsPro': return {
      title: 'Sumário da Página',
      show_subheadings: true
    }
    case 'hotspot': return {
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      hotspots: [
        { x: 35, y: 38, label: 'Motor Brushless de 21V' },
        { x: 68, y: 55, label: 'Bateria de Íon-Lítio 4.0Ah' },
        { x: 25, y: 70, label: 'Mandril 1/2" Metálico' }
      ]
    }
    case 'categoryMosaic': return {
      title: 'Categorias em Destaque',
      subtitle: 'Navegue pelas principais linhas e encontre a ferramenta certa para sua necessidade.',
      show_section_title: false,
      show_arrows: true,
      card_shape: 'rounded',
      card_size: 90,
      items: [
        {
          name: 'Use: DESCONTO',
          link: '/produtos',
          bgType: 'promo',
          badge: 'até 20%',
          badgeSub: 'OFF',
          iconUrl: '',
          promoBg: '#22c55e'
        },
        {
          name: 'Macaco',
          link: '/produtos?q=macaco+hidraulico',
          bgType: 'normal',
          iconUrl: '/images/referencias/macaco-hidraulico.webp',
          is_cutout: true
        },
        {
          name: 'Morsa',
          link: '/produtos?q=morsa',
          bgType: 'normal',
          iconUrl: '/images/referencias/morsa-de-bancada.webp',
          is_cutout: true
        },
        {
          name: 'Pintura',
          link: '/produtos?q=pistola+de+pintura',
          bgType: 'normal',
          iconUrl: '/images/referencias/pistola-de-pintura.webp',
          is_cutout: true
        },
        {
          name: 'Lavagem',
          link: '/produtos?q=pistola+de+lavagem',
          bgType: 'normal',
          iconUrl: '/images/referencias/pistola-de-lavagem.webp',
          is_cutout: true
        },
        {
          name: 'Parafusadeira',
          link: '/produtos?q=parafusadeira',
          bgType: 'normal',
          iconUrl: '/images/referencias/parafusadeira.webp',
          is_cutout: true
        },
        {
          name: 'Lixadeira',
          link: '/produtos?q=lixadeira',
          bgType: 'normal',
          iconUrl: '/images/referencias/lixadeira.webp',
          is_cutout: true
        }
      ]
    }
    case 'flashSaleSection': return {
      title: 'Ofertas Relâmpago',
      subtitle: '',
      show_bolt: true,
      bolt_color: '#dc2626',
      bolt_size: 22,
      show_timer: true,
      timer_label: 'As ofertas se encerram em:',
      countdown_title: 'OFERTA RELÂMPAGO',
      end_date: new Date(Date.now() + 86400000 * 2).toISOString().slice(0, 16),
      badge_text: 'ATÉ 40% OFF',
      product_source: 'auto',
      manual_skus: '',
      limit: 8,
      show_stars: true,
      show_old_price: true,
      show_discount_badge: true,
      show_pix: true,
      pix_text: 'à vista no Pix com desconto',
      show_arrow: true
    }
    case 'ads': return { placement: 'middle_screen', title: 'Campanha em Destaque', banner_url: '', link_url: '#' }
    case 'grid': return { columns: 2, gap: '16px', width_type: 'boxed', tag: 'div' }
    case 'container': return { direction: 'column', gap: '16px', width_type: 'boxed', tag: 'div' }
    case 'storefrontCard': return { product_id: '', custom_title: '', custom_price: '', badge: 'Destaque' }
    case 'storefrontShelf': return { title: 'Mais Vendidos TEKNIX', category: '', limit: 4, layout: 'grid' }
    case 'chrome:header': return { title: 'Cabeçalho da Loja', link: '/', image: '' }
    case 'chrome:footer': return { title: 'Rodapé da Loja', company_info: 'TEKNIX FERRAMENTAS LTDA • CNPJ: 63.623.515/0001-68', copyright: 'Todos os direitos reservados.', whatsapp: '(46) 99915-5875', email: 'sac@teknix.com.br' }
    default: return { title: 'Novo Bloco TEKNIX', text: 'Descrição do bloco configurável no painel.' }
  }
}


export default function PageEditor() {
  const { kind = 'page', id = '' } = useParams()
  const [params] = useSearchParams()
  const targetId = kind === 'native' ? params.get('path') || '/' : id
  const scopeRef = useRef(''); scopeRef.current = `${kind}:${targetId}`
  const [globalTarget, setGlobalTarget] = useState<EditorTarget | null>(null)
  const [editScope, setEditScope] = useState<'local' | 'global'>('local')
  const pendingDrop = useRef<any>(null)
  const [, setActiveNode] = useState<any>(null)
  const [target, setTarget] = useState<EditorTarget | null>(null)
  const [history, setHistory] = useState<WidgetEdits[]>([{}])
  const [position, setPosition] = useState(0)
  const [widgets, setWidgets] = useState<WidgetDescriptor[]>([])
  const widgetsRef = useRef(widgets)
  widgetsRef.current = widgets
  const initialPatchesSentRef = useRef(false)
  const [selected, setSelected] = useState('')
  const [panel, setPanel] = useState<'elements' | 'inspector' | 'settings'>('elements')
  const [inspectorTab, setInspectorTab] = useState<'content' | 'style' | 'advanced'>('content')
  const [elementsSubTab, setElementsSubTab] = useState<'catalog' | 'globals' | 'templates' | 'page'>('catalog')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [btnStyleHoverTab, setBtnStyleHoverTab] = useState<'normal' | 'hover'>('normal')
  const [styleHoverTab, setStyleHoverTab] = useState<'normal' | 'hover'>('normal')
  const [accTitleTab, setAccTitleTab] = useState<'normal' | 'hover' | 'active'>('normal')
  const [accIconTab, setAccIconTab] = useState<'normal' | 'hover' | 'active'>('normal')
  const [accBorderTab, setAccBorderTab] = useState<'normal' | 'hover' | 'active'>('normal')
  const [search, setSearch] = useState('')
  const [editingImage, setEditingImage] = useState(false)
  const [editingIcon, setEditingIcon] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [navigator, setNavigator] = useState(false)
  const [previewing, setPreviewing] = useState(params.get('preview') === '1')
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [publishMenuOpen, setPublishMenuOpen] = useState(false)
  const publishDropdownRef = useRef<HTMLDivElement>(null)
  const [copiedStyles, setCopiedStyles] = useState<{ schema?: Record<string, any>; style?: Record<string, any> } | null>(null)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    targetId: string
    targetType: string
    targetLabel?: string
    regionId?: string
    global?: boolean
  } | null>(null)
  const [clipboard, setClipboard] = useState<{
    id: string
    type: string
    label?: string
    node?: CanvasNode
    edit?: WidgetEdit
    style?: Record<string, any>
    schema?: Record<string, any>
    content?: Record<string, any>
  } | null>(() => {
    try {
      const raw = localStorage.getItem('teknix_editor_clipboard')
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  })
  const [actionNotice, setActionNotice] = useState('')
  const showNotice = (msg: string) => {
    setActionNotice(msg)
    setTimeout(() => setActionNotice(''), 2500)
  }

  const [showImageFilters, setShowImageFilters] = useState(false)
  const [showImageBoxShadow, setShowImageBoxShadow] = useState(false)
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({
    layout: true,
    basic: true,
    custom: false,
    pro: false,
    general: false,
    store: true
  })
  const toggleCat = (k: string) => setOpenCats(prev => ({ ...prev, [k]: !prev[k] }))

  // Accordions do Inspetor
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    content_main: true,
    content_media: true,
    content_button: true,
    content_toggles: true,
    content_structure: true,
    content_flex: true,
    style_card: true,
    style_media: false,
    style_title: true,
    style_price: true,
    style_rating: true,
    style_button: true,
    style_container: true,
    adv_layout: true,
    adv_resp: true
  })
  const toggleSection = (k: string) => setOpenSections(prev => ({ ...prev, [k]: !prev[k] }))
  const [openRepeaterIndex, setOpenRepeaterIndex] = useState<Record<string, number>>({})

  const frame = useRef<HTMLIFrameElement>(null)
  const canvas = useRef<HTMLElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 1000, height: 750 })

  useEffect(() => {
    if (!canvas.current) return
    const observer = new ResizeObserver(([entry]) => setCanvasSize({ width: entry.contentRect.width, height: entry.contentRect.height }))
    observer.observe(canvas.current)
    return () => observer.disconnect()
  }, [target?.scope])

  const historyRef = useRef(history); historyRef.current = history
  const positionRef = useRef(position); positionRef.current = position
  const edits = history[position]
  const editsRef = useRef(edits); editsRef.current = edits
  const previewTree = edits.__tree__?.tree || target?.previewData
  const localEdits = ({ ...edits }); delete localEdits.__global__
  const globalEdits: WidgetEdits = edits.__global__?.tree || {}
  const localDirty = !!target && JSON.stringify(localEdits) !== JSON.stringify(target.edits)
  const globalDirty = !!globalTarget && JSON.stringify(globalEdits) !== JSON.stringify(globalTarget.edits)
  const dirty = localDirty || globalDirty

  useEffect(() => {
    let cancelled = false
    setLoading(true); setSaving(false); setPanel('elements'); setTarget(null); setWidgets([]); setSelected(''); setError(''); setMessage('')
    Promise.all([loadEditorTarget(kind, targetId), loadEditorTarget('global', 'site')]).then(([t, g]) => {
      if (cancelled) return
      setTarget(t); setGlobalTarget(g); setEditScope('local'); setHistory([{ ...t.edits, __global__: { tree: g.edits } }]); setPosition(0)
    }).catch(e => { if (!cancelled) setError(e.message || 'Não foi possível carregar a página.') }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [kind, targetId])

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function send(type: string, extra: object = {}) {
    if (target && siteOrigin) frame.current?.contentWindow?.postMessage({ type, scope: target.scope, ...extra }, new URL(siteOrigin).origin)
  }

  useEffect(() => {
    const receive = (e: MessageEvent) => {
      if (!target || !siteOrigin || e.origin !== new URL(siteOrigin).origin || e.source !== frame.current?.contentWindow || e.data?.scope !== target.scope) return
      if (e.data.type === 'teknix:widgets' && Array.isArray(e.data.widgets)) {
        const prevKey = widgetsRef.current.map(w => `${w.id}:${w.label}:${w.widgetType}`).join('|')
        const nextKey = e.data.widgets.map((w: any) => `${w.id}:${w.label}:${w.widgetType}`).join('|')
        if (prevKey !== nextKey) {
          setWidgets(e.data.widgets)
        }
        // Widgets register progressively while the iframe renders. Keep the user's
        // selection during those partial registry snapshots instead of jumping to
        // whichever element happened to register first.
        const focusParam = params.get('focus')
        setSelected(old => focusParam || old || e.data.widgets[0]?.id || '')
        if (focusParam) {
          setPanel('inspector')
          setCollapsed(false)
        }
        if (!initialPatchesSentRef.current) {
          initialPatchesSentRef.current = true
          send('teknix:global-patches', { scope: GLOBAL_EDITOR_SCOPE, edits: editsRef.current.__global__?.tree || {} })
          frame.current?.contentWindow?.postMessage({ type: 'teknix:patches', scope: target.scope, edits: editsRef.current }, new URL(siteOrigin).origin)
        }
      }
      if (e.data.type === 'teknix:layout-action') handleLayout(e.data)
      if (e.data.type === 'teknix:select') {
        if (e.data.global) setEditScope('global')
        setSelected(e.data.id)
        setPanel('inspector')
        setCollapsed(false)
        setContextMenu(null)
      }
      if (e.data.type === 'teknix:contextmenu') {
        const iframeRect = frame.current?.getBoundingClientRect()
        const currentScale = scale || 1
        const x = (iframeRect?.left || 0) + (e.data.clientX || 0) * currentScale
        const y = (iframeRect?.top || 0) + (e.data.clientY || 0) * currentScale
        const targetId = e.data.id || selected
        if (targetId) {
          setSelected(targetId)
        }
        const desc = widgets.find(w => w.id === targetId)
        const targetKind = e.data.kind || desc?.kind || (targetId.startsWith('layout:') || desc?.widgetType === 'container' ? 'container' : 'widget')
        const targetLabel = e.data.label || desc?.label || (targetKind === 'container' ? 'Contêiner' : 'Elemento')

        setContextMenu({
          x,
          y,
          targetId,
          targetType: targetKind,
          targetLabel,
          regionId: e.data.regionId || desc?.regionId,
          global: e.data.global || !!desc?.globalKey
        })
      }
      if (e.data.type === 'teknix:canvas-click') {
        setContextMenu(null)
      }
      if (e.data.type === 'teknix:preview-ready') send('teknix:preview-tree', { tree: editsRef.current.__tree__?.tree || target.previewData })
    }
    window.addEventListener('message', receive)
    const handleWindowCloseMenu = (event: Event) => {
      setContextMenu(null)
      if (publishDropdownRef.current && !publishDropdownRef.current.contains(event.target as Node)) {
        setPublishMenuOpen(false)
      }
    }
    window.addEventListener('click', handleWindowCloseMenu)
    window.addEventListener('scroll', handleWindowCloseMenu, true)
    return () => {
      window.removeEventListener('message', receive)
      window.removeEventListener('click', handleWindowCloseMenu)
      window.removeEventListener('scroll', handleWindowCloseMenu, true)
    }
  }, [target, editScope])

  useEffect(() => {
    send('teknix:global-patches', { scope: GLOBAL_EDITOR_SCOPE, edits: globalEdits })
    send('teknix:patches', { edits: localEdits })
    if (previewTree) send('teknix:preview-tree', { tree: previewTree })
  }, [edits, target])

  function change(next: WidgetEdits) {
    editsRef.current = next
    setHistory(prev => {
      const sliced = prev.slice(0, positionRef.current + 1)
      if (sliced.length >= 40) sliced.shift()
      return [...sliced, next]
    })
    setPosition(p => Math.min(39, p + 1))
    setMessage('')
  }

  function patchKey(key: string, part: Partial<WidgetEdit>, global = false) {
    const current = editsRef.current
    const layer: WidgetEdits = global ? current.__global__?.tree || {} : current
    const previous = layer[key] || {}
    const next = {
      ...layer,
      [key]: {
        ...previous,
        ...part,
        ...(part.schema ? { schema: {
          ...previous.schema,
          ...part.schema,
          ...(part.schema.responsive ? { responsive: {
            ...previous.schema?.responsive,
            ...part.schema.responsive,
            tablet: { ...previous.schema?.responsive?.tablet, ...part.schema.responsive?.tablet },
            mobile: { ...previous.schema?.responsive?.mobile, ...part.schema.responsive?.mobile }
          } } : {})
        } } : {}),
        ...(part.content ? { content: { ...previous.content, ...part.content } } : {})
      }
    }
    change(global ? { ...current, __global__: { tree: next } } : next)
  }

  function patch(part: Partial<WidgetEdit>) {
    const descriptor = widgets.find(w => w.id === selected)
    const descriptorType = descriptor?.widgetType || (descriptor?.kind === 'container' ? 'container' : '')
    const responsiveEdit = viewport !== 'desktop' && (inspectorTab !== 'content' || descriptorType === 'container' || descriptorType === 'grid' || descriptorType === 'layoutRegion')
    let nextPart = part
    if (responsiveEdit && (part.schema || part.content)) {
      const { schema: schemaPart, content: contentPart, ...rest } = part
      const values = { ...(schemaPart || {}), ...(contentPart || {}) }
      delete (values as any).responsive
      nextPart = { ...rest, schema: { responsive: { [viewport]: values } } }
    }
    const isGlobal = editScope === 'global'
    const key = isGlobal && descriptor?.globalKey ? descriptor.globalKey : selected
    patchKey(key, nextPart, isGlobal)
  }

  function handleLayout(data: any) {
    if (data.action === 'choose') { pendingDrop.current = data; setPanel('elements'); setElementsSubTab('catalog'); return }
    if (data.action === 'select') { setActiveNode(data); return }

    const layouts = getLayouts()
    let targetLayoutItem: { key: string; global: boolean; layout: CanvasLayout; regionId?: string } | undefined

    // 1. Locate layout containing data.target
    if (data.target) {
      targetLayoutItem = layouts.find(l => findNodePath(l.layout, data.target).length > 0 || l.layout.nodes.some(n => matchNode(n, data.target)))
    }

    // 2. Locate by data.globalKey or data.regionId
    if (!targetLayoutItem && (data.globalKey || data.regionId)) {
      const isGlobal = (editScope === 'global' && !!data.globalKey) || !!data.globalKey
      const targetKey = data.globalKey || `layout:${data.regionId}`
      targetLayoutItem = layouts.find(l => l.key === targetKey)
    }

    // 3. Locate by registered widget's regionId / globalKey
    if (!targetLayoutItem && data.target) {
      const wDesc = widgets.find(w => w.id === data.target)
      if (wDesc?.regionId) {
        const targetKey = wDesc.globalKey || `layout:${wDesc.regionId}`
        targetLayoutItem = layouts.find(l => l.key === targetKey)
      }
    }

    // 4. Fallback: prioritize page layouts over chrome (header/footer)
    if (!targetLayoutItem) {
      targetLayoutItem = layouts.find(l => !l.key.includes('chrome:')) || layouts[0]
    }

    const pageScopeName = target?.scope?.replace(/^page:/, '') || 'page'
    const defaultKey = data.globalKey || (data.regionId ? `layout:${data.regionId}` : `layout:${pageScopeName}`)
    const global = targetLayoutItem ? targetLayoutItem.global : (editScope === 'global' && !!data.globalKey)
    const key = targetLayoutItem ? targetLayoutItem.key : defaultKey
    const layer = global ? editsRef.current.__global__?.tree || {} : editsRef.current
    let layout: CanvasLayout = structuredClone(targetLayoutItem?.layout || layer[key]?.tree || data.initial || { nodes: [] })
    if (!layout?.nodes) layout = { nodes: [] }

    if (data.action === 'move-cross-region') {
      const sourceDescriptor = widgets.find(w => w.regionId === data.sourceRegionId)
      const sourceGlobal = editScope === 'global' && !!sourceDescriptor?.globalKey
      const sourceKey = sourceGlobal ? sourceDescriptor!.globalKey! : `layout:${data.sourceRegionId}`
      const sourceLayer = sourceGlobal ? editsRef.current.__global__?.tree || {} : editsRef.current
      let sourceLayout: CanvasLayout = structuredClone(sourceLayer[sourceKey]?.tree || sourceDescriptor?.layout || { nodes: [] })
      let movingNode: CanvasNode | undefined
      const detach = (items: CanvasNode[]): boolean => {
        const index = items.findIndex(item => matchNode(item, data.nodeId))
        if (index >= 0) { movingNode = items.splice(index, 1)[0]; return true }
        return items.some(item => detach(item.children || []))
      }
      if (!detach(sourceLayout.nodes) || !movingNode) return
      layout.nodes.push(movingNode)
      if (data.target) layout = moveCanvasNode(layout, movingNode.id, data.target, !!data.inside, data.position)
      const writeLayout = (state: WidgetEdits, layoutKey: string, value: CanvasLayout, isGlobal: boolean): WidgetEdits => {
        if (!isGlobal) return { ...state, [layoutKey]: { ...state[layoutKey], tree: value } }
        const globalTree: WidgetEdits = state.__global__?.tree || {}
        return { ...state, __global__: { tree: { ...globalTree, [layoutKey]: { ...globalTree[layoutKey], tree: value } } } }
      }
      let next = writeLayout(editsRef.current, sourceKey, sourceLayout, sourceGlobal)
      next = writeLayout(next, key, layout, global)
      change(next)
      setSelected(movingNode.id)
      setPanel('inspector')
      showNotice('Elemento movido para a nova seção.')
      return
    }
    if (data.action === 'delete') {
      layout = removeCanvasNode(layout, data.nodeId)
      patchKey(key, { tree: layout }, global)
      setSelected('')
      showNotice('Contêiner excluído!')
      return
    }
    if (data.action === 'move') {
      if (data.target) layout = moveCanvasNode(layout, data.nodeId, data.target, !!data.inside, data.position)
      else {
        const sentinel = { id: '__end__', label: '' }
        layout.nodes.push(sentinel)
        layout = moveCanvasNode(layout, data.nodeId, sentinel.id)
        layout.nodes = layout.nodes.filter(n => n.id !== sentinel.id)
      }
    }
    if (data.action === 'insert') {
      const type = data.widgetType
      const content = data.content || initialWidgetContent(type)
      const widgetNode: CanvasNode = {
        id: crypto.randomUUID(),
        label: WIDGET_DEFINITIONS.find(w => w.type === type)?.label || ({
          container: 'Contêiner',
          ads: 'Espaço de anúncio',
          storefrontCard: 'Card de produto',
          storefrontShelf: 'Vitrine de produtos'
        } as any)[type] || type,
        type,
        content,
        children: data.children || (type === 'container' || type === 'grid' ? [] : undefined),
        ...(type === 'ads' ? { adPlacement: 'middle_screen' } : {})
      }

      // Se o target for um widget existente na tela mas ainda não estiver como CanvasNode explícito no layout
      if (data.target && !layout.nodes.some(n => matchNode(n, data.target)) && findNodePath(layout, data.target).length === 0) {
        const desc = widgets.find(w => w.id === data.target)
        layout.nodes.push({
          id: data.target,
          source: data.target,
          label: desc?.label || data.target,
          type: desc?.widgetType || 'widget',
          content: desc?.content || {}
        })
      }

      const targetPath = data.target ? findNodePath(layout, data.target) : []
      const targetNode = targetPath.length > 0 ? targetPath[targetPath.length - 1] : (data.target ? layout.nodes.find(n => matchNode(n, data.target)) : undefined)

      const isStructureWidget = type === 'container' || type === 'grid'
      const targetIsContainer = targetNode?.type === 'container' || targetNode?.type === 'grid'
      const targetHasParentContainer = targetPath.length > 1

      let nodeToInsert = widgetNode

      // Se o usuário arrastou um widget (imagem, título, botão, etc.) fora de um contêiner:
      // Cria automaticamente o contêiner e insere o widget dentro, exatamente como no Elementor Pro
      if (!isStructureWidget && !targetHasParentContainer && (!data.inside || !targetIsContainer)) {
        const autoContainer: CanvasNode = {
          id: crypto.randomUUID(),
          label: 'Contêiner',
          type: 'container',
          content: {},
          children: [ widgetNode ]
        }
        nodeToInsert = autoContainer
      }

      layout.nodes.push(nodeToInsert)
      if (data.target) {
        layout = moveCanvasNode(layout, nodeToInsert.id, data.target, !!data.inside, data.position)
      }
      setSelected(widgetNode.id)
      setPanel('inspector')
      pendingDrop.current = null
    }
    patchKey(key, { tree: layout }, global)
  }

  function getLayouts(): { key: string; global: boolean; layout: CanvasLayout; regionId?: string }[] {
    const results: { key: string; global: boolean; layout: CanvasLayout; regionId?: string }[] = []
    widgets.filter(w => w.regionId).forEach(w => {
      const isGlobal = editScope === 'global' && !!w.globalKey
      const key = isGlobal ? w.globalKey! : `layout:${w.regionId}`
      const layer = isGlobal ? editsRef.current.__global__?.tree || {} : editsRef.current
      const layout: CanvasLayout = layer[key]?.tree || w.layout || { nodes: [] }
      results.push({ key, global: isGlobal, layout, regionId: w.regionId })
    })
    Object.keys(editsRef.current).forEach(k => {
      if (k.startsWith('layout:') && !results.some(r => r.key === k)) {
        results.push({ key: k, global: false, layout: editsRef.current[k]?.tree || { nodes: [] }, regionId: k.replace('layout:', '') })
      }
    })
    return results
  }

  function handleDuplicate(overrideId?: string) {
    const targetId = overrideId || contextMenu?.targetId || selected
    if (!targetId) return
    const layouts = getLayouts()
    for (const item of layouts) {
      const path = findNodePath(item.layout, targetId)
      if (path.length > 0) {
        const res = duplicateCanvasNode(item.layout, targetId)
        if (res) {
          patchKey(item.key, { tree: res.layout }, item.global)
          setSelected(res.newId)
          showNotice('Elemento duplicado com sucesso!')
          return
        }
      }
    }
    // Se o elemento pertence a um layout mas ainda não foi adicionado ao layout explicitamente
    const widgetDesc = widgets.find(w => w.id === targetId || w.globalKey === targetId)
    if (widgetDesc?.regionId) {
      const matchingLayout = layouts.find(l => l.regionId === widgetDesc.regionId || l.key === `layout:${widgetDesc.regionId}`)
      if (matchingLayout) {
        const origNode: CanvasNode = {
          id: targetId,
          source: targetId,
          label: widgetDesc.label || targetId,
          type: widgetDesc.widgetType || 'widget',
          content: widgetDesc.content || {}
        }
        const clonedId = `${targetId}-copy-${crypto.randomUUID().slice(0, 6)}`
        const clonedNode: CanvasNode = {
          ...structuredClone(origNode),
          id: clonedId,
          source: targetId,
          label: `${origNode.label} (Cópia)`
        }
        const nextLayout = structuredClone(matchingLayout.layout)
        nextLayout.nodes.push(origNode, clonedNode)
        patchKey(matchingLayout.key, { tree: nextLayout }, matchingLayout.global)
        const curEdit = editsRef.current[targetId]
        if (curEdit) {
          patchKey(clonedId, structuredClone(curEdit), matchingLayout.global)
        }
        setSelected(clonedId)
        showNotice('Elemento duplicado com sucesso!')
        return
      }
    }
    if (previewTree) {
      const tree = structuredClone(previewTree)
      const widIdx = tree.widgets?.findIndex((w: any) => w.id === targetId)
      if (widIdx >= 0) {
        const orig = tree.widgets[widIdx]
        const newId = crypto.randomUUID()
        const clone = { ...structuredClone(orig), id: newId, order: tree.widgets.length }
        tree.widgets.splice(widIdx + 1, 0, clone)
        change({ ...editsRef.current, __tree__: { tree } })
        setSelected(newId)
        showNotice('Widget duplicado com sucesso!')
        return
      }
      const conIdx = tree.containers?.findIndex((c: any) => c.id === targetId)
      if (conIdx >= 0) {
        const orig = tree.containers[conIdx]
        const newId = crypto.randomUUID()
        const clone = { ...structuredClone(orig), id: newId, order: tree.containers.length }
        tree.containers.splice(conIdx + 1, 0, clone)
        const conWidgets = tree.widgets?.filter((w: any) => w.container_id === orig.id) || []
        conWidgets.forEach((w: any) => {
          tree.widgets.push({ ...structuredClone(w), id: crypto.randomUUID(), container_id: newId })
        })
        change({ ...editsRef.current, __tree__: { tree } })
        setSelected(newId)
        showNotice('Contêiner duplicado com sucesso!')
        return
      }
    }
    const clonedId = `${targetId}-copy-${crypto.randomUUID().slice(0, 6)}`
    const curEdit = editsRef.current[targetId] || {}
    patchKey(clonedId, { ...structuredClone(curEdit), content: { ...curEdit.content, label: `${widgetDesc?.label || targetId} (Cópia)` } }, editScope === 'global')
    setSelected(clonedId)
    showNotice('Elemento duplicado!')
  }

  function handleCopyStyle() {
    if (!selected) return
    const schema = selectedEdit.schema ? structuredClone(selectedEdit.schema) : {}
    const style = (selectedEdit as any).style ? structuredClone((selectedEdit as any).style) : {}
    setCopiedStyles({ schema, style })
    showNotice('Estilo copiado!')
  }

  function handlePasteStyle() {
    if (!selected || !copiedStyles) return
    patch({
      schema: { ...(selectedEdit.schema || {}), ...(copiedStyles.schema || {}) },
      style: { ...((selectedEdit as any).style || {}), ...(copiedStyles.style || {}) }
    })
    showNotice('Estilo aplicado!')
  }

  function handleDeleteSelected() {
    if (!selected) return
    const layouts = getLayouts()
    for (const item of layouts) {
      const path = findNodePath(item.layout, selected)
      if (path.length > 0) {
        const next = removeCanvasNode(item.layout, selected)
        patchKey(item.key, { tree: next }, item.global)
        setSelected('')
        setPanel('elements')
        showNotice('Elemento removido.')
        return
      }
    }
    if (previewTree) {
      const tree = structuredClone(previewTree)
      if (tree.widgets?.some((w: any) => w.id === selected)) {
        tree.widgets = tree.widgets.filter((w: any) => w.id !== selected)
        change({ ...editsRef.current, __tree__: { tree } })
        setSelected('')
        setPanel('elements')
        showNotice('Widget removido.')
        return
      }
      if (tree.containers?.some((c: any) => c.id === selected)) {
        tree.containers = tree.containers.filter((c: any) => c.id !== selected)
        tree.widgets = tree.widgets.filter((w: any) => w.container_id !== selected)
        change({ ...editsRef.current, __tree__: { tree } })
        setSelected('')
        setPanel('elements')
        showNotice('Contêiner removido.')
        return
      }
    }
  }

  function handleCopyContext(overrideId?: string) {
    const targetId = overrideId || contextMenu?.targetId || selected
    if (!targetId) return
    let targetNode: CanvasNode | undefined
    const layouts = getLayouts()
    for (const item of layouts) {
      const findInNodes = (nodes: CanvasNode[]): CanvasNode | undefined => {
        for (const n of nodes) {
          if (n.id === targetId) return n
          if (n.children) {
            const res = findInNodes(n.children)
            if (res) return res
          }
        }
      }
      targetNode = findInNodes(item.layout.nodes)
      if (targetNode) break
    }
    const descriptor = widgets.find(w => w.id === targetId)
    const edit = editsRef.current[targetId] || {}
    const schema = edit.schema || {}
    const style = edit.style || edit.schema?.style || {}
    const clip = {
      id: targetId,
      type: contextMenu?.targetType || targetNode?.type || descriptor?.widgetType || 'widget',
      label: contextMenu?.targetLabel || targetNode?.label || descriptor?.label || targetId,
      node: targetNode ? structuredClone(targetNode) : undefined,
      edit: structuredClone(edit),
      style: structuredClone(style),
      schema: structuredClone(schema),
      content: structuredClone(edit.content || {})
    }
    setClipboard(clip)
    setCopiedStyles({ schema, style })
    try {
      localStorage.setItem('teknix_editor_clipboard', JSON.stringify(clip))
    } catch { /* storage quota */ }
    showNotice(`"${clip.label}" copiado!`)
  }

  function handlePasteContext(overrideId?: string) {
    if (!clipboard) {
      showNotice('Área de transferência vazia.')
      return
    }
    const targetId = overrideId || contextMenu?.targetId || selected
    if (clipboard.node) {
      const cloneNode = (orig: CanvasNode): CanvasNode => ({
        ...structuredClone(orig),
        id: crypto.randomUUID(),
        children: orig.children ? orig.children.map(cloneNode) : undefined
      })
      const clonedNode = cloneNode(clipboard.node)

      const layouts = getLayouts()
      for (const item of layouts) {
        const path = findNodePath(item.layout, targetId)
        if (path.length > 0) {
          let layout = structuredClone(item.layout)
          layout.nodes.push(clonedNode)
          layout = moveCanvasNode(layout, clonedNode.id, targetId, contextMenu?.targetType === 'container', 'after')
          patchKey(item.key, { tree: layout }, item.global)
          if (clipboard.edit) {
            patchKey(clonedNode.id, structuredClone(clipboard.edit), false)
          }
          setSelected(clonedNode.id)
          setPanel('inspector')
          showNotice('Elemento colado com sucesso!')
          return
        }
      }
      if (layouts.length > 0) {
        let layout = structuredClone(layouts[0].layout)
        layout.nodes.push(clonedNode)
        patchKey(layouts[0].key, { tree: layout }, layouts[0].global)
        if (clipboard.edit) {
          patchKey(clonedNode.id, structuredClone(clipboard.edit), false)
        }
        setSelected(clonedNode.id)
        setPanel('inspector')
        showNotice('Elemento colado com sucesso!')
        return
      }
    } else if (clipboard.edit && targetId) {
      patchKey(targetId, {
        content: structuredClone(clipboard.content),
        schema: structuredClone(clipboard.schema),
        style: structuredClone(clipboard.style)
      }, editScope === 'global')
      showNotice('Propriedades coladas com sucesso!')
    }
  }

  function handlePasteStyleContext(overrideId?: string) {
    if (!clipboard && !copiedStyles) {
      showNotice('Nenhum estilo copiado para colar.')
      return
    }
    const targetId = overrideId || contextMenu?.targetId || selected
    if (!targetId) return

    const sourceStyle = clipboard?.style || copiedStyles?.style || clipboard?.edit?.style || {}
    const sourceSchema = clipboard?.schema || copiedStyles?.schema || clipboard?.edit?.schema || {}
    const sourceResponsive = clipboard?.edit?.responsive || clipboard?.edit?.schema?.responsive || {}

    patchKey(targetId, {
      style: { ...sourceStyle },
      schema: { ...sourceSchema, responsive: sourceResponsive }
    }, editScope === 'global')

    showNotice('Efeitos e estilos colados com sucesso!')
  }

  function handleResetStyleContext(overrideId?: string) {
    const targetId = overrideId || contextMenu?.targetId || selected
    if (!targetId) return
    patchKey(targetId, {
      style: {},
      schema: {
        bg_color: undefined,
        text_color: undefined,
        border: undefined,
        border_radius: undefined,
        box_shadow: undefined,
        padding: undefined,
        margin: undefined,
        responsive: undefined
      }
    }, editScope === 'global')
    showNotice('Estilo redefinido para o padrão!')
  }

  function handleSaveAsTemplateContext() {
    const targetId = contextMenu?.targetId || selected
    if (!targetId) return
    const defaultName = contextMenu?.targetLabel || widgets.find(w => w.id === targetId)?.label || 'Meu Bloco'
    const name = window.prompt('Salvar como modelo — Digite o título:', defaultName)
    if (!name) return

    let targetNode: CanvasNode | undefined
    const layouts = getLayouts()
    for (const item of layouts) {
      const findInNodes = (nodes: CanvasNode[]): CanvasNode | undefined => {
        for (const n of nodes) {
          if (n.id === targetId) return n
          if (n.children) {
            const res = findInNodes(n.children)
            if (res) return res
          }
        }
      }
      targetNode = findInNodes(item.layout.nodes)
      if (targetNode) break
    }

    const templateItem = {
      id: `template:${Date.now()}`,
      name,
      type: contextMenu?.targetType || targetNode?.type || 'widget',
      node: targetNode ? structuredClone(targetNode) : undefined,
      style: structuredClone(editsRef.current[targetId]?.style || {}),
      schema: structuredClone(editsRef.current[targetId]?.schema || {}),
      content: structuredClone(editsRef.current[targetId]?.content || {})
    }
    try {
      const list = JSON.parse(localStorage.getItem('teknix_user_templates') || '[]')
      list.push(templateItem)
      localStorage.setItem('teknix_user_templates', JSON.stringify(list))
      showNotice(`Modelo "${name}" salvo com sucesso!`)
    } catch {
      showNotice('Não foi possível salvar o modelo.')
    }
  }

  function applyTemplate(nodes: CanvasNode[], replace: boolean = false) {
    const layouts = getLayouts()
    let targetLayoutItem = layouts.find(l => !l.key.includes('chrome:')) || layouts[0]
    const pageScopeName = target?.scope?.replace(/^page:/, '') || 'page'
    const defaultKey = targetLayoutItem?.key || `layout:${pageScopeName}`
    const global = targetLayoutItem ? targetLayoutItem.global : false
    const key = targetLayoutItem ? targetLayoutItem.key : defaultKey
    const layer = global ? editsRef.current.__global__?.tree || {} : editsRef.current
    let layout: CanvasLayout = structuredClone(targetLayoutItem?.layout || layer[key]?.tree || { nodes: [] })
    if (!layout?.nodes) layout = { nodes: [] }

    // Gerar novos IDs para evitar colisão ao duplicar/inserir
    const refreshIds = (nodeList: CanvasNode[]): CanvasNode[] => {
      return nodeList.map(n => ({
        ...n,
        id: crypto.randomUUID(),
        children: n.children ? refreshIds(n.children) : undefined
      }))
    }

    const preparedNodes = refreshIds(structuredClone(nodes))

    if (replace) {
      layout.nodes = preparedNodes
    } else {
      layout.nodes.push(...preparedNodes)
    }

    patchKey(key, { tree: layout }, global)
    showNotice(replace ? 'Modelo aplicado na página com sucesso!' : 'Modelo adicionado ao final da página com sucesso!')
  }

  function handleImportElementorFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string)
        const converted = convertElementorTemplateToLayout(json)
        if (!converted.nodes || converted.nodes.length === 0) {
          showNotice('Nenhum elemento reconhecido no arquivo Elementor.')
          return
        }
        const replace = window.confirm(`Arquivo "${file.name}" convertido com sucesso!\n\nDeseja SUBSTITUIR o conteúdo atual da página?\n(Clique em "Cancelar" para apenas ADICIONAR ao final da página)`)
        applyTemplate(converted.nodes, replace)
      } catch (err) {
        console.error(err)
        showNotice('Erro ao ler ou converter o arquivo JSON do Elementor.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  function handleDeleteContext(overrideId?: string) {
    const targetId = overrideId || contextMenu?.targetId || selected
    if (!targetId) return
    const layouts = getLayouts()
    for (const item of layouts) {
      const path = findNodePath(item.layout, targetId)
      if (path.length > 0) {
        const nextLayout = removeCanvasNode(item.layout, targetId)
        patchKey(item.key, { tree: nextLayout }, item.global)
        setSelected('')
        setPanel('elements')
        showNotice('Elemento excluído com sucesso!')
        return
      }
    }
    if (previewTree) {
      const tree = structuredClone(previewTree)
      if (tree.widgets?.some((w: any) => w.id === targetId)) {
        tree.widgets = tree.widgets.filter((w: any) => w.id !== targetId)
        change({ ...editsRef.current, __tree__: { tree } })
        setSelected('')
        setPanel('elements')
        showNotice('Widget excluído!')
        return
      }
      if (tree.containers?.some((c: any) => c.id === targetId)) {
        tree.containers = tree.containers.filter((c: any) => c.id !== targetId)
        tree.widgets = tree.widgets.filter((w: any) => w.container_id !== targetId)
        change({ ...editsRef.current, __tree__: { tree } })
        setSelected('')
        setPanel('elements')
        showNotice('Contêiner excluído!')
        return
      }
    }
    patchKey(targetId, { hidden: true }, editScope === 'global')
    setSelected('')
    showNotice('Elemento ocultado!')
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || (activeEl as HTMLElement).isContentEditable)
      if (isInput) return

      const isCmd = e.metaKey || e.ctrlKey

      if (isCmd && e.key.toLowerCase() === 'd' && !e.shiftKey) {
        e.preventDefault()
        handleDuplicate()
      } else if (isCmd && e.key.toLowerCase() === 'c' && !e.shiftKey) {
        if (selected) {
          e.preventDefault()
          handleCopyContext()
        }
      } else if (isCmd && e.key.toLowerCase() === 'v' && !e.shiftKey) {
        if (clipboard) {
          e.preventDefault()
          handlePasteContext()
        }
      } else if (isCmd && e.key.toLowerCase() === 'v' && e.shiftKey) {
        if (clipboard && selected) {
          e.preventDefault()
          handlePasteStyleContext()
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selected && !isInput) {
          e.preventDefault()
          handleDeleteContext()
        }
      } else if (e.key === 'Escape') {
        setContextMenu(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selected, clipboard])

  function addContainer(columns = 1) {
    const colChildren = columns > 1 ? Array.from({ length: columns }).map((_, i) => ({
      id: crypto.randomUUID(),
      label: `Coluna ${i + 1}`,
      type: 'container',
      content: { direction: 'column', flex: 1, gap: '12px', tag: 'div' },
      children: []
    })) : []

    const content = {
      direction: columns > 1 ? 'row' : 'column',
      gap: '16px',
      columns,
      wrap: 'wrap',
      justify: 'flex-start',
      align: 'stretch',
      width_type: 'boxed',
      tag: 'div'
    }

    if (!previewTree) {
      const region = pendingDrop.current || widgets.find(w => w.regionId && !w.globalKey) || widgets.find(w => w.regionId) || { regionId: 'home', initial: { nodes: [] } }
      handleLayout({
        ...region,
        initial: region.initial || region.layout || { nodes: [] },
        action: 'insert',
        widgetType: 'container',
        content,
        children: colChildren
      })
      return
    }

    const tree = structuredClone(previewTree)
    if (!tree.sections.length) tree.sections.push({ id: crypto.randomUUID(), page_id: target!.row.id, type: 'section', order: 0, direction: 'column', layout: 'full' })
    const newContainer = {
      id: crypto.randomUUID(),
      section_id: tree.sections[0].id,
      order: tree.containers.length,
      direction: columns > 1 ? 'row' : 'column',
      width: '100%',
      gap: '16px'
    }
    tree.containers.push(newContainer)
    change({ ...editsRef.current, __tree__: { tree } })
    setSelected(newContainer.id)
    setPanel('inspector')
  }

  function addWidget(type: string) {
    if (type === 'container') {
      addContainer(1)
      return
    }
    if (pendingDrop.current || !previewTree) {
      const region = pendingDrop.current || widgets.find(w => w.regionId && !w.globalKey) || widgets.find(w => w.regionId) || { regionId: 'home', initial: { nodes: [] } }
      handleLayout({ ...region, initial: region.initial || region.layout || { nodes: [] }, action: 'insert', widgetType: type })
      pendingDrop.current = null
      return
    }
    const tree = structuredClone(previewTree)
    if (!tree.sections.length) tree.sections.push({ id: crypto.randomUUID(), page_id: target!.row.id, type: 'section', order: 0, direction: 'column', layout: 'full' })
    if (!tree.containers.length) tree.containers.push({ id: crypto.randomUUID(), section_id: tree.sections[0].id, order: 0, direction: 'column', width: '100%', gap: '16px' })
    const content = initialWidgetContent(type)
    const widget = { id: crypto.randomUUID(), container_id: tree.containers[tree.containers.length - 1].id, type, order: tree.widgets.length, content }
    tree.widgets.push(widget)
    change({ ...editsRef.current, __tree__: { tree } })
    setSelected(widget.id)
    setPanel('inspector')
  }

  function handleWidgetDragStart(e: React.DragEvent, type: string) {
    try {
      e.dataTransfer.setData('text/plain', JSON.stringify({ widgetType: type }))
      e.dataTransfer.setData('application/teknix-widget', JSON.stringify({ widgetType: type }))
    } catch {}
    send('teknix:drag-start', { widgetType: type })
    ;(window as any).__teknixGlobalDrag = type
  }

  function handleWidgetDragEnd() {
    setTimeout(() => {
      send('teknix:drag-end')
      ;(window as any).__teknixGlobalDrag = null
    }, 1500)
  }

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      if (event.key.toLowerCase() === 's') { event.preventDefault(); save() }
      if (event.key.toLowerCase() === 'z' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement)?.tagName)) {
        event.preventDefault()
        setPosition(p => Math.max(0, Math.min(history.length - 1, p + (event.shiftKey ? 1 : -1))))
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [target, edits, saving, history.length])

  async function save(publish = false, scopeOverride?: 'local' | 'global') {
    if (!target || saving) return
    const currentScope = scopeOverride || editScope
    if (scopeOverride && scopeOverride !== editScope) {
      setEditScope(scopeOverride)
    }
    const savingScope = scopeRef.current
    setSaving(true); setError(''); setMessage('')
    try {
      const savingGlobal = currentScope === 'global'
      let savedGlobalRow = globalTarget?.row
      let savedTargetRow = target.row

      // Se for publicar para todo o site, sincroniza widgets globais (cabeçalho, rodapé, logo, etc.) no globalEdits
      const effectiveGlobalEdits: WidgetEdits = { ...globalEdits }
      if (savingGlobal) {
        ['chrome:header', 'chrome:footer', 'chrome:header:logo', 'chrome:header:search', 'chrome:header:cart', 'chrome:header:favorites'].forEach(k => {
          if (localEdits[k]) {
            effectiveGlobalEdits[k] = mergeWidgetEdit(effectiveGlobalEdits[k], localEdits[k])
          }
        })
      }

      // 1. Persistir Padrões Globais se solicitado ou se houver alterações globais
      if (globalTarget && (savingGlobal || globalDirty || Object.keys(effectiveGlobalEdits).length > 0)) {
        savedGlobalRow = await saveEditorTarget(globalTarget, effectiveGlobalEdits, publish)
        setGlobalTarget({ ...globalTarget, row: savedGlobalRow, edits: effectiveGlobalEdits })
      }

      // 2. Persistir Página Atual
      if (target) {
        savedTargetRow = await saveEditorTarget(target, localEdits, publish)
        setTarget({ ...target, row: savedTargetRow, edits: localEdits })
      }

      if (scopeRef.current !== savingScope) return
      if (publish) {
        setMessage(savingGlobal ? 'Padrões salvos e publicados em todo o site oficial com sucesso!' : 'Página publicada no site com sucesso!')
      } else {
        setMessage('Rascunho salvo com sucesso. A versão pública continua preservada.')
      }
    } catch (e: any) {
      if (scopeRef.current === savingScope) setError(e.message || 'Erro ao salvar. Suas alterações continuam no editor.')
    } finally {
      if (scopeRef.current === savingScope) setSaving(false)
    }
  }

  // All Canvas Nodes for Navigator & Widget Resolution
  const allCanvasNodes: CanvasNode[] = useMemo(() => {
    const nodes: CanvasNode[] = []
    const seen = new Set<string>()
    const collect = (items: CanvasNode[] = []) => items.forEach(node => {
      if (!seen.has(node.id)) { seen.add(node.id); nodes.push(node) }
      collect(node.children || [])
    })
    Object.entries(edits).forEach(([k, v]) => {
      if (k.startsWith('layout:') && v?.tree?.nodes) {
        collect(v.tree.nodes)
      }
    })
    widgets.forEach(w => {
      if (w.layout?.nodes) {
        collect(w.layout.nodes)
      }
    })
    return nodes
  }, [edits, widgets])

  const foundWidget = widgets.find(w => w.id === selected)
  const foundCanvasNode = allCanvasNodes.find(n => n.id === selected)
  const widget: WidgetDescriptor | undefined = foundWidget || (foundCanvasNode ? {
    id: foundCanvasNode.id,
    label: (foundCanvasNode.label || foundCanvasNode.type || foundCanvasNode.id) as string,
    widgetType: foundCanvasNode.type,
    content: foundCanvasNode.content || {}
  } : undefined)

  function getWidgetType(w?: WidgetDescriptor): string {
    if (!w) return ''
    if (w.id === 'chrome:header' || w.widgetType === 'header') return 'chrome:header'
    if (w.id === 'chrome:footer' || w.widgetType === 'footer') return 'chrome:footer'
    if (w.widgetType === 'layoutRegion') return 'container'
    if (w.widgetType) return w.widgetType
    if (w.id.endsWith(':search') || w.id.includes('search-btn') || w.id.endsWith('-btn') || w.id.includes('-button')) return 'button'
    if (w.id.includes('icon')) return 'icon'
    if (w.id === 'chrome:header' || w.id === 'chrome:header:main-bar' || w.id.startsWith('chrome:header:row')) return 'chrome:header'
    if (w.id.startsWith('chrome:footer')) return 'chrome:footer'
    if (w.id.startsWith('ads:') || w.id === 'ads') return 'ads'
    if (w.id.endsWith('-img') || w.id.includes('-image')) return 'image'
    if (w.id.endsWith('-title') || w.id.includes('searchresults') || (w.label && w.label.toLowerCase().startsWith('título'))) return 'heading'
    if (w.id.startsWith('card-') || w.id.includes('card')) return 'storefrontCard'
    if (w.id.includes('shelf') || w.id.includes('vitrine')) return 'storefrontShelf'
    if (w.id.includes('flash-sale') || w.id.includes('relampago')) return 'flashSaleSection'
    if (w.id.includes('mosaic') || w.id.includes('mosaico')) return 'categoryMosaic'
    if (w.kind === 'container' || w.id.includes('container') || w.id.startsWith('container-')) return 'container'
    return ((w as any).type as string) || w.kind || ''
  }

  function getWidgetDisplayName(w?: WidgetDescriptor): string {
    if (!w) return 'Elemento'
    const type = getWidgetType(w)
    switch (type) {
      case 'heading': return 'Título'
      case 'text': return 'Editor de texto'
      case 'image': return 'Imagem'
      case 'input': return 'Campo de formulário'
      case 'button': return 'Botão'
      case 'video': return 'Vídeo'
      case 'divider': return 'Divisor'
      case 'spacer': return 'Espaçador'
      case 'googleMaps': return 'Google Maps'
      case 'icon': return 'Ícone'
      case 'flipBox': return 'Flip Box (3D)'
      case 'priceTable': return 'Tabela de Preços'
      case 'priceList': return 'Lista de Preços'
      case 'countdown': return 'Contador Regressivo'
      case 'animatedHeadline': return 'Título Animado'
      case 'cta': return 'Chamada para Ação'
      case 'reviews': return 'Avaliações'
      case 'container': return 'Contêiner'
      case 'grid': return 'Grade'
      case 'storefrontCard': return 'Card de produto'
      case 'storefrontShelf': return 'Vitrine de produtos'
      case 'categoryMosaic': return 'Mosaico de Categorias'
      case 'flashSaleSection': return 'Ofertas Relâmpago (com Cronômetro)'
      case 'ads': return 'Espaço de anúncio'
      case 'chrome:header': return 'Cabeçalho'
      case 'chrome:footer': return 'Rodapé'
      default: return w.label || 'Elemento'
    }
  }

  const widgetType = getWidgetType(widget)
  const isContainer = widgetType === 'container' || widgetType === 'grid'
  const selectedEdit = mergeWidgetEdit(widget?.globalKey ? globalEdits[widget.globalKey] : undefined, edits[selected])
  const imageUrl = String(selectedEdit.content?.src || selectedEdit.content?.image || widget?.content?.src || widget?.content?.image || widget?.content?.url || '')
  const viewportWidth = viewport === 'mobile' ? 390 : viewport === 'tablet' ? 820 : 1440
  const scale = Math.min(1, canvasSize.width / viewportWidth)
  const previewPath = target?.scope.startsWith('page:') ? `/__widget-preview/${target.scope.slice(5)}` : target?.path || '/'
  const src = siteOrigin ? new URL(`${previewPath}${previewPath.includes('?') ? '&' : '?'}widgetPreview=1&editorScope=${encodeURIComponent(target?.scope || '')}`, siteOrigin).href : ''

  // Hierarchical Breadcrumbs Trail
  const breadcrumbPath: { id: string; label: string }[] = useMemo(() => {
    if (!selected) return []
    const items: { id: string; label: string }[] = [{ id: 'page', label: 'Página' }]

    // Search in canvas layouts
    const layouts = getLayouts()
    for (const item of layouts) {
      const path = findNodePath(item.layout, selected)
      if (path.length > 0) {
        path.forEach((n, idx) => {
          if (idx === path.length - 1) {
            items.push({ id: n.id, label: n.label || n.type || 'Widget' })
          } else {
            items.push({ id: n.id, label: n.type === 'container' ? 'Contêiner' : n.label || 'Seção' })
          }
        })
        return items
      }
    }

    if (previewTree) {
      const w = previewTree.widgets?.find((item: any) => item.id === selected)
      if (w) {
        const parentCon = previewTree.containers?.find((c: any) => c.id === w.container_id)
        const parentSec = parentCon ? previewTree.sections?.find((s: any) => s.id === parentCon.section_id) : null
        if (parentSec) items.push({ id: parentSec.id, label: 'Seção' })
        if (parentCon) items.push({ id: parentCon.id, label: 'Contêiner' })
        items.push({ id: w.id, label: w.type || 'Widget' })
        return items
      }
    }

    const w = widgets.find(item => item.id === selected)
    if (w) items.push({ id: w.id, label: w.label || w.id })
    return items
  }, [selected, edits, widgets, previewTree])

  // Helpers para o Inspetor
  const baseSchema = { ...widget?.schema, ...selectedEdit.schema }
  const responsiveSchema = viewport === 'desktop' ? {} : (baseSchema.responsive?.[viewport] || {})
  const s = { ...baseSchema, ...responsiveSchema }
  const defaultContent = initialWidgetContent(widgetType)
  const c = { ...defaultContent, ...widget?.content, ...selectedEdit.content, ...(isContainer ? responsiveSchema : {}) }

  return (
    <EditorDeviceContext.Provider value={{ mode: viewport, select: setViewport }}><div className={`page-editor elementor-style-editor ${previewing ? 'preview-mode' : ''}`}>
      {!previewing && (
        <aside className={`elementor-sidebar ${collapsed ? 'collapsed' : ''}`}>
          <button className="elementor-sidebar-collapse-handle" aria-label={collapsed ? 'Expandir painel' : 'Recolher painel'} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>

          {/* Header da Barra Lateral */}
          <div className="elementor-sidebar-header">
            <div className="elementor-sidebar-header-left">
              <Link className="elementor-hamburger-btn" to="/hub/paginas" aria-label="Voltar ao HUB" title="Voltar ao HUB" onClick={e => { if (dirty && !window.confirm('Sair sem salvar as alterações?')) e.preventDefault() }}>
                <TeknixLogo height={13} />
              </Link>
              <button className={`sidebar-header-btn ${panel === 'elements' ? 'active' : ''}`} title="Adicionar Elementos" onClick={() => setPanel('elements')}>
                <Plus size={16} />
              </button>
              <button className="sidebar-header-btn" title="Estrutura" onClick={() => setNavigator(!navigator)}>
                <Layers size={16} />
              </button>
              <button className="sidebar-header-btn" title="Configurações da página" onClick={() => setPanel('settings')}>
                <Settings size={16} />
              </button>
              <button className="sidebar-header-btn" title="Desfazer" disabled={!position} onClick={() => setPosition(position - 1)}>
                <Undo2 size={16} />
              </button>
            </div>
            <button className="sidebar-header-btn sidebar-collapse-btn" title="Recolher painel" onClick={() => setCollapsed(true)}>
              <ChevronLeft size={16} />
            </button>
          </div>

          <div className="elementor-sidebar-body">
            {/* PAINEL: ELEMENTOS */}
            {panel === 'elements' ? (
              <>
                <div className="elementor-sidebar-title">Elementos</div>
                <div className="elementor-sidebar-search">
                  <Search size={14} className="search-icon" />
                  <input aria-label="Pesquisar widget" placeholder="Pesquisar widget..." value={search} onChange={e => setSearch(e.target.value)} />
                </div>

                {/* Sub-abas oficiais do Elementor: Widgets | Globais | Modelos | Na Página */}
                <div className="elementor-sidebar-tabs">
                  <button
                    type="button"
                    className={`elementor-tab-btn ${elementsSubTab === 'catalog' ? 'active' : ''}`}
                    onClick={() => setElementsSubTab('catalog')}
                    title="Widgets disponíveis"
                  >
                    Widgets
                  </button>
                  <button
                    type="button"
                    className={`elementor-tab-btn ${elementsSubTab === 'globals' ? 'active' : ''}`}
                    onClick={() => setElementsSubTab('globals')}
                    title="Componentes Globais do site"
                  >
                    Globais
                  </button>
                  <button
                    type="button"
                    className={`elementor-tab-btn ${elementsSubTab === 'templates' ? 'active' : ''}`}
                    onClick={() => setElementsSubTab('templates')}
                    title="Modelos prontos"
                  >
                    Modelos
                  </button>
                  <button
                    type="button"
                    className={`elementor-tab-btn ${elementsSubTab === 'page' ? 'active' : ''}`}
                    onClick={() => setElementsSubTab('page')}
                    title={`Elementos na página (${widgets.length})`}
                  >
                    Na Página <span className="elementor-tab-count">({widgets.length})</span>
                  </button>
                </div>

                <div className="elementor-widgets-scroll">
                  {elementsSubTab === 'catalog' ? (
                    <div id="elementor-panel-elements-wrapper">
                      <div id="elementor-panel-elements-categories">
                        <div id="elementor-panel-categories">
                          {/* 1. LAYOUT */}
                          {(!search || 'layout contêiner grade container grid flexbox estrutura'.includes(search.toLowerCase())) && (
                            <div id="elementor-panel-category-layout" className={`elementor-panel-category ${openCats.layout ? 'elementor-active' : ''}`}>
                              <button
                                type="button"
                                className="elementor-panel-heading elementor-panel-category-title"
                                onClick={() => toggleCat('layout')}
                              >
                                <span className="elementor-panel-heading-toggle">
                                  <ChevronRight size={14} style={{ transform: openCats.layout ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                                </span>
                                <span className="elementor-panel-heading-title">Layout</span>
                              </button>
                              {openCats.layout && (
                                <div className="elementor-panel-category-items elementor-responsive-panel">
                                  {ELEMENTOR_LAYOUT_WIDGETS.filter(w => !search || w.label.toLowerCase().includes(search.toLowerCase())).map(w => {
                                    const IconComponent = w.icon
                                    return (
                                      <div key={w.type} className="elementor-element-wrapper">
                                        <button
                                          type="button"
                                          className="elementor-element"
                                          data-library-element-type={w.type}
                                          draggable
                                          onDragStart={e => handleWidgetDragStart(e, w.type)}
                                          onDragEnd={handleWidgetDragEnd}
                                          onClick={() => addWidget(w.type)}
                                        >
                                          <div className="icon"><IconComponent size={22} /></div>
                                          <div className="title-wrapper"><div className="title">{w.label}</div></div>
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 2. BÁSICO */}
                          {(!search || ELEMENTOR_BASIC_WIDGETS.some(w => w.label.toLowerCase().includes(search.toLowerCase()))) && (
                            <div id="elementor-panel-category-basic" className={`elementor-panel-category ${openCats.basic ? 'elementor-active' : ''}`}>
                              <button
                                type="button"
                                className="elementor-panel-heading elementor-panel-category-title"
                                onClick={() => toggleCat('basic')}
                              >
                                <span className="elementor-panel-heading-toggle">
                                  <ChevronRight size={14} style={{ transform: openCats.basic ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                                </span>
                                <span className="elementor-panel-heading-title">Básico</span>
                              </button>
                              {openCats.basic && (
                                <div className="elementor-panel-category-items elementor-responsive-panel">
                                  {ELEMENTOR_BASIC_WIDGETS.filter(w => !search || w.label.toLowerCase().includes(search.toLowerCase())).map(w => {
                                    const IconComponent = w.icon
                                    return (
                                      <div key={w.type} className="elementor-element-wrapper">
                                        <button
                                          type="button"
                                          className="elementor-element"
                                          data-library-element-type={w.type}
                                          draggable
                                          onDragStart={e => handleWidgetDragStart(e, w.type)}
                                          onDragEnd={handleWidgetDragEnd}
                                          onClick={() => addWidget(w.type)}
                                        >
                                          <div className="icon"><IconComponent size={22} /></div>
                                          <div className="title-wrapper"><div className="title">{w.label}</div></div>
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 3. WIDGET PERSONALIZADO */}
                          {(!search || 'personalizado custom widget'.includes(search.toLowerCase())) && (
                            <div id="elementor-panel-category-custom-widgets" className={`elementor-panel-category ${openCats.custom ? 'elementor-active' : ''}`}>
                              <div
                                role="button"
                                tabIndex={0}
                                className="elementor-panel-heading elementor-panel-category-title"
                                onClick={() => toggleCat('custom')}
                                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCat('custom') } }}
                              >
                                <span className="elementor-panel-heading-toggle">
                                  <ChevronRight size={14} style={{ transform: openCats.custom ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                                </span>
                                <span className="elementor-panel-heading-title">Widget personalizado</span>
                                <button type="button" className="elementor-panel-custom-widgets__cta" onClick={e => { e.stopPropagation(); showNotice('Módulo de Widgets Personalizados') }}>
                                  Experimente gratuitamente
                                </button>
                              </div>
                              {openCats.custom && (
                                <div className="elementor-panel-category-items elementor-responsive-panel" style={{ display: 'block' }}>
                                  <div className="elementor-panel-category-custom-widgets-empty">
                                    <p style={{ margin: 0 }}>Crie widgets personalizados, descrevendo o que você precisa.</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* 4. PRO */}
                          {(!search || ELEMENTOR_PRO_WIDGETS.some(w => w.label.toLowerCase().includes(search.toLowerCase()))) && (
                            <div id="elementor-panel-category-pro-elements" className={`elementor-panel-category ${openCats.pro ? 'elementor-active' : ''}`}>
                              <button
                                type="button"
                                className="elementor-panel-heading elementor-panel-category-title"
                                onClick={() => toggleCat('pro')}
                              >
                                <span className="elementor-panel-heading-toggle">
                                  <ChevronRight size={14} style={{ transform: openCats.pro ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                                </span>
                                <span className="elementor-panel-heading-title">Pro</span>
                              </button>
                              {openCats.pro && (
                                <div className="elementor-panel-category-items elementor-responsive-panel">
                                  {ELEMENTOR_PRO_WIDGETS.filter(w => !search || w.label.toLowerCase().includes(search.toLowerCase())).map(w => {
                                    const IconComponent = w.icon
                                    return (
                                      <div key={w.type} className="elementor-element-wrapper">
                                        <button
                                          type="button"
                                          className="elementor-element"
                                          data-library-element-type={w.type}
                                          draggable
                                          onDragStart={e => handleWidgetDragStart(e, w.type)}
                                          onDragEnd={handleWidgetDragEnd}
                                          onClick={() => addWidget(w.type)}
                                        >
                                          <div className="icon"><IconComponent size={22} /></div>
                                          <div className="title-wrapper"><div className="title">{w.label}</div></div>
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 5. GERAL */}
                          {(!search || ELEMENTOR_GENERAL_WIDGETS.some(w => w.label.toLowerCase().includes(search.toLowerCase()))) && (
                            <div id="elementor-panel-category-general" className={`elementor-panel-category ${openCats.general ? 'elementor-active' : ''}`}>
                              <button
                                type="button"
                                className="elementor-panel-heading elementor-panel-category-title"
                                onClick={() => toggleCat('general')}
                              >
                                <span className="elementor-panel-heading-toggle">
                                  <ChevronRight size={14} style={{ transform: openCats.general ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                                </span>
                                <span className="elementor-panel-heading-title">Geral</span>
                              </button>
                              {openCats.general && (
                                <div className="elementor-panel-category-items elementor-responsive-panel">
                                  {ELEMENTOR_GENERAL_WIDGETS.filter(w => !search || w.label.toLowerCase().includes(search.toLowerCase())).map(w => {
                                    const IconComponent = w.icon
                                    return (
                                      <div key={w.type} className="elementor-element-wrapper">
                                        <button
                                          type="button"
                                          className="elementor-element"
                                          data-library-element-type={w.type}
                                          draggable
                                          onDragStart={e => handleWidgetDragStart(e, w.type)}
                                          onDragEnd={handleWidgetDragEnd}
                                          onClick={() => addWidget(w.type)}
                                        >
                                          <div className="icon"><IconComponent size={22} /></div>
                                          <div className="title-wrapper"><div className="title">{w.label}</div></div>
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}

                          {/* 6. LOJA TEKNIX / E-COMMERCE */}
                          {(!search || ELEMENTOR_STORE_WIDGETS.some(w => w.label.toLowerCase().includes(search.toLowerCase()))) && (
                            <div id="elementor-panel-category-store" className={`elementor-panel-category ${openCats.store ? 'elementor-active' : ''}`}>
                              <button
                                type="button"
                                className="elementor-panel-heading elementor-panel-category-title"
                                onClick={() => toggleCat('store')}
                              >
                                <span className="elementor-panel-heading-toggle">
                                  <ChevronRight size={14} style={{ transform: openCats.store ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }} />
                                </span>
                                <span className="elementor-panel-heading-title">Loja TEKNIX / E-commerce</span>
                              </button>
                              {openCats.store && (
                                <div className="elementor-panel-category-items elementor-responsive-panel">
                                  {ELEMENTOR_STORE_WIDGETS.filter(w => !search || w.label.toLowerCase().includes(search.toLowerCase())).map(w => {
                                    const IconComponent = w.icon
                                    return (
                                      <div key={w.type} className="elementor-element-wrapper">
                                        <button
                                          type="button"
                                          className="elementor-element"
                                          data-library-element-type={w.type}
                                          draggable
                                          onDragStart={e => handleWidgetDragStart(e, w.type)}
                                          onDragEnd={handleWidgetDragEnd}
                                          onClick={() => addWidget(w.type)}
                                        >
                                          <div className="icon"><IconComponent size={22} /></div>
                                          <div className="title-wrapper"><div className="title">{w.label}</div></div>
                                        </button>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : elementsSubTab === 'globals' ? (
                    /* ABA GLOBAIS (ELEMENTOS GLOBAIS DO SITE) */
                    <div className="widget-category">
                      <div className="category-header">Componentes Globais do Site</div>
                      <p style={{ fontSize: 11, color: '#64748b', padding: '0 12px 10px', margin: 0, lineHeight: 1.4 }}>
                        Alterações em componentes globais afetam todas as páginas que compartilham o mesmo padrão.
                      </p>
                      <div className="category-widgets" style={{ gridTemplateColumns: '1fr', gap: 6 }}>
                        {[
                          { id: 'chrome:header', label: 'Cabeçalho Oficial da Loja', icon: Layout, desc: 'Logo, menu e sacola global' },
                          { id: 'chrome:footer', label: 'Rodapé Oficial da Loja', icon: FileText, desc: 'Links, suporte e canais' },
                          { id: 'ads:middle_screen', label: 'Espaço de Anúncio Global (ADS)', icon: Megaphone, desc: 'Banner de campanhas ativas' },
                        ].map(item => {
                          const ItemIcon = item.icon
                          return (
                            <button
                              key={item.id}
                              className={`widget-item ${selected === item.id ? 'selected' : ''}`}
                              style={{
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 10,
                                height: 'auto',
                                padding: '10px 12px',
                                width: '100%',
                                background: selected === item.id ? '#eff6ff' : '#ffffff',
                                borderColor: selected === item.id ? '#2563eb' : '#e2e8f0'
                              }}
                              onClick={() => {
                                setEditScope('global')
                                setSelected(item.id)
                                setPanel('inspector')
                              }}
                            >
                              <span className="widget-icon" style={{ color: '#2563eb', flexShrink: 0 }}>
                                <ItemIcon size={18} />
                              </span>
                              <div style={{ textAlign: 'left', flex: 1, overflow: 'hidden' }}>
                                <strong style={{ fontSize: 12, display: 'block', color: '#1e293b' }}>{item.label}</strong>
                                <span style={{ fontSize: 10, color: '#64748b' }}>{item.desc}</span>
                              </div>
                              <span style={{ fontSize: 10, background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>Global</span>
                            </button>
                          )
                        })}

                        <button
                          type="button"
                          className="widget-item"
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 10,
                            height: 'auto',
                            padding: '10px 12px',
                            width: '100%',
                            background: '#ffffff',
                            borderColor: '#e2e8f0'
                          }}
                          onClick={() => {
                            setEditScope('global')
                            setPanel('settings')
                          }}
                        >
                          <span className="widget-icon" style={{ color: '#2563eb', flexShrink: 0 }}>
                            <Palette size={18} />
                          </span>
                          <div style={{ textAlign: 'left', flex: 1 }}>
                            <strong style={{ fontSize: 12, display: 'block', color: '#1e293b' }}>Cores e Fontes do Site</strong>
                            <span style={{ fontSize: 10, color: '#64748b' }}>Design tokens compartilhados</span>
                          </div>
                        </button>
                      </div>
                    </div>
                  ) : elementsSubTab === 'templates' ? (
                    /* ABA MODELOS (BIBLIOTECA ELEMENTOR PRO & IMPORTAÇÃO JSON) */
                    <div className="widget-category" style={{ padding: '0 8px' }}>
                      <div className="category-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span>Biblioteca de Modelos</span>
                        <span style={{ fontSize: 10, background: '#e0e7ff', color: '#3730a3', padding: '2px 6px', borderRadius: 4, fontWeight: 700 }}>Elementor Pro</span>
                      </div>
                      <p style={{ fontSize: 11, color: '#64748b', padding: '0 12px 12px', margin: 0, lineHeight: 1.4 }}>
                        Importe modelos JSON oficiais do Elementor ou insira blocos pré-configurados diretamente no seu layout.
                      </p>

                      {/* Botão Oficial de Importação JSON do Elementor */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={handleImportElementorFile}
                      />
                      <button
                        type="button"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          width: '100%',
                          padding: '11px 14px',
                          background: '#0071e3',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: 8,
                          fontWeight: 600,
                          fontSize: 12,
                          cursor: 'pointer',
                          marginBottom: 16,
                          boxShadow: '0 2px 8px rgba(0,113,227,0.25)'
                        }}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Download size={15} /> Importar Modelo Elementor (.json)
                      </button>

                      {/* Lista de Modelos Prontos do Elementor Pro */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {ELEMENTOR_BUILTIN_TEMPLATES.filter(tpl => !search || tpl.title.toLowerCase().includes(search.toLowerCase()) || tpl.description.toLowerCase().includes(search.toLowerCase())).map(tpl => (
                          <div
                            key={tpl.id}
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: 10,
                              padding: 12,
                              boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: 4 }}>
                                {tpl.badge}
                              </span>
                            </div>
                            <strong style={{ fontSize: 12, color: '#1e293b', display: 'block', marginBottom: 4 }}>{tpl.title}</strong>
                            <p style={{ fontSize: 11, color: '#64748b', margin: '0 0 10px', lineHeight: 1.4 }}>{tpl.description}</p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                              <button
                                type="button"
                                style={{
                                  padding: '6px 8px',
                                  background: '#f1f5f9',
                                  border: '1px solid #cbd5e1',
                                  borderRadius: 6,
                                  fontSize: 11,
                                  fontWeight: 600,
                                  color: '#334155',
                                  cursor: 'pointer'
                                }}
                                onClick={() => applyTemplate(tpl.layout.nodes, false)}
                              >
                                + Adicionar
                              </button>
                              <button
                                type="button"
                                style={{
                                  padding: '6px 8px',
                                  background: '#ffffff',
                                  border: '1px solid #e2e8f0',
                                  borderRadius: 6,
                                  fontSize: 11,
                                  color: '#64748b',
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  if (window.confirm(`Deseja substituir todo o conteúdo da página pelo modelo "${tpl.title}"?`)) {
                                    applyTemplate(tpl.layout.nodes, true)
                                  }
                                }}
                                title="Substituir conteúdo da página inteira"
                              >
                                Substituir
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Modelos Salvos pelo Usuário */}
                        {(() => {
                          const userTemplates: any[] = JSON.parse(localStorage.getItem('teknix_user_templates') || '[]')
                          if (userTemplates.length === 0) return null
                          return (
                            <div style={{ marginTop: 12 }}>
                              <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 8, padding: '0 4px' }}>
                                Meus Modelos Salvos ({userTemplates.length})
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                {userTemplates.map((ut: any) => (
                                  <div
                                    key={ut.id}
                                    style={{
                                      background: '#ffffff',
                                      border: '1px solid #e2e8f0',
                                      borderRadius: 8,
                                      padding: 10
                                    }}
                                  >
                                    <strong style={{ fontSize: 12, color: '#1e293b', display: 'block', marginBottom: 6 }}>{ut.name}</strong>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                      <button
                                        type="button"
                                        style={{
                                          flex: 1,
                                          padding: '5px 8px',
                                          background: '#eff6ff',
                                          border: '1px solid #bfdbfe',
                                          borderRadius: 4,
                                          fontSize: 10,
                                          fontWeight: 600,
                                          color: '#1d4ed8',
                                          cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                          if (ut.node) applyTemplate([ut.node], false)
                                        }}
                                      >
                                        Inserir Bloco
                                      </button>
                                      <button
                                        type="button"
                                        style={{
                                          padding: '5px 8px',
                                          background: '#fff',
                                          border: '1px solid #fecaca',
                                          borderRadius: 4,
                                          fontSize: 10,
                                          color: '#dc2626',
                                          cursor: 'pointer'
                                        }}
                                        onClick={() => {
                                          const filtered = userTemplates.filter((item: any) => item.id !== ut.id)
                                          localStorage.setItem('teknix_user_templates', JSON.stringify(filtered))
                                          showNotice('Modelo excluído.')
                                        }}
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  ) : (
                    /* NAVEGADOR: WIDGETS PRESENTES NA PÁGINA */
                    <div className="widget-category">
                      <div className="category-widgets" style={{ gridTemplateColumns: '1fr', gap: 6 }}>
                        {widgets
                          .filter(w => !search || w.label.toLowerCase().includes(search.toLowerCase()))
                          .filter((w, idx, arr) => arr.findIndex(item => item.id === w.id) === idx)
                          .map(w => {
                            const isHidden = !!(edits[w.id]?.hidden || (w.globalKey && globalEdits[w.globalKey]?.hidden))
                            return (
                              <button
                                key={w.id}
                                className={`widget-item ${selected === w.id ? 'selected' : ''}`}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  height: 'auto',
                                  padding: '8px 12px',
                                  width: '100%',
                                  opacity: isHidden ? 0.6 : 1,
                                  background: selected === w.id ? '#eff6ff' : '#ffffff',
                                  borderColor: selected === w.id ? '#2563eb' : '#e2e8f0'
                                }}
                                onClick={() => {
                                  setSelected(w.id)
                                  setPanel('inspector')
                                  send('teknix:focus', { id: w.id })
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                  <span className="widget-icon" style={{ flexShrink: 0 }}>
                                    {w.id.startsWith('chrome:header') ? <Layout size={16} /> :
                                     w.id.startsWith('chrome:footer') ? <FileText size={16} /> :
                                     w.id.startsWith('ads:') || w.widgetType === 'ads' ? <Megaphone size={16} /> :
                                     w.widgetType === 'storefrontShelf' || w.id.includes('shelf') ? <Grid size={16} /> :
                                     w.widgetType === 'storefrontCard' || w.id.startsWith('card-') ? <ShoppingBag size={16} /> :
                                     w.widgetType === 'container' || w.kind === 'container' ? <Box size={16} /> :
                                     w.content?.src ? <ImageIcon size={16} /> : <Type size={16} />}
                                  </span>
                                  <span className="widget-label" style={{ textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {w.label}
                                  </span>
                                </div>
                                {isHidden && <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>Oculto</span>}
                              </button>
                            )
                          })}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : panel === 'settings' ? (() => {
              const row = target?.row || {}
              const treePage = previewTree?.page || {}
              const localSettings = edits['page:settings']?.content || {}

              const rawTitle = localSettings.title !== undefined ? localSettings.title : (treePage.title || row.title || target?.title || (target?.scope === 'native:/' ? 'Página inicial' : 'Página'))
              const rawSlug = localSettings.slug !== undefined ? localSettings.slug : (treePage.slug || row.slug || target?.path || '/')
              const rawStatus = (localSettings.status || treePage.status || row.status || 'published') as 'published' | 'draft'
              const rawSeoTitle = localSettings.seo_title !== undefined ? localSettings.seo_title : (treePage.seo_title || row.seo_title || `${rawTitle} — TEKNIX`)
              const rawSeoDesc = localSettings.seo_description !== undefined ? localSettings.seo_description : (treePage.seo_description || row.seo_description || 'Página oficial TEKNIX com ferramentas profissionais, catálogo completo e garantia oficial de fábrica.')
              const rawSeoImage = localSettings.seo_image !== undefined ? localSettings.seo_image : (treePage.seo_image || row.seo_image || '')
              const rawHideHeader = localSettings.hide_header !== undefined ? !!localSettings.hide_header : (treePage.hide_header !== undefined ? !!treePage.hide_header : !!edits['chrome:header']?.hidden)
              const rawHideFooter = localSettings.hide_footer !== undefined ? !!localSettings.hide_footer : (treePage.hide_footer !== undefined ? !!treePage.hide_footer : !!edits['chrome:footer']?.hidden)
              const rawLayout = localSettings.page_layout || treePage.page_layout || (rawHideHeader && rawHideFooter ? 'elementor_canvas' : 'default')
              const rawBg = localSettings.page_bg || treePage.page_bg || edits['page:settings']?.style?.background || '#ffffff'
              const rawType = treePage.type || row.type || (target?.scope === 'native:/' ? 'home' : 'custom')

              const pageInfo = {
                title: String(rawTitle),
                slug: String(rawSlug),
                status: rawStatus,
                seo_title: String(rawSeoTitle),
                seo_description: String(rawSeoDesc),
                seo_image: String(rawSeoImage),
                page_layout: String(rawLayout),
                page_bg: String(rawBg),
                hide_header: rawHideHeader,
                hide_footer: rawHideFooter,
                type: String(rawType)
              }

              const updatePageField = (field: string, value: any) => {
                const currentSettings = edits['page:settings']?.content || {}
                const updatedSettings = { ...currentSettings, [field]: value }

                let nextEdits: WidgetEdits = {
                  ...edits,
                  'page:settings': {
                    ...edits['page:settings'],
                    content: updatedSettings,
                    style: field === 'page_bg' ? { background: value } : (edits['page:settings']?.style || {})
                  }
                }

                if (field === 'hide_header') {
                  nextEdits['chrome:header'] = { ...nextEdits['chrome:header'], hidden: !!value }
                }
                if (field === 'hide_footer') {
                  nextEdits['chrome:footer'] = { ...nextEdits['chrome:footer'], hidden: !!value }
                }
                if (field === 'page_layout') {
                  const isCanvas = value === 'elementor_canvas'
                  nextEdits['chrome:header'] = { ...nextEdits['chrome:header'], hidden: isCanvas }
                  nextEdits['chrome:footer'] = { ...nextEdits['chrome:footer'], hidden: isCanvas }
                  updatedSettings.hide_header = isCanvas
                  updatedSettings.hide_footer = isCanvas
                }

                if (previewTree) {
                  nextEdits.__tree__ = {
                    tree: {
                      ...previewTree,
                      page: {
                        ...previewTree.page,
                        [field]: value,
                        ...(field === 'page_layout' && value === 'elementor_canvas' ? { hide_header: true, hide_footer: true } : {})
                      }
                    }
                  }
                }

                if (field === 'title' && target) {
                  target.title = value
                }

                change(nextEdits)

                if (field === 'page_bg') {
                  send('teknix:page-bg', { bg: value })
                  try {
                    if (frame.current?.contentWindow?.document?.body) {
                      frame.current.contentWindow.document.body.style.backgroundColor = value
                    }
                  } catch (e) {}
                }
                if (field === 'hide_header' || field === 'hide_footer' || field === 'page_layout') {
                  send('teknix:patches', { edits: nextEdits })
                }
              }

              const publicUrl = `http://localhost:5173${pageInfo.slug === '/' ? '' : pageInfo.slug.startsWith('/') ? pageInfo.slug : `/${pageInfo.slug}`}`
              const isHomePage = target?.scope === 'native:/' || pageInfo.slug === '/'

              return (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
                  {/* Cabeçalho do Painel */}
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #e5e5ea', background: '#ffffff' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f' }}>Configurações da Página</div>
                    <div style={{ fontSize: 11, color: '#86868b', marginTop: 2 }}>
                      Edite as propriedades, layout e SEO desta página com visualização em tempo real.
                    </div>
                  </div>

                  {/* Card de Identificação da Página Ativa */}
                  <div style={{ padding: '12px 14px', background: '#f8faff', borderBottom: '1px solid #e8f0fe', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: 9.5,
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: '#0071e3',
                        color: '#ffffff',
                        letterSpacing: '0.4px',
                        textTransform: 'uppercase'
                      }}>
                        {isHomePage ? 'Página Inicial (Home)' : pageInfo.type === 'custom' ? 'Página Customizada' : 'Página do Sistema'}
                      </span>
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '2px 7px',
                        borderRadius: 99,
                        background: pageInfo.status === 'published' ? '#e6f7ed' : '#fef3c7',
                        color: pageInfo.status === 'published' ? '#15803d' : '#b45309',
                        fontSize: 10,
                        fontWeight: 700
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: pageInfo.status === 'published' ? '#22c55e' : '#f59e0b' }} />
                        {pageInfo.status === 'published' ? 'Publicada' : 'Rascunho'}
                      </span>
                    </div>

                    <div style={{ fontSize: 13, fontWeight: 700, color: '#1d1d1f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pageInfo.title}
                    </div>

                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        color: '#0071e3',
                        textDecoration: 'none',
                        fontWeight: 500,
                        wordBreak: 'break-all'
                      }}
                    >
                      <ExternalLink size={12} /> {publicUrl}
                    </a>
                  </div>

                  <div className="elementor-widgets-scroll" style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* 1. SEÇÃO GERAL & IDENTIFICAÇÃO */}
                    <ElementorAccordion title="Informações Gerais" icon={FileText} isOpen={openSections.page_general !== false} onToggle={() => toggleSection('page_general')}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <ControlRow label="Nome / Título da Página" description="Nome que identifica a página no editor e nos relatórios da loja.">
                          <input
                            type="text"
                            placeholder="Ex: Página Inicial, Parafusadeiras..."
                            value={pageInfo.title}
                            onChange={e => updatePageField('title', e.target.value)}
                          />
                        </ControlRow>

                        <ControlRow label="Endereço da Página (Slug / URL)" description={isHomePage ? 'A página inicial responde pela raiz do site ( / ).' : 'Caminho acessível na barra de endereços.'}>
                          <input
                            type="text"
                            placeholder="/pagina"
                            value={pageInfo.slug}
                            disabled={isHomePage}
                            onChange={e => updatePageField('slug', e.target.value)}
                            style={{ opacity: isHomePage ? 0.7 : 1, cursor: isHomePage ? 'not-allowed' : 'text' }}
                          />
                        </ControlRow>

                        <ControlRow label="Status da Página" description="Páginas em rascunho ficam ocultas para visitantes públicos.">
                          <select
                            value={pageInfo.status}
                            onChange={e => updatePageField('status', e.target.value)}
                          >
                            <option value="published">Publicado (Disponível no site)</option>
                            <option value="draft">Rascunho (Apenas no editor)</option>
                          </select>
                        </ControlRow>
                      </div>
                    </ElementorAccordion>

                    {/* 2. SEÇÃO LAYOUT & APARÊNCIA */}
                    <ElementorAccordion title="Layout & Visual da Página" icon={Layout} isOpen={openSections.page_layout !== false} onToggle={() => toggleSection('page_layout')}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <ControlRow label="Modelo da Página (Layout)" description="Elementor Canvas oculta cabeçalho e rodapé padrão — ideal para landing pages.">
                          <select
                            value={pageInfo.page_layout}
                            onChange={e => updatePageField('page_layout', e.target.value)}
                          >
                            <option value="default">Padrão do Tema (Com Cabeçalho e Rodapé Oficiais)</option>
                            <option value="elementor_canvas">Elementor Canvas (Sem Cabeçalho e Rodapé — Landing Page)</option>
                            <option value="full_width">Elementor Largura Total</option>
                          </select>
                        </ControlRow>

                        <ControlRow label="Cor de Fundo da Página" description="Atualiza instantaneamente o fundo da página no preview.">
                          <input
                            type="color"
                            value={pageInfo.page_bg}
                            onChange={e => updatePageField('page_bg', e.target.value)}
                          />
                        </ControlRow>

                        {/* Toggles de Cabeçalho e Rodapé com Efeito Imediato */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            background: '#ffffff',
                            border: '1px solid #e5e5ea',
                            borderRadius: 8,
                            cursor: 'pointer'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#1d1d1f' }}>Ocultar cabeçalho nesta página</span>
                              <span style={{ fontSize: 10, color: '#86868b' }}>Aplica na hora sem recarregar</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={pageInfo.hide_header}
                              onChange={e => updatePageField('hide_header', e.target.checked)}
                              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#0071e3' }}
                            />
                          </label>

                          <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            background: '#ffffff',
                            border: '1px solid #e5e5ea',
                            borderRadius: 8,
                            cursor: 'pointer'
                          }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#1d1d1f' }}>Ocultar rodapé nesta página</span>
                              <span style={{ fontSize: 10, color: '#86868b' }}>Aplica na hora sem recarregar</span>
                            </div>
                            <input
                              type="checkbox"
                              checked={pageInfo.hide_footer}
                              onChange={e => updatePageField('hide_footer', e.target.checked)}
                              style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#0071e3' }}
                            />
                          </label>
                        </div>
                      </div>
                    </ElementorAccordion>

                    {/* 3. SEÇÃO SEO & REDES SOCIAIS */}
                    <ElementorAccordion title="SEO & Redes Sociais" icon={Globe} isOpen={openSections.page_seo !== false} onToggle={() => toggleSection('page_seo')}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <ControlRow label="Título para Busca (SEO Title)">
                            <input
                              type="text"
                              placeholder="Ex: Ferramentas Elétricas e Manuais | TEKNIX"
                              value={pageInfo.seo_title}
                              onChange={e => updatePageField('seo_title', e.target.value)}
                            />
                          </ControlRow>
                          <div style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: pageInfo.seo_title.length > 60 ? '#f59e0b' : '#86868b',
                            textAlign: 'right',
                            marginTop: 2
                          }}>
                            {pageInfo.seo_title.length} / 60 caracteres ideais
                          </div>
                        </div>

                        <div>
                          <ControlRow label="Descrição para Busca (Meta Description)">
                            <textarea
                              rows={3}
                              placeholder="Descrição resumida que aparecerá nos resultados de busca do Google e redes sociais..."
                              value={pageInfo.seo_description}
                              onChange={e => updatePageField('seo_description', e.target.value)}
                              style={{ width: '100%', padding: '7px 10px', fontSize: 12, borderRadius: 6, border: '1px solid #d2d2d7', resize: 'vertical' }}
                            />
                          </ControlRow>
                          <div style={{
                            fontSize: 10,
                            fontWeight: 600,
                            color: pageInfo.seo_description.length > 160 ? '#f59e0b' : '#86868b',
                            textAlign: 'right',
                            marginTop: 2
                          }}>
                            {pageInfo.seo_description.length} / 160 caracteres ideais
                          </div>
                        </div>

                        <ControlRow label="Imagem de Compartilhamento (OG / Redes Sociais)">
                          <ImageMediaControl
                            value={pageInfo.seo_image}
                            onChange={url => updatePageField('seo_image', url)}
                          />
                        </ControlRow>

                        {/* Prévia Realista do Google Search */}
                        <div style={{
                          background: '#ffffff',
                          border: '1px solid #e2e8f0',
                          borderRadius: 8,
                          padding: '12px',
                          marginTop: 4,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                        }}>
                          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#86868b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.4px' }}>
                            Prévia no Google Search
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#0071e3', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', fontSize: 9, fontWeight: 900 }}>
                              T
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                              <span style={{ fontSize: 11, color: '#202124', fontWeight: 600, lineHeight: 1.2 }}>TEKNIX Brasil</span>
                              <span style={{ fontSize: 10, color: '#5f6368', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                                {publicUrl}
                              </span>
                            </div>
                          </div>
                          <div style={{ fontSize: 13, color: '#1a0dab', fontWeight: 600, lineHeight: 1.3, marginBottom: 4 }}>
                            {pageInfo.seo_title || `${pageInfo.title} — TEKNIX`}
                          </div>
                          <div style={{ fontSize: 11.5, color: '#4d5156', lineHeight: 1.4 }}>
                            {pageInfo.seo_description || 'Página oficial TEKNIX com catálogo completo de ferramentas industriais e garantia oficial.'}
                          </div>
                        </div>
                      </div>
                    </ElementorAccordion>

                    {/* 4. SEÇÃO PADRÃO GLOBAL DO TEMA */}
                    <ElementorAccordion title="Padrões Globais do Site" icon={Palette} isOpen={openSections.page_global === true} onToggle={() => toggleSection('page_global')}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <ControlRow label="Escopo de Salvamento" description="Escolha se as alterações de cores afetam somente esta página ou todo o site.">
                          <select value={editScope} onChange={e => setEditScope(e.target.value as any)}>
                            <option value="local">Esta página / produto</option>
                            <option value="global">Padrão do site</option>
                          </select>
                        </ControlRow>

                        <div style={{ fontSize: 11, fontWeight: 700, color: '#1d1d1f', margin: '4px 0 2px' }}>
                          Cores e Tipografia Global do Tema
                        </div>

                        {[
                          ['accent', 'Cor principal'],
                          ['accentHover', 'Cor ao passar o mouse'],
                          ['favorite', 'Coração selecionado'],
                          ['buttonText', 'Texto dos botões'],
                          ['background', 'Fundo do site'],
                          ['text', 'Texto do site'],
                          ['font', 'Família da fonte']
                        ].map(([key, label]) => (
                          <ControlRow key={key} label={label}>
                            <input
                              type={key.toLowerCase().includes('font') ? 'text' : 'color'}
                              value={String(globalEdits['site:tokens']?.content?.[key] || (key === 'font' ? '' : '#0071e3'))}
                              placeholder={key === 'font' ? 'SF Pro, Arial, sans-serif' : undefined}
                              onChange={e => {
                                setEditScope('global')
                                patchKey('site:tokens', { content: { [key]: e.target.value } }, true)
                              }}
                            />
                          </ControlRow>
                        ))}
                      </div>
                    </ElementorAccordion>
                  </div>
                </div>
              )
            })() : (
              /* PAINEL: INSPETOR COMPLETO DO ELEMENTOR (CONTEÚDO | ESTILO | AVANÇADO) */
              widget && (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Topo do Inspetor */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                    <button
                      type="button"
                      style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: '#64748b', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => setPanel('elements')}
                    >
                      <ChevronLeft size={16} /> Elementos
                    </button>
                    <strong style={{ fontSize: 13, color: '#1e293b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 180 }}>
                      Editar {getWidgetDisplayName(widget)}
                    </strong>
                  </div>

                  {/* Hierarchical Breadcrumb Navigation */}
                  <div className="elementor-inspector-breadcrumbs">
                    {breadcrumbPath.map((item, index) => (
                      <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {index > 0 && <ChevronRight size={11} className="breadcrumb-separator" />}
                        <button
                          type="button"
                          className={`breadcrumb-item ${item.id === selected ? 'current' : ''}`}
                          onClick={() => {
                            if (item.id === 'page') {
                              setPanel('settings')
                            } else {
                              setSelected(item.id)
                              setPanel('inspector')
                              send('teknix:focus', { id: item.id })
                            }
                          }}
                          title={`Ir para ${item.label}`}
                        >
                          {item.label}
                        </button>
                      </div>
                    ))}
                  </div>

                  {actionNotice && <div className="elementor-action-notice">{actionNotice}</div>}

                  {/* 3 Abas Oficiais do Elementor (Screenshot 2) */}
                  <div className="elementor-panel-navigation">
                    <button
                      type="button"
                      className={`elementor-component-tab elementor-panel-navigation-tab elementor-tab-control-content ${inspectorTab === 'content' ? 'elementor-active' : ''}`}
                      onClick={() => setInspectorTab('content')}
                      data-tab="content"
                    >
                      <Edit3 size={15} />
                      <span>{isContainer ? 'Layout' : 'Conteúdo'}</span>
                    </button>
                    <button
                      type="button"
                      className={`elementor-component-tab elementor-panel-navigation-tab elementor-tab-control-style ${inspectorTab === 'style' ? 'elementor-active' : ''}`}
                      onClick={() => setInspectorTab('style')}
                      data-tab="style"
                    >
                      <Contrast size={15} />
                      <span>Estilo</span>
                    </button>
                    <button
                      type="button"
                      className={`elementor-component-tab elementor-panel-navigation-tab elementor-tab-control-advanced ${inspectorTab === 'advanced' ? 'elementor-active' : ''}`}
                      onClick={() => setInspectorTab('advanced')}
                      data-tab="advanced"
                    >
                      <Settings size={15} />
                      <span>Avançado</span>
                    </button>
                  </div>

                  {/* Corpo do Inspetor */}
                  <div className="elementor-widgets-scroll" style={{ flex: 1, overflowY: 'auto' }}>
                    {/* ==================================================== */}
                    {/* 1. ABA CONTEÚDO */}
                    {/* ==================================================== */}
                    {/* ==================================================== */}
                    {/* 1. ABA CONTEÚDO (ou LAYOUT para Contêiner) */}
                    {/* ==================================================== */}
                    {inspectorTab === 'content' && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* WIDGET: TÍTULO */}
                        {widgetType === 'heading' && (
                          <ElementorAccordion title="Título" icon={Heading} isOpen={openSections.c_heading !== false} onToggle={() => toggleSection('c_heading')}>
                            <ControlRow label="Título">
                              <textarea
                                rows={2}
                                placeholder="Digite seu título aqui"
                                value={String(c.text || '')}
                                onChange={e => patch({ content: { text: e.target.value } })}
                              />
                            </ControlRow>
                            <ControlRow label="Link">
                              <input
                                type="text"
                                placeholder="https://..."
                                value={String(c.link || '')}
                                onChange={e => patch({ content: { link: e.target.value } })}
                              />
                            </ControlRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Tamanho HTML">
                                <select value={String(s.title_size_tag || 'default')} onChange={e => patch({ schema: { title_size_tag: e.target.value } })}>
                                  <option value="default">Padrão</option>
                                  <option value="small">Pequeno</option>
                                  <option value="medium">Médio</option>
                                  <option value="large">Grande</option>
                                  <option value="xl">GG</option>
                                  <option value="xxl">2XG</option>
                                </select>
                              </ControlRow>
                              <ControlRow label="Tag HTML">
                                <select value={String(c.tag || s.tag || 'h2')} onChange={e => patch({ content: { tag: e.target.value }, schema: { tag: e.target.value } })}>
                                  <option value="h1">H1</option>
                                  <option value="h2">H2</option>
                                  <option value="h3">H3</option>
                                  <option value="h4">H4</option>
                                  <option value="h5">H5</option>
                                  <option value="h6">H6</option>
                                  <option value="div">div</option>
                                  <option value="span">span</option>
                                  <option value="p">p</option>
                                </select>
                              </ControlRow>
                            </div>
                            <ControlRow label="Alinhamento">
                              <AlignmentButtonGroup
                                value={String(s.title_align || c.align || 'left')}
                                onChange={val => patch({ schema: { title_align: val, text_align: val }, content: { align: val } })}
                                allowJustify
                              />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET: IMAGEM */}
                        {widgetType === 'image' && (
                          <ElementorAccordion title="Imagem" icon={ImageIcon} isOpen={openSections.c_image !== false} onToggle={() => toggleSection('c_image')}>
                            <div className="elementor-control-media-wrapper" style={{ marginBottom: 12 }}>
                              <div
                                onClick={() => setEditingImage(true)}
                                style={{
                                  position: 'relative',
                                  width: '100%',
                                  minHeight: 110,
                                  background: '#f5f5f7',
                                  border: '1.5px dashed #d2d2d7',
                                  borderRadius: 8,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  overflow: 'hidden',
                                  marginBottom: 8,
                                  transition: 'all 0.2s ease',
                                }}
                                title="Clique para escolher uma imagem da biblioteca"
                              >
                                {c.image || c.src || c.url ? (
                                  <>
                                    <img
                                      src={String(c.image || c.src || c.url)}
                                      alt={String(c.alt || 'Imagem')}
                                      style={{ width: '100%', maxHeight: 130, objectFit: 'contain', display: 'block', padding: 4 }}
                                    />
                                    <div
                                      style={{
                                        position: 'absolute',
                                        inset: 0,
                                        background: 'rgba(0,0,0,0.45)',
                                        opacity: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: 6,
                                        transition: 'opacity 0.2s',
                                        color: '#fff',
                                        fontSize: 12,
                                        fontWeight: 600
                                      }}
                                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                      onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                                    >
                                      <ImageIcon size={16} /> Alterar imagem
                                    </div>
                                  </>
                                ) : (
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: '#86868b', padding: '20px 10px' }}>
                                    <ImageIcon size={30} strokeWidth={1.5} />
                                    <span style={{ fontSize: 11, fontWeight: 500 }}>Escolher imagem</span>
                                  </div>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingImage(true)}
                                  style={{
                                    flex: 1,
                                    padding: '7px 10px',
                                    background: '#f5f5f7',
                                    border: '1px solid #d2d2d7',
                                    borderRadius: 6,
                                    color: '#1d1d1f',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                  }}
                                >
                                  <ImageIcon size={13} /> Biblioteca de Mídia
                                </button>
                                {(c.image || c.src || c.url) && (
                                  <button
                                    type="button"
                                    onClick={() => patch({ content: { image: '', src: '', url: '' } })}
                                    style={{
                                      padding: '7px 10px',
                                      background: '#fff1f0',
                                      border: '1px solid #ffd7d5',
                                      borderRadius: 6,
                                      color: '#ff3b30',
                                      fontSize: 11,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    title="Excluir imagem"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <ControlRow label="Imagem">
                              <ImageMediaControl value={String(c.image || c.src || c.url || '')}
                                onChange={value => patch({ content: { image: value, src: value, url: value } })}
                              />
                            </ControlRow>
                            <ControlRow label="Texto Alternativo (Alt)">
                              <input
                                type="text"
                                placeholder="Descrição da imagem"
                                value={String(c.alt || '')}
                                onChange={e => patch({ content: { alt: e.target.value } })}
                              />
                            </ControlRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Resolução da Imagem">
                                <select value={String(s.image_size || 'full')} onChange={e => patch({ schema: { image_size: e.target.value } })}>
                                  <option value="thumbnail">Miniatura (150x150)</option>
                                  <option value="medium">Médio (300x300)</option>
                                  <option value="large">Grande (1024x1024)</option>
                                  <option value="full">Completo</option>
                                </select>
                              </ControlRow>
                              <ControlRow label="Alinhamento">
                                <AlignmentButtonGroup
                                  value={String(s.img_align || c.align || 'left')}
                                  onChange={val => patch({ schema: { img_align: val, text_align: val }, content: { align: val } })}
                                />
                              </ControlRow>
                            </div>
                            <ControlRow label="Link">
                              <input
                                type="text"
                                placeholder="https://..."
                                value={String(c.link || '')}
                                onChange={e => patch({ content: { link: e.target.value } })}
                              />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET: EDITOR DE TEXTO */}
                        {widgetType === 'text' && (
                          <ElementorAccordion title="Editor de texto" icon={FileText} isOpen={openSections.c_text !== false} onToggle={() => toggleSection('c_text')}>
                            <ControlRow label="Conteúdo de Texto">
                              <textarea
                                rows={6}
                                placeholder="Digite seu parágrafo ou texto formatado"
                                value={String(c.text || '')}
                                onChange={e => patch({ content: { text: e.target.value } })}
                              />
                            </ControlRow>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={!!s.drop_cap}
                                onChange={e => patch({ schema: { drop_cap: e.target.checked } })}
                              />
                              Letra Capitular (Drop Cap)
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Colunas">
                                <select value={String(s.columns || '1')} onChange={e => patch({ schema: { columns: e.target.value } })}>
                                  <option value="1">1 Coluna (Padrão)</option>
                                  <option value="2">2 Colunas</option>
                                  <option value="3">3 Colunas</option>
                                  <option value="4">4 Colunas</option>
                                </select>
                              </ControlRow>
                              <ControlRow label="Espaçamento Colunas">
                                <input
                                  type="text"
                                  placeholder="16px"
                                  value={String(s.columns_gap || '')}
                                  onChange={e => patch({ schema: { columns_gap: e.target.value } })}
                                />
                              </ControlRow>
                            </div>
                          </ElementorAccordion>
                        )}

                        {widgetType === 'input' && (
                          <ElementorAccordion title="Campo de formulário" icon={Edit3} isOpen={openSections.c_input !== false} onToggle={() => toggleSection('c_input')}>
                            <ControlRow label="Texto de exemplo (placeholder)">
                              <input
                                type="text"
                                placeholder="Digite o texto exibido no campo"
                                value={String(c.placeholder || '')}
                                onChange={e => patch({ content: { placeholder: e.target.value } })}
                              />
                            </ControlRow>
                            {String(c.input_type || '') !== 'textarea' && (
                              <ControlRow label="Tipo do campo">
                                <select value={String(c.input_type || 'text')} onChange={e => patch({ content: { input_type: e.target.value } })}>
                                  <option value="text">Texto</option>
                                  <option value="email">E-mail</option>
                                  <option value="tel">Telefone</option>
                                  <option value="number">Número</option>
                                  <option value="url">URL</option>
                                  <option value="search">Busca</option>
                                  <option value="password">Senha</option>
                                  <option value="radio">Opção única</option>
                                  <option value="checkbox">Caixa de seleção</option>
                                  <option value="range">Controle deslizante</option>
                                </select>
                              </ControlRow>
                            )}
                          </ElementorAccordion>
                        )}

                        {/* WIDGET: ÍCONE */}
                        {widgetType === 'icon' && (
                          <ElementorAccordion title="Ícone" icon={Star} isOpen={openSections.c_icon !== false} onToggle={() => toggleSection('c_icon')}>
                            <div style={{ marginBottom: 12 }}>
                              <div
                                onClick={() => setEditingIcon(true)}
                                style={{
                                  width: '100%',
                                  minHeight: 80,
                                  background: '#f5f5f7',
                                  border: '1.5px dashed #d2d2d7',
                                  borderRadius: 8,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  gap: 6,
                                  padding: 12,
                                  transition: 'all 0.2s ease',
                                }}
                                title="Clique para abrir a biblioteca de ícones"
                              >
                                {c.icon ? (
                                  <>
                                    <div style={{ color: c.icon_color || '#1d1d1f' }}>
                                      {renderDynamicIcon(String(c.icon), Math.min(Number(c.icon_size || 32), 40), c.icon_color || '#0071e3')}
                                    </div>
                                    <span style={{ fontSize: 11, color: '#6e6e73', textTransform: 'capitalize' }}>{String(c.icon)}</span>
                                  </>
                                ) : (
                                  <>
                                    <Star size={28} strokeWidth={1.5} color="#86868b" />
                                    <span style={{ fontSize: 11, color: '#86868b' }}>Escolher Ícone</span>
                                  </>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                                <button
                                  type="button"
                                  onClick={() => setEditingIcon(true)}
                                  style={{
                                    flex: 1,
                                    padding: '7px 10px',
                                    background: '#f5f5f7',
                                    border: '1px solid #d2d2d7',
                                    borderRadius: 6,
                                    color: '#1d1d1f',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                  }}
                                >
                                  <Star size={13} /> Biblioteca de Ícones
                                </button>
                                {c.icon && (
                                  <button
                                    type="button"
                                    onClick={() => patch({ content: { icon: '' } })}
                                    style={{
                                      padding: '7px 10px',
                                      background: '#fff1f0',
                                      border: '1px solid #ffd7d5',
                                      borderRadius: 6,
                                      color: '#ff3b30',
                                      fontSize: 11,
                                      cursor: 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    title="Remover ícone"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                            <ControlRow label="Tamanho"><input type="number" min="8" max="160" value={Number(c.icon_size || 20)} onChange={e => patch({ content: { icon_size: Number(e.target.value) } })} /></ControlRow>
                            <ControlRow label="Cor"><input type="color" value={String(c.icon_color || '#111827')} onChange={e => patch({ content: { icon_color: e.target.value } })} /></ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET: BOTÃO */}
                        {widgetType === 'button' && (
                          <ElementorAccordion title="Botão" icon={MousePointerClick} isOpen={openSections.c_button !== false} onToggle={() => toggleSection('c_button')}>
                            <ControlRow label="Tipo">
                              <select value={String(s.button_type || 'primary')} onChange={e => patch({ schema: { button_type: e.target.value } })}>
                                <option value="primary">Padrão</option>
                                <option value="info">Informação</option>
                                <option value="success">Sucesso</option>
                                <option value="warning">Alerta</option>
                                <option value="danger">Perigo</option>
                              </select>
                            </ControlRow>
                            <ControlRow label="Texto do Botão">
                              <input
                                type="text"
                                placeholder="Clique Aqui"
                                value={String(c.text || c.label || '')}
                                onChange={e => patch({ content: { text: e.target.value, label: e.target.value } })}
                              />
                            </ControlRow>

                            {/* Ícone do Botão com Biblioteca Oficial */}
                            <div style={{ marginBottom: 12 }}>
                              <span style={{ fontSize: 11, fontWeight: 500, color: '#6e6e73', display: 'block', marginBottom: 6 }}>Ícone do Botão</span>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <div
                                  onClick={() => setEditingIcon(true)}
                                  style={{
                                    width: 38,
                                    height: 38,
                                    background: '#f5f5f7',
                                    border: '1px solid #d2d2d7',
                                    borderRadius: 6,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: c.icon_color || '#0071e3'
                                  }}
                                  title="Clique para escolher na biblioteca"
                                >
                                  {c.icon ? renderDynamicIcon(String(c.icon), 18, c.icon_color || '#0071e3') : <Star size={16} color="#86868b" />}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setEditingIcon(true)}
                                  style={{
                                    flex: 1,
                                    padding: '7px 10px',
                                    background: '#f5f5f7',
                                    border: '1px solid #d2d2d7',
                                    borderRadius: 6,
                                    color: '#1d1d1f',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 6
                                  }}
                                >
                                  <Star size={13} /> {c.icon ? `Trocar (${c.icon})` : 'Biblioteca de Ícones'}
                                </button>
                                {c.icon && (
                                  <button
                                    type="button"
                                    onClick={() => patch({ content: { icon: '' } })}
                                    style={{
                                      padding: '7px 10px',
                                      background: '#fff1f0',
                                      border: '1px solid #ffd7d5',
                                      borderRadius: 6,
                                      color: '#ff3b30',
                                      fontSize: 11,
                                      cursor: 'pointer'
                                    }}
                                    title="Remover ícone"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {c.icon && (
                              <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                                  <ControlRow label="Posição do Ícone">
                                    <select value={String(c.icon_position || 'before')} onChange={e => patch({ content: { icon_position: e.target.value } })}>
                                      <option value="before">Antes do texto</option>
                                      <option value="after">Depois do texto</option>
                                    </select>
                                  </ControlRow>
                                  <ControlRow label="Espaçamento">
                                    <input type="number" min="0" max="40" value={Number(c.icon_spacing ?? 8)} onChange={e => patch({ content: { icon_spacing: Number(e.target.value) } })} />
                                  </ControlRow>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                                  <ControlRow label="Tamanho do Ícone">
                                    <input type="number" min="10" max="64" value={Number(c.icon_size || 18)} onChange={e => patch({ content: { icon_size: Number(e.target.value) } })} />
                                  </ControlRow>
                                  <ControlRow label="Cor do Ícone">
                                    <input type="color" value={String(c.icon_color || '#ffffff')} onChange={e => patch({ content: { icon_color: e.target.value } })} />
                                  </ControlRow>
                                </div>
                              </>
                            )}

                            <ControlRow label="Link">
                              <input
                                type="text"
                                placeholder="https://... ou /pagina"
                                value={String(c.button_link || c.link || '')}
                                onChange={e => patch({ content: { button_link: e.target.value, link: e.target.value } })}
                              />
                            </ControlRow>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={!!c.target_blank}
                                onChange={e => patch({ content: { target_blank: e.target.checked } })}
                              />
                              Abrir em Nova Aba
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Alinhamento">
                                <AlignmentButtonGroup
                                  value={String(s.btn_align || c.align || 'left')}
                                  onChange={val => patch({ schema: { btn_align: val }, content: { align: val } })}
                                  allowJustify
                                />
                              </ControlRow>
                              <ControlRow label="Tamanho">
                                <select value={String(s.btn_size || 'medium')} onChange={e => patch({ schema: { btn_size: e.target.value } })}>
                                  <option value="small">Pequeno</option>
                                  <option value="medium">Médio</option>
                                  <option value="large">Grande</option>
                                  <option value="xl">Extra Grande</option>
                                </select>
                              </ControlRow>
                            </div>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET: VÍDEO */}
                        {widgetType === 'video' && (
                          <ElementorAccordion title="Vídeo" icon={Video} isOpen={openSections.c_video !== false} onToggle={() => toggleSection('c_video')}>
                            <ControlRow label="Origem">
                              <select value={String(c.source || 'youtube')} onChange={e => patch({ content: { source: e.target.value } })}>
                                <option value="youtube">YouTube</option>
                                <option value="vimeo">Vimeo</option>
                                <option value="dailymotion">Dailymotion</option>
                                <option value="self_hosted">Auto-hospedado (MP4)</option>
                              </select>
                            </ControlRow>
                            <ControlRow label="Link do Vídeo">
                              <input
                                type="text"
                                placeholder="https://www.youtube.com/watch?v=..."
                                value={String(c.url || c.video_url || '')}
                                onChange={e => patch({ content: { url: e.target.value, video_url: e.target.value } })}
                              />
                            </ControlRow>
                            <ControlRow label="Horário de início (s)"><input type="number" min="0" value={c.start_time ?? ''} onChange={e => patch({ content: { start_time: Number(e.target.value) } })} /></ControlRow>
                            <ControlRow label="Horário de término (s)"><input type="number" min="0" value={c.end_time ?? ''} onChange={e => patch({ content: { end_time: Number(e.target.value) } })} /></ControlRow>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                                <input type="checkbox" checked={!!c.autoplay} onChange={e => patch({ content: { autoplay: e.target.checked } })} />
                                Reprodução Automática (Autoplay)
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                                <input type="checkbox" checked={!!(c.muted ?? c.mute)} onChange={e => patch({ content: { mute: e.target.checked, muted: e.target.checked } })} />
                                Mudo (Mute)
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                                <input type="checkbox" checked={!!c.loop} onChange={e => patch({ content: { loop: e.target.checked } })} />
                                Repetir (Loop)
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                                <input type="checkbox" checked={c.controls !== false} onChange={e => patch({ content: { controls: e.target.checked } })} />
                                Controles do Reprodutor
                              </label>
                            </div>
                            <label className="editor-toggle-row">Legendas<input type="checkbox" checked={!!c.captions} onChange={e => patch({ content: { captions: e.target.checked } })} /></label>
                            <label className="editor-toggle-row">Modo de privacidade<input type="checkbox" checked={!!c.privacy} onChange={e => patch({ content: { privacy: e.target.checked } })} /></label>
                            <label className="editor-toggle-row">Carregamento tardio<input type="checkbox" checked={!!c.lazy_load} onChange={e => patch({ content: { lazy_load: e.target.checked } })} /></label>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET: DIVISOR */}
                        {widgetType === 'divider' && (
                          <ElementorAccordion title="Divisor" icon={Minus} isOpen={openSections.c_divider !== false} onToggle={() => toggleSection('c_divider')}>
                            <ControlRow label="Estilo da Linha">
                              <select value={String(c.style || s.style || 'solid')} onChange={e => patch({ content: { style: e.target.value }, schema: { style: e.target.value } })}>
                                <option value="solid">Sólido</option>
                                <option value="dashed">Tracejado</option>
                                <option value="dotted">Pontilhado</option>
                                <option value="double">Duplo</option>
                              </select>
                            </ControlRow>
                            <ControlRow label="Largura (%)">
                              <input
                                type="text"
                                placeholder="100%"
                                value={String(c.width || s.width || '100%')}
                                onChange={e => patch({ content: { width: e.target.value }, schema: { width: e.target.value } })}
                              />
                            </ControlRow>
                            <ControlRow label="Alinhamento">
                              <AlignmentButtonGroup
                                value={String(s.divider_align || c.align || 'center')}
                                onChange={val => patch({ schema: { divider_align: val }, content: { align: val } })}
                              />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET: ESPAÇADOR */}
                        {widgetType === 'spacer' && (
                          <ElementorAccordion title="Espaçador" icon={MoveVertical} isOpen={openSections.c_spacer !== false} onToggle={() => toggleSection('c_spacer')}>
                            <ControlRow label="Espaço / Altura (px)">
                              <input
                                type="range"
                                min="10"
                                max="300"
                                value={Number(c.height || s.height || 50)}
                                onChange={e => patch({ content: { height: Number(e.target.value) }, schema: { height: Number(e.target.value) } })}
                                style={{ width: '100%', marginBottom: 6 }}
                              />
                              <input
                                type="number"
                                min="5"
                                max="600"
                                value={Number(c.height || s.height || 50)}
                                onChange={e => patch({ content: { height: Number(e.target.value) }, schema: { height: Number(e.target.value) } })}
                              />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET: CONTÊINER (FLEXBOX / LAYOUT) */}
                        {isContainer && (
                          <>
                            <ElementorAccordion title="Estrutura do Contêiner" icon={Box} isOpen={openSections.content_structure !== false} onToggle={() => toggleSection('content_structure')}>
                              <ControlRow label="Largura" description="Use px, %, vw ou auto. Vazio mantém o tamanho original.">
                                <input aria-label="Largura da seção" type="text" placeholder="Ex.: 320px, 50% ou auto" value={String(s.width ?? '')} onChange={e => patch({ schema: { width: e.target.value } })} />
                              </ControlRow>
                              <ControlRow label="Altura" description="Use px, vh ou auto. Ajustável por dispositivo.">
                                <input aria-label="Altura da seção" type="text" placeholder="Ex.: 80px ou auto" value={String(s.height ?? '')} onChange={e => patch({ schema: { height: e.target.value } })} />
                              </ControlRow>
                              <ControlRow label="Largura do Contêiner">
                                <select value={String(c.width_type || s.width_type || 'boxed')} onChange={e => patch({ content: { width_type: e.target.value }, schema: { width_type: e.target.value } })}>
                                  <option value="boxed">Em Caixa (Boxed - Centralizado 1352px)</option>
                                  <option value="full">Largura Total (Full Width - 100%)</option>
                                </select>
                              </ControlRow>
                              <ControlRow label="Largura Máxima Personalizada (opcional)" description="Deixe vazio para usar o padrão">
                                <input
                                  type="text"
                                  placeholder="Ex.: 1200px ou 90%"
                                  value={String(c.max_width || s.max_width || '')}
                                  onChange={e => patch({ content: { max_width: e.target.value }, schema: { max_width: e.target.value } })}
                                />
                              </ControlRow>
                              <ControlRow label="Altura Mínima (px)">
                                <input
                                  type="number"
                                  min="0"
                                  placeholder="48"
                                  value={Number(c.min_height || s.min_height || 48)}
                                  onChange={e => patch({ content: { min_height: Number(e.target.value) }, schema: { min_height: Number(e.target.value) } })}
                                />
                              </ControlRow>
                              <ControlRow label="Tag HTML">
                                <select value={String(c.tag || s.tag || 'div')} onChange={e => patch({ content: { tag: e.target.value }, schema: { tag: e.target.value } })}>
                                  <option value="div">div</option>
                                  <option value="section">section</option>
                                  <option value="article">article</option>
                                  <option value="header">header</option>
                                  <option value="footer">footer</option>
                                  <option value="main">main</option>
                                </select>
                              </ControlRow>
                            </ElementorAccordion>

                            <ElementorAccordion title="Itens / Flexbox" icon={Layout} isOpen={openSections.content_flex !== false} onToggle={() => toggleSection('content_flex')}>
                              <ControlRow label="Direção dos Itens">
                                <select value={String(c.direction || s.direction || 'column')} onChange={e => patch({ content: { direction: e.target.value }, schema: { direction: e.target.value } })}>
                                  <option value="column">Coluna Vertical (↓ Direção Coluna)</option>
                                  <option value="row">Linha Horizontal (→ Direção Linha)</option>
                                  <option value="column-reverse">Coluna Invertida (↑)</option>
                                  <option value="row-reverse">Linha Invertida (←)</option>
                                </select>
                              </ControlRow>
                              <ControlRow label="Justificar Conteúdo (Eixo Principal / justify-content)">
                                <select value={String(c.justify || s.justify || 'flex-start')} onChange={e => patch({ content: { justify: e.target.value }, schema: { justify: e.target.value } })}>
                                  <option value="flex-start">Início (flex-start)</option>
                                  <option value="center">Centralizado (center)</option>
                                  <option value="flex-end">Fim (flex-end)</option>
                                  <option value="space-between">Espaço Entre (space-between)</option>
                                  <option value="space-around">Espaço ao Redor (space-around)</option>
                                  <option value="space-evenly">Espaço Uniforme (space-evenly)</option>
                                </select>
                              </ControlRow>
                              <ControlRow label="Alinhar Itens (Eixo Cruzado / align-items)">
                                <select value={String(c.align || s.align || 'stretch')} onChange={e => patch({ content: { align: e.target.value }, schema: { align: e.target.value } })}>
                                  <option value="stretch">Esticar (stretch)</option>
                                  <option value="flex-start">Início (flex-start)</option>
                                  <option value="center">Centralizado (center)</option>
                                  <option value="flex-end">Fim (flex-end)</option>
                                </select>
                              </ControlRow>
                              <ControlRow label="Espaçamento entre Itens (Gap)">
                                <input
                                  type="text"
                                  placeholder="16px"
                                  value={String(c.gap || s.gap || '16px')}
                                  onChange={e => patch({ content: { gap: e.target.value }, schema: { gap: e.target.value } })}
                                />
                              </ControlRow>
                              <ControlRow label="Quebra de Linha (Wrap)">
                                <select value={String(c.wrap || s.wrap || 'wrap')} onChange={e => patch({ content: { wrap: e.target.value }, schema: { wrap: e.target.value } })}>
                                  <option value="wrap">Quebrar Linha (wrap)</option>
                                  <option value="nowrap">Não Quebrar (nowrap)</option>
                                </select>
                              </ControlRow>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* WIDGET: CARD DE PRODUTO */}
                        {widgetType === 'storefrontCard' && (
                          <>
                            <ElementorAccordion title="Conteúdo e Textos" icon={Type} isOpen={openSections.content_main !== false} onToggle={() => toggleSection('content_main')}>
                              <ControlRow label="Título do Produto">
                                <input
                                  type="text"
                                  placeholder="Nome personalizado do produto"
                                  value={String(c.title || '')}
                                  onChange={e => patch({ content: { title: e.target.value } })}
                                />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Tag HTML do Título">
                                  <select value={String(s.title_tag || 'h3')} onChange={e => patch({ schema: { title_tag: e.target.value } })}>
                                    <option value="h1">H1</option>
                                    <option value="h2">H2</option>
                                    <option value="h3">H3</option>
                                    <option value="h4">H4</option>
                                    <option value="p">p</option>
                                    <option value="span">span</option>
                                  </select>
                                </ControlRow>
                                <ControlRow label="Alinhamento">
                                  <AlignmentButtonGroup
                                    value={String(s.title_align || 'left')}
                                    onChange={val => patch({ schema: { title_align: val } })}
                                  />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>

                            <ElementorAccordion title="Mídia / Imagem" icon={ImageIcon} isOpen={openSections.content_media !== false} onToggle={() => toggleSection('content_media')}>
                              <ControlRow label="Imagem do Produto">
                                <ImageMediaControl value={String(c.img || c.image || '')}
                                  onChange={value => patch({ content: { img: value, image: value } })}
                                />
                              </ControlRow>
                              {!!imageUrl && (
                                <button
                                  type="button"
                                  onClick={() => setEditingImage(true)}
                                  style={{ width: '100%', padding: '6px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginTop: 4 }}
                                >
                                  Trocar / Enviar Nova Imagem
                                </button>
                              )}
                            </ElementorAccordion>

                            <ElementorAccordion title="Botão de Compra" icon={MousePointerClick} isOpen={openSections.content_button !== false} onToggle={() => toggleSection('content_button')}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={s.show_button !== false}
                                  onChange={e => patch({ schema: { show_button: e.target.checked } })}
                                />
                                Exibir Botão de Compra
                              </label>
                              <ControlRow label="Texto do Botão">
                                <input
                                  type="text"
                                  placeholder="Ex.: Comprar Agora / Ver Detalhes"
                                  value={String(c.button_text || s.button_text || '')}
                                  onChange={e => patch({ content: { button_text: e.target.value }, schema: { button_text: e.target.value } })}
                                />
                              </ControlRow>
                              <ControlRow label="Link de Destino do Botão">
                                <input
                                  type="text"
                                  placeholder="Ex.: /checkout ou link do produto"
                                  value={String(c.button_link || s.button_link || '')}
                                  onChange={e => patch({ content: { button_link: e.target.value }, schema: { button_link: e.target.value } })}
                                />
                              </ControlRow>
                            </ElementorAccordion>

                            <ElementorAccordion title="Exibição de Elementos (Toggles)" icon={SlidersHorizontal} isOpen={openSections.content_toggles !== false} onToggle={() => toggleSection('content_toggles')}>
                              {[
                                { key: 'show_price', label: 'Exibir Preço Principal', def: true },
                                { key: 'show_old_price', label: 'Exibir Preço Riscado (Antigo)', def: true },
                                { key: 'show_discount', label: 'Exibir Selo de Desconto (%)', def: true },
                                { key: 'show_installments', label: 'Exibir Parcelamento / Pix', def: true },
                                { key: 'show_rating', label: 'Exibir Avaliações (Estrelas)', def: true },
                                { key: 'show_shipping', label: 'Exibir Envio / Frete Grátis Express', def: true },
                                { key: 'show_favorite', label: 'Exibir Botão de Favorito (Coração)', def: true }
                              ].map(item => (
                                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 6, cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={s[item.key] !== false}
                                    onChange={e => patch({ schema: { [item.key]: e.target.checked } })}
                                  />
                                  {item.label}
                                </label>
                              ))}
                            </ElementorAccordion>

                            <ElementorAccordion title="Vínculo com o Catálogo" icon={Tag} isOpen={false} onToggle={() => toggleSection('content_catalog')}>
                              <ControlRow label="SKU ou ID do Produto" description="Deixe vazio para usar a apresentação padrão do catálogo">
                                <input
                                  type="text"
                                  placeholder="Ex.: FUR-01 ou ID"
                                  value={String(c.productId || '')}
                                  onChange={e => patch({ content: { productId: e.target.value } })}
                                />
                              </ControlRow>
                              {(widget.productId || target?.scope.startsWith('product:')) && (
                                <ProductDataControls productId={widget.productId || target!.scope.slice(8)} />
                              )}
                            </ElementorAccordion>
                          </>
                        )}

                        {/* WIDGET: VITRINE DE PRODUTOS */}
                        {widgetType === 'storefrontShelf' && (
                          <ElementorAccordion title="Vitrine de Produtos" icon={Grid} isOpen={openSections.reference_section_1 !== false} onToggle={() => toggleSection('reference_section_1')}>
                            <ControlRow label="Quantidade Máxima de Produtos">
                              <input type="number" min="1" max="24" value={Number(c.limit || 4)} onChange={e => patch({ content: { limit: Number(e.target.value) } })} />
                            </ControlRow>
                            <ControlRow label="Número de Colunas">
                              <input type="number" min="1" max="6" value={Number(c.columns || 4)} onChange={e => patch({ content: { columns: Number(e.target.value) } })} />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET: ESPAÇO DE ANÚNCIO (ADS) */}
                        {widgetType === 'ads' && (
                          <ElementorAccordion title="Espaço de Anúncio (ADS)" icon={Megaphone} isOpen={openSections.reference_section_2 !== false} onToggle={() => toggleSection('reference_section_2')}>
                            <p style={{ fontSize: 12, color: '#1e40af', margin: '0 0 10px 0' }}>
                              Posição: <code>{widget.id.replace('ads:', '') || (c as any)?.placement || 'middle_screen'}</code>
                            </p>
                            <a
                              href="http://localhost:5174/hub/ads"
                              target="_blank"
                              rel="noreferrer"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#2563eb', color: '#fff', borderRadius: 6, fontSize: 12, textDecoration: 'none', fontWeight: 600 }}
                            >
                              <ExternalLink size={14} /> Gerenciar Campanhas ADS
                            </a>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET ELEMENTOR PRO: FLIP BOX */}
                        {(widgetType === 'flipBox' || widgetType === 'flipBoxPro') && (
                          <>
                            <ElementorAccordion title="Lado Frontal (Frente)" icon={ImageIcon} isOpen={openSections.fb_front !== false} onToggle={() => toggleSection('fb_front')}>
                              <ControlRow label="Título Frontal">
                                <input type="text" value={String(c.front_title || '')} onChange={e => patch({ content: { front_title: e.target.value } })} />
                              </ControlRow>
                              <ControlRow label="Subtítulo / Descrição Frontal">
                                <textarea rows={2} value={String(c.front_subtitle || '')} onChange={e => patch({ content: { front_subtitle: e.target.value } })} />
                              </ControlRow>
                              <ControlRow label="Ícone Frontal (ex: star, wrench, shield)">
                                <input type="text" placeholder="star, wrench, check..." value={String(c.front_icon || '')} onChange={e => patch({ content: { front_icon: e.target.value } })} />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor de Fundo">
                                  <input type="color" value={String(c.front_bg || '#1e293b')} onChange={e => patch({ content: { front_bg: e.target.value } })} />
                                </ControlRow>
                                <ControlRow label="Cor do Texto">
                                  <input type="color" value={String(c.front_color || '#ffffff')} onChange={e => patch({ content: { front_color: e.target.value } })} />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>

                            <ElementorAccordion title="Lado Traseiro (Verso)" icon={SlidersHorizontal} isOpen={openSections.fb_back !== false} onToggle={() => toggleSection('fb_back')}>
                              <ControlRow label="Título do Verso">
                                <input type="text" value={String(c.back_title || '')} onChange={e => patch({ content: { back_title: e.target.value } })} />
                              </ControlRow>
                              <ControlRow label="Descrição do Verso">
                                <textarea rows={3} value={String(c.back_description || '')} onChange={e => patch({ content: { back_description: e.target.value } })} />
                              </ControlRow>
                              <ControlRow label="Texto do Botão">
                                <input type="text" value={String(c.button_text || '')} onChange={e => patch({ content: { button_text: e.target.value } })} />
                              </ControlRow>
                              <ControlRow label="Link do Botão">
                                <input type="text" placeholder="https://..." value={String(c.button_link || '')} onChange={e => patch({ content: { button_link: e.target.value } })} />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor de Fundo">
                                  <input type="color" value={String(c.back_bg || '#0071e3')} onChange={e => patch({ content: { back_bg: e.target.value } })} />
                                </ControlRow>
                                <ControlRow label="Cor do Texto">
                                  <input type="color" value={String(c.back_color || '#ffffff')} onChange={e => patch({ content: { back_color: e.target.value } })} />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>

                            <ElementorAccordion title="Configuração do Efeito Flip 3D" icon={Layers} isOpen={openSections.fb_effect !== false} onToggle={() => toggleSection('fb_effect')}>
                              <ControlRow label="Efeito Flip">
                                <select value={String(c.effect || 'flip')} onChange={e => patch({ content: { effect: e.target.value } })}>
                                  <option value="flip">Girar (Flip 3D)</option>
                                  <option value="push">Empurrar (Push)</option>
                                  <option value="slide">Deslizar (Slide)</option>
                                  <option value="zoom-in">Aproximar (Zoom In)</option>
                                  <option value="fade">Desvanecer (Fade)</option>
                                </select>
                              </ControlRow>
                              <ControlRow label="Direção">
                                <select value={String(c.direction || 'right')} onChange={e => patch({ content: { direction: e.target.value } })}>
                                  <option value="right">Direita</option>
                                  <option value="left">Esquerda</option>
                                  <option value="up">Cima</option>
                                  <option value="down">Baixo</option>
                                </select>
                              </ControlRow>
                              <ControlRow label="Profundidade 3D">
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                                  <input type="checkbox" checked={c.is_3d !== false} onChange={e => patch({ content: { is_3d: e.target.checked } })} />
                                  Habilitar Profundidade 3D
                                </label>
                              </ControlRow>
                              <ControlRow label="Altura Mínima (px)">
                                <input type="number" min="150" max="600" value={Number(c.height || 280)} onChange={e => patch({ content: { height: Number(e.target.value) } })} />
                              </ControlRow>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* WIDGET ELEMENTOR PRO: TABELA DE PREÇOS */}
                        {(widgetType === 'priceTable' || widgetType === 'priceTablePro') && (
                          <>
                            <ElementorAccordion title="Cabeçalho & Plano" icon={Table} isOpen={openSections.pt_head !== false} onToggle={() => toggleSection('pt_head')}>
                              <ControlRow label="Nome do Plano">
                                <input type="text" value={String(c.plan || c.heading || c.title || '')} onChange={e => patch({ content: { plan: e.target.value, heading: e.target.value } })} />
                              </ControlRow>
                              <ControlRow label="Subtítulo">
                                <input type="text" value={String(c.subtitle || c.subheading || '')} onChange={e => patch({ content: { subtitle: e.target.value, subheading: e.target.value } })} />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor Fundo">
                                  <input type="color" value={String(c.header_bg || '#ffffff')} onChange={e => patch({ content: { header_bg: e.target.value } })} />
                                </ControlRow>
                                <ControlRow label="Cor do Título">
                                  <input type="color" value={String(c.title_color || '#1d1d1f')} onChange={e => patch({ content: { title_color: e.target.value } })} />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>

                            <ElementorAccordion title="Preço & Moeda" icon={Zap} isOpen={openSections.pt_price !== false} onToggle={() => toggleSection('pt_price')}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 8 }}>
                                <ControlRow label="Moeda">
                                  <input type="text" value={String(c.currency || 'R$')} onChange={e => patch({ content: { currency: e.target.value } })} />
                                </ControlRow>
                                <ControlRow label="Preço">
                                  <input type="text" value={String(c.price || '')} onChange={e => patch({ content: { price: e.target.value } })} />
                                </ControlRow>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Preço Original (riscado)">
                                  <input type="text" placeholder="Opcional" value={String(c.original_price || '')} onChange={e => patch({ content: { original_price: e.target.value } })} />
                                </ControlRow>
                                <ControlRow label="Período">
                                  <input type="text" placeholder="/mês" value={String(c.period || '/mês')} onChange={e => patch({ content: { period: e.target.value } })} />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>

                            <ElementorAccordion title="Lista de Recursos" icon={List} isOpen={openSections.pt_features !== false} onToggle={() => toggleSection('pt_features')}>
                              <ControlRow label="Benefícios (1 por linha)">
                                <textarea
                                  rows={5}
                                  placeholder="Recurso 1&#10;Recurso 2&#10;Recurso 3"
                                  value={Array.isArray(c.features) ? c.features.join('\n') : String(c.features || '')}
                                  onChange={e => patch({ content: { features: e.target.value.split('\n').filter(Boolean) } })}
                                />
                              </ControlRow>
                            </ElementorAccordion>

                            <ElementorAccordion title="Faixa de Destaque (Ribbon)" icon={Star} isOpen={openSections.pt_ribbon !== false} onToggle={() => toggleSection('pt_ribbon')}>
                              <ControlRow label="Título da Faixa">
                                <input type="text" placeholder="Ex: MAIS POPULAR" value={String(c.ribbon_title || '')} onChange={e => patch({ content: { ribbon_title: e.target.value } })} />
                              </ControlRow>
                              <ControlRow label="Cor da Faixa">
                                <input type="color" value={String(c.ribbon_bg || '#0071e3')} onChange={e => patch({ content: { ribbon_bg: e.target.value } })} />
                              </ControlRow>
                            </ElementorAccordion>

                            <ElementorAccordion title="Botão de Chamada para Ação" icon={MousePointerClick} isOpen={openSections.pt_btn !== false} onToggle={() => toggleSection('pt_btn')}>
                              <ControlRow label="Texto do Botão">
                                <input type="text" value={String(c.button_label || c.button_text || 'Escolher Plano')} onChange={e => patch({ content: { button_label: e.target.value, button_text: e.target.value } })} />
                              </ControlRow>
                              <ControlRow label="Link do Botão">
                                <input type="text" placeholder="https://..." value={String(c.button_link || '#')} onChange={e => patch({ content: { button_link: e.target.value } })} />
                              </ControlRow>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* WIDGET ELEMENTOR PRO: CONTADOR REGRESSIVO */}
                        {widgetType === 'countdown' && (
                          <ElementorAccordion title="Contador Regressivo" icon={Clock} isOpen={openSections.reference_section_3 !== false} onToggle={() => toggleSection('reference_section_3')}>
                            <ControlRow label="Título do Contador">
                              <input type="text" value={String(c.title || '')} onChange={e => patch({ content: { title: e.target.value } })} />
                            </ControlRow>
                            <ControlRow label="Data & Hora de Término">
                              <input type="datetime-local" value={String(c.end_date || '')} onChange={e => patch({ content: { end_date: e.target.value } })} />
                            </ControlRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                                <input type="checkbox" checked={c.show_days !== false} onChange={e => patch({ content: { show_days: e.target.checked } })} /> Dias
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                                <input type="checkbox" checked={c.show_hours !== false} onChange={e => patch({ content: { show_hours: e.target.checked } })} /> Horas
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                                <input type="checkbox" checked={c.show_minutes !== false} onChange={e => patch({ content: { show_minutes: e.target.checked } })} /> Minutos
                              </label>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer' }}>
                                <input type="checkbox" checked={c.show_seconds !== false} onChange={e => patch({ content: { show_seconds: e.target.checked } })} /> Segundos
                              </label>
                            </div>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET ELEMENTOR PRO: TÍTULO ANIMADO */}
                        {(widgetType === 'animatedHeadline' || widgetType === 'animatedHeadlinePro') && (
                          <ElementorAccordion title="Título Animado" icon={Heading} isOpen={openSections.reference_section_4 !== false} onToggle={() => toggleSection('reference_section_4')}>
                            <ControlRow label="Estilo de Animação">
                              <select value={String(c.headline_style || 'highlight')} onChange={e => patch({ content: { headline_style: e.target.value } })}>
                                <option value="highlight">Destaque (Forma Gráfica SVG)</option>
                                <option value="rotate">Rotativo (Texto Alternante)</option>
                              </select>
                            </ControlRow>
                            {c.headline_style !== 'rotate' && (
                              <ControlRow label="Forma do Destaque">
                                <select value={String(c.shape || 'circle')} onChange={e => patch({ content: { shape: e.target.value } })}>
                                  <option value="circle">Círculo</option>
                                  <option value="underline">Sublinhado</option>
                                  <option value="curly">Encaracolado (Curly)</option>
                                  <option value="double">Sublinhado Duplo</option>
                                </select>
                              </ControlRow>
                            )}
                            <ControlRow label="Texto Antes">
                              <input type="text" value={String(c.before_text || '')} onChange={e => patch({ content: { before_text: e.target.value } })} />
                            </ControlRow>
                            <ControlRow label={c.headline_style === 'rotate' ? 'Texto Rotativo' : 'Texto em Destaque'}>
                              <input type="text" value={String(c.highlighted_text || c.animated_word || c.text || '')} onChange={e => patch({ content: { highlighted_text: e.target.value, animated_word: e.target.value, text: e.target.value } })} />
                            </ControlRow>
                            <ControlRow label="Texto Depois">
                              <input type="text" value={String(c.after_text || '')} onChange={e => patch({ content: { after_text: e.target.value } })} />
                            </ControlRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Cor do Destaque">
                                <input type="color" value={String(c.stroke_color || c.highlight_color || '#a2e000')} onChange={e => patch({ content: { stroke_color: e.target.value, highlight_color: e.target.value } })} />
                              </ControlRow>
                              <ControlRow label="Cor do Texto">
                                <input type="color" value={String(c.color || '#1d1d1f')} onChange={e => patch({ content: { color: e.target.value } })} />
                              </ControlRow>
                            </div>
                            <label className="editor-toggle-row">Loop infinito<input type="checkbox" checked={c.infinite_loop !== false} onChange={e => patch({ content: { infinite_loop: e.target.checked } })} /></label>
                            <ControlRow label="Duração (ms)"><input type="number" min="0" value={c.duration ?? 1200} onChange={e => patch({ content: { duration: Number(e.target.value) } })} /></ControlRow>
                            <ControlRow label="Espera (ms)"><input type="number" min="100" value={c.delay ?? 8000} onChange={e => patch({ content: { delay: Number(e.target.value) } })} /></ControlRow>
                            <ControlRow label="Tag HTML"><select value={c.html_tag || 'h3'} onChange={e => patch({ content: { html_tag: e.target.value } })}>{['h1','h2','h3','h4','h5','h6','div','p','span'].map(tag => <option key={tag}>{tag}</option>)}</select></ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET ELEMENTOR PRO: CTA */}
                        {(widgetType === 'cta' || widgetType === 'call-to-action') && (
                          <ElementorAccordion title="Chamada para Ação (CTA)" icon={Megaphone} isOpen={openSections.reference_section_5 !== false} onToggle={() => toggleSection('reference_section_5')}>
                            <ControlRow label="Título">
                              <input type="text" value={String(c.title || '')} onChange={e => patch({ content: { title: e.target.value } })} />
                            </ControlRow>
                            <ControlRow label="Descrição">
                              <textarea rows={3} value={String(c.description || '')} onChange={e => patch({ content: { description: e.target.value } })} />
                            </ControlRow>
                            <ControlRow label="Texto do Botão">
                              <input type="text" value={String(c.button_label || c.button_text || '')} onChange={e => patch({ content: { button_label: e.target.value, button_text: e.target.value } })} />
                            </ControlRow>
                            <ControlRow label="Link do Botão">
                              <input type="text" placeholder="https://..." value={String(c.button_link || '#')} onChange={e => patch({ content: { button_link: e.target.value } })} />
                            </ControlRow>
                            <ControlRow label="Faixa / Ribbon (Opcional)">
                              <input type="text" placeholder="Ex: NOVO, OFERTA" value={String(c.ribbon_title || '')} onChange={e => patch({ content: { ribbon_title: e.target.value } })} />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET ELEMENTOR PRO: REVIEWS */}
                        {(widgetType === 'reviews' || widgetType === 'reviewsPro') && (
                          <ElementorAccordion title="Avaliações & Depoimentos" icon={Star} isOpen={openSections.reference_section_6 !== false} onToggle={() => toggleSection('reference_section_6')}>
                            <ControlRow label="Título da Seção">
                              <input type="text" value={String(c.title || 'O que nossos clientes dizem')} onChange={e => patch({ content: { title: e.target.value } })} />
                            </ControlRow>
                            <p style={{ fontSize: 11, color: '#64748b', margin: '6px 0 10px' }}>
                              Adicione ou edite os depoimentos exibidos na grade de avaliações:
                            </p>
                            {(Array.isArray(c.items) ? c.items : [{ name: 'Alison Silva', role: 'Mestre de Obras', rating: 5, text: 'Equipamentos de altíssima qualidade!' }]).map((rev: any, idx: number) => (
                              <div key={idx} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 8, padding: 10, marginBottom: 8 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 6, marginBottom: 6 }}>
                                  <input
                                    type="text"
                                    placeholder="Nome do cliente"
                                    value={rev.name || rev.author || ''}
                                    onChange={e => {
                                      const next = [...(Array.isArray(c.items) ? c.items : [])]
                                      next[idx] = { ...next[idx], name: e.target.value, author: e.target.value }
                                      patch({ content: { items: next } })
                                    }}
                                  />
                                  <input
                                    type="number"
                                    min="1"
                                    max="5"
                                    placeholder="Estrelas (1-5)"
                                    value={rev.rating || 5}
                                    onChange={e => {
                                      const next = [...(Array.isArray(c.items) ? c.items : [])]
                                      next[idx] = { ...next[idx], rating: Number(e.target.value) }
                                      patch({ content: { items: next } })
                                    }}
                                  />
                                </div>
                                <textarea
                                  rows={2}
                                  placeholder="Depoimento..."
                                  value={rev.text || ''}
                                  onChange={e => {
                                    const next = [...(Array.isArray(c.items) ? c.items : [])]
                                    next[idx] = { ...next[idx], text: e.target.value }
                                    patch({ content: { items: next } })
                                  }}
                                />
                              </div>
                            ))}
                            <button
                              type="button"
                              style={{ width: '100%', padding: '8px', background: '#e2e8f0', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                              onClick={() => {
                                const current = Array.isArray(c.items) ? [...c.items] : []
                                current.push({ name: 'Novo Cliente', role: 'Cliente Verificado', rating: 5, text: 'Excelente produto!' })
                                patch({ content: { items: current } })
                              }}
                            >
                              + Adicionar Depoimento
                            </button>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET ELEMENTOR BÁSICO: CONTADOR */}
                        {widgetType === 'counter' && (
                          <ElementorAccordion title="Contador Numérico" icon={PlusCircle} isOpen={openSections.reference_section_7 !== false} onToggle={() => toggleSection('reference_section_7')}>
                            <ControlRow label="Título">
                              <input type="text" value={String(c.title || '')} onChange={e => patch({ content: { title: e.target.value } })} />
                            </ControlRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Número / Valor">
                                <input type="text" value={String(c.number || c.ending_number || '10.000')} onChange={e => patch({ content: { number: e.target.value, ending_number: e.target.value } })} />
                              </ControlRow>
                              <ControlRow label="Prefixo">
                                <input type="text" placeholder="Ex: +" value={String(c.prefix || '')} onChange={e => patch({ content: { prefix: e.target.value } })} />
                              </ControlRow>
                            </div>
                            <ControlRow label="Sufixo (ex: k, %, +)">
                              <input type="text" placeholder="Ex: % ou k" value={String(c.suffix || '')} onChange={e => patch({ content: { suffix: e.target.value } })} />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET ELEMENTOR BÁSICO: BARRA DE PROGRESSO */}
                        {(widgetType === 'progress' || widgetType === 'progressBar') && (
                          <ElementorAccordion title="Barra de Progresso" icon={Activity} isOpen={openSections.reference_section_8 !== false} onToggle={() => toggleSection('reference_section_8')}>
                            <ControlRow label="Título">
                              <input type="text" value={String(c.title || '')} onChange={e => patch({ content: { title: e.target.value } })} />
                            </ControlRow>
                            <ControlRow label="Porcentagem (%)">
                              <input type="number" min="0" max="100" value={Number(c.percent || 75)} onChange={e => patch({ content: { percent: Number(e.target.value) } })} />
                            </ControlRow>
                            <ControlRow label="Cor da Barra">
                              <input type="color" value={String(c.color || '#a2e000')} onChange={e => patch({ content: { color: e.target.value } })} />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET ELEMENTOR BÁSICO: SANFONA / ACCORDION */}
                        {(widgetType === 'accordion' || widgetType === 'toggle') && (() => {
                          const items: any[] = (Array.isArray(c.items) && c.items.length > 0)
                            ? c.items
                            : (Array.isArray(c.items_titles) && c.items_titles.length > 0)
                            ? c.items_titles
                            : (Array.isArray(c.list_items) && c.list_items.length > 0)
                            ? c.list_items
                            : [
                                { title: 'Qual é o prazo de entrega dos pedidos?', content: 'O prazo varia conforme a sua região, com entregas expressas via transportadora rastreada em até 3 a 7 dias úteis.' },
                                { title: 'Os produtos possuem garantia oficial TEKNIX?', content: 'Sim, todos os nossos produtos possuem garantia de fábrica de 12 meses contra defeitos de fabricação.' },
                                { title: 'Quais são as formas de pagamento disponíveis?', content: 'Aceitamos cartões de crédito em até 12x, Pix com desconto exclusivo e boleto bancário.' }
                              ]
                          const openIdx = openRepeaterIndex[selected] !== undefined ? openRepeaterIndex[selected] : 0

                          return (
                            <>
                              <ElementorAccordion title="Itens da Sanfona / FAQ" icon={ChevronDown} isOpen={openSections.reference_section_9 !== false} onToggle={() => toggleSection('reference_section_9')}>
                              <p style={{ fontSize: 11, color: '#a4afb7', margin: '0 0 12px' }}>
                                Adicione perguntas e respostas que expandem e recolhem ao clicar:
                              </p>

                              {items.map((item: any, idx: number) => (
                                <ElementorRepeaterItem
                                  key={idx}
                                  index={idx}
                                  title={item.title || item.text || item.label || `Pergunta #${idx + 1}`}
                                  isOpen={openIdx === idx}
                                  onToggle={() => setOpenRepeaterIndex(prev => ({ ...prev, [selected]: openIdx === idx ? -1 : idx }))}
                                  onDuplicate={() => {
                                    const next = [...items]
                                    next.splice(idx + 1, 0, { ...structuredClone(item), title: `${item.title || 'Pergunta'} (Cópia)` })
                                    patch({ content: { items: next } })
                                    setOpenRepeaterIndex(prev => ({ ...prev, [selected]: idx + 1 }))
                                  }}
                                  onDelete={() => {
                                    const next = items.filter((_, i) => i !== idx)
                                    patch({ content: { items: next } })
                                  }}
                                >
                                  <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#a4afb7', marginBottom: 4, display: 'block' }}>Título / Pergunta</label>
                                    <input
                                      type="text"
                                      placeholder="Ex: Qual é o prazo de entrega?"
                                      value={item.title || item.text || ''}
                                      style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 6, color: '#1d1d1f', fontSize: 12 }}
                                      onChange={e => {
                                        const next = [...items]
                                        next[idx] = { ...next[idx], title: e.target.value, text: e.target.value }
                                        patch({ content: { items: next } })
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#a4afb7', marginBottom: 4, display: 'block' }}>Conteúdo / Resposta</label>
                                    <textarea
                                      rows={3}
                                      placeholder="Ex: Entregamos em todo o Brasil com código de rastreio..."
                                      value={item.content || item.html || item.answer || ''}
                                      style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 6, color: '#1d1d1f', fontSize: 12, resize: 'vertical' }}
                                      onChange={e => {
                                        const next = [...items]
                                        next[idx] = { ...next[idx], content: e.target.value, html: e.target.value, answer: e.target.value }
                                        patch({ content: { items: next } })
                                      }}
                                    />
                                  </div>
                                </ElementorRepeaterItem>
                              ))}

                              <button
                                type="button"
                                style={{
                                  width: '100%',
                                  padding: '10px 14px',
                                  background: '#0071e3',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  marginTop: 4,
                                  boxShadow: '0 2px 6px rgba(0,113,227,0.3)'
                                }}
                                onClick={() => {
                                  const next = [...items, { title: 'Nova Pergunta Frequente', content: 'Insira a resposta aqui detalhadamente.' }]
                                  patch({ content: { items: next } })
                                  setOpenRepeaterIndex(prev => ({ ...prev, [selected]: next.length - 1 }))
                                }}
                              >
                                <Plus size={14} /> Adicionar Nova Pergunta
                              </button>
                            </ElementorAccordion>

                            <ElementorAccordion title="Comportamento & Ícone" icon={SlidersHorizontal} isOpen={openSections.c_acc_behavior !== false} onToggle={() => toggleSection('c_acc_behavior')}>
                              <ControlRow label="Comportamento da Sanfona">
                                <select
                                  value={String(c.accordion_behavior || s.accordion_behavior || 'single')}
                                  onChange={e => patch({ content: { accordion_behavior: e.target.value }, schema: { accordion_behavior: e.target.value } })}
                                >
                                  <option value="single">Sanfona Exclusiva (Fecha as outras ao abrir uma)</option>
                                  <option value="multiple">Múltiplos Abertos (Permite várias abertas)</option>
                                </select>
                              </ControlRow>
                              <ControlRow label="Tipo de Ícone">
                                <select
                                  value={String(c.icon_type || s.icon_type || 'plus')}
                                  onChange={e => patch({ content: { icon_type: e.target.value }, schema: { icon_type: e.target.value } })}
                                >
                                  <option value="plus">Mais / Menos (+ / × giratório)</option>
                                  <option value="chevron">Chevron (⌵ / ⌃ seta para baixo)</option>
                                  <option value="arrow">Seta Linear (→ / ↓)</option>
                                </select>
                              </ControlRow>
                              <ControlRow label="Alinhamento do Ícone">
                                <select
                                  value={String(c.icon_align || s.icon_align || 'right')}
                                  onChange={e => patch({ content: { icon_align: e.target.value }, schema: { icon_align: e.target.value } })}
                                >
                                  <option value="right">À Direita</option>
                                  <option value="left">À Esquerda</option>
                                </select>
                              </ControlRow>
                              <ControlRow label="Item Aberto Inicialmente">
                                <select
                                  value={String(c.default_open !== undefined ? c.default_open : (s.default_open !== undefined ? s.default_open : '0'))}
                                  onChange={e => patch({ content: { default_open: e.target.value }, schema: { default_open: e.target.value } })}
                                >
                                  <option value="0">Primeiro Item Aberto (#1)</option>
                                  <option value="none">Todos Fechados</option>
                                  <option value="all">Todos Abertos</option>
                                </select>
                              </ControlRow>
                            </ElementorAccordion>
                          </>
                        )
                      })()}

                        {/* WIDGET ELEMENTOR BÁSICO: ABAS (TABS) */}
                        {widgetType === 'tabs' && (() => {
                          const items: any[] = (Array.isArray(c.tabs) && c.tabs.length > 0)
                            ? c.tabs
                            : (Array.isArray(c.items) && c.items.length > 0)
                            ? c.items
                            : [
                                { title: 'Visão Geral', content: 'Desenvolvido para máxima durabilidade e performance industrial em qualquer trabalho.' },
                                { title: 'Especificações', content: 'Potência: 21V Max | Bateria: 4.0Ah Li-Ion | Mandril: 1/2" metálico | Peso: 1.6kg.' },
                                { title: 'Garantia', content: '12 meses de garantia oficial com suporte direto TEKNIX e troca expressa.' }
                              ]
                          const openIdx = openRepeaterIndex[selected] !== undefined ? openRepeaterIndex[selected] : 0

                          return (
                            <ElementorAccordion title="Abas de Conteúdo" icon={Layers} isOpen={openSections.reference_section_10 !== false} onToggle={() => toggleSection('reference_section_10')}>
                              <p style={{ fontSize: 11, color: '#a4afb7', margin: '0 0 12px' }}>
                                Adicione abas de navegação com seus respectivos conteúdos:
                              </p>

                              {items.map((item: any, idx: number) => (
                                <ElementorRepeaterItem
                                  key={idx}
                                  index={idx}
                                  title={item.title || item.text || item.label || `Aba #${idx + 1}`}
                                  isOpen={openIdx === idx}
                                  onToggle={() => setOpenRepeaterIndex(prev => ({ ...prev, [selected]: openIdx === idx ? -1 : idx }))}
                                  onDuplicate={() => {
                                    const next = [...items]
                                    next.splice(idx + 1, 0, { ...structuredClone(item), title: `${item.title || 'Aba'} (Cópia)` })
                                    patch({ content: { tabs: next, items: next } })
                                    setOpenRepeaterIndex(prev => ({ ...prev, [selected]: idx + 1 }))
                                  }}
                                  onDelete={() => {
                                    const next = items.filter((_, i) => i !== idx)
                                    patch({ content: { tabs: next, items: next } })
                                  }}
                                >
                                  <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#a4afb7', marginBottom: 4, display: 'block' }}>Título da Aba</label>
                                    <input
                                      type="text"
                                      placeholder="Ex: Especificações Técnicas"
                                      value={item.title || item.text || ''}
                                      style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 6, color: '#1d1d1f', fontSize: 12 }}
                                      onChange={e => {
                                        const next = [...items]
                                        next[idx] = { ...next[idx], title: e.target.value, text: e.target.value }
                                        patch({ content: { tabs: next, items: next } })
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#a4afb7', marginBottom: 4, display: 'block' }}>Conteúdo da Aba</label>
                                    <textarea
                                      rows={4}
                                      placeholder="Conteúdo exibido ao clicar nesta aba..."
                                      value={item.content || item.html || ''}
                                      style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 6, color: '#1d1d1f', fontSize: 12, resize: 'vertical' }}
                                      onChange={e => {
                                        const next = [...items]
                                        next[idx] = { ...next[idx], content: e.target.value, html: e.target.value }
                                        patch({ content: { tabs: next, items: next } })
                                      }}
                                    />
                                  </div>
                                </ElementorRepeaterItem>
                              ))}

                              <button
                                type="button"
                                style={{
                                  width: '100%',
                                  padding: '10px 14px',
                                  background: '#0071e3',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  marginTop: 4,
                                  boxShadow: '0 2px 6px rgba(0,113,227,0.3)'
                                }}
                                onClick={() => {
                                  const next = [...items, { title: 'Nova Aba', content: 'Conteúdo da nova aba.' }]
                                  patch({ content: { tabs: next, items: next } })
                                  setOpenRepeaterIndex(prev => ({ ...prev, [selected]: next.length - 1 }))
                                }}
                              >
                                <Plus size={14} /> Adicionar Nova Aba
                              </button>
                            </ElementorAccordion>
                          )
                        })()}

                        {/* WIDGET ELEMENTOR BÁSICO: CAIXA DE ÍCONE (ICON BOX) */}
                        {widgetType === 'iconBox' && (
                          <ElementorAccordion title="Caixa de Ícone" icon={Star} isOpen={openSections.reference_section_11 !== false} onToggle={() => toggleSection('reference_section_11')}>
                            <ControlRow label="Título">
                              <input type="text" value={String(c.title || '')} onChange={e => patch({ content: { title: e.target.value } })} />
                            </ControlRow>
                            <ControlRow label="Descrição">
                              <textarea rows={3} value={String(c.text || c.description || '')} onChange={e => patch({ content: { text: e.target.value, description: e.target.value } })} />
                            </ControlRow>
                            <ControlRow label="Nome do Ícone">
                              <input type="text" placeholder="star, shield, wrench..." value={String(c.icon || '')} onChange={e => patch({ content: { icon: e.target.value } })} />
                            </ControlRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Tamanho do Ícone">
                                <input type="number" min="16" max="96" value={Number(c.icon_size || 36)} onChange={e => patch({ content: { icon_size: Number(e.target.value) } })} />
                              </ControlRow>
                              <ControlRow label="Cor do Ícone">
                                <input type="color" value={String(c.icon_color || '#0071e3')} onChange={e => patch({ content: { icon_color: e.target.value } })} />
                              </ControlRow>
                            </div>
                            <ControlRow label="Posição do Ícone">
                              <select value={String(c.icon_position || 'top')} onChange={e => patch({ content: { icon_position: e.target.value } })}>
                                <option value="top">Topo</option>
                                <option value="left">Esquerda</option>
                                <option value="right">Direita</option>
                              </select>
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET ELEMENTOR BÁSICO: CAIXA DE IMAGEM (IMAGE BOX) */}
                        {widgetType === 'imageBox' && (
                          <ElementorAccordion title="Caixa de Imagem" icon={ImageIcon} isOpen={openSections.reference_section_12 !== false} onToggle={() => toggleSection('reference_section_12')}>
                            <ControlRow label="Imagem">
                              <ImageMediaControl value={String(c.image || c.url || '')} onChange={value => patch({ content: { image: value, url: value } })} />
                            </ControlRow>
                            <ControlRow label="Título">
                              <input type="text" value={String(c.title || '')} onChange={e => patch({ content: { title: e.target.value } })} />
                            </ControlRow>
                            <ControlRow label="Descrição">
                              <textarea rows={3} value={String(c.text || c.description || '')} onChange={e => patch({ content: { text: e.target.value, description: e.target.value } })} />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET ELEMENTOR BÁSICO: LISTA DE ÍCONES (ICON LIST) */}
                        {widgetType === 'iconList' && (() => {
                          const items: any[] = (Array.isArray(c.items) && c.items.length > 0)
                            ? c.items
                            : [
                                { text: 'Motor Brushless 21V de alto torque' },
                                { text: 'Bateria Íon-Lítio com autonomia estendida' },
                                { text: 'Mandril de aperto rápido metálico 1/2"' },
                                { text: 'Garantia oficial de 12 meses TEKNIX' }
                              ]
                          const openIdx = openRepeaterIndex[selected] !== undefined ? openRepeaterIndex[selected] : 0

                          return (
                            <ElementorAccordion title="Lista de Ícones" icon={List} isOpen={openSections.reference_section_13 !== false} onToggle={() => toggleSection('reference_section_13')}>
                              <p style={{ fontSize: 11, color: '#a4afb7', margin: '0 0 12px' }}>
                                Itens da lista com marcadores de verificação / ícone:
                              </p>

                              {items.map((item: any, idx: number) => {
                                const itemText = typeof item === 'string' ? item : item.text || item.title || ''
                                return (
                                  <ElementorRepeaterItem
                                    key={idx}
                                    index={idx}
                                    title={itemText || `Item #${idx + 1}`}
                                    isOpen={openIdx === idx}
                                    onToggle={() => setOpenRepeaterIndex(prev => ({ ...prev, [selected]: openIdx === idx ? -1 : idx }))}
                                    onDuplicate={() => {
                                      const next = [...items]
                                      next.splice(idx + 1, 0, typeof item === 'string' ? `${item} (Cópia)` : { ...structuredClone(item), text: `${itemText} (Cópia)` })
                                      patch({ content: { items: next } })
                                      setOpenRepeaterIndex(prev => ({ ...prev, [selected]: idx + 1 }))
                                    }}
                                    onDelete={() => {
                                      const next = items.filter((_, i) => i !== idx)
                                      patch({ content: { items: next } })
                                    }}
                                  >
                                    <div>
                                      <label style={{ fontSize: 11, fontWeight: 600, color: '#a4afb7', marginBottom: 4, display: 'block' }}>Texto do Item</label>
                                      <input
                                        type="text"
                                        placeholder="Ex: Motor Brushless de Alto Torque"
                                        value={itemText}
                                        style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 6, color: '#1d1d1f', fontSize: 12 }}
                                        onChange={e => {
                                          const next = [...items]
                                          next[idx] = typeof item === 'string' ? e.target.value : { ...next[idx], text: e.target.value }
                                          patch({ content: { items: next } })
                                        }}
                                      />
                                    </div>
                                  </ElementorRepeaterItem>
                                )
                              })}

                              <button
                                type="button"
                                style={{
                                  width: '100%',
                                  padding: '10px 14px',
                                  background: '#0071e3',
                                  color: '#fff',
                                  border: 'none',
                                  borderRadius: 6,
                                  fontSize: 12,
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  marginTop: 4,
                                  marginBottom: 12,
                                  boxShadow: '0 2px 6px rgba(0,113,227,0.3)'
                                }}
                                onClick={() => {
                                  const next = [...items, { text: 'Novo benefício ou recurso' }]
                                  patch({ content: { items: next } })
                                  setOpenRepeaterIndex(prev => ({ ...prev, [selected]: next.length - 1 }))
                                }}
                              >
                                <Plus size={14} /> Adicionar Novo Item
                              </button>

                              <ControlRow label="Cor do Marcador / Ícone">
                                <input type="color" value={String(c.icon_color || '#a2e000')} onChange={e => patch({ content: { icon_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                            </ElementorAccordion>
                          )
                        })()}

                        {/* WIDGET ELEMENTOR BÁSICO: DEPOIMENTO (TESTIMONIAL) */}
                        {widgetType === 'testimonial' && (
                          <ElementorAccordion title="Depoimento" icon={MessageSquare} isOpen={openSections.reference_section_14 !== false} onToggle={() => toggleSection('reference_section_14')}>
                            <ControlRow label="Citação / Depoimento">
                              <textarea rows={3} value={String(c.text || c.content || '')} onChange={e => patch({ content: { text: e.target.value, content: e.target.value } })} />
                            </ControlRow>
                            <ControlRow label="Nome do Autor">
                              <input type="text" value={String(c.name || c.author || '')} onChange={e => patch({ content: { name: e.target.value, author: e.target.value } })} />
                            </ControlRow>
                            <ControlRow label="Cargo / Empresa">
                              <input type="text" value={String(c.job || c.role || '')} onChange={e => patch({ content: { job: e.target.value, role: e.target.value } })} />
                            </ControlRow>
                            <ControlRow label="Foto do Autor (URL)">
                              <ImageMediaControl value={String(c.image || c.avatar || '')} onChange={value => patch({ content: { image: value, avatar: value } })} />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET ELEMENTOR BÁSICO: AVALIAÇÃO POR ESTRELAS */}
                        {(widgetType === 'starRating' || widgetType === 'rating') && (
                          <ElementorAccordion title="Avaliação por Estrelas" icon={Star} isOpen={openSections.reference_section_15 !== false} onToggle={() => toggleSection('reference_section_15')}>
                            <ControlRow label="Nota (0 a 5)">
                              <input type="number" min="0" max="5" step="0.1" value={Number(c.rating || 5)} onChange={e => patch({ content: { rating: Number(e.target.value) } })} />
                            </ControlRow>
                            <ControlRow label="Quantidade de Avaliações">
                              <input type="text" placeholder="Ex: 128" value={String(c.review_count || '')} onChange={e => patch({ content: { review_count: e.target.value } })} />
                            </ControlRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Cor das Estrelas">
                                <input type="color" value={String(c.star_color || '#f59e0b')} onChange={e => patch({ content: { star_color: e.target.value } })} />
                              </ControlRow>
                              <ControlRow label="Tamanho (px)">
                                <input type="number" min="12" max="48" value={Number(c.star_size || 18)} onChange={e => patch({ content: { star_size: Number(e.target.value) } })} />
                              </ControlRow>
                            </div>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET ELEMENTOR BÁSICO: ALERTA */}
                        {widgetType === 'alert' && (
                          <ElementorAccordion title="Caixa de Alerta / Aviso" icon={AlertCircle} isOpen={openSections.reference_section_16 !== false} onToggle={() => toggleSection('reference_section_16')}>
                            <ControlRow label="Tipo de Alerta">
                              <select value={String(c.alert_type || 'info')} onChange={e => patch({ content: { alert_type: e.target.value } })}>
                                <option value="info">Informativo (Azul)</option>
                                <option value="success">Sucesso (Verde)</option>
                                <option value="warning">Aviso / Atenção (Amarelo)</option>
                                <option value="error">Perigo / Erro (Vermelho)</option>
                              </select>
                            </ControlRow>
                            <ControlRow label="Título">
                              <input type="text" value={String(c.title || '')} onChange={e => patch({ content: { title: e.target.value } })} />
                            </ControlRow>
                            <ControlRow label="Descrição / Mensagem">
                              <textarea rows={3} value={String(c.description || c.text || '')} onChange={e => patch({ content: { description: e.target.value, text: e.target.value } })} />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET ELEMENTOR BÁSICO: ÍCONES SOCIAIS */}
                        {(widgetType === 'socialIcons' || widgetType === 'shareButtons') && (
                          <ElementorAccordion title="Ícones de Redes Sociais" icon={Share2} isOpen={openSections.reference_section_17 !== false} onToggle={() => toggleSection('reference_section_17')}>
                            <ControlRow label="Título / Rótulo">
                              <input type="text" value={String(c.title || 'Siga a TEKNIX')} onChange={e => patch({ content: { title: e.target.value } })} />
                            </ControlRow>
                            <p style={{ fontSize: 11, color: '#64748b', margin: '4px 0 8px' }}>
                              Redes ativas exibidas no widget:
                            </p>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                              {['facebook', 'instagram', 'youtube', 'whatsapp', 'linkedin', 'twitter'].map(net => {
                                const currentNets = Array.isArray(c.networks) ? c.networks : ['facebook', 'instagram', 'whatsapp']
                                const checked = currentNets.includes(net)
                                return (
                                  <label key={net} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', textTransform: 'capitalize' }}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={e => {
                                        let updated: string[]
                                        if (e.target.checked) updated = [...currentNets, net]
                                        else updated = currentNets.filter((n: string) => n !== net)
                                        patch({ content: { networks: updated } })
                                      }}
                                    />
                                    {net}
                                  </label>
                                )
                              })}
                            </div>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET: CABEÇALHO */}
                        {widgetType === 'chrome:header' && (
                          <>
                            <ElementorAccordion title="Logotipo da Loja" icon={ImageIcon} isOpen={openSections.reference_section_18 !== false} onToggle={() => toggleSection('reference_section_18')}>
                              <ControlRow label="URL da Imagem do Logo" description="Cole a URL ou use o botão para trocar">
                                <ImageMediaControl value={String(c.image || c.src || s.logo_url || '')}
                                  onChange={value => patch({ content: { image: value, src: value }, schema: { logo_url: value } })}
                                />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Altura do Logo (px)">
                                  <input
                                    type="number"
                                    min="16"
                                    max="120"
                                    placeholder="26"
                                    value={Number(s.logo_height || 26)}
                                    onChange={e => patch({ schema: { logo_height: Number(e.target.value) } })}
                                  />
                                </ControlRow>
                                <ControlRow label="Largura (opcional)">
                                  <input
                                    type="text"
                                    placeholder="auto"
                                    value={String(s.logo_width || '')}
                                    onChange={e => patch({ schema: { logo_width: e.target.value } })}
                                  />
                                </ControlRow>
                              </div>
                              <ControlRow label="Link do Logo">
                                <input
                                  type="text"
                                  placeholder="/"
                                  value={String(c.link || '/')}
                                  onChange={e => patch({ content: { link: e.target.value } })}
                                />
                              </ControlRow>
                              <button
                                type="button"
                                onClick={() => setEditingImage(true)}
                                style={{ width: '100%', padding: '8px 12px', background: '#f5f5f7', border: '1px solid #d2d2d7', color: '#1d1d1f', borderRadius: 6, fontSize: 12, cursor: 'pointer', marginTop: 6 }}
                              >
                                Carregar Imagem de Logo
                              </button>
                            </ElementorAccordion>

                            <ElementorAccordion title="Elementos Visíveis do Cabeçalho" icon={Sliders} isOpen={openSections.reference_section_19 !== false} onToggle={() => toggleSection('reference_section_19')}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={!s.hide_search}
                                    onChange={e => patch({ schema: { hide_search: !e.target.checked } })}
                                  />
                                  Exibir Barra de Busca
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={!s.hide_cep}
                                    onChange={e => patch({ schema: { hide_cep: !e.target.checked } })}
                                  />
                                  Exibir Seletor de CEP
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={!s.hide_account}
                                    onChange={e => patch({ schema: { hide_account: !e.target.checked } })}
                                  />
                                  Exibir Acesso à Conta
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={!s.hide_favorites}
                                    onChange={e => patch({ schema: { hide_favorites: !e.target.checked } })}
                                  />
                                  Exibir Favoritos
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={!s.hide_cart}
                                    onChange={e => patch({ schema: { hide_cart: !e.target.checked } })}
                                  />
                                  Exibir Carrinho / Sacola
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                                  <input
                                    type="checkbox"
                                    checked={!s.hide_top_line}
                                    onChange={e => patch({ schema: { hide_top_line: !e.target.checked } })}
                                  />
                                  Exibir Linha de Destaque Superior
                                </label>
                              </div>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* WIDGET: RODAPÉ */}
                        {widgetType === 'chrome:footer' && (
                          <>
                            <ElementorAccordion title="Canais de Atendimento" icon={FileText} isOpen={openSections.reference_section_20 !== false} onToggle={() => toggleSection('reference_section_20')}>
                              <ControlRow label="WhatsApp de Vendas">
                                <input
                                  type="text"
                                  placeholder="(46) 99915-5875"
                                  value={String(c.whatsapp || '')}
                                  onChange={e => patch({ content: { whatsapp: e.target.value } })}
                                />
                              </ControlRow>
                              <ControlRow label="E-mail de Suporte">
                                <input
                                  type="email"
                                  placeholder="sac@teknix.com.br"
                                  value={String(c.email || '')}
                                  onChange={e => patch({ content: { email: e.target.value } })}
                                />
                              </ControlRow>
                            </ElementorAccordion>

                            <ElementorAccordion title="Informações da Empresa e Copyright" icon={Sliders} isOpen={openSections.reference_section_21 !== false} onToggle={() => toggleSection('reference_section_21')}>
                              <ControlRow label="Razão Social / CNPJ">
                                <input
                                  type="text"
                                  placeholder="TEKNIX FERRAMENTAS LTDA • CNPJ: 63.623.515/0001-68"
                                  value={String(c.company_info || '')}
                                  onChange={e => patch({ content: { company_info: e.target.value } })}
                                />
                              </ControlRow>
                              <ControlRow label="Texto de Copyright">
                                <input
                                  type="text"
                                  placeholder="Todos os direitos reservados."
                                  value={String(c.copyright || '')}
                                  onChange={e => patch({ content: { copyright: e.target.value } })}
                                />
                              </ControlRow>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* WIDGET: GOOGLE MAPS */}
                        {(widgetType === 'googleMaps' || widgetType === 'googleMapsPro' || widgetType === 'google-maps') && (
                          <ElementorAccordion title="Google Maps" icon={MapPin} isOpen={openSections.reference_section_22 !== false} onToggle={() => toggleSection('reference_section_22')}>
                            <ControlRow label="Endereço / Localização" description="Digite a cidade, rua, CEP ou local para o mapa">
                              <input
                                type="text"
                                placeholder="Av. Paulista, 1000 - Bela Vista, São Paulo - SP"
                                value={String(c.address || '')}
                                onChange={e => patch({ content: { address: e.target.value } })}
                              />
                            </ControlRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Nível de Zoom (1-20)">
                                <input
                                  type="number"
                                  min="1"
                                  max="20"
                                  value={Number(c.zoom || 15)}
                                  onChange={e => patch({ content: { zoom: Number(e.target.value) } })}
                                />
                              </ControlRow>
                              <ControlRow label="Altura do Mapa (px)">
                                <input
                                  type="number"
                                  min="150"
                                  max="800"
                                  value={Number(c.height || 350)}
                                  onChange={e => patch({ content: { height: Number(e.target.value) } })}
                                />
                              </ControlRow>
                            </div>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET: GALERIA E CARROSSEL DE IMAGENS */}
                        {(widgetType === 'gallery' || widgetType === 'basicGallery' || widgetType === 'imageCarousel' || widgetType === 'carousel') && (() => {
                          const images: string[] = Array.isArray(c.images) ? c.images.map((img: any) => typeof img === 'string' ? img : img.image || img.url || '') : []
                          return (
                            <ElementorAccordion title={widgetType.toLowerCase().includes('carousel') ? 'Carrossel de Imagens' : 'Galeria de Imagens'} icon={ImageIcon} isOpen={openSections.reference_section_23 !== false} onToggle={() => toggleSection('reference_section_23')}>
                              <p style={{ fontSize: 11, color: '#6e6e73', margin: '0 0 10px' }}>
                                Gerencie as imagens exibidas na {widgetType.toLowerCase().includes('carousel') ? 'apresentação' : 'galeria'}:
                              </p>
                              {images.map((imgUrl, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, background: '#f5f5f7', padding: 6, borderRadius: 8, border: '1px solid #e5e5ea' }}>
                                  <ImageMediaControl value={imgUrl} onChange={url => { const next = [...images]; next[idx] = url; patch({ content: { images: next } }) }} />
                                  <button
                                    type="button"
                                    style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4 }}
                                    onClick={() => {
                                      const next = images.filter((_, i) => i !== idx)
                                      patch({ content: { images: next } })
                                    }}
                                    title="Remover imagem"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                style={{ width: '100%', padding: '8px 12px', background: '#0071e3', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4, marginBottom: 12 }}
                                onClick={() => {
                                  const next = [...images, '']
                                  patch({ content: { images: next } })
                                }}
                              >
                                <Plus size={14} /> Adicionar Imagem à Galeria
                              </button>

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Colunas">
                                  <input
                                    type="number"
                                    min="1"
                                    max="6"
                                    value={Number(c.columns || 3)}
                                    onChange={e => patch({ content: { columns: Number(e.target.value) } })}
                                  />
                                </ControlRow>
                                <ControlRow label="Espaçamento (Gap px)">
                                  <input
                                    type="number"
                                    min="0"
                                    max="48"
                                    value={Number(c.gap || 16)}
                                    onChange={e => patch({ content: { gap: Number(e.target.value) } })}
                                  />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>
                          )
                        })()}

                        {/* WIDGET: LISTA DE PREÇOS */}
                        {(widgetType === 'priceList' || widgetType === 'priceListPro') && (() => {
                          const items: any[] = Array.isArray(c.items) && c.items.length > 0
                            ? c.items
                            : [
                                { name: 'Parafusadeira Brushless 21V', label: 'Parafusadeira Brushless 21V', price: 'R$ 489,90', description: 'Mandril 1/2", 2 baterias 4.0Ah e maleta rígida.' },
                                { name: 'Jogo de Brocas Titânio 13 Peças', label: 'Jogo de Brocas Titânio 13 Peças', price: 'R$ 79,90', description: 'Brocas de alta resistência para metal e alvenaria.' },
                                { name: 'Esmerilhadeira Angular 900W', label: 'Esmerilhadeira Angular 900W', price: 'R$ 329,00', description: 'Disco de 4.1/2" com punho auxiliar antivibração.' }
                              ]
                          const openIdx = openRepeaterIndex[selected] !== undefined ? openRepeaterIndex[selected] : 0

                          return (
                            <ElementorAccordion title="Lista de Preços" icon={List} isOpen={openSections.reference_section_24 !== false} onToggle={() => toggleSection('reference_section_24')}>
                              <ControlRow label="Título da Lista">
                                <input
                                  type="text"
                                  value={String(c.title || 'Lista de Preços TEKNIX')}
                                  onChange={e => patch({ content: { title: e.target.value } })}
                                />
                              </ControlRow>

                              <p style={{ fontSize: 11, color: '#a4afb7', margin: '8px 0 10px' }}>Itens com valores e especificações:</p>

                              {items.map((item: any, idx: number) => (
                                <ElementorRepeaterItem
                                  key={idx}
                                  index={idx}
                                  title={item.name || item.label || `Item #${idx + 1}`}
                                  isOpen={openIdx === idx}
                                  onToggle={() => setOpenRepeaterIndex(prev => ({ ...prev, [selected]: openIdx === idx ? -1 : idx }))}
                                  onDuplicate={() => {
                                    const next = [...items]
                                    next.splice(idx + 1, 0, { ...structuredClone(item), name: `${item.name || 'Item'} (Cópia)` })
                                    patch({ content: { items: next } })
                                    setOpenRepeaterIndex(prev => ({ ...prev, [selected]: idx + 1 }))
                                  }}
                                  onDelete={() => {
                                    const next = items.filter((_, i) => i !== idx)
                                    patch({ content: { items: next } })
                                  }}
                                >
                                  <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#a4afb7', marginBottom: 4, display: 'block' }}>Nome do Item</label>
                                    <input
                                      type="text"
                                      value={item.name || item.label || ''}
                                      placeholder="Ex: Parafusadeira Brushless"
                                      style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 6, color: '#1d1d1f', fontSize: 12 }}
                                      onChange={e => {
                                        const next = [...items]
                                        next[idx] = { ...next[idx], name: e.target.value, label: e.target.value }
                                        patch({ content: { items: next } })
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#a4afb7', marginBottom: 4, display: 'block' }}>Preço</label>
                                    <input
                                      type="text"
                                      value={item.price || ''}
                                      placeholder="Ex: R$ 489,90"
                                      style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 6, color: '#1d1d1f', fontSize: 12 }}
                                      onChange={e => {
                                        const next = [...items]
                                        next[idx] = { ...next[idx], price: e.target.value }
                                        patch({ content: { items: next } })
                                      }}
                                    />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 11, fontWeight: 600, color: '#a4afb7', marginBottom: 4, display: 'block' }}>Descrição</label>
                                    <textarea
                                      rows={2}
                                      value={item.description || ''}
                                      placeholder="Detalhes ou especificações..."
                                      style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 6, color: '#1d1d1f', fontSize: 12 }}
                                      onChange={e => {
                                        const next = [...items]
                                        next[idx] = { ...next[idx], description: e.target.value }
                                        patch({ content: { items: next } })
                                      }}
                                    />
                                  </div>
                                </ElementorRepeaterItem>
                              ))}

                              <button
                                type="button"
                                style={{ width: '100%', padding: '10px 14px', background: '#0071e3', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}
                                onClick={() => {
                                  const next = [...items, { name: 'Novo Equipamento TEKNIX', label: 'Novo Equipamento TEKNIX', price: 'R$ 199,00', description: 'Alta durabilidade e garantia oficial.' }]
                                  patch({ content: { items: next } })
                                  setOpenRepeaterIndex(prev => ({ ...prev, [selected]: next.length - 1 }))
                                }}
                              >
                                <Plus size={14} /> Adicionar Novo Item à Lista
                              </button>
                            </ElementorAccordion>
                          )
                        })()}

                        {/* WIDGET: FORMULÁRIO */}
                        {(widgetType === 'form' || widgetType === 'formPro' || widgetType === 'form-pro') && (
                          <ElementorAccordion title="Formulário TEKNIX" icon={ClipboardList} isOpen={openSections.reference_section_25 !== false} onToggle={() => toggleSection('reference_section_25')}>
                            <ControlRow label="Título do Formulário">
                              <input
                                type="text"
                                value={String(c.title || 'Fale com a TEKNIX')}
                                onChange={e => patch({ content: { title: e.target.value } })}
                              />
                            </ControlRow>
                            <ControlRow label="Subtítulo / Instruções">
                              <textarea
                                rows={2}
                                value={String(c.subtitle || '')}
                                onChange={e => patch({ content: { subtitle: e.target.value } })}
                              />
                            </ControlRow>
                            <ControlRow label="Texto do Botão de Envio">
                              <input
                                type="text"
                                value={String(c.button_text || c.submit_label || 'Enviar Mensagem')}
                                onChange={e => patch({ content: { button_text: e.target.value, submit_label: e.target.value } })}
                              />
                            </ControlRow>
                            <ControlRow label="Exibir Rótulos dos Campos">
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={c.show_labels !== false}
                                  onChange={e => patch({ content: { show_labels: e.target.checked } })}
                                />
                                Exibir nomes acima de cada campo
                              </label>
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET: LOGIN */}
                        {(widgetType === 'login' || widgetType === 'loginPro' || widgetType === 'login-pro') && (
                          <ElementorAccordion title="Acesso do Cliente (Login)" icon={Lock} isOpen={openSections.reference_section_26 !== false} onToggle={() => toggleSection('reference_section_26')}>
                            <ControlRow label="Título da Área de Login">
                              <input
                                type="text"
                                value={String(c.title || 'Acesse sua Conta TEKNIX')}
                                onChange={e => patch({ content: { title: e.target.value } })}
                              />
                            </ControlRow>
                            <ControlRow label="Subtítulo">
                              <textarea
                                rows={2}
                                value={String(c.subtitle || 'Entre com seu e-mail e senha para acompanhar seus pedidos e orçamentos.')}
                                onChange={e => patch({ content: { subtitle: e.target.value } })}
                              />
                            </ControlRow>
                            <ControlRow label="Texto do Botão de Login">
                              <input
                                type="text"
                                value={String(c.submit_label || 'Entrar')}
                                onChange={e => patch({ content: { submit_label: e.target.value } })}
                              />
                            </ControlRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Link de Cadastro">
                                <input
                                  type="text"
                                  value={String(c.register_link || '/cadastro')}
                                  onChange={e => patch({ content: { register_link: e.target.value } })}
                                />
                              </ControlRow>
                              <ControlRow label="Esqueci Minha Senha">
                                <input
                                  type="text"
                                  value={String(c.forgot_link || '/recuperar-senha')}
                                  onChange={e => patch({ content: { forgot_link: e.target.value } })}
                                />
                              </ControlRow>
                            </div>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET: PUBLICAÇÕES E PORTFÓLIO */}
                        {(widgetType === 'posts' || widgetType === 'postsCarousel' || widgetType === 'portfolio') && (
                          <ElementorAccordion title="Publicações e Portfólio" icon={Layers} isOpen={openSections.reference_section_27 !== false} onToggle={() => toggleSection('reference_section_27')}>
                            <ControlRow label="Título da Seção">
                              <input
                                type="text"
                                value={String(c.title || 'Últimas Publicações TEKNIX')}
                                onChange={e => patch({ content: { title: e.target.value } })}
                              />
                            </ControlRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Quantidade de Itens">
                                <input
                                  type="number"
                                  min="1"
                                  max="12"
                                  value={Number(c.count || c.limit || 3)}
                                  onChange={e => patch({ content: { count: Number(e.target.value), limit: Number(e.target.value) } })}
                                />
                              </ControlRow>
                              <ControlRow label="Número de Colunas">
                                <input
                                  type="number"
                                  min="1"
                                  max="4"
                                  value={Number(c.columns || 3)}
                                  onChange={e => patch({ content: { columns: Number(e.target.value) } })}
                                />
                              </ControlRow>
                            </div>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET: APRESENTAÇÃO DE SLIDES */}
                        {widgetType === 'slides' && <ElementorAccordion title="Slides" isOpen={openSections.c_slides !== false} onToggle={() => toggleSection('c_slides')}>
                          <SlideItemsControl content={c} onChange={content => patch({ content })} />
                          <ElementorSliderControl label="Altura" value={c.height ?? 400} min={100} max={1000} onChange={height => patch({ content: { height } })} />
                        </ElementorAccordion>}

                        {/* WIDGET: MENU DE NAVEGAÇÃO */}
                        {(widgetType === 'navMenu' || widgetType === 'megaMenu') && (() => {
                          const items: any[] = Array.isArray(c.items) && c.items.length > 0
                            ? c.items
                            : [
                                { label: 'Início', url: '/' },
                                { label: 'Ferramentas', url: '/ferramentas' },
                                { label: 'Máquinas', url: '/maquinas' },
                                { label: 'Acessórios', url: '/acessorios' },
                                { label: 'Suporte', url: '/suporte' }
                              ]
                          const openIdx = openRepeaterIndex[selected] !== undefined ? openRepeaterIndex[selected] : 0

                          return (
                            <ElementorAccordion title="Menu de Navegação" icon={Menu} isOpen={openSections.reference_section_28 !== false} onToggle={() => toggleSection('reference_section_28')}>
                              <ControlRow label="Título do Menu">
                                <input
                                  type="text"
                                  value={String(c.title || 'Menu Principal')}
                                  onChange={e => patch({ content: { title: e.target.value } })}
                                />
                              </ControlRow>
                              <p style={{ fontSize: 11, color: '#a4afb7', margin: '8px 0 10px' }}>Links de navegação do site:</p>
                              {items.map((item: any, idx: number) => {
                                const itemLabel = typeof item === 'string' ? item : item.label || item.text || `Link #${idx + 1}`
                                const itemUrl = typeof item === 'string' ? '#' : item.url || item.link || '#'
                                return (
                                  <ElementorRepeaterItem
                                    key={idx}
                                    index={idx}
                                    title={itemLabel}
                                    isOpen={openIdx === idx}
                                    onToggle={() => setOpenRepeaterIndex(prev => ({ ...prev, [selected]: openIdx === idx ? -1 : idx }))}
                                    onDuplicate={() => {
                                      const next = [...items]
                                      next.splice(idx + 1, 0, { label: `${itemLabel} (Cópia)`, url: itemUrl })
                                      patch({ content: { items: next } })
                                      setOpenRepeaterIndex(prev => ({ ...prev, [selected]: idx + 1 }))
                                    }}
                                    onDelete={() => {
                                      const next = items.filter((_, i) => i !== idx)
                                      patch({ content: { items: next } })
                                    }}
                                  >
                                    <div>
                                      <label style={{ fontSize: 11, fontWeight: 600, color: '#a4afb7', marginBottom: 4, display: 'block' }}>Rótulo do Link</label>
                                      <input
                                        type="text"
                                        value={itemLabel}
                                        style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 6, color: '#1d1d1f', fontSize: 12 }}
                                        onChange={e => {
                                          const next = [...items]
                                          next[idx] = typeof item === 'string' ? { label: e.target.value, url: '#' } : { ...next[idx], label: e.target.value }
                                          patch({ content: { items: next } })
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: 11, fontWeight: 600, color: '#a4afb7', marginBottom: 4, display: 'block' }}>URL / Destino</label>
                                      <input
                                        type="text"
                                        value={itemUrl}
                                        style={{ width: '100%', padding: '7px 10px', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 6, color: '#1d1d1f', fontSize: 12 }}
                                        onChange={e => {
                                          const next = [...items]
                                          next[idx] = typeof item === 'string' ? { label: item, url: e.target.value } : { ...next[idx], url: e.target.value }
                                          patch({ content: { items: next } })
                                        }}
                                      />
                                    </div>
                                  </ElementorRepeaterItem>
                                )
                              })}
                              <button
                                type="button"
                                style={{ width: '100%', padding: '10px 14px', background: '#0071e3', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}
                                onClick={() => {
                                  const next = [...items, { label: 'Novo Link', url: '/novo-link' }]
                                  patch({ content: { items: next } })
                                  setOpenRepeaterIndex(prev => ({ ...prev, [selected]: next.length - 1 }))
                                }}
                              >
                                <Plus size={14} /> Adicionar Novo Link ao Menu
                              </button>
                            </ElementorAccordion>
                          )
                        })()}

                        {/* WIDGET: MOSAICO DE CATEGORIAS */}
                        {widgetType === 'categoryMosaic' && (() => {
                          const rawItems = Array.isArray(c.items) && c.items.length > 0 ? c.items : ((initialWidgetContent('categoryMosaic') as any).items || [])
                          const updateItems = (newItems: any[]) => patch({ content: { items: newItems } })
                          const updateItem = (index: number, changes: any) => {
                            const updated = rawItems.map((it: any, i: number) => i === index ? { ...it, ...changes } : it)
                            updateItems(updated)
                          }
                          const moveItem = (index: number, dir: -1 | 1) => {
                            const targetIdx = index + dir
                            if (targetIdx < 0 || targetIdx >= rawItems.length) return
                            const copy = [...rawItems]
                            const temp = copy[index]
                            copy[index] = copy[targetIdx]
                            copy[targetIdx] = temp
                            updateItems(copy)
                          }
                          const duplicateItem = (index: number) => {
                            const copy = [...rawItems]
                            copy.splice(index + 1, 0, { ...rawItems[index], name: `${rawItems[index].name || 'Item'} (Cópia)` })
                            updateItems(copy)
                          }
                          const deleteItem = (index: number) => {
                            if (rawItems.length <= 1) return
                            updateItems(rawItems.filter((_: any, i: number) => i !== index))
                          }
                          const addItem = () => {
                            updateItems([
                              ...rawItems,
                              {
                                name: 'Nova Categoria',
                                link: '/produtos',
                                bgType: 'normal',
                                iconUrl: '',
                                is_cutout: true
                              }
                            ])
                          }

                          return (
                            <>
                              {/* 1. SEÇÃO DE CARDS / CATEGORIAS (REPEATER) */}
                              <ElementorAccordion title={`Cards de Categoria (${rawItems.length})`} icon={Grid} isOpen={openSections.mosaic_items !== false} onToggle={() => toggleSection('mosaic_items')}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                  {rawItems.map((item: any, idx: number) => {
                                    const isPromo = item.bgType === 'promo'
                                    const itemImage = item.iconUrl || item.image || item.src || ''

                                    // Preview visual no cabeçalho do card
                                    const previewNode = isPromo ? (
                                      <div style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 6,
                                        background: item.promoBg || '#22c55e',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#ffffff',
                                        fontSize: 8,
                                        fontWeight: 800,
                                        lineHeight: 1,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                                        overflow: 'hidden',
                                        padding: 1,
                                        flexShrink: 0
                                      }}>
                                        <span style={{ fontSize: 7.5, fontWeight: 900, whiteSpace: 'nowrap' }}>{item.badge || '%'}</span>
                                        {item.badgeSub && <span style={{ fontSize: 6.5, fontWeight: 800, textTransform: 'uppercase', opacity: 0.9 }}>{item.badgeSub}</span>}
                                      </div>
                                    ) : (
                                      <div style={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: 6,
                                        background: '#f5f5f7',
                                        border: '1px solid #e5e5ea',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden',
                                        flexShrink: 0
                                      }}>
                                        {itemImage ? (
                                          <img
                                            src={itemImage}
                                            alt={item.name || ''}
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                            onError={(e) => {
                                              const target = e.currentTarget
                                              if (!target.dataset.triedFallback && target.src.startsWith(window.location.origin)) {
                                                target.dataset.triedFallback = 'true'
                                                target.src = target.src.replace(window.location.origin, 'https://www.teknixbrasil.com.br')
                                              }
                                            }}
                                          />
                                        ) : (
                                          <ImageIcon size={13} color="#a1a1a6" />
                                        )}
                                      </div>
                                    )

                                    const badgeNode = isPromo ? (
                                      <span style={{ fontSize: 9, fontWeight: 700, background: '#e6f7ed', color: '#15803d', padding: '1px 5px', borderRadius: 4, letterSpacing: '0.3px' }}>
                                        PROMO
                                      </span>
                                    ) : (
                                      <span style={{ fontSize: 9, fontWeight: 600, background: '#f5f5f7', color: '#86868b', padding: '1px 5px', borderRadius: 4 }}>
                                        CARD
                                      </span>
                                    )

                                    const subtitleText = isPromo
                                      ? (item.badgeSub ? `${item.badge || ''} ${item.badgeSub}` : 'Selo Promocional')
                                      : (item.link || '/produtos')

                                    return (
                                      <ElementorRepeaterItem
                                        key={idx}
                                        index={idx}
                                        title={item.name || (isPromo ? 'Selo Promocional' : `Categoria #${idx + 1}`)}
                                        subtitle={subtitleText}
                                        preview={previewNode}
                                        badge={badgeNode}
                                        isOpen={openSections[`mosaic_item_${idx}`] === true}
                                        onToggle={() => toggleSection(`mosaic_item_${idx}`)}
                                        onDuplicate={() => duplicateItem(idx)}
                                        onDelete={() => deleteItem(idx)}
                                        onMoveUp={() => moveItem(idx, -1)}
                                        onMoveDown={() => moveItem(idx, 1)}
                                        canMoveUp={idx > 0}
                                        canMoveDown={idx < rawItems.length - 1}
                                      >
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                          {/* Seletor Segmentado de Tipo de Card */}
                                          <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr',
                                            gap: 4,
                                            background: '#f0f0f2',
                                            padding: 3,
                                            borderRadius: 8
                                          }}>
                                            <button
                                              type="button"
                                              onClick={() => updateItem(idx, { bgType: 'normal' })}
                                              style={{
                                                padding: '6px 10px',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                border: 'none',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 6,
                                                background: !isPromo ? '#ffffff' : 'transparent',
                                                color: !isPromo ? '#0071e3' : '#6e6e73',
                                                boxShadow: !isPromo ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                                transition: 'all 0.15s ease'
                                              }}
                                            >
                                              <ImageIcon size={13} /> Foto / Imagem
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => updateItem(idx, { bgType: 'promo' })}
                                              style={{
                                                padding: '6px 10px',
                                                fontSize: 11,
                                                fontWeight: 600,
                                                border: 'none',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: 6,
                                                background: isPromo ? '#ffffff' : 'transparent',
                                                color: isPromo ? '#0071e3' : '#6e6e73',
                                                boxShadow: isPromo ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                                transition: 'all 0.15s ease'
                                              }}
                                            >
                                              <Tag size={13} /> Selo Promo
                                            </button>
                                          </div>

                                          <ControlRow label="Nome / Rótulo do Card">
                                            <input
                                              type="text"
                                              placeholder="Ex: Macaco, Parafusadeira, Use: DESCONTO"
                                              value={String(item.name || '')}
                                              onChange={e => updateItem(idx, { name: e.target.value })}
                                            />
                                          </ControlRow>

                                          <ControlRow label="Link de Destino (URL)">
                                            <input
                                              type="text"
                                              placeholder="Ex: /produtos?q=ferramenta ou https://..."
                                              value={String(item.link || '')}
                                              onChange={e => updateItem(idx, { link: e.target.value })}
                                            />
                                          </ControlRow>

                                          {!isPromo ? (
                                            <>
                                              <ControlRow label="Foto / Imagem do Card">
                                                <ImageMediaControl
                                                  value={String(item.iconUrl || item.image || item.src || '')}
                                                  onChange={url => updateItem(idx, { iconUrl: url, image: url })}
                                                />
                                              </ControlRow>
                                              <ControlRow label="Ou URL Direta da Imagem">
                                                <input
                                                  type="text"
                                                  placeholder="https://... ou /images/..."
                                                  value={String(item.iconUrl || item.image || item.src || '')}
                                                  onChange={e => updateItem(idx, { iconUrl: e.target.value, image: e.target.value })}
                                                />
                                              </ControlRow>
                                              <label style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                padding: '8px 12px',
                                                background: '#ffffff',
                                                border: '1px solid #e5e5ea',
                                                borderRadius: 8,
                                                cursor: 'pointer',
                                                margin: '2px 0'
                                              }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                  <span style={{ fontSize: 11, fontWeight: 600, color: '#1d1d1f' }}>Efeito 3D Recortado (Cutout)</span>
                                                  <span style={{ fontSize: 10, color: '#86868b' }}>Remove fundo e destaca a foto com sombra</span>
                                                </div>
                                                <input
                                                  type="checkbox"
                                                  checked={item.is_cutout !== false}
                                                  onChange={e => updateItem(idx, { is_cutout: e.target.checked })}
                                                  style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#0071e3' }}
                                                />
                                              </label>
                                            </>
                                          ) : (
                                            <>
                                              {/* Prévia ao vivo do Selo Promocional */}
                                              <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: '10px 12px',
                                                background: '#ffffff',
                                                border: '1px solid #e5e5ea',
                                                borderRadius: 8
                                              }}>
                                                <div style={{
                                                  width: 48,
                                                  height: 48,
                                                  borderRadius: 10,
                                                  background: item.promoBg || '#22c55e',
                                                  display: 'flex',
                                                  flexDirection: 'column',
                                                  alignItems: 'center',
                                                  justifyContent: 'center',
                                                  color: '#ffffff',
                                                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                                                  flexShrink: 0
                                                }}>
                                                  <span style={{ fontSize: 11, fontWeight: 800, lineHeight: 1.1 }}>{item.badge || 'até 20%'}</span>
                                                  <span style={{ fontSize: 9, fontWeight: 900, textTransform: 'uppercase', opacity: 0.9 }}>{item.badgeSub || 'OFF'}</span>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                  <span style={{ fontSize: 12, fontWeight: 600, color: '#1d1d1f' }}>Prévia do Selo Promocional</span>
                                                  <span style={{ fontSize: 10, color: '#86868b' }}>Exibido com destaque no mosaico</span>
                                                </div>
                                              </div>

                                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                                <ControlRow label="Selo Principal">
                                                  <input
                                                    type="text"
                                                    placeholder="Ex: até 20%"
                                                    value={String(item.badge || '')}
                                                    onChange={e => updateItem(idx, { badge: e.target.value })}
                                                  />
                                                </ControlRow>
                                                <ControlRow label="Sub-selo">
                                                  <input
                                                    type="text"
                                                    placeholder="Ex: OFF"
                                                    value={String(item.badgeSub || '')}
                                                    onChange={e => updateItem(idx, { badgeSub: e.target.value })}
                                                  />
                                                </ControlRow>
                                              </div>
                                              <ControlRow label="Cor de Fundo do Card Promo">
                                                <input
                                                  type="color"
                                                  value={String(item.promoBg || '#22c55e')}
                                                  onChange={e => updateItem(idx, { promoBg: e.target.value })}
                                                />
                                              </ControlRow>
                                            </>
                                          )}
                                        </div>
                                      </ElementorRepeaterItem>
                                    )
                                  })}

                                  <button
                                    type="button"
                                    onClick={addItem}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 8,
                                      padding: '11px 16px',
                                      background: '#f0f7ff',
                                      color: '#0071e3',
                                      border: '1.5px dashed #0071e3',
                                      borderRadius: 8,
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      marginTop: 6,
                                      transition: 'all 0.2s ease',
                                      width: '100%'
                                    }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.background = '#0071e3'
                                      e.currentTarget.style.color = '#ffffff'
                                      e.currentTarget.style.borderStyle = 'solid'
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.background = '#f0f7ff'
                                      e.currentTarget.style.color = '#0071e3'
                                      e.currentTarget.style.borderStyle = 'dashed'
                                    }}
                                  >
                                    <Plus size={15} /> Adicionar Nova Categoria / Card
                                  </button>
                                </div>
                              </ElementorAccordion>

                              {/* 2. FORMATO & APARÊNCIA DOS CARDS */}
                              <ElementorAccordion title="Formato & Exibição dos Cards" icon={SlidersHorizontal} isOpen={openSections.mosaic_layout !== false} onToggle={() => toggleSection('mosaic_layout')}>
                                <ControlRow label="Formato dos Cards">
                                  <select
                                    value={String(c.card_shape || 'rounded')}
                                    onChange={e => patch({ content: { card_shape: e.target.value } })}
                                  >
                                    <option value="rounded">Bordas Arredondadas (20px)</option>
                                    <option value="circle">Círculo Completo (100% redondo)</option>
                                    <option value="square">Cantos Suaves (8px)</option>
                                  </select>
                                </ControlRow>

                                <ControlRow label="Tamanho dos Cards (px)">
                                  <input
                                    type="number"
                                    min="60"
                                    max="160"
                                    step="5"
                                    value={Number(c.card_size || 90)}
                                    onChange={e => patch({ content: { card_size: Number(e.target.value) } })}
                                  />
                                </ControlRow>

                                <label className="editor-toggle-row">
                                  Exibir Setas de Navegação (‹ ›)
                                  <input
                                    type="checkbox"
                                    checked={c.show_arrows !== false}
                                    onChange={e => patch({ content: { show_arrows: e.target.checked } })}
                                  />
                                </label>

                                <label className="editor-toggle-row">
                                  Exibir Título Superior da Seção
                                  <input
                                    type="checkbox"
                                    checked={Boolean(c.show_section_title)}
                                    onChange={e => patch({ content: { show_section_title: e.target.checked } })}
                                  />
                                </label>

                                {Boolean(c.show_section_title) && (
                                  <>
                                    <ControlRow label="Título da Seção">
                                      <input
                                        type="text"
                                        value={String(c.title || 'Categorias em Destaque')}
                                        onChange={e => patch({ content: { title: e.target.value } })}
                                      />
                                    </ControlRow>
                                    <ControlRow label="Subtítulo">
                                      <textarea
                                        rows={2}
                                        value={String(c.subtitle || 'Navegue pelas principais linhas e encontre a ferramenta certa para sua necessidade.')}
                                        onChange={e => patch({ content: { subtitle: e.target.value } })}
                                      />
                                    </ControlRow>
                                  </>
                                )}
                              </ElementorAccordion>
                            </>
                          )
                        })()}

                        {/* WIDGET: OFERTA RELÂMPAGO */}
                        {widgetType === 'flashSaleSection' && (
                          <>
                            {/* 1. CABEÇALHO & RAIO */}
                            <ElementorAccordion title="Cabeçalho & Ícone de Raio" icon={Zap} isOpen={openSections.reference_section_30 !== false} onToggle={() => toggleSection('reference_section_30')}>
                              <ControlRow label="Título da Seção">
                                <input
                                  type="text"
                                  value={String(c.title || 'Ofertas Relâmpago')}
                                  onChange={e => patch({ content: { title: e.target.value } })}
                                />
                              </ControlRow>
                              <ControlRow label="Subtítulo (Opcional)">
                                <textarea
                                  rows={2}
                                  placeholder="Subtítulo descritivo da oferta"
                                  value={String(c.subtitle || '')}
                                  onChange={e => patch({ content: { subtitle: e.target.value } })}
                                />
                              </ControlRow>
                              <label className="editor-toggle-row">
                                Exibir Ícone do Raio
                                <input
                                  type="checkbox"
                                  checked={c.show_bolt !== false}
                                  onChange={e => patch({ content: { show_bolt: e.target.checked } })}
                                />
                              </label>
                              {c.show_bolt !== false && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                  <ControlRow label="Cor do Raio">
                                    <input
                                      type="color"
                                      value={String(c.bolt_color || '#dc2626')}
                                      onChange={e => patch({ content: { bolt_color: e.target.value } })}
                                      style={{ width: '100%', height: 30, padding: 0 }}
                                    />
                                  </ControlRow>
                                  <ControlRow label="Tamanho (px)">
                                    <input
                                      type="number"
                                      min="14"
                                      max="48"
                                      value={Number(c.bolt_size || 22)}
                                      onChange={e => patch({ content: { bolt_size: Number(e.target.value) } })}
                                    />
                                  </ControlRow>
                                </div>
                              )}
                            </ElementorAccordion>

                            {/* 2. CRONÔMETRO REGRESSIVO */}
                            <ElementorAccordion title="Cronômetro / Contador Regressivo" icon={Clock} isOpen={openSections.reference_section_30_timer !== false} onToggle={() => toggleSection('reference_section_30_timer')}>
                              <label className="editor-toggle-row">
                                Exibir Cronômetro
                                <input
                                  type="checkbox"
                                  checked={c.show_timer !== false}
                                  onChange={e => patch({ content: { show_timer: e.target.checked } })}
                                />
                              </label>
                              {c.show_timer !== false && (
                                <>
                                  <ControlRow label="Rótulo do Cronômetro">
                                    <input
                                      type="text"
                                      value={String(c.timer_label || 'As ofertas se encerram em:')}
                                      onChange={e => patch({ content: { timer_label: e.target.value } })}
                                    />
                                  </ControlRow>
                                  <ControlRow label="Título da Tag do Contador">
                                    <input
                                      type="text"
                                      value={String(c.countdown_title || 'OFERTA RELÂMPAGO')}
                                      onChange={e => patch({ content: { countdown_title: e.target.value } })}
                                    />
                                  </ControlRow>
                                  <ControlRow label="Data e Hora de Término">
                                    <input
                                      type="datetime-local"
                                      value={String(c.end_date || '').slice(0, 16)}
                                      onChange={e => patch({ content: { end_date: e.target.value } })}
                                    />
                                  </ControlRow>
                                </>
                              )}
                            </ElementorAccordion>

                            {/* 3. VITRINE & PRODUTOS */}
                            <ElementorAccordion title="Vitrine & Produtos da Oferta" icon={ShoppingBag} isOpen={openSections.reference_section_30_products !== false} onToggle={() => toggleSection('reference_section_30_products')}>
                              <ControlRow label="Origem dos Produtos">
                                <select
                                  value={String(c.product_source || 'auto')}
                                  onChange={e => patch({ content: { product_source: e.target.value } })}
                                >
                                  <option value="auto">Automático (Produtos com Preço Promocional / Oferta)</option>
                                  <option value="catalog">Catálogo Geral (Produtos Publicados)</option>
                                  <option value="manual">Manual (Especificar SKUs ou IDs)</option>
                                </select>
                              </ControlRow>

                              {c.product_source === 'manual' && (
                                <ControlRow label="SKUs / IDs dos Produtos (separados por vírgula)">
                                  <textarea
                                    rows={3}
                                    placeholder="Ex: MLB5108941105, MLB5083113087, TKN-FUR-12V, TKN-DISC-110"
                                    value={String(c.manual_skus || '')}
                                    onChange={e => patch({ content: { manual_skus: e.target.value } })}
                                  />
                                </ControlRow>
                              )}

                              <ControlRow label="Quantidade Máxima de Produtos">
                                <input
                                  type="number"
                                  min="1"
                                  max="24"
                                  value={Number(c.limit || 8)}
                                  onChange={e => patch({ content: { limit: Number(e.target.value) } })}
                                />
                              </ControlRow>

                              <label className="editor-toggle-row">
                                Exibir Estrelas / Avaliações
                                <input
                                  type="checkbox"
                                  checked={c.show_stars !== false}
                                  onChange={e => patch({ content: { show_stars: e.target.checked } })}
                                />
                              </label>

                              <label className="editor-toggle-row">
                                Exibir Preço Antigo ("De R$ ...")
                                <input
                                  type="checkbox"
                                  checked={c.show_old_price !== false}
                                  onChange={e => patch({ content: { show_old_price: e.target.checked } })}
                                />
                              </label>

                              <label className="editor-toggle-row">
                                Exibir Selo de Desconto ("Baixou X%")
                                <input
                                  type="checkbox"
                                  checked={c.show_discount_badge !== false}
                                  onChange={e => patch({ content: { show_discount_badge: e.target.checked } })}
                                />
                              </label>

                              <label className="editor-toggle-row">
                                Exibir Informações do Pix
                                <input
                                  type="checkbox"
                                  checked={c.show_pix !== false}
                                  onChange={e => patch({ content: { show_pix: e.target.checked } })}
                                />
                              </label>

                              {c.show_pix !== false && (
                                <ControlRow label="Texto Informativo do Pix">
                                  <input
                                    type="text"
                                    value={String(c.pix_text || 'à vista no Pix com desconto')}
                                    onChange={e => patch({ content: { pix_text: e.target.value } })}
                                  />
                                </ControlRow>
                              )}

                              <label className="editor-toggle-row">
                                Exibir Botão Próximas Ofertas (Seta)
                                <input
                                  type="checkbox"
                                  checked={c.show_arrow !== false}
                                  onChange={e => patch({ content: { show_arrow: e.target.checked } })}
                                />
                              </label>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* WIDGET: SUMÁRIO / ÍNDICE */}
                        {(widgetType === 'tableOfContents' || widgetType === 'tableOfContentsPro') && (
                          <ElementorAccordion title="Sumário / Índice da Página" icon={List} isOpen={openSections.reference_section_31 !== false} onToggle={() => toggleSection('reference_section_31')}>
                            <ControlRow label="Título do Sumário">
                              <input
                                type="text"
                                value={String(c.title || 'Nesta Página')}
                                onChange={e => patch({ content: { title: e.target.value } })}
                              />
                            </ControlRow>
                            <ControlRow label="Incluir Subtítulos (H3)">
                              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                                <input
                                  type="checkbox"
                                  checked={c.show_subheadings !== false}
                                  onChange={e => patch({ content: { show_subheadings: e.target.checked } })}
                                />
                                Capturar cabeçalhos H2 e H3 automaticamente
                              </label>
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* WIDGET: HOTSPOT */}
                        {widgetType === 'hotspot' && (() => {
                          const spots = Array.isArray(c.hotspots) ? c.hotspots : []
                          return (
                            <ElementorAccordion title="Hotspot / Pontos de Destaque" icon={MapPin} isOpen={openSections.reference_section_32 !== false} onToggle={() => toggleSection('reference_section_32')}>
                              <ControlRow label="Imagem Base">
                                <ImageMediaControl value={String(c.image || '')}
                                  onChange={value => patch({ content: { image: value } })}
                                />
                              </ControlRow>
                              <p style={{ fontSize: 11, color: '#a4afb7', margin: '8px 0 10px' }}>Pontos interativos na imagem:</p>
                              {spots.map((spot: any, idx: number) => (
                                <div key={idx} style={{ background: '#f5f5f7', padding: 8, borderRadius: 8, marginBottom: 8, border: '1px solid #e5e5ea' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#0071e3' }}>Ponto #{idx + 1}: {spot.label || 'Destaque'}</span>
                                    <button
                                      type="button"
                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                                      onClick={() => {
                                        const next = spots.filter((_: any, i: number) => i !== idx)
                                        patch({ content: { hotspots: next } })
                                      }}
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Nome do componente"
                                    value={spot.label || ''}
                                    style={{ width: '100%', padding: '5px 8px', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 6, color: '#1d1d1f', fontSize: 11, marginBottom: 6 }}
                                    onChange={e => {
                                      const next = [...spots]
                                      next[idx] = { ...next[idx], label: e.target.value }
                                      patch({ content: { hotspots: next } })
                                    }}
                                  />
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                    <div>
                                      <label style={{ fontSize: 10, color: '#a4afb7' }}>Posição X (%)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={Number(spot.x || 50)}
                                        style={{ width: '100%', padding: '4px 6px', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 6, color: '#1d1d1f', fontSize: 11 }}
                                        onChange={e => {
                                          const next = [...spots]
                                          next[idx] = { ...next[idx], x: Number(e.target.value) }
                                          patch({ content: { hotspots: next } })
                                        }}
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: 10, color: '#a4afb7' }}>Posição Y (%)</label>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={Number(spot.y || 50)}
                                        style={{ width: '100%', padding: '4px 6px', background: '#ffffff', border: '1px solid #d2d2d7', borderRadius: 6, color: '#1d1d1f', fontSize: 11 }}
                                        onChange={e => {
                                          const next = [...spots]
                                          next[idx] = { ...next[idx], y: Number(e.target.value) }
                                          patch({ content: { hotspots: next } })
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                style={{ width: '100%', padding: '8px 12px', background: '#0071e3', color: '#fff', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                                onClick={() => {
                                  const next = [...spots, { x: 50, y: 50, label: 'Novo Ponto de Interesse' }]
                                  patch({ content: { hotspots: next } })
                                }}
                              >
                                <Plus size={14} /> Adicionar Novo Ponto
                              </button>
                            </ElementorAccordion>
                          )
                        })()}

                        {/* WIDGET: GRADE / CARROSSEL DINÂMICO */}
                        {(widgetType === 'loopGrid' || widgetType === 'loopCarousel') && (
                          <ElementorAccordion title="Grade / Carrossel Dinâmico" icon={Grid} isOpen={openSections.reference_section_33 !== false} onToggle={() => toggleSection('reference_section_33')}>
                            <ControlRow label="Título da Seção">
                              <input
                                type="text"
                                value={String(c.title || 'Produtos em Destaque')}
                                onChange={e => patch({ content: { title: e.target.value } })}
                              />
                            </ControlRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Origem dos Dados">
                                <select value={String(c.data_source || 'products')} onChange={e => patch({ content: { data_source: e.target.value } })}>
                                  <option value="products">Catálogo de Produtos TEKNIX</option>
                                  <option value="posts">Artigos e Dicas</option>
                                  <option value="categories">Categorias</option>
                                </select>
                              </ControlRow>
                              <ControlRow label="Total de Itens">
                                <input
                                  type="number"
                                  min="1"
                                  max="24"
                                  value={Number(c.count || 6)}
                                  onChange={e => patch({ content: { count: Number(e.target.value) } })}
                                />
                              </ControlRow>
                            </div>
                          </ElementorAccordion>
                        )}

                        {/* FALLBACK UNIVERSAL INTELIGENTE (NUNCA VAZIO) */}
                        {['carousel', 'imageCarousel', 'slides'].includes(widgetType) && <>
                          <ElementorAccordion title="Configurações" isOpen={openSections.carousel_settings === true} onToggle={() => toggleSection('carousel_settings')}>
                            <CarouselSettingsControl content={c} onChange={content => patch({ content })} />
                          </ElementorAccordion>
                          <ElementorAccordion title="Navegação" isOpen={openSections.carousel_navigation === true} onToggle={() => toggleSection('carousel_navigation')}>
                            <ControlRow label="Navegação"><select value={c.navigation || 'both'} onChange={e => patch({ content: { navigation: e.target.value } })}><option value="both">Setas e pontos</option><option value="arrows">Setas</option><option value="dots">Pontos</option><option value="none">Nenhuma</option></select></ControlRow>
                          </ElementorAccordion>
                        </>}
                        {!['heading', 'image', 'text', 'input', 'icon', 'button', 'video', 'divider', 'spacer', 'container', 'grid', 'storefrontCard', 'storefrontShelf', 'ads', 'chrome:header', 'chrome:footer', 'counter', 'progress', 'progressBar', 'accordion', 'toggle', 'tabs', 'iconBox', 'imageBox', 'iconList', 'testimonial', 'starRating', 'rating', 'alert', 'socialIcons', 'shareButtons', 'flipBox', 'flipBoxPro', 'priceTable', 'priceTablePro', 'countdown', 'countdownPro', 'animatedHeadline', 'animatedHeadlinePro', 'cta', 'call-to-action', 'reviews', 'reviewsPro', 'googleMaps', 'googleMapsPro', 'google-maps', 'gallery', 'basicGallery', 'imageCarousel', 'carousel', 'priceList', 'priceListPro', 'form', 'formPro', 'form-pro', 'login', 'loginPro', 'login-pro', 'posts', 'postsCarousel', 'portfolio', 'slides', 'navMenu', 'megaMenu', 'categoryMosaic', 'flashSaleSection', 'tableOfContents', 'tableOfContentsPro', 'hotspot', 'loopGrid', 'loopCarousel'].includes(widgetType) && (() => {
                          const fieldLabelMap: Record<string, string> = {
                            title: 'Título', text: 'Texto / Conteúdo', description: 'Descrição',
                            link: 'Link / URL', url: 'URL', image: 'Imagem', src: 'Fonte da Imagem',
                            button_text: 'Texto do Botão', label: 'Rótulo', subtitle: 'Subtítulo',
                            placeholder: 'Placeholder', name: 'Nome', value: 'Valor',
                            color: 'Cor', background: 'Fundo', icon: 'Ícone',
                            count: 'Quantidade', limit: 'Limite', category: 'Categoria',
                            html: 'HTML Personalizado', script: 'Script', css: 'CSS',
                          }
                          const entries = Object.entries(c).filter(([field]) => !['__type', '_id', '_rev'].includes(field))
                          const hasRealContent = entries.length > 0 && !(entries.length === 2 && c.title === 'Novo Bloco TEKNIX' && c.text)
                          return (
                            <ElementorAccordion title={widget?.label ? `Conteúdo: ${widget.label}` : 'Configuração do Bloco'} icon={Sliders} isOpen={openSections.reference_section_34 !== false} onToggle={() => toggleSection('reference_section_34')}>
                              <div style={{ padding: '4px 0 6px', fontSize: 11, color: '#86868b', marginBottom: 10, lineHeight: 1.5 }}>
                                {widgetType ? `Tipo: ${widgetType}` : 'Bloco personalizado'} • Edite os campos abaixo
                              </div>

                              {/* Campos existentes do widget com labels melhorados */}
                              {hasRealContent && entries.map(([field, value]) => {
                                const label = fieldLabelMap[field] || field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                                return (
                                  <ControlRow key={field} label={label}>
                                    {typeof value === 'boolean' ? (
                                      <input type="checkbox" checked={value} onChange={event => patch({ content: { [field]: event.target.checked } })} />
                                    ) : typeof value === 'number' ? (
                                      <input type="number" value={value} onChange={event => patch({ content: { [field]: Number(event.target.value) } })} />
                                    ) : value && typeof value === 'object' ? (
                                      <textarea
                                        rows={Math.min(10, Math.max(3, JSON.stringify(value, null, 2).split('\n').length))}
                                        defaultValue={JSON.stringify(value, null, 2)}
                                        onBlur={event => {
                                          try { patch({ content: { [field]: JSON.parse(event.target.value) } }); setError('') }
                                          catch { setError(`JSON inválido no campo ${field}.`) }
                                        }}
                                      />
                                    ) : /^(image|img|src|avatar|logo|logo_url|image_url|bg_image|background_image)$/.test(field) ? (
                                      <ImageMediaControl value={String(value ?? '')} onChange={url => patch({ content: { [field]: url } })} />
                                    ) : field === 'color' || field.endsWith('_color') ? (
                                      <input type="color" value={String(value ?? '#000000')} onChange={event => patch({ content: { [field]: event.target.value } })} />
                                    ) : (field === 'description' || field === 'text' || field === 'html') ? (
                                      <textarea rows={3} value={String(value ?? '')} onChange={event => patch({ content: { [field]: event.target.value } })} />
                                    ) : (
                                      <input type="text" value={String(value ?? '')} onChange={event => patch({ content: { [field]: event.target.value } })} />
                                    )}
                                  </ControlRow>
                                )
                              })}

                              {/* Campos padrão sempre visíveis quando vazio ou com defaults genéricos */}
                              {!hasRealContent && (
                                <>
                                  <ControlRow label="Título do Bloco">
                                    <input
                                      type="text"
                                      placeholder="Digite o título..."
                                      value={String(c.title || '')}
                                      onChange={e => patch({ content: { title: e.target.value } })}
                                    />
                                  </ControlRow>
                                  <ControlRow label="Texto / Descrição">
                                    <textarea
                                      rows={3}
                                      placeholder="Insira o texto descritivo..."
                                      value={String(c.text || c.description || '')}
                                      onChange={e => patch({ content: { text: e.target.value, description: e.target.value } })}
                                    />
                                  </ControlRow>
                                  <ControlRow label="Link / URL">
                                    <input
                                      type="text"
                                      placeholder="https://... ou /pagina"
                                      value={String(c.link || c.url || '')}
                                      onChange={e => patch({ content: { link: e.target.value, url: e.target.value } })}
                                    />
                                  </ControlRow>
                                  <ControlRow label="Imagem">
                                    <ImageMediaControl value={String(c.image || c.src || '')}
                                      onChange={value => patch({ content: { image: value, src: value } })}
                                    />
                                  </ControlRow>
                                  <ControlRow label="Texto do Botão">
                                    <input
                                      type="text"
                                      placeholder="Ex: Saiba Mais"
                                      value={String(c.button_text || c.label || '')}
                                      onChange={e => patch({ content: { button_text: e.target.value, label: e.target.value } })}
                                    />
                                  </ControlRow>
                                </>
                              )}
                            </ElementorAccordion>
                          )
                        })()}

                      </div>
                    )}

                    {/* ==================================================== */}
                    {/* 2. ABA ESTILO (Contextual e Isolada por Componente) */}
                    {/* ==================================================== */}
                    {inspectorTab === 'style' && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* ESTILO: TÍTULO (1:1 Screenshots 2 & 4) */}
                        {widgetType === 'heading' && (
                          <ElementorAccordion title="Título" icon={Heading} isOpen={openSections.s_heading !== false} onToggle={() => toggleSection('s_heading')}>
                            <ControlRow label="Alinhamento">
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                <DeviceTag />
                                <AlignmentButtonGroup
                                  value={String(s.title_align || 'left')}
                                  onChange={val => patch({ schema: { title_align: val, text_align: val } })}
                                  allowJustify
                                />
                              </div>
                            </ControlRow>

                            <StateTabs
                              activeTab={styleHoverTab}
                              onSelect={setStyleHoverTab}
                            />

                            {styleHoverTab === 'normal' ? (
                              <ControlRow label="Cor do texto">
                                <input
                                  type="color"
                                  value={String(s.color || s.title_color || '#1e293b')}
                                  onChange={e => patch({ schema: { color: e.target.value, title_color: e.target.value } })}
                                  style={{ width: '100%', height: 32, padding: 0 }}
                                />
                              </ControlRow>
                            ) : (
                              <ControlRow label="Cor do texto (Ao passar o mouse)">
                                <input
                                  type="color"
                                  value={String(s.hover_color || '#2563eb')}
                                  onChange={e => patch({ schema: { hover_color: e.target.value } })}
                                  style={{ width: '100%', height: 32, padding: 0 }}
                                />
                              </ControlRow>
                            )}

                            <TypographyControl
                              schema={s}
                              onChange={updates => patch({ schema: updates })}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                              <ControlRow label="Traço do texto (px)">
                                <input
                                  type="number"
                                  min="0"
                                  max="10"
                                  placeholder="0"
                                  value={s.text_stroke_width ?? ''}
                                  onChange={e => patch({ schema: { text_stroke_width: e.target.value === '' ? '' : Number(e.target.value) } })}
                                />
                              </ControlRow>
                              <ControlRow label="Cor do Traço">
                                <input
                                  type="color"
                                  value={String(s.text_stroke_color || '#000000')}
                                  onChange={e => patch({ schema: { text_stroke_color: e.target.value } })}
                                  style={{ width: '100%', height: 30, padding: 0 }}
                                />
                              </ControlRow>
                            </div>

                            <ControlRow label="Sombra do texto">
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                <input
                                  type="number"
                                  placeholder="Desfoque (0)"
                                  value={s.text_shadow_blur ?? ''}
                                  onChange={e => patch({ schema: { text_shadow_blur: e.target.value === '' ? '' : Number(e.target.value) } })}
                                />
                                <input
                                  type="color"
                                  value={String(s.text_shadow_color || '#00000033')}
                                  onChange={e => patch({ schema: { text_shadow_color: e.target.value } })}
                                  style={{ width: '100%', height: 30, padding: 0 }}
                                />
                              </div>
                            </ControlRow>

                            <ControlRow label="Modo de mesclagem">
                              <select value={String(s.mix_blend_mode || 'normal')} onChange={e => patch({ schema: { mix_blend_mode: e.target.value } })}>
                                <option value="normal">Normal</option>
                                <option value="multiply">Multiplicar (Multiply)</option>
                                <option value="screen">Tela (Screen)</option>
                                <option value="overlay">Sobreposição (Overlay)</option>
                                <option value="darken">Escurecer (Darken)</option>
                                <option value="lighten">Clarear (Lighten)</option>
                                <option value="color-dodge">Subexposição de cores (Color Dodge)</option>
                                <option value="difference">Diferença (Difference)</option>
                              </select>
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: IMAGEM (1:1 Screenshot 3) */}
                        {widgetType === 'image' && (
                          <ElementorAccordion title="Imagem" icon={ImageIcon} isOpen={openSections.s_image !== false} onToggle={() => toggleSection('s_image')}>
                            {/* Alinhamento [🖥️] */}
                            <div className="elementor-control-row">
                              <div className="elementor-control-header">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <span className="elementor-control-title">Alinhamento</span>
                                  <DeviceTag />
                                </div>
                                <AlignmentButtonGroup
                                  value={String(s.text_align || s.align || 'left')}
                                  onChange={val => patch({ schema: { text_align: val, align: val } })}
                                />
                              </div>
                            </div>

                            {/* Largura [🖥️] */}
                            <ElementorSliderControl
                              label="Largura"
                              value={s.width_val ?? (typeof s.width === 'number' ? s.width : parseInt(String(s.width || '100')) || 100)}
                              unit={s.width_unit || '%'}
                              units={['%', 'px', 'vw']}
                              min={0}
                              max={s.width_unit === 'px' ? 1200 : 100}
                              onChange={val => {
                                const u = s.width_unit || '%'
                                patch({ schema: { width_val: val, width: val === '' ? '' : `${val}${u}` } })
                              }}
                              onUnitChange={u => {
                                const val = s.width_val ?? 100
                                patch({ schema: { width_unit: u, width: `${val}${u}` } })
                              }}
                            />

                            {/* Largura máxima [🖥️] */}
                            <ElementorSliderControl
                              label="Largura máxima"
                              value={s.max_width_val ?? (typeof s.max_width === 'number' ? s.max_width : parseInt(String(s.max_width || '100')) || 100)}
                              unit={s.max_width_unit || '%'}
                              units={['%', 'px', 'vw']}
                              min={0}
                              max={s.max_width_unit === 'px' ? 1200 : 100}
                              onChange={val => {
                                const u = s.max_width_unit || '%'
                                patch({ schema: { max_width_val: val, max_width: val === '' ? '' : `${val}${u}` } })
                              }}
                              onUnitChange={u => {
                                const val = s.max_width_val ?? 100
                                patch({ schema: { max_width_unit: u, max_width: `${val}${u}` } })
                              }}
                            />

                            {/* Altura [🖥️] */}
                            <ElementorSliderControl
                              label="Altura"
                              value={s.height_val ?? (typeof s.height === 'number' ? s.height : parseInt(String(s.height || '')) || '')}
                              unit={s.height_unit || 'px'}
                              units={['px', 'vh']}
                              min={0}
                              max={1000}
                              placeholder="Auto"
                              onChange={val => {
                                const u = s.height_unit || 'px'
                                patch({ schema: { height_val: val, height: val === '' ? '' : `${val}${u}` } })
                              }}
                              onUnitChange={u => {
                                const val = s.height_val ?? ''
                                patch({ schema: { height_unit: u, height: val === '' ? '' : `${val}${u}` } })
                              }}
                            />

                            {/* Ajuste do Objeto (Object Fit) */}
                            <ControlRow label="Ajuste do Objeto (Object Fit)">
                              <select
                                value={String(s.object_fit || 'cover')}
                                onChange={e => patch({ schema: { object_fit: e.target.value } })}
                              >
                                <option value="cover">Cobrir (Cover)</option>
                                <option value="contain">Conter (Contain)</option>
                                <option value="fill">Preencher (Fill)</option>
                                <option value="scale-down">Escala Reduzida (Scale Down)</option>
                                <option value="none">Original (None)</option>
                              </select>
                            </ControlRow>

                            {/* StateTabs: Normal | Ao passar o mouse */}
                            <StateTabs
                              activeTab={styleHoverTab}
                              onSelect={setStyleHoverTab}
                            />

                            {/* Opacidade */}
                            {styleHoverTab === 'normal' ? (
                              <ElementorSliderControl
                                label="Opacidade"
                                value={s.opacity !== undefined && s.opacity !== '' ? Math.round(Number(s.opacity) * 100) : 100}
                                min={0}
                                max={100}
                                units={[]}
                                showDevice={false}
                                onChange={val => patch({ schema: { opacity: val === '' ? 1 : Number(val) / 100 } })}
                              />
                            ) : (
                              <ElementorSliderControl
                                label="Opacidade"
                                value={s.hover_opacity !== undefined && s.hover_opacity !== '' ? Math.round(Number(s.hover_opacity) * 100) : 85}
                                min={0}
                                max={100}
                                units={[]}
                                showDevice={false}
                                onChange={val => patch({ schema: { hover_opacity: val === '' ? 0.85 : Number(val) / 100 } })}
                              />
                            )}

                            {/* Filtros CSS [ ✎ ] */}
                            <div className="elementor-control-row">
                              <div className="elementor-control-header">
                                <span className="elementor-control-title">Filtros CSS</span>
                                <button
                                  type="button"
                                  className={`elementor-edit-icon-btn ${showImageFilters ? 'active' : ''}`}
                                  title="Editar Filtros CSS"
                                  onClick={() => setShowImageFilters(!showImageFilters)}
                                >
                                  <Edit3 size={13} />
                                </button>
                              </div>
                              {showImageFilters && (
                                <div style={{ background: '#f5f5f7', padding: 8, borderRadius: 6, marginTop: 6, border: '1px solid #e5e5ea' }}>
                                  <ElementorSliderControl
                                    label="Desfoque (Blur)"
                                    value={s.filter_blur ?? 0}
                                    unit="px"
                                    units={['px']}
                                    min={0}
                                    max={20}
                                    showDevice={false}
                                    onChange={val => patch({ schema: { filter_blur: val } })}
                                  />
                                  <ElementorSliderControl
                                    label="Brilho (Brightness)"
                                    value={s.filter_brightness ?? 100}
                                    unit="%"
                                    units={['%']}
                                    min={0}
                                    max={200}
                                    showDevice={false}
                                    onChange={val => patch({ schema: { filter_brightness: val } })}
                                  />
                                  <ElementorSliderControl
                                    label="Contraste"
                                    value={s.filter_contrast ?? 100}
                                    unit="%"
                                    units={['%']}
                                    min={0}
                                    max={200}
                                    showDevice={false}
                                    onChange={val => patch({ schema: { filter_contrast: val } })}
                                  />
                                  <ElementorSliderControl
                                    label="Saturação"
                                    value={s.filter_saturate ?? 100}
                                    unit="%"
                                    units={['%']}
                                    min={0}
                                    max={200}
                                    showDevice={false}
                                    onChange={val => patch({ schema: { filter_saturate: val } })}
                                  />
                                </div>
                              )}
                            </div>

                            {/* Tipo de borda */}
                            <div className="elementor-control-row">
                              <div className="elementor-control-header">
                                <span className="elementor-control-title">Tipo de borda</span>
                                <select
                                  className="elementor-units-select"
                                  style={{ width: 130 }}
                                  value={String(s.border_style || s.border_type || 'default')}
                                  onChange={e => patch({ schema: { border_style: e.target.value === 'default' ? '' : e.target.value, border_type: e.target.value === 'default' ? '' : e.target.value } })}
                                >
                                  <option value="default">Padrão</option>
                                  <option value="solid">Sólida</option>
                                  <option value="double">Dupla</option>
                                  <option value="dotted">Pontilhada</option>
                                  <option value="dashed">Tracejada</option>
                                  <option value="groove">Ranhura</option>
                                </select>
                              </div>
                            </div>

                            {/* Raio da borda [🖥️] */}
                            <LinkedDimensionsControl
                              label="Raio da borda"
                              prefix="border_radius"
                              schema={s}
                              defaultUnit="px"
                              units={['px', '%']}
                              onChange={updates => {
                                const top = updates.border_radius_top ?? s.border_radius_top ?? 0
                                const right = updates.border_radius_right ?? s.border_radius_right ?? 0
                                const bottom = updates.border_radius_bottom ?? s.border_radius_bottom ?? 0
                                const left = updates.border_radius_left ?? s.border_radius_left ?? 0
                                const unit = updates.border_radius_unit ?? s.border_radius_unit ?? 'px'
                                patch({ schema: { ...updates, border_radius: `${top}${unit} ${right}${unit} ${bottom}${unit} ${left}${unit}` } })
                              }}
                            />

                            {/* Sombra da caixa [ ✎ ] */}
                            <div className="elementor-control-row">
                              <div className="elementor-control-header">
                                <span className="elementor-control-title">Sombra da caixa</span>
                                <button
                                  type="button"
                                  className={`elementor-edit-icon-btn ${showImageBoxShadow ? 'active' : ''}`}
                                  title="Editar Sombra da Caixa"
                                  onClick={() => setShowImageBoxShadow(!showImageBoxShadow)}
                                >
                                  <Edit3 size={13} />
                                </button>
                              </div>
                              {showImageBoxShadow && (
                                <div style={{ background: '#f5f5f7', padding: 8, borderRadius: 6, marginTop: 6, border: '1px solid #e5e5ea' }}>
                                  <ControlRow label="Predefinição de Sombra">
                                    <select
                                      value={String(s.box_shadow || 'none')}
                                      onChange={e => patch({ schema: { box_shadow: e.target.value } })}
                                      style={{ width: '100%', background: '#ffffff', border: '1px solid #d2d2d7', color: '#1d1d1f', padding: '6px 8px', borderRadius: 6 }}
                                    >
                                      <option value="none">Nenhuma</option>
                                      <option value="0 2px 8px rgba(0,0,0,0.15)">Suave (0 2px 8px)</option>
                                      <option value="0 8px 24px rgba(0,0,0,0.25)">Média (0 8px 24px)</option>
                                      <option value="0 16px 48px rgba(0,0,0,0.35)">Marcante (0 16px 48px)</option>
                                    </select>
                                  </ControlRow>
                                </div>
                              )}
                            </div>

                            {/* Preciso de ajuda (?) */}
                            <div className="elementor-help-link" onClick={() => showNotice('Documentação de Estilo de Imagem')}>
                              <span>Preciso de ajuda</span>
                              <HelpCircle size={14} />
                            </div>
                          </ElementorAccordion>
                        )}

                        {widgetType === 'input' && (
                          <>
                            <ElementorAccordion title="Campo" icon={Edit3} isOpen={openSections.s_input !== false} onToggle={() => toggleSection('s_input')}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor do texto">
                                  <input type="color" value={String(s.color || '#111827')} onChange={e => patch({ schema: { color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                                <ControlRow label="Cor de fundo">
                                  <input type="color" value={String(s.bg_color || '#ffffff')} onChange={e => patch({ schema: { bg_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                              </div>
                              <TypographyControl schema={s} onChange={updates => patch({ schema: updates })} />
                            </ElementorAccordion>
                            <ElementorAccordion title="Borda e formato" icon={SlidersHorizontal} isOpen={openSections.s_input_border !== false} onToggle={() => toggleSection('s_input_border')}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Tipo de borda">
                                  <select value={String(s.border_style || 'solid')} onChange={e => patch({ schema: { border_style: e.target.value } })}>
                                    <option value="none">Nenhuma</option>
                                    <option value="solid">Sólida</option>
                                    <option value="dashed">Tracejada</option>
                                    <option value="dotted">Pontilhada</option>
                                    <option value="double">Dupla</option>
                                  </select>
                                </ControlRow>
                                <ControlRow label="Espessura">
                                  <input type="text" placeholder="1px" value={String(s.border_width || '1px')} onChange={e => patch({ schema: { border_width: e.target.value } })} />
                                </ControlRow>
                                <ControlRow label="Cor da borda">
                                  <input type="color" value={String(s.border_color || '#e5e7eb')} onChange={e => patch({ schema: { border_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                                <ControlRow label="Arredondamento">
                                  <input type="text" placeholder="8px" value={String(s.border_radius || '')} onChange={e => patch({ schema: { border_radius: e.target.value } })} />
                                </ControlRow>
                              </div>
                              <LinkedDimensionsControl label="Espaçamento interno" prefix="padding" schema={s} onChange={updates => patch({ schema: updates })} />
                            </ElementorAccordion>
                          </>
                        )}

                        {/* ESTILO: EDITOR DE TEXTO */}
                        {widgetType === 'text' && (
                          <ElementorAccordion title="Editor de texto" icon={FileText} isOpen={openSections.s_text !== false} onToggle={() => toggleSection('s_text')}>
                            <ControlRow label="Alinhamento">
                              <AlignmentButtonGroup
                                value={String(s.text_align || 'left')}
                                onChange={val => patch({ schema: { text_align: val } })}
                                allowJustify
                              />
                            </ControlRow>
                            <ControlRow label="Cor do Texto">
                              <input
                                type="color"
                                value={String(s.color || '#475569')}
                                onChange={e => patch({ schema: { color: e.target.value } })}
                                style={{ width: '100%', height: 32, padding: 0 }}
                              />
                            </ControlRow>
                            <TypographyControl
                              schema={s}
                              onChange={updates => patch({ schema: updates })}
                            />
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: BOTÃO */}
                        {widgetType === 'button' && (
                          <ElementorAccordion title="Botão" icon={MousePointerClick} isOpen={openSections.s_button !== false} onToggle={() => toggleSection('s_button')}>
                            <TypographyControl
                              schema={s}
                              onChange={updates => patch({ schema: updates })}
                              prefix="btn"
                            />

                            <StateTabs
                              activeTab={styleHoverTab}
                              onSelect={setStyleHoverTab}
                            />

                            {styleHoverTab === 'normal' ? (
                              <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                  <ControlRow label="Cor do Texto">
                                    <input type="color" value={String(s.btn_color || '#ffffff')} onChange={e => patch({ schema: { btn_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                  </ControlRow>
                                  <ControlRow label="Cor de Fundo">
                                    <input type="color" value={String(s.btn_bg || '#2563eb')} onChange={e => patch({ schema: { btn_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                  </ControlRow>
                                </div>
                              </>
                            ) : (
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor Texto (Hover)">
                                  <input type="color" value={String(s.btn_hover_color || '#ffffff')} onChange={e => patch({ schema: { btn_hover_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                                <ControlRow label="Cor Fundo (Hover)">
                                  <input type="color" value={String(s.btn_hover_bg || '#1d4ed8')} onChange={e => patch({ schema: { btn_hover_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                              </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Arredondamento (px)">
                                <input type="number" placeholder="6" value={Number(s.btn_radius || 6)} onChange={e => patch({ schema: { btn_radius: Number(e.target.value) } })} />
                              </ControlRow>
                              <ControlRow label="Sombra (Box Shadow)">
                                <select value={String(s.btn_box_shadow || 'none')} onChange={e => patch({ schema: { btn_box_shadow: e.target.value } })}>
                                  <option value="none">Nenhuma</option>
                                  <option value="0 1px 2px rgba(0,0,0,0.05)">Suave</option>
                                  <option value="0 4px 12px rgba(37,99,235,0.25)">Destaque</option>
                                </select>
                              </ControlRow>
                            </div>

                            <LinkedDimensionsControl
                              label="Preenchimento do Botão (Padding)"
                              prefix="btn_padding"
                              schema={s}
                              onChange={updates => patch({ schema: updates })}
                            />
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: CONTÊINER (FLEXBOX) */}
                        {isContainer && (
                          <>
                            <ElementorAccordion title="Plano de Fundo" icon={Box} isOpen={openSections.style_container !== false} onToggle={() => toggleSection('style_container')}>
                              <ControlRow label="Cor de Fundo">
                                <input type="color" value={String(s.bg_color || c.bg_color || '#ffffff')} onChange={e => patch({ schema: { bg_color: e.target.value }, content: { bg_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <ControlRow label="Imagem de Fundo (opcional)">
                                <ImageMediaControl value={String(s.bg_image || '')} onChange={value => patch({ schema: { bg_image: value } })} />
                              </ControlRow>
                            </ElementorAccordion>

                            <ElementorAccordion title="Borda & Sombra" icon={SlidersHorizontal} isOpen={openSections.style_container_border !== false} onToggle={() => toggleSection('style_container_border')}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Arredondamento (px)">
                                  <input type="number" placeholder="8" value={Number(s.border_radius || 0)} onChange={e => patch({ schema: { border_radius: Number(e.target.value) } })} />
                                </ControlRow>
                                <ControlRow label="Borda">
                                  <input type="text" placeholder="1px solid #e2e8f0" value={String(s.border || '')} onChange={e => patch({ schema: { border: e.target.value } })} />
                                </ControlRow>
                              </div>
                              <ControlRow label="Sombra da Caixa">
                                <select value={String(s.box_shadow || 'none')} onChange={e => patch({ schema: { box_shadow: e.target.value } })}>
                                  <option value="none">Nenhuma</option>
                                  <option value="0 1px 3px rgba(0,0,0,0.05)">Suave</option>
                                  <option value="0 4px 16px rgba(0,0,0,0.08)">Média</option>
                                  <option value="0 12px 32px rgba(0,0,0,0.12)">Marcante</option>
                                </select>
                              </ControlRow>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* ESTILO: VÍDEO */}
                        {widgetType === 'video' && (
                          <ElementorAccordion title="Vídeo" icon={Video} isOpen={openSections.s_video !== false} onToggle={() => toggleSection('s_video')}>
                            <ControlRow label="Proporção da Tela">
                              <select value={String(s.aspect_ratio || '16:9')} onChange={e => patch({ schema: { aspect_ratio: e.target.value } })}>
                                <option value="16:9">16:9 (Widescreen)</option>
                                <option value="4:3">4:3 (Clássico)</option>
                                <option value="1:1">1:1 (Quadrado)</option>
                                <option value="9:16">9:16 (Vertical / Reels)</option>
                                <option value="21:9">21:9 (Cinema)</option>
                              </select>
                            </ControlRow>
                            <ControlRow label="Arredondamento (px)">
                              <input type="number" placeholder="12" value={Number(s.border_radius || 12)} onChange={e => patch({ schema: { border_radius: Number(e.target.value) } })} />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: DIVISOR */}
                        {widgetType === 'divider' && (
                          <ElementorAccordion title="Divisor" icon={Minus} isOpen={openSections.s_divider !== false} onToggle={() => toggleSection('s_divider')}>
                            <ControlRow label="Cor da Linha">
                              <input type="color" value={String(s.line_color || '#e2e8f0')} onChange={e => patch({ schema: { line_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                            </ControlRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Espessura (px)">
                                <input type="number" min="1" max="20" value={Number(s.line_weight || 1)} onChange={e => patch({ schema: { line_weight: Number(e.target.value) } })} />
                              </ControlRow>
                              <ControlRow label="Espaçamento (px)">
                                <input type="number" min="0" max="100" value={Number(s.gap || 16)} onChange={e => patch({ schema: { gap: Number(e.target.value) } })} />
                              </ControlRow>
                            </div>
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: CARD DE PRODUTO (Sub-elementos isolados) */}
                        {widgetType === 'storefrontCard' && (
                          <>
                            <ElementorAccordion title="Container do Card" icon={Box} isOpen={openSections.style_card !== false} onToggle={() => toggleSection('style_card')}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor de Fundo">
                                  <input type="color" value={String(s.card_bg || '#ffffff')} onChange={e => patch({ schema: { card_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                                <ControlRow label="Padding Interno (px)">
                                  <input type="number" min="0" placeholder="12" value={Number(s.card_padding || 12)} onChange={e => patch({ schema: { card_padding: Number(e.target.value) } })} />
                                </ControlRow>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Borda">
                                  <select value={String(s.card_border_style || 'none')} onChange={e => patch({ schema: { card_border_style: e.target.value } })}>
                                    <option value="none">Nenhuma</option>
                                    <option value="solid">Sólida</option>
                                    <option value="dashed">Tracejada</option>
                                  </select>
                                </ControlRow>
                                <ControlRow label="Cor da Borda">
                                  <input type="color" value={String(s.card_border_color || '#e5e7eb')} onChange={e => patch({ schema: { card_border_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Arredondamento (px)">
                                  <input type="number" min="0" placeholder="8" value={Number(s.card_radius || 8)} onChange={e => patch({ schema: { card_radius: Number(e.target.value) } })} />
                                </ControlRow>
                                <ControlRow label="Sombra (Box Shadow)">
                                  <select value={String(s.card_box_shadow || 'none')} onChange={e => patch({ schema: { card_box_shadow: e.target.value } })}>
                                    <option value="none">Nenhuma</option>
                                    <option value="sm">Suave</option>
                                    <option value="md">Média</option>
                                    <option value="lg">Marcante</option>
                                  </select>
                                </ControlRow>
                              </div>
                            </ElementorAccordion>

                            <ElementorAccordion title="Imagem do Produto" icon={ImageIcon} isOpen={openSections.style_media !== false} onToggle={() => toggleSection('style_media')}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Largura Máxima (px)">
                                  <input type="number" placeholder="200" value={Number(s.img_width || '')} onChange={e => patch({ schema: { img_width: Number(e.target.value) } })} />
                                </ControlRow>
                                <ControlRow label="Altura (px)">
                                  <input type="number" placeholder="200" value={Number(s.img_height || '')} onChange={e => patch({ schema: { img_height: Number(e.target.value) } })} />
                                </ControlRow>
                              </div>
                              <ControlRow label="Arredondamento Imagem (px)">
                                <input type="number" placeholder="4" value={Number(s.img_radius || '')} onChange={e => patch({ schema: { img_radius: Number(e.target.value) } })} />
                              </ControlRow>
                            </ElementorAccordion>

                            <ElementorAccordion title="Tipografia do Título" icon={Type} isOpen={openSections.style_title !== false} onToggle={() => toggleSection('style_title')}>
                              <ControlRow label="Família da Fonte">
                                <select value={String(s.title_font_family || 'inherit')} onChange={e => patch({ schema: { title_font_family: e.target.value } })}>
                                  <option value="inherit">Padrão da Loja</option>
                                  <option value="Inter, sans-serif">Inter</option>
                                  <option value="'Nunito', sans-serif">Nunito</option>
                                  <option value="'Roboto', sans-serif">Roboto</option>
                                  <option value="-apple-system, sans-serif">SF Pro (Apple)</option>
                                </select>
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Tamanho da Fonte (px)">
                                  <input type="number" min="10" max="32" placeholder="13" value={Number(s.title_size || 13)} onChange={e => patch({ schema: { title_size: Number(e.target.value) } })} />
                                </ControlRow>
                                <ControlRow label="Cor do Título">
                                  <input type="color" value={String(s.title_color || '#1f2937')} onChange={e => patch({ schema: { title_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>

                            <ElementorAccordion title="Tipografia do Preço e Condições" icon={Palette} isOpen={openSections.style_price !== false} onToggle={() => toggleSection('style_price')}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Tamanho do Preço (px)">
                                  <input type="number" min="14" max="42" placeholder="24" value={Number(s.price_size || 24)} onChange={e => patch({ schema: { price_size: Number(e.target.value) } })} />
                                </ControlRow>
                                <ControlRow label="Cor do Preço à Vista">
                                  <input type="color" value={String(s.price_color || '#111827')} onChange={e => patch({ schema: { price_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor Preço Riscado">
                                  <input type="color" value={String(s.old_price_color || '#9ca3af')} onChange={e => patch({ schema: { old_price_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                                <ControlRow label="Cor Selo Desconto">
                                  <input type="color" value={String(s.badge_color || '#00a650')} onChange={e => patch({ schema: { badge_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>

                            <ElementorAccordion title="Avaliação (Estrelas)" icon={Palette} isOpen={openSections.style_rating !== false} onToggle={() => toggleSection('style_rating')}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor das Estrelas">
                                  <input type="color" value={String(s.star_color || '#2563eb')} onChange={e => patch({ schema: { star_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                                <ControlRow label="Tamanho Estrelas (px)">
                                  <input type="number" min="10" max="24" placeholder="13" value={Number(s.star_size || 13)} onChange={e => patch({ schema: { star_size: Number(e.target.value) } })} />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>

                            <ElementorAccordion title="Botão de Compra" icon={MousePointerClick} isOpen={openSections.style_button !== false} onToggle={() => toggleSection('style_button')}>
                              <StateTabs
                                activeTab={btnStyleHoverTab}
                                onSelect={setBtnStyleHoverTab}
                              />
                              {btnStyleHoverTab === 'normal' ? (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                  <ControlRow label="Cor do Texto">
                                    <input type="color" value={String(s.btn_color || '#ffffff')} onChange={e => patch({ schema: { btn_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                  </ControlRow>
                                  <ControlRow label="Cor de Fundo">
                                    <input type="color" value={String(s.btn_bg || '#2563eb')} onChange={e => patch({ schema: { btn_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                  </ControlRow>
                                </div>
                              ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                  <ControlRow label="Cor Texto (Hover)">
                                    <input type="color" value={String(s.btn_hover_color || '#ffffff')} onChange={e => patch({ schema: { btn_hover_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                  </ControlRow>
                                  <ControlRow label="Cor Fundo (Hover)">
                                    <input type="color" value={String(s.btn_hover_bg || '#1d4ed8')} onChange={e => patch({ schema: { btn_hover_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                  </ControlRow>
                                </div>
                              )}
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Tamanho Fonte (px)">
                                  <input type="number" placeholder="13" value={Number(s.btn_font_size || 13)} onChange={e => patch({ schema: { btn_font_size: Number(e.target.value) } })} />
                                </ControlRow>
                                <ControlRow label="Arredondamento (px)">
                                  <input type="number" placeholder="6" value={Number(s.btn_radius || 6)} onChange={e => patch({ schema: { btn_radius: Number(e.target.value) } })} />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* ESTILO: CABEÇALHO */}
                        {widgetType === 'chrome:header' && (
                          <ElementorAccordion title="Estilo do Cabeçalho" icon={Palette} isOpen={openSections.reference_section_35 !== false} onToggle={() => toggleSection('reference_section_35')}>
                            {/* Cor de Fundo */}
                            <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #e5e5ea' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#1d1d1f' }}>Cor de Fundo do Cabeçalho</span>
                                <span style={{ fontSize: 11, color: '#86868b', fontFamily: 'monospace', fontWeight: 600 }}>
                                  {s.header_bg === 'transparent' ? 'Sem cor (Transparente)' : (s.header_bg || '#f7f7f7')}
                                </span>
                              </div>
                              <p style={{ fontSize: 11, color: '#86868b', margin: '0 0 8px', lineHeight: 1.4 }}>
                                Escolha uma cor para o cabeçalho ou clique no botão para deixar totalmente transparente.
                              </p>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 10 }}>
                                <input
                                  type="color"
                                  value={s.header_bg === 'transparent' ? '#ffffff' : String(s.header_bg || '#f7f7f7')}
                                  onChange={e => patch({ schema: { header_bg: e.target.value } })}
                                  style={{ width: 44, height: 32, padding: 0, border: '1px solid #d2d2d7', borderRadius: 6, cursor: 'pointer' }}
                                  title="Selecionar cor personalizada"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    patch({ schema: { header_bg: 'transparent' } })
                                    showNotice('Cabeçalho definido como sem cor (transparente).')
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '7px 8px',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: s.header_bg === 'transparent' ? '#e8f2ff' : '#f5f5f7',
                                    color: s.header_bg === 'transparent' ? '#0071e3' : '#1d1d1f',
                                    border: s.header_bg === 'transparent' ? '1px solid #0071e3' : '1px solid #d2d2d7',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 4
                                  }}
                                  title="Zerar cor e deixar transparente"
                                >
                                  <span>🚫</span> Zerar (Sem cor)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const val = s.header_bg || 'transparent'
                                    patchKey('chrome:header', { schema: { header_bg: val } }, true)
                                    showNotice('Cor de fundo do cabeçalho salva como padrão da loja!')
                                  }}
                                  style={{
                                    padding: '7px 10px',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: '#f5f5f7',
                                    color: '#1d1d1f',
                                    border: '1px solid #d2d2d7',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                  title="Salvar esta cor como padrão para todo o site"
                                >
                                  <Star size={13} color="#f59e0b" /> Salvar padrão
                                </button>
                              </div>

                              {/* Paleta rápida de cores oficiais */}
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <span style={{ fontSize: 10, color: '#86868b', fontWeight: 600 }}>CORES PADRÃO:</span>
                                {[
                                  { label: 'Sem cor (Transparente)', color: 'transparent' },
                                  { label: 'Branco', color: '#ffffff' },
                                  { label: 'Cinza Original TEKNIX', color: '#f7f7f7' },
                                  { label: 'Preto Oficial', color: '#111827' },
                                  { label: 'TEKNIX Lime', color: '#a2e000' },
                                  { label: 'Azul Apple', color: '#0071e3' }
                                ].map(p => (
                                  <button
                                    key={p.label}
                                    type="button"
                                    onClick={() => {
                                      patch({ schema: { header_bg: p.color } })
                                      showNotice(`Cor ${p.label} aplicada ao cabeçalho.`)
                                    }}
                                    style={{
                                      width: 20,
                                      height: 20,
                                      borderRadius: '50%',
                                      border: s.header_bg === p.color ? '2px solid #0071e3' : '1px solid #d2d2d7',
                                      background: p.color === 'transparent' ? 'repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%) 50% / 6px 6px' : p.color,
                                      cursor: 'pointer'
                                    }}
                                    title={p.label}
                                  />
                                ))}
                              </div>
                            </div>

                            {/* Cor da Borda */}
                            <div style={{ marginBottom: 16, paddingBottom: 14, borderBottom: '1px solid #e5e5ea' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: '#1d1d1f' }}>Cor da Borda Inferior</span>
                                <span style={{ fontSize: 11, color: '#86868b', fontFamily: 'monospace', fontWeight: 600 }}>
                                  {s.header_border_color === 'transparent' ? 'Sem borda' : (s.header_border_color || '#e5e7eb')}
                                </span>
                              </div>
                              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                <input
                                  type="color"
                                  value={s.header_border_color === 'transparent' ? '#e5e7eb' : String(s.header_border_color || '#e5e7eb')}
                                  onChange={e => patch({ schema: { header_border_color: e.target.value } })}
                                  style={{ width: 44, height: 32, padding: 0, border: '1px solid #d2d2d7', borderRadius: 6, cursor: 'pointer' }}
                                  title="Selecionar cor da borda"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    patch({ schema: { header_border_color: 'transparent' } })
                                    showNotice('Borda inferior removida.')
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '7px 8px',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: s.header_border_color === 'transparent' ? '#e8f2ff' : '#f5f5f7',
                                    color: s.header_border_color === 'transparent' ? '#0071e3' : '#1d1d1f',
                                    border: s.header_border_color === 'transparent' ? '1px solid #0071e3' : '1px solid #d2d2d7',
                                    borderRadius: 6,
                                    cursor: 'pointer'
                                  }}
                                  title="Remover borda inferior"
                                >
                                  🚫 Zerar (Sem borda)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const val = s.header_border_color || 'transparent'
                                    patchKey('chrome:header', { schema: { header_border_color: val } }, true)
                                    showNotice('Borda inferior salva como padrão da loja!')
                                  }}
                                  style={{
                                    padding: '7px 10px',
                                    fontSize: 11,
                                    fontWeight: 600,
                                    background: '#f5f5f7',
                                    color: '#1d1d1f',
                                    border: '1px solid #d2d2d7',
                                    borderRadius: 6,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4
                                  }}
                                  title="Salvar esta borda como padrão para todo o site"
                                >
                                  <Star size={13} color="#f59e0b" /> Salvar padrão
                                </button>
                              </div>
                            </div>

                            <ElementorSliderControl
                              label="Opacidade do Cabeçalho"
                              value={s.header_opacity !== undefined && s.header_opacity !== '' ? Math.round(Number(s.header_opacity) * 100) : 100}
                              min={0}
                              max={100}
                              units={[]}
                              showDevice={false}
                              onChange={val => patch({ schema: { header_opacity: val === '' ? 1 : Number(val) / 100 } })}
                            />
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: RODAPÉ */}
                        {widgetType === 'chrome:footer' && (
                          <ElementorAccordion title="Estilo do Rodapé" icon={Palette} isOpen={openSections.reference_section_36 !== false} onToggle={() => toggleSection('reference_section_36')}>
                            <ControlRow label="Cor de Fundo do Rodapé">
                              <input type="color" value={String(s.footer_bg || '#f8fafc')} onChange={e => patch({ schema: { footer_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                            </ControlRow>
                            <ControlRow label="Cor dos Textos">
                              <input type="color" value={String(s.footer_text_color || '#64748b')} onChange={e => patch({ schema: { footer_text_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                            </ControlRow>
                            <ControlRow label="Cor dos Links">
                              <input type="color" value={String(s.footer_link_color || '#0f172a')} onChange={e => patch({ schema: { footer_link_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: MOSAICO DE CATEGORIAS */}
                        {widgetType === 'categoryMosaic' && (
                          <>
                            <ElementorAccordion title="Seção & Fundo" icon={Palette} isOpen={openSections.s_mosaic_section !== false} onToggle={() => toggleSection('s_mosaic_section')}>
                              <ControlRow label="Cor de Fundo da Seção">
                                <input
                                  type="color"
                                  value={String(s.background_color || '#ffffff')}
                                  onChange={e => patch({ schema: { background_color: e.target.value } })}
                                  style={{ width: '100%', height: 30, padding: 0 }}
                                />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Espaçamento Sup. (px)">
                                  <input
                                    type="number"
                                    placeholder="16"
                                    value={s.padding_top ?? ''}
                                    onChange={e => patch({ schema: { padding_top: e.target.value === '' ? '' : Number(e.target.value) } })}
                                  />
                                </ControlRow>
                                <ControlRow label="Espaçamento Inf. (px)">
                                  <input
                                    type="number"
                                    placeholder="24"
                                    value={s.padding_bottom ?? ''}
                                    onChange={e => patch({ schema: { padding_bottom: e.target.value === '' ? '' : Number(e.target.value) } })}
                                  />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>

                            <ElementorAccordion title="Cards & Cores" icon={SlidersHorizontal} isOpen={openSections.s_mosaic_cards !== false} onToggle={() => toggleSection('s_mosaic_cards')}>
                              <ControlRow label="Cor de Fundo dos Cards">
                                <input
                                  type="color"
                                  value={String(s.card_bg || '#22c55e')}
                                  onChange={e => patch({ schema: { card_bg: e.target.value } })}
                                  style={{ width: '100%', height: 30, padding: 0 }}
                                />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Fundo Card Promo">
                                  <input
                                    type="color"
                                    value={String(s.promo_bg || '#22c55e')}
                                    onChange={e => patch({ schema: { promo_bg: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                                <ControlRow label="Borda Card Promo">
                                  <input
                                    type="color"
                                    value={String(s.promo_border_color || '#ffffff')}
                                    onChange={e => patch({ schema: { promo_border_color: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                              </div>
                              <ControlRow label="Raio da Borda Personalizado (px)">
                                <input
                                  type="number"
                                  placeholder="20"
                                  value={s.card_border_radius ?? ''}
                                  onChange={e => patch({ schema: { card_border_radius: e.target.value === '' ? '' : Number(e.target.value) } })}
                                />
                              </ControlRow>
                            </ElementorAccordion>

                            <ElementorAccordion title="Textos & Rótulos" icon={Type} isOpen={openSections.s_mosaic_text !== false} onToggle={() => toggleSection('s_mosaic_text')}>
                              <ControlRow label="Cor do Texto das Categorias">
                                <input
                                  type="color"
                                  value={String(s.label_color || '#111827')}
                                  onChange={e => patch({ schema: { label_color: e.target.value } })}
                                  style={{ width: '100%', height: 30, padding: 0 }}
                                />
                              </ControlRow>
                              <ControlRow label="Tamanho da Fonte do Rótulo (px)">
                                <input
                                  type="number"
                                  placeholder="12"
                                  value={s.label_font_size ?? ''}
                                  onChange={e => patch({ schema: { label_font_size: e.target.value === '' ? '' : Number(e.target.value) } })}
                                />
                              </ControlRow>
                            </ElementorAccordion>

                            <ElementorAccordion title="Setas de Navegação" icon={ChevronRight} isOpen={openSections.s_mosaic_arrows !== false} onToggle={() => toggleSection('s_mosaic_arrows')}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor da Seta">
                                  <input
                                    type="color"
                                    value={String(s.arrow_color || '#666666')}
                                    onChange={e => patch({ schema: { arrow_color: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                                <ControlRow label="Fundo da Seta">
                                  <input
                                    type="color"
                                    value={String(s.arrow_bg || '#ffffff')}
                                    onChange={e => patch({ schema: { arrow_bg: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* ESTILO: OFERTAS RELÂMPAGO */}
                        {widgetType === 'flashSaleSection' && (
                          <>
                            <ElementorAccordion title="Cabeçalho & Cronômetro" icon={Palette} isOpen={openSections.s_flash_header !== false} onToggle={() => toggleSection('s_flash_header')}>
                              <ControlRow label="Cor de Fundo da Seção">
                                <input
                                  type="color"
                                  value={String(s.background_color || '#ffffff')}
                                  onChange={e => patch({ schema: { background_color: e.target.value } })}
                                  style={{ width: '100%', height: 30, padding: 0 }}
                                />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor do Título">
                                  <input
                                    type="color"
                                    value={String(s.title_color || '#111827')}
                                    onChange={e => patch({ schema: { title_color: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                                <ControlRow label="Cor do Raio">
                                  <input
                                    type="color"
                                    value={String(s.bolt_color || '#dc2626')}
                                    onChange={e => patch({ schema: { bolt_color: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                              </div>
                              <ControlRow label="Cor do Rótulo do Timer">
                                <input
                                  type="color"
                                  value={String(s.timer_label_color || '#4b5563')}
                                  onChange={e => patch({ schema: { timer_label_color: e.target.value } })}
                                  style={{ width: '100%', height: 30, padding: 0 }}
                                />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Fundo Selo Timer">
                                  <input
                                    type="color"
                                    value={String(s.countdown_badge_bg || '#ff3b30')}
                                    onChange={e => patch({ schema: { countdown_badge_bg: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                                <ControlRow label="Texto Selo Timer">
                                  <input
                                    type="color"
                                    value={String(s.countdown_badge_color || '#ffffff')}
                                    onChange={e => patch({ schema: { countdown_badge_color: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Fundo Caixas Timer">
                                  <input
                                    type="color"
                                    value={String(s.countdown_box_bg || '#000000')}
                                    onChange={e => patch({ schema: { countdown_box_bg: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                                <ControlRow label="Texto Dígitos Timer">
                                  <input
                                    type="color"
                                    value={String(s.countdown_box_color || '#ffffff')}
                                    onChange={e => patch({ schema: { countdown_box_color: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>

                            <ElementorAccordion title="Cards de Oferta" icon={ShoppingBag} isOpen={openSections.s_flash_cards !== false} onToggle={() => toggleSection('s_flash_cards')}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Fundo do Card">
                                  <input
                                    type="color"
                                    value={String(s.card_bg || '#ffffff')}
                                    onChange={e => patch({ schema: { card_bg: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                                <ControlRow label="Borda do Card">
                                  <input
                                    type="color"
                                    value={String(s.card_border || '#e5e7eb')}
                                    onChange={e => patch({ schema: { card_border: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Título do Produto">
                                  <input
                                    type="color"
                                    value={String(s.card_title_color || '#404040')}
                                    onChange={e => patch({ schema: { card_title_color: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                                <ControlRow label="Cor das Estrelas">
                                  <input
                                    type="color"
                                    value={String(s.stars_color || '#f59e0b')}
                                    onChange={e => patch({ schema: { stars_color: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Preço Principal">
                                  <input
                                    type="color"
                                    value={String(s.price_color || '#111827')}
                                    onChange={e => patch({ schema: { price_color: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                                <ControlRow label="Preço Antigo (De)">
                                  <input
                                    type="color"
                                    value={String(s.old_price_color || '#696969')}
                                    onChange={e => patch({ schema: { old_price_color: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Fundo Badge %">
                                  <input
                                    type="color"
                                    value={String(s.discount_badge_bg || '#e6f7f4')}
                                    onChange={e => patch({ schema: { discount_badge_bg: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                                <ControlRow label="Texto Badge %">
                                  <input
                                    type="color"
                                    value={String(s.discount_badge_color || '#008775')}
                                    onChange={e => patch({ schema: { discount_badge_color: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Texto Pix">
                                  <input
                                    type="color"
                                    value={String(s.pix_color || '#111827')}
                                    onChange={e => patch({ schema: { pix_color: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                                <ControlRow label="Cor Ícone Seta">
                                  <input
                                    type="color"
                                    value={String(s.arrow_color || '#0033c6')}
                                    onChange={e => patch({ schema: { arrow_color: e.target.value } })}
                                    style={{ width: '100%', height: 30, padding: 0 }}
                                  />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>
                          </>
                        )}
                        {/* ESTILO: CONTADOR */}
                        {widgetType === 'counter' && (
                          <>
                            <ElementorAccordion title="Número" icon={Heading} isOpen={openSections.s_counter_num !== false} onToggle={() => toggleSection('s_counter_num')}>
                              <ControlRow label="Cor do Número">
                                <input type="color" value={String(s.number_color || c.number_color || s.color || '#1d1d1f')} onChange={e => patch({ schema: { number_color: e.target.value, color: e.target.value }, content: { number_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <ControlRow label="Tamanho da Fonte (ex: 3rem ou 48px)">
                                <input type="text" placeholder="3rem" value={String(s.number_size || c.number_size || '3rem')} onChange={e => patch({ schema: { number_size: e.target.value }, content: { number_size: e.target.value } })} />
                              </ControlRow>
                            </ElementorAccordion>

                            <ElementorAccordion title="Título" icon={Type} isOpen={openSections.s_counter_title !== false} onToggle={() => toggleSection('s_counter_title')}>
                              <ControlRow label="Cor do Título">
                                <input type="color" value={String(s.title_color || c.title_color || '#86868b')} onChange={e => patch({ schema: { title_color: e.target.value }, content: { title_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <ControlRow label="Tamanho do Título (ex: 0.95rem ou 15px)">
                                <input type="text" placeholder="0.95rem" value={String(s.title_size || c.title_size || '0.95rem')} onChange={e => patch({ schema: { title_size: e.target.value }, content: { title_size: e.target.value } })} />
                              </ControlRow>
                              <ControlRow label="Alinhamento">
                                <AlignmentButtonGroup
                                  value={String(s.text_align || s.align || 'center')}
                                  onChange={val => patch({ schema: { text_align: val, align: val }, content: { align: val } })}
                                />
                              </ControlRow>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* ESTILO: SANFONA / ACCORDION */}
                        {(widgetType === 'accordion' || widgetType === 'toggle') && (
                          <>
                            {/* 1. CAIXA DOS ITENS / BORDAS & SOMBRAS */}
                            <ElementorAccordion title="Sanfona / Caixa dos Itens" icon={SlidersHorizontal} isOpen={openSections.s_acc_box !== false} onToggle={() => toggleSection('s_acc_box')}>
                              <ControlRow label="Espaçamento entre Itens (px)">
                                <input type="number" min="0" max="40" placeholder="8" value={Number(s.item_gap !== undefined ? s.item_gap : (c.item_gap ?? 8))} onChange={e => patch({ schema: { item_gap: Number(e.target.value) }, content: { item_gap: Number(e.target.value) } })} />
                              </ControlRow>
                              <ControlRow label="Tipo de Borda">
                                <select value={String(s.border_style || c.border_style || 'solid')} onChange={e => patch({ schema: { border_style: e.target.value }, content: { border_style: e.target.value } })}>
                                  <option value="solid">Borda Completa (Estilo Cartão)</option>
                                  <option value="bottom_only">Apenas Linha Inferior (Clássica)</option>
                                  <option value="dashed">Tracejada</option>
                                  <option value="none">Sem Borda</option>
                                </select>
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Espessura da Borda (px)">
                                  <input type="number" min="0" max="10" placeholder="1" value={Number(s.border_width !== undefined ? s.border_width : (c.border_width ?? 1))} onChange={e => patch({ schema: { border_width: Number(e.target.value) }, content: { border_width: Number(e.target.value) } })} />
                                </ControlRow>
                                <ControlRow label="Arredondamento (px)">
                                  <input type="number" min="0" max="40" placeholder="8" value={Number(s.border_radius !== undefined ? s.border_radius : (c.border_radius ?? 8))} onChange={e => patch({ schema: { border_radius: Number(e.target.value) }, content: { border_radius: Number(e.target.value) } })} />
                                </ControlRow>
                              </div>

                              <ControlRow label="Sombra dos Itens / Efeito 3D">
                                <select value={String(s.box_shadow || c.box_shadow || 'none')} onChange={e => patch({ schema: { box_shadow: e.target.value }, content: { box_shadow: e.target.value } })}>
                                  <option value="none">Nenhuma</option>
                                  <option value="0 2px 8px rgba(0,0,0,0.06)">Leve (Estilo Apple)</option>
                                  <option value="0 4px 14px rgba(0,0,0,0.08)">Média / Cartão</option>
                                  <option value="0 8px 24px rgba(0,0,0,0.12)">Elevada / Flutuante</option>
                                  <option value="0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)">Suave</option>
                                </select>
                              </ControlRow>

                              {/* Estados da Borda */}
                              <div style={{ marginTop: 8 }}>
                                <div style={{ display: 'flex', background: '#f5f5f7', padding: 3, borderRadius: 8, gap: 4, marginBottom: 10 }}>
                                  {(['normal', 'hover', 'active'] as const).map(st => (
                                    <button
                                      key={st}
                                      type="button"
                                      onClick={() => setAccBorderTab(st)}
                                      style={{
                                        flex: 1,
                                        padding: '5px 8px',
                                        fontSize: 11,
                                        fontWeight: accBorderTab === st ? 700 : 500,
                                        borderRadius: 6,
                                        border: 'none',
                                        background: accBorderTab === st ? '#ffffff' : 'transparent',
                                        color: accBorderTab === st ? '#0071e3' : '#6e6e73',
                                        boxShadow: accBorderTab === st ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                        cursor: 'pointer',
                                        transition: 'all 0.15s ease'
                                      }}
                                    >
                                      {st === 'normal' ? 'Normal' : st === 'hover' ? 'Ao Passar' : 'Aberto'}
                                    </button>
                                  ))}
                                </div>

                                {accBorderTab === 'normal' && (
                                  <ControlRow label="Cor da Borda">
                                    <input type="color" value={String(s.border_color || c.border_color || '#e8e8ed')} onChange={e => patch({ schema: { border_color: e.target.value }, content: { border_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                  </ControlRow>
                                )}
                                {accBorderTab === 'hover' && (
                                  <ControlRow label="Cor da Borda (Ao passar o mouse)">
                                    <input type="color" value={String(s.hover_border_color || c.hover_border_color || '#0071e3')} onChange={e => patch({ schema: { hover_border_color: e.target.value }, content: { hover_border_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                  </ControlRow>
                                )}
                                {accBorderTab === 'active' && (
                                  <ControlRow label="Cor da Borda (Aberto / Ativo)">
                                    <input type="color" value={String(s.active_border_color || c.active_border_color || '#0071e3')} onChange={e => patch({ schema: { active_border_color: e.target.value }, content: { active_border_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                  </ControlRow>
                                )}
                              </div>
                            </ElementorAccordion>

                            {/* 2. TÍTULO / PERGUNTA */}
                            <ElementorAccordion title="Título / Pergunta" icon={Heading} isOpen={openSections.s_acc_title !== false} onToggle={() => toggleSection('s_acc_title')}>
                              <div style={{ display: 'flex', background: '#f5f5f7', padding: 3, borderRadius: 8, gap: 4, marginBottom: 10 }}>
                                {(['normal', 'hover', 'active'] as const).map(st => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => setAccTitleTab(st)}
                                    style={{
                                      flex: 1,
                                      padding: '5px 8px',
                                      fontSize: 11,
                                      fontWeight: accTitleTab === st ? 700 : 500,
                                      borderRadius: 6,
                                      border: 'none',
                                      background: accTitleTab === st ? '#ffffff' : 'transparent',
                                      color: accTitleTab === st ? '#0071e3' : '#6e6e73',
                                      boxShadow: accTitleTab === st ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    {st === 'normal' ? 'Normal' : st === 'hover' ? 'Ao Passar' : 'Aberto'}
                                  </button>
                                ))}
                              </div>

                              {accTitleTab === 'normal' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                  <ControlRow label="Cor do Título">
                                    <input type="color" value={String(s.title_color || c.title_color || '#1d1d1f')} onChange={e => patch({ schema: { title_color: e.target.value }, content: { title_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                  </ControlRow>
                                  <ControlRow label="Fundo do Título">
                                    <input type="color" value={String(s.title_bg || c.title_bg || '#ffffff')} onChange={e => patch({ schema: { title_bg: e.target.value }, content: { title_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                  </ControlRow>
                                </div>
                              )}

                              {accTitleTab === 'hover' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                  <ControlRow label="Cor (Hover)">
                                    <input type="color" value={String(s.title_hover_color || c.title_hover_color || '#0071e3')} onChange={e => patch({ schema: { title_hover_color: e.target.value }, content: { title_hover_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                  </ControlRow>
                                  <ControlRow label="Fundo (Hover)">
                                    <input type="color" value={String(s.title_hover_bg || c.title_hover_bg || '#f9fafb')} onChange={e => patch({ schema: { title_hover_bg: e.target.value }, content: { title_hover_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                  </ControlRow>
                                </div>
                              )}

                              {accTitleTab === 'active' && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                  <ControlRow label="Cor (Aberto)">
                                    <input type="color" value={String(s.title_active_color || c.title_active_color || '#0071e3')} onChange={e => patch({ schema: { title_active_color: e.target.value }, content: { title_active_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                  </ControlRow>
                                  <ControlRow label="Fundo (Aberto)">
                                    <input type="color" value={String(s.title_active_bg || c.title_active_bg || '#ffffff')} onChange={e => patch({ schema: { title_active_bg: e.target.value }, content: { title_active_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                  </ControlRow>
                                </div>
                              )}

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                                <ControlRow label="Tamanho da Fonte">
                                  <input type="text" placeholder="1.05rem" value={String(s.title_size || c.title_size || '1.05rem')} onChange={e => patch({ schema: { title_size: e.target.value }, content: { title_size: e.target.value } })} />
                                </ControlRow>
                                <ControlRow label="Peso da Fonte">
                                  <select value={String(s.title_weight || c.title_weight || '600')} onChange={e => patch({ schema: { title_weight: e.target.value }, content: { title_weight: e.target.value } })}>
                                    <option value="400">Normal (400)</option>
                                    <option value="500">Médio (500)</option>
                                    <option value="600">Seminegrito (600)</option>
                                    <option value="700">Negrito (700)</option>
                                  </select>
                                </ControlRow>
                              </div>

                              <ControlRow label="Espaçamento Interno / Padding">
                                <input type="text" placeholder="14px 18px" value={String(s.title_padding || c.title_padding || '14px 18px')} onChange={e => patch({ schema: { title_padding: e.target.value }, content: { title_padding: e.target.value } })} />
                              </ControlRow>
                            </ElementorAccordion>

                            {/* 3. ÍCONE DE ABERTURA (+ / -) */}
                            <ElementorAccordion title="Ícone (+ / -)" icon={PlusCircle} isOpen={openSections.s_acc_icon !== false} onToggle={() => toggleSection('s_acc_icon')}>
                              <div style={{ display: 'flex', background: '#f5f5f7', padding: 3, borderRadius: 8, gap: 4, marginBottom: 10 }}>
                                {(['normal', 'hover', 'active'] as const).map(st => (
                                  <button
                                    key={st}
                                    type="button"
                                    onClick={() => setAccIconTab(st)}
                                    style={{
                                      flex: 1,
                                      padding: '5px 8px',
                                      fontSize: 11,
                                      fontWeight: accIconTab === st ? 700 : 500,
                                      borderRadius: 6,
                                      border: 'none',
                                      background: accIconTab === st ? '#ffffff' : 'transparent',
                                      color: accIconTab === st ? '#0071e3' : '#6e6e73',
                                      boxShadow: accIconTab === st ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    {st === 'normal' ? 'Normal' : st === 'hover' ? 'Ao Passar' : 'Aberto'}
                                  </button>
                                ))}
                              </div>

                              {accIconTab === 'normal' && (
                                <ControlRow label="Cor do Ícone">
                                  <input type="color" value={String(s.icon_color || c.icon_color || '#86868b')} onChange={e => patch({ schema: { icon_color: e.target.value }, content: { icon_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                              )}
                              {accIconTab === 'hover' && (
                                <ControlRow label="Cor do Ícone (Hover)">
                                  <input type="color" value={String(s.icon_hover_color || c.icon_hover_color || '#0071e3')} onChange={e => patch({ schema: { icon_hover_color: e.target.value }, content: { icon_hover_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                              )}
                              {accIconTab === 'active' && (
                                <ControlRow label="Cor do Ícone (Aberto / Ativo)">
                                  <input type="color" value={String(s.icon_active_color || c.icon_active_color || '#0071e3')} onChange={e => patch({ schema: { icon_active_color: e.target.value }, content: { icon_active_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                              )}

                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                                <ControlRow label="Tamanho do Ícone">
                                  <input type="text" placeholder="1.25rem" value={String(s.icon_size || c.icon_size || '1.25rem')} onChange={e => patch({ schema: { icon_size: e.target.value }, content: { icon_size: e.target.value } })} />
                                </ControlRow>
                                <ControlRow label="Efeito de Animação">
                                  <select value={String(s.icon_animation || c.icon_animation || 'rotate')} onChange={e => patch({ schema: { icon_animation: e.target.value }, content: { icon_animation: e.target.value } })}>
                                    <option value="rotate">Giro Suave (45° / 180°)</option>
                                    <option value="scale">Zoom Leve</option>
                                    <option value="none">Sem Giro</option>
                                  </select>
                                </ControlRow>
                              </div>
                            </ElementorAccordion>

                            {/* 4. CONTEÚDO / RESPOSTA */}
                            <ElementorAccordion title="Conteúdo / Resposta" icon={FileText} isOpen={openSections.s_acc_content !== false} onToggle={() => toggleSection('s_acc_content')}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor do Texto">
                                  <input type="color" value={String(s.content_color || c.content_color || '#6e6e73')} onChange={e => patch({ schema: { content_color: e.target.value }, content: { content_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                                <ControlRow label="Fundo da Resposta">
                                  <input type="color" value={String(s.content_bg || c.content_bg || '#ffffff')} onChange={e => patch({ schema: { content_bg: e.target.value }, content: { content_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                                <ControlRow label="Tamanho da Fonte">
                                  <input type="text" placeholder="0.95rem" value={String(s.content_size || c.content_size || '0.95rem')} onChange={e => patch({ schema: { content_size: e.target.value }, content: { content_size: e.target.value } })} />
                                </ControlRow>
                                <ControlRow label="Altura da Linha">
                                  <input type="text" placeholder="1.7" value={String(s.content_line_height || c.content_line_height || '1.7')} onChange={e => patch({ schema: { content_line_height: e.target.value }, content: { content_line_height: e.target.value } })} />
                                </ControlRow>
                              </div>
                              <ControlRow label="Espaçamento Interno / Padding">
                                <input type="text" placeholder="14px 18px" value={String(s.content_padding || c.content_padding || '14px 18px')} onChange={e => patch({ schema: { content_padding: e.target.value }, content: { content_padding: e.target.value } })} />
                              </ControlRow>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* ESTILO: ABAS */}
                        {widgetType === 'tabs' && (
                          <>
                            <ElementorAccordion title="Abas de Navegação" icon={Layers} isOpen={openSections.s_tabs_nav !== false} onToggle={() => toggleSection('s_tabs_nav')}>
                              <ControlRow label="Alinhamento">
                                <AlignmentButtonGroup
                                  value={String(s.tab_align || c.tab_align || 'left')}
                                  onChange={val => patch({ schema: { tab_align: val }, content: { tab_align: val } })}
                                />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor Aba Inativa">
                                  <input type="color" value={String(s.tab_color || c.tab_color || '#6e6e73')} onChange={e => patch({ schema: { tab_color: e.target.value }, content: { tab_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                                <ControlRow label="Cor Aba Ativa">
                                  <input type="color" value={String(s.tab_active_color || c.tab_active_color || '#1d1d1f')} onChange={e => patch({ schema: { tab_active_color: e.target.value }, content: { tab_active_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                              </div>
                              <ControlRow label="Cor da Linha Indicadora Ativa">
                                <input type="color" value={String(s.tab_indicator_color || c.tab_indicator_color || '#1d1d1f')} onChange={e => patch({ schema: { tab_indicator_color: e.target.value }, content: { tab_indicator_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <ControlRow label="Tamanho da Fonte das Abas">
                                <input type="text" placeholder="0.95rem" value={String(s.tab_size || c.tab_size || '0.95rem')} onChange={e => patch({ schema: { tab_size: e.target.value }, content: { tab_size: e.target.value } })} />
                              </ControlRow>
                            </ElementorAccordion>

                            <ElementorAccordion title="Conteúdo da Aba" icon={FileText} isOpen={openSections.s_tabs_content !== false} onToggle={() => toggleSection('s_tabs_content')}>
                              <ControlRow label="Cor do Texto">
                                <input type="color" value={String(s.content_color || c.content_color || '#6e6e73')} onChange={e => patch({ schema: { content_color: e.target.value }, content: { content_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <ControlRow label="Tamanho da Fonte">
                                <input type="text" placeholder="0.95rem" value={String(s.content_size || c.content_size || '0.95rem')} onChange={e => patch({ schema: { content_size: e.target.value }, content: { content_size: e.target.value } })} />
                              </ControlRow>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* ESTILO: BARRA DE PROGRESSO */}
                        {(widgetType === 'progress' || widgetType === 'progressBar') && (
                          <>
                            <ElementorAccordion title="Barra de Progresso" icon={Activity} isOpen={openSections.s_prog_bar !== false} onToggle={() => toggleSection('s_prog_bar')}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor da Barra">
                                  <input type="color" value={String(s.bar_color || c.bar_color || c.color || '#B5F500')} onChange={e => patch({ schema: { bar_color: e.target.value }, content: { bar_color: e.target.value, color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                                <ControlRow label="Fundo da Trilha">
                                  <input type="color" value={String(s.bar_bg || c.bar_bg || '#e8e8ed')} onChange={e => patch({ schema: { bar_bg: e.target.value }, content: { bar_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Altura da Barra (px)">
                                  <input type="number" min="4" max="40" placeholder="10" value={Number(s.bar_height || c.bar_height || 10)} onChange={e => patch({ schema: { bar_height: Number(e.target.value) }, content: { bar_height: Number(e.target.value) } })} />
                                </ControlRow>
                                <ControlRow label="Arredondamento (px)">
                                  <input type="number" min="0" max="20" placeholder="5" value={Number(s.border_radius || c.border_radius || 5)} onChange={e => patch({ schema: { border_radius: Number(e.target.value) }, content: { border_radius: Number(e.target.value) } })} />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>

                            <ElementorAccordion title="Título" icon={Type} isOpen={openSections.s_prog_title !== false} onToggle={() => toggleSection('s_prog_title')}>
                              <ControlRow label="Cor do Título">
                                <input type="color" value={String(s.title_color || c.title_color || '#1d1d1f')} onChange={e => patch({ schema: { title_color: e.target.value }, content: { title_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* ESTILO: ÍCONE */}
                        {widgetType === 'icon' && (
                          <ElementorAccordion title="Ícone" icon={Star} isOpen={openSections.s_icon !== false} onToggle={() => toggleSection('s_icon')}>
                            <ControlRow label="Cor Principal">
                              <input type="color" value={String(s.icon_color || c.icon_color || s.color || '#0071e3')} onChange={e => patch({ schema: { icon_color: e.target.value, color: e.target.value }, content: { icon_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                            </ControlRow>
                            <ControlRow label="Tamanho do Ícone (px)">
                              <input type="number" min="12" max="160" placeholder="36" value={Number(s.icon_size || c.icon_size || 36)} onChange={e => patch({ schema: { icon_size: Number(e.target.value) }, content: { icon_size: Number(e.target.value) } })} />
                            </ControlRow>
                            <ControlRow label="Alinhamento">
                              <AlignmentButtonGroup
                                value={String(s.text_align || s.align || 'center')}
                                onChange={val => patch({ schema: { text_align: val, align: val }, content: { align: val } })}
                              />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: CAIXA DE ÍCONE */}
                        {widgetType === 'iconBox' && (
                          <>
                            <ElementorAccordion title="Ícone" icon={Star} isOpen={openSections.s_ib_icon !== false} onToggle={() => toggleSection('s_ib_icon')}>
                              <ControlRow label="Cor do Ícone">
                                <input type="color" value={String(s.icon_color || c.icon_color || '#1d1d1f')} onChange={e => patch({ schema: { icon_color: e.target.value }, content: { icon_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Tamanho (px)">
                                  <input type="number" min="16" max="96" placeholder="32" value={Number(s.icon_size || c.icon_size || 32)} onChange={e => patch({ schema: { icon_size: Number(e.target.value) }, content: { icon_size: Number(e.target.value) } })} />
                                </ControlRow>
                                <ControlRow label="Espaçamento (px)">
                                  <input type="number" min="0" max="48" placeholder="12" value={Number(s.icon_spacing || c.icon_spacing || 12)} onChange={e => patch({ schema: { icon_spacing: Number(e.target.value) }, content: { icon_spacing: Number(e.target.value) } })} />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>

                            <ElementorAccordion title="Conteúdo" icon={Type} isOpen={openSections.s_ib_content !== false} onToggle={() => toggleSection('s_ib_content')}>
                              <ControlRow label="Alinhamento">
                                <AlignmentButtonGroup
                                  value={String(s.text_align || c.align || 'center')}
                                  onChange={val => patch({ schema: { text_align: val }, content: { align: val } })}
                                />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor do Título">
                                  <input type="color" value={String(s.title_color || c.title_color || '#1d1d1f')} onChange={e => patch({ schema: { title_color: e.target.value }, content: { title_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                                <ControlRow label="Cor da Descrição">
                                  <input type="color" value={String(s.description_color || c.description_color || '#6e6e73')} onChange={e => patch({ schema: { description_color: e.target.value }, content: { description_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                              </div>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Tamanho Título">
                                  <input type="text" placeholder="20px" value={String(s.title_size || c.title_size || '20px')} onChange={e => patch({ schema: { title_size: e.target.value }, content: { title_size: e.target.value } })} />
                                </ControlRow>
                                <ControlRow label="Tamanho Descrição">
                                  <input type="text" placeholder="14px" value={String(s.description_size || c.description_size || '14px')} onChange={e => patch({ schema: { description_size: e.target.value }, content: { description_size: e.target.value } })} />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>

                            <ElementorAccordion title="Caixa" icon={Box} isOpen={openSections.s_ib_box !== false} onToggle={() => toggleSection('s_ib_box')}>
                              <ControlRow label="Cor de Fundo">
                                <input type="color" value={String(s.bg_color || '#ffffff')} onChange={e => patch({ schema: { bg_color: e.target.value, backgroundColor: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Arredondamento (px)">
                                  <input type="number" placeholder="16" value={Number(s.border_radius || 16)} onChange={e => patch({ schema: { border_radius: Number(e.target.value) } })} />
                                </ControlRow>
                                <ControlRow label="Padding (px)">
                                  <input type="text" placeholder="24px" value={String(s.padding || '24px')} onChange={e => patch({ schema: { padding: e.target.value } })} />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* ESTILO: CAIXA DE IMAGEM */}
                        {widgetType === 'imageBox' && (
                          <>
                            <ElementorAccordion title="Imagem" icon={ImageIcon} isOpen={openSections.s_imb_img !== false} onToggle={() => toggleSection('s_imb_img')}>
                              <ControlRow label="Altura da Imagem (px)">
                                <input type="number" min="80" max="600" placeholder="180" value={Number(s.img_height || c.img_height || 180)} onChange={e => patch({ schema: { img_height: Number(e.target.value) }, content: { img_height: Number(e.target.value) } })} />
                              </ControlRow>
                              <ControlRow label="Arredondamento da Imagem (px)">
                                <input type="number" min="0" max="40" placeholder="12" value={Number(s.img_radius || c.img_radius || 12)} onChange={e => patch({ schema: { img_radius: Number(e.target.value) }, content: { img_radius: Number(e.target.value) } })} />
                              </ControlRow>
                            </ElementorAccordion>

                            <ElementorAccordion title="Conteúdo" icon={Type} isOpen={openSections.s_imb_content !== false} onToggle={() => toggleSection('s_imb_content')}>
                              <ControlRow label="Alinhamento">
                                <AlignmentButtonGroup
                                  value={String(s.text_align || c.align || 'center')}
                                  onChange={val => patch({ schema: { text_align: val }, content: { align: val } })}
                                />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor do Título">
                                  <input type="color" value={String(s.title_color || c.title_color || '#1d1d1f')} onChange={e => patch({ schema: { title_color: e.target.value }, content: { title_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                                <ControlRow label="Cor da Descrição">
                                  <input type="color" value={String(s.description_color || c.description_color || '#6e6e73')} onChange={e => patch({ schema: { description_color: e.target.value }, content: { description_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* ESTILO: LISTA COM ÍCONES */}
                        {widgetType === 'iconList' && (
                          <ElementorAccordion title="Lista com Ícones" icon={List} isOpen={openSections.s_il_style !== false} onToggle={() => toggleSection('s_il_style')}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Cor do Ícone">
                                <input type="color" value={String(s.icon_color || c.icon_color || '#a2e000')} onChange={e => patch({ schema: { icon_color: e.target.value }, content: { icon_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <ControlRow label="Cor do Texto">
                                <input type="color" value={String(s.text_color || c.text_color || s.color || '#1d1d1f')} onChange={e => patch({ schema: { text_color: e.target.value, color: e.target.value }, content: { text_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                            </div>
                            <ControlRow label="Espaçamento entre Itens (px)">
                              <input type="number" min="4" max="40" placeholder="12" value={Number(s.gap || c.gap || 12)} onChange={e => patch({ schema: { gap: Number(e.target.value) }, content: { gap: Number(e.target.value) } })} />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: DEPOIMENTO */}
                        {widgetType === 'testimonial' && (
                          <>
                            <ElementorAccordion title="Citação & Texto" icon={MessageSquare} isOpen={openSections.s_test_quote !== false} onToggle={() => toggleSection('s_test_quote')}>
                              <ControlRow label="Alinhamento">
                                <AlignmentButtonGroup
                                  value={String(s.text_align || c.align || 'center')}
                                  onChange={val => patch({ schema: { text_align: val }, content: { align: val } })}
                                />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Cor da Citação">
                                  <input type="color" value={String(s.text_color || c.text_color || s.color || '#1d1d1f')} onChange={e => patch({ schema: { text_color: e.target.value, color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                                <ControlRow label="Cor do Autor">
                                  <input type="color" value={String(s.name_color || c.name_color || '#1d1d1f')} onChange={e => patch({ schema: { name_color: e.target.value }, content: { name_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                                </ControlRow>
                              </div>
                              <ControlRow label="Cor do Cargo / Função">
                                <input type="color" value={String(s.job_color || c.job_color || '#86868b')} onChange={e => patch({ schema: { job_color: e.target.value }, content: { job_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                            </ElementorAccordion>

                            <ElementorAccordion title="Caixa do Depoimento" icon={Box} isOpen={openSections.s_test_box !== false} onToggle={() => toggleSection('s_test_box')}>
                              <ControlRow label="Cor de Fundo">
                                <input type="color" value={String(s.bg_color || '#ffffff')} onChange={e => patch({ schema: { bg_color: e.target.value, backgroundColor: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                <ControlRow label="Arredondamento (px)">
                                  <input type="number" placeholder="16" value={Number(s.border_radius || 16)} onChange={e => patch({ schema: { border_radius: Number(e.target.value) } })} />
                                </ControlRow>
                                <ControlRow label="Padding (px)">
                                  <input type="text" placeholder="24px" value={String(s.padding || '24px')} onChange={e => patch({ schema: { padding: e.target.value } })} />
                                </ControlRow>
                              </div>
                            </ElementorAccordion>
                          </>
                        )}

                        {/* ESTILO: AVALIAÇÃO POR ESTRELAS */}
                        {(widgetType === 'starRating' || widgetType === 'rating') && (
                          <ElementorAccordion title="Estilo das Estrelas" icon={Star} isOpen={openSections.s_sr_style !== false} onToggle={() => toggleSection('s_sr_style')}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Cor das Estrelas">
                                <input type="color" value={String(s.star_color || c.star_color || '#f59e0b')} onChange={e => patch({ schema: { star_color: e.target.value }, content: { star_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <ControlRow label="Tamanho (px)">
                                <input type="number" min="12" max="48" placeholder="18" value={Number(s.star_size || c.star_size || 18)} onChange={e => patch({ schema: { star_size: Number(e.target.value) }, content: { star_size: Number(e.target.value) } })} />
                              </ControlRow>
                            </div>
                            <ControlRow label="Alinhamento">
                              <AlignmentButtonGroup
                                value={String(s.text_align || c.align || 'left')}
                                onChange={val => patch({ schema: { text_align: val }, content: { align: val } })}
                              />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: ALERTA */}
                        {widgetType === 'alert' && (
                          <ElementorAccordion title="Estilo do Alerta" icon={AlertCircle} isOpen={openSections.s_al_style !== false} onToggle={() => toggleSection('s_al_style')}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Fundo">
                                <input type="color" value={String(s.bg_color || '#fffbeb')} onChange={e => patch({ schema: { bg_color: e.target.value, backgroundColor: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <ControlRow label="Cor do Texto">
                                <input type="color" value={String(s.color || '#b45309')} onChange={e => patch({ schema: { color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                            </div>
                            <ControlRow label="Arredondamento (px)">
                              <input type="number" min="0" max="30" placeholder="8" value={Number(s.border_radius || 8)} onChange={e => patch({ schema: { border_radius: Number(e.target.value) } })} />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: ÍCONES SOCIAIS */}
                        {(widgetType === 'socialIcons' || widgetType === 'shareButtons') && (
                          <ElementorAccordion title="Ícones Sociais" icon={Share2} isOpen={openSections.s_soc_style !== false} onToggle={() => toggleSection('s_soc_style')}>
                            <ControlRow label="Tamanho dos Ícones (px)">
                              <input type="number" min="14" max="64" placeholder="24" value={Number(s.icon_size || c.icon_size || 24)} onChange={e => patch({ schema: { icon_size: Number(e.target.value) }, content: { icon_size: Number(e.target.value) } })} />
                            </ControlRow>
                            <ControlRow label="Espaçamento (px)">
                              <input type="number" min="4" max="40" placeholder="12" value={Number(s.gap || c.gap || 12)} onChange={e => patch({ schema: { gap: Number(e.target.value) }, content: { gap: Number(e.target.value) } })} />
                            </ControlRow>
                            <ControlRow label="Alinhamento">
                              <AlignmentButtonGroup
                                value={String(s.text_align || c.align || 'center')}
                                onChange={val => patch({ schema: { text_align: val }, content: { align: val } })}
                              />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: TABELA DE PREÇOS */}
                        {(widgetType === 'priceTable' || widgetType === 'priceTablePro') && (
                          <ElementorAccordion title="Estilo da Tabela de Preços" icon={Table} isOpen={openSections.s_pt_style !== false} onToggle={() => toggleSection('s_pt_style')}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Fundo do Card">
                                <input type="color" value={String(s.card_bg || c.card_bg || '#ffffff')} onChange={e => patch({ schema: { card_bg: e.target.value }, content: { card_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <ControlRow label="Cor do Preço">
                                <input type="color" value={String(s.price_color || c.price_color || '#1d1d1f')} onChange={e => patch({ schema: { price_color: e.target.value }, content: { price_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Cor do Botão">
                                <input type="color" value={String(s.button_color || c.button_color || '#ffffff')} onChange={e => patch({ schema: { button_color: e.target.value }, content: { button_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <ControlRow label="Fundo do Botão">
                                <input type="color" value={String(s.button_bg || c.button_bg || '#1d1d1f')} onChange={e => patch({ schema: { button_bg: e.target.value }, content: { button_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                            </div>
                            <ControlRow label="Arredondamento do Card (px)">
                              <input type="number" placeholder="16" value={Number(s.border_radius || 16)} onChange={e => patch({ schema: { border_radius: Number(e.target.value) } })} />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: CONTAGEM REGRESSIVA */}
                        {(widgetType === 'countdown' || widgetType === 'countdownPro') && (
                          <ElementorAccordion title="Estilo da Contagem Regressiva" icon={Clock} isOpen={openSections.s_cd_style !== false} onToggle={() => toggleSection('s_cd_style')}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Cor dos Dígitos">
                                <input type="color" value={String(s.number_color || c.number_color || '#B5F500')} onChange={e => patch({ schema: { number_color: e.target.value }, content: { number_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <ControlRow label="Fundo dos Blocos">
                                <input type="color" value={String(s.item_bg || c.item_bg || '#2a2a30')} onChange={e => patch({ schema: { item_bg: e.target.value }, content: { item_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Tamanho Dígitos">
                                <input type="text" placeholder="1.8rem" value={String(s.number_size || c.number_size || '1.8rem')} onChange={e => patch({ schema: { number_size: e.target.value }, content: { number_size: e.target.value } })} />
                              </ControlRow>
                              <ControlRow label="Cor dos Rótulos">
                                <input type="color" value={String(s.label_color || c.label_color || '#ffffff')} onChange={e => patch({ schema: { label_color: e.target.value }, content: { label_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                            </div>
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: FLIP BOX */}
                        {(widgetType === 'flipBox' || widgetType === 'flipBoxPro') && (
                          <ElementorAccordion title="Estilo do Flip Box" icon={Layers} isOpen={openSections.s_fb_style !== false} onToggle={() => toggleSection('s_fb_style')}>
                            <ControlRow label="Altura do Flip Box (px)">
                              <input type="number" min="150" max="600" placeholder="320" value={Number(s.height || c.height || 320)} onChange={e => patch({ schema: { height: Number(e.target.value) }, content: { height: Number(e.target.value) } })} />
                            </ControlRow>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Fundo Frente">
                                <input type="color" value={String(s.front_bg || c.front_bg || '#1d1d1f')} onChange={e => patch({ schema: { front_bg: e.target.value }, content: { front_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <ControlRow label="Fundo Verso">
                                <input type="color" value={String(s.back_bg || c.back_bg || '#0071e3')} onChange={e => patch({ schema: { back_bg: e.target.value }, content: { back_bg: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                            </div>
                            <ControlRow label="Arredondamento (px)">
                              <input type="number" placeholder="16" value={Number(s.border_radius || 16)} onChange={e => patch({ schema: { border_radius: Number(e.target.value) } })} />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: TÍTULO ANIMADO */}
                        {(widgetType === 'animatedHeadline' || widgetType === 'animatedHeadlinePro') && (
                          <ElementorAccordion title="Estilo do Título Animado" icon={Heading} isOpen={openSections.s_ah_style !== false} onToggle={() => toggleSection('s_ah_style')}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Cor Texto Normal">
                                <input type="color" value={String(s.color || '#1d1d1f')} onChange={e => patch({ schema: { color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <ControlRow label="Cor do Destaque">
                                <input type="color" value={String(s.highlight_color || c.highlight_color || '#B5F500')} onChange={e => patch({ schema: { highlight_color: e.target.value }, content: { highlight_color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                            </div>
                            <ControlRow label="Alinhamento">
                              <AlignmentButtonGroup
                                value={String(s.text_align || 'center')}
                                onChange={val => patch({ schema: { text_align: val } })}
                              />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: GOOGLE MAPS */}
                        {(widgetType === 'googleMaps' || widgetType === 'googleMapsPro' || widgetType === 'google-maps') && (
                          <ElementorAccordion title="Estilo do Google Maps" icon={MapPin} isOpen={openSections.s_gm_style !== false} onToggle={() => toggleSection('s_gm_style')}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Altura (px)">
                                <input type="number" min="150" max="800" placeholder="350" value={Number(s.height || c.height || 350)} onChange={e => patch({ schema: { height: Number(e.target.value) }, content: { height: Number(e.target.value) } })} />
                              </ControlRow>
                              <ControlRow label="Arredondamento (px)">
                                <input type="number" min="0" max="40" placeholder="16" value={Number(s.border_radius || 16)} onChange={e => patch({ schema: { border_radius: Number(e.target.value) } })} />
                              </ControlRow>
                            </div>
                            <ControlRow label="Alinhamento">
                              <AlignmentButtonGroup
                                value={String(s.text_align || 'center')}
                                onChange={val => patch({ schema: { text_align: val } })}
                              />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* ESTILO: ESPAÇADOR */}
                        {widgetType === 'spacer' && (
                          <ElementorAccordion title="Espaçador" icon={MoveVertical} isOpen={openSections.s_sp_style !== false} onToggle={() => toggleSection('s_sp_style')}>
                            <ControlRow label="Altura do Espaço (px)">
                              <input type="number" min="10" max="400" placeholder="50" value={Number(s.height || c.height || 50)} onChange={e => patch({ schema: { height: Number(e.target.value) }, content: { height: Number(e.target.value) } })} />
                            </ControlRow>
                          </ElementorAccordion>
                        )}

                        {/* Seção Geral: Cores, Fundo e Borda para qualquer widget (NUNCA FICA VAZIO) */}
                        {!['container', 'grid'].includes(widgetType) && (
                          <ElementorAccordion title="Aparência & Caixa Geral" icon={Palette} isOpen={openSections.s_gen_style === true} onToggle={() => toggleSection('s_gen_style')}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Cor do Texto">
                                <input type="color" value={String(s.color || '#1d1d1f')} onChange={e => patch({ schema: { color: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                              <ControlRow label="Cor de Fundo">
                                <input type="color" value={String(s.bg_color || s.backgroundColor || '#ffffff')} onChange={e => patch({ schema: { bg_color: e.target.value, backgroundColor: e.target.value } })} style={{ width: '100%', height: 30, padding: 0 }} />
                              </ControlRow>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <ControlRow label="Arredondamento (px)">
                                <input type="number" min="0" max="60" placeholder="0" value={Number(s.border_radius || 0)} onChange={e => patch({ schema: { border_radius: Number(e.target.value) } })} />
                              </ControlRow>
                              <ControlRow label="Opacidade (0 a 1)">
                                <input type="number" min="0" max="1" step="0.05" placeholder="1" value={s.opacity !== undefined ? Number(s.opacity) : 1} onChange={e => patch({ schema: { opacity: Number(e.target.value) } })} />
                              </ControlRow>
                            </div>
                            <ControlRow label="Padding Interno (ex: 16px ou 20px 24px)">
                              <input type="text" placeholder="0px" value={String(s.padding || '')} onChange={e => patch({ schema: { padding: e.target.value } })} />
                            </ControlRow>
                          </ElementorAccordion>
                        )}
                      </div>
                    )}

                    {/* ==================================================== */}
                    {/* 3. ABA AVANÇADO (Padronizada 1:1 Screenshot 5) */}
                    {/* ==================================================== */}
                    {inspectorTab === 'advanced' && (
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* 1. LAYOUT (1:1 com HTML do Elementor) */}
                        <ElementorAccordion title="Layout" icon={SlidersHorizontal} isOpen={openSections.adv_layout !== false} onToggle={() => toggleSection('adv_layout')}>
                          {/* Margem */}
                          <LinkedDimensionsControl
                            label="Margem"
                            prefix="margin"
                            schema={s}
                            onChange={updates => {
                              const top = updates.margin_top ?? s.margin_top ?? 0
                              const right = updates.margin_right ?? s.margin_right ?? 0
                              const bottom = updates.margin_bottom ?? s.margin_bottom ?? 0
                              const left = updates.margin_left ?? s.margin_left ?? 0
                              const unit = updates.margin_unit ?? s.margin_unit ?? 'px'
                              patch({ schema: { ...updates, margin: `${top}${unit} ${right}${unit} ${bottom}${unit} ${left}${unit}` } })
                            }}
                          />

                          {/* Preenchimento */}
                          <LinkedDimensionsControl
                            label="Preenchimento"
                            prefix="padding"
                            schema={s}
                            onChange={updates => {
                              const top = updates.padding_top ?? s.padding_top ?? 0
                              const right = updates.padding_right ?? s.padding_right ?? 0
                              const bottom = updates.padding_bottom ?? s.padding_bottom ?? 0
                              const left = updates.padding_left ?? s.padding_left ?? 0
                              const unit = updates.padding_unit ?? s.padding_unit ?? 'px'
                              patch({ schema: { ...updates, padding: `${top}${unit} ${right}${unit} ${bottom}${unit} ${left}${unit}` } })
                            }}
                          />

                          {/* Largura */}
                          <div className="elementor-control-row">
                            <div className="elementor-control-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="elementor-control-title">Largura</span>
                                <DeviceTag />
                              </div>
                              <select
                                className="elementor-units-select"
                                style={{ width: 140 }}
                                value={String(s.width_preset || s._element_width || 'default')}
                                onChange={e => patch({ schema: { width_preset: e.target.value, _element_width: e.target.value } })}
                              >
                                <option value="default">Padrão</option>
                                <option value="inherit">Largura total (100%)</option>
                                <option value="auto">Em linha (auto)</option>
                                <option value="initial">Personalizado</option>
                              </select>
                            </div>
                          </div>

                          {/* Largura personalizada (quando largura === 'initial') */}
                          {(s.width_preset === 'initial' || s._element_width === 'initial') && (
                            <ElementorSliderControl
                              label="Largura personalizada"
                              value={s.custom_width_val ?? 100}
                              unit={s.custom_width_unit || '%'}
                              units={['%', 'px', 'vw']}
                              min={0}
                              max={s.custom_width_unit === 'px' ? 1200 : 100}
                              onChange={val => {
                                const u = s.custom_width_unit || '%'
                                patch({ schema: { custom_width_val: val, width: val === '' ? '' : `${val}${u}` } })
                              }}
                              onUnitChange={u => {
                                const val = s.custom_width_val ?? 100
                                patch({ schema: { custom_width_unit: u, width: `${val}${u}` } })
                              }}
                            />
                          )}

                          {/* Alinhar-se */}
                          <div className="elementor-control-row">
                            <div className="elementor-control-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span className="elementor-control-title">Alinhar-se</span>
                                <DeviceTag />
                              </div>
                              <div className="elementor-align-group">
                                {[
                                  { key: 'flex-start', icon: AlignVerticalJustifyStart, label: 'Início' },
                                  { key: 'center', icon: AlignVerticalJustifyCenter, label: 'Centro' },
                                  { key: 'flex-end', icon: AlignVerticalJustifyEnd, label: 'Fim' },
                                  { key: 'stretch', icon: Maximize2, label: 'Esticar' }
                                ].map(opt => {
                                  const IconComp = opt.icon
                                  const isActive = (s.align_self || s._flex_align_self || 'auto') === opt.key
                                  return (
                                    <button
                                      key={opt.key}
                                      type="button"
                                      className={`elementor-align-btn ${isActive ? 'active' : ''}`}
                                      title={opt.label}
                                      onClick={() => patch({ schema: { align_self: opt.key, _flex_align_self: opt.key } })}
                                    >
                                      <IconComp size={13} />
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                            <span style={{ fontSize: 10, color: '#7b848c', display: 'block', marginTop: 2 }}>
                              Este controle afetará apenas os elementos contidos.
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <ControlRow label="Posição">
                              <select value={String(s.position || 'static')} onChange={e => patch({ schema: { position: e.target.value } })}>
                                <option value="static">Padrão</option>
                                <option value="relative">Relativo</option>
                                <option value="absolute">Absoluto</option>
                                <option value="fixed">Fixo</option>
                              </select>
                            </ControlRow>
                            <ControlRow label="Z-Index">
                              <input
                                type="number"
                                placeholder="1"
                                value={s.z_index ?? ''}
                                onChange={e => patch({ schema: { z_index: e.target.value === '' ? '' : Number(e.target.value) } })}
                              />
                            </ControlRow>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <ControlRow label="ID CSS">
                              <input
                                type="text"
                                placeholder="meu-id"
                                value={String(s.html_id || '')}
                                onChange={e => patch({ schema: { html_id: e.target.value } })}
                              />
                            </ControlRow>
                            <ControlRow label="Classes CSS">
                              <input
                                type="text"
                                placeholder="minha-classe"
                                value={String(s.custom_class || '')}
                                onChange={e => patch({ schema: { custom_class: e.target.value } })}
                              />
                            </ControlRow>
                          </div>
                        </ElementorAccordion>

                        {/* 2. EFEITOS DE MOVIMENTO */}
                        <ElementorAccordion title="Efeitos de movimento" icon={Zap} isOpen={openSections.adv_motion === true} onToggle={() => toggleSection('adv_motion')}>
                          <ControlRow label="Animação de Entrada">
                            <select value={String(s.animation_type || 'none')} onChange={e => patch({ schema: { animation_type: e.target.value } })}>
                              <option value="none">Nenhuma</option>
                              <option value="fadeIn">Fade In</option>
                              <option value="fadeInDown">Fade In Down</option>
                              <option value="fadeInUp">Fade In Up</option>
                              <option value="zoomIn">Zoom In</option>
                              <option value="bounceIn">Bounce In</option>
                            </select>
                          </ControlRow>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <ControlRow label="Duração">
                              <select value={String(s.animation_duration || 'normal')} onChange={e => patch({ schema: { animation_duration: e.target.value } })}>
                                <option value="slow">Lento</option>
                                <option value="normal">Normal</option>
                                <option value="fast">Rápido</option>
                              </select>
                            </ControlRow>
                            <ControlRow label="Atraso (ms)">
                              <input
                                type="number"
                                step="100"
                                placeholder="0"
                                value={s.animation_delay ?? ''}
                                onChange={e => patch({ schema: { animation_delay: e.target.value === '' ? '' : Number(e.target.value) } })}
                              />
                            </ControlRow>
                          </div>
                        </ElementorAccordion>

                        {/* 3. TRANSFORMAR */}
                        <ElementorAccordion title="Transformar" icon={Maximize2} isOpen={openSections.adv_transform === true} onToggle={() => toggleSection('adv_transform')}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <ControlRow label="Rotação (deg)">
                              <input
                                type="number"
                                placeholder="0"
                                value={s.transform_rotate ?? ''}
                                onChange={e => patch({ schema: { transform_rotate: e.target.value === '' ? '' : Number(e.target.value) } })}
                              />
                            </ControlRow>
                            <ControlRow label="Escala (Zoom)">
                              <input
                                type="number"
                                step="0.1"
                                placeholder="1"
                                value={s.transform_scale ?? ''}
                                onChange={e => patch({ schema: { transform_scale: e.target.value === '' ? '' : Number(e.target.value) } })}
                              />
                            </ControlRow>
                          </div>
                        </ElementorAccordion>

                        {/* 4. PLANO DE FUNDO */}
                        <ElementorAccordion title="Plano de fundo" icon={Box} isOpen={openSections.adv_bg === true} onToggle={() => toggleSection('adv_bg')}>
                          <ControlRow label="Cor de Fundo">
                            <input
                              type="color"
                              value={String(s.adv_bg_color || '#ffffff')}
                              onChange={e => patch({ schema: { adv_bg_color: e.target.value } })}
                              style={{ width: '100%', height: 32, padding: 0 }}
                            />
                          </ControlRow>
                          <ControlRow label="Imagem de Fundo">
                            <ImageMediaControl value={String(s.adv_bg_image || '')}
                              onChange={value => patch({ schema: { adv_bg_image: value } })}
                            />
                          </ControlRow>
                        </ElementorAccordion>

                        {/* 5. BORDA */}
                        <ElementorAccordion title="Borda" icon={Sliders} isOpen={openSections.adv_border === true} onToggle={() => toggleSection('adv_border')}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                            <ControlRow label="Tipo de Borda">
                              <select value={String(s.adv_border_type || 'none')} onChange={e => patch({ schema: { adv_border_type: e.target.value } })}>
                                <option value="none">Nenhuma</option>
                                <option value="solid">Sólida</option>
                                <option value="dashed">Tracejada</option>
                                <option value="dotted">Pontilhada</option>
                              </select>
                            </ControlRow>
                            <ControlRow label="Arredondamento (px)">
                              <input
                                type="number"
                                placeholder="0"
                                value={s.adv_border_radius ?? ''}
                                onChange={e => patch({ schema: { adv_border_radius: e.target.value === '' ? '' : Number(e.target.value) } })}
                              />
                            </ControlRow>
                          </div>
                          <ControlRow label="Cor da Borda">
                            <input
                              type="color"
                              value={String(s.adv_border_color || '#e2e8f0')}
                              onChange={e => patch({ schema: { adv_border_color: e.target.value } })}
                              style={{ width: '100%', height: 30, padding: 0 }}
                            />
                          </ControlRow>
                        </ElementorAccordion>

                        {/* 6. RESPONSIVO */}
                        <ElementorAccordion title="Responsivo" icon={Monitor} isOpen={openSections.adv_resp !== false} onToggle={() => toggleSection('adv_resp')}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={!!s.hide_desktop}
                              onChange={e => patch({ schema: { hide_desktop: e.target.checked } })}
                            />
                            Ocultar no Computador (Desktop)
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, marginBottom: 8, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={!!s.hide_tablet}
                              onChange={e => patch({ schema: { hide_tablet: e.target.checked } })}
                            />
                            Ocultar no Tablet
                          </label>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={!!s.hide_mobile}
                              onChange={e => patch({ schema: { hide_mobile: e.target.checked } })}
                            />
                            Ocultar no Celular (Mobile)
                          </label>
                        </ElementorAccordion>

                        {/* 7. CUSTOM CSS */}
                        <ElementorAccordion title="Custom CSS" icon={Code} isOpen={openSections.adv_css === true} onToggle={() => toggleSection('adv_css')}>
                          <ControlRow label="CSS Personalizado" description="Use selector para atingir este elemento">
                            <textarea
                              rows={4}
                              placeholder="selector { border: 1px solid #000; }"
                              value={String(s.custom_css || '')}
                              onChange={e => patch({ schema: { custom_css: e.target.value } })}
                              style={{ fontFamily: 'monospace', fontSize: 11 }}
                            />
                          </ControlRow>
                        </ElementorAccordion>

                        {/* Botão Restaurar Padrões */}
                        <div style={{ padding: 12 }}>
                          <button
                            type="button"
                            onClick={() => {
                              const global = editScope === 'global' && !!widget.globalKey
                              const next = { ...(global ? globalEdits : edits) }
                              delete next[global ? widget.globalKey! : selected]
                              change(global ? { ...edits, __global__: { tree: next } } : next)
                            }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', padding: '10px 12px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: '#475569', fontWeight: 600 }}
                          >
                            <RotateCcw size={14} /> Restaurar Padrões deste Widget
                          </button>
                        </div>

                        {/* Rodapé "Preciso de ajuda (?)" (1:1 Screenshots 2, 4, 5) */}
                        <a
                          href="https://elementor.com/help/"
                          target="_blank"
                          rel="noreferrer"
                          className="elementor-help-link"
                        >
                          <HelpCircle size={14} /> Preciso de ajuda
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )
            )}
          </div>

          <div className="elementor-sidebar-footer">
            <button className="footer-tool-btn" title="Desfazer" disabled={!position} onClick={() => setPosition(position - 1)}>
              <Undo2 size={16} />
            </button>
            <span style={{ fontSize: 11, color: '#64748b' }}>{widgets.length} elementos</span>
            <button className="footer-tool-btn" title="Configurações" onClick={() => setPanel('settings')}>
              <Settings size={16} />
            </button>
          </div>
        </aside>
      )}

      {/* ÁREA PRINCIPAL COM CANVAS E TOPBAR */}
      <div className="restored-main">
        <div className="elementor-topbar">
          <div className="topbar-left">
            <Link className="topbar-back-btn" to="/hub/paginas" aria-label="Voltar ao HUB" onClick={e => { if (dirty && !window.confirm('Sair sem salvar as alterações?')) e.preventDefault() }}>
              <ChevronLeft size={18} />
            </Link>
            <span className="topbar-collections-btn">{target?.title || 'Editor de página'}</span>
            <span className={`topbar-status ${target?.row?.status === 'published' ? 'published' : 'draft'}`}>
              {dirty ? '● Não salvo' : target?.row?.status === 'published' ? '● Publicado' : '○ Rascunho'}
            </span>
          </div>
          <div className="topbar-center">
            <div className="topbar-device-switcher">
              {([['desktop', Monitor, 'Computador'], ['tablet', Tablet, 'Tablet'], ['mobile', Smartphone, 'Celular']] as const).map(([mode, Icon, lbl]) => (
                <button key={mode} aria-label={lbl} className={`topbar-device-btn ${viewport === mode ? 'active' : ''}`} onClick={() => setViewport(mode)}>
                  <Icon size={15} />
                </button>
              ))}
            </div>
          </div>
          <div className="topbar-right">
            <button className="topbar-icon-btn" title="Desfazer" disabled={!position || saving} onClick={() => setPosition(position - 1)}>
              <Undo2 size={16} />
            </button>
            <button className="topbar-icon-btn" title="Refazer" disabled={position >= history.length - 1 || saving} onClick={() => setPosition(position + 1)}>
              <Redo2 size={16} />
            </button>
            <button className="topbar-icon-btn" title="Estrutura" onClick={() => setNavigator(!navigator)}>
              <Layers size={16} />
            </button>
            <button className="topbar-preview-btn" onClick={() => setPreviewing(!previewing)}>
              <Eye size={15} />{previewing ? 'Voltar ao editor' : 'Visualizar'}
            </button>
            <button className="topbar-preview-btn" disabled={!target || !dirty || saving} onClick={() => save()}>
              <Save size={15} />Salvar rascunho
            </button>
            <div className="elementor-publish-btn-group" ref={publishDropdownRef} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <button
                type="button"
                className="topbar-publish-btn-pro"
                disabled={!target || saving}
                onClick={() => save(true)}
                title="Publicar"
                style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, paddingRight: 10 }}
              >
                {saving ? 'Salvando…' : 'Publicar'}
              </button>
              <button
                type="button"
                className="topbar-publish-arrow-btn"
                disabled={!target || saving}
                onClick={() => setPublishMenuOpen(!publishMenuOpen)}
                style={{
                  background: '#0071e3',
                  color: '#ffffff',
                  border: 'none',
                  borderLeft: '1px solid rgba(255,255,255,0.25)',
                  height: 32,
                  padding: '0 8px',
                  borderTopRightRadius: 6,
                  borderBottomRightRadius: 6,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Escolher alcance da publicação"
              >
                <ChevronDown size={14} style={{ transform: publishMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }} />
              </button>

              {publishMenuOpen && (
                <div
                  className="elementor-publish-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid #d2d2d7',
                    borderRadius: 8,
                    boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                    minWidth: 260,
                    zIndex: 99999,
                    overflow: 'hidden',
                    padding: 4
                  }}
                >
                  <div style={{ padding: '6px 10px', fontSize: 11, fontWeight: 700, color: '#86868b', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Alcance da Publicação
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditScope('local')
                      setPublishMenuOpen(false)
                      save(true, 'local')
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: editScope === 'local' ? '#f5f5f7' : 'transparent',
                      border: 'none',
                      borderRadius: 6,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8
                    }}
                  >
                    <div style={{ marginTop: 2 }}>{editScope === 'local' ? <Check size={14} color="#0071e3" /> : <div style={{ width: 14 }} />}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1d1d1f' }}>Nesta página</div>
                      <div style={{ fontSize: 11, color: '#86868b' }}>Publicar alterações apenas para esta página</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditScope('global')
                      setPublishMenuOpen(false)
                      save(true, 'global')
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: editScope === 'global' ? '#f5f5f7' : 'transparent',
                      border: 'none',
                      borderRadius: 6,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 8
                    }}
                  >
                    <div style={{ marginTop: 2 }}>{editScope === 'global' ? <Check size={14} color="#0071e3" /> : <div style={{ width: 14 }} />}</div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1d1d1f' }}>Padrão para todo o site</div>
                      <div style={{ fontSize: 11, color: '#86868b' }}>Salvar e publicar como padrão em todas as páginas</div>
                    </div>
                  </button>

                  <div style={{ height: 1, background: '#e5e5ea', margin: '4px 0' }} />

                  <button
                    type="button"
                    onClick={() => {
                      setPublishMenuOpen(false)
                      save(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      background: 'transparent',
                      border: 'none',
                      borderRadius: 6,
                      textAlign: 'left',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 12,
                      color: '#6e6e73'
                    }}
                  >
                    <Save size={14} /> Salvar como rascunho (sem publicar)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && <div className="we-alert" role="alert">{error}</div>}
        {message && <div className="we-success" role="status">{message}</div>}

        {loading ? <p>Carregando página…</p> : target && (
          <main
            ref={canvas}
            className={`elementor-canvas-wrapper restored-canvas viewport-${viewport}`}
            onContextMenu={e => {
              e.preventDefault()
              const desc = widgets.find(w => w.id === selected)
              setContextMenu({
                x: e.clientX,
                y: e.clientY,
                targetId: selected,
                targetType: desc?.kind || 'widget',
                targetLabel: desc?.label || (selected ? 'Elemento' : 'Página')
              })
            }}
          >
            {src ? (
              <div className="we-preview-page" style={{ width: viewportWidth * scale }}>
                <iframe
                  ref={frame}
                  title="Página real da loja"
                  src={src}
                  style={{ width: viewportWidth, height: canvasSize.height / scale, transform: `scale(${scale})`, transformOrigin: 'top left' }}
                  onLoad={() => {
                    send('teknix:inspect')
                    send('teknix:global-patches', { scope: GLOBAL_EDITOR_SCOPE, edits: globalEdits })
                    send('teknix:patches', { edits })
                    if (previewTree) send('teknix:preview-tree', { tree: previewTree })
                  }}
                />
              </div>
            ) : <p>Configure o endereço do site.</p>}
          </main>
        )}
      </div>

      <IconPickerModal
        isOpen={editingIcon}
        currentIcon={String(selectedEdit.content?.icon || 'star')}
        onClose={() => setEditingIcon(false)}
        onSelectIcon={icon => { patch({ content: { icon } }); setEditingIcon(false) }}
      />
      <ImageEditorModal
        isOpen={editingImage}
        onClose={() => setEditingImage(false)}
        mediaItem={imageUrl ? { id: selected, name: widget?.label || 'Imagem', file_url: String(imageUrl), file_type: 'image/png', file_size: 0, alt: '', folder: 'page-editor', created_at: '' } : null}
        onSave={async dataUrl => {
          const imageKey = selected, imageScope = scopeRef.current
          try {
            setSaving(true)
            const blob = await (await fetch(dataUrl)).blob()
            const path = `page-editor/${crypto.randomUUID()}.png`
            const { error: uploadError } = await supabase.storage.from('media').upload(path, blob, { contentType: 'image/png', upsert: false })
            if (uploadError) throw uploadError
            const url = supabase.storage.from('media').getPublicUrl(path).data.publicUrl
            if (scopeRef.current === imageScope) {
              const current = editsRef.current
              change({ ...current, [imageKey]: { ...current[imageKey], content: { ...current[imageKey]?.content, src: url, image: url, img: url, url } } })
              setEditingImage(false)
            }
          } catch (e: any) { setError(e.message || 'Não foi possível salvar a imagem.') }
          finally { setSaving(false) }
        }}
      />

      {contextMenu && (
        <div
          className="dialog-message dialog-simple-message elementor-context-menu-wrapper"
          style={{
            top: Math.max(10, Math.min(contextMenu.y, window.innerHeight - 440)),
            left: Math.max(10, Math.min(contextMenu.x, window.innerWidth - 270))
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="elementor-context-menu-list" role="menu">
            {/* GROUP 1: General */}
            <div className="elementor-context-menu-list__group elementor-context-menu-list__group-general" role="group">
              <div
                className="elementor-context-menu-list__item elementor-context-menu-list__item-edit"
                onClick={() => {
                  if (contextMenu.targetId) {
                    setSelected(contextMenu.targetId)
                    setPanel('inspector')
                    setCollapsed(false)
                  }
                  setContextMenu(null)
                }}
                role="menuitem"
                tabIndex={0}
              >
                <div className="elementor-context-menu-list__item__title">
                  Editar {contextMenu.targetLabel ? (contextMenu.targetLabel.length > 20 ? contextMenu.targetLabel.slice(0, 18) + '…' : contextMenu.targetLabel) : (contextMenu.targetType === 'container' ? 'Contêiner' : 'Elemento')}
                </div>
              </div>
              <div
                className="elementor-context-menu-list__item elementor-context-menu-list__item-duplicate"
                onClick={() => {
                  handleDuplicate(contextMenu.targetId)
                  setContextMenu(null)
                }}
                role="menuitem"
                tabIndex={0}
              >
                <div className="elementor-context-menu-list__item__title">Duplicar</div>
                <div className="elementor-context-menu-list__item__shortcut">⌘+D</div>
              </div>
            </div>

            {/* GROUP 2: New Container */}
            <div className="elementor-context-menu-list__group elementor-context-menu-list__group-newContainerGroup" role="group">
              <div
                className="elementor-context-menu-list__item elementor-context-menu-list__item-newContainer"
                onClick={() => {
                  handleLayout({ action: 'insert', widgetType: 'container', target: contextMenu.targetId, position: 'after' })
                  setContextMenu(null)
                }}
                role="menuitem"
                tabIndex={0}
              >
                <div className="elementor-context-menu-list__item__title">Adicionar novo contêiner</div>
              </div>
            </div>

            {/* GROUP 3: Clipboard & Styling */}
            <div className="elementor-context-menu-list__group elementor-context-menu-list__group-clipboard" role="group">
              <div
                className="elementor-context-menu-list__item elementor-context-menu-list__item-copy"
                onClick={() => {
                  handleCopyContext(contextMenu.targetId)
                  setContextMenu(null)
                }}
                role="menuitem"
                tabIndex={0}
              >
                <div className="elementor-context-menu-list__item__title">Copiar</div>
                <div className="elementor-context-menu-list__item__shortcut">⌘+C</div>
              </div>
              <div
                className={`elementor-context-menu-list__item elementor-context-menu-list__item-paste ${!clipboard ? 'elementor-context-menu-list__item--disabled' : ''}`}
                onClick={() => {
                  if (clipboard) {
                    handlePasteContext(contextMenu.targetId)
                    setContextMenu(null)
                  }
                }}
                role="menuitem"
                tabIndex={0}
              >
                <div className="elementor-context-menu-list__item__title">Colar</div>
                <div className="elementor-context-menu-list__item__shortcut">⌘+V</div>
              </div>
              <div
                className={`elementor-context-menu-list__item elementor-context-menu-list__item-pasteStyle ${(!clipboard && !copiedStyles) ? 'elementor-context-menu-list__item--disabled' : ''}`}
                onClick={() => {
                  if (clipboard || copiedStyles) {
                    handlePasteStyleContext(contextMenu.targetId)
                    setContextMenu(null)
                  }
                }}
                role="menuitem"
                tabIndex={0}
              >
                <div className="elementor-context-menu-list__item__title">Colar estilo</div>
                <div className="elementor-context-menu-list__item__shortcut">⌘+⇧+V</div>
              </div>
              <div
                className="elementor-context-menu-list__item elementor-context-menu-list__item-pasteInteractions elementor-context-menu-list__item--disabled"
                role="menuitem"
                tabIndex={0}
              >
                <div className="elementor-context-menu-list__item__title">Colar interações</div>
              </div>
              <div
                className="elementor-context-menu-list__item elementor-context-menu-list__item-pasteArea"
                onClick={() => {
                  handlePasteContext(contextMenu.targetId)
                  setContextMenu(null)
                }}
                role="menuitem"
                tabIndex={0}
              >
                <div className="elementor-context-menu-list__item__title">Colar de outro site</div>
              </div>
              <div
                className="elementor-context-menu-list__item elementor-context-menu-list__item-resetStyle"
                onClick={() => {
                  handleResetStyleContext(contextMenu.targetId)
                  setContextMenu(null)
                }}
                role="menuitem"
                tabIndex={0}
              >
                <div className="elementor-context-menu-list__item__title">Redefinir estilo</div>
              </div>
            </div>

            {/* GROUP 4: Save & AI */}
            <div className="elementor-context-menu-list__group elementor-context-menu-list__group-save" role="group">
              <div
                className="elementor-context-menu-list__item elementor-context-menu-list__item-ai"
                onClick={() => {
                  setPanel('inspector')
                  setInspectorTab('content')
                  setContextMenu(null)
                  showNotice('Abra o assistente de IA no painel lateral.')
                }}
                role="menuitem"
                tabIndex={0}
              >
                <div className="elementor-context-menu-list__item__title">Gerar variações com IA</div>
              </div>
              <div
                className="elementor-context-menu-list__item elementor-context-menu-list__item-save"
                onClick={() => {
                  handleSaveAsTemplateContext()
                  setContextMenu(null)
                }}
                role="menuitem"
                tabIndex={0}
              >
                <div className="elementor-context-menu-list__item__title">Salvar como global / modelo</div>
                <div className="elementor-context-menu-list__item__shortcut">
                  <span className="elementor-context-menu-list__item__shortcut__new-badge">Novo</span>
                </div>
              </div>
              <div
                className="elementor-context-menu-list__item elementor-context-menu-list__item-save-as-default"
                onClick={() => {
                  const targetId = contextMenu.targetId || selected
                  if (targetId) {
                    const desc = widgets.find(w => w.id === targetId)
                    const gKey = desc?.globalKey || targetId
                    const curEdit = edits[targetId] || edits[gKey]
                    if (curEdit) {
                      patchKey(gKey, structuredClone(curEdit), true)
                    }
                  }
                  setEditScope('global')
                  showNotice('Configurações salvas como padrão global da loja!')
                  setContextMenu(null)
                }}
                role="menuitem"
                tabIndex={0}
              >
                <div className="elementor-context-menu-list__item__title">Salvar como padrão</div>
              </div>
            </div>

            {/* GROUP 5: Notes */}
            <div className="elementor-context-menu-list__group elementor-context-menu-list__group-notes" role="group">
              <div
                className="elementor-context-menu-list__item elementor-context-menu-list__item-open_notes"
                onClick={() => {
                  setContextMenu(null)
                  showNotice('Notes: Modo de notas ativado.')
                }}
                role="menuitem"
                tabIndex={0}
              >
                <div className="elementor-context-menu-list__item__title">Notes</div>
                <div className="elementor-context-menu-list__item__shortcut">⇧+C</div>
              </div>
            </div>

            {/* GROUP 6: Tools */}
            <div className="elementor-context-menu-list__group elementor-context-menu-list__group-tools" role="group">
              <div
                className="elementor-context-menu-list__item elementor-context-menu-list__item-navigator"
                onClick={() => {
                  setNavigator(prev => !prev)
                  setContextMenu(null)
                }}
                role="menuitem"
                tabIndex={0}
              >
                <div className="elementor-context-menu-list__item__title">Estrutura</div>
                <div className="elementor-context-menu-list__item__shortcut">⌘+I</div>
              </div>
            </div>

            {/* GROUP 7: Delete */}
            <div className="elementor-context-menu-list__group elementor-context-menu-list__group-delete" role="group">
              <div
                className="elementor-context-menu-list__item elementor-context-menu-list__item-delete"
                onClick={() => {
                  handleDeleteContext(contextMenu.targetId)
                  setContextMenu(null)
                }}
                role="menuitem"
                tabIndex={0}
              >
                <div className="elementor-context-menu-list__item__title">Excluir</div>
                <div className="elementor-context-menu-list__item__shortcut">⌦</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {navigator && (
        <Navigator
          sections={previewTree ? previewTree.sections.map((section: any) => ({
            ...section,
            ...edits[section.id]?.schema,
            containers: previewTree.containers.filter((c: any) => c.section_id === section.id).map((container: any) => ({
              ...container,
              ...edits[container.id]?.schema,
              widgets: previewTree.widgets.filter((w: any) => w.container_id === container.id).map((w: any) => ({
                ...w,
                ...edits[w.id]?.schema
              }))
            }))
          })) : []}
          canvasNodes={allCanvasNodes}
          selectedId={selected}
          onClose={() => setNavigator(false)}
          onSelect={(_, selId) => { setSelected(selId); setPanel('inspector'); send('teknix:focus', { id: selId }) }}
          onUpdateSection={(secId, schema) => change({ ...edits, [secId]: { ...edits[secId], schema: { ...edits[secId]?.schema, ...schema } } })}
          onUpdateContainer={(conId, schema) => change({ ...edits, [conId]: { ...edits[conId], schema: { ...edits[conId]?.schema, ...schema } } })}
          onUpdateWidget={(widId, schema) => change({ ...edits, [widId]: { ...edits[widId], schema: { ...edits[widId]?.schema, ...schema } } })}
        />
      )}
    </div></EditorDeviceContext.Provider>
  )
}

function ElementorSliderControl({
  label,
  value,
  unit = 'px',
  units = ['px', '%'],
  min = 0,
  max = 100,
  step = 1,
  placeholder = '',
  onChange,
  onUnitChange,
  showDevice = true
}: {
  label: string
  value: number | string
  unit?: string
  units?: string[]
  min?: number
  max?: number
  step?: number
  placeholder?: string
  onChange: (val: number | '') => void
  onUnitChange?: (u: string) => void
  showDevice?: boolean
}) {
  const numericVal = value === '' || value === undefined ? '' : Number(value)
  return (
    <div className="elementor-control-row">
      <div className="elementor-control-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="elementor-control-title">{label}</span>
          {showDevice && <DeviceTag />}
        </div>
        {units && units.length > 0 && (
          <div className="e-units-wrapper">
            {units.length === 1 ? (
              <span className="elementor-units-label">{units[0]}</span>
            ) : (
              <select
                className="elementor-units-select"
                value={unit}
                onChange={e => onUnitChange?.(e.target.value)}
              >
                {units.map(u => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>
      <div className="elementor-slider-row">
        <input
          type="range"
          className="elementor-slider-range"
          min={min}
          max={max}
          step={step}
          value={numericVal === '' ? min : numericVal}
          onChange={e => onChange(Number(e.target.value))}
        />
        <input
          type="number"
          className="elementor-slider-number"
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          value={numericVal}
          onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        />
      </div>
    </div>
  )
}

function LinkedDimensionsControl({
  label,
  prefix,
  schema,
  onChange,
  defaultUnit = 'px',
  units = ['px', '%', 'em', 'rem', 'vw'],
  showDevice = true
}: {
  label: string
  prefix: string
  schema: Record<string, any>
  onChange: (updates: Record<string, any>) => void
  defaultUnit?: string
  units?: string[]
  showDevice?: boolean
}) {
  const [isLinked, setIsLinked] = useState(true)
  const unit = schema[`${prefix}_unit`] || defaultUnit
  const top = schema[`${prefix}_top`] ?? ''
  const right = schema[`${prefix}_right`] ?? ''
  const bottom = schema[`${prefix}_bottom`] ?? ''
  const left = schema[`${prefix}_left`] ?? ''

  const handleValueChange = (side: 'top' | 'right' | 'bottom' | 'left', rawVal: string) => {
    const val = rawVal === '' ? '' : Number(rawVal)
    if (isLinked) {
      onChange({
        [`${prefix}_top`]: val,
        [`${prefix}_right`]: val,
        [`${prefix}_bottom`]: val,
        [`${prefix}_left`]: val
      })
    } else {
      onChange({ [`${prefix}_${side}`]: val })
    }
  }

  const handleUnitChange = (newUnit: string) => {
    onChange({ [`${prefix}_unit`]: newUnit })
  }

  return (
    <div className="elementor-dimension-box">
      <div className="elementor-dimension-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span className="elementor-control-title">{label}</span>
          {showDevice && <DeviceTag />}
        </div>
        <select
          className="elementor-units-select"
          value={unit}
          onChange={e => handleUnitChange(e.target.value)}
        >
          {units.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
      <div className="elementor-dimension-grid">
        <div className="elementor-dimension-col">
          <input
            type="number"
            className="elementor-dimension-input"
            value={top}
            placeholder="0"
            onChange={e => handleValueChange('top', e.target.value)}
          />
          <span className="elementor-dimension-label">Superior</span>
        </div>
        <div className="elementor-dimension-col">
          <input
            type="number"
            className="elementor-dimension-input"
            value={right}
            placeholder="0"
            onChange={e => handleValueChange('right', e.target.value)}
          />
          <span className="elementor-dimension-label">Direita</span>
        </div>
        <div className="elementor-dimension-col">
          <input
            type="number"
            className="elementor-dimension-input"
            value={bottom}
            placeholder="0"
            onChange={e => handleValueChange('bottom', e.target.value)}
          />
          <span className="elementor-dimension-label">Inferior</span>
        </div>
        <div className="elementor-dimension-col">
          <input
            type="number"
            className="elementor-dimension-input"
            value={left}
            placeholder="0"
            onChange={e => handleValueChange('left', e.target.value)}
          />
          <span className="elementor-dimension-label">Esquerda</span>
        </div>
        <button
          type="button"
          className={`elementor-dimension-link-btn ${isLinked ? 'linked' : ''}`}
          title={isLinked ? 'Vincular valores entre si' : 'Valores desvinculados'}
          onClick={() => setIsLinked(!isLinked)}
        >
          {isLinked ? <Link2 size={13} /> : <Unlink size={13} />}
        </button>
      </div>
    </div>
  )
}

function ElementorAccordion({ title, icon: Icon, isOpen, onToggle, children }: { title: string; icon?: any; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="editor-reference-section">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: '#1d1d1f',
          fontSize: 12,
          fontWeight: 700,
          textTransform: 'capitalize',
          letterSpacing: '0.02em'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ChevronRight size={13} style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease', color: '#6e6e73' }} />
          <span>{title}</span>
        </div>
        {Icon && <span className="editor-section-icon"><Icon size={14} /></span>}
      </button>
      {isOpen && <div className="editor-reference-section-body">{children}</div>}
    </div>
  )
}

function ElementorRepeaterItem({
  index,
  title,
  subtitle,
  preview,
  badge,
  isOpen,
  onToggle,
  onDuplicate,
  onDelete,
  onMoveUp,
  onMoveDown,
  canMoveUp = false,
  canMoveDown = false,
  children
}: {
  index: number
  title: string
  subtitle?: React.ReactNode
  preview?: React.ReactNode
  badge?: React.ReactNode
  isOpen: boolean
  onToggle: () => void
  onDuplicate?: () => void
  onDelete?: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  canMoveUp?: boolean
  canMoveDown?: boolean
  children: React.ReactNode
}) {
  return (
    <div
      className={`editor-reference-repeater ${isOpen ? 'is-open' : ''}`}
      style={{
        background: '#ffffff',
        border: isOpen ? '1px solid #0071e3' : '1px solid #e5e5ea',
        borderRadius: 8,
        marginBottom: 8,
        overflow: 'hidden',
        transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        boxShadow: isOpen ? '0 3px 12px rgba(0, 113, 227, 0.08)' : '0 1px 3px rgba(0, 0, 0, 0.02)'
      }}
    >
      <div
        onClick={onToggle}
        className="editor-repeater-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          background: isOpen ? '#f8faff' : '#ffffff',
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: isOpen ? '1px solid #e8f0fe' : 'none',
          gap: 8,
          transition: 'background 0.15s ease'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
          <span
            className="editor-repeater-index"
            style={{
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 5px',
              borderRadius: 4,
              background: isOpen ? '#0071e3' : '#f0f0f2',
              color: isOpen ? '#ffffff' : '#6e6e73',
              fontFamily: 'monospace, -apple-system, sans-serif',
              flexShrink: 0
            }}
          >
            {String(index + 1).padStart(2, '0')}
          </span>

          {preview && (
            <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
              {preview}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span style={{
                fontSize: 12,
                fontWeight: 600,
                color: isOpen ? '#0071e3' : '#1d1d1f',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.3
              }}>
                {title || `Item #${index + 1}`}
              </span>
              {badge}
            </div>
            {subtitle && (
              <span style={{
                fontSize: 10,
                color: '#86868b',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                lineHeight: 1.2,
                marginTop: 1
              }}>
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div
          className="editor-repeater-actions"
          style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {onMoveUp && (
            <button
              type="button"
              disabled={!canMoveUp}
              onClick={onMoveUp}
              title="Mover para cima"
              className="editor-repeater-action-btn"
              style={{
                padding: 4,
                background: 'transparent',
                border: 'none',
                color: canMoveUp ? '#6e6e73' : '#d2d2d7',
                cursor: canMoveUp ? 'pointer' : 'not-allowed',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ArrowUp size={12} />
            </button>
          )}
          {onMoveDown && (
            <button
              type="button"
              disabled={!canMoveDown}
              onClick={onMoveDown}
              title="Mover para baixo"
              className="editor-repeater-action-btn"
              style={{
                padding: 4,
                background: 'transparent',
                border: 'none',
                color: canMoveDown ? '#6e6e73' : '#d2d2d7',
                cursor: canMoveDown ? 'pointer' : 'not-allowed',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <ArrowDown size={12} />
            </button>
          )}
          {onDuplicate && (
            <button
              type="button"
              onClick={onDuplicate}
              title="Duplicar item"
              className="editor-repeater-action-btn"
              style={{
                padding: 4,
                background: 'transparent',
                border: 'none',
                color: '#6e6e73',
                cursor: 'pointer',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Copy size={12} />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              title="Excluir item"
              className="editor-repeater-action-btn delete"
              style={{
                padding: 4,
                background: 'transparent',
                border: 'none',
                color: '#ff3b30',
                cursor: 'pointer',
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Trash2 size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            title={isOpen ? "Recolher" : "Expandir"}
            className="editor-repeater-action-btn toggle"
            style={{
              padding: 4,
              background: 'transparent',
              border: 'none',
              color: isOpen ? '#0071e3' : '#6e6e73',
              cursor: 'pointer',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </button>
        </div>
      </div>
      {isOpen && (
        <div style={{
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          background: '#fafafa',
          borderTop: '1px solid #f0f0f2'
        }}>
          {children}
        </div>
      )}
    </div>
  )
}

function ColorPickerControl({ id, label, child, description }: { id: string; label: string; child: React.ReactElement<any>; description?: string }) {
  const [paletteOpen, setPaletteOpen] = useState(false)
  const popupRef = useRef<HTMLDivElement>(null)

  const rawVal = child.props.value
  const currentValue = typeof rawVal === 'string' ? rawVal.trim() : ''
  const isCleared = !currentValue || currentValue === 'transparent' || currentValue === 'inherit'
  const pickerHex = currentValue && currentValue.startsWith('#') && (currentValue.length === 7 || currentValue.length === 4)
    ? (currentValue.length === 4 ? `#${currentValue[1]}${currentValue[1]}${currentValue[2]}${currentValue[2]}${currentValue[3]}${currentValue[3]}` : currentValue)
    : '#ffffff'

  const applyColor = (val: string) => {
    if (child.props.onChange) {
      child.props.onChange({
        target: { value: val },
        currentTarget: { value: val }
      })
    }
    setPaletteOpen(false)
  }

  const handleReset = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    applyColor('')
  }

  useEffect(() => {
    if (!paletteOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setPaletteOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside, true)
    return () => document.removeEventListener('mousedown', handleClickOutside, true)
  }, [paletteOpen])

  const PRESET_COLORS = [
    {
      title: 'Sem cor (Transparente)',
      value: '',
      style: {
        background: 'repeating-conic-gradient(rgb(204, 204, 204) 0%, rgb(204, 204, 204) 25%, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 50%) 50% center / 6px 6px'
      }
    },
    {
      title: 'Branco',
      value: '#ffffff',
      style: { background: 'rgb(255, 255, 255)' }
    },
    {
      title: 'Cinza Original TEKNIX',
      value: '#f7f7f7',
      style: { background: 'rgb(247, 247, 247)' }
    },
    {
      title: 'Preto Oficial',
      value: '#111827',
      style: { background: 'rgb(17, 24, 39)' }
    },
    {
      title: 'TEKNIX Lime',
      value: '#a2e000',
      style: { background: 'rgb(162, 224, 0)' }
    },
    {
      title: 'Azul Apple',
      value: '#0071e3',
      style: { background: 'rgb(0, 113, 227)' }
    }
  ]

  return (
    <div className="elementor-control-row editor-control-inline editor-control-color" style={{ position: 'relative' }}>
      <div className="elementor-control-header">
        <label htmlFor={id} className="elementor-control-title">{label}</label>
      </div>
      <div className="teknix-color-picker-wrap">
        {/* Botão do lado esquerdo para ZERAR a cor */}
        <button
          type="button"
          className={`teknix-color-reset-btn ${isCleared ? 'is-cleared' : ''}`}
          title="Zerar / Limpar cor (remover cor personalizada)"
          aria-label="Zerar cor"
          onClick={handleReset}
          disabled={isCleared}
        >
          <RotateCcw size={12} />
        </button>

        {/* Swatch moderno do seletor (somente a bolinha da cor) */}
        <div
          className="teknix-color-swatch-btn"
          title={isCleared ? `${label}: Padrão (Clique para escolher a cor)` : `${label}: ${currentValue.toUpperCase()} (Clique para escolher a cor)`}
        >
          <div
            className="teknix-color-swatch-circle"
            style={{
              backgroundColor: isCleared ? 'transparent' : pickerHex
            }}
          >
            {isCleared && <div className="teknix-color-slash-line" />}
          </div>
          {cloneElement(child, {
            id,
            'aria-label': label,
            value: isCleared ? '#ffffff' : pickerHex,
            className: 'teknix-color-hidden-input',
            style: {
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              cursor: 'pointer',
              margin: 0,
              padding: 0,
              border: 'none',
              borderRadius: '50%',
              zIndex: 2
            }
          })}
        </div>

        {/* Botão para abrir o Popup de CORES PADRÃO */}
        <div style={{ position: 'relative' }} ref={popupRef}>
          <button
            type="button"
            className={`teknix-color-presets-trigger-btn ${paletteOpen ? 'active' : ''}`}
            title="Cores Padrão"
            aria-label="Abrir cores padrão"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setPaletteOpen(!paletteOpen)
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 26,
              height: 26,
              borderRadius: 6,
              border: paletteOpen ? '1.5px solid #0071e3' : '1px solid #d2d2d7',
              background: paletteOpen ? '#e8f2ff' : '#f5f5f7',
              color: paletteOpen ? '#0071e3' : '#6b7280',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
          >
            <Palette size={13} />
          </button>

          {/* Popup com a LISTA de CORES PADRÃO (uma em baixo da outra, com bolinha, nome e código) */}
          {paletteOpen && (
            <div
              className="teknix-color-presets-popup"
              style={{
                position: 'absolute',
                top: 'calc(100% + 6px)',
                right: 0,
                zIndex: 9999,
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                padding: '6px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                minWidth: 230,
                animation: 'teknixPopIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ padding: '6px 8px 4px', borderBottom: '1px solid #f1f5f9', marginBottom: 2 }}>
                <span style={{ fontSize: 10, color: 'rgb(134, 134, 139)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Cores Padrão
                </span>
              </div>
              {PRESET_COLORS.map(preset => {
                const isSelected = (!preset.value && isCleared) || (preset.value && currentValue.toLowerCase() === preset.value.toLowerCase())
                return (
                  <button
                    key={preset.title}
                    type="button"
                    onClick={() => applyColor(preset.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 8px',
                      borderRadius: 6,
                      border: 'none',
                      background: isSelected ? '#f0f7ff' : 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.12s ease'
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.background = '#f8fafc'
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    {/* Bolinha da cor */}
                    <span
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        border: '1px solid rgba(0, 0, 0, 0.15)',
                        boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.4)',
                        ...preset.style,
                        flexShrink: 0,
                        display: 'inline-block'
                      }}
                    />

                    {/* Nome da cor */}
                    <span style={{ fontSize: 12, fontWeight: isSelected ? 600 : 500, color: isSelected ? '#0071e3' : '#1e293b', flex: 1, whiteSpace: 'nowrap' }}>
                      {preset.title}
                    </span>

                    {/* Código da cor */}
                    <span style={{ fontSize: 11, fontFamily: 'monospace, sans-serif', color: isSelected ? '#0071e3' : '#64748b', fontWeight: 600, background: isSelected ? '#e0effe' : '#f1f5f9', padding: '2px 6px', borderRadius: 4, letterSpacing: '0.02em' }}>
                      {preset.value ? preset.value.toUpperCase() : 'Limpar'}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {description && <span className="editor-control-description">{description}</span>}
    </div>
  )
}

function ControlRow({ label, children, description }: { label: string; children: React.ReactNode; description?: string }) {
  const id = useId()
  const child: React.ReactElement<any> | null = Children.count(children) === 1 && isValidElement<any>(children) ? children as React.ReactElement<any> : null
  const compact = child && (child.type === 'select' || child.type === 'input')
  const color = child?.type === 'input' && child.props.type === 'color'

  if (color && child) {
    return <ColorPickerControl id={id} label={label} child={child} description={description} />
  }

  return <div className={`elementor-control-row ${compact ? 'editor-control-inline' : ''} ${color ? 'editor-control-color' : ''}`}>
    <div className="elementor-control-header"><label htmlFor={id} className="elementor-control-title">{label}</label></div>
    {child && (child.type === 'input' || child.type === 'select' || child.type === 'textarea') ? cloneElement(child, { id, 'aria-label': label }) : children}
    {description && <span className="editor-control-description">{description}</span>}
  </div>
}

function DeviceTag() {
  const { mode, select } = useContext(EditorDeviceContext)
  const [open, setOpen] = useState(false)
  const Icon = mode === 'mobile' ? Smartphone : mode === 'tablet' ? Tablet : Monitor
  return <div className="editor-device-picker">
    <button type="button" className="elementor-device-tag" aria-label="Dispositivo do controle" aria-expanded={open} onClick={() => setOpen(!open)}><Icon size={12} /></button>
    {open && <div className="editor-device-options">{([['desktop', Monitor, 'Desktop'], ['tablet', Tablet, 'Tablet'], ['mobile', Smartphone, 'Celular']] as const).map(([value, DeviceIcon, label]) => <button type="button" key={value} title={label} aria-label={label} aria-pressed={mode === value} onClick={() => { select(value); setOpen(false) }}><DeviceIcon size={14} /></button>)}</div>}
  </div>
}

function AlignmentButtonGroup({
  value,
  onChange,
  allowJustify = false
}: {
  value: string
  onChange: (val: string) => void
  allowJustify?: boolean
}) {
  const options = [
    { key: 'left', icon: AlignLeft, label: 'Alinhar à Esquerda' },
    { key: 'center', icon: AlignCenter, label: 'Centralizar' },
    { key: 'right', icon: AlignRight, label: 'Alinhar à Direita' },
    ...(allowJustify ? [{ key: 'justify', icon: AlignJustify, label: 'Justificado' }] : [])
  ]
  return (
    <div className="elementor-align-group">
      {options.map(opt => {
        const IconComp = opt.icon
        const isActive = (value || 'left') === opt.key
        return (
          <button
            key={opt.key}
            type="button"
            className={`elementor-align-btn ${isActive ? 'active' : ''}`}
            title={opt.label}
            onClick={() => onChange(opt.key)}
          >
            <IconComp size={14} />
          </button>
        )
      })}
    </div>
  )
}

function StateTabs({
  activeTab,
  onSelect
}: {
  activeTab: 'normal' | 'hover'
  onSelect: (tab: 'normal' | 'hover') => void
}) {
  return (
    <div className="elementor-state-tabs">
      <button
        type="button"
        className={`elementor-state-tab-btn ${activeTab === 'normal' ? 'active' : ''}`}
        onClick={() => onSelect('normal')}
      >
        Normal
      </button>
      <button
        type="button"
        className={`elementor-state-tab-btn ${activeTab === 'hover' ? 'active' : ''}`}
        onClick={() => onSelect('hover')}
      >
        Ao passar o mouse
      </button>
    </div>
  )
}

function TypographyControl({
  schema,
  onChange,
  prefix = ''
}: {
  schema: Record<string, any>
  onChange: (updates: Record<string, any>) => void
  prefix?: string
}) {
  const p = prefix ? `${prefix}_` : ''
  const family = schema[`${p}font_family`] || 'inherit'
  const size = schema[`${p}font_size`] ?? ''
  const weight = schema[`${p}font_weight`] || '400'
  const transform = schema[`${p}text_transform`] || 'none'
  const style = schema[`${p}font_style`] || 'normal'
  const decoration = schema[`${p}text_decoration`] || 'none'
  const lineHeight = schema[`${p}line_height`] ?? ''
  const letterSpacing = schema[`${p}letter_spacing`] ?? ''

  return (
    <details className="editor-typography-popover"><summary>Tipografia <span><Edit3 size={14} /></span></summary><div className="editor-typography-controls">
      <ControlRow label="Família">
        <select value={family} onChange={e => onChange({ [`${p}font_family`]: e.target.value })}>
          <option value="inherit">Padrão da Loja</option>
          <option value="Inter, sans-serif">Inter</option>
          <option value="-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif">SF Pro (Apple)</option>
          <option value="'Nunito', sans-serif">Nunito</option>
          <option value="'Roboto', sans-serif">Roboto</option>
          <option value="'Poppins', sans-serif">Poppins</option>
          <option value="'Montserrat', sans-serif">Montserrat</option>
        </select>
      </ControlRow>
      <div className="editor-typography-group">
        <ControlRow label="Tamanho (px)">
          <input
            type="number"
            placeholder="16"
            value={size}
            onChange={e => onChange({ [`${p}font_size`]: e.target.value === '' ? '' : Number(e.target.value) })}
          />
        </ControlRow>
        <ControlRow label="Peso">
          <select value={weight} onChange={e => onChange({ [`${p}font_weight`]: e.target.value })}>
            <option value="100">100 (Fino)</option>
            <option value="200">200 (Extra leve)</option>
            <option value="300">300 (Leve)</option>
            <option value="400">400 (Normal)</option>
            <option value="500">500 (Médio)</option>
            <option value="600">600 (Semi-Bold)</option>
            <option value="700">700 (Bold)</option>
            <option value="800">800 (Extra Bold)</option>
            <option value="900">900 (Preto / Black)</option>
          </select>
        </ControlRow>
      </div>
      <div className="editor-typography-group">
        <ControlRow label="Transformação">
          <select value={transform} onChange={e => onChange({ [`${p}text_transform`]: e.target.value })}>
            <option value="none">Padrão</option>
            <option value="uppercase">MAIÚSCULAS</option>
            <option value="lowercase">minúsculas</option>
            <option value="capitalize">Capitalizar</option>
          </select>
        </ControlRow>
        <ControlRow label="Estilo">
          <select value={style} onChange={e => onChange({ [`${p}font_style`]: e.target.value })}>
            <option value="normal">Normal</option>
            <option value="italic">Itálico</option>
          </select>
        </ControlRow>
      </div>
      <ControlRow label="Decoração">
        <select value={decoration} onChange={e => onChange({ [`${p}text_decoration`]: e.target.value })}>
          <option value="none">Nenhuma</option><option value="underline">Sublinhado</option><option value="overline">Sobrelinha</option><option value="line-through">Riscado</option>
        </select>
      </ControlRow>
      <div className="editor-typography-group">
        <ControlRow label="Altura da Linha">
          <input
            type="text"
            placeholder="1.4"
            value={lineHeight}
            onChange={e => onChange({ [`${p}line_height`]: e.target.value })}
          />
        </ControlRow>
        <ControlRow label="Espaçamento">
          <input
            type="text"
            placeholder="0px"
            value={letterSpacing}
            onChange={e => onChange({ [`${p}letter_spacing`]: e.target.value })}
          />
        </ControlRow>
      </div>
    </div></details>
  )
}

function ImageMediaControl({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  return <div className="editor-media-control">
    <button type="button" className="editor-media-preview" onClick={() => setOpen(true)} aria-label={value ? 'Trocar imagem' : 'Escolher imagem'}>
      {value ? (
        <img
          src={value}
          alt="Imagem selecionada"
          onError={(e) => {
            const target = e.currentTarget
            if (!target.dataset.triedFallback && target.src.startsWith(window.location.origin)) {
              target.dataset.triedFallback = 'true'
              target.src = target.src.replace(window.location.origin, 'https://www.teknixbrasil.com.br')
            }
          }}
        />
      ) : (
        <ImageIcon size={32} strokeWidth={1} />
      )}
      <span>{value ? 'Trocar imagem' : 'Escolher imagem'}</span>
    </button>
    {value && <button type="button" className="editor-media-remove" onClick={() => onChange('')} aria-label="Remover imagem"><Trash2 size={14} /></button>}
    {open && <MediaLibraryModal isOpen onClose={() => setOpen(false)} onSelectMedia={url => { onChange(url); setOpen(false) }} />}
  </div>
}

function CarouselSettingsControl({ content, onChange }: { content: Record<string, any>; onChange: (values: Record<string, any>) => void }) {
  return <>
    {[['autoplay', 'Reprodução automática', false], ['pause_on_hover', 'Pausar ao passar o mouse', true], ['pause_on_interaction', 'Pausar ao interagir', true], ['infinite', 'Rolagem infinita', true]].map(([key, label, fallback]) => <label className="editor-toggle-row" key={String(key)}>{String(label)}<input type="checkbox" checked={Boolean(content[String(key)] ?? fallback)} onChange={e => onChange({ [String(key)]: e.target.checked })} /></label>)}
    <ControlRow label="Intervalo (ms)"><input type="number" min="250" step="100" value={content.autoplay_speed ?? 5000} onChange={e => onChange({ autoplay_speed: Number(e.target.value) })} /></ControlRow>
    <ControlRow label="Transição (ms)"><input type="number" min="0" step="50" value={content.transition_duration ?? 500} onChange={e => onChange({ transition_duration: Number(e.target.value) })} /></ControlRow>
    <ControlRow label="Slides para mostrar"><input type="number" min="1" max="10" value={content.slides_to_show ?? 1} onChange={e => onChange({ slides_to_show: Number(e.target.value) })} /></ControlRow>
    <ControlRow label="Slides para rolar"><input type="number" min="1" max="10" value={content.slides_to_scroll ?? 1} onChange={e => onChange({ slides_to_scroll: Number(e.target.value) })} /></ControlRow>
    <ControlRow label="Direção"><select value={content.direction || 'left'} onChange={e => onChange({ direction: e.target.value })}><option value="left">Esquerda</option><option value="right">Direita</option></select></ControlRow>
  </>
}

function SlideItemsControl({ content, onChange }: { content: Record<string, any>; onChange: (values: Record<string, any>) => void }) {
  const [opened, setOpened] = useState<number | null>(null)
  const items = Array.isArray(content.slides) ? content.slides : [{ title: content.title || '', subtitle: content.subtitle || '', button_text: content.button_text || '', button_link: content.button_link || '', bg_color: content.bg_color || '#f5f5f7' }]
  const update = (index: number, values: Record<string, any>) => onChange({ slides: items.map((item: any, i: number) => i === index ? { ...item, ...values } : item) })
  return <>{items.map((item: any, index: number) => <ElementorRepeaterItem key={index} index={index} title={item.title || `Slide #${index + 1}`} isOpen={opened === index} onToggle={() => setOpened(opened === index ? null : index)} onDuplicate={() => onChange({ slides: [...items.slice(0, index + 1), { ...item }, ...items.slice(index + 1)] })} onDelete={() => { onChange({ slides: items.filter((_: any, i: number) => i !== index) }); setOpened(null) }}>
    <ControlRow label="Imagem"><ImageMediaControl value={item.image || ''} onChange={image => update(index, { image })} /></ControlRow>
    <ControlRow label="Cor de fundo"><input type="color" value={item.bg_color || '#f5f5f7'} onChange={e => update(index, { bg_color: e.target.value })} /></ControlRow>
    <ControlRow label="Título"><input value={item.title || ''} onChange={e => update(index, { title: e.target.value })} /></ControlRow>
    <ControlRow label="Descrição"><textarea value={item.subtitle || ''} onChange={e => update(index, { subtitle: e.target.value })} /></ControlRow>
    <ControlRow label="Texto do botão"><input value={item.button_text || ''} onChange={e => update(index, { button_text: e.target.value })} /></ControlRow>
    <ControlRow label="Link"><input value={item.button_link || ''} onChange={e => update(index, { button_link: e.target.value })} /></ControlRow>
  </ElementorRepeaterItem>)}<button type="button" className="editor-add-item" onClick={() => { onChange({ slides: [...items, { title: `Slide #${items.length + 1}` }] }); setOpened(items.length) }}><Plus size={14} /> Adicionar item</button></>
}
