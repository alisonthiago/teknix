import { createClient } from '@supabase/supabase-js'

type VercelRequest = {
  method?: string
  headers: Record<string, string | string[] | undefined>
  body?: any
}

type VercelResponse = {
  status(code: number): VercelResponse
  json(body: unknown): VercelResponse
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Configuração do Supabase ausente')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function cleanDigits(val: unknown): string {
  return String(val || '').replace(/\D/g, '')
}

function parseAddress(addrStr: string | null | undefined): {
  logradouro?: string
  numero?: string
  complemento?: string
  bairro?: string
  municipio?: string
  uf?: string
  cep?: string
} {
  if (!addrStr) return {}
  try {
    const parsed = JSON.parse(addrStr)
    if (parsed && typeof parsed === 'object') {
      return {
        logradouro: parsed.street || parsed.logradouro || parsed.address,
        numero: parsed.number || parsed.numero || 'S/N',
        complemento: parsed.complement || parsed.complemento || '',
        bairro: parsed.neighborhood || parsed.bairro || 'Centro',
        municipio: parsed.city || parsed.municipio || parsed.cidade || 'São Paulo',
        uf: (parsed.state || parsed.uf || 'SP').toUpperCase().slice(0, 2),
        cep: cleanDigits(parsed.zipCode || parsed.cep || parsed.postalCode),
      }
    }
  } catch {}

  // Se for string corrida "Rua X, 123 - Bairro, Cidade - UF, CEP"
  const parts = addrStr.split(',').map((s) => s.trim())
  return {
    logradouro: parts[0] || addrStr,
    numero: parts[1] || 'S/N',
    bairro: parts[2] || 'Centro',
    municipio: 'São Paulo',
    uf: 'SP',
    cep: cleanDigits(addrStr),
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(200).json({})
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' })
  }

  const supabase = admin()
  const { orderId, environment: envParam, token: customToken } = req.body || {}

  if (!orderId) {
    return res.status(400).json({ error: 'ID do pedido obrigatório' })
  }

  try {
    // 1. Busca dados do pedido e itens
    const { data: order, error: orderErr } = await supabase
      .from('store_orders')
      .select('*, items:store_order_items(*)')
      .eq('id', orderId)
      .single()

    if (orderErr || !order) {
      return res.status(404).json({ error: 'Pedido não encontrado na loja' })
    }

    // 2. Busca configurações fiscais e credenciais
    const { data: fiscalSettings } = await supabase
      .from('store_fiscal_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle()

    const { data: config } = await supabase
      .from('integration_configs')
      .select('*')
      .eq('id', 'focus_nfe')
      .maybeSingle()

    const targetEnv = envParam || fiscalSettings?.ambiente_padrao || config?.environment || 'homologacao'
    const credentials = config?.credentials || {}
    
    // Tokens: prioritiza tokens específicos ou os cadastrados
    const token =
      customToken ||
      (targetEnv === 'producao'
        ? credentials.token_producao || credentials.token || process.env.FOCUS_NFE_PRODUCTION_TOKEN || 'mrEmmvhqXGLIDRxISKyxuFXZcy8vVMIn'
        : credentials.token_homologacao || credentials.token || process.env.FOCUS_NFE_HOMOLOGATION_TOKEN || '6epgnSvzZAoYAPPPKGXvJQk5sVd3gw5Z')

    const reference = `TK-${order.order_number?.replace(/\D/g, '') || order.id.slice(0, 8)}`

    // 3. Validação rigorosa dos dados fiscais
    const missingFields: string[] = []

    // Cliente / Destinatário
    const customerName = order.customer_name?.trim()
    const docClean = cleanDigits(order.customer_document)
    if (!customerName) missingFields.push('Nome / Razão Social do cliente')
    if (!docClean || (docClean.length !== 11 && docClean.length !== 14)) {
      missingFields.push('CPF (11 dígitos) ou CNPJ (14 dígitos) válido do cliente')
    }

    const addr = parseAddress(order.delivery_address)
    if (!addr.logradouro) missingFields.push('Logradouro do endereço de entrega')
    if (!addr.municipio) missingFields.push('Município do endereço de entrega')
    if (!addr.uf || addr.uf.length !== 2) missingFields.push('UF válida do endereço de entrega')
    if (!addr.cep || addr.cep.length !== 8) missingFields.push('CEP (8 dígitos) do endereço de entrega')

    // Itens
    const items = order.items || []
    if (items.length === 0) {
      missingFields.push('Itens do pedido (o pedido não possui itens)')
    }

    // Busca dados complementares dos produtos no banco (NCM, CEST, Origem)
    const productIds = items.map((it: any) => it.product_id).filter(Boolean)
    let productsMap: Record<string, any> = {}
    if (productIds.length > 0) {
      const { data: prods } = await supabase
        .from('products')
        .select('id, name, sku, ncm, cest, origin, unit, ean, barcode, specifications')
        .in('id', productIds)
      if (prods) {
        productsMap = Object.fromEntries(prods.map((p) => [p.id, p]))
      }
    }

    const validatedItems: any[] = []
    items.forEach((it: any, index: number) => {
      const prod = it.product_id ? productsMap[it.product_id] : null
      const specs = prod?.specifications || {}
      const rawNcm = cleanDigits(prod?.ncm || specs.ncm || it.ncm)

      if (!rawNcm || rawNcm.length !== 8) {
        missingFields.push(`Item #${index + 1} (${it.product_name}): NCM obrigatório com 8 dígitos`)
      }

      const rawOrigin = prod?.origin ?? specs.origin ?? '0'
      const rawUnit = prod?.unit || specs.unit || 'UN'
      const rawEan = cleanDigits(prod?.ean || prod?.barcode || specs.ean) || 'SEM GTIN'

      validatedItems.push({
        numero_item: index + 1,
        codigo_produto: it.sku || it.product_id || String(index + 1),
        descricao: it.product_name.slice(0, 120),
        codigo_ncm: rawNcm,
        codigo_cest: cleanDigits(prod?.cest || specs.cest) || undefined,
        quantidade_comercial: Number(it.quantity) || 1,
        quantidade_tributavel: Number(it.quantity) || 1,
        valor_unitario_comercial: Number(it.price) || 0,
        valor_unitario_tributavel: Number(it.price) || 0,
        valor_bruto: Number(it.total) || (Number(it.price) || 0) * (Number(it.quantity) || 1),
        unidade_comercial: rawUnit.toUpperCase().slice(0, 4),
        unidade_tributavel: rawUnit.toUpperCase().slice(0, 4),
        codigo_ean_comercial: rawEan,
        codigo_ean_tributavel: rawEan,
        origem: Number(rawOrigin) || 0,
        cfop: addr.uf === (fiscalSettings?.endereco_uf || 'SP') ? '5102' : '6102',
        icms_situacao_tributaria: '102',
        icms_origem: Number(rawOrigin) || 0,
      })
    })

    // Se faltarem dados fiscais obrigatórios: NÃO EMITE
    if (missingFields.length > 0) {
      // Grava no store_invoices como dados_incompletos
      await supabase.from('store_invoices').upsert(
        {
          order_id: order.id,
          order_number: order.order_number,
          customer_id: order.customer_id,
          customer_name: customerName || null,
          customer_document: docClean || null,
          reference,
          status: 'dados_incompletos',
          ambiente: targetEnv,
          valor: Number(order.total) || 0,
          rejection_code: 'DADOS_INCOMPLETOS',
          rejection_message: `Campos obrigatórios ausentes: ${missingFields.join('; ')}`,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'reference' }
      )

      await supabase
        .from('store_orders')
        .update({ fiscal_status: 'dados_incompletos', updated_at: new Date().toISOString() })
        .eq('id', order.id)

      await supabase.from('fiscal_audit_events').insert({
        order_id: order.id,
        action: 'rejeitada',
        actor: 'validador_fiscal',
        details: { missingFields, reference, targetEnv },
      })

      return res.status(400).json({
        success: false,
        status: 'dados_incompletos',
        message: 'Dados fiscais incompletos. A NF-e não pode ser emitida sem essas informações.',
        missingFields,
        reference,
      })
    }

    // 4. Monta o payload oficial da Focus NFe
    const isCnpj = docClean.length === 14
    const paymentMethodMap: Record<string, string> = {
      pix: '17',
      credit_card: '03',
      boleto: '15',
    }
    const payCode = paymentMethodMap[String(order.payment_method || '').toLowerCase()] || '99'

    const focusPayload = {
      natureza_operacao: 'Venda de mercadoria',
      data_emissao: new Date().toISOString().slice(0, 19),
      tipo_documento: 1, // 1 = Saída
      finalidade_emissao: 1, // 1 = Normal
      consumidor_final: 1,
      presenca_comprador: 2, // 2 = Internet
      cnpj_emitente: cleanDigits(fiscalSettings?.cnpj || '38068360000106'),
      nome_destinatario: customerName,
      [isCnpj ? 'cnpj_destinatario' : 'cpf_destinatario']: docClean,
      telefone_destinatario: cleanDigits(order.customer_phone) || undefined,
      email_destinatario: order.customer_email || undefined,
      logradouro_destinatario: addr.logradouro,
      numero_destinatario: addr.numero,
      complemento_destinatario: addr.complemento || undefined,
      bairro_destinatario: addr.bairro,
      municipio_destinatario: addr.municipio,
      uf_destinatario: addr.uf,
      cep_destinatario: addr.cep,
      itens: validatedItems,
      formas_pagamento: [
        {
          forma_pagamento: payCode,
          valor_pagamento: Number(order.total) || 0,
        },
      ],
      valor_frete: Number(order.shipping_cost) || 0,
      valor_desconto: Number(order.discount) || 0,
      valor_total: Number(order.total) || 0,
    }

    // 5. Chamada para a API da Focus NFe
    const baseUrl =
      targetEnv === 'producao' ? 'https://api.focusnfe.com.br/v2' : 'https://homologacao.focusnfe.com.br/v2'

    const authHeader = 'Basic ' + Buffer.from(token + ':').toString('base64')

    const focusRes = await fetch(`${baseUrl}/nfe?ref=${reference}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(focusPayload),
    })

    const focusData = await focusRes.json()

    let newStatus = 'processando'
    if (focusRes.status === 200 || focusRes.status === 202) {
      if (focusData.status === 'autorizado' || focusData.status === 'autorizada') {
        newStatus = 'autorizada'
      } else {
        newStatus = 'processando'
      }
    } else {
      newStatus = 'rejeitada'
    }

    const chave = focusData.chave_nfe || null
    const numero = focusData.numero || null
    const serie = focusData.serie || '1'
    const protocolo = focusData.protocolo || null
    const xmlUrl = focusData.caminho_xml_nota_fiscal
      ? `${baseUrl.replace('/v2', '')}${focusData.caminho_xml_nota_fiscal}`
      : null
    const danfeUrl = focusData.caminho_danfe
      ? `${baseUrl.replace('/v2', '')}${focusData.caminho_danfe}`
      : null

    // 6. Atualiza store_invoices no banco
    const { data: savedInvoice, error: invErr } = await supabase
      .from('store_invoices')
      .upsert(
        {
          order_id: order.id,
          order_number: order.order_number,
          customer_id: order.customer_id,
          customer_name: customerName,
          customer_document: docClean,
          reference,
          numero,
          serie,
          chave,
          protocolo,
          status: newStatus,
          ambiente: targetEnv,
          valor: Number(order.total) || 0,
          xml_url: xmlUrl,
          danfe_url: danfeUrl,
          rejection_code: focusData.status_sefaz || focusData.codigo || null,
          rejection_message: focusData.mensagem_sefaz || focusData.mensagem || null,
          issued_at: newStatus === 'autorizada' ? new Date().toISOString() : null,
          raw_payload: focusData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'reference' }
      )
      .select('id')
      .single()

    // 7. Sincroniza store_orders
    await supabase
      .from('store_orders')
      .update({
        fiscal_status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    // 8. Auditoria
    await supabase.from('fiscal_audit_events').insert({
      order_id: order.id,
      invoice_id: savedInvoice?.id,
      action: newStatus === 'autorizada' ? 'autorizada' : newStatus === 'rejeitada' ? 'rejeitada' : 'enviada',
      actor: 'hub_admin',
      details: {
        reference,
        targetEnv,
        focusStatus: focusData.status,
        focusMessage: focusData.mensagem_sefaz || focusData.mensagem,
      },
    })

    return res.status(200).json({
      success: true,
      reference,
      status: newStatus,
      ambiente: targetEnv,
      chave,
      numero,
      protocolo,
      danfeUrl,
      xmlUrl,
      details: focusData,
    })
  } catch (err: any) {
    console.error('[fiscal/emit] Erro fatal:', err)
    return res.status(500).json({ success: false, error: err.message })
  }
}
