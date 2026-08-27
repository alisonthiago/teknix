// ============================================================
// ELEMENTOR PRO WIDGET REGISTRY — Full Control Schema
// Reescrito em React a partir do plugin PHP
// ============================================================

export type ControlType =
  | 'text' | 'textarea' | 'number' | 'select' | 'choose'
  | 'color' | 'slider' | 'media' | 'gallery' | 'repeater'
  | 'url' | 'switcher' | 'icons' | 'dimensions' | 'multi_select'
  | 'date_time' | 'hover_animation' | 'heading_ctrl' | 'divider_ctrl'
  | 'code' | 'wysiwyg'

export interface WidgetControl {
  name: string
  label: string
  type: ControlType
  default?: any
  options?: Record<string, string> | string[]
  placeholder?: string
  description?: string
  min?: number
  max?: number
  step?: number
  responsive?: boolean
  tab?: 'content' | 'style' | 'advanced'
  group?: string
  conditions?: Record<string, any>
  repeater?: WidgetControl[]
  show_before?: string
}

export interface WidgetSchema {
  name: string
  title: string
  icon: string
  category: 'basic' | 'pro' | 'general' | 'site' | 'commerce' | 'elementor-pro'
  description?: string
  controls: WidgetControl[]
  defaultSettings: Record<string, any>
  previewRenderer: (settings: Record<string, any>) => React.ReactNode
}

// ============================================================
// HELPER: Create control
// ============================================================
export function ctrl(name: string, label: string, type: ControlType, opts?: Partial<WidgetControl>): WidgetControl {
  return { name, label, type, ...opts }
}

function selectCtrl(name: string, label: string, options: Record<string, string>, opts?: Partial<WidgetControl>): WidgetControl {
  return { name, label, type: 'select', options, ...opts }
}

function sliderCtrl(name: string, label: string, min: number, max: number, opts?: Partial<WidgetControl>): WidgetControl {
  return { name, label, type: 'slider', min, max, ...opts }
}

function switcherCtrl(name: string, label: string, defaultVal = true, opts?: Partial<WidgetControl>): WidgetControl {
  return { name, label, type: 'switcher', default: defaultVal, ...opts }
}

function colorCtrl(name: string, label: string, defaultVal = '', opts?: Partial<WidgetControl>): WidgetControl {
  return { name, label, type: 'color', default: defaultVal, ...opts }
}

function mediaCtrl(name: string, label: string, opts?: Partial<WidgetControl>): WidgetControl {
  return { name, label, type: 'media', ...opts }
}

function textCtrl(name: string, label: string, opts?: Partial<WidgetControl>): WidgetControl {
  return { name, label, type: 'text', ...opts }
}

function textareaCtrl(name: string, label: string, opts?: Partial<WidgetControl>): WidgetControl {
  return { name, label, type: 'textarea', ...opts }
}

function numberCtrl(name: string, label: string, opts?: Partial<WidgetControl>): WidgetControl {
  return { name, label, type: 'number', ...opts }
}

function urlCtrl(name: string, label: string, opts?: Partial<WidgetControl>): WidgetControl {
  return { name, label, type: 'url', ...opts }
}

function chooseCtrl(name: string, label: string, options: Record<string, string>, opts?: Partial<WidgetControl>): WidgetControl {
  return { name, label, type: 'choose', options, ...opts }
}

function dimensionsCtrl(name: string, label: string, opts?: Partial<WidgetControl>): WidgetControl {
  return { name, label, type: 'dimensions', ...opts }
}

function iconsCtrl(name: string, label: string, opts?: Partial<WidgetControl>): WidgetControl {
  return { name, label, type: 'icons', ...opts }
}

function repeaterCtrl(name: string, label: string, repeater: WidgetControl[], opts?: Partial<WidgetControl>): WidgetControl {
  return { name, label, type: 'repeater', repeater, ...opts }
}

// ============================================================
// MEDIA CAROUSEL
// ============================================================
const mediaCarouselSchema: WidgetSchema = {
  name: 'media-carousel',
  title: 'Carrossel de Mídia',
  icon: 'eicon-media-carousel',
  category: 'elementor-pro',
  controls: [
    selectCtrl('skin', 'Skin', { carousel: 'Carrossel', slideshow: 'Slideshow', coverflow: 'Coverflow' }),
    selectCtrl('image_fit', 'Ajuste da Imagem', { cover: 'Cover', contain: 'Contain', auto: 'Auto' }),
    selectCtrl('overlay', 'Overlay', { none: 'Nenhum', text: 'Texto', icon: 'Ícone' }),
    switcherCtrl('autoplay', 'Auto Play', true),
    switcherCtrl('pause_on_hover', 'Pausar ao Passar o Mouse', true),
    sliderCtrl('autoplay_speed', 'Velocidade do Auto Play', 1000, 10000, { default: 5000 }),
    switcherCtrl('infinite', 'Loop Infinito', true),
    selectCtrl('navigation', 'Navegação', { both: 'Ambos', arrows: 'Setas', dots: 'Pontos', none: 'Nenhum' }),
    sliderCtrl('slideshow_height', 'Altura', 200, 800, { default: 400, responsive: true }),
    repeaterCtrl('slides', 'Slides', [
      selectCtrl('type', 'Tipo', { image: 'Imagem', video: 'Vídeo' }),
      mediaCtrl('image', 'Imagem'),
      urlCtrl('video', 'URL do Vídeo'),
      urlCtrl('image_link_to', 'Link Personalizado'),
    ]),
  ],
  defaultSettings: {
    skin: 'carousel', image_fit: 'cover', overlay: 'none',
    autoplay: true, pause_on_hover: true, autoplay_speed: 5000,
    infinite: true, navigation: 'both', slideshow_height: 400,
    slides: [],
  },
  previewRenderer: () => null,
}

// ============================================================
// SLIDES
// ============================================================
const slidesSchema: WidgetSchema = {
  name: 'slides',
  title: 'Slides',
  icon: 'eicon-slides',
  category: 'elementor-pro',
  controls: [
    sliderCtrl('slides_height', 'Altura', 200, 800, { default: 400, responsive: true }),
    selectCtrl('slides_title_tag', 'Tag do Título', { h1: 'H1', h2: 'H2', h3: 'H3', h4: 'H4', h5: 'H5', h6: 'H6', div: 'Div', span: 'Span', p: 'P' }),
    selectCtrl('navigation', 'Navegação', { both: 'Ambos', arrows: 'Setas', dots: 'Pontos', none: 'Nenhum' }),
    switcherCtrl('autoplay', 'Auto Play', true),
    switcherCtrl('pause_on_hover', 'Pausar ao Passar o Mouse', true),
    sliderCtrl('autoplay_speed', 'Velocidade', 1000, 10000, { default: 5000 }),
    switcherCtrl('infinite', 'Loop Infinito', true),
    selectCtrl('transition', 'Transição', { slide: 'Deslizar', fade: 'Fade' }),
    sliderCtrl('transition_speed', 'Velocidade da Transição', 100, 2000, { default: 500 }),
    chooseCtrl('slides_horizontal_position', 'Posição Horizontal', { left: 'left', center: 'center', right: 'right' }),
    chooseCtrl('slides_vertical_position', 'Posição Vertical', { top: 'top', middle: 'middle', bottom: 'bottom' }),
    chooseCtrl('slides_text_align', 'Alinhamento do Texto', { left: 'left', center: 'center', right: 'right' }),
    colorCtrl('heading_color', 'Cor do Título'),
    repeaterCtrl('slides', 'Slides', [
      colorCtrl('background_color', 'Cor de Fundo', '#1d1d1f'),
      mediaCtrl('background_image', 'Imagem de Fundo'),
      textCtrl('heading', 'Título', { default: 'Título do Slide' }),
      textareaCtrl('description', 'Descrição'),
      textCtrl('button_text', 'Texto do Botão', { default: 'Saiba Mais' }),
      urlCtrl('link', 'Link do Botão'),
      colorCtrl('content_color', 'Cor do Conteúdo', '#ffffff'),
    ]),
  ],
  defaultSettings: {
    slides_height: 400, slides_title_tag: 'h2', navigation: 'both',
    autoplay: true, pause_on_hover: true, autoplay_speed: 5000,
    infinite: true, transition: 'slide', transition_speed: 500,
    slides_horizontal_position: 'center', slides_vertical_position: 'middle',
    slides_text_align: 'center', heading_color: '#ffffff',
    slides: [{ background_color: '#1d1d1f', heading: 'Slide 1', description: '', button_text: 'Saiba Mais', content_color: '#ffffff' }],
  },
  previewRenderer: () => null,
}

// ============================================================
// NAV MENU
// ============================================================
const navMenuSchema: WidgetSchema = {
  name: 'nav-menu',
  title: 'Menu de Navegação',
  icon: 'eicon-nav-menu',
  category: 'elementor-pro',
  controls: [
    selectCtrl('layout', 'Layout', { horizontal: 'Horizontal', vertical: 'Vertical', dropdown: 'Dropdown' }),
    chooseCtrl('align_items', 'Alinhamento', { left: 'left', center: 'center', right: 'right', stretch: 'justify' }),
    selectCtrl('pointer', 'Pointer', { none: 'Nenhum', underline: 'Sublinhado', overline: 'Overline', 'double-line': 'Duplo', framed: 'Rahmado', background: 'Fundo', text: 'Texto' }),
    selectCtrl('animation_line', 'Animação da Linha', { fade: 'Fade', slide: 'Slide', grow: 'Crescer', 'drop-in': 'Entrar', 'drop-out': 'Sair', none: 'Nenhum' }),
    selectCtrl('dropdown', 'Breakpoint', { tablet: 'Tablet', mobile: 'Mobile', none: 'Nenhum' }),
    switcherCtrl('full_width', 'Largura Total', false),
    selectCtrl('toggle', 'Botão Toggle', { none: 'Nenhum', burger: 'Hambúrguer' }),
    sliderCtrl('menu_space_between', 'Espaço entre Itens', 0, 50, { default: 10, responsive: true }),
    sliderCtrl('padding_horizontal_menu_item', 'Padding Horizontal', 0, 50, { default: 12, responsive: true }),
    sliderCtrl('padding_vertical_menu_item', 'Padding Vertical', 0, 50, { default: 8, responsive: true }),
    repeaterCtrl('menu_items', 'Itens do Menu', [
      textCtrl('label', 'Label', { default: 'Item' }),
      urlCtrl('link', 'Link'),
      repeaterCtrl('sub_items', 'Sub Itens', [
        textCtrl('label', 'Label'),
        urlCtrl('link', 'Link'),
      ]),
    ]),
  ],
  defaultSettings: {
    layout: 'horizontal', align_items: 'left', pointer: 'underline',
    animation_line: 'fade', dropdown: 'tablet', full_width: false,
    toggle: 'burger', menu_space_between: 10,
    padding_horizontal_menu_item: 12, padding_vertical_menu_item: 8,
    menu_items: [
      { label: 'Home', link: { url: '/' } },
      { label: 'Produtos', link: { url: '/produtos' } },
      { label: 'Sobre', link: { url: '/sobre' } },
      { label: 'Contato', link: { url: '/contato' } },
    ],
  },
  previewRenderer: () => null,
}

// ============================================================
// FORM
// ============================================================
const formSchema: WidgetSchema = {
  name: 'form',
  title: 'Formulário',
  icon: 'eicon-form-horizontal',
  category: 'elementor-pro',
  controls: [
    textCtrl('form_name', 'Nome do Formulário', { default: 'Meu Formulário' }),
    selectCtrl('input_size', 'Tamanho dos Campos', { xs: 'XS', sm: 'SM', md: 'MD', lg: 'LG', xl: 'XL' }),
    switcherCtrl('show_labels', 'Mostrar Labels', true),
    switcherCtrl('mark_required', 'Marcar Obrigatórios', true),
    selectCtrl('button_size', 'Tamanho do Botão', { xs: 'XS', sm: 'SM', md: 'MD', lg: 'LG', xl: 'XL' }),
    textCtrl('button_text', 'Texto do Botão', { default: 'Enviar' }),
    selectCtrl('step_type', 'Tipo de Etapa', { none: 'Nenhum', text: 'Texto', icon: 'Ícone', number: 'Número', progress_bar: 'Barra de Progresso' }),
    repeaterCtrl('form_fields', 'Campos do Formulário', [
      selectCtrl('field_type', 'Tipo', {
        text: 'Texto', email: 'E-mail', textarea: 'Área de Texto', url: 'URL',
        tel: 'Telefone', radio: 'Radio', select: 'Select', checkbox: 'Checkbox',
        number: 'Número', date: 'Data', time: 'Hora', password: 'Senha',
      }),
      textCtrl('field_label', 'Label', { default: 'Campo' }),
      textCtrl('placeholder', 'Placeholder'),
      switcherCtrl('required', 'Obrigatório', false),
      selectCtrl('width', 'Largura', { '100': '100%', '50': '50%', '33': '33%' }),
      numberCtrl('rows', 'Linhas (textarea)', { default: 4 }),
      textareaCtrl('field_options', 'Opções (separadas por linha)'),
    ]),
    textareaCtrl('success_message', 'Mensagem de Sucesso', { default: 'Sua mensagem foi enviada com sucesso!' }),
    textareaCtrl('error_message', 'Mensagem de Erro', { default: 'Ocorreu um erro ao enviar.' }),
  ],
  defaultSettings: {
    form_name: 'Meu Formulário', input_size: 'md', show_labels: true,
    mark_required: true, button_size: 'md', button_text: 'Enviar',
    step_type: 'none', success_message: 'Sua mensagem foi enviada com sucesso!',
    error_message: 'Ocorreu um erro ao enviar.',
    form_fields: [
      { field_type: 'text', field_label: 'Nome', placeholder: 'Seu nome', required: true, width: '100' },
      { field_type: 'email', field_label: 'E-mail', placeholder: 'seu@email.com', required: true, width: '100' },
      { field_type: 'textarea', field_label: 'Mensagem', placeholder: 'Sua mensagem...', required: false, width: '100', rows: 4 },
    ],
  },
  previewRenderer: () => null,
}

// ============================================================
// FLIP BOX
// ============================================================
const flipBoxSchema: WidgetSchema = {
  name: 'flip-box',
  title: 'Flip Box',
  icon: 'eicon-flip-box',
  category: 'elementor-pro',
  controls: [
    chooseCtrl('graphic_element', 'Elemento Gráfico', { none: 'Nenhum', image: 'Imagem', icon: 'Ícone' }),
    mediaCtrl('image', 'Imagem'),
    iconsCtrl('selected_icon', 'Ícone'),
    textCtrl('front_title', 'Título (Frente)', { default: 'Título Frente' }),
    textareaCtrl('front_description', 'Descrição (Frente)', { default: 'Descrição da frente' }),
    textCtrl('back_title', 'Título (Verso)', { default: 'Título Verso' }),
    textareaCtrl('back_description', 'Descrição (Verso)', { default: 'Descrição do verso' }),
    textCtrl('back_button_text', 'Texto do Botão', { default: 'Saiba Mais' }),
    urlCtrl('link', 'Link do Botão'),
    selectCtrl('flip_direction', 'Direção do Flip', { up: 'Cima', down: 'Baixo', left: 'Esquerda', right: 'Direita' }),
    switcherCtrl('3d_depth', 'Profundidade 3D', true),
    chooseCtrl('front_vertical_align', 'Alinhamento Vertical (Frente)', { top: 'top', middle: 'middle', bottom: 'bottom' }),
    chooseCtrl('back_vertical_align', 'Alinhamento Vertical (Verso)', { top: 'top', middle: 'middle', bottom: 'bottom' }),
    dimensionsCtrl('front_padding', 'Padding (Frente)'),
    dimensionsCtrl('back_padding', 'Padding (Verso)'),
  ],
  defaultSettings: {
    graphic_element: 'icon', front_title: 'Título Frente',
    front_description: 'Descrição da frente', back_title: 'Título Verso',
    back_description: 'Descrição do verso', back_button_text: 'Saiba Mais',
    flip_direction: 'up', '3d_depth': true,
    front_vertical_align: 'middle', back_vertical_align: 'middle',
  },
  previewRenderer: () => null,
}

// ============================================================
// CALL TO ACTION
// ============================================================
const ctaSchema: WidgetSchema = {
  name: 'call-to-action',
  title: 'Call to Action',
  icon: 'eicon-image-rollover',
  category: 'elementor-pro',
  controls: [
    selectCtrl('skin', 'Skin', { classic: 'Clássico', cover: 'Capa' }),
    chooseCtrl('layout', 'Posição', { left: 'Esquerda', above: 'Acima', right: 'Direita', below: 'Abaixo' }),
    mediaCtrl('bg_image', 'Imagem de Fundo'),
    textCtrl('title', 'Título', { default: 'Call to Action' }),
    textareaCtrl('description', 'Descrição', { default: 'Descrição do CTA' }),
    textCtrl('button_text', 'Texto do Botão', { default: 'Clique Aqui' }),
    urlCtrl('link', 'Link do Botão'),
    selectCtrl('button_size', 'Tamanho do Botão', { sm: 'Pequeno', md: 'Médio', lg: 'Grande' }),
  ],
  defaultSettings: {
    skin: 'classic', layout: 'left', title: 'Call to Action',
    description: 'Descrição do CTA', button_text: 'Clique Aqui',
    button_size: 'md',
  },
  previewRenderer: () => null,
}

// ============================================================
// COUNTDOWN
// ============================================================
const countdownSchema: WidgetSchema = {
  name: 'countdown',
  title: 'Contador Regressivo',
  icon: 'eicon-countdown',
  category: 'elementor-pro',
  controls: [
    selectCtrl('countdown_type', 'Tipo', { due_date: 'Data Específica', evergreen: 'Evergreen' }),
    textCtrl('due_date', 'Data Final', { placeholder: '2026-12-31' }),
    numberCtrl('evergreen_counter_hours', 'Horas (Evergreen)', { default: 24 }),
    numberCtrl('evergreen_counter_minutes', 'Minutos (Evergreen)', { default: 0 }),
    switcherCtrl('show_labels', 'Mostrar Labels', true),
    textCtrl('days_title', 'Label Dias', { default: 'Dias' }),
    textCtrl('hours_title', 'Label Horas', { default: 'Horas' }),
    textCtrl('minutes_title', 'Label Minutos', { default: 'Min' }),
    textCtrl('seconds_title', 'Label Segundos', { default: 'Seg' }),
    selectCtrl('separator', 'Separador', { colon: ':', dotted: '.', plus: '+', text: 'Texto' }),
  ],
  defaultSettings: {
    countdown_type: 'due_date', due_date: '', evergreen_counter_hours: 24,
    evergreen_counter_minutes: 0, show_labels: true,
    days_title: 'Dias', hours_title: 'Horas', minutes_title: 'Min', seconds_title: 'Seg',
    separator: 'colon',
  },
  previewRenderer: () => null,
}

// ============================================================
// PRICE TABLE
// ============================================================
const priceTableSchema: WidgetSchema = {
  name: 'price-table',
  title: 'Tabela de Preços',
  icon: 'eicon-price-table',
  category: 'elementor-pro',
  controls: [
    textCtrl('heading', 'Título', { default: 'Plano Profissional' }),
    textCtrl('sub_heading', 'Subtítulo', { default: 'Ideal para empresas' }),
    selectCtrl('heading_tag', 'Tag do Título', { h2: 'H2', h3: 'H3', h4: 'H4', h5: 'H5', h6: 'H6' }),
    textCtrl('price', 'Preço', { default: 'R$ 99' }),
    textCtrl('original_price', 'Preço Original', { placeholder: 'R$ 199' }),
    textCtrl('period', 'Período', { default: '/mês' }),
    repeaterCtrl('items', 'Funcionalidades', [
      textCtrl('item', 'Item', { default: 'Funcionalidade' }),
      switcherCtrl('highlighted', 'Destacado', false),
    ]),
    textCtrl('button_text', 'Texto do Botão', { default: 'Assinar Agora' }),
    urlCtrl('button_link', 'Link do Botão'),
    textareaCtrl('footer_additional_info', 'Informações Adicionais'),
    textCtrl('ribbon_title', 'Ribbon', { placeholder: 'Popular' }),
  ],
  defaultSettings: {
    heading: 'Plano Profissional', sub_heading: 'Ideal para empresas',
    heading_tag: 'h3', price: 'R$ 99', period: '/mês',
    button_text: 'Assinar Agora',
    items: [
      { item: 'Todas as Funcionalidades', highlighted: true },
      { item: 'Suporte Prioritário', highlighted: true },
      { item: 'Atualizações Vitalícias', highlighted: false },
    ],
  },
  previewRenderer: () => null,
}

// ============================================================
// ANIMATED HEADLINE
// ============================================================
const animatedHeadlineSchema: WidgetSchema = {
  name: 'animated-headline',
  title: 'Título Animado',
  icon: 'eicon-animated-headline',
  category: 'elementor-pro',
  controls: [
    selectCtrl('headline_style', 'Estilo', { highlight: 'Destaque', rotate: 'Rotação' }),
    selectCtrl('animation_type', 'Animação', {
      typing: 'Digitação', clip: 'Clip', flip: 'Flip', swirl: 'Swirl',
      blinds: 'Blinds', 'drop-in': 'Drop In', wave: 'Wave', slide: 'Slide', 'slide-down': 'Slide Down',
    }),
    selectCtrl('marker', 'Formato do Marcador', {
      circle: 'Círculo', curly: 'Chave', underline: 'Sublinhado', double: 'Duplo',
      'double-underline': 'Sublinhado Duplo', 'box': 'Caixa', 'bananas': 'Bananas',
      'underline-zigzag': 'Zigzag', 'diagonal': 'Diagonal', 'stroke': 'Stroke',
    }),
    textCtrl('before_text', 'Texto Antes', { default: 'Promova' }),
    textCtrl('highlighted_text', 'Texto Destacado', { default: 'Produtos Incríveis' }),
    textareaCtrl('rotating_text', 'Textos para Rotação', { default: 'Produtos\nServiços\nSoluções' }),
    textCtrl('after_text', 'Texto Depois', { default: '' }),
    urlCtrl('link', 'Link'),
  ],
  defaultSettings: {
    headline_style: 'highlight', animation_type: 'typing', marker: 'underline',
    before_text: 'Promova', highlighted_text: 'Produtos Incríveis',
    rotating_text: 'Produtos\nServiços\nSoluções', after_text: '',
  },
  previewRenderer: () => null,
}

// ============================================================
// TABLE OF CONTENTS
// ============================================================
const tocSchema: WidgetSchema = {
  name: 'table-of-contents',
  title: 'Índice de Conteúdo',
  icon: 'eicon-table-of-contents',
  category: 'elementor-pro',
  controls: [
    textCtrl('title', 'Título', { default: 'Índice' }),
    selectCtrl('html_tag', 'Tag HTML', { h2: 'H2', h3: 'H3', h4: 'H4', div: 'Div' }),
    selectCtrl('list_type', 'Tipo de Lista', { bulleted: 'Com Marcadores', numbered: 'Numerada' }),
    switcherCtrl('collapsible', 'Recollível', false),
    selectCtrl('minimize_on', 'Minimizar Em', { none: 'Nenhum', mobile: 'Mobile', tablet: 'Tablet' }),
    numberCtrl('scroll_offset', 'Offset do Scroll', { default: 100 }),
  ],
  defaultSettings: {
    title: 'Índice', html_tag: 'h2', list_type: 'bulleted',
    collapsible: false, minimize_on: 'none', scroll_offset: 100,
  },
  previewRenderer: () => null,
}

// ============================================================
// SHARE BUTTONS
// ============================================================
const shareButtonsSchema: WidgetSchema = {
  name: 'share-buttons',
  title: 'Botões de Compartilhar',
  icon: 'eicon-share',
  category: 'elementor-pro',
  controls: [
    selectCtrl('button_type', 'Tipo do Botão', { icon: 'Ícone', icon_text: 'Ícone + Texto', text: 'Texto' }),
    selectCtrl('icon_shape', 'Formato do Ícone', { rounded: 'Arredondado', circle: 'Círculo', square: 'Quadrado' }),
    selectCtrl('icon_size', 'Tamanho do Ícone', { sm: 'SM', md: 'MD', lg: 'LG' }),
    selectCtrl('view', 'Visualização', { official: 'Oficial', minimal: 'Minimal' }),
    repeaterCtrl('share_buttons', 'Botões', [
      selectCtrl('network', 'Rede', {
        facebook: 'Facebook', twitter: 'Twitter/X', linkedin: 'LinkedIn',
        pinterest: 'Pinterest', reddit: 'Reddit', whatsapp: 'WhatsApp',
        telegram: 'Telegram', email: 'E-mail', print: 'Imprimir',
      }),
    ]),
  ],
  defaultSettings: {
    button_type: 'icon_text', icon_shape: 'rounded', icon_size: 'md',
    view: 'official',
    share_buttons: [
      { network: 'facebook' }, { network: 'twitter' }, { network: 'whatsapp' },
    ],
  },
  previewRenderer: () => null,
}

// ============================================================
// HOTSPOT
// ============================================================
const hotspotSchema: WidgetSchema = {
  name: 'hotspot',
  title: 'Hotspot',
  icon: 'eicon-image-hotspot',
  category: 'elementor-pro',
  controls: [
    mediaCtrl('image', 'Imagem'),
    selectCtrl('hotspot_type', 'Tipo', { dot: 'Ponto', pin: 'Pin' }),
    repeaterCtrl('hotspots', 'Hotspots', [
      textCtrl('hotspot_label', 'Label'),
      textCtrl('hotspot_tooltip_content', 'Tooltip'),
      selectCtrl('hotspot_tooltip_position', 'Posição do Tooltip', { top: 'Cima', bottom: 'Baixo', left: 'Esquerda', right: 'Direita' }),
      sliderCtrl('hotspot_offset_x', 'Posição Horizontal', 0, 100, { default: 50 }),
      sliderCtrl('hotspot_offset_y', 'Posição Vertical', 0, 100, { default: 50 }),
      urlCtrl('hotspot_link', 'Link'),
    ]),
  ],
  defaultSettings: {
    hotspot_type: 'dot',
    hotspots: [
      { hotspot_label: '1', hotspot_tooltip_content: 'Descrição', hotspot_tooltip_position: 'top', hotspot_offset_x: 30, hotspot_offset_y: 40 },
      { hotspot_label: '2', hotspot_tooltip_content: 'Descrição', hotspot_tooltip_position: 'right', hotspot_offset_x: 70, hotspot_offset_y: 60 },
    ],
  },
  previewRenderer: () => null,
}

// ============================================================
// LOTTIE
// ============================================================
const lottieSchema: WidgetSchema = {
  name: 'lottie',
  title: 'Lottie',
  icon: 'eicon-lottie',
  category: 'elementor-pro',
  controls: [
    selectCtrl('source', 'Fonte', { media_file: 'Arquivo', external_url: 'URL Externa' }),
    urlCtrl('source_external_url', 'URL do JSON'),
    mediaCtrl('source_media_file', 'Arquivo Lottie'),
    textCtrl('caption', 'Caption'),
    selectCtrl('link_to', 'Link', { none: 'Nenhum', media_file: 'Arquivo', custom: 'Personalizado' }),
    urlCtrl('custom_link', 'Link Personalizado'),
    switcherCtrl('loop', 'Loop', true),
    switcherCtrl('autoplay', 'Auto Play', true),
    switcherCtrl('play_once', 'Executar Uma Vez', false),
    sliderCtrl('speed', 'Velocidade', 0.1, 3, { default: 1, step: 0.1 }),
    switcherCtrl('viewport', 'Ativar no Viewport', true),
    selectCtrl('trigger', 'Gatilho', { viewport: 'Viewport', on_click: 'Clique', on_hover: 'Hover' }),
  ],
  defaultSettings: {
    source: 'external_url', loop: true, autoplay: true,
    play_once: false, speed: 1, viewport: true, trigger: 'viewport',
  },
  previewRenderer: () => null,
}

// ============================================================
// CODE HIGHLIGHT
// ============================================================
const codeHighlightSchema: WidgetSchema = {
  name: 'code-highlight',
  title: 'Code Highlight',
  icon: 'eicon-code-highlight',
  category: 'elementor-pro',
  controls: [
    selectCtrl('language', 'Linguagem', {
      markup: 'Markup', html: 'HTML', css: 'CSS', javascript: 'JavaScript',
      typescript: 'TypeScript', php: 'PHP', ruby: 'Ruby', json: 'JSON',
      python: 'Python', java: 'Java', c: 'C', cpp: 'C++', go: 'Go',
      rust: 'Rust', sql: 'SQL', bash: 'Bash', yaml: 'YAML',
    }),
    textareaCtrl('code', 'Código', { default: 'const hello = "World";' }),
    selectCtrl('theme', 'Tema', { dark: 'Escuro', light: 'Claro' }),
    switcherCtrl('line_numbers', 'Números de Linha', false),
    switcherCtrl('copy_to_clipboard', 'Copiar', true),
  ],
  defaultSettings: {
    language: 'javascript', code: 'const hello = "World";',
    theme: 'dark', line_numbers: false, copy_to_clipboard: true,
  },
  previewRenderer: () => null,
}

// ============================================================
// VIDEO PLAYLIST
// ============================================================
const videoPlaylistSchema: WidgetSchema = {
  name: 'video-playlist',
  title: 'Playlist de Vídeo',
  icon: 'eicon-video-playlist',
  category: 'elementor-pro',
  controls: [
    textCtrl('playlist_title', 'Título da Playlist', { default: 'Minha Playlist' }),
    selectCtrl('playlist_title_tag', 'Tag do Título', { h2: 'H2', h3: 'H3', h4: 'H4', div: 'Div' }),
    switcherCtrl('autoplay', 'Auto Play', false),
    switcherCtrl('show_video_info', 'Mostrar Info', true),
    switcherCtrl('show_video_description', 'Mostrar Descrição', true),
    repeaterCtrl('videos', 'Vídeos', [
      selectCtrl('video_type', 'Tipo', { youtube: 'YouTube', vimeo: 'Vimeo' }),
      urlCtrl('video_url', 'URL do Vídeo'),
      textCtrl('video_title', 'Título'),
      textareaCtrl('video_description', 'Descrição'),
      mediaCtrl('thumbnail', 'Thumbnail'),
    ]),
  ],
  defaultSettings: {
    playlist_title: 'Minha Playlist', playlist_title_tag: 'h3',
    autoplay: false, show_video_info: true, show_video_description: true,
    videos: [],
  },
  previewRenderer: () => null,
}

// ============================================================
// BLOCKQUOTE
// ============================================================
const blockquoteSchema: WidgetSchema = {
  name: 'blockquote',
  title: 'Blockquote',
  icon: 'eicon-blockquote',
  category: 'elementor-pro',
  controls: [
    selectCtrl('blockquote_skin', 'Skin', { border: 'Borda', quotation: 'Aspas', boxed: 'Caixa', clean: 'Limpo' }),
    textareaCtrl('blockquote_content', 'Conteúdo', { default: 'Citação aqui...' }),
    textCtrl('author_name', 'Autor', { default: 'Autor' }),
    mediaCtrl('author_image', 'Imagem do Autor'),
    switcherCtrl('tweet_button', 'Botão Tweet', false),
    chooseCtrl('alignment', 'Alinhamento', { left: 'left', center: 'center', right: 'right' }),
  ],
  defaultSettings: {
    blockquote_skin: 'border', blockquote_content: 'Citação aqui...',
    author_name: 'Autor', tweet_button: false, alignment: 'left',
  },
  previewRenderer: () => null,
}

// ============================================================
// LOGIN
// ============================================================
const loginSchema: WidgetSchema = {
  name: 'login',
  title: 'Login',
  icon: 'eicon-lock-user',
  category: 'elementor-pro',
  controls: [
    switcherCtrl('show_labels', 'Mostrar Labels', true),
    selectCtrl('input_size', 'Tamanho dos Campos', { sm: 'SM', md: 'MD', lg: 'LG' }),
    selectCtrl('button_size', 'Tamanho do Botão', { sm: 'SM', md: 'MD', lg: 'LG' }),
    textCtrl('button_text', 'Texto do Botão', { default: 'Entrar' }),
    textareaCtrl('logged_in_message', 'Mensagem Logado', { default: 'Olá! Você está logado.' }),
    switcherCtrl('show_lost_password', 'Mostrar "Esqueceu a senha?"', true),
    switcherCtrl('show_remember_me', 'Mostrar "Lembrar-me"', true),
    urlCtrl('redirect_after_login', 'Redirecionar Após Login'),
  ],
  defaultSettings: {
    show_labels: true, input_size: 'md', button_size: 'md',
    button_text: 'Entrar', logged_in_message: 'Olá! Você está logado.',
    show_lost_password: true, show_remember_me: true,
  },
  previewRenderer: () => null,
}

// ============================================================
// SEARCH
// ============================================================
const searchSchema: WidgetSchema = {
  name: 'search',
  title: 'Busca',
  icon: 'eicon-site-search',
  category: 'elementor-pro',
  controls: [
    selectCtrl('skin', 'Skin', {
      minimal: 'Mínimo', 'minimal-input': 'Mínimo com Input',
      fullscreen: 'Tela Inteira', dropdown: 'Dropdown',
    }),
    textCtrl('placeholder', 'Placeholder', { default: 'Buscar...' }),
    iconsCtrl('icon', 'Ícone'),
    textCtrl('button_text', 'Texto do Botão', { default: 'Buscar' }),
    selectCtrl('result_type', 'Tipo de Resultado', { posts: 'Posts', pages: 'Páginas', products: 'Produtos' }),
    numberCtrl('results_count', 'Resultados por Página', { default: 10 }),
    switcherCtrl('show_image', 'Mostrar Imagem', true),
    switcherCtrl('show_excerpt', 'Mostrar Resumo', true),
  ],
  defaultSettings: {
    skin: 'minimal', placeholder: 'Buscar...', button_text: 'Buscar',
    result_type: 'posts', results_count: 10, show_image: true, show_excerpt: true,
  },
  previewRenderer: () => null,
}

// ============================================================
// OFF CANVAS
// ============================================================
const offCanvasSchema: WidgetSchema = {
  name: 'off-canvas',
  title: 'Off Canvas',
  icon: 'eicon-off-canvas',
  category: 'elementor-pro',
  controls: [
    selectCtrl('position', 'Posição', { left: 'Esquerda', right: 'Direita', top: 'Cima', bottom: 'Baixo' }),
    selectCtrl('trigger', 'Gatilho', { button: 'Botão', icon: 'Ícone', text: 'Texto', image: 'Imagem' }),
    iconsCtrl('toggle_icon', 'Ícone do Gatilho'),
    textCtrl('toggle_text', 'Texto do Gatilho', { default: 'Abrir' }),
    mediaCtrl('toggle_image', 'Imagem do Gatilho'),
    iconsCtrl('close_icon', 'Ícone de Fechar'),
    switcherCtrl('prevent_scroll', 'Impedir Scroll', true),
    switcherCtrl('autoclose', 'Auto Fechar', true),
    switcherCtrl('close_on_esc_key', 'Fechar com ESC', true),
    sliderCtrl('animation_duration', 'Duração da Animação', 100, 1000, { default: 300 }),
  ],
  defaultSettings: {
    position: 'left', trigger: 'button', toggle_text: 'Abrir',
    prevent_scroll: true, autoclose: true, close_on_esc_key: true,
    animation_duration: 300,
  },
  previewRenderer: () => null,
}

// ============================================================
// PORTFOLIO
// ============================================================
const portfolioSchema: WidgetSchema = {
  name: 'portfolio',
  title: 'Portfólio',
  icon: 'eicon-gallery-grid',
  category: 'elementor-pro',
  controls: [
    sliderCtrl('columns', 'Colunas', 1, 6, { default: 3, responsive: true }),
    numberCtrl('posts_per_page', 'Posts por Página', { default: 6 }),
    selectCtrl('orderby', 'Ordenar por', { date: 'Data', title: 'Título', menu_order: 'Ordem', random: 'Aleatório' }),
    selectCtrl('order', 'Ordem', { desc: 'Descendente', asc: 'Ascendente' }),
    switcherCtrl('masonry', 'Masonry', false),
    selectCtrl('portfolio_layout', 'Layout', { full: 'Full', minimal: 'Minimal', cards: 'Cards' }),
    switcherCtrl('show_filter', 'Mostrar Filtro', true),
  ],
  defaultSettings: {
    columns: 3, posts_per_page: 6, orderby: 'date',
    order: 'desc', masonry: false, portfolio_layout: 'full', show_filter: true,
  },
  previewRenderer: () => null,
}

// ============================================================
// POSTS
// ============================================================
const postsSchema: WidgetSchema = {
  name: 'posts',
  title: 'Posts',
  icon: 'eicon-post-list',
  category: 'elementor-pro',
  controls: [
    sliderCtrl('posts_per_page', 'Posts por Página', 1, 50, { default: 6 }),
    selectCtrl('posts_post_type', 'Tipo de Post', { post: 'Post', page: 'Página', product: 'Produto' }),
    selectCtrl('order', 'Ordem', { desc: 'Descendente', asc: 'Ascendente' }),
    selectCtrl('orderby', 'Ordenar por', { date: 'Data', title: 'Título', menu_order: 'Ordem', random: 'Aleatório' }),
    selectCtrl('pagination_type', 'Paginação', { numbers: 'Números', load_more: 'Carregar Mais', infinite: 'Infinito' }),
    sliderCtrl('columns', 'Colunas', 1, 6, { default: 3, responsive: true }),
    switcherCtrl('show_image', 'Mostrar Imagem', true),
    switcherCtrl('show_title', 'Mostrar Título', true),
    switcherCtrl('show_excerpt', 'Mostrar Resumo', true),
    switcherCtrl('show_date', 'Mostrar Data', true),
    switcherCtrl('show_author', 'Mostrar Autor', true),
  ],
  defaultSettings: {
    posts_per_page: 6, posts_post_type: 'post', order: 'desc',
    orderby: 'date', pagination_type: 'numbers', columns: 3,
    show_image: true, show_title: true, show_excerpt: true,
    show_date: true, show_author: true,
  },
  previewRenderer: () => null,
}

// ============================================================
// GALLERY
// ============================================================
const gallerySchema: WidgetSchema = {
  name: 'gallery',
  title: 'Galeria',
  icon: 'eicon-gallery-justified',
  category: 'elementor-pro',
  controls: [
    selectCtrl('gallery_type', 'Tipo', { single: 'Única', multiple: 'Múltipla' }),
    selectCtrl('layout', 'Layout', { grid: 'Grid', justified: 'Justificado', carousel: 'Carrossel', masonry: 'Masonry' }),
    sliderCtrl('columns', 'Colunas', 1, 10, { default: 3, responsive: true }),
    selectCtrl('gap', 'Espaço', { default: 'Padrão', no: 'Nenhum', small: 'Pequeno', medium: 'Médio', large: 'Grande', custom: 'Personalizado' }),
    switcherCtrl('lightboxed', 'Lightbox', true),
    galleryCtrl('gallery', 'Galeria de Imagens'),
  ],
  defaultSettings: {
    gallery_type: 'single', layout: 'grid', columns: 3,
    gap: 'default', lightboxed: true, gallery: [],
  },
  previewRenderer: () => null,
}

function galleryCtrl(name: string, label: string, opts?: Partial<WidgetControl>): WidgetControl {
  return { name, label, type: 'gallery', ...opts }
}

// ============================================================
// SOCIAL ICONS (stub)
// ============================================================
const socialIconsSchema: WidgetSchema = {
  name: 'social-icons',
  title: 'Ícones Sociais',
  icon: 'eicon-social-icons',
  category: 'elementor-pro',
  controls: [
    selectCtrl('shape', 'Formato', { circle: 'Círculo', square: 'Quadrado', rounded: 'Arredondado' }),
    selectCtrl('color_type', 'Cor', { official: 'Oficial', custom: 'Personalizada' }),
    colorCtrl('custom_color', 'Cor Personalizada'),
    colorCtrl('custom_hover_color', 'Cor do Hover'),
    repeaterCtrl('social_icons', 'Ícones', [
      selectCtrl('network', 'Rede', {
        facebook: 'Facebook', twitter: 'Twitter/X', instagram: 'Instagram',
        linkedin: 'LinkedIn', youtube: 'YouTube', whatsapp: 'WhatsApp',
        telegram: 'Telegram', pinterest: 'Pinterest', github: 'GitHub',
      }),
      urlCtrl('link', 'Link'),
    ]),
  ],
  defaultSettings: {
    shape: 'circle', color_type: 'official',
    social_icons: [
      { network: 'facebook', link: { url: '#' } },
      { network: 'instagram', link: { url: '#' } },
      { network: 'whatsapp', link: { url: '#' } },
    ],
  },
  previewRenderer: () => null,
}

// ============================================================
// TESTIMONIAL CAROUSEL
// ============================================================
const testimonialCarouselSchema: WidgetSchema = {
  name: 'testimonial-carousel',
  title: 'Carrossel de Depoimentos',
  icon: 'eicon-testimonial-carousel',
  category: 'elementor-pro',
  controls: [
    selectCtrl('skin', 'Skin', { default: 'Padrão', bubble: 'Balão' }),
    selectCtrl('layout', 'Layout', {
      image_inline: 'Imagem Inline', image_stacked: 'Imagem Empilhada',
      image_above: 'Imagem Acima', image_left: 'Imagem Esquerda', image_right: 'Imagem Direita',
    }),
    switcherCtrl('autoplay', 'Auto Play', true),
    sliderCtrl('autoplay_speed', 'Velocidade', 1000, 10000, { default: 5000 }),
    switcherCtrl('infinite', 'Loop Infinito', true),
    selectCtrl('navigation', 'Navegação', { both: 'Ambos', arrows: 'Setas', dots: 'Pontos', none: 'Nenhum' }),
    repeaterCtrl('slides', 'Depoimentos', [
      textareaCtrl('content', 'Depoimento', { default: 'Excelente produto!' }),
      textCtrl('name', 'Nome', { default: 'Cliente' }),
      textCtrl('title', 'Cargo', { default: 'CEO' }),
      mediaCtrl('image', 'Foto'),
      sliderCtrl('rating', 'Avaliação', 1, 5, { default: 5 }),
    ]),
  ],
  defaultSettings: {
    skin: 'default', layout: 'image_inline', autoplay: true,
    autoplay_speed: 5000, infinite: true, navigation: 'dots',
    slides: [
      { content: 'Produto excelente, superou expectativas!', name: 'Maria Silva', title: 'CEO', rating: 5 },
      { content: 'Suporte incrível, recomendo!', name: 'João Pedro', title: 'Dev', rating: 5 },
    ],
  },
  previewRenderer: () => null,
}

// ============================================================
// REVIEWS
// ============================================================
const reviewsSchema: WidgetSchema = {
  name: 'reviews',
  title: 'Avaliações',
  icon: 'eicon-review',
  category: 'elementor-pro',
  controls: [
    colorCtrl('header_background_color', 'Cor de Fundo do Cabeçalho'),
    switcherCtrl('autoplay', 'Auto Play', true),
    sliderCtrl('autoplay_speed', 'Velocidade', 1000, 10000, { default: 5000 }),
    selectCtrl('navigation', 'Navegação', { both: 'Ambos', arrows: 'Setas', dots: 'Pontos', none: 'Nenhum' }),
    repeaterCtrl('slides', 'Avaliações', [
      textareaCtrl('content', 'Comentário'),
      textCtrl('name', 'Nome'),
      textCtrl('title', 'Cargo'),
      mediaCtrl('image', 'Foto'),
      sliderCtrl('rating', 'Avaliação', 1, 5, { default: 5 }),
    ]),
  ],
  defaultSettings: {
    autoplay: true, autoplay_speed: 5000, navigation: 'dots',
    slides: [
      { content: 'Produto fantástico!', name: 'Carlos M.', title: 'Cliente', rating: 5 },
    ],
  },
  previewRenderer: () => null,
}

// ============================================================
// POSTS CAROUSEL (usa slides schema adaptado)
// ============================================================
const postsCarouselSchema: WidgetSchema = {
  name: 'posts-carousel',
  title: 'Carrossel de Posts',
  icon: 'eicon-post-list',
  category: 'elementor-pro',
  controls: [
    sliderCtrl('posts_per_page', 'Posts por Página', 1, 50, { default: 6 }),
    selectCtrl('posts_post_type', 'Tipo de Post', { post: 'Post', product: 'Produto' }),
    sliderCtrl('slides_to_show', 'Slides Visíveis', 1, 6, { default: 3 }),
    switcherCtrl('autoplay', 'Auto Play', false),
    switcherCtrl('infinite', 'Loop Infinito', false),
    selectCtrl('navigation', 'Navegação', { both: 'Ambos', arrows: 'Setas', dots: 'Pontos', none: 'Nenhum' }),
  ],
  defaultSettings: {
    posts_per_page: 6, posts_post_type: 'post', slides_to_show: 3,
    autoplay: false, infinite: false, navigation: 'both',
  },
  previewRenderer: () => null,
}

// ============================================================
// NESTED CAROUSEL
// ============================================================
const nestedCarouselSchema: WidgetSchema = {
  name: 'nested-carousel',
  title: 'Carrossel Aninhado',
  icon: 'eicon-carousel',
  category: 'elementor-pro',
  controls: [
    sliderCtrl('slides_per_view', 'Slides por View', 1, 6, { default: 3 }),
    switcherCtrl('loop', 'Loop', true),
    switcherCtrl('autoplay', 'Auto Play', false),
    sliderCtrl('autoplay_speed', 'Velocidade', 1000, 10000, { default: 5000 }),
    selectCtrl('navigation', 'Navegação', { both: 'Ambos', arrows: 'Setas', dots: 'Pontos', none: 'Nenhum' }),
    sliderCtrl('gap', 'Espaço', 0, 50, { default: 10 }),
  ],
  defaultSettings: {
    slides_per_view: 3, loop: true, autoplay: false,
    autoplay_speed: 5000, navigation: 'both', gap: 10,
  },
  previewRenderer: () => null,
}

// ============================================================
// LOOP GRID
// ============================================================
const loopGridSchema: WidgetSchema = {
  name: 'loop-grid',
  title: 'Grid Dinâmico',
  icon: 'eicon-post-list',
  category: 'elementor-pro',
  controls: [
    sliderCtrl('columns', 'Colunas', 1, 6, { default: 3 }),
    numberCtrl('posts_per_page', 'Posts por Página', { default: 6 }),
    selectCtrl('posts_post_type', 'Tipo de Post', { post: 'Post', product: 'Produto' }),
    selectCtrl('orderby', 'Ordenar por', { date: 'Data', title: 'Título', random: 'Aleatório' }),
    selectCtrl('order', 'Ordem', { desc: 'Descendente', asc: 'Ascendente' }),
    sliderCtrl('gap', 'Espaço', 0, 50, { default: 16 }),
  ],
  defaultSettings: {
    columns: 3, posts_per_page: 6, posts_post_type: 'post',
    orderby: 'date', order: 'desc', gap: 16,
  },
  previewRenderer: () => null,
}

// ============================================================
// THEME BUILDER WIDGETS (stubs simples)
// ============================================================
const siteLogoSchema: WidgetSchema = {
  name: 'site-logo', title: 'Logo do Site', icon: 'eicon-site-logo', category: 'elementor-pro',
  controls: [sliderCtrl('width', 'Largura', 50, 400, { default: 150, responsive: true })],
  defaultSettings: { width: 150 }, previewRenderer: () => null,
}

const siteTitleSchema: WidgetSchema = {
  name: 'site-title', title: 'Título do Site', icon: 'eicon-site-title', category: 'elementor-pro',
  controls: [switcherCtrl('link_to_home', 'Link para Home', true)],
  defaultSettings: { link_to_home: true }, previewRenderer: () => null,
}

const pageTitleSchema: WidgetSchema = {
  name: 'page-title', title: 'Título da Página', icon: 'eicon-page-title', category: 'elementor-pro',
  controls: [chooseCtrl('align', 'Alinhamento', { left: 'left', center: 'center', right: 'right' })],
  defaultSettings: { align: 'left' }, previewRenderer: () => null,
}

const postTitleSchema: WidgetSchema = {
  name: 'post-title', title: 'Título do Post', icon: 'eicon-post-title', category: 'elementor-pro',
  controls: [
    switcherCtrl('link', 'Link', true),
    chooseCtrl('align', 'Alinhamento', { left: 'left', center: 'center', right: 'right' }),
  ],
  defaultSettings: { link: true, align: 'left' }, previewRenderer: () => null,
}

const postContentSchema: WidgetSchema = {
  name: 'post-content', title: 'Conteúdo do Post', icon: 'eicon-post-content', category: 'elementor-pro',
  controls: [sliderCtrl('content_width', 'Largura', 50, 100, { default: 100 })],
  defaultSettings: { content_width: 100 }, previewRenderer: () => null,
}

const postExcerptSchema: WidgetSchema = {
  name: 'post-excerpt', title: 'Resumo do Post', icon: 'eicon-post-excerpt', category: 'elementor-pro',
  controls: [
    numberCtrl('excerpt_length', 'Tamanho', { default: 55 }),
    switcherCtrl('read_more', 'Ler Mais', true),
  ],
  defaultSettings: { excerpt_length: 55, read_more: true }, previewRenderer: () => null,
}

const featuredImageSchema: WidgetSchema = {
  name: 'featured-image', title: 'Imagem Destaque', icon: 'eicon-featured-image', category: 'elementor-pro',
  controls: [
    sliderCtrl('width', 'Largura', 50, 100, { default: 100 }),
    selectCtrl('object_fit', 'Ajuste', { fill: 'Fill', contain: 'Contain', cover: 'Cover' }),
  ],
  defaultSettings: { width: 100, object_fit: 'cover' }, previewRenderer: () => null,
}

const postInfoSchema: WidgetSchema = {
  name: 'post-info', title: 'Info do Post', icon: 'eicon-post-info', category: 'elementor-pro',
  controls: [
    switcherCtrl('show_date', 'Data', true),
    switcherCtrl('show_author', 'Autor', true),
    switcherCtrl('show_categories', 'Categorias', false),
    switcherCtrl('show_comments', 'Comentários', false),
  ],
  defaultSettings: { show_date: true, show_author: true, show_categories: false, show_comments: false },
  previewRenderer: () => null,
}

const postNavigationSchema: WidgetSchema = {
  name: 'post-navigation', title: 'Navegação entre Posts', icon: 'eicon-post-navigation', category: 'elementor-pro',
  controls: [
    textCtrl('previous_text', 'Texto Anterior', { default: 'Post Anterior' }),
    textCtrl('next_text', 'Texto Próximo', { default: 'Próximo Post' }),
  ],
  defaultSettings: { previous_text: 'Post Anterior', next_text: 'Próximo Post' },
  previewRenderer: () => null,
}

const authorBoxSchema: WidgetSchema = {
  name: 'author-box', title: 'Box do Autor', icon: 'eicon-author-box', category: 'elementor-pro',
  controls: [
    switcherCtrl('show_name', 'Mostrar Nome', true),
    switcherCtrl('show_bio', 'Mostrar Bio', true),
    switcherCtrl('show_image', 'Mostrar Foto', true),
  ],
  defaultSettings: { show_name: true, show_bio: true, show_image: true },
  previewRenderer: () => null,
}

const searchFormSchema: WidgetSchema = {
  name: 'search-form', title: 'Formulário de Busca', icon: 'eicon-search-form', category: 'elementor-pro',
  controls: [textCtrl('placeholder', 'Placeholder', { default: 'Buscar...' })],
  defaultSettings: { placeholder: 'Buscar...' }, previewRenderer: () => null,
}

// ============================================================
// ADDITIONAL PRO WIDGETS
// ============================================================
const megaMenuSchema: WidgetSchema = {
  name: 'mega-menu', title: 'Mega Menu', icon: 'eicon-mega-menu', category: 'elementor-pro',
  controls: [
    selectCtrl('dropdown_animation', 'Animação', { fade: 'Fade', zoom: 'Zoom' }),
    selectCtrl('breakpoint', 'Breakpoint', { tablet: 'Tablet', mobile: 'Mobile', none: 'Nenhum' }),
    sliderCtrl('dropdown_width', 'Largura do Dropdown', 200, 1200, { default: 800 }),
  ],
  defaultSettings: { dropdown_animation: 'fade', breakpoint: 'tablet', dropdown_width: 800 },
  previewRenderer: () => null,
}

const breadcrumbsProSchema: WidgetSchema = {
  name: 'breadcrumbs-pro', title: 'Breadcrumb Pro', icon: 'eicon-breadcrumb', category: 'elementor-pro',
  controls: [
    textCtrl('separator', 'Separador', { default: '/' }),
    textCtrl('home_text', 'Texto Home', { default: 'Home' }),
    switcherCtrl('show_current', 'Mostrar Página Atual', true),
  ],
  defaultSettings: { separator: '/', home_text: 'Home', show_current: true },
  previewRenderer: () => null,
}

const imageGalleryProSchema: WidgetSchema = {
  name: 'image-gallery-pro', title: 'Galeria Pro', icon: 'eicon-gallery-justified', category: 'elementor-pro',
  controls: [
    selectCtrl('layout', 'Layout', { grid: 'Grid', masonry: 'Masonry', carousel: 'Carrossel' }),
    sliderCtrl('columns', 'Colunas', 1, 6, { default: 3 }),
    switcherCtrl('lightbox', 'Lightbox', true),
    galleryCtrl('gallery', 'Imagens'),
  ],
  defaultSettings: { layout: 'grid', columns: 3, lightbox: true, gallery: [] },
  previewRenderer: () => null,
}

const formProSchema: WidgetSchema = {
  name: 'form-pro', title: 'Formulário Pro', icon: 'eicon-form-horizontal', category: 'elementor-pro',
  controls: [
    textCtrl('form_name', 'Nome', { default: 'Formulário Pro' }),
    selectCtrl('input_size', 'Tamanho', { sm: 'SM', md: 'MD', lg: 'LG' }),
    switcherCtrl('show_labels', 'Labels', true),
    textCtrl('button_text', 'Botão', { default: 'Enviar' }),
    repeaterCtrl('form_fields', 'Campos', [
      selectCtrl('field_type', 'Tipo', { text: 'Texto', email: 'E-mail', textarea: 'Texto', tel: 'Telefone', number: 'Número', date: 'Data', password: 'Senha' }),
      textCtrl('field_label', 'Label'),
      textCtrl('placeholder', 'Placeholder'),
      switcherCtrl('required', 'Obrigatório', false),
    ]),
  ],
  defaultSettings: {
    form_name: 'Formulário Pro', input_size: 'md', show_labels: true,
    button_text: 'Enviar',
    form_fields: [
      { field_type: 'text', field_label: 'Nome', placeholder: 'Seu nome', required: true },
      { field_type: 'email', field_label: 'E-mail', placeholder: 'seu@email.com', required: true },
    ],
  },
  previewRenderer: () => null,
}

const loginProSchema: WidgetSchema = {
  name: 'login-pro', title: 'Login Pro', icon: 'eicon-lock-user', category: 'elementor-pro',
  controls: [
    switcherCtrl('show_labels', 'Labels', true),
    selectCtrl('input_size', 'Tamanho', { sm: 'SM', md: 'MD', lg: 'LG' }),
    textCtrl('button_text', 'Botão', { default: 'Entrar' }),
    switcherCtrl('show_lost_password', 'Esqueceu a senha?', true),
    switcherCtrl('show_remember_me', 'Lembrar-me', true),
  ],
  defaultSettings: { show_labels: true, input_size: 'md', button_text: 'Entrar', show_lost_password: true, show_remember_me: true },
  previewRenderer: () => null,
}

const paypalButtonSchema: WidgetSchema = {
  name: 'paypal-button', title: 'Botão PayPal', icon: 'eicon-paypal', category: 'elementor-pro',
  controls: [
    textCtrl('email', 'E-mail PayPal'),
    selectCtrl('currency', 'Moeda', { USD: 'USD', EUR: 'EUR', BRL: 'BRL' }),
    textCtrl('item_name', 'Nome do Item'),
    numberCtrl('amount', 'Valor'),
  ],
  defaultSettings: { currency: 'USD', item_name: 'Produto', amount: 0 },
  previewRenderer: () => null,
}

const stripeButtonSchema: WidgetSchema = {
  name: 'stripe-button', title: 'Botão Stripe', icon: 'eicon-stripe', category: 'elementor-pro',
  controls: [
    textCtrl('api_key', 'Chave API'),
    numberCtrl('amount', 'Valor (centavos)'),
    selectCtrl('currency', 'Moeda', { USD: 'USD', EUR: 'EUR', BRL: 'BRL' }),
    textCtrl('product_name', 'Nome do Produto'),
  ],
  defaultSettings: { currency: 'BRL', product_name: 'Produto', amount: 0 },
  previewRenderer: () => null,
}

const stickySchema: WidgetSchema = {
  name: 'sticky', title: 'Sticky', icon: 'eicon-sticky', category: 'elementor-pro',
  controls: [
    selectCtrl('sticky', 'Posição', { none: 'Nenhum', top: 'Topo', bottom: 'Base' }),
    numberCtrl('sticky_offset', 'Offset', { default: 0 }),
    numberCtrl('top_offset', 'Offset Topo (Desktop)', { default: 0 }),
  ],
  defaultSettings: { sticky: 'top', sticky_offset: 0, top_offset: 0 },
  previewRenderer: () => null,
}

const progressTrackerSchema: WidgetSchema = {
  name: 'progress-tracker', title: 'Progress Tracker', icon: 'eicon-progress-tracker', category: 'elementor-pro',
  controls: [
    selectCtrl('type', 'Tipo', { bar: 'Barra', circular: 'Circular' }),
    selectCtrl('position', 'Posição', { top: 'Topo', bottom: 'Base' }),
  ],
  defaultSettings: { type: 'bar', position: 'top' },
  previewRenderer: () => null,
}

const pageTransitionsSchema: WidgetSchema = {
  name: 'page-transitions', title: 'Transições de Página', icon: 'eicon-page-transitions', category: 'elementor-pro',
  controls: [
    selectCtrl('animation_type', 'Animação', { fade: 'Fade', slide: 'Slide', zoom: 'Zoom' }),
    sliderCtrl('animation_duration', 'Duração', 100, 2000, { default: 500 }),
  ],
  defaultSettings: { animation_type: 'fade', animation_duration: 500 },
  previewRenderer: () => null,
}

const customCodeSchema: WidgetSchema = {
  name: 'custom-code-pro', title: 'Código Customizado', icon: 'eicon-code', category: 'elementor-pro',
  controls: [
    textareaCtrl('code', 'Código'),
    selectCtrl('location', 'Localização', { head: 'Head', body_start: 'Início do Body', body_end: 'Fim do Body' }),
  ],
  defaultSettings: { code: '', location: 'body_start' },
  previewRenderer: () => null,
}

const customCssSchema: WidgetSchema = {
  name: 'custom-css-pro', title: 'CSS Customizado', icon: 'eicon-code-css', category: 'elementor-pro',
  controls: [textareaCtrl('css', 'CSS')],
  defaultSettings: { css: '' },
  previewRenderer: () => null,
}

const displayConditionsSchema: WidgetSchema = {
  name: 'display-conditions', title: 'Condições de Exibição', icon: 'eicon-display-conditions', category: 'elementor-pro',
  controls: [
    repeaterCtrl('conditions', 'Condições', [
      selectCtrl('type', 'Tipo', { login: 'Logado', date: 'Data', url: 'URL', device: 'Dispositivo' }),
      selectCtrl('operator', 'Operador', { is: 'É', is_not: 'Não é' }),
      textCtrl('value', 'Valor'),
    ]),
  ],
  defaultSettings: { conditions: [] },
  previewRenderer: () => null,
}

const floatingButtonsSchema: WidgetSchema = {
  name: 'floating-buttons', title: 'Botões Flutuantes', icon: 'eicon-float-buttons', category: 'elementor-pro',
  controls: [
    selectCtrl('position', 'Posição', { 'bottom-right': 'Inferior Direito', 'bottom-left': 'Inferior Esquerdo' }),
    repeaterCtrl('buttons', 'Botões', [
      iconsCtrl('icon', 'Ícone'),
      urlCtrl('link', 'Link'),
      colorCtrl('color', 'Cor'),
    ]),
  ],
  defaultSettings: { position: 'bottom-right', buttons: [] },
  previewRenderer: () => null,
}

const linkInBioSchema: WidgetSchema = {
  name: 'link-in-bio', title: 'Link in Bio', icon: 'eicon-link', category: 'elementor-pro',
  controls: [
    textCtrl('name', 'Nome'),
    textareaCtrl('bio', 'Bio'),
    mediaCtrl('avatar', 'Avatar'),
    repeaterCtrl('links', 'Links', [
      textCtrl('title', 'Título'),
      urlCtrl('url', 'URL'),
      iconsCtrl('icon', 'Ícone'),
    ]),
  ],
  defaultSettings: { name: '', bio: '', links: [] },
  previewRenderer: () => null,
}

const priceListProSchema: WidgetSchema = {
  name: 'price-list-pro', title: 'Lista de Preços Pro', icon: 'eicon-price-list', category: 'elementor-pro',
  controls: [
    repeaterCtrl('items', 'Itens', [
      textCtrl('title', 'Título'),
      textCtrl('price', 'Preço'),
      textCtrl('description', 'Descrição'),
      mediaCtrl('image', 'Imagem'),
    ]),
  ],
  defaultSettings: {
    items: [
      { title: 'Serviço Premium', price: 'R$ 99', description: 'Descrição do serviço' },
    ],
  },
  previewRenderer: () => null,
}

const ctaProSchema: WidgetSchema = {
  name: 'cta-pro', title: 'Call to Action Pro', icon: 'eicon-cta', category: 'elementor-pro',
  controls: [
    selectCtrl('skin', 'Skin', { classic: 'Clássico', cover: 'Cover' }),
    textCtrl('title', 'Título', { default: 'CTA Pro' }),
    textareaCtrl('description', 'Descrição'),
    textCtrl('button_text', 'Botão', { default: 'Saiba Mais' }),
    urlCtrl('link', 'Link'),
    mediaCtrl('bg_image', 'Imagem de Fundo'),
  ],
  defaultSettings: { skin: 'classic', title: 'CTA Pro', button_text: 'Saiba Mais' },
  previewRenderer: () => null,
}

const flipBoxProSchema: WidgetSchema = {
  name: 'flip-box-pro', title: 'Flip Box Pro', icon: 'eicon-flip-box', category: 'elementor-pro',
  controls: [
    iconsCtrl('front_icon', 'Ícone Frente'),
    textCtrl('front_title', 'Título Frente'),
    textareaCtrl('front_description', 'Descrição Frente'),
    textCtrl('back_title', 'Título Verso'),
    textareaCtrl('back_description', 'Descrição Verso'),
    textCtrl('back_button_text', 'Botão Verso'),
    selectCtrl('flip_direction', 'Direção', { up: 'Cima', down: 'Baixo', left: 'Esquerda', right: 'Direita' }),
    sliderCtrl('height', 'Altura', 100, 600, { default: 300 }),
  ],
  defaultSettings: { front_title: 'Frente', back_title: 'Verso', back_button_text: 'Saiba Mais', flip_direction: 'up', height: 300 },
  previewRenderer: () => null,
}

const priceTableProSchema: WidgetSchema = {
  name: 'price-table-pro', title: 'Tabela de Preços Pro', icon: 'eicon-price-table', category: 'elementor-pro',
  controls: [
    textCtrl('heading', 'Título', { default: 'Plano Pro' }),
    textCtrl('sub_heading', 'Subtítulo'),
    textCtrl('price', 'Preço', { default: 'R$ 199' }),
    textCtrl('original_price', 'Preço Original'),
    textCtrl('period', 'Período', { default: '/mês' }),
    repeaterCtrl('items', 'Funcionalidades', [
      textCtrl('item', 'Item'),
      switcherCtrl('highlighted', 'Destacado', false),
    ]),
    textCtrl('button_text', 'Botão', { default: 'Assinar' }),
    urlCtrl('button_link', 'Link'),
    textCtrl('ribbon_title', 'Ribbon'),
  ],
  defaultSettings: {
    heading: 'Plano Pro', price: 'R$ 199', period: '/mês', button_text: 'Assinar',
    items: [{ item: 'Funcionalidade 1', highlighted: true }],
  },
  previewRenderer: () => null,
}

const animatedHeadlineProSchema: WidgetSchema = {
  name: 'animated-headline-pro', title: 'Título Animado Pro', icon: 'eicon-animated-headline', category: 'elementor-pro',
  controls: [
    selectCtrl('headline_style', 'Estilo', { highlight: 'Destaque', rotate: 'Rotação' }),
    selectCtrl('animation_type', 'Animação', { typing: 'Digitação', clip: 'Clip', flip: 'Flip' }),
    textCtrl('before_text', 'Texto Antes'),
    textCtrl('highlighted_text', 'Texto Destacado'),
    textareaCtrl('rotating_text', 'Textos Rotação'),
  ],
  defaultSettings: { headline_style: 'highlight', animation_type: 'typing', before_text: 'Promova', highlighted_text: 'Produtos' },
  previewRenderer: () => null,
}

const reviewsProSchema: WidgetSchema = {
  name: 'reviews-pro', title: 'Avaliações Pro', icon: 'eicon-review', category: 'elementor-pro',
  controls: [
    switcherCtrl('autoplay', 'Auto Play', true),
    selectCtrl('navigation', 'Navegação', { dots: 'Pontos', arrows: 'Setas', none: 'Nenhum' }),
    repeaterCtrl('reviews', 'Avaliações', [
      textareaCtrl('content', 'Comentário'),
      textCtrl('name', 'Nome'),
      sliderCtrl('rating', 'Avaliação', 1, 5, { default: 5 }),
    ]),
  ],
  defaultSettings: { autoplay: true, navigation: 'dots', reviews: [] },
  previewRenderer: () => null,
}

const subscribeSchema: WidgetSchema = {
  name: 'subscribe', title: 'Inscreva-se', icon: 'eicon-subscribe', category: 'elementor-pro',
  controls: [
    textCtrl('title', 'Título', { default: 'Inscreva-se na Newsletter' }),
    textCtrl('placeholder', 'Placeholder', { default: 'Seu e-mail' }),
    textCtrl('button_text', 'Botão', { default: 'Cadastrar' }),
  ],
  defaultSettings: { title: 'Inscreva-se na Newsletter', placeholder: 'Seu e-mail', button_text: 'Cadastrar' },
  previewRenderer: () => null,
}

const paypalSchema: WidgetSchema = {
  name: 'paypal', title: 'PayPal Checkout', icon: 'eicon-paypal', category: 'elementor-pro',
  controls: [
    textCtrl('email', 'E-mail PayPal'),
    selectCtrl('currency', 'Moeda', { USD: 'USD', EUR: 'EUR', BRL: 'BRL' }),
    numberCtrl('amount', 'Valor'),
    textCtrl('item_name', 'Item'),
  ],
  defaultSettings: { currency: 'USD', item_name: 'Produto', amount: 0 },
  previewRenderer: () => null,
}

const stripeSchema: WidgetSchema = {
  name: 'stripe', title: 'Stripe Checkout', icon: 'eicon-stripe', category: 'elementor-pro',
  controls: [
    textCtrl('api_key', 'Chave API'),
    numberCtrl('amount', 'Valor (centavos)'),
    selectCtrl('currency', 'Moeda', { USD: 'USD', EUR: 'EUR', BRL: 'BRL' }),
    textCtrl('product_name', 'Produto'),
  ],
  defaultSettings: { currency: 'BRL', product_name: 'Produto', amount: 0 },
  previewRenderer: () => null,
}

const containerProSchema: WidgetSchema = {
  name: 'container-pro', title: 'Container Pro', icon: 'eicon-container', category: 'elementor-pro',
  controls: [
    selectCtrl('flex_direction', 'Direção', { row: 'Row', column: 'Column', 'row-reverse': 'Row Reverse', 'column-reverse': 'Column Reverse' }),
    selectCtrl('justify_content', 'Justify', { 'flex-start': 'Start', center: 'Center', 'flex-end': 'End', 'space-between': 'Space Between' }),
    selectCtrl('align_items', 'Align', { stretch: 'Stretch', 'flex-start': 'Start', center: 'Center', 'flex-end': 'End' }),
    sliderCtrl('gap', 'Gap', 0, 50, { default: 8 }),
    sliderCtrl('min_height', 'Altura Mínima', 0, 800, { default: 0 }),
  ],
  defaultSettings: { flex_direction: 'column', justify_content: 'flex-start', align_items: 'stretch', gap: 8, min_height: 0 },
  previewRenderer: () => null,
}

const tableOfContentsProSchema: WidgetSchema = {
  name: 'table-of-contents-pro', title: 'Índice Pro', icon: 'eicon-table-of-contents', category: 'elementor-pro',
  controls: [
    textCtrl('title', 'Título', { default: 'Índice' }),
    selectCtrl('list_type', 'Tipo', { bulleted: 'Marcadores', numbered: 'Numerado' }),
    switcherCtrl('collapsible', 'Recollível', false),
  ],
  defaultSettings: { title: 'Índice', list_type: 'bulleted', collapsible: false },
  previewRenderer: () => null,
}

const codeHighlightProSchema: WidgetSchema = {
  name: 'code-highlight-pro', title: 'Code Highlight Pro', icon: 'eicon-code-highlight', category: 'elementor-pro',
  controls: [
    selectCtrl('language', 'Linguagem', { javascript: 'JS', typescript: 'TS', css: 'CSS', html: 'HTML', php: 'PHP', python: 'Python' }),
    textareaCtrl('code', 'Código'),
    selectCtrl('theme', 'Tema', { dark: 'Escuro', light: 'Claro' }),
    switcherCtrl('line_numbers', 'Números', false),
  ],
  defaultSettings: { language: 'javascript', code: '', theme: 'dark', line_numbers: false },
  previewRenderer: () => null,
}

const lottieProSchema: WidgetSchema = {
  name: 'lottie-pro', title: 'Lottie Pro', icon: 'eicon-lottie', category: 'elementor-pro',
  controls: [
    selectCtrl('source', 'Fonte', { media_file: 'Arquivo', external_url: 'URL' }),
    urlCtrl('source_external_url', 'URL'),
    mediaCtrl('source_media_file', 'Arquivo'),
    switcherCtrl('loop', 'Loop', true),
    switcherCtrl('autoplay', 'Auto Play', true),
    sliderCtrl('speed', 'Velocidade', 0.1, 3, { default: 1 }),
  ],
  defaultSettings: { source: 'external_url', loop: true, autoplay: true, speed: 1 },
  previewRenderer: () => null,
}

const googleMapsProSchema: WidgetSchema = {
  name: 'google-maps-pro', title: 'Google Maps Pro', icon: 'eicon-google-maps', category: 'elementor-pro',
  controls: [
    textCtrl('address', 'Endereço', { default: 'São Paulo, Brasil' }),
    sliderCtrl('zoom', 'Zoom', 1, 20, { default: 15 }),
    sliderCtrl('height', 'Altura', 200, 800, { default: 400 }),
    selectCtrl('map_type', 'Tipo', { roadmap: 'Roadmap', satellite: 'Satellite', hybrid: 'Híbrido', terrain: 'Terreno' }),
  ],
  defaultSettings: { address: 'São Paulo, Brasil', zoom: 15, height: 400, map_type: 'roadmap' },
  previewRenderer: () => null,
}

const countdownProSchema: WidgetSchema = {
  name: 'countdown-pro', title: 'Contador Pro', icon: 'eicon-countdown', category: 'elementor-pro',
  controls: [
    selectCtrl('countdown_type', 'Tipo', { due_date: 'Data', evergreen: 'Evergreen' }),
    textCtrl('due_date', 'Data Final'),
    numberCtrl('evergreen_hours', 'Horas', { default: 24 }),
    switcherCtrl('show_labels', 'Labels', true),
    selectCtrl('separator', 'Separador', { colon: ':', dotted: '.', text: 'Texto' }),
  ],
  defaultSettings: { countdown_type: 'due_date', show_labels: true, separator: 'colon' },
  previewRenderer: () => null,
}

// ============================================================
// REGISTRY EXPORT
// ============================================================
export const WIDGET_REGISTRY: Record<string, WidgetSchema> = {
  // Existing basic widgets (kept as-is, just adding schema)
  'heading': { name: 'heading', title: 'Título', icon: 'H', category: 'basic', controls: [textCtrl('text', 'Texto', { default: 'Título' }), selectCtrl('tag', 'Tag', { h1: 'H1', h2: 'H2', h3: 'H3', h4: 'H4', h5: 'H5', h6: 'H6' })], defaultSettings: { text: 'Título', tag: 'h2' }, previewRenderer: () => null },
  'text': { name: 'text', title: 'Editor de Texto', icon: 'T', category: 'basic', controls: [textareaCtrl('text', 'Texto', { default: '<p>Texto aqui...</p>' })], defaultSettings: { text: '<p>Texto aqui...</p>' }, previewRenderer: () => null },
  'image': { name: 'image', title: 'Imagem', icon: '🖼', category: 'basic', controls: [mediaCtrl('image', 'Imagem'), chooseCtrl('align', 'Alinhamento', { left: 'left', center: 'center', right: 'right' })], defaultSettings: {}, previewRenderer: () => null },
  'button': { name: 'button', title: 'Botão', icon: '▣', category: 'basic', controls: [textCtrl('label', 'Texto', { default: 'Clique aqui' }), urlCtrl('link', 'Link')], defaultSettings: { label: 'Clique aqui' }, previewRenderer: () => null },
  'icon': { name: 'icon', title: 'Ícone', icon: '★', category: 'basic', controls: [iconsCtrl('selected_icon', 'Ícone')], defaultSettings: {}, previewRenderer: () => null },
  'divider': { name: 'divider', title: 'Divisor', icon: '—', category: 'basic', controls: [], defaultSettings: {}, previewRenderer: () => null },
  'spacer': { name: 'spacer', title: 'Espaçador', icon: '↕', category: 'basic', controls: [sliderCtrl('height', 'Altura', 10, 200, { default: 50 })], defaultSettings: { height: 50 }, previewRenderer: () => null },
  'googleMaps': { name: 'googleMaps', title: 'Google Maps', icon: '⚑', category: 'basic', controls: [], defaultSettings: {}, previewRenderer: () => null },
  'video': { name: 'video', title: 'Vídeo', icon: '▶', category: 'basic', controls: [], defaultSettings: {}, previewRenderer: () => null },

  // Elementor Pro widgets
  'media-carousel': mediaCarouselSchema,
  'slides': slidesSchema,
  'nav-menu': navMenuSchema,
  'form': formSchema,
  'flip-box': flipBoxSchema,
  'call-to-action': ctaSchema,
  'countdown': countdownSchema,
  'price-table': priceTableSchema,
  'animated-headline': animatedHeadlineSchema,
  'table-of-contents': tocSchema,
  'share-buttons': shareButtonsSchema,
  'hotspot': hotspotSchema,
  'lottie': lottieSchema,
  'code-highlight': codeHighlightSchema,
  'video-playlist': videoPlaylistSchema,
  'blockquote': blockquoteSchema,
  'login': loginSchema,
  'search': searchSchema,
  'off-canvas': offCanvasSchema,
  'portfolio': portfolioSchema,
  'posts': postsSchema,
  'gallery': gallerySchema,
  'social-icons': socialIconsSchema,
  'testimonial-carousel': testimonialCarouselSchema,
  'reviews': reviewsSchema,
  'posts-carousel': postsCarouselSchema,
  'nested-carousel': nestedCarouselSchema,
  'loop-grid': loopGridSchema,
  'site-logo': siteLogoSchema,
  'site-title': siteTitleSchema,
  'page-title': pageTitleSchema,
  'post-title': postTitleSchema,
  'post-content': postContentSchema,
  'post-excerpt': postExcerptSchema,
  'featured-image': featuredImageSchema,
  'post-info': postInfoSchema,
  'post-navigation': postNavigationSchema,
  'author-box': authorBoxSchema,
  'search-form': searchFormSchema,
  'mega-menu': megaMenuSchema,
  'breadcrumbs-pro': breadcrumbsProSchema,
  'image-gallery-pro': imageGalleryProSchema,
  'form-pro': formProSchema,
  'login-pro': loginProSchema,
  'paypal-button': paypalButtonSchema,
  'stripe-button': stripeButtonSchema,
  'sticky': stickySchema,
  'progress-tracker': progressTrackerSchema,
  'page-transitions': pageTransitionsSchema,
  'custom-code-pro': customCodeSchema,
  'custom-css-pro': customCssSchema,
  'display-conditions': displayConditionsSchema,
  'floating-buttons': floatingButtonsSchema,
  'link-in-bio': linkInBioSchema,
  'price-list-pro': priceListProSchema,
  'cta-pro': ctaProSchema,
  'flip-box-pro': flipBoxProSchema,
  'price-table-pro': priceTableProSchema,
  'animated-headline-pro': animatedHeadlineProSchema,
  'reviews-pro': reviewsProSchema,
  'subscribe': subscribeSchema,
  'paypal': paypalSchema,
  'stripe': stripeSchema,
  'container-pro': containerProSchema,
  'table-of-contents-pro': tableOfContentsProSchema,
  'code-highlight-pro': codeHighlightProSchema,
  'lottie-pro': lottieProSchema,
  'google-maps-pro': googleMapsProSchema,
  'countdown-pro': countdownProSchema,
  'share-buttons-el': shareButtonsSchema,
}

// Helper to get widget schema
export function getWidgetSchema(type: string): WidgetSchema | undefined {
  return WIDGET_REGISTRY[type]
}

// Helper to get default settings for a widget
export function getDefaultWidgetSettings(type: string): Record<string, any> {
  const schema = WIDGET_REGISTRY[type]
  if (!schema) return {}
  return { ...schema.defaultSettings }
}

// Helper to get controls for a widget
export function getWidgetControls(type: string): WidgetControl[] {
  const schema = WIDGET_REGISTRY[type]
  if (!schema) return []
  return schema.controls
}
