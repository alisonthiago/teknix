/* ==========================================================================
   TEKNIX MONOREPO — CENTRAL PERMISSIONS, RBAC & AUDIT (@teknix/permissions)
   Controle de acesso granular por recurso, ação e campo + Auditoria
   ========================================================================== */

export type UserRole =
  | 'MASTER'
  | 'ADMIN'
  | 'MANAGER'
  | 'STAFF'
  | 'OPERATOR'
  | 'SELLER'
  | 'CUSTOMER'

export type ProjectScope = 'site' | 'flow' | 'hub'

export type ResourceAction = 'view' | 'create' | 'edit' | 'delete' | 'execute'

export type GranularPermission =
  // Clientes
  | 'customers.view'
  | 'customers.create'
  | 'customers.edit'
  | 'customers.block'
  | 'customers.delete'
  | 'customers.export'
  | 'customers.sensitive.view'
  // Produtos
  | 'products.view'
  | 'products.create'
  | 'products.edit'
  | 'products.price.update'
  | 'products.cost.view'
  | 'products.margin.view'
  | 'products.profit.view'
  | 'products.delete'
  | 'products.publish'
  // Estoque
  | 'inventory.view'
  | 'inventory.adjust'
  | 'inventory.transfer'
  | 'inventory.cost.view'
  // Pedidos
  | 'orders.view'
  | 'orders.create'
  | 'orders.edit'
  | 'orders.cancel'
  | 'orders.refund'
  // Pagamentos
  | 'payments.view'
  | 'payments.link.create'
  | 'payments.update_method'
  | 'payments.refund'
  // Comunicação & Marketing
  | 'communications.view'
  | 'communications.campaign.create'
  | 'communications.campaign.send'
  | 'communications.templates.edit'
  // Colaboradores & Permissões
  | 'staff.view'
  | 'staff.create'
  | 'staff.edit'
  | 'staff.permissions.update'
  | 'staff.block'

export interface AuditLogEntry {
  id: string
  userId: string
  userName: string
  project: ProjectScope
  action: string
  resource: string
  entityId: string
  entityName?: string
  changes?: {
    field: string
    before: any
    after: any
  }[]
  ipAddress?: string
  timestamp: string
}

export const ROLE_PERMISSIONS_MAP: Record<UserRole, GranularPermission[]> = {
  MASTER: [
    'customers.view', 'customers.create', 'customers.edit', 'customers.block', 'customers.delete', 'customers.export', 'customers.sensitive.view',
    'products.view', 'products.create', 'products.edit', 'products.price.update', 'products.cost.view', 'products.margin.view', 'products.profit.view', 'products.delete', 'products.publish',
    'inventory.view', 'inventory.adjust', 'inventory.transfer', 'inventory.cost.view',
    'orders.view', 'orders.create', 'orders.edit', 'orders.cancel', 'orders.refund',
    'payments.view', 'payments.link.create', 'payments.update_method', 'payments.refund',
    'communications.view', 'communications.campaign.create', 'communications.campaign.send', 'communications.templates.edit',
    'staff.view', 'staff.create', 'staff.edit', 'staff.permissions.update', 'staff.block'
  ],
  ADMIN: [
    'customers.view', 'customers.create', 'customers.edit', 'customers.block', 'customers.export',
    'products.view', 'products.create', 'products.edit', 'products.price.update', 'products.cost.view', 'products.margin.view', 'products.publish',
    'inventory.view', 'inventory.adjust', 'inventory.transfer',
    'orders.view', 'orders.create', 'orders.edit', 'orders.cancel', 'orders.refund',
    'payments.view', 'payments.link.create', 'payments.update_method',
    'communications.view', 'communications.campaign.create', 'communications.campaign.send',
    'staff.view', 'staff.create', 'staff.edit'
  ],
  MANAGER: [
    'customers.view', 'customers.create', 'customers.edit',
    'products.view', 'products.create', 'products.edit', 'products.price.update',
    'inventory.view', 'inventory.adjust',
    'orders.view', 'orders.create', 'orders.edit',
    'payments.view', 'payments.link.create',
    'communications.view'
  ],
  STAFF: [
    'customers.view',
    'products.view',
    'inventory.view',
    'orders.view', 'orders.create',
    'payments.view', 'payments.link.create'
  ],
  OPERATOR: [
    'products.view',
    'inventory.view', 'inventory.adjust',
    'orders.view', 'orders.edit'
  ],
  SELLER: [
    'products.view',
    'orders.view'
  ],
  CUSTOMER: [
    'products.view'
  ]
}

export function hasPermission(userRole: UserRole, permission: GranularPermission, customPermissions?: GranularPermission[]): boolean {
  if (userRole === 'MASTER') return true
  if (customPermissions && customPermissions.includes(permission)) return true
  const rolePerms = ROLE_PERMISSIONS_MAP[userRole] || []
  return rolePerms.includes(permission)
}

/**
 * Oculta campos confidenciais de produtos (custo, margem, lucro) se o usuário não possuir permissão
 */
export function sanitizeProductData(product: Record<string, any>, userRole: UserRole, customPermissions?: GranularPermission[]): Record<string, any> {
  const sanitized = { ...product }

  if (!hasPermission(userRole, 'products.cost.view', customPermissions)) {
    delete sanitized.cost
    delete sanitized.cost_price
    delete sanitized.custo
  }

  if (!hasPermission(userRole, 'products.margin.view', customPermissions)) {
    delete sanitized.margin
    delete sanitized.margem
  }

  if (!hasPermission(userRole, 'products.profit.view', customPermissions)) {
    delete sanitized.profit
    delete sanitized.lucro
  }

  return sanitized
}

// In-Memory & Central Audit Log Store
const auditLogs: AuditLogEntry[] = []

export function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
  const fullEntry: AuditLogEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString()
  }
  auditLogs.unshift(fullEntry)
  return fullEntry
}

export function getAuditLogs(filter?: { resource?: string; entityId?: string; userId?: string }): AuditLogEntry[] {
  return auditLogs.filter(log => {
    if (filter?.resource && log.resource !== filter.resource) return false
    if (filter?.entityId && log.entityId !== filter.entityId) return false
    if (filter?.userId && log.userId !== filter.userId) return false
    return true
  })
}
