-- Shared public store settings. The single default row is the current store scope.
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  whatsapp_enabled BOOLEAN NOT NULL DEFAULT true,
  whatsapp_phone TEXT NOT NULL DEFAULT '5511998887766',
  whatsapp_message TEXT NOT NULL DEFAULT 'Olá! Vim do site TEKNIX e gostaria de tirar uma dúvida sobre os produtos.',
  whatsapp_position TEXT NOT NULL DEFAULT 'br' CHECK (whatsapp_position IN ('br', 'bl')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.store_settings (id)
VALUES ('default')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_store_settings" ON public.store_settings;
CREATE POLICY "public_read_store_settings"
  ON public.store_settings FOR SELECT TO anon, authenticated
  USING (id = 'default');

DROP POLICY IF EXISTS "hub_admin_manage_store_settings" ON public.store_settings;
CREATE POLICY "hub_admin_manage_store_settings"
  ON public.store_settings FOR ALL TO authenticated
  USING (public.fn_is_hub_admin())
  WITH CHECK (public.fn_is_hub_admin());