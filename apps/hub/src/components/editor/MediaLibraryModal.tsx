import React, { useState, useEffect, useRef } from 'react'
import {
  X, UploadCloud, Search, Check, Trash2, Link as LinkIcon, Image as ImageIcon,
  Film, FileText, CheckCircle2, Globe, Sparkles, RefreshCw
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { MediaItem } from '../../types/pageBuilder'
import './MediaLibraryModal.css'

interface MediaLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectMedia: (url: string, item?: MediaItem) => void
  allowedType?: 'all' | 'image' | 'video' | 'file'
  title?: string
}

// Curated default high-resolution assets for TEKNIX & Industrial Store
const DEFAULT_MEDIA_ASSETS: Partial<MediaItem>[] = [
  {
    id: 'asset-1',
    name: 'Poste_DPA-990_Cidade_1254x1254.png',
    file_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
    file_type: 'image/png',
    file_size: 485000,
    alt: 'Poste DPA 990 Iluminação Pública',
    folder: 'iluminacao',
  },
  {
    id: 'asset-2',
    name: 'Poste_DPA-990_Cidade_1920x1080.jpg',
    file_url: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=1200&auto=format&fit=crop&q=80',
    file_type: 'image/jpeg',
    file_size: 640000,
    alt: 'Poste Iluminação Noturna',
    folder: 'iluminacao',
  },
  {
    id: 'asset-3',
    name: 'dds copiar 3.png',
    file_url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=1200&auto=format&fit=crop&q=80',
    file_type: 'image/png',
    file_size: 320000,
    alt: 'Ferramenta Industrial TEKNIX',
    folder: 'ferramentas',
  },
  {
    id: 'asset-4',
    name: 'Sem Título-2 copiar.png',
    file_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
    file_type: 'image/png',
    file_size: 512000,
    alt: 'Estrutura e Montagem Industrial',
    folder: 'estruturas',
  },
  {
    id: 'asset-5',
    name: 'DC-02-37.jpg',
    file_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop&q=80',
    file_type: 'image/jpeg',
    file_size: 420000,
    alt: 'Refletor LED Alta Potência',
    folder: 'refletores',
  },
  {
    id: 'asset-6',
    name: 'DC-04-DIMENSAO-1.png',
    file_url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=1200&auto=format&fit=crop&q=80',
    file_type: 'image/png',
    file_size: 290000,
    alt: 'Módulo de Iluminação',
    folder: 'modulos',
  },
  {
    id: 'asset-7',
    name: 'DC-01-DIMENSAO.png',
    file_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1200&auto=format&fit=crop&q=80',
    file_type: 'image/png',
    file_size: 380000,
    alt: 'Cruzeta e Fixação',
    folder: 'acessorios',
  },
  {
    id: 'asset-8',
    name: 'DC-02-36.jpg',
    file_url: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=1200&auto=format&fit=crop&q=80',
    file_type: 'image/jpeg',
    file_size: 450000,
    alt: 'Refletor IP66 Prova Dágua',
    folder: 'refletores',
  },
  {
    id: 'asset-9',
    name: 'projetor led.png',
    file_url: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=1200&auto=format&fit=crop&q=80',
    file_type: 'image/png',
    file_size: 410000,
    alt: 'Projetor LED Industrial',
    folder: 'projetores',
  },
  {
    id: 'asset-10',
    name: 'DL-551-0.png',
    file_url: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?w=1200&auto=format&fit=crop&q=80',
    file_type: 'image/png',
    file_size: 360000,
    alt: 'Braço de Iluminação',
    folder: 'bracos',
  },
  {
    id: 'asset-11',
    name: 'DC-03-101.jpg',
    file_url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
    file_type: 'image/jpeg',
    file_size: 530000,
    alt: 'Poste Triplo Esportivo',
    folder: 'postes',
  },
  {
    id: 'asset-12',
    name: 'Refletor-30W-IP66-casa-jardim.png',
    file_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
    file_type: 'image/png',
    file_size: 470000,
    alt: 'Refletor TEKNIX 30W',
    folder: 'refletores',
  }
]

export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelectMedia,
  allowedType = 'all',
  title = 'Inserir mídia'
}: MediaLibraryModalProps) {
  const [activeAction, setActiveAction] = useState<'insert' | 'url'>('insert')
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library')
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlPreviewValid, setUrlPreviewValid] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadMedia()
    }
  }, [isOpen])

  async function loadMedia() {
    try {
      // 1. Fetch from Supabase media table
      const { data: dbMedia, error } = await supabase
        .from('media')
        .select('*')
        .order('created_at', { ascending: false })

      // 2. Fetch from localStorage cache
      let localMedia: MediaItem[] = []
      try {
        const saved = localStorage.getItem('teknix_media_library')
        if (saved) localMedia = JSON.parse(saved)
      } catch {
        localMedia = []
      }

      // Combine DB + local + default assets avoiding duplicates
      const all: MediaItem[] = []
      const seenUrls = new Set<string>()

      if (dbMedia && !error) {
        for (const item of dbMedia) {
          if (!seenUrls.has(item.file_url)) {
            seenUrls.add(item.file_url)
            all.push(item)
          }
        }
      }

      for (const item of localMedia) {
        if (!seenUrls.has(item.file_url)) {
          seenUrls.add(item.file_url)
          all.push(item)
        }
      }

      for (const asset of DEFAULT_MEDIA_ASSETS) {
        if (asset.file_url && !seenUrls.has(asset.file_url)) {
          seenUrls.add(asset.file_url)
          all.push(asset as MediaItem)
        }
      }

      setMediaList(all)
      if (all.length > 0 && !selectedMedia) {
        setSelectedMedia(all[0])
      }
    } catch (e) {
      console.warn('Could not fetch media from DB, using fallback:', e)
      setMediaList(DEFAULT_MEDIA_ASSETS as MediaItem[])
    }
  }

  async function handleFileUpload(files: FileList | File[]) {
    if (!files || files.length === 0) return
    setIsUploading(true)

    const newItems: MediaItem[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const fileName = file.name
      const fileType = file.type
      const fileSize = file.size

      let publicUrl = ''

      try {
        // Try uploading to Supabase Storage bucket 'product-images' (fallback to 'company-assets')
        const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
        const filePath = `uploads/${Date.now()}-${safeName}`
        
        let uploadRes = await supabase.storage
          .from('product-images')
          .upload(filePath, file, { upsert: true })

        if (uploadRes.error) {
          uploadRes = await supabase.storage
            .from('company-assets')
            .upload(filePath, file, { upsert: true })
          
          if (!uploadRes.error) {
            const { data: urlData } = supabase.storage.from('company-assets').getPublicUrl(filePath)
            publicUrl = urlData.publicUrl
          }
        } else {
          const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(filePath)
          publicUrl = urlData.publicUrl
        }
      } catch {
        // Storage upload fallback
      }

      if (!publicUrl) {
        // Create local object URL / base64 fallback
        publicUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = () => resolve(URL.createObjectURL(file))
          reader.readAsDataURL(file)
        })
      }

      // Save to Supabase media table
      let insertedItem: MediaItem | null = null
      try {
        const { data, error } = await supabase
          .from('media')
          .insert({
            name: fileName,
            file_url: publicUrl,
            file_type: fileType,
            file_size: fileSize,
            alt: fileName.split('.')[0],
            folder: 'uploads',
          })
          .select()
          .single()

        if (!error && data) {
          insertedItem = data as MediaItem
        }
      } catch {
        // Table insert fallback
      }

      if (!insertedItem) {
        insertedItem = {
          id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: fileName,
          file_url: publicUrl,
          file_type: fileType,
          file_size: fileSize,
          alt: fileName.split('.')[0],
          folder: 'uploads',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        } as MediaItem
      }

      newItems.push(insertedItem)
    }

    // Update state and local storage cache
    setMediaList((prev) => {
      const updated = [...newItems, ...prev]
      try {
        localStorage.setItem('teknix_media_library', JSON.stringify(updated.slice(0, 100)))
      } catch {}
      return updated
    })

    if (newItems.length > 0) {
      setSelectedMedia(newItems[0])
    }

    setIsUploading(false)
    setActiveTab('library')
  }

  async function handleDeleteSelected() {
    if (!selectedMedia) return
    const confirm = window.confirm(`Deseja excluir permanentemente o arquivo "${selectedMedia.name}"?`)
    if (!confirm) return

    try {
      if (selectedMedia.id && !selectedMedia.id.startsWith('asset-')) {
        await supabase.from('media').delete().eq('id', selectedMedia.id)
      }
    } catch {}

    const updated = mediaList.filter(item => item.id !== selectedMedia.id && item.file_url !== selectedMedia.file_url)
    setMediaList(updated)
    try {
      localStorage.setItem('teknix_media_library', JSON.stringify(updated.slice(0, 100)))
    } catch {}
    setSelectedMedia(updated[0] || null)
  }

  function handleInsertFromUrl() {
    if (!urlInput.trim()) return
    const name = urlInput.split('/').pop()?.split('?')[0] || 'Imagem Externa'
    const newItem: MediaItem = {
      id: `url-${Date.now()}`,
      name,
      file_url: urlInput.trim(),
      file_type: 'image/jpeg',
      file_size: 0,
      alt: name,
      folder: 'externo',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as MediaItem

    onSelectMedia(urlInput.trim(), newItem)
    onClose()
  }

  function handleConfirmSelection() {
    if (!selectedMedia) return
    onSelectMedia(selectedMedia.file_url, selectedMedia)
    onClose()
  }

  if (!isOpen) return null

  const filteredMedia = mediaList.filter(item => {
    if (searchQuery) {
      return (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
             (item.alt || '').toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  return (
    <div className="elementor-media-modal-overlay" onClick={onClose}>
      <div className="elementor-media-modal" onClick={e => e.stopPropagation()}>
        {/* MODAL HEADER */}
        <div className="elementor-media-modal-header">
          <h2 className="elementor-media-modal-title">{title}</h2>
          <button className="elementor-media-modal-close" onClick={onClose} title="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="elementor-media-modal-body">
          {/* LEFT SIDEBAR (Ações) */}
          <div className="elementor-media-modal-sidebar">
            <div className="elementor-media-sidebar-section-title">Ações</div>
            <ul className="elementor-media-sidebar-nav">
              <li
                className={`elementor-media-sidebar-nav-item ${activeAction === 'insert' ? 'active' : ''}`}
                onClick={() => setActiveAction('insert')}
              >
                <ImageIcon size={16} />
                <span>Inserir mídia</span>
              </li>
              <li
                className={`elementor-media-sidebar-nav-item ${activeAction === 'url' ? 'active' : ''}`}
                onClick={() => setActiveAction('url')}
              >
                <LinkIcon size={16} />
                <span>Inserir a partir do URL</span>
              </li>
            </ul>
          </div>

          {/* MAIN CONTENT */}
          <div className="elementor-media-modal-main">
            {activeAction === 'insert' ? (
              <>
                {/* SUB HEADER (Tabs & Search) */}
                <div className="elementor-media-sub-header">
                  <div className="elementor-media-tabs">
                    <button
                      className={`elementor-media-tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
                      onClick={() => setActiveTab('upload')}
                    >
                      <UploadCloud size={15} />
                      Enviar arquivos
                    </button>
                    <button
                      className={`elementor-media-tab-btn ${activeTab === 'library' ? 'active' : ''}`}
                      onClick={() => setActiveTab('library')}
                    >
                      <ImageIcon size={15} />
                      Biblioteca de mídia ({mediaList.length})
                    </button>
                  </div>

                  {activeTab === 'library' && (
                    <div className="elementor-media-search-box">
                      <label className="elementor-media-search-label">Pesquisar mídia</label>
                      <input
                        type="text"
                        className="elementor-media-search-input"
                        placeholder="Filtrar por nome..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                {/* TAB CONTENT: Upload or Library Grid */}
                {activeTab === 'upload' ? (
                  <div
                    className={`elementor-media-upload-zone ${isDragOver ? 'drag-active' : ''}`}
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={e => {
                      e.preventDefault()
                      setIsDragOver(false)
                      handleFileUpload(e.dataTransfer.files)
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      multiple
                      accept="image/*,video/*,.pdf"
                      onChange={e => e.target.files && handleFileUpload(e.target.files)}
                    />
                    <UploadCloud size={64} className="elementor-media-upload-icon" />
                    <h3 className="elementor-media-upload-title">Solte os arquivos para envio</h3>
                    <p className="elementor-media-upload-sub">ou</p>
                    <button
                      type="button"
                      className="elementor-media-select-files-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? 'Enviando...' : 'Selecionar arquivos'}
                    </button>
                    <p className="elementor-media-upload-limit">Tamanho máximo de upload: 512 MB.</p>
                  </div>
                ) : (
                  <div className="elementor-media-content-container">
                    {/* Media Grid */}
                    <div className="elementor-media-grid-wrapper">
                      <div className="elementor-media-grid">
                        {filteredMedia.map(item => {
                          const isSelected = selectedMedia?.file_url === item.file_url
                          return (
                            <div
                              key={item.id || item.file_url}
                              className={`elementor-media-card ${isSelected ? 'selected' : ''}`}
                              onClick={() => setSelectedMedia(item)}
                              onDoubleClick={() => {
                                setSelectedMedia(item)
                                onSelectMedia(item.file_url, item)
                                onClose()
                              }}
                            >
                              <img src={item.file_url} alt={item.name} className="elementor-media-card-thumb" loading="lazy" />
                              <div className="elementor-media-card-check">
                                <Check size={14} strokeWidth={3} />
                              </div>
                              <div className="elementor-media-card-caption">{item.name}</div>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Right Details Sidebar */}
                    {selectedMedia && (
                      <div className="elementor-media-details-sidebar">
                        <div className="elementor-media-details-title">Detalhes do anexo</div>
                        <img src={selectedMedia.file_url} alt={selectedMedia.name} className="elementor-media-details-preview" />
                        <div className="elementor-media-details-meta">
                          <strong>{selectedMedia.name}</strong>
                          <div>{selectedMedia.file_type || 'image/jpeg'}</div>
                          {selectedMedia.file_size ? <div>{(selectedMedia.file_size / 1024).toFixed(0)} KB</div> : null}
                          <div>{selectedMedia.created_at ? new Date(selectedMedia.created_at).toLocaleDateString('pt-BR') : 'Hoje'}</div>
                        </div>

                        <div className="elementor-media-details-form-group">
                          <label className="elementor-media-details-label">Texto alternativo (Alt)</label>
                          <input
                            type="text"
                            className="elementor-media-details-input"
                            value={selectedMedia.alt || ''}
                            onChange={e => setSelectedMedia({ ...selectedMedia, alt: e.target.value })}
                            placeholder="Descreva o propósito da imagem"
                          />
                        </div>

                        <div className="elementor-media-details-form-group">
                          <label className="elementor-media-details-label">URL do arquivo</label>
                          <input
                            type="text"
                            className="elementor-media-details-input"
                            readOnly
                            value={selectedMedia.file_url}
                            onClick={e => (e.target as HTMLInputElement).select()}
                          />
                        </div>

                        <button
                          type="button"
                          className="elementor-media-delete-btn"
                          onClick={handleDeleteSelected}
                        >
                          Excluir permanentemente
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* INSERT FROM URL */
              <div className="elementor-media-url-container">
                <h3 className="elementor-media-url-title">Inserir a partir do URL</h3>
                <div className="elementor-media-url-input-row">
                  <input
                    type="text"
                    className="elementor-media-url-input"
                    placeholder="https://exemplo.com/imagem.png ou .mp4"
                    value={urlInput}
                    onChange={e => {
                      setUrlInput(e.target.value)
                      setUrlPreviewValid(true)
                    }}
                  />
                  <button
                    type="button"
                    className="elementor-media-submit-btn"
                    onClick={handleInsertFromUrl}
                    disabled={!urlInput.trim()}
                  >
                    Inserir na página
                  </button>
                </div>

                {urlInput.trim() && (
                  <div className="elementor-media-url-preview-box">
                    <img
                      src={urlInput.trim()}
                      alt="Prévia"
                      className="elementor-media-url-preview-img"
                      onError={() => setUrlPreviewValid(false)}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MODAL FOOTER */}
        <div className="elementor-media-modal-footer">
          <div className="elementor-media-footer-info">
            {selectedMedia ? `${selectedMedia.name} selecionado` : 'Nenhum arquivo selecionado'}
          </div>
          <button
            type="button"
            className="elementor-media-submit-btn"
            disabled={!selectedMedia}
            onClick={handleConfirmSelection}
          >
            Selecionar
          </button>
        </div>
      </div>
    </div>
  )
}
