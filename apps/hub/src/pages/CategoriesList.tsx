import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  HubDataTable,
  type HubColumn,
  useBulkDelete
} from '../components/ui/HubDataTable'
import {
  type CentralCategory,
  parseCategoryRow,
  resolveCategoryProducts
} from '../../../../packages/core/src/categoryRules'
import {
  Plus,
  RefreshCw,
  Edit2,
  ExternalLink,
  Copy,
  Trash2,
  Zap,
  Globe,
  FileCode,
  FolderTree,
  Eye,
  EyeOff
} from 'lucide-react'

export default function CategoriesList() {
  const navigate = useNavigate()

  const [categories, setCategories] = useState<CentralCategory[]>([])
  const [allProducts, setAllProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusTab, setStatusTab] = useState<'all' | 'published' | 'draft' | 'inactive' | 'smart'>('all')

  // Carregamento central
  async function loadData() {
    setLoading(true)
    try {
      const [catsRes, prodsRes] = await Promise.all([
        supabase.from('store_categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('products').select('id, name, sku, brand, model, description, notes, price, cost_purchase, stock, stock_quantity, status')
      ])

      const rawCats = catsRes.data || []
      const parsedCats = rawCats.map(parseCategoryRow)
      setCategories(parsedCats)
      setAllProducts(prodsRes.data || [])
    } catch (err) {
      console.error('Erro ao carregar categorias:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Mapa de nomes de pais para exibir na hierarquia
  const parentMap = useMemo(() => {
    const map = new Map<string, string>()
    categories.forEach(c => map.set(c.id, c.name))
    return map
  }, [categories])

  // Cálculo da contagem real de produtos vinculados para cada categoria
  const rowsWithCounts = useMemo(() => {
    return categories.map(cat => {
      const linked = resolveCategoryProducts(cat, allProducts)
      return {
        ...cat,
        product_count: linked.length
      }
    })
  }, [categories, allProducts])

  // Filtragem por busca e abas de status
  const filteredRows = useMemo(() => {
    let list = rowsWithCounts

    if (statusTab === 'published') {
      list = list.filter(c => c.is_published && c.status === 'active')
    } else if (statusTab === 'draft') {
      list = list.filter(c => !c.is_published)
    } else if (statusTab === 'inactive') {
      list = list.filter(c => c.status === 'inactive')
    } else if (statusTab === 'smart') {
      list = list.filter(c => c.linking_mode !== 'manual')
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim()
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
      )
    }

    return list
  }, [rowsWithCounts, statusTab, search])

  // Ações
  async function handleTogglePublish(cat: CentralCategory) {
    const newPub = !cat.is_published
    const existingSeo = (typeof (cat as any).seo === 'object' && (cat as any).seo !== null) ? (cat as any).seo : {}
    const { error } = await supabase
      .from('store_categories')
      .update({
        seo: { ...existingSeo, is_published: newPub },
        status: newPub ? 'active' : 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', cat.id)

    if (error) {
      alert(`Erro ao alterar status: ${error.message}`)
    } else {
      setCategories(prev =>
        prev.map(c => (c.id === cat.id ? { ...c, is_published: newPub, status: newPub ? 'active' : 'inactive' } : c))
      )
    }
  }

  async function handleDuplicate(cat: CentralCategory) {
    const newName = `${cat.name} (Cópia)`
    const newSlug = `${cat.slug}-copia-${Date.now()}`
    const { data, error } = await supabase
      .from('store_categories')
      .insert({
        name: newName,
        slug: newSlug,
        parent_id: cat.parent_id,
        description: cat.description,
        image_url: cat.image_url,
        status: 'active',
        sort_order: (cat.sort_order || 0) + 1,
        seo: {
          linking_mode: cat.linking_mode,
          rule_operator: cat.rule_operator,
          rules: cat.rules,
          manual_product_ids: cat.manual_product_ids,
          is_published: false
        }
      })
      .select()
      .single()

    if (error) {
      alert(`Erro ao duplicar: ${error.message}`)
    } else {
      await loadData()
      if (data?.id) navigate(`/hub/categorias/${data.id}`)
    }
  }

  async function handleDelete(cat: CentralCategory) {
    const subcats = categories.filter(c => c.parent_id === cat.id)
    const subcatMsg = subcats.length > 0 ? `\nAtenção: esta categoria possui ${subcats.length} subcategorias vinculadas!` : ''

    if (!confirm(`Excluir a categoria "${cat.name}"?${subcatMsg}\nOs produtos vinculados não serão excluídos.`)) {
      return
    }

    const { error } = await supabase
      .from('store_categories')
      .delete()
      .eq('id', cat.id)

    if (error) {
      alert(`Erro ao excluir: ${error.message}`)
    } else {
      setCategories(prev => prev.filter(c => c.id !== cat.id))
    }
  }

  // Hook de exclusão em lote oficial do HubDataTable
  const confirmDelete = useBulkDelete(async (ids: string[]) => {
    for (const catId of ids) {
      await supabase.from('store_categories').delete().eq('id', catId)
    }
    await loadData()
  }, 'categoria')

  // Definição das colunas
  const columns: HubColumn<any>[] = [
    {
      key: 'name',
      label: 'CATEGORIA',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#475569',
              flexShrink: 0
            }}
          >
            {row.parent_id ? <FolderTree size={16} /> : <Globe size={16} />}
          </div>
          <div>
            <div style={{ fontWeight: 600, color: '#0f172a', fontSize: 13 }}>{row.name}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>
              <code>/categoria/{row.slug}</code>
            </div>
          </div>
        </div>
      ),
      exportValue: (row) => row.name
    },
    {
      key: 'parent_id',
      label: 'HIERARQUIA (PAI)',
      render: (row) => {
        const parentName = row.parent_id ? parentMap.get(row.parent_id) : null
        return (
          <span style={{ fontSize: 12, color: parentName ? '#111111' : '#888888', fontWeight: parentName ? 500 : 400 }}>
            {parentName ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <FolderTree size={13} color="#111111" /> {parentName}
              </span>
            ) : (
              '— Principal (Raiz)'
            )}
          </span>
        )
      },
      exportValue: (row) => (row.parent_id ? parentMap.get(row.parent_id) || '' : 'Principal')
    },
    {
      key: 'linking_mode',
      label: 'MODO',
      render: (row) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            background: row.linking_mode === 'automatic' ? '#fefce8' : row.linking_mode === 'hybrid' ? '#eff6ff' : '#f8fafc',
            color: row.linking_mode === 'automatic' ? '#ca8a04' : row.linking_mode === 'hybrid' ? '#1d4ed8' : '#475569',
            border: `1px solid ${row.linking_mode === 'automatic' ? '#fef08a' : row.linking_mode === 'hybrid' ? '#bfdbfe' : '#e2e8f0'}`
          }}
        >
          {row.linking_mode !== 'manual' && <Zap size={11} />}
          {row.linking_mode === 'automatic' ? 'Automática' : row.linking_mode === 'hybrid' ? 'Híbrida' : 'Manual'}
        </span>
      ),
      exportValue: (row) => row.linking_mode
    },
    {
      key: 'product_count',
      label: 'PRODUTOS',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 700, fontSize: 13, color: row.product_count > 0 ? '#0f172a' : '#94a3b8' }}>
          {row.product_count} produtos
        </span>
      ),
      exportValue: (row) => row.product_count
    },
    {
      key: 'is_published',
      label: 'STATUS & SITE',
      render: (row) => (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 9px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 700,
            background: row.is_published ? '#f0fdf4' : '#f8fafc',
            color: row.is_published ? '#16a34a' : '#64748b',
            border: `1px solid ${row.is_published ? '#bbf7d0' : '#e2e8f0'}`
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: row.is_published ? '#16a34a' : '#94a3b8'
            }}
          />
          {row.is_published ? 'Publicada' : 'Rascunho'}
        </span>
      ),
      exportValue: (row) => (row.is_published ? 'Publicada' : 'Rascunho')
    }
  ]

  const siteUrl = import.meta.env.VITE_SITE_URL || 'http://localhost:5173'

  return (
    <HubDataTable
      title="Categorias"
      columns={columns}
      rows={filteredRows}
      loading={loading}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="Buscar por categoria, slug ou descrição..."
      exportTitle="Categorias Central TEKNIX"
      exportFilename="categorias-teknix"
      entityLabel="categoria"
      headerActions={
        <>
          {/* Abas de Status */}
          <div className="hub-status-tabs">
            {[
              { id: 'all', label: 'Todas' },
              { id: 'published', label: 'Publicadas' },
              { id: 'draft', label: 'Rascunhos' },
              { id: 'inactive', label: 'Inativas' },
              { id: 'smart', label: 'Inteligentes' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id as any)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: statusTab === tab.id ? 700 : 500,
                  background: statusTab === tab.id ? '#fff' : 'transparent',
                  color: statusTab === tab.id ? '#111' : '#6b7280',
                  boxShadow: statusTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label} (
                {tab.id === 'all'
                  ? rowsWithCounts.length
                  : tab.id === 'published'
                  ? rowsWithCounts.filter(c => c.is_published && c.status === 'active').length
                  : tab.id === 'draft'
                  ? rowsWithCounts.filter(c => !c.is_published).length
                  : tab.id === 'inactive'
                  ? rowsWithCounts.filter(c => c.status === 'inactive').length
                  : rowsWithCounts.filter(c => c.linking_mode !== 'manual').length}
                )
              </button>
            ))}
          </div>

          <button className="hub-btn hub-btn-secondary" onClick={loadData} title="Atualizar dados">
            <RefreshCw size={14} className={loading ? 'hub-spin' : ''} /> Atualizar
          </button>

          <button
            className="hub-btn hub-btn-primary"
            onClick={() => navigate('/hub/categorias/nova')}
          >
            <Plus size={14} /> Nova Categoria
          </button>
        </>
      }
      renderRowActions={(cat, onClose) => (
        <>
          <button
            className="hub-dropdown-item"
            onClick={() => {
              onClose()
              navigate(`/hub/categorias/${cat.id}`)
            }}
          >
            <Edit2 size={14} color="#2563eb" /> Editar Ficha Completa
          </button>

          <a
            className="hub-dropdown-item"
            href={`${siteUrl}/categoria/${cat.slug}`}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
          >
            <ExternalLink size={14} color="#059669" /> Ver no SITE
          </a>

          <button
            className="hub-dropdown-item"
            onClick={() => {
              onClose()
              navigate(`/hub/editor/native?path=${encodeURIComponent(`/categoria/${cat.slug}`)}`)
            }}
          >
            <FileCode size={14} color="#7c3aed" /> Editar no Page Builder
          </button>

          <button
            className="hub-dropdown-item"
            onClick={() => {
              onClose()
              handleDuplicate(cat)
            }}
          >
            <Copy size={14} color="#475569" /> Duplicar Categoria
          </button>

          <button
            className="hub-dropdown-item"
            onClick={() => {
              onClose()
              handleTogglePublish(cat)
            }}
          >
            {cat.is_published ? (
              <>
                <EyeOff size={14} color="#d97706" /> Despublicar do SITE
              </>
            ) : (
              <>
                <Eye size={14} color="#16a34a" /> Publicar no SITE
              </>
            )}
          </button>

          <button
            className="hub-dropdown-item danger"
            onClick={() => {
              onClose()
              handleDelete(cat)
            }}
          >
            <Trash2 size={14} color="#dc2626" /> Excluir Categoria
          </button>
        </>
      )}
      bulkActions={[
        { label: 'Excluir Selecionadas', icon: <Trash2 size={13} />, action: confirmDelete, variant: 'danger' }
      ]}
    />
  )
}
