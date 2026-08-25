import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import Product from './pages/Product'
import Contact from './pages/Contact'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import Account from './pages/Account'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={
          <>
            <Header />
            <main><Home /></main>
            <Footer />
          </>
        } />
        <Route path="/produtos" element={
          <>
            <Header />
            <main><Products /></main>
            <Footer />
          </>
        } />
        <Route path="/produtos/:slug" element={
          <>
            <Header />
            <main><Product /></main>
            <Footer />
          </>
        } />
        <Route path="/contato" element={
          <>
            <Header />
            <main><Contact /></main>
            <Footer />
          </>
        } />
        <Route path="/login" element={
          <>
            <Header />
            <main><Login /></main>
          </>
        } />
        <Route path="/cadastro" element={
          <>
            <Header />
            <main><Register /></main>
          </>
        } />
        <Route path="/esqueci-senha" element={
          <>
            <Header />
            <main><ForgotPassword /></main>
          </>
        } />
        <Route path="/minha-conta" element={
          <>
            <Header />
            <main><Account /></main>
          </>
        } />
      </Routes>
    </AuthProvider>
  )
}

export default App
