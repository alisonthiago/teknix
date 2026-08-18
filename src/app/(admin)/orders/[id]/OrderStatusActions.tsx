'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateOrderStatus } from '../actions'

const VALID_TRANSITIONS: Record<string, string[]> = {
  NOVO: ['PAGO', 'CANCELADO'],
  PAGO: ['AGUARDANDO_SEPARACAO', 'CANCELADO'],
  AGUARDANDO_SEPARACAO: ['EM_SEPARACAO', 'CANCELADO'],
  EM_SEPARACAO: ['SEPARADO', 'PROBLEMA'],
  SEPARADO: ['AGUARDANDO_EXPEDICAO'],
  AGUARDANDO_EXPEDICAO: ['EMBALADO'],
  EMBALADO: ['ENVIADO'],
  ENVIADO: ['ENTREGUE', 'PROBLEMA'],
  PROBLEMA: ['EM_SEPARACAO', 'ENVIADO', 'CANCELADO'],
}

const STATUS_LABELS: Record<string, string> = {
  PAGO: 'Marcar como Pago',
  AGUARDANDO_SEPARACAO: 'Enviar para Separação',
  EM_SEPARACAO: 'Iniciar Separação',
  SEPARADO: 'Marcar Separado',
  AGUARDANDO_EXPEDICAO: 'Enviar para Expedição',
  EMBALADO: 'Embalar',
  ENVIADO: 'Marcar Enviado',
  ENTREGUE: 'Marcar Entregue',
  CANCELADO: 'Cancelar',
  PROBLEMA: 'Reportar Problema',
}

export default function OrderStatusActions({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [processing, setProcessing] = useState(false)
  const router = useRouter()

  const transitions = VALID_TRANSITIONS[currentStatus] || []
  if (transitions.length === 0) return null

  const handleTransition = async (newStatus: string) => {
    setProcessing(true)
    try {
      await updateOrderStatus(orderId, newStatus)
      router.refresh()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Erro')
    }
    setProcessing(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map(status => (
        <button
          key={status}
          onClick={() => handleTransition(status)}
          disabled={processing}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
            status === 'CANCELADO'
              ? 'bg-red-600 text-white hover:bg-red-700'
              : status === 'ENTREGUE'
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-[#3483fa] text-white hover:bg-[#2968c8]'
          }`}
        >
          {processing ? '...' : STATUS_LABELS[status] || status}
        </button>
      ))}
    </div>
  )
}
