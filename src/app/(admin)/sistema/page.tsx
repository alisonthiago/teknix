'use client'

import { useRouter } from 'next/navigation'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { PageHeader } from '@/components/ui/module'
import {
  User, Shield, Bell, Settings, Clock, Smartphone,
  Building2, Users, Lock, Store, Code, Webhook,
  Link2, RefreshCw, Package, DollarSign, TrendingUp,
  Wallet, Upload, Database, FileText, Activity,
} from 'lucide-react'

interface ConfigCardProps {
  icon: React.ReactNode
  title: string
  description: string
  badge?: string
  badgeColor?: string
  onClick: () => void
}

function ConfigCard({ icon, title, description, badge, badgeColor, onClick }: ConfigCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white border border-[#e6e6e6] rounded-lg p-5 text-left hover:border-[#3483fa]/40 hover:shadow-sm transition-all group w-full"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-[#f5f5f5] flex items-center justify-center flex-shrink-0 group-hover:bg-[#f0f7ff] transition-colors">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[13px] font-semibold text-[#333]">{title}</h3>
            {badge && (
              <span className={`inline-flex px-1.5 py-[1px] rounded text-[9px] font-medium ${badgeColor || 'bg-[#f5f5f5] text-[#999]'}`}>
                {badge}
              </span>
            )}
          </div>
          <p className="text-[11px] text-[#999] mt-1 leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  )
}

function ContaTab({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[13px] font-semibold text-[#333] mb-3">Conta</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ConfigCard
            icon={<User className="w-5 h-5 text-[#3483fa]" />}
            title="Informações do perfil"
            description="Dados pessoais, nome, e-mail, telefone, foto e senha."
            onClick={() => onNavigate('/sistema/perfil')}
          />
          <ConfigCard
            icon={<Shield className="w-5 h-5 text-[#38a169]" />}
            title="Segurança"
            description="Alterar senha, autenticação em dois fatores, sessões ativas."
            onClick={() => onNavigate('/sistema/seguranca')}
          />
          <ConfigCard
            icon={<Bell className="w-5 h-5 text-[#e67e22]" />}
            title="Notificações"
            description="Configure quais notificações deseja receber."
            badge="3 novas"
            badgeColor="bg-[#fffaf0] text-[#e67e22]"
            onClick={() => onNavigate('/sistema/notificacoes')}
          />
          <ConfigCard
            icon={<Settings className="w-5 h-5 text-[#6c5ce7]" />}
            title="Preferências"
            description="Idioma, moeda, data, fuso horário, visualização."
            onClick={() => onNavigate('/sistema/preferencias')}
          />
          <ConfigCard
            icon={<Clock className="w-5 h-5 text-[#999]" />}
            title="Atividade da conta"
            description="Últimos acessos, alterações realizadas, dispositivos."
            onClick={() => onNavigate('/sistema/atividade')}
          />
          <ConfigCard
            icon={<Smartphone className="w-5 h-5 text-[#999]" />}
            title="Sessões e dispositivos"
            description="Dispositivos conectados e sessões ativas."
            onClick={() => onNavigate('/sistema/sessoes')}
          />
        </div>
      </div>
    </div>
  )
}

function NegocioTab({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[13px] font-semibold text-[#333] mb-3">Empresa</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ConfigCard
            icon={<Building2 className="w-5 h-5 text-[#3483fa]" />}
            title="Dados da empresa"
            description="CNPJ, razão social, endereço, telefone, logo."
            onClick={() => onNavigate('/sistema/empresa')}
          />
          <ConfigCard
            icon={<Users className="w-5 h-5 text-[#3483fa]" />}
            title="Colaboradores"
            description="Pessoas que operam o TEKNIX. Convites e gestão."
            badge="3 ativos"
            badgeColor="bg-[#f0fff4] text-[#38a169]"
            onClick={() => onNavigate('/sistema/colaboradores')}
          />
          <ConfigCard
            icon={<Lock className="w-5 h-5 text-[#6c5ce7]" />}
            title="Permissões"
            description="Controle o que cada colaborador pode ver e fazer."
            onClick={() => onNavigate('/sistema/permissoes')}
          />
          <ConfigCard
            icon={<Store className="w-5 h-5 text-[#3483fa]" />}
            title="Contas por Colaborador"
            description="Atribua contas de marketplace a cada colaborador."
            onClick={() => onNavigate('/sistema/colaboradores-accounts')}
          />
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold text-[#333] mb-3">Canais de venda</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ConfigCard
            icon={<Store className="w-5 h-5 text-[#e67e22]" />}
            title="Marketplaces"
            description="Conecte Mercado Livre, Shopee, Amazon, TikTok e mais."
            badge="2 conectados"
            badgeColor="bg-[#f0fff4] text-[#38a169]"
            onClick={() => onNavigate('/sistema/marketplaces')}
          />
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold text-[#333] mb-3">Integrações</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ConfigCard
            icon={<Code className="w-5 h-5 text-[#3483fa]" />}
            title="API e desenvolvedores"
            description="Chaves de API, acesso programático ao TEKNIX."
            onClick={() => onNavigate('/sistema/api')}
          />
          <ConfigCard
            icon={<Webhook className="w-5 h-5 text-[#6c5ce7]" />}
            title="Webhooks"
            description="Receba eventos automaticamente de sistemas externos."
            onClick={() => onNavigate('/sistema/webhooks')}
          />
          <ConfigCard
            icon={<Link2 className="w-5 h-5 text-[#38a169]" />}
            title="Integrações"
            description="Conecte ferramentas: ERP, transportadoras, pagamentos."
            onClick={() => onNavigate('/sistema/integracoes')}
          />
          <ConfigCard
            icon={<RefreshCw className="w-5 h-5 text-[#e67e22]" />}
            title="Sincronização"
            description="Central de sincronização com marketplaces."
            onClick={() => onNavigate('/sistema/sincronizacao')}
          />
          <ConfigCard
            icon={<Activity className="w-5 h-5 text-[#3483fa]" />}
            title="Logs de Integração"
            description="Chamadas API realizadas com marketplaces."
            onClick={() => onNavigate('/sistema/integracoes-logs')}
          />
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold text-[#333] mb-3">Operação</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ConfigCard
            icon={<Package className="w-5 h-5 text-[#3483fa]" />}
            title="Configurações de estoque"
            description="Mínimo, máximo, alertas, reserva, localização, lote."
            onClick={() => onNavigate('/sistema/estoque-config')}
          />
          <ConfigCard
            icon={<DollarSign className="w-5 h-5 text-[#38a169]" />}
            title="Configurações de vendas"
            description="Status, cancelamentos, devoluções, baixa automática."
            onClick={() => onNavigate('/sistema/vendas-config')}
          />
          <ConfigCard
            icon={<TrendingUp className="w-5 h-5 text-[#6c5ce7]" />}
            title="Precificação"
            description="Margem, markup, custos, taxas, simulador."
            onClick={() => onNavigate('/sistema/precificacao-config')}
          />
          <ConfigCard
            icon={<Wallet className="w-5 h-5 text-[#e67e22]" />}
            title="Financeiro"
            description="Moeda, impostos, categorias, contas, pagamentos."
            onClick={() => onNavigate('/sistema/financeiro-config')}
          />
        </div>
      </div>

      <div>
        <h3 className="text-[13px] font-semibold text-[#333] mb-3">Dados</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <ConfigCard
            icon={<Upload className="w-5 h-5 text-[#3483fa]" />}
            title="Importar / Exportar"
            description="Produtos, estoque, vendas, pedidos em XLSX e CSV."
            onClick={() => onNavigate('/sistema/import-export')}
          />
          <ConfigCard
            icon={<Database className="w-5 h-5 text-[#999]" />}
            title="Backup e dados"
            description="Backup automático via Supabase, logs, permissões."
            onClick={() => onNavigate('/sistema/backup')}
          />
          <ConfigCard
            icon={<FileText className="w-5 h-5 text-[#666]" />}
            title="Auditoria"
            description="Log de todas as alterações: usuário, ação, data, IP."
            onClick={() => onNavigate('/sistema/auditoria')}
          />
        </div>
      </div>
    </div>
  )
}

export default function SistemaPage() {
  const router = useRouter()

  function navigate(path: string) {
    router.push(path)
  }

  return (
    <div className="mp-stack">
      <PageHeader
        title="Configurações"
        description="Gerencie sua conta, empresa, integrações e operação"
      />
      <Tabs defaultValue="conta">
        <TabsList>
          <TabsTrigger value="conta"><User className="w-3.5 h-3.5 mr-1 inline" /> Conta</TabsTrigger>
          <TabsTrigger value="negocio"><Building2 className="w-3.5 h-3.5 mr-1 inline" /> Negócio</TabsTrigger>
        </TabsList>
        <TabsContent value="conta"><ContaTab onNavigate={navigate} /></TabsContent>
        <TabsContent value="negocio"><NegocioTab onNavigate={navigate} /></TabsContent>
      </Tabs>
    </div>
  )
}
