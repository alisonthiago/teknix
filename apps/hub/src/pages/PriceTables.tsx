import { useState } from 'react'
import { Plus, Users, ShoppingBag, Percent, DollarSign, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react'
import './Categories.css'

interface PriceTable {
  id: string
  name: string
  discount: string
  minOrder: string
  audience: string
  status: 'active' | 'inactive'
}

export default function PriceTables() {
  const [tables, setTables] = useState<PriceTable[]>([
    {
      id: '1',
      name: 'Tabela Padrão Varejo (B2C)',
      discount: '0% (Preço cheio)',
      minOrder: 'Sem mínimo',
      audience: 'Todos os clientes',
      status: 'active'
    },
    {
      id: '2',
      name: 'Tabela Atacadista / Revenda (B2B)',
      discount: '30% OFF',
      minOrder: 'Mínimo R$ 1.500,00',
      audience: 'Clientes com CNPJ aprovado',
      status: 'active'
    },
    {
      id: '3',
      name: 'Parceiros Instaladores & Eletricistas',
      discount: '15% OFF',
      minOrder: 'Mínimo R$ 300,00',
      audience: 'Profissionais cadastrados',
      status: 'active'
    }
  ])

  const [showModal, setShowModal] = useState(false)
  const [newTable, setNewTable] = useState({
    name: '',
    discountPercent: 20,
    minAmount: 500,
    audience: 'Clientes selecionados'
  })

  function handleCreate() {
    if (!newTable.name.trim()) return
    setTables([
      ...tables,
      {
        id: Date.now().toString(),
        name: newTable.name,
        discount: `${newTable.discountPercent}% OFF`,
        minOrder: `Mínimo R$ ${newTable.minAmount},00`,
        audience: newTable.audience,
        status: 'active'
      }
    ])
    setShowModal(false)
    setNewTable({ name: '', discountPercent: 20, minAmount: 500, audience: 'Clientes selecionados' })
  }

  return (
    <div className="categories-page-container">
      <div className="categories-wrapper">
        
        {/* Hero Centralization Banner */}
        <div className="price-tables-hero">
          <span className="hero-tag">Centralização e Controle</span>
          <h1 className="hero-title">Venda atacado e varejo no mesmo site</h1>
          <p className="hero-subtitle">
            Crie tabelas de preços exclusivas, regras de compra mínima e gerencie um estoque unificado para todos os seus clientes, sem precisar de uma segunda loja.
          </p>
          <button className="btn-primary-action" style={{ borderRadius: 20, padding: '10px 24px' }} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Criar tabela de preços
          </button>
        </div>

        {/* 3 Step Cards from Nuvemshop */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: '20px 0 0 0' }}>Como funciona?</h3>
        <div className="price-steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h4 className="step-title">Crie sua Tabela de Preços</h4>
            <p className="step-desc">Defina o percentual de desconto (ex: 30% OFF) para a loja toda, categorias específicas ou produtos selecionados.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h4 className="step-title">Defina as Regras de Compra</h4>
            <p className="step-desc">Configure o mínimo de compra (valor ou quantidade) para proteger sua margem e garantir rentabilidade no atacado.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h4 className="step-title">Associe seus clientes</h4>
            <p className="step-desc">Envie o link de auto-cadastro diretamente para seus clientes atacadistas ou divulgue no seu site.</p>
          </div>
        </div>

        {/* Existing Tables List */}
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#111827', margin: '24px 0 0 0' }}>Tabelas de Preços Ativas</h3>
        <div className="category-tree-card">
          {tables.map(t => (
            <div key={t.id} className="category-tree-item">
              <div className="category-tree-left">
                <DollarSign size={18} color="#059669" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#111827' }}>{t.name}</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>{t.minOrder} • {t.audience}</div>
                </div>
              </div>
              <div className="category-tree-right">
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#059669', background: '#e6f9f0', padding: '4px 10px', borderRadius: 12 }}>
                  {t.discount}
                </span>
                <span className="badge-status-dot active" style={{ marginLeft: 8 }}>● Ativo</span>
              </div>
            </div>
          ))}
        </div>

      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Criar Nova Tabela de Preços</h3>
            </div>
            <div className="modal-body" style={{ gap: 14 }}>
              <div className="form-group">
                <label>Nome da Tabela *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ex: Atacado Especial 30%"
                  value={newTable.name}
                  onChange={(e) => setNewTable({ ...newTable, name: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label>Desconto (%)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newTable.discountPercent}
                    onChange={(e) => setNewTable({ ...newTable, discountPercent: parseFloat(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Pedido Mínimo (R$)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={newTable.minAmount}
                    onChange={(e) => setNewTable({ ...newTable, minAmount: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Público / Segmento</label>
                <select
                  className="form-select"
                  value={newTable.audience}
                  onChange={(e) => setNewTable({ ...newTable, audience: e.target.value })}
                >
                  <option value="Clientes com CNPJ aprovado">Clientes com CNPJ aprovado (B2B)</option>
                  <option value="Profissionais cadastrados">Profissionais cadastrados</option>
                  <option value="Todos os clientes">Todos os clientes</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button type="button" className="btn-secondary-action" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="button" className="btn-primary-action" onClick={handleCreate}>Salvar Tabela</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
