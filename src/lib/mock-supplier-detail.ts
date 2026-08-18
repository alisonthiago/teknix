import type { ProductDetail } from '@/lib/mock-product-detail'

export interface SupplierDetail {
  id: string
  name: string
  cnpj: string
  contact: string
  phone: string
  whatsapp: string
  email: string
  city: string
  state: string
  address: string
  delivery_time: number
  min_order: number
  payment_terms: string
  bank: string
  agency: string
  account: string
  pix_key: string
  notes: string
  status: string
  created_at: string
  products: Array<{ id: string; sku: string; name: string; cost: number; stock: number }>
  purchases: Array<{ id: string; date: string; invoice: string; items: number; total: number; status: string }>
  stats: { total_purchased: number; total_orders: number; avg_ticket: number; products_count: number }
  timeline: Array<{ date: string; time: string; action: string; details: string }>
}

export const mockSupplierDetails: Record<string, SupplierDetail> = {
  '1': {
    id: '1', name: 'Fornecedor Tech SP', cnpj: '12.345.678/0001-90', contact: 'João Silva',
    phone: '(11) 99999-1234', whatsapp: '(11) 98888-1234', email: 'joao@techsp.com',
    city: 'São Paulo', state: 'SP', address: 'Rua Augusta, 1000',
    delivery_time: 3, min_order: 500, payment_terms: '30 dias', bank: 'Itaú',
    agency: '1234', account: '56789-0', pix_key: 'joao@techsp.com', notes: 'Fornecedor principal de eletrônicos',
    status: 'ACTIVE', created_at: '2026-06-10',
    products: [
      { id: '1', sku: 'FONE001', name: 'Fone Bluetooth Pro', cost: 38, stock: 42 },
      { id: '3', sku: 'CABO001', name: 'Cabo USB-C 2m', cost: 12, stock: 180 },
      { id: '5', sku: 'CARREG001', name: 'Carregador Turbo 65W', cost: 55, stock: 0 },
      { id: '9', sku: 'WEBCAM001', name: 'Webcam Full HD', cost: 180, stock: 8 },
    ],
    purchases: [
      { id: '1', date: '2026-08-15', invoice: 'NF-001234', items: 12, total: 8940, status: 'CONCLUIDA' },
      { id: '4', date: '2026-08-01', invoice: 'NF-001237', items: 15, total: 6780, status: 'CONCLUIDA' },
    ],
    stats: { total_purchased: 45200, total_orders: 18, avg_ticket: 2511, products_count: 4 },
    timeline: [
      { date: '15/08', time: '10:00', action: 'Compra realizada', details: 'NF-001234 — 12 itens — R$ 8.940' },
      { date: '01/08', time: '14:00', action: 'Compra realizada', details: 'NF-001237 — 15 itens — R$ 6.780' },
      { date: '15/07', time: '09:00', action: 'Preço atualizado', details: 'Fone Bluetooth: R$ 40 → R$ 38' },
      { date: '10/06', time: '11:00', action: 'Cadastro', details: 'Fornecedor cadastrado no sistema' },
    ],
  },
  '2': {
    id: '2', name: 'Fornecedor Alpha', cnpj: '98.765.432/0001-10', contact: 'Maria Santos',
    phone: '(11) 97777-5678', whatsapp: '(11) 96666-5678', email: 'maria@alpha.com',
    city: 'Campinas', state: 'SP', address: 'Av. Anchieta, 500',
    delivery_time: 5, min_order: 300, payment_terms: '15 dias', bank: 'Bradesco',
    agency: '5678', account: '12345-6', pix_key: 'maria@alpha.com', notes: 'Especialista em periféricos',
    status: 'ACTIVE', created_at: '2026-06-15',
    products: [
      { id: '2', sku: 'PARA001', name: 'Parafusadeira 12V', cost: 72, stock: 18 },
      { id: '6', sku: 'MOUSE001', name: 'Mouse Gamer RGB', cost: 95, stock: 28 },
      { id: '7', sku: 'TECLADO001', name: 'Teclado Mecânico', cost: 120, stock: 15 },
    ],
    purchases: [
      { id: '2', date: '2026-08-10', invoice: 'NF-001235', items: 8, total: 5620, status: 'CONCLUIDA' },
    ],
    stats: { total_purchased: 28900, total_orders: 12, avg_ticket: 2408, products_count: 3 },
    timeline: [
      { date: '10/08', time: '11:00', action: 'Compra realizada', details: 'NF-001235 — 8 itens — R$ 5.620' },
      { date: '25/07', time: '16:00', action: 'Novo produto', details: 'Teclado Mecânico adicionado' },
      { date: '15/06', time: '10:00', action: 'Cadastro', details: 'Fornecedor cadastrado' },
    ],
  },
  '3': {
    id: '3', name: 'Import Tech', cnpj: '11.222.333/0001-44', contact: 'Carlos Chen',
    phone: '(11) 95555-9012', whatsapp: '(11) 94444-9012', email: 'carlos@importech.com',
    city: 'Guarulhos', state: 'SP', address: 'Rua Galvão Bueno, 300',
    delivery_time: 15, min_order: 1000, payment_terms: '60 dias', bank: 'Santander',
    agency: '9012', account: '34567-8', pix_key: 'carlos@importech.com', notes: 'Importador direto da China',
    status: 'ACTIVE', created_at: '2026-07-01',
    products: [
      { id: '4', sku: 'CAPA001', name: 'Capa Silicone iPhone 15', cost: 8, stock: 3 },
      { id: '8', sku: 'LAMPADA001', name: 'Lâmpada LED Smart', cost: 45, stock: 62 },
      { id: '10', sku: 'FONE002', name: 'Fone Fio 3.5mm', cost: 18, stock: 95 },
    ],
    purchases: [
      { id: '3', date: '2026-08-05', invoice: 'NF-001236', items: 25, total: 12400, status: 'CONCLUIDA' },
    ],
    stats: { total_purchased: 18700, total_orders: 6, avg_ticket: 3117, products_count: 3 },
    timeline: [
      { date: '05/08', time: '09:00', action: 'Compra realizada', details: 'NF-001236 — 25 itens — R$ 12.400' },
      { date: '01/07', time: '10:00', action: 'Cadastro', details: 'Fornecedor cadastrado' },
    ],
  },
}

export function getSupplierDetail(id: string): SupplierDetail | null {
  return mockSupplierDetails[id] || null
}
