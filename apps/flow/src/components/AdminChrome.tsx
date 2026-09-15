'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { InternalChatProvider } from '@/contexts/InternalChatContext'
import FloatingMessenger from '@/components/internal-chat/FloatingMessenger'

interface AdminChromeProps {
  children: React.ReactNode
  permissions: string[]
  userName: string
  userRole: string
  userEmail: string
  userId: string
  userAvatarUrl?: string | null
}

export default function AdminChrome({
  children,
  permissions,
  userName,
  userRole,
  userEmail,
  userId,
  userAvatarUrl,
}: AdminChromeProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const [isHovered, setIsHovered] = useState(false)

  const isExpanded = !collapsed || isHovered

  const initialChatUser = {
    id: userId,
    name: userName,
    email: userEmail,
    role: userRole,
    photo_url: userAvatarUrl || (
      userId === 'bad56b70-dcfd-44a9-a76b-76469e84db1c'
        ? 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/bad56b70-dcfd-44a9-a76b-76469e84db1c-1788492640182.png'
        : userId === '3af9068a-4b78-4c9c-8657-f83b93c01588'
        ? 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/3af9068a-4b78-4c9c-8657-f83b93c01588-1787179225140.jpg'
        : userId === 'cea2102a-360f-44bb-9e86-75c878650bab'
        ? 'https://ykgprfzfnffooqmfbeox.supabase.co/storage/v1/object/public/user-avatars/6f58029b-c770-4f25-a9f9-86dec6fb6137-1787168051706.jpeg'
        : undefined
    )
  }

  return (
    <InternalChatProvider initialUser={initialChatUser}>
      <div className={`flow-layout hub-layout min-h-screen bg-[#f5f5f5] flex print:bg-white font-sans ${isExpanded ? 'sidebar-open' : 'sidebar-closed'} ${mobileOpen ? 'mobile-open' : ''}`}>
        <div className="print:hidden">
          <Sidebar
            permissions={permissions}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            onHoverChange={setIsHovered}
          />
        </div>
        <div className="hub-main flex-1 flex flex-col bg-[#f5f5f5] min-w-0 max-w-full print:ml-0">
          <div className="print:hidden">
            <Header
              userName={userName}
              userRole={userRole}
              userEmail={userEmail}
              userId={userId}
              userAvatarUrl={userAvatarUrl}
              onMenuOpen={() => setMobileOpen(true)}
              collapsed={collapsed}
              onToggleCollapse={() => {
                setCollapsed(!collapsed)
                setIsHovered(false)
              }}
            />
          </div>
          <main className="flex-1 w-full max-w-[1400px] mx-auto px-3 sm:px-6 lg:px-12 xl:px-16 py-4 lg:py-8 print:p-0 print:max-w-none print:w-full">
            {children}
          </main>
        </div>
        {/* Janela Flutuante do Messenger Operacional */}
        <FloatingMessenger />
      </div>
    </InternalChatProvider>
  )
}

