import React, { useState, useEffect, useRef, useCallback } from 'react'
import ReactDOM from 'react-dom'
import {
  X, Crop, Maximize2, RotateCw, RotateCcw, FlipHorizontal, FlipVertical,
  Undo2, Redo2, Check, RefreshCw, Sliders, Sparkles, AlertCircle, Info
} from 'lucide-react'
import type { MediaItem } from '../../types/pageBuilder'
import './ImageEditorModal.css'

interface ImageEditorModalProps {
  isOpen: boolean
  onClose: () => void
  mediaItem: MediaItem | null
  onSave: (updatedUrl: string, updatedItem: MediaItem) => void
}

interface EditorState {
  scaleWidth: number
  scaleHeight: number
  rotation: number // 0, 90, 180, 270
  flipH: boolean
  flipV: boolean
  brightness: number // 100
  contrast: number // 100
  saturate: number // 100
  grayscale: number // 0
  cropAspect?: number | null // null = free, 1 = 1:1, 16/9, etc.
}

export default function ImageEditorModal({
  isOpen,
  onClose,
  mediaItem,
  onSave,
}: ImageEditorModalProps) {
  const [originalWidth, setOriginalWidth] = useState<number>(0)
  const [originalHeight, setOriginalHeight] = useState<number>(0)
  const [aspectLocked, setAspectLocked] = useState<boolean>(true)
  const [activeTool, setActiveTool] = useState<'scale' | 'crop' | 'adjust' | null>('scale')
  const [showRotateMenu, setShowRotateMenu] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Current Transform State
  const [currentState, setCurrentState] = useState<EditorState>({
    scaleWidth: 0,
    scaleHeight: 0,
    rotation: 0,
    flipH: false,
    flipV: false,
    brightness: 100,
    contrast: 100,
    saturate: 100,
    grayscale: 0,
    cropAspect: null,
  })

  // History stack for Undo/Redo
  const [history, setHistory] = useState<EditorState[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)

  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Push new state to history
  const pushState = useCallback((newState: EditorState) => {
    setHistory(prev => {
      const updated = prev.slice(0, historyIndex + 1)
      return [...updated, newState]
    })
    setHistoryIndex(prev => prev + 1)
    setCurrentState(newState)
  }, [historyIndex])

  // Initialize image dimensions on open
  useEffect(() => {
    if (isOpen && mediaItem?.file_url) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = mediaItem.file_url
      img.onload = () => {
        const w = img.naturalWidth || 800
        const h = img.naturalHeight || 600
        setOriginalWidth(w)
        setOriginalHeight(h)

        const initial: EditorState = {
          scaleWidth: w,
          scaleHeight: h,
          rotation: 0,
          flipH: false,
          flipV: false,
          brightness: 100,
          contrast: 100,
          saturate: 100,
          grayscale: 0,
          cropAspect: null,
        }

        setCurrentState(initial)
        setHistory([initial])
        setHistoryIndex(0)
      }
    }
  }, [isOpen, mediaItem])

  if (!isOpen || !mediaItem) return null

  // Undo Handler
  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1
      setCurrentState(history[targetIndex])
      setHistoryIndex(targetIndex)
    }
  }

  // Redo Handler
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1
      setCurrentState(history[targetIndex])
      setHistoryIndex(targetIndex)
    }
  }

  // Rotation & Flip operations
  const handleRotate = (deg: number) => {
    const nextRot = (currentState.rotation + deg + 360) % 360
    pushState({ ...currentState, rotation: nextRot })
    setShowRotateMenu(false)
  }

  const handleFlipH = () => {
    pushState({ ...currentState, flipH: !currentState.flipH })
    setShowRotateMenu(false)
  }

  const handleFlipV = () => {
    pushState({ ...currentState, flipV: !currentState.flipV })
    setShowRotateMenu(false)
  }

  // Scale dimension change
  const handleWidthChange = (val: number) => {
    if (isNaN(val) || val <= 0) return
    let newHeight = currentState.scaleHeight
    if (aspectLocked && originalWidth > 0) {
      const ratio = originalHeight / originalWidth
      newHeight = Math.round(val * ratio)
    }
    setCurrentState(prev => ({ ...prev, scaleWidth: val, scaleHeight: newHeight }))
  }

  const handleHeightChange = (val: number) => {
    if (isNaN(val) || val <= 0) return
    let newWidth = currentState.scaleWidth
    if (aspectLocked && originalHeight > 0) {
      const ratio = originalWidth / originalHeight
      newWidth = Math.round(val * ratio)
    }
    setCurrentState(prev => ({ ...prev, scaleHeight: val, scaleWidth: newWidth }))
  }

  const handleApplyScale = () => {
    pushState({ ...currentState })
  }

  // Apply Full Canvas Render & Save
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = mediaItem.file_url

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })

      const targetW = currentState.scaleWidth || originalWidth
      const targetH = currentState.scaleHeight || originalHeight

      const canvas = document.createElement('canvas')
      const isRotated90 = currentState.rotation === 90 || currentState.rotation === 270

      canvas.width = isRotated90 ? targetH : targetW
      canvas.height = isRotated90 ? targetW : targetH

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')

      // Apply Filters
      ctx.filter = `brightness(${currentState.brightness}%) contrast(${currentState.contrast}%) saturate(${currentState.saturate}%) grayscale(${currentState.grayscale}%)`

      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate((currentState.rotation * Math.PI) / 180)
      ctx.scale(currentState.flipH ? -1 : 1, currentState.flipV ? -1 : 1)

      ctx.drawImage(img, -targetW / 2, -targetH / 2, targetW, targetH)
      ctx.restore()

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)

      const updatedItem: MediaItem = {
        ...mediaItem,
        file_url: dataUrl,
        file_size: Math.round((dataUrl.length * 3) / 4),
        updated_at: new Date().toISOString(),
      }

      onSave(dataUrl, updatedItem)
      onClose()
    } catch (err) {
      console.error('Error saving edited image:', err)
      alert('Erro ao salvar a imagem editada.')
    } finally {
      setIsSaving(false)
    }
  }

  // Compute CSS transforms for live canvas preview
  const previewFilter = `brightness(${currentState.brightness}%) contrast(${currentState.contrast}%) saturate(${currentState.saturate}%) grayscale(${currentState.grayscale}%)`
  const previewTransform = `rotate(${currentState.rotation}deg) scale(${currentState.flipH ? -1 : 1}, ${currentState.flipV ? -1 : 1})`

  return ReactDOM.createPortal(
    <div className="image-editor-modal-overlay" onClick={onClose}>
      <div className="image-editor-modal" onClick={e => e.stopPropagation()}>
        {/* HEADER */}
        <div className="image-editor-header">
          <h2 className="image-editor-title">Editar imagem</h2>
          <button className="image-editor-close-btn" onClick={onClose} title="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* TOP TOOLBAR */}
        <div className="image-editor-toolbar">
          <div className="image-editor-tool-group">
            <button
              type="button"
              className={`image-editor-btn ${activeTool === 'crop' ? 'active' : ''}`}
              onClick={() => setActiveTool(activeTool === 'crop' ? null : 'crop')}
              title="Recortar imagem"
            >
              <Crop size={14} />
              <span>Recortar</span>
            </button>

            <button
              type="button"
              className={`image-editor-btn ${activeTool === 'scale' ? 'active' : ''}`}
              onClick={() => setActiveTool(activeTool === 'scale' ? null : 'scale')}
              title="Redimensionar proporções"
            >
              <Maximize2 size={14} />
              <span>Scale</span>
            </button>

            {/* Rotação Dropdown */}
            <div className="image-editor-dropdown">
              <button
                type="button"
                className="image-editor-btn"
                onClick={() => setShowRotateMenu(!showRotateMenu)}
                title="Opções de Rotação e Espelhamento"
              >
                <RotateCw size={14} />
                <span>Rotação da imagem ▾</span>
              </button>

              {showRotateMenu && (
                <div className="image-editor-dropdown-menu">
                  <button type="button" className="image-editor-dropdown-item" onClick={() => handleRotate(-90)}>
                    <RotateCcw size={14} /> Girar 90° para esquerda
                  </button>
                  <button type="button" className="image-editor-dropdown-item" onClick={() => handleRotate(90)}>
                    <RotateCw size={14} /> Girar 90° para direita
                  </button>
                  <button type="button" className="image-editor-dropdown-item" onClick={() => handleRotate(180)}>
                    <RefreshCw size={14} /> Girar 180°
                  </button>
                  <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #f0f0f1' }} />
                  <button type="button" className="image-editor-dropdown-item" onClick={handleFlipH}>
                    <FlipHorizontal size={14} /> Espelhar horizontalmente
                  </button>
                  <button type="button" className="image-editor-dropdown-item" onClick={handleFlipV}>
                    <FlipVertical size={14} /> Espelhar verticalmente
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className={`image-editor-btn ${activeTool === 'adjust' ? 'active' : ''}`}
              onClick={() => setActiveTool(activeTool === 'adjust' ? null : 'adjust')}
              title="Filtros e Ajustes de Imagem"
            >
              <Sliders size={14} />
              <span>Ajustes</span>
            </button>
          </div>

          {/* Undo / Redo / Cancel / Save */}
          <div className="image-editor-tool-group">
            <button
              type="button"
              className="image-editor-btn-secondary"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Desfazer alteração"
            >
              <Undo2 size={14} />
              <span>Desfazer</span>
            </button>

            <button
              type="button"
              className="image-editor-btn-secondary"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Refazer alteração"
            >
              <Redo2 size={14} />
              <span>Refazer</span>
            </button>

            <button
              type="button"
              className="image-editor-btn-secondary"
              onClick={onClose}
              title="Cancelar todas as alterações"
            >
              Cancelar edição
            </button>

            <button
              type="button"
              className="image-editor-btn-primary"
              onClick={handleSave}
              disabled={isSaving}
              title="Salvar alterações e aplicar à biblioteca e página"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check size={14} />
                  <span>Salvar edição</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* MAIN BODY */}
        <div className="image-editor-body">
          {/* Canvas Area */}
          <div className="image-editor-canvas-wrapper">
            <div className="image-editor-canvas-box">
              <img
                ref={imgRef}
                src={mediaItem.file_url}
                alt={mediaItem.name}
                className="image-editor-preview-img"
                style={{
                  filter: previewFilter,
                  transform: previewTransform,
                  transition: 'transform 0.2s ease, filter 0.15s ease'
                }}
              />
            </div>
          </div>

          {/* RIGHT SIDEBAR (Scale / Crop / Adjust Options) */}
          <div className="image-editor-sidebar">
            {/* SCALE TOOL */}
            {activeTool === 'scale' && (
              <div>
                <h3 className="image-editor-panel-title">
                  <Maximize2 size={14} />
                  <span>Redimensionar a Imagem</span>
                  <Info size={12} style={{ color: '#8c8f94', cursor: 'help' }} />
                </h3>
                <p className="image-editor-meta-text">
                  Dimensões originais: <strong>{originalWidth} × {originalHeight}</strong> px
                </p>

                <div style={{ marginBottom: 12 }}>
                  <label style={{ fontSize: '11px', fontWeight: 600, color: '#50575e', display: 'block', marginBottom: 4 }}>
                    Novas dimensões:
                  </label>
                  <div className="image-editor-scale-row">
                    <input
                      type="number"
                      className="image-editor-input-dim"
                      value={currentState.scaleWidth || originalWidth}
                      onChange={e => handleWidthChange(parseInt(e.target.value) || 0)}
                    />
                    <span style={{ color: '#8c8f94', fontWeight: 600 }}>×</span>
                    <input
                      type="number"
                      className="image-editor-input-dim"
                      value={currentState.scaleHeight || originalHeight}
                      onChange={e => handleHeightChange(parseInt(e.target.value) || 0)}
                    />
                    <button
                      type="button"
                      className="image-editor-btn-primary"
                      style={{ padding: '6px 12px' }}
                      onClick={handleApplyScale}
                    >
                      Scale
                    </button>
                  </div>

                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '11px', color: '#50575e', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={aspectLocked}
                      onChange={e => setAspectLocked(e.target.checked)}
                      style={{ accentColor: '#0071e3' }}
                    />
                    <span>Manter proporções originais</span>
                  </label>
                </div>
              </div>
            )}

            {/* CROP TOOL */}
            {activeTool === 'crop' && (
              <div>
                <h3 className="image-editor-panel-title">
                  <Crop size={14} />
                  <span>Proporções de Recorte</span>
                </h3>
                <p className="image-editor-meta-text">
                  Selecione a proporção predefinida:
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[
                    { label: 'Livre (Personalizado)', aspect: null },
                    { label: '1:1 (Quadrado Apple)', aspect: 1 },
                    { label: '16:9 (Widescreen Vídeo/Hero)', aspect: 16 / 9 },
                    { label: '4:3 (Padrão Fotográfico)', aspect: 4 / 3 },
                    { label: '3:2 (Editorial / Produto)', aspect: 3 / 2 },
                    { label: '9:16 (Mobile / Stories)', aspect: 9 / 16 },
                  ].map(opt => (
                    <button
                      key={opt.label}
                      type="button"
                      className={`image-editor-btn-secondary ${currentState.cropAspect === opt.aspect ? 'active' : ''}`}
                      style={{
                        justifyContent: 'flex-start',
                        background: currentState.cropAspect === opt.aspect ? '#2271b1' : '#ffffff',
                        color: currentState.cropAspect === opt.aspect ? '#ffffff' : '#1d2327'
                      }}
                      onClick={() => pushState({ ...currentState, cropAspect: opt.aspect })}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ADJUST TOOL */}
            {activeTool === 'adjust' && (
              <div>
                <h3 className="image-editor-panel-title">
                  <Sliders size={14} />
                  <span>Ajustes e Filtros</span>
                </h3>

                <div className="image-editor-slider-row">
                  <div className="image-editor-slider-label">
                    <span>Brilho</span>
                    <span>{currentState.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={currentState.brightness}
                    onChange={e => pushState({ ...currentState, brightness: parseInt(e.target.value) })}
                    className="image-editor-slider"
                  />
                </div>

                <div className="image-editor-slider-row">
                  <div className="image-editor-slider-label">
                    <span>Contraste</span>
                    <span>{currentState.contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={currentState.contrast}
                    onChange={e => pushState({ ...currentState, contrast: parseInt(e.target.value) })}
                    className="image-editor-slider"
                  />
                </div>

                <div className="image-editor-slider-row">
                  <div className="image-editor-slider-label">
                    <span>Saturação</span>
                    <span>{currentState.saturate}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={currentState.saturate}
                    onChange={e => pushState({ ...currentState, saturate: parseInt(e.target.value) })}
                    className="image-editor-slider"
                  />
                </div>

                <div className="image-editor-slider-row">
                  <div className="image-editor-slider-label">
                    <span>Preto & Branco (Grayscale)</span>
                    <span>{currentState.grayscale}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentState.grayscale}
                    onChange={e => pushState({ ...currentState, grayscale: parseInt(e.target.value) })}
                    className="image-editor-slider"
                  />
                </div>

                <button
                  type="button"
                  className="image-editor-btn-secondary"
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={() => pushState({ ...currentState, brightness: 100, contrast: 100, saturate: 100, grayscale: 0 })}
                >
                  Restaurar Filtros Padrão
                </button>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER */}
        <div className="image-editor-footer">
          <span style={{ fontSize: '11px', color: '#646970' }}>
            Arquivo: <strong>{mediaItem.name}</strong> ({currentState.scaleWidth || originalWidth} × {currentState.scaleHeight || originalHeight} px)
          </span>
          <button
            type="button"
            className="image-editor-btn-secondary"
            onClick={onClose}
          >
            Voltar
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
