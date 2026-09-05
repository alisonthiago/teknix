/* ==========================================================================
   TEKNIX TEMPLATE LIBRARY — HERO BANNER (MODELO SALVO)
   --------------------------------------------------------------------------
   Modelo original do banner principal (main-banner) da home.
   Salvo na biblioteca de templates para reutilização.
   Uso: <HeroBannerTemplate slides={[...]} />
   ========================================================================== */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './HeroBannerTemplate.css'

export interface HeroSlide {
  id: number
  title: string
  highlight: string
  tag: string
  img: string
  badge: string
}

interface HeroBannerTemplateProps {
  slides: HeroSlide[]
  autoSlideMs?: number
}

export default function HeroBannerTemplate({
  slides,
  autoSlideMs = 6000
}: HeroBannerTemplateProps) {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length)
    }, autoSlideMs)
    return () => clearInterval(interval)
  }, [slides.length, autoSlideMs])

  const slide = slides[currentSlide]

  return (
    <div className="ui container fluid main-banner">
      <div className="ui container">
        <div className="jet-banner">
          <div className="hero-dark-frame">
            <div className="hero-dark-inner">
              {/* Lado Esquerdo */}
              <div className="hero-left-box">
                <span className="hero-tag-pill">{slide.tag}</span>
                <h2>{slide.title}</h2>
                <Link to="/produtos" className="hero-btn-action">
                  Aproveitar Ofertas ›
                </Link>
              </div>

              {/* Centro: Produto em Destaque */}
              <div className="hero-center-box">
                <img
                  src={slide.img}
                  alt={slide.title}
                  className="hero-image-case"
                />
              </div>

              {/* Lado Direito */}
              <div className="hero-right-box">
                <p>
                  Na TEKNIX, você encontra ferramentas para sua rotina com{' '}
                  <strong>condições que ajudam no seu próximo passo.</strong>
                </p>
                <div className="hero-slide-badge">{slide.badge}</div>
              </div>
            </div>

            {/* Controles do Carrossel */}
            <div className="hero-slider-controls">
              <button
                className="hero-arrow-btn"
                onClick={() => setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length)}
                aria-label="Slide anterior"
              >‹</button>
              <div className="hero-dots">
                {slides.map((_, idx) => (
                  <button
                    key={idx}
                    className={`hero-dot ${idx === currentSlide ? 'active' : ''}`}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Ir para slide ${idx + 1}`}
                  />
                ))}
              </div>
              <button
                className="hero-arrow-btn"
                onClick={() => setCurrentSlide(prev => (prev + 1) % slides.length)}
                aria-label="Próximo slide"
              >›</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}