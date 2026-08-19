'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ConfigSubLayout({ title, description, backHref = '/sistema', children }: {
  title: string
  description: string
  backHref?: string
  children: React.ReactNode
}) {
  return (
    <div className="max-w-[900px] mx-auto w-full">
      <div className="mb-5">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#333] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Configurações
        </Link>
      </div>
      <div className="mb-5">
        <h1 className="text-[18px] font-semibold text-[#333]">{title}</h1>
        <p className="text-[13px] text-[#999] mt-1">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e6e6e6] rounded-md p-3 sm:p-5">
      <h3 className="text-[14px] font-semibold text-[#333] mb-4">{title}</h3>
      {children}
    </div>
  )
}

export function ConfigRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[#f5f5f5] last:border-0 gap-2">
      <span className="text-[12px] text-[#999] shrink-0">{label}</span>
      <span className={`text-[12px] ${mono ? 'font-mono' : ''} text-[#333] font-medium text-right truncate`}>{value}</span>
    </div>
  )
}

export function Toggle({ label, description, enabled, onChange }: { label: string; description?: string; enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#f5f5f5] last:border-0 gap-3">
      <div className="flex-1 mr-4">
        <div className="text-[12px] font-medium text-[#333]">{label}</div>
        {description && <div className="text-[11px] text-[#999] mt-0.5">{description}</div>}
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`relative w-10 h-[22px] rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-[#3483fa]' : 'bg-[#ccc]'}`}
      >
        <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-[22px]' : 'translate-x-[3px]'}`} />
      </button>
    </div>
  )
}
