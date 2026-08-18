import { createClient } from '@/utils/supabase/server'

export type PermissionCode = string

export interface UserPermissions {
  role: string
  permissions: Set<string>
}

// All known permissions — used as fallback when RBAC tables don't exist yet
const ALL_PERMISSIONS = [
  'products.view', 'products.create', 'products.edit', 'products.delete',
  'sales.view', 'sales.create', 'sales.edit', 'sales.delete',
  'orders.view', 'orders.manage', 'orders.financial_view',
  'picking.view', 'picking.execute',
  'shipping.view', 'shipping.execute', 'shipping.print_label',
  'inventory.view', 'inventory.create', 'inventory.adjust', 'inventory.cost_view',
  'finance.view', 'revenue.view', 'cost.view', 'profit.view', 'margin.view',
  'reports.view', 'reports.export', 'reports.sales', 'reports.inventory',
  'marketplaces.view', 'marketplaces.manage', 'marketplaces.connect', 'marketplaces.sync',
  'settings.view', 'settings.manage',
  'users.view', 'users.create', 'users.edit', 'users.delete', 'permissions.manage',
  'imports.use', 'exports.use', 'exports.financial',
  'notifications.view',
  'pricing.view',
]

/**
 * Get the effective permissions for a user.
 * Resolves role defaults + user-specific overrides.
 */
export async function getUserPermissions(): Promise<UserPermissions | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single()

  if (!profile || profile.status !== 'ACTIVE') return null

  const role = profile.role as string

  // If ADMIN, grant everything
  if (role === 'ADMIN') {
    const { data: allPerms, error } = await supabase.from('permissions').select('code')
    if (allPerms && allPerms.length > 0) {
      return { role, permissions: new Set(allPerms.map(p => p.code)) }
    }
    // RBAC tables not yet created — grant all known permissions
    return { role, permissions: new Set(ALL_PERMISSIONS) }
  }

  // Get role defaults (gracefully handle missing RBAC tables)
  const { data: rolePerms } = await supabase
    .from('role_permissions')
    .select('permission_code')
    .eq('role', role)

  const { data: userPerms } = await supabase
    .from('user_permissions')
    .select('permission_code, granted')
    .eq('user_id', user.id)

  const perms = new Set(rolePerms?.map(rp => rp.permission_code) || [])

  if (userPerms) {
    for (const up of userPerms) {
      if (up.granted) {
        perms.add(up.permission_code)
      } else {
        perms.delete(up.permission_code)
      }
    }
  }

  return { role, permissions: perms }
}

/**
 * Check if the current user has a specific permission.
 */
export async function hasPermission(permissionCode: PermissionCode): Promise<boolean> {
  const userPerms = await getUserPermissions()
  if (!userPerms) return false
  return userPerms.permissions.has(permissionCode)
}

/**
 * Check if user has ANY of the given permissions.
 */
export async function hasAnyPermission(codes: PermissionCode[]): Promise<boolean> {
  const userPerms = await getUserPermissions()
  if (!userPerms) return false
  return codes.some(c => userPerms.permissions.has(c))
}

/**
 * Check if user has ALL of the given permissions.
 */
export async function hasAllPermissions(codes: PermissionCode[]): Promise<boolean> {
  const userPerms = await getUserPermissions()
  if (!userPerms) return false
  return codes.every(c => userPerms.permissions.has(c))
}

/**
 * Get permissions as an array (for passing to client components).
 */
export async function getUserPermissionsArray(): Promise<string[]> {
  const userPerms = await getUserPermissions()
  if (!userPerms) return []
  return Array.from(userPerms.permissions)
}

/**
 * Require a permission or redirect to access denied.
 */
export async function requirePermission(permissionCode: PermissionCode): Promise<void> {
  const has = await hasPermission(permissionCode)
  if (!has) {
    const { redirect } = await import('next/navigation')
    redirect('/access-denied')
  }
}

/**
 * Filter financial data fields based on user permissions.
 * Returns only the fields the user is allowed to see.
 */
export function filterFinancialFields<T extends Record<string, unknown>>(
  data: T,
  userPerms: UserPermissions
): Partial<T> {
  const result: Record<string, unknown> = { ...data }

  const hiddenFields: string[] = []

  if (!userPerms.permissions.has('cost.view')) {
    hiddenFields.push('cost_price', 'cost_purchase', 'total_cost', 'unit_cost', 'cogs', 'real_unit_cost', 'freight_purchase', 'packaging_cost', 'other_costs')
  }
  if (!userPerms.permissions.has('profit.view')) {
    hiddenFields.push('profit')
  }
  if (!userPerms.permissions.has('margin.view')) {
    hiddenFields.push('margin')
  }
  if (!userPerms.permissions.has('revenue.view')) {
    hiddenFields.push('total_revenue', 'revenue')
  }
  if (!userPerms.permissions.has('finance.view')) {
    hiddenFields.push('fees', 'taxes', 'other_fees', 'total_cost', 'total_revenue')
  }

  for (const field of hiddenFields) {
    delete result[field]
  }

  return result as Partial<T>
}
