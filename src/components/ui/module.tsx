'use client'

export function PageHeader({ description, actions }: { title?: string; description?: string; actions?: React.ReactNode }) {
  if (!description && !actions) return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-5">
      {description && <p className="text-xs sm:text-sm text-[#999]">{description}</p>}
      {actions && <div className="flex items-center gap-2 shrink-0 sm:ml-auto">{actions}</div>}
    </div>
  )
}

export function PrimaryButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`mp-btn-primary text-sm px-4 py-2.5 ${className}`}>
      {children}
    </button>
  )
}

export function SecondaryButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`mp-btn-secondary text-sm ${className}`}>
      {children}
    </button>
  )
}

export function GhostButton({ children, onClick, className = '' }: { children: React.ReactNode; onClick?: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`mp-btn-secondary text-sm px-4 py-2.5 ${className}`}>
      {children}
    </button>
  )
}

export function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="mp-card-sm">
      <p className="text-[10px] sm:text-xs text-[#999] font-medium">{label}</p>
      <p className="text-base sm:text-xl font-bold text-[#333] mt-0.5 sm:mt-1 truncate">{value}</p>
      {subtitle && <p className="text-[10px] sm:text-xs text-[#999] mt-0.5 sm:mt-1 truncate">{subtitle}</p>}
    </div>
  )
}

export function SearchInput({ placeholder = 'Buscar...', value, onChange }: { placeholder?: string; value?: string; onChange?: (v: string) => void }) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      className="mp-search w-full sm:max-w-[280px] min-h-[44px]"
    />
  )
}

export function ModuleTable({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`table-container ${className}`}>
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-[#eeeeee]">
        {children}
      </tr>
    </thead>
  )
}

export function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`text-left py-3.5 px-5 font-medium text-[#999] text-xs ${className}`}>{children}</th>
}

export function Td({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return <td className={`py-4 px-5 text-[#666] ${className}`} style={style}>{children}</td>
}

export function ActivityList({ children, title, linkText, linkHref }: {
  children: React.ReactNode
  title: string
  linkText?: string
  linkHref?: string
}) {
  return (
    <div className="mp-card">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-[#333]">{title}</h2>
        {linkText && linkHref && (
          <a href={linkHref} className="mp-link mt-1">
            {linkText} →
          </a>
        )}
      </div>
      <div>{children}</div>
    </div>
  )
}

export function ActivityRow({ children }: { children: React.ReactNode }) {
  return <div className="mp-activity-row">{children}</div>
}

export function StatusBadge({ status, children }: { status: 'success' | 'warning' | 'error' | 'neutral'; children: React.ReactNode }) {
  const colors = {
    success: 'text-[#00a650] bg-[#e6f9ef]',
    warning: 'text-[#e67e22] bg-[#fef9e7]',
    error: 'text-[#f23d4f] bg-[#fff0f1]',
    neutral: 'text-[#666] bg-[#f5f5f5]',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold ${colors[status]}`}>
      {children}
    </span>
  )
}
