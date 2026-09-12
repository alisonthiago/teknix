'use client'

import React from 'react'

export function PageHeader({
  title,
  description,
  actions,
  children
}: {
  title?: string
  description?: string
  actions?: React.ReactNode
  children?: React.ReactNode
}) {
  if (!title && !description && !actions && !children) return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
      {title ? (
        <div className="space-y-0.5">
          <h1 className="text-[24px] sm:text-[26px] font-bold text-[#111111] tracking-tight leading-tight">
            {title}
          </h1>
          {description && <p className="text-[13px] text-[#666666] leading-relaxed">{description}</p>}
        </div>
      ) : description ? (
        <p className="text-[13px] text-[#666666] leading-relaxed">{description}</p>
      ) : null}
      {(actions || children) && (
        <div className="flex items-center gap-2.5 shrink-0 sm:ml-auto flex-wrap">
          {actions}
          {children}
        </div>
      )}
    </div>
  )
}

export function PrimaryButton({
  children,
  onClick,
  className = '',
  type = 'button',
  disabled = false,
  title
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`mp-btn-primary ${className}`}
    >
      {children}
    </button>
  )
}

export function SecondaryButton({
  children,
  onClick,
  className = '',
  type = 'button',
  disabled = false,
  title
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  type?: 'button' | 'submit'
  disabled?: boolean
  title?: string
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`mp-btn-secondary ${className}`}
    >
      {children}
    </button>
  )
}

export function GhostButton({
  children,
  onClick,
  className = ''
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-2 text-[13px] font-medium text-[#4b5563] hover:text-[#111111] hover:bg-[#f5f5f5] px-3 py-2 rounded-lg transition-colors cursor-pointer ${className}`}
    >
      {children}
    </button>
  )
}

export function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e6e6e6] p-5 shadow-none space-y-1">
      <p className="text-[11px] font-semibold text-[#8a8a8a] tracking-wider uppercase">{label}</p>
      <p className="text-2xl sm:text-[26px] font-bold text-[#111111] tracking-tight truncate">{value}</p>
      {subtitle && <p className="text-xs text-[#666666] truncate">{subtitle}</p>}
    </div>
  )
}

export function SearchInput({
  placeholder = 'Buscar...',
  value,
  onChange,
  className = ''
}: {
  placeholder?: string
  value?: string
  onChange?: (v: string) => void
  className?: string
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      className={`mp-search w-full sm:max-w-[280px] ${className}`}
    />
  )
}

export function ModuleTable({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-[#e6e6e6] overflow-hidden shadow-none ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse text-left">{children}</table>
      </div>
    </div>
  )
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="bg-[#fafafa] border-b border-[#e5e5e5]">
        {children}
      </tr>
    </thead>
  )
}

export function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`py-3 px-5 font-medium text-[#8a8a8a] text-xs uppercase tracking-wider ${className}`}>{children}</th>
}

export function Td({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <td className={`py-3.5 px-5 text-[#242424] border-b border-[#eeeeee] text-[13.5px] ${className}`} style={style}>{children}</td>
}

export function ActivityList({ children, title, linkText, linkHref }: {
  children: React.ReactNode
  title: string
  linkText?: string
  linkHref?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#e6e6e6] p-6 shadow-none">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-[#111111]">{title}</h2>
        {linkText && linkHref && (
          <a href={linkHref} className="text-[13px] font-medium text-[#111111] hover:underline flex items-center gap-1">
            {linkText} →
          </a>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}

export function ActivityRow({ children }: { children: React.ReactNode }) {
  return <div className="grid items-center gap-3 py-3.5 border-b border-[#eeeeee] last:border-0">{children}</div>
}

export function StatusBadge({ status, children }: { status: 'success' | 'warning' | 'error' | 'neutral' | 'lime'; children: React.ReactNode }) {
  const colors = {
    success: 'text-[#00a650] bg-[#ecfdf5] border border-[#bbf7d0]',
    warning: 'text-[#b45309] bg-[#fffbeb] border border-[#fef3c7]',
    error: 'text-[#dc2626] bg-[#fef2f2] border border-[#fee2e2]',
    neutral: 'text-[#475569] bg-[#f8fafc] border border-[#e2e8f0]',
    lime: 'text-[#111111] bg-[#B5F500]/20 border border-[#B5F500]/40 font-semibold',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11.5px] font-medium leading-tight ${colors[status] || colors.neutral}`}>
      {children}
    </span>
  )
}

