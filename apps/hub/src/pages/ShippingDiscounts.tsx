import { useState } from 'react'
import { Plus, Trash2, Truck } from 'lucide-react'
import './Discounts.css'

interface ShippingDiscount {
  id: string
  carrier: string
  minPrice: string
  categories: string
  zones: string
  status: 'active' | 'inactive'
}

export default function ShippingDiscounts() {
  const [rules, setRules] = useState<ShippingDiscount[]>([
    {
      id: '1',
      carrier: 'Correios (SEDEX / PAC)',
      minPrice: 'R$ 299,00',
      categories: 'Todas as categorias',
      zones: 'Região Sudeste (SP, RJ, MG, ES)',
      status: 'active'
    },
    {
      id: '2',
      carrier: 'Jadlog Express',
      minPrice: 'R$ 499,00',
      categories: 'Ferramentas Elétricas',
      zones: 'Todo o Brasil',
      status: 'active'
    }
  ])

  const [showModal, setShowModal] = useState(false)
  const [newRule, setNewRule] = useState({
    carrier: 'Correios PAC',
    minPrice: 199,
    categories: 'Todas as categorias',
    zones: 'Estado de São Paulo (SP)'
  })

  function handleCreate() {
    setRules([
      ...rules,
      {
        id: Date.now().toString(),
        carrier: newRule.carrier,
        minPrice: `R$ ${newRule.minPrice},00`,
        categories: newRule.categories,
        zones: newRule.zones,
        status: 'active'
      }
    ])
    setShowModal(false)
  }

  function handleDelete(id: string) {
    setRules(rules.filter(r => r.id !== id))
  }

  return (
    <div className="discounts-page-container">
      <div className="discounts-wrapper">
        
        {/* Header */}
        <div className="discounts-header">
          <h1 className="discounts-title">Descontos em frete</h1>
          <div className="discounts-actions">
            <button className="btn-secondary-pill" onClick={() => alert('Frete grátis para compras acima de um valor mínimo aumenta o ticket médio.')}>
              Conhecer mais descontos
            </button>
            <button className="btn-primary-pill" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Criar frete grátis
            </button>
          </div>
        </div>

        {/* Hero Onboarding Card (Print 4) */}
        {rules.length === 0 ? (
          <div style={{ background: '#ffffff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '40px 30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 140, height: 140, background: '#eff6ff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Truck size={64} color="#2563eb" />
            </div>
            <div style={{ maxWidth: 440 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.08em', color: '#6b7280', textTransform: 'uppercase' }}>
                Frete Grátis
              </span>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#111827', margin: '4px 0 8px 0' }}>
                Ofereça frete grátis para aumentar suas vendas
              </h2>
              <p style={{ fontSize: '0.88rem', color: '#4b5563', margin: '0 0 16px 0', lineHeight: 1.4 }}>
                Personalize sua oferta de frete grátis: adicione condições, escolha regiões e combine com outras promoções para aproveitar ao máximo.
              </p>
              <button className="btn-primary-pill" onClick={() => setShowModal(true)}>
                Criar frete grátis
              </button>
            </div>
          </div>
        ) : (
          /* Table */
          <div className="discounts-card-table">
            <table className="nuvem-table">
            <thead>
              <tr>
                <th>Meio de envio</th>
                <th>Preço mínimo</th>
                <th>Categorias</th>
                <th>Zonas de entrega</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id}>
                  <td><strong><Truck size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{r.carrier}</strong></td>
                  <td><span style={{ color: '#059669', fontWeight: 700 }}>{r.minPrice}</span></td>
                  <td>{r.categories}</td>
                  <td>{r.zones}</td>
                  <td>
                    <span className="badge-status-dot active">● Ativo</span>
                  </td>
                  <td>
                    <button
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      onClick={() => handleDelete(r.id)}
                      title="Excluir regra"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Criar Regra de Frete Grátis</h3>
            </div>
            <div className="modal-body" style={{ gap: 14 }}>
              <div className="form-group">
                <label>Meio de Envio</label>
                <select className="form-select" value={newRule.carrier} onChange={(e) => setNewRule({ ...newRule, carrier: e.target.value })}>
                  <option value="Correios PAC">Correios PAC</option>
                  <option value="Correios SEDEX">Correios SEDEX</option>
                  <option value="Jadlog .Package">Jadlog .Package</option>
                  <option value="Melhor Envio">Melhor Envio</option>
                </select>
              </div>

              <div className="form-group">
                <label>Valor Mínimo do Carrinho (R$)</label>
                <input
                  type="number"
                  className="form-input"
                  value={newRule.minPrice}
                  onChange={(e) => setNewRule({ ...newRule, minPrice: parseFloat(e.target.value) || 0 })}
                />
              </div>

              <div className="form-group">
                <label>Região / Zonas de Entrega</label>
                <input
                  type="text"
                  className="form-input"
                  value={newRule.zones}
                  onChange={(e) => setNewRule({ ...newRule, zones: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-secondary-action" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="button" className="btn-primary-action" onClick={handleCreate}>Salvar Regra</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
