-- Drop the old Postgres trigger since we are moving to Application-level logging
DROP TRIGGER IF EXISTS on_product_insert ON products;
DROP TRIGGER IF EXISTS on_supplier_insert ON suppliers;
DROP TRIGGER IF EXISTS on_purchase_insert ON purchases;
DROP TRIGGER IF EXISTS on_order_insert ON orders;
DROP FUNCTION IF EXISTS notify_master_on_insert();

-- Add new columns to the notifications table to support the Activity Log format
ALTER TABLE notifications
ADD COLUMN actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN actor_name TEXT,
ADD COLUMN actor_role TEXT,
ADD COLUMN target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN module TEXT,
ADD COLUMN entity_id TEXT,
ADD COLUMN entity_type TEXT,
ADD COLUMN read_at TIMESTAMPTZ,
ADD COLUMN metadata JSONB;
