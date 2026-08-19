'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { FileText, Link as LinkIcon, Trash2, Loader2, UploadCloud, Plus } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useNotification } from '@/contexts/NotificationContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Catalog {
  id: string
  title: string
  url: string
  type: 'PDF' | 'LINK'
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
    const validFiles = Array.from(files).filter(f => f.type === 'application/pdf')
    if (validFiles.length === 0) {
      notify({ type: 'error', title: 'Erro', message: 'Por favor, envie apenas arquivos PDF.' })
      return
    }

    setUploading(true)
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        const fileName = `${supplierId}/${Date.now()}-${Math.random().toString(36).substring(7)}.pdf`

        const { error: uploadError } = await supabase.storage
          .from('supplier-catalogs')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage
          .from('supplier-catalogs')
          .getPublicUrl(fileName)

        const { error: dbError } = await supabase
          .from('supplier_catalogs')
          .insert({
            supplier_id: supplierId,
            title: file.name.replace('.pdf', ''),
            url: urlData.publicUrl,
            type: 'PDF',
          })

        if (dbError) throw dbError
      }

      notify({ type: 'success', title: 'Sucesso', message: 'Catálogo(s) em PDF adicionado(s) com sucesso!' })
      fetchCatalogs()
    } catch (err) {
      console.error(err)
      notify({ type: 'error', title: 'Erro', message: 'Falha ao enviar PDF.' })
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
          url: linkUrl.trim(),
          type: 'LINK',
        })

      if (error) throw error

      notify({ type: 'success', title: 'Sucesso', message: 'Link adicionado com sucesso!' })
      setShowLinkForm(false)
      setLinkTitle('')
      setLinkUrl('')
      fetchCatalogs()
    } catch (err) {
      console.error(err)
      notify({ type: 'error', title: 'Erro', message: 'Falha ao adicionar link.' })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, url: string, type: string) => {
    try {
      await supabase.from('supplier_catalogs').delete().eq('id', id)
      
      if (type === 'PDF') {
        const urlParts = url.split('/')
        const fileName = urlParts.slice(-2).join('/')
        await supabase.storage.from('supplier-catalogs').remove([fileName])
      }
      
      notify({ type: 'success', title: 'Sucesso', message: 'Catálogo removido.' })
      fetchCatalogs()
    } catch (err) {
      console.error(err)
      notify({ type: 'error', title: 'Erro', message: 'Não foi possível remover.' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dropzone PDF */}
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer flex flex-col justify-center items-center h-40 ${
            dragActive ? 'border-[#3483fa] bg-[#f0f7ff]' : 'border-[#d0d0d0] hover:border-[#bbb] hover:bg-[#fafafa]'
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
            accept="application/pdf"
            multiple
            className="hidden"
            onChange={e => {
              if (e.target.files?.length) handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
          {uploading && !showLinkForm ? (
            <>
              <Loader2 className="w-8 h-8 text-[#3483fa] animate-spin mb-2" />
              <p className="text-[13px] text-[#666]">Processando...</p>
            </>
          ) : (
            <>
              <UploadCloud className="w-8 h-8 text-[#ccc] mb-2" />
              <p className="text-[13px] text-[#666] font-medium">Enviar PDF</p>
              <p className="text-[11px] text-[#999] mt-1">Arraste ou clique para selecionar</p>
            </>
          )}
        </div>

        {/* Link Form */}
        <div className="border border-[#e6e6e6] rounded-lg p-5 flex flex-col justify-center bg-[#fafafa]">
          {showLinkForm ? (
            <div className="space-y-3">
              <div>
                <Label className="text-[11px] text-[#666] mb-1">Título do Catálogo</Label>
                <Input value={linkTitle} onChange={e=>setLinkTitle(e.target.value)} placeholder="Ex: Catálogo Verão 2026" className="h-8 text-xs" />
              </div>
              <div>
                <Label className="text-[11px] text-[#666] mb-1">Link (URL)</Label>
                <Input value={linkUrl} onChange={e=>setLinkUrl(e.target.value)} placeholder="https://..." className="h-8 text-xs" />
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="default" onClick={handleAddLink} disabled={uploading || !linkTitle || !linkUrl} className="h-8 text-xs px-3">
                  Salvar Link
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowLinkForm(false)} disabled={uploading} className="h-8 text-xs px-3">
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <LinkIcon className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
              <p className="text-[13px] text-[#666] font-medium">Cadastrar Link</p>
              <p className="text-[11px] text-[#999] mt-1 mb-3">Google Drive, Site, etc.</p>
              <Button variant="outline" size="sm" onClick={() => setShowLinkForm(true)} className="h-8 text-xs px-4">
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
          {catalogs.map(cat => (
            <div key={cat.id} className="relative group border border-[#e6e6e6] rounded-lg bg-white overflow-hidden flex flex-col">
              <a href={cat.url} target="_blank" rel="noopener noreferrer" className="flex-1 p-4 flex flex-col items-center justify-center bg-[#fcfcfc] hover:bg-[#f5f5f5] transition-colors cursor-pointer">
                {cat.type === 'PDF' ? (
                  <FileText className="w-10 h-10 text-[#e74c3c] mb-2" />
                ) : (
                  <LinkIcon className="w-10 h-10 text-[#3483fa] mb-2" />
                )}
                <span className="text-[11px] text-center font-medium text-[#333] line-clamp-2 w-full" title={cat.title}>
                  {cat.title}
                </span>
                <span className="text-[9px] text-[#999] uppercase mt-1">{cat.type}</span>
              </a>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleDelete(cat.id, cat.url, cat.type) }}
                className="absolute top-1.5 right-1.5 p-1.5 rounded-full bg-white/90 text-[#e74c3c] shadow-sm hover:bg-[#e74c3c] hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                title="Remover"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-[#999] text-center py-4 border border-dashed border-[#e6e6e6] rounded-lg">
          Nenhum catálogo cadastrado.
        </p>
      )}
    </div>
  )
}
