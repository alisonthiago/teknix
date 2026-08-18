'use client'

import ConfigSubLayout, { ConfigSection, ConfigRow } from '@/components/ConfigSubLayout'
import { Database } from 'lucide-react'

export default function BackupPage() {
  return (
    <ConfigSubLayout title="Backup e dados" description="Informações sobre backup e dados do sistema">
      <ConfigSection title="Backup automático">
        <div className="flex items-start gap-3 p-3 bg-[#f0f7ff] rounded-md mb-4">
          <Database className="w-5 h-5 text-[#3483fa] mt-0.5" />
          <div>
            <p className="text-[12px] font-medium text-[#333]">Backup gerenciado pelo Supabase</p>
            <p className="text-[11px] text-[#999] mt-0.5">O banco de dados é automaticamente backed up pelo Supabase com retenção de 7 dias. Não há necessidade de backup manual.</p>
          </div>
        </div>
        <ConfigRow label="Status" value="Ativo" />
        <ConfigRow label="Último backup" value="17/08/2026 20:00" />
        <ConfigRow label="Retenção" value="7 dias" />
        <ConfigRow label="Banco de dados" value="Supabase PostgreSQL" />
        <ConfigRow label="Região" value="US-East-1" />
      </ConfigSection>
    </ConfigSubLayout>
  )
}
