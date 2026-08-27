import { useState } from 'react'
import { Image, Upload, Trash2, Copy, Check, Search, Folder, Filter } from 'lucide-react'
import './MediaLibrary.css'

export default function MediaLibrary() {
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const [files, setFiles] = useState([
    { id: '1', name: 'furadeira-impacto-pro.webp', size: '142 KB', category: 'Produtos', url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&q=80' },
    { id: '2', name: 'banner-black-friday.webp', size: '380 KB', category: 'Banners', url: 'https://images.unsplash.com/photo-1581147036324-c17ac41dfa6c?w=600&q=80' },
    { id: '3', name: 'esmerilhadeira-850w.webp', size: '198 KB', category: 'Produtos', url: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&q=80' },
    { id: '4', name: 'logo-teknix-white.png', size: '24 KB', category: 'Institucional', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&q=80' },
  ])

  function handleCopy(url: string, id: string) {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="media-page-container">
      <div className="media-wrapper">
        
        {/* Header */}
        <div className="media-header">
          <div>
            <h1 className="media-title">Biblioteca de Mídia</h1>
            <p className="media-subtitle">
              Central de upload e gerenciamento de fotos, ilustrações e vídeos para uso em produtos, banners e páginas.
            </p>
          </div>
          <button className="btn-primary-action" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Upload size={16} /> Fazer Upload de Imagens
          </button>
        </div>

        {/* Search and Filters */}
        <div className="media-search-bar">
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: '#9ca3af' }} />
            <input
              className="media-input"
              placeholder="Buscar imagem por nome do arquivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>
          <button className="btn-secondary-action" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} /> Todas as Pastas
          </button>
        </div>

        {/* Media Grid */}
        <div className="media-grid">
          {files.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).map(f => (
            <div key={f.id} className="media-card">
              <div className="media-thumb-box">
                <img src={f.url} alt={f.name} className="media-img" />
              </div>
              <div className="media-info">
                <div className="media-name" title={f.name}>{f.name}</div>
                <div className="media-meta">{f.category} • {f.size}</div>
              </div>
              <div className="media-actions">
                <button className="btn-copy-url" onClick={() => handleCopy(f.url, f.id)}>
                  {copiedId === f.id ? <Check size={13} color="#059669" /> : <Copy size={13} />}
                  {copiedId === f.id ? 'Copiado' : 'Copiar URL'}
                </button>
                <button className="btn-del-media" onClick={() => setFiles(files.filter(x => x.id !== f.id))}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
