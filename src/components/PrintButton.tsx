'use client'

import { Button } from '@/components/ui/button'
import { Printer } from 'lucide-react'

export default function PrintButton() {
  return (
    <Button onClick={() => typeof window !== 'undefined' && window.print()} className="bg-[#1f2328] hover:bg-[#111827] text-white print:hidden">
      <Printer className="w-4 h-4 mr-2" />
      Imprimir / Baixar PDF
    </Button>
  )
}
