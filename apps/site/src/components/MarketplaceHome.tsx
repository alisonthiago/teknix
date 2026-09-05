/* ==========================================================================
   TEKNIX SITE — MARKETPLACE HOME (ESTRUTURA DE 16 SEÇÕES COM DESIGN TEKNIX)
   ========================================================================== */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getProducts } from '../services/products'
import ProductLineupGallery from './ProductLineupGallery'
import type { Product } from '../types/database'
import './MarketplaceHome.css'

export default function MarketplaceHome() {
  const [, setProducts] = useState<Product[]>([])
  const [heroIndex, setHeroIndex] = useState(0)
  const [isHeroAutoPlay, setIsHeroAutoPlay] = useState(true)
  const [videoMuted, setVideoMuted] = useState(true)

  useEffect(() => {
    getProducts({ limit: 20, sort: 'relevance' }).then(prods => {
      if (prods && prods.length > 0) setProducts(prods)
    })
  }, [])

  // ── SEÇÃO 2: HERO CAROUSEL BANNERS ──
  const heroBanners = [
    {
      id: 'banner-1',
      eyebrow: 'Linha Industrial TEKNIX',
      title: 'Alta Potência. Máxima Durabilidade.',
      desc: 'As ferramentas elétricas e a bateria mais confiáveis para os desafios mais pesados.',
      tag: 'Até 12x sem juros ou 5% OFF no Pix',
      btnText: 'Explorar Linha',
      btnLink: '/ferramentas',
      bgGradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
      img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1200&auto=format&fit=crop&q=80',
      badge: 'Lançamento Oficial'
    },
    {
      id: 'banner-2',
      eyebrow: 'Série Sem Fio 21V Brushless',
      title: 'Liberdade Total sem Cabos.',
      desc: 'Motores brushless de última geração com 50% mais autonomia e torque inteligente.',
      tag: 'Frete Grátis para todo o Brasil',
      btnText: 'Ver Kits 21V',
      btnLink: '/ferramentas',
      bgGradient: 'linear-gradient(135deg, #111827 0%, #1f2937 50%, #374151 100%)',
      img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
      badge: 'Destaque da Semana'
    },
    {
      id: 'banner-3',
      eyebrow: 'Kits & Maletas Profissionais',
      title: 'Tudo o que Você Precisa em um Só Lugar.',
      desc: 'Maletas completas com até 111 peças em aço cromo-vanádio forjado.',
      tag: 'Economize até 30% em conjuntos completos',
      btnText: 'Comprar Agora',
      btnLink: '/ferramentas',
      bgGradient: 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0284c7 100%)',
      img: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=1200&auto=format&fit=crop&q=80',
      badge: 'Oferta Especial'
    }
  ]

  // Autoplay Hero Carousel
  useEffect(() => {
    if (!isHeroAutoPlay) return
    const timer = setInterval(() => {
      setHeroIndex(prev => (prev + 1) % heroBanners.length)
    }, 5500)
    return () => clearInterval(timer)
  }, [isHeroAutoPlay, heroBanners.length])

  // ── SEÇÃO 6: CATEGORIAS ──
  const categoryShortcuts = [
    { name: 'Ferramentas', icon: '⚡', path: '/ferramentas', count: '120+ itens' },
    { name: 'Kits & Maletas', icon: '🧰', path: '/ferramentas', count: '45+ kits' },
    { name: 'Parafusadeiras', icon: '🔩', path: '/ferramentas', count: '28 modelos' },
    { name: 'Esmerilhadeiras', icon: '⚙️', path: '/ferramentas', count: '15 modelos' },
    { name: 'Serras & Discos', icon: '🪚', path: '/ferramentas', count: '32 itens' },
    { name: 'Acessórios & Bits', icon: '🔧', path: '/ferramentas', count: '80+ peças' },
    { name: 'Medição & Níveis', icon: '📐', path: '/ferramentas', count: '18 itens' },
    { name: 'Segurança & EPI', icon: '🥽', path: '/ferramentas', count: '24 itens' }
  ]

  // ── SEÇÃO 8: TRIO DE BANNERS PROMOCIONAIS ──
  const promoTrio = [
    {
      id: 'trio-1',
      title: 'Oficina Completa',
      subtitle: 'Monte seu setup profissional com até 20% OFF',
      tag: 'Kits Exclusivos',
      link: '/ferramentas',
      bg: 'linear-gradient(135deg, #1e1e24 0%, #2b2b36 100%)',
      img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'trio-2',
      title: 'Linha 21V Max',
      subtitle: 'Duas baterias inclusas em todos os modelos da linha',
      tag: 'Bateria Dupla',
      link: '/ferramentas',
      bg: 'linear-gradient(135deg, #093a3e 0%, #0d5c63 100%)',
      img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'trio-3',
      title: 'Brocas & Soquetes',
      subtitle: 'Aço cromo vanádio de alta resistência ao impacto',
      tag: 'Pronta Entrega',
      link: '/ferramentas',
      bg: 'linear-gradient(135deg, #2c1a4d 0%, #442277 100%)',
      img: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80'
    }
  ]

  // ── SEÇÃO 10: VÍDEOS & REELS ──
  const reelsContent = [
    {
      id: 'reel-1',
      title: 'Teste de Torque 21V em Viga de Concreto',
      duration: '0:45',
      thumb: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
      productName: 'Chave de Impacto 21V Brushless',
      price: 'R$ 383,04',
      link: '/ferramentas/76ceefe0-e901-4355-ad3f-d81e81678956'
    },
    {
      id: 'reel-2',
      title: 'Unboxing da Maleta 111 Peças TEKNIX',
      duration: '1:12',
      thumb: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80',
      productName: 'Kit Maleta 111 Peças',
      price: 'R$ 153,50',
      link: '/ferramentas/ce02a36a-272c-480f-81a3-69e6648ab857'
    },
    {
      id: 'reel-3',
      title: 'Corte sem Rebarbas em Porcelanato 1400W',
      duration: '0:58',
      thumb: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&auto=format&fit=crop&q=80',
      productName: 'Serra Mármore 1400W',
      price: 'R$ 449,00',
      link: '/ferramentas/demo-3'
    },
    {
      id: 'reel-4',
      title: 'Montagem de Móveis em Alta Velocidade',
      duration: '0:35',
      thumb: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
      productName: 'Parafusadeira Compact 12V',
      price: 'R$ 299,90',
      link: '/ferramentas/demo-1'
    }
  ]

  // ── SEÇÃO 14: SERVIÇOS & BENEFÍCIOS ──
  const storeBenefits = [
    {
      icon: '🛡️',
      title: 'Garantia Oficial TEKNIX',
      desc: '12 meses de garantia total com assistência técnica nacional e reposição de peças rápida.'
    },
    {
      icon: '⚡',
      title: 'Envio Rápido & Seguro',
      desc: 'Rastreamento em tempo real e entrega rápida para todas as regiões do Brasil.'
    },
    {
      icon: '💳',
      title: 'Até 12x Sem Juros',
      desc: 'Parcele todas as suas ferramentas no cartão de crédito ou garanta 5% OFF no Pix.'
    },
    {
      icon: '👷',
      title: 'Suporte Técnico com Especialistas',
      desc: 'Tire dúvidas ao vivo com nossos técnicos e saiba exatamente a melhor máquina para sua obra.'
    },
    {
      icon: '🔄',
      title: 'Troca Fácil em 30 Dias',
      desc: 'Satisfação garantida ou seu dinheiro de volta sem burocracia.'
    },
    {
      icon: '🏢',
      title: 'Faturamento PJ para Empresas',
      desc: 'Condições especiais com boleto faturado para construtoras, indústrias e marcenarias.'
    }
  ]

  // ── SEÇÃO 15: BLOG & CONTEÚDO EDITORIAL ──
  const blogPosts = [
    {
      id: 'post-1',
      category: 'GUIA PRÁTICO',
      title: 'Como escolher a Parafusadeira ideal para sua oficina ou reforma',
      snippet: 'Entenda a diferença entre voltagem, torque e motor com ou sem escovas (Brushless) para fazer o melhor investimento.',
      readTime: '4 min de leitura',
      img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=600&auto=format&fit=crop&q=80',
      link: '/ferramentas'
    },
    {
      id: 'post-2',
      category: 'MANUTENÇÃO',
      title: 'Dicas para aumentar a vida útil das suas baterias de Íon-Lítio',
      snippet: 'Cuidados essenciais de carregamento, armazenamento e temperatura que dobram a autonomia do seu equipamento.',
      readTime: '3 min de leitura',
      img: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
      link: '/ferramentas'
    },
    {
      id: 'post-3',
      category: 'SEGURANÇA',
      title: 'EPIs indispensáveis na operação de serras e esmerilhadeiras',
      snippet: 'Proteção ocular, auditiva e respiratória: saiba como trabalhar com máxima segurança em qualquer ambiente.',
      readTime: '5 min de leitura',
      img: 'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=600&auto=format&fit=crop&q=80',
      link: '/ferramentas'
    },
    {
      id: 'post-4',
      category: 'INOVAÇÃO',
      title: 'O que é a tecnologia Brushless e por que ela revolucionou as ferramentas',
      snippet: 'Descubra como os motores eletrônicos entregam mais potência sem superaquecimento e com menor consumo.',
      readTime: '4 min de leitura',
      img: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop&q=80',
      link: '/ferramentas'
    }
  ]

  return (
    <div className="marketplace-home-root">
      {/* ── SEÇÃO 2: BANNER PRINCIPAL / HERO CAROUSEL ── */}
      <section className="mkt-section-hero">
        <div className="mkt-container">
          <div
            className="mkt-hero-carousel-card"
            style={{ background: heroBanners[heroIndex].bgGradient }}
            onMouseEnter={() => setIsHeroAutoPlay(false)}
            onMouseLeave={() => setIsHeroAutoPlay(true)}
          >
            <div className="mkt-hero-content-col">
              <div className="mkt-hero-badge-pill">{heroBanners[heroIndex].badge}</div>
              <span className="mkt-hero-eyebrow">{heroBanners[heroIndex].eyebrow}</span>
              <h1 className="mkt-hero-headline">{heroBanners[heroIndex].title}</h1>
              <p className="mkt-hero-desc">{heroBanners[heroIndex].desc}</p>
              <div className="mkt-hero-tag-box">
                <span className="mkt-hero-tag-icon">⚡</span>
                <span className="mkt-hero-tag-text">{heroBanners[heroIndex].tag}</span>
              </div>
              <div className="mkt-hero-actions">
                <Link to={heroBanners[heroIndex].btnLink} className="mkt-btn-primary">
                  {heroBanners[heroIndex].btnText}
                </Link>
                <Link to="/ferramentas" className="mkt-btn-secondary">
                  Comparar Modelos ›
                </Link>
              </div>
            </div>

            <div className="mkt-hero-media-col">
              <img
                src={heroBanners[heroIndex].img}
                alt={heroBanners[heroIndex].title}
                className="mkt-hero-product-img"
              />
            </div>

            {/* Setas de navegação do Hero */}
            <button
              className="mkt-hero-nav-arrow mkt-hero-arrow-prev"
              onClick={() => setHeroIndex(prev => (prev - 1 + heroBanners.length) % heroBanners.length)}
              aria-label="Banner anterior"
            >
              ‹
            </button>
            <button
              className="mkt-hero-nav-arrow mkt-hero-arrow-next"
              onClick={() => setHeroIndex(prev => (prev + 1) % heroBanners.length)}
              aria-label="Próximo banner"
            >
              ›
            </button>

            {/* Dots Indicadores */}
            <div className="mkt-hero-dots-container">
              {heroBanners.map((_, idx) => (
                <button
                  key={idx}
                  className={`mkt-hero-dot ${idx === heroIndex ? 'active' : ''}`}
                  onClick={() => setHeroIndex(idx)}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 3: BANNER SECUNDÁRIO / FULL BANNER DESTAQUE ── */}
      <section className="mkt-section-secondary-banner">
        <div className="mkt-container">
          <div className="mkt-full-banner-card">
            <div className="mkt-full-banner-content">
              <span className="mkt-full-banner-tag">TEKNIX PRO ADVANTAGE</span>
              <h2>Potência Industrial em Cada Detalhe</h2>
              <p>Equipamentos desenvolvidos para resistir às mais rigorosas condições de trabalho contínuo.</p>
              <Link to="/ferramentas" className="mkt-full-banner-cta">
                Conheça a Linha Pro ›
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 4: CARDS DE DESTAQUE ("PODE TE INTERESSAR") ── */}
      <section className="mkt-section-showcase">
        <ProductLineupGallery
          content={{
            headline: 'Pode te interessar.',
            compare_text: 'Ver todo o catálogo',
            compare_link: '/ferramentas',
            data_source: 'dynamic',
            limit: 8,
            sort: 'relevance'
          }}
        />
      </section>

      {/* ── SEÇÃO 5: OUTRA VITRINE ("VOCÊ TAMBÉM PODE GOSTAR") ── */}
      <section className="mkt-section-showcase-alt">
        <ProductLineupGallery
          content={{
            headline: 'Você também pode gostar.',
            compare_text: 'Ver mais opções',
            compare_link: '/ferramentas',
            data_source: 'dynamic',
            limit: 8,
            sort: 'newest'
          }}
        />
      </section>

      {/* ── SEÇÃO 6: GRADE HORIZONTAL DE CATEGORIAS ── */}
      <section className="mkt-section-categories">
        <div className="mkt-container">
          <div className="mkt-section-header">
            <h2>Navegue por Categoria</h2>
            <Link to="/ferramentas" className="mkt-header-link">Ver todas ›</Link>
          </div>

          <div className="mkt-categories-horizontal-scroller">
            {categoryShortcuts.map((cat, idx) => (
              <Link to={cat.path} key={idx} className="mkt-category-pill-card">
                <div className="mkt-category-icon-circle">{cat.icon}</div>
                <span className="mkt-category-name">{cat.name}</span>
                <span className="mkt-category-count">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 7: VITRINE DE OFERTAS ("OFERTAS QUE VOCÊ VAI AMAR") ── */}
      <section className="mkt-section-showcase">
        <ProductLineupGallery
          content={{
            headline: 'Ofertas que você vai amar.',
            compare_text: 'Ofertas do mês',
            compare_link: '/ferramentas',
            data_source: 'dynamic',
            limit: 8,
            sort: 'price_asc'
          }}
        />
      </section>

      {/* ── SEÇÃO 8: TRIO DE BANNERS PROMOCIONAIS LADO A LADO ── */}
      <section className="mkt-section-trio-banners">
        <div className="mkt-container">
          <div className="mkt-trio-grid">
            {promoTrio.map(item => (
              <Link
                to={item.link}
                key={item.id}
                className="mkt-trio-card"
                style={{ background: item.bg }}
              >
                <div className="mkt-trio-card-content">
                  <span className="mkt-trio-tag">{item.tag}</span>
                  <h3>{item.title}</h3>
                  <p>{item.subtitle}</p>
                  <span className="mkt-trio-link">Aproveitar ›</span>
                </div>
                <div className="mkt-trio-img-wrapper">
                  <img src={item.img} alt={item.title} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 9: INSPIRADO NO ÚLTIMO VISTO ── */}
      <section className="mkt-section-showcase-alt">
        <ProductLineupGallery
          content={{
            headline: 'Inspirado no que você viu.',
            compare_text: 'Ver histórico',
            compare_link: '/ferramentas',
            data_source: 'dynamic',
            limit: 8,
            sort: 'relevance'
          }}
        />
      </section>

      {/* ── SEÇÃO 10: VÍDEOS & DEMONSTRAÇÕES ("ASSISTA AOS VÍDEOS MAIS VISTOS") ── */}
      <section className="mkt-section-reels">
        <div className="mkt-container">
          <div className="mkt-section-header">
            <div>
              <h2>Assista aos vídeos mais vistos</h2>
              <p className="mkt-header-subtitle">Veja as máquinas em ação na prática antes de escolher</p>
            </div>
            <button
              className="mkt-sound-toggle-btn"
              onClick={() => setVideoMuted(!videoMuted)}
            >
              {videoMuted ? '🔇 Áudio Desativado' : '🔊 Áudio Ativado'}
            </button>
          </div>

          <div className="mkt-reels-scroller">
            {reelsContent.map(reel => (
              <div key={reel.id} className="mkt-reel-card">
                <div className="mkt-reel-media-wrapper">
                  <img src={reel.thumb} alt={reel.title} className="mkt-reel-thumb" />
                  <div className="mkt-reel-overlay-scrim" />
                  <div className="mkt-reel-play-icon">▶</div>
                  <span className="mkt-reel-duration">{reel.duration}</span>
                  <p className="mkt-reel-video-title">{reel.title}</p>
                </div>

                <div className="mkt-reel-product-footer">
                  <div className="mkt-reel-product-info">
                    <span className="mkt-reel-product-name">{reel.productName}</span>
                    <span className="mkt-reel-product-price">{reel.price}</span>
                  </div>
                  <Link to={reel.link} className="mkt-reel-buy-btn">
                    Ver Máquina
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 11: VITRINE POR CATEGORIA ("LINHA PROFISSIONAL") ── */}
      <section className="mkt-section-showcase">
        <ProductLineupGallery
          content={{
            headline: 'Para sua Oficina & Obra.',
            compare_text: 'Ver linha completa',
            compare_link: '/ferramentas',
            data_source: 'dynamic',
            limit: 8,
            sort: 'newest'
          }}
        />
      </section>

      {/* ── SEÇÃO 12: MAIS PRODUTOS / RECOMENDAÇÕES ("TEM TUDO A VER COM VOCÊ") ── */}
      <section className="mkt-section-showcase-alt">
        <ProductLineupGallery
          content={{
            headline: 'Têm tudo a ver com você.',
            compare_text: 'Explorar todos',
            compare_link: '/ferramentas',
            data_source: 'dynamic',
            limit: 8,
            sort: 'price_desc'
          }}
        />
      </section>

      {/* ── SEÇÃO 13: BANNER EMPRESARIAL / INSTITUCIONAL B2B ── */}
      <section className="mkt-section-corporate-banner">
        <div className="mkt-container">
          <div className="mkt-corporate-card">
            <div className="mkt-corporate-content">
              <span className="mkt-corporate-badge">TEKNIX EMPRESAS</span>
              <h2>Soluções para Construtoras, Indústrias e Revendas</h2>
              <p>Faturamento direto via boleto bancário, desconto progressivo para compras em lote e atendimento corporativo dedicado.</p>
              <div className="mkt-corporate-actions">
                <Link to="/contato" className="mkt-btn-primary">
                  Falar com Consultor B2B
                </Link>
                <a href="tel:08007733838" className="mkt-corporate-phone">
                  📞 0800 773 3838
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 14: SERVIÇOS & BENEFÍCIOS ── */}
      <section className="mkt-section-benefits">
        <div className="mkt-container">
          <div className="mkt-section-header text-center">
            <h2>Por que escolher a TEKNIX</h2>
            <p className="mkt-header-subtitle">Diferenciais pensados para a melhor experiência de compra do início ao pós-venda</p>
          </div>

          <div className="mkt-benefits-grid">
            {storeBenefits.map((benefit, idx) => (
              <div key={idx} className="mkt-benefit-tile">
                <span className="mkt-benefit-icon">{benefit.icon}</span>
                <h3>{benefit.title}</h3>
                <p>{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 15: BLOG & CONTEÚDO EDITORIAL ("TEKNIX EXPLICA") ── */}
      <section className="mkt-section-blog">
        <div className="mkt-container">
          <div className="mkt-section-header">
            <div>
              <h2>TEKNIX Explica</h2>
              <p className="mkt-header-subtitle">Dicas, tutoriais e comparativos para você extrair o máximo das suas ferramentas</p>
            </div>
            <Link to="/ferramentas" className="mkt-header-link">Ver todos os artigos ›</Link>
          </div>

          <div className="mkt-blog-grid">
            {blogPosts.map(post => (
              <Link to={post.link} key={post.id} className="mkt-blog-card">
                <div className="mkt-blog-img-frame">
                  <img src={post.img} alt={post.title} />
                  <span className="mkt-blog-category-badge">{post.category}</span>
                </div>
                <div className="mkt-blog-card-body">
                  <span className="mkt-blog-read-time">{post.readTime}</span>
                  <h3>{post.title}</h3>
                  <p>{post.snippet}</p>
                  <span className="mkt-blog-read-more">Ler artigo completo ›</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
