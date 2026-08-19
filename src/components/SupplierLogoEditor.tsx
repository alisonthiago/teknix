'use client'

import { useState, useRef } from 'react'
import { ImageIcon, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useNotification } from '@/contexts/NotificationContext'

export default function SupplierLogoEditor({ supplierId, currentLogoUrl }: { supplierId: string, currentLogoUrl: string | null }) {
  const supabase = createClient()
  const { notify } = useNotification()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [logoPreview, setLogoPreview] = useState<string | null>(currentLogoUrl)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const ext = file.name.split('.').pop() || 'png'
      const fileName = `${supplierId}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('supplier-logos')
        .upload(fileName, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('supplier-logos')
        .getPublicUrl(fileName)

      const newUrl = urlData.publicUrl

      const { error: dbError } = await supabase
        .from('suppliers')
        .update({ logo_url: newUrl })
        .eq('id', supplierId)

      if (dbError) throw dbError

      setLogoPreview(newUrl)
      notify({ type: 'success', title: 'Sucesso', message: 'Logomarca atualizada com sucesso!' })
    } catch (err) {
      console.error(err)
      notify({ type: 'error', title: 'Erro', message: 'Não foi possível atualizar a logomarca.' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div 
        className="w-20 h-20 rounded-full border border-dashed border-[#ccc] bg-[#fafafa] flex items-center justify-center overflow-hidden cursor-pointer hover:bg-[#f0f0f0] transition-colors shrink-0"
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 animate-spin text-[#3483fa]" />
        ) : logoPreview ? (
          <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon className="w-6 h-6 text-[#999]" />
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-[13px] font-medium text-[#333]">Logomarca do Fornecedor</span>
        <span className="text-[11px] text-[#999]">Clique na imagem para alterar. As mudanças são salvas automaticamente.</span>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  )
}
