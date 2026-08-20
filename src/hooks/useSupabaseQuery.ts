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
  // Padrão do sistema: atualização automática e contínua a cada 2 segundos
  const intervalMs = options?.intervalMs ?? 2000

  const refetch = useCallback(() => {
    setTick(t => t + 1)
  }, [])

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

    // 1. Execução inicial imediata
    execute(false)

    // 2. Polling contínuo de 2 em 2 segundos
    let intervalId: NodeJS.Timeout | null = null
    if (intervalMs > 0) {
      intervalId = setInterval(() => {
        execute(true)
      }, intervalMs)
    }

    // 3. Atualização instantânea ao focar na janela / voltar à aba
    const handleFocus = () => execute(true)
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        execute(true)
      }
    }
    const handleCustomRefresh = () => execute(true)

    window.addEventListener('focus', handleFocus)
    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('teknix:data-updated', handleCustomRefresh)

    // 4. Inscrição em Tempo Real (Supabase Realtime)
    const channel = supabase
      .channel(`rt-${Math.random().toString(36).substring(2, 9)}`)
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        execute(true)
      })
      .subscribe()

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('teknix:data-updated', handleCustomRefresh)
      supabase.removeChannel(channel)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, intervalMs])

  return { ...state, refetch }
}
