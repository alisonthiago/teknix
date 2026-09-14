-- ============================================================
-- Migration 022: Regras de Visibilidade por Página para WhatsApp
-- ============================================================

ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS whatsapp_display_mode TEXT DEFAULT 'all',
ADD COLUMN IF NOT EXISTS whatsapp_pages JSONB DEFAULT '["home", "products", "categories", "cart", "institutional"]'::jsonb;
