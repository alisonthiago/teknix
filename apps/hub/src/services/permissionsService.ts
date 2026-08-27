import { supabase } from '../lib/supabase'

export interface PermissionItem {
  code: string
  module: string
  moduleName: string
  action: 'view' | 'create' | 'edit' | 'delete' | 'publish' | 'manage' | 'export' | 'upload' | 'sync'
  actionLabel: string
  label: string
  description: string
  route?: string
}

export interface CollaboratorProfile {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'EDITOR' | 'SALES' | 'STOCK' | 'CUSTOM'
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  is_master?: boolean
  photo_url?: string
  created_at?: string
}

export interface UserPermissionRecord {
  user_id: string
  permission_code: string
  granted: boolean
}

// ─── DEFINIÇÃO DE TODOS OS MÓDULOS E PERMISSÕES DO HUB ────────────────────
export const HUB_PERMISSIONS_CATALOG: PermissionItem[] = [
  // 1. Painel / Dashboard
  { code: 'dashboard.view', module: 'dashboard', moduleName: 'Painel Principal', action: 'view', actionLabel: 'Visualizar', label: 'Acessar Painel', description: 'Permite acessar e visualizar o painel inicial.', route: '/hub' },
  { code: 'dashboard.financial_view', module: 'dashboard', moduleName: 'Painel Principal', action: 'view', actionLabel: 'Métricas Financeiras', label: 'Ver Faturamento', description: 'Visualizar cards de faturamento e lucro no painel.' },

  // 2. Estatísticas
  { code: 'stats.view', module: 'stats', moduleName: 'Estatísticas', action: 'view', actionLabel: 'Visualizar', label: 'Ver Estatísticas', description: 'Visualizar gráficos e relatórios de desempenho.', route: '/hub/estatisticas' },
  { code: 'stats.export', module: 'stats', moduleName: 'Estatísticas', action: 'export', actionLabel: 'Exportar', label: 'Exportar Relatórios', description: 'Exportar dados de métricas e vendas em CSV/Excel.' },

  // 3. Produtos
  { code: 'products.view', module: 'products', moduleName: 'Produtos', action: 'view', actionLabel: 'Visualizar', label: 'Ver Catálogo', description: 'Visualizar a lista de produtos cadastrados.', route: '/hub/produtos' },
  { code: 'products.create', module: 'products', moduleName: 'Produtos', action: 'create', actionLabel: 'Criar', label: 'Criar Produtos', description: 'Cadastrar novos produtos e variações.' },
  { code: 'products.edit', module: 'products', moduleName: 'Produtos', action: 'edit', actionLabel: 'Editar', label: 'Editar Produtos', description: 'Alterar preços, descrição, estoque e fotos.' },
  { code: 'products.delete', module: 'products', moduleName: 'Produtos', action: 'delete', actionLabel: 'Excluir', label: 'Excluir Produtos', description: 'Remover produtos do catálogo da loja.' },

  // 4. Categorias
  { code: 'categories.view', module: 'categories', moduleName: 'Categorias', action: 'view', actionLabel: 'Visualizar', label: 'Ver Categorias', description: 'Visualizar árvore de categorias e segmentos.', route: '/hub/categorias' },
  { code: 'categories.create', module: 'categories', moduleName: 'Categorias', action: 'create', actionLabel: 'Criar', label: 'Criar Categorias', description: 'Adicionar novas categorias e subcategorias.' },
  { code: 'categories.edit', module: 'categories', moduleName: 'Categorias', action: 'edit', actionLabel: 'Editar', label: 'Editar Categorias', description: 'Editar nomes, posições e status das categorias.' },
  { code: 'categories.delete', module: 'categories', moduleName: 'Categorias', action: 'delete', actionLabel: 'Excluir', label: 'Excluir Categorias', description: 'Excluir categorias existentes.' },

  // 5. Pedidos
  { code: 'orders.view', module: 'orders', moduleName: 'Pedidos', action: 'view', actionLabel: 'Visualizar', label: 'Ver Pedidos', description: 'Visualizar listagem de pedidos e status.', route: '/hub/pedidos' },
  { code: 'orders.edit', module: 'orders', moduleName: 'Pedidos', action: 'edit', actionLabel: 'Editar', label: 'Atualizar Pedidos', description: 'Modificar status, rastreamento e notas de pedidos.' },
  { code: 'orders.delete', module: 'orders', moduleName: 'Pedidos', action: 'delete', actionLabel: 'Excluir', label: 'Cancelar Pedidos', description: 'Cancelar ou excluir pedidos.' },
  { code: 'orders.export', module: 'orders', moduleName: 'Pedidos', action: 'export', actionLabel: 'Exportar', label: 'Exportar Pedidos', description: 'Exportar lista de vendas e pedidos.' },

  // 6. Clientes
  { code: 'customers.view', module: 'customers', moduleName: 'Clientes', action: 'view', actionLabel: 'Visualizar', label: 'Ver Clientes', description: 'Visualizar cadastros e histórico de clientes.', route: '/hub/clientes' },
  { code: 'customers.edit', module: 'customers', moduleName: 'Clientes', action: 'edit', actionLabel: 'Editar', label: 'Editar Clientes', description: 'Atualizar endereços e dados cadastrais de clientes.' },
  { code: 'customers.delete', module: 'customers', moduleName: 'Clientes', action: 'delete', actionLabel: 'Excluir', label: 'Excluir Clientes', description: 'Remover cadastro de clientes.' },
  { code: 'customers.export', module: 'customers', moduleName: 'Clientes', action: 'export', actionLabel: 'Exportar', label: 'Exportar Base', description: 'Exportar listagem de clientes cadastrados.' },

  // 7. Financeiro
  { code: 'finance.view', module: 'finance', moduleName: 'Financeiro', action: 'view', actionLabel: 'Visualizar', label: 'Ver Financeiro', description: 'Visualizar saldos, entradas e saídas.', route: '/hub/financeiro' },
  { code: 'finance.manage', module: 'finance', moduleName: 'Financeiro', action: 'manage', actionLabel: 'Gerenciar', label: 'Gerenciar Finanças', description: 'Configurar contas, repasses e conciliação bancária.' },

  // 8. Mercado Pago
  { code: 'mercado_pago.view', module: 'mercado_pago', moduleName: 'Mercado Pago', action: 'view', actionLabel: 'Visualizar', label: 'Ver Mercado Pago', description: 'Visualizar status e credenciais ativas.', route: '/hub/mercado-pago' },
  { code: 'mercado_pago.manage', module: 'mercado_pago', moduleName: 'Mercado Pago', action: 'manage', actionLabel: 'Gerenciar', label: 'Configurar Pagamentos', description: 'Alterar chaves de API, parcelamento e taxas.' },

  // 9. Integrações & Marketplaces
  { code: 'integrations.view', module: 'integrations', moduleName: 'Integrações', action: 'view', actionLabel: 'Visualizar', label: 'Ver Integrações', description: 'Visualizar canais conectados (Mercado Livre, Shopee, etc.).', route: '/hub/integracoes' },
  { code: 'integrations.sync', module: 'integrations', moduleName: 'Integrações', action: 'sync', actionLabel: 'Sincronizar', label: 'Sincronizar Catálogo', description: 'Executar sincronizações manuais de estoque e preço.' },
  { code: 'integrations.manage', module: 'integrations', moduleName: 'Integrações', action: 'manage', actionLabel: 'Gerenciar', label: 'Conectar Canais', description: 'Adicionar ou desconectar contas de marketplaces.' },

  // 10. Páginas (Page Builder)
  { code: 'pages.view', module: 'pages', moduleName: 'Páginas', action: 'view', actionLabel: 'Visualizar', label: 'Ver Páginas', description: 'Visualizar a listagem de páginas da loja.', route: '/hub/paginas' },
  { code: 'pages.create', module: 'pages', moduleName: 'Páginas', action: 'create', actionLabel: 'Criar', label: 'Criar Páginas', description: 'Criar novas landing pages e páginas personalizadas.' },
  { code: 'pages.edit', module: 'pages', moduleName: 'Páginas', action: 'edit', actionLabel: 'Editar', label: 'Editar no Builder', description: 'Acessar o Page Builder para modificar blocos e layouts.' },
  { code: 'pages.delete', module: 'pages', moduleName: 'Páginas', action: 'delete', actionLabel: 'Excluir', label: 'Excluir Páginas', description: 'Remover páginas e rascunhos.' },
  { code: 'pages.publish', module: 'pages', moduleName: 'Páginas', action: 'publish', actionLabel: 'Publicar', label: 'Publicar no Site', description: 'Enviar versões editadas diretamente para o ar no SITE.' },

  // 11. Temas
  { code: 'themes.view', module: 'themes', moduleName: 'Temas', action: 'view', actionLabel: 'Visualizar', label: 'Ver Temas', description: 'Visualizar temas e paletas de cores.', route: '/hub/temas' },
  { code: 'themes.edit', module: 'themes', moduleName: 'Temas', action: 'edit', actionLabel: 'Editar', label: 'Editar Temas', description: 'Customizar tokens, tipografia e espaçamentos globais.' },
  { code: 'themes.publish', module: 'themes', moduleName: 'Temas', action: 'publish', actionLabel: 'Publicar', label: 'Ativar Tema', description: 'Definir o tema ativo na loja pública.' },

  // 12. Mídia
  { code: 'media.view', module: 'media', moduleName: 'Biblioteca de Mídia', action: 'view', actionLabel: 'Visualizar', label: 'Ver Mídia', description: 'Acessar a galeria de imagens e vídeos.', route: '/hub/media' },
  { code: 'media.upload', module: 'media', moduleName: 'Biblioteca de Mídia', action: 'upload', actionLabel: 'Upload', label: 'Enviar Arquivos', description: 'Fazer upload de novas imagens e banners.' },
  { code: 'media.delete', module: 'media', moduleName: 'Biblioteca de Mídia', action: 'delete', actionLabel: 'Excluir', label: 'Excluir Arquivos', description: 'Remover arquivos do storage.' },

  // 13. Usuários e Permissões
  { code: 'users.view', module: 'users', moduleName: 'Usuários & Permissões', action: 'view', actionLabel: 'Visualizar', label: 'Ver Colaboradores', description: 'Visualizar equipe cadastrada e perfis.', route: '/hub/usuarios' },
  { code: 'users.create', module: 'users', moduleName: 'Usuários & Permissões', action: 'create', actionLabel: 'Criar', label: 'Criar Colaboradores', description: 'Adicionar novos membros à equipe.' },
  { code: 'users.edit', module: 'users', moduleName: 'Usuários & Permissões', action: 'edit', actionLabel: 'Editar', label: 'Editar Colaboradores', description: 'Modificar dados cadastrais e cargos.' },
  { code: 'users.delete', module: 'users', moduleName: 'Usuários & Permissões', action: 'delete', actionLabel: 'Excluir', label: 'Remover Colaboradores', description: 'Desativar ou remover contas da equipe.' },
  { code: 'permissions.manage', module: 'users', moduleName: 'Usuários & Permissões', action: 'manage', actionLabel: 'Gerenciar', label: 'Configurar Permissões', description: 'Definir regras de acesso e autorizações.' },

  // 14. Configurações
  { code: 'settings.view', module: 'settings', moduleName: 'Configurações', action: 'view', actionLabel: 'Visualizar', label: 'Ver Configurações', description: 'Acessar painel de configurações gerais.', route: '/hub/configuracoes' },
  { code: 'settings.edit', module: 'settings', moduleName: 'Configurações', action: 'edit', actionLabel: 'Editar', label: 'Editar Configurações', description: 'Salvar alterações de contatos, fretes e políticas.' },
]

// ─── PRESETS DE PERFIS DE ACESSO ──────────────────────────────────────────
export const ROLE_PRESET_PERMISSIONS: Record<string, string[]> = {
  ADMIN: HUB_PERMISSIONS_CATALOG.map(p => p.code),
  MANAGER: HUB_PERMISSIONS_CATALOG
    .filter(p => !['permissions.manage', 'users.delete'].includes(p.code))
    .map(p => p.code),
  EDITOR: [
    'dashboard.view',
    'pages.view', 'pages.create', 'pages.edit', 'pages.publish',
    'themes.view', 'themes.edit', 'themes.publish',
    'media.view', 'media.upload',
    'products.view', 'products.edit'
  ],
  SALES: [
    'dashboard.view',
    'products.view', 'categories.view',
    'orders.view', 'orders.edit',
    'customers.view', 'customers.edit'
  ],
  STOCK: [
    'dashboard.view',
    'products.view', 'products.edit',
    'orders.view', 'orders.edit'
  ],
  CUSTOM: []
}

export const ROLE_LABELS: Record<string, { name: string; desc: string }> = {
  ADMIN: { name: 'Administrador', desc: 'Acesso total e irrestrito a todos os módulos e configurações do sistema.' },
  MANAGER: { name: 'Gerente', desc: 'Acesso amplo a vendas, produtos, clientes e páginas, sem gestão de outros admins.' },
  EDITOR: { name: 'Editor de Conteúdo', desc: 'Acesso ao Page Builder, criação de páginas, temas e catálogo de mídia.' },
  SALES: { name: 'Vendas & Atendimento', desc: 'Foco na gestão de pedidos, catálogo de produtos e atendimento a clientes.' },
  STOCK: { name: 'Estoquista / Operador', desc: 'Acesso focado na conferência de estoque, catálogo e separação de pedidos.' },
  CUSTOM: { name: 'Personalizado', desc: 'Permissões customizadas definidas individualmente pelo Administrador.' }
}

// ─── COLABORADORES INICIAIS (GARANTIA DE NÃO-VAZIO) ──────────────────────
export const DEFAULT_COLLABORATORS: CollaboratorProfile[] = [
  {
    id: '3af9068a-4b78-4c9c-8657-f83b93c01588',
    name: 'Alison Thiago (Admin)',
    email: 'alison@teknix.com.br',
    role: 'ADMIN',
    status: 'ACTIVE',
    is_master: true,
    photo_url: 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/3af9068a-4b78-4c9c-8657-f83b93c01588-1787179225140.jpg'
  },
  {
    id: 'c101-joao-silva',
    name: 'João Silva',
    email: 'joao.silva@teknix.com.br',
    role: 'MANAGER',
    status: 'ACTIVE',
    is_master: false
  },
  {
    id: 'c102-mariana-costa',
    name: 'Mariana Costa',
    email: 'mariana.costa@teknix.com.br',
    role: 'EDITOR',
    status: 'ACTIVE',
    is_master: false
  },
  {
    id: 'c103-carlos-oliveira',
    name: 'Carlos Oliveira',
    email: 'carlos.oliveira@teknix.com.br',
    role: 'SALES',
    status: 'ACTIVE',
    is_master: false
  }
]

// ─── SERVICE DE PERMISSÕES (SUPABASE + FALLBACK PERSISTENTE) ───────────────
export class PermissionsService {
  private static STORAGE_KEY_COLLABORATORS = 'teknix_hub_collaborators'
  private static STORAGE_KEY_PERMISSIONS = 'teknix_hub_user_permissions'

  /**
   * Carrega a lista de colaboradores reais do Supabase (ou fallback local sincronizado)
   */
  static async getCollaborators(): Promise<CollaboratorProfile[]> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role, status, is_master, photo_url, created_at')
        .order('name')

      if (!error && data && data.length > 0) {
        // Normaliza roles
        const normalized = data.map(d => ({
          ...d,
          role: (d.role?.toUpperCase() || 'CUSTOM') as any,
          status: (d.status?.toUpperCase() || 'ACTIVE') as any
        }))
        // Salva backup
        localStorage.setItem(this.STORAGE_KEY_COLLABORATORS, JSON.stringify(normalized))
        return normalized
      }
    } catch (e) {
      console.warn('[PermissionsService] Erro ao buscar profiles do Supabase:', e)
    }

    // Fallback local salvo
    const cached = localStorage.getItem(this.STORAGE_KEY_COLLABORATORS)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {}
    }

    // Default inicial
    localStorage.setItem(this.STORAGE_KEY_COLLABORATORS, JSON.stringify(DEFAULT_COLLABORATORS))
    return DEFAULT_COLLABORATORS
  }

  /**
   * Carrega as permissões individuais do colaborador
   */
  static async getUserPermissions(userId: string): Promise<Record<string, boolean>> {
    const result: Record<string, boolean> = {}

    // 1. Tenta buscar do Supabase
    try {
      const { data, error } = await supabase
        .from('user_permissions')
        .select('permission_code, granted')
        .eq('user_id', userId)

      if (!error && data && data.length > 0) {
        data.forEach(p => {
          result[p.permission_code] = p.granted
        })
        return result
      }
    } catch (e) {
      console.warn('[PermissionsService] Erro ao buscar user_permissions do Supabase:', e)
    }

    // 2. Fallback local persistente
    const cached = localStorage.getItem(`${this.STORAGE_KEY_PERMISSIONS}_${userId}`)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {}
    }

    return result
  }

  /**
   * Salva o perfil e as permissões individuais de um colaborador de forma real no Supabase
   */
  static async saveCollaboratorPermissions(
    collaborator: CollaboratorProfile,
    permissionsMap: Record<string, boolean>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Atualiza o perfil na tabela 'profiles' do Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: collaborator.id,
          name: collaborator.name,
          email: collaborator.email,
          role: collaborator.role,
          status: collaborator.status || 'ACTIVE',
          is_master: collaborator.is_master || false
        })

      if (profileError) {
        console.warn('[PermissionsService] Erro ao salvar profile no Supabase:', profileError)
      }

      // 2. Prepara os registros para a tabela 'user_permissions'
      const rows = Object.entries(permissionsMap).map(([permission_code, granted]) => ({
        user_id: collaborator.id,
        permission_code,
        granted
      }))

      if (rows.length > 0) {
        const { error: permsError } = await supabase
          .from('user_permissions')
          .upsert(rows, { onConflict: 'user_id,permission_code' })

        if (permsError) {
          console.warn('[PermissionsService] Erro ao upsert em user_permissions:', permsError)
        }
      }

      // 3. Atualiza cache local garantindo sincronização instantânea
      const collaborators = await this.getCollaborators()
      const updated = collaborators.map(c => (c.id === collaborator.id ? collaborator : c))
      localStorage.setItem(this.STORAGE_KEY_COLLABORATORS, JSON.stringify(updated))
      localStorage.setItem(`${this.STORAGE_KEY_PERMISSIONS}_${collaborator.id}`, JSON.stringify(permissionsMap))

      // 4. Dispara evento de sincronização global
      window.dispatchEvent(new CustomEvent('permissions_updated', {
        detail: { userId: collaborator.id, role: collaborator.role, permissions: permissionsMap }
      }))

      return { success: true }
    } catch (err: any) {
      return { success: false, error: err.message || 'Erro ao persistir permissões' }
    }
  }

  /**
   * Cadastra um novo colaborador no sistema
   */
  static async createCollaborator(data: {
    name: string
    email: string
    role: CollaboratorProfile['role']
    status?: CollaboratorProfile['status']
  }): Promise<{ success: boolean; collaborator?: CollaboratorProfile; error?: string }> {
    const newId = `colab_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
    const newColab: CollaboratorProfile = {
      id: newId,
      name: data.name,
      email: data.email,
      role: data.role,
      status: data.status || 'ACTIVE',
      is_master: false,
      created_at: new Date().toISOString()
    }

    // Calcula permissões padrão do perfil selecionado
    const defaultPerms: Record<string, boolean> = {}
    const activeCodes = ROLE_PRESET_PERMISSIONS[data.role] || []
    HUB_PERMISSIONS_CATALOG.forEach(p => {
      defaultPerms[p.code] = activeCodes.includes(p.code)
    })

    const res = await this.saveCollaboratorPermissions(newColab, defaultPerms)
    if (!res.success) {
      return { success: false, error: res.error }
    }

    return { success: true, collaborator: newColab }
  }

  /**
   * Remove ou desativa um colaborador
   */
  static async deleteCollaborator(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      await supabase.from('profiles').delete().eq('id', id)
      await supabase.from('user_permissions').delete().eq('user_id', id)

      const collaborators = await this.getCollaborators()
      const filtered = collaborators.filter(c => c.id !== id)
      localStorage.setItem(this.STORAGE_KEY_COLLABORATORS, JSON.stringify(filtered))
      localStorage.removeItem(`${this.STORAGE_KEY_PERMISSIONS}_${id}`)

      window.dispatchEvent(new CustomEvent('permissions_updated', { detail: { userId: id } }))
      return { success: true }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}
