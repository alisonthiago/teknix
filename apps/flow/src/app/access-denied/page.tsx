import Link from 'next/link'
import { ShieldX } from 'lucide-react'

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center p-6">
      <div className="text-center max-w-md mp-card">
        <div className="w-16 h-16 bg-[#fff0f1] rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldX className="w-8 h-8 text-[#f23d4f]" />
        </div>
        <h1 className="mp-page-title mb-2">Acesso Negado</h1>
        <p className="text-[#999] mb-6 text-sm">
          Você não possui permissão para acessar esta página. 
          Entre em contato com o administrador para solicitar acesso.
        </p>
        <Link href="/dashboard" className="mp-btn-primary px-6 py-3">
          Voltar ao Dashboard
        </Link>
      </div>
    </div>
  )
}
