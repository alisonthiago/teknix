import { createAdminClient } from '@/utils/supabase/admin'

export type FlowStockMovement = 'PURCHASE' | 'SALE' | 'RESERVATION' | 'RELEASE' | 'ADJUSTMENT'

export async function applyFlowStockMovement(input: {
  productId: string
  kind: FlowStockMovement
  quantity: number
  referenceType?: string
  referenceId?: string
}) {
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    throw new Error('Stock quantity must be a positive integer')
  }
  const { data, error } = await createAdminClient().rpc('flow_apply_stock_movement', {
    p_product_id: input.productId,
    p_kind: input.kind,
    p_quantity: input.quantity,
    p_reference_type: input.referenceType ?? null,
    p_reference_id: input.referenceId ?? null,
  })
  if (error) throw error
  return data
}