-- ============================================================
-- TEKNIX - Seed de Dados Reais (CORRIGIDO para schemas reais)
-- Execute no Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- ============================================================
-- 0. MARKETPLACES (6 marketplaces)
-- ============================================================

INSERT INTO marketplaces (id, name, code, status, default_percentage_fee, default_fixed_fee, default_tax, default_freight, default_ads_fee, other_fees, notes)
VALUES
  (gen_random_uuid(), 'Mercado Livre', 'MERCADO_LIVRE', 'ACTIVE', 16.00, 4.00, 11.00, 0, 8.00, 0, 'Marketplace mais usado no Brasil - comissao media 16%'),
  (gen_random_uuid(), 'Shopee', 'SHOPEE', 'ACTIVE', 20.00, 4.00, 11.00, 0, 10.00, 0, 'Marketplace com alta competitividade - comissao media 20%'),
  (gen_random_uuid(), 'Amazon BR', 'AMAZON', 'ACTIVE', 15.00, 3.00, 11.00, 0, 5.00, 0, 'FBA disponivel - comissao media 15%'),
  (gen_random_uuid(), 'Magalu', 'MAGALU', 'ACTIVE', 14.00, 5.00, 11.00, 0, 6.00, 0, 'Marketplace tradicional brasileiro'),
  (gen_random_uuid(), 'TikTok Shop', 'TIKTOK', 'ACTIVE', 8.00, 2.00, 11.00, 0, 12.00, 0, 'Marketplace novo - comissao mais baixa mas taxa de conversao variavel'),
  (gen_random_uuid(), 'AliExpress', 'ALIEXPRESS', 'ACTIVE', 10.00, 3.00, 11.00, 0, 5.00, 0, 'Dropshipping e importacao direta');

-- ============================================================
-- 1. SUPPLIERS (5 fornecedores) - SEM user_id
-- ============================================================

INSERT INTO suppliers (id, name, legal_name, cnpj, contact, phone, whatsapp, email, city, state, delivery_time, min_order, freight, payment_terms, notes)
VALUES
  (gen_random_uuid(), 'TechParts Distribuidora', 'TechParts Distribuidora LTDA', '12.345.678/0001-90', 'Carlos Mendes', '(11) 3456-7890', '(11) 99876-5432', 'contato@techparts.com.br', 'Sao Paulo', 'SP', 7, 500.00, 0, '30/60/90 dias', 'Fornecedor principal de acessorios eletronicos'),
  (gen_random_uuid(), 'Casa do Acessorio', 'Casa do Acessorio ME', '23.456.789/0001-01', 'Fernanda Costa', '(21) 2345-6789', '(21) 98765-4321', 'vendas@casadoacessorio.com.br', 'Rio de Janeiro', 'RJ', 5, 300.00, 25.00, 'Pix ou Boleto 15 dias', 'Distribuidor regional'),
  (gen_random_uuid(), 'ImportZone Comercio Exterior', 'ImportZone Comercio Exterior LTDA', '34.567.890/0001-12', 'Roberto Tanaka', '(41) 3456-1234', '(41) 99123-4567', 'comercial@importzone.com.br', 'Curitiba', 'PR', 15, 1000.00, 0, 'Adiantado ou 30 dias', 'Importador direto'),
  (gen_random_uuid(), 'MaxPhone Pecas', 'MaxPhone Pecas e Acessorios ME', '45.678.901/0001-23', 'Andre Oliveira', '(31) 3456-5678', '(31) 98567-4321', 'maxphone@gmail.com', 'Belo Horizonte', 'MG', 4, 200.00, 15.00, 'Pix ou Boleto 7 dias', 'Especialista em capas e acessorios'),
  (gen_random_uuid(), 'GlobalTech Comercial', 'GlobalTech Comercial LTDA', '56.789.012/0001-34', 'Patricia Lima', '(19) 3456-9012', '(19) 99012-3456', 'globaltech@globaltech.com.br', 'Campinas', 'SP', 3, 150.00, 18.00, 'Pix 5% desconto, Boleto 15 dias', 'Distribuidor geral - entrega rapida em SP');

-- ============================================================
-- 2. PRODUCTS (20 produtos) - SEM user_id, SEM max_stock, SEM location
-- status usa enum: ACTIVE, INACTIVE, OUT_OF_STOCK
-- ============================================================

INSERT INTO products (id, sku, name, brand, model, category, supplier_id, cost_purchase, freight_purchase, packaging_cost, other_costs, weight, stock, min_stock, status)
VALUES
  (gen_random_uuid(), 'FONE001', 'Fone de ouvido Bluetooth TWS Pro', 'SoundMax', 'SM-TWS500', 'Fones', (SELECT id FROM suppliers WHERE name = 'TechParts Distribuidora'), 18.00, 1.50, 0.80, 0, 0.05, 150, 30, 'ACTIVE'),
  (gen_random_uuid(), 'FONE002', 'Fone de ouvido com fio 3.5mm Bass', 'SoundMax', 'SM-BASS30', 'Fones', (SELECT id FROM suppliers WHERE name = 'Casa do Acessorio'), 5.50, 0.80, 0.50, 0, 0.03, 200, 50, 'ACTIVE'),
  (gen_random_uuid(), 'CABO001', 'Cabo USB-C 1m Rapido Carga e Dados', 'CaboTech', 'CT-USBC1', 'Cabos', (SELECT id FROM suppliers WHERE name = 'TechParts Distribuidora'), 4.00, 0.50, 0.30, 0, 0.02, 300, 80, 'ACTIVE'),
  (gen_random_uuid(), 'CABO002', 'Cabo USB-C 2m Rapido Carga e Dados', 'CaboTech', 'CT-USBC2', 'Cabos', (SELECT id FROM suppliers WHERE name = 'TechParts Distribuidora'), 6.00, 0.60, 0.30, 0, 0.03, 250, 60, 'ACTIVE'),
  (gen_random_uuid(), 'CABO003', 'Cabo Lightning 1m Para iPhone', 'CaboTech', 'CT-LTN1', 'Cabos', (SELECT id FROM suppliers WHERE name = 'ImportZone Comercio Exterior'), 7.50, 0.70, 0.30, 0, 0.02, 180, 40, 'ACTIVE'),
  (gen_random_uuid(), 'CABO004', 'Cabo Micro USB 1m Carga Rapida', 'CaboTech', 'CT-MUSB1', 'Cabos', (SELECT id FROM suppliers WHERE name = 'ImportZone Comercio Exterior'), 3.50, 0.40, 0.25, 0, 0.02, 220, 50, 'ACTIVE'),
  (gen_random_uuid(), 'CAR001', 'Carregador Portatil PowerBank 10000mAh', 'PowerUp', 'PU-10K', 'Carregadores', (SELECT id FROM suppliers WHERE name = 'TechParts Distribuidora'), 28.00, 2.50, 1.50, 0, 0.25, 80, 20, 'ACTIVE'),
  (gen_random_uuid(), 'CAR002', 'Carregador Portatil PowerBank 20000mAh', 'PowerUp', 'PU-20K', 'Carregadores', (SELECT id FROM suppliers WHERE name = 'TechParts Distribuidora'), 45.00, 3.50, 2.00, 0, 0.45, 60, 15, 'ACTIVE'),
  (gen_random_uuid(), 'CHA001', 'Carregador Turbo 20W USB-C PD', 'ChargePro', 'CP-20W', 'Carregadores', (SELECT id FROM suppliers WHERE name = 'Casa do Acessorio'), 15.00, 1.20, 0.80, 0, 0.08, 120, 30, 'ACTIVE'),
  (gen_random_uuid(), 'CHA002', 'Carregador Turbo 65W USB-C GaN', 'ChargePro', 'CP-65W', 'Carregadores', (SELECT id FROM suppliers WHERE name = 'ImportZone Comercio Exterior'), 35.00, 2.00, 1.20, 0, 0.12, 70, 20, 'ACTIVE'),
  (gen_random_uuid(), 'PEL001', 'Pelicula de Vidro Samsung Galaxy S24', 'ScreenGuard', 'SG-S24', 'Peliculas', (SELECT id FROM suppliers WHERE name = 'Casa do Acessorio'), 3.00, 0.30, 0.40, 0, 0.01, 500, 100, 'ACTIVE'),
  (gen_random_uuid(), 'PEL002', 'Pelicula de Vidro iPhone 15', 'ScreenGuard', 'SG-iP15', 'Peliculas', (SELECT id FROM suppliers WHERE name = 'Casa do Acessorio'), 3.50, 0.30, 0.40, 0, 0.01, 450, 100, 'ACTIVE'),
  (gen_random_uuid(), 'PEL003', 'Pelicula de Vidro Xiaomi Redmi Note 12', 'ScreenGuard', 'SG-RN12', 'Peliculas', (SELECT id FROM suppliers WHERE name = 'MaxPhone Pecas'), 2.80, 0.30, 0.35, 0, 0.01, 350, 80, 'ACTIVE'),
  (gen_random_uuid(), 'CAP001', 'Capa Silicone Samsung Galaxy S24', 'CasePro', 'CP-S24S', 'Capas', (SELECT id FROM suppliers WHERE name = 'MaxPhone Pecas'), 6.00, 0.60, 0.50, 0, 0.03, 180, 40, 'ACTIVE'),
  (gen_random_uuid(), 'CAP002', 'Capa Silicone iPhone 15', 'CasePro', 'CP-iP15S', 'Capas', (SELECT id FROM suppliers WHERE name = 'MaxPhone Pecas'), 7.00, 0.60, 0.50, 0, 0.03, 160, 40, 'ACTIVE'),
  (gen_random_uuid(), 'CAP003', 'Capa com Estojo Samsung Galaxy S24', 'CasePro', 'CP-S24F', 'Capas', (SELECT id FROM suppliers WHERE name = 'Casa do Acessorio'), 12.00, 0.90, 0.80, 0, 0.06, 90, 25, 'ACTIVE'),
  (gen_random_uuid(), 'APO001', 'Apoiador para Notebook Dobravel Aluminum', 'ErgoTech', 'ET-NB01', 'Suportes', (SELECT id FROM suppliers WHERE name = 'GlobalTech Comercial'), 8.00, 1.00, 0.60, 0, 0.15, 100, 20, 'ACTIVE'),
  (gen_random_uuid(), 'APO002', 'Apoiador para Celular Universal Ajustavel', 'ErgoTech', 'ET-CP01', 'Suportes', (SELECT id FROM suppliers WHERE name = 'GlobalTech Comercial'), 5.00, 0.50, 0.40, 0, 0.08, 140, 30, 'ACTIVE'),
  (gen_random_uuid(), 'SUP001', 'Suporte para Carro Ventosa 360', 'AutoMount', 'AM-V360', 'Suportes', (SELECT id FROM suppliers WHERE name = 'GlobalTech Comercial'), 10.00, 0.80, 0.60, 0, 0.10, 110, 25, 'ACTIVE'),
  (gen_random_uuid(), 'SUP002', 'Suporte para Mesa Articulado Aluminum', 'AutoMount', 'AM-ART01', 'Suportes', (SELECT id FROM suppliers WHERE name = 'ImportZone Comercio Exterior'), 14.00, 1.20, 0.80, 0, 0.20, 75, 20, 'ACTIVE')
ON CONFLICT (sku) DO NOTHING;

-- ============================================================
-- 3. ORDERS (8 pedidos) - usa colunas reais da tabela
-- ============================================================

INSERT INTO orders (id, user_id, marketplace_id, order_number, customer_name, customer_phone, status, total_amount, total_cost, total_fees, total_freight, total_taxes, profit, margin, tracking_code, carrier, shipped_at, delivered_at)
VALUES
  (gen_random_uuid(), '6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM marketplaces WHERE code = 'MERCADO_LIVRE'), 'ML-2024-00001', 'Joao Pedro Silva', '(11) 97654-3210', 'ENTREGUE', 254.50, 48.00, 45.71, 0, 27.99, 132.80, 52.18, 'ML123456789BR', 'Correios SEDEX', NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), '6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM marketplaces WHERE code = 'SHOPEE'), 'SH-2024-00002', 'Maria Clara Souza', '(21) 99876-1234', 'ENVIADO', 199.50, 34.00, 39.90, 0, 21.95, 103.65, 51.96, 'SH9876543210', 'Jadlog', NOW() - INTERVAL '3 days', NULL),
  (gen_random_uuid(), '6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM marketplaces WHERE code = 'AMAZON'), 'AM-2024-00003', 'Lucas Ferreira', '(31) 98765-4321', 'SEPARADO', 189.70, 40.00, 28.46, 0, 20.87, 100.37, 52.91, NULL, NULL, NULL, NULL),
  (gen_random_uuid(), '6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM marketplaces WHERE code = 'MAGALU'), 'MG-2024-00004', 'Ana Beatriz Santos', '(41) 99123-4567', 'EM_SEPARACAO', 149.60, 28.50, 26.93, 0, 16.46, 77.71, 51.94, NULL, NULL, NULL, NULL),
  (gen_random_uuid(), '6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM marketplaces WHERE code = 'MERCADO_LIVRE'), 'ML-2024-00005', 'Ricardo Almeida', '(19) 98012-3456', 'AGUARDANDO_SEPARACAO', 269.60, 61.00, 48.13, 0, 29.66, 130.81, 48.52, NULL, NULL, NULL, NULL),
  (gen_random_uuid(), '6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM marketplaces WHERE code = 'SHOPEE'), 'SH-2024-00006', 'Camila Rodrigues', '(11) 97123-4568', 'PAGO', 184.20, 25.50, 36.84, 0, 20.26, 101.60, 55.16, NULL, NULL, NULL, NULL),
  (gen_random_uuid(), '6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM marketplaces WHERE code = 'AMAZON'), 'AM-2024-00007', 'Fernando Costa', '(21) 99654-3210', 'NOVO', 149.60, 29.00, 22.44, 0, 16.46, 81.70, 54.61, NULL, NULL, NULL, NULL),
  (gen_random_uuid(), '6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM marketplaces WHERE code = 'MERCADO_LIVRE'), 'ML-2024-00008', 'Patricia Mendes', '(31) 98432-1098', 'CANCELADO', 279.80, 63.00, 0, 0, 0, 0, 0, NULL, NULL, NULL, NULL);

-- ============================================================
-- 4. ORDER ITEMS
-- ============================================================

INSERT INTO order_items (order_id, product_id, sku, quantity, unit_price, unit_cost, fees, freight, taxes, profit, margin, status)
VALUES
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00001'), (SELECT id FROM products WHERE sku = 'FONE001'), 'FONE001', 2, 89.90, 20.30, 29.47, 0, 19.78, 100.55, 55.91, 'CONCLUIDO'),
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00001'), (SELECT id FROM products WHERE sku = 'CABO001'), 'CABO001', 3, 24.90, 5.60, 16.24, 0, 8.21, 45.85, 61.37, 'CONCLUIDO'),
  ((SELECT id FROM orders WHERE order_number = 'SH-2024-00002'), (SELECT id FROM products WHERE sku = 'CHA001'), 'CHA001', 1, 59.90, 17.00, 11.98, 0, 6.59, 24.33, 40.62, 'CONCLUIDO'),
  ((SELECT id FROM orders WHERE order_number = 'SH-2024-00002'), (SELECT id FROM products WHERE sku = 'CAP001'), 'CAP001', 2, 39.90, 7.10, 15.96, 0, 8.78, 18.06, 45.27, 'CONCLUIDO'),
  ((SELECT id FROM orders WHERE order_number = 'SH-2024-00002'), (SELECT id FROM products WHERE sku = 'PEL002'), 'PEL002', 2, 29.90, 4.20, 11.96, 0, 6.58, 17.16, 57.39, 'CONCLUIDO'),
  ((SELECT id FROM orders WHERE order_number = 'AM-2024-00003'), (SELECT id FROM products WHERE sku = 'CAR001'), 'CAR001', 1, 119.90, 32.00, 17.99, 0, 13.19, 56.72, 47.30, 'PENDENTE'),
  ((SELECT id FROM orders WHERE order_number = 'AM-2024-00003'), (SELECT id FROM products WHERE sku = 'CABO002'), 'CABO002', 2, 34.90, 7.30, 10.47, 0, 7.68, 43.65, 62.57, 'PENDENTE'),
  ((SELECT id FROM orders WHERE order_number = 'MG-2024-00004'), (SELECT id FROM products WHERE sku = 'FONE002'), 'FONE002', 3, 29.90, 6.80, 10.76, 0, 9.87, 42.27, 47.13, 'PENDENTE'),
  ((SELECT id FROM orders WHERE order_number = 'MG-2024-00004'), (SELECT id FROM products WHERE sku = 'CAP003'), 'CAP003', 1, 59.90, 13.70, 10.78, 0, 6.59, 28.83, 48.14, 'PENDENTE'),
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00005'), (SELECT id FROM products WHERE sku = 'SUP001'), 'SUP001', 1, 49.90, 11.80, 7.98, 0, 5.49, 24.63, 49.36, 'PENDENTE'),
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00005'), (SELECT id FROM products WHERE sku = 'CHA002'), 'CHA002', 1, 139.90, 38.20, 22.38, 0, 15.39, 63.93, 45.68, 'PENDENTE'),
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00005'), (SELECT id FROM products WHERE sku = 'APO001'), 'APO001', 2, 39.90, 10.00, 12.78, 0, 8.78, 8.34, 20.90, 'PENDENTE'),
  ((SELECT id FROM orders WHERE order_number = 'SH-2024-00006'), (SELECT id FROM products WHERE sku = 'PEL001'), 'PEL001', 5, 24.90, 3.70, 24.90, 0, 13.70, 66.20, 53.17, 'PENDENTE'),
  ((SELECT id FROM orders WHERE order_number = 'SH-2024-00006'), (SELECT id FROM products WHERE sku = 'CABO004'), 'CABO004', 3, 19.90, 4.15, 11.94, 0, 6.56, 35.40, 59.26, 'PENDENTE'),
  ((SELECT id FROM orders WHERE order_number = 'AM-2024-00007'), (SELECT id FROM products WHERE sku = 'APO002'), 'APO002', 3, 29.90, 5.90, 10.46, 0, 9.87, 63.47, 70.74, 'PENDENTE'),
  ((SELECT id FROM orders WHERE order_number = 'AM-2024-00007'), (SELECT id FROM products WHERE sku = 'SUP002'), 'SUP002', 1, 59.90, 16.00, 11.98, 0, 6.59, 25.33, 42.29, 'PENDENTE'),
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00008'), (SELECT id FROM products WHERE sku = 'CAR002'), 'CAR002', 1, 189.90, 48.50, 0, 0, 0, 0, 0, 'CANCELADO'),
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00008'), (SELECT id FROM products WHERE sku = 'FONE001'), 'FONE001', 1, 89.90, 20.30, 0, 0, 0, 0, 0, 'CANCELADO');

-- ============================================================
-- 5. SALES (6 vendas) - SEM user_id
-- ============================================================

INSERT INTO sales (id, date, order_id, marketplace_id, total_revenue, status)
VALUES
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '12 days', 'ML-2024-00001', (SELECT id FROM marketplaces WHERE code = 'MERCADO_LIVRE'), 254.50, 'COMPLETED'),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '5 days', 'SH-2024-00002', (SELECT id FROM marketplaces WHERE code = 'SHOPEE'), 199.50, 'COMPLETED'),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '8 days', 'ML-VENDA-001', (SELECT id FROM marketplaces WHERE code = 'MERCADO_LIVRE'), 149.70, 'COMPLETED'),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '3 days', 'AM-VENDA-001', (SELECT id FROM marketplaces WHERE code = 'AMAZON'), 239.70, 'COMPLETED'),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '1 day', 'SH-VENDA-001', (SELECT id FROM marketplaces WHERE code = 'SHOPEE'), 99.70, 'COMPLETED'),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '6 days', 'MG-VENDA-001', (SELECT id FROM marketplaces WHERE code = 'MAGALU'), 209.50, 'COMPLETED');

-- ============================================================
-- 6. SALE ITEMS - SEM user_id
-- ============================================================

INSERT INTO sale_items (sale_id, product_id, sku, quantity, unit_price, total_revenue, fees, taxes, freight, other_costs, cogs, profit, margin)
VALUES
  ((SELECT id FROM sales WHERE order_id = 'ML-2024-00001' LIMIT 1), (SELECT id FROM products WHERE sku = 'FONE001'), 'FONE001', 2, 89.90, 179.80, 33.76, 19.78, 0, 0, 40.60, 85.66, 47.64),
  ((SELECT id FROM sales WHERE order_id = 'ML-2024-00001' LIMIT 1), (SELECT id FROM products WHERE sku = 'CABO001'), 'CABO001', 3, 24.90, 74.70, 11.95, 8.21, 0, 0, 16.80, 47.74, 63.91),
  ((SELECT id FROM sales WHERE order_id = 'SH-2024-00002' LIMIT 1), (SELECT id FROM products WHERE sku = 'CHA001'), 'CHA001', 1, 59.90, 59.90, 11.98, 6.59, 0, 0, 17.00, 24.33, 40.62),
  ((SELECT id FROM sales WHERE order_id = 'SH-2024-00002' LIMIT 1), (SELECT id FROM products WHERE sku = 'CAP001'), 'CAP001', 2, 39.90, 79.80, 15.96, 8.78, 0, 0, 14.20, 40.86, 51.20),
  ((SELECT id FROM sales WHERE order_id = 'SH-2024-00002' LIMIT 1), (SELECT id FROM products WHERE sku = 'PEL002'), 'PEL002', 2, 29.90, 59.80, 11.96, 6.58, 0, 0, 8.40, 32.86, 54.95),
  ((SELECT id FROM sales WHERE order_id = 'ML-VENDA-001' LIMIT 1), (SELECT id FROM products WHERE sku = 'CAR001'), 'CAR001', 1, 119.90, 119.90, 24.18, 13.19, 0, 0, 32.00, 50.53, 42.14),
  ((SELECT id FROM sales WHERE order_id = 'ML-VENDA-001' LIMIT 1), (SELECT id FROM products WHERE sku = 'CABO003'), 'CABO003', 1, 29.80, 29.80, 4.77, 3.28, 0, 0, 8.50, 13.25, 44.46),
  ((SELECT id FROM sales WHERE order_id = 'AM-VENDA-001' LIMIT 1), (SELECT id FROM products WHERE sku = 'CAR002'), 'CAR002', 1, 189.90, 189.90, 28.49, 20.89, 0, 0, 48.50, 92.02, 48.46),
  ((SELECT id FROM sales WHERE order_id = 'AM-VENDA-001' LIMIT 1), (SELECT id FROM products WHERE sku = 'CHA002'), 'CHA002', 1, 49.80, 49.80, 7.47, 5.48, 0, 0, 37.00, -0.15, -0.30),
  ((SELECT id FROM sales WHERE order_id = 'SH-VENDA-001' LIMIT 1), (SELECT id FROM products WHERE sku = 'SUP001'), 'SUP001', 1, 49.90, 49.90, 9.98, 5.49, 0, 0, 11.80, 22.63, 45.35),
  ((SELECT id FROM sales WHERE order_id = 'SH-VENDA-001' LIMIT 1), (SELECT id FROM products WHERE sku = 'APO001'), 'APO001', 1, 49.80, 49.80, 9.96, 5.48, 0, 0, 10.00, 24.36, 48.92),
  ((SELECT id FROM sales WHERE order_id = 'MG-VENDA-001' LIMIT 1), (SELECT id FROM products WHERE sku = 'CHA002'), 'CHA002', 1, 139.90, 139.90, 25.18, 15.39, 0, 0, 38.20, 61.13, 43.69),
  ((SELECT id FROM sales WHERE order_id = 'MG-VENDA-001' LIMIT 1), (SELECT id FROM products WHERE sku = 'PEL003'), 'PEL003', 3, 23.20, 69.60, 12.53, 7.66, 0, 0, 9.45, 39.96, 57.42);

-- ============================================================
-- 7. PURCHASES (4 compras) - SEM user_id
-- ============================================================

INSERT INTO purchases (id, date, supplier_id, invoice, total_cost, payment_method, notes)
VALUES
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '30 days', (SELECT id FROM suppliers WHERE name = 'TechParts Distribuidora'), 'NF-2024-TP-001', 5280.00, 'Boleto 30 dias', 'Compra de estoque mensal - fones e cabos'),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '20 days', (SELECT id FROM suppliers WHERE name = 'Casa do Acessorio'), 'NF-2024-CA-002', 2475.00, 'Pix', 'Peliculas e carregadores'),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '45 days', (SELECT id FROM suppliers WHERE name = 'ImportZone Comercio Exterior'), 'NF-2024-IZ-003', 4200.00, 'Adiantado', 'Compra de importacao - cabos e acessorios'),
  (gen_random_uuid(), CURRENT_DATE - INTERVAL '10 days', (SELECT id FROM suppliers WHERE name = 'GlobalTech Comercial'), 'NF-2024-GT-004', 1680.00, 'Pix', 'Suportes e apoiadores');

-- ============================================================
-- 8. PURCHASE ITEMS - SEM user_id
-- ============================================================

INSERT INTO purchase_items (purchase_id, product_id, sku, quantity, unit_cost, freight, other_costs, total_cost, real_unit_cost)
VALUES
  ((SELECT id FROM purchases WHERE invoice = 'NF-2024-TP-001' LIMIT 1), (SELECT id FROM products WHERE sku = 'FONE001'), 'FONE001', 100, 18.00, 150.00, 0, 1950.00, 19.50),
  ((SELECT id FROM purchases WHERE invoice = 'NF-2024-TP-001' LIMIT 1), (SELECT id FROM products WHERE sku = 'CABO001'), 'CABO001', 200, 4.00, 80.00, 0, 880.00, 4.40),
  ((SELECT id FROM purchases WHERE invoice = 'NF-2024-TP-001' LIMIT 1), (SELECT id FROM products WHERE sku = 'CABO002'), 'CABO002', 100, 6.00, 60.00, 0, 660.00, 6.60),
  ((SELECT id FROM purchases WHERE invoice = 'NF-2024-TP-001' LIMIT 1), (SELECT id FROM products WHERE sku = 'CAR001'), 'CAR001', 50, 28.00, 125.00, 0, 1525.00, 30.50),
  ((SELECT id FROM purchases WHERE invoice = 'NF-2024-TP-001' LIMIT 1), (SELECT id FROM products WHERE sku = 'CAR002'), 'CAR002', 20, 45.00, 70.00, 0, 970.00, 48.50),
  ((SELECT id FROM purchases WHERE invoice = 'NF-2024-CA-002' LIMIT 1), (SELECT id FROM products WHERE sku = 'PEL001'), 'PEL001', 200, 3.00, 60.00, 0, 660.00, 3.30),
  ((SELECT id FROM purchases WHERE invoice = 'NF-2024-CA-002' LIMIT 1), (SELECT id FROM products WHERE sku = 'PEL002'), 'PEL002', 150, 3.50, 45.00, 0, 570.00, 3.80),
  ((SELECT id FROM purchases WHERE invoice = 'NF-2024-CA-002' LIMIT 1), (SELECT id FROM products WHERE sku = 'CHA001'), 'CHA001', 80, 15.00, 96.00, 0, 1296.00, 16.20),
  ((SELECT id FROM purchases WHERE invoice = 'NF-2024-IZ-003' LIMIT 1), (SELECT id FROM products WHERE sku = 'CABO003'), 'CABO003', 200, 7.50, 140.00, 0, 1640.00, 8.20),
  ((SELECT id FROM purchases WHERE invoice = 'NF-2024-IZ-003' LIMIT 1), (SELECT id FROM products WHERE sku = 'CABO004'), 'CABO004', 150, 3.50, 60.00, 0, 585.00, 3.90),
  ((SELECT id FROM purchases WHERE invoice = 'NF-2024-IZ-003' LIMIT 1), (SELECT id FROM products WHERE sku = 'CHA002'), 'CHA002', 40, 35.00, 80.00, 0, 1480.00, 37.00),
  ((SELECT id FROM purchases WHERE invoice = 'NF-2024-IZ-003' LIMIT 1), (SELECT id FROM products WHERE sku = 'SUP002'), 'SUP002', 30, 14.00, 36.00, 0, 456.00, 15.20),
  ((SELECT id FROM purchases WHERE invoice = 'NF-2024-GT-004' LIMIT 1), (SELECT id FROM products WHERE sku = 'APO001'), 'APO001', 60, 8.00, 60.00, 0, 540.00, 9.00),
  ((SELECT id FROM purchases WHERE invoice = 'NF-2024-GT-004' LIMIT 1), (SELECT id FROM products WHERE sku = 'APO002'), 'APO002', 80, 5.00, 40.00, 0, 440.00, 5.50),
  ((SELECT id FROM purchases WHERE invoice = 'NF-2024-GT-004' LIMIT 1), (SELECT id FROM products WHERE sku = 'SUP001'), 'SUP001', 50, 10.00, 50.00, 0, 550.00, 11.00);

-- ============================================================
-- 9. INVENTORY MOVEMENTS (entradas e saidas)
-- ============================================================

-- ENTRADAS por compra
INSERT INTO inventory_movements (user_id, product_id, type, quantity, reference_id, reference_type, notes) VALUES
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'FONE001'), 'PURCHASE', 100, (SELECT id FROM purchases WHERE invoice = 'NF-2024-TP-001' LIMIT 1), 'purchase', 'Entrada por compra'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CABO001'), 'PURCHASE', 200, (SELECT id FROM purchases WHERE invoice = 'NF-2024-TP-001' LIMIT 1), 'purchase', 'Entrada por compra'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CABO002'), 'PURCHASE', 100, (SELECT id FROM purchases WHERE invoice = 'NF-2024-TP-001' LIMIT 1), 'purchase', 'Entrada por compra'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CAR001'), 'PURCHASE', 50, (SELECT id FROM purchases WHERE invoice = 'NF-2024-TP-001' LIMIT 1), 'purchase', 'Entrada por compra'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CAR002'), 'PURCHASE', 20, (SELECT id FROM purchases WHERE invoice = 'NF-2024-TP-001' LIMIT 1), 'purchase', 'Entrada por compra'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'PEL001'), 'PURCHASE', 200, (SELECT id FROM purchases WHERE invoice = 'NF-2024-CA-002' LIMIT 1), 'purchase', 'Entrada por compra'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'PEL002'), 'PURCHASE', 150, (SELECT id FROM purchases WHERE invoice = 'NF-2024-CA-002' LIMIT 1), 'purchase', 'Entrada por compra'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CHA001'), 'PURCHASE', 80, (SELECT id FROM purchases WHERE invoice = 'NF-2024-CA-002' LIMIT 1), 'purchase', 'Entrada por compra'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CABO003'), 'PURCHASE', 200, (SELECT id FROM purchases WHERE invoice = 'NF-2024-IZ-003' LIMIT 1), 'purchase', 'Entrada por compra'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CABO004'), 'PURCHASE', 150, (SELECT id FROM purchases WHERE invoice = 'NF-2024-IZ-003' LIMIT 1), 'purchase', 'Entrada por compra'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CHA002'), 'PURCHASE', 40, (SELECT id FROM purchases WHERE invoice = 'NF-2024-IZ-003' LIMIT 1), 'purchase', 'Entrada por compra'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'SUP002'), 'PURCHASE', 30, (SELECT id FROM purchases WHERE invoice = 'NF-2024-IZ-003' LIMIT 1), 'purchase', 'Entrada por compra'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'APO001'), 'PURCHASE', 60, (SELECT id FROM purchases WHERE invoice = 'NF-2024-GT-004' LIMIT 1), 'purchase', 'Entrada por compra'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'APO002'), 'PURCHASE', 80, (SELECT id FROM purchases WHERE invoice = 'NF-2024-GT-004' LIMIT 1), 'purchase', 'Entrada por compra'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'SUP001'), 'PURCHASE', 50, (SELECT id FROM purchases WHERE invoice = 'NF-2024-GT-004' LIMIT 1), 'purchase', 'Entrada por compra');

-- SAIDAS por venda (valores negativos)
INSERT INTO inventory_movements (user_id, product_id, type, quantity, reference_id, reference_type, notes) VALUES
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'FONE001'), 'SALE', -2, (SELECT id FROM sales WHERE order_id = 'ML-2024-00001' LIMIT 1), 'sale', 'Saida por venda'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CABO001'), 'SALE', -3, (SELECT id FROM sales WHERE order_id = 'ML-2024-00001' LIMIT 1), 'sale', 'Saida por venda'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CHA001'), 'SALE', -1, (SELECT id FROM sales WHERE order_id = 'SH-2024-00002' LIMIT 1), 'sale', 'Saida por venda'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CAP001'), 'SALE', -2, (SELECT id FROM sales WHERE order_id = 'SH-2024-00002' LIMIT 1), 'sale', 'Saida por venda'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'PEL002'), 'SALE', -2, (SELECT id FROM sales WHERE order_id = 'SH-2024-00002' LIMIT 1), 'sale', 'Saida por venda'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CAR001'), 'SALE', -1, (SELECT id FROM sales WHERE order_id = 'ML-VENDA-001' LIMIT 1), 'sale', 'Saida por venda'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CABO003'), 'SALE', -1, (SELECT id FROM sales WHERE order_id = 'ML-VENDA-001' LIMIT 1), 'sale', 'Saida por venda'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CAR002'), 'SALE', -1, (SELECT id FROM sales WHERE order_id = 'AM-VENDA-001' LIMIT 1), 'sale', 'Saida por venda'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CHA002'), 'SALE', -1, (SELECT id FROM sales WHERE order_id = 'AM-VENDA-001' LIMIT 1), 'sale', 'Saida por venda'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'SUP001'), 'SALE', -1, (SELECT id FROM sales WHERE order_id = 'SH-VENDA-001' LIMIT 1), 'sale', 'Saida por venda'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'APO001'), 'SALE', -1, (SELECT id FROM sales WHERE order_id = 'SH-VENDA-001' LIMIT 1), 'sale', 'Saida por venda'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'CHA002'), 'SALE', -1, (SELECT id FROM sales WHERE order_id = 'MG-VENDA-001' LIMIT 1), 'sale', 'Saida por venda'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM products WHERE sku = 'PEL003'), 'SALE', -3, (SELECT id FROM sales WHERE order_id = 'MG-VENDA-001' LIMIT 1), 'sale', 'Saida por venda');

-- ============================================================
-- 10. SHIPMENTS
-- ============================================================

INSERT INTO shipments (user_id, order_id, carrier, tracking_code, status, weight, width, height, length, shipped_at, delivered_at)
VALUES
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM orders WHERE order_number = 'ML-2024-00001'), 'Correios SEDEX', 'ML123456789BR', 'ENTREGUE', 0.30, 20, 15, 10, NOW() - INTERVAL '10 days', NOW() - INTERVAL '5 days'),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM orders WHERE order_number = 'SH-2024-00002'), 'Jadlog', 'SH9876543210', 'ENVIADO', 0.45, 25, 20, 12, NOW() - INTERVAL '3 days', NULL),
  ('6f58029b-c770-4f25-a9f9-86dec6fb6137', (SELECT id FROM orders WHERE order_number = 'AM-2024-00003'), NULL, NULL, 'EMBALADO', 0.50, 30, 20, 15, NULL, NULL);

-- ============================================================
-- 11. ORDER STATUS HISTORY
-- ============================================================

INSERT INTO order_status_history (order_id, user_id, from_status, to_status, notes) VALUES
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00001'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', NULL, 'NOVO', 'Pedido recebido do Mercado Livre'),
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00001'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', 'NOVO', 'PAGO', 'Pagamento confirmado'),
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00001'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', 'PAGO', 'AGUARDANDO_SEPARACAO', 'Aguardando separacao'),
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00001'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', 'AGUARDANDO_SEPARACAO', 'EM_SEPARACAO', 'Separacao iniciada'),
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00001'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', 'EM_SEPARACAO', 'SEPARADO', 'Produtos separados'),
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00001'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', 'SEPARADO', 'ENVIADO', 'Enviado via Correios'),
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00001'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', 'ENVIADO', 'ENTREGUE', 'Entregue ao destinatario'),
  ((SELECT id FROM orders WHERE order_number = 'SH-2024-00002'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', NULL, 'NOVO', 'Pedido recebido da Shopee'),
  ((SELECT id FROM orders WHERE order_number = 'SH-2024-00002'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', 'NOVO', 'PAGO', 'Pagamento confirmado'),
  ((SELECT id FROM orders WHERE order_number = 'SH-2024-00002'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', 'PAGO', 'EM_SEPARACAO', 'Separacao em andamento'),
  ((SELECT id FROM orders WHERE order_number = 'SH-2024-00002'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', 'EM_SEPARACAO', 'SEPARADO', 'Produtos separados'),
  ((SELECT id FROM orders WHERE order_number = 'SH-2024-00002'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', 'SEPARADO', 'ENVIADO', 'Enviado via Jadlog'),
  ((SELECT id FROM orders WHERE order_number = 'MG-2024-00004'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', NULL, 'NOVO', 'Pedido recebido do Magalu'),
  ((SELECT id FROM orders WHERE order_number = 'MG-2024-00004'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', 'NOVO', 'PAGO', 'Pagamento confirmado'),
  ((SELECT id FROM orders WHERE order_number = 'MG-2024-00004'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', 'PAGO', 'EM_SEPARACAO', 'Separacao iniciada'),
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00008'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', NULL, 'NOVO', 'Pedido recebido do Mercado Livre'),
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00008'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', 'NOVO', 'PAGO', 'Pagamento confirmado'),
  ((SELECT id FROM orders WHERE order_number = 'ML-2024-00008'), '6f58029b-c770-4f25-a9f9-86dec6fb6137', 'PAGO', 'CANCELADO', 'Cliente cancelou');
