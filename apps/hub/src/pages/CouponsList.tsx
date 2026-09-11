import { useEffect, useState } from 'react'
import { Plus, Tag, Truck, Trash2, Edit } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { HubDataTable, type HubColumn, useBulkDelete } from '../components/ui/HubDataTable'

interface Coupon {
  id: string
  code: string
  discount: string
  freeShipping: boolean
  validity: string
  uses: number
  limit: string
  status: 'active' | 'expired' | 'scheduled'
}

const COLUMNS: HubColumn<Coupon>[] = [
  {
    key: 'code',
    label: 'Código',
    width: '160px',
    render: (c) => (
      <span style={{
        fontFamily: 'monospace', fontWeight: 700, fontSize: 13,
        background: '#f3f4f6', padding: '3px 8px', borderRadius: 6,
        letterSpacing: '0.05em', color: '#111'
      }}>
        {c.code}
      </span>
    ),
    exportValue: (c) => c.code,
  },
  {
    key: 'discount',
    label: 'Desconto',
    width: '130px',
    render: (c) => <span className="hub-cell-bold">{c.discount}</span>,
    exportValue: (c) => c.discount,
  },
  {
    key: 'freeShipping',
    label: 'Frete',
    width: '100px',
    align: 'center',
    render: (c) => (
      c.freeShipping
        ? <span className="hub-status-badge hub-badge-green"><span className="hub-badge-dot" />Grátis</span>
        : <span className="hub-cell-muted">Normal</span>
    ),
    exportValue: (c) => c.freeShipping ? 'Grátis' : 'Normal',
  },
  {
    key: 'validity',
    label: 'Vigência',
    render: (c) => <span className="hub-cell-muted">{c.validity}</span>,
    exportValue: (c) => c.validity,
  },
  {
    key: 'uses',
    label: 'Usos',
    width: '80px',
    align: 'center',
    render: (c) => <span className="hub-cell-muted">{c.uses}</span>,
    exportValue: (c) => c.uses,
  },
  {
    key: 'limit',
    label: 'Limites',
    render: (c) => <span className="hub-cell-muted">{c.limit}</span>,
    exportValue: (c) => c.limit,
  },
  {
    key: 'status',
    label: 'Status',
    width: '110px',
    render: (c) => (
      <span className={`hub-status-badge ${c.status === 'active' ? 'hub-badge-green' : 'hub-badge-gray'}`}>
        <span className="hub-badge-dot" />
        {c.status === 'active' ? 'Ativo' : 'Expirado'}
      </span>
    ),
    exportValue: (c) => c.status === 'active' ? 'Ativo' : 'Expirado',
  },
]

function formatCoupon(coupon: any): Coupon {
  return {
    id: coupon.id,
    code: coupon.code,
    discount: coupon.discount_type === 'percentage'
      ? `${coupon.discount_value}% OFF`
      : `R$ ${Number(coupon.discount_value).toFixed(2).replace('.', ',')}`,
    freeShipping: Boolean(coupon.free_shipping),
    validity: coupon.ends_at ? `Até ${new Date(coupon.ends_at).toLocaleDateString('pt-BR')}` : 'Indeterminado',
    uses: Number(coupon.used_count || 0),
    limit: coupon.min_order_amount > 0 ? `Compras > R$ ${coupon.min_order_amount}` : 'Sem limite',
    status: coupon.active ? 'active' : 'expired',
  }
}

export default function CouponsList() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newCoupon, setNewCoupon] = useState({
    code: '', discountType: 'percentage', discountValue: 10, freeShipping: false, minAmount: 0
  })

  useEffect(() => {
    supabase.from('coupons').select('*').order('created_at', { ascending: false })
      .then(({ data }) => {
        setCoupons((data || []).map(formatCoupon))
        setLoading(false)
      })
  }, [])

  async function handleDeleteCoupons(ids: string[]) {
    try {
      await supabase.from('coupons').update({ active: false, updated_at: new Date().toISOString() }).in('id', ids)
      setCoupons(prev => prev.filter(c => !ids.includes(c.id)))
    } catch { alert('Não foi possível remover o(s) cupom(ns).') }
  }

  const confirmDelete = useBulkDelete(handleDeleteCoupons, 'cupom')

  async function handleCreateCoupon() {
    if (!newCoupon.code.trim()) return
    const { data, error } = await supabase.from('coupons').insert({
      code: newCoupon.code.toUpperCase().replace(/\s+/g, ''),
      discount_type: newCoupon.discountType,
      discount_value: newCoupon.discountValue,
      free_shipping: newCoupon.freeShipping,
      min_order_amount: newCoupon.minAmount,
      active: true
    }).select().single()
    if (error || !data) { alert('Não foi possível salvar o cupom.'); return }
    setCoupons([formatCoupon(data), ...coupons])
    setShowModal(false)
    setNewCoupon({ code: '', discountType: 'percentage', discountValue: 10, freeShipping: false, minAmount: 0 })
  }

  const filtered = coupons.filter(c =>
    c.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <HubDataTable
        title="Cupons"
        description="Crie códigos promocionais e descontos especiais para seus clientes."
        headerActions={
          <button className="hub-btn hub-btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Novo Cupom
          </button>
        }
        columns={COLUMNS}
        rows={filtered}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por código de cupom"
        exportTitle="Cupons"
        exportFilename="cupons"
        entityLabel="cupom"
        emptyMessage="Nenhum cupom encontrado."
        bulkActions={[
          { label: 'Excluir', icon: <Trash2 size={13} />, action: confirmDelete, variant: 'danger' },
        ]}
        renderRowActions={(coupon, onClose) => (
          <>
            <button className="hub-dropdown-item delete" onClick={() => { onClose(); confirmDelete([coupon.id]) }}>
              <Trash2 size={14} color="#dc2626" /> Excluir cupom
            </button>
          </>
        )}
      />

      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 16, padding: 28, width: 440, maxWidth: '90vw', display: 'flex', flexDirection: 'column', gap: 14 }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>Criar Novo Cupom</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#6b7280' }}>×</button>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
              Código do Cupom *
              <input style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, fontFamily: 'monospace', textTransform: 'uppercase', outline: 'none' }}
                placeholder="EX: VERAO20" value={newCoupon.code}
                onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })} />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
                Tipo
                <select style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }}
                  value={newCoupon.discountType} onChange={e => setNewCoupon({ ...newCoupon, discountType: e.target.value })}>
                  <option value="percentage">Porcentagem (%)</option>
                  <option value="fixed">Valor Fixo (R$)</option>
                </select>
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13, fontWeight: 600 }}>
                Valor
                <input type="number" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none' }}
                  value={newCoupon.discountValue} onChange={e => setNewCoupon({ ...newCoupon, discountValue: parseFloat(e.target.value) || 0 })} />
              </label>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <input type="checkbox" checked={newCoupon.freeShipping}
                onChange={e => setNewCoupon({ ...newCoupon, freeShipping: e.target.checked })} />
              Incluir Frete Grátis com este cupom
            </label>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <button className="hub-btn hub-btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="hub-btn hub-btn-primary" onClick={handleCreateCoupon}>Salvar Cupom</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
