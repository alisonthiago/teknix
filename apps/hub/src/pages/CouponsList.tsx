import { useEffect, useState } from 'react'
import { Plus, Search, SlidersHorizontal, ArrowUpDown, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import './Discounts.css'

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

export default function CouponsList() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [notice, setNotice] = useState('')

  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: 10,
    freeShipping: false,
    minAmount: 0
  })

  const formatCoupon = (coupon: any): Coupon => ({
    id: coupon.id, code: coupon.code, discount: coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `R$ ${Number(coupon.discount_value).toFixed(2).replace('.', ',')}`,
    freeShipping: Boolean(coupon.free_shipping), validity: coupon.ends_at ? `Até ${new Date(coupon.ends_at).toLocaleDateString('pt-BR')}` : 'Indeterminado', uses: Number(coupon.used_count || 0),
    limit: coupon.min_order_amount > 0 ? `Compras > R$ ${coupon.min_order_amount}` : 'Sem limite', status: coupon.active ? 'active' : 'expired'
  })

  useEffect(() => { supabase.from('coupons').select('*').order('created_at', { ascending: false }).then(({ data, error }) => { if (error) setNotice('Aplique a migração de cupons para ativar esta área.'); else setCoupons((data || []).map(formatCoupon)) }) }, [])

  async function handleCreateCoupon() {
    if (!newCoupon.code.trim()) return
    const { data, error } = await supabase.from('coupons').insert({ code: newCoupon.code.toUpperCase().replace(/\s+/g, ''), discount_type: newCoupon.discountType, discount_value: newCoupon.discountValue, free_shipping: newCoupon.freeShipping, min_order_amount: newCoupon.minAmount, active: true }).select().single()
    if (error || !data) { setNotice('Não foi possível salvar o cupom.'); return }
    setCoupons([formatCoupon(data), ...coupons])
    setShowModal(false)
    setNewCoupon({ code: '', discountType: 'percentage', discountValue: 10, freeShipping: false, minAmount: 0 })
  }

  async function handleDeleteCoupon(id: string) {
    const { error } = await supabase.from('coupons').update({ active: false, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) { setNotice('Não foi possível remover o cupom.'); return }
    setCoupons(coupons.filter(c => c.id !== id))
  }

  const filtered = coupons.filter(c => c.code.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="discounts-page-container">
      <div className="discounts-wrapper">
        
        {/* Header */}
        <div className="page-header">
          <div className="header-info">
            <h1>Cupons</h1>
            <p>Crie códigos promocionais e descontos especiais para seus clientes.</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => alert('Dica: Crie cupons sazonais para impulsionar conversões.')}>
              Conhecer descontos
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Novo cupom
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="search-filter-bar">
          <Search size={16} color="#9ca3af" />
          <input
            type="text"
            className="search-input-clean"
            placeholder="Pesquisar por código..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="filter-btn-pill"><SlidersHorizontal size={13} /> Filtrar</button>
          <button className="filter-btn-pill"><ArrowUpDown size={13} /> A-Z</button>
        </div>
        {notice && <p role="status">{notice}</p>}

        {/* Table */}
        <div className="discounts-card-table">
          <table className="nuvem-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Desconto</th>
                <th>Frete</th>
                <th>Vigência</th>
                <th>Usos</th>
                <th>Limites</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr key={c.id}>
                  <td>
                    <span className="coupon-code-pill">{c.code}</span>
                  </td>
                  <td><strong>{c.discount}</strong></td>
                  <td>{c.freeShipping ? <span style={{ color: '#059669', fontWeight: 600 }}>Grátis</span> : 'Normal'}</td>
                  <td>{c.validity}</td>
                  <td>{c.uses}</td>
                  <td>{c.limit}</td>
                  <td>
                    <span className={`badge-status-dot ${c.status === 'active' ? 'active' : 'inactive'}`}>
                      ● {c.status === 'active' ? 'Ativo' : 'Expirado'}
                    </span>
                  </td>
                  <td>
                    <button
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      onClick={() => handleDeleteCoupon(c.id)}
                      title="Excluir cupom"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal Criar Cupom */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Criar Novo Cupom</h3>
            </div>
            <div className="modal-body" style={{ gap: 14 }}>
              <div className="form-group">
                <label>Código do Cupom *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="EX: VERAO20"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Tipo</label>
                  <select
                    className="form-select"
                    value={newCoupon.discountType}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountType: e.target.value })}
                  >
                    <option value="percentage">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Valor do Desconto</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newCoupon.discountValue}
                    onChange={(e) => setNewCoupon({ ...newCoupon, discountValue: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <label className="toggle-switch-label">
                <input
                  type="checkbox"
                  className="toggle-switch-input"
                  checked={newCoupon.freeShipping}
                  onChange={(e) => setNewCoupon({ ...newCoupon, freeShipping: e.target.checked })}
                />
                Incluir Frete Grátis com este cupom
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-secondary-action" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="button" className="btn-primary-action" onClick={handleCreateCoupon}>Salvar Cupom</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
