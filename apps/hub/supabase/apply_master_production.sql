-- ==============================================================================
-- TEKNIX — MASTER PRODUCTION SETUP & MIGRATIONS SCRIPT
-- ==============================================================================
-- Este script unifica e consolida TODAS as migrations do ecossistema TEKNIX
-- para execução direta no SQL Editor do Supabase Dashboard com privilégio SERVICE_ROLE / postgres.
--
-- CARACTERÍSTICAS:
-- 1. 100% Idempotente (CREATE IF NOT EXISTS, DROP TRIGGER IF EXISTS, ON CONFLICT DO NOTHING).
-- 2. Zero alteração nas tabelas do FLOW (preserva marketplaces intocados).
-- 3. RLS completo e estrito: público só lê publicado/ativo; escrita apenas para administradores via fn_is_hub_admin().
-- 4. Camada de Integrações Seguras: credenciais isoladas no servidor, webhooks idempotentes e auditados.
-- ==============================================================================

-- ==============================================================================
-- BLOCO 0: FUNÇÃO DE AUTORIZAÇÃO ADMINISTRATIVA (fn_is_hub_admin)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_is_hub_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.status = 'ACTIVE'
      AND (p.is_master = true OR p.role IN ('MASTER', 'ADMIN'))
  );
$$;

REVOKE EXECUTE ON FUNCTION public.fn_is_hub_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.fn_is_hub_admin() TO authenticated;

-- ==============================================================================
-- BLOCO 1: THEMES & DESIGN SYSTEM
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_default BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',

  -- Tipografia
  font_heading TEXT DEFAULT 'Inter',
  font_body TEXT DEFAULT 'Inter',
  font_button TEXT DEFAULT 'Inter',
  font_input TEXT DEFAULT 'Inter',
  font_accent TEXT DEFAULT 'Inter',
  font_scale NUMERIC(3,2) DEFAULT 1.25,

  -- Cores
  color_primary TEXT DEFAULT '#00ff88',
  color_secondary TEXT DEFAULT '#1a1a1a',
  color_accent TEXT DEFAULT '#3b82f6',
  color_background TEXT DEFAULT '#ffffff',
  color_surface TEXT DEFAULT '#f5f5f7',
  color_text TEXT DEFAULT '#1a1a1a',
  color_text_muted TEXT DEFAULT '#666666',
  color_text_light TEXT DEFAULT '#999999',
  color_border TEXT DEFAULT '#e5e5e5',
  color_success TEXT DEFAULT '#00cc6a',
  color_warning TEXT DEFAULT '#f59e0b',
  color_error TEXT DEFAULT '#dc2626',

  -- Espaçamentos
  spacing_xs TEXT DEFAULT '4px',
  spacing_sm TEXT DEFAULT '8px',
  spacing_md TEXT DEFAULT '16px',
  spacing_lg TEXT DEFAULT '24px',
  spacing_xl TEXT DEFAULT '32px',
  spacing_2xl TEXT DEFAULT '48px',
  spacing_3xl TEXT DEFAULT '64px',
  spacing_4xl TEXT DEFAULT '96px',

  -- Raios e Bordas
  radius_sm TEXT DEFAULT '4px',
  radius_md TEXT DEFAULT '8px',
  radius_lg TEXT DEFAULT '12px',
  radius_xl TEXT DEFAULT '16px',
  radius_full TEXT DEFAULT '9999px',

  -- Sombras
  shadow_sm TEXT DEFAULT '0 1px 2px rgba(0,0,0,0.05)',
  shadow_md TEXT DEFAULT '0 4px 6px rgba(0,0,0,0.07)',
  shadow_lg TEXT DEFAULT '0 10px 15px rgba(0,0,0,0.1)',
  shadow_xl TEXT DEFAULT '0 20px 25px rgba(0,0,0,0.15)',

  -- Container
  container_width TEXT DEFAULT '1200px',
  container_width_narrow TEXT DEFAULT '800px',
  container_width_wide TEXT DEFAULT '1400px',
  container_padding TEXT DEFAULT '24px',

  -- Botões
  button_font_size TEXT DEFAULT '1rem',
  button_font_weight TEXT DEFAULT '600',
  button_padding_x TEXT DEFAULT '24px',
  button_padding_y TEXT DEFAULT '12px',
  button_radius TEXT DEFAULT '9999px',
  button_bg TEXT DEFAULT '#00ff88',
  button_color TEXT DEFAULT '#0a0a0a',
  button_hover_bg TEXT DEFAULT '#00cc6a',
  button_hover_color TEXT DEFAULT '#0a0a0a',

  -- Headings
  h1_size TEXT DEFAULT '3.5rem',
  h1_weight TEXT DEFAULT '700',
  h1_line_height TEXT DEFAULT '1.1',
  h2_size TEXT DEFAULT '2.5rem',
  h2_weight TEXT DEFAULT '700',
  h2_line_height TEXT DEFAULT '1.2',
  h3_size TEXT DEFAULT '2rem',
  h3_weight TEXT DEFAULT '600',
  h3_line_height TEXT DEFAULT '1.3',
  h4_size TEXT DEFAULT '1.5rem',
  h4_weight TEXT DEFAULT '600',
  h5_size TEXT DEFAULT '1.25rem',
  h5_weight TEXT DEFAULT '600',
  h6_size TEXT DEFAULT '1rem',
  h6_weight TEXT DEFAULT '600',

  -- Body
  body_size TEXT DEFAULT '1rem',
  body_line_height TEXT DEFAULT '1.7',
  body_letter_spacing TEXT DEFAULT '0',

  -- Custom Overrides
  custom JSONB DEFAULT '{}',

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_themes_slug ON public.themes(slug);

-- ==============================================================================
-- BLOCO 2: TEMPLATES
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  description TEXT DEFAULT '',
  thumbnail TEXT DEFAULT '',
  theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,
  schema JSONB NOT NULL DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_type ON public.templates(type);

-- ==============================================================================
-- BLOCO 3: PAGES (PÁGINAS DO PAGE BUILDER)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'custom',
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  is_landing_mode BOOLEAN DEFAULT false,

  theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,
  template_id UUID REFERENCES public.templates(id) ON DELETE SET NULL,

  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  seo_image TEXT DEFAULT '',
  seo_slug TEXT DEFAULT '',
  seo_canonical TEXT DEFAULT '',
  seo_og JSONB DEFAULT '{}',
  head_scripts TEXT DEFAULT '',
  body_scripts TEXT DEFAULT '',

  page_styles JSONB DEFAULT '{}',
  version INTEGER DEFAULT 1,

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON public.pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_type ON public.pages(type);

-- ==============================================================================
-- BLOCO 4: PAGE SECTIONS, CONTAINERS & WIDGETS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'section',
  "order" INTEGER NOT NULL DEFAULT 0,

  layout TEXT DEFAULT 'boxed',
  direction TEXT DEFAULT 'column',
  gap TEXT DEFAULT '0',
  max_width TEXT DEFAULT '',
  min_height TEXT DEFAULT '',

  bg_type TEXT DEFAULT 'none',
  bg_color TEXT DEFAULT '',
  bg_image TEXT DEFAULT '',
  bg_video TEXT DEFAULT '',
  bg_gradient TEXT DEFAULT '',
  bg_position TEXT DEFAULT 'center',
  bg_size TEXT DEFAULT 'cover',
  bg_repeat TEXT DEFAULT 'no-repeat',
  bg_attachment TEXT DEFAULT 'fixed',
  bg_overlay TEXT DEFAULT '',
  bg_opacity NUMERIC(3,2) DEFAULT 1,

  padding_top TEXT DEFAULT '80px',
  padding_bottom TEXT DEFAULT '80px',
  padding_left TEXT DEFAULT '0',
  padding_right TEXT DEFAULT '0',
  margin_top TEXT DEFAULT '',
  margin_bottom TEXT DEFAULT '',

  border_top TEXT DEFAULT '',
  border_bottom TEXT DEFAULT '',
  border_color TEXT DEFAULT '',
  border_radius TEXT DEFAULT '',
  box_shadow TEXT DEFAULT '',

  hide_on_desktop BOOLEAN DEFAULT false,
  hide_on_tablet BOOLEAN DEFAULT false,
  hide_on_mobile BOOLEAN DEFAULT false,

  animation_type TEXT DEFAULT 'none',
  animation_duration TEXT DEFAULT '0.6s',
  animation_delay TEXT DEFAULT '0s',
  animation_offset TEXT DEFAULT '80px',

  custom_css TEXT DEFAULT '',
  custom_class TEXT DEFAULT '',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_sections_page ON public.page_sections(page_id);

CREATE TABLE IF NOT EXISTS public.page_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.page_sections(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,

  direction TEXT DEFAULT 'row',
  gap TEXT DEFAULT '16px',
  align_items TEXT DEFAULT 'stretch',
  justify_content TEXT DEFAULT 'flex-start',
  flex_wrap TEXT DEFAULT 'nowrap',
  flex_grow TEXT DEFAULT '0',
  flex_shrink TEXT DEFAULT '1',

  width TEXT DEFAULT '',
  max_width TEXT DEFAULT '',
  min_height TEXT DEFAULT '',

  bg_type TEXT DEFAULT 'none',
  bg_color TEXT DEFAULT '',
  bg_image TEXT DEFAULT '',
  bg_gradient TEXT DEFAULT '',
  bg_overlay TEXT DEFAULT '',
  bg_opacity NUMERIC(3,2) DEFAULT 1,

  padding_top TEXT DEFAULT '',
  padding_bottom TEXT DEFAULT '',
  padding_left TEXT DEFAULT '',
  padding_right TEXT DEFAULT '',
  margin_top TEXT DEFAULT '',
  margin_bottom TEXT DEFAULT '',

  border TEXT DEFAULT '',
  border_color TEXT DEFAULT '',
  border_radius TEXT DEFAULT '',
  box_shadow TEXT DEFAULT '',

  hide_on_desktop BOOLEAN DEFAULT false,
  hide_on_tablet BOOLEAN DEFAULT false,
  hide_on_mobile BOOLEAN DEFAULT false,

  custom_css TEXT DEFAULT '',
  custom_class TEXT DEFAULT '',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_containers_section ON public.page_containers(section_id);

CREATE TABLE IF NOT EXISTS public.page_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id UUID NOT NULL REFERENCES public.page_containers(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  content JSONB DEFAULT '{}',

  font_family TEXT DEFAULT '',
  font_size TEXT DEFAULT '',
  font_weight TEXT DEFAULT '',
  line_height TEXT DEFAULT '',
  letter_spacing TEXT DEFAULT '',
  text_transform TEXT DEFAULT '',
  text_align TEXT DEFAULT 'left',
  color TEXT DEFAULT '',

  bg_type TEXT DEFAULT 'none',
  bg_color TEXT DEFAULT '',
  bg_image TEXT DEFAULT '',
  bg_gradient TEXT DEFAULT '',
  bg_overlay TEXT DEFAULT '',
  bg_opacity NUMERIC(3,2) DEFAULT 1,

  padding_top TEXT DEFAULT '',
  padding_bottom TEXT DEFAULT '',
  padding_left TEXT DEFAULT '',
  padding_right TEXT DEFAULT '',
  margin_top TEXT DEFAULT '',
  margin_bottom TEXT DEFAULT '',
  margin_left TEXT DEFAULT '',
  margin_right TEXT DEFAULT '',

  width TEXT DEFAULT '',
  max_width TEXT DEFAULT '',
  min_width TEXT DEFAULT '',
  height TEXT DEFAULT '',
  min_height TEXT DEFAULT '',
  max_height TEXT DEFAULT '',

  border_style TEXT DEFAULT '',
  border_width TEXT DEFAULT '',
  border_color TEXT DEFAULT '',
  border_radius TEXT DEFAULT '',
  box_shadow TEXT DEFAULT '',

  opacity TEXT DEFAULT '',
  filter_blur TEXT DEFAULT '',
  filter_brightness TEXT DEFAULT '',
  filter_contrast TEXT DEFAULT '',
  filter_saturation TEXT DEFAULT '',

  position TEXT DEFAULT 'default',
  z_index TEXT DEFAULT '',
  overflow TEXT DEFAULT '',

  hide_on_desktop BOOLEAN DEFAULT false,
  hide_on_tablet BOOLEAN DEFAULT false,
  hide_on_mobile BOOLEAN DEFAULT false,
  responsive JSONB DEFAULT '{}',

  animation_type TEXT DEFAULT 'none',
  animation_duration TEXT DEFAULT '0.6s',
  animation_delay TEXT DEFAULT '0s',

  custom_css TEXT DEFAULT '',
  custom_class TEXT DEFAULT '',
  html_id TEXT DEFAULT '',
  aria_label TEXT DEFAULT '',
  hover JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_widgets_container ON public.page_widgets(container_id);

-- ==============================================================================
-- BLOCO 5: GLOBAL COMPONENTS, PUBLICATIONS, MEDIA & CAMPAIGNS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.global_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  thumbnail TEXT DEFAULT '',
  schema JSONB NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  theme_id UUID REFERENCES public.themes(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  page_id UUID REFERENCES public.pages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.page_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  published_by UUID,
  published_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_page_publications_page ON public.page_publications(page_id);

CREATE TABLE IF NOT EXISTS public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT '',
  file_size INTEGER DEFAULT 0,
  alt TEXT DEFAULT '',
  folder TEXT DEFAULT 'uploads',
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_folder ON public.media(folder);

-- ==============================================================================
-- BLOCO 6: STORE CATALOG (SEGMENTOS, CATEGORIAS & METADADOS DE PRODUTO)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.store_segments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  image_url   TEXT DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  theme_id    UUID REFERENCES public.themes(id) ON DELETE SET NULL,
  page_id     UUID REFERENCES public.pages(id) ON DELETE SET NULL,
  seo         JSONB DEFAULT '{}'::jsonb,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.store_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  segment_id  UUID NOT NULL REFERENCES public.store_segments(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES public.store_categories(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url   TEXT DEFAULT '',
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  page_id     UUID REFERENCES public.pages(id) ON DELETE SET NULL,
  seo         JSONB DEFAULT '{}'::jsonb,
  sort_order  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT uq_store_category_slug_per_segment UNIQUE (segment_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_store_categories_segment ON public.store_categories(segment_id);
CREATE INDEX IF NOT EXISTS idx_store_categories_parent  ON public.store_categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_store_categories_status  ON public.store_categories(status);

CREATE TABLE IF NOT EXISTS public.product_store_metadata (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id         UUID NOT NULL UNIQUE REFERENCES public.products(id) ON DELETE CASCADE,

  segment_id         UUID REFERENCES public.store_segments(id) ON DELETE SET NULL,
  category_id        UUID REFERENCES public.store_categories(id) ON DELETE SET NULL,

  sale_price         NUMERIC(10,2) CHECK (sale_price IS NULL OR sale_price >= 0),
  promotional_price  NUMERIC(10,2) CHECK (promotional_price IS NULL OR promotional_price >= 0),

  slug               TEXT UNIQUE,
  published          BOOLEAN NOT NULL DEFAULT false,
  featured           BOOLEAN NOT NULL DEFAULT false,

  short_description  TEXT DEFAULT '',
  store_description  TEXT DEFAULT '',
  specifications     JSONB DEFAULT '[]'::jsonb,

  seo                JSONB DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ DEFAULT now(),
  updated_at         TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_psm_segment   ON public.product_store_metadata(segment_id);
CREATE INDEX IF NOT EXISTS idx_psm_category  ON public.product_store_metadata(category_id);
CREATE INDEX IF NOT EXISTS idx_psm_featured  ON public.product_store_metadata(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_psm_published ON public.product_store_metadata(published) WHERE published = true;

-- Triggers de Updated_At e Validação de PSM
CREATE OR REPLACE FUNCTION public.fn_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_store_segments_updated_at ON public.store_segments;
CREATE TRIGGER trg_store_segments_updated_at
  BEFORE UPDATE ON public.store_segments
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_store_categories_updated_at ON public.store_categories;
CREATE TRIGGER trg_store_categories_updated_at
  BEFORE UPDATE ON public.store_categories
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

DROP TRIGGER IF EXISTS trg_psm_updated_at ON public.product_store_metadata;
CREATE TRIGGER trg_psm_updated_at
  BEFORE UPDATE ON public.product_store_metadata
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE OR REPLACE FUNCTION public.fn_validate_psm()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_base TEXT;
  v_candidate TEXT;
  v_suffix INTEGER := 0;
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    IF NEW.segment_id IS NULL THEN
      RAISE EXCEPTION 'segment_id é obrigatório quando category_id é definido';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.store_categories c
      WHERE c.id = NEW.category_id
        AND c.segment_id = NEW.segment_id
        AND c.status = 'active'
    ) THEN
      RAISE EXCEPTION 'Categoria % não pertence ao segmento % (ou está inativa)',
        NEW.category_id, NEW.segment_id;
    END IF;
  END IF;

  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    SELECT btrim(regexp_replace(
             translate(
               lower(COALESCE(p.name, 'produto')),
               'áàâãäéèêëíìîïóòôõöúùûüçñ',
               'aaaaaeeeeiiiiooooouuuucn'
             ),
             '[^a-z0-9]+', '-', 'g'
           ), '-')
      INTO v_base
      FROM public.products p
     WHERE p.id = NEW.product_id;

    IF v_base IS NULL OR v_base = '' THEN
      v_base := 'produto';
    END IF;

    v_candidate := v_base;
    WHILE EXISTS (SELECT 1 FROM public.product_store_metadata m WHERE m.slug = v_candidate) LOOP
      v_suffix := v_suffix + 1;
      v_candidate := v_base || '-' || v_suffix::text;
    END LOOP;
    NEW.slug := v_candidate;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_psm_validate ON public.product_store_metadata;
CREATE TRIGGER trg_psm_validate
  BEFORE INSERT OR UPDATE OF segment_id, category_id, slug ON public.product_store_metadata
  FOR EACH ROW EXECUTE FUNCTION public.fn_validate_psm();

-- ==============================================================================
-- BLOCO 7: INTEGRAÇÕES SEGURAS, WEBHOOKS & LOGS
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.integration_configs (
  id                     TEXT PRIMARY KEY,
  name                   TEXT NOT NULL,
  category               TEXT NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'pending_credentials',
  environment            TEXT NOT NULL DEFAULT 'sandbox',
  enabled                BOOLEAN NOT NULL DEFAULT FALSE,
  credentials            JSONB NOT NULL DEFAULT '{}',
  webhook_url            TEXT,
  webhook_secret         TEXT,
  last_sync_at           TIMESTAMPTZ,
  last_health_check_at   TIMESTAMPTZ,
  health_latency_ms      INT,
  error_message          TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_integration_configs_updated_at ON public.integration_configs;
CREATE TRIGGER trg_integration_configs_updated_at
  BEFORE UPDATE ON public.integration_configs
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_updated_at();

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_hash      TEXT NOT NULL UNIQUE,
  provider_id     TEXT NOT NULL,
  event_type      TEXT NOT NULL,
  event_id        TEXT,
  status          TEXT NOT NULL DEFAULT 'received',
  payload         JSONB,
  result          JSONB,
  error_message   TEXT,
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_hash        ON public.webhook_events(event_hash);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider    ON public.webhook_events(provider_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_received_at ON public.webhook_events(received_at DESC);

CREATE TABLE IF NOT EXISTS public.integration_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id      TEXT NOT NULL,
  category         TEXT NOT NULL,
  action           TEXT NOT NULL,
  status           TEXT NOT NULL DEFAULT 'pending',
  order_id         TEXT,
  order_number     TEXT,
  latency_ms       INT,
  request_payload  JSONB,
  response_payload JSONB,
  error_message    TEXT,
  can_reprocess    BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integration_logs_provider ON public.integration_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_order    ON public.integration_logs(order_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_created  ON public.integration_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_integration_logs_status   ON public.integration_logs(status);

-- View e RPCs Write-Only para Segurança Máxima de Credenciais
CREATE OR REPLACE VIEW public.vw_integration_statuses AS
SELECT
  id,
  name,
  category,
  status,
  environment,
  enabled,
  webhook_url,
  last_sync_at,
  last_health_check_at,
  health_latency_ms,
  error_message,
  created_at,
  updated_at,
  (credentials IS NOT NULL AND credentials != '{}'::jsonb AND jsonb_typeof(credentials) = 'object' AND credentials != 'null'::jsonb) AS has_credentials
FROM public.integration_configs;

CREATE OR REPLACE FUNCTION public.fn_get_integration_statuses()
RETURNS TABLE (
  id                   TEXT,
  name                 TEXT,
  category             TEXT,
  status               TEXT,
  environment          TEXT,
  enabled              BOOLEAN,
  webhook_url          TEXT,
  last_sync_at         TIMESTAMPTZ,
  last_health_check_at TIMESTAMPTZ,
  health_latency_ms    INT,
  error_message        TEXT,
  created_at           TIMESTAMPTZ,
  updated_at           TIMESTAMPTZ,
  has_credentials      BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    id,
    name,
    category,
    status,
    environment,
    enabled,
    webhook_url,
    last_sync_at,
    last_health_check_at,
    health_latency_ms,
    error_message,
    created_at,
    updated_at,
    has_credentials
  FROM public.vw_integration_statuses;
$$;

CREATE OR REPLACE FUNCTION public.fn_save_integration_credentials(
  p_id          TEXT,
  p_credentials JSONB DEFAULT NULL,
  p_environment TEXT DEFAULT 'sandbox',
  p_enabled     BOOLEAN DEFAULT TRUE,
  p_webhook_url TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credentials JSONB;
BEGIN
  SELECT credentials INTO v_current_credentials
  FROM public.integration_configs
  WHERE id = p_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Provedor % não encontrado.', p_id;
  END IF;

  IF p_credentials IS NOT NULL AND p_credentials != '{}'::jsonb THEN
    v_current_credentials := p_credentials;
  END IF;

  UPDATE public.integration_configs
  SET
    credentials = v_current_credentials,
    environment = COALESCE(p_environment, environment),
    enabled = COALESCE(p_enabled, enabled),
    webhook_url = COALESCE(p_webhook_url, webhook_url),
    status = CASE
      WHEN v_current_credentials IS NOT NULL AND v_current_credentials != '{}'::jsonb THEN 'connected'
      ELSE 'pending_credentials'
    END,
    updated_at = NOW()
  WHERE id = p_id;

  RETURN jsonb_build_object(
    'success', TRUE,
    'id', p_id,
    'status', CASE WHEN v_current_credentials IS NOT NULL AND v_current_credentials != '{}'::jsonb THEN 'connected' ELSE 'pending_credentials' END,
    'has_credentials', (v_current_credentials IS NOT NULL AND v_current_credentials != '{}'::jsonb)
  );
END;
$$;

-- ==============================================================================
-- BLOCO 8: ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.page_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_store_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_logs ENABLE ROW LEVEL SECURITY;

-- Limpar policies antigas se existirem
DROP POLICY IF EXISTS "Public can read active themes" ON public.themes;
DROP POLICY IF EXISTS "Public can read active templates" ON public.templates;
DROP POLICY IF EXISTS "Public can read published pages" ON public.pages;
DROP POLICY IF EXISTS "Public can read sections of published pages" ON public.page_sections;
DROP POLICY IF EXISTS "Public can read containers of published page sections" ON public.page_containers;
DROP POLICY IF EXISTS "Public can read widgets of published containers" ON public.page_widgets;
DROP POLICY IF EXISTS "Public can read global components" ON public.global_components;
DROP POLICY IF EXISTS "Public can read active campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Public can read media" ON public.media;

DROP POLICY IF EXISTS "Hub admins manage themes" ON public.themes;
DROP POLICY IF EXISTS "Hub admins manage templates" ON public.templates;
DROP POLICY IF EXISTS "Hub admins manage pages" ON public.pages;
DROP POLICY IF EXISTS "Hub admins manage sections" ON public.page_sections;
DROP POLICY IF EXISTS "Hub admins manage containers" ON public.page_containers;
DROP POLICY IF EXISTS "Hub admins manage widgets" ON public.page_widgets;
DROP POLICY IF EXISTS "Hub admins manage global components" ON public.global_components;
DROP POLICY IF EXISTS "Hub admins manage campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Hub admins manage publications" ON public.page_publications;
DROP POLICY IF EXISTS "Hub admins manage media" ON public.media;

DROP POLICY IF EXISTS "Public read active segments" ON public.store_segments;
DROP POLICY IF EXISTS "Public read active categories of active segments" ON public.store_categories;
DROP POLICY IF EXISTS "Public read published product metadata" ON public.product_store_metadata;
DROP POLICY IF EXISTS "Hub admins insert segments" ON public.store_segments;
DROP POLICY IF EXISTS "Hub admins update segments" ON public.store_segments;
DROP POLICY IF EXISTS "Hub admins delete segments" ON public.store_segments;
DROP POLICY IF EXISTS "Hub admins insert categories" ON public.store_categories;
DROP POLICY IF EXISTS "Hub admins update categories" ON public.store_categories;
DROP POLICY IF EXISTS "Hub admins delete categories" ON public.store_categories;
DROP POLICY IF EXISTS "Hub admins insert product metadata" ON public.product_store_metadata;
DROP POLICY IF EXISTS "Hub admins update product metadata" ON public.product_store_metadata;
DROP POLICY IF EXISTS "Hub admins delete product metadata" ON public.product_store_metadata;

DROP POLICY IF EXISTS "hub_admins_all_integration_configs" ON public.integration_configs;
DROP POLICY IF EXISTS "hub_admins_all_webhook_events" ON public.webhook_events;
DROP POLICY IF EXISTS "hub_admins_all_integration_logs" ON public.integration_logs;

-- Políticas de LEITURA PÚBLICA (apenas ativo / publicado)
CREATE POLICY "Public can read active themes" ON public.themes FOR SELECT USING (status = 'active');
CREATE POLICY "Public can read active templates" ON public.templates FOR SELECT USING (active = true);
CREATE POLICY "Public can read published pages" ON public.pages FOR SELECT USING (status = 'published');

CREATE POLICY "Public can read sections of published pages" ON public.page_sections
  FOR SELECT USING (page_id IN (SELECT id FROM public.pages WHERE status = 'published'));

CREATE POLICY "Public can read containers of published page sections" ON public.page_containers
  FOR SELECT USING (section_id IN (
    SELECT ps.id FROM public.page_sections ps JOIN public.pages p ON p.id = ps.page_id WHERE p.status = 'published'
  ));

CREATE POLICY "Public can read widgets of published containers" ON public.page_widgets
  FOR SELECT USING (container_id IN (
    SELECT pc.id FROM public.page_containers pc
    JOIN public.page_sections ps ON ps.id = pc.section_id
    JOIN public.pages p ON p.id = ps.page_id
    WHERE p.status = 'published'
  ));

CREATE POLICY "Public can read global components" ON public.global_components FOR SELECT USING (true);
CREATE POLICY "Public can read active campaigns" ON public.campaigns FOR SELECT USING (status = 'active');
CREATE POLICY "Public can read media" ON public.media FOR SELECT USING (true);

CREATE POLICY "Public read active segments" ON public.store_segments FOR SELECT USING (status = 'active');
CREATE POLICY "Public read active categories of active segments" ON public.store_categories FOR SELECT
  USING (
    status = 'active'
    AND EXISTS (
      SELECT 1 FROM public.store_segments s
      WHERE s.id = segment_id AND s.status = 'active'
    )
  );

CREATE POLICY "Public read published product metadata" ON public.product_store_metadata FOR SELECT USING (published = true);

-- Políticas de GESTÃO ADMINISTRATIVA (restrito ao Hub Admin autenticado)
CREATE POLICY "Hub admins manage themes" ON public.themes FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage templates" ON public.templates FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage pages" ON public.pages FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage sections" ON public.page_sections FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage containers" ON public.page_containers FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage widgets" ON public.page_widgets FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage global components" ON public.global_components FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage campaigns" ON public.campaigns FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage publications" ON public.page_publications FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins manage media" ON public.media FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "Hub admins insert segments" ON public.store_segments FOR INSERT TO authenticated
  WITH CHECK (public.fn_is_hub_admin());
CREATE POLICY "Hub admins update segments" ON public.store_segments FOR UPDATE TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());
CREATE POLICY "Hub admins delete segments" ON public.store_segments FOR DELETE TO authenticated
  USING (public.fn_is_hub_admin());

CREATE POLICY "Hub admins insert categories" ON public.store_categories FOR INSERT TO authenticated
  WITH CHECK (public.fn_is_hub_admin());
CREATE POLICY "Hub admins update categories" ON public.store_categories FOR UPDATE TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());
CREATE POLICY "Hub admins delete categories" ON public.store_categories FOR DELETE TO authenticated
  USING (public.fn_is_hub_admin());

CREATE POLICY "Hub admins insert product metadata" ON public.product_store_metadata FOR INSERT TO authenticated
  WITH CHECK (public.fn_is_hub_admin());
CREATE POLICY "Hub admins update product metadata" ON public.product_store_metadata FOR UPDATE TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());
CREATE POLICY "Hub admins delete product metadata" ON public.product_store_metadata FOR DELETE TO authenticated
  USING (public.fn_is_hub_admin());

CREATE POLICY "hub_admins_all_integration_configs" ON public.integration_configs FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "hub_admins_all_webhook_events" ON public.webhook_events FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

CREATE POLICY "hub_admins_all_integration_logs" ON public.integration_logs FOR ALL TO authenticated
  USING (public.fn_is_hub_admin()) WITH CHECK (public.fn_is_hub_admin());

-- ==============================================================================
-- BLOCO 9: SEEDS INICIAIS (IDEMPOTENTES)
-- ==============================================================================
INSERT INTO public.integration_configs (id, name, category, status, environment, enabled, credentials)
VALUES
  ('mercado_pago', 'Mercado Pago',        'payment',  'pending_credentials', 'sandbox',    FALSE, '{}'),
  ('asaas',        'Asaas',               'payment',  'pending_credentials', 'sandbox',    FALSE, '{}'),
  ('focus_nfe',    'Focus NFe',           'fiscal',   'pending_credentials', 'sandbox',    FALSE, '{}'),
  ('bling',        'Bling ERP',           'fiscal',   'pending_credentials', 'production', FALSE, '{}'),
  ('melhor_envio', 'Melhor Envio',        'shipping', 'pending_credentials', 'sandbox',    FALSE, '{}'),
  ('frenet',       'Frenet',              'shipping', 'pending_credentials', 'production', FALSE, '{}'),
  ('site_teknix',  'Loja Propria (SITE)', 'channel',  'connected',           'production', TRUE,  '{"storeUrl":"http://localhost:5173"}')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.store_segments (id, name, slug, description, sort_order) VALUES
  ('10000000-0000-4000-8000-000000000001', 'Ferramentas', 'ferramentas', 'Elétricas, manuais e acessórios profissionais', 1),
  ('10000000-0000-4000-8000-000000000002', 'Informática', 'informatica', 'Periféricos, componentes e soluções técnicas', 2),
  ('10000000-0000-4000-8000-000000000003', 'Casa',        'casa',        'Tudo para organização e manutenção do lar', 3),
  ('10000000-0000-4000-8000-000000000004', 'Automotivo',  'automotivo',  'Ferramentas e acessórios para seu veículo', 4)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.store_categories (id, segment_id, name, slug, sort_order) VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Furadeiras',          'furadeiras', 1),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Parafusadeiras',      'parafusadeiras', 2),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Serras',              'serras', 3),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Ferramentas Manuais', 'ferramentas-manuais', 4),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', 'Kits',                'kits', 5),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', 'Notebooks',          'notebooks', 1),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', 'Monitores',          'monitores', 2),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000002', 'Teclados',           'teclados', 3),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000002', 'Mouses',             'mouses', 4)
ON CONFLICT (id) DO NOTHING;
