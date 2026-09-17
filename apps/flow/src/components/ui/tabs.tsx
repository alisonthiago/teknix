'use client'

import { createContext, useContext, useState } from 'react'

const TabsContext = createContext<{
  activeTab: string
  setActiveTab: (tab: string) => void
}>({ activeTab: '', setActiveTab: () => {} })

export function Tabs({
  defaultValue = '',
  value,
  onValueChange,
  children,
  className = '',
  plain = false,
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (val: string) => void
  children: React.ReactNode
  className?: string
  plain?: boolean
}) {
  const [internalTab, setInternalTab] = useState(defaultValue || value || '')
  const activeTab = value !== undefined ? value : internalTab

  const setActiveTab = (tab: string) => {
    if (value === undefined) setInternalTab(tab)
    if (onValueChange) onValueChange(tab)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={plain ? className : `bg-white rounded-2xl border border-[#e6e6e6] p-6 sm:p-8 pb-10 ${className}`}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({
  children,
  className = '',
  align = 'left',
}: {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  const isRight = align === 'right' || className.includes('justify-end')
  return (
    <div
      className={`flex items-center ${
        isRight
          ? 'justify-end gap-2 sm:gap-2.5 shrink-0'
          : 'gap-8 border-b border-[#eeeeee] pb-3 mb-6 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]'
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  children,
  className = '',
  title,
  variant = 'default',
}: {
  value: string
  children: React.ReactNode
  className?: string
  title?: string
  variant?: 'default' | 'icon'
}) {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  const isActive = activeTab === value

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => setActiveTab(value)}
        title={title}
        aria-label={title}
        className={`relative group/tab h-10 w-10 sm:h-10.5 sm:w-10.5 rounded-full flex items-center justify-center border transition-all cursor-pointer shadow-xs shrink-0 focus:outline-none ${
          isActive
            ? 'bg-[#1f2328] text-white border-[#1f2328] ring-2 ring-[#1f2328]/20 shadow-sm'
            : 'bg-white text-[#475569] border-[#e5e7eb] hover:border-[#111111] hover:text-[#111111] hover:bg-[#f8fafc]'
        } ${className}`}
      >
        {children}
        {title && (
          <span className="pointer-events-none absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#111111] px-2 py-0.5 text-[11px] font-bold text-white opacity-0 shadow-md transition-opacity group-hover/tab:opacity-100 z-50">
            {title}
          </span>
        )}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      title={title}
      aria-label={title}
      className={`px-2.5 pb-3.5 pt-1 text-[13px] sm:text-[13.5px] transition-colors relative whitespace-nowrap cursor-pointer ${
        isActive
          ? 'text-[#111111] font-semibold'
          : 'text-[#666666] font-medium hover:text-[#111111]'
      } ${className}`}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-[#1f2328] rounded-full" />
      )}
    </button>
  )
}

export function TabsContent({
  value,
  children,
  className = '',
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const { activeTab } = useContext(TabsContext)
  if (activeTab !== value) return null
  return <div className={className || 'mt-8 pb-2'}>{children}</div>
}
