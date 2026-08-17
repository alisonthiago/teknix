import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Calculator,
  Store,
  DollarSign,
  FileSpreadsheet
} from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, name')
    .eq('id', user.id)
    .single()

  const handleLogout = async () => {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/login')
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50 text-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-200 flex-shrink-0 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-white tracking-wider">TEKTOU</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Painel</div>
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>

          <div className="px-3 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cadastros</div>
          <Link href="/products" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <Package className="w-5 h-5" />
            Produtos
          </Link>
          <Link href="/suppliers" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <Users className="w-5 h-5" />
            Fornecedores
          </Link>

          <div className="px-3 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Operação</div>
          <Link href="/purchases" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <ShoppingCart className="w-5 h-5" />
            Compras
          </Link>
          <Link href="/sales" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <DollarSign className="w-5 h-5" />
            Vendas
          </Link>

          <div className="px-3 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Precificação</div>
          <Link href="/real-cost" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <Calculator className="w-5 h-5" />
            Custo Real
          </Link>
          <Link href="/pricing/simulator" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <Calculator className="w-5 h-5" />
            Simulador
          </Link>

          <Link href="/reports" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <FileSpreadsheet className="w-5 h-5" />
            Relatórios
          </Link>
          <div className="px-3 mt-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sistema</div>
          <Link href="/marketplaces" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <Store className="w-5 h-5" />
            Marketplaces
          </Link>
          <Link href="/import-export" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <FileSpreadsheet className="w-5 h-5" />
            Importar / Exportar
          </Link>
          <Link href="/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-slate-800 hover:text-white transition-colors">
            <Settings className="w-5 h-5" />
            Configurações
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium text-white">
              {profile?.name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{profile?.name || 'Usuário'}</p>
              <p className="text-xs text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <form action={handleLogout}>
            <button className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors">
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 md:hidden">
          <h1 className="text-xl font-bold text-slate-900">TEKTOU</h1>
          {/* Mobile menu button would go here */}
        </header>
        <div className="flex-1 overflow-auto p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
