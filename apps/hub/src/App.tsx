import { BrowserRouter, Routes, Route } from 'react-router-dom'
import HubLayout from './components/HubLayout'
import Dashboard from './pages/Dashboard'
import ProductsList from './pages/ProductsList'
import ProductForm from './pages/ProductForm'
import PagesList from './pages/PagesList'
import PageEditor from './pages/PageEditor'
import ThemesList from './pages/ThemesList'
import ThemeEditor from './pages/ThemeEditor'
import PlaceholderPage from './pages/PlaceholderPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<HubLayout />}>
          <Route path="/hub" element={<Dashboard />} />
          <Route path="/hub/produtos" element={<ProductsList />} />
          <Route path="/hub/produtos/novo" element={<ProductForm />} />
          <Route path="/hub/produtos/editar/:id" element={<ProductForm />} />
          <Route path="/hub/categorias" element={<PlaceholderPage title="Categorias" />} />
          <Route path="/hub/pedidos" element={<PlaceholderPage title="Pedidos" />} />
          <Route path="/hub/clientes" element={<PlaceholderPage title="Clientes" />} />
          <Route path="/hub/financeiro" element={<PlaceholderPage title="Financeiro" />} />
          <Route path="/hub/mercado-livre" element={<PlaceholderPage title="Mercado Livre" />} />
          <Route path="/hub/mercado-pago" element={<PlaceholderPage title="Mercado Pago" />} />
          <Route path="/hub/whatsapp" element={<PlaceholderPage title="WhatsApp" />} />
          <Route path="/hub/usuarios" element={<PlaceholderPage title="Usuários" />} />
          <Route path="/hub/configuracoes" element={<PlaceholderPage title="Configurações" />} />
          <Route path="/hub/estatisticas" element={<PlaceholderPage title="Estatísticas" />} />
          <Route path="/hub/paginas" element={<PagesList />} />
          <Route path="/hub/paginas/nova" element={<PageEditor />} />
          <Route path="/hub/paginas/editar/:id" element={<PageEditor />} />
          <Route path="/hub/temas" element={<ThemesList />} />
          <Route path="/hub/temas/novo" element={<ThemeEditor />} />
          <Route path="/hub/temas/editar/:id" element={<ThemeEditor />} />
          <Route path="/hub/templates" element={<PlaceholderPage title="Templates" />} />
          <Route path="/hub/headers" element={<PlaceholderPage title="Headers" />} />
          <Route path="/hub/menus" element={<PlaceholderPage title="Menus" />} />
          <Route path="/hub/footers" element={<PlaceholderPage title="Footers" />} />
          <Route path="/hub/banners" element={<PlaceholderPage title="Banners" />} />
          <Route path="/hub/media" element={<PlaceholderPage title="Biblioteca de Mídia" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
