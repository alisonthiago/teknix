import { createClient } from '@supabase/supabase-js'
import { createAppleHome3SectionTree } from '../src/services/pageBuilder'

const SUPABASE_URL = 'https://ykgprfzfnffooqmfbeox.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlrZ3ByZnpmbmZmb29xbWZiZW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY5NDM3OTEsImV4cCI6MjEwMjUxOTc5MX0.DQ-4lHwbyMW2umWSGmxfB2JUthUTKujGmZ-IACtFCIY'

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function seed() {
  console.log('🚀 Starting Database Seeding for TEKNIX pages...')

  // 1. Seed Home 3
  const home3Slug = '/home3'
  const { data: home3Page } = await supabase
    .from('pages')
    .select('id')
    .eq('slug', home3Slug)
    .maybeSingle()

  let home3PageId = home3Page?.id

  if (!home3PageId) {
    console.log('Creating Home 3 page in database...')
    const { data: newPage, error } = await supabase
      .from('pages')
      .insert({
        title: 'Home 3 — TEKNIX Oficial',
        slug: home3Slug,
        status: 'published',
        type: 'custom',
        is_landing_mode: false,
        seo_title: 'Home 3 — TEKNIX Oficial',
        seo_description: 'Página oficial TEKNIX estilo Apple com todas as seções editáveis no Page Builder.',
        version: 1
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error creating Home 3 page:', error)
      return
    }
    home3PageId = newPage.id
    console.log(`Created Home 3 page with UUID: ${home3PageId}`)

    // Insert Apple Home 3 sections/containers/widgets
    console.log('Inserting default Apple Home 3 sections tree...')
    const fallbackTree = createAppleHome3SectionTree()

    for (let sIdx = 0; sIdx < fallbackTree.length; sIdx++) {
      const section = fallbackTree[sIdx]
      const { data: dbSec, error: secError } = await supabase
        .from('page_sections')
        .insert({
          page_id: home3PageId,
          type: section.type || 'section',
          order: sIdx,
          layout: section.layout || 'full',
          direction: section.direction || 'column',
          gap: section.gap || '0px',
          max_width: section.max_width || '100%',
          min_height: section.min_height || 'auto',
          bg_type: section.bg_type || 'color',
          bg_color: section.bg_color || 'transparent',
          bg_gradient: section.bg_gradient || '',
          padding_top: section.padding_top || '0px',
          padding_bottom: section.padding_bottom || '0px',
          padding_left: section.padding_left || '0px',
          padding_right: section.padding_right || '0px'
        })
        .select('id')
        .single()

      if (secError || !dbSec) {
        console.error('Error inserting section:', secError)
        continue
      }

      const containers = section.containers || []
      for (let cIdx = 0; cIdx < containers.length; cIdx++) {
        const container = containers[cIdx]
        const { data: dbCon, error: conError } = await supabase
          .from('page_containers')
          .insert({
            section_id: dbSec.id,
            order: cIdx,
            width: container.width || '100%',
            direction: container.direction || 'column',
            gap: container.gap || '16px',
            align_items: container.align_items || 'center',
            justify_content: container.justify_content || 'center'
          })
          .select('id')
          .single()

        if (conError || !dbCon) {
          console.error('Error inserting container:', conError)
          continue
        }

        const widgets = container.widgets || []
        for (let wIdx = 0; wIdx < widgets.length; wIdx++) {
          const widget = widgets[wIdx]
          const { error: wError } = await supabase
            .from('page_widgets')
            .insert({
              container_id: dbCon.id,
              type: widget.type,
              order: wIdx,
              content: widget.content || {},
              color: widget.color || '',
              font_size: widget.font_size || '',
              font_weight: widget.font_weight || '',
              text_align: widget.text_align || '',
              letter_spacing: widget.letter_spacing || '',
              margin_top: widget.margin_top || '',
              width: widget.width || '',
              max_width: widget.max_width || '',
              custom_class: widget.id // Store the template widget ID so we can query it easily!
            })

          if (wError) {
            console.error('Error inserting widget:', wError)
          }
        }
      }
    }
    console.log('Apple Home 3 sections successfully inserted.')
  } else {
    console.log(`Home 3 already exists in database with UUID: ${home3PageId}`)
  }

  // 2. Seed Produtos
  const produtosSlug = '/produtos'
  const { data: produtosPage } = await supabase
    .from('pages')
    .select('id')
    .eq('slug', produtosSlug)
    .maybeSingle()

  if (!produtosPage) {
    console.log('Creating /produtos page in database...')
    const { error } = await supabase
      .from('pages')
      .insert({
        title: 'Catálogo de Produtos',
        slug: produtosSlug,
        status: 'published',
        type: 'custom',
        is_landing_mode: false,
        seo_title: 'Catálogo de Produtos — TEKNIX',
        seo_description: 'Nossa curadoria completa de produtos que valem a pena.',
        version: 1
      })
    if (error) console.error('Error creating /produtos page:', error)
    else console.log('/produtos page created successfully.')
  } else {
    console.log('/produtos page already exists in database.')
  }

  // 3. Seed Ferramentas
  const ferramentasSlug = '/ferramentas'
  const { data: ferramentasPage } = await supabase
    .from('pages')
    .select('id')
    .eq('slug', ferramentasSlug)
    .maybeSingle()

  if (!ferramentasPage) {
    console.log('Creating /ferramentas page in database...')
    const { error } = await supabase
      .from('pages')
      .insert({
        title: 'Ferramentas',
        slug: ferramentasSlug,
        status: 'published',
        type: 'custom',
        is_landing_mode: false,
        seo_title: 'Ferramentas de Alta Performance — TEKNIX',
        seo_description: 'Ferramentas e utilitários de alta durabilidade e design útil.',
        version: 1
      })
    if (error) console.error('Error creating /ferramentas page:', error)
    else console.log('/ferramentas page created successfully.')
  } else {
    console.log('/ferramentas page already exists in database.')
  }

  console.log('🎉 Seeding successfully completed!')
}

seed().catch(err => console.error('Seeding crashed:', err))
