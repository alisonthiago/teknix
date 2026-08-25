import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import './ProductForm.css'

interface ProductFormProps {
  productId?: string
}

interface FormData {
  name: string
  slug: string
  sku: string
  barcode: string
  brand: string
  category_id: string
  subcategory: string
  segment: string
  status: 'active' | 'draft' | 'inactive'
  description: string
  short_description: string
  cost_price: number
  sell_price: number
  promo_price: number
  stock_quantity: number
  stock_min: number
  stock_reserved: number
  weight: string
  dimensions: string
  images: string[]
  main_image: string
  specifications: { key: string; value: string; unit: string }[]
  characteristics: { key: string; value: string }[]
  mercadolivre_item_id: string
  mercadolivre_variation_id: string
  mercadolivre_sku: string
  mercadolivre_link: string
  mercadolivre_sync_status: string
  mercadolivre_last_sync: string
  featured: boolean
  is_new: boolean
  show_in_catalog: boolean
  allow_whatsapp: boolean
  seo_title: string
  seo_description: string
  seo_slug: string
}

const initialFormData: FormData = {
  name: '',
  slug: '',
  sku: '',
  barcode: '',
  brand: '',
  category_id: '',
  subcategory: '',
  segment: 'ferramentas',
  status: 'draft',
  description: '',
  short_description: '',
  cost_price: 0,
  sell_price: 0,
  promo_price: 0,
  stock_quantity: 0,
  stock_min: 0,
  stock_reserved: 0,
  weight: '',
  dimensions: '',
  images: [],
  main_image: '',
  specifications: [],
  characteristics: [],
  mercadolivre_item_id: '',
  mercadolivre_variation_id: '',
  mercadolivre_sku: '',
  mercadolivre_link: '',
  mercadolivre_sync_status: '',
  mercadolivre_last_sync: '',
  featured: false,
  is_new: true,
  show_in_catalog: true,
  allow_whatsapp: true,
  seo_title: '',
  seo_description: '',
  seo_slug: '',
}

export default function ProductForm({ productId }: ProductFormProps) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    fetchCategories()
    if (productId) {
      fetchProduct()
    }
  }, [productId])

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('id, name').eq('active', true)
    if (data) setCategories(data)
  }

  async function fetchProduct() {
    if (!productId) return
    setLoading(true)
    const { data } = await supabase.from('products').select('*').eq('id', productId).single()
    if (data) {
      setFormData({
        ...initialFormData,
        ...data,
        images: data.images || [],
        specifications: data.specifications || [],
        characteristics: data.characteristics || [],
      })
    }
    setLoading(false)
  }

  function updateField(field: keyof FormData, value: unknown) {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  function generateSlug(name: string) {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  function handleNameChange(name: string) {
    updateField('name', name)
    if (!productId || !formData.slug) {
      updateField('slug', generateSlug(name))
    }
  }

  const margin = formData.sell_price > 0 && formData.cost_price > 0
    ? ((formData.sell_price - formData.cost_price) / formData.sell_price * 100).toFixed(2)
    : '0.00'

  const profit = formData.sell_price - formData.cost_price

  const availableStock = formData.stock_quantity - formData.stock_reserved

  function addSpecification() {
    updateField('specifications', [...formData.specifications, { key: '', value: '', unit: '' }])
  }

  function removeSpecification(index: number) {
    updateField('specifications', formData.specifications.filter((_, i) => i !== index))
  }

  function updateSpecification(index: number, field: string, value: string) {
    const updated = [...formData.specifications]
    updated[index] = { ...updated[index], [field]: value }
    updateField('specifications', updated)
  }

  function addCharacteristic() {
    updateField('characteristics', [...formData.characteristics, { key: '', value: '' }])
  }

  function removeCharacteristic(index: number) {
    updateField('characteristics', formData.characteristics.filter((_, i) => i !== index))
  }

  function updateCharacteristic(index: number, field: string, value: string) {
    const updated = [...formData.characteristics]
    updated[index] = { ...updated[index], [field]: value }
    updateField('characteristics', updated)
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      const fileName = `products/${Date.now()}-${file.name}`
      const { data } = await supabase.storage
        .from('product-images')
        .upload(fileName, file)

      if (data) {
        const { data: urlData } = supabase.storage
          .from('product-images')
          .getPublicUrl(data.path)

        updateField('images', [...formData.images, urlData.publicUrl])
      }
    }
  }

  function removeImage(index: number) {
    updateField('images', formData.images.filter((_, i) => i !== index))
  }

  function setMainImage(index: number) {
    updateField('main_image', formData.images[index])
  }

  async function handleSave(publish: boolean) {
    setSaving(true)
    setMessage(null)

    const productData = {
      name: formData.name,
      slug: formData.slug || generateSlug(formData.name),
      sku: formData.sku,
      barcode: formData.barcode,
      brand: formData.brand,
      category_id: formData.category_id || null,
      subcategory: formData.subcategory,
      segment: formData.segment,
      status: publish ? 'active' : 'draft',
      description: formData.description,
      short_description: formData.short_description,
      cost_price: formData.cost_price,
      price: formData.sell_price,
      promo_price: formData.promo_price || null,
      stock: formData.stock_quantity,
      stock_min: formData.stock_min,
      stock_reserved: formData.stock_reserved,
      weight: formData.weight,
      dimensions: formData.dimensions,
      image_url: formData.main_image || formData.images[0] || null,
      images: formData.images,
      specifications: formData.specifications,
      characteristics: formData.characteristics,
      mercadolivre_item_id: formData.mercadolivre_item_id || null,
      mercadolivre_variation_id: formData.mercadolivre_variation_id || null,
      mercadolivre_sku: formData.mercadolivre_sku || null,
      mercadolivre_link: formData.mercadolivre_link || null,
      mercadolivre_sync_status: formData.mercadolivre_sync_status || null,
      mercadolivre_last_sync: formData.mercadolivre_last_sync || null,
      featured: formData.featured,
      is_new: formData.is_new,
      show_in_catalog: formData.show_in_catalog,
      allow_whatsapp: formData.allow_whatsapp,
      seo_title: formData.seo_title || formData.name,
      seo_description: formData.seo_description || formData.short_description,
      seo_slug: formData.seo_slug || formData.slug,
      active: publish,
    }

    let result
    if (productId) {
      result = await supabase.from('products').update(productData).eq('id', productId)
    } else {
      result = await supabase.from('products').insert(productData)
    }

    if (result.error) {
      setMessage({ type: 'error', text: 'Não foi possível salvar o produto. Tente novamente.' })
    } else {
      setMessage({ type: 'success', text: 'Produto salvo com sucesso!' })
      if (!productId) {
        setTimeout(() => navigate('/hub/produtos'), 1500)
      }
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="form-loading">
        <div className="spinner"></div>
        <p>Carregando produto...</p>
      </div>
    )
  }

  return (
    <div className="product-form-layout">
      <div className="product-form-main">
        {message && (
          <div className={`form-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* BLOCO 1 - Informações Principais */}
        <div className="form-card">
          <div className="card-header">
            <h3>Informações do produto</h3>
            <p>Dados básicos do produto para identificação e organização</p>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Nome do produto *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="Ex: Furadeira de Impacto Teknix 21V"
                />
              </div>
              <div className="form-group">
                <label>SKU</label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => updateField('sku', e.target.value)}
                  placeholder="Ex: TK-FUR-21V"
                />
              </div>
              <div className="form-group">
                <label>Código de barras</label>
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => updateField('barcode', e.target.value)}
                  placeholder="EAN/UPC"
                />
              </div>
              <div className="form-group">
                <label>Marca</label>
                <input
                  type="text"
                  value={formData.brand}
                  onChange={(e) => updateField('brand', e.target.value)}
                  placeholder="Ex: Teknix"
                />
              </div>
              <div className="form-group">
                <label>Categoria</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => updateField('category_id', e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Subcategoria</label>
                <input
                  type="text"
                  value={formData.subcategory}
                  onChange={(e) => updateField('subcategory', e.target.value)}
                  placeholder="Ex: Furadeiras"
                />
              </div>
              <div className="form-group">
                <label>Segmento</label>
                <select
                  value={formData.segment}
                  onChange={(e) => updateField('segment', e.target.value)}
                >
                  <option value="ferramentas">Ferramentas</option>
                  <option value="informatica">Informática</option>
                  <option value="casa">Casa</option>
                  <option value="automotivo">Automotivo</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => updateField('status', e.target.value)}
                >
                  <option value="active">Ativo</option>
                  <option value="draft">Rascunho</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 2 - Descrição */}
        <div className="form-card">
          <div className="card-header">
            <h3>Descrição</h3>
            <p>Informações detalhadas sobre o produto</p>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Descrição curta</label>
              <textarea
                value={formData.short_description}
                onChange={(e) => updateField('short_description', e.target.value)}
                placeholder="Resumo do produto para exibição no catálogo"
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Descrição completa</label>
              <div className="editor-toolbar">
                <button type="button" title="Negrito"><b>B</b></button>
                <button type="button" title="Itálico"><i>I</i></button>
                <button type="button" title="Sublinhado"><u>U</u></button>
                <span className="toolbar-divider"></span>
                <button type="button" title="Lista">≡</button>
                <button type="button" title="Lista numerada">⋮≡</button>
                <span className="toolbar-divider"></span>
                <button type="button" title="Link">🔗</button>
                <button type="button" title="Imagem">🖼️</button>
              </div>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Descrição completa do produto com especificações, benefícios e detalhes importantes"
                rows={10}
                className="editor-content"
              />
            </div>
          </div>
        </div>

        {/* BLOCO 3 - Fotos */}
        <div className="form-card">
          <div className="card-header">
            <h3>Fotos do produto</h3>
            <p>Adicione imagens de alta qualidade para seu produto</p>
          </div>
          <div className="card-body">
            <div className="images-section">
              <div className="images-label">
                <span className="label-tag main">IMAGEM PRINCIPAL</span>
              </div>
              <div className="images-grid main-images">
                {formData.main_image && (
                  <div className="image-item main">
                    <img src={formData.main_image} alt="Principal" />
                    <button
                      type="button"
                      className="image-remove"
                      onClick={() => updateField('main_image', '')}
                    >
                      ×
                    </button>
                  </div>
                )}
                <label className="image-upload main">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    multiple
                  />
                  <span className="upload-icon">+</span>
                  <span className="upload-text">Adicionar foto principal</span>
                </label>
              </div>
            </div>

            <div className="images-section">
              <div className="images-label">
                <span className="label-tag">IMAGENS ADICIONAIS</span>
              </div>
              <div className="images-grid">
                {formData.images.filter(img => img !== formData.main_image).map((img, i) => (
                  <div key={i} className="image-item">
                    <img src={img} alt={`Produto ${i + 1}`} />
                    <div className="image-actions">
                      <button
                        type="button"
                        className="image-action-btn"
                        onClick={() => setMainImage(formData.images.indexOf(img))}
                        title="Definir como principal"
                      >
                        ⭐
                      </button>
                      <button
                        type="button"
                        className="image-action-btn remove"
                        onClick={() => removeImage(formData.images.indexOf(img))}
                        title="Remover"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
                <label className="image-upload">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    multiple
                  />
                  <span className="upload-icon">+</span>
                  <span className="upload-text">Adicionar foto</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 4 - Preços */}
        <div className="form-card">
          <div className="card-header">
            <h3>Preços</h3>
            <p>Defina os valores do produto</p>
          </div>
          <div className="card-body">
            <div className="form-grid prices-grid">
              <div className="form-group">
                <label>Preço de custo</label>
                <div className="input-prefix">
                  <span>R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cost_price || ''}
                    onChange={(e) => updateField('cost_price', parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Preço de venda</label>
                <div className="input-prefix">
                  <span>R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.sell_price || ''}
                    onChange={(e) => updateField('sell_price', parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Preço promocional</label>
                <div className="input-prefix">
                  <span>R$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.promo_price || ''}
                    onChange={(e) => updateField('promo_price', parseFloat(e.target.value) || 0)}
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>
            <div className="price-calculation">
              <div className="calc-item">
                <span className="calc-label">Lucro bruto</span>
                <span className={`calc-value ${profit > 0 ? 'positive' : profit < 0 ? 'negative' : ''}`}>
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(profit)}
                </span>
              </div>
              <div className="calc-item">
                <span className="calc-label">Margem</span>
                <span className={`calc-value ${parseFloat(margin) > 0 ? 'positive' : parseFloat(margin) < 0 ? 'negative' : ''}`}>
                  {margin}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 5 - Estoque */}
        <div className="form-card">
          <div className="card-header">
            <h3>Estoque</h3>
            <p>Gerencie o estoque do produto</p>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Estoque atual</label>
                <input
                  type="number"
                  value={formData.stock_quantity}
                  onChange={(e) => updateField('stock_quantity', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Estoque mínimo</label>
                <input
                  type="number"
                  value={formData.stock_min}
                  onChange={(e) => updateField('stock_min', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Estoque reservado</label>
                <input
                  type="number"
                  value={formData.stock_reserved}
                  onChange={(e) => updateField('stock_reserved', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="form-group">
                <label>Estoque disponível</label>
                <div className="input-readonly">
                  <span className={availableStock <= 0 ? 'negative' : ''}>{availableStock}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 6 - Características */}
        <div className="form-card">
          <div className="card-header">
            <h3>Características</h3>
            <p>Informações principais do produto</p>
          </div>
          <div className="card-body">
            <div className="dynamic-list">
              {formData.characteristics.map((char, i) => (
                <div key={i} className="dynamic-row">
                  <input
                    type="text"
                    value={char.key}
                    onChange={(e) => updateCharacteristic(i, 'key', e.target.value)}
                    placeholder="Ex: Voltagem"
                    className="field-name"
                  />
                  <input
                    type="text"
                    value={char.value}
                    onChange={(e) => updateCharacteristic(i, 'value', e.target.value)}
                    placeholder="Ex: 21V"
                    className="field-value"
                  />
                  <button
                    type="button"
                    className="remove-row"
                    onClick={() => removeCharacteristic(i)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button type="button" className="add-row" onClick={addCharacteristic}>
                + Adicionar característica
              </button>
            </div>
          </div>
        </div>

        {/* BLOCO 7 - Especificações Técnicas */}
        <div className="form-card">
          <div className="card-header">
            <h3>Especificações técnicas</h3>
            <p>Detalhes técnicos do produto</p>
          </div>
          <div className="card-body">
            <div className="dynamic-list">
              {formData.specifications.map((spec, i) => (
                <div key={i} className="dynamic-row specs-row">
                  <input
                    type="text"
                    value={spec.key}
                    onChange={(e) => updateSpecification(i, 'key', e.target.value)}
                    placeholder="Ex: Potência"
                    className="field-name"
                  />
                  <input
                    type="text"
                    value={spec.value}
                    onChange={(e) => updateSpecification(i, 'value', e.target.value)}
                    placeholder="Ex: 500"
                    className="field-value"
                  />
                  <input
                    type="text"
                    value={spec.unit}
                    onChange={(e) => updateSpecification(i, 'unit', e.target.value)}
                    placeholder="W"
                    className="field-unit"
                  />
                  <button
                    type="button"
                    className="remove-row"
                    onClick={() => removeSpecification(i)}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button type="button" className="add-row" onClick={addSpecification}>
                + Adicionar especificação
              </button>
            </div>
          </div>
        </div>

        {/* BLOCO 8 - Mercado Livre */}
        <div className="form-card">
          <div className="card-header">
            <h3>Mercado Livre</h3>
            <p>Informações da integração com Mercado Livre</p>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>Item ID</label>
                <input
                  type="text"
                  value={formData.mercadolivre_item_id}
                  onChange={(e) => updateField('mercadolivre_item_id', e.target.value)}
                  placeholder="ID do anúncio"
                />
              </div>
              <div className="form-group">
                <label>Variation ID</label>
                <input
                  type="text"
                  value={formData.mercadolivre_variation_id}
                  onChange={(e) => updateField('mercadolivre_variation_id', e.target.value)}
                  placeholder="ID da variação"
                />
              </div>
              <div className="form-group">
                <label>SKU Mercado Livre</label>
                <input
                  type="text"
                  value={formData.mercadolivre_sku}
                  onChange={(e) => updateField('mercadolivre_sku', e.target.value)}
                  placeholder="SKU no ML"
                />
              </div>
              <div className="form-group">
                <label>Status da sincronização</label>
                <input
                  type="text"
                  value={formData.mercadolivre_sync_status}
                  onChange={(e) => updateField('mercadolivre_sync_status', e.target.value)}
                  placeholder="Ex: Sincronizado"
                  disabled
                />
              </div>
              <div className="form-group full-width">
                <label>Link do anúncio</label>
                <input
                  type="url"
                  value={formData.mercadolivre_link}
                  onChange={(e) => updateField('mercadolivre_link', e.target.value)}
                  placeholder="https://www.mercadolivre.com.br/..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* BLOCO 10 - SEO */}
        <div className="form-card">
          <div className="card-header">
            <h3>SEO</h3>
            <p>Otimização para mecanismos de busca</p>
          </div>
          <div className="card-body">
            <div className="form-group">
              <label>Título SEO</label>
              <input
                type="text"
                value={formData.seo_title}
                onChange={(e) => updateField('seo_title', e.target.value)}
                placeholder={formData.name || 'Título para o Google'}
              />
            </div>
            <div className="form-group">
              <label>Descrição SEO</label>
              <textarea
                value={formData.seo_description}
                onChange={(e) => updateField('seo_description', e.target.value)}
                placeholder={formData.short_description || 'Descrição para o Google'}
                rows={3}
              />
            </div>
            <div className="form-group">
              <label>Slug</label>
              <div className="input-prefix slug">
                <span>/produtos/</span>
                <input
                  type="text"
                  value={formData.seo_slug || formData.slug}
                  onChange={(e) => updateField('seo_slug', e.target.value)}
                  placeholder="slug-do-produto"
                />
              </div>
            </div>

            <div className="seo-preview">
              <h4>Prévia no Google</h4>
              <div className="google-preview">
                <span className="preview-url">teknix.com.br/produtos/{formData.seo_slug || formData.slug || 'produto'}</span>
                <span className="preview-title">{formData.seo_title || formData.name || 'Título do produto'}</span>
                <span className="preview-description">
                  {formData.seo_description || formData.short_description || 'Descrição do produto'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="product-form-sidebar">
        <div className="sidebar-card sticky">
          <div className="sidebar-preview">
            {formData.main_image || formData.images[0] ? (
              <img src={formData.main_image || formData.images[0]} alt="Preview" />
            ) : (
              <div className="preview-placeholder">📦</div>
            )}
            <div className="preview-info">
              <span className="preview-name">{formData.name || 'Nome do produto'}</span>
              <span className="preview-price">
                {formData.sell_price
                  ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.promo_price || formData.sell_price)
                  : 'R$ 0,00'
                }
              </span>
              <span className={`preview-status ${formData.status}`}>
                {formData.status === 'active' ? 'Ativo' : formData.status === 'draft' ? 'Rascunho' : 'Inativo'}
              </span>
            </div>
          </div>

          <div className="sidebar-actions">
            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={() => handleSave(true)}
              disabled={saving || !formData.name}
            >
              {saving ? 'Salvando...' : 'Salvar e publicar'}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-full"
              onClick={() => handleSave(false)}
              disabled={saving || !formData.name}
            >
              Salvar rascunho
            </button>
            <button
              type="button"
              className="btn btn-danger btn-full"
              onClick={() => navigate('/hub/produtos')}
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
