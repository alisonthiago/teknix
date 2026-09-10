-- FLOW: catálogo central, anúncios por canal, estoque físico e eventos idempotentes.
-- Não substitui as tabelas legadas; permite migração gradual dos fluxos existentes.

CREATE TABLE IF NOT EXISTS public.flow_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT NOT NULL,
  ean TEXT,
  name TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, sku),
  UNIQUE (user_id, ean)
);

CREATE TABLE IF NOT EXISTS public.flow_stock (
  product_id UUID PRIMARY KEY REFERENCES public.flow_products(id) ON DELETE CASCADE,
  physical INTEGER NOT NULL DEFAULT 0 CHECK (physical >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (reserved <= physical)
);

CREATE TABLE IF NOT EXISTS public.flow_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.flow_products(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('PURCHASE', 'SALE', 'RESERVATION', 'RELEASE', 'ADJUSTMENT')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reference_type TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (product_id, kind, reference_type, reference_id)
);

CREATE TABLE IF NOT EXISTS public.flow_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, code)
);

CREATE TABLE IF NOT EXISTS public.flow_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.flow_channels(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.flow_products(id) ON DELETE SET NULL,
  external_id TEXT NOT NULL,
  sku TEXT,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  current_price NUMERIC(12,2),
  stock_quantity INTEGER,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (channel_id, external_id)
);

CREATE TABLE IF NOT EXISTS public.flow_listing_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.flow_listings(id) ON DELETE CASCADE,
  price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
  source TEXT NOT NULL CHECK (source IN ('MANUAL', 'CHANNEL', 'SYNC')),
  effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.flow_channel_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES public.flow_channels(id) ON DELETE RESTRICT,
  external_id TEXT NOT NULL,
  status TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (channel_id, external_id)
);

CREATE TABLE IF NOT EXISTS public.flow_channel_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.flow_channel_orders(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES public.flow_listings(id) ON DELETE SET NULL,
  product_id UUID REFERENCES public.flow_products(id) ON DELETE SET NULL,
  external_item_id TEXT,
  sku TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  UNIQUE (order_id, external_item_id)
);

CREATE TABLE IF NOT EXISTS public.flow_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES public.flow_channels(id) ON DELETE SET NULL,
  event_key TEXT NOT NULL,
  topic TEXT NOT NULL,
  resource TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PROCESSING', 'PROCESSED', 'FAILED')),
  error TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  UNIQUE (event_key)
);

CREATE TABLE IF NOT EXISTS public.flow_product_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.flow_listings(id) ON DELETE CASCADE,
  candidate_product_id UUID REFERENCES public.flow_products(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  confidence NUMERIC(5,4) NOT NULL DEFAULT 0 CHECK (confidence >= 0 AND confidence <= 1),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  UNIQUE (listing_id)
);

CREATE INDEX IF NOT EXISTS flow_listings_product_idx ON public.flow_listings(product_id);
CREATE INDEX IF NOT EXISTS flow_listings_sku_idx ON public.flow_listings(sku);
CREATE INDEX IF NOT EXISTS flow_matches_status_idx ON public.flow_product_matches(status);
CREATE INDEX IF NOT EXISTS flow_webhook_status_idx ON public.flow_webhook_events(status);

DO $$ DECLARE table_name TEXT; BEGIN
  FOREACH table_name IN ARRAY ARRAY['flow_products','flow_stock','flow_stock_movements','flow_channels','flow_listings','flow_listing_prices','flow_channel_orders','flow_channel_order_items','flow_webhook_events','flow_product_matches'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.flow_available_stock(product UUID)
RETURNS INTEGER LANGUAGE SQL STABLE AS $$
  SELECT COALESCE(physical - reserved, 0) FROM public.flow_stock WHERE product_id = $1;
$$;

CREATE OR REPLACE FUNCTION public.flow_apply_stock_movement(
  p_product_id UUID,
  p_kind TEXT,
  p_quantity INTEGER,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id TEXT DEFAULT NULL
) RETURNS public.flow_stock LANGUAGE plpgsql AS $$
DECLARE result public.flow_stock;
BEGIN
  IF p_quantity <= 0 THEN RAISE EXCEPTION 'quantity must be greater than zero'; END IF;
  IF p_reference_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.flow_stock_movements
    WHERE product_id = p_product_id AND kind = p_kind
      AND reference_type IS NOT DISTINCT FROM p_reference_type
      AND reference_id = p_reference_id
  ) THEN
    SELECT * INTO result FROM public.flow_stock WHERE product_id = p_product_id;
    RETURN result;
  END IF;
  INSERT INTO public.flow_stock (product_id) VALUES (p_product_id) ON CONFLICT (product_id) DO NOTHING;
  SELECT * INTO result FROM public.flow_stock WHERE product_id = p_product_id FOR UPDATE;

  IF p_kind = 'PURCHASE' OR p_kind = 'ADJUSTMENT' THEN result.physical := result.physical + p_quantity;
  ELSIF p_kind = 'SALE' THEN
    IF result.physical - result.reserved < p_quantity THEN RAISE EXCEPTION 'insufficient available stock'; END IF;
    result.physical := result.physical - p_quantity;
  ELSIF p_kind = 'RESERVATION' THEN
    IF result.physical - result.reserved < p_quantity THEN RAISE EXCEPTION 'insufficient available stock'; END IF;
    result.reserved := result.reserved + p_quantity;
  ELSIF p_kind = 'RELEASE' THEN
    IF result.reserved < p_quantity THEN RAISE EXCEPTION 'reserved stock is lower than release quantity'; END IF;
    result.reserved := result.reserved - p_quantity;
  ELSE RAISE EXCEPTION 'unsupported stock movement: %', p_kind;
  END IF;

  UPDATE public.flow_stock SET physical = result.physical, reserved = result.reserved, updated_at = NOW()
    WHERE product_id = p_product_id RETURNING * INTO result;
  INSERT INTO public.flow_stock_movements(product_id, kind, quantity, reference_type, reference_id)
    VALUES (p_product_id, p_kind, p_quantity, p_reference_type, p_reference_id)
    ON CONFLICT (product_id, kind, reference_type, reference_id) DO NOTHING;
  RETURN result;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'flow_products_owner') THEN CREATE POLICY flow_products_owner ON public.flow_products FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'flow_stock_owner') THEN CREATE POLICY flow_stock_owner ON public.flow_stock FOR ALL USING (EXISTS (SELECT 1 FROM public.flow_products p WHERE p.id = product_id AND p.user_id = auth.uid())); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'flow_movements_owner') THEN CREATE POLICY flow_movements_owner ON public.flow_stock_movements FOR ALL USING (EXISTS (SELECT 1 FROM public.flow_products p WHERE p.id = product_id AND p.user_id = auth.uid())); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'flow_channels_owner') THEN CREATE POLICY flow_channels_owner ON public.flow_channels FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid()); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'flow_listings_owner') THEN CREATE POLICY flow_listings_owner ON public.flow_listings FOR ALL USING (EXISTS (SELECT 1 FROM public.flow_channels c WHERE c.id = channel_id AND c.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.flow_channels c WHERE c.id = channel_id AND c.user_id = auth.uid())); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'flow_prices_owner') THEN CREATE POLICY flow_prices_owner ON public.flow_listing_prices FOR ALL USING (EXISTS (SELECT 1 FROM public.flow_listings l JOIN public.flow_channels c ON c.id = l.channel_id WHERE l.id = listing_id AND c.user_id = auth.uid())); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'flow_orders_owner') THEN CREATE POLICY flow_orders_owner ON public.flow_channel_orders FOR ALL USING (EXISTS (SELECT 1 FROM public.flow_channels c WHERE c.id = channel_id AND c.user_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM public.flow_channels c WHERE c.id = channel_id AND c.user_id = auth.uid())); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'flow_order_items_owner') THEN CREATE POLICY flow_order_items_owner ON public.flow_channel_order_items FOR ALL USING (EXISTS (SELECT 1 FROM public.flow_channel_orders o JOIN public.flow_channels c ON c.id = o.channel_id WHERE o.id = order_id AND c.user_id = auth.uid())); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'flow_webhooks_owner') THEN CREATE POLICY flow_webhooks_owner ON public.flow_webhook_events FOR ALL USING (channel_id IS NULL OR EXISTS (SELECT 1 FROM public.flow_channels c WHERE c.id = channel_id AND c.user_id = auth.uid())); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'flow_matches_owner') THEN CREATE POLICY flow_matches_owner ON public.flow_product_matches FOR ALL USING (EXISTS (SELECT 1 FROM public.flow_listings l JOIN public.flow_channels c ON c.id = l.channel_id WHERE l.id = listing_id AND c.user_id = auth.uid())); END IF;
END $$;