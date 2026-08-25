-- TEKNIX Page Builder — Full Schema
-- Migration 001: Themes, Templates, Pages, Sections, Containers, Columns, Widgets, Global Components

-- ============================================================
-- THEMES / DESIGN SYSTEM
-- ============================================================
CREATE TABLE IF NOT EXISTS themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_default BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'archived'

  -- Typography
  font_heading TEXT DEFAULT 'Inter',
  font_body TEXT DEFAULT 'Inter',
  font_button TEXT DEFAULT 'Inter',
  font_input TEXT DEFAULT 'Inter',
  font_accent TEXT DEFAULT 'Inter',
  font_scale NUMERIC(1,2) DEFAULT 1.25, -- typographic scale ratio

  -- Colors
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

  -- Spacing
  spacing_xs TEXT DEFAULT '4px',
  spacing_sm TEXT DEFAULT '8px',
  spacing_md TEXT DEFAULT '16px',
  spacing_lg TEXT DEFAULT '24px',
  spacing_xl TEXT DEFAULT '32px',
  spacing_2xl TEXT DEFAULT '48px',
  spacing_3xl TEXT DEFAULT '64px',
  spacing_4xl TEXT DEFAULT '96px',

  -- Border Radius
  radius_sm TEXT DEFAULT '4px',
  radius_md TEXT DEFAULT '8px',
  radius_lg TEXT DEFAULT '12px',
  radius_xl TEXT DEFAULT '16px',
  radius_full TEXT DEFAULT '9999px',

  -- Shadows
  shadow_sm TEXT DEFAULT '0 1px 2px rgba(0,0,0,0.05)',
  shadow_md TEXT DEFAULT '0 4px 6px rgba(0,0,0,0.07)',
  shadow_lg TEXT DEFAULT '0 10px 15px rgba(0,0,0,0.1)',
  shadow_xl TEXT DEFAULT '0 20px 25px rgba(0,0,0,0.15)',

  -- Container
  container_width TEXT DEFAULT '1200px',
  container_width_narrow TEXT DEFAULT '800px',
  container_width_wide TEXT DEFAULT '1400px',
  container_padding TEXT DEFAULT '24px',

  -- Buttons
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

  -- Custom overrides (JSON for anything not covered above)
  custom JSONB DEFAULT '{}',

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_themes_slug ON themes(slug);

-- ============================================================
-- TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'home', 'product', 'category', 'segment', 'campaign', 'landing', 'custom'
  description TEXT DEFAULT '',
  thumbnail TEXT DEFAULT '',
  theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,

  -- The template's section structure
  schema JSONB NOT NULL DEFAULT '[]',

  active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);

-- ============================================================
-- PAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'custom',
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'published'
  is_landing_mode BOOLEAN DEFAULT false, -- hide header/footer/menu

  -- Theme & Template binding
  theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,

  -- Header/Footer override
  header_id UUID,
  footer_id UUID,
  menu JSONB DEFAULT '[]', -- custom menu items for this page

  -- SEO
  seo_title TEXT DEFAULT '',
  seo_description TEXT DEFAULT '',
  seo_image TEXT DEFAULT '',
  seo_slug TEXT DEFAULT '',
  seo_canonical TEXT DEFAULT '',
  seo_og JSONB DEFAULT '{}',
  head_scripts TEXT DEFAULT '', -- <head> injection (page-specific)
  body_scripts TEXT DEFAULT '', -- <body> injection (page-specific)

  -- Page-level style overrides (JSON)
  page_styles JSONB DEFAULT '{}', -- overrides theme tokens for this page

  -- Version tracking
  version INTEGER DEFAULT 1,

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(type);

-- ============================================================
-- PAGE SECTIONS (top-level containers)
-- ============================================================
CREATE TABLE IF NOT EXISTS page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'section',
  "order" INTEGER NOT NULL DEFAULT 0,

  -- Layout settings
  layout TEXT DEFAULT 'boxed', -- 'boxed', 'full', 'wide'
  direction TEXT DEFAULT 'column', -- 'column', 'row'
  gap TEXT DEFAULT '0',
  max_width TEXT DEFAULT '',
  min_height TEXT DEFAULT '',

  -- Background
  bg_type TEXT DEFAULT 'none', -- 'none', 'color', 'image', 'video', 'gradient'
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

  -- Spacing
  padding_top TEXT DEFAULT '80px',
  padding_bottom TEXT DEFAULT '80px',
  padding_left TEXT DEFAULT '0',
  padding_right TEXT DEFAULT '0',
  margin_top TEXT DEFAULT '',
  margin_bottom TEXT DEFAULT '',

  -- Border
  border_top TEXT DEFAULT '',
  border_bottom TEXT DEFAULT '',
  border_color TEXT DEFAULT '',
  border_radius TEXT DEFAULT '',
  box_shadow TEXT DEFAULT '',

  -- Responsive visibility
  hide_on_desktop BOOLEAN DEFAULT false,
  hide_on_tablet BOOLEAN DEFAULT false,
  hide_on_mobile BOOLEAN DEFAULT false,

  -- Animation
  animation_type TEXT DEFAULT 'none',
  animation_duration TEXT DEFAULT '0.6s',
  animation_delay TEXT DEFAULT '0s',
  animation_offset TEXT DEFAULT '80px',

  -- Custom CSS (admin only)
  custom_css TEXT DEFAULT '',
  custom_class TEXT DEFAULT '',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_sections_page ON page_sections(page_id);

-- ============================================================
-- CONTAINERS (inside sections)
-- ============================================================
CREATE TABLE IF NOT EXISTS page_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES page_sections(id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL DEFAULT 0,

  -- Layout
  direction TEXT DEFAULT 'row',
  gap TEXT DEFAULT '16px',
  align_items TEXT DEFAULT 'stretch',
  justify_content TEXT DEFAULT 'flex-start',
  flex_wrap TEXT DEFAULT 'nowrap',
  flex_grow TEXT DEFAULT '0',
  flex_shrink TEXT DEFAULT '1',

  -- Width
  width TEXT DEFAULT '',
  max_width TEXT DEFAULT '',
  min_height TEXT DEFAULT '',

  -- Background
  bg_type TEXT DEFAULT 'none',
  bg_color TEXT DEFAULT '',
  bg_image TEXT DEFAULT '',
  bg_gradient TEXT DEFAULT '',
  bg_overlay TEXT DEFAULT '',
  bg_opacity NUMERIC(3,2) DEFAULT 1,

  -- Spacing
  padding_top TEXT DEFAULT '',
  padding_bottom TEXT DEFAULT '',
  padding_left TEXT DEFAULT '',
  padding_right TEXT DEFAULT '',
  margin_top TEXT DEFAULT '',
  margin_bottom TEXT DEFAULT '',

  -- Border
  border TEXT DEFAULT '',
  border_color TEXT DEFAULT '',
  border_radius TEXT DEFAULT '',
  box_shadow TEXT DEFAULT '',

  -- Responsive
  hide_on_desktop BOOLEAN DEFAULT false,
  hide_on_tablet BOOLEAN DEFAULT false,
  hide_on_mobile BOOLEAN DEFAULT false,

  -- Custom
  custom_css TEXT DEFAULT '',
  custom_class TEXT DEFAULT '',

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_containers_section ON page_containers(section_id);

-- ============================================================
-- WIDGETS (inside containers)
-- ============================================================
CREATE TABLE IF NOT EXISTS page_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id UUID NOT NULL REFERENCES page_containers(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- heading, text, image, button, video, spacer, divider, product, etc.
  "order" INTEGER NOT NULL DEFAULT 0,

  -- Content (widget-specific JSON)
  content JSONB DEFAULT '{}',

  -- Style
  -- Typography
  font_family TEXT DEFAULT '',
  font_size TEXT DEFAULT '',
  font_weight TEXT DEFAULT '',
  line_height TEXT DEFAULT '',
  letter_spacing TEXT DEFAULT '',
  text_transform TEXT DEFAULT '',
  text_align TEXT DEFAULT 'left',
  color TEXT DEFAULT '',

  -- Background
  bg_type TEXT DEFAULT 'none',
  bg_color TEXT DEFAULT '',
  bg_image TEXT DEFAULT '',
  bg_gradient TEXT DEFAULT '',
  bg_overlay TEXT DEFAULT '',
  bg_opacity NUMERIC(3,2) DEFAULT 1,

  -- Spacing
  padding_top TEXT DEFAULT '',
  padding_bottom TEXT DEFAULT '',
  padding_left TEXT DEFAULT '',
  padding_right TEXT DEFAULT '',
  margin_top TEXT DEFAULT '',
  margin_bottom TEXT DEFAULT '',
  margin_left TEXT DEFAULT '',
  margin_right TEXT DEFAULT '',

  -- Sizing
  width TEXT DEFAULT '',
  max_width TEXT DEFAULT '',
  min_width TEXT DEFAULT '',
  height TEXT DEFAULT '',
  min_height TEXT DEFAULT '',
  max_height TEXT DEFAULT '',

  -- Border
  border_style TEXT DEFAULT '',
  border_width TEXT DEFAULT '',
  border_color TEXT DEFAULT '',
  border_radius TEXT DEFAULT '',
  box_shadow TEXT DEFAULT '',

  -- Effects
  opacity TEXT DEFAULT '',
  filter_blur TEXT DEFAULT '',
  filter_brightness TEXT DEFAULT '',
  filter_contrast TEXT DEFAULT '',
  filter_saturation TEXT DEFAULT '',

  -- Position
  position TEXT DEFAULT 'default', -- default, relative, absolute, fixed, sticky
  z_index TEXT DEFAULT '',
  overflow TEXT DEFAULT '',

  -- Responsive visibility
  hide_on_desktop BOOLEAN DEFAULT false,
  hide_on_tablet BOOLEAN DEFAULT false,
  hide_on_mobile BOOLEAN DEFAULT false,

  -- Responsive overrides
  responsive JSONB DEFAULT '{}', -- { tablet: { font_size, ... }, mobile: { font_size, ... } }

  -- Animation
  animation_type TEXT DEFAULT 'none',
  animation_duration TEXT DEFAULT '0.6s',
  animation_delay TEXT DEFAULT '0s',

  -- Advanced
  custom_css TEXT DEFAULT '',
  custom_class TEXT DEFAULT '',
  html_id TEXT DEFAULT '',
  aria_label TEXT DEFAULT '',

  -- Hover
  hover JSONB DEFAULT '{}', -- { color, bg_color, transform, shadow, transition }

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_widgets_container ON page_widgets(container_id);

-- ============================================================
-- GLOBAL COMPONENTS (reusable across pages)
-- ============================================================
CREATE TABLE IF NOT EXISTS global_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  thumbnail TEXT DEFAULT '',
  schema JSONB NOT NULL, -- full section/container/widget structure
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- MENUS
-- ============================================================
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  location TEXT DEFAULT 'header', -- 'header', 'footer', 'mobile', 'sidebar'
  is_global BOOLEAN DEFAULT false,
  theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
  items JSONB DEFAULT '[]', -- [{ label, link, type, children, target, icon }]
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- HEADERS
-- ============================================================
CREATE TABLE IF NOT EXISTS page_headers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_global BOOLEAN DEFAULT false,
  theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  sections JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FOOTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS page_footers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_global BOOLEAN DEFAULT false,
  theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  sections JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PRODUCT PRESENTATION LINK
-- ============================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS presentation_page_id UUID REFERENCES pages(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_presentation ON products(presentation_page_id);

-- ============================================================
-- PUBLICATIONS (Version history)
-- ============================================================
CREATE TABLE IF NOT EXISTS page_publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  snapshot JSONB NOT NULL,
  published_by UUID,
  published_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_page_publications_page ON page_publications(page_id);

-- ============================================================
-- MEDIA LIBRARY
-- ============================================================
CREATE TABLE IF NOT EXISTS media (
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

CREATE INDEX IF NOT EXISTS idx_media_folder ON media(folder);

-- ============================================================
-- RLS POLICIES
-- ============================================================
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_containers ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE global_components ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_headers ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_footers ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can read active themes" ON themes FOR SELECT USING (status = 'active');
CREATE POLICY "Public can read active templates" ON templates FOR SELECT USING (active = true);
CREATE POLICY "Public can read published pages" ON pages FOR SELECT USING (status = 'published');

CREATE POLICY "Public can read sections of published pages" ON page_sections
  FOR SELECT USING (page_id IN (SELECT id FROM pages WHERE status = 'published'));

CREATE POLICY "Public can read containers of published page sections" ON page_containers
  FOR SELECT USING (section_id IN (
    SELECT ps.id FROM page_sections ps JOIN pages p ON p.id = ps.page_id WHERE p.status = 'published'
  ));

CREATE POLICY "Public can read widgets of published containers" ON page_widgets
  FOR SELECT USING (container_id IN (
    SELECT pc.id FROM page_containers pc
    JOIN page_sections ps ON ps.id = pc.section_id
    JOIN pages p ON p.id = ps.page_id
    WHERE p.status = 'published'
  ));

CREATE POLICY "Public can read global components" ON global_components FOR SELECT USING (true);
CREATE POLICY "Public can read global menus" ON menus FOR SELECT USING (is_global = true AND status = 'active');
CREATE POLICY "Public can read global headers" ON page_headers FOR SELECT USING (is_global = true AND status = 'published');
CREATE POLICY "Public can read global footers" ON page_footers FOR SELECT USING (is_global = true AND status = 'published');
CREATE POLICY "Public can read active campaigns" ON campaigns FOR SELECT USING (status = 'active');
CREATE POLICY "Public can read media" ON media FOR SELECT USING (true);

-- Authenticated full access
CREATE POLICY "Authenticated can manage themes" ON themes FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage templates" ON templates FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage pages" ON pages FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage sections" ON page_sections FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage containers" ON page_containers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage widgets" ON page_widgets FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage global components" ON global_components FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage menus" ON menus FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage headers" ON page_headers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage footers" ON page_footers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage campaigns" ON campaigns FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage publications" ON page_publications FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage media" ON media FOR ALL USING (auth.role() = 'authenticated');
