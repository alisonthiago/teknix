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
}: {
  defaultValue?: string
  value?: string
  onValueChange?: (val: string) => void
  children: React.ReactNode
  className?: string
}) {
  const [internalTab, setInternalTab] = useState(defaultValue || value || '')
  const activeTab = value !== undefined ? value : internalTab

  const setActiveTab = (tab: string) => {
    if (value === undefined) setInternalTab(tab)
    if (onValueChange) onValueChange(tab)
  }

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={`bg-white rounded-2xl border border-[#e6e6e6] p-6 ${className}`}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div       className={`flex gap-8 border-b border-[#eeeeee] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${className}`}>
      {children}
    </div>
  )
}

export function TabsTrigger({
  value,
  children,
  className = '',
}: {
  value: string
  children: React.ReactNode
  className?: string
}) {
  const { activeTab, setActiveTab } = useContext(TabsContext)
  const isActive = activeTab === value
  return (
    <button
      type="button"
      onClick={() => setActiveTab(value)}
      className={`px-2.5 pb-3 text-[13px] sm:text-[13.5px] transition-colors relative whitespace-nowrap cursor-pointer ${
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
  return <div className={`mt-6 ${className}`}>{children}</div>
}
