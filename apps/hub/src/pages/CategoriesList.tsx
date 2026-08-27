import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, GripVertical, MoreVertical, Copy, Trash2, Edit2, ExternalLink, Sparkles } from 'lucide-react'
import './Categories.css'

interface Category {
  id: string
  name: string
  slug: string
  product_count?: number
}

export default function CategoriesList() {
  const [categories, setCategories] = useState<Category[]>([])
  const [, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newCat, setNewCat] = useState({ name: '', slug: '', description: '' })
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const { data } = await supabase.from('categories').select('*').order('name')
      if (data && data.length > 0) {
        setCategories(data)
      } else {
        // Mock fallback if DB empty
        setCategories([
          { id: '1', name: 'Ferramentas Elétricas', slug: 'ferramentas-eletricas', product_count: 24 },
          { id: '2', name: 'Ferramentas Manuais', slug: 'ferramentas-manuais', product_count: 18 },
          { id: '3', name: 'Iluminação & LEDs', slug: 'iluminacao-leds', product_count: 32 },
          { id: '4', name: 'Acessórios & Discos', slug: 'acessorios-discos', product_count: 15 },
          { id: '5', name: 'EPIs & Segurança', slug: 'epis-seguranca', product_count: 9 },
        ])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateCategory() {
    if (!newCat.name.trim()) return
    const slug = newCat.slug || newCat.name.toLowerCase().replace(/\s+/g, '-')
    try {
      const { data, error } = await supabase.from('categories').insert({ name: newCat.name, slug, active: true }).select().single()
      if (error) throw error
      if (data) {
        setCategories([...categories, data])
      }
    } catch (e) {
      // Fallback
      setCategories([...categories, { id: Date.now().toString(), name: newCat.name, slug, product_count: 0 }])
    }
    setShowModal(false)
    setNewCat({ name: '', slug: '', description: '' })
  }

  function handleDeleteCategory(id: string) {
    if (confirm('Deseja realmente excluir esta categoria?')) {
      setCategories(categories.filter(c => c.id !== id))
    }
  }

  return (
    <div className="categories-page-container">
      <div className="categories-wrapper">
        
        {/* Header */}
        <div className="page-header">
          <div className="header-info">
            <h1>Categorias</h1>
            <p>Para organizar seus produtos, crie categorias e subcategorias que aparecerão no menu da loja.</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Criar categoria
            </button>
          </div>
        </div>

        {/* Categories Tree */}
        <div className="category-tree-card">
          {categories.map(cat => (
            <div key={cat.id} className="category-tree-item">
              <div className="category-tree-left">
                <GripVertical size={16} className="category-drag-handle" />
                <span className="category-name">{cat.name}</span>
                <span className="category-product-count">{cat.product_count || 0} produtos</span>
              </div>

              <div className="category-tree-right" style={{ position: 'relative' }}>
                <button
                  className="category-action-btn"
                  title="Duplicar categoria"
                  onClick={() => setCategories([...categories, { ...cat, id: Date.now().toString(), name: `${cat.name} (Cópia)` }])}
                >
                  <Copy size={15} />
                </button>
                <button
                  className="category-action-btn"
                  onClick={() => setActiveMenuId(activeMenuId === cat.id ? null : cat.id)}
                  title="Opções"
                >
                  <MoreVertical size={15} />
                </button>

                {activeMenuId === cat.id && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 36,
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                      zIndex: 100,
                      width: 170,
                      overflow: 'hidden'
                    }}
                  >
                    <button
                      style={{ width: '100%', padding: '8px 12px', border: 'none', background: 'none', textAlign: 'left', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => { setActiveMenuId(null); alert(`Editar ${cat.name}`) }}
                    >
                      <Edit2 size={13} /> Editar categoria
                    </button>
                    <button
                      style={{ width: '100%', padding: '8px 12px', border: 'none', background: 'none', textAlign: 'left', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => { setActiveMenuId(null); setShowModal(true) }}
                    >
                      <Plus size={13} /> Criar subcategoria
                    </button>
                    <button
                      style={{ width: '100%', padding: '8px 12px', border: 'none', background: 'none', textAlign: 'left', fontSize: '0.82rem', cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}
                      onClick={() => { setActiveMenuId(null); handleDeleteCategory(cat.id) }}
                    >
                      <Trash2 size={13} /> Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <a href="#" style={{ fontSize: '0.82rem', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
            Mais sobre criar e organizar as categorias <ExternalLink size={12} style={{ verticalAlign: 'middle' }} />
          </a>
        </div>

      </div>

      {/* Modal Criar Categoria */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Criar Nova Categoria</h3>
            </div>
            <div className="modal-body" style={{ gap: 14 }}>
              <div className="form-group">
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  Nome da Categoria *
                  <button type="button" className="btn-ai-generate" onClick={() => setNewCat({ ...newCat, name: 'Ferramentas de Alta Performance' })}>
                    <Sparkles size={12} /> Gerar com IA
                  </button>
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Parafusadeiras"
                  value={newCat.name}
                  onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>URL amigável (Slug)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="parafusadeiras"
                  value={newCat.slug}
                  onChange={(e) => setNewCat({ ...newCat, slug: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-secondary-action" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="button" className="btn-primary-action" onClick={handleCreateCategory}>Salvar Categoria</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
