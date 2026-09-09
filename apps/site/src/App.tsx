import SiteStandards from './components/page-widgets/SiteStandards'
import PageScope from './components/page-widgets/PageScope'
import EditableFlow from './components/page-widgets/EditableFlow'
import { Editable } from './components/page-widgets/PageWidgets'
import WidgetPreview from './pages/WidgetPreview'
import { Routes, Route, useLocation, Navigate, useParams } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { CartProvider } from './context/CartContext'
import { FavoritesProvider } from './context/FavoritesContext'
import { CompareProvider } from './context/CompareContext'

import Contact from './pages/Contact'
import PagePreview from './pages/PagePreview'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import AuthCallback from './pages/AuthCallback'
import OrdersList from './pages/OrdersList'
import OrderLookup from './pages/OrderLookup'
import SavedItems from './pages/SavedItems'
import Bag from './pages/Bag'
import Checkout from './pages/Checkout'
import Product from './pages/Product'
import SearchResults from './pages/SearchResults'
import CategoryPage from './pages/CategoryPage'
import DynamicPage from './pages/DynamicPage'
import ComparePage from './pages/ComparePage'
import Account from './pages/Account'
import Blog from './pages/Blog'
import News from './pages/News'
import NewsAbout from './pages/NewsAbout'
import NewsEcosystem from './pages/NewsEcosystem'
import NewsInvestors from './pages/NewsInvestors'
import NewsSustainability from './pages/NewsSustainability'
import NewsArticle from './pages/NewsArticle'
import NewsIndex from './pages/NewsIndex'
import HelpCenter from './pages/HelpCenter'
import HelpTopic from './pages/HelpTopic'
import LegalPage from './pages/LegalPage'
import EmailPreview from './pages/EmailPreview'
import './App.css'

import TeknixHeader from './components/TeknixHeader'
import TeknixFooter from './components/TeknixFooter'
import CartTray from './components/CartTray'
import CompareTray from './components/CompareTray'
import { Ads } from './components/Ads'
import CookieNotice from './components/CookieNotice'
import NewsHeader from './components/NewsHeader'
import { useAuth } from './hooks/useAuth'

function NativePageCanvas({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation()
  const pageKey = pathname.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home'
  return (
    <EditableFlow id={`page-canvas-${pageKey}`} label={`Estrutura da página ${pathname}`} compact>
      <Editable
        as="div"
        widgetId={`page:${pageKey}:content`}
        label="Conteúdo original da página"
        widgetType="container"
        editorKind="container"
        renderContent={false}
        style={{ display: 'contents' }}
      >
        {children}
      </Editable>
    </EditableFlow>
  )
}

export function SiteLayout({ children, hideHeader, hideFooter }: { children: React.ReactNode; hideHeader?: boolean; hideFooter?: boolean }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const isBlog = pathname.startsWith('/blog')
  const isHelp = pathname === '/ajuda' || pathname === '/ajuda/' || pathname.startsWith('/ajuda/') || pathname.startsWith('/legal/')
  const loggedUserName = user ? String(user.user_metadata?.first_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Cliente').split(' ')[0] : undefined
  return (
    <div className={`site-layout-wrapper${isHelp ? ' help-layout' : ''}`} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!hideHeader && !isHelp && <Ads position="promo-bar" />}
      {!hideHeader && (isHelp ? <NewsHeader activePage="" hideMenu loggedUserName={loggedUserName} /> : <TeknixHeader />)}
      {!hideHeader && !isHelp && <Ads position="global-header" />}
      {isBlog && <Ads position="blog-header" />}
      <main style={{ flex: '1 0 auto' }}>
        <NativePageCanvas>{children}</NativePageCanvas>
      </main>
      {isBlog && <Ads position="blog-middle" />}
      {isBlog && <Ads position="blog-footer" />}
      {!hideFooter && <Ads position="global-footer" />}
      {!hideFooter && <TeknixFooter />}
      {pathname !== '/sacola' && !isHelp && <CartTray />}
      <CompareTray />
    </div>
  )
}

function LegacyProductRedirect() {
  const { slug = '' } = useParams()
  return <Navigate to={`/${encodeURIComponent(slug)}`} replace />
}


function App() {
  const { pathname } = useLocation()
  const isNewsHost = typeof window !== 'undefined' && window.location.hostname.startsWith('news.')
  const isNewsRoute = pathname.startsWith('/news') || pathname.startsWith('/blog') || pathname === '/noticias'
  if (isNewsHost || isNewsRoute) {
    if (pathname === '/noticias') return <NewsIndex />
    if (pathname.startsWith('/blog/')) return <NewsArticle />
    if (pathname === '/news/sobre-nos' || pathname === '/news/sobrenos' || pathname === '/news/acercade') return <NewsAbout />
    if (pathname === '/news/nosso-ecossistema' || pathname === '/news/nuestro-ecosistema') return <NewsEcosystem />
    if (pathname === '/news/investidores' || pathname === '/news/inversores') return <NewsInvestors />
    if (pathname === '/news/sustentabilidade' || pathname === '/news/sustentabilidad') return <NewsSustainability />
    return <News />
  }

  const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
  const isPlayHost = hostname.startsWith('play.') || hostname === 'play.teknixbrasil.com.br'
  const isMainProdSite = hostname === 'teknixbrasil.com.br' || hostname === 'www.teknixbrasil.com.br'

  // Redirecionamento de produção do site oficial para o domínio oficial play.teknixbrasil.com.br
  if (isMainProdSite && pathname.startsWith('/checkout')) {
    const rawCode = pathname.replace(/^\/checkout\/?/, '')
    const targetUrl = rawCode ? `https://play.teknixbrasil.com.br/${rawCode}` : 'https://play.teknixbrasil.com.br/'
    window.location.replace(targetUrl)
    return null
  }

  // Suporte nativo ao domínio oficial de checkout play.teknixbrasil.com.br
  if (isPlayHost) {
    // No domínio play, o termo "/checkout" é estritamente proibido na URL
    if (pathname.startsWith('/checkout')) {
      const cleanCode = pathname.replace(/^\/checkout\/?/, '')
      return <Navigate to={cleanCode ? `/${cleanCode}` : '/'} replace />
    }

    return (
      <AuthProvider>
        <CartProvider>
          <FavoritesProvider>
            <CompareProvider>
              <CookieNotice />
              <SiteStandards>
                <PageScope key={pathname} path={pathname}>
                  <Routes>
                    <Route path="/" element={<NativePageCanvas><Checkout /></NativePageCanvas>} />
                    <Route path="/:code" element={<NativePageCanvas><Checkout /></NativePageCanvas>} />
                    <Route path="*" element={<NativePageCanvas><Checkout /></NativePageCanvas>} />
                  </Routes>
                </PageScope>
              </SiteStandards>
            </CompareProvider>
          </FavoritesProvider>
        </CartProvider>
      </AuthProvider>
    )
  }

  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <CompareProvider>
            <CookieNotice />
            <SiteStandards><PageScope key={pathname} path={pathname}><Routes>
              <Route path="/preview/:id" element={<SiteLayout><PagePreview /></SiteLayout>} />
              <Route path="/__widget-preview/:id" element={<SiteLayout><WidgetPreview /></SiteLayout>} />
              {/* 0. Home oficial */}
              <Route path="/" element={<Home />} />

              {/* 1. Autenticação IDMS */}
              <Route path="/login" element={<NativePageCanvas><Login /></NativePageCanvas>} />
              <Route path="/cadastro" element={<NativePageCanvas><Register /></NativePageCanvas>} />
              <Route path="/password" element={<NativePageCanvas><ForgotPassword /></NativePageCanvas>} />
              <Route path="/auth/callback" element={<AuthCallback />} />

              {/* 2. Páginas Nativas e Protegidas do Sistema */}
              <Route path="/conta" element={<SiteLayout><Account /></SiteLayout>} />
              {['dados-cadastrais', 'enderecos', 'seguranca', 'garantias', 'lojas-fisicas', 'atendimento'].map(section => (
                <Route key={section} path={`/conta/${section}`} element={<SiteLayout><Account /></SiteLayout>} />
              ))}
              <Route path="/minha-conta" element={<SiteLayout><Account /></SiteLayout>} />
              <Route path="/account" element={<SiteLayout><Account /></SiteLayout>} />
              <Route path="/pedidos" element={<SiteLayout><OrdersList /></SiteLayout>} />
              <Route path="/order/list" element={<SiteLayout><OrdersList /></SiteLayout>} />
              <Route path="/buscar-pedido" element={<SiteLayout><OrderLookup /></SiteLayout>} />
              <Route path="/localizar-pedido" element={<SiteLayout><OrderLookup /></SiteLayout>} />
              <Route path="/order/link/verify" element={<SiteLayout><OrderLookup /></SiteLayout>} />
              <Route path="/salvos" element={<SiteLayout><SavedItems /></SiteLayout>} />
              <Route path="/itens-salvos" element={<SiteLayout><SavedItems /></SiteLayout>} />
              <Route path="/sacola" element={<SiteLayout><Bag /></SiteLayout>} />

              {/* 3. Suporte e Contato */}
              <Route path="/contato" element={<Navigate to="/ajuda" replace />} />
              <Route path="/ajuda" element={<SiteLayout><HelpCenter /></SiteLayout>} />
              <Route path="/ajuda/:slug" element={<SiteLayout><HelpTopic /></SiteLayout>} />
              <Route path="/legal/:slug" element={<SiteLayout><LegalPage /></SiteLayout>} />
              <Route path="/institucional/*" element={<DynamicPage />} />

              {/* 4. Checkout Oficial */}
              <Route path="/checkout" element={<NativePageCanvas><Checkout /></NativePageCanvas>} />
              <Route path="/checkout/:code" element={<NativePageCanvas><Checkout /></NativePageCanvas>} />

              {/* 4b. Pré-visualizador dos Templates de E-mail Brevo */}
              <Route path="/email-preview" element={<EmailPreview />} />
              <Route path="/emails" element={<Navigate to="/email-preview" replace />} />

              {/* 5. Busca de Produtos */}
              <Route path="/busca" element={<SiteLayout><SearchResults /></SiteLayout>} />

              {/* 5b. Catálogo de Produtos (legado) */}
              <Route path="/produtos" element={<SiteLayout><SearchResults /></SiteLayout>} />

              {/* 6. Página de Produto */}
              <Route path="/produto/:slug" element={<LegacyProductRedirect />} />
              <Route path="/produto/:categoria/:slug" element={<LegacyProductRedirect />} />
              {/* URL pública direta do produto, sem o prefixo /produto(s). */}
              <Route path="/:slug" element={<SiteLayout><Product /></SiteLayout>} />
              {/* Compatibilidade: URLs antigas no plural são normalizadas para o singular. */}
              <Route path="/produtos/:slug" element={<LegacyProductRedirect />} />

              {/* 6b. Comparar Produtos */}
              <Route path="/comparar" element={<SiteLayout><ComparePage /></SiteLayout>} />

              {/* 6c. Blog público — precisa vir antes da rota genérica de categorias */}
              <Route path="/blog" element={<SiteLayout><Blog /></SiteLayout>} />
              <Route path="/blog/:slug" element={<SiteLayout><Blog /></SiteLayout>} />

              {/* 7. Página de Categoria (segmento/categoria) */}
              <Route path="/:segmento/:categoria" element={<SiteLayout><CategoryPage /></SiteLayout>} />

              {/* 7b. Página de Categoria por slug único */}
              <Route path="/categoria/:slug" element={<SiteLayout><CategoryPage /></SiteLayout>} />

              {/* 8. Rota catch-all — páginas dinâmicas do Page Builder */}
              <Route path="*" element={<DynamicPage />} />
            </Routes></PageScope></SiteStandards>
          </CompareProvider>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
