import { createClient } from '@/utils/supabase/server'

export { createClient }

// ============================================================
// PRODUCTS
// ============================================================
export async function getProducts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, suppliers(name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getProduct(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('products')
    .select('*, suppliers(*), marketplace_listings(*, marketplaces(name, code, logo))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createProduct(product: Record<string, unknown>) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('products').insert(product).select().single()
  if (error) throw error
  return data
}

export async function updateProduct(id: string, updates: Record<string, unknown>) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

export async function deleteProduct(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

// ============================================================
// SUPPLIERS
// ============================================================
export async function getSuppliers() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getSupplier(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createSupplier(supplier: Record<string, unknown>) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('suppliers').insert(supplier).select().single()
  if (error) throw error
  return data
}

export async function updateSupplier(id: string, updates: Record<string, unknown>) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('suppliers').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ============================================================
// PURCHASES
// ============================================================
export async function getPurchases() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('purchases')
    .select('*, suppliers(name), purchase_items(*, products(name, sku))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function createPurchase(purchase: Record<string, unknown>) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('purchases').insert(purchase).select().single()
  if (error) throw error
  return data
}

// ============================================================
// ORDERS
// ============================================================
export async function getOrders() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, marketplaces(name, code, logo), order_items(*, products(name, sku))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getOrder(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .select('*, marketplaces(*), order_items(*, products(*)), order_status_history(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createOrder(order: Record<string, unknown>) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('orders').insert(order).select().single()
  if (error) throw error
  return data
}

export async function updateOrderStatus(id: string, status: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ============================================================
// SALES
// ============================================================
export async function getSales() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sales')
    .select('*, marketplaces(name, code, logo), sale_items(*, products(name, sku))')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getSale(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('sales')
    .select('*, marketplaces(*), sale_items(*, products(*))')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ============================================================
// MARKETPLACES
// ============================================================
export async function getMarketplaces() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('marketplaces')
    .select('*')
    .order('name')
  if (error) throw error
  return data
}

// ============================================================
// PROFILES / USERS
// ============================================================
export async function getProfile(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getProfiles() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data
}

export async function updateProfile(id: string, updates: Record<string, unknown>) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').update(updates).eq('id', id).select().single()
  if (error) throw error
  return data
}

// ============================================================
// PERMISSIONS
// ============================================================
export async function getPermissions() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('permissions').select('*').order('module')
  if (error) throw error
  return data
}

export async function getRolePermissions() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('role_permissions').select('*')
  if (error) throw error
  return data
}

export async function getUserPermissionsForUser(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_permissions')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

export async function upsertUserPermission(userId: string, permissionCode: string, granted: boolean) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_permissions')
    .upsert({ user_id: userId, permission_code: permissionCode, granted }, { onConflict: 'user_id,permission_code' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ============================================================
// NOTIFICATIONS
// ============================================================
export async function getNotifications(userId?: string) {
  const supabase = await createClient()
  let query = supabase.from('notifications').select('*').order('created_at', { ascending: false })
  if (userId) query = query.eq('user_id', userId)
  const { data, error } = await query.limit(50)
  if (error) throw error
  return data
}

// ============================================================
// AUDIT LOGS
// ============================================================
export async function getAuditLogs() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data
}

// ============================================================
// INVENTORY MOVEMENTS
// ============================================================
export async function getInventoryMovements(productId?: string) {
  const supabase = await createClient()
  let query = supabase
    .from('inventory_movements')
    .select('*, products(name, sku)')
    .order('created_at', { ascending: false })
  if (productId) query = query.eq('product_id', productId)
  const { data, error } = await query.limit(100)
  if (error) throw error
  return data
}

// ============================================================
// SHIPMENTS
// ============================================================
export async function getShipments() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('shipments')
    .select('*, orders(order_number, customer_name)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

// ============================================================
// MARKETPLACE CONNECTIONS
// ============================================================
export async function getMarketplaceConnections(userId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('marketplace_connections')
    .select('*')
    .eq('user_id', userId)
  if (error) throw error
  return data
}

// ============================================================
// DASHBOARD STATS (aggregated)
// ============================================================
export async function getDashboardStats() {
  const supabase = await createClient()

  const [products, sales, orders, purchases] = await Promise.all([
    supabase.from('products').select('id, stock, min_stock, cost_purchase, status'),
    supabase.from('sales').select('total_revenue, status'),
    supabase.from('orders').select('status, total_amount'),
    supabase.from('purchases').select('total_cost'),
  ])

  const activeProducts = products.data?.filter(p => p.status === 'ACTIVE').length ?? 0
  const lowStock = products.data?.filter(p => p.status === 'ACTIVE' && p.stock <= p.min_stock).length ?? 0
  const outOfStock = products.data?.filter(p => p.stock === 0).length ?? 0
  const totalRevenue = sales.data?.reduce((sum, s) => sum + (Number(s.total_revenue) || 0), 0) ?? 0
  const totalOrders = orders.data?.length ?? 0
  const totalPurchases = purchases.data?.reduce((sum, p) => sum + (Number(p.total_cost) || 0), 0) ?? 0

  return {
    activeProducts,
    lowStock,
    outOfStock,
    totalRevenue,
    totalOrders,
    totalPurchases,
  }
}
