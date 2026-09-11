import React from 'react'
import { Printer, X, CheckCircle, Download } from 'lucide-react'
import './ReceiptModal.css'

interface ReceiptModalProps {
  isOpen: boolean
  onClose: () => void
  order: any
  receipt: any
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  receipt,
}) => {
  if (!isOpen || !order) return null

  const items = order.items || []
  const receiptNum = receipt?.receipt_number || `REC-${order.order_number || order.id?.slice(0, 8)}`
  const dateStr = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(receipt?.generated_at || order.created_at || Date.now()))

  function formatBRL(val: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="receipt-modal-backdrop" onClick={onClose}>
      <div className="receipt-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header de Ações no HUB (não impresso) */}
        <div className="receipt-modal-topbar no-print">
          <div className="receipt-topbar-title">
            <span>Comprovante / Recibo Comercial</span>
            <span className="receipt-badge-status">
              <CheckCircle size={14} /> VÁLIDO
            </span>
          </div>
          <div className="receipt-topbar-actions">
            <button className="receipt-btn-print" onClick={handlePrint}>
              <Printer size={16} /> Imprimir / Salvar PDF
            </button>
            <button className="receipt-btn-close" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Papel do Recibo (100% formatado para tela e folha A4) */}
        <div className="receipt-paper" id="printable-receipt">
          <div className="receipt-header">
            <div className="receipt-brand">
              <h1 className="receipt-brand-name">TEKNIX</h1>
              <p className="receipt-brand-sub">Loja Oficial & Tecnologia</p>
              <p className="receipt-company-info">
                ALYSON THIAGO LOURENCO DA SILVA<br />
                CNPJ: 38.068.360/0001-06<br />
                São Paulo — SP | contato@teknixbrasil.com.br
              </p>
            </div>
            <div className="receipt-meta">
              <div className="receipt-meta-box">
                <span className="receipt-meta-label">RECIBO Nº</span>
                <span className="receipt-meta-number">{receiptNum}</span>
              </div>
              <p className="receipt-meta-date">Data: {dateStr}</p>
              <p className="receipt-meta-order">Pedido ref: #{order.order_number}</p>
            </div>
          </div>

          <hr className="receipt-divider" />

          {/* Dados do Cliente */}
          <div className="receipt-section">
            <h3 className="receipt-section-title">Dados do Cliente</h3>
            <div className="receipt-grid-2">
              <div>
                <p><strong>Nome:</strong> {order.customer_name || 'Consumidor Final'}</p>
                <p><strong>CPF/CNPJ:</strong> {order.customer_document || 'Não informado'}</p>
                {order.customer_email && <p><strong>E-mail:</strong> {order.customer_email}</p>}
                {order.customer_phone && <p><strong>Telefone:</strong> {order.customer_phone}</p>}
              </div>
              <div>
                <p><strong>Endereço de Entrega:</strong></p>
                <p className="receipt-address-text">{order.delivery_address || 'Retirada / Padrão'}</p>
              </div>
            </div>
          </div>

          {/* Itens do Pedido */}
          <div className="receipt-section">
            <h3 className="receipt-section-title">Itens da Compra</h3>
            <table className="receipt-table">
              <thead>
                <tr>
                  <th>Item / Produto</th>
                  <th style={{ textAlign: 'center' }}>Qtd</th>
                  <th style={{ textAlign: 'right' }}>Unitário</th>
                  <th style={{ textAlign: 'right' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? (
                  items.map((it: any, i: number) => (
                    <tr key={i}>
                      <td>
                        <strong>{it.product_name}</strong>
                        {it.sku && <span className="receipt-sku"> (SKU: {it.sku})</span>}
                      </td>
                      <td style={{ textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ textAlign: 'right' }}>{formatBRL(it.price)}</td>
                      <td style={{ textAlign: 'right' }}>{formatBRL(it.total || it.price * it.quantity)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td>{order.order_number || 'Produtos diversos'}</td>
                    <td style={{ textAlign: 'center' }}>1</td>
                    <td style={{ textAlign: 'right' }}>{formatBRL(order.total)}</td>
                    <td style={{ textAlign: 'right' }}>{formatBRL(order.total)}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Resumo Financeiro */}
          <div className="receipt-financial-summary">
            <div className="receipt-summary-left">
              <p><strong>Forma de Pagamento:</strong> {order.payment_method || 'Mercado Pago'}</p>
              <p><strong>Status do Pagamento:</strong> {order.payment_status === 'paid' || order.payment_status === 'approved' ? 'PAGO / APROVADO' : order.payment_status?.toUpperCase()}</p>
              <p className="receipt-legal-note">
                * Este documento é um recibo comercial comprobatório de pagamento. A nota fiscal eletrônica (NF-e) correspondente é emitida e vinculada separadamente conforme a legislação vigente.
              </p>
            </div>
            <div className="receipt-summary-right">
              <div className="receipt-calc-row">
                <span>Subtotal:</span>
                <span>{formatBRL(order.subtotal || order.total)}</span>
              </div>
              {Number(order.discount) > 0 && (
                <div className="receipt-calc-row" style={{ color: '#15803d' }}>
                  <span>Desconto:</span>
                  <span>- {formatBRL(order.discount)}</span>
                </div>
              )}
              {Number(order.shipping_cost) > 0 && (
                <div className="receipt-calc-row">
                  <span>Frete:</span>
                  <span>{formatBRL(order.shipping_cost)}</span>
                </div>
              )}
              <div className="receipt-calc-row receipt-total-row">
                <span>TOTAL:</span>
                <span>{formatBRL(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="receipt-footer">
            <p>TEKNIX BRASIL — Inovação e Qualidade | https://teknixbrasil.com.br</p>
            <p className="receipt-barcode-line">*** {receiptNum} ***</p>
          </div>
        </div>
      </div>
    </div>
  )
}
