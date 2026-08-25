-- ============================================
-- TEKNIX Page Builder - Seed Data
-- ============================================

-- 1. Default Theme: TEKNIX DEFAULT
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

-- 3. Default Home Page (draft, empty)
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
