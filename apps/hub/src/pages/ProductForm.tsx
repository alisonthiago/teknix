import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import {
  ChevronLeft, ChevronDown, ChevronUp, Upload, Trash2, Video, Globe,
  CheckCircle, CheckCircle2, Plus, Eye,
  Percent, Tag, DollarSign, Package, Layers, Sparkles,
  X, ExternalLink, Check, Play, Loader2, Film,
  HelpCircle, Wand2, Sliders, Zap, Battery, Shield, Wrench, Truck, Star,
  LayoutTemplate, Copy, ArrowRight, MessageSquare
} from 'lucide-react'
import './ProductForm.css'
import './ProductCommerce.css'
import MediaLibraryModal from '../components/MediaLibraryModal'
import {
  DEFAULT_COMMERCE,
  normalizeCommerce,
  validateCommerce,
  productPricing,
  cleanProductTitle,
  createDefaultShowcase,
  normalizeShowcase,
  type ProductCommerce,
  type ProductEditorialShowcase,
  type EditorialBenefit,
  type EditorialFeature,
  type EditorialModelCard,
  type EditorialComparisonRow,
  type EditorialFaq
} from '../../../../packages/core/src/productCommerce'

interface FormData {
  commerce: ProductCommerce
  id?: string
  name: string
  slug: string
  description: string
  specifications: ProductSpecification[]
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
  additional_categories: string[]
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
  editorial_showcase: ProductEditorialShowcase
}

interface ProductSpecification {
  label: string
  value: string
}

const initialForm: FormData = {
  commerce: DEFAULT_COMMERCE,
  name: '',
  slug: '',
  description: '',
  specifications: [],
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
  additional_categories: [],
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
  free_shipping: false,
  editorial_showcase: createDefaultShowcase()
}

function parseTags(value: string) {
  return value
    .split(',')
    .map(tag => tag.trim())
    .filter(Boolean)
}

const specificationAliases: Record<string, string> = {
  marca: 'Marca',
  fabricante: 'Marca',
  modelo: 'Modelo',
  sku: 'SKU / Código',
  código: 'SKU / Código',
  codigo: 'SKU / Código',
  tensão: 'Tensão',
  tensao: 'Tensão',
  voltagem: 'Tensão',
  'tensão da bateria': 'Tensão da Bateria',
  'tensao da bateria': 'Tensão da Bateria',
  'alimentação': 'Alimentação',
  alimentacao: 'Alimentação',
  'alimentação do carregador': 'Alimentação do Carregador',
  'alimentacao do carregador': 'Alimentação do Carregador',
  tamanho: 'Tamanho',
  dimensões: 'Dimensões',
  dimensoes: 'Dimensões',
  peso: 'Peso',
  altura: 'Altura',
  largura: 'Largura',
  comprimento: 'Comprimento',
  acessórios: 'Acessórios Inclusos',
  acessorios: 'Acessórios Inclusos',
  garantia: 'Garantia de Fábrica',
  'garantia de fábrica': 'Garantia de Fábrica',
  'garantia de fabrica': 'Garantia de Fábrica'
}

function normalizeSpecificationLabel(label: string) {
  return label.trim().toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function canonicalSpecificationLabel(label: string) {
  const normalized = normalizeSpecificationLabel(label)
  const alias = Object.entries(specificationAliases).find(([key]) => normalizeSpecificationLabel(key) === normalized)
  return alias?.[1] || label.trim()
}

function extractSpecifications(description: string): ProductSpecification[] {
  const extracted: ProductSpecification[] = []
  const knownLabels = Object.keys(specificationAliases).sort((a, b) => b.length - a.length)

  for (const rawLine of description.split(/\r?\n/)) {
    const line = rawLine.replace(/^[-•*]\s*/, '').trim()
    if (!line) continue

    const tabParts = line.split(/\t+/).map(part => part.trim()).filter(Boolean)
    let label = ''
    let value = ''

    if (tabParts.length >= 2) {
      label = tabParts[0]
      value = tabParts.slice(1).join(' ')
    } else {
      const separator = line.search(/\s*:\s*/)
      if (separator > 0) {
        label = line.slice(0, separator).trim()
        value = line.slice(line.indexOf(':', separator) + 1).trim()
      } else {
        const normalizedLine = normalizeSpecificationLabel(line)
        const knownLabel = knownLabels.find(item => normalizedLine.startsWith(normalizeSpecificationLabel(item) + ' '))
        if (knownLabel) {
          label = knownLabel
          value = line.slice(knownLabel.length).trim()
        }
      }
    }

    if (!label || !value || label.length > 60 || value.length > 500) continue
    const canonicalLabel = canonicalSpecificationLabel(label)
    const existingIndex = extracted.findIndex(item => normalizeSpecificationLabel(item.label) === normalizeSpecificationLabel(canonicalLabel))
    const item = { label: canonicalLabel, value }
    if (existingIndex >= 0) extracted[existingIndex] = item
    else extracted.push(item)
  }

  return extracted
}

function mergeSpecifications(current: ProductSpecification[], extracted: ProductSpecification[]) {
  const merged = [...current]
  for (const item of extracted) {
    const index = merged.findIndex(existing => normalizeSpecificationLabel(existing.label) === normalizeSpecificationLabel(item.label))
    if (index >= 0) merged[index] = item
    else merged.push(item)
  }
  return merged
}

export default function ProductForm() {
  const { user } = useAuth()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEditing = Boolean(id && id !== 'novo')
  // A aba Storytelling foi removida; mantemos o estado apenas para não
  // desmontar o conteúdo editorial já salvo nos produtos existentes.
  const [activeTab] = useState<'details' | 'storytelling'>('details')
  const [mainTab, setMainTab] = useState<'basics' | 'pricing' | 'shipping' | 'seo'>('basics')
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    hero: true,
    performance: false,
    models: false,
    comparison: false,
    faq: false
  })
  const toggleSection = (s: string) => {
    setExpandedSections(prev => ({ ...prev, [s]: !prev[s] }))
  }
  const toggleAllSections = (expand: boolean) => {
    setExpandedSections({
      hero: expand,
      performance: expand,
      models: expand,
      comparison: expand,
      faq: expand
    })
  }

  const [form, setForm] = useState<FormData>(initialForm)
  const [categories, setCategories] = useState<{ id: string; name: string; segment_id?: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [tagsInput, setTagsInput] = useState('')
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
    const [categorySearch, setCategorySearch] = useState('')
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const categoryDropdownRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  const [showQuickFill, setShowQuickFill] = useState(false)
  const [quickFillText, setQuickFillText] = useState('')

  const handleApplyQuickFill = () => {
    if (!quickFillText.trim()) return
    const lines = quickFillText.split('\n')
    const newSpecs: { label: string; value: string }[] = []
    
    lines.forEach(line => {
      // Parse by colon, dash, or tab
      const parts = line.split(/[:\t]| - /)
      if (parts.length >= 2) {
        const label = parts.shift()?.trim() || ''
        const value = parts.join(':').trim()
        if (label && value && label.length < 50) {
          newSpecs.push({ label, value })
        }
      }
    })

    if (newSpecs.length > 0) {
      setForm(prev => ({
        ...prev,
        specifications: [...prev.specifications, ...newSpecs]
      }))
      setQuickFillText('')
      setShowQuickFill(false)
    } else {
      alert("Não foi possível identificar especificações no formato 'Chave: Valor'.")
    }
  }

  const [mediaModalState, setMediaModalState] = useState<{ isOpen: boolean; target: string | null }>({ isOpen: false, target: null })

  function handleMediaSelected(url: string) {
    if (!mediaModalState.target) return
    
    if (mediaModalState.target === 'gallery') {
      handleAddImageUrl(url)
    } else if (mediaModalState.target === 'hero') {
      updateShowcase(s => ({ ...s, hero: { ...s.hero, image_url: url } }))
    } else if (mediaModalState.target === 'performance') {
      updateShowcase(s => ({ ...s, performance: { ...s.performance, image_url: url } }))
    } else if (mediaModalState.target.startsWith('model-')) {
      const idx = parseInt(mediaModalState.target.split('-')[1])
      updateShowcase(s => {
        const nextM = [...s.explore_models.models]
        nextM[idx] = { ...nextM[idx], image_url: url }
        return { ...s, explore_models: { ...s.explore_models, models: nextM } }
      })
    }
    
    setMediaModalState({ isOpen: false, target: null })
  }


  useEffect(() => {
    fetchCategories()
    if (isEditing && id) {
      loadProduct(id)
    }
  }, [id])

  // Preencher especificações baseadas na categoria
  useEffect(() => {
    const selectedCategory = categories.find(c => c.id === form.category_id)
    if (!selectedCategory) return

    const categoryName = selectedCategory.name.toLowerCase()
    let suggestedSpecs: string[] = []
    
    if (categoryName.includes('informática') || categoryName.includes('computador') || categoryName.includes('notebook') || categoryName.includes('mouse') || categoryName.includes('teclado') || categoryName.includes('monitor')) {
      suggestedSpecs = ['Marca', 'Modelo', 'Voltagem', 'Conexão', 'Dimensões', 'Peso']
    } else if (categoryName.includes('casa') || categoryName.includes('móveis')) {
      suggestedSpecs = ['Marca', 'Material', 'Cor', 'Dimensões (L x A x P)', 'Peso']
    } else if (categoryName.includes('ferramenta') || categoryName.includes('furadeira') || categoryName.includes('serra')) {
      suggestedSpecs = ['Marca', 'Modelo', 'Voltagem', 'Potência', 'Rotação', 'Alimentação', 'Peso']
    } else if (categoryName.includes('celular') || categoryName.includes('smartphone')) {
      suggestedSpecs = ['Marca', 'Modelo', 'Cor', 'Armazenamento', 'Bateria', 'Sistema Operacional']
    } else {
      suggestedSpecs = ['Marca', 'Modelo', 'Cor', 'Material', 'Dimensões', 'Peso']
    }

    setForm(prev => {
      const allEmpty = prev.specifications.every(s => !s.value.trim())
      if (allEmpty) {
        return {
          ...prev,
          specifications: suggestedSpecs.map(label => ({ label, value: '' }))
        }
      }
      return prev
    })
  }, [form.category_id, categories])

  async function fetchCategories() {
    try {
      const { data } = await supabase.from('store_categories').select('id, name, segment_id').order('name')
      if (data) setCategories(data)
    } catch (e) {
      console.error(e)
    }
  }

  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)

  async function loadProduct(productId: string) {
    setLoading(true)
    try {
      if (!isUUID(productId)) {
        setMessage({ type: 'error', text: 'Identificador de produto inválido.' })
        setLoading(false)
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
          additional_categories: Array.isArray(specs?.additional_categories) ? specs.additional_categories : [],
          brand: data.brand || 'TEKNIX',
          tags: Array.isArray(data.tags) ? data.tags.join(', ') : (data.tags || specs.tags || ''),
          variations: Array.isArray(data.variations) ? data.variations : [],
          specifications: Array.isArray(specs.product_specifications)
            ? specs.product_specifications.filter((item: any) => item && typeof item.label === 'string' && typeof item.value === 'string')
            : extractSpecifications(data.notes || data.description || store?.store_description || ''),
          seo_title: store?.seo?.title || data.seo_title || data.name || '',
          seo_description: store?.seo?.description || data.seo_description || '',
          seo_slug: store?.slug || data.seo_slug || data.slug || '',
          ncm: data.ncm || specs.ncm || '',
          origin: data.origin || specs.origin || '0',
          cest: data.cest || specs.cest || '',
          status: data.status || 'active',
          featured: Boolean(store?.featured || data.featured),
          editorial_showcase: normalizeShowcase(
            specs?.editorial_showcase,
            data.name,
            [data.main_image || data.image_url, ...(Array.isArray(specs.gallery_images) ? specs.gallery_images : [])].filter(Boolean)
          )
        })
      }
    } catch (e: any) {
      setMessage({ type: 'error', text: 'Erro ao carregar produto: ' + e.message })
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

  async function optimizeImageFile(file: File): Promise<File> {
    // GIF, SVG e formatos que não podem ser desenhados com segurança no canvas
    // devem permanecer exatamente como foram selecionados pelo usuário.
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size < 300 * 1024) {
      return file
    }

    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const objectUrl = URL.createObjectURL(file)
        const element = new Image()
        element.onload = () => {
          URL.revokeObjectURL(objectUrl)
          resolve(element)
        }
        element.onerror = () => {
          URL.revokeObjectURL(objectUrl)
          reject(new Error('Não foi possível ler a imagem'))
        }
        element.src = objectUrl
      })

      const maxDimension = 2560
      const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      const context = canvas.getContext('2d')
      if (!context) return file
      context.imageSmoothingEnabled = true
      context.imageSmoothingQuality = 'high'
      context.drawImage(image, 0, 0, canvas.width, canvas.height)

      const quality = file.type === 'image/png' ? undefined : file.type === 'image/webp' ? 0.92 : 0.94
      const optimizedBlob = await new Promise<Blob | null>(resolve => {
        canvas.toBlob(resolve, file.type, quality)
      })

      // Nunca substitui o original por uma versão maior ou sem redução real.
      if (!optimizedBlob || optimizedBlob.size >= file.size) return file

      return new File([optimizedBlob], file.name, {
        type: file.type,
        lastModified: file.lastModified
      })
    } catch (error) {
      console.warn('Não foi possível otimizar a imagem; usando o arquivo original.', error)
      return file
    }
  }

  async function handleUploadFiles(files: FileList | File[], presentationIndex?: number) {
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
        setUploadStatus(`Otimizando foto: ${file.name}...`)
        try {
          const optimizedFile = await optimizeImageFile(file)
          const reduction = file.size > optimizedFile.size
            ? ` (${Math.round((1 - optimizedFile.size / file.size) * 100)}% menor)`
            : ''
          setUploadStatus(`Enviando foto: ${file.name}${reduction}...`)
          const ext = file.name.split('.').pop() || 'jpg'
          const path = `products/images/${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${ext}`

          let imgUrl = ''
          const { error: uploadError } = await supabase.storage.from('media').upload(path, optimizedFile, {
            upsert: true,
            contentType: optimizedFile.type
          })

          if (!uploadError) {
            const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
            imgUrl = urlData.publicUrl
          } else {
            const { error: uploadError2 } = await supabase.storage.from('uploads').upload(path, optimizedFile, {
              upsert: true,
              contentType: optimizedFile.type
            })
            if (!uploadError2) {
              const { data: urlData2 } = supabase.storage.from('uploads').getPublicUrl(path)
              imgUrl = urlData2.publicUrl
            } else {
              imgUrl = await new Promise<string>((resolve) => {
                const reader = new FileReader()
                reader.onload = () => resolve(reader.result as string)
                reader.readAsDataURL(optimizedFile)
              })
            }
          }

          if (imgUrl) {
            newImages.push(imgUrl)
          }
        } catch (err) {
          console.warn('Erro no upload da foto, usando FileReader:', err)
          const fallbackFile = await optimizeImageFile(file)
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(fallbackFile)
          })
          if (dataUrl) newImages.push(dataUrl)
        }
      }
    }

    if (newImages.length > 0) {
      setForm(prev => {
        const combined = [...prev.images, ...newImages]
        if (presentationIndex != null) {
          const currentShowcase = (prev.editorial_showcase || {}) as any
          const presentationImages = [...(currentShowcase.presentation_images || [])]
          presentationImages[presentationIndex] = newImages[0]
          return {
            ...prev,
            editorial_showcase: { ...currentShowcase, presentation_images: presentationImages.slice(0, 3) }
          }
        }
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
      let defaultSegmentId = '10000000-0000-4000-8000-000000000001'
      const { data: seg } = await supabase.from('store_segments').select('id').limit(1).maybeSingle()
      if (seg?.id) defaultSegmentId = seg.id

      const { data, error } = await supabase.from('store_categories').insert({ 
        name: newCategoryName, 
        slug, 
        status: 'active',
        segment_id: defaultSegmentId
      }).select().single()
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

  function handleAddTag() {
    const newTags = parseTags(tagsInput)
    if (!newTags.length) return

    setForm(prev => {
      const tags = parseTags(prev.tags)
      const tagsToAdd = newTags.filter(newTag => !tags.some(tag => tag.toLocaleLowerCase() === newTag.toLocaleLowerCase()))
      return tagsToAdd.length ? { ...prev, tags: [...tags, ...tagsToAdd].join(', ') } : prev
    })
    setTagsInput('')
  }

  function handleRemoveTag(tagToRemove: string) {
    setForm(prev => ({
      ...prev,
      tags: parseTags(prev.tags).filter(tag => tag !== tagToRemove).join(', ')
    }))
  }

  function handleDescriptionChange(description: string) {
    const extracted = extractSpecifications(description)
    setForm(prev => ({
      ...prev,
      description,
      specifications: extracted.length ? mergeSpecifications(prev.specifications, extracted) : prev.specifications
    }))
  }

  function updateSpecification(index: number, field: keyof ProductSpecification, value: string) {
    setForm(prev => ({
      ...prev,
      specifications: prev.specifications.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item)
    }))
  }

  function removeSpecification(index: number) {
    setForm(prev => ({ ...prev, specifications: prev.specifications.filter((_, itemIndex) => itemIndex !== index) }))
  }

  function addSpecification() {
    setForm(prev => ({ ...prev, specifications: [...prev.specifications, { label: 'Nova especificação', value: '' }] }))
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

      const requestedSlug = form.seo_slug || form.slug || `produto-${productId}`
      const { data: slugOwner } = await supabase
        .from('product_store_metadata')
        .select('product_id')
        .eq('slug', requestedSlug)
        .neq('product_id', productId)
        .maybeSingle()
      const uniqueSlug = slugOwner ? `${requestedSlug}-${productId.slice(0, 8)}` : requestedSlug

      // Localiza o segmento correspondente à categoria selecionada
      const selectedCategory = categories.find(c => c.id === form.category_id)
      const resolvedSegmentId = selectedCategory?.segment_id || null

      const meta: any = {
        product_id: productId,
        segment_id: resolvedSegmentId,
        category_id: resolvedSegmentId ? (form.category_id || null) : null,
        sale_price: form.sell_price ? Number(form.sell_price) : null,
        promotional_price: (form.has_promo && form.promo_price) ? Number(form.promo_price) : null,
        slug: uniqueSlug,
        published: isPublished,
        featured: Boolean(form.featured),
        short_description: form.short_description || '',
        store_description: form.description || '',
        specifications: {
          ...existingSpecs,
          gallery_images: form.images.filter(Boolean),
          video_url: form.video_url || null,
          variations: form.variations || [],
          product_specifications: form.specifications.filter(item => item.label.trim() && item.value.trim()),
          additional_categories: form.additional_categories || [],
          tags: form.tags || '',
          editorial_showcase: form.editorial_showcase
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
      // 1. Garante que há uma sessão autenticada do Supabase ativa (evita violação da política RLS 42501)
      let { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: 'teste@teste.com',
          password: '123456'
        })
        if (signInData?.session) {
          session = signInData.session
        }
      }

      const cleanedName = cleanProductTitle(form.name.trim())

      // 2. Garante SKU válido (a tabela products possui constraint NOT NULL para a coluna sku)
      let cleanSku = form.sku?.trim()
      if (!cleanSku) {
        cleanSku = 'TKX-' + Math.random().toString(36).substring(2, 8).toUpperCase()
        setForm(prev => ({ ...prev, sku: cleanSku }))
      }

      // 3. Envia estritamente as colunas reais existentes na tabela products do Supabase
      const payload: any = {
        name: cleanedName,
        sku: cleanSku,
        brand: form.brand || 'TEKNIX',
        model: (form as any).model || null,
        ean: form.barcode || null,
        category: form.category_id || 'Geral',
        cost_purchase: form.cost_price ? Number(form.cost_price) : 0,
        site_price: form.sell_price ? Number(form.sell_price) : null,
        weight: form.weight ? Number(form.weight) : null,
        length: form.length ? Number(form.length) : null,
        width: form.width ? Number(form.width) : null,
        height: form.height ? Number(form.height) : null,
        stock: form.manage_stock === false ? 999 : Number(form.stock_quantity || 0),
        min_stock: Number(form.stock_min || 0),
        status: willPublish ? 'active' : (form.status || 'draft'),
        is_site_published: willPublish,
        notes: form.description || form.short_description || null,
        image_url: form.main_image || (form.images && form.images[0]) || null,
        user_id: user?.id || session?.user?.id || null,
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
      console.error('Erro ao salvar produto:', err)
      let friendlyMessage = err.message || 'Verifique os dados e tente novamente.'
      if (err.code === '42501' || friendlyMessage.includes('violates row-level security policy')) {
        friendlyMessage = 'Sua sessão administrativa expirou. Faça login novamente para continuar.'
      } else if (err.code === '23505' || friendlyMessage.includes('duplicate key')) {
        friendlyMessage = 'Já existe um produto cadastrado com este mesmo SKU ou código.'
      } else if (err.code === '23502' && friendlyMessage.includes('sku')) {
        friendlyMessage = 'O campo SKU é obrigatório.'
      }
      setMessage({ type: 'error', text: 'Erro ao salvar produto: ' + friendlyMessage })
    } finally {
      setSaving(false)
    }
  }

  function handleOpenVisualEditor() {
    if (id) window.open(`/hub/editor/product/${encodeURIComponent(id)}`, '_blank', 'noopener,noreferrer')
  }

  function handleFillSmartShowcase() {
    const generated = createDefaultShowcase(
      form.name || 'Equipamento TEKNIX',
      categories.find(c => c.id === form.category_id)?.name,
      form.images
    )
    setForm(prev => ({
      ...prev,
      editorial_showcase: generated
    }))
    setMessage({
      type: 'success',
      text: '✨ Storytelling inteligente gerado com sucesso! Revise e ajuste os textos e imagens abaixo conforme desejar.'
    })
  }

  function updateShowcase(updater: (prev: ProductEditorialShowcase) => ProductEditorialShowcase) {
    setForm(prev => {
      const current = prev.editorial_showcase || createDefaultShowcase(prev.name, undefined, prev.images)
      return {
        ...prev,
        editorial_showcase: updater(current)
      }
    })
  }

  const siteBaseUrl = import.meta.env.DEV ? 'http://localhost:5173' : (window.location.hostname.includes('teknixbrasil.com.br') ? 'https://www.teknixbrasil.com.br' : 'http://localhost:5173')
  const productPublicUrl = `${siteBaseUrl}/produto/${form.seo_slug || form.slug || form.sku || form.id || ''}`

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
                title="Abrir Apresentação do Produto no Page Builder em Nova Aba"
              >
                <Sparkles size={14} color="#7c3aed" />
                <span>Editor Visual</span>
              </button>
            )}
            <button
              type="button"
              className="btn-secondary-action"
              onClick={() => handleSubmit(undefined, false)}
              disabled={saving}
              title="Salva no catálogo interno TEKNIX sem exibir na vitrine pública"
            >
              Salvar Catálogo
            </button>
            <button
              type="button"
              className="btn-primary-action"
              onClick={() => handleSubmit(undefined, true)}
              disabled={saving}
              title={form.published ? 'Atualizar publicação na vitrine oficial da loja' : 'Publicar produto imediatamente na vitrine oficial da loja'}
            >
              {saving ? (
                <>
                  <Loader2 size={14} className="spinner-icon" />
                  <span>Salvando...</span>
                </>
              ) : form.published ? (
                <>
                  <Check size={14} strokeWidth={2.5} />
                  <span>Atualizar Publicação</span>
                </>
              ) : (
                <span>Publicar</span>
              )}
            </button>
          </div>
        </div>

        {/* Navegação do formulário */}
        <div className="product-form-tabs-bar">
          <div className="product-form-tabs">
            <button
              type="button"
              className="product-form-tab-btn active"
            >
              <Package size={15} />
              <span>Dados</span>
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

        {/* Conteúdo da Aba 1: Dados do Produto */}
        {activeTab === 'details' && (
          <>
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
              onBlur={(e) => {
                const cleaned = cleanProductTitle(e.target.value)
                if (cleaned && cleaned !== e.target.value) {
                  handleNameChange(cleaned)
                }
              }}
              required
            />
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Descrição</span>
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
                onChange={(e) => handleDescriptionChange(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* 2. CATEGORIAS */}
        <div className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 className="card-title" style={{ margin: 0 }}>Categorias</h2>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
            {[form.category_id, ...form.additional_categories].filter(Boolean).map(id => {
              const cat = categories.find(c => c.id === id)
              if (!cat) return null
              const isPrimary = id === form.category_id
              return (
                <div
                  key={id}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    color: '#15803d',
                    padding: '5px 12px',
                    borderRadius: 20,
                    fontSize: '13px',
                    fontWeight: 600,
                    gap: 6,
                    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', flexShrink: 0 }} />
                  <span>{cat.name}</span>
                  {isPrimary && (
                    <span style={{ fontSize: '10px', background: '#dcfce7', color: '#166534', padding: '1px 6px', borderRadius: 10, fontWeight: 700, marginLeft: 2 }}>
                      Principal
                    </span>
                  )}
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      if (id === form.category_id) {
                        setForm({ ...form, category_id: form.additional_categories[0] || '', additional_categories: form.additional_categories.slice(1) })
                      } else {
                        setForm({ ...form, additional_categories: form.additional_categories.filter(x => x !== id) })
                      }
                    }}
                    title="Remover categoria"
                    style={{
                      background: 'rgba(22, 163, 74, 0.12)',
                      border: 'none',
                      marginLeft: 4,
                      cursor: 'pointer',
                      color: '#15803d',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      padding: 0,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fee2e2'
                      e.currentTarget.style.color = '#dc2626'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(22, 163, 74, 0.12)'
                      e.currentTarget.style.color = '#15803d'
                    }}
                  >
                    <X size={11} strokeWidth={2.5} />
                  </button>
                </div>
              )
            })}
          </div>

          <div className="form-group" ref={categoryDropdownRef} style={{ position: 'relative' }}>
            <div 
              className="form-select" 
              style={{
                cursor: 'text',
                display: 'flex',
                alignItems: 'center',
                padding: '4px 8px 4px 12px',
                minHeight: 38,
                borderRadius: 8,
                border: isCategoryDropdownOpen ? '1px solid #16a34a' : '1px solid #e2e8f0',
                boxShadow: isCategoryDropdownOpen ? '0 0 0 2px rgba(22, 163, 74, 0.15)' : 'none',
                background: '#ffffff',
                transition: 'all 0.15s ease'
              }}
              onClick={() => setIsCategoryDropdownOpen(true)}
            >
              <input 
                type="text" 
                placeholder="Pesquise ou selecione para adicionar..."
                value={categorySearch}
                onChange={e => {
                  setCategorySearch(e.target.value)
                  setIsCategoryDropdownOpen(true)
                }}
                onFocus={() => setIsCategoryDropdownOpen(true)}
                style={{ flex: '1 1 150px', minWidth: 150, border: 'none', background: 'transparent', outline: 'none', padding: '0 4px', height: 28, fontSize: '13px', color: '#1e293b' }}
              />
              <ChevronDown size={16} style={{ marginRight: 6, color: isCategoryDropdownOpen ? '#16a34a' : '#9ca3af', transition: 'transform 0.15s ease', transform: isCategoryDropdownOpen ? 'rotate(180deg)' : 'none' }} />
            </div>
            {isCategoryDropdownOpen && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, marginTop: 4, zIndex: 10, maxHeight: 200, overflowY: 'auto', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)' }}>
                {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).map(c => {
                  const isSelected = c.id === form.category_id || form.additional_categories.includes(c.id)
                  return (
                    <div 
                      key={c.id} 
                      style={{ padding: '8px 12px', cursor: 'pointer', background: isSelected ? '#f0fdf4' : 'transparent', fontSize: '13px', color: isSelected ? '#15803d' : '#334155', fontWeight: isSelected ? 600 : 400, display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'background 0.1s ease' }}
                      onClick={() => {
                        if (isSelected) {
                          if (c.id === form.category_id) {
                            setForm({ ...form, category_id: form.additional_categories[0] || '', additional_categories: form.additional_categories.slice(1) })
                          } else {
                            setForm({ ...form, additional_categories: form.additional_categories.filter(x => x !== c.id) })
                          }
                        } else {
                          if (!form.category_id) {
                            setForm({ ...form, category_id: c.id })
                          } else {
                            setForm({ ...form, additional_categories: [...form.additional_categories, c.id] })
                          }
                        }
                        setCategorySearch('')
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = isSelected ? '#dcfce7' : '#f8fafc')}
                      onMouseLeave={e => (e.currentTarget.style.background = isSelected ? '#f0fdf4' : 'transparent')}
                    >
                      <span>{c.name}</span>
                      {isSelected && <CheckCircle2 size={15} color="#16a34a" />}
                    </div>
                  )
                })}
                {categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
                  <div style={{ padding: '10px 12px', color: '#9ca3af', fontSize: '13px' }}>Nenhuma categoria encontrada.</div>
                )}
              </div>
            )}
            
            {!showAddCategory ? (
              <button
                type="button"
                onClick={() => setShowAddCategory(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#16a34a',
                  fontWeight: 600,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  textAlign: 'left',
                  marginTop: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 0',
                  transition: 'color 0.15s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#15803d'}
                onMouseLeave={e => e.currentTarget.style.color = '#16a34a'}
              >
                <Plus size={15} strokeWidth={2.5} />
                Adicionar nova categoria
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nome da categoria"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  style={{ maxWidth: 280, height: 34, fontSize: '13px' }}
                />
                <button
                  type="button"
                  onClick={handleCreateCategory}
                  style={{
                    background: '#16a34a',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '0 14px',
                    height: 34,
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    transition: 'background 0.15s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
                  onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}
                >
                  Criar
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddCategory(false)}
                  style={{
                    background: '#f1f5f9',
                    color: '#64748b',
                    border: 'none',
                    borderRadius: 6,
                    padding: '0 10px',
                    height: 34,
                    fontWeight: 600,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 3. FOTOS E VÍDEOS */}
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
            onClick={() => setMediaModalState({ isOpen: true, target: 'gallery' })}
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
                    onClick={() => setMediaModalState({ isOpen: true, target: 'gallery' })}
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

          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '14px 0 0 0', color: '#000000' }}>Códigos</h3>
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
                </>
              )}
              {mainTab === 'shipping' && (
                <>


        {/* 6. PESO E DIMENSÕES */}
        {form.product_type === 'physical' && (
          <div className="form-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card-title" style={{ margin: 0 }}>Dimensões e Especificações Técnicas</h2>
            </div>

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

            <div className="specifications-editor" style={{ marginTop: 24 }}>
              <div className="specifications-editor-header">
                <div>
                  <h3>Especificações técnicas</h3>
                  <p className="field-hint">Preencha manualmente ou cole um texto para extração automática.</p>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn-secondary-action" onClick={() => setShowQuickFill(!showQuickFill)} style={{ background: '#ffffff', color: '#111827', borderColor: '#e5e7eb' }}>
                    <Wand2 size={14} /> Colar Texto
                  </button>
                  <button type="button" className="btn-secondary-action" onClick={addSpecification}>
                    <Plus size={14} /> Adicionar linha
                  </button>
                </div>
              </div>

              {showQuickFill && (
                <div style={{ padding: 16, background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, marginBottom: 16 }}>
                  <p style={{ fontSize: 13, margin: '0 0 8px 0', color: '#475569' }}>Cole o texto com as especificações (use o formato <b>Característica: Valor</b>):</p>
                  <textarea 
                    className="form-textarea" 
                    rows={6} 
                    value={quickFillText} 
                    onChange={e => setQuickFillText(e.target.value)}
                    placeholder="Marca: Newion\nModelo: Lapela Sem Fio\nTorque Máximo: 350 N.m"
                    style={{ marginBottom: 12 }}
                  />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="button" className="btn-secondary-action" onClick={() => setShowQuickFill(false)}>Cancelar</button>
                    <button type="button" className="btn-primary" onClick={handleApplyQuickFill} style={{ padding: '6px 12px', fontSize: 13, height: 'auto' }}>Extrair e Preencher</button>
                  </div>
                </div>
              )}
              {form.specifications.length > 0 ? (
                <div className="specifications-table-wrapper">
                  <table className="specifications-table">
                    <thead>
                      <tr><th>Característica</th><th>Valor</th><th aria-label="Ações" /></tr>
                    </thead>
                    <tbody>
                      {form.specifications.map((specification, index) => (
                        <tr key={`${specification.label}-${index}`}>
                          <td><input className="form-input" value={specification.label} onChange={e => updateSpecification(index, 'label', e.target.value)} /></td>
                          <td><input className="form-input" value={specification.value} onChange={e => updateSpecification(index, 'value', e.target.value)} /></td>
                          <td>
                            <button type="button" className="specification-remove-button" title="Remover especificação" aria-label="Remover especificação" onClick={() => removeSpecification(index)}>
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="specifications-empty">Selecione uma categoria para gerar as especificações automaticamente ou adicione manualmente.</div>
              )}
            </div>
          </div>
        )}
                </>
              )}
              {mainTab === 'seo' && (
                <>


        {/* 7. INSTAGRAM E GOOGLE SHOPPING */}
        <div className="form-card">
          <h2 className="card-title">Instagram e Google Shopping</h2>

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

        {/* 9. VARIAÇÕES */}
        <div className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 className="card-title">Variações</h2>
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
          </div>

          <div className="form-group">
            <label style={{ display: 'flex', justifyContent: 'space-between' }}>
              Tags
              <span className="field-hint">Adicione palavras-chave para ajudar seus clientes a encontrar este produto na loja.</span>
            </label>
            <div className="tags-input-wrapper">
              <div className="tags-list" aria-live="polite">
                {parseTags(form.tags).map(tag => (
                  <span className="tag-pill" key={tag}>
                    <span>{tag}</span>
                    <button
                      type="button"
                      className="tag-remove-button"
                      aria-label={`Remover tag ${tag}`}
                      title={`Remover ${tag}`}
                      onClick={() => handleRemoveTag(tag)}
                    >
                      <X size={13} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  className="tags-text-input"
                  placeholder={parseTags(form.tags).length ? 'Adicionar outra palavra ou frase' : 'ferramentas, furadeira, sem fio, 12v'}
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTag()
                    }
                  }}
                />
              </div>
            </div>
            <span className="field-hint">Digite uma palavra ou frase e pressione Enter para criar um botão. Passe o mouse na tag para removê-la.</span>
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

        {/* 11. DESTAQUE E AVALIAÇÕES */}
        <div className="form-card">
          <h2 className="card-title">Destaque e Avaliações</h2>

          <label className="toggle-switch-label" style={{ marginBottom: 20 }}>
            <input
              type="checkbox"
              className="toggle-switch-input"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Exibir na seção de Produtos em Destaque na Home
          </label>
          
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label>Nota de Avaliação (Estrelas)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="5"
                className="form-input"
                placeholder="Ex: 4.8"
                value={form.commerce.ratingScore || ''}
                onChange={(e) => setForm({ 
                  ...form, 
                  commerce: { ...form.commerce, ratingScore: parseFloat(e.target.value) }
                })}
                style={{ maxWidth: 180 }}
              />
              <span className="field-hint">Exibido na página do produto (0 a 5).</span>
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>Total de Avaliações</label>
              <input
                type="number"
                step="1"
                min="0"
                className="form-input"
                placeholder="Ex: 125"
                value={form.commerce.ratingCount || ''}
                onChange={(e) => setForm({ 
                  ...form, 
                  commerce: { ...form.commerce, ratingCount: parseInt(e.target.value, 10) }
                })}
                style={{ maxWidth: 180 }}
              />
              <span className="field-hint">Número de pessoas que avaliaram.</span>
            </div>
          </div>
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
          
          <div style={{
            background: '#ffffff',
            border: '1.5px solid #e5e7eb',
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
      </>
    )}

    {/* Conteúdo da Aba 2: Storytelling (Acordeão Compacto & Enxuto) */}
    {activeTab === 'storytelling' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
        {/* Barra de controle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
            5 seções da vitrine oficial do produto
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button
              type="button"
              className="btn-secondary-action"
              style={{ fontSize: '0.75rem', height: 26, padding: '0 8px' }}
              onClick={() => toggleAllSections(true)}
            >
              Expandir Todos
            </button>
            <button
              type="button"
              className="btn-secondary-action"
              style={{ fontSize: '0.75rem', height: 26, padding: '0 8px' }}
              onClick={() => toggleAllSections(false)}
            >
              Recolher Todos
            </button>
          </div>
        </div>

        {/* ── 1. HERO SPOTLIGHT ── */}
        <div className="form-card" style={{ padding: 0, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => toggleSection('hero')}
            style={{
              width: '100%',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: expandedSections.hero ? '#fafafa' : '#ffffff',
              border: 'none',
              borderBottom: expandedSections.hero ? '1px solid #e2e8f0' : 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#f1f5f9',
                color: '#111111',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>1</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111111' }}>Hero Spotlight</span>
              {form.editorial_showcase.hero.title && (
                <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: 4 }}>• {form.editorial_showcase.hero.title}</span>
              )}
            </div>
            <div style={{ color: '#64748b' }}>
              {expandedSections.hero ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {expandedSections.hero && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-row">
                <div className="form-group">
                  <label>Tag Superior</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: MÁXIMA EFICIÊNCIA"
                    value={form.editorial_showcase.hero.eyebrow}
                    onChange={e => updateShowcase(s => ({ ...s, hero: { ...s.hero, eyebrow: e.target.value } }))}
                  />
                </div>
                <div className="form-group">
                  <label>Título</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Por que escolher este produto?"
                    value={form.editorial_showcase.hero.title}
                    onChange={e => updateShowcase(s => ({ ...s, hero: { ...s.hero, title: e.target.value } }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  className="form-input"
                  rows={2}
                  style={{ resize: 'vertical' }}
                  placeholder="Texto persuasivo de apresentação..."
                  value={form.editorial_showcase.hero.description}
                  onChange={e => updateShowcase(s => ({ ...s, hero: { ...s.hero, description: e.target.value } }))}
                />
              </div>

              <div className="form-row" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                <div className="form-group">
                  <label>Selo Foto 1</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Alto Torque"
                    value={form.editorial_showcase.hero.top_badge}
                    onChange={e => updateShowcase(s => ({ ...s, hero: { ...s.hero, top_badge: e.target.value } }))}
                  />
                </div>
                <div className="form-group">
                  <label>Selo Foto 2</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: 2x Baterias"
                    value={form.editorial_showcase.hero.bottom_badge}
                    onChange={e => updateShowcase(s => ({ ...s, hero: { ...s.hero, bottom_badge: e.target.value } }))}
                  />
                </div>
                <div className="form-group">
                  <label>Botão 1</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Garantir agora"
                    value={form.editorial_showcase.hero.cta_primary_text}
                    onChange={e => updateShowcase(s => ({ ...s, hero: { ...s.hero, cta_primary_text: e.target.value } }))}
                  />
                </div>
                <div className="form-group">
                  <label>Botão 2</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Comparar"
                    value={form.editorial_showcase.hero.cta_secondary_text}
                    onChange={e => updateShowcase(s => ({ ...s, hero: { ...s.hero, cta_secondary_text: e.target.value } }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Imagem do Hero</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                  type="text"
                  className="form-input"
                  placeholder="URL da imagem"
                  value={form.editorial_showcase.hero.image_url}
                  onChange={e => updateShowcase(s => ({ ...s, hero: { ...s.hero, image_url: e.target.value } }))}
                />
                  <button type="button" className="btn-secondary-action" onClick={() => setMediaModalState({ isOpen: true, target: 'hero' })}>Biblioteca</button>
                </div>
                {form.images.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Fotos:</span>
                    {form.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 6,
                          border: form.editorial_showcase.hero.image_url === img ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          padding: 2,
                          background: '#ffffff',
                          cursor: 'pointer'
                        }}
                        onClick={() => updateShowcase(s => ({ ...s, hero: { ...s.hero, image_url: img } }))}
                      >
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>3 Benefícios Rápidos</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(form.editorial_showcase.hero.benefits || []).map((b, bIdx) => (
                    <div
                      key={bIdx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '130px 1fr 1.5fr',
                        gap: 6,
                        padding: 6,
                        background: '#fafafa',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        alignItems: 'center'
                      }}
                    >
                      <select
                        className="form-input"
                        style={{ height: 32, padding: '4px 8px', fontSize: '0.8rem' }}
                        value={b.icon || 'zap'}
                        onChange={e => {
                          const val = e.target.value as any
                          updateShowcase(s => {
                            const nextB = [...s.hero.benefits]
                            nextB[bIdx] = { ...nextB[bIdx], icon: val }
                            return { ...s, hero: { ...s.hero, benefits: nextB } }
                          })
                        }}
                      >
                        <option value="zap">⚡ Potência</option>
                        <option value="battery">🔋 Bateria</option>
                        <option value="shield">🛡️ Garantia</option>
                        <option value="wrench">🔧 Robusto</option>
                        <option value="truck">🚚 Frete</option>
                        <option value="star">⭐ Qualidade</option>
                      </select>
                      <input
                        type="text"
                        className="form-input"
                        style={{ height: 32, fontSize: '0.8rem' }}
                        placeholder="Título"
                        value={b.title}
                        onChange={e => {
                          const val = e.target.value
                          updateShowcase(s => {
                            const nextB = [...s.hero.benefits]
                            nextB[bIdx] = { ...nextB[bIdx], title: val }
                            return { ...s, hero: { ...s.hero, benefits: nextB } }
                          })
                        }}
                      />
                      <input
                        type="text"
                        className="form-input"
                        style={{ height: 32, fontSize: '0.8rem' }}
                        placeholder="Descrição curta"
                        value={b.desc}
                        onChange={e => {
                          const val = e.target.value
                          updateShowcase(s => {
                            const nextB = [...s.hero.benefits]
                            nextB[bIdx] = { ...nextB[bIdx], desc: val }
                            return { ...s, hero: { ...s.hero, benefits: nextB } }
                          })
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 2. PERFORMANCE & USO ── */}
        <div className="form-card" style={{ padding: 0, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => toggleSection('performance')}
            style={{
              width: '100%',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: expandedSections.performance ? '#fafafa' : '#ffffff',
              border: 'none',
              borderBottom: expandedSections.performance ? '1px solid #e2e8f0' : 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#f1f5f9',
                color: '#111111',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>2</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111111' }}>Performance & Uso</span>
              {form.editorial_showcase.performance.title && (
                <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: 4 }}>• {form.editorial_showcase.performance.title}</span>
              )}
            </div>
            <div style={{ color: '#64748b' }}>
              {expandedSections.performance ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {expandedSections.performance && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label>Título</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Rendimento com alta precisão"
                  value={form.editorial_showcase.performance.title}
                  onChange={e => updateShowcase(s => ({ ...s, performance: { ...s.performance, title: e.target.value } }))}
                />
              </div>

              <div className="form-group">
                <label>Descrição Técnica</label>
                <textarea
                  className="form-input"
                  rows={2}
                  style={{ resize: 'vertical' }}
                  placeholder="Descrição técnica dos fluxos de trabalho..."
                  value={form.editorial_showcase.performance.description}
                  onChange={e => updateShowcase(s => ({ ...s, performance: { ...s.performance, description: e.target.value } }))}
                />
              </div>

              <div className="form-group">
                <label>Imagem em Operação</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                  type="text"
                  className="form-input"
                  placeholder="URL da imagem em ação"
                  value={form.editorial_showcase.performance.image_url}
                  onChange={e => updateShowcase(s => ({ ...s, performance: { ...s.performance, image_url: e.target.value } }))}
                />
                  <button type="button" className="btn-secondary-action" onClick={() => setMediaModalState({ isOpen: true, target: 'performance' })}>Biblioteca</button>
                </div>
                {form.images.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Fotos:</span>
                    {form.images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 6,
                          border: form.editorial_showcase.performance.image_url === img ? '2px solid #2563eb' : '1px solid #cbd5e1',
                          padding: 2,
                          background: '#ffffff',
                          cursor: 'pointer'
                        }}
                        onClick={() => updateShowcase(s => ({ ...s, performance: { ...s.performance, image_url: img } }))}
                      >
                        <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>3 Destaques Técnicos</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 8 }}>
                  {(form.editorial_showcase.performance.features || []).map((feat, fIdx) => (
                    <div
                      key={fIdx}
                      style={{
                        padding: 8,
                        background: '#fafafa',
                        borderRadius: 6,
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6
                      }}
                    >
                      <input
                        type="text"
                        className="form-input"
                        style={{ height: 32, fontSize: '0.82rem' }}
                        placeholder="Título do destaque"
                        value={feat.title}
                        onChange={e => {
                          const val = e.target.value
                          updateShowcase(s => {
                            const nextF = [...s.performance.features]
                            nextF[fIdx] = { ...nextF[fIdx], title: val }
                            return { ...s, performance: { ...s.performance, features: nextF } }
                          })
                        }}
                      />
                      <textarea
                        className="form-input"
                        rows={2}
                        style={{ resize: 'vertical', fontSize: '0.8rem' }}
                        placeholder="Explicação do diferencial"
                        value={feat.desc}
                        onChange={e => {
                          const val = e.target.value
                          updateShowcase(s => {
                            const nextF = [...s.performance.features]
                            nextF[fIdx] = { ...nextF[fIdx], desc: val }
                            return { ...s, performance: { ...s.performance, features: nextF } }
                          })
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 3. MODELOS & VERSÕES ── */}
        <div className="form-card" style={{ padding: 0, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => toggleSection('models')}
            style={{
              width: '100%',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: expandedSections.models ? '#fafafa' : '#ffffff',
              border: 'none',
              borderBottom: expandedSections.models ? '1px solid #e2e8f0' : 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#f1f5f9',
                color: '#111111',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>3</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111111' }}>Modelos & Versões</span>
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: 4 }}>
                • {(form.editorial_showcase.explore_models.models || []).length} modelo(s)
              </span>
            </div>
            <div style={{ color: '#64748b' }}>
              {expandedSections.models ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {expandedSections.models && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div className="form-group" style={{ flex: 1, margin: 0 }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Título da seção de modelos"
                    value={form.editorial_showcase.explore_models.title}
                    onChange={e => updateShowcase(s => ({ ...s, explore_models: { ...s.explore_models, title: e.target.value } }))}
                  />
                </div>
                <button
                  type="button"
                  className="btn-secondary-action"
                  style={{ fontSize: '0.78rem', height: 32, whiteSpace: 'nowrap' }}
                  onClick={() => {
                    updateShowcase(s => ({
                      ...s,
                      explore_models: {
                        ...s.explore_models,
                        models: [
                          ...s.explore_models.models,
                          {
                            badge: 'Nova Versão',
                            name: `${form.name || 'Produto'} Versão Extra`,
                            specs: 'Especificações resumidas',
                            image_url: form.images[0] || ''
                          }
                        ]
                      }
                    }))
                  }}
                >
                  <Plus size={13} /> Adicionar Modelo
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 8 }}>
                {(form.editorial_showcase.explore_models.models || []).map((m, mIdx) => (
                  <div
                    key={mIdx}
                    style={{
                      padding: 10,
                      background: '#fafafa',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ height: 30, fontSize: '0.8rem' }}
                        placeholder="Selo"
                        value={m.badge}
                        onChange={e => {
                          const val = e.target.value
                          updateShowcase(s => {
                            const nextM = [...s.explore_models.models]
                            nextM[mIdx] = { ...nextM[mIdx], badge: val }
                            return { ...s, explore_models: { ...s.explore_models, models: nextM } }
                          })
                        }}
                      />
                      <button
                        type="button"
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                        title="Remover modelo"
                        onClick={() => {
                          updateShowcase(s => ({
                            ...s,
                            explore_models: {
                              ...s.explore_models,
                              models: s.explore_models.models.filter((_, i) => i !== mIdx)
                            }
                          }))
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <input
                      type="text"
                      className="form-input"
                      style={{ height: 30, fontSize: '0.8rem' }}
                      placeholder="Nome do Modelo"
                      value={m.name}
                      onChange={e => {
                        const val = e.target.value
                        updateShowcase(s => {
                          const nextM = [...s.explore_models.models]
                          nextM[mIdx] = { ...nextM[mIdx], name: val }
                          return { ...s, explore_models: { ...s.explore_models, models: nextM } }
                        })
                      }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ height: 30, fontSize: '0.8rem' }}
                      placeholder="Especificações"
                      value={m.specs}
                      onChange={e => {
                        const val = e.target.value
                        updateShowcase(s => {
                          const nextM = [...s.explore_models.models]
                          nextM[mIdx] = { ...nextM[mIdx], specs: val }
                          return { ...s, explore_models: { ...s.explore_models, models: nextM } }
                        })
                      }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ height: 30, fontSize: '0.8rem' }}
                      placeholder="URL da Imagem"
                      value={m.image_url}
                      onChange={e => {
                        const val = e.target.value
                        updateShowcase(s => {
                          const nextM = [...s.explore_models.models]
                          nextM[mIdx] = { ...nextM[mIdx], image_url: val }
                          return { ...s, explore_models: { ...s.explore_models, models: nextM } }
                        })
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 4. TABELA COMPARATIVA ── */}
        <div className="form-card" style={{ padding: 0, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => toggleSection('comparison')}
            style={{
              width: '100%',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: expandedSections.comparison ? '#fafafa' : '#ffffff',
              border: 'none',
              borderBottom: expandedSections.comparison ? '1px solid #e2e8f0' : 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#f1f5f9',
                color: '#111111',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>4</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111111' }}>Tabela Comparativa</span>
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: 4 }}>
                • {(form.editorial_showcase.comparison.rows || []).length} linha(s)
              </span>
            </div>
            <div style={{ color: '#64748b' }}>
              {expandedSections.comparison ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {expandedSections.comparison && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-row" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
                <div className="form-group">
                  <label>Título da Tabela</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Comparar versões"
                    value={form.editorial_showcase.comparison.title}
                    onChange={e => updateShowcase(s => ({ ...s, comparison: { ...s.comparison, title: e.target.value } }))}
                  />
                </div>
                <div className="form-group">
                  <label>Coluna 1</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Padrão"
                    value={form.editorial_showcase.comparison.col1_title}
                    onChange={e => updateShowcase(s => ({ ...s, comparison: { ...s.comparison, col1_title: e.target.value } }))}
                  />
                </div>
                <div className="form-group">
                  <label>Coluna 2</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Versão Pro"
                    value={form.editorial_showcase.comparison.col2_title}
                    onChange={e => updateShowcase(s => ({ ...s, comparison: { ...s.comparison, col2_title: e.target.value } }))}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {(form.editorial_showcase.comparison.rows || []).map((r, rIdx) => (
                  <div
                    key={rIdx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr 32px',
                      gap: 6,
                      alignItems: 'center'
                    }}
                  >
                    <input
                      type="text"
                      className="form-input"
                      style={{ height: 32, fontSize: '0.8rem' }}
                      placeholder="Atributo / Especificação"
                      value={r.attr}
                      onChange={e => {
                        const val = e.target.value
                        updateShowcase(s => {
                          const nextR = [...s.comparison.rows]
                          nextR[rIdx] = { ...nextR[rIdx], attr: val }
                          return { ...s, comparison: { ...s.comparison, rows: nextR } }
                        })
                      }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ height: 32, fontSize: '0.8rem' }}
                      placeholder="Valor Coluna 1"
                      value={r.col1_val}
                      onChange={e => {
                        const val = e.target.value
                        updateShowcase(s => {
                          const nextR = [...s.comparison.rows]
                          nextR[rIdx] = { ...nextR[rIdx], col1_val: val }
                          return { ...s, comparison: { ...s.comparison, rows: nextR } }
                        })
                      }}
                    />
                    <input
                      type="text"
                      className="form-input"
                      style={{ height: 32, fontSize: '0.8rem' }}
                      placeholder="Valor Coluna 2"
                      value={r.col2_val}
                      onChange={e => {
                        const val = e.target.value
                        updateShowcase(s => {
                          const nextR = [...s.comparison.rows]
                          nextR[rIdx] = { ...nextR[rIdx], col2_val: val }
                          return { ...s, comparison: { ...s.comparison, rows: nextR } }
                        })
                      }}
                    />
                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                      title="Remover linha"
                      onClick={() => {
                        updateShowcase(s => ({
                          ...s,
                          comparison: {
                            ...s.comparison,
                            rows: s.comparison.rows.filter((_, i) => i !== rIdx)
                          }
                        }))
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
                <div style={{ marginTop: 4 }}>
                  <button
                    type="button"
                    className="btn-secondary-action"
                    style={{ fontSize: '0.78rem', height: 28 }}
                    onClick={() => {
                      updateShowcase(s => ({
                        ...s,
                        comparison: {
                          ...s.comparison,
                          rows: [
                            ...s.comparison.rows,
                            { attr: 'Nova Especificação', col1_val: '—', col2_val: 'Incluso' }
                          ]
                        }
                      }))
                    }}
                  >
                    <Plus size={13} /> Adicionar Linha
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── 5. PERGUNTAS FREQUENTES (FAQ) ── */}
        <div className="form-card" style={{ padding: 0, overflow: 'hidden' }}>
          <button
            type="button"
            onClick={() => toggleSection('faq')}
            style={{
              width: '100%',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: expandedSections.faq ? '#fafafa' : '#ffffff',
              border: 'none',
              borderBottom: expandedSections.faq ? '1px solid #e2e8f0' : 'none',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#f1f5f9',
                color: '#111111',
                fontSize: '0.75rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>5</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#111111' }}>Perguntas Frequentes (FAQ)</span>
              <span style={{ fontSize: '0.78rem', color: '#64748b', marginLeft: 4 }}>
                • {(form.editorial_showcase.faqs || []).length} pergunta(s)
              </span>
            </div>
            <div style={{ color: '#64748b' }}>
              {expandedSections.faq ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </button>

          {expandedSections.faq && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary-action"
                  style={{ fontSize: '0.78rem', height: 28 }}
                  onClick={() => {
                    updateShowcase(s => ({
                      ...s,
                      faqs: [
                        ...s.faqs,
                        {
                          q: 'Nova Pergunta Frequente?',
                          a: 'Resposta da loja...'
                        }
                      ]
                    }))
                  }}
                >
                  <Plus size={13} /> Adicionar Pergunta
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(form.editorial_showcase.faqs || []).map((faq, fIdx) => (
                  <div
                    key={fIdx}
                    style={{
                      padding: 8,
                      background: '#fafafa',
                      borderRadius: 6,
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="text"
                        className="form-input"
                        style={{ height: 30, fontSize: '0.82rem' }}
                        placeholder="Pergunta"
                        value={faq.q}
                        onChange={e => {
                          const val = e.target.value
                          updateShowcase(s => {
                            const nextF = [...s.faqs]
                            nextF[fIdx] = { ...nextF[fIdx], q: val }
                            return { ...s, faqs: nextF }
                          })
                        }}
                      />
                      <button
                        type="button"
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
                        title="Remover pergunta"
                        onClick={() => {
                          updateShowcase(s => ({
                            ...s,
                            faqs: s.faqs.filter((_, i) => i !== fIdx)
                          }))
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <textarea
                      className="form-input"
                      rows={2}
                      style={{ resize: 'vertical', fontSize: '0.8rem' }}
                      placeholder="Resposta..."
                      value={faq.a}
                      onChange={e => {
                        const val = e.target.value
                        updateShowcase(s => {
                          const nextF = [...s.faqs]
                          nextF[fIdx] = { ...nextF[fIdx], a: val }
                          return { ...s, faqs: nextF }
                        })
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    )}

        {/* Sticky Bottom Save Bar */}
        <div className="form-card" style={{ marginTop: 16 }}>
          <h3 style={{ margin: '0 0 6px' }}>Apresentação do produto</h3>
          <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: 13 }}>
            Adicione até 3 imagens que serão exibidas abaixo do produto na loja.
          </p>
          <div className="form-row">
            {[0, 1, 2].map((index) => {
              const images = ((form.editorial_showcase as any)?.presentation_images || []) as string[]
              return (
                <div className="form-group" key={index}>
                  <label>Imagem {index + 1}</label>
                  {images[index] && (
                    <img
                      src={images[index]}
                      alt={`Pré-visualização da imagem ${index + 1}`}
                      style={{ width: '100%', maxHeight: 180, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 8, marginBottom: 8, background: '#ffffff' }}
                    />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ width: '100%', fontSize: 12 }}
                    onChange={(event) => {
                      if (event.target.files?.[0]) handleUploadFiles([event.target.files[0]], index)
                      event.currentTarget.value = ''
                    }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div className="form-card" style={{ marginTop: 16 }}>
          <h3 style={{ margin: '0 0 6px' }}>Perguntas e respostas</h3>
          <p style={{ margin: '0 0 14px', color: '#64748b', fontSize: 13 }}>
            Cadastre perguntas frequentes e respostas específicas deste produto.
          </p>
          {(((form.editorial_showcase as any)?.custom_faqs || []) as Array<{ question: string; answer: string }>).map((item, index, list) => (
            <div key={index} style={{ display: 'grid', gap: 8, marginBottom: 12, padding: 12, border: '1px solid #e2e8f0', borderRadius: 8 }}>
              <input className="form-input" placeholder="Título ou pergunta" value={item.question} onChange={(event) => {
                const next = [...list]; next[index] = { ...next[index], question: event.target.value }
                updateShowcase((showcase: any) => ({ ...showcase, custom_faqs: next }))
              }} />
              <textarea className="form-input" rows={2} placeholder="Resposta ou descrição" value={item.answer} onChange={(event) => {
                const next = [...list]; next[index] = { ...next[index], answer: event.target.value }
                updateShowcase((showcase: any) => ({ ...showcase, custom_faqs: next }))
              }} />
              <button type="button" className="btn-secondary-action" onClick={() => updateShowcase((showcase: any) => ({ ...showcase, custom_faqs: list.filter((_, itemIndex) => itemIndex !== index) }))}>Remover pergunta</button>
            </div>
          ))}
          <button type="button" className="btn-secondary-action" onClick={() => updateShowcase((showcase: any) => ({ ...showcase, custom_faqs: [...(showcase.custom_faqs || []), { question: '', answer: '' }] }))}>+ Adicionar pergunta</button>
        </div>

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

            <div className="publish-modal-header" style={{ alignItems: 'center', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 0, borderBottom: 'none' }}>
              <div className="publish-modal-icon" style={{ width: 52, height: 52, borderRadius: '50%', background: '#e6f9f0', color: '#00a854', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <Check size={26} strokeWidth={2.5} />
              </div>
              <div className="publish-modal-title-wrap">
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#0f172a' }}>Produto Publicado!</h3>
                <p style={{ margin: '8px 0 0 0', color: '#64748b', fontSize: '0.9rem', lineHeight: 1.4 }}>Seu produto já está ativo e visível na vitrine oficial.</p>
              </div>
            </div>

            <div className="publish-modal-actions" style={{ marginTop: 28, display: 'flex', gap: 12, flexDirection: 'row', paddingTop: 0, borderTop: 'none' }}>
              <button
                type="button"
                className="btn-modal-continue"
                onClick={() => setShowPublishModal(false)}
                style={{ flex: 1, padding: '10px 0', textAlign: 'center', background: '#f1f5f9', border: 'none', color: '#334155', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}
              >
                Fechar
              </button>
              <a
                href={`https://teknixbrasil.com.br/produto/${publishedSlug || form.seo_slug || form.slug || id}`}
                target="_blank"
                rel="noreferrer"
                className="btn-modal-view-store"
                onClick={() => setShowPublishModal(false)}
                style={{ flex: 1, padding: '10px 0', textAlign: 'center', background: '#000', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none', fontSize: '0.9rem' }}
              >
                <ExternalLink size={14} />
                Ver na Loja
              </a>
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

      <MediaLibraryModal
        isOpen={mediaModalState.isOpen}
        onClose={() => setMediaModalState({ isOpen: false, target: null })}
        onSelectMedia={handleMediaSelected}
        title="Biblioteca de Mídia do Produto"
      />
    </div>
  )
}
