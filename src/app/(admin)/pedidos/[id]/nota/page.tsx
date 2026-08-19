import { getOrderDetail } from '@/lib/supabase-detail-queries'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PrintButton from '@/components/PrintButton'
import PrintCodes from '@/components/PrintCodes'
import { TeknixLogo } from '@/components/TeknixLogo'

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export default async function OrderNotaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await getOrderDetail(id)

  if (!order) notFound()

  const totalProductsCost = order.items.reduce((acc, item) => acc + item.total, 0)
  const totalFreight = order.shipping.cost
  const totalOther = order.payment.fee // Using fees as "other expenses" in this view
  const globalTotalCost = order.payment.total

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 bg-[#f5f5f5] min-h-screen print:bg-white print:p-0">
      <style>{`
        @media print {
          @page { margin: 0; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 10mm !important; background: white !important; }
        }
      `}</style>
      
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link href={`/pedidos/${order.id}`} className="inline-flex items-center gap-2 text-sm text-[#666] hover:text-[#333]">
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Pedido
        </Link>
        <PrintButton />
      </div>

      <div className="bg-white border border-[#ccc] p-8 print:border-none print:p-0 shadow-sm print:shadow-none min-h-[297mm] text-black font-sans leading-snug">
        
        {/* Recibo de Entrega (Canhoto) */}
        <div className="border border-black mb-2 flex">
          <div className="flex-1 border-r border-black p-1 flex flex-col justify-between">
            <div className="text-[7px] uppercase leading-tight mb-4">
              Recebemos de TEKNIX os produtos constantes da nota indicada ao lado
            </div>
            <div className="flex text-[8px] gap-2">
              <div className="flex-1 border-t border-black pt-1 font-semibold">Data de Recebimento</div>
              <div className="flex-[3] border-t border-l border-black pl-1 pt-1 font-semibold">Identificação e Assinatura do Recebedor</div>
            </div>
          </div>
          <div className="w-[120px] p-2 flex flex-col items-center justify-center">
            <div className="text-[10px] font-bold">NOTA</div>
            <div className="text-[14px] font-bold">{order.order_number || 'S/N'}</div>
          </div>
        </div>
        
        <div className="flex gap-2 border-b-2 border-black border-dashed mb-2 pb-2 justify-end text-[8px]">
           Destaque aqui
        </div>
        
        {/* Header (Emitente / TEKNIX / Código de Barras) */}
        <div className="border border-black flex mb-2">
          {/* Emitente Info */}
          <div className="flex-1 p-2 flex border-r border-black">
            <div className="flex-1 flex flex-col justify-center items-center">
               <TeknixLogo className="h-8 w-auto fill-[#111]" />
               <div className="text-[9px] mt-2 text-center">Gestão Inteligente de Vendas e Marketplaces</div>
            </div>
          </div>
          {/* DANFE Box */}
          <div className="w-[180px] border-r border-black p-2 flex flex-col justify-center items-center text-center">
            <div className="text-[14px] font-bold uppercase">COMPROVANTE</div>
            <div className="text-[8px] uppercase">Documento Auxiliar<br/>do Pedido</div>
            <div className="mt-2 text-[8px] text-left w-full flex items-center justify-center gap-2">
              <div>
                <div>0 - Entrada</div>
                <div>1 - Saída</div>
              </div>
              <div className="border border-black px-2 py-0.5 font-bold text-lg">1</div>
            </div>
            <div className="mt-2 font-bold text-[10px]">Nº {order.order_number || 'S/N'}</div>
          </div>
          {/* Barcode Box */}
          <div className="w-[300px] p-1 flex flex-col items-center justify-center relative">
            <div className="text-[7px] uppercase self-start w-full border-b border-black pb-0.5 mb-1 absolute top-0 left-0 px-1">Controle de Expedição</div>
            <div className="mt-3">
              <PrintCodes value={order.id} />
            </div>
          </div>
        </div>

        {/* Destinatário */}
        <div className="mb-2 mt-4">
          <div className="text-[9px] font-bold uppercase mb-0.5">Destinatário (Cliente)</div>
          <div className="border border-black flex flex-wrap">
            <div className="w-[60%] border-r border-black p-1">
              <div className="text-[6px] uppercase">Nome/Razão Social</div>
              <div className="text-[10px] font-medium">{order.customer.name || '—'}</div>
            </div>
            <div className="w-[25%] border-r border-black p-1">
              <div className="text-[6px] uppercase">CNPJ/CPF</div>
              <div className="text-[10px] font-medium">{order.customer.cpf || '—'}</div>
            </div>
            <div className="w-[15%] p-1">
              <div className="text-[6px] uppercase">Data da Emissão</div>
              <div className="text-[10px] font-medium">{order.date}</div>
            </div>

            <div className="w-[45%] border-t border-r border-black p-1">
              <div className="text-[6px] uppercase">Endereço</div>
              <div className="text-[10px] font-medium">{order.shipping.address || '—'}</div>
            </div>
            <div className="w-[20%] border-t border-r border-black p-1">
              <div className="text-[6px] uppercase">Município</div>
              <div className="text-[10px] font-medium">{order.shipping.city || '—'}</div>
            </div>
            <div className="w-[10%] border-t border-r border-black p-1">
              <div className="text-[6px] uppercase">UF</div>
              <div className="text-[10px] font-medium">{order.shipping.state || '—'}</div>
            </div>
            <div className="w-[10%] border-t border-r border-black p-1">
              <div className="text-[6px] uppercase">CEP</div>
              <div className="text-[10px] font-medium line-clamp-1 truncate">{order.shipping.zip || '—'}</div>
            </div>
            <div className="w-[15%] border-t border-black p-1">
              <div className="text-[6px] uppercase">Data da Saída</div>
              <div className="text-[10px] font-medium">{order.date}</div>
            </div>
          </div>
        </div>

        {/* Fatura */}
        <div className="mb-2 mt-3">
          <div className="text-[9px] font-bold uppercase mb-0.5">Fatura / Pagamento</div>
          <div className="border border-black flex">
            <div className="flex-1 border-r border-black p-1">
              <div className="text-[6px] uppercase">Canal de Venda</div>
              <div className="text-[10px] font-medium">{order.marketplace || '—'}</div>
            </div>
            <div className="flex-1 border-r border-black p-1">
              <div className="text-[6px] uppercase">ID do Pedido</div>
              <div className="text-[10px] font-mono font-medium">{order.id}</div>
            </div>
            <div className="flex-1 p-1">
              <div className="text-[6px] uppercase">Valor Total</div>
              <div className="text-[10px] font-bold">{formatBRL(globalTotalCost)}</div>
            </div>
          </div>
        </div>

        {/* Cálculo dos Custos */}
        <div className="mb-2 mt-3">
          <div className="text-[9px] font-bold uppercase mb-0.5">Cálculo dos Valores</div>
          <div className="border border-black flex">
            <div className="flex-1 border-r border-black p-1">
              <div className="text-[6px] uppercase">Valor Total dos Produtos</div>
              <div className="text-[10px] text-right font-medium">{formatBRL(totalProductsCost)}</div>
            </div>
            <div className="flex-1 border-r border-black p-1">
              <div className="text-[6px] uppercase">Valor do Frete</div>
              <div className="text-[10px] text-right font-medium">{formatBRL(totalFreight)}</div>
            </div>
            <div className="flex-1 border-r border-black p-1">
              <div className="text-[6px] uppercase">Taxas do Canal</div>
              <div className="text-[10px] text-right font-medium">{formatBRL(totalOther)}</div>
            </div>
            <div className="flex-1 border-r border-black p-1">
              <div className="text-[6px] uppercase">Desconto</div>
              <div className="text-[10px] text-right font-medium">R$ 0,00</div>
            </div>
            <div className="flex-1 p-1 bg-gray-50">
              <div className="text-[6px] uppercase font-bold">Valor Total do Pedido</div>
              <div className="text-[10px] font-bold text-right">{formatBRL(globalTotalCost)}</div>
            </div>
          </div>
        </div>

        {/* Itens do Pedido */}
        <div className="mb-2 mt-3 min-h-[350px]">
          <div className="text-[9px] font-bold uppercase mb-0.5">Dados dos Produtos</div>
          <div className="border border-black h-full">
            <table className="w-full text-[9px] text-left border-collapse">
              <thead>
                <tr className="border-b border-black">
                  <th className="p-1 border-r border-black font-normal uppercase text-[7px] w-[15%]">Código</th>
                  <th className="p-1 border-r border-black font-normal uppercase text-[7px] w-[55%]">Descrição do Produto</th>
                  <th className="p-1 border-r border-black font-normal uppercase text-[7px] text-center w-[5%]">UN</th>
                  <th className="p-1 border-r border-black font-normal uppercase text-[7px] text-center w-[5%]">Qtd.</th>
                  <th className="p-1 border-r border-black font-normal uppercase text-[7px] text-right w-[10%]">Vl. Unitário</th>
                  <th className="p-1 font-normal uppercase text-[7px] text-right w-[10%]">Vl. Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className={i !== order.items.length - 1 ? 'border-b border-black border-dashed' : ''}>
                    <td className="p-1 border-r border-black font-mono">{item.sku}</td>
                    <td className="p-1 border-r border-black font-medium">{item.name || 'Produto Excluído'}</td>
                    <td className="p-1 border-r border-black text-center">UN</td>
                    <td className="p-1 border-r border-black text-center font-bold">{item.quantity}</td>
                    <td className="p-1 border-r border-black text-right">{formatBRL(item.price)}</td>
                    <td className="p-1 text-right font-bold">{formatBRL(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dados Adicionais */}
        <div className="mb-2 mt-4 page-break-inside-avoid">
          <div className="text-[9px] font-bold uppercase mb-0.5">Dados Adicionais</div>
          <div className="border border-black flex min-h-[120px]">
            <div className="w-[70%] border-r border-black p-1 flex flex-col">
              <div className="text-[6px] uppercase border-b border-dashed border-gray-300 pb-1 mb-1">Informações Complementares</div>
              <div className="text-[9px] whitespace-pre-wrap flex-1">
                Forma de Pagamento: {order.payment.method} ({order.payment.installments}x)<br />
                Método de Envio: {order.shipping.method}<br />
                Código de Rastreio: {order.shipping.tracking || 'Não gerado'}
              </div>
            </div>
            <div className="w-[30%] p-1 flex flex-col">
              <div className="text-[6px] uppercase border-b border-dashed border-gray-300 pb-1 mb-1">Reservado à Expedição</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
