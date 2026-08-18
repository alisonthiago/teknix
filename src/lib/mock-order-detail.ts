export interface OrderDetail {
  id: string
  order_number: string
  marketplace: string
  customer: { name: string; email: string; phone: string; cpf: string }
  date: string
  status: string
  items: Array<{ sku: string; name: string; quantity: number; price: number; total: number }>
  payment: { method: string; installments: number; total: number; fee: number; net: number }
  shipping: { address: string; city: string; state: string; zip: string; method: string; cost: number; tracking: string }
  timeline: Array<{ date: string; time: string; status: string; description: string }>
}

export const mockOrderDetails: Record<string, OrderDetail> = {
  '1': {
    id: '1', order_number: 'ML-98231', marketplace: 'Mercado Livre', date: '2026-08-17', status: 'AGUARDANDO_SEPARACAO',
    customer: { name: 'Carlos Silva', email: 'carlos@email.com', phone: '(11) 99999-0000', cpf: '123.456.789-00' },
    items: [
      { sku: 'FONE001', name: 'Fone Bluetooth Pro', quantity: 1, price: 149.90, total: 149.90 },
      { sku: 'CABO001', name: 'Cabo USB-C 2m', quantity: 1, price: 39.90, total: 39.90 },
    ],
    payment: { method: 'PIX', installments: 1, total: 189.90, fee: 9.49, net: 180.41 },
    shipping: { address: 'Rua das Flores, 123', city: 'São Paulo', state: 'SP', zip: '01234-567', method: 'SEDEX', cost: 12.50, tracking: 'BR123456789' },
    timeline: [
      { date: '17/08', time: '15:30', status: 'CRIADO', description: 'Pedido criado no Mercado Livre' },
      { date: '17/08', time: '15:31', status: 'PAGO', description: 'Pagamento confirmado via PIX' },
      { date: '17/08', time: '15:32', status: 'AGUARDANDO_SEPARACAO', description: 'Aguardando separação' },
    ],
  },
  '2': {
    id: '2', order_number: 'SHP-18291', marketplace: 'Shopee', date: '2026-08-17', status: 'EM_SEPARACAO',
    customer: { name: 'Ana Souza', email: 'ana@email.com', phone: '(21) 98888-0000', cpf: '987.654.321-00' },
    items: [
      { sku: 'CABO001', name: 'Cabo USB-C 2m', quantity: 2, price: 44.90, total: 89.80 },
    ],
    payment: { method: 'Cartão de Crédito', installments: 3, total: 89.90, fee: 8.09, net: 81.81 },
    shipping: { address: 'Av. Brasil, 456', city: 'Rio de Janeiro', state: 'RJ', zip: '22000-000', method: 'PAC', cost: 8.00, tracking: 'BR987654321' },
    timeline: [
      { date: '17/08', time: '10:15', status: 'CRIADO', description: 'Pedido criado na Shopee' },
      { date: '17/08', time: '10:16', status: 'PAGO', description: 'Pagamento aprovado' },
      { date: '17/08', time: '14:00', status: 'EM_SEPARACAO', description: 'Iniciado separação' },
    ],
  },
  '3': {
    id: '3', order_number: 'ML-98232', marketplace: 'Mercado Livre', date: '2026-08-17', status: 'SEPARADO',
    customer: { name: 'Pedro Lima', email: 'pedro@email.com', phone: '(31) 97777-0000', cpf: '456.789.123-00' },
    items: [
      { sku: 'MOUSE001', name: 'Mouse Gamer RGB', quantity: 2, price: 174.90, total: 349.80 },
    ],
    payment: { method: 'PIX', installments: 1, total: 349.70, fee: 17.49, net: 332.21 },
    shipping: { address: 'Rua Minas, 789', city: 'Belo Horizonte', state: 'MG', zip: '30000-000', method: 'SEDEX', cost: 18.00, tracking: 'BR456789123' },
    timeline: [
      { date: '17/08', time: '08:00', status: 'CRIADO', description: 'Pedido criado' },
      { date: '17/08', time: '08:01', status: 'PAGO', description: 'Pagamento confirmado' },
      { date: '17/08', time: '09:30', status: 'EM_SEPARACAO', description: 'Separação iniciada' },
      { date: '17/08', time: '11:00', status: 'SEPARADO', description: 'Pedido separado' },
    ],
  },
  '4': {
    id: '4', order_number: 'TT-45123', marketplace: 'TikTok Shop', date: '2026-08-16', status: 'ENVIADO',
    customer: { name: 'Julia Ferreira', email: 'julia@email.com', phone: '(41) 96666-0000', cpf: '321.654.987-00' },
    items: [
      { sku: 'CARREG001', name: 'Carregador Turbo 65W', quantity: 1, price: 119.80, total: 119.80 },
    ],
    payment: { method: 'PIX', installments: 1, total: 119.80, fee: 5.99, net: 113.81 },
    shipping: { address: 'Rua Paraná, 321', city: 'Curitiba', state: 'PR', zip: '80000-000', method: 'SEDEX', cost: 9.50, tracking: 'BR321654987' },
    timeline: [
      { date: '16/08', time: '16:00', status: 'CRIADO', description: 'Pedido criado' },
      { date: '16/08', time: '16:01', status: 'PAGO', description: 'Pagamento confirmado' },
      { date: '16/08', time: '17:30', status: 'SEPARADO', description: 'Separado' },
      { date: '16/08', time: '18:00', status: 'ENVIADO', description: 'Enviado via SEDEX' },
    ],
  },
  '5': {
    id: '5', order_number: 'SHP-18292', marketplace: 'Shopee', date: '2026-08-16', status: 'ENTREGUE',
    customer: { name: 'Marcos Oliveira', email: 'marcos@email.com', phone: '(51) 95555-0000', cpf: '654.321.987-00' },
    items: [
      { sku: 'CAPA001', name: 'Capa Silicone iPhone 15', quantity: 2, price: 79.90, total: 159.80 },
    ],
    payment: { method: 'Cartão de Crédito', installments: 2, total: 159.80, fee: 14.38, net: 145.42 },
    shipping: { address: 'Av. Ipiranga, 654', city: 'Porto Alegre', state: 'RS', zip: '90000-000', method: 'PAC', cost: 10.00, tracking: 'BR654321987' },
    timeline: [
      { date: '16/08', time: '09:00', status: 'CRIADO', description: 'Pedido criado' },
      { date: '16/08', time: '09:01', status: 'PAGO', description: 'Pagamento aprovado' },
      { date: '16/08', time: '10:30', status: 'SEPARADO', description: 'Separado' },
      { date: '16/08', time: '11:00', status: 'ENVIADO', description: 'Enviado' },
      { date: '16/08', time: '14:00', status: 'ENTREGUE', description: 'Entregue ao destinatário' },
    ],
  },
  '6': {
    id: '6', order_number: 'AMZ-78432', marketplace: 'Amazon', date: '2026-08-16', status: 'PAGO',
    customer: { name: 'Lucia Santos', email: 'lucia@email.com', phone: '(61) 94444-0000', cpf: '111.222.333-44' },
    items: [
      { sku: 'TECLADO001', name: 'Teclado Mecânico', quantity: 1, price: 149.90, total: 149.90 },
    ],
    payment: { method: 'Boleto', installments: 1, total: 149.90, fee: 7.49, net: 142.41 },
    shipping: { address: 'SQN 308, Bloco A, Apt 101', city: 'Brasília', state: 'DF', zip: '70000-000', method: 'Logística Amazon', cost: 14.00, tracking: 'AMZ987123456' },
    timeline: [
      { date: '16/08', time: '12:00', status: 'CRIADO', description: 'Pedido criado' },
      { date: '16/08', time: '18:00', status: 'PAGO', description: 'Boleto pago' },
    ],
  },
  '7': {
    id: '7', order_number: 'ML-98233', marketplace: 'Mercado Livre', date: '2026-08-17', status: 'NOVO',
    customer: { name: 'Roberto Alves', email: 'roberto@email.com', phone: '(81) 93333-0000', cpf: '222.333.444-55' },
    items: [
      { sku: 'FONE001', name: 'Fone Bluetooth Pro', quantity: 1, price: 149.90, total: 149.90 },
      { sku: 'CABO001', name: 'Cabo USB-C 2m', quantity: 2, price: 39.90, total: 79.80 },
      { sku: 'LAMPADA001', name: 'Lâmpada LED Smart', quantity: 1, price: 89.90, total: 89.90 },
      { sku: 'MOUSE001', name: 'Mouse Gamer RGB', quantity: 1, price: 139.90, total: 139.90 },
    ],
    payment: { method: 'PIX', installments: 1, total: 459.60, fee: 22.98, net: 436.62 },
    shipping: { address: 'Rua da Bahia, 111', city: 'Salvador', state: 'BA', zip: '40000-000', method: 'SEDEX', cost: 22.00, tracking: 'BR111222333' },
    timeline: [
      { date: '17/08', time: '16:00', status: 'CRIADO', description: 'Pedido criado' },
    ],
  },
  '8': {
    id: '8', order_number: 'MAG-12345', marketplace: 'Magalu', date: '2026-08-15', status: 'CANCELADO',
    customer: { name: 'Fernanda Costa', email: 'fernanda@email.com', phone: '(71) 92222-0000', cpf: '555.666.777-88' },
    items: [
      { sku: 'WEBCAM001', name: 'Webcam Full HD', quantity: 1, price: 199.90, total: 199.90 },
      { sku: 'FONE002', name: 'Fone Fio 3.5mm', quantity: 1, price: 39.90, total: 39.90 },
    ],
    payment: { method: 'Cartão de Crédito', installments: 4, total: 239.80, fee: 21.58, net: 218.22 },
    shipping: { address: 'Rua Chile, 222', city: 'Salvador', state: 'BA', zip: '40000-000', method: 'PAC', cost: 15.00, tracking: '' },
    timeline: [
      { date: '15/08', time: '10:00', status: 'CRIADO', description: 'Pedido criado' },
      { date: '15/08', time: '10:01', status: 'PAGO', description: 'Pagamento confirmado' },
      { date: '15/08', time: '14:00', status: 'CANCELADO', description: 'Cancelado pelo cliente' },
    ],
  },
}

export function getOrderDetail(id: string): OrderDetail | null {
  return mockOrderDetails[id] || null
}
