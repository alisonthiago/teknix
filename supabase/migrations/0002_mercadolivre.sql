-- 0002_mercadolivre.sql

-- 1. marketplace_connections
CREATE TABLE IF NOT EXISTS public.marketplace_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    marketplace_id TEXT NOT NULL, -- e.g. 'mercadolivre', 'shopee'
    seller_id TEXT NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMP WITH TIME ZONE,
    scope TEXT,
    status TEXT NOT NULL DEFAULT 'CONNECTED', -- 'CONNECTED', 'DISCONNECTED', 'REAUTH_REQUIRED'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    disconnected_at TIMESTAMP WITH TIME ZONE
);

CREATE UNIQUE INDEX idx_marketplace_connections_user_seller 
ON public.marketplace_connections(user_id, marketplace_id, seller_id);

-- 2. marketplace_webhook_events
CREATE TABLE IF NOT EXISTS public.marketplace_webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id TEXT NOT NULL,
    topic TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    seller_id TEXT,
    application_id TEXT,
    event_id TEXT, -- Uniqueness constraint with topic and resource
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'RECEIVED', -- 'RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED', 'IGNORED', 'DUPLICATE'
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    received_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Idempotency key
CREATE UNIQUE INDEX idx_marketplace_webhook_events_unique
ON public.marketplace_webhook_events(marketplace_id, topic, resource, event_id)
WHERE event_id IS NOT NULL;

-- 3. marketplace_orders
CREATE TABLE IF NOT EXISTS public.marketplace_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id TEXT NOT NULL,
    external_order_id TEXT NOT NULL,
    seller_id TEXT NOT NULL,
    status TEXT NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'BRL',
    order_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    raw_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX idx_marketplace_orders_external_id
ON public.marketplace_orders(marketplace_id, external_order_id);

-- 4. marketplace_order_items
CREATE TABLE IF NOT EXISTS public.marketplace_order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL, -- Link to internal TEKNIX product
    external_item_id TEXT NOT NULL,
    seller_sku TEXT,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. marketplace_messages
CREATE TABLE IF NOT EXISTS public.marketplace_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id TEXT NOT NULL,
    external_id TEXT NOT NULL,
    order_id UUID REFERENCES public.marketplace_orders(id) ON DELETE CASCADE,
    item_id TEXT,
    sender TEXT,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'UNREAD',
    received_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. integration_logs
CREATE TABLE IF NOT EXISTS public.integration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    marketplace_id TEXT NOT NULL,
    type TEXT NOT NULL, -- 'WEBHOOK_RECEIVED', 'API_REQUEST', 'API_SUCCESS', 'API_ERROR', 'TOKEN_REFRESH'
    endpoint TEXT,
    method TEXT,
    status_code INTEGER,
    duration_ms INTEGER,
    success BOOLEAN NOT NULL,
    error TEXT,
    resource TEXT,
    resource_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- NULL means global/system
    type TEXT NOT NULL, -- 'NEW_SALE', 'LOW_STOCK', 'LOW_MARGIN', 'ERROR'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    marketplace_id TEXT,
    resource TEXT,
    resource_id TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS)
-- ==========================================

-- marketplace_connections
ALTER TABLE public.marketplace_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL access for authenticated users on marketplace_connections" 
    ON public.marketplace_connections FOR ALL TO authenticated 
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- marketplace_webhook_events
ALTER TABLE public.marketplace_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read for authenticated on marketplace_webhook_events" 
    ON public.marketplace_webhook_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Enable insert for public on marketplace_webhook_events" 
    ON public.marketplace_webhook_events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Enable update for service role on marketplace_webhook_events" 
    ON public.marketplace_webhook_events FOR UPDATE TO public USING (true);

-- marketplace_orders
ALTER TABLE public.marketplace_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL access for authenticated users on marketplace_orders" 
    ON public.marketplace_orders FOR ALL TO authenticated USING (true);

-- marketplace_order_items
ALTER TABLE public.marketplace_order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL access for authenticated users on marketplace_order_items" 
    ON public.marketplace_order_items FOR ALL TO authenticated USING (true);

-- marketplace_messages
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL access for authenticated users on marketplace_messages" 
    ON public.marketplace_messages FOR ALL TO authenticated USING (true);

-- integration_logs
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL access for authenticated users on integration_logs" 
    ON public.integration_logs FOR ALL TO authenticated USING (true);

-- notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable ALL access for authenticated users on notifications" 
    ON public.notifications FOR ALL TO authenticated USING (true);
    
-- Add relation to stock_movements for marketplace sales
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS external_order_id TEXT;
ALTER TABLE public.stock_movements ADD COLUMN IF NOT EXISTS marketplace_id TEXT;
