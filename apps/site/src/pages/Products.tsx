import { useState, useRef, useEffect } from 'react'
import { useSearchParams, useLocation, Link } from 'react-router-dom'
import './Products.css'

interface ChapterItem {
  label: string
  url: string
  image: string
  badge?: string
  width?: number
  height?: number
}

interface ProductCardData {
  id: string
  title: string
  badge?: string
  image: string
  colors: string[]
  headline: string
  price: string
  learnMoreUrl: string
  buyUrl: string
}

export default function Products() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  // Categoria ativa: /ipad, /watch, /mac, /iphone, ou por query param
  const pathSegment = location.pathname.replace('/', '')
  const currentCategory = searchParams.get('categoria') || searchParams.get('segmento') || pathSegment || 'ipad'

  useEffect(() => {
    window.scrollTo(0, 0)
    checkScroll()
  }, [currentCategory])

  function checkScroll() {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 10)
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10)
    }
  }

  function scroll(direction: 'left' | 'right') {
    if (scrollRef.current) {
      const scrollAmount = 360
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      })
      setTimeout(checkScroll, 350)
    }
  }

  // ChapterNav 1:1 Oficial para iPad (Com as URLs oficiais da Apple)
  const ipadChapterNav: ChapterItem[] = [
    {
      label: 'iPad Pro',
      url: '/ipad',
      image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/ipad_pro_8c6c9576c.png',
      width: 54,
      height: 64,
    },
    {
      label: 'iPad Air',
      url: '/ipad',
      image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/ipad_air_a25153037.png',
      width: 54,
      height: 64,
    },
    {
      label: 'iPad',
      url: '/ipad',
      image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/ipad_9308ca47a.png',
      width: 50,
      height: 64,
    },
    {
      label: 'iPad mini',
      url: '/ipad',
      image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/ipad_mini_6884caafc.png',
      width: 36,
      height: 64,
    },
    {
      label: 'Compare',
      url: '/ipad',
      image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/compare_b74d7a1e3.png',
      width: 91,
      height: 64,
    },
    {
      label: 'Apple Pencil',
      url: '/ipad',
      image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/apple_pencil_6c8408c54.png',
      width: 19,
      height: 64,
    },
    {
      label: 'Keyboards',
      url: '/ipad',
      image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/keyboards_c8202d7ef.png',
      width: 65,
      height: 64,
    },
    {
      label: 'Accessories',
      url: '/ipad',
      image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/accessories_d7234e26e.png',
      width: 47,
      height: 64,
    },
    {
      label: 'iPadOS 27',
      url: '/ipad',
      badge: 'Preview',
      image: 'https://www.apple.com/assets-www/en_WW/ipad/04_chapternav/small/ipados_14bbae36a.png',
      width: 52,
      height: 64,
    },
    {
      label: 'Shop iPad',
      url: '/ipad',
      image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/shop_ipad_fad2a5a84.png',
      width: 68,
      height: 64,
    },
  ]

  // ChapterNav Oficial para Watch
  const watchChapterNav: ChapterItem[] = [
    {
      label: 'Apple Watch Series 11',
      url: '/watch',
      image: 'https://www.apple.com/assets-www/en_WW/watch/chapter_nav/watch_s11_f3d43534c.svg',
      width: 27,
      height: 56,
    },
    {
      label: 'Apple Watch SE 3',
      url: '/watch',
      image: 'https://www.apple.com/assets-www/en_WW/watch/chapter_nav/watch_se_5af4fbe6c.svg',
      width: 25,
      height: 56,
    },
    {
      label: 'Apple Watch Ultra 3',
      url: '/watch',
      image: 'https://www.apple.com/assets-www/en_WW/watch/chapter_nav/watch_ultra_c6d26b96b.svg',
      width: 28,
      height: 56,
    },
    {
      label: 'Apple Watch Nike',
      url: '/watch',
      image: 'https://www.apple.com/assets-www/en_WW/watch/chapter_nav/watch_nike_095f6983c.svg',
      width: 27,
      height: 56,
    },
    {
      label: 'Apple Watch Hermès',
      url: '/watch',
      image: 'https://www.apple.com/assets-www/en_WW/watch/chapter_nav/watch_hermes_e6bd784c6.svg',
      width: 39,
      height: 56,
    },
    {
      label: 'Compare',
      url: '/watch',
      image: 'https://www.apple.com/assets-www/en_WW/watch/chapter_nav/compare_watch_6b6259c4a.svg',
      width: 45,
      height: 56,
    },
    {
      label: 'Bands',
      url: '/watch',
      image: 'https://www.apple.com/assets-www/en_WW/watch/chapter_nav/watch_bands_0e3eb7a2d.svg',
      width: 16,
      height: 56,
    },
    {
      label: 'Accessories',
      url: '/watch',
      image: 'https://www.apple.com/assets-www/en_WW/watch/chapter_nav/accessories_watch_6ad7b5f53.svg',
      width: 21,
      height: 56,
    },
    {
      label: 'Apple Fitness+',
      url: '/watch',
      image: 'https://www.apple.com/assets-www/en_WW/watch/chapter_nav/fitness_plus_5e817af2a.svg',
      width: 42,
      height: 56,
    },
    {
      label: 'Shop Watch',
      url: '/watch',
      image: 'https://www.apple.com/assets-www/en_WW/watch/chapter_nav/shop_watch_4b61b477b.svg',
      width: 68,
      height: 56,
    },
    {
      label: 'watchOS 27',
      url: '/watch',
      badge: 'Preview',
      image: 'https://www.apple.com/assets-www/en_WW/watch/chapter_nav/watchos_cfaae638b.svg',
      width: 36,
      height: 56,
    },
  ]

  // ChapterNav para Mac
  const macChapterNav: ChapterItem[] = [
    { label: 'MacBook Air', url: '/mac', image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/keyboards_c8202d7ef.png' },
    { label: 'MacBook Pro', url: '/mac', image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/keyboards_c8202d7ef.png' },
    { label: 'iMac', url: '/mac', image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/compare_b74d7a1e3.png' },
    { label: 'Mac mini', url: '/mac', image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/ipad_mini_6884caafc.png' },
    { label: 'Mac Studio', url: '/mac', image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/ipad_pro_8c6c9576c.png' },
    { label: 'Displays', url: '/mac', image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/compare_b74d7a1e3.png' },
    { label: 'Accessories', url: '/mac', image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/accessories_d7234e26e.png' },
    { label: 'Shop Mac', url: '/mac', image: 'https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/shop_ipad_fad2a5a84.png' },
  ]

  // Produtos por categoria (Carrossel Apple)
  const ipadProducts: ProductCardData[] = [
    {
      id: 'ipad-pro',
      title: 'iPad Pro',
      badge: 'Novo',
      image: 'https://www.apple.com/v/ipad-pro/ao/images/overview/hero/hero__e2z86z500dqq_large.jpg',
      colors: ['#1d1d1f', '#e2e4e9'],
      headline: 'Inacreditavelmente fino. Poder colossal com chip M4 e tela Tandem OLED.',
      price: 'A partir de R$ 12.299',
      learnMoreUrl: '/ipad',
      buyUrl: '/produtos',
    },
    {
      id: 'ipad-air',
      title: 'iPad Air',
      badge: 'Novo',
      image: 'https://www.apple.com/v/ipad-air/x/images/overview/design/colors__en3iud8nawya_large.jpg',
      colors: ['#3e434f', '#c9d7e8', '#e5dacb', '#95a18d'],
      headline: 'Feito para levar a qualquer lugar com o poder do chip M2.',
      price: 'A partir de R$ 6.999',
      learnMoreUrl: '/ipad',
      buyUrl: '/produtos',
    },
    {
      id: 'ipad-10',
      title: 'iPad (10ª geração)',
      image: 'https://www.apple.com/v/ipad-10.9/d/images/overview/design/colors__dcv37x8n7dme_large.jpg',
      colors: ['#e45050', '#2d6ae3', '#e4db54', '#d2d5dc'],
      headline: 'O iPad colorido e indispensável para todas as tarefas do dia a dia.',
      price: 'A partir de R$ 3.999',
      learnMoreUrl: '/ipad',
      buyUrl: '/produtos',
    },
    {
      id: 'ipad-mini',
      title: 'iPad mini',
      badge: 'Novo',
      image: 'https://www.apple.com/v/ipad-mini/r/images/overview/design/colors__en3iud8nawya_large.jpg',
      colors: ['#4b4f58', '#d0d8e8', '#e5d7cb', '#d8ceda'],
      headline: 'Poder ultraportátil de 8,3 polegadas com chip A17 Pro e Apple Intelligence.',
      price: 'A partir de R$ 5.999',
      learnMoreUrl: '/ipad',
      buyUrl: '/produtos',
    },
  ]

  const watchProducts: ProductCardData[] = [
    {
      id: 'watch-series-11',
      title: 'Apple Watch Series 11',
      badge: 'Novo',
      image: 'https://www.apple.com/v/watch/bu/images/overview/select/product_s10__d7v2jcf8mro2_large.png',
      colors: ['#979494', '#f0eff1', '#f6d9cd', '#010203', '#e3ddd7', '#f4dec8', '#47423d'],
      headline: 'O dispositivo definitivo para cuidar da sua saúde.',
      price: 'A partir de R$ 5.499 ou 12x de R$ 458,25',
      learnMoreUrl: '/watch',
      buyUrl: '/produtos',
    },
    {
      id: 'watch-se-3',
      title: 'Apple Watch SE 3',
      image: 'https://www.apple.com/v/watch/bu/images/overview/select/product_se__d7v2jcf8mro2_large.png',
      colors: ['#1a2530', '#ded6d1'],
      headline: 'Recursos essenciais de saúde e segurança com excelente custo-benefício.',
      price: 'A partir de R$ 3.299 ou 12x de R$ 274,92',
      learnMoreUrl: '/watch',
      buyUrl: '/produtos',
    },
    {
      id: 'watch-ultra-3',
      title: 'Apple Watch Ultra 3',
      badge: 'Novo',
      image: 'https://www.apple.com/v/watch/bu/images/overview/select/product_ultra2__d7v2jcf8mro2_large.png',
      colors: ['#ccc4bc', '#0f0e0e'],
      headline: 'O relógio definitivo para esportes radicais e aventuras.',
      price: 'A partir de R$ 10.499 ou 12x de R$ 874,92',
      learnMoreUrl: '/watch',
      buyUrl: '/produtos',
    },
  ]

  const isWatch = currentCategory.includes('watch')
  const isMac = currentCategory.includes('mac')
  const activeChapterNav = isWatch ? watchChapterNav : isMac ? macChapterNav : ipadChapterNav
  const activeProducts = isWatch ? watchProducts : ipadProducts
  const categoryTitle = isWatch ? 'Apple Watch' : isMac ? 'Mac' : 'iPad'

  return (
    <div className="apple-cat-page">
      {/* ── TOP RIBBON ── */}
      <section className="apple-cat-ribbon">
        <span>
          Por tempo limitado, ganhe um vale-presente de até R$ 1.500 na compra com desconto para educação.
        </span>
        <a href="/produtos">Compre &gt;</a>
      </section>

      {/* ── CHAPTER NAV (BARRA DE ÍCONES OFICIAL 1:1) ── */}
      <nav className="ChapterNav_chapternav" aria-label={`${categoryTitle} family of products`}>
        <div className="ChapterNav_chapternav-wrapper">
          <ul className="ChapterNav_chapternav-items">
            {activeChapterNav.map((item, idx) => (
              <li key={idx} className="ChapterNav_chapternav-item">
                <Link to={item.url} className="ChapterNav_chapternav-link">
                  <figure className="ChapterNav_chapternav-icon" aria-hidden="true">
                    <img
                      src={item.image}
                      alt={item.label}
                      className="ChapterNav_chapternav-image"
                      width={item.width || 48}
                      height={item.height || 56}
                      loading="lazy"
                    />
                  </figure>
                  <p className="ChapterNav_chapternav-label">{item.label}</p>
                  {item.badge && <span className="ChapterNav_chapternav-badge">{item.badge}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* ── CATEGORY TITLE ── */}
      <div className="PageHeader_container">
        <h1 className="PageHeader_title">{categoryTitle}</h1>
        <p className="PageHeader_subtitle">
          {isWatch
            ? 'O dispositivo supremo para uma vida mais ativa, saudável e conectada.'
            : 'Toque, desenhe e digite no dispositivo mais versátil do mundo.'}
        </p>
      </div>

      {/* ── HERO SECTIONS (EXACT MATCH APPLE) ── */}
      {!isWatch && !isMac && (
        <div className="HeroSections_container">
          {/* iPad Pro */}
          <section className="HeroSection_hero HeroSection_dark">
            <div className="HeroSection_content">
              <h2 className="HeroSection_headline">iPad Pro</h2>
              <p className="HeroSection_subhead">Inacreditavelmente fino. Poder colossal com chip M4.</p>
              <p className="HeroSection_price">A partir de R$ 12.299</p>
              <div className="HeroSection_links">
                <Link to="/ipad-pro" className="Button_primary">Comprar</Link>
                <Link to="/ipad-pro/specs" className="StandardsLink_link">Saber mais &gt;</Link>
              </div>
            </div>
            <div className="HeroSection_imageWrapper">
              <img src="https://www.apple.com/v/ipad/home/ch/images/overview/hero/ipad_pro__cenwtbnex8zm_large.png" alt="iPad Pro" />
            </div>
          </section>

          {/* iPad Air */}
          <section className="HeroSection_hero HeroSection_light">
            <div className="HeroSection_content">
              <h2 className="HeroSection_headline">iPad Air</h2>
              <p className="HeroSection_subhead">Fresco. Ar fresco. Com chip M2.</p>
              <p className="HeroSection_price">A partir de R$ 6.999</p>
              <div className="HeroSection_links">
                <Link to="/ipad-air" className="Button_primary">Comprar</Link>
                <Link to="/ipad-air/specs" className="StandardsLink_link">Saber mais &gt;</Link>
              </div>
            </div>
            <div className="HeroSection_imageWrapper">
              <img src="https://www.apple.com/v/ipad/home/ch/images/overview/hero/ipad_air__b5ttwgvptmua_large.png" alt="iPad Air" />
            </div>
          </section>

          {/* iPad 10 */}
          <section className="HeroSection_hero HeroSection_light HeroSection_alt">
            <div className="HeroSection_content">
              <h2 className="HeroSection_headline">iPad</h2>
              <p className="HeroSection_subhead">Adorável. Desenhável. Mágico.</p>
              <p className="HeroSection_price">A partir de R$ 3.999</p>
              <div className="HeroSection_links">
                <Link to="/ipad-10" className="Button_primary">Comprar</Link>
                <Link to="/ipad-10/specs" className="StandardsLink_link">Saber mais &gt;</Link>
              </div>
            </div>
            <div className="HeroSection_imageWrapper">
              <img src="https://www.apple.com/v/ipad/home/ch/images/overview/hero/ipad__f7gngsqhweqm_large.png" alt="iPad 10ª geração" />
            </div>
          </section>

          {/* iPad mini */}
          <section className="HeroSection_hero HeroSection_light">
            <div className="HeroSection_content">
              <div className="HeroSection_badge">Novo</div>
              <h2 className="HeroSection_headline">iPad mini</h2>
              <p className="HeroSection_subhead">Feito para a Apple Intelligence. Com chip A17 Pro.</p>
              <p className="HeroSection_price">A partir de R$ 5.999</p>
              <div className="HeroSection_links">
                <Link to="/ipad-mini" className="Button_primary">Comprar</Link>
                <Link to="/ipad-mini/specs" className="StandardsLink_link">Saber mais &gt;</Link>
              </div>
            </div>
            <div className="HeroSection_imageWrapper">
              <img src="https://www.apple.com/v/ipad/home/ch/images/overview/hero/ipad_mini__dnf8j4vpsm6a_large.png" alt="iPad mini" />
            </div>
          </section>
        </div>
      )}

      {/* ── PRODUCT CAROUSEL / EXPLORE THE LINEUP (STICKY FOOTER GALLERY) ── */}
      <section className="ProductTileGallery_section">
        <div className="ProductTileGallery_header">
          <h2 className="ProductTileGallery_headline">Explore a linha de produtos.</h2>
          <div className="Gallery_paddleNav">
            <button
              className="PaddleNav_btn"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Anterior"
            >
              <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
                <path d="M8.5 15L1.5 8L8.5 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </button>
            <button
              className="PaddleNav_btn"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Próximo"
            >
              <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
                <path d="M1.5 1L8.5 8L1.5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              </svg>
            </button>
          </div>
        </div>

        <div className="StickyFooterGallery_track" ref={scrollRef} onScroll={checkScroll}>
          {activeProducts.map((prod) => (
            <div key={prod.id} className="ProductTile_productTile">
              <div className="ProductTile_badge">{prod.badge || ''}</div>
              <h3 className="typography_headline">{prod.title}</h3>

              <div className="ProductTile_productImage">
                <img src={prod.image} alt={prod.title} loading="lazy" />
              </div>

              {/* Color Indicator Swatches */}
              <ul className="ColorIndicator_colorindicator-items">
                {prod.colors.map((color, cIdx) => (
                  <li
                    key={cIdx}
                    className="ColorIndicator_swatch"
                    style={{ backgroundColor: color }}
                    title={`Opção ${cIdx + 1}`}
                  />
                ))}
              </ul>

              <p className="ProductTile_copy">{prod.headline}</p>
              <div className="ProductTile_pricing">{prod.price}</div>

              <div className="ProductTileLinks_tileFooter">
                <Link to={prod.learnMoreUrl} className="Button_primary">
                  Saber mais
                </Link>
                <Link to={prod.buyUrl} className="StandardsLink_link">
                  Comprar &gt;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION: WHY APPLE / WHY TEKNIX IS THE BEST PLACE TO SHOP ── */}
      <section className="MarcomSection_backgroundTertiary">
        <div className="SectionHeader_container">
          <h2 className="SectionHeader_headline">
            Por que este é o melhor lugar para comprar {categoryTitle}.
          </h2>
          <Link to="/produtos" className="StandardsLink_link" style={{ fontSize: '15px' }}>
            Ver todas as opções &gt;
          </Link>
        </div>

        <div className="FeatureCard_grid">
          <div className="FeatureCard_card">
            <span className="FeatureCard_label">Financiamento</span>
            <h3 className="FeatureCard_headline">Pague em até 12x sem juros.</h3>
            <p className="FeatureCard_body">Com parcelas acessíveis e 10% de desconto à vista no Pix.</p>
            <div className="FeatureCard_image">
              <img
                src="https://www.apple.com/v/home/images/apple-card/a/promo_apple_card__d8xz4kd4evwy_large.jpg"
                alt="Apple Card Titânio"
              />
            </div>
          </div>

          <div className="FeatureCard_card">
            <span className="FeatureCard_label">Trade In</span>
            <h3 className="FeatureCard_headline">Economize com a troca do seu usado.</h3>
            <p className="FeatureCard_body">Receba créditos imediatos dando seu modelo atual como entrada.</p>
            <div className="FeatureCard_image">
              <img
                src="https://www.apple.com/v/home/images/iphone-family/a/promo_iphone_family__ftpjp9fda2uu_large.jpg"
                alt="Troca de aparelhos"
              />
            </div>
          </div>

          <div className="FeatureCard_card">
            <span className="FeatureCard_label">Entrega Expressa</span>
            <h3 className="FeatureCard_headline">Receba seu pedido com rapidez e segurança.</h3>
            <p className="FeatureCard_body">Frete grátis para todo o Brasil com rastreamento em tempo real.</p>
            <div className="FeatureCard_image">
              <img
                src="https://www.apple.com/v/home/images/back-to-school-2026/a/hero_back_to_school_startframe__cd4vg5frm39e_large.png"
                alt="Entrega"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION: ESSENTIALS (ACESSÓRIOS ESSENCIAIS) ── */}
      <section className="Essentials_section">
        <div className="Essentials_banner">
          <div className="Essentials_info">
            <h3>Acessórios indispensáveis.</h3>
            <p>Descubra capas, canetas, teclados e pulseiras com materiais de alta precisão.</p>
            <Link to="/produtos" className="Button_primary">
              Ver todos os acessórios
            </Link>
          </div>
          <div className="Essentials_image">
            <img
              src="https://www.apple.com/assets-www/en_WW/ipad/03_chapternav/small/accessories_d7234e26e.png"
              alt="Acessórios"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
