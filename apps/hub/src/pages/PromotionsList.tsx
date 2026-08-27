import { useState } from 'react'
import { Plus, Trash2, Tag, Percent } from 'lucide-react'
import './Discounts.css'

interface Promotion {
  id: string
  name: string
  discountType: string
  applyTo: string
  validity: string
  status: 'active' | 'inactive'
}

export default function PromotionsList() {
  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      id: '1',
      name: 'Leve 3 Pague 2 em Discos de Corte',
      discountType: 'Compre X Pague Y',
      applyTo: 'Categoria: Acessórios & Discos',
      validity: 'Até 31/12/2026',
      status: 'active'
    },
    {
      id: '2',
      name: 'Semana das Ferramentas a Bateria (15% OFF)',
      discountType: 'Desconto percentual (15%)',
      applyTo: 'Produtos selecionados',
      validity: 'Próximos 7 dias',
      status: 'active'
    }
  ])

  const [showModal, setShowModal] = useState(false)
  const [newPromo, setNewPromo] = useState({
    name: '',
    discountType: 'Porcentagem (10%)',
    applyTo: 'Todos os produtos'
  })

  function handleCreate() {
    if (!newPromo.name.trim()) return
    setPromotions([
      ...promotions,
      {
        id: Date.now().toString(),
        name: newPromo.name,
        discountType: newPromo.discountType,
        applyTo: newPromo.applyTo,
        validity: 'Indeterminado',
        status: 'active'
      }
    ])
    setShowModal(false)
    setNewPromo({ name: '', discountType: 'Porcentagem (10%)', applyTo: 'Todos os produtos' })
  }

  function handleDelete(id: string) {
    setPromotions(promotions.filter(p => p.id !== id))
  }

  return (
    <div className="discounts-page-container">
      <div className="discounts-wrapper">
        
        {/* Header */}
        <div className="page-header">
          <div className="header-info">
            <h1>Promoções</h1>
            <p>Configure ofertas automáticas e descontos progressivos por volume ou categoria.</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-secondary" onClick={() => alert('Promoções automáticas no carrinho incentivam compras maiores.')}>
              Conhecer descontos
            </button>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={16} /> Nova promoção
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="discounts-card-table">
          <table className="nuvem-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo de desconto</th>
                <th>Aplicar a</th>
                <th>Vigência</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map(p => (
                <tr key={p.id}>
                  <td><strong><Tag size={14} style={{ verticalAlign: 'middle', marginRight: 6, color: '#e91e63' }} />{p.name}</strong></td>
                  <td>{p.discountType}</td>
                  <td>{p.applyTo}</td>
                  <td>{p.validity}</td>
                  <td>
                    <span className="badge-status-dot active">● Ativo</span>
                  </td>
                  <td>
                    <button
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                      onClick={() => handleDelete(p.id)}
                      title="Excluir promoção"
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Criar Nova Promoção</h3>
            </div>
            <div className="modal-body" style={{ gap: 14 }}>
              <div className="form-group">
                <label>Nome da Promoção *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Leve 2 e Ganhe 20% OFF"
                  value={newPromo.name}
                  onChange={(e) => setNewPromo({ ...newPromo, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Tipo de Desconto</label>
                <select
                  className="form-select"
                  value={newPromo.discountType}
                  onChange={(e) => setNewPromo({ ...newPromo, discountType: e.target.value })}
                >
                  <option value="Porcentagem (10%)">Porcentagem (10%)</option>
                  <option value="Porcentagem (20%)">Porcentagem (20%)</option>
                  <option value="Leve X Pague Y">Leve X Pague Y</option>
                  <option value="Brinde no carrinho">Brinde no carrinho</option>
                </select>
              </div>

              <div className="form-group">
                <label>Aplicar a</label>
                <select
                  className="form-select"
                  value={newPromo.applyTo}
                  onChange={(e) => setNewPromo({ ...newPromo, applyTo: e.target.value })}
                >
                  <option value="Todos os produtos">Todos os produtos da loja</option>
                  <option value="Categorias selecionadas">Categorias selecionadas</option>
                  <option value="Produtos selecionados">Produtos selecionados</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-secondary-action" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="button" className="btn-primary-action" onClick={handleCreate}>Salvar Promoção</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
