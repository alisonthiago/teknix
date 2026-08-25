import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import PrintButton from '@/components/PrintButton'
import PrintCodes from '@/components/PrintCodes'

function formatBRL(value: number) {
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDate(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR')
}

export default async function InternalNotaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: purchase } = await supabase
    .from('purchases')
    .select(`
      *,
      supplier:suppliers(*),
      items:purchase_items(
        *,
        product:products(name, brand, model)
      )
    `)
    .eq('id', id)
    .single()

  if (!purchase) notFound()

  const supplier = purchase.supplier

  const globalTotalCost = purchase.total_cost
  const totalFreight = purchase.items.reduce((acc: number, item: any) => acc + item.freight, 0)
  const totalOther = purchase.items.reduce((acc: number, item: any) => acc + item.other_costs, 0)
  const totalProductsCost = purchase.items.reduce((acc: number, item: any) => acc + (item.unit_cost * item.quantity), 0)

  return (
    <div className="max-w-[1000px] mx-auto px-4 py-8 bg-[#f5f5f5] min-h-screen print:bg-white print:p-0">
      <style>{`
        @media print {
          @page { margin: 0; size: A4 portrait; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 10mm !important; background: white !important; }
        }
      `}</style>
      
      <div className="flex items-center justify-between mb-8 print:hidden">
        <Link href={`/fornecedores/${supplier.id}`} className="inline-flex items-center gap-2 text-sm text-[#666] hover:text-[#333]">
          <ArrowLeft className="w-4 h-4" />
          Voltar para o Fornecedor
        </Link>
        <PrintButton />
      </div>

      <div className="bg-white border border-[#ccc] p-8 print:border-none print:p-0 shadow-sm print:shadow-none min-h-[297mm] text-black font-sans leading-snug relative overflow-hidden">
        {purchase.status === 'CANCELED' && (
          <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none overflow-hidden">
            <div className="text-[100px] sm:text-[140px] font-black text-red-500/20 rotate-[-45deg] tracking-widest whitespace-nowrap select-none mix-blend-multiply print:text-red-500/30">
              CANCELADA
            </div>
          </div>
        )}
        
        {/* Recibo de Entrega (Canhoto) */}
        <div className="border border-black mb-2 flex">
          <div className="flex-1 border-r border-black p-1 flex flex-col justify-between">
            <div className="text-[7px] uppercase leading-tight mb-4">
              Recebemos de {supplier.name} os produtos constantes da nota indicada ao lado
            </div>
            <div className="flex text-[8px] gap-2">
              <div className="flex-1 border-t border-black pt-1 font-semibold">Data de Recebimento</div>
              <div className="flex-[3] border-t border-l border-black pl-1 pt-1 font-semibold">Identificação e Assinatura do Recebedor</div>
            </div>
          </div>
          <div className="w-[120px] p-2 flex flex-col items-center justify-center">
            <div className="text-[10px] font-bold">NOTA</div>
            <div className="text-[14px] font-bold">{purchase.invoice || 'S/N'}</div>
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
               <svg className="h-8 w-auto fill-[#111]" viewBox="0 0 113.98 26.81">
                 <g>
                   <polygon points="56.95 26.15 52.21 26.19 49.52 22.34 46.09 17.51 43.48 20.03 43.46 26.2 39.44 26.2 39.44 .97 43.47 .96 43.46 8.58 43.48 15.21 51.4 7.36 56.59 7.39 48.85 14.95 56.95 26.15"/>
                   <path d="M108.37,23.32v2.92c-1.43.03-2.67.06-3.99-.35-1.52-.47-2.96-1.36-3.93-2.62l-2.33-3.01-1.92,2.5c-2.19,2.85-4.83,3.73-8.34,3.46v-4.11s1.05-.05,1.05-.05c1.62.13,3.09-.56,4.07-1.81l2.65-3.39-6.67-8.75c-.13-.17-.09-.58-.02-.78h4.17s5,6.3,5,6.3l2.55-3.22,2.47-3.08h4c.29.46.05.9-.23,1.27l-1.28,1.63-5.04,6.64,2.87,3.61c.77.97,1.9,1.47,3.1,1.59h1.8s.02,1.25.02,1.25Z"/>
                   <path d="M73.33,16.07c0-2.87-2.11-5.18-4.91-5.42s-5.53,1.78-5.67,4.7l-.08,10.84h-4.03s0-10.25,0-10.25c-.05-3.9,2.25-7.33,5.86-8.8,5.04-2.05,10.8.7,12.44,5.9.25.8.32,1.59.4,2.44v10.71s-4,.01-4,.01v-10.14Z"/>
                   <path d="M30.76,22.09c.85-.54,1.36-1.25,1.75-2.1l4.25-.02c-1.16,3.7-4.45,6.33-8.32,6.78-3.61.42-7.13-.96-9.32-3.89s-2.66-6.84-1.08-10.29c1.38-3.01,4.26-5.3,7.79-5.81,4.59-.66,8.98,1.97,10.63,6.32.61,1.61.78,3.31.63,4.98h-15.86c.15,1.19.6,2.15,1.38,3.02,2.04,2.26,5.53,2.68,8.14,1.01ZM33,14.94c-.33-1.55-1.15-2.63-2.23-3.48-2.31-1.51-5.23-1.46-7.44.24-1.02.78-1.71,1.92-2.06,3.25h11.73Z"/>
                   <path d="M15.99,26.22l-4.32-.04c-3.82-.04-6.97-3.46-6.99-6.94l-.05-8.69c0-.45-.36-.84-.81-.85l-3.82-.02v-4.29s2.76.01,2.76.01c3.36.19,6.11,2.9,6.14,6.26l.07,7.03c.02,2.11,2.06,3.26,3.97,3.25l3.06-.02-.02,4.3Z"/>
                   <path d="M15.76,4.67l.02,4.17-3.43-.03c-3.15-.21-5.64-2.77-5.88-5.9L6.42,0h4.35s0,3.8,0,3.8c.06.49.37.86.86.87h4.13Z"/>
                   <rect x="81.41" y="7.34" width="4.08" height="18.87"/>
                   <polygon points="85.48 5.19 81.42 5.17 81.42 .98 85.48 .96 85.48 5.19"/>
                   <g>
                     <path d="M111.95,4.58l.05.03c1.07.16,1.87,1.01,1.98,2.06v.46c-.13,1.16-1.09,2.06-2.25,2.09-1.42.04-2.55-1.21-2.35-2.65.17-1.03.95-1.81,1.98-1.96l.03-.02h.57ZM113.51,6.89c0-1.02-.83-1.84-1.84-1.84s-1.84.83-1.84,1.84.83,1.84,1.84,1.84,1.84-.83,1.84-1.84Z"/>
                     <path d="M112.83,8.05h-.67s-.34-.7-.34-.7c-.06-.13-.19-.21-.33-.21h-.22s0,.91,0,.91h-.63s0-2.42,0-2.42h1.11c.19,0,.38.07.54.16.17.13.22.31.22.51,0,.29-.15.52-.45.61.16.08.25.16.34.29l.42.85ZM111.91,6.39c0-.18-.1-.3-.27-.3h-.36s0,.62,0,.62h.37c.17-.02.26-.15.26-.32Z"/>
                   </g>
                 </g>
               </svg>
               <div className="text-[9px] mt-2 text-center">Gestão Inteligente de Vendas e Marketplaces</div>
            </div>
          </div>
          {/* DANFE Box */}
          <div className="w-[180px] border-r border-black p-2 flex flex-col justify-center items-center text-center">
            <div className="text-[14px] font-bold uppercase">DANFE</div>
            <div className="text-[8px] uppercase">Documento Auxiliar da<br/>Nota Fiscal Eletrônica</div>
            <div className="mt-2 text-[8px] text-left w-full flex items-center justify-center gap-2">
              <div>
                <div>0 - Entrada</div>
                <div>1 - Saída</div>
              </div>
              <div className="border border-black px-2 py-0.5 font-bold text-lg">0</div>
            </div>
            <div className="mt-2 font-bold text-[10px]">Nº {purchase.invoice || 'S/N'}</div>
          </div>
          {/* Barcode Box */}
          <div className="w-[300px] p-1 flex flex-col items-center justify-center relative">
            <div className="text-[7px] uppercase self-start w-full border-b border-black pb-0.5 mb-1 absolute top-0 left-0 px-1">Controle do Fisco</div>
            <div className="mt-3">
              <PrintCodes value={purchase.id} />
            </div>
          </div>
        </div>

        {/* Destinatário / Remetente */}
        <div className="mb-2 mt-4">
          <div className="text-[9px] font-bold uppercase mb-0.5">Destinatário/Remetente (Fornecedor)</div>
          <div className="border border-black flex flex-wrap">
            <div className="w-[60%] border-r border-black p-1">
              <div className="text-[6px] uppercase">Nome/Razão Social</div>
              <div className="text-[10px] font-medium">{supplier.name} {supplier.legal_name ? `- ${supplier.legal_name}` : ''}</div>
            </div>
            <div className="w-[25%] border-r border-black p-1">
              <div className="text-[6px] uppercase">CNPJ/CPF</div>
              <div className="text-[10px] font-medium">{supplier.cnpj || '—'}</div>
            </div>
            <div className="w-[15%] p-1">
              <div className="text-[6px] uppercase">Data da Emissão</div>
              <div className="text-[10px] font-medium">{formatDate(purchase.date)}</div>
            </div>

            <div className="w-[45%] border-t border-r border-black p-1">
              <div className="text-[6px] uppercase">Endereço</div>
              <div className="text-[10px] font-medium">{supplier.pickup_address || '—'}</div>
            </div>
            <div className="w-[20%] border-t border-r border-black p-1">
              <div className="text-[6px] uppercase">Município</div>
              <div className="text-[10px] font-medium">{supplier.city || '—'}</div>
            </div>
            <div className="w-[10%] border-t border-r border-black p-1">
              <div className="text-[6px] uppercase">UF</div>
              <div className="text-[10px] font-medium">{supplier.state || '—'}</div>
            </div>
            <div className="w-[10%] border-t border-r border-black p-1">
              <div className="text-[6px] uppercase">PIX</div>
              <div className="text-[10px] font-medium line-clamp-1 truncate">{supplier.pix_key || '—'}</div>
            </div>
            <div className="w-[15%] border-t border-black p-1">
              <div className="text-[6px] uppercase">Data da Saída</div>
              <div className="text-[10px] font-medium">{formatDate(purchase.created_at.split('T')[0])}</div>
            </div>
          </div>
        </div>

        {/* Fatura */}
        <div className="mb-2 mt-3">
          <div className="text-[9px] font-bold uppercase mb-0.5">Fatura / Pagamento</div>
          <div className="border border-black flex">
            <div className="flex-1 border-r border-black p-1">
              <div className="text-[6px] uppercase">Condições de Pagamento</div>
              <div className="text-[10px] font-medium">{purchase.payment_method || '—'}</div>
            </div>
            <div className="flex-1 border-r border-black p-1">
              <div className="text-[6px] uppercase">Registro de Compra (ID Interno)</div>
              <div className="text-[10px] font-mono font-medium">{purchase.id}</div>
            </div>
            <div className="flex-1 p-1">
              <div className="text-[6px] uppercase">Valor Total</div>
              <div className="text-[10px] font-bold">{formatBRL(globalTotalCost)}</div>
            </div>
          </div>
        </div>

        {/* Cálculo do Imposto (Adaptado para Custos) */}
        <div className="mb-2 mt-3">
          <div className="text-[9px] font-bold uppercase mb-0.5">Cálculo dos Custos</div>
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
              <div className="text-[6px] uppercase">Outras Despesas</div>
              <div className="text-[10px] text-right font-medium">{formatBRL(totalOther)}</div>
            </div>
            <div className="flex-1 border-r border-black p-1">
              <div className="text-[6px] uppercase">Desconto</div>
              <div className="text-[10px] text-right font-medium">R$ 0,00</div>
            </div>
            <div className="flex-1 p-1 bg-gray-50">
              <div className="text-[6px] uppercase font-bold">Valor Total da Nota</div>
              <div className="text-[10px] font-bold text-right">{formatBRL(globalTotalCost)}</div>
            </div>
          </div>
        </div>

        {/* Itens da Nota Fiscal */}
        <div className="mb-2 mt-3 min-h-[350px]">
          <div className="text-[9px] font-bold uppercase mb-0.5">Dados dos Produtos</div>
          <div className="border border-black h-full">
            <table className="w-full text-[9px] text-left border-collapse">
              <thead>
                <tr className="border-b border-black">
                  <th className="p-1 border-r border-black font-normal uppercase text-[7px] w-[15%]">Código</th>
                  <th className="p-1 border-r border-black font-normal uppercase text-[7px] w-[45%]">Descrição do Produto</th>
                  <th className="p-1 border-r border-black font-normal uppercase text-[7px] text-center w-[5%]">UN</th>
                  <th className="p-1 border-r border-black font-normal uppercase text-[7px] text-center w-[5%]">Qtd.</th>
                  <th className="p-1 border-r border-black font-normal uppercase text-[7px] text-right w-[10%]">Vl. Unitário</th>
                  <th className="p-1 border-r border-black font-normal uppercase text-[7px] text-right w-[10%]">Frete/Outros</th>
                  <th className="p-1 font-normal uppercase text-[7px] text-right w-[10%]">Vl. Total</th>
                </tr>
              </thead>
              <tbody>
                {purchase.items.map((item: any, i: number) => (
                  <tr key={item.id} className={i !== purchase.items.length - 1 ? 'border-b border-black border-dashed' : ''}>
                    <td className="p-1 border-r border-black font-mono">{item.sku}</td>
                    <td className="p-1 border-r border-black font-medium">{item.product?.name || 'Produto Excluído'} {item.product?.brand ? `- ${item.product.brand}` : ''}</td>
                    <td className="p-1 border-r border-black text-center">UN</td>
                    <td className="p-1 border-r border-black text-center font-bold">{item.quantity}</td>
                    <td className="p-1 border-r border-black text-right">{formatBRL(item.unit_cost)}</td>
                    <td className="p-1 border-r border-black text-right">{formatBRL(item.freight + item.other_costs)}</td>
                    <td className="p-1 text-right font-bold">{formatBRL(item.total_cost)}</td>
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
              <div className="text-[9px] whitespace-pre-wrap flex-1">{purchase.notes || '—'}</div>
            </div>
            <div className="w-[30%] p-1 flex flex-col">
              <div className="text-[6px] uppercase border-b border-dashed border-gray-300 pb-1 mb-1">Reservado ao Fisco</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
