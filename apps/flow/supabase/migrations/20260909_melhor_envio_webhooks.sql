-- Melhor Envio webhook inbox and idempotency ledger.
CREATE TABLE IF NOT EXISTS public.melhor_envio_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  idempotency_key TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL DEFAULT 'melhor_envio',
  event_type TEXT NOT NULL,
  label_id TEXT NOT NULL,
  shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL,
  protocol TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  tracking_code TEXT,
  external_status TEXT,
  internal_status TEXT,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  http_result INTEGER,
  correlation_id TEXT NOT NULL,
  error_message TEXT,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Keep this migration safe if the inbox was created by an earlier deployment.
ALTER TABLE public.melhor_envio_webhook_events
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'melhor_envio',
  ADD COLUMN IF NOT EXISTS shipment_id UUID REFERENCES public.shipments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_me_webhook_events_order_id
  ON public.melhor_envio_webhook_events(order_id);
CREATE INDEX IF NOT EXISTS idx_me_webhook_events_received_at
  ON public.melhor_envio_webhook_events(received_at DESC);

ALTER TABLE public.melhor_envio_webhook_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated can read Melhor Envio webhook events"
  ON public.melhor_envio_webhook_events;
CREATE POLICY "Authenticated can read Melhor Envio webhook events"
  ON public.melhor_envio_webhook_events FOR SELECT TO authenticated USING (true);