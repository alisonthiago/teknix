import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ChevronLeft, Upload, Trash2, Video, Globe,
  CheckCircle, Plus, Eye,
  Percent, Tag, DollarSign, Package, Layers, Sparkles,
  X, ExternalLink, Check, Play, Loader2, Film
} from 'lucide-react'
import './ProductForm.css'
import './ProductCommerce.css'
import { DEFAULT_COMMERCE, normalizeCommerce, validateCommerce, productPricing, type ProductCommerce } from '../../../../packages/core/src/productCommerce'

interface FormData {
  commerce: ProductCommerce
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
  published: boolean
  featured: boolean
  free_shipping: boolean
}

const initialForm: FormData = {
  commerce: DEFAULT_COMMERCE,
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
  published: false,
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
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishedSlug, setPublishedSlug] = useState('')

  // Estados para Upload de Fotos e Vídeo
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingMedia, setIsUploadingMedia] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [previewVideoModal, setPreviewVideoModal] = useState<string | null>(null)

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
        const { data: store } = await supabase.from('product_store_metadata').select('*').eq('product_id', productId).maybeSingle()
        const specs = store?.specifications || {}
        const commerceObj = store?.seo?.commerce || (specs && typeof specs === 'object' && !Array.isArray(specs) ? specs.commerce : null) || store?.commercial_settings || {}
        const freeShippingVal = store?.seo?.freeShipping ?? (specs && typeof specs === 'object' && !Array.isArray(specs) ? specs.freeShipping : null) ?? Boolean(data.free_shipping)

        const conditionVal = commerceObj?.condition || data.condition || 'Novo'
        const soldCountVal = commerceObj?.soldCount || data.sold_count || store?.seo?.sold_count || '+10 mil vendidos'

        setForm({
          commerce: normalizeCommerce({
            freeShipping: freeShippingVal,
            condition: conditionVal,
            soldCount: soldCountVal,
            ...commerceObj
          }),
          free_shipping: freeShippingVal,
          published: store?.published ?? (data.status === 'active'),
          id: data.id,
          name: data.name || '',
          slug: store?.slug || data.slug || '',
          description: data.notes || data.description || store?.store_description || '',
          short_description: store?.short_description || data.short_description || '',
          images: Array.isArray(specs.gallery_images) && specs.gallery_images.length
            ? specs.gallery_images
            : (data.main_image || data.image_url ? [data.main_image || data.image_url] : []),
          main_image: data.main_image || data.image_url || '',
          video_url: data.video_url || (typeof specs === 'object' && !Array.isArray(specs) ? specs.video_url : null) || store?.seo?.video_url || commerceObj?.video_url || '',
          sell_price: store?.sale_price ?? data.sell_price ?? data.price ?? (data.cost_purchase ? Number((data.cost_purchase * 1.6).toFixed(2)) : 0),
          has_promo: Boolean((store ? store.promotional_price : data.promo_price) > 0),
          promo_price: (store ? store.promotional_price : data.promo_price) ?? 0,
          cost_price: data.cost_purchase || data.cost_price || 0,
          product_type: data.product_type || 'physical',
          manage_stock: data.manage_stock !== false,
          stock_quantity: data.stock ?? data.stock_quantity ?? 0,
          stock_min: data.min_stock || data.stock_min || 0,
          sku: data.sku || '',
          barcode: data.ean || data.barcode || '',
          weight: data.weight || 0,
          length: data.length || 0,
          width: data.width || 0,
          height: data.height || 0,
          gender: data.gender || 'unisex',
          age_group: data.age_group || 'adult',
          condition: data.condition || 'new',
          category_id: store?.category_id || data.category_id || '',
          brand: data.brand || 'TEKNIX',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || specs.tags || ''),
          variations: data.variations || specs.variations || [],
          seo_title: store?.seo?.title || data.seo_title || data.name || '',
          seo_description: store?.seo?.description || data.seo_description || '',
          seo_slug: store?.slug || data.seo_slug || data.slug || '',
          ncm: data.ncm || specs.ncm || '',
          origin: data.origin || specs.origin || '0',
          cest: data.cest || specs.cest || '',
          status: data.status || 'active',
          featured: Boolean(store?.featured || data.featured)
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

  function getYoutubeVideoId(url?: string): string | null {
    if (!url) return null
    const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
    return match ? match[1] : null
  }

  async function handleUploadFiles(files: FileList | File[]) {
    if (!files || files.length === 0) return
    setIsUploadingMedia(true)
    setUploadStatus('Processando mídias...')

    const fileArray = Array.from(files)
    const newImages: string[] = []

    for (const file of fileArray) {
      if (file.type.startsWith('video/')) {
        setUploadStatus(`Enviando vídeo: ${file.name}...`)
        try {
          const ext = file.name.split('.').pop() || 'mp4'
          const path = `products/videos/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`

          let videoUrl = ''
          const { error: uploadError } = await supabase.storage.from('media').upload(path, file, {
            upsert: true,
            contentType: file.type
          })

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
            videoUrl = urlData.publicUrl
          } else {
            const { error: uploadError2 } = await supabase.storage.from('uploads').upload(path, file, {
              upsert: true,
              contentType: file.type
            })
            if (!uploadError2) {
              const { data: urlData2 } = supabase.storage.from('uploads').getPublicUrl(path)
              videoUrl = urlData2.publicUrl
            } else {
              videoUrl = URL.createObjectURL(file)
            }
          }

          if (videoUrl) {
            setForm(prev => ({ ...prev, video_url: videoUrl }))
          }
        } catch (err) {
          console.warn('Erro no upload do vídeo, usando blob URL fallback:', err)
          const blobUrl = URL.createObjectURL(file)
          setForm(prev => ({ ...prev, video_url: blobUrl }))
        }
      } else if (file.type.startsWith('image/')) {
        setUploadStatus(`Enviando foto: ${file.name}...`)
        try {
          const ext = file.name.split('.').pop() || 'jpg'
          const path = `products/images/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`

          let imgUrl = ''
          const { error: uploadError } = await supabase.storage.from('media').upload(path, file, {
            upsert: true,
            contentType: file.type
          })

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
            imgUrl = urlData.publicUrl
          } else {
            const { error: uploadError2 } = await supabase.storage.from('uploads').upload(path, file, {
              upsert: true,
              contentType: file.type
            })
            if (!uploadError2) {
              const { data: urlData2 } = supabase.storage.from('uploads').getPublicUrl(path)
              imgUrl = urlData2.publicUrl
            } else {
              imgUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.readAsDataURL(file)
              })
            }
          }

          if (imgUrl) {
            newImages.push(imgUrl)
          }
        } catch (err) {
          console.warn('Erro no upload da foto, usando FileReader:', err)
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(file)
          })
          if (dataUrl) newImages.push(dataUrl)
        }
      }
    }

    if (newImages.length > 0) {
      setForm(prev => {
        const combined = [...prev.images, ...newImages]
        return {
          ...prev,
          images: combined,
          main_image: prev.main_image || combined[0]
        }
      })
    }

    setIsUploadingMedia(false)
    setUploadStatus('')
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

  /**
   * Sincroniza o vínculo automático do produto com a publicação da loja.
   * Cria/atualiza a linha em product_store_metadata, que é a fonte usada
   * pelo SITE para exibir o produto na vitrine pública.
   */
  async function syncStoreMetadata(productId: string, isPublished: boolean) {
    try {
      const { data: existing } = await supabase
        .from('product_store_metadata')
        .select('id, specifications, seo')
        .eq('product_id', productId)
        .maybeSingle()

      const existingSpecs = (existing?.specifications && typeof existing.specifications === 'object' && !Array.isArray(existing.specifications))
        ? existing.specifications
        : {}

      const existingSeo = (existing?.seo && typeof existing.seo === 'object' && !Array.isArray(existing.seo))
        ? existing.seo
        : {}

      const meta: any = {
        product_id: productId,
        category_id: form.category_id || null,
        sale_price: form.sell_price ? Number(form.sell_price) : null,
        promotional_price: (form.has_promo && form.promo_price) ? Number(form.promo_price) : null,
        slug: form.seo_slug || form.slug || `produto-${productId}`,
        published: isPublished,
        featured: Boolean(form.featured),
        short_description: form.short_description || '',
        store_description: form.description || '',
        specifications: {
          ...existingSpecs,
          gallery_images: form.images.filter(Boolean),
          video_url: form.video_url || null,
          variations: form.variations || [],
          tags: form.tags || ''
        },
        seo: {
          ...existingSeo,
          title: form.seo_title || form.name,
          description: form.seo_description || form.short_description,
          commerce: {
            ...form.commerce,
            video_url: form.video_url || null
          },
          video_url: form.video_url || null,
          freeShipping: Boolean(form.free_shipping)
        },
        updated_at: new Date().toISOString()
      }

      if (existing?.id) {
        const { error } = await supabase
          .from('product_store_metadata')
          .update(meta)
          .eq('id', existing.id)
        if (error) {
          console.warn('Aviso ao atualizar product_store_metadata:', error.message)
        }
      } else {
        const { error } = await supabase
          .from('product_store_metadata')
          .insert(meta)
        if (error) {
          console.warn('Aviso ao inserir product_store_metadata:', error.message)
        }
      }
    } catch (err: any) {
      console.warn('Erro ao salvar metadados da loja:', err)
    }
  }

  async function handleSubmit(e?: React.FormEvent, forcePublish?: boolean) {
    if (e) e.preventDefault()
    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'Por favor, informe o nome do produto.' })
      return
    }

    setSaving(true)
    setMessage(null)

    const willPublish = forcePublish !== undefined ? forcePublish : form.published

    const commerceError = validateCommerce(form.commerce, form.sell_price, form.has_promo ? form.promo_price : null)
    if (commerceError) { setMessage({ type: 'error', text: commerceError }); setSaving(false); return }

    try {
      // Envia estritamente as colunas reais existentes na tabela products do Supabase
      const payload: any = {
        name: form.name.trim(),
        sku: form.sku?.trim() || null,
        brand: form.brand || 'TEKNIX',
        model: (form as any).model || null,
        ean: form.barcode || null,
        category: form.category_id || 'Geral',
        cost_purchase: form.cost_price ? Number(form.cost_price) : 0,
        weight: form.weight ? Number(form.weight) : null,
        length: form.length ? Number(form.length) : null,
        width: form.width ? Number(form.width) : null,
        height: form.height ? Number(form.height) : null,
        stock: form.manage_stock === false ? 999 : Number(form.stock_quantity || 0),
        min_stock: Number(form.stock_min || 0),
        status: willPublish ? 'active' : (form.status || 'draft'),
        notes: form.description || form.short_description || null,
        image_url: form.main_image || (form.images && form.images[0]) || null,
        updated_at: new Date().toISOString()
      }

      const savedId = form.id || (isEditing ? id : undefined)
      if (savedId) {
        const resPrimary = await supabase.from('products').update({ ...payload, video_url: form.video_url || null }).eq('id', savedId)
        if (resPrimary.error) {
          const resFallback = await supabase.from('products').update(payload).eq('id', savedId)
          if (resFallback.error) throw resFallback.error
        }
        // Sincroniza o vínculo com a publicação da loja
        await syncStoreMetadata(savedId, willPublish)
        setForm(prev => ({ ...prev, published: willPublish, status: willPublish ? 'active' : prev.status }))
        if (willPublish) {
          setPublishedSlug(form.seo_slug || form.slug || savedId)
          setShowPublishModal(true)
        }
        setMessage({
          type: 'success',
          text: willPublish
            ? '✓ Publicação atualizada com sucesso! O produto está ativo na vitrine oficial.'
            : '✓ Produto salvo no catálogo TEKNIX! (Mantido como NÃO publicado na vitrine pública)'
        })
      } else {
        payload.created_at = new Date().toISOString()
        const { data, error } = await supabase.from('products').insert(payload).select().single()
        if (error) throw error
        if (data) {
          setForm(prev => ({ ...prev, id: data.id, published: willPublish }))
          // Sincroniza o vínculo com a publicação da loja
          await syncStoreMetadata(data.id, willPublish)
          if (willPublish) {
            setPublishedSlug(form.seo_slug || form.slug || data.id)
            setShowPublishModal(true)
          }
          setMessage({
            type: 'success',
            text: willPublish
              ? '✓ Produto cadastrado e PUBLICADO na loja com sucesso!'
              : '✓ Produto cadastrado com sucesso no catálogo! (Não publicado na vitrine pública)'
          })
          if (!willPublish) {
            setTimeout(() => navigate(`/hub/produtos/editar/${data.id}`), 800)
          }
        }
      }
    } catch (err: any) {
      console.error(err)
      setMessage({ type: 'error', text: 'Erro ao salvar produto: ' + (err.message || 'Verifique os dados e tente novamente.') })
    } finally {
      setSaving(false)
    }
  }

  function handleOpenVisualEditor() {
    if (id) window.open(`/hub/editor/product/${encodeURIComponent(id)}`, '_blank', 'noopener,noreferrer')
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
            <h1 className="product-form-title" title={form.name || ''}>
              <span className="product-title-text">
                {form.name || (isEditing ? 'Editar Produto' : 'Novo Produto')}
              </span>
              <span className={`product-status-pill ${form.published ? 'published' : form.status === 'active' ? 'active' : 'draft'}`}>
                {form.published ? 'Publicado' : form.status === 'active' ? 'Ativo' : 'Rascunho'}
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
            <button
              type="button"
              className="btn-secondary-action"
              onClick={() => handleSubmit(undefined, false)}
              disabled={saving}
              title="Salva no catálogo interno TEKNIX sem exibir na vitrine pública"
              style={{ fontWeight: 600 }}
            >
              Salvar Catálogo
            </button>
            <button
              type="button"
              className="btn-primary-action"
              onClick={() => handleSubmit(undefined, true)}
              disabled={saving}
              style={{
                background: form.published ? '#059669' : '#111827',
                borderColor: form.published ? '#059669' : '#111827',
                color: '#ffffff',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
              title={form.published ? 'Atualizar publicação na vitrine oficial da loja' : 'Publicar produto imediatamente na vitrine oficial da loja'}
            >
              {saving ? 'Salvando...' : form.published ? '✓ Atualizar Publicação' : 'Publicar'}
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
            <h2 className="card-title" style={{ margin: 0 }}>Fotos e vídeos do produto</h2>
            <span style={{ background: '#ecfdf5', color: '#059669', fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px', borderRadius: 10 }}>
              Suporta Fotos e Vídeo
            </span>
          </div>
          <p className="card-subtitle">
            Arraste e solte, ou selecione fotos e vídeo do produto. Tamanho mínimo recomendado: 1280px (WEBP, PNG, JPEG, GIF) e Vídeos (MP4, WEBM ou link do YouTube).
          </p>

          {/* Input de Arquivos Oculto (Imagens e Vídeos) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleUploadFiles(e.target.files)
                e.target.value = ''
              }
            }}
          />

          <div
            className={`upload-dropzone ${isDragging ? 'is-dragging' : ''} ${isUploadingMedia ? 'is-uploading' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                handleUploadFiles(e.dataTransfer.files)
              }
            }}
          >
            {isUploadingMedia ? (
              <>
                <Loader2 size={30} className="upload-icon spinner-icon" />
                <div className="upload-prompt">{uploadStatus || 'Enviando arquivos...'}</div>
                <div className="upload-subprompt">Aguarde o processamento das mídias</div>
              </>
            ) : (
              <>
                <Upload size={28} className="upload-icon" />
                <div className="upload-prompt">Arraste e solte, ou selecione fotos e vídeo do produto</div>
                <div className="upload-subprompt">Fotos (WEBP, PNG, JPG) e Vídeo (.MP4, .WEBM, .MOV) ou use os botões abaixo</div>
                <div className="upload-actions-row" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="btn-upload-file"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={13} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                    Subir Fotos / Vídeo
                  </button>
                  <button
                    type="button"
                    className="btn-upload-link"
                    onClick={() => {
                      const url = prompt('Cole a URL de uma imagem ou vídeo:')
                      if (url) {
                        if (url.match(/\.(mp4|webm|mov|m4v)(\?.*)?$/i) || getYoutubeVideoId(url)) {
                          setForm(f => ({ ...f, video_url: url }))
                        } else {
                          handleAddImageUrl(url)
                        }
                      }
                    }}
                  >
                    Adicionar por Link
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Grid de Fotos e Vídeos Cadastrados */}
          {(form.images.length > 0 || Boolean(form.video_url)) && (
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

              {/* Card do Vídeo (YouTube ou MP4 enviado) */}
              {form.video_url && (
                <div className="photo-card is-video">
                  {getYoutubeVideoId(form.video_url) ? (
                    <div className="video-thumb-container" onClick={() => window.open(form.video_url, '_blank')} title="Clique para assistir no YouTube">
                      <img
                        src={`https://img.youtube.com/vi/${getYoutubeVideoId(form.video_url)}/hqdefault.jpg`}
                        alt="Vídeo do Produto YouTube"
                      />
                      <div className="video-play-overlay">
                        <Play size={24} fill="#ffffff" color="#ffffff" />
                      </div>
                      <span className="photo-badge-video youtube">
                        ▶ YouTube
                      </span>
                    </div>
                  ) : (
                    <div className="video-thumb-container" onClick={() => setPreviewVideoModal(form.video_url)} title="Clique para pré-visualizar vídeo">
                      <video src={form.video_url} className="video-thumb-player" muted preload="metadata" />
                      <div className="video-play-overlay">
                        <Play size={24} fill="#ffffff" color="#ffffff" />
                      </div>
                      <span className="photo-badge-video mp4">
                        ▶ Vídeo MP4
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    className="photo-delete-btn"
                    onClick={(e) => { e.stopPropagation(); setForm(prev => ({ ...prev, video_url: '' })) }}
                    title="Remover vídeo do produto"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="form-group" style={{ marginTop: 12 }}>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span><Video size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> Link para vídeo externo (YouTube ou Vimeo)</span>
              {form.video_url && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => setForm(prev => ({ ...prev, video_url: '' }))}
                >
                  Remover Vídeo
                </button>
              )}
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="Cole um link do YouTube (ex: https://youtube.com/watch?v=...) ou Vimeo"
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
              <label>Preço original / de venda (R$) *</label>
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

          <div className="commerce-settings">
            <h3>Ofertas e condições na loja</h3>
            <p className="field-hint">Os selos aparecem na imagem do card e na página do produto. O desconto é calculado pelos preços acima.</p>
            <label className="toggle-switch-label"><input type="checkbox" checked={form.commerce.offerEnabled} onChange={e=>setForm({...form,commerce:{...form.commerce,offerEnabled:e.target.checked}})} />Ativar oferta com contagem regressiva</label>
            {form.commerce.offerEnabled && <label className="form-group">Término da oferta (horário local)<input className="form-input" type="datetime-local" value={form.commerce.offerEndsAt ? new Date(Date.parse(form.commerce.offerEndsAt) - new Date(form.commerce.offerEndsAt).getTimezoneOffset()*60000).toISOString().slice(0,16) : ''} onChange={e=>setForm({...form,commerce:{...form.commerce,offerEndsAt:e.target.value ? new Date(e.target.value).toISOString() : null}})} /></label>}
            <div className="form-row">
              <label className="form-group">Selo na imagem<select className="form-input" value={form.commerce.badge} onChange={e=>setForm({...form,commerce:{...form.commerce,badge:e.target.value as ProductCommerce['badge']}})}><option value="none">Sem selo</option><option value="daily">Oferta do dia</option><option value="special">Oferta imperdível</option><option value="bestseller">Mais vendido</option></select><span className="field-hint">Use “Mais vendido” somente quando houver vendas que sustentem a informação.</span></label>
              <label className="form-group">Parcelas sem juros<input className="form-input" type="number" min="1" max="24" step="1" value={form.commerce.installments} onChange={e=>setForm({...form,commerce:{...form.commerce,installments:Number(e.target.value)}})} /></label>
              <label className="form-group">Desconto adicional no Pix (%)<input className="form-input" type="number" min="0" max="99.99" step="0.01" value={form.commerce.pixDiscountPercent} onChange={e=>setForm({...form,commerce:{...form.commerce,pixDiscountPercent:Number(e.target.value)}})} /></label>
            </div>
            <div className="form-row" style={{ marginTop: 8 }}>
              <label className="form-group">
                Condição do Produto (Loja)
                <select
                  className="form-input"
                  value={form.commerce.condition || form.condition || 'Novo'}
                  onChange={e => setForm({
                    ...form,
                    condition: e.target.value,
                    commerce: { ...form.commerce, condition: e.target.value }
                  })}
                >
                  <option value="Novo">Novo</option>
                  <option value="Recondicionado">Recondicionado</option>
                  <option value="Usado">Usado</option>
                </select>
                <span className="field-hint">Exibido no topo do produto (ex: Novo | +10 mil vendidos)</span>
              </label>

              <label className="form-group">
                Total de Vendas Exibido
                <input
                  className="form-input"
                  type="text"
                  placeholder="ex: +10 mil vendidos ou +500 vendidos"
                  value={form.commerce.soldCount ?? '+10 mil vendidos'}
                  onChange={e => setForm({
                    ...form,
                    commerce: { ...form.commerce, soldCount: e.target.value }
                  })}
                />
                <span className="field-hint">Ex: +10 mil vendidos, +500 vendidos, +1000 vendidos</span>
              </label>
            </div>

            <label className="toggle-switch-label"><input type="checkbox" checked={form.commerce.showLastUnit} onChange={e=>setForm({...form,commerce:{...form.commerce,showLastUnit:e.target.checked}})} />Mostrar “Última unidade” automaticamente quando o estoque controlado for 1</label>
            <label className="toggle-switch-label"><input type="checkbox" checked={form.free_shipping} onChange={e=>setForm({...form,free_shipping:e.target.checked})} />Frete grátis para este produto</label>
            <p className="commerce-preview">Prévia: {productPricing(form.sell_price,form.has_promo?form.promo_price:null,form.commerce).pix.toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} no Pix · {form.commerce.installments}x sem juros. {form.commerce.condition || form.condition || 'Novo'} | {form.commerce.soldCount || '+10 mil vendidos'}</p>
          </div>

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

        {/* 13. VISIBILIDADE, PUBLICAÇÃO NA LOJA E FRETE */}
        <div className="form-card">
          <h2 className="card-title">Publicação na Loja Oficial (SITE)</h2>
          <p className="card-subtitle">Controle a exibição deste produto na vitrine pública do site de forma independente do catálogo geral.</p>
          
          <div style={{
            background: form.published ? '#f0fdf4' : '#f8fafc',
            border: `1.5px solid ${form.published ? '#86efac' : '#e2e8f0'}`,
            borderRadius: 10,
            padding: '16px',
            marginBottom: 20,
            transition: 'all 0.2s ease'
          }}>
            <label className="toggle-switch-label" style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                className="toggle-switch-input"
                checked={form.published}
                onChange={(e) => setForm({ ...form, published: e.target.checked })}
              />
              Publicar este produto na Loja Oficial TEKNIX (SITE)
            </label>
            <p style={{ margin: '8px 0 0 28px', fontSize: '0.82rem', lineHeight: 1.4, color: form.published ? '#15803d' : '#64748b' }}>
              {form.published
                ? '✓ PRODUTO PUBLICADO: Fica visível para os clientes na vitrine do site, busca, categorias e checkout.'
                : '✕ NÃO PUBLICADO NA LOJA: Fica salvo no catálogo e integrado aos marketplaces (FLOW / Mercado Livre), mas oculto na vitrine pública da loja.'}
            </p>
          </div>

          <h3 className="card-title" style={{ fontSize: '1rem', marginBottom: 6 }}>Status Operacional</h3>
          <div className="radio-group" style={{ marginBottom: 14 }}>
            <label className={`radio-card ${form.status === 'active' ? 'active' : ''}`}>
              <input
                type="radio"
                name="visibility"
                checked={form.status === 'active'}
                onChange={() => setForm({ ...form, status: 'active' })}
              />
              <div>
                <strong>Ativo</strong>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Disponível para operações</div>
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
                <strong>Rascunho</strong>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Em edição interna</div>
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
                <strong>Pausado / Oculto</strong>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Indisponível temporariamente</div>
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
          <button
            type="button"
            className="btn-secondary-action"
            onClick={() => handleSubmit(undefined, false)}
            disabled={saving}
            title="Salva no catálogo e marketplaces sem publicar na loja própria"
            style={{ fontWeight: 600 }}
          >
            Salvar no Catálogo
          </button>
          <button
            type="button"
            className="btn-primary-action"
            onClick={() => handleSubmit(undefined, true)}
            disabled={saving}
            style={{
              background: form.published ? '#059669' : '#111827',
              borderColor: form.published ? '#059669' : '#111827',
              color: '#ffffff',
              fontWeight: 600,
              transition: 'all 0.2s ease'
            }}
            title={form.published ? 'Atualizar publicação na loja oficial TEKNIX' : 'Publicar imediatamente na loja oficial TEKNIX'}
          >
            {saving ? 'Salvando...' : form.published ? '✓ Atualizar Publicação' : 'Publicar'}
          </button>
        </div>

      </div>

      {/* ── Modal de Confirmação de Publicação — Design Fino HUB ── */}
      {showPublishModal && (
        <div className="product-publish-modal-overlay" onClick={() => setShowPublishModal(false)}>
          <div className="product-publish-modal" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              className="publish-modal-close-btn"
              onClick={() => setShowPublishModal(false)}
              title="Fechar"
            >
              <X size={16} />
            </button>

            <div className="publish-modal-header">
              <div className="publish-modal-icon">
                <Check size={18} strokeWidth={2.5} />
              </div>
              <div className="publish-modal-title-wrap">
                <h3>Publicação Atualizada</h3>
                <p>O produto está ativo e sincronizado na vitrine oficial da TEKNIX.</p>
              </div>
            </div>

            <div className="publish-modal-product-box">
              {form.main_image || (form.images && form.images[0]) ? (
                <img src={form.main_image || form.images[0]} alt={form.name} className="publish-modal-thumb" />
              ) : (
                <div className="publish-modal-thumb-placeholder">
                  <Package size={18} color="#94a3b8" />
                </div>
              )}
              <div className="publish-modal-product-info">
                <div className="publish-modal-sku-row">
                  <span className="publish-modal-sku">SKU: {form.sku || 'TKN-PROD'}</span>
                  <span className="publish-modal-status-badge">● No Ar</span>
                </div>
                <span className="publish-modal-name" title={form.name}>{form.name}</span>
                <span className="publish-modal-price">
                  {form.has_promo && form.promo_price
                    ? `R$ ${Number(form.promo_price).toFixed(2).replace('.', ',')} (de R$ ${Number(form.sell_price).toFixed(2).replace('.', ',')})`
                    : `R$ ${Number(form.sell_price || 0).toFixed(2).replace('.', ',')}`}
                </span>
              </div>
            </div>

            <div className="publish-modal-actions">
              <a
                href={`http://localhost:5173/produtos/${publishedSlug || form.seo_slug || form.slug || id}`}
                target="_blank"
                rel="noreferrer"
                className="btn-modal-view-store"
                onClick={() => setShowPublishModal(false)}
              >
                <ExternalLink size={14} />
                Ver na Loja Oficial
              </a>
              <button
                type="button"
                className="btn-modal-continue"
                onClick={() => setShowPublishModal(false)}
              >
                Continuar Editando
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal de Prévia de Vídeo do Produto ── */}
      {previewVideoModal && (
        <div className="product-publish-modal-overlay" onClick={() => setPreviewVideoModal(null)}>
          <div className="product-publish-modal" style={{ maxWidth: 640, padding: 20 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Prévia do Vídeo do Produto</h3>
              <button
                type="button"
                className="publish-modal-close-btn"
                style={{ position: 'static' }}
                onClick={() => setPreviewVideoModal(null)}
              >
                <X size={16} />
              </button>
            </div>
            <div style={{ width: '100%', borderRadius: 8, overflow: 'hidden', background: '#000' }}>
              <video src={previewVideoModal} controls autoPlay style={{ width: '100%', maxHeight: 380, display: 'block' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
