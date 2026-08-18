'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Users, Shield, Store, CheckCircle2, XCircle } from 'lucide-react'
import { PageHeader, StatCard, ModuleTable, TableHead, Th, Td } from '@/components/ui/module'
import { useSupabaseQuery } from '@/hooks/useSupabaseQuery'
import { MarketplaceLogo } from '@/components/MarketplaceLogos'

export default function ColaboradoresAccountsPage() {
  const { data: users, loading: usersLoading } = useSupabaseQuery(async (s) => {
    const { data, error } = await s.from('profiles').select('*').order('full_name')
    if (error) throw error
    return data || []
  })

  const { data: accounts } = useSupabaseQuery(async (s) => {
    const { data } = await s
      .from('marketplace_accounts')
      .select('id, account_name, status, marketplaces(name, code, logo)')
      .eq('status', 'active')
    return data || []
  })

  const { data: assignments } = useSupabaseQuery(async (s) => {
    const { data } = await s
      .from('user_marketplace_accounts')
      .select('user_id, marketplace_account_id, can_view, can_edit, can_sync')
    return data || []
  })

  const assignMap = new Map<string, Set<string>>()
  for (const a of (assignments || []) as Record<string, unknown>[]) {
    const userId = a.user_id as string
    const accId = a.marketplace_account_id as string
    if (!assignMap.has(userId)) assignMap.set(userId, new Set())
    assignMap.get(userId)!.add(accId)
  }

  const allAccounts = (accounts || []) as Record<string, unknown>[]

  return (
    <div className="mp-stack">
      <div className="mb-4">
        <Link href="/sistema" className="inline-flex items-center gap-1.5 text-[12px] text-[#999] hover:text-[#333] transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Sistema
        </Link>
      </div>
      <PageHeader title="Permissões por Conta" description="Atribua contas de marketplace a colaboradores" />

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <StatCard label="Colaboradores" value={String((users || []).length)} />
        <StatCard label="Contas Ativas" value={String(allAccounts.length)} />
        <StatCard label="Atribuições" value={String((assignments || []).length)} />
      </div>

      {usersLoading ? (
        <div className="bg-white rounded-2xl border border-[#e6e6e6] p-10 text-center text-[#999] text-[13px]">Carregando...</div>
      ) : (
        <div className="space-y-3">
          {((users || []) as Record<string, unknown>[]).map(user => {
            const userAccounts = assignMap.get(user.id as string) || new Set()
            return (
              <div key={user.id as string} className="bg-white border border-[#e6e6e6] rounded-lg p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#f0f7ff] flex items-center justify-center">
                      <Users className="w-4 h-4 text-[#3483fa]" />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-[#333]">{(user.full_name as string) || (user.email as string)}</div>
                      <div className="text-[11px] text-[#999]">{user.email as string} • <span className="inline-flex px-1.5 py-[1px] rounded text-[9px] font-medium bg-[#f5f5f5] text-[#666]">{(user.role as string) || 'USER'}</span></div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {allAccounts.map(acc => {
                    const mp = acc.marketplaces as Record<string, unknown> | null
                    const assigned = userAccounts.has(acc.id as string)
                    return (
                      <div key={acc.id as string}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md border transition-colors ${assigned ? 'border-[#3483fa]/30 bg-[#f0f7ff]' : 'border-[#e6e6e6] bg-[#fafafa]'}`}>
                        {typeof mp?.logo === 'string' && <MarketplaceLogo name={mp.name as string} className="w-4 h-4" />}
                        <span className="text-[11px] text-[#333] flex-1">{acc.account_name as string}</span>
                        {assigned
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-[#3483fa] shrink-0" />
                          : <XCircle className="w-3.5 h-3.5 text-[#ccc] shrink-0" />}
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
