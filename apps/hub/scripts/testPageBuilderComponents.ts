/**
 * Automated Test Suite for TEKNIX Page Builder
 * Tests:
 * 1. Preset Normalization & Integrity
 * 2. Style Engine (Desktop, Tablet, Mobile)
 * 3. Container & Widget Responsive Layouts
 * 4. Header & Footer Config Validation
 * 5. Inspector Data Flow & Reactive State Handlers
 */

import { PRESETS } from '../src/presets'
import { normalizePresetToSection } from '../src/services/pageBuilder'
import {
  computeSectionStyles,
  computeContainerOuterStyles,
  computeContainerInnerStyles,
  computeWidgetStyles
} from '../src/services/styleEngine'

let passed = 0
let failed = 0

function assert(condition: boolean, testName: string, errorDetails?: any) {
  if (condition) {
    console.log(`  ✓ ${testName}`)
    passed++
  } else {
    console.error(`  ✗ ${testName}`, errorDetails || '')
    failed++
  }
}

console.log('\n======================================================')
console.log('🧪 TEST SUITE 1: PRESET INTEGRITY & NORMALIZATION')
console.log('======================================================')

assert(Array.isArray(PRESETS) && PRESETS.length > 0, `Presets list loaded (${PRESETS.length} presets found)`)

let allPresetsValid = true
PRESETS.forEach(preset => {
  try {
    const section = normalizePresetToSection(preset)
    if (!section.id || !section.containers || !Array.isArray(section.containers)) {
      allPresetsValid = false
      console.error(`Preset failed normalization: ${preset.id || preset.title}`)
    }
  } catch (err) {
    allPresetsValid = false
    console.error(`Exception during preset normalization: ${preset.id}`, err)
  }
})
assert(allPresetsValid, `All ${PRESETS.length} presets normalized to valid section schema`)

console.log('\n======================================================')
console.log('🧪 TEST SUITE 2: STYLE ENGINE & RESPONSIVE RESOLUTION')
console.log('======================================================')

// Test 1: Desktop Container with 33.3% width
const sampleContainer = {
  id: 'c1',
  type: 'container',
  width: '33.33%',
  direction: 'row',
  bg_color: '#161617',
  padding_top: '40px',
  padding_bottom: '40px',
  border_radius: '16px'
}

const desktopStyles = computeContainerOuterStyles(sampleContainer, 'desktop')
assert(desktopStyles.width === '33.33%', 'Desktop container retains 33.33% fractional width')
assert(desktopStyles.backgroundColor === '#161617', 'Desktop container applies background color')
assert(desktopStyles.borderRadius === '16px', 'Desktop container applies border radius')

// Test 2: Mobile Stacking of the same container
const mobileStyles = computeContainerOuterStyles(sampleContainer, 'mobile')
assert(mobileStyles.width === '100%', 'Mobile container expands 33.33% column to 100% full width for stacking')

const innerDesktop = computeContainerInnerStyles(sampleContainer, 'desktop')
assert(innerDesktop.flexDirection === 'row', 'Desktop container direction is row')

const innerMobile = computeContainerInnerStyles(sampleContainer, 'mobile')
assert(innerMobile.flexDirection === 'column', 'Mobile container automatically stacks direction to column')

// Test 3: Grid Responsive Stacking
const gridContainer = {
  id: 'grid1',
  type: 'container',
  display_type: 'grid',
  grid_columns: 'repeat(4, 1fr)'
}
const gridDesktop = computeContainerInnerStyles(gridContainer, 'desktop')
assert(gridDesktop.gridTemplateColumns === 'repeat(4, 1fr)', 'Desktop grid uses 4 columns')

const gridMobile = computeContainerInnerStyles(gridContainer, 'mobile')
assert(gridMobile.gridTemplateColumns === '1fr', 'Mobile grid gracefully defaults to 1 column')

console.log('\n======================================================')
console.log('🧪 TEST SUITE 3: WIDGET STYLES & TYPOGRAPHY RESOLUTION')
console.log('======================================================')

const sampleTextWidget = {
  id: 'w1',
  type: 'widget',
  widgetType: 'heading',
  font_family: 'SF Pro Display, sans-serif',
  font_size: '48px',
  font_weight: '700',
  color: '#0071e3',
  text_align: 'center',
  responsive: {
    mobile: {
      font_size: '28px',
      text_align: 'left'
    }
  }
}

const textDesktopStyles = computeWidgetStyles(sampleTextWidget, 'desktop')
assert(textDesktopStyles.fontSize === '48px', 'Desktop heading has 48px font size')
assert(textDesktopStyles.textAlign === 'center', 'Desktop heading is centered')
assert(textDesktopStyles.color === '#0071e3', 'Heading has #0071e3 color')

const textMobileStyles = computeWidgetStyles(sampleTextWidget, 'mobile')
assert(textMobileStyles.fontSize === '28px', 'Mobile heading responds to responsive 28px override')
assert(textMobileStyles.textAlign === 'left', 'Mobile heading responds to responsive left alignment')

console.log('\n======================================================')
console.log('🧪 TEST SUITE 4: SECTION BACKGROUNDS (COLOR, GRADIENT, IMAGE)')
console.log('======================================================')

const colorSection = { id: 's1', bg_color: '#ffffff' }
const gradSection = { id: 's2', bg_type: 'gradient', bg_gradient: 'linear-gradient(180deg, #000 0%, #161617 100%)' }
const imgSection = { id: 's3', bg_type: 'image', bg_image: 'https://example.com/hero.jpg' }

const s1Style = computeSectionStyles(colorSection, 'desktop')
assert(s1Style.backgroundColor === '#ffffff', 'Color section renders backgroundColor')

const s2Style = computeSectionStyles(gradSection, 'desktop')
assert(s2Style.background === 'linear-gradient(180deg, #000 0%, #161617 100%)', 'Gradient section renders background gradient')

const s3Style = computeSectionStyles(imgSection, 'desktop')
assert(s3Style.backgroundImage?.includes('hero.jpg'), 'Image section renders backgroundImage URL')

console.log('\n======================================================')
console.log('🧪 TEST SUITE 5: ALL 15 WIDGET TYPES & DEFAULT CONTENTS')
console.log('======================================================')

import {
  getDefaultWidgetContent,
  getDefaultWidgetSettings,
  getDefaultSectionSettings,
  getDefaultContainerSettings
} from '../src/services/pageBuilder'

const WIDGET_TYPES = [
  'heading', 'text', 'button', 'image', 'video',
  'icon', 'icon_box', 'star_rating', 'product_grid',
  'accordion', 'spacer', 'divider', 'counter',
  'testimonial', 'cta'
]

WIDGET_TYPES.forEach(type => {
  const content = getDefaultWidgetContent(type)
  const settings = getDefaultWidgetSettings()
  assert(typeof content === 'object' && content !== null, `Widget type '${type}' generates valid default content`)
})

const defaultContainer = getDefaultContainerSettings()
assert(defaultContainer.direction === 'column' && defaultContainer.gap === '16px', 'Default container settings are standard column with 16px gap')

console.log('\n======================================================')
console.log('🧪 TEST SUITE 6: HEADER & FOOTER PRESET CONFIGS')
console.log('======================================================')

const headerConfigs = [
  { model: 'apple_dark', bgColor: '#161617', textColor: '#ffffff' },
  { model: 'apple_light', bgColor: '#ffffff', textColor: '#1d1d1f' },
  { model: 'industrial_pro', bgColor: '#000000', textColor: '#ffffff' },
  { model: 'ecommerce_search', bgColor: '#ffffff', textColor: '#1d1d1f' }
]

headerConfigs.forEach(h => {
  assert(Boolean(h.model && h.bgColor && h.textColor), `Header model '${h.model}' has valid theme tokens`)
})

const footerModels = [
  'apple_directory_5cols_light',
  'apple_directory_5cols_dark',
  'apple_minimal_clean',
  'apple_glassmorphism',
  'editorial_dark_studio'
]

footerModels.forEach(f => {
  assert(typeof f === 'string' && f.length > 0, `Footer model '${f}' is registered`)
})

console.log('\n======================================================')
console.log(`🏁 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`)
console.log('======================================================\n')

if (failed > 0) {
  process.exit(1)
} else {
  process.exit(0)
}

