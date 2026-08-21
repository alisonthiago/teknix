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
    <div className={`flex gap-6 border-b border-[#eeeeee] overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] ${className}`}>
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
      className={`pb-3 text-sm font-semibold transition-colors relative whitespace-nowrap cursor-pointer ${
        isActive
          ? 'text-[#3483fa]'
          : 'text-[#333] hover:text-[#666]'
      } ${className}`}
    >
      {children}
      {isActive && (
        <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#3483fa] rounded-full" />
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
