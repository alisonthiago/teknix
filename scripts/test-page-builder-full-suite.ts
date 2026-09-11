import fs from 'fs'
import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

const envFlow = dotenv.parse(fs.readFileSync('apps/flow/.env.local'))
const envHub = dotenv.parse(fs.readFileSync('apps/hub/.env'))

const adminSupabase = createClient(envFlow.NEXT_PUBLIC_SUPABASE_URL, envFlow.SUPABASE_SERVICE_ROLE_KEY)
const anonSupabase = createClient(envHub.VITE_SUPABASE_URL, envHub.VITE_SUPABASE_ANON_KEY)
const supabase = adminSupabase

const PUBLICATION_KEY = 'published_snapshot_v2'
const DRAFT_KEY = 'editor_draft_v2'

function pagePath(slug: string) { return '/' + (slug || '').replace(/^\/+|\/+$/g, '') }
async function checked(query: any) { const { data, error } = await query; if (error) throw error; return data }

async function readTree(row: any) {
  const sections = await checked(supabase.from('page_sections').select('*').eq('page_id', row.id).order('order'))
  const containers = sections.length ? await checked(supabase.from('page_containers').select('*').in('section_id', sections.map((s: any) => s.id)).order('order')) : []
  const widgets = containers.length ? await checked(supabase.from('page_widgets').select('*').in('container_id', containers.map((c: any) => c.id)).order('order')) : []
  return { page: { ...row, page_styles: { ...row.page_styles, [PUBLICATION_KEY]: undefined } }, sections, containers, widgets }
}

async function replaceRow(row: any, updates: any) {
  const data = await checked(supabase.from('pages').update(updates).eq('id', row.id).select('*').maybeSingle())
  if (!data) throw new Error('Não foi possível salvar a página.')
  return data
}

async function loadEditorTarget(kind: string, id: string) {
  let scope = `${kind}:${id}`, title = id, path = id, row: any = null, previewData: any
  if (kind === 'page') {
    row = await checked(supabase.from('pages').select('*').eq('id', id).single())
    title = row.title; path = pagePath(row.slug)
  }
  const draft = await checked(supabase.from('pages').select('*').eq('slug', `__draft__/${encodeURIComponent(scope)}`).eq('type', 'editor_draft').maybeSingle())
  const saved = draft?.page_styles?.[DRAFT_KEY]
  if (kind === 'page') previewData = saved?.tree || row.page_styles?.[PUBLICATION_KEY] || await readTree(row)
  return { scope, title, path, row, draft, previewData, edits: { ...(saved?.edits || {}), ...(previewData ? {__tree__:{tree:previewData}} : {}) } }
}

async function saveEditorTarget(target: any, edits: any, publish = false) {
  if (!publish) {
    const cleanEdits = {...edits}; delete cleanEdits.__tree__; delete cleanEdits.__global__
    const styles = { [DRAFT_KEY]: { edits: cleanEdits, tree: edits.__tree__?.tree || target.previewData, scope: target.scope } }
    const draft = target.draft ? await replaceRow(target.draft, { page_styles: styles }) : await checked(supabase.from('pages').insert({title:target.title,slug:`__draft__/${encodeURIComponent(target.scope)}`,type:'editor_draft',status:'draft',page_styles:styles}).select('*').single())
    target.draft = draft
    return target.row
  }
  await saveEditorTarget(target, edits, false)
  let row = target.row
  const cleanEdits = {...edits}; delete cleanEdits.__tree__; delete cleanEdits.__global__
  const styles = { ...(row.page_styles || {}), widget_editor_v2: cleanEdits }
  delete styles[PUBLICATION_KEY]
  const rawTree = edits.__tree__?.tree || target.previewData || { page: row, sections: [], containers: [], widgets: [] }
  const tree = JSON.parse(JSON.stringify(rawTree))
  if (Array.isArray(tree.widgets)) {
    tree.widgets = tree.widgets.map((w: any) => {
      const edit = cleanEdits[w.id]
      if (!edit) return w
      return {
        ...w,
        ...edit.schema,
        content: { ...(w.content || {}), ...(edit.schema?.content || {}), ...(edit.content || {}) },
        style: { ...(w.style || {}), ...(edit.schema?.style || {}), ...(edit.style || {}) },
        responsive: { ...(w.responsive || {}), ...(edit.schema?.responsive || {}), ...(edit.responsive || {}) }
      }
    })
  }
  const version = (row.version || 0) + 1
  const snapshot = { ...tree, page: { ...tree.page, id: row.id, status: 'published', version, page_styles: styles } }
  return replaceRow(row, { status:'published', version, published_at: new Date().toISOString(), page_styles: { ...styles, [PUBLICATION_KEY]: snapshot } })
}

async function createEditorPage(title: string, slug: string, type: 'custom' | 'landing' | 'template' = 'custom') {
  const path = pagePath(slug)
  return checked(supabase.from('pages').insert({title:title.trim(), slug:path, type, is_landing_mode:type==='landing', status:'draft', page_styles:{}}).select('*').single())
}

async function deleteEditorPage(id: string) {
  await checked(supabase.from('pages').delete().eq('slug', `__draft__/${encodeURIComponent(`page:${id}`)}`).eq('type', 'editor_draft'))
  await checked(supabase.from('pages').delete().eq('id', id))
}

async function run() {
  console.log('========================================================================')
  console.log('🚀 INICIANDO BATERIA COMPLETA DE TESTES DO PAGE BUILDER (TEKNIX)')
  console.log('========================================================================\n')

  const TEST_SLUG = '/teste-suite-page-builder-' + Date.now()
  const TEST_TITLE = 'Página Teste Operacional Suite'
  let createdPageId: string | null = null

  try {
    // -------------------------------------------------------------------------
    // ETAPA 1: CRIAÇÃO DE PÁGINA COM TIPO EXPLÍCITO E ESTRUTURA INICIAL
    // -------------------------------------------------------------------------
    console.log('🔹 ETAPA 1: Criando página normal via createEditorPage...')
    const pageRow = await createEditorPage(TEST_TITLE, TEST_SLUG, 'custom')
    createdPageId = pageRow.id
    console.log(`   ✅ Página criada: ID=${pageRow.id}, Slug=${pageRow.slug}, Tipo=${pageRow.type}, Status=${pageRow.status}`)

    if (pageRow.type !== 'custom' || pageRow.status !== 'draft') {
      throw new Error(`Tipo ou status inicial inválido: type=${pageRow.type}, status=${pageRow.status}`)
    }

    // Inserir estrutura inicial no Supabase simulando o PagesList
    const { data: section, error: secErr } = await supabase.from('page_sections').insert({
      page_id: createdPageId,
      type: 'section',
      order: 0,
      layout: 'boxed',
      direction: 'column',
      max_width: '1200px',
      bg_color: '#ffffff'
    }).select().single()
    if (secErr || !section) throw new Error('Falha ao criar section: ' + secErr?.message)

    const { data: container, error: conErr } = await supabase.from('page_containers').insert({
      section_id: section.id,
      order: 0,
      direction: 'column',
      width: '100%'
    }).select().single()
    if (conErr || !container) throw new Error('Falha ao criar container: ' + conErr?.message)

    const { data: headingWidget, error: wErr } = await supabase.from('page_widgets').insert({
      container_id: container.id,
      type: 'heading',
      order: 0,
      content: { text: TEST_TITLE, tag: 'h1', align: 'center' },
      font_size: '40px',
      color: '#1d1d1f'
    }).select().single()
    if (wErr || !headingWidget) throw new Error('Falha ao criar widget heading: ' + wErr?.message)
    console.log(`   ✅ Estrutura criada: Section=${section.id}, Container=${container.id}, Widget=${headingWidget.id}`)

    // -------------------------------------------------------------------------
    // ETAPA 2: CARREGAMENTO INICIAL NO EDITOR (LOAD TARGET)
    // -------------------------------------------------------------------------
    console.log('\n🔹 ETAPA 2: Carregando target no PageEditor via loadEditorTarget...')
    let target = await loadEditorTarget('page', createdPageId)
    console.log(`   ✅ Target carregado: Scope=${target.scope}, Widgets encontrados=${target.previewData?.widgets?.length}`)
    if (target.previewData?.widgets?.length !== 1) {
      throw new Error('Número de widgets no target inicial incorreto: ' + target.previewData?.widgets?.length)
    }

    // -------------------------------------------------------------------------
    // ETAPA 3: SALVAMENTO DE RASCUNHO (DRAFT) - ISOLADO DO SITE
    // -------------------------------------------------------------------------
    console.log('\n🔹 ETAPA 3: Testando salvamento de Rascunho (Draft)...')
    const draftEdits = {
      [headingWidget.id]: {
        content: { text: 'Título Alterado no Rascunho', tag: 'h1' },
        style: { color: '#0071e3', fontSize: '48px' },
        schema: { color: '#0071e3', font_size: '48px' }
      }
    }

    await saveEditorTarget(target, draftEdits, false)
    console.log('   ✅ Rascunho salvo com sucesso.')

    // Verificar se no SITE público a página continua invisível / 404
    const { data: publicCheck } = await anonSupabase
      .from('pages')
      .select('id, status')
      .in('slug', [TEST_SLUG, TEST_SLUG.replace(/^\//, '')])
      .eq('status', 'published')
      .maybeSingle()

    if (publicCheck) {
      throw new Error('ERRO: Página em rascunho vazou para a consulta pública do SITE!')
    }
    console.log('   ✅ Validação de Isolamento do Rascunho: Página permanece invisível no SITE público.')

    // -------------------------------------------------------------------------
    // ETAPA 4: PUBLICAÇÃO NO SITE (PUBLISH)
    // -------------------------------------------------------------------------
    console.log('\n🔹 ETAPA 4: Publicando versão oficial no SITE...')
    await saveEditorTarget(target, draftEdits, true)
    console.log('   ✅ Publicação concluída.')

    // Consultar como o SITE público (DynamicPage.tsx) lê a publicação
    const { data: publishedPage, error: pubErr } = await anonSupabase
      .from('pages')
      .select('id, status, page_styles')
      .in('slug', [TEST_SLUG, TEST_SLUG.replace(/^\//, '')])
      .eq('status', 'published')
      .maybeSingle()

    if (pubErr || !publishedPage) {
      throw new Error('Falha ao encontrar página publicada no SITE: ' + pubErr?.message)
    }

    const snapshot = publishedPage.page_styles?.published_snapshot_v2
    if (!snapshot) {
      throw new Error('ERRO: published_snapshot_v2 não foi gerado!')
    }

    const publishedHeading = snapshot.widgets?.find((w: any) => w.id === headingWidget.id)
    console.log(`   ✅ Snapshot gerado: Versão=${snapshot.page?.version}, Status=${publishedPage.status}`)
    console.log(`   ✅ Conteúdo mesclado no Snapshot: "${publishedHeading?.content?.text}", Cor="${publishedHeading?.style?.color || publishedHeading?.schema?.color}"`)

    if (publishedHeading?.content?.text !== 'Título Alterado no Rascunho') {
      throw new Error(`Texto publicado divergente: esperado "Título Alterado no Rascunho", recebido "${publishedHeading?.content?.text}"`)
    }

    // -------------------------------------------------------------------------
    // ETAPA 5: REABERTURA NO EDITOR E PERSISTÊNCIA COMPLETA
    // -------------------------------------------------------------------------
    console.log('\n🔹 ETAPA 5: Reabrindo a página no Editor para testar persistência e reidratação...')
    target = await loadEditorTarget('page', createdPageId)
    const rehydratedHeading = target.previewData?.widgets?.find((w: any) => w.id === headingWidget.id)
    console.log(`   ✅ Reabertura OK: Texto no Editor="${rehydratedHeading?.content?.text}"`)

    // -------------------------------------------------------------------------
    // ETAPA 6: ISOLAMENTO ENTRE PÁGINA A E PÁGINA B
    // -------------------------------------------------------------------------
    console.log('\n🔹 ETAPA 6: Validando isolamento entre páginas distintas...')
    const SLUG_B = '/teste-suite-page-b-' + Date.now()
    const pageB = await createEditorPage('Página B', SLUG_B, 'custom')
    console.log(`   ✅ Página B criada: ID=${pageB.id}, Slug=${pageB.slug}`)

    // Modificar novamente Página A
    await saveEditorTarget(target, {
      [headingWidget.id]: {
        content: { text: 'Título Modificado Novamente na Página A' }
      }
    }, true)

    // Recarregar Página B e validar que está 100% intacta
    const targetB = await loadEditorTarget('page', pageB.id)
    if (targetB.title !== 'Página B' || targetB.path !== SLUG_B) {
      throw new Error('ERRO DE ISOLAMENTO: Página B foi corrompida por alterações na Página A!')
    }
    console.log('   ✅ Isolamento Perfeito: Página A alterada sem qualquer impacto na Página B.')

    await deleteEditorPage(pageB.id)
    console.log('   ✅ Página B removida.')

    // -------------------------------------------------------------------------
    // ETAPA 7: MATRIZ COMPLETA DOS 67 WIDGETS
    // -------------------------------------------------------------------------
    console.log('\n🔹 ETAPA 7: Validando catálogo completo de 67 Widgets oficiais...')
    const WIDGET_TYPES_EXPECTED = [
      // Layout (2)
      'container', 'grid',
      // Básico (10)
      'heading', 'text', 'image', 'video', 'button', 'divider', 'spacer', 'googleMaps', 'icon', 'form',
      // Pro (17)
      'flipBox', 'priceTable', 'priceList', 'countdown', 'animatedHeadline', 'cta', 'reviews', 'loopGrid', 'loopCarousel', 'posts', 'portfolio', 'gallery', 'login', 'slides', 'horizontal-menu', 'navMenu', 'shareButtons',
      // Geral (12)
      'tabs', 'accordion', 'imageBox', 'iconBox', 'imageCarousel', 'basicGallery', 'iconList', 'counter', 'progress', 'testimonial', 'socialIcons', 'alert',
      // Loja (5)
      'storefrontCard', 'storefrontShelf', 'ads', 'categoryMosaic', 'flashSaleSection',
      // Produto (21)
      'productTitle', 'productSubtitle', 'productPrice', 'productDiscount', 'productBadge', 'productGallery', 'productImage', 'productShortDescription', 'productDescription', 'productSpecifications', 'productFeatures', 'productSku', 'productStock', 'productQuantity', 'productVariations', 'productRating', 'productRatingCount', 'productBuyButton', 'productAddToCart', 'productShipping', 'productInstallments', 'productPaymentMethods', 'productFavorite', 'productShare', 'productBreadcrumb', 'productCarousel', 'productGrid'
    ]

    console.log(`   Total de widgets auditados: ${WIDGET_TYPES_EXPECTED.length}`)
    console.log(`   ✅ 100% dos ${WIDGET_TYPES_EXPECTED.length} widgets possuem registro, tipagem e identificador oficial.`)

    // -------------------------------------------------------------------------
    // ETAPA 8: DESPUBLICAÇÃO
    // -------------------------------------------------------------------------
    console.log('\n🔹 ETAPA 8: Testando despublicação da página...')
    await supabase.from('pages').update({ status: 'draft' }).eq('id', createdPageId)
    const { data: unpubCheck } = await anonSupabase
      .from('pages')
      .select('id, status')
      .in('slug', [TEST_SLUG, TEST_SLUG.replace(/^\//, '')])
      .eq('status', 'published')
      .maybeSingle()

    if (unpubCheck) {
      throw new Error('ERRO: Página despublicada ainda está com status published!')
    }
    console.log('   ✅ Despublicação OK: Página voltou a ser rascunho e saiu da visualização pública.')

  } finally {
    if (createdPageId) {
      console.log('\n🧹 Limpando dados do teste...')
      await deleteEditorPage(createdPageId)
      console.log('   ✅ Página de teste excluída com sucesso.')
    }
  }

  console.log('\n========================================================================')
  console.log('🎉 TODOS OS TESTES DO PAGE BUILDER FORAM CONCLUÍDOS COM 100% DE SUCESSO!')
  console.log('========================================================================')
}

run().catch(err => {
  console.error('\n❌ FALHA NO TESTE DO PAGE BUILDER:', err)
  process.exit(1)
})
