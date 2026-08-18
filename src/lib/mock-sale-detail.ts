export interface SaleDetail {
  id: string
  order_id: string
  marketplace: string
  customer: { name: string; email: string; phone: string }
  product: { id: string; sku: string; name: string; brand: string }
  quantity: number
  price: number
  revenue: number
  cost: number
  fees: number
  freight: number
  taxes: number
  profit: number
  margin: number
  date: string
  status: string
  payment: { method: string; installments: number }
  shipping: { method: string; tracking: string; status: string }
  timeline: Array<{ date: string; time: string; action: string; details: string }>
}

export const mockSaleDetails: Record<string, SaleDetail> = {
  '1': {
    id: '1', order_id: 'ML-98231', marketplace: 'Mercado Livre', date: '2026-08-17', status: 'COMPLETED',
    customer: { name: 'Carlos Silva', email: 'carlos@email.com', phone: '(11) 99999-0000' },
    product: { id: '1', sku: 'FONE001', name: 'Fone Bluetooth Pro', brand: 'Altomex' },
    quantity: 1, price: 149.90, revenue: 149.90, cost: 45, fees: 23.98, freight: 12.50, taxes: 17.99, profit: 31.20, margin: 20.81,
    payment: { method: 'PIX', installments: 1 },
    shipping: { method: 'SEDEX', tracking: 'BR123456789', status: 'Aguardando envio' },
    timeline: [
      { date: '17/08', time: '15:30', action: 'Pedido criado', details: 'Mercado Livre — #ML-98231' },
      { date: '17/08', time: '15:31', action: 'Pagamento', details: 'PIX confirmado — R$ 189,90' },
    ],
  },
  '2': {
    id: '2', order_id: 'SHP-18291', marketplace: 'Shopee', date: '2026-08-17', status: 'COMPLETED',
    customer: { name: 'Ana Souza', email: 'ana@email.com', phone: '(21) 98888-0000' },
    product: { id: '3', sku: 'CABO001', name: 'Cabo USB-C 2m', brand: 'Baseus' },
    quantity: 2, price: 44.90, revenue: 89.80, cost: 14, fees: 13.47, freight: 8.00, taxes: 10.78, profit: 28.40, margin: 31.63,
    payment: { method: 'Cartão de Crédito', installments: 3 },
    shipping: { method: 'PAC', tracking: 'BR987654321', status: 'Em separação' },
    timeline: [
      { date: '17/08', time: '10:15', action: 'Pedido criado', details: 'Shopee — #SHP-18291' },
      { date: '17/08', time: '10:16', action: 'Pagamento', details: 'Cartão aprovado — R$ 89,90' },
      { date: '17/08', time: '14:00', action: 'Separação', details: 'Iniciado separação' },
    ],
  },
  '3': {
    id: '3', order_id: 'ML-98232', marketplace: 'Mercado Livre', date: '2026-08-17', status: 'COMPLETED',
    customer: { name: 'Pedro Lima', email: 'pedro@email.com', phone: '(31) 97777-0000' },
    product: { id: '6', sku: 'MOUSE001', name: 'Mouse Gamer RGB', brand: 'Logitech' },
    quantity: 2, price: 174.90, revenue: 349.80, cost: 106, fees: 55.97, freight: 18.00, taxes: 41.98, profit: 72.50, margin: 20.73,
    payment: { method: 'PIX', installments: 1 },
    shipping: { method: 'SEDEX', tracking: 'BR456789123', status: 'Separado' },
    timeline: [
      { date: '17/08', time: '08:00', action: 'Pedido criado', details: 'Mercado Livre — #ML-98232' },
      { date: '17/08', time: '08:01', action: 'Pagamento', details: 'PIX confirmado — R$ 349,70' },
      { date: '17/08', time: '11:00', action: 'Separado', details: 'Pedido separado' },
    ],
  },
  '4': {
    id: '4', order_id: 'TT-45123', marketplace: 'TikTok Shop', date: '2026-08-16', status: 'COMPLETED',
    customer: { name: 'Julia Ferreira', email: 'julia@email.com', phone: '(41) 96666-0000' },
    product: { id: '5', sku: 'CARREG001', name: 'Carregador Turbo 65W', brand: 'Samsung' },
    quantity: 1, price: 119.80, revenue: 119.80, cost: 64, fees: 17.97, freight: 9.50, taxes: 14.38, profit: 28.40, margin: 23.70,
    payment: { method: 'PIX', installments: 1 },
    shipping: { method: 'SEDEX', tracking: 'BR321654987', status: 'Enviado' },
    timeline: [
      { date: '16/08', time: '16:00', action: 'Pedido criado', details: 'TikTok Shop — #TT-45123' },
      { date: '16/08', time: '16:01', action: 'Pagamento', details: 'PIX confirmado — R$ 119,80' },
      { date: '16/08', time: '18:00', action: 'Enviado', details: 'Enviado via SEDEX' },
    ],
  },
  '5': {
    id: '5', order_id: 'SHP-18292', marketplace: 'Shopee', date: '2026-08-16', status: 'COMPLETED',
    customer: { name: 'Marcos Oliveira', email: 'marcos@email.com', phone: '(51) 95555-0000' },
    product: { id: '4', sku: 'CAPA001', name: 'Capa Silicone iPhone 15', brand: 'Genérico' },
    quantity: 2, price: 79.90, revenue: 159.80, cost: 9.5, fees: 23.97, freight: 10.00, taxes: 19.18, profit: 34.20, margin: 21.40,
    payment: { method: 'Cartão de Crédito', installments: 2 },
    shipping: { method: 'PAC', tracking: 'BR654321987', status: 'Entregue' },
    timeline: [
      { date: '16/08', time: '09:00', action: 'Pedido criado', details: 'Shopee — #SHP-18292' },
      { date: '16/08', time: '09:01', action: 'Pagamento', details: 'Cartão aprovado — R$ 159,80' },
      { date: '16/08', time: '14:00', action: 'Entregue', details: 'Entregue ao destinatário' },
    ],
  },
  '6': {
    id: '6', order_id: 'AMZ-78432', marketplace: 'Amazon', date: '2026-08-16', status: 'COMPLETED',
    customer: { name: 'Lucia Santos', email: 'lucia@email.com', phone: '(61) 94444-0000' },
    product: { id: '7', sku: 'TECLADO001', name: 'Teclado Mecânico', brand: 'Redragon' },
    quantity: 1, price: 149.90, revenue: 149.90, cost: 135, fees: 22.49, freight: 14.00, taxes: 17.99, profit: -39.58, margin: -26.40,
    payment: { method: 'Boleto', installments: 1 },
    shipping: { method: 'Logística Amazon', tracking: 'AMZ987123456', status: 'Aguardando envio' },
    timeline: [
      { date: '16/08', time: '12:00', action: 'Pedido criado', details: 'Amazon — #AMZ-78432' },
      { date: '16/08', time: '18:00', action: 'Pagamento', details: 'Boleto pago — R$ 149,90' },
    ],
  },
}

export function getSaleDetail(id: string): SaleDetail | null {
  return mockSaleDetails[id] || null
}
