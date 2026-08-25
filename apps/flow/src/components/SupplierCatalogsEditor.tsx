'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { FileText, Link as LinkIcon, Trash2, Loader2, UploadCloud, Plus, Image as ImageIcon } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useNotification } from '@/contexts/NotificationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Catalog {
  id: string
  supplier_id: string
  title: string
  file_url: string
  file_type?: string
  file_name?: string
  file_size_bytes?: number
  created_at?: string
}

export default function SupplierCatalogsEditor({ supplierId }: { supplierId: string }) {
  const supabase = createClient()
  const { notify } = useNotification()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [catalogs, setCatalogs] = useState<Catalog[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  
  const [showLinkForm, setShowLinkForm] = useState(false)
  const [linkTitle, setLinkTitle] = useState('')
  const [linkUrl, setLinkUrl] = useState('')

  const fetchCatalogs = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('supplier_catalogs')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setCatalogs(data as Catalog[])
    }
    setLoading(false)
  }, [supplierId, supabase])

  useEffect(() => {
    fetchCatalogs()
  }, [fetchCatalogs])

  const handleFiles = async (files: FileList | File[]) => {
    const fileList = Array.from(files)
    if (fileList.length === 0) return

    setUploading(true)
    try {
      for (const file of fileList) {
        if (file.size > 50 * 1024 * 1024) {
          notify({ type: 'warning', title: 'Arquivo Grande', message: `O arquivo ${file.name} excede o limite de 50MB.` })
          continue
        }

        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        const fileExt = file.name.split('.').pop() || (isPdf ? 'pdf' : 'jpg')
        const fileName = `${supplierId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

        let publicUrl = ''

        // Tentar upload direto no Supabase Storage do cliente
        const { error: uploadError } = await supabase.storage
          .from('supplier-catalogs')
          .upload(fileName, file, {
            contentType: file.type || (isPdf ? 'application/pdf' : 'image/jpeg'),
            upsert: true
          })

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('supplier-catalogs')
            .getPublicUrl(fileName)
          publicUrl = urlData.publicUrl
        } else {
          // Fallback via rota API com tratamento seguro de JSON
          const formData = new FormData()
          formData.append('file', file)
          formData.append('supplierId', supplierId)

          const res = await fetch('/api/upload/catalog', {
            method: 'POST',
            body: formData
          })

          const rawText = await res.text()
          let data: any = {}
          try {
            data = JSON.parse(rawText)
          } catch {
            throw new Error(`Servidor retornou erro (${res.status}): ${rawText.slice(0, 120)}`)
          }

          if (!res.ok) {
            throw new Error(data.error || 'Erro no upload do catálogo.')
          }

          publicUrl = data.catalog?.file_url || ''
        }

        const title = file.name.replace(/\.[^/.]+$/, '').trim()

        if (publicUrl) {
          // Grava o registro do catálogo no banco de dados
          await supabase
            .from('supplier_catalogs')
            .insert({
              supplier_id: supplierId,
              title,
              file_url: publicUrl,
              file_name: file.name,
              file_size_bytes: file.size,
              file_type: isPdf ? 'PDF' : 'IMAGEM'
            })
        }
      }

      notify({ type: 'success', title: 'Sucesso', message: 'Catálogo enviado com sucesso!' })
      await fetchCatalogs()
    } catch (err: any) {
      console.error(err)
      notify({ type: 'error', title: 'Erro', message: err.message || 'Falha ao enviar arquivo.' })
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true)
    else if (e.type === 'dragleave') setDragActive(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleAddLink = async () => {
    if (!linkTitle.trim() || !linkUrl.trim()) return
    setUploading(true)
    try {
      const { error } = await supabase
        .from('supplier_catalogs')
        .insert({
          supplier_id: supplierId,
          title: linkTitle.trim(),
          file_url: linkUrl.trim(),
          file_type: 'LINK',
        })

      if (error) throw error

      notify({ type: 'success', title: 'Sucesso', message: 'Link adicionado com sucesso!' })
      setShowLinkForm(false)
      setLinkTitle('')
      setLinkUrl('')
      await fetchCatalogs()
    } catch (err: any) {
      console.error(err)
      notify({ type: 'error', title: 'Erro', message: err.message || 'Falha ao adicionar link.' })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, fileUrl: string, fileType?: string) => {
    try {
      await supabase.from('supplier_catalogs').delete().eq('id', id)
      
      if (fileType === 'PDF' || fileType === 'IMAGEM') {
        const urlParts = (fileUrl || '').split('/')
        const fileName = urlParts.slice(-2).join('/')
        await supabase.storage.from('supplier-catalogs').remove([fileName])
      }
      
      notify({ type: 'success', title: 'Sucesso', message: 'Catálogo removido.' })
      await fetchCatalogs()
    } catch (err: any) {
      console.error(err)
      notify({ type: 'error', title: 'Erro', message: 'Não foi possível remover.' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dropzone PDF / Imagem */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer flex flex-col justify-center items-center h-40 ${
            dragActive ? 'border-[#1f2328] bg-[#f5f5f5]' : 'border-[#d0d0d0] hover:border-[#bbb] hover:bg-[#fafafa]'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*"
            multiple
            className="hidden"
            onChange={e => {
              if (e.target.files?.length) handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
          {uploading && !showLinkForm ? (
            <>
              <Loader2 className="w-8 h-8 text-[#1f2328] animate-spin mb-2" />
              <p className="text-[13px] text-[#333] font-bold">Enviando catálogo...</p>
              <p className="text-[11px] text-[#999] mt-0.5">Salvando no Supabase Storage</p>
            </>
          ) : (
            <>
              <UploadCloud className="w-8 h-8 text-[#1f2328] mb-2" />
              <p className="text-[13px] text-[#333] font-bold">Enviar Catálogo (PDF ou Imagem)</p>
              <p className="text-[11px] text-[#888] mt-1">Arraste ou clique para selecionar (até 50MB)</p>
            </>
          )}
        </div>

        {/* Link Form */}
        <div className="border border-[#e6e6e6] rounded-xl p-5 flex flex-col justify-center bg-[#fafafa]">
          {showLinkForm ? (
            <div className="space-y-3">
              <div>
                <Label className="text-[11px] text-[#666] mb-1 font-bold">Título do Catálogo</Label>
                <Input value={linkTitle} onChange={e=>setLinkTitle(e.target.value)} placeholder="Ex: Catálogo Verão 2026" className="h-8 text-xs bg-white" />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1 font-bold">Link (URL)</Label>
                <Input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} placeholder="https://..." className="h-8 text-xs bg-white" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button 
            size="sm" 
            variant="default" 
            onClick={handleAddLink} 
            disabled={uploading || !linkTitle || !linkUrl} 
            className="h-9 text-xs px-4 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold rounded-xl shadow-2xs"
          >
            Salvar Link
          </Button>
                <Button size="sm" variant="outline" onClick={() => setShowLinkForm(false)} disabled={uploading} className="h-8 text-xs px-3">
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <LinkIcon className="w-8 h-8 text-[#999] mx-auto mb-2" />
              <p className="text-[13px] text-[#333] font-bold">Cadastrar Link</p>
              <p className="text-[11px] text-[#999] mt-1 mb-3">Google Drive, Site, OneDrive, etc.</p>
              <Button variant="outline" size="sm" onClick={() => setShowLinkForm(true)} className="h-8 text-xs px-4 border-[#ddd]">
                <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar Link
              </Button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#999]" />
        </div>
      ) : catalogs.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {catalogs.map(cat => {
            const rawUrl = cat.file_url || (cat as any).url || ''
            const url = rawUrl.includes('/storage/v1/object/public/')
              ? `/storage/${rawUrl.split('/storage/v1/object/public/')[1]}`
              : rawUrl
            const type = (cat.file_type || (cat as any).type || '').toUpperCase()
            const isPdf = type === 'PDF' || url.toLowerCase().includes('.pdf')
            const isImage = type === 'IMAGEM' || url.match(/\.(jpeg|jpg|png|webp|gif)/i)

            return (
              <div key={cat.id} className="relative group border border-[#e6e6e6] rounded-xl bg-white overflow-hidden flex flex-col shadow-2xs hover:shadow-sm transition-all">
                <a href={url} target="_blank" rel="noopener noreferrer" className="flex-1 p-4 flex flex-col items-center justify-center bg-[#fcfcfc] hover:bg-[#f5f5f5] transition-colors cursor-pointer">
                  {isPdf ? (
                    <FileText className="w-10 h-10 text-[#e74c3c] mb-2" />
                  ) : isImage ? (
                    <ImageIcon className="w-10 h-10 text-[#16a34a] mb-2" />
                  ) : (
                    <LinkIcon className="w-10 h-10 text-[#1f2328] mb-2" />
                  )}
                  <span className="text-[11px] text-center font-bold text-[#333] line-clamp-2 w-full" title={cat.title}>
                    {cat.title}
                  </span>
                  <span className="text-[9px] font-extrabold text-[#999] uppercase mt-1.5 px-2 py-0.5 rounded-full bg-[#eee]">
                    {type || (isPdf ? 'PDF' : isImage ? 'IMAGEM' : 'LINK')}
                  </span>
                </a>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); handleDelete(cat.id, url, type) }}
                  className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-white/95 text-[#e74c3c] shadow-sm hover:bg-[#e74c3c] hover:text-white opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-[13px] text-[#999] text-center py-4 border border-dashed border-[#e6e6e6] rounded-xl">
          Nenhum catálogo cadastrado.
        </p>
      )}
    </div>
  )
}
