import SiteStandards from './components/page-widgets/SiteStandards'
import PageScope from './components/page-widgets/PageScope'
import EditableFlow from './components/page-widgets/EditableFlow'
import { Editable } from './components/page-widgets/PageWidgets'
import WidgetPreview from './pages/WidgetPreview'
import { Routes, Route, useLocation } from 'react-router-dom'
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
import './App.css'

import TeknixHeader from './components/TeknixHeader'
import TeknixFooter from './components/TeknixFooter'
import CartTray from './components/CartTray'
import CompareTray from './components/CompareTray'
import { Ads } from './components/Ads'
import CookieNotice from './components/CookieNotice'

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
  const isBlog = pathname.startsWith('/blog')
  return (
    <div className="site-layout-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!hideHeader && <Ads position="promo-bar" />}
      {!hideHeader && <TeknixHeader />}
      {!hideHeader && <Ads position="global-header" />}
      {isBlog && <Ads position="blog-header" />}
      <main style={{ flex: '1 0 auto' }}>
        <NativePageCanvas>{children}</NativePageCanvas>
      </main>
      {isBlog && <Ads position="blog-middle" />}
      {isBlog && <Ads position="blog-footer" />}
      {!hideFooter && <Ads position="global-footer" />}
      {!hideFooter && <TeknixFooter />}
      {pathname !== '/sacola' && <CartTray />}
      <CompareTray />
    </div>
  )
}


function App() {
  const { pathname } = useLocation()
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
              <Route path="/contato" element={<SiteLayout><Contact /></SiteLayout>} />
              <Route path="/institucional/*" element={<DynamicPage />} />

              {/* 4. Checkout Oficial */}
              <Route path="/checkout" element={<NativePageCanvas><Checkout /></NativePageCanvas>} />

              {/* 5. Busca de Produtos */}
              <Route path="/busca" element={<SiteLayout><SearchResults /></SiteLayout>} />

              {/* 5b. Catálogo de Produtos (legado) */}
              <Route path="/produtos" element={<SiteLayout><SearchResults /></SiteLayout>} />

              {/* 6. Página de Produto */}
              <Route path="/produto/:slug" element={<SiteLayout><Product /></SiteLayout>} />
              <Route path="/produto/:categoria/:slug" element={<SiteLayout><Product /></SiteLayout>} />
              <Route path="/produtos/:slug" element={<SiteLayout><Product /></SiteLayout>} />

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
