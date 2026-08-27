import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { createPage } from '../services/pageBuilder'
import {
  ChevronLeft, Upload, Trash2, Video, Globe,
  CheckCircle, Plus, Eye,
  Percent, Tag, DollarSign, Package, Layers, Sparkles
} from 'lucide-react'
import './ProductForm.css'

interface FormData {
  id?: string
  name: string
  slug: string
  description: string
  short_description: string
  images: string[]
  main_image: string
  video_url: string
  sell_price: number
  has_promo: boolean
  promo_price: number
  cost_price: number
  product_type: 'physical' | 'digital'
  manage_stock: boolean
  stock_quantity: number
  stock_min: number
  sku: string
  barcode: string
  weight: number
  length: number
  width: number
  height: number
  gender: string
  age_group: string
  condition: string
  category_id: string
  brand: string
  tags: string
  variations: { id: string; name: string; sku: string; price: number; stock: number }[]
  seo_title: string
  seo_description: string
  seo_slug: string
  ncm: string
  origin: string
  cest: string
  status: 'active' | 'draft' | 'inactive'
  featured: boolean
  free_shipping: boolean
}

const initialForm: FormData = {
  name: '',
  slug: '',
  description: '',
  short_description: '',
  images: [],
  main_image: '',
  video_url: '',
  sell_price: 0,
  has_promo: false,
  promo_price: 0,
  cost_price: 0,
  product_type: 'physical',
  manage_stock: true,
  stock_quantity: 10,
  stock_min: 2,
  sku: '',
  barcode: '',
  weight: 1.2,
  length: 25,
  width: 15,
  height: 10,
  gender: 'unisex',
  age_group: 'adult',
  condition: 'new',
  category_id: '',
  brand: 'TEKNIX',
  tags: '',
  variations: [],
  seo_title: '',
  seo_description: '',
  seo_slug: '',
  ncm: '',
  origin: '0',
  cest: '',
  status: 'active',
  featured: false,
  free_shipping: false
}

export default function ProductForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id && id !== 'novo')

  const [form, setForm] = useState<FormData>(initialForm)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [showAddCategory, setShowAddCategory] = useState(false)

  useEffect(() => {
    fetchCategories()
    if (isEditing && id) {
      loadProduct(id)
    }
  }, [id])

  async function fetchCategories() {
    try {
      const { data } = await supabase.from('categories').select('id, name').order('name')
      if (data) setCategories(data)
    } catch (e) {
      console.error(e)
    }
  }

  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

  const MOCK_PRODUCTS: Record<string, any> = {
    'demo-1': {
      id: 'demo-1',
      name: 'Parafusadeira e Furadeira de Impacto 12V Bivolt TEKNIX',
      slug: 'parafusadeira-impacto-12v',
      sku: 'TKN-FUR-12V',
      sell_price: 45.00,
      promo_price: 39.90,
      has_promo: true,
      cost_price: 22.50,
      stock_quantity: 100,
      main_image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80',
      images: ['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80'],
      description: 'A Parafusadeira e Furadeira de Impacto TEKNIX 12V Bivolt oferece máxima precisão e autonomia para montagens, reformas e manutenções pesadas. Compacta, ergonômica e com controle eletrônico de torque.',
      short_description: 'Alta potência e torque para perfurações em alvenaria, madeira e metal.',
      status: 'active',
      brand: 'TEKNIX',
      featured: true,
      category_id: '1'
    },
    'demo-2': {
      id: 'demo-2',
      name: 'Disco de Corte Diamantado Extra Fino 110mm',
      slug: 'disco-corte-diamantado',
      sku: 'TKN-DISC-110',
      sell_price: 18.50,
      promo_price: 15.00,
      has_promo: true,
      cost_price: 8.20,
      stock_quantity: 24,
      main_image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80',
      images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80'],
      description: 'Disco diamantado extra fino para corte a seco ou refrigerado de porcelanatos, pisos cerâmicos e mármores.',
      short_description: 'Corte rápido, sem rebarbas e com alta durabilidade.',
      status: 'active',
      brand: 'TEKNIX',
      category_id: '2'
    }
  }

  async function loadProduct(productId: string) {
    setLoading(true)
    try {
      if (MOCK_PRODUCTS[productId] || !isUUID(productId)) {
        const mock = MOCK_PRODUCTS[productId] || MOCK_PRODUCTS['demo-1']
        setForm(prev => ({
          ...prev,
          ...mock
        }))
        return
      }

      const { data, error } = await supabase.from('products').select('*').eq('id', productId).single()
      if (error) throw error
      if (data) {
        setForm({
          id: data.id,
          name: data.name || '',
          slug: data.slug || '',
          description: data.description || '',
          short_description: data.short_description || '',
          images: data.images || (data.main_image ? [data.main_image] : []),
          main_image: data.main_image || '',
          video_url: data.video_url || '',
          sell_price: data.sell_price || data.price || 0,
          has_promo: Boolean(data.promo_price && data.promo_price > 0),
          promo_price: data.promo_price || 0,
          cost_price: data.cost_price || 0,
          product_type: data.product_type || 'physical',
          manage_stock: data.manage_stock !== false,
          stock_quantity: data.stock_quantity ?? data.stock ?? 0,
          stock_min: data.stock_min || 0,
          sku: data.sku || '',
          barcode: data.barcode || '',
          weight: data.weight || 0,
          length: data.length || 0,
          width: data.width || 0,
          height: data.height || 0,
          gender: data.gender || 'unisex',
          age_group: data.age_group || 'adult',
          condition: data.condition || 'new',
          category_id: data.category_id || '',
          brand: data.brand || 'TEKNIX',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || ''),
          variations: data.variations || [],
          seo_title: data.seo_title || data.name || '',
          seo_description: data.seo_description || '',
          seo_slug: data.seo_slug || data.slug || '',
          ncm: data.ncm || '',
          origin: data.origin || '0',
          cest: data.cest || '',
          status: data.status || 'active',
          featured: Boolean(data.featured),
          free_shipping: Boolean(data.free_shipping)
        })
      }
    } catch (e: any) {
      if (MOCK_PRODUCTS[productId]) {
        setForm(prev => ({ ...prev, ...MOCK_PRODUCTS[productId] }))
      } else {
        setMessage({ type: 'error', text: 'Erro ao carregar produto: ' + e.message })
      }
    } finally {
      setLoading(false)
    }
  }

  function handleNameChange(name: string) {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')

    setForm(prev => ({
      ...prev,
      name,
      slug: prev.slug && isEditing ? prev.slug : slug,
      seo_title: prev.seo_title && isEditing ? prev.seo_title : name,
      seo_slug: prev.seo_slug && isEditing ? prev.seo_slug : slug
    }))
  }

  function handleAddImageUrl(url: string) {
    if (!url) return
    const images = [...form.images, url]
    setForm(prev => ({
      ...prev,
      images,
      main_image: prev.main_image || url
    }))
  }

  function handleRemoveImage(index: number) {
    const images = form.images.filter((_, i) => i !== index)
    setForm(prev => ({
      ...prev,
      images,
      main_image: images[0] || ''
    }))
  }

  function handleSetMainImage(url: string) {
    setForm(prev => ({ ...prev, main_image: url }))
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return
    try {
      const slug = newCategoryName.toLowerCase().replace(/\s+/g, '-')
      const { data, error } = await supabase.from('categories').insert({ name: newCategoryName, slug, active: true }).select().single()
      if (error) throw error
      if (data) {
        setCategories(prev => [...prev, data])
        setForm(prev => ({ ...prev, category_id: data.id }))
        setNewCategoryName('')
        setShowAddCategory(false)
      }
    } catch (e: any) {
      alert('Erro ao criar categoria: ' + e.message)
    }
  }

  function handleAddVariation() {
    const newVar = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'Variação ' + (form.variations.length + 1),
      sku: form.sku ? `${form.sku}-V${form.variations.length + 1}` : '',
      price: form.sell_price || 0,
      stock: form.stock_quantity || 10
    }
    setForm(prev => ({ ...prev, variations: [...prev.variations, newVar] }))
  }

  function handleUpdateVariation(index: number, field: string, value: any) {
    const variations = [...form.variations]
    variations[index] = { ...variations[index], [field]: value }
    setForm(prev => ({ ...prev, variations }))
  }

  function handleRemoveVariation(index: number) {
    setForm(prev => ({ ...prev, variations: prev.variations.filter((_, i) => i !== index) }))
  }

  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'Por favor, informe o nome do produto.' })
      return
    }

    setSaving(true)
    setMessage(null)

    try {
      const payload: any = {
        name: form.name,
        slug: form.slug || form.seo_slug,
        description: form.description,
        short_description: form.short_description,
        price: form.sell_price,
        sell_price: form.sell_price,
        promo_price: form.has_promo ? form.promo_price : null,
        cost_price: form.cost_price,
        images: form.images,
        main_image: form.main_image || form.images[0] || '',
        video_url: form.video_url,
        product_type: form.product_type,
        manage_stock: form.manage_stock,
        stock_quantity: form.stock_quantity,
        stock: form.stock_quantity,
        stock_min: form.stock_min,
        sku: form.sku,
        barcode: form.barcode,
        weight: form.weight,
        length: form.length,
        width: form.width,
        height: form.height,
        gender: form.gender,
        age_group: form.age_group,
        condition: form.condition,
        category_id: form.category_id || null,
        brand: form.brand,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        variations: form.variations,
        seo_title: form.seo_title,
        seo_description: form.seo_description,
        seo_slug: form.seo_slug,
        ncm: form.ncm,
        origin: form.origin,
        cest: form.cest,
        status: form.status,
        featured: form.featured,
        free_shipping: form.free_shipping,
        updated_at: new Date().toISOString()
      }

      if (isEditing && id) {
        const { error } = await supabase.from('products').update(payload).eq('id', id)
        if (error) throw error
        setMessage({ type: 'success', text: 'Produto atualizado com sucesso!' })
      } else {
        payload.created_at = new Date().toISOString()
        const { data, error } = await supabase.from('products').insert(payload).select().single()
        if (error) throw error
        setMessage({ type: 'success', text: 'Produto criado com sucesso!' })
        if (data) {
          setTimeout(() => navigate(`/hub/produtos/editar/${data.id}`), 800)
        }
      }
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: 'Erro ao salvar produto: ' + (err.message || 'Verifique os dados.') })
    } finally {
      setSaving(false)
    }
  }

  async function handleOpenVisualEditor() {
    if (!id) return
    try {
      // 1. Check if a page already exists for this product
      const productSlug = form.slug || `produto-${id}`
      const targetSlug = `/produto/${productSlug}`
      const { data: existingPage } = await supabase
        .from('pages')
        .select('id')
        .or(`slug.eq.${targetSlug},slug.eq.${productSlug},slug.eq./${productSlug}`)
        .maybeSingle()

      if (existingPage?.id) {
        window.open(`/editor/page/${existingPage.id}`, '_blank', 'noopener,noreferrer')
        return
      }

      // 2. Create presentation page for this product with TEKNIX Product layout
      const newPage = await createPage({
        title: form.name || 'Apresentação do Produto',
        slug: targetSlug,
        type: 'product',
        status: 'published',
        seo_title: `${form.name || 'Produto'} — TEKNIX`,
        seo_description: form.short_description || form.description?.substring(0, 160) || ''
      })

      // Add Product Showcase Section
      const { data: section } = await supabase.from('page_sections').insert({
        page_id: newPage.id,
        order: 0,
        layout: 'boxed',
        direction: 'row',
        max_width: '1200px',
        padding_top: '60px',
        padding_bottom: '60px',
        bg_type: 'color',
        bg_color: '#ffffff'
      }).select().single()

      if (section) {
        // Left Column: Product Image
        const { data: colLeft } = await supabase.from('page_containers').insert({
          section_id: section.id,
          order: 0,
          direction: 'column',
          width: '50%',
          align_items: 'center',
          gap: '16px'
        }).select().single()

        if (colLeft) {
          await supabase.from('page_widgets').insert({
            container_id: colLeft.id,
            type: 'image',
            order: 0,
            content: { image: form.main_image || form.images?.[0] || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&auto=format&fit=crop&q=80', alt: form.name },
            border_radius: '16px',
            width: '100%'
          })
        }

        // Right Column: Product Details
        const { data: colRight } = await supabase.from('page_containers').insert({
          section_id: section.id,
          order: 1,
          direction: 'column',
          width: '50%',
          align_items: 'flex-start',
          gap: '16px'
        }).select().single()

        if (colRight) {
          await supabase.from('page_widgets').insert([
            {
              container_id: colRight.id,
              type: 'text',
              order: 0,
              content: { text: 'TEKNIX PROFISSIONAL', tag: 'span' },
              font_size: '12px',
              font_weight: '700',
              color: '#00cc6a',
              letter_spacing: '0.12em',
              text_transform: 'uppercase'
            },
            {
              container_id: colRight.id,
              type: 'heading',
              order: 1,
              content: { text: form.name || 'Produto TEKNIX', tag: 'h1' },
              font_size: '36px',
              font_weight: '800',
              color: '#1d1d1f',
              line_height: '1.15'
            },
            {
              container_id: colRight.id,
              type: 'heading',
              order: 2,
              content: { text: `R$ ${(form.sell_price || 0).toFixed(2).replace('.', ',')}`, tag: 'h2' },
              font_size: '30px',
              font_weight: '800',
              color: '#1d1d1f'
            },
            {
              container_id: colRight.id,
              type: 'text',
              order: 3,
              content: { text: form.description || form.short_description || 'Produto profissional de alta performance e durabilidade garantida TEKNIX.', tag: 'p' },
              font_size: '16px',
              color: '#6e6e73',
              line_height: '1.6'
            },
            {
              container_id: colRight.id,
              type: 'button',
              order: 4,
              content: { label: 'Comprar Agora', button_link: '/checkout' },
              bg_type: 'color',
              bg_color: '#00cc6a',
              color: '#ffffff',
              border_radius: '980px',
              padding_top: '16px',
              padding_bottom: '16px',
              padding_left: '36px',
              padding_right: '36px',
              font_weight: '700'
            }
          ])
        }
      }

      window.open(`/editor/page/${newPage.id}`, '_blank', 'noopener,noreferrer')
    } catch (e) {
      console.warn('Fallback to editor:', e)
      window.open('/editor/page/new', '_blank', 'noopener,noreferrer')
    }
  }

  // Margem e lucro calculados
  const profit = (form.sell_price || 0) - (form.cost_price || 0)
  const marginPercent = form.sell_price > 0 ? ((profit / form.sell_price) * 100).toFixed(1) : '0.0'
  const discountPercent = (form.has_promo && form.sell_price > 0 && form.promo_price > 0)
    ? (((form.sell_price - form.promo_price) / form.sell_price) * 100).toFixed(0)
    : '0'

  if (loading) {
    return (
      <div className="product-form-container" style={{ justifyContent: 'center' }}>
        <div style={{ color: '#6b7280', fontSize: '0.95rem' }}>Carregando dados do produto...</div>
      </div>
    )
  }

  return (
    <div className="product-form-container">
      <div className="product-form-wrapper">
        
        {/* Top Header */}
        <div className="product-form-header">
          <div className="header-left">
            <button className="btn-back" onClick={() => navigate('/hub/produtos')} title="Voltar aos produtos">
              <ChevronLeft size={20} />
            </button>
            <h1 className="product-form-title">
              {form.name || (isEditing ? 'Editar Produto' : 'Novo Produto')}
              <span className={`product-status-pill ${form.status === 'active' ? 'active' : 'draft'}`}>
                {form.status === 'active' ? 'Ativo' : 'Rascunho'}
              </span>
            </h1>
          </div>
          <div className="header-right">
            {isEditing && (
              <button
                type="button"
                onClick={handleOpenVisualEditor}
                className="btn-secondary-action"
                style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
                title="Abrir Apresentação do Produto no Page Builder em Nova Aba"
              >
                <Sparkles size={14} color="#e91e63" /> Editor Visual
              </button>
            )}
            <button className="btn-secondary-action" onClick={() => navigate('/hub/produtos')}>
              Cancelar
            </button>
            <button className="btn-primary-action" onClick={() => handleSubmit()} disabled={saving}>
              {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Publicar Produto'}
            </button>
          </div>
        </div>

        {message && (
          <div style={{
            padding: '12px 16px',
            borderRadius: 8,
            fontSize: '0.88rem',
            fontWeight: 600,
            background: message.type === 'success' ? '#e6f9f0' : '#fee2e2',
            color: message.type === 'success' ? '#00a854' : '#dc2626',
            border: `1px solid ${message.type === 'success' ? '#b7eb8f' : '#fca5a5'}`
          }}>
            {message.text}
          </div>
        )}

        {/* 1. NOME E DESCRIÇÃO */}
        <div className="form-card">
          <h2 className="card-title">Nome e descrição</h2>
          <div className="form-group">
            <label>
              Nome *
              <span className="field-hint">{form.name.length}/100</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Ex: Parafusadeira e Furadeira de Impacto 12V Bivolt"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Descrição</span>
              <button
                type="button"
                className="btn-ai-generate"
                onClick={() => setForm({
                  ...form,
                  description: `${form.name || 'Produto'}: Desenvolvido com alta tecnologia e componentes de primeira linha para oferecer a melhor performance, durabilidade e confiabilidade. Ideal para profissionais e entusiastas que buscam excelência.`
                })}
              >
                <Sparkles size={12} /> Gerar com IA
              </button>
            </label>
            <div className="rich-editor-wrapper">
              <div className="rich-editor-toolbar">
                <button type="button" className="toolbar-btn" onClick={() => {}} title="Negrito"><strong>B</strong></button>
                <button type="button" className="toolbar-btn" onClick={() => {}} title="Itálico"><em>I</em></button>
                <button type="button" className="toolbar-btn" onClick={() => {}} title="Sublinhado"><u>U</u></button>
                <button type="button" className="toolbar-btn" onClick={() => {}} title="Lista">• Lista</button>
                <button type="button" className="toolbar-btn" onClick={() => {}} title="Alinhamento">≡</button>
                <button type="button" className="toolbar-btn" onClick={() => {}} title="Inserir Link">🔗</button>
              </div>
              <textarea
                className="rich-editor-textarea"
                placeholder="Descreva as principais características, vantagens e detalhes técnicos do produto..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 2. FOTOS E VÍDEOS */}
        <div className="form-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 className="card-title" style={{ margin: 0 }}>Fotos e vídeos</h2>
            <span style={{ background: '#eff6ff', color: '#2563eb', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
              Vídeo em Beta
            </span>
          </div>
          <p className="card-subtitle">
            Arraste e solte, ou selecione fotos e vídeo do produto. Tamanho mínimo recomendado: 1280px (WEBP, PNG, JPEG, GIF).
          </p>

          <div className="upload-dropzone" onClick={() => {
            const url = prompt('Cole a URL da imagem (ou hospede via Nuvem/Supabase):')
            if (url) handleAddImageUrl(url)
          }}>
            <Upload size={28} className="upload-icon" />
            <div className="upload-prompt">Arraste e solte, ou selecione fotos e vídeo do produto</div>
            <div className="upload-subprompt">Tamanho mínimo recomendado: 1280px / Formatos: WEBP, PNG, JPEG, GIF</div>
          </div>

          {form.images.length > 0 && (
            <div className="photos-grid">
              {form.images.map((img, idx) => (
                <div key={idx} className={`photo-card ${form.main_image === img ? 'is-main' : ''}`} onClick={() => handleSetMainImage(img)}>
                  <img src={img} alt={`Foto ${idx + 1}`} />
                  {form.main_image === img && <span className="photo-badge-main">Principal</span>}
                  <button
                    type="button"
                    className="photo-delete-btn"
                    onClick={(e) => { e.stopPropagation(); handleRemoveImage(idx) }}
                    title="Remover foto"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="form-group" style={{ marginTop: 8 }}>
            <label><Video size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Link para vídeo externo</label>
            <input
              type="text"
              className="form-input"
              placeholder="Cole um link do YouTube ou do Vimeo sobre o seu produto"
              value={form.video_url}
              onChange={(e) => setForm({ ...form, video_url: e.target.value })}
            />
          </div>
        </div>

        {/* 3. PREÇOS */}
        <div className="form-card">
          <h2 className="card-title">Preços</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Preço de venda (R$) *</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="0,00"
                value={form.sell_price || ''}
                onChange={(e) => setForm({ ...form, sell_price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="form-group">
              <label>Preço promocional (R$)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="0,00"
                value={form.promo_price || ''}
                onChange={(e) => setForm({ ...form, promo_price: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <label className="toggle-switch-label">
            <input
              type="checkbox"
              className="toggle-switch-input"
              checked={form.has_promo}
              onChange={(e) => setForm({ ...form, has_promo: e.target.checked })}
            />
            Exibir o preço promocional na loja
          </label>

          <div className="form-row" style={{ marginTop: 6 }}>
            <div className="form-group">
              <label>Custo (R$)</label>
              <input
                type="number"
                step="0.01"
                className="form-input"
                placeholder="0,00"
                value={form.cost_price || ''}
                onChange={(e) => setForm({ ...form, cost_price: parseFloat(e.target.value) || 0 })}
              />
              <span className="field-hint">É para uso interno, os seus clientes não o verão na loja.</span>
            </div>

            {form.cost_price > 0 && form.sell_price > 0 && (
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div className="margin-indicator" style={{ width: '100%' }}>
                  <div className="margin-stat">Margem de lucro: <strong>{marginPercent}%</strong></div>
                  <div className="margin-stat">Lucro: <strong>R$ {profit.toFixed(2)}</strong></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. TIPO DE PRODUTO */}
        <div className="form-card">
          <h2 className="card-title">Tipo de produto</h2>
          <div className="radio-group">
            <label className={`radio-card ${form.product_type === 'physical' ? 'active' : ''}`}>
              <input
                type="radio"
                name="product_type"
                checked={form.product_type === 'physical'}
                onChange={() => setForm({ ...form, product_type: 'physical' })}
              />
              <div>
                <strong>Físico</strong>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Requer frete e envio</div>
              </div>
            </label>
            <label className={`radio-card ${form.product_type === 'digital' ? 'active' : ''}`}>
              <input
                type="radio"
                name="product_type"
                checked={form.product_type === 'digital'}
                onChange={() => setForm({ ...form, product_type: 'digital' })}
              />
              <div>
                <strong>Digital / serviço</strong>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Sem cálculo de frete</div>
              </div>
            </label>
          </div>
        </div>

        {/* 5. INVENTÁRIO & CÓDIGOS */}
        <div className="form-card">
          <h2 className="card-title">Inventário</h2>
          
          <div className="radio-group" style={{ marginBottom: 12 }}>
            <label className={`radio-card ${!form.manage_stock ? 'active' : ''}`}>
              <input
                type="radio"
                name="stock_type"
                checked={!form.manage_stock}
                onChange={() => setForm({ ...form, manage_stock: false })}
              />
              <div>
                <strong>Infinito</strong>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Venda sem limite de quantidade</div>
              </div>
            </label>

            <label className={`radio-card ${form.manage_stock ? 'active' : ''}`}>
              <input
                type="radio"
                name="stock_type"
                checked={form.manage_stock}
                onChange={() => setForm({ ...form, manage_stock: true })}
              />
              <div>
                <strong>Limitado</strong>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Controlar quantidade em estoque</div>
              </div>
            </label>
          </div>

          {form.manage_stock && (
            <div className="form-row">
              <div className="form-group">
                <label>Quantidade em estoque</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.stock_quantity}
                  onChange={(e) => setForm({ ...form, stock_quantity: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>Estoque mínimo para aviso</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.stock_min}
                  onChange={(e) => setForm({ ...form, stock_min: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          )}

          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '14px 0 0 0', color: '#111827' }}>Códigos</h3>
          <div className="form-row">
            <div className="form-group">
              <label>SKU</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: TKN-FUR-12V"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
              <span className="field-hint">SKU é um código que você cria internamente para controle dos seus produtos.</span>
            </div>
            <div className="form-group">
              <label>Código de barras (EAN)</label>
              <input
                type="text"
                className="form-input"
                placeholder="789..."
                value={form.barcode}
                onChange={(e) => setForm({ ...form, barcode: e.target.value })}
              />
              <span className="field-hint">O código de barras é composto por 13 números e identifica o produto.</span>
            </div>
          </div>
        </div>

        {/* 6. PESO E DIMENSÕES */}
        {form.product_type === 'physical' && (
          <div className="form-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card-title" style={{ margin: 0 }}>Peso e dimensões</h2>
              <button
                type="button"
                className="btn-ai-generate"
                onClick={() => setForm({ ...form, weight: 1.5, length: 25, width: 15, height: 10 })}
              >
                <Sparkles size={12} /> Gerar com IA
              </button>
            </div>
            <p className="card-subtitle">Preencha os dados para calcular o custo de envio dos produtos e mostrar os meios de envio na sua loja.</p>

            <div className="form-row four-cols">
              <div className="form-group">
                <label>Peso (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-input"
                  value={form.weight || ''}
                  onChange={(e) => setForm({ ...form, weight: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>Comprimento (cm)</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.length || ''}
                  onChange={(e) => setForm({ ...form, length: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>Largura (cm)</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.width || ''}
                  onChange={(e) => setForm({ ...form, width: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="form-group">
                <label>Altura (cm)</label>
                <input
                  type="number"
                  className="form-input"
                  value={form.height || ''}
                  onChange={(e) => setForm({ ...form, height: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        )}

        {/* 7. INSTAGRAM E GOOGLE SHOPPING */}
        <div className="form-card">
          <h2 className="card-title">Instagram e Google Shopping</h2>
          <p className="card-subtitle">Destaque seus produtos nas vitrines virtuais do Instagram e do Google gratuitamente.</p>

          <div className="form-row three-cols">
            <div className="form-group">
              <label>MPN</label>
              <input
                type="text"
                className="form-input"
                placeholder="Código do Fabricante"
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Faixa etária</label>
              <select
                className="form-select"
                value={form.age_group}
                onChange={(e) => setForm({ ...form, age_group: e.target.value })}
              >
                <option value="adult">Adulto</option>
                <option value="5-13">5 a 13 anos</option>
                <option value="1-5">1 a 5 anos</option>
                <option value="3-12m">3 a 12 meses</option>
                <option value="0-3m">0 a 3 meses</option>
              </select>
            </div>

            <div className="form-group">
              <label>Sexo</label>
              <select
                className="form-select"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="unisex">Produto sem gênero</option>
                <option value="male">Produto masculino</option>
                <option value="female">Produto feminino</option>
              </select>
            </div>
          </div>
        </div>

        {/* 8. CATEGORIAS */}
        <div className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title" style={{ margin: 0 }}>Categorias</h2>
            <button
              type="button"
              className="btn-ai-generate"
              onClick={() => alert('IA sugeriu a categoria principal com base no nome do produto.')}
            >
              <Sparkles size={12} /> Gerar com IA
            </button>
          </div>
          <p className="card-subtitle">Você vai ajudar seus clientes a encontrarem seus produtos mais rápido.</p>

          <div className="form-group">
            <select
              className="form-select"
              value={form.category_id}
              onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            >
              <option value="">Selecione uma categoria...</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            
            {!showAddCategory ? (
              <button
                type="button"
                onClick={() => setShowAddCategory(true)}
                style={{ background: 'none', border: 'none', color: '#111827', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', textAlign: 'left', marginTop: 4 }}
              >
                + Adicionar categorias
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nome da categoria"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
                <button type="button" className="btn-primary-action" onClick={handleCreateCategory}>Criar</button>
                <button type="button" className="btn-secondary-action" onClick={() => setShowAddCategory(false)}>X</button>
              </div>
            )}
          </div>
        </div>

        {/* 9. VARIAÇÕES */}
        <div className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title">Variações</h2>
              <p className="card-subtitle">Combine diferentes propriedades do seu produto. Exemplo: cor + voltagem + tamanho.</p>
            </div>
            <button type="button" className="btn-secondary-action" onClick={handleAddVariation}>
              Criar variações
            </button>
          </div>

          {form.variations.length > 0 ? (
            <table className="variations-table">
              <thead>
                <tr>
                  <th>Propriedade</th>
                  <th>SKU</th>
                  <th>Preço (R$)</th>
                  <th>Estoque</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {form.variations.map((v, i) => (
                  <tr key={v.id || i}>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        value={v.name}
                        onChange={(e) => handleUpdateVariation(i, 'name', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-input"
                        value={v.sku}
                        onChange={(e) => handleUpdateVariation(i, 'sku', e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        value={v.price}
                        onChange={(e) => handleUpdateVariation(i, 'price', parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-input"
                        value={v.stock}
                        onChange={(e) => handleUpdateVariation(i, 'stock', parseInt(e.target.value) || 0)}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        onClick={() => handleRemoveVariation(i)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '16px', textAlign: 'center', color: '#9ca3af', fontSize: '0.85rem', background: '#fafbfc', borderRadius: 8 }}>
              Nenhuma variação adicionada. O produto será vendido com opção única.
            </div>
          )}
        </div>

        {/* 10. SEO E BUSCA NA LOJA */}
        <div className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="card-title" style={{ margin: 0 }}><Globe size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} /> SEO e busca na loja</h2>
            <button
              type="button"
              className="btn-ai-generate"
              onClick={() => {
                setForm({
                  ...form,
                  seo_title: `${form.name || 'Produto'} — Melhor Preço | TEKNIX`,
                  seo_description: `Compre ${form.name || 'este produto'} com o melhor preço, garantia oficial e entrega rápida para todo o Brasil. Confira!`,
                  tags: 'ferramentas, profissional, eletrica, teknix, garantia'
                })
              }}
            >
              <Sparkles size={12} /> Gerar com IA
            </button>
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              Tags
              <span className="field-hint">Adicione palavras-chave para ajudar seus clientes a encontrar este produto na loja.</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="ferramentas, furadeira, sem fio, 12v"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              Marca
              <span className="field-hint">Informe a marca para identificar o produto.</span>
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="TEKNIX"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
          </div>

          <div className="google-preview-box" style={{ marginTop: 10 }}>
            <div className="google-preview-url">
              https://teknix.com.br/produtos/{form.seo_slug || form.slug || 'nome-do-produto'}
            </div>
            <div className="google-preview-title">
              {form.seo_title || form.name || 'Título SEO do Produto — Loja TEKNIX'}
            </div>
            <p className="google-preview-snippet">
              {form.seo_description || 'Defina a descrição SEO para aparecer em destaque no Google e redes sociais.'}
            </p>
          </div>

          <div className="form-group">
            <label>
              Título SEO
              <span className="field-hint">{form.seo_title.length}/70 caracteres</span>
            </label>
            <input
              type="text"
              className="form-input"
              value={form.seo_title}
              onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>
              Descrição SEO
              <span className="field-hint">{form.seo_description.length}/160 caracteres</span>
            </label>
            <textarea
              className="form-textarea"
              rows={2}
              value={form.seo_description}
              onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>URL do produto</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://teknix.com.br/produtos/..."
              value={form.seo_slug}
              onChange={(e) => setForm({ ...form, seo_slug: e.target.value })}
            />
            <span className="field-hint">Defina uma URL simples para facilitar sua busca. Caso não defina, geraremos automaticamente.</span>
          </div>
        </div>

        {/* 11. DESTAQUE E SEÇÕES */}
        <div className="form-card">
          <h2 className="card-title">Destacar produto</h2>
          <p className="card-subtitle">Escolha em quais seções da sua loja você quer destacar este produto para dar-lhe mais visibilidade.</p>

          <label className="toggle-switch-label">
            <input
              type="checkbox"
              className="toggle-switch-input"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Exibir na seção de Produtos em Destaque na Home
          </label>
        </div>

        {/* 12. DADOS PARA NOTA FISCAL */}
        <div className="form-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h2 className="card-title" style={{ margin: 0 }}>Dados para nota fiscal</h2>
            <span style={{ background: '#e6f9f0', color: '#059669', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
              Novo
            </span>
          </div>
          <p className="card-subtitle">Os dados são obrigatórios para a emissão da nota fiscal eletrônica (NF-e).</p>

          <div className="form-group">
            <label>Origem da mercadoria</label>
            <select
              className="form-select"
              value={form.origin}
              onChange={(e) => setForm({ ...form, origin: e.target.value })}
            >
              <option value="0">0 – Nacional, exceto as indicadas nos códigos de 3 a 5</option>
              <option value="1">1 – Estrangeira, com importação direta, exceto a indicada no código 6</option>
              <option value="2">2 – Estrangeira, adquirida no mercado interno, exceto a indicada no código 7</option>
              <option value="3">3 – Nacional, mercadoria ou bem com conteúdo de importação superior a 40%</option>
              <option value="4">4 – Nacional, cuja produção tenha sido desenvolvida em conformidade com os processos produtivos básicos</option>
              <option value="5">5 – Nacional, mercadoria ou bem com conteúdo de importação inferior ou igual a 40%</option>
              <option value="6">6 – Estrangeira, importação direta, sem similar nacional</option>
              <option value="7">7 – Estrangeira, adquirida no mercado interno, sem similar nacional</option>
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Tipo de item</label>
              <select className="form-select">
                <option value="revenda">Revenda de mercadoria</option>
                <option value="propria">Produção própria</option>
              </select>
            </div>

            <div className="form-group">
              <label>NCM</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: 8467.21.00"
                value={form.ncm}
                onChange={(e) => setForm({ ...form, ncm: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>CEST</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ex: 08.001.00"
                value={form.cest}
                onChange={(e) => setForm({ ...form, cest: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* 13. VISIBILIDADE E FRETE */}
        <div className="form-card">
          <h2 className="card-title">Visibilidade</h2>
          <p className="card-subtitle">Defina como o produto aparece na loja.</p>
          
          <div className="radio-group" style={{ marginBottom: 14 }}>
            <label className={`radio-card ${form.status === 'active' ? 'active' : ''}`}>
              <input
                type="radio"
                name="visibility"
                checked={form.status === 'active'}
                onChange={() => setForm({ ...form, status: 'active' })}
              />
              <div>
                <strong>Visível</strong>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Aparece na loja, buscadores e canais</div>
              </div>
            </label>

            <label className={`radio-card ${form.status === 'draft' ? 'active' : ''}`}>
              <input
                type="radio"
                name="visibility"
                checked={form.status === 'draft'}
                onChange={() => setForm({ ...form, status: 'draft' })}
              />
              <div>
                <strong>Não listado</strong>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Acessível somente via link direto</div>
              </div>
            </label>

            <label className={`radio-card ${form.status === 'inactive' ? 'active' : ''}`}>
              <input
                type="radio"
                name="visibility"
                checked={form.status === 'inactive'}
                onChange={() => setForm({ ...form, status: 'inactive' })}
              />
              <div>
                <strong>Oculto</strong>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Indisponível para clientes</div>
              </div>
            </label>
          </div>

          <h2 className="card-title" style={{ marginTop: 8 }}>Frete</h2>
          <label className="toggle-switch-label">
            <input
              type="checkbox"
              className="toggle-switch-input"
              checked={form.free_shipping}
              onChange={(e) => setForm({ ...form, free_shipping: e.target.checked })}
            />
            Esse produto possui frete grátis
          </label>
        </div>

        {/* Sticky Bottom Save Bar */}
        <div className="product-form-footer">
          <button type="button" className="btn-secondary-action" onClick={() => navigate('/hub/produtos')}>
            Cancelar
          </button>
          <button type="button" className="btn-primary-action" onClick={() => handleSubmit()} disabled={saving}>
            {saving ? 'Salvando...' : isEditing ? 'Salvar Alterações' : 'Publicar Produto'}
          </button>
        </div>

      </div>
    </div>
  )
}

