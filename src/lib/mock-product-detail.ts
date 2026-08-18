// Extended mock data for product detail page

export interface ProductDetail {
  id: string
  sku: string
  name: string
  brand: string
  model: string
  ean: string
  category: string
  description: string
  image: string
  status: 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'PAUSED'
  created_at: string
  updated_at: string
  supplier: {
    id: string
    name: string
    cnpj: string
    contact: string
    phone: string
    whatsapp: string
    email: string
    delivery_time: number
    min_order: number
    last_purchase: string
    cost: number
  }
  costs: {
    purchase: number
    freight: number
    packaging: number
    other: number
    real: number
  }
  pricing: {
    current_price: number
    suggested_price: number
    minimum_price: number
    profit: number
    margin: number
  }
  stock: {
    physical: number
    reserved: number
    available: number
    minimum: number
    maximum: number
    location: string
    value: number
  }
  summary: {
    total_sales: number
    total_orders: number
    total_revenue: number
    total_profit: number
    avg_margin: number
    avg_ticket: number
  }
  marketplaces: Array<{
    name: string
    listing_id: string
    price: number
    stock: number
    status: 'ACTIVE' | 'INACTIVE'
    last_sync: string
  }>
  recent_sales: Array<{
    id: string
    order_id: string
    marketplace: string
    quantity: number
    price: number
    revenue: number
    profit: number
    margin: number
    status: string
    date: string
  }>
  stock_movements: Array<{
    id: string
    date: string
    type: 'COMPRA' | 'VENDA' | 'CANCELAMENTO' | 'DEVOLUCAO' | 'AJUSTE' | 'PERDA' | 'TRANSFERENCIA'
    quantity: number
    balance: number
    order_ref: string
    user: string
  }>
  purchases_history: Array<{
    id: string
    order_ref: string
    supplier: string
    quantity: number
    unit_cost: number
    total: number
    date: string
    status: string
  }>
  history: Array<{
    id: string
    date: string
    time: string
    action: string
    user: string
    details: string
  }>
  sales_chart: Array<{
    period: string
    units: number
    revenue: number
  }>
}

export const mockProductDetails: Record<string, ProductDetail> = {
  '1': {
    id: '1',
    sku: 'FONE001',
    name: 'Fone Bluetooth Pro',
    brand: 'Altomex',
    model: 'BT-500',
    ean: '7891234560001',
    category: 'Eletrônicos',
    description: 'Fone de ouvido bluetooth com cancelamento de ruído, bateria de 40h e conexão simultânea a 2 dispositivos.',
    image: '/placeholder-product.png',
    status: 'ACTIVE',
    created_at: '2026-05-10',
    updated_at: '2026-08-17',
    supplier: {
      id: '1',
      name: 'Fornecedor Tech SP',
      cnpj: '12.345.678/0001-90',
      contact: 'João Silva',
      phone: '(11) 99999-1234',
      whatsapp: '(11) 98888-1234',
      email: 'joao@techsp.com',
      delivery_time: 3,
      min_order: 50,
      last_purchase: '2026-08-15',
      cost: 38,
    },
    costs: {
      purchase: 38,
      freight: 3.5,
      packaging: 2,
      other: 0,
      real: 43.5,
    },
    pricing: {
      current_price: 89.9,
      suggested_price: 94.9,
      minimum_price: 79.9,
      profit: 22.4,
      margin: 24.91,
    },
    stock: {
      physical: 42,
      reserved: 5,
      available: 37,
      minimum: 10,
      maximum: 200,
      location: 'A-03',
      value: 1827,
    },
    summary: {
      total_sales: 128,
      total_orders: 116,
      total_revenue: 11507.2,
      total_profit: 2840.5,
      avg_margin: 24.69,
      avg_ticket: 89.9,
    },
    marketplaces: [
      { name: 'Mercado Livre', listing_id: 'MLB123456', price: 89.9, stock: 42, status: 'ACTIVE', last_sync: '2026-08-17T15:32:00' },
      { name: 'Shopee', listing_id: 'SHP123456', price: 91.9, stock: 42, status: 'ACTIVE', last_sync: '2026-08-17T15:30:00' },
    ],
    recent_sales: [
      { id: '1', order_id: 'ML-98231', marketplace: 'Mercado Livre', quantity: 1, price: 89.9, revenue: 89.9, profit: 22.4, margin: 24.91, status: 'Entregue', date: '2026-08-17' },
      { id: '2', order_id: 'SHP-18291', marketplace: 'Shopee', quantity: 2, price: 91.9, revenue: 183.8, profit: 45.6, margin: 24.81, status: 'Enviado', date: '2026-08-16' },
      { id: '3', order_id: 'ML-98228', marketplace: 'Mercado Livre', quantity: 1, price: 89.9, revenue: 89.9, profit: 22.4, margin: 24.91, status: 'Entregue', date: '2026-08-15' },
      { id: '4', order_id: 'ML-98225', marketplace: 'Mercado Livre', quantity: 3, price: 89.9, revenue: 269.7, profit: 67.2, margin: 24.91, status: 'Entregue', date: '2026-08-14' },
      { id: '5', order_id: 'SHP-18287', marketplace: 'Shopee', quantity: 1, price: 91.9, revenue: 91.9, profit: 23.1, margin: 25.14, status: 'Entregue', date: '2026-08-13' },
    ],
    stock_movements: [
      { id: '1', date: '2026-08-17', type: 'VENDA', quantity: -1, balance: 42, order_ref: 'ML-98231', user: 'Sistema' },
      { id: '2', date: '2026-08-16', type: 'COMPRA', quantity: 20, balance: 43, order_ref: 'COMP-001', user: 'Alison' },
      { id: '3', date: '2026-08-15', type: 'AJUSTE', quantity: -2, balance: 23, order_ref: '-', user: 'Administrador' },
      { id: '4', date: '2026-08-14', type: 'VENDA', quantity: -3, balance: 25, order_ref: 'ML-98225', user: 'Sistema' },
      { id: '5', date: '2026-08-13', type: 'VENDA', quantity: -1, balance: 28, order_ref: 'SHP-18287', user: 'Sistema' },
      { id: '6', date: '2026-08-10', type: 'DEVOLUCAO', quantity: 1, balance: 29, order_ref: 'ML-98210', user: 'Sistema' },
    ],
    purchases_history: [
      { id: '1', order_ref: 'COMP-001', supplier: 'Fornecedor Tech SP', quantity: 20, unit_cost: 38, total: 760, date: '2026-08-16', status: 'Concluída' },
      { id: '2', order_ref: 'COMP-002', supplier: 'Fornecedor Tech SP', quantity: 50, unit_cost: 38, total: 1900, date: '2026-08-01', status: 'Concluída' },
      { id: '3', order_ref: 'COMP-003', supplier: 'Fornecedor Tech SP', quantity: 30, unit_cost: 36, total: 1080, date: '2026-07-15', status: 'Concluída' },
    ],
    history: [
      { id: '1', date: '2026-08-17', time: '15:32', action: 'Venda registrada', user: 'Sistema', details: 'Pedido ML-98231 — 1 unidade' },
      { id: '2', date: '2026-08-16', time: '14:20', action: 'Compra registrada', user: 'Alison', details: 'COMP-001 — 20 unidades' },
      { id: '3', date: '2026-08-15', time: '10:05', action: 'Ajuste de estoque', user: 'Administrador', details: '-2 unidades (perda)' },
      { id: '4', date: '2026-08-14', time: '09:30', action: 'Preço alterado', user: 'Alison', details: 'R$ 85,90 → R$ 89,90' },
      { id: '5', date: '2026-08-10', time: '16:00', action: 'Produto cadastrado', user: 'Alison', details: 'Fone Bluetooth Pro — SKU FONE001' },
    ],
    sales_chart: [
      { period: '07/08', units: 3, revenue: 269.7 },
      { period: '08/08', units: 2, revenue: 179.8 },
      { period: '09/08', units: 4, revenue: 359.6 },
      { period: '10/08', units: 1, revenue: 89.9 },
      { period: '11/08', units: 5, revenue: 449.5 },
      { period: '12/08', units: 3, revenue: 269.7 },
      { period: '13/08', units: 2, revenue: 183.8 },
      { period: '14/08', units: 3, revenue: 269.7 },
      { period: '15/08', units: 1, revenue: 89.9 },
      { period: '16/08', units: 2, revenue: 183.8 },
      { period: '17/08', units: 1, revenue: 89.9 },
    ],
  },
}

export function getProductDetail(id: string): ProductDetail | null {
  return mockProductDetails[id] || null
}
