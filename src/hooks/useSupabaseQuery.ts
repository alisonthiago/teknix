'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'

export function useSupabaseQuery<T>(
  queryFn: (supabase: ReturnType<typeof createClient>) => Promise<T>,
  deps: string[] = [],
  options?: { intervalMs?: number }
) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  })
  const [tick, setTick] = useState(0)
  const isFirstRun = useRef(true)

  const key = deps.join(',') + ':' + tick
  // Sincronização ultra-rápida contínua a cada 2 segundos por padrão
  const intervalMs = options?.intervalMs ?? 2000

  const refetch = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    const execute = (isBackground = false) => {
      queryFn(supabase)
        .then(result => {
          if (!cancelled) {
            setState({
              data: result,
              loading: false,
              error: null
            })
            isFirstRun.current = false
          }
        })
        .catch(err => {
          if (!cancelled) {
            setState(prev => ({
              data: prev.data,
              loading: false,
              error: err instanceof Error ? err.message : 'Unknown error'
            }))
            isFirstRun.current = false
          }
        })
    }

    execute(false)

    // Atualização contínua a cada 2 segundos (quando a aba estiver visível)
    let intervalId: NodeJS.Timeout | null = null
    if (intervalMs > 0) {
      intervalId = setInterval(() => {
        if (typeof document !== 'undefined' && !document.hidden) {
          execute(true)
        }
      }, intervalMs)
    }

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, intervalMs])

  return { ...state, refetch }
}
