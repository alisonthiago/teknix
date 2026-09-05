import { supabase } from '../apps/hub/src/lib/supabase'

async function seedHome3() {
  console.log('🌱 Creating /home3 page in Supabase...')

  // 1. Check if /home3 page exists
  const { data: existingPage } = await supabase
    .from('pages')
    .select('id')
    .eq('slug', 'home3')
    .maybeSingle()

  let pageId = existingPage?.id

  if (!pageId) {
    const { data: newPage, error } = await supabase
      .from('pages')
      .insert({
        type: 'custom',
        slug: 'home3',
        title: 'Home 3 — TEKNIX Oficial',
        status: 'published',
        is_landing_mode: false,
        seo_title: 'Home 3 — TEKNIX Oficial',
        seo_description: 'Página oficial TEKNIX estilo Apple com todas as seções editáveis no Page Builder.',
        seo_slug: 'home3',
        version: 1,
        page_styles: { custom_css: '' }
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating page:', error)
      process.exit(1)
    }
    pageId = newPage.id
    console.log('✓ Created page /home3 with ID:', pageId)
  } else {
    console.log('✓ Page /home3 already exists with ID:', pageId)
  }

  // 2. Delete existing sections
  await supabase.from('page_sections').delete().eq('page_id', pageId)

  // 3. Build section tree
  const s1_id = crypto.randomUUID()
  const c1_id = crypto.randomUUID()
  const w1_id = crypto.randomUUID()

  const s2_id = crypto.randomUUID()
  const c2_id = crypto.randomUUID()

  const s3_id = crypto.randomUUID()
  const c3_id = crypto.randomUUID()

  const s4_id = crypto.randomUUID()
  const c4_id = crypto.randomUUID()

  const s5_id = crypto.randomUUID()
  const c5_1_id = crypto.randomUUID()
  const c5_2_id = crypto.randomUUID()

  const s6_id = crypto.randomUUID()
  const c6_1_id = crypto.randomUUID()
  const c6_2_id = crypto.randomUUID()

  const s7_id = crypto.randomUUID()
  const c7_id = crypto.randomUUID()

  // Insert Sections
  const sections = [
    // Section 0: Announcement Ribbon
    {
      id: s1_id,
      page_id: pageId,
      order: 0,
      layout: 'full',
      direction: 'column',
      gap: '0px',
      max_width: '100%',
      min_height: 'auto',
      bg_type: 'gradient',
      bg_gradient: 'linear-gradient(90deg, #0071e3 0%, #005bb5 100%)',
      bg_color: '#0071e3',
      padding_top: '12px',
      padding_bottom: '12px',
      padding_left: '20px',
      padding_right: '20px',
    },
    // Section 1: Hero 1 (Surprise and shine)
    {
      id: s2_id,
      page_id: pageId,
      order: 1,
      layout: 'full',
      direction: 'column',
      gap: '0px',
      max_width: '100%',
      min_height: '620px',
      bg_type: 'color',
      bg_color: '#000000',
      padding_top: '80px',
      padding_bottom: '60px',
      padding_left: '20px',
      padding_right: '20px',
    },
    // Section 2: Hero 2 (iPhone)
    {
      id: s3_id,
      page_id: pageId,
      order: 2,
      layout: 'full',
      direction: 'column',
      gap: '0px',
      max_width: '100%',
      min_height: '580px',
      bg_type: 'color',
      bg_color: '#f5f5f7',
      padding_top: '70px',
      padding_bottom: '60px',
      padding_left: '20px',
      padding_right: '20px',
    },
    // Section 3: Hero 3 (College, sorted)
    {
      id: s4_id,
      page_id: pageId,
      order: 3,
      layout: 'full',
      direction: 'column',
      gap: '0px',
      max_width: '100%',
      min_height: '560px',
      bg_type: 'color',
      bg_color: '#ffffff',
      padding_top: '70px',
      padding_bottom: '60px',
      padding_left: '20px',
      padding_right: '20px',
    },
    // Section 4: Promo Grid Line 1 (MacBook Air + iPad Air)
    {
      id: s5_id,
      page_id: pageId,
      order: 4,
      layout: 'boxed',
      direction: 'row',
      gap: '12px',
      max_width: '1280px',
      padding_top: '12px',
      padding_bottom: '12px',
      padding_left: '12px',
      padding_right: '12px',
    },
    // Section 5: Promo Grid Line 2 (MacBook Pro Dark + Apple Watch Series 11)
    {
      id: s6_id,
      page_id: pageId,
      order: 5,
      layout: 'boxed',
      direction: 'row',
      gap: '12px',
      max_width: '1280px',
      padding_top: '0px',
      padding_bottom: '12px',
      padding_left: '12px',
      padding_right: '12px',
    },
    // Section 6: Endless Entertainment
    {
      id: s7_id,
      page_id: pageId,
      order: 6,
      layout: 'full',
      direction: 'column',
      gap: '20px',
      max_width: '100%',
      bg_type: 'color',
      bg_color: '#000000',
      padding_top: '60px',
      padding_bottom: '60px',
      padding_left: '20px',
      padding_right: '20px',
    }
  ]

  await supabase.from('page_sections').insert(sections)

  // Insert Containers
  const containers = [
    { id: c1_id, section_id: s1_id, order: 0, direction: 'row', gap: '8px', width: '100%', max_width: '1200px' },
    { id: c2_id, section_id: s2_id, order: 0, direction: 'column', gap: '16px', width: '100%', max_width: '1024px' },
    { id: c3_id, section_id: s3_id, order: 0, direction: 'column', gap: '14px', width: '100%', max_width: '1024px' },
    { id: c4_id, section_id: s4_id, order: 0, direction: 'column', gap: '14px', width: '100%', max_width: '1024px' },
    { id: c5_1_id, section_id: s5_id, order: 0, direction: 'column', gap: '12px', width: '50%', bg_type: 'color', bg_color: '#f5f5f7', border_radius: '18px', padding_top: '40px', padding_bottom: '30px', padding_left: '24px', padding_right: '24px' },
    { id: c5_2_id, section_id: s5_id, order: 1, direction: 'column', gap: '12px', width: '50%', bg_type: 'color', bg_color: '#f5f5f7', border_radius: '18px', padding_top: '40px', padding_bottom: '30px', padding_left: '24px', padding_right: '24px' },
    { id: c6_1_id, section_id: s6_id, order: 0, direction: 'column', gap: '12px', width: '50%', bg_type: 'color', bg_color: '#000000', border_radius: '18px', padding_top: '40px', padding_bottom: '30px', padding_left: '24px', padding_right: '24px' },
    { id: c6_2_id, section_id: s6_id, order: 1, direction: 'column', gap: '12px', width: '50%', bg_type: 'color', bg_color: '#f5f5f7', border_radius: '18px', padding_top: '40px', padding_bottom: '30px', padding_left: '24px', padding_right: '24px' },
    { id: c7_id, section_id: s7_id, order: 0, direction: 'column', gap: '24px', width: '100%', max_width: '1200px' }
  ]

  await supabase.from('page_containers').insert(containers)

  // Insert Widgets
  const widgets = [
    // Ribbon CTA
    {
      id: w1_id, container_id: c1_id, type: 'cta', order: 0, color: '#ffffff', font_size: '14px', text_align: 'center',
      content: { title: 'Estamos doando US$ 10 para a National Park Foundation a cada compra na TEKNIX usando Apple Pay até 28 de agosto.', buttonText: 'Comprar agora >', buttonUrl: '/produtos', alignment: 'center' }
    },
    // Hero 1 (Surprise and shine)
    {
      id: crypto.randomUUID(), container_id: c2_id, type: 'heading', order: 0, color: '#f5f5f7', font_size: '56px', font_weight: '700', text_align: 'center', letter_spacing: '-0.03em',
      content: { text: 'Surprise and shine.', tag: 'h1' }
    },
    {
      id: crypto.randomUUID(), container_id: c2_id, type: 'text', order: 1, color: '#a1a1a6', font_size: '24px', text_align: 'center',
      content: { html: 'Assista ao Evento Especial TEKNIX online em 09/09 às 10h PT.' }
    },
    {
      id: crypto.randomUUID(), container_id: c2_id, type: 'button', order: 2, text_align: 'center',
      content: { text: 'Adicionar ao calendário', url: '/contato', variant: 'primary', borderRadius: '980px', bg_color: '#ffffff', color: '#000000' }
    },
    {
      id: crypto.randomUUID(), container_id: c2_id, type: 'image', order: 3, width: '100%', max_width: '640px', margin_top: '40px',
      content: { url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-blacktitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80', alt: 'Apple Event Glowing Logo' }
    },

    // Hero 2 (iPhone)
    {
      id: crypto.randomUUID(), container_id: c3_id, type: 'heading', order: 0, color: '#1d1d1f', font_size: '56px', font_weight: '700', text_align: 'center', letter_spacing: '-0.03em',
      content: { text: 'iPhone', tag: 'h2' }
    },
    {
      id: crypto.randomUUID(), container_id: c3_id, type: 'text', order: 1, color: '#1d1d1f', font_size: '24px', text_align: 'center',
      content: { html: 'Conheça a linha completa do novo iPhone.' }
    },
    {
      id: crypto.randomUUID(), container_id: c3_id, type: 'button', order: 2, text_align: 'center',
      content: { text: 'Saiba mais', url: '/iphone', variant: 'primary', borderRadius: '980px', bg_color: '#0071e3', color: '#ffffff' }
    },
    {
      id: crypto.randomUUID(), container_id: c3_id, type: 'image', order: 3, width: '100%', max_width: '780px', margin_top: '30px',
      content: { url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-blacktitanium?wid=5120&hei=2880&fmt=p-jpg&qlt=80', alt: 'iPhone Lineup' }
    },

    // Hero 3 (College, sorted.)
    {
      id: crypto.randomUUID(), container_id: c4_id, type: 'heading', order: 0, color: '#1d1d1f', font_size: '48px', font_weight: '700', text_align: 'center', letter_spacing: '-0.03em',
      content: { text: 'College, sorted.', tag: 'h2' }
    },
    {
      id: crypto.randomUUID(), container_id: c4_id, type: 'text', order: 1, color: '#1d1d1f', font_size: '21px', text_align: 'center',
      content: { html: 'Get a gift card from $100 to $150** when you buy Mac or iPad with education savings.' }
    },
    {
      id: crypto.randomUUID(), container_id: c4_id, type: 'button', order: 2, text_align: 'center',
      content: { text: 'Shop', url: '/produtos', variant: 'primary', borderRadius: '980px', bg_color: '#0071e3', color: '#ffffff' }
    },
    {
      id: crypto.randomUUID(), container_id: c4_id, type: 'image', order: 3, width: '100%', max_width: '720px', margin_top: '30px',
      content: { url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-alcove-select-202403?wid=4000&hei=2850&fmt=jpeg&qlt=90', alt: 'Students Back to School' }
    },

    // Tile 1: MacBook Air
    {
      id: crypto.randomUUID(), container_id: c5_1_id, type: 'heading', order: 0, color: '#1d1d1f', font_size: '36px', font_weight: '700', text_align: 'center',
      content: { text: 'MacBook Air', tag: 'h3' }
    },
    {
      id: crypto.randomUUID(), container_id: c5_1_id, type: 'text', order: 1, color: '#1d1d1f', font_size: '18px', text_align: 'center',
      content: { html: 'Now supercharged by M5.' }
    },
    {
      id: crypto.randomUUID(), container_id: c5_1_id, type: 'button', order: 2, text_align: 'center',
      content: { text: 'Learn more', url: '/macbook-air', variant: 'primary', borderRadius: '980px' }
    },
    {
      id: crypto.randomUUID(), container_id: c5_1_id, type: 'image', order: 3, width: '100%', max_width: '380px',
      content: { url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-alcove-select-202403?wid=4000&hei=2850&fmt=jpeg&qlt=90', alt: 'MacBook Air' }
    },

    // Tile 2: iPad Air
    {
      id: crypto.randomUUID(), container_id: c5_2_id, type: 'heading', order: 0, color: '#1d1d1f', font_size: '36px', font_weight: '700', text_align: 'center',
      content: { text: 'iPad Air', tag: 'h3' }
    },
    {
      id: crypto.randomUUID(), container_id: c5_2_id, type: 'text', order: 1, color: '#1d1d1f', font_size: '18px', text_align: 'center',
      content: { html: 'Now supercharged by M4.' }
    },
    {
      id: crypto.randomUUID(), container_id: c5_2_id, type: 'button', order: 2, text_align: 'center',
      content: { text: 'Learn more', url: '/ipad-air', variant: 'primary', borderRadius: '980px' }
    },
    {
      id: crypto.randomUUID(), container_id: c5_2_id, type: 'image', order: 3, width: '100%', max_width: '380px',
      content: { url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/ipad-air-storage-select-202405-13inch-spacegray?wid=5120&hei=2880&fmt=p-jpg&qlt=80', alt: 'iPad Air' }
    },

    // Tile 3: MacBook Pro Dark
    {
      id: crypto.randomUUID(), container_id: c6_1_id, type: 'heading', order: 0, color: '#f5f5f7', font_size: '36px', font_weight: '700', text_align: 'center',
      content: { text: 'MacBook Pro', tag: 'h3' }
    },
    {
      id: crypto.randomUUID(), container_id: c6_1_id, type: 'text', order: 1, color: '#a1a1a6', font_size: '18px', text_align: 'center',
      content: { html: 'Now with M5, M5 Pro, and M5 Max.' }
    },
    {
      id: crypto.randomUUID(), container_id: c6_1_id, type: 'button', order: 2, text_align: 'center',
      content: { text: 'Learn more', url: '/macbook-pro', variant: 'primary', borderRadius: '980px' }
    },
    {
      id: crypto.randomUUID(), container_id: c6_1_id, type: 'image', order: 3, width: '100%', max_width: '380px',
      content: { url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/mbp16-spaceblack-select-202310?wid=904&hei=843&fmt=jpeg&qlt=90', alt: 'MacBook Pro' }
    },

    // Tile 4: Apple Watch Series 11
    {
      id: crypto.randomUUID(), container_id: c6_2_id, type: 'heading', order: 0, color: '#1d1d1f', font_size: '36px', font_weight: '700', text_align: 'center',
      content: { text: '⌚ WATCH SERIES 11', tag: 'h3' }
    },
    {
      id: crypto.randomUUID(), container_id: c6_2_id, type: 'text', order: 1, color: '#1d1d1f', font_size: '18px', text_align: 'center',
      content: { html: 'The ultimate way to watch your health.' }
    },
    {
      id: crypto.randomUUID(), container_id: c6_2_id, type: 'button', order: 2, text_align: 'center',
      content: { text: 'Learn more', url: '/watch', variant: 'primary', borderRadius: '980px' }
    },
    {
      id: crypto.randomUUID(), container_id: c6_2_id, type: 'image', order: 3, width: '100%', max_width: '380px',
      content: { url: 'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/s10-case-unselect-gallery-1-202409?wid=5120&hei=3280&fmt=p-jpg&qlt=80', alt: 'Apple Watch Series 11' }
    },

    // Section 6: Endless Entertainment
    {
      id: crypto.randomUUID(), container_id: c7_id, type: 'heading', order: 0, color: '#ffffff', font_size: '44px', font_weight: '700', text_align: 'center',
      content: { text: 'Endless entertainment.', tag: 'h2' }
    },
    {
      id: crypto.randomUUID(), container_id: c7_id, type: 'product_grid', order: 1, width: '100%',
      content: { title: 'Lançamentos e Destaques TEKNIX', limit: 4, columns: 4 }
    }
  ]

  await supabase.from('page_widgets').insert(widgets)

  console.log('🎉 Successfully created and populated /home3 with 1:1 Apple layout!')
}

seedHome3().then(() => process.exit(0)).catch(err => {
  console.error('Failed to seed /home3:', err)
  process.exit(1)
})
