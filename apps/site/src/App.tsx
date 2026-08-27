import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { CartProvider } from './context/CartContext'
import { FavoritesProvider } from './context/FavoritesContext'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import Product from './pages/Product'
import SegmentPage from './pages/SegmentPage'
import CategoryPage from './pages/CategoryPage'
import Contact from './pages/Contact'
import DynamicPage from './pages/DynamicPage'
import PagePreview from './pages/PagePreview'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Account from './pages/Account'
import OrdersList from './pages/OrdersList'
import OrderLookup from './pages/OrderLookup'
import SavedItems from './pages/SavedItems'
import Bag from './pages/Bag'
import Checkout from './pages/Checkout'
import './App.css'

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <Routes>
            {/* 1. Páginas Principais e Catálogo */}
            <Route path="/" element={<SiteLayout><Home /></SiteLayout>} />
            <Route path="/produtos" element={<SiteLayout><Products /></SiteLayout>} />
            <Route path="/mac" element={<SiteLayout><Products /></SiteLayout>} />
            <Route path="/ipad" element={<SiteLayout><Products /></SiteLayout>} />
            <Route path="/iphone" element={<SiteLayout><Products /></SiteLayout>} />
            <Route path="/watch" element={<SiteLayout><Products /></SiteLayout>} />
            <Route path="/airpods" element={<SiteLayout><Products /></SiteLayout>} />
            <Route path="/vision" element={<SiteLayout><Products /></SiteLayout>} />
            <Route path="/produtos/:sku" element={<SiteLayout><Product /></SiteLayout>} />

            {/* 2. Institucional e Suporte */}
            <Route path="/contato" element={<SiteLayout><Contact /></SiteLayout>} />

            {/* 3. Autenticação IDMS */}
            <Route path="/login" element={<><Header /><main><Login /></main></>} />
            <Route path="/cadastro" element={<><Header /><main><Register /></main></>} />
            <Route path="/password" element={<><Header /><main><ForgotPassword /></main></>} />

            {/* 4. Páginas Nativas e Protegidas do Sistema */}
            <Route path="/conta" element={<SiteLayout><Account /></SiteLayout>} />
            <Route path="/pedidos" element={<SiteLayout><OrdersList /></SiteLayout>} />
            <Route path="/order/list" element={<SiteLayout><OrdersList /></SiteLayout>} />
            <Route path="/order/link/verify" element={<SiteLayout><OrderLookup /></SiteLayout>} />
            <Route path="/salvos" element={<SiteLayout><SavedItems /></SiteLayout>} />
            <Route path="/sacola" element={<SiteLayout><Bag /></SiteLayout>} />

            {/* 5. Checkout Oficial (1:1 Apple Store) */}
            <Route path="/checkout" element={<Checkout />} />

            {/* 6. Page Builder & Páginas Dinâmicas */}
            <Route path="/preview/:id" element={<PagePreview />} />
            <Route path="/:segmento/:categoria" element={<SiteLayout><CategoryPage /></SiteLayout>} />
            <Route path="/:segmento" element={<SiteLayout><SegmentPage /></SiteLayout>} />
            <Route path="*" element={<DynamicPage />} />
          </Routes>
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  )
}

export default App
