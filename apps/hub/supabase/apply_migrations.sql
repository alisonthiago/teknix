-- ================================================================
-- TEKNIX PAGE BUILDER — MIGRATIONS UNIFICADAS
-- Execute este arquivo no Supabase Dashboard > SQL Editor > New Query
-- ================================================================

-- ============================================================
-- 001: THEMES / DESIGN SYSTEM
-- ============================================================
CREATE TABLE IF NOT EXISTS themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_default BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'active',

  font_heading TEXT DEFAULT 'Inter',
  font_body TEXT DEFAULT 'Inter',
  font_button TEXT DEFAULT 'Inter',
  font_input TEXT DEFAULT 'Inter',
  font_accent TEXT DEFAULT 'Inter',
  font_scale NUMERIC(3,2) DEFAULT 1.25,

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

  spacing_xs TEXT DEFAULT '4px',
  spacing_sm TEXT DEFAULT '8px',
  spacing_md TEXT DEFAULT '16px',
  spacing_lg TEXT DEFAULT '24px',
  spacing_xl TEXT DEFAULT '32px',
  spacing_2xl TEXT DEFAULT '48px',
  spacing_3xl TEXT DEFAULT '64px',
  spacing_4xl TEXT DEFAULT '96px',

  radius_sm TEXT DEFAULT '4px',
  radius_md TEXT DEFAULT '8px',
  radius_lg TEXT DEFAULT '12px',
  radius_xl TEXT DEFAULT '16px',
  radius_full TEXT DEFAULT '9999px',

  shadow_sm TEXT DEFAULT '0 1px 2px rgba(0,0,0,0.05)',
  shadow_md TEXT DEFAULT '0 4px 6px rgba(0,0,0,0.07)',
  shadow_lg TEXT DEFAULT '0 10px 15px rgba(0,0,0,0.1)',
  shadow_xl TEXT DEFAULT '0 20px 25px rgba(0,0,0,0.15)',

  container_width TEXT DEFAULT '1200px',
  container_width_narrow TEXT DEFAULT '800px',
  container_width_wide TEXT DEFAULT '1400px',
  container_padding TEXT DEFAULT '24px',

  button_font_size TEXT DEFAULT '1rem',
  button_font_weight TEXT DEFAULT '600',
  button_padding_x TEXT DEFAULT '24px',
  button_padding_y TEXT DEFAULT '12px',
  button_radius TEXT DEFAULT '9999px',
  button_bg TEXT DEFAULT '#00ff88',
  button_color TEXT DEFAULT '#0a0a0a',
  button_hover_bg TEXT DEFAULT '#00cc6a',
  button_hover_color TEXT DEFAULT '#0a0a0a',

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

  body_size TEXT DEFAULT '1rem',
  body_line_height TEXT DEFAULT '1.7',
  body_letter_spacing TEXT DEFAULT '0',

  custom JSONB DEFAULT '{}',

  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_themes_slug ON themes(slug);

-- ============================================================
-- 001: TEMPLATES
-- ============================================================
CREATE TABLE IF NOT EXISTS templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  description TEXT DEFAULT '',
  thumbnail TEXT DEFAULT '',
  theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
  schema JSONB NOT NULL DEFAULT '[]',
  active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_type ON templates(type);

-- ============================================================
-- 001: PAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'custom',
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  is_landing_mode BOOLEAN DEFAULT false,

  theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
  template_id UUID REFERENCES templates(id) ON DELETE SET NULL,

  header_id UUID,
  footer_id UUID,
  menu JSONB DEFAULT '[]',

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

CREATE INDEX IF NOT EXISTS idx_pages_slug ON pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(type);

-- ============================================================
-- 001: PAGE SECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS page_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_page_sections_page ON page_sections(page_id);

-- ============================================================
-- 001: CONTAINERS
-- ============================================================
CREATE TABLE IF NOT EXISTS page_containers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES page_sections(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_page_containers_section ON page_containers(section_id);

-- ============================================================
-- 001: WIDGETS
-- ============================================================
CREATE TABLE IF NOT EXISTS page_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  container_id UUID NOT NULL REFERENCES page_containers(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_page_widgets_container ON page_widgets(container_id);

-- ============================================================
-- 001: GLOBAL COMPONENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS global_components (
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

-- ============================================================
-- 001: MENUS
-- ============================================================
CREATE TABLE IF NOT EXISTS menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  location TEXT DEFAULT 'header',
  is_global BOOLEAN DEFAULT false,
  theme_id UUID REFERENCES themes(id) ON DELETE SET NULL,
  items JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 001: HEADERS
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
-- 001: FOOTERS
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
-- 001: CAMPAIGNS
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
-- 001: PRODUCT PRESENTATION LINK (ALTER TABLE - additive only)
-- ============================================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS presentation_page_id UUID REFERENCES pages(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_products_presentation ON products(presentation_page_id);

-- ============================================================
-- 001: PUBLICATIONS (Version history)
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
-- 001: MEDIA LIBRARY
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
-- 001: RLS POLICIES
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


-- ================================================================
-- SEED DATA
-- ================================================================

-- 1. Default Theme
INSERT INTO themes (id, name, slug, is_default, status, font_heading, font_body, font_button, font_input, font_accent, font_scale, color_primary, color_secondary, color_accent, color_background, color_surface, color_text, color_text_muted, color_text_light, color_border, color_success, color_warning, color_error, spacing_xs, spacing_sm, spacing_md, spacing_lg, spacing_xl, spacing_2xl, spacing_3xl, spacing_4xl, radius_sm, radius_md, radius_lg, radius_xl, radius_full, shadow_sm, shadow_md, shadow_lg, shadow_xl, container_width, container_width_narrow, container_width_wide, container_padding, button_font_size, button_font_weight, button_padding_x, button_padding_y, button_radius, button_bg, button_color, button_hover_bg, button_hover_color, h1_size, h1_weight, h1_line_height, h2_size, h2_weight, h2_line_height, h3_size, h3_weight, h3_line_height, h4_size, h4_weight, h5_size, h5_weight, h6_size, h6_weight, body_size, body_line_height, body_letter_spacing)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'TEKNIX Default',
  'teknix-default',
  true,
  'active',
  'Inter',
  'Inter',
  'Inter',
  'Inter',
  'Inter',
  1.25,
  '#00ff88',
  '#1a1a1a',
  '#3b82f6',
  '#ffffff',
  '#f5f5f7',
  '#1a1a1a',
  '#666666',
  '#999999',
  '#e5e5e5',
  '#00cc6a',
  '#f59e0b',
  '#dc2626',
  '4px', '8px', '16px', '24px', '32px', '48px', '64px', '96px',
  '4px', '8px', '12px', '16px', '9999px',
  '0 1px 2px rgba(0,0,0,0.05)',
  '0 4px 6px rgba(0,0,0,0.07)',
  '0 10px 15px rgba(0,0,0,0.1)',
  '0 20px 25px rgba(0,0,0,0.15)',
  '1200px', '800px', '1400px', '24px',
  '1rem', '600', '24px', '12px', '9999px',
  '#00ff88', '#0a0a0a', '#00cc6a', '#0a0a0a',
  '3.5rem', '700', '1.1',
  '2.5rem', '700', '1.2',
  '2rem', '600', '1.3',
  '1.5rem', '600',
  '1.25rem', '600',
  '1rem', '600',
  '1rem', '1.7', '0'
)
ON CONFLICT (slug) DO NOTHING;

-- 2. Default Templates
INSERT INTO templates (id, name, slug, type, description, schema, active) VALUES
('b0000000-0000-0000-0000-000000000001', 'Blank', 'blank', 'custom', 'Empty page template', '[]'::jsonb, true),
('b0000000-0000-0000-0000-000000000002', 'Editorial', 'editorial', 'product', 'Editorial product page layout', '[]'::jsonb, true),
('b0000000-0000-0000-0000-000000000003', 'Product Standard', 'product-standard', 'product', 'Standard product page', '[]'::jsonb, true),
('b0000000-0000-0000-0000-000000000004', 'Category', 'category', 'category', 'Category page layout', '[]'::jsonb, true),
('b0000000-0000-0000-0000-000000000005', 'Landing Page', 'landing-page', 'landing', 'Landing page layout', '[]'::jsonb, true)
ON CONFLICT (slug) DO NOTHING;

-- 3. Default Home Page (draft)
INSERT INTO pages (id, type, slug, title, status, theme_id, is_landing_mode, seo_title, seo_description, seo_slug)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'home',
  '/',
  'Home',
  'draft',
  'a0000000-0000-0000-0000-000000000001',
  false,
  'TEKNIX - Ferramentas e Tecnologia',
  'Loja premium de ferramentas, informática, casa e automotivo',
  '/'
)
ON CONFLICT (slug) DO NOTHING;

-- 4. Default Menu
INSERT INTO menus (id, name, slug, location, is_global, items, status)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'Menu Principal',
  'menu-principal',
  'header',
  true,
  '[
    {"id":"1","label":"Home","link":"/","type":"url"},
    {"id":"2","label":"Ferramentas","link":"/?segmento=ferramentas","type":"url"},
    {"id":"3","label":"Informática","link":"/?segmento=informatica","type":"url"},
    {"id":"4","label":"Casa","link":"/?segmento=casa","type":"url"},
    {"id":"5","label":"Automotivo","link":"/?segmento=automotivo","type":"url"},
    {"id":"6","label":"Contato","link":"/contato","type":"url"}
  ]'::jsonb,
  'active'
)
ON CONFLICT (slug) DO NOTHING;

-- ================================================================
-- FIM - Todas as migrations aplicadas com sucesso
-- ================================================================
