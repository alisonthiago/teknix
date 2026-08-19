-- 1. Permite que o sistema/gatilhos insiram notificações para qualquer usuário
DROP POLICY IF EXISTS "Users can insert their own notifications" ON notifications;

CREATE POLICY "Anyone can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- 2. Função de Gatilho para notificar o Master
CREATE OR REPLACE FUNCTION notify_master_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  creator_name TEXT;
  master_id UUID;
BEGIN
  -- Get the name of the user who made the change
  SELECT name INTO creator_name FROM profiles WHERE id = auth.uid();
  
  -- Find the master (alison@tektou.com)
  SELECT id INTO master_id FROM profiles WHERE email = 'alison@tektou.com' LIMIT 1;
  
  -- Prevent notifying if the master is doing the action, or if no master is found
  IF master_id IS NOT NULL AND auth.uid() != master_id THEN
    
    -- Customize message based on table
    IF TG_TABLE_NAME = 'products' THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (master_id, 'Novo Produto Adicionado', creator_name || ' cadastrou um novo produto no sistema.', 'info');
    ELSIF TG_TABLE_NAME = 'suppliers' THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (master_id, 'Novo Fornecedor Adicionado', creator_name || ' cadastrou um novo fornecedor no sistema.', 'info');
    ELSIF TG_TABLE_NAME = 'purchases' THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (master_id, 'Nova Compra Adicionada', creator_name || ' cadastrou uma nova compra no sistema.', 'info');
    ELSIF TG_TABLE_NAME = 'orders' THEN
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (master_id, 'Novo Pedido Adicionado', creator_name || ' cadastrou um novo pedido no sistema.', 'info');
    END IF;

  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Aplicar os gatilhos
DROP TRIGGER IF EXISTS on_product_insert ON products;
CREATE TRIGGER on_product_insert AFTER INSERT ON products FOR EACH ROW EXECUTE FUNCTION notify_master_on_insert();

DROP TRIGGER IF EXISTS on_supplier_insert ON suppliers;
CREATE TRIGGER on_supplier_insert AFTER INSERT ON suppliers FOR EACH ROW EXECUTE FUNCTION notify_master_on_insert();

DROP TRIGGER IF EXISTS on_purchase_insert ON purchases;
CREATE TRIGGER on_purchase_insert AFTER INSERT ON purchases FOR EACH ROW EXECUTE FUNCTION notify_master_on_insert();

DROP TRIGGER IF EXISTS on_order_insert ON orders;
CREATE TRIGGER on_order_insert AFTER INSERT ON orders FOR EACH ROW EXECUTE FUNCTION notify_master_on_insert();
