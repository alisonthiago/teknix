import React, { useState, useEffect, useRef } from 'react'
import {
  X, UploadCloud, Search, Check, Image as ImageIcon,
  CheckCircle2, RefreshCw, AlertTriangle, Link as LinkIcon, Filter, Maximize2
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import './MediaLibraryModal.css'

export interface MediaItem {
  id: string
  name: string
  file_url: string
  file_size?: number
  width?: number
  height?: number
  category?: 'ads' | 'products' | 'uploads' | 'system'
  created_at?: string | null
}

const isVideoUrl = (url = '') => /\.(mp4|webm|mov)(\?|$)/i.test(url)

function getAspectRatioLabel(w?: number, h?: number): string | null {
  if (!w || !h) return null
  const ratio = w / h
  if (Math.abs(ratio - 1) < 0.05) return '1:1 (Quadrado)'
  if (ratio >= 2.4) return `${(w / h).toFixed(1)}:1 (Ultra-Wide)`
  if (Math.abs(ratio - 16 / 9) < 0.08) return '16:9 (Widescreen)'
  if (Math.abs(ratio - 4 / 3) < 0.08) return '4:3 (Paisagem)'
  if (Math.abs(ratio - 9 / 16) < 0.08) return '9:16 (Vertical)'
  if (ratio < 0.9) return 'Retrato'
  return `${w}:${h}`
}

interface MediaLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectMedia: (url: string, meta?: { width?: number; height?: number; name?: string }) => void
  expectedSize?: { width: number; height: number; label: string }
  deviceLabel?: string
  title?: string
}

export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelectMedia,
  expectedSize,
  deviceLabel = 'Dispositivo',
  title = 'Biblioteca de Mídia'
}: MediaLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'upload' | 'url'>('library')
  const [mediaList, setMediaList] = useState<MediaItem[]>([])
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<'all' | 'ads' | 'products' | 'uploads'>('all')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [urlPreviewValid, setUrlPreviewValid] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [thumbnailDensity, setThumbnailDensity] = useState<'sm' | 'md' | 'lg'>('md')
  const [objectFitMode, setObjectFitMode] = useState<'contain' | 'cover'>('contain')
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      loadAllSystemMedia()
    }
  }, [isOpen])

  // Busca fotos de todos os locais do sistema: Anúncios, Produtos, Buckets e Tabela Media
  async function loadAllSystemMedia() {
    setLoading(true)
    const items: MediaItem[] = []
    const seen = new Set<string>()

    const addItem = (item: MediaItem) => {
      if (!item.file_url || seen.has(item.file_url)) return
      seen.add(item.file_url)
      items.push(item)
    }

    try {
      // 1. Fotos cadastradas em Anúncios (ads e items de carrossel)
      const { data: adsData } = await supabase.from('ads').select('*').order('created_at', { ascending: false })
      if (adsData) {
        for (const ad of adsData) {
          if (ad.image_url) {
            addItem({
              id: `ad-${ad.id}-main`,
              name: ad.name ? `${ad.name} (Principal)` : 'Banner de Anúncio',
              file_url: ad.image_url,
              category: 'ads',
              created_at: ad.created_at
            })
          }
          if (Array.isArray(ad.items)) {
            ad.items.forEach((it: any, idx: number) => {
              if (it.image_url) {
                addItem({
                  id: `ad-${ad.id}-item-${idx}`,
                  name: it.title || `${ad.name} (Slide ${idx + 1})`,
                  file_url: it.image_url,
                  category: 'ads',
                  created_at: ad.created_at
                })
              }
              if (it.tablet_image_url) {
                addItem({
                  id: `ad-${ad.id}-item-${idx}-tablet`,
                  name: `${it.title || ad.name} (Tablet)`,
                  file_url: it.tablet_image_url,
                  category: 'ads',
                  created_at: ad.created_at
                })
              }
              if (it.mobile_image_url) {
                addItem({
                  id: `ad-${ad.id}-item-${idx}-mobile`,
                  name: `${it.title || ad.name} (Celular)`,
                  file_url: it.mobile_image_url,
                  category: 'ads',
                  created_at: ad.created_at
                })
              }
            })
          }
        }
      }

      // 2. Fotos do storage bucket 'media/ads'
      try {
        const { data: storageFiles } = await supabase.storage.from('media').list('ads', { limit: 100 })
        if (storageFiles) {
          for (const f of storageFiles) {
            if (f.name && !f.name.startsWith('.')) {
              const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(`ads/${f.name}`)
              if (publicUrlData?.publicUrl) {
                addItem({
                  id: `storage-media-ads-${f.name}`,
                  name: f.name,
                  file_url: publicUrlData.publicUrl,
                  file_size: f.metadata?.size,
                  category: 'ads',
                  created_at: f.created_at
                })
              }
            }
          }
        }
      } catch (err) {
        console.warn('Bucket media list failed:', err)
      }

      // 3. Fotos de Produtos da Loja
      const { data: productsData } = await supabase.from('products').select('id, name, image_url, images').limit(60)
      if (productsData) {
        for (const prod of productsData) {
          if (prod.image_url) {
            addItem({
              id: `prod-${prod.id}`,
              name: prod.name || 'Foto de Produto',
              file_url: prod.image_url,
              category: 'products'
            })
          }
          if (Array.isArray(prod.images)) {
            prod.images.forEach((imgUrl: string, idx: number) => {
              if (typeof imgUrl === 'string' && imgUrl) {
                addItem({
                  id: `prod-${prod.id}-${idx}`,
                  name: `${prod.name} (Galeria ${idx + 1})`,
                  file_url: imgUrl,
                  category: 'products'
                })
              }
            })
          }
        }
      }

      // 4. Tabela 'media' geral se existir
      try {
        const { data: mediaDb } = await supabase.from('media').select('*').order('created_at', { ascending: false }).limit(80)
        if (mediaDb) {
          for (const m of mediaDb) {
            addItem({
              id: `m-${m.id}`,
              name: m.name || m.alt || 'Imagem do Sistema',
              file_url: m.file_url || m.url,
              file_size: m.file_size || m.size,
              category: 'uploads',
              created_at: m.created_at
            })
          }
        }
      } catch {}

      // 5. Cache de fotos do localStorage
      try {
        const cached = localStorage.getItem('teknix_media_library')
        if (cached) {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed)) {
            parsed.forEach(p => addItem(p))
          }
        }
      } catch {}

      setMediaList(items)
      if (items.length > 0 && !selectedMedia) {
        setSelectedMedia(items[0])
      }
    } catch (e) {
      console.error('Erro ao carregar mídia:', e)
    } finally {
      setLoading(false)
    }
  }

  // Helper para verificar dimensões de arquivo antes de subir
  function readDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.onload = () => {
        URL.revokeObjectURL(url)
        resolve({ width: img.naturalWidth || img.width, height: img.naturalHeight || img.height })
      }
      img.onerror = () => {
        URL.revokeObjectURL(url)
        reject(new Error('Falha ao abrir imagem'))
      }
      img.src = url
    })
  }

  // Upload de novos arquivos direto para a biblioteca
  async function handleFilesUpload(files: FileList | File[]) {
    if (!files || files.length === 0) return
    setUploading(true)
    setUploadError(null)

    const file = files[0]

    // Se houver tamanho esperado obrigatório, valida
    if (expectedSize && !file.type.startsWith('video/')) {
      try {
        const dim = await readDimensions(file)
        const isExact = dim.width === expectedSize.width && dim.height === expectedSize.height
        const isRetina2x = dim.width === expectedSize.width * 2 && dim.height === expectedSize.height * 2

        if (!isExact && !isRetina2x) {
          setUploadError(
            `Dimensão incorreta! A imagem enviada possui ${dim.width} × ${dim.height} px. O tamanho obrigatório para ${deviceLabel} é ${expectedSize.label} (${expectedSize.width} × ${expectedSize.height} px).`
          )
          setUploading(false)
          return
        }
      } catch {
        // falha na leitura local
      }
    }

    try {
      const path = `ads/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      let bucket = 'media'
      let res = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
      if (res.error) {
        bucket = 'uploads'
        res = await supabase.storage.from(bucket).upload(path, file, { upsert: true })
      }

      if (res.error) {
        setUploadError(`Erro ao enviar imagem: ${res.error.message}`)
        setUploading(false)
        return
      }

      const publicUrl = supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
      const newItem: MediaItem = {
        id: `upload-${Date.now()}`,
        name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        category: 'ads',
        created_at: new Date().toISOString()
      }

      setMediaList(prev => [newItem, ...prev])
      setSelectedMedia(newItem)
      setActiveTab('library')

      // Salva no cache local
      try {
        const cached = localStorage.getItem('teknix_media_library')
        const list = cached ? JSON.parse(cached) : []
        localStorage.setItem('teknix_media_library', JSON.stringify([newItem, ...list].slice(0, 80)))
      } catch {}
    } catch (err: any) {
      setUploadError(err.message || 'Erro inesperado no envio.')
    } finally {
      setUploading(false)
    }
  }

  // Filtragem na biblioteca
  const filteredMedia = mediaList.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory
    return matchesSearch && matchesCategory
  })

  const handleConfirmSelect = () => {
    if (!selectedMedia) return
    onSelectMedia(selectedMedia.file_url, {
      width: selectedMedia.width,
      height: selectedMedia.height,
      name: selectedMedia.name
    })
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="teknix-media-overlay" onClick={onClose}>
      <div className="teknix-media-modal" onClick={e => e.stopPropagation()}>
        {/* Header do Modal */}
        <header className="teknix-media-header">
          <div>
            <h2>{title}</h2>
            {expectedSize && (
              <span className="teknix-media-req-pill">
                Tamanho recomendado para {deviceLabel}: <strong>{expectedSize.label}</strong>
              </span>
            )}
          </div>
          <button className="teknix-media-close" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        {/* Abas Superiores */}
        <div className="teknix-media-nav">
          <button
            className={`media-nav-tab ${activeTab === 'library' ? 'active' : ''}`}
            onClick={() => setActiveTab('library')}
          >
            <ImageIcon size={15} />
            <span>Biblioteca de Mídia ({mediaList.length})</span>
          </button>
          <button
            className={`media-nav-tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            <UploadCloud size={15} />
            <span>Enviar do Computador</span>
          </button>
          <button
            className={`media-nav-tab ${activeTab === 'url' ? 'active' : ''}`}
            onClick={() => setActiveTab('url')}
          >
            <LinkIcon size={15} />
            <span>Inserir por URL</span>
          </button>
        </div>

        {/* Corpo Principal */}
        <div className="teknix-media-body">
          {activeTab === 'library' && (
            <>
              <div className="teknix-media-main-panel">
                {/* Barra de Busca e Filtros */}
                <div className="teknix-media-toolbar">
                  <div className="media-search-box">
                    <Search size={15} />
                    <input
                      type="text"
                      placeholder="Pesquisar imagem pelo nome…"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} aria-label="Limpar">
                        <X size={13} />
                      </button>
                    )}
                  </div>

                  <div className="media-filter-pills">
                    <button
                      className={filterCategory === 'all' ? 'active' : ''}
                      onClick={() => setFilterCategory('all')}
                    >
                      Todas ({mediaList.length})
                    </button>
                    <button
                      className={filterCategory === 'ads' ? 'active' : ''}
                      onClick={() => setFilterCategory('ads')}
                    >
                      Banners & Anúncios
                    </button>
                    <button
                      className={filterCategory === 'products' ? 'active' : ''}
                      onClick={() => setFilterCategory('products')}
                    >
                      Produtos
                    </button>
                    <button
                      className={filterCategory === 'uploads' ? 'active' : ''}
                      onClick={() => setFilterCategory('uploads')}
                    >
                      Uploads
                    </button>
                  </div>

                  <div className="media-view-controls">
                    {/* Tamanho da Grade */}
                    <div className="media-size-toggle" title="Tamanho das miniaturas">
                      <button
                        className={thumbnailDensity === 'sm' ? 'active' : ''}
                        onClick={() => setThumbnailDensity('sm')}
                        title="Miniaturas pequenas"
                      >
                        P
                      </button>
                      <button
                        className={thumbnailDensity === 'md' ? 'active' : ''}
                        onClick={() => setThumbnailDensity('md')}
                        title="Miniaturas normais"
                      >
                        M
                      </button>
                      <button
                        className={thumbnailDensity === 'lg' ? 'active' : ''}
                        onClick={() => setThumbnailDensity('lg')}
                        title="Miniaturas grandes"
                      >
                        G
                      </button>
                    </div>

                    {/* Modo de Ajuste */}
                    <div className="media-fit-toggle" title="Modo de proporção">
                      <button
                        className={objectFitMode === 'contain' ? 'active' : ''}
                        onClick={() => setObjectFitMode('contain')}
                        title="Ajustar (Ver foto inteira sem cortes)"
                      >
                        Ajustar
                      </button>
                      <button
                        className={objectFitMode === 'cover' ? 'active' : ''}
                        onClick={() => setObjectFitMode('cover')}
                        title="Preencher (Preencher todo o quadrado)"
                      >
                        Preencher
                      </button>
                    </div>

                    <button className="media-refresh-btn" onClick={loadAllSystemMedia} title="Atualizar biblioteca">
                      <RefreshCw size={14} className={loading ? 'spinning' : ''} />
                    </button>
                  </div>
                </div>

                {/* Grade de Imagens */}
                <div className={`teknix-media-grid density-${thumbnailDensity} fit-${objectFitMode}`}>
                  {loading && mediaList.length === 0 ? (
                    <div className="media-empty-state">
                      <RefreshCw size={24} className="spinning" />
                      <p>Carregando fotos do sistema…</p>
                    </div>
                  ) : filteredMedia.length === 0 ? (
                    <div className="media-empty-state">
                      <ImageIcon size={32} />
                      <p>Nenhuma imagem encontrada com esses filtros.</p>
                      <button onClick={() => setActiveTab('upload')}>Enviar arquivo agora</button>
                    </div>
                  ) : (
                    filteredMedia.map(item => {
                      const isSelected = selectedMedia?.id === item.id || selectedMedia?.file_url === item.file_url
                      return (
                        <div
                          key={item.id}
                          className={`media-grid-item ${isSelected ? 'selected' : ''}`}
                          onClick={() => setSelectedMedia(item)}
                          onDoubleClick={handleConfirmSelect}
                        >
                          <div className="media-thumb-wrapper">
                            {isVideoUrl(item.file_url) ? <video src={item.file_url} muted preload="metadata" /> : <img
                              src={item.file_url}
                              alt={item.name}
                              loading="lazy"
                              onLoad={e => {
                                const img = e.currentTarget
                                if (!item.width && img.naturalWidth) {
                                  item.width = img.naturalWidth
                                  item.height = img.naturalHeight
                                  if (selectedMedia?.id === item.id) {
                                    setSelectedMedia(prev => prev ? { ...prev, width: img.naturalWidth, height: img.naturalHeight } : null)
                                  }
                                }
                              }}
                            />}
                            {isSelected && (
                              <div className="media-selected-badge">
                                <Check size={14} />
                              </div>
                            )}
                          </div>
                          <span className="media-grid-item-name" title={item.name}>
                            {item.name}
                          </span>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Barra Lateral de Detalhes da Imagem Selecionada */}
              {selectedMedia && (
                <aside className="teknix-media-sidebar">
                  <h4>Detalhes da Mídia</h4>
                  <div
                    className="media-sidebar-preview"
                    onClick={() => setLightboxOpen(true)}
                    title="Clique para ver tamanho real / zoom"
                  >
                    {isVideoUrl(selectedMedia.file_url) ? (
                      <video src={selectedMedia.file_url} muted controls loop />
                    ) : (
                      <img
                        src={selectedMedia.file_url}
                        alt={selectedMedia.name}
                        onLoad={e => {
                          const img = e.currentTarget
                          if (img.naturalWidth && (!selectedMedia.width || !selectedMedia.height)) {
                            setSelectedMedia(prev =>
                              prev ? { ...prev, width: img.naturalWidth, height: img.naturalHeight } : null
                            )
                          }
                        }}
                      />
                    )}
                    <div className="media-sidebar-preview-zoom-btn">
                      <Maximize2 size={12} />
                      <span>Ampliar</span>
                    </div>
                  </div>

                  <div className="media-sidebar-meta">
                    <div className="meta-row">
                      <span>Arquivo</span>
                      <strong title={selectedMedia.name}>{selectedMedia.name}</strong>
                    </div>

                    {selectedMedia.width && selectedMedia.height && (
                      <div className="meta-row">
                        <div className="meta-row-header">
                          <span>Dimensões reais</span>
                          {getAspectRatioLabel(selectedMedia.width, selectedMedia.height) && (
                            <span className="aspect-ratio-pill">
                              {getAspectRatioLabel(selectedMedia.width, selectedMedia.height)}
                            </span>
                          )}
                        </div>
                        <strong>
                          {selectedMedia.width} × {selectedMedia.height} px
                        </strong>
                      </div>
                    )}

                    {expectedSize && (
                      <div className="media-expected-size-card">
                        <div className="expected-size-header">
                          <span className="expected-size-title">Tamanho Ideal ({deviceLabel}):</span>
                          <strong className="expected-size-val">
                            {expectedSize.label || `${expectedSize.width} × ${expectedSize.height} px`}
                          </strong>
                        </div>
                        {selectedMedia.width && selectedMedia.height && (
                          <div
                            className={`expected-size-status ${
                              selectedMedia.width === expectedSize.width && selectedMedia.height === expectedSize.height
                                ? 'exact'
                                : Math.abs(
                                    selectedMedia.width / selectedMedia.height -
                                      expectedSize.width / expectedSize.height
                                  ) < 0.05
                                ? 'proportional'
                                : 'different'
                            }`}
                          >
                            {selectedMedia.width === expectedSize.width &&
                            selectedMedia.height === expectedSize.height ? (
                              <>
                                <CheckCircle2 size={13} />
                                <span>Dimensão 100% exata ({selectedMedia.width} × {selectedMedia.height} px)</span>
                              </>
                            ) : Math.abs(
                                selectedMedia.width / selectedMedia.height -
                                  expectedSize.width / expectedSize.height
                              ) < 0.05 ? (
                              <>
                                <CheckCircle2 size={13} />
                                <span>Proporção idêntica ao recomendado ({selectedMedia.width} × {selectedMedia.height} px)</span>
                              </>
                            ) : (
                              <>
                                <AlertTriangle size={13} />
                                <span>Difere do recomendado ({selectedMedia.width} × {selectedMedia.height} px)</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button className="media-sidebar-btn" onClick={handleConfirmSelect}>
                    <Check size={15} />
                    <span>Usar esta Imagem</span>
                  </button>
                </aside>
              )}
            </>
          )}

          {activeTab === 'upload' && (
            <div className="teknix-media-upload-pane">
              <div
                className={`upload-drop-zone ${isDragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
                onDragOver={e => {
                  e.preventDefault()
                  setIsDragOver(true)
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={e => {
                  e.preventDefault()
                  setIsDragOver(false)
                  if (e.dataTransfer.files) handleFilesUpload(e.dataTransfer.files)
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud size={48} className="upload-icon" />
                <h3>Arraste e solte sua imagem aqui</h3>
                <p>ou clique para selecionar um arquivo do seu computador</p>

                {expectedSize && (
                  <div className="upload-req-note">
                    Tamanho obrigatório para {deviceLabel}: <strong>{expectedSize.label}</strong>
                  </div>
                )}

                <span className="upload-formats-pill">Formatos suportados: WebP, PNG, JPG, GIF, MP4 e WebM</span>

                {uploading && (
                  <div className="upload-progress-box">
                    <RefreshCw size={16} className="spinning" />
                    <span>Enviando e processando imagem…</span>
                  </div>
                )}

                {uploadError && (
                  <div className="upload-error-alert" onClick={e => e.stopPropagation()}>
                    <AlertTriangle size={16} />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
                hidden
                onChange={e => {
                  if (e.target.files) handleFilesUpload(e.target.files)
                  e.currentTarget.value = ''
                }}
              />
            </div>
          )}

          {activeTab === 'url' && (
            <div className="teknix-media-url-pane">
              <div className="url-input-card">
                <h3>Inserir imagem a partir de link URL</h3>
                <p>Cole o endereço público da imagem para adicioná-la ao anúncio:</p>
                <div className="url-input-group">
                  <input
                    type="url"
                    placeholder="https://exemplo.com/imagem.webp"
                    value={urlInput}
                    onChange={e => {
                      setUrlInput(e.target.value)
                      setUrlPreviewValid(false)
                    }}
                  />
                  <button
                    disabled={!urlInput.trim()}
                    onClick={() => {
                      if (urlInput.trim()) {
                        onSelectMedia(urlInput.trim(), { name: 'Imagem via URL' })
                        onClose()
                      }
                    }}
                  >
                    Inserir
                  </button>
                </div>

                {urlInput.trim() && (
                  <div className="url-preview-card">
                    <span>Pré-visualização:</span>
                    {isVideoUrl(urlInput) ? <video src={urlInput} muted controls onLoadedMetadata={() => setUrlPreviewValid(true)} /> : <img
                      src={urlInput}
                      alt="Preview"
                      onError={() => setUrlPreviewValid(false)}
                      onLoad={() => setUrlPreviewValid(true)}
                    />}
                    {!urlPreviewValid && <span className="url-warn">Carregando ou URL inválida</span>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer com botões de ação */}
        <footer className="teknix-media-footer">
          <div className="media-footer-info">
            {selectedMedia ? (
              <span>
                Imagem selecionada: <strong>{selectedMedia.name}</strong>
              </span>
            ) : (
              <span>Nenhuma imagem selecionada</span>
            )}
          </div>
          <div className="media-footer-buttons">
            <button className="footer-btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="footer-btn-primary" disabled={!selectedMedia} onClick={handleConfirmSelect}>
              Inserir Imagem Selecionada
            </button>
          </div>
        </footer>
      </div>

      {/* Modal de Zoom / Pré-visualização em Tamanho Real */}
      {lightboxOpen && selectedMedia && (
        <div className="teknix-media-lightbox-overlay" onClick={() => setLightboxOpen(false)}>
          <div className="teknix-media-lightbox-content" onClick={e => e.stopPropagation()}>
            <div className="teknix-media-lightbox-header">
              <div>
                <strong>{selectedMedia.name}</strong>
                {selectedMedia.width && selectedMedia.height && (
                  <span> — {selectedMedia.width} × {selectedMedia.height} px ({getAspectRatioLabel(selectedMedia.width, selectedMedia.height)})</span>
                )}
              </div>
              <button onClick={() => setLightboxOpen(false)} aria-label="Fechar pré-visualização">
                <X size={18} />
              </button>
            </div>
            <div className="teknix-media-lightbox-body">
              {isVideoUrl(selectedMedia.file_url) ? (
                <video src={selectedMedia.file_url} controls autoPlay />
              ) : (
                <img src={selectedMedia.file_url} alt={selectedMedia.name} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
