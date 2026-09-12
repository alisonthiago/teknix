import PageEditor from './pages/PageEditor'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import HubLayout from './components/HubLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ProductsList from './pages/ProductsList'
import ProductForm from './pages/ProductForm'
import ProductDetails from './pages/ProductDetails'
import OrdersList from './pages/OrdersList'
import ShipmentsList from './pages/ShipmentsList'
import StockNotificationsList from './pages/StockNotificationsList'
import OrderDetails from './pages/OrderDetails'
import ShippingSettings from './pages/ShippingSettings'
import CustomersList from './pages/CustomersList'
import CustomerDetails from './pages/CustomerDetails'
import FinanceOverview from './pages/FinanceOverview'
import PaymentMethods from './pages/PaymentMethods'
import SettingsHub from './pages/SettingsHub'
import CouponsList from './pages/CouponsList'
import PromotionsList from './pages/PromotionsList'
import ShippingDiscounts from './pages/ShippingDiscounts'
import UserEdit from './pages/UserEdit'
import CategoriesList from './pages/CategoriesList'
import CategoryEdit from './pages/CategoryEdit'
import PriceTables from './pages/PriceTables'
import StatsOverview from './pages/StatsOverview'
import MarketingHub from './pages/MarketingHub'
import WhatsAppHub from './pages/WhatsAppHub'
import MercadoLivreHub from './pages/MercadoLivreHub'
import MarketplaceChannelHub from './pages/MarketplaceChannelHub'
import IntegrationsHub from './pages/IntegrationsHub'
import IntegrationsAdd from './pages/IntegrationsAdd'
import PlaceholderPage from './pages/PlaceholderPage'
import PagesList from './pages/PagesList'
import BlogList from './pages/BlogList'
import BlogEditor from './pages/BlogEditor'
import BlogAnalytics from './pages/BlogAnalytics'
import BlogSeo from './pages/BlogSeo'
import AdsList from './pages/AdsList'
import AdsForm from './pages/AdsForm'
import AdsAnalytics from './pages/AdsAnalytics'
import InvoicesList from './pages/InvoicesList'
import FiscalSettings from './pages/FiscalSettings'
import NotificationsList from './pages/NotificationsList'
import { HubNotificationProvider } from './contexts/HubNotificationContext'

import LoadingScreen from './components/ui/LoadingScreen'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  
  if (loading) return <LoadingScreen message="Carregando TEKNIX Hub..." subtitle="Autenticando sessão com segurança" />
  if (!user) return <Navigate to="/login" />
  
  return <>{children}</>
}

function App() {
  return (
    <AuthProvider>
      <HubNotificationProvider>
        <BrowserRouter>
          <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/hub" />} />
          <Route path="/produtos" element={<Navigate to="/hub/produtos" />} />
          <Route path="/pedidos" element={<Navigate to="/hub/pedidos" />} />
          
          <Route element={
            <PrivateRoute>
              <HubLayout />
            </PrivateRoute>
          }>
            <Route path="/hub" element={<Dashboard />} />
            <Route path="/hub/produtos" element={<ProductsList />} />
            <Route path="/hub/produtos/novo" element={<ProductForm />} />
            <Route path="/hub/produtos/editar/:id" element={<ProductForm />} />
            <Route path="/hub/produtos/:id" element={<ProductDetails />} />
            <Route path="/hub/categorias" element={<CategoriesList />} />
            <Route path="/hub/categorias/nova" element={<CategoryEdit />} />
            <Route path="/hub/categorias/:id" element={<CategoryEdit />} />
            <Route path="/hub/categorias/editar/:id" element={<CategoryEdit />} />
            <Route path="/hub/tabelas-de-precos" element={<PriceTables />} />
            <Route path="/hub/assinaturas" element={<PlaceholderPage title="Assinaturas e Recorrência" />} />
            <Route path="/hub/pedidos" element={<OrdersList />} />
            <Route path="/hub/envios" element={<ShipmentsList />} />
            <Route path="/hub/avisos-estoque" element={<StockNotificationsList />} />
            <Route path="/hub/pedidos/:id" element={<OrderDetails />} />
            <Route path="/hub/entregas" element={<ShippingSettings />} />
            <Route path="/hub/clientes" element={<CustomersList />} />
            <Route path="/hub/clientes/:id" element={<CustomerDetails />} />
            <Route path="/hub/financeiro" element={<FinanceOverview />} />
            <Route path="/hub/pagamentos" element={<PaymentMethods />} />
            <Route path="/hub/notas-fiscais" element={<InvoicesList />} />
            <Route path="/hub/configuracoes/fiscal" element={<FiscalSettings />} />
            <Route path="/hub/descontos" element={<CouponsList />} />
            <Route path="/hub/cupons" element={<CouponsList />} />
            <Route path="/hub/promocoes" element={<PromotionsList />} />
            <Route path="/hub/descontos-frete" element={<ShippingDiscounts />} />
            <Route path="/hub/mercado-livre" element={<MercadoLivreHub />} />
            <Route path="/hub/shopee" element={<MarketplaceChannelHub defaultChannel="shopee" />} />
            <Route path="/hub/amazon" element={<MarketplaceChannelHub defaultChannel="amazon" />} />
            <Route path="/hub/magalu" element={<MarketplaceChannelHub defaultChannel="magalu" />} />
            <Route path="/hub/integracoes/add" element={<IntegrationsAdd />} />
            <Route path="/hub/integracoes/:channelId" element={<MarketplaceChannelHub />} />
            <Route path="/hub/mercado-pago" element={<Navigate to="/hub/pagamentos" replace />} />
            <Route path="/hub/whatsapp" element={<WhatsAppHub />} />
            <Route path="/hub/usuarios" element={<UserEdit />} />
            <Route path="/hub/integracoes" element={<IntegrationsHub />} />
            <Route path="/hub/configuracoes" element={<SettingsHub />} />
            <Route path="/hub/estatisticas" element={<StatsOverview />} />
            <Route path="/hub/editor/:kind/:id?" element={<PageEditor />} />
            <Route path="/editor/page/:id" element={<PageEditor />} />
            <Route path="/hub/paginas/editar/:id" element={<PageEditor />} />
            <Route path="/hub/paginas" element={<PagesList />} />
            <Route path="/hub/blog" element={<BlogList />} />
            <Route path="/hub/blog/add" element={<BlogEditor />} />
            <Route path="/hub/blog/editar/:id" element={<BlogEditor />} />
            <Route path="/hub/blog/analytics" element={<BlogAnalytics />} />
            <Route path="/hub/blog/seo" element={<BlogSeo />} />
            <Route path="/hub/ads" element={<AdsList />} />
            <Route path="/hub/ads/add" element={<AdsForm />} />
            <Route path="/hub/ads/edit/:id" element={<AdsForm />} />
            <Route path="/hub/ads/analytics" element={<AdsAnalytics />} />
            <Route path="/hub/ads/analitcs" element={<Navigate to="/hub/ads/analytics" replace />} />
            <Route path="/hub/notificacoes" element={<NotificationsList />} />
          </Route>
        
        </Routes>
      </BrowserRouter>
      </HubNotificationProvider>
    </AuthProvider>
  )
}

export default App
