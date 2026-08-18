'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

interface AdminChromeProps {
  children: React.ReactNode
  permissions: string[]
  userName: string
  userRole: string
  userEmail: string
}

export default function AdminChrome({
  children,
  permissions,
  userName,
  userRole,
  userEmail,
}: AdminChromeProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex">
      <Sidebar
        permissions={permissions}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]'} min-w-0 max-w-full`}>
        <Header
          userName={userName}
          userRole={userRole}
          userEmail={userEmail}
          onMenuOpen={() => setMobileOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-5 sm:px-8 lg:px-12 xl:px-16 py-4 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
