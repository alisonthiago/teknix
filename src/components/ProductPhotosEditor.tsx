'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ImageIcon, Star, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import { useNotification } from '@/contexts/NotificationContext'
import { Button } from '@/components/ui/button'

interface ProductImage {
  id: string
  url: string
  is_primary: boolean
  sort_order: number
}

export default function ProductPhotosEditor({ productId }: { productId: string }) {
  const supabase = createClient()
  const { notify } = useNotification()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [images, setImages] = useState<ProductImage[]>([])
  const [loading, setLoading] = useState(true)
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)

  const fetchImages = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('is_primary', { ascending: false })
      .order('sort_order', { ascending: true })

    if (!error && data) {
      setImages(data)
    }
    setLoading(false)
  }, [productId, supabase])

  useEffect(() => {
    fetchImages()
  }, [fetchImages])

  const handleFiles = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => f.type.startsWith('image/'))
    if (validFiles.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < validFiles.length; i++) {
        const file = validFiles[i]
        const ext = file.name.split('.').pop() || 'jpg'
        const fileName = `${productId}/${Date.now()}-${i}.${ext}`

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(fileName)

        // Insert into table
        const { error: dbError } = await supabase
          .from('product_images')
          .insert({
            product_id: productId,
            url: urlData.publicUrl,
            is_primary: images.length === 0 && i === 0, // make primary if it's the first image ever
            sort_order: images.length + i,
          })

        if (dbError) throw dbError
      }

      notify({
        type: 'success',
        title: 'Sucesso',
        message: 'Foto(s) adicionada(s) com sucesso!'
      })
      fetchImages()
    } catch (err) {
      console.error('Upload error:', err)
      notify({
        type: 'error',
        title: 'Erro',
        message: err instanceof Error ? err.message : (err as any)?.message || 'Falha ao enviar fotos.'
      })
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

  const handleDelete = async (imageId: string, url: string) => {
    try {
      // Delete from DB
      await supabase.from('product_images').delete().eq('id', imageId)

      // Try to delete from storage as well
      try {
        const urlParts = url.split('/')
        const fileName = urlParts.slice(-2).join('/') // gets "productId/filename.jpg"
        await supabase.storage.from('product-images').remove([fileName])
      } catch (e) {
        console.warn('Could not delete from storage:', e)
      }

      notify({
        type: 'success',
        title: 'Sucesso',
        message: 'Foto removida.'
      })
      fetchImages()
    } catch (err) {
      console.error('Delete error:', err)
      notify({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível remover a foto.'
      })
    }
  }

  const handleSetPrimary = async (imageId: string) => {
    try {
      // Set all to false
      await supabase
        .from('product_images')
        .update({ is_primary: false })
        .eq('product_id', productId)

      // Set target to true
      await supabase
        .from('product_images')
        .update({ is_primary: true })
        .eq('id', imageId)

      notify({
        type: 'success',
        title: 'Sucesso',
        message: 'Foto principal atualizada.'
      })
      fetchImages()
    } catch (err) {
      console.error('Set primary error:', err)
      notify({
        type: 'error',
        title: 'Erro',
        message: 'Não foi possível atualizar a foto principal.'
      })
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
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
          accept="image/*"
          multiple
          className="hidden"
          onChange={e => {
            if (e.target.files?.length) handleFiles(e.target.files)
            e.target.value = ''
          }}
        />
        {uploading ? (
          <div className="flex flex-col items-center py-2">
            <Loader2 className="w-8 h-8 text-[#3483fa] animate-spin mb-2" />
            <p className="text-[13px] text-[#666]">Enviando fotos...</p>
          </div>
        ) : (
          <>
            <ImageIcon className="w-8 h-8 text-[#ccc] mx-auto mb-2" />
            <p className="text-[13px] text-[#666]">Arraste fotos ou clique para enviar</p>
            <p className="text-[11px] text-[#999] mt-1">JPG, PNG ou WebP. Máximo 5MB por arquivo.</p>
          </>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#999]" />
        </div>
      ) : images.length > 0 ? (
        <div className="flex gap-3 flex-wrap">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              <div className="w-24 h-24 rounded-lg overflow-hidden border border-[#e6e6e6] bg-[#f5f5f5]">
                <img src={img.url} alt="Produto" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSetPrimary(img.id) }}
                    className="p-1.5 rounded-full bg-[#3483fa] text-white shadow-sm hover:bg-[#2968c8]"
                    title="Definir como principal"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDelete(img.id, img.url) }}
                  className="p-1.5 rounded-full bg-[#e74c3c] text-white shadow-sm hover:bg-[#c0392b]"
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {img.is_primary && (
                <div className="absolute bottom-0 inset-x-0 bg-[#3483fa]/90 text-white text-[10px] text-center py-0.5 font-medium">
                  Principal
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-[#999] text-center py-2">Nenhuma foto cadastrada para este produto.</p>
      )}
    </div>
  )
}
