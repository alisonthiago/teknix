import { Editable, useWidgetEdit } from './page-widgets/PageWidgets'
import EditableFlow from './page-widgets/EditableFlow'
import { renderDynamicIcon } from './IconPickerModal'
import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../hooks/useAuth'
import { CORE_CATEGORIES } from '../services/categories'
import { getCustomerByUserId, type Customer } from '../services/customer'
import CepDeliveryModal from './CepDeliveryModal'
import './CasasBahiaHeader.css'
import './StorefrontResponsive.css'

export const departmentsList = [
  { name: 'Móveis', path: '/produtos' },
  { name: 'Celulares e Smartphones', path: '/produtos' },
  { name: 'Eletrodomésticos', path: '/produtos' },
  { name: 'Eletroportáteis', path: '/produtos' },
  { name: 'TVs e Vídeos', path: '/produtos' },
  { name: 'Informática', path: '/produtos' },
  { name: 'Esporte & Lazer', path: '/produtos' },
  { name: 'Bebês', path: '/produtos' },
  { name: 'Games', path: '/produtos' },
  { name: 'Beleza & Saúde', path: '/produtos' },
  { name: 'Ferramentas Elétricas', path: '/categoria/ferramentas-eletricas' },
  { name: 'Construção e Obra', path: '/categoria/construcao-e-obra' }
]

export const servicesList = [
  { name: 'Todos os serviços', path: '/institucional' },
  { name: 'Garantia Estendida', path: '/institucional' },
  { name: 'Fique Seguro', path: '/institucional' },
  { name: 'Gift Card', path: '/institucional' },
  { name: 'Instalações', path: '/institucional' },
  { name: 'Consórcio', path: '/institucional' },
  { name: 'B2B - Soluções Corporativas', path: '/contato' },
  { name: 'TEKNIX Pay', path: '/institucional' },
  { name: 'Retira Rápido', path: '/institucional' }
]

export const supportList = [
  { name: 'Dúvidas e Atendimento', path: '/contato' },
  { name: 'Política e Privacidade', path: '/institucional' },
  { name: 'Contato', path: '/contato' }
]

function getCategoryIcon(id: string) {
  switch (id) {
    case 'cat-eletricas':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      )
    case 'cat-construcao':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      )
    case 'cat-automotivos':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      )
    case 'cat-pneumatica':
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2" />
        </svg>
      )
    case 'cat-bancada':
    default:
      return (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
        </svg>
      )
  }
}


function extractAccountData(user: any, customer?: Customer | null) {
  if (!user) {
    return { firstName: 'Cliente', fullName: 'Cliente', avatarUrl: '' }
  }

  const meta = user.user_metadata || {}
  const identityData = user.identities?.[0]?.identity_data || {}

  // 1. Extração do Nome Completo (Google OAuth, cadastro ou email)
  const rawFullName = 
    customer?.name ||
    meta.full_name ||
    meta.name ||
    identityData.full_name ||
    identityData.name ||
    (meta.given_name ? `${meta.given_name} ${meta.family_name || ''}`.trim() : '') ||
    (identityData.given_name ? `${identityData.given_name} ${identityData.family_name || ''}`.trim() : '') ||
    customer?.first_name ||
    meta.given_name ||
    meta.first_name ||
    user.email?.split('@')[0] ||
    'Cliente'

  // 2. Extração do Primeiro Nome para Saudação
  const rawFirstName =
    customer?.first_name ||
    meta.given_name ||
    meta.first_name ||
    identityData.given_name ||
    identityData.first_name ||
    rawFullName.trim().split(/\s+/)[0] ||
    'Cliente'

  // Limpa pontuação se veio de prefixo de e-mail (ex: "alison.thiago" -> "Alison")
  const cleanFirst = rawFirstName.split(/[._-]/)[0] || 'Cliente'
  const formattedFirst = cleanFirst.charAt(0).toUpperCase() + cleanFirst.slice(1).toLowerCase()

  // 3. Extração do Avatar Oficial (inclui picture do Google OAuth e avatar_url do Supabase)
  const avatarUrl =
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta.picture === 'string' && meta.picture) ||
    (typeof identityData.avatar_url === 'string' && identityData.avatar_url) ||
    (typeof identityData.picture === 'string' && identityData.picture) ||
    ''

  return {
    firstName: formattedFirst,
    fullName: rawFullName,
    avatarUrl
  }
}

export default function TeknixHeader() {
  const navigate = useNavigate()
  const { totalItems } = useCart()
  const { user, signOut } = useAuth()
  const location = useLocation()
  const isHome = location.pathname === '/'

  const [dbCustomer, setDbCustomer] = useState<Customer | null>(null)

  useEffect(() => {
    if (!user?.id) {
      setDbCustomer(null)
      return
    }
    let active = true
    getCustomerByUserId(user.id)
      .then(cust => {
        if (active && cust) setDbCustomer(cust)
      })
      .catch(() => {})
    return () => { active = false }
  }, [user?.id])

  const account = extractAccountData(user, dbCustomer)

  const [searchTerm, setSearchTerm] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const isSearching = isSearchFocused || searchTerm.trim().length > 0
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isCepOpen, setIsCepOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const [isDepartmentsOpen, setIsDepartmentsOpen] = useState(false)
  const [cep, setCep] = useState(() => localStorage.getItem('teknix_user_cep') || '')
  const [locationDetails, setLocationDetails] = useState<{city?: string; state?: string; neighborhood?: string; street?: string}>(() => {
    if (typeof window === 'undefined') return {}
    try {
      const loc = localStorage.getItem('teknix_user_location')
      return loc ? JSON.parse(loc) : {}
    } catch { return {} }
  })
  const [geoCity, setGeoCity] = useState<string>('')

  useEffect(() => {
    if (!cep && typeof window !== 'undefined') {
      let active = true
      fetch('https://get.geojs.io/v1/ip/geo.json')
        .then(res => res.json())
        .then(data => {
          if (active && data.city) {
            setGeoCity(data.city)
          }
        })
        .catch(() => {})
      return () => { active = false }
    }
  }, [cep])

  const accountPopoverRef = useRef<HTMLDivElement>(null)
  const departmentsPopoverRef = useRef<HTMLDivElement>(null)

  // Personalização da Logo e do Cabeçalho
  const headerEdit = useWidgetEdit('chrome:header', 'chrome:header')
  const logoEdit = useWidgetEdit('chrome:header:logo', 'chrome:header:logo')
  const searchEdit = useWidgetEdit('chrome:header:search', 'chrome:header:search')
  const cepEdit = useWidgetEdit('chrome:header:cep', 'chrome:header:cep')
  const cepIconEdit = useWidgetEdit('chrome:header:cep-icon', 'chrome:header:cep-icon')
  const cartEdit = useWidgetEdit('chrome:header:cart', 'chrome:header:cart')
  const favoritesEdit = useWidgetEdit('chrome:header:favorites', 'chrome:header:favorites')
  const ordersEdit = useWidgetEdit('chrome:header:orders', 'chrome:header:orders')
  const accountEdit = useWidgetEdit('chrome:header:account', 'chrome:header:account')
  const departmentsEdit = useWidgetEdit('chrome:header:departments-nav', 'chrome:header:departments-nav')
  const customLogoUrl = logoEdit?.content?.image || logoEdit?.content?.src || (headerEdit?.schema as any)?.logo_url || (logoEdit?.schema as any)?.logo_url
  const customLogoHeight = Number((logoEdit?.schema as any)?.logo_height || (headerEdit?.schema as any)?.logo_height || 26)
  const customLogoWidth = (logoEdit?.schema as any)?.logo_width || (headerEdit?.schema as any)?.logo_width

  const storedPrefix = (cepEdit?.content?.text as string) || (cepEdit?.schema as any)?.label_prefix
  // Higieniza qualquer número de CEP ou dígito salvo acidentalmente no conteúdo do widget
  const sanitizedPrefix = (storedPrefix || '')
    .replace(/\d{5}-?\d{3}/g, '')
    .replace(/\d+/g, '')
    .replace(/:/g, '')
    .trim()
  const finalPrefix = sanitizedPrefix && !['Entrega', 'Receber em'].includes(sanitizedPrefix)
    ? sanitizedPrefix
    : 'Seu CEP'
  const cepLabel = `${finalPrefix}:`

  // Navegação horizontal / Departamentos
  const deptContent = (departmentsEdit?.content || {}) as Record<string, any>
  const deptSource = String(deptContent.source || 'categories')
  const deptMaxItems = Number(deptContent.max_items || 6)
  const deptOrderBy = String(deptContent.order_by || 'most_viewed')
  const showDeptBtn = deptContent.show_departments_btn !== false
  const deptBtnText = String(deptContent.departments_btn_text || 'Departamentos')
  const showFeaturedItem = deptContent.show_featured_item !== false
  const featuredText = String(deptContent.featured_item_text || 'Cupom')
  const featuredLink = String(deptContent.featured_item_link || '/produtos')
  const featuredStyle = String(deptContent.featured_item_style || 'badge')
  const rawBg = String(deptContent.featured_item_bg || '')
  const rawColor = String(deptContent.featured_item_color || '')
  const featuredBg = (!rawBg || rawBg === '#e6f9f0' || rawBg.toLowerCase() === 'rgb(230, 249, 240)') ? '#b5f500' : rawBg
  const featuredColor = (!rawColor || rawColor === '#059669' || rawColor.toLowerCase() === 'rgb(5, 150, 105)') ? '#102419' : rawColor

  let baseDeptList = [
    { label: 'Telefonia', url: '/produtos?q=telefonia' },
    { label: 'Eletrodomésticos', url: '/produtos?q=eletrodomesticos' },
    { label: 'Tvs e Vídeo', url: '/produtos?q=tv' },
    { label: 'Móveis', url: '/produtos?q=moveis' },
    { label: 'Eletroportáteis', url: '/produtos?q=eletroportateis' },
    { label: 'Informática', url: '/produtos?q=informatica' },
    { label: 'Ferramentas', url: '/produtos?q=ferramentas' }
  ]

  if (deptSource === 'custom' && Array.isArray(deptContent.items) && deptContent.items.length > 0) {
    baseDeptList = deptContent.items
  } else if (deptSource === 'manual' && Array.isArray(deptContent.manual_categories) && deptContent.manual_categories.length > 0) {
    baseDeptList = deptContent.manual_categories.map((cName: string) => ({
      label: cName,
      url: `/produtos?q=${encodeURIComponent(cName.toLowerCase())}`
    }))
  } else if (deptOrderBy === 'name_asc') {
    baseDeptList = [...baseDeptList].sort((a, b) => a.label.localeCompare(b.label))
  } else if (deptOrderBy === 'name_desc') {
    baseDeptList = [...baseDeptList].sort((a, b) => b.label.localeCompare(a.label))
  }

  const visibleDeptItems = baseDeptList.slice(0, deptMaxItems)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountPopoverRef.current && !accountPopoverRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false)
      }
      if (departmentsPopoverRef.current && !departmentsPopoverRef.current.contains(e.target as Node)) {
        setIsDepartmentsOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
        setIsCepOpen(false)
        setIsAccountOpen(false)
        setIsDepartmentsOpen(false)
      }
    }
    const handleOpenCepModal = () => setIsCepOpen(true)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('teknix:open-cep-modal', handleOpenCepModal)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('teknix:open-cep-modal', handleOpenCepModal)
    }
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/busca?q=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  const handleSelectCep = (newCep: string, details?: { city?: string; state?: string; street?: string; neighborhood?: string }) => {
    setCep(newCep)
    localStorage.setItem('teknix_user_cep', newCep)
    if (details) {
      setLocationDetails(details)
      localStorage.setItem('teknix_user_location', JSON.stringify(details))
    }
    window.dispatchEvent(new CustomEvent('teknix:cep-changed', { detail: { cep: newCep, ...details } }))
  }

  const handleSignOut = async () => {
    await signOut()
    setIsAccountOpen(false)
    navigate('/')
  }

  if (headerEdit?.hidden) return null

  return (
    <>
      {/* ── LINHA NO TOPO EXTREMO (CASAS BAHIA) ── */}
      {!(headerEdit?.schema as any)?.hide_top_line && <div className={`dsvia-top-red-line ${isHome ? 'dsvia-top-line-home' : ''}`} />}

      {/* ── CABEÇALHO PRINCIPAL (FUNDO #f7f7f7) ── */}
      <Editable
        as="header"
        widgetType="header"
        widgetId="chrome:header"
        globalKey="chrome:header"
        label="Cabeçalho"
        editorKind="container"
        renderContent={false}
        className={`dsvia-header-root ${isHome ? 'dsvia-header-home' : 'dsvia-header-inner-page'}`}
        data-version="1.3.0"
        style={{
          background: (headerEdit?.schema as any)?.header_bg === 'transparent' ? 'transparent' : ((headerEdit?.schema as any)?.header_bg || undefined),
          backgroundColor: (headerEdit?.schema as any)?.header_bg === 'transparent' ? 'transparent' : ((headerEdit?.schema as any)?.header_bg || undefined),
          borderBottom: (headerEdit?.schema as any)?.header_border_color ? ((headerEdit?.schema as any)?.header_border_color === 'transparent' ? 'none' : `1px solid ${(headerEdit?.schema as any)?.header_border_color}`) : undefined,
          opacity: (headerEdit?.schema as any)?.header_opacity !== undefined && (headerEdit?.schema as any)?.header_opacity !== '' ? Number((headerEdit?.schema as any)?.header_opacity) : undefined
        }}
      >
        <div className="dsvia-header-inner ui container">
          <EditableFlow id="header-layout" label="Estrutura do cabeçalho" globalKey="layout:chrome:header" compact>
          {/* ── LINHA 1: LOGO + ACESSIBILIDADE + BUSCA + CEP + CONTA + FAVORITOS + CARRINHO ── */}
          <Editable as="div" widgetId="chrome:header:top-row" globalKey="chrome:header:top-row" label="Linha principal do cabeçalho" widgetType="container" editorKind="container" className="dsvia-row-top" renderContent={false}>
            <EditableFlow id="header-top-row" label="Blocos da linha principal" globalKey="layout:chrome:header:top-row" compact>
            {/* Bloco Marca + Acessibilidade */}
            <EditableFlow id="header-brand-block" globalKey="layout:chrome:header:brand-block" label="Bloco do logo" as="div" className="dsvia-brand-block" compact>
              {/* Botão Hamburguer Mobile */}
              <Editable as="button" widgetId="chrome:header:mobile-menu" globalKey="chrome:header:mobile-menu" label="Ícone do menu móvel" widgetType="icon" content={{ icon: 'menu', icon_size: 22 }} renderContent={false}
                type="button"
                className="dsvia-mobile-hamburger-btn"
                onClick={() => setIsMenuOpen(true)}
                aria-label="Abrir menu"
                title="Menu"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                  <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
                </svg>
              </Editable>

              {/* Logo da Loja (Personalizável via editor de imagem/URL) */}
              <Editable as={Link} widgetType="image" widgetId="chrome:header:logo" globalKey="chrome:header:logo" label="Logo do Cabeçalho" content={{ src: customLogoUrl || '', alt: 'TEKNIX' }} renderContent={false} to="/" className="dsvia-brand-logo" title="TEKNIX">
                {customLogoUrl ? (
                  <img src={customLogoUrl} alt="TEKNIX" style={{ height: customLogoHeight, width: customLogoWidth ? `${customLogoWidth}px` : 'auto', objectFit: 'contain' }} />
                ) : (
                  <svg id="Camada_2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 113.98 26.81" height={customLogoHeight} aria-label="TEKNIX" fill="#000000">
                    <g>
                      <polygon points="56.95 26.15 52.21 26.19 49.52 22.34 46.09 17.51 43.48 20.03 43.46 26.2 39.44 26.2 39.44 .97 43.47 .96 43.46 8.58 43.48 15.21 51.4 7.36 56.59 7.39 48.85 14.95 56.95 26.15"/>
                      <path d="M108.37,23.32v2.92c-1.43.03-2.67.06-3.99-.35-1.52-.47-2.96-1.36-3.93-2.62l-2.33-3.01-1.92,2.5c-2.19,2.85-4.83,3.73-8.34,3.46v-4.11s1.05-.05,1.05-.05c1.62.13,3.09-.56,4.07-1.81l2.65-3.39-6.67-8.75c-.13-.17-.09-.58-.02-.78h4.17s5,6.3,5,6.3l2.55-3.22,2.47-3.08h4c.29.46.05.9-.23,1.27l-1.28,1.63-5.04,6.64,2.87,3.61c.77.97,1.9,1.47,3.1,1.59h1.8s.02,1.25.02,1.25Z"/>
                      <path d="M73.33,16.07c0-2.87-2.11-5.18-4.91-5.42s-5.53,1.78-5.67,4.7l-.08,10.84h-4.03s0-10.25,0-10.25c-.05-3.9,2.25-7.33,5.86-8.8,5.04-2.05,10.8.7,12.44,5.9.25.8.32,1.59.4,2.44v10.71s-4,.01-4,.01v-10.14Z"/>
                      <path d="M30.76,22.09c.85-.54,1.36-1.25,1.75-2.1l4.25-.02c-1.16,3.7-4.45,6.33-8.32,6.78-3.61.42-7.13-.96-9.32-3.89s-2.66-6.84-1.08-10.29c1.38-3.01,4.26-5.3,7.79-5.81,4.59-.66,8.98,1.97,10.63,6.32.61,1.61.78,3.31.63,4.98h-15.86c.15,1.19.6,2.15,1.38,3.02,2.04,2.26,5.53,2.68,8.14,1.01ZM33,14.94c-.33-1.55-1.15-2.63-2.23-3.48-2.31-1.51-5.23-1.46-7.44.24-1.02.78-1.71,1.92-2.06,3.25h11.73Z"/>
                      <path d="M15.99,26.22l-4.32-.04c-3.82-.04-6.97-3.46-6.99-6.94l-.05-8.69c0-.45-.36-.84-.81-.85l-3.82-.02v-4.29s2.76.01,2.76.01c3.36.19,6.11,2.9,6.14,6.26l.07,7.03c.02,2.11,2.06,3.26,3.97,3.25l3.06-.02-.02,4.3Z"/>
                      <path d="M15.76,4.67l.02,4.17-3.43-.03c-3.15-.21-5.64-2.77-5.88-5.9L6.42,0h4.35s0,3.8,0,3.8c.06.49.37.86.86.87h4.13Z"/>
                      <rect x="81.41" y="7.34" width="4.08" height="18.87"/>
                      <polygon points="85.48 5.19 81.42 5.17 81.42 .98 85.48 .96 85.48 5.19"/>
                      <g>
                        <path d="M111.95,4.58l.05.03c1.07.16,1.87,1.01,1.98,2.06v.46c-.13,1.16-1.09,2.06-2.25,2.09-1.42.04-2.55-1.21-2.35-2.65.17-1.03.95-1.81,1.98-1.96l.03-.02h.57ZM113.51,6.89c0-1.02-.83-1.84-1.84-1.84s-1.84.83-1.84,1.84.83,1.84,1.84,1.84.83,1.84,1.84,1.84-.83,1.84-1.84Z"/>
                        <path d="M112.83,8.05h-.67s-.34-.7-.34-.7c-.06-.13-.19-.21-.33-.21h-.22s0,.91,0,.91h-.63s0-2.42,0-2.42h1.11c.19,0,.38.07.54.16.17.13.22.31.22.51,0,.29-.15.52-.45.61.16.08.25.16.34.29l.42.85ZM111.91,6.39c0-.18-.1-.3-.27-.3h-.36s0,.62,0,.62h.37c.17-.02.26-.15.26-.32Z"/>
                      </g>
                    </g>
                  </svg>
                )}
              </Editable>
            </EditableFlow>

            {/* Barra de Busca Central */}
            <Editable as="div" widgetId="chrome:header:search-box" globalKey="chrome:header:search-box" label="Barra de busca" widgetType="container" editorKind="container" className="dsvia-search-box" renderContent={false} style={{ display: (headerEdit?.schema as any)?.hide_search ? 'none' : undefined }}>
              <form className="dsvia-search-form" role="search" onSubmit={handleSearchSubmit}>
                <Editable as="input" widgetId="chrome:header:search-input" globalKey="chrome:header:search-input" label="Campo de busca" widgetType="input" content={{ input_type: 'search', placeholder: 'Busque na TEKNIX' }}
                  type="text"
                  name="search"
                  id="search-input"
                  className="dsvia-search-input"
                  placeholder="Busque na TEKNIX"
                  autoComplete="off"
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={() => setIsSearchFocused(false)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    boxShadow: 'none',
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    padding: 0,
                    margin: 0,
                    width: '100%',
                    height: '100%'
                  }}
                />
                <Editable as="button" widgetId="chrome:header:search" globalKey="chrome:header:search" widgetType="button" label="Botão de busca" renderContent={false} type="submit" className="dsvia-search-btn" aria-label="Buscar">
                  {searchEdit?.content?.icon ? (
                    renderDynamicIcon(String(searchEdit.content.icon), Number(searchEdit.content.icon_size) || 18, String(searchEdit.content.icon_color || 'currentColor'))
                  ) : (
                    <svg viewBox="0 0 18 18" width="18" height="18" fill="currentColor">
                      <path d="M6.52 12.616c-1.708 0-3.154-.592-4.338-1.777S.404 8.208.404 6.5.997 3.346 2.181 2.162 4.812.385 6.52.385s3.154.592 4.338 1.777 1.777 2.631 1.777 4.338c0 .714-.12 1.396-.36 2.046a5.72 5.72 0 0 1-.96 1.696l5.754 5.754c.139.138.209.313.212.522s-.068.387-.212.532-.321.217-.527.217-.382-.072-.527-.217l-5.754-5.754c-.5.413-1.075.736-1.725.969s-1.322.35-2.017.35zm0-1.5c1.288 0 2.38-.447 3.274-1.341s1.341-1.986 1.341-3.274-.447-2.38-1.341-3.274S7.808 1.885 6.52 1.885s-2.38.447-3.274 1.341S1.904 5.212 1.904 6.5s.447 2.38 1.341 3.274 1.986 1.341 3.274 1.341z" />
                    </svg>
                  )}
                </Editable>

              </form>
            </Editable>

            {/* Modal Completo de CEP / Endereço de Entrega */}
            <CepDeliveryModal
              isOpen={isCepOpen}
              onClose={() => setIsCepOpen(false)}
              currentCep={cep}
              onSelectCep={handleSelectCep}
            />

            {/* ── LOCATION PILL (IP/CEP) ── */}
            {(() => {
              const displayCity = locationDetails?.city
                ? `${locationDetails.city}${locationDetails.state ? `/${locationDetails.state}` : ''}`
                : geoCity
                ? geoCity
                : cep
                ? `CEP ${cep}`
                : 'Sao Paulo/SP'

              return (
                <div className={`dsvia-location-wrapper ${isSearching ? 'is-searching' : ''}`}>
                  <div className="published-flow-node" data-canvas-node="header-top-row:chrome:header:location" draggable="false" style={{ display: 'contents' }}>
                    <button
                      aria-expanded={isCepOpen ? 'true' : 'false'}
                      aria-haspopup="dialog"
                      aria-label={`Região de ${displayCity}. Alterar o CEP`}
                      className={`[grid-area:location] flex font-2xsm-regular gap-2xsm items-center w-full text-interaction-default-inverted bg-transparent cursor-pointer xlg:justify-self-start xlg:w-max xlg:[grid-area:unset] min-w-0 [&>*:last-child]:ml-auto xlg:w-auto xlg:max-w-[250px] dsvia-location-pill ${isSearching ? 'is-searching' : ''}`}
                      data-testid="header-location"
                      type="button"
                      onClick={() => setIsCepOpen(true)}
                      title={`Região de ${displayCity}. Alterar o CEP`}
                    >
                      <i className="icon icon-place text-interaction-default-inverted font-xlg-regular shrink-0 dsvia-icon-place" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                      </i>
                      <span className="block text-left font-2xsm-regular min-w-0 flex-1 w-full dsvia-location-text-col">
                        <span className="xlg:block dsvia-location-prefix">Região de </span>
                        <span className="xlg:block xlg:font-2xsm-bold dsvia-location-city">{displayCity}</span>
                      </span>
                      <i className="icon icon-chevron-down text-interaction-default-inverted font-xlg-regular shrink-0 xlg:font-md-regular xlg:self-auto dsvia-icon-chevron" aria-hidden="true">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </i>
                    </button>
                  </div>
                </div>
              )
            })()}

            {/* Ações da Direita: Acesse sua Conta, Pedidos, Favoritos, Carrinho */}
            <Editable as="div" widgetId="chrome:header:actions" globalKey="chrome:header:actions" label="Ícones e ações do cabeçalho" widgetType="container" editorKind="container" className="dsvia-actions-right" renderContent={false}>
              <EditableFlow id="header-actions" label="Ações do cabeçalho" globalKey="layout:chrome:header:actions" compact>

              {/* Cápsula Cinza: Acesse sua Conta */}
              <Editable as="div" widgetId="chrome:header:account-group" globalKey="chrome:header:account-group" label="Grupo da conta" widgetType="container" editorKind="container" className="dsvia-account-menu" ref={accountPopoverRef} renderContent={false} style={{ display: (headerEdit?.schema as any)?.hide_account ? 'none' : undefined }}>
                <Editable as={Link} widgetId="chrome:header:account" globalKey="chrome:header:account" widgetType="button" label="Acesso à conta" renderContent={false}
                  to={user ? '/conta' : '/login'}
                  className="dsvia-account-capsule"
                  title={user ? `Minha Conta (${account.fullName})` : 'Acesse sua conta'}
                  onClick={(event: any) => { if (user) { event.preventDefault(); setIsAccountOpen(open => !open) } }}
                  aria-expanded={user ? isAccountOpen : undefined}
                >
                  {account.avatarUrl ? (
                    <img className="dsvia-account-avatar" src={account.avatarUrl} alt="Foto de perfil" referrerPolicy="no-referrer" />
                  ) : user ? (
                    <div className="dsvia-account-initials-badge">
                      {account.firstName.charAt(0).toUpperCase()}
                    </div>
                  ) : accountEdit?.content?.icon ? (
                    renderDynamicIcon(String(accountEdit.content.icon), Number(accountEdit.content.icon_size) || 18, String(accountEdit.content.icon_color || 'currentColor'))
                  ) : (
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="10" r="3" />
                      <path d="M7 20.662V19a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v1.662" />
                    </svg>
                  )}
                  <div className="dsvia-account-user-text">
                    {user ? (
                      <span className="dsvia-account-logged-in-label" aria-hidden="true" />
                    ) : (
                      <>
                        <span className="dsvia-account-greeting">Boas-vindas :)</span>
                        <span className="dsvia-account-subtext">Entre ou cadastre-se</span>
                      </>
                    )}
                  </div>
                </Editable>

                {user && isAccountOpen && (
                  <div className="dsvia-account-popover" role="menu">
                    <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid #f0f0f0', marginBottom: '6px' }}>
                      <div style={{ fontWeight: 600, fontSize: '13px', color: '#1d1d1f', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {account.fullName}
                      </div>
                      <div style={{ fontSize: '11px', color: '#86868b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {user.email}
                      </div>
                    </div>
                    <Link to="/conta" role="menuitem" onClick={() => setIsAccountOpen(false)}>Minha conta</Link>
                    <Link to="/pedidos" role="menuitem" onClick={() => setIsAccountOpen(false)}>Meus pedidos</Link>
                    <Link to="/conta/dados-cadastrais" role="menuitem" onClick={() => setIsAccountOpen(false)}>Dados cadastrais</Link>
                    <button type="button" role="menuitem" onClick={handleSignOut}>Sair da conta</button>
                  </div>
                )}

              </Editable>

              {/* Ícone de Rastreamento / Meus Pedidos */}
              {user && (
                <Editable as={Link} widgetId="chrome:header:orders" globalKey="chrome:header:orders" widgetType="icon" label="Ícone de pedidos" content={{ icon: 'package', icon_size: 20 }} renderContent={false} to="/pedidos" className="dsvia-icon-action" title="Meus Pedidos">
                  {ordersEdit?.content?.icon ? (
                    renderDynamicIcon(String(ordersEdit.content.icon), Number(ordersEdit.content.icon_size) || 20, String(ordersEdit.content.icon_color || 'currentColor'))
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                      <line x1="12" y1="22.08" x2="12" y2="12" />
                    </svg>
                  )}
                </Editable>
              )}

              {/* Ícone de Favoritos */}
              <Editable as={Link} widgetId="chrome:header:favorites" globalKey="chrome:header:favorites" widgetType="icon" label="Ícone de favoritos" renderContent={false} to="/itens-salvos" className="dsvia-icon-action" title="Meus Favoritos" style={{ display: (headerEdit?.schema as any)?.hide_favorites ? 'none' : undefined }}>
                {favoritesEdit?.content?.icon ? (
                  renderDynamicIcon(String(favoritesEdit.content.icon), Number(favoritesEdit.content.icon_size) || 22, String(favoritesEdit.content.icon_color || 'currentColor'))
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-heart" aria-hidden="true">
                    <path d="M2 9.5a5.5 5.5 0 0 1 9.591-3.676.56.56 0 0 0 .818 0A5.49 5.49 0 0 1 22 9.5c0 2.29-1.5 4-3 5.5l-5.492 5.313a2 2 0 0 1-3 .019L5 15c-1.5-1.5-3-3.2-3-5.5" />
                  </svg>
                )}
              </Editable>

              {/* Ícone de Carrinho */}
              <Editable as={Link} widgetId="chrome:header:cart" globalKey="chrome:header:cart" widgetType="icon" label="Ícone do carrinho" renderContent={false} to="/sacola" className="dsvia-icon-action" title="Meu Carrinho" style={{ display: (headerEdit?.schema as any)?.hide_cart ? 'none' : undefined }}>
                {cartEdit?.content?.icon ? (
                  renderDynamicIcon(String(cartEdit.content.icon), Number(cartEdit.content.icon_size) || 22, String(cartEdit.content.icon_color || 'currentColor'))
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-bag" aria-hidden="true">
                    <path d="M16 10a4 4 0 0 1-8 0" />
                    <path d="M3.103 6.034h17.794" />
                    <path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z" />
                  </svg>
                )}
                <span className="dsvia-cart-count-badge">{totalItems}</span>
              </Editable>
              </EditableFlow>
            </Editable>
            </EditableFlow>
          </Editable>

          {/* ── LINHA 2: ≡ DEPARTAMENTOS + CATEGORIAS + CUPOM + SERVIÇOS ── */}
          <Editable as="div" widgetId="chrome:header:bottom-row" globalKey="chrome:header:bottom-row" label="Linha de navegação" widgetType="container" editorKind="container" className="dsvia-row-bottom" renderContent={false}>
            <EditableFlow id="header-navigation" label="Navegação do cabeçalho" globalKey="layout:chrome:header:navigation" compact>
            {/* Grupo Esquerdo: Menu e Categorias Principais */}
            <Editable
              as="nav"
              widgetId="chrome:header:departments-nav"
              globalKey="chrome:header:departments-nav"
              label="Menu Horizontal da Loja"
              widgetType="horizontal-menu"
              editorKind="widget"
              className="dsvia-nav-left"
              aria-label="Menu Horizontal da Loja"
              renderContent={false}
            >
              {showDeptBtn && (
                <div className="dsvia-departments-menu" ref={departmentsPopoverRef}>
                <button
                  type="button"
                  className="dsvia-dept-trigger"
                  aria-label="Abrir todos os departamentos"
                  aria-expanded={isDepartmentsOpen}
                  aria-haspopup="menu"
                  onClick={() => setIsDepartmentsOpen(open => !open)}
                >
                  <svg viewBox="0 0 18 12" width="16" height="12" fill="currentColor">
                    <path d="M1.25 11.635c-.212 0-.391-.072-.534-.216S.5 11.097.5 10.884s.072-.391.216-.534.322-.215.534-.215h15.5c.212 0 .391.072.534.216s.216.322.216.535-.072.391-.216.534-.322.215-.534.215H1.25zm0-4.885c-.212 0-.391-.072-.534-.216S.5 6.212.5 6s.072-.391.216-.534.322-.215.534-.215h15.5c.212 0 .391.072.534.216s.216.322.216.535-.072.391-.216.534-.322.215-.534.215H1.25zm0-4.885c-.212 0-.391-.072-.534-.216S.5 1.328.5 1.115.572.724.716.581s.322-.215.534-.215h15.5c.212 0 .391.072.534.216s.216.322.216.535-.072.391-.216.534-.322.215-.534.215H1.25z" />
                  </svg>
                  <span>{deptBtnText}</span>
                </button>
                {isDepartmentsOpen && (
                  <div className="dsvia-departments-popover" role="menu" aria-label="Todos os departamentos">
                    {CORE_CATEGORIES.map(item => (
                      <Link key={item.slug} to={`/categoria/${item.slug}`} role="menuitem" onClick={() => setIsDepartmentsOpen(false)}>{item.name}</Link>
                    ))}
                  </div>
                )}
                </div>
              )}

              {visibleDeptItems.map((item, idx) => (
                <Link key={idx} to={item.url} className="dsvia-nav-link">{item.label}</Link>
              ))}

              {showFeaturedItem && (
                <Link
                  to={featuredLink}
                  className="dsvia-coupon-badge"
                  style={{
                    backgroundColor: featuredBg,
                    color: featuredColor,
                    borderRadius: featuredStyle === 'badge' ? '980px' : '6px',
                    fontWeight: 700
                  }}
                >
                  {featuredText}
                </Link>
              )}
            </Editable>

            {/* Grupo Direito: Serviços Institucionais */}
            <Editable as="nav" widgetId="chrome:header:services-nav" globalKey="chrome:header:services-nav" label="Menu de serviços" widgetType="container" editorKind="container" className="dsvia-nav-right" aria-label="Serviços Rápidos" renderContent={false}>
              <Link to="/contato" className="dsvia-nav-link">Compra Corporativa</Link>
              <Link to="/institucional" className="dsvia-nav-link">Soluções e Serviços</Link>
            </Editable>
            </EditableFlow>
          </Editable>
          </EditableFlow>
        </div>
        {!isHome && <div className="dsvia-bottom-green-line" aria-hidden="true" />}
      </Editable>

      {/* ── DRAWER MENU LATERAL ── */}
      {isMenuOpen && (
        <>
          <div className="dsvia-drawer-overlay" onClick={() => setIsMenuOpen(false)} />
          <aside
            className="dsvia-drawer-panel"
            aria-label="Menu principal"
            aria-modal="true"
            role="dialog"
          >
            {/* Topo: Título + Botão Fechar */}
            <div className="tkn-drawer-top">
              <div className="tkn-drawer-title-wrap">
                <Link to="/" className="tkn-drawer-logo" onClick={() => setIsMenuOpen(false)} aria-label="Página inicial TEKNIX">
                  {customLogoUrl ? (
                    <img src={customLogoUrl} alt="TEKNIX" style={{ height: 22, objectFit: 'contain' }} />
                  ) : (
                    <img src="/teknix-logo.svg" alt="TEKNIX" />
                  )}
                </Link>
                <span className="tkn-drawer-greeting">
                  {user ? `Olá, ${account.firstName}` : 'Olá! Seja bem-vindo'}
                </span>
              </div>
              <button
                type="button"
                className="tkn-drawer-close-btn"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Fechar o menu lateral"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Banner rápido de usuário / Login */}
            <div className="tkn-drawer-user-strip">
              <div className="tkn-drawer-user-meta">
                {account.avatarUrl ? <img className="tkn-drawer-user-avatar" src={account.avatarUrl} alt="Foto de perfil" referrerPolicy="no-referrer" /> : <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>}
                <span>{user ? account.fullName : 'Sua conta'}</span>
              </div>
              <Link
                to={user ? '/conta' : '/login'}
                className="tkn-drawer-user-action"
                onClick={() => setIsMenuOpen(false)}
              >
                {user ? 'Acessar conta →' : 'Entrar →'}
              </Link>
            </div>

            {/* Conteúdo rolável resumido */}
            <div className="tkn-drawer-scroll-body">
              {/* Seção 1: Departamentos em Destaque */}
              <div className="tkn-drawer-section">
                <div className="tkn-drawer-section-header">
                  <h3 className="tkn-drawer-section-title">Departamentos</h3>
                  <span className="tkn-drawer-section-badge">Categorias</span>
                </div>
                <ul className="tkn-drawer-list">
                  {CORE_CATEGORIES.slice(0, 5).map(category => (
                    <li key={category.id} className="tkn-drawer-item">
                      <Link to={`/categoria/${category.slug}`} className="tkn-drawer-link" onClick={() => setIsMenuOpen(false)}>
                        <span className="tkn-drawer-icon-wrap">
                          {getCategoryIcon(category.id)}
                        </span>
                        <span className="tkn-drawer-item-text">{category.name}</span>
                        <svg className="tkn-drawer-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Link>
                    </li>
                  ))}
                  <li className="tkn-drawer-item tkn-drawer-all-card-item">
                    <Link to="/produtos" className="tkn-drawer-all-card-link" onClick={() => setIsMenuOpen(false)}>
                      <div className="tkn-drawer-all-card-content">
                        <span className="tkn-drawer-icon-wrap tkn-drawer-all-icon">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" rx="1.5" />
                            <rect x="14" y="3" width="7" height="7" rx="1.5" />
                            <rect x="14" y="14" width="7" height="7" rx="1.5" />
                            <rect x="3" y="14" width="7" height="7" rx="1.5" />
                          </svg>
                        </span>
                        <span>Ver todo o catálogo</span>
                      </div>
                      <svg className="tkn-drawer-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Seção 2: Minha Conta & Atalhos Essenciais */}
              <div className="tkn-drawer-section">
                <div className="tkn-drawer-section-header">
                  <h3 className="tkn-drawer-section-title">Navegação Rápida</h3>
                </div>
                <ul className="tkn-drawer-list">
                  <li className="tkn-drawer-item">
                    <Link to="/pedidos" className="tkn-drawer-link" onClick={() => setIsMenuOpen(false)}>
                      <span className="tkn-drawer-icon-wrap">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                          <line x1="12" y1="22.08" x2="12" y2="12" />
                        </svg>
                      </span>
                      <span className="tkn-drawer-item-text">Meus Pedidos</span>
                      <svg className="tkn-drawer-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </li>
                  <li className="tkn-drawer-item">
                    <Link to="/itens-salvos" className="tkn-drawer-link" onClick={() => setIsMenuOpen(false)}>
                      <span className="tkn-drawer-icon-wrap">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                        </svg>
                      </span>
                      <span className="tkn-drawer-item-text">Itens Salvos</span>
                      <svg className="tkn-drawer-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </li>
                  <li className="tkn-drawer-item">
                    <Link to="/sacola" className="tkn-drawer-link" onClick={() => setIsMenuOpen(false)}>
                      <span className="tkn-drawer-icon-wrap">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                          <line x1="3" y1="6" x2="21" y2="6" />
                          <path d="M16 10a4 4 0 0 1-8 0" />
                        </svg>
                      </span>
                      <span className="tkn-drawer-item-text">Sacola de Compras</span>
                      <svg className="tkn-drawer-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </li>
                  <li className="tkn-drawer-item">
                    <Link to="/contato" className="tkn-drawer-link" onClick={() => setIsMenuOpen(false)}>
                      <span className="tkn-drawer-icon-wrap">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                      </span>
                      <span className="tkn-drawer-item-text">Atendimento &amp; Suporte</span>
                      <svg className="tkn-drawer-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Rodapé Resumido e Direto */}
            <div className="tkn-drawer-footer" data-testid="header-sidebar-footer">
              <a
                className="tkn-drawer-btn-primary"
                href="https://wa.me/5546999155875"
                target="_blank"
                rel="noreferrer"
                onClick={() => setIsMenuOpen(false)}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>WhatsApp: (46) 99915-5875</span>
              </a>
            </div>
          </aside>
        </>
      )}
    </>
  )
}

TeknixHeader.editorLabel = "Cabeçalho"
