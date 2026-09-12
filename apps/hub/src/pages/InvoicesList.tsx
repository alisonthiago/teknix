import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText, RefreshCw, Download, AlertTriangle,
  CheckCircle2, Clock, XCircle, ShieldCheck, Eye,
} from 'lucide-react'
import { FiscalService, StoreInvoice } from '../services/fiscal/FiscalService'
import { HubDataTable, type HubColumn } from '../components/ui/HubDataTable'
import '../components/ui/HubDataTable/HubKpi.css'

function formatBRL(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
}

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso))
}

function getStatusConfig(status: string): { label: string; variant: string; icon: React.ReactNode } {
  switch (status) {
    case 'autorizada':
      return { label: 'Autorizada', variant: 'hub-badge-green', icon: <CheckCircle2 size={12} /> }
    case 'processando':
      return { label: 'Processando', variant: 'hub-badge-blue', icon: <Clock size={12} /> }
    case 'aguardando':
      return { label: 'Aguardando', variant: 'hub-badge-yellow', icon: <Clock size={12} /> }
    case 'rejeitada':
    case 'erro':
      return { label: 'Rejeitada', variant: 'hub-badge-red', icon: <XCircle size={12} /> }
    case 'cancelada':
      return { label: 'Cancelada', variant: 'hub-badge-red', icon: <XCircle size={12} /> }
    case 'dados_incompletos':
      return { label: 'Dados incompletos', variant: 'hub-badge-yellow', icon: <AlertTriangle size={12} /> }
    default:
      return { label: status || 'Não emitida', variant: 'hub-badge-gray', icon: null }
  }
}

const COLUMNS: HubColumn<StoreInvoice>[] = [
  {
    key: 'order_number',
    label: 'Pedido',
    width: '130px',
    render: (inv) => inv.order_id ? (
      <Link to={`/hub/pedidos/${inv.order_id}`} style={{ color: '#2563eb', fontWeight: 600, textDecoration: 'none', fontSize: 13 }}>
        #{inv.order_number || inv.order_id.slice(0, 8)}
      </Link>
    ) : (
      <span className="hub-cell-muted">#{inv.order_number || '—'}</span>
    ),
    exportValue: (inv) => inv.order_number || '',
  },
  {
    key: 'numero',
    label: 'NF-e',
    width: '160px',
    render: (inv) => (
      <div>
        {inv.numero
          ? <div style={{ fontWeight: 600, fontSize: 13, color: '#111' }}>Nº {inv.numero} (Série {inv.serie || 1})</div>
          : <div className="hub-cell-muted">Ref: {inv.reference}</div>
        }
        <span style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 4, fontWeight: 700, letterSpacing: '0.04em',
          background: inv.ambiente === 'producao' ? '#dcfce7' : '#fef3c7',
          color: inv.ambiente === 'producao' ? '#166534' : '#92400e',
          display: 'inline-block', marginTop: 2
        }}>
          {inv.ambiente === 'producao' ? 'PROD' : 'HOMOLOG'}
        </span>
      </div>
    ),
    exportValue: (inv) => `${inv.numero || inv.reference}`,
  },
  {
    key: 'customer_name',
    label: 'Cliente',
    render: (inv) => (
      <div>
        <div className="hub-cell-bold">{inv.customer_name || 'Consumidor Final'}</div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>{inv.customer_document || ''}</div>
      </div>
    ),
    exportValue: (inv) => inv.customer_name || 'Consumidor Final',
  },
  {
    key: 'issued_at',
    label: 'Data',
    width: '140px',
    render: (inv) => <span className="hub-cell-muted">{formatDate(inv.issued_at || inv.created_at)}</span>,
    exportValue: (inv) => formatDate(inv.issued_at || inv.created_at),
  },
  {
    key: 'valor',
    label: 'Valor',
    width: '110px',
    align: 'right',
    render: (inv) => <span className="hub-cell-bold">{formatBRL(inv.valor)}</span>,
    exportValue: (inv) => formatBRL(inv.valor),
  },
  {
    key: 'status',
    label: 'Status',
    width: '160px',
    render: (inv) => {
      const cfg = getStatusConfig(inv.status)
      return (
        <span className={`hub-status-badge ${cfg.variant}`}>
          <span className="hub-badge-dot" />
          {cfg.icon}
          {cfg.label}
        </span>
      )
    },
    exportValue: (inv) => getStatusConfig(inv.status).label,
  },
  {
    key: 'chave',
    label: 'Chave de Acesso',
    width: '160px',
    render: (inv) => inv.chave ? (
      <span
        title={inv.chave}
        style={{ fontFamily: 'monospace', fontSize: 11, color: '#374151', cursor: 'pointer', textDecoration: 'underline dotted' }}
        onClick={() => { navigator.clipboard.writeText(inv.chave || ''); alert('Chave copiada!') }}
      >
        {inv.chave.slice(0, 14)}…{inv.chave.slice(-6)}
      </span>
    ) : inv.rejection_message ? (
      <span style={{ fontSize: 11, color: '#dc2626' }} title={inv.rejection_message}>
        {inv.rejection_message.slice(0, 30)}…
      </span>
    ) : <span className="hub-cell-muted">—</span>,
    exportValue: (inv) => inv.chave || '',
  },
  {
    key: 'danfe_url',
    label: 'Documentos',
    width: '130px',
    render: (inv) => (
      <div style={{ display: 'flex', gap: 6 }}>
        {inv.danfe_url && (
          <a href={inv.danfe_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#2563eb', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
            <FileText size={13} /> DANFE
          </a>
        )}
        {inv.xml_url && (
          <a href={inv.xml_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: '#6b7280', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3, textDecoration: 'none' }}>
            <Download size={13} /> XML
          </a>
        )}
        {!inv.danfe_url && !inv.xml_url && <span className="hub-cell-muted">—</span>}
      </div>
    ),
    exportValue: (inv) => inv.danfe_url || inv.xml_url || '',
  },
]

const STATUS_TABS = [
  { id: 'all', label: 'Todas' },
  { id: 'pendentes', label: 'Pendentes' },
  { id: 'processando', label: 'Processando' },
  { id: 'autorizadas', label: 'Autorizadas' },
  { id: 'rejeitadas', label: 'Rejeitadas' },
  { id: 'canceladas', label: 'Canceladas' },
]

export default function InvoicesList() {
  const [invoices, setInvoices] = useState<StoreInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [totalCount, setTotalCount] = useState(0)

  useEffect(() => { loadInvoices() }, [activeTab])

  async function loadInvoices() {
    setLoading(true)
    try {
      const res = await FiscalService.listInvoices({ status: activeTab, search, page: 1, pageSize: 50 })
      setInvoices(res.invoices)
      setTotalCount(res.total)
    } catch (err) {
      console.error('[InvoicesList] Erro:', err)
      setInvoices([])
    } finally {
      setLoading(false)
    }
  }

  const countAuthorized = invoices.filter(i => i.status === 'autorizada').length
  const countProcessing = invoices.filter(i => i.status === 'processando' || i.status === 'aguardando').length
  const countErrors = invoices.filter(i => i.status === 'rejeitada' || i.status === 'dados_incompletos').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      <div className="hub-kpi-grid">
        {[
          { label: 'Total Cadastradas', value: totalCount, icon: <FileText size={16} />, sub: 'Todas as notas fiscais cadastradas' },
          { label: 'Autorizadas na SEFAZ', value: countAuthorized, icon: <CheckCircle2 size={16} />, sub: 'Notas autorizadas pela SEFAZ' },
          { label: 'Em Processamento', value: countProcessing, icon: <Clock size={16} />, sub: 'Notas aguardando processamento' },
          { label: 'Rejeitadas / Pendências', value: countErrors, icon: <AlertTriangle size={16} />, sub: 'Notas que precisam de atenção' },
        ].map((s, i) => (
          <div key={i} className="hub-kpi-card">
            <div className="hub-kpi-header"><span className="hub-kpi-label">{s.label}</span><div className="hub-kpi-icon">{s.icon}</div></div>
            <div className="hub-kpi-value">{s.value}</div>
          </div>
        ))}
      </div>

      <HubDataTable
        title="Notas Fiscais (NF-e)"
        headerActions={
          <>
            <div className="hub-status-tabs">
              {STATUS_TABS.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: activeTab === tab.id ? 700 : 500,
                  background: activeTab === tab.id ? '#fff' : 'transparent',
                  color: activeTab === tab.id ? '#111' : '#6b7280',
                  boxShadow: activeTab === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  fontFamily: 'inherit', whiteSpace: 'nowrap'
                }}>{tab.label}</button>
              ))}
            </div>
            <Link to="/hub/configuracoes" className="hub-btn hub-btn-secondary">
              <ShieldCheck size={14} /> Config. Fiscal
            </Link>
            <button className="hub-btn hub-btn-secondary" onClick={loadInvoices} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'hub-spin' : ''} /> Atualizar
            </button>
          </>
        }
        columns={COLUMNS}
        rows={invoices}
        loading={loading}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Buscar por pedido, NF-e, cliente ou chave"
        exportTitle="Notas Fiscais"
        exportFilename="notas-fiscais"
        entityLabel="nota"
        emptyMessage="Nenhuma nota fiscal encontrada."
        emptyDescription={search ? `Nenhum resultado para "${search}".` : 'Quando os pedidos forem faturados, as notas aparecerão aqui.'}
        renderRowActions={(inv, onClose) => inv.order_id ? (
          <Link
            to={`/hub/pedidos/${inv.order_id}`}
            className="hub-dropdown-item"
            onClick={onClose}
          >
            <Eye size={14} color="#2563eb" /> Ver pedido
          </Link>
        ) : null}
      />
    </div>
  )
}
