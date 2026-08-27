/* ==========================================================================
   TEKNIX SITE — PRODUCT OVERVIEW (1:1 PADRÃO MACBOOK NEO APPLE)
   ========================================================================== */

import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getProductBySku, getProductById } from '../services/products'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import { Heart } from 'lucide-react'
import PageRenderer from '../components/PageRenderer'
import type { Product } from '../types/database'
import './Product.css'

function formatPrice(price: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(price)
}

export default function Product() {
  const { sku } = useParams<{ sku: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState('citrus')
  const [activeHighlight, setActiveHighlight] = useState(0)
  const [isHighlightPlaying, setIsHighlightPlaying] = useState(true)
  const [activeFeatureTab, setActiveFeatureTab] = useState(0)
  const { addToCart, openCart } = useCart()
  const { isFavorite, toggleFavorite } = useFavorites()

  useEffect(() => {
    window.scrollTo(0, 0)
    if (!sku) return
    setLoading(true)

    async function load() {
      let data = await getProductBySku(sku!)
      if (!data) {
        data = await getProductById(sku!)
      }
      setProduct(data)
      setLoading(false)
    }

    load()
  }, [sku])

  // Color options
  const colorMap: Record<string, { name: string; hex: string; img: string }> = {
    silver: {
      name: 'Prata',
      hex: '#e3e4e5',
      img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80'
    },
    blush: {
      name: 'Blush',
      hex: '#e8c5c8',
      img: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=1200&q=80'
    },
    citrus: {
      name: 'Citrus',
      hex: '#f5d77f',
      img: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80'
    },
    indigo: {
      name: 'Índigo',
      hex: '#3f4c6b',
      img: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=1200&q=80'
    }
  }

  // Highlights list
  const highlights = [
    {
      id: 0,
      title: 'Quatro cores deslumbrantes. Um design resistente.',
      desc: 'Prata, Blush, Citrus e Índigo. Estrutura durável em alumínio 100% reciclado.',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&q=80'
    },
    {
      id: 1,
      title: 'Rápido para o dia a dia. Até 16 horas de bateria.',
      desc: 'Potência e eficiência para trabalhar, criar e estudar sem precisar da tomada.',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&q=80'
    },
    {
      id: 2,
      title: 'Tela Liquid Retina de 13 polegadas brilhante e vívida.',
      desc: 'Mais de 1 bilhão de cores, 500 nits de brilho e resolução ultra-nítida.',
      image: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1200&q=80'
    },
    {
      id: 3,
      title: 'Uma plataforma poderosa para Inteligência Artificial.',
      desc: 'Ferramentas de escrita, limpeza inteligente de fotos e privacidade máxima.',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&q=80'
    },
    {
      id: 4,
      title: 'Combinação mágica com o seu iPhone.',
      desc: 'Atenda ligações, envie mensagens, copie e cole de um dispositivo para o outro.',
      image: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=1200&q=80'
    }
  ]

  // Feature Tabs (Mac + iPhone)
  const continuityFeatures = [
    {
      title: 'Ligações e Mensagens',
      heading: 'Faça chamadas e mande mensagens direto no Mac.',
      desc: 'Atenda chamadas do seu iPhone e continue conversas no teclado do Mac com total fluidez.'
    },
    {
      title: 'Handoff',
      heading: 'Comece em um aparelho. Termine no outro.',
      desc: 'Inicie um e-mail ou documento no iPhone e continue instantaneamente no Mac.'
    },
    {
      title: 'Espelhamento',
      heading: 'Use a tela do seu iPhone diretamente no Mac.',
      desc: 'Visualize e controle seus aplicativos favoritos do iPhone sem tirar as mãos do teclado.'
    },
    {
      title: 'AirDrop',
      heading: 'Compartilhe fotos e arquivos pelo ar num piscar de olhos.',
      desc: 'Envio rápido e seguro de fotos, vídeos e apresentações sem precisar de cabos ou internet.'
    },
    {
      title: 'Área de Transferência',
      heading: 'Copie no iPhone. Cole no Mac.',
      desc: 'Copie imagens, links ou textos no celular e cole diretamente em documentos no Mac.'
    }
  ]

  // Auto-play highlights
  useEffect(() => {
    if (!isHighlightPlaying) return
    const timer = setInterval(() => {
      setActiveHighlight((prev) => (prev + 1) % highlights.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [isHighlightPlaying, highlights.length])

  if (loading) {
    return (
      <div className="product-loading-screen">
        <div className="spinner" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="product-not-found">
        <h2>Produto não encontrado</h2>
        <p>O produto que você procura não está disponível no momento.</p>
        <Link to="/produtos" className="button button-primary">Ver catálogo</Link>
      </div>
    )
  }

  if (product.presentation_page_id) {
    return (
      <div className="product-page-builder">
        <PageRenderer pageId={product.presentation_page_id} product={product} />
      </div>
    )
  }

  const currentPrice = (product.promo_price && product.promo_price > 0 ? product.promo_price : product.price) || 699.00
  const installmentPrice = currentPrice / 12
  const currentColorObj = colorMap[selectedColor] || colorMap.citrus

  function handleBuy() {
    if (!product) return
    addToCart({
      id: product.id,
      name: product.name,
      sku: product.sku || product.id,
      price: product.price || currentPrice,
      promo_price: product.promo_price || null,
      image: currentColorObj.img || product.image_url || '',
      stock: product.stock || 10
    })
    openCart()
  }

  return (
    <div className="apple-product-page">
      {/* ── LOCAL NAV (SUB-MENU FIXO 1:1 APPLE) ── */}
      <nav className="ac-localnav" aria-label="Navegação local do produto">
        <div className="ac-localnav-wrapper">
          <div className="ac-localnav-title">
            <Link to="#">{product.name || 'MacBook Neo'}</Link>
          </div>
          <div className="ac-localnav-menu">
            <div className="ac-localnav-links">
              <a href="#overview" className="ac-localnav-link current">Visão Geral</a>
              <a href="#highlights" className="ac-localnav-link">Destaques</a>
              <a href="#performance" className="ac-localnav-link">Performance</a>
              <a href="#specs" className="ac-localnav-link">Especificações</a>
              <a href="#compare" className="ac-localnav-link">Comparar</a>
            </div>
            <div className="ac-localnav-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className={`ac-localnav-fav-btn ${product && isFavorite(product.id) ? 'active' : ''}`}
                onClick={() => {
                  if (product) {
                    toggleFavorite({
                      id: product.id,
                      name: product.name,
                      sku: product.sku || product.id,
                      price: product.price || currentPrice,
                      promo_price: product.promo_price || null,
                      image_url: currentColorObj.img || product.image_url || '',
                      slug: product.slug
                    })
                  }
                }}
                title={product && isFavorite(product.id) ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                style={{
                  background: 'transparent',
                  border: '1px solid #d2d2d7',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: product && isFavorite(product.id) ? '#ff3b30' : '#1d1d1f'
                }}
              >
                <Heart size={16} fill={product && isFavorite(product.id) ? '#ff3b30' : 'none'} />
              </button>
              <button type="button" className="ac-localnav-buy-btn" onClick={handleBuy}>
                Comprar
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── TOP RIBBON ── */}
      <div className="product-ribbon">
        <p>
          Economize na compra do {product.name} com desconto para estudantes.* A partir de {formatPrice(currentPrice * 0.88)}.{' '}
          <Link to="/produtos" className="product-ribbon-link">Comprar &gt;</Link>
        </p>
      </div>

      {/* ── MARQUEE HERO ── */}
      <section id="overview" className="section-marquee-hero">
        <div className="marquee-content">
          <h1 className="marquee-eyebrow">{product.name}</h1>
          <h2 className="marquee-headline gradient-text">
            <span>Hello, Neo.</span>
          </h2>
          <div className="marquee-pricing">
            <p className="price-main">A partir de {formatPrice(currentPrice)}</p>
            <p className="price-sub">ou 12x de {formatPrice(installmentPrice)} sem juros no cartão**</p>
          </div>
          <div className="marquee-cta-group">
            <button className="button button-primary" onClick={handleBuy}>
              Comprar agora
            </button>
          </div>
        </div>

        <div className="marquee-media-wrapper">
          <img
            src={currentColorObj.img}
            alt={product.name}
            className="marquee-hero-img"
          />
        </div>
      </section>

      {/* ── HIGHLIGHTS GALLERY ("GET THE HIGHLIGHTS") ── */}
      <section id="highlights" className="section-highlights">
        <div className="highlights-header">
          <h2>Principais Destaques.</h2>
        </div>

        <div className="highlights-card-viewport">
          <div className="highlights-card-container">
            <div className="highlight-card">
              <div className="highlight-card-caption">
                <p className="highlight-card-headline">{highlights[activeHighlight].title}</p>
                <p className="highlight-card-desc">{highlights[activeHighlight].desc}</p>
              </div>
              <div className="highlight-card-media">
                <img
                  src={highlights[activeHighlight].image}
                  alt={highlights[activeHighlight].title}
                  className="highlight-img"
                />
              </div>
            </div>
          </div>

          {/* Dots de navegação & Play/Pause */}
          <div className="highlights-controls">
            <div className="highlights-dots">
              {highlights.map((h, idx) => (
                <button
                  key={h.id}
                  className={`highlight-dot-btn ${idx === activeHighlight ? 'active' : ''}`}
                  onClick={() => setActiveHighlight(idx)}
                  aria-label={`Destaque ${idx + 1}`}
                >
                  <span className="dot-fill"></span>
                </button>
              ))}
            </div>
            <button
              className="highlight-play-pause-btn"
              onClick={() => setIsHighlightPlaying(!isHighlightPlaying)}
              title={isHighlightPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isHighlightPlaying ? '❚❚' : '▶'}
            </button>
          </div>
        </div>
      </section>

      {/* ── TAKE A CLOSER LOOK (SELETOR VISUAL DE CORES) ── */}
      <section className="section-closer-look">
        <div className="closer-look-header">
          <h2>Veja mais de perto.</h2>
        </div>

        <div className="closer-look-display-box">
          <div className="closer-look-image-frame">
            <img src={currentColorObj.img} alt={currentColorObj.name} className="closer-look-img" />
          </div>

          <div className="closer-look-color-picker">
            <p className="color-current-label">
              Cor: <strong>{currentColorObj.name}</strong>
            </p>
            <div className="color-swatches">
              {Object.keys(colorMap).map((cKey) => (
                <button
                  key={cKey}
                  className={`color-swatch-btn ${selectedColor === cKey ? 'selected' : ''}`}
                  style={{ backgroundColor: colorMap[cKey].hex }}
                  onClick={() => setSelectedColor(cKey)}
                  title={colorMap[cKey].name}
                  aria-label={colorMap[cKey].name}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CHAPTER 1: PERFORMANCE ── */}
      <section id="performance" className="section-story-chapter chapter-performance">
        <div className="chapter-inner">
          <div className="chapter-text-block">
            <span className="chapter-eyebrow">Performance</span>
            <h3 className="chapter-headline gradient-text">
              <span>O motor para o seu dia a dia.</span>
            </h3>
            <p className="chapter-body">
              O chip Apple de última geração processa seus aplicativos favoritos, navega com velocidade ultra-rápida, roda jogos imersivos e gerencia tarefas de inteligência artificial com extrema eficiência.
            </p>
            <div className="chapter-stats-row">
              <div className="stat-card">
                <span className="stat-number">16h</span>
                <span className="stat-label">de bateria sem precisar da tomada</span>
              </div>
              <div className="stat-card">
                <span className="stat-number">3.6M</span>
                <span className="stat-label">pixels de resolução cristalina</span>
              </div>
            </div>
          </div>
          <div className="chapter-media-block">
            <img
              src="https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=1000&q=80"
              alt="Performance de ponta"
              className="chapter-img"
            />
          </div>
        </div>
      </section>

      {/* ── CHAPTER 2: DISPLAY & AUDIO ── */}
      <section className="section-story-chapter chapter-display">
        <div className="chapter-inner reversed">
          <div className="chapter-text-block">
            <span className="chapter-eyebrow">Tela, Câmera e Áudio</span>
            <h3 className="chapter-headline gradient-text">
              <span>Um banquete para os sentidos.</span>
            </h3>
            <p className="chapter-body">
              Fotos e vídeos ganham vida com alto contraste e nitidez estonteante. A câmera FaceTime HD 1080p garante sua melhor imagem em reuniões, enquanto os alto-falantes estéreo com Áudio Espacial criam um palco sonoro 3D envolvente.
            </p>
          </div>
          <div className="chapter-media-block">
            <img
              src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&q=80"
              alt="Tela Liquid Retina e Áudio Espacial"
              className="chapter-img"
            />
          </div>
        </div>
      </section>

      {/* ── CHAPTER 3: MAC + IPHONE CONTINUITY ── */}
      <section className="section-continuity-tabs">
        <div className="continuity-header">
          <span className="chapter-eyebrow">Mac + iPhone</span>
          <h2>Ainda melhores juntos.</h2>
          <p>O Mac e o iPhone foram feitos um para o outro. Use os dois juntos para desbloquear recursos surpreendentes.</p>
        </div>

        {/* Tab Buttons */}
        <div className="continuity-pill-tabs">
          {continuityFeatures.map((feat, idx) => (
            <button
              key={idx}
              className={`pill-tab ${activeFeatureTab === idx ? 'active' : ''}`}
              onClick={() => setActiveFeatureTab(idx)}
            >
              {feat.title}
            </button>
          ))}
        </div>

        {/* Tab Content Box */}
        <div className="continuity-tab-content-card">
          <h3>{continuityFeatures[activeFeatureTab].heading}</h3>
          <p>{continuityFeatures[activeFeatureTab].desc}</p>
          <div className="continuity-tab-img-frame">
            <img
              src="https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=1000&q=80"
              alt={continuityFeatures[activeFeatureTab].title}
            />
          </div>
        </div>
      </section>

      {/* ── WHY BUY FROM TEKNIX (INCENTIVE CARDS) ── */}
      <section className="section-incentive-cards">
        <div className="incentive-header">
          <h2>Por que a TEKNIX é o melhor lugar para comprar seu Mac.</h2>
        </div>

        <div className="incentive-grid">
          <div className="incentive-tile">
            <span className="incentive-label">Formas de Pagamento</span>
            <h3>Pague em até 12x sem juros ou ganhe 5% OFF no Pix.</h3>
            <p>Flexibilidade e economia direta na finalização da sua compra.</p>
          </div>

          <div className="incentive-tile">
            <span className="incentive-label">Troca TEKNIX Trade In</span>
            <h3>Troque seu aparelho usado por desconto no novo.</h3>
            <p>Envie seu equipamento antigo e receba crédito instantâneo para abater no valor.</p>
          </div>

          <div className="incentive-tile">
            <span className="incentive-label">Envio Rápido & Seguro</span>
            <h3>Entrega garantida com código de rastreio em tempo real.</h3>
            <p>Frete grátis em compras selecionadas e opções de entrega expressa.</p>
          </div>

          <div className="incentive-tile">
            <span className="incentive-label">Atendimento com Especialistas</span>
            <h3>Tire dúvidas ao vivo com a nossa equipe oficial.</h3>
            <p>Especialistas prontos para te ajudar a escolher a melhor configuração.</p>
          </div>
        </div>
      </section>

      {/* ── BOTTOM BUY BANNER ── */}
      <section className="section-bottom-buy-banner">
        <div className="bottom-buy-inner">
          <h2>Pronto para dar o próximo passo?</h2>
          <p>Garanta seu {product.name} hoje mesmo com frete grátis e garantia oficial.</p>
          <button className="button button-primary button-large" onClick={handleBuy}>
            Comprar {product.name} — {formatPrice(currentPrice)}
          </button>
        </div>
      </section>
    </div>
  )
}
