// Mock data service for TEKNIX
// Replace with Supabase data when ready

export const mockProducts = [
  { id: '1', sku: 'FONE001', name: 'Fone Bluetooth Pro', brand: 'Altomex', model: 'BT-500', ean: '7891234560001', category: 'Eletrônicos', supplier_id: '1', supplier_name: 'Fornecedor Tech SP', cost_purchase: 38, freight_purchase: 5, packaging_cost: 2, other_costs: 0, stock: 42, min_stock: 10, status: 'ACTIVE', cost_real: 45 },
  { id: '2', sku: 'PARA001', name: 'Parafusadeira 12V', brand: 'Vonder', model: 'PV-12', ean: '7891234560002', category: 'Ferramentas', supplier_id: '2', supplier_name: 'Fornecedor Alpha', cost_purchase: 72, freight_purchase: 8, packaging_cost: 3, other_costs: 0, stock: 18, min_stock: 5, status: 'ACTIVE', cost_real: 83 },
  { id: '3', sku: 'CABO001', name: 'Cabo USB-C 2m', brand: 'Baseus', model: 'U20', ean: '7891234560003', category: 'Acessórios', supplier_id: '1', supplier_name: 'Fornecedor Tech SP', cost_purchase: 12, freight_purchase: 1, packaging_cost: 1, other_costs: 0, stock: 180, min_stock: 30, status: 'ACTIVE', cost_real: 14 },
  { id: '4', sku: 'CAPA001', name: 'Capa Silicone iPhone 15', brand: 'Genérico', model: 'iP15-S', ean: '7891234560004', category: 'Capas', supplier_id: '3', supplier_name: 'Import Tech', cost_purchase: 8, freight_purchase: 1, packaging_cost: 0.5, other_costs: 0, stock: 3, min_stock: 15, status: 'ACTIVE', cost_real: 9.5 },
  { id: '5', sku: 'CARREG001', name: 'Carregador Turbo 65W', brand: 'Samsung', model: 'EP-T65', ean: '7891234560005', category: 'Eletrônicos', supplier_id: '1', supplier_name: 'Fornecedor Tech SP', cost_purchase: 55, freight_purchase: 6, packaging_cost: 3, other_costs: 0, stock: 0, min_stock: 5, status: 'OUT_OF_STOCK', cost_real: 64 },
  { id: '6', sku: 'MOUSE001', name: 'Mouse Gamer RGB', brand: 'Logitech', model: 'G203', ean: '7891234560006', category: 'Periféricos', supplier_id: '2', supplier_name: 'Fornecedor Alpha', cost_purchase: 95, freight_purchase: 7, packaging_cost: 4, other_costs: 0, stock: 28, min_stock: 8, status: 'ACTIVE', cost_real: 106 },
  { id: '7', sku: 'TECLADO001', name: 'Teclado Mecânico', brand: 'Redragon', model: 'Kumara', ean: '7891234560007', category: 'Periféricos', supplier_id: '2', supplier_name: 'Fornecedor Alpha', cost_purchase: 120, freight_purchase: 10, packaging_cost: 5, other_costs: 0, stock: 15, min_stock: 5, status: 'ACTIVE', cost_real: 135 },
  { id: '8', sku: 'LAMPADA001', name: 'Lâmpada LED Smart', brand: 'Xiaomi', model: 'Yeelight', ean: '7891234560008', category: 'Casa Inteligente', supplier_id: '3', supplier_name: 'Import Tech', cost_purchase: 45, freight_purchase: 4, packaging_cost: 2, other_costs: 0, stock: 62, min_stock: 10, status: 'ACTIVE', cost_real: 51 },
  { id: '9', sku: 'WEBCAM001', name: 'Webcam Full HD', brand: 'Logitech', model: 'C920', ean: '7891234560009', category: 'Periféricos', supplier_id: '1', supplier_name: 'Fornecedor Tech SP', cost_purchase: 180, freight_purchase: 12, packaging_cost: 5, other_costs: 0, stock: 8, min_stock: 3, status: 'ACTIVE', cost_real: 197 },
  { id: '10', sku: 'FONE002', name: 'Fone Fio 3.5mm', brand: 'Philips', model: 'SHM-31', ean: '7891234560010', category: 'Eletrônicos', supplier_id: '1', supplier_name: 'Fornecedor Tech SP', cost_purchase: 18, freight_purchase: 2, packaging_cost: 1, other_costs: 0, stock: 95, min_stock: 20, status: 'ACTIVE', cost_real: 21 },
]

export const mockSuppliers = [
  { id: '1', name: 'Fornecedor Tech SP', cnpj: '12.345.678/0001-90', contact: 'João Silva', phone: '(11) 99999-1234', whatsapp: '(11) 98888-1234', email: 'joao@techsp.com', city: 'São Paulo', state: 'SP', delivery_time: 3, products_count: 4, total_purchased: 45200, status: 'ACTIVE' },
  { id: '2', name: 'Fornecedor Alpha', cnpj: '98.765.432/0001-10', contact: 'Maria Santos', phone: '(11) 97777-5678', whatsapp: '(11) 96666-5678', email: 'maria@alpha.com', city: 'Campinas', state: 'SP', delivery_time: 5, products_count: 3, total_purchased: 28900, status: 'ACTIVE' },
  { id: '3', name: 'Import Tech', cnpj: '11.222.333/0001-44', contact: 'Carlos Chen', phone: '(11) 95555-9012', whatsapp: '(11) 94444-9012', email: 'carlos@importech.com', city: 'Guarulhos', state: 'SP', delivery_time: 15, products_count: 3, total_purchased: 18700, status: 'ACTIVE' },
]

export const mockPurchases = [
  { id: '1', date: '2026-08-15', supplier_name: 'Fornecedor Tech SP', invoice: 'NF-001234', items: 12, total_cost: 8940, status: 'CONCLUIDA' },
  { id: '2', date: '2026-08-10', supplier_name: 'Fornecedor Alpha', invoice: 'NF-001235', items: 8, total_cost: 5620, status: 'CONCLUIDA' },
  { id: '3', date: '2026-08-05', supplier_name: 'Import Tech', invoice: 'NF-001236', items: 25, total_cost: 12400, status: 'CONCLUIDA' },
  { id: '4', date: '2026-08-01', supplier_name: 'Fornecedor Tech SP', invoice: 'NF-001237', items: 15, total_cost: 6780, status: 'CONCLUIDA' },
]

export const mockOrders = [
  { id: '1', order_number: 'ML-98231', marketplace: 'Mercado Livre', customer: 'Carlos Silva', items: 2, total: 189.90, profit: 38.40, margin: 20.22, status: 'AGUARDANDO_SEPARACAO', date: '2026-08-17' },
  { id: '2', order_number: 'SHP-18291', marketplace: 'Shopee', customer: 'Ana Souza', items: 1, total: 89.90, profit: 21.30, margin: 23.69, status: 'EM_SEPARACAO', date: '2026-08-17' },
  { id: '3', order_number: 'ML-98232', marketplace: 'Mercado Livre', customer: 'Pedro Lima', items: 3, total: 349.70, profit: 72.50, margin: 20.73, status: 'SEPARADO', date: '2026-08-17' },
  { id: '4', order_number: 'TT-45123', marketplace: 'TikTok Shop', customer: 'Julia Ferreira', items: 1, total: 119.80, profit: 28.40, margin: 23.70, status: 'ENVIADO', date: '2026-08-16' },
  { id: '5', order_number: 'SHP-18292', marketplace: 'Shopee', customer: 'Marcos Oliveira', items: 2, total: 159.80, profit: 34.20, margin: 21.40, status: 'ENTREGUE', date: '2026-08-16' },
  { id: '6', order_number: 'AMZ-78432', marketplace: 'Amazon', customer: 'Lucia Santos', items: 1, total: 149.90, profit: 31.20, margin: 20.81, status: 'PAGO', date: '2026-08-16' },
  { id: '7', order_number: 'ML-98233', marketplace: 'Mercado Livre', customer: 'Roberto Alves', items: 4, total: 459.60, profit: 98.30, margin: 21.38, status: 'NOVO', date: '2026-08-17' },
  { id: '8', order_number: 'MAG-12345', marketplace: 'Magalu', customer: 'Fernanda Costa', items: 2, total: 239.80, profit: 52.10, margin: 21.72, status: 'CANCELADO', date: '2026-08-15' },
]

export const mockSales = [
  { id: '1', order_id: 'ML-98231', marketplace: 'Mercado Livre', product: 'Fone Bluetooth Pro', sku: 'FONE001', quantity: 1, revenue: 149.90, cost: 45, fees: 23.98, freight: 12.50, taxes: 17.99, profit: 31.20, margin: 20.81, date: '2026-08-17', status: 'COMPLETED' },
  { id: '2', order_id: 'SHP-18291', marketplace: 'Shopee', product: 'Cabo USB-C 2m', sku: 'CABO001', quantity: 2, revenue: 89.80, cost: 14, fees: 13.47, freight: 8.00, taxes: 10.78, profit: 28.40, margin: 31.63, date: '2026-08-17', status: 'COMPLETED' },
  { id: '3', order_id: 'ML-98232', marketplace: 'Mercado Livre', product: 'Mouse Gamer RGB', sku: 'MOUSE001', quantity: 2, revenue: 349.80, cost: 106, fees: 55.97, freight: 18.00, taxes: 41.98, profit: 72.50, margin: 20.73, date: '2026-08-17', status: 'COMPLETED' },
  { id: '4', order_id: 'TT-45123', marketplace: 'TikTok Shop', product: 'Carregador Turbo 65W', sku: 'CARREG001', quantity: 1, revenue: 119.80, cost: 64, fees: 17.97, freight: 9.50, taxes: 14.38, profit: 28.40, margin: 23.70, date: '2026-08-16', status: 'COMPLETED' },
  { id: '5', order_id: 'SHP-18292', marketplace: 'Shopee', product: 'Capa Silicone iPhone 15', sku: 'CAPA001', quantity: 2, revenue: 159.80, cost: 9.5, fees: 23.97, freight: 10.00, taxes: 19.18, profit: 34.20, margin: 21.40, date: '2026-08-16', status: 'COMPLETED' },
  { id: '6', order_id: 'AMZ-78432', marketplace: 'Amazon', product: 'Teclado Mecânico', sku: 'TECLADO001', quantity: 1, revenue: 149.90, cost: 135, fees: 22.49, freight: 14.00, taxes: 17.99, profit: -39.58, margin: -26.40, date: '2026-08-16', status: 'COMPLETED' },
]

export const mockMarketplaces = [
  { id: '1', name: 'Mercado Livre', code: 'ML', status: 'ACTIVE', sales: 820, revenue: 78430, profit: 20320, margin: 25.91, last_sync: '2026-08-17T15:30:00', color: '#FFE600' },
  { id: '2', name: 'Shopee', code: 'SHP', status: 'ACTIVE', sales: 456, revenue: 42180, profit: 10240, margin: 24.28, last_sync: '2026-08-17T15:25:00', color: '#EE4D2D' },
  { id: '3', name: 'TikTok Shop', code: 'TT', status: 'ACTIVE', sales: 198, revenue: 18920, profit: 4580, margin: 24.21, last_sync: '2026-08-17T15:20:00', color: '#000000' },
  { id: '4', name: 'Amazon', code: 'AMZ', status: 'ACTIVE', sales: 89, revenue: 12430, profit: 2840, margin: 22.85, last_sync: '2026-08-17T15:15:00', color: '#FF9900' },
  { id: '5', name: 'Magalu', code: 'MAG', status: 'INACTIVE', sales: 0, revenue: 0, profit: 0, margin: 0, last_sync: null, color: '#0066CC' },
]

export const mockFinancialData = {
  revenue: 124542.80,
  cost: 67890.40,
  fees: 18234.50,
  freight: 8940.20,
  taxes: 14892.65,
  profit: 32480.45,
  avgMargin: 26.08,
  monthlyData: [
    { month: 'Mar', revenue: 18200, profit: 4800 },
    { month: 'Abr', revenue: 19800, profit: 5200 },
    { month: 'Mai', revenue: 21400, profit: 5800 },
    { month: 'Jun', revenue: 22100, profit: 6100 },
    { month: 'Jul', revenue: 20500, profit: 5400 },
    { month: 'Ago', revenue: 22542, profit: 5180 },
  ],
}

export const mockNotifications = [
  { id: '1', type: 'sale', title: 'Nova venda', message: 'Pedido #ML-98231 — Fone Bluetooth Pro — R$ 149,90', is_read: false, created_at: '2026-08-17T15:32:00' },
  { id: '2', type: 'order', title: 'Pedido para separar', message: 'Pedido #ML-98231 aguardando separação', is_read: false, created_at: '2026-08-17T15:33:00' },
  { id: '3', type: 'stock', title: 'Estoque baixo', message: 'Capa Silicone iPhone 15 — 3 unidades (mínimo: 15)', is_read: false, created_at: '2026-08-17T14:20:00' },
  { id: '4', type: 'marketplace', title: 'Sincronizado', message: 'Mercado Livre — 23 pedidos atualizados', is_read: true, created_at: '2026-08-17T13:00:00' },
  { id: '5', type: 'alert', title: 'Venda abaixo da margem', message: 'Pedido #AMZ-78432 — Lucro negativo: -R$ 39,58', is_read: false, created_at: '2026-08-16T18:45:00' },
  { id: '6', type: 'order', title: 'Pedido entregue', message: 'Pedido #SHP-18292 — Marcos Oliveira', is_read: true, created_at: '2026-08-16T14:00:00' },
  { id: '7', type: 'sale', title: 'Nova venda', message: 'Pedido #SHP-18291 — 2x Cabo USB-C — R$ 89,80', is_read: true, created_at: '2026-08-17T12:15:00' },
]

export const mockUsers = [
  { id: '1', name: 'Alison', email: 'alison@teknix.com', role: 'ADMIN', status: 'ACTIVE', last_login: '2026-08-17T15:30:00', created_at: '2026-08-10' },
  { id: '2', name: 'Maria Souza', email: 'maria@teknix.com', role: 'SEPARADOR', status: 'ACTIVE', last_login: '2026-08-17T14:00:00', created_at: '2026-08-12' },
  { id: '3', name: 'Pedro Lima', email: 'pedro@teknix.com', role: 'FINANCEIRO', status: 'ACTIVE', last_login: '2026-08-17T10:00:00', created_at: '2026-08-13' },
]

export const mockDashboardStats = {
  totalRevenue: 124542.80,
  totalSales: 1526,
  totalOrders: 1284,
  totalProfit: 32480.45,
  avgMargin: 26.08,
  totalProducts: 248,
  totalStock: 1842,
  lowStock: 17,
}
