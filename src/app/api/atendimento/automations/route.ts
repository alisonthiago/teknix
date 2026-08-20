import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const DEFAULT_AUTOMATIONS = [
  {
    id: 'welcome',
    trigger: 'ORDER_CREATED',
    title: 'Boas-Vindas & Confirmação do Pedido',
    description: 'Envia uma mensagem de agradecimento no chat do cliente assim que a compra é confirmada.',
    enabled: true,
    marketplaces: ['mercadolivre', 'shopee', 'amazon', 'magalu'],
    template: 'Olá, {primeiro_nome}! Seja muito bem-vindo(a) à Teknix! Recebemos com sucesso o seu pedido #{numero_pedido} do produto {nome_produto}. Em breve o seu pacote será preparado com todo o cuidado e despachado para entrega. Qualquer dúvida estamos à disposição por aqui!'
  },
  {
    id: 'packing',
    trigger: 'ORDER_PACKED',
    title: 'Pedido em Separação & Embalagem',
    description: 'Informa ao comprador que o produto foi testado e está sendo embalado.',
    enabled: true,
    marketplaces: ['mercadolivre', 'shopee', 'amazon', 'magalu'],
    template: 'Olá {primeiro_nome}, passando para avisar que o seu {nome_produto} já foi conferido, testado e está devidamente embalado para transporte seguro.'
  },
  {
    id: 'shipped',
    trigger: 'ORDER_SHIPPED',
    title: 'Pedido Despachado & Código de Rastreio',
    description: 'Envia o código de rastreamento e aviso de que a encomenda está a caminho.',
    enabled: true,
    marketplaces: ['mercadolivre', 'shopee', 'amazon', 'magalu'],
    template: 'Ótima notícia, {primeiro_nome}! Seu pedido #{numero_pedido} acabou de ser coletado pela transportadora. Rastreio: {codigo_rastreio}. Em breve estará em suas mãos!'
  },
  {
    id: 'delivered',
    trigger: 'ORDER_DELIVERED',
    title: 'Pós-Entrega & Pedido de Avaliação',
    description: 'Envia mensagem após a entrega agradecendo e solicitando avaliação 5 estrelas.',
    enabled: false,
    marketplaces: ['mercadolivre', 'shopee', 'amazon', 'magalu'],
    template: 'Olá {primeiro_nome}, esperamos que tenha amado a sua compra! Se tudo ocorreu perfeitamente, poderia nos avaliar com 5 estrelas no {marketplace}? Sua opinião é fundamental para nós!'
  }
]

export async function GET() {
  try {
    const supabase = getSupabase()
    const { data: conn } = await supabase
      .from('marketplace_connections')
      .select('metadata')
      .eq('marketplace_id', 'mercadolivre')
      .maybeSingle()

    const savedAutomations = conn?.metadata?.automations || DEFAULT_AUTOMATIONS

    return NextResponse.json({
      success: true,
      automations: savedAutomations
    })
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      automations: DEFAULT_AUTOMATIONS
    })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { automations } = body

    const supabase = getSupabase()

    // Store in metadata of marketplace_connections
    const { data: conn } = await supabase
      .from('marketplace_connections')
      .select('id, metadata')
      .eq('marketplace_id', 'mercadolivre')
      .maybeSingle()

    if (conn) {
      const currentMeta = conn.metadata || {}
      await supabase
        .from('marketplace_connections')
        .update({
          metadata: {
            ...currentMeta,
            automations: automations || DEFAULT_AUTOMATIONS
          }
        })
        .eq('id', conn.id)
    }

    return NextResponse.json({
      success: true,
      message: 'Automações de mensagens salvas com sucesso!'
    })
  } catch (error: any) {
    console.error('Error saving automations:', error)
    return NextResponse.json({ error: error.message || 'Erro ao salvar automações' }, { status: 500 })
  }
}
