-- SEED_notifications.sql
-- Notifications for the admin user

INSERT INTO public.notifications (user_id, type, title, message, marketplace_id, resource, resource_id, is_read, created_at) VALUES
('6f58029b-c770-4f25-a9f9-86dec6fb6137', 'NEW_SALE', 'Nova venda realizada', 'Pedido #ML-2026-001 foi pago via Mercado Livre', NULL, 'order', NULL, false, now() - interval '1 hour'),
('6f58029b-c770-4f25-a9f9-86dec6fb6137', 'LOW_STOCK', 'Estoque baixo', 'Produto Air Fry Mondial 5L (SKU-AF-001) com apenas 3 unidades em estoque', NULL, 'product', NULL, false, now() - interval '3 hours'),
('6f58029b-c770-4f25-a9f9-86dec6fb6137', 'ERROR', 'Erro de sincronização', 'Falha ao sincronizar pedidos da conta "TEKNIX Oficial" no Mercado Livre', NULL, 'marketplace_account', NULL, false, now() - interval '5 hours'),
('6f58029b-c770-4f25-a9f9-86dec6fb6137', 'NEW_SALE', 'Nova venda realizada', 'Pedido #SHO-2026-005 foi pago via Shopee', NULL, 'order', NULL, true, now() - interval '1 day'),
('6f58029b-c770-4f25-a9f9-86dec6fb6137', 'LOW_STOCK', 'Estoque baixo', 'Produto Liquidificador Oster 10 Velocidades com apenas 5 unidades', NULL, 'product', NULL, true, now() - interval '1 day'),
('6f58029b-c770-4f25-a9f9-86dec6fb6137', 'NEW_SALE', 'Nova venda realizada', 'Pedido #AMZ-2026-002 foi pago via Amazon', NULL, 'order', NULL, true, now() - interval '2 days'),
('6f58029b-c770-4f25-a9f9-86dec6fb6137', 'LOW_MARGIN', 'Margem baixa', 'Produto Jogo de Panelas com margem de apenas 5.2%', NULL, 'product', NULL, true, now() - interval '3 days'),
('6f58029b-c770-4f25-a9f9-86dec6fb6137', 'ERROR', 'Erro de pagamento', 'Pagamento do pedido #TKT-2026-003 falhou - verificar com o marketplace', NULL, 'order', NULL, true, now() - interval '4 days');
