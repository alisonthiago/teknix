'use client'

import { useEffect } from 'react'
import { setupMobileViewportGuard } from '@/lib/mobileViewport'

export function MobileViewportGuard() {
  useEffect(() => {
    return setupMobileViewportGuard()
  }, [])

  return null
}
