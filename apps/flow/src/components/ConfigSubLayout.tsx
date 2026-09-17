'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ConfigSubLayout({ title, description, backHref = '/sistema', children }: {
  title: string
  description?: string
  backHref?: string
  children: React.ReactNode
}) {
  return (
    <div className="max-w-[900px] mx-auto w-full">
      <div className="mb-4">
        <Link href={backHref} className="inline-flex items-center gap-1.5 text-xs text-[#71717a] hover:text-[#111111] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          Configurações
        </Link>
      </div>
      <div className="mb-5">
        <h1 className="text-[22px] font-bold text-[#111111] tracking-tight">{title}</h1>
        {description && <p className="text-xs text-[#71717a] mt-1">{description}</p>}
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  )
}

export function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#e6e6e6] rounded-xl p-4 sm:p-5 shadow-2xs">
      <h3 className="text-sm font-semibold text-[#111111] mb-3">{title}</h3>
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
    <div className="flex items-center justify-between py-3.5 border-b border-[#f5f5f5] last:border-0 gap-3">
      <div className="flex-1 min-w-0 mr-2">
        <div className="text-[12px] font-medium text-[#333]">{label}</div>
        {description && <div className="text-[11px] text-[#999] mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!enabled)}
        style={{ width: 36, height: 20, minHeight: 20, padding: 0 }}
        className={`relative rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-[#000000]' : 'bg-[#d1d5db]'}`}
      >
        <div className={`absolute top-[3px] left-0 w-3.5 h-3.5 rounded-full bg-white shadow-sm transition-transform ${enabled ? 'translate-x-[19px]' : 'translate-x-[3px]'}`} />
      </button>
    </div>
  )
}
