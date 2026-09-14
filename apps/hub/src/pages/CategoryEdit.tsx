import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  type CentralCategory,
  type CategoryRule,
  type LinkingMode,
  type RuleOperator,
  type RuleField,
  type RuleCondition,
  type MarketplaceMapping,
  matchesRule,
  matchesCategoryRules,
  resolveCategoryProducts,
  parseCategoryRow,
  formatCategoryPayload,
  normalizeText
} from '../../../../packages/core/src/categoryRules'
import {
  ArrowLeft,
  Save,
  ExternalLink,
  Zap,
  Sliders,
  Package,
  Globe,
  Store,
  Plus,
  Trash2,
  RefreshCw,
  Search,
  CheckCircle2,
  Layers,
  FileCode,
  AlertCircle,
  Upload,
  Image,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import './CategoryEdit.css'

const PRESET_CUTOUTS = [
  { label: 'Microfones & Áudio', url: '/images/referencias/microfones.png', alt: 'Microfone' },
  { label: 'Pistola de Lavagem', url: '/images/referencias/pistola-de-lavagem.webp', alt: 'Lavagem' },
  { label: 'Parafusadeira', url: '/images/referencias/parafusadeira.webp', alt: 'Parafusadeira' },
  { label: 'Morsa de Bancada', url: '/images/referencias/morsa-de-bancada.webp', alt: 'Morsa' },
  { label: 'Macaco Hidráulico', url: '/images/referencias/macaco-hidraulico.webp', alt: 'Macaco' },
  { label: 'Lixadeira', url: '/images/referencias/lixadeira.webp', alt: 'Lixadeira' },
  { label: 'Pistola de Pintura', url: '/images/referencias/pistola-de-pintura.webp', alt: 'Pintura' },
]

export default function CategoryEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'nova' || id === 'add'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'mosaic' | 'rules' | 'products' | 'seo' | 'marketplaces'>('general')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showDirectUrlInput, setShowDirectUrlInput] = useState(false)

  // Upload de Foto da Categoria
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingPhoto(true)
    try {
      const ext = file.name.split('.').pop() || 'png'
      const fileName = `${Date.now()}_cat_${Math.random().toString(36).substring(2, 7)}.${ext}`
      const path = `categories/${fileName}`

      const { error: uploadError } = await supabase.storage.from('media').upload(path, file, {
        upsert: true,
        contentType: file.type
      })

      if (uploadError) {
        const { error: uploadError2 } = await supabase.storage.from('uploads').upload(path, file, {
          upsert: true,
          contentType: file.type
        })
        if (uploadError2) throw uploadError2
        const { data: urlData2 } = supabase.storage.from('uploads').getPublicUrl(path)
        setForm(prev => ({
          ...prev,
          image_url: urlData2.publicUrl,
          mosaic_image_url: prev.mosaic_image_url || urlData2.publicUrl
        }))
      } else {
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
        setForm(prev => ({
          ...prev,
          image_url: urlData.publicUrl,
          mosaic_image_url: prev.mosaic_image_url || urlData.publicUrl
        }))
      }
    } catch (err: any) {
      console.error('Erro ao fazer upload da imagem da categoria:', err)
      alert('Erro ao enviar imagem. Verifique o arquivo e tente novamente.')
    } finally {
      setUploadingPhoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Catálogo completo para preview e vinculação
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [categoriesList, setCategoriesList] = useState<{ id: string; name: string; slug: string }[]>([])

  // Estado do formulário
  const [form, setForm] = useState<CentralCategory>({
    id: isNew ? crypto.randomUUID() : id,
    name: '',
    slug: '',
    parent_id: null,
    description: '',
    image_url: '',
    icon: '',
    status: 'active',
    is_published: true,
    sort_order: 0,
    linking_mode: 'hybrid',
    rule_operator: 'OR',
    show_in_mosaic: true,
    mosaic_image_url: '',
    mosaic_label: '',
    rules: [
      {
        id: crypto.randomUUID(),
        field: 'name',
        condition: 'contains',
        value: ''
      }
    ],
    manual_product_ids: [],
    excluded_product_ids: [],
    seo_title: '',
    seo_description: '',
    canonical_url: '',
    marketplace_mappings: [
      { channel: 'mercadolivre', external_category_id: '', external_category_name: '' },
      { channel: 'shopee', external_category_id: '', external_category_name: '' },
      { channel: 'amazon', external_category_id: '', external_category_name: '' },
      { channel: 'magalu', external_category_id: '', external_category_name: '' }
    ]
  })

  // Modal de Adicionar Produto Manual
  const [showProductModal, setShowProductModal] = useState(false)
  const [productSearch, setProductSearch] = useState('')
  const [selectedToAdd, setSelectedToAdd] = useState<string[]>([])

  // Busca na lista de produtos vinculados
  const [linkedSearch, setLinkedSearch] = useState('')
  const [recalcFeedback, setRecalcFeedback] = useState<string | null>(null)

  // Carrega categoria existente e produtos do catálogo
  useEffect(() => {
    let active = true

    async function loadData() {
      setLoading(true)
      try {
        // 1. Carrega todas as categorias para a seleção de Categoria Pai
        const { data: cats } = await supabase
          .from('store_categories')
          .select('id, name, slug')
          .order('name')
        if (active && cats) setCategoriesList(cats)

        // 2. Carrega todos os produtos para avaliação das regras em tempo real
        const { data: prods } = await supabase
          .from('products')
          .select('id, sku, name, brand, model, description, notes, cost_purchase, stock, stock_quantity, status, image_url')
          .limit(1000)
        if (active && prods) setAllProducts(prods)

        // 3. Se estiver editando, carrega os dados da categoria
        if (!isNew && id) {
          const { data: catData, error } = await supabase
            .from('store_categories')
            .select('*')
            .eq('id', id)
            .maybeSingle()

          if (error) {
            console.error('Erro ao buscar categoria:', error)
          } else if (catData && active) {
            const parsed = parseCategoryRow(catData)
            setForm(parsed)
          }
        }
      } catch (err) {
        console.error('Erro ao inicializar CategoryEdit:', err)
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => { active = false }
  }, [id, isNew])

  // Gerador automático de slug
  const handleNameChange = (name: string) => {
    const slug = normalizeText(name).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    setForm(prev => ({
      ...prev,
      name,
      slug: (isNew || !prev.slug) ? slug : prev.slug,
      seo_title: prev.seo_title || name,
      canonical_url: (isNew || !prev.canonical_url) ? `/categoria/${slug}` : prev.canonical_url
    }))
  }

  // Avaliação em tempo real dos produtos que atendem às regras (PREVIEW DA REGRA)
  const ruleMatchedProducts = useMemo(() => {
    if (!form.rules || form.rules.length === 0) return []
    // Filtra regras que possuem valor preenchido
    const activeRules = form.rules.filter(r => String(r.value || '').trim().length > 0)
    if (activeRules.length === 0) return []

    return allProducts.filter(p => matchesCategoryRules(p, activeRules, form.rule_operator).matched)
  }, [allProducts, form.rules, form.rule_operator])

  // Resolução dos produtos vinculados atuais (MANUAL + REGRAS)
  const resolvedLinkedProducts = useMemo(() => {
    return resolveCategoryProducts(form, allProducts)
  }, [form, allProducts])

  // Produtos filtrados na aba de vinculados
  const filteredLinkedProducts = useMemo(() => {
    if (!linkedSearch.trim()) return resolvedLinkedProducts
    const q = normalizeText(linkedSearch)
    return resolvedLinkedProducts.filter(p =>
      normalizeText(p.productName).includes(q) ||
      normalizeText(p.sku).includes(q) ||
      normalizeText(p.brand).includes(q)
    )
  }, [resolvedLinkedProducts, linkedSearch])

  // Produtos disponíveis no catálogo para adicionar manualmente
  const catalogAvailableToAdd = useMemo(() => {
    const currentLinkedIds = new Set(resolvedLinkedProducts.map(p => p.productId))
    let filtered = allProducts.filter(p => !currentLinkedIds.has(String(p.id)))
    if (productSearch.trim()) {
      const q = normalizeText(productSearch)
      filtered = filtered.filter(p =>
        normalizeText(p.name).includes(q) ||
        normalizeText(p.sku).includes(q) ||
        normalizeText(p.brand).includes(q)
      )
    }
    return filtered
  }, [allProducts, resolvedLinkedProducts, productSearch])

  // Manipulação de regras inteligentes
  const addRule = () => {
    setForm(prev => ({
      ...prev,
      rules: [
        ...prev.rules,
        {
          id: crypto.randomUUID(),
          field: 'name',
          condition: 'contains',
          value: ''
        }
      ]
    }))
  }

  const removeRule = (ruleId: string) => {
    setForm(prev => ({
      ...prev,
      rules: prev.rules.filter(r => r.id !== ruleId)
    }))
  }

  const updateRule = (ruleId: string, patch: Partial<CategoryRule>) => {
    setForm(prev => ({
      ...prev,
      rules: prev.rules.map(r => r.id === ruleId ? { ...r, ...patch } : r)
    }))
  }

  // Desvincular produto
  const handleUnlinkProduct = (productId: string) => {
    setForm(prev => {
      const newManual = prev.manual_product_ids.filter(id => id !== productId)
      const newExcluded = [...new Set([...prev.excluded_product_ids, productId])]
      return {
        ...prev,
        manual_product_ids: newManual,
        excluded_product_ids: newExcluded
      }
    })
  }

  // Adicionar produtos manuais selecionados
  const handleConfirmAddManual = () => {
    if (selectedToAdd.length === 0) return
    setForm(prev => ({
      ...prev,
      manual_product_ids: [...new Set([...prev.manual_product_ids, ...selectedToAdd])],
      excluded_product_ids: prev.excluded_product_ids.filter(id => !selectedToAdd.includes(id))
    }))
    setSelectedToAdd([])
    setShowProductModal(false)
  }

  // Recalcular regras com feedback
  const handleRecalculate = () => {
    const beforeCount = resolvedLinkedProducts.length
    // Força reavaliação
    const activeRules = form.rules.filter(r => String(r.value || '').trim().length > 0)
    const ruleMatches = allProducts.filter(p => matchesCategoryRules(p, activeRules, form.rule_operator).matched)
    const ruleIds = new Set(ruleMatches.map(p => String(p.id)))
    const manualIds = new Set(form.manual_product_ids)

    const totalNow = new Set([...ruleIds, ...manualIds]).size
    const added = Math.max(0, totalNow - beforeCount)

    setRecalcFeedback(`Recálculo concluído: ${totalNow} produtos vinculados (${added} novos adicionados pelas regras, vínculos manuais preservados).`)
    setTimeout(() => setRecalcFeedback(null), 5000)
  }

  // Mapeamento de marketplace
  const handleMarketplaceChange = (channel: string, external_id: string, external_name?: string) => {
    setForm(prev => {
      const mappings = [...(prev.marketplace_mappings || [])]
      const index = mappings.findIndex(m => m.channel === channel)
      if (index >= 0) {
        mappings[index] = { channel, external_category_id: external_id, external_category_name: external_name }
      } else {
        mappings.push({ channel, external_category_id: external_id, external_category_name: external_name })
      }
      return { ...prev, marketplace_mappings: mappings }
    })
  }

  // Salvar no Supabase
  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('Por favor, informe o nome da categoria.')
      setActiveTab('general')
      return
    }

    if (!form.slug.trim()) {
      alert('Por favor, informe a URL amigável (slug) da categoria.')
      setActiveTab('general')
      return
    }

    setSaving(true)
    try {
      const payload = formatCategoryPayload(form)

      if (isNew) {
        const { data, error } = await supabase
          .from('store_categories')
          .insert({
            ...payload,
            id: form.id
          })
          .select()
          .single()

        if (error) throw error
        alert('Categoria criada com sucesso!')
        navigate('/hub/categorias')
      } else {
        const { error } = await supabase
          .from('store_categories')
          .update(payload)
          .eq('id', form.id)

        if (error) throw error
        alert('Categoria atualizada com sucesso!')
      }
    } catch (err: any) {
      console.error('Erro ao salvar categoria:', err)
      alert(`Erro ao salvar categoria: ${err.message || err}`)
    } finally {
      setSaving(false)
    }
  }

  const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:5173'
  const publicCategoryUrl = `${siteUrl}/categoria/${form.slug}`
  const pageBuilderUrl = `/hub/editor/native?path=${encodeURIComponent(`/categoria/${form.slug}`)}`

  if (loading) {
    return (
      <div className="cat-edit-container">
        <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
          <RefreshCw className="hub-spin" size={24} style={{ marginBottom: 12 }} />
          <div>Carregando ficha da categoria central...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="cat-edit-container">
      {/* Top Header */}
      <div className="cat-edit-header">
        <div>
          <div className="cat-edit-breadcrumb">
            <Link to="/hub/categorias">Categorias</Link>
            <span>/</span>
            <span>{isNew ? 'Nova Categoria' : form.name || 'Editar'}</span>
          </div>
          <div className="cat-edit-title-group">
            <h1 className="cat-edit-title">{isNew ? 'Nova Categoria' : (form.name || 'Categoria Sem Nome')}</h1>
            {!isNew && (
              <>
                <span className={`cat-edit-badge ${form.status === 'active' ? 'active' : 'inactive'}`}>
                  {form.status === 'active' ? 'Ativa' : 'Inativa'}
                </span>
                {form.linking_mode !== 'manual' && (
                  <span className="cat-edit-badge smart">
                    <Zap size={11} /> Regras
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="cat-edit-actions">
          <button
            type="button"
            className="hub-btn hub-btn-secondary"
            onClick={() => navigate('/hub/categorias')}
          >
            <span className="cat-btn-icon-bubble"><ArrowLeft size={14} /></span> Voltar
          </button>

          {!isNew && form.slug && (
            <>
              <a
                href={publicCategoryUrl}
                target="_blank"
                rel="noreferrer"
                className="hub-btn hub-btn-secondary"
                title="Visualizar a categoria no SITE público"
              >
                <span className="cat-btn-icon-bubble"><ExternalLink size={13} /></span> Ver no SITE
              </a>
              <Link
                to={pageBuilderUrl}
                className="hub-btn hub-btn-secondary"
                title="Abrir no Page Builder oficial"
              >
                <span className="cat-btn-icon-bubble"><FileCode size={13} /></span> Editar Página
              </Link>
            </>
          )}

          <button
            type="button"
            className="hub-btn hub-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={15} /> {saving ? 'Salvando...' : (isNew ? 'Criar Categoria' : 'Salvar')}
          </button>
        </div>
      </div>

      {/* Se for Nova Categoria, exibe fluxo simplificado e direto com texto mínimo e limpo */}
      {isNew ? (
        <div className="cat-new-flow-container">
          <div className="cat-new-flow-grid">
            {/* Coluna Principal */}
            <div className="cat-new-flow-main">
              {/* Informações Básicas */}
              <div className="cat-card">
                <div className="cat-card-header" style={{ marginBottom: 14 }}>
                  <h3 className="cat-card-title">Informações</h3>
                </div>

                <div className="cat-form-group" style={{ marginBottom: 16 }}>
                  <label className="cat-form-label">Nome *</label>
                  <input
                    type="text"
                    className="cat-form-input"
                    style={{ fontSize: 14, fontWeight: 500 }}
                    placeholder="Ex: Microfones & Áudio"
                    value={form.name}
                    onChange={e => handleNameChange(e.target.value)}
                    autoFocus
                  />
                  {form.slug && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#0369a1', marginTop: 4 }}>
                      <span>URL:</span>
                      <code style={{ background: '#f0f9ff', padding: '1px 6px', borderRadius: 4, border: '1px solid #bae6fd' }}>
                        /categoria/{form.slug}
                      </code>
                    </div>
                  )}
                </div>

                <div className="cat-form-group" style={{ marginBottom: 16 }}>
                  <label className="cat-form-label">Categoria Superior</label>
                  <select
                    className="cat-form-select"
                    value={form.parent_id || ''}
                    onChange={e => setForm({ ...form, parent_id: e.target.value || null })}
                  >
                    <option value="">Nenhuma (Principal)</option>
                    {categoriesList
                      .filter(c => c.id !== form.id)
                      .map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="cat-form-group">
                  <label className="cat-form-label">Descrição</label>
                  <textarea
                    className="cat-form-textarea"
                    style={{ minHeight: 64 }}
                    placeholder="Descrição opcional..."
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Foto da Categoria */}
              <div className="cat-card">
                <div className="cat-card-header" style={{ marginBottom: 14 }}>
                  <h3 className="cat-card-title">Foto</h3>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />

                <div className="cat-photo-manager-box" style={{ background: '#F7F7F7', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                  <div className="cat-photo-preview-container">
                    {form.image_url ? (
                      <div className="cat-photo-preview-card">
                        <img
                          src={form.image_url}
                          alt={form.name || 'Foto'}
                          className="cat-photo-preview-image"
                        />
                        <button
                          type="button"
                          className="cat-photo-remove-action"
                          onClick={() => setForm(prev => ({ ...prev, image_url: '', mosaic_image_url: '' }))}
                          title="Remover foto"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="cat-photo-placeholder" onClick={() => fileInputRef.current?.click()} title="Clique para enviar foto">
                        <Image size={24} color="#94a3b8" />
                        <span className="cat-photo-placeholder-text">Enviar foto</span>
                      </div>
                    )}
                  </div>

                  <div className="cat-photo-controls">
                    <div className="cat-photo-actions-row">
                      <button
                        type="button"
                        className="cat-upload-file-btn"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingPhoto}
                      >
                        <Upload size={14} />
                        {uploadingPhoto ? 'Enviando...' : 'Escolher Imagem'}
                      </button>
                      {form.image_url && (
                        <button
                          type="button"
                          className="hub-btn hub-btn-secondary"
                          style={{ height: 38, fontSize: 12 }}
                          onClick={() => setForm(prev => ({ ...prev, image_url: '', mosaic_image_url: '' }))}
                        >
                          Remover
                        </button>
                      )}
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>
                        Sugestões:
                      </span>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {PRESET_CUTOUTS.map(preset => {
                          const isSelected = form.image_url === preset.url
                          return (
                            <button
                              key={preset.url}
                              type="button"
                              className={`cat-photo-preset-chip ${isSelected ? 'selected' : ''}`}
                              onClick={() => setForm(prev => ({
                                ...prev,
                                image_url: preset.url,
                                mosaic_image_url: prev.mosaic_image_url || preset.url
                              }))}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                borderRadius: 16,
                                border: isSelected ? '1px solid #0f172a' : '1px solid #e2e8f0',
                                background: isSelected ? '#0f172a' : '#ffffff',
                                color: isSelected ? '#ffffff' : '#334155',
                                fontSize: 11,
                                fontWeight: isSelected ? 600 : 400,
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <img src={preset.url} alt={preset.alt} style={{ width: 16, height: 16, objectFit: 'contain' }} />
                              <span>{preset.alt}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div style={{ marginTop: 6 }}>
                      {!showDirectUrlInput ? (
                        <button
                          type="button"
                          onClick={() => setShowDirectUrlInput(true)}
                          style={{ background: 'none', border: 'none', color: '#0071e3', fontSize: 11, cursor: 'pointer', padding: 0, textDecoration: 'underline' }}
                        >
                          Inserir link direto
                        </button>
                      ) : (
                        <input
                          type="text"
                          className="cat-form-input raw-input"
                          placeholder="Cole o link da imagem (URL)..."
                          value={form.image_url}
                          onChange={e => {
                            const val = e.target.value
                            setForm(prev => ({ ...prev, image_url: val, mosaic_image_url: prev.mosaic_image_url || val }))
                          }}
                          style={{ height: 32, fontSize: 12 }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Lateral */}
            <div className="cat-new-flow-side">
              {/* Visibilidade */}
              <div className="cat-card">
                <div className="cat-card-header" style={{ marginBottom: 12 }}>
                  <h3 className="cat-card-title">Visibilidade</h3>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Ativa no Catálogo</span>
                  <label className="cat-mosaic-switch">
                    <input
                      type="checkbox"
                      checked={form.status === 'active'}
                      onChange={e => setForm({ ...form, status: e.target.checked ? 'active' : 'inactive', is_published: e.target.checked })}
                    />
                    <span className="cat-mosaic-slider" />
                  </label>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: '#0f172a' }}>Destaque na Home</span>
                  <label className="cat-mosaic-switch">
                    <input
                      type="checkbox"
                      checked={form.show_in_mosaic !== false}
                      onChange={e => setForm({ ...form, show_in_mosaic: e.target.checked })}
                    />
                    <span className="cat-mosaic-slider" />
                  </label>
                </div>

                {form.show_in_mosaic !== false && (
                  <div style={{ background: '#F7F7F7', padding: 10, borderRadius: 10, border: '1px solid #e2e8f0', marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 10, background: '#ffffff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
                        {form.image_url ? (
                          <img src={form.image_url} alt="" style={{ width: 34, height: 34, objectFit: 'contain' }} />
                        ) : (
                          <span style={{ fontSize: 9, color: '#94a3b8' }}>Sem foto</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {form.mosaic_label || form.name || 'Nome da Categoria'}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 8 }}>
                      <label style={{ fontSize: 11, fontWeight: 500, color: '#64748b', display: 'block', marginBottom: 3 }}>
                        Rótulo na Home (opcional):
                      </label>
                      <input
                        type="text"
                        className="cat-form-input"
                        style={{ height: 30, fontSize: 12 }}
                        placeholder={form.name || 'Ex: Microfones'}
                        value={form.mosaic_label || ''}
                        onChange={e => setForm({ ...form, mosaic_label: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Opções Avançadas (Recolhido) */}
              <div className="cat-card" style={{ padding: 14 }}>
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    cursor: 'pointer',
                    color: '#475569',
                    fontWeight: 500,
                    fontSize: 12
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sliders size={13} /> Opções Avançadas
                  </span>
                  {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {showAdvanced && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div className="cat-form-group">
                      <label className="cat-form-label" style={{ fontSize: 12 }}>Ordem</label>
                      <input
                        type="number"
                        className="cat-form-input"
                        style={{ height: 32 }}
                        value={form.sort_order}
                        onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })}
                      />
                    </div>

                    <div className="cat-form-group">
                      <label className="cat-form-label" style={{ fontSize: 12 }}>Slug</label>
                      <input
                        type="text"
                        className="cat-form-input"
                        style={{ height: 32 }}
                        value={form.slug}
                        onChange={e => setForm({ ...form, slug: normalizeText(e.target.value).replace(/\s+/g, '-') })}
                      />
                    </div>

                    <div className="cat-form-group">
                      <label className="cat-form-label" style={{ fontSize: 12 }}>Título SEO</label>
                      <input
                        type="text"
                        className="cat-form-input"
                        style={{ height: 32 }}
                        placeholder="Ex: Microfones | TEKNIX"
                        value={form.seo_title}
                        onChange={e => setForm({ ...form, seo_title: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  type="button"
                  className="hub-btn hub-btn-primary"
                  style={{ width: '100%', height: 42, justifyContent: 'center', fontSize: 13, fontWeight: 600 }}
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save size={15} /> {saving ? 'Salvando...' : 'Criar Categoria'}
                </button>
                <button
                  type="button"
                  className="hub-btn hub-btn-secondary"
                  style={{ width: '100%', height: 36, justifyContent: 'center', fontSize: 12 }}
                  onClick={() => navigate('/hub/categorias')}
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Navigation Tabs - Padrão Oficial 1:1 do Sistema (StatsOverview) */}
          <div className="stats-tab-nav" style={{ display: 'flex', gap: 6, borderBottom: '1px solid #e2e8f0', paddingBottom: 10, overflowX: 'auto', marginBottom: 24 }}>
            {[
              { id: 'general', label: 'Geral & Hierarquia' },
          { id: 'mosaic', label: 'Mosaico da Home' },
          { id: 'rules', label: 'Regras Inteligentes & Preview', count: form.rules?.length },
          { id: 'products', label: 'Produtos Vinculados', count: resolvedLinkedProducts.length },
          { id: 'seo', label: 'Página & SEO' },
          { id: 'marketplaces', label: 'Marketplaces' },
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`stats-tab-button ${activeTab === tab.id ? 'is-active' : ''}`}
            style={{
              background: activeTab === tab.id ? '#0f172a' : '#ffffff',
              color: activeTab === tab.id ? '#ffffff' : '#475569',
              border: '1px solid ' + (activeTab === tab.id ? '#0f172a' : '#e2e8f0'),
              borderRadius: 980,
              padding: '5px 14px',
              fontSize: '0.8rem',
              fontWeight: activeTab === tab.id ? 600 : 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
              height: 'auto',
              minHeight: 'unset',
              lineHeight: 1.4
            }}
          >
            <span>{tab.label}</span>
            {tab.count !== undefined && tab.count > 0 && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: 999,
                  fontSize: '10px',
                  fontWeight: 700,
                  background: activeTab === tab.id ? 'rgba(255, 255, 255, 0.2)' : '#f1f5f9',
                  color: activeTab === tab.id ? '#ffffff' : '#64748b'
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ─── ABA 1: GERAL & HIERARQUIA ────────────────────────────────────────── */}
      {activeTab === 'general' && (
        <div className="cat-card">
          <div className="cat-card-header">
            <h3 className="cat-card-title">Informações Básicas e Hierarquia</h3>
          </div>

          <div className="cat-form-grid">
            <div className="cat-form-group">
              <label className="cat-form-label">Nome da Categoria *</label>
              <input
                type="text"
                className="cat-form-input"
                placeholder="Ex: Furadeiras, Parafusadeiras..."
                value={form.name}
                onChange={e => handleNameChange(e.target.value)}
              />
              <span className="cat-form-hint">Nome oficial exibido no menu e nos produtos.</span>
            </div>

            <div className="cat-form-group">
              <label className="cat-form-label">URL Amigável (Slug) *</label>
              <input
                type="text"
                className="cat-form-input"
                placeholder="Ex: furadeiras"
                value={form.slug}
                onChange={e => setForm({ ...form, slug: normalizeText(e.target.value).replace(/\s+/g, '-') })}
              />
              <span className="cat-form-hint">
                URL pública no site: <code>/categoria/{form.slug || 'slug'}</code>
              </span>
            </div>

            <div className="cat-form-group">
              <label className="cat-form-label">Categoria Superior (Pai / Subcategoria)</label>
              <select
                className="cat-form-select"
                value={form.parent_id || ''}
                onChange={e => setForm({ ...form, parent_id: e.target.value || null })}
              >
                <option value="">Nenhuma (Categoria Principal / Raiz)</option>
                {categoriesList
                  .filter(c => c.id !== form.id)
                  .map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
              <span className="cat-form-hint">
                Define a árvore de navegação e os breadcrumbs oficiais.
              </span>
            </div>

            <div className="cat-form-group">
              <label className="cat-form-label">Ordem de Exibição</label>
              <input
                type="number"
                className="cat-form-input"
                value={form.sort_order}
                onChange={e => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
              <span className="cat-form-hint">Ordem relativa de ordenação nos menus da loja.</span>
            </div>

            <div className="cat-form-group full">
              <label className="cat-form-label">Descrição da Categoria</label>
              <textarea
                className="cat-form-textarea"
                placeholder="Descrição resumida exibida no cabeçalho da categoria no SITE e para SEO..."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Foto e Banner da Categoria com Upload Direto */}
            <div className="cat-form-group full cat-photo-upload-section">
              <label className="cat-form-label">
                <span>Foto & Imagem de Apresentação da Categoria</span>
                <span className="cat-form-hint-tag">Formatos aceitos: PNG, WEBP, JPG</span>
              </label>

              <div className="cat-photo-manager-box">
                {/* Input oculto para upload de arquivo */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />

                {/* Prévia da Imagem */}
                <div className="cat-photo-preview-container">
                  {form.image_url ? (
                    <div className="cat-photo-preview-card">
                      <img
                        src={form.image_url}
                        alt={form.name || 'Foto da Categoria'}
                        className="cat-photo-preview-image"
                      />
                      <button
                        type="button"
                        className="cat-photo-remove-action"
                        onClick={() => setForm(prev => ({ ...prev, image_url: '' }))}
                        title="Remover foto"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div className="cat-photo-placeholder" onClick={() => fileInputRef.current?.click()} title="Clique para enviar uma imagem">
                      <Image size={28} color="#94a3b8" />
                      <span className="cat-photo-placeholder-text">Clique para enviar imagem</span>
                    </div>
                  )}
                </div>

                {/* Controles de Upload e URL */}
                <div className="cat-photo-controls">
                  <div className="cat-photo-actions-row">
                    <button
                      type="button"
                      className="cat-upload-file-btn"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                    >
                      <Upload size={14} />
                      {uploadingPhoto ? 'Enviando foto...' : 'Subir Foto / Imagem'}
                    </button>
                    <span className="cat-photo-or-text">ou informe uma URL direta:</span>
                  </div>

                  <input
                    type="text"
                    className="cat-form-input raw-input"
                    placeholder="Cole ou edite a URL da imagem da categoria..."
                    value={form.image_url}
                    onChange={e => {
                      const val = e.target.value
                      setForm(prev => ({
                        ...prev,
                        image_url: val,
                        mosaic_image_url: prev.mosaic_image_url || val
                      }))
                    }}
                  />

                  {/* Recortes oficiais rápidos */}
                  <div className="cat-photo-presets-row">
                    <span className="cat-photo-presets-label">Fotos prontas da loja:</span>
                    <div className="cat-photo-presets-tags">
                      {PRESET_CUTOUTS.map(preset => (
                        <button
                          key={preset.url}
                          type="button"
                          className={`cat-photo-preset-chip ${form.image_url === preset.url ? 'selected' : ''}`}
                          onClick={() => setForm(prev => ({
                            ...prev,
                            image_url: preset.url,
                            mosaic_image_url: prev.mosaic_image_url || preset.url
                          }))}
                        >
                          <img src={preset.url} alt={preset.alt} className="cat-photo-chip-thumb" />
                          <span>{preset.alt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="cat-form-group">
              <label className="cat-form-label">Ícone do Menu</label>
              <input
                type="text"
                className="cat-form-input"
                placeholder="Ex: drill, wrench, cpu, box..."
                value={form.icon}
                onChange={e => setForm({ ...form, icon: e.target.value })}
              />
            </div>

            <div className="cat-form-group">
              <label className="cat-form-label">Status no Catálogo</label>
              <select
                className="cat-form-select"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}
              >
                <option value="active">Ativa</option>
                <option value="inactive">Inativa / Oculta</option>
              </select>
            </div>

            <div className="cat-form-group">
              <label className="cat-form-label">Publicação no SITE</label>
              <select
                className="cat-form-select"
                value={form.is_published ? 'true' : 'false'}
                onChange={e => setForm({ ...form, is_published: e.target.value === 'true' })}
              >
                <option value="true">Publicada no SITE Público</option>
                <option value="false">Rascunho (Não visível para clientes)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ─── SEÇÃO / ABA: CARROSSEL & MOSAICO DA HOME ────────────────────────── */}
      {activeTab === 'mosaic' && (
        <div className="cat-card cat-mosaic-settings-card">
          <div className="cat-card-header cat-mosaic-card-header">
            <div>
              <h3 className="cat-card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={18} style={{ color: 'var(--button-primary, #0071e3)' }} /> Exibição no Mosaico de Categorias da Home (Página Inicial)
              </h3>
              <p className="cat-card-desc">
                Defina a imagem de recorte (cutout), o rótulo e a presença desta categoria no carrossel de categorias da Home pública do SITE.
              </p>
            </div>

            <div className="cat-mosaic-toggle-box">
              <label className="cat-mosaic-switch">
                <input
                  type="checkbox"
                  checked={form.show_in_mosaic !== false}
                  onChange={e => setForm({ ...form, show_in_mosaic: e.target.checked })}
                />
                <span className="cat-mosaic-slider" />
              </label>
              <span className="cat-mosaic-switch-label">
                {form.show_in_mosaic !== false ? 'Exibição Ativa no Mosaico' : 'Oculta no Mosaico'}
              </span>
            </div>
          </div>

          <div className="cat-mosaic-grid">
            {/* 1:1 Live Preview exatamente como renderizado na Home */}
            <div className="cat-mosaic-preview-col">
              <div className="cat-mosaic-preview-title">
                <span>Prévia 1:1 no Carrossel da Home</span>
                <span className="cat-mosaic-live-badge">Tempo Real</span>
              </div>

              <div className="cat-mosaic-preview-frame">
                <div className="dsvia-mosaic-wrapper-simulated">
                  <div className="dsvia-mosaic-item" style={{ width: 110 }}>
                    <div
                      className="dsvia-mosaic-card is-cutout"
                      style={{ width: 90, height: 90, borderRadius: 20 }}
                    >
                      {(form.mosaic_image_url || form.image_url) ? (
                        <img
                          alt={form.mosaic_label || form.name || 'Categoria'}
                          src={form.mosaic_image_url || form.image_url}
                          loading="lazy"
                        />
                      ) : (
                        <span className="cat-label-tip">Sem foto</span>
                      )}
                    </div>
                    <span className="dsvia-mosaic-label" style={{ maxWidth: 110 }}>
                      {form.mosaic_label || form.name || 'Nome da Categoria'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="cat-mosaic-preview-meta">
                <div className="cat-mosaic-meta-item">
                  <span className="cat-meta-lbl">URL no SITE:</span>
                  <code>{`/categoria/${form.slug || 'slug'}`}</code>
                </div>
                {!isNew && (
                  <a
                    href={publicCategoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="cat-mosaic-view-site-link"
                  >
                    <ExternalLink size={13} /> Testar no SITE
                  </a>
                )}
              </div>
            </div>

            {/* Controles de Configuração e Galeria */}
            <div className="cat-mosaic-fields-col">
              <div className="cat-form-group">
                <label className="cat-form-label">
                  <span>Rótulo Curto no Carrossel</span>
                  <span className="cat-label-tip">Texto compacto exibido abaixo do card</span>
                </label>
                <input
                  type="text"
                  className="cat-form-input"
                  placeholder={form.name || 'Ex: Microfones'}
                  value={form.mosaic_label || ''}
                  onChange={e => setForm({ ...form, mosaic_label: e.target.value })}
                />
              </div>

              <div className="cat-form-group">
                <label className="cat-form-label">
                  <span>URL da Imagem de Recorte (Cutout PNG/WebP)</span>
                  <span className="cat-label-tip">Fundo transparente ou branco de estúdio isolado</span>
                </label>
                <input
                  type="text"
                  className="cat-form-input"
                  placeholder="/images/referencias/microfones.png ou https://..."
                  value={form.mosaic_image_url || form.image_url || ''}
                  onChange={e => {
                    const val = e.target.value
                    setForm({
                      ...form,
                      mosaic_image_url: val,
                      image_url: val || form.image_url
                    })
                  }}
                />
              </div>

              {/* Galeria de Recortes Oficiais Disponíveis */}
              <div className="cat-preset-section">
                <div className="cat-preset-header">
                  <span className="cat-preset-title">Galeria de Recortes Padrão TEKNIX</span>
                  <span className="cat-preset-subtitle">Clique em uma imagem para aplicar instantaneamente:</span>
                </div>

                <div className="cat-preset-list">
                  {PRESET_CUTOUTS.map(preset => {
                    const isSelected = (form.mosaic_image_url === preset.url) || (form.image_url === preset.url)
                    return (
                      <button
                        type="button"
                        key={preset.url}
                        className={`cat-preset-card ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setForm({
                            ...form,
                            mosaic_image_url: preset.url,
                            image_url: preset.url,
                            mosaic_label: form.mosaic_label || preset.alt
                          })
                        }}
                      >
                        <div className="cat-preset-img-wrap">
                          <img src={preset.url} alt={preset.label} loading="lazy" />
                        </div>
                        <span className="cat-preset-lbl">{preset.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ABA 2: REGRAS INTELIGENTES & PREVIEW ──────────────────────────────── */}
      {activeTab === 'rules' && (
        <div className="cat-card">
          <div className="cat-card-header">
            <h3 className="cat-card-title">Motor de Regras Inteligentes Determinísticas</h3>
          </div>

          {/* Seletor de Modo de Vinculação */}
          <div className="cat-mode-selector">
            <div
              className={`cat-mode-card ${form.linking_mode === 'manual' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, linking_mode: 'manual' })}
            >
              <div className="cat-mode-title">
                <Package size={16} /> Vínculo Manual
              </div>
              <p className="cat-mode-desc">
                Você escolhe e vincula os produtos individualmente ou em lote pelo catálogo.
              </p>
            </div>

            <div
              className={`cat-mode-card ${form.linking_mode === 'automatic' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, linking_mode: 'automatic' })}
            >
              <div className="cat-mode-title">
                <Zap size={16} color="#ca8a04" /> 100% Automática
              </div>
              <p className="cat-mode-desc">
                Produtos entram na categoria estritamente se atenderem às condições abaixo.
              </p>
            </div>

            <div
              className={`cat-mode-card ${form.linking_mode === 'hybrid' ? 'active' : ''}`}
              onClick={() => setForm({ ...form, linking_mode: 'hybrid' })}
            >
              <div className="cat-mode-title">
                <Layers size={16} color="#2563eb" /> Híbrida (Recomendada)
              </div>
              <p className="cat-mode-desc">
                Regras automáticas sugerem e incluem produtos, e você pode adicionar itens manuais.
              </p>
            </div>
          </div>

          {/* Construtor de Condições */}
          <div className="cat-rules-builder">
            <div className="cat-rules-header">
              <div className="cat-rules-operator">
                <span>Corresponder quando:</span>
                <select
                  value={form.rule_operator}
                  onChange={e => setForm({ ...form, rule_operator: e.target.value as RuleOperator })}
                >
                  <option value="OR">QUALQUER uma das regras for atendida (OU)</option>
                  <option value="AND">TODAS as regras forem atendidas (E)</option>
                </select>
              </div>

              <button type="button" className="hub-btn hub-btn-secondary" onClick={addRule}>
                <Plus size={14} /> Adicionar Regra
              </button>
            </div>

            {form.rules.map((rule, idx) => (
              <div key={rule.id} className="cat-rule-row">
                <select
                  className="cat-form-select"
                  value={rule.field}
                  onChange={e => updateRule(rule.id, { field: e.target.value as RuleField })}
                >
                  <option value="name">Nome do Produto</option>
                  <option value="description">Descrição</option>
                  <option value="brand">Marca</option>
                  <option value="sku">SKU do Produto</option>
                  <option value="model">Modelo</option>
                  <option value="tag">Tag do Produto</option>
                  <option value="min_price">Preço Maior ou Igual a</option>
                  <option value="max_price">Preço Menor ou Igual a</option>
                  <option value="in_stock">Somente em Estoque</option>
                </select>

                <select
                  className="cat-form-select"
                  value={rule.condition}
                  onChange={e => updateRule(rule.id, { condition: e.target.value as RuleCondition })}
                >
                  <option value="contains">contém</option>
                  <option value="equals">é exatamente igual a</option>
                  <option value="starts_with">começa com</option>
                  <option value="ends_with">termina com</option>
                </select>

                <input
                  type="text"
                  className="cat-form-input"
                  placeholder="Ex: Furadeira, 21V, FUR-, Bomvink..."
                  value={String(rule.value ?? '')}
                  onChange={e => updateRule(rule.id, { value: e.target.value })}
                />

                <button
                  type="button"
                  className="cat-rule-del-btn"
                  title="Remover regra"
                  onClick={() => removeRule(rule.id)}
                  disabled={form.rules.length <= 1}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          {/* PAINEL DE PREVIEW DINÂMICO EM TEMPO REAL */}
          <div className="cat-preview-panel">
            <div className="cat-preview-header">
              <div className="cat-preview-count">
                <CheckCircle2 size={18} color="#16a34a" />
                <span>Prévia em Tempo Real:</span>
                <span className="cat-preview-count-pill">
                  {ruleMatchedProducts.length} produtos correspondem a estas regras
                </span>
              </div>
            </div>

            {ruleMatchedProducts.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>
                Nenhum produto do catálogo corresponde a estas condições atualmente.
              </div>
            ) : (
              <div className="cat-preview-grid">
                {ruleMatchedProducts.slice(0, 12).map(p => (
                  <div key={p.id} className="cat-preview-card">
                    <img
                      src={p.image_url || 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100'}
                      alt=""
                      className="cat-preview-img"
                    />
                    <div className="cat-preview-info">
                      <span className="cat-preview-name" title={p.name}>{p.name}</span>
                      <span className="cat-preview-sku">SKU: {p.sku || '—'} | Marca: {p.brand || 'TEKNIX'}</span>
                      <span className="cat-preview-price">
                        Estoque: {p.stock ?? 0} un.
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ABA 3: PRODUTOS VINCULADOS ───────────────────────────────────────── */}
      {activeTab === 'products' && (
        <div className="cat-card">
          <div className="cat-card-header">
            <h3 className="cat-card-title">Produtos Vinculados à Categoria</h3>
          </div>

          {recalcFeedback && (
            <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 8, marginBottom: 16, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} /> {recalcFeedback}
            </div>
          )}

          {/* Barra de Ações da Tabela de Produtos */}
          <div className="cat-prod-toolbar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, maxWidth: 400 }}>
              <div className="hub-search-wrap" style={{ width: '100%' }}>
                <Search className="hub-search-icon" size={16} />
                <input
                  type="text"
                  className="hub-search-input"
                  placeholder="Buscar produto por nome, SKU ou marca..."
                  value={linkedSearch}
                  onChange={e => setLinkedSearch(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button
                type="button"
                className="hub-btn hub-btn-secondary"
                onClick={handleRecalculate}
                title="Executar regras novamente sobre o catálogo"
              >
                <RefreshCw size={14} /> Recalcular Regras
              </button>

              <button
                type="button"
                className="hub-btn hub-btn-primary"
                onClick={() => setShowProductModal(true)}
              >
                <Plus size={14} /> Vincular Produtos Manualmente
              </button>
            </div>
          </div>

          {/* Tabela de Produtos Vinculados */}
          {filteredLinkedProducts.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
              <Package size={32} style={{ margin: '0 auto 8px', color: '#94a3b8' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>Nenhum produto vinculado encontrado.</p>
              <p style={{ margin: '4px 0 0', fontSize: 12 }}>
                Configure regras automáticas na aba anterior ou vincule manualmente pelo botão acima.
              </p>
            </div>
          ) : (
            <table className="cat-prod-table">
              <thead>
                <tr>
                  <th>PRODUTO</th>
                  <th>SKU</th>
                  <th>MARCA</th>
                  <th>ESTOQUE</th>
                  <th>PREÇO SITE</th>
                  <th>FORMA DE VÍNCULO</th>
                  <th style={{ textAlign: 'right' }}>AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {filteredLinkedProducts.map(item => (
                  <tr key={item.productId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ fontWeight: 600 }}>{item.productName}</div>
                      </div>
                    </td>
                    <td><code>{item.sku || '—'}</code></td>
                    <td>{item.brand}</td>
                    <td>{item.stock} un.</td>
                    <td>{item.price > 0 ? `R$ ${item.price.toFixed(2).replace('.', ',')}` : 'Sob consulta'}</td>
                    <td>
                      <span className={`cat-source-badge ${item.source === 'MANUAL' ? 'manual' : 'rule'}`}>
                        {item.source === 'MANUAL' ? 'MANUAL' : 'REGRA AUTOMÁTICA'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="cat-rule-del-btn"
                        style={{ marginLeft: 'auto' }}
                        title="Desvincular produto desta categoria"
                        onClick={() => handleUnlinkProduct(item.productId)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ─── ABA 4: PÁGINA & SEO ──────────────────────────────────────────────── */}
      {activeTab === 'seo' && (
        <div className="cat-card">
          <div className="cat-card-header">
            <h3 className="cat-card-title">Configurações de SEO e Integração com Page Builder</h3>
          </div>

          <div className="cat-form-grid">
            <div className="cat-form-group">
              <label className="cat-form-label">Título SEO (Tag Title)</label>
              <input
                type="text"
                className="cat-form-input"
                placeholder="Ex: Ferramentas Elétricas e Manuais Profissionais | TEKNIX"
                value={form.seo_title}
                onChange={e => setForm({ ...form, seo_title: e.target.value })}
              />
              <span className="cat-form-hint">{form.seo_title?.length || 0}/60 caracteres recomendados</span>
            </div>

            <div className="cat-form-group">
              <label className="cat-form-label">URL Canônica</label>
              <input
                type="text"
                className="cat-form-input"
                placeholder="/categoria/ferramentas"
                value={form.canonical_url}
                onChange={e => setForm({ ...form, canonical_url: e.target.value })}
              />
            </div>

            <div className="cat-form-group full">
              <label className="cat-form-label">Meta Descrição (Snippet de Busca)</label>
              <textarea
                className="cat-form-textarea"
                placeholder="Ex: Conheça a linha completa de ferramentas TEKNIX com pronta entrega, garantia oficial e suporte especializado..."
                value={form.seo_description}
                onChange={e => setForm({ ...form, seo_description: e.target.value })}
              />
              <span className="cat-form-hint">{form.seo_description?.length || 0}/160 caracteres recomendados</span>
            </div>
          </div>

          {/* Prévia SERP do Google */}
          <div style={{ marginTop: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111111' }}>
              Prévia de Visualização nos Mecanismos de Busca (Google SERP):
            </span>
            <div className="cat-serp-preview">
              <div className="cat-serp-url">
                https://teknixbrasil.com.br/categoria/{form.slug || 'categoria'}
              </div>
              <div className="cat-serp-title">
                {form.seo_title || form.name || 'Nome da Categoria | TEKNIX'}
              </div>
              <p className="cat-serp-desc">
                {form.seo_description || form.description || 'Descrição detalhada da categoria no catálogo oficial TEKNIX.'}
              </p>
            </div>
          </div>

          {/* Integração com Page Builder */}
          <div style={{ marginTop: 28, padding: 20, background: '#F7F7F7', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: '#0f172a' }}>
                Page Builder da Categoria
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                URL Pública: <code>{publicCategoryUrl}</code> — Edite o layout visual, banners e vitrines no editor oficial.
              </p>
            </div>

            <Link
              to={pageBuilderUrl}
              className="hub-btn hub-btn-primary"
            >
              <FileCode size={15} /> Editar no Page Builder
            </Link>
          </div>
        </div>
      )}

      {/* ─── ABA 5: MARKETPLACES ──────────────────────────────────────────────── */}
      {activeTab === 'marketplaces' && (
        <div className="cat-card">
          <div className="cat-card-header">
            <h3 className="cat-card-title">Mapeamento Central de Marketplaces (FLOW)</h3>
          </div>

          <div className="cat-form-grid">
            {['mercadolivre', 'shopee', 'amazon', 'magalu'].map(channel => {
              const current = form.marketplace_mappings?.find(m => m.channel === channel)
              const labelName =
                channel === 'mercadolivre' ? 'Mercado Livre' :
                channel === 'shopee' ? 'Shopee' :
                channel === 'amazon' ? 'Amazon' : 'Magazine Luiza'

              const placeholderCode =
                channel === 'mercadolivre' ? 'MLB1771' :
                channel === 'shopee' ? '100644' :
                channel === 'amazon' ? 'B07X...' : 'CAT_MAGALU_12'

              return (
                <div key={channel} className="cat-form-group">
                  <label className="cat-form-label">
                    {labelName} (ID Externo)
                  </label>
                  <input
                    type="text"
                    className="cat-form-input"
                    placeholder={`Ex: ${placeholderCode}`}
                    value={current?.external_category_id || ''}
                    onChange={e => handleMarketplaceChange(channel, e.target.value, current?.external_category_name)}
                  />
                  <span className="cat-form-hint">Código de categoria na API do {labelName}.</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
        </>
      )}

      {/* MODAL PARA ADICIONAR PRODUTOS MANUALMENTE */}
      {showProductModal && (
        <div className="cat-modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="cat-modal-card" onClick={e => e.stopPropagation()}>
            <div className="cat-modal-header">
              <h3>Vincular Produtos Manualmente</h3>
              <button
                type="button"
                className="cat-rule-del-btn"
                onClick={() => setShowProductModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="cat-modal-body">
              <div className="hub-search-wrap" style={{ marginBottom: 16 }}>
                <Search className="hub-search-icon" size={16} />
                <input
                  type="text"
                  className="hub-search-input"
                  placeholder="Pesquisar catálogo por nome, marca ou SKU..."
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                />
              </div>

              {catalogAvailableToAdd.length === 0 ? (
                <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>
                  Nenhum produto adicional disponível para vincular.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 380, overflowY: 'auto' }}>
                  {catalogAvailableToAdd.map(prod => {
                    const isSelected = selectedToAdd.includes(String(prod.id))
                    return (
                      <div
                        key={prod.id}
                        onClick={() => {
                          setSelectedToAdd(prev =>
                            isSelected ? prev.filter(id => id !== String(prod.id)) : [...prev, String(prod.id)]
                          )
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: '10px 14px',
                          borderRadius: 8,
                          border: isSelected ? '1px solid #0f172a' : '1px solid #e2e8f0',
                          background: isSelected ? '#F7F7F7' : '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a' }}>{prod.name}</div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            SKU: {prod.sku || '—'} | Marca: {prod.brand || 'TEKNIX'} | Estoque: {prod.stock ?? 0} un.
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="cat-modal-footer">
              <button
                type="button"
                className="hub-btn hub-btn-secondary"
                onClick={() => setShowProductModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="hub-btn hub-btn-primary"
                onClick={handleConfirmAddManual}
                disabled={selectedToAdd.length === 0}
              >
                Vincular {selectedToAdd.length > 0 ? `(${selectedToAdd.length}) Produtos` : 'Selecionados'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
