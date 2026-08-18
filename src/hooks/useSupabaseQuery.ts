'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'

export function useSupabaseQuery<T>(
  queryFn: (supabase: ReturnType<typeof createClient>) => Promise<T>,
  deps: string[] = []
) {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: string | null }>({
    data: null,
    loading: true,
    error: null,
  })
  const [tick, setTick] = useState(0)

  const key = deps.join(',') + ':' + tick

  const refetch = useCallback(() => setTick(t => t + 1), [])

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    queryFn(supabase)
      .then(result => {
        if (!cancelled) setState({ data: result, loading: false, error: null })
      })
      .catch(err => {
        if (!cancelled) setState({ data: null, loading: false, error: err instanceof Error ? err.message : 'Unknown error' })
      })
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return { ...state, refetch }
}
