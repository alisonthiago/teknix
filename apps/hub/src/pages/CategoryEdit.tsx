import React, { useState, useEffect, useMemo } from 'react'
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
  AlertCircle
} from 'lucide-react'
import './CategoryEdit.css'

export default function CategoryEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'nova'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'rules' | 'products' | 'seo' | 'marketplaces'>('general')

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
        navigate(`/hub/categorias/${data.id || form.id}`)
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
            <h1 className="cat-edit-title">{form.name || 'Nova Categoria Central'}</h1>
            <span className={`cat-edit-badge ${form.status === 'active' ? 'active' : 'inactive'}`}>
              {form.status === 'active' ? 'Ativa no Catálogo' : 'Inativa'}
            </span>
            {form.linking_mode !== 'manual' && (
              <span className="cat-edit-badge smart">
                <Zap size={11} /> Regras Inteligentes
              </span>
            )}
          </div>
        </div>

        <div className="cat-edit-actions">
          <button
            type="button"
            className="hub-btn hub-btn-secondary"
            onClick={() => navigate('/hub/categorias')}
          >
            <ArrowLeft size={15} /> Voltar
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
                <ExternalLink size={15} /> Ver no SITE
              </a>
              <Link
                to={pageBuilderUrl}
                className="hub-btn hub-btn-secondary"
                title="Abrir no Page Builder oficial"
              >
                <FileCode size={15} /> Editar Página
              </Link>
            </>
          )}

          <button
            type="button"
            className="hub-btn hub-btn-primary"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={15} /> {saving ? 'Salvando...' : 'Salvar Categoria'}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="cat-edit-tabs">
        <button
          className={`cat-edit-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <Sliders size={16} /> Geral & Hierarquia
        </button>
        <button
          className={`cat-edit-tab-btn ${activeTab === 'rules' ? 'active' : ''}`}
          onClick={() => setActiveTab('rules')}
        >
          <Zap size={16} /> Regras Inteligentes & Preview
          {form.rules?.length > 0 && (
            <span className="cat-edit-tab-badge">{form.rules.length}</span>
          )}
        </button>
        <button
          className={`cat-edit-tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          <Package size={16} /> Produtos Vinculados
          <span className="cat-edit-tab-badge">{resolvedLinkedProducts.length}</span>
        </button>
        <button
          className={`cat-edit-tab-btn ${activeTab === 'seo' ? 'active' : ''}`}
          onClick={() => setActiveTab('seo')}
        >
          <Globe size={16} /> Página & SEO
        </button>
        <button
          className={`cat-edit-tab-btn ${activeTab === 'marketplaces' ? 'active' : ''}`}
          onClick={() => setActiveTab('marketplaces')}
        >
          <Store size={16} /> Marketplaces
        </button>
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

            <div className="cat-form-group">
              <label className="cat-form-label">URL da Imagem / Banner</label>
              <input
                type="text"
                className="cat-form-input"
                placeholder="https://exemplo.com/banner-ferramentas.jpg"
                value={form.image_url}
                onChange={e => setForm({ ...form, image_url: e.target.value })}
              />
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
          <div style={{ marginTop: 28, padding: 20, background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
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
                          background: isSelected ? '#f8fafc' : '#ffffff',
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
