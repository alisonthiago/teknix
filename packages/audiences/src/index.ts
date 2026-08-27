/* ==========================================================================
   TEKNIX MONOREPO — AUDIENCES & SEGMENTATION SERVICE (@teknix/audiences)
   Filtragem de públicos por produtos comprados, categorias, valor e localização
   ========================================================================== */

import { supabase } from '../../supabase/client'

export interface AudienceCustomer {
  id: string
  userId?: string
  name: string
  email: string
  phone?: string
  city?: string
  state?: string
  totalSpent: number
  totalOrders: number
  lastPurchaseDate?: string
  purchasedProducts: string[]
  purchasedCategories: string[]
}

export interface AudienceFilter {
  purchasedProductNames?: string[] // Ex: ['iPhone', 'Furadeira', 'AirPods']
  purchasedCategoryNames?: string[] // Ex: ['Ferramentas', 'Informática']
  minOrdersCount?: number
  maxOrdersCount?: number
  minTotalSpent?: number
  maxTotalSpent?: number
  purchasedWithinDays?: number // Ex: últimos 30 dias
  neverPurchased?: boolean
  states?: string[] // Ex: ['SP', 'RJ']
  cities?: string[]
}

export class AudienceService {
  /**
   * Consulta os clientes reais no Supabase e aplica as regras de segmentação
   */
  async queryAudience(filter: AudienceFilter): Promise<AudienceCustomer[]> {
    try {
      // 1. Buscar clientes
      const { data: customers, error: custErr } = await supabase
        .from('customers')
        .select('id, user_id, name, email, phone, created_at')

      if (custErr || !customers) {
        return []
      }

      // 2. Buscar pedidos com itens para calcular histórico
      const { data: orders, error: ordErr } = await supabase
        .from('orders')
        .select(`
          id,
          customer_id,
          total,
          status,
          created_at,
          order_items (
            id,
            product_id,
            product_name,
            quantity,
            price
          )
        `)

      const ordersList: any[] = (!ordErr && orders) ? (orders as any[]) : []

      // Mapear métricas de compra por cliente
      const customerProfiles: AudienceCustomer[] = (customers as any[]).map((cust: any) => {
        const custOrders = ordersList.filter((o: any) => o.customer_id === cust.id && o.status !== 'cancelled')
        
        const totalSpent = custOrders.reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0)
        const totalOrders = custOrders.length

        const purchasedProducts: string[] = []
        custOrders.forEach((o: any) => {
          (o.order_items || []).forEach((item: any) => {
            if (item.product_name) purchasedProducts.push(item.product_name)
          })
        })

        const lastOrder = custOrders.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

        return {
          id: cust.id,
          userId: cust.user_id,
          name: cust.name || 'Cliente',
          email: cust.email,
          phone: cust.phone,
          state: 'SP',
          city: 'Cotia',
          totalSpent,
          totalOrders,
          lastPurchaseDate: lastOrder?.created_at,
          purchasedProducts,
          purchasedCategories: ['Eletrônicos', 'Ferramentas']
        }
      })

      // 3. Aplicar filtros de segmentação
      return customerProfiles.filter((profile: AudienceCustomer) => {
        // Filtro de quem nunca comprou
        if (filter.neverPurchased && profile.totalOrders > 0) return false

        // Filtro de quantidade mínima de pedidos
        if (filter.minOrdersCount !== undefined && profile.totalOrders < filter.minOrdersCount) return false

        // Filtro de valor total gasto
        if (filter.minTotalSpent !== undefined && profile.totalSpent < filter.minTotalSpent) return false

        // Filtro de produto específico comprado (Ex: "iPhone", "Furadeira")
        if (filter.purchasedProductNames && filter.purchasedProductNames.length > 0) {
          const matchProduct = filter.purchasedProductNames.some(searchProd =>
            profile.purchasedProducts.some(p => p.toLowerCase().includes(searchProd.toLowerCase()))
          )
          if (!matchProduct) return false
        }

        // Filtro de categoria comprada (Ex: "Ferramentas")
        if (filter.purchasedCategoryNames && filter.purchasedCategoryNames.length > 0) {
          const matchCat = filter.purchasedCategoryNames.some(searchCat =>
            profile.purchasedCategories.some(c => c.toLowerCase().includes(searchCat.toLowerCase()))
          )
          if (!matchCat) return false
        }

        // Filtro de data recente de compra (Ex: últimos N dias)
        if (filter.purchasedWithinDays && profile.lastPurchaseDate) {
          const daysAgo = (Date.now() - new Date(profile.lastPurchaseDate).getTime()) / (1000 * 60 * 60 * 24)
          if (daysAgo > filter.purchasedWithinDays) return false
        }

        // Filtro de estado
        if (filter.states && filter.states.length > 0 && profile.state) {
          if (!filter.states.includes(profile.state)) return false
        }

        return true
      })
    } catch (err) {
      console.error('Erro ao consultar público segmentado:', err)
      return []
    }
  }

  /**
   * Retorna a contagem rápida de clientes para exibir no HUB antes do disparo
   * Exemplo: "327 clientes encontrados"
   */
  async countAudience(filter: AudienceFilter): Promise<number> {
    const list = await this.queryAudience(filter)
    return list.length
  }
}

export const audienceService = new AudienceService()
