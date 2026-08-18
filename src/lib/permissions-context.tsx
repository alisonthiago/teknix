'use client'

import { createContext, useContext, ReactNode } from 'react'

interface PermissionContextValue {
  role: string
  permissions: string[]
  has: (code: string) => boolean
  hasAny: (codes: string[]) => boolean
  isAdmin: boolean
}

const PermissionContext = createContext<PermissionContextValue>({
  role: 'CONSULTA',
  permissions: [],
  has: () => false,
  hasAny: () => false,
  isAdmin: false,
})

export function PermissionProvider({
  children,
  role,
  permissions,
}: {
  children: ReactNode
  role: string
  permissions: string[]
}) {
  const permSet = new Set(permissions)

  const value: PermissionContextValue = {
    role,
    permissions,
    has: (code: string) => permSet.has(code),
    hasAny: (codes: string[]) => codes.some(c => permSet.has(c)),
    isAdmin: role === 'ADMIN',
  }

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  )
}

export function usePermissions() {
  return useContext(PermissionContext)
}

/**
 * Component that only renders children if user has the required permission.
 */
export function Can({
  permission,
  children,
  fallback,
}: {
  permission: string
  children: ReactNode
  fallback?: ReactNode
}) {
  const { has } = usePermissions()
  if (has(permission)) return <>{children}</>
  return fallback ? <>{fallback}</> : null
}
