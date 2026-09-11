import { supabase } from '../../lib/supabase'

export interface FiscalValidationResult {
  valid: boolean
  missingFields: string[]
}

export interface StoreInvoice {
  id: string
  order_id: string | null
  order_number: string | null
  customer_id: string | null
  customer_name: string | null
  customer_document: string | null
  reference: string
  numero: string | null
  serie: string | null
  chave: string | null
  protocolo: string | null
  status: string
  ambiente: string
  valor: number
  xml_url: string | null
  danfe_url: string | null
  rejection_code: string | null
  rejection_message: string | null
  cancellation_reason: string | null
  issued_at: string | null
  cancelled_at: string | null
  raw_payload?: any
  created_at: string
  updated_at: string
}

export interface StoreReceipt {
  id: string
  order_id: string
  order_number: string
  receipt_number: string
  customer_name: string | null
  customer_document: string | null
  status: string
  total: number
  payment_method: string | null
  file_url: string | null
  generated_by: string
  notes?: string | null
  generated_at: string
  created_at: string
}

export interface FiscalAuditEvent {
  id: string
  order_id: string | null
  invoice_id: string | null
  action: string
  actor: string
  details: any
  created_at: string
}

export class FiscalService {
  /**
   * Valida se o pedido possui todos os campos fiscais obrigatórios para emissão de NF-e.
   * Não inventa dados; se faltar algo, acusa imediatamente.
   */
  static validateOrder(order: any): FiscalValidationResult {
    const missing: string[] = []

    if (!order) {
      return { valid: false, missingFields: ['Pedido inexistente'] }
    }

    // Cliente
    const name = order.customer_name?.trim()
    if (!name) missing.push('Nome do cliente')

    const rawDoc = String(order.customer_document || '').replace(/\D/g, '')
    if (!rawDoc || (rawDoc.length !== 11 && rawDoc.length !== 14)) {
      missing.push('CPF (11 dígitos) ou CNPJ (14 dígitos) do cliente')
    }

    // Endereço
    const addr = order.delivery_address || ''
    if (!addr) {
      missing.push('Endereço de entrega completo')
    } else {
      let parsed: any = null
      try {
        parsed = JSON.parse(addr)
      } catch {}

      if (parsed && typeof parsed === 'object') {
        if (!parsed.street && !parsed.logradouro) missing.push('Logradouro')
        if (!parsed.city && !parsed.municipio && !parsed.cidade) missing.push('Cidade/Município')
        if (!parsed.state && !parsed.uf) missing.push('Estado (UF)')
        const cepDigits = String(parsed.zipCode || parsed.cep || '').replace(/\D/g, '')
        if (!cepDigits || cepDigits.length !== 8) missing.push('CEP válido (8 dígitos)')
      } else {
        const rawCep = addr.replace(/\D/g, '')
        if (!rawCep || rawCep.length < 8) missing.push('CEP no endereço')
      }
    }

    // Itens
    const items = order.items || []
    if (items.length === 0) {
      missing.push('Pelo menos 1 item com valor e quantidade no pedido')
    }

    items.forEach((it: any, idx: number) => {
      const ncm = String(it.ncm || it.codigo_ncm || '').replace(/\D/g, '')
      if (!ncm || ncm.length !== 8) {
        missing.push(`Item #${idx + 1} (${it.product_name || 'Produto'}): NCM obrigatório com 8 dígitos`)
      }
      if (!it.quantity || Number(it.quantity) <= 0) {
        missing.push(`Item #${idx + 1}: Quantidade maior que zero`)
      }
      if (it.price == null || Number(it.price) < 0) {
        missing.push(`Item #${idx + 1}: Preço unitário válido`)
      }
    })

    return {
      valid: missing.length === 0,
      missingFields: missing,
    }
  }

  /**
   * Busca a nota fiscal vinculada ao pedido no banco.
   */
  static async getInvoiceByOrderId(orderId: string): Promise<StoreInvoice | null> {
    try {
      const { data, error } = await supabase
        .from('store_invoices')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error && data) return data as StoreInvoice
      return null
    } catch {
      return null
    }
  }

  /**
   * Busca o recibo vinculado ao pedido.
   */
  static async getReceiptByOrderId(orderId: string): Promise<StoreReceipt | null> {
    try {
      const { data, error } = await supabase
        .from('store_receipts')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!error && data) return data as StoreReceipt
      return null
    } catch {
      return null
    }
  }

  /**
   * Busca todos os eventos de auditoria de um pedido.
   */
  static async getAuditEvents(orderId: string): Promise<FiscalAuditEvent[]> {
    try {
      const { data, error } = await supabase
        .from('fiscal_audit_events')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })

      if (!error && data) return data as FiscalAuditEvent[]
      return []
    } catch {
      return []
    }
  }

  /**
   * Emite NF-e no servidor através da API Central TEKNIX (Focus NFe).
   */
  static async emitNfe(orderId: string, environment: 'homologacao' | 'producao' = 'homologacao'): Promise<any> {
    const apiBase = 'https://api.teknixbrasil.com.br'

    const res = await fetch(`${apiBase}/api/fiscal/emit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, environment }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.message || data.error || (data.missingFields ? `Faltam dados: ${data.missingFields.join(', ')}` : 'Erro ao emitir NF-e'))
    }
    return data
  }

  /**
   * Cancela NF-e com justificativa formal na SEFAZ via API Central.
   */
  static async cancelNfe(reference: string, justification: string): Promise<any> {
    const apiBase = 'https://api.teknixbrasil.com.br'

    const res = await fetch(`${apiBase}/api/fiscal/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reference, justification }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || data.message || 'Erro ao cancelar NF-e')
    }
    return data
  }

  /**
   * Gera e persiste um recibo comercial para o pedido.
   */
  static async generateReceipt(orderId: string): Promise<StoreReceipt> {
    const apiBase = 'https://api.teknixbrasil.com.br'

    const res = await fetch(`${apiBase}/api/fiscal/receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ orderId, generatedBy: 'admin' }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Erro ao gerar recibo')
    }
    return data.receipt
  }

  /**
   * Atualiza a preferência fiscal do pedido (none | receipt | nfe | both).
   */
  static async updateFiscalPreference(orderId: string, preference: 'none' | 'receipt' | 'nfe' | 'both'): Promise<void> {
    await supabase
      .from('store_orders')
      .update({
        fiscal_preference: preference,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
  }

  /**
   * Lista notas fiscais com filtros e busca para a tela "Notas Fiscais".
   */
  static async listInvoices(filters: {
    status?: string
    search?: string
    page?: number
    pageSize?: number
  }): Promise<{ invoices: StoreInvoice[]; total: number }> {
    try {
      let query = supabase
        .from('store_invoices')
        .select('*', { count: 'exact' })

      if (filters.status && filters.status !== 'all') {
        if (filters.status === 'pendentes') {
          query = query.in('status', ['nao_emitida', 'aguardando', 'dados_incompletos'])
        } else if (filters.status === 'processando') {
          query = query.eq('status', 'processando')
        } else if (filters.status === 'autorizadas') {
          query = query.eq('status', 'autorizada')
        } else if (filters.status === 'rejeitadas') {
          query = query.in('status', ['rejeitada', 'erro'])
        } else if (filters.status === 'canceladas') {
          query = query.eq('status', 'cancelada')
        } else {
          query = query.eq('status', filters.status)
        }
      }

      if (filters.search?.trim()) {
        const s = filters.search.trim()
        query = query.or(
          `order_number.ilike.%${s}%,reference.ilike.%${s}%,numero.ilike.%${s}%,customer_name.ilike.%${s}%,customer_document.ilike.%${s}%,chave.ilike.%${s}%`
        )
      }

      const page = filters.page || 1
      const pageSize = filters.pageSize || 20
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      return {
        invoices: (data || []) as StoreInvoice[],
        total: count || 0,
      }
    } catch (err) {
      console.warn('[FiscalService.listInvoices] Erro:', err)
      return { invoices: [], total: 0 }
    }
  }
}
