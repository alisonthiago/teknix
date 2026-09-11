import { useState } from 'react'
import { Plus, Tag, Trash2 } from 'lucide-react'
import { HubDataTable, type HubColumn, useBulkDelete } from '../components/ui/HubDataTable'

interface Promotion {
  id: string
  name: string
  discountType: string
  applyTo: string
  validity: string
  status: 'active' | 'inactive'
}

const COLUMNS: HubColumn<Promotion>[] = [
  {
    key: 'name',
    label: 'Nome',
    render: (p) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Tag size={14} color="#e91e63" />
        <span className="hub-cell-bold">{p.name}</span>
      </div>
    ),
    exportValue: (p) => p.name,
  },
  {
    key: 'discountType',
    label: 'Tipo de Desconto',
    render: (p) => <span className="hub-cell-muted">{p.discountType}</span>,
    exportValue: (p) => p.discountType,
  },
  {
    key: 'applyTo',
    label: 'Aplicar a',
    render: (p) => <span className="hub-cell-muted">{p.applyTo}</span>,
    exportValue: (p) => p.applyTo,
  },
  {
    key: 'validity',
    label: 'Vigência',
    width: '130px',
    render: (p) => <span className="hub-cell-muted">{p.validity}</span>,
    exportValue: (p) => p.validity,
  },
  {
    key: 'status',
    label: 'Status',
    width: '100px',
    render: (p) => (
      <span className={`hub-status-badge ${p.status === 'active' ? 'hub-badge-green' : 'hub-badge-gray'}`}>
        <span className="hub-badge-dot" />
        {p.status === 'active' ? 'Ativo' : 'Inativo'}
      </span>
    ),
    exportValue: (p) => p.status === 'active' ? 'Ativo' : 'Inativo',
  },
]

export default function PromotionsList() {
  const [promotions, setPromotions] = useState<Promotion[]>([
    { id: '1', name: 'Leve 3 Pague 2 em Discos de Corte', discountType: 'Compre X Pague Y', applyTo: 'Categoria: Acessórios & Discos', validity: 'Até 31/12/2026', status: 'active' },
    { id: '2', name: 'Semana das Ferramentas a Bateria (15% OFF)', discountType: 'Desconto percentual (15%)', applyTo: 'Produtos selecionados', validity: 'Próximos 7 dias', status: 'active' },
  ])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newPromo, setNewPromo] = useState({ name: '', discountType: 'Porcentagem (10%)', applyTo: 'Todos os produtos' })

  function handleCreate() {
    if (!newPromo.name.trim()) return
    setPromotions([...promotions, {
      id: Date.now().toString(), name: newPromo.name, discountType: newPromo.discountType,
      applyTo: newPromo.applyTo, validity: 'Indeterminado', status: 'active'
    }])
    setShowModal(false)
    setNewPromo({ name: '', discountType: 'Porcentagem (10%)', applyTo: 'Todos os produtos' })
  }

  async function handleDeletePromotions(ids: string[]) {
    setPromotions(prev => prev.filter(p => !ids.includes(p.id)))
  }

  const confirmDelete = useBulkDelete(handleDeletePromotions, 'promoção')

  const filtered = promotions.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.discountType.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <HubDataTable
        title="Promoções"
        description="Configure ofertas automáticas e descontos progressivos por volume ou categoria."
        headerActions={
          <button className="hub-btn hub-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Nova Promoção
          </button>
        }
        columns={COLUMNS}
        rows={filtered}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar promoções por nome ou tipo"
        exportTitle="Promoções"
        exportFilename="promocoes"
        entityLabel="promoção"
        emptyMessage="Nenhuma promoção encontrada."
        bulkActions={[
          { label: 'Excluir', icon: <Trash2 size={13} />, action: confirmDelete, variant: 'danger' },
        ]}
        renderRowActions={(promo, onClose) => (
          <button className="hub-dropdown-item delete" onClick={() => { onClose(); confirmDelete([promo.id]) }}>
            <Trash2 size={14} color="#dc2626" /> Excluir promoção
          </button>
        )}
      />

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 440, maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: 14 }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Criar Nova Promoção</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            {[
              { label: 'Nome da Promoção *', key: 'name', type: 'input', placeholder: 'Ex: Leve 2 e Ganhe 20% OFF' },
            ].map(f => (
              <label key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
                {f.label}
                <input style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }}
                  placeholder={f.placeholder} value={(newPromo as any)[f.key]}
                  onChange={e => setNewPromo({ ...newPromo, [f.key]: e.target.value })} />
              </label>
            ))}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
              Tipo de Desconto
              <select style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }}
                value={newPromo.discountType} onChange={e => setNewPromo({ ...newPromo, discountType: e.target.value })}>
                <option>Porcentagem (10%)</option><option>Porcentagem (20%)</option>
                <option>Leve X Pague Y</option><option>Brinde no carrinho</option>
              </select>
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
              Aplicar a
              <select style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }}
                value={newPromo.applyTo} onChange={e => setNewPromo({ ...newPromo, applyTo: e.target.value })}>
                <option>Todos os produtos</option><option>Categorias selecionadas</option><option>Produtos selecionados</option>
              </select>
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="hub-btn hub-btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="hub-btn hub-btn-primary" onClick={handleCreate}>Salvar Promoção</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
