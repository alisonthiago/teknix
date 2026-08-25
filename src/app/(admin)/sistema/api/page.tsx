'use client'

import { useState, useEffect, useCallback } from 'react'
import ConfigSubLayout, { ConfigSection } from '@/components/ConfigSubLayout'
import { Plus, Eye, EyeOff, Copy, Trash2, Loader2 } from 'lucide-react'
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal'
import { createClient } from '@/utils/supabase/client'

export default function ApiPage() {
  const [showKey, setShowKey] = useState<string | null>(null)
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [keyToDelete, setKeyToDelete] = useState<{ id: string, name: string } | null>(null)

  const supabase = createClient()

  const fetchKeys = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('api_keys').select('*').order('created_at', { ascending: false })
    if (data) {
      setKeys(data.map(k => ({
        id: k.id,
        name: k.name,
        key: k.key_hash, // Using key_hash to store the plain key for the mockup
        created: new Date(k.created_at).toLocaleDateString('pt-BR'),
        last_used: k.last_used_at ? new Date(k.last_used_at).toLocaleString('pt-BR') : 'Nunca',
        status: k.is_active ? 'ACTIVE' : 'INACTIVE'
      })))
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchKeys()
  }, [fetchKeys])

  const handleCreateKey = async () => {
    setSaving(true)
    const rawKey = `tk_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 10)}`
    
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData.user?.id
    
    const { data, error } = await supabase.from('api_keys').insert({
      user_id: userId,
      name: `Nova Chave API ${keys.length + 1}`,
      key_hash: rawKey,
      key_prefix: rawKey.substring(0, 10),
      is_active: true
    }).select().single()

    if (data) {
      setKeys([{
        id: data.id,
        name: data.name,
        key: data.key_hash,
        created: new Date(data.created_at).toLocaleDateString('pt-BR'),
        last_used: 'Nunca',
        status: 'ACTIVE'
      }, ...keys])
    }
    setSaving(false)
  }

  const handleDeleteKey = async () => {
    if (keyToDelete) {
      await supabase.from('api_keys').delete().eq('id', keyToDelete.id)
      setKeys(keys.filter(k => k.id !== keyToDelete.id))
      setShowDeleteModal(false)
      setKeyToDelete(null)
    }
  }

  const confirmDelete = (k: { id: string; name: string }) => {
    setKeyToDelete(k)
    setShowDeleteModal(true)
  }

  const handleCopyKey = (keyString: string) => {
    navigator.clipboard.writeText(keyString)
    alert('Chave copiada para a área de transferência!')
  }

  return (
    <ConfigSubLayout title="API e desenvolvedores" description="Gerencie chaves de API e acesso programático">
      <ConfigSection title="Chaves de API">
        <div className="flex justify-between items-center mb-3">
          <p className="text-[11px] text-[#999]">{keys.length} chave(s) ativa(s)</p>
          <button 
            onClick={handleCreateKey}
            disabled={saving || loading}
            className="px-3 py-1.5 bg-[#3483fa] text-white text-[11px] font-medium rounded-md hover:bg-[#2968c8] flex items-center gap-1 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Criar chave
          </button>
        </div>
        <div className="space-y-2">
          {loading ? (
            <div className="p-4 text-center text-[#999] text-xs">Carregando chaves...</div>
          ) : keys.length === 0 ? (
            <div className="p-4 text-center text-[#999] text-xs bg-[#fafafa] rounded-md">Nenhuma chave de API encontrada.</div>
          ) : keys.map(k => (
            <div key={k.id} className="flex items-center justify-between p-3 bg-[#fafafa] rounded-md">
              <div>
                <p className="text-sm font-medium text-[#333]">{k.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <code className="text-xs font-mono text-[#999] bg-[#f0f0f0] px-2 py-0.5 rounded">
                    {showKey === k.id ? k.key : `${k.key.substring(0, 10)}...${k.key.substring(k.key.length - 4)}`}
                  </code>
                  <button onClick={() => setShowKey(showKey === k.id ? null : k.id)} className="text-[#ccc] hover:text-[#666]">
                    {showKey === k.id ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button onClick={() => handleCopyKey(k.key)} className="text-[#ccc] hover:text-[#666]">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-xs text-[#999]">Criada: {k.created}</p>
                  <p className="text-xs text-[#999]">Último uso: {k.last_used}</p>
                </div>
                <button onClick={() => confirmDelete(k)} className="text-[#ccc] hover:text-[#e74c3c]">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <DeleteConfirmationModal 
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteKey}
          itemName={keyToDelete?.name}
        />
      </ConfigSection>

      <ConfigSection title="Logs de API">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#f5f5f5]">
              <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Data</th>
              <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Serviço</th>
              <th className="text-left py-3.5 px-5 font-medium text-[#999] text-xs">Endpoint</th>
              <th className="text-center py-3.5 px-5 font-medium text-[#999] text-xs">Status</th>
              <th className="text-right py-3.5 px-5 font-medium text-[#999] text-xs">Tempo</th>
            </tr></thead>
            <tbody className="divide-y divide-[#f5f5f5]">
              {[
                { date: '17/08 20:32', service: 'Mercado Livre', endpoint: 'GET /orders/123456', status: 200, time: '182ms' },
                { date: '17/08 20:30', service: 'Mercado Livre', endpoint: 'GET /products', status: 200, time: '245ms' },
                { date: '17/08 20:15', service: 'Shopee', endpoint: 'POST /sync', status: 500, time: '2100ms' },
              ].map((log, i) => (
                <tr key={i} className="hover:bg-[#fafafa]">
                  <td className="py-2 px-3 text-[#999]">{log.date}</td>
                  <td className="py-2 px-3 text-[#333]">{log.service}</td>
                  <td className="py-2 px-3 font-mono text-[#999]">{log.endpoint}</td>
                  <td className="py-2 px-3 text-center"><span className={`inline-flex px-2 py-[2px] rounded text-xs font-medium ${log.status === 200 ? 'bg-[#f0fff4] text-[#38a169]' : 'bg-[#fff5f5] text-[#e74c3c]'}`}>{log.status}</span></td>
                  <td className="py-2 px-3 text-right text-[#999]">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ConfigSection>
    </ConfigSubLayout>
  )
}
