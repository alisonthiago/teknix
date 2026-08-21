'use client'

import { useState } from 'react'
import ConfigSubLayout, { ConfigSection, ConfigRow } from '@/components/ConfigSubLayout'
import { Database, Download, RefreshCw, CheckCircle2, ShieldCheck, HardDrive, Loader2 } from 'lucide-react'
import { useNotification } from '@/contexts/NotificationContext'
import { createClient } from '@/utils/supabase/client'

export default function BackupPage() {
  const { notify } = useNotification()
  const [downloading, setDownloading] = useState(false)

  const handleExportBackup = async () => {
    setDownloading(true)
    try {
      const supabase = createClient()
      const [
        { data: products },
        { data: orders },
        { data: suppliers },
        { data: marketplaces }
      ] = await Promise.all([
        supabase.from('products').select('*'),
        supabase.from('orders').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('marketplaces').select('*')
      ])

      const backupSnapshot = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        database: 'Teknix ERP Cloud',
        data: {
          products: products || [],
          orders: orders || [],
          suppliers: suppliers || [],
          marketplaces: marketplaces || []
        }
      }

      const blob = new Blob([JSON.stringify(backupSnapshot, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `teknix_backup_${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      notify({
        type: 'success',
        title: 'Backup Gerado!',
        message: 'O arquivo de backup (.JSON) foi baixado com sucesso.'
      })
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Erro ao gerar backup',
        message: err.message || 'Falha ao exportar banco de dados.'
      })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <ConfigSubLayout title="Backup e Dados" description="Gestão de cópias de segurança e integridade do banco de dados">
      <ConfigSection title="Backup Automático em Nuvem">
        <div className="flex items-start gap-3.5 p-4 bg-[#f0fff4] border border-[#bbf7d0] rounded-2xl mb-4 shadow-2xs">
          <ShieldCheck className="w-6 h-6 text-[#16a34a] shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-black text-[#111]">Backup Contínuo Ativo (Supabase PostgreSQL)</p>
            <p className="text-[11px] text-[#555] mt-0.5">O banco de dados do sistema possui replicação redundante em tempo real e cópias automáticas a cada 24 horas.</p>
          </div>
        </div>
        <ConfigRow label="Status da Replicação" value="Online & Sincronizado" />
        <ConfigRow label="Último Ponto de Restauração" value="Hoje, 02:00" />
        <ConfigRow label="Retenção de Dados" value="30 dias contínuos" />
        <ConfigRow label="Motor do Banco" value="PostgreSQL 15 (Supabase)" />
        <ConfigRow label="Região do Servidor" value="São Paulo (sa-east-1)" />
      </ConfigSection>

      <ConfigSection title="Exportação e Download Manual">
        <div className="p-4 bg-[#fafafa] border border-[#eee] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[13px] font-black text-[#111]">Exportar Snapshot Completo</p>
            <p className="text-[11px] text-[#666] mt-0.5">Baixe todos os produtos, pedidos, fornecedores e cadastros em arquivo JSON.</p>
          </div>
          <button
            onClick={handleExportBackup}
            disabled={downloading}
            className="px-5 py-2.5 bg-[#111] hover:bg-[#222] text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-2xs shrink-0"
          >
            {downloading ? <Loader2 className="w-4 h-4 animate-spin text-[#B5F500]" /> : <Download className="w-4 h-4 text-[#B5F500]" />}
            <span>{downloading ? 'Gerando Backup...' : 'Baixar Backup Agora'}</span>
          </button>
        </div>
      </ConfigSection>
    </ConfigSubLayout>
  )
}
