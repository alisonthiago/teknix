import { createClient } from '@supabase/supabase-js'

const globalProc = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined
const envProcess = globalProc && typeof globalProc.env === 'object' ? globalProc.env : {}

const supabaseUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || envProcess?.VITE_SUPABASE_URL || ''
const supabaseAnonKey = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || envProcess?.VITE_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.error('Missing Supabase environment variables. Check .env file.')
  }
}

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder-key')



