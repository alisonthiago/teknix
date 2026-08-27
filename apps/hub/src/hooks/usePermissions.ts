import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'
import {
  PermissionsService,
  HUB_PERMISSIONS_CATALOG,
  ROLE_PRESET_PERMISSIONS
} from '../services/permissionsService'

export function usePermissions() {
  const { user } = useAuth()
  const [role, setRole] = useState<string>('ADMIN')
  const [isMaster, setIsMaster] = useState<boolean>(true)
  const [permissions, setPermissions] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState<boolean>(true)

  const loadCurrentPermissions = useCallback(async () => {
    setLoading(true)
    try {
      const email = user?.email || 'alison@teknix.com.br'
      const collaborators = await PermissionsService.getCollaborators()
      const currentProfile = collaborators.find(c => c.email.toLowerCase() === email.toLowerCase())

      if (currentProfile) {
        setRole(currentProfile.role)
        setIsMaster(!!currentProfile.is_master)

        // Se for ADMIN ou MASTER, todas as permissões são concedidas
        if (currentProfile.role === 'ADMIN' || currentProfile.is_master) {
          const allGranted: Record<string, boolean> = {}
          HUB_PERMISSIONS_CATALOG.forEach(p => {
            allGranted[p.code] = true
          })
          setPermissions(allGranted)
        } else {
          // Carrega permissões individuais do colaborador
          const userPerms = await PermissionsService.getUserPermissions(currentProfile.id)
          const basePreset = ROLE_PRESET_PERMISSIONS[currentProfile.role] || []
          
          const merged: Record<string, boolean> = {}
          HUB_PERMISSIONS_CATALOG.forEach(p => {
            if (userPerms[p.code] !== undefined) {
              merged[p.code] = userPerms[p.code]
            } else {
              merged[p.code] = basePreset.includes(p.code)
            }
          })
          setPermissions(merged)
        }
      } else {
        // Fallback default admin
        setRole('ADMIN')
        setIsMaster(true)
        const allGranted: Record<string, boolean> = {}
        HUB_PERMISSIONS_CATALOG.forEach(p => {
          allGranted[p.code] = true
        })
        setPermissions(allGranted)
      }
    } catch (e) {
      console.warn('[usePermissions] Erro ao carregar permissões:', e)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadCurrentPermissions()

    const handleUpdate = () => {
      loadCurrentPermissions()
    }
    window.addEventListener('permissions_updated', handleUpdate)
    return () => window.removeEventListener('permissions_updated', handleUpdate)
  }, [loadCurrentPermissions])

  /**
   * Verifica se o usuário atual tem permissão para uma ação específica
   */
  const can = useCallback((permissionCode: string): boolean => {
    if (isMaster || role === 'ADMIN') return true
    return !!permissions[permissionCode]
  }, [isMaster, role, permissions])

  /**
   * Verifica se tem pelo menos UMA das permissões
   */
  const canAny = useCallback((codes: string[]): boolean => {
    if (isMaster || role === 'ADMIN') return true
    return codes.some(c => !!permissions[c])
  }, [isMaster, role, permissions])

  /**
   * Mapeamento de rotas do HUB para permissões necessárias
   */
  const canAccessRoute = useCallback((pathname: string): boolean => {
    if (isMaster || role === 'ADMIN') return true

    if (pathname === '/hub') return can('dashboard.view')
    if (pathname.startsWith('/hub/produtos')) return can('products.view')
    if (pathname.startsWith('/hub/categorias')) return can('categories.view')
    if (pathname.startsWith('/hub/pedidos')) return can('orders.view')
    if (pathname.startsWith('/hub/clientes')) return can('customers.view')
    if (pathname.startsWith('/hub/financeiro')) return can('finance.view')
    if (pathname.startsWith('/hub/mercado-pago')) return can('mercado_pago.view')
    if (pathname.startsWith('/hub/mercado-livre') || pathname.startsWith('/hub/shopee') || pathname.startsWith('/hub/amazon') || pathname.startsWith('/hub/magalu') || pathname.startsWith('/hub/integracoes')) {
      return can('integrations.view')
    }
    if (pathname.startsWith('/hub/paginas') || pathname.startsWith('/editor/page')) return can('pages.view')
    if (pathname.startsWith('/hub/temas') || pathname.startsWith('/hub/theme-builder') || pathname.startsWith('/editor/theme-builder')) return can('themes.view')
    if (pathname.startsWith('/hub/media')) return can('media.view')
    if (pathname.startsWith('/hub/usuarios')) return can('users.view')
    if (pathname.startsWith('/hub/configuracoes')) return can('settings.view')
    if (pathname.startsWith('/hub/estatisticas')) return can('stats.view')

    return true
  }, [isMaster, role, can])

  return {
    role,
    isMaster,
    permissions,
    loading,
    can,
    canAny,
    canAccessRoute,
    reload: loadCurrentPermissions
  }
}
