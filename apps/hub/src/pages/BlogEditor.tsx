import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './BlogEditor.css'

// ── Tipos ────────────────────────────────────────────────────────────────────
type BlockType = 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'image' | 'quote' | 'divider' | 'list'

interface Block {
  id: string
  type: BlockType
  content: string
  imageUrl?: string
  imageCaption?: string
  listItems?: string[]
}

function generateId() {
  return Math.random().toString(36).slice(2, 10)
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

// ── Editor de Bloco ─────────────────────────────────────────────────────────
function BlockEditor({
  block,
  onChange,
  onDelete,
  onAddAfter,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  block: Block
  onChange: (b: Block) => void
  onDelete: () => void
  onAddAfter: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  isFirst: boolean
  isLast: boolean
}) {
  const [uploading, setUploading] = useState(false)
  const imgRef = useRef<HTMLInputElement>(null)

  async function handleImageUpload(file: File) {
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `blog/${Date.now()}.${ext}`
      const { data, error } = await supabase.storage.from('media').upload(path, file, { upsert: true })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
      onChange({ ...block, imageUrl: urlData.publicUrl })
    } catch {
      alert('Erro ao enviar imagem.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="blog-block">
      <div className="blog-block-controls">
        <button className="block-ctrl-btn" onClick={onMoveUp} disabled={isFirst} title="Mover para cima">↑</button>
        <button className="block-ctrl-btn" onClick={onMoveDown} disabled={isLast} title="Mover para baixo">↓</button>
        <button className="block-ctrl-btn danger" onClick={onDelete} title="Excluir bloco">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="blog-block-content">
        {block.type === 'paragraph' && (
          <textarea
            className="block-textarea paragraph"
            placeholder="Escreva um parágrafo..."
            value={block.content}
            onChange={e => onChange({ ...block, content: e.target.value })}
            rows={3}
          />
        )}
        {block.type === 'heading1' && (
          <input
            className="block-input h1"
            placeholder="Título principal"
            value={block.content}
            onChange={e => onChange({ ...block, content: e.target.value })}
          />
        )}
        {block.type === 'heading2' && (
          <input
            className="block-input h2"
            placeholder="Subtítulo"
            value={block.content}
            onChange={e => onChange({ ...block, content: e.target.value })}
          />
        )}
        {block.type === 'heading3' && (
          <input
            className="block-input h3"
            placeholder="Subtítulo menor"
            value={block.content}
            onChange={e => onChange({ ...block, content: e.target.value })}
          />
        )}
        {block.type === 'quote' && (
          <textarea
            className="block-textarea quote"
            placeholder="Citação..."
            value={block.content}
            onChange={e => onChange({ ...block, content: e.target.value })}
            rows={2}
          />
        )}
        {block.type === 'list' && (
          <textarea
            className="block-textarea list"
            placeholder="Um item por linha..."
            value={(block.listItems || []).join('\n')}
            onChange={e => onChange({ ...block, listItems: e.target.value.split('\n') })}
            rows={4}
          />
        )}
        {block.type === 'divider' && (
          <div className="block-divider-preview">
            <hr />
            <span>Divisor</span>
          </div>
        )}
        {block.type === 'image' && (
          <div className="block-image-wrapper">
            {block.imageUrl ? (
              <div className="block-image-preview">
                <img src={block.imageUrl} alt={block.imageCaption || ''} />
                <button className="block-image-remove" onClick={() => onChange({ ...block, imageUrl: undefined })}>
                  Remover imagem
                </button>
              </div>
            ) : (
              <div
                className="block-image-dropzone"
                onClick={() => imgRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => {
                  e.preventDefault()
                  const file = e.dataTransfer.files[0]
                  if (file && file.type.startsWith('image/')) handleImageUpload(file)
                }}
              >
                {uploading ? (
                  <span>Enviando...</span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="32" height="32">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Clique ou arraste uma imagem</span>
                    <small>JPG, PNG, WebP — máx. 10 MB</small>
                  </>
                )}
                <input
                  ref={imgRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleImageUpload(file)
                  }}
                />
              </div>
            )}
            <input
              className="block-image-caption"
              placeholder="Legenda da imagem (opcional)"
              value={block.imageCaption || ''}
              onChange={e => onChange({ ...block, imageCaption: e.target.value })}
            />
          </div>
        )}
      </div>

      <button className="blog-add-block-btn" onClick={onAddAfter} title="Adicionar bloco">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>
    </div>
  )
}

// ── Seletor de tipo de bloco ─────────────────────────────────────────────────
function BlockTypeMenu({ onSelect, onClose }: { onSelect: (t: BlockType) => void; onClose: () => void }) {
  const types: { type: BlockType; label: string; icon: string }[] = [
    { type: 'paragraph', label: 'Parágrafo', icon: '¶' },
    { type: 'heading1', label: 'Título H1', icon: 'H1' },
    { type: 'heading2', label: 'Título H2', icon: 'H2' },
    { type: 'heading3', label: 'Título H3', icon: 'H3' },
    { type: 'image', label: 'Imagem', icon: '🖼' },
    { type: 'quote', label: 'Citação', icon: '"' },
    { type: 'list', label: 'Lista', icon: '≡' },
    { type: 'divider', label: 'Divisor', icon: '—' },
  ]
  return (
    <div className="block-type-menu">
      <div className="block-type-menu-header">
        <span>Tipo de bloco</span>
        <button onClick={onClose}>✕</button>
      </div>
      <div className="block-type-menu-grid">
        {types.map(t => (
          <button key={t.type} className="block-type-item" onClick={() => { onSelect(t.type); onClose() }}>
            <span className="block-type-icon">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Página principal do editor ───────────────────────────────────────────────
export default function BlogEditor() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [seoTitle, setSeoTitle] = useState('')
  const [seoDesc, setSeoDesc] = useState('')
  const [tags, setTags] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([
    { id: generateId(), type: 'paragraph', content: '' }
  ])
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(isEditing)
  const [coverUploading, setCoverUploading] = useState(false)
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content')
  const coverRef = useRef<HTMLInputElement>(null)

  // Auto-slug a partir do título
  useEffect(() => {
    if (!slugManual && title) {
      setSlug(slugify(title))
    }
  }, [title, slugManual])

  // Carregar post existente ao editar
  useEffect(() => {
    if (isEditing && id) {
      loadPost(id)
    }
  }, [id])

  async function loadPost(postId: string) {
    setLoading(true)
    try {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', postId)
        .single()
      if (data) {
        setTitle(data.title || '')
        setSummary(data.summary || '')
        setSlug(data.slug || '')
        setSlugManual(true)
        setCoverImage(data.cover_image || null)
        setSeoTitle(data.seo_title || '')
        setSeoDesc(data.seo_description || '')
        setTags((data.tags || []).join(', '))
        if (data.blocks && Array.isArray(data.blocks)) {
          setBlocks(data.blocks)
        }
      }
    } catch {
      alert('Erro ao carregar post.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCoverUpload(file: File) {
    setCoverUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `blog/covers/${Date.now()}.${ext}`
      await supabase.storage.from('media').upload(path, file, { upsert: true })
      const { data } = supabase.storage.from('media').getPublicUrl(path)
      setCoverImage(data.publicUrl)
    } catch {
      alert('Erro ao enviar capa.')
    } finally {
      setCoverUploading(false)
    }
  }

  function addBlock(afterId: string, type: BlockType = 'paragraph') {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: '',
      listItems: type === 'list' ? [''] : undefined,
    }
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === afterId)
      const updated = [...prev]
      updated.splice(idx + 1, 0, newBlock)
      return updated
    })
    setShowBlockMenu(null)
  }

  function updateBlock(id: string, updated: Block) {
    setBlocks(prev => prev.map(b => b.id === id ? updated : b))
  }

  function deleteBlock(id: string) {
    setBlocks(prev => prev.length > 1 ? prev.filter(b => b.id !== id) : prev)
  }

  function moveBlock(id: string, dir: 'up' | 'down') {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id)
      if (dir === 'up' && idx === 0) return prev
      if (dir === 'down' && idx === prev.length - 1) return prev
      const updated = [...prev]
      const swap = dir === 'up' ? idx - 1 : idx + 1
      ;[updated[idx], updated[swap]] = [updated[swap], updated[idx]]
      return updated
    })
  }

  async function handleSave(publish = false) {
    if (!title.trim()) {
      alert('Título é obrigatório.')
      return
    }
    setSaving(true)
    try {
      const payload: any = {
        title: title.trim(),
        slug: slug || slugify(title),
        summary: summary.trim(),
        cover_image: coverImage,
        seo_title: seoTitle || title,
        seo_description: seoDesc || summary,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        blocks,
        status: publish ? 'published' : 'draft',
        published_at: publish ? new Date().toISOString() : null,
        author_name: localStorage.getItem('user_name') || 'TEKNIX',
        updated_at: new Date().toISOString(),
      }

      let savedSlug = payload.slug
      if (isEditing && id) {
        await supabase.from('blog_posts').update(payload).eq('id', id)
      } else {
        payload.created_at = new Date().toISOString()
        const { data, error } = await supabase.from('blog_posts').insert(payload).select().single()
        if (error) throw error
        savedSlug = data.slug
      }

      if (publish) {
        navigate(`/hub/blog`)
      } else {
        navigate('/hub/blog')
      }
    } catch (e: any) {
      alert(`Erro ao salvar: ${e.message || 'Tente novamente.'}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="blog-editor-loading">
        <div className="blog-loading-spinner" />
        <span>Carregando post...</span>
      </div>
    )
  }

  return (
    <div className="blog-editor-page">
      {/* ── Header ── */}
      <div className="blog-editor-header">
        <div className="blog-editor-header-left">
          <button className="blog-back-btn" onClick={() => navigate('/hub/blog')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Blog
          </button>
          <span className="blog-editor-title-crumb">
            {isEditing ? 'Editar post' : 'Novo post'}
          </span>
        </div>
        <div className="blog-editor-header-actions">
          <button className="blog-save-draft-btn" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar rascunho'}
          </button>
          <button className="blog-publish-btn" onClick={() => handleSave(true)} disabled={saving}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15">
              <path d="M22 2L11 13" />
              <path d="M22 2L15 22 11 13 2 9l20-7z" />
            </svg>
            Publicar
          </button>
        </div>
      </div>

      <div className="blog-editor-body">
        {/* ── Área principal do editor ── */}
        <div className="blog-editor-main">
          {/* Capa */}
          <div
            className="blog-cover-zone"
            onClick={() => !coverImage && coverRef.current?.click()}
          >
            {coverImage ? (
              <div className="blog-cover-preview">
                <img src={coverImage} alt="Capa do post" />
                <div className="blog-cover-overlay">
                  <button onClick={() => coverRef.current?.click()} disabled={coverUploading}>
                    {coverUploading ? 'Enviando...' : 'Trocar capa'}
                  </button>
                  <button onClick={() => setCoverImage(null)} className="remove">Remover</button>
                </div>
              </div>
            ) : (
              <div className="blog-cover-placeholder">
                {coverUploading ? (
                  <span>Enviando capa...</span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" width="36" height="36">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                    <span>Adicionar imagem de capa</span>
                    <small>Recomendado: 1200 × 630px</small>
                  </>
                )}
              </div>
            )}
            <input
              ref={coverRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) handleCoverUpload(f)
              }}
            />
          </div>

          {/* Título principal */}
          <textarea
            className="blog-title-input"
            placeholder="Título do post..."
            value={title}
            onChange={e => setTitle(e.target.value)}
            rows={2}
          />

          {/* Resumo */}
          <textarea
            className="blog-summary-input"
            placeholder="Resumo ou subtítulo (aparece na listagem e SEO)..."
            value={summary}
            onChange={e => setSummary(e.target.value)}
            rows={2}
          />

          {/* Slug */}
          <div className="blog-slug-row">
            <span className="blog-slug-prefix">http://localhost:5173/blog/</span>
            <input
              className="blog-slug-input"
              value={slug}
              onChange={e => {
                setSlug(slugify(e.target.value))
                setSlugManual(true)
              }}
              placeholder="url-do-post"
            />
          </div>

          {/* Abas de conteúdo / SEO */}
          <div className="blog-editor-tabs">
            <button
              className={`blog-editor-tab ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              Conteúdo
            </button>
            <button
              className={`blog-editor-tab ${activeTab === 'seo' ? 'active' : ''}`}
              onClick={() => setActiveTab('seo')}
            >
              SEO & Tags
            </button>
          </div>

          {/* ── Conteúdo: blocos ── */}
          {activeTab === 'content' && (
            <div className="blog-blocks-area">
              {blocks.map((block, idx) => (
                <div key={block.id} className="blog-block-wrapper">
                  {showBlockMenu === block.id && (
                    <BlockTypeMenu
                      onSelect={type => addBlock(block.id, type)}
                      onClose={() => setShowBlockMenu(null)}
                    />
                  )}
                  <BlockEditor
                    block={block}
                    onChange={updated => updateBlock(block.id, updated)}
                    onDelete={() => deleteBlock(block.id)}
                    onAddAfter={() => setShowBlockMenu(block.id)}
                    onMoveUp={() => moveBlock(block.id, 'up')}
                    onMoveDown={() => moveBlock(block.id, 'down')}
                    isFirst={idx === 0}
                    isLast={idx === blocks.length - 1}
                  />
                </div>
              ))}

              {/* Botão para adicionar bloco no final */}
              <button
                className="blog-add-first-block"
                onClick={() => {
                  const lastId = blocks[blocks.length - 1]?.id
                  if (lastId) setShowBlockMenu(lastId)
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Adicionar bloco
              </button>
            </div>
          )}

          {/* ── SEO & Tags ── */}
          {activeTab === 'seo' && (
            <div className="blog-seo-tab">
              <div className="blog-field">
                <label>Título SEO</label>
                <input
                  className="blog-field-input"
                  value={seoTitle}
                  onChange={e => setSeoTitle(e.target.value)}
                  placeholder={title || 'Título para mecanismos de busca'}
                  maxLength={70}
                />
                <small>{(seoTitle || title).length}/70 caracteres</small>
              </div>
              <div className="blog-field">
                <label>Descrição SEO</label>
                <textarea
                  className="blog-field-textarea"
                  value={seoDesc}
                  onChange={e => setSeoDesc(e.target.value)}
                  placeholder={summary || 'Descrição para mecanismos de busca'}
                  maxLength={160}
                  rows={3}
                />
                <small>{(seoDesc || summary).length}/160 caracteres</small>
              </div>
              <div className="blog-field">
                <label>Tags (separadas por vírgula)</label>
                <input
                  className="blog-field-input"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="tecnologia, ferramentas, dicas"
                />
              </div>

              {/* Preview Google */}
              <div className="blog-seo-preview">
                <p className="seo-preview-label">Preview no Google</p>
                <div className="seo-preview-card">
                  <div className="seo-preview-url">localhost:5173/blog/{slug || 'url-do-post'}</div>
                  <div className="seo-preview-title">{seoTitle || title || 'Título do post'}</div>
                  <div className="seo-preview-desc">{seoDesc || summary || 'Descrição do post...'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
