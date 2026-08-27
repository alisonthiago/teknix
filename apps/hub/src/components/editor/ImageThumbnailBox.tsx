import React, { useState } from 'react'
import { Plus, Edit2, Trash2 } from 'lucide-react'
import MediaLibraryModal from './MediaLibraryModal'
import './MediaLibraryModal.css'

interface ImageThumbnailBoxProps {
  src: string
  onChange: (url: string) => void
  title?: string
}

export default function ImageThumbnailBox({
  src,
  onChange,
  title = 'Imagem'
}: ImageThumbnailBoxProps) {
  const [showModal, setShowModal] = useState(false)

  return (
    <div className="elementor-control-media-box">
      <div
        className="elementor-control-media__preview"
        onClick={() => setShowModal(true)}
        title="Clique para escolher uma imagem da biblioteca"
      >
        {src ? (
          <div className="elementor-control-media__filled">
            <img src={src} alt="Preview" className="elementor-control-media__image" />
            <div className="elementor-control-media__overlay-actions" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="elementor-control-media__action-btn"
                onClick={() => setShowModal(true)}
                title="Alterar mídia"
              >
                <Edit2 size={12} />
                <span>Alterar</span>
              </button>
              <button
                type="button"
                className="elementor-control-media__action-btn delete"
                onClick={() => onChange('')}
                title="Remover imagem"
              >
                <Trash2 size={12} />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="elementor-control-media__empty-btn" title="Inserir mídia">
            <Plus size={20} strokeWidth={2.5} />
          </div>
        )}
      </div>

      <MediaLibraryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelectMedia={(url) => {
          onChange(url)
          setShowModal(false)
        }}
        title={`Inserir ${title}`}
      />
    </div>
  )
}
