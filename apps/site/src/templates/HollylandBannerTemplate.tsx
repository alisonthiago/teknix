/* ==========================================================================
   TEKNIX TEMPLATE LIBRARY — FULL BANNER SWIPER (ESTILO HOLLYLAND)
   --------------------------------------------------------------------------
   Banner full-width com imagem de fundo + texto sobreposto + auto-slide.
   Inspirado no modelo Hollyland (swiper com título, descrição e botão).
   Uso: <HollylandBannerTemplate slides={[...]} />
   ========================================================================== */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import './HollylandBannerTemplate.css'

export interface HollylandSlide {
  id: number
  title: string
  description: string
  buttonText: string
  buttonLink: string
  image: string
  /** Cor do texto (branco ou preto) */
  textColor?: string
  /** Alinhamento do conteúdo: left | center | right */
  align?: 'left' | 'center' | 'right'
}

interface HollylandBannerTemplateProps {
  slides: HollylandSlide[]
  autoSlideMs?: number
  height?: number
}

export default function HollylandBannerTemplate({
  slides,
  autoSlideMs = 6000,
  height = 600
}: HollylandBannerTemplateProps) {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent(prev => (prev + 1) % slides.length)
    }, autoSlideMs)
    return () => clearInterval(interval)
  }, [slides.length, autoSlideMs])

  const goTo = (idx: number) => setCurrent((idx + slides.length) % slides.length)

  return (
    <div className="hollyland-banner" style={{ '--banner-height': `${height}px` } as React.CSSProperties}>
      <div className="hollyland-banner-track" style={{ transform: `translateX(-${current * 100}%)` }}>
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="hollyland-banner-slide"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className={`hollyland-banner-content align-${slide.align || 'left'}`}>
              <h2 className="hollyland-banner-title" style={{ color: slide.textColor || '#ffffff' }}>
                {slide.title}
              </h2>
              <p className="hollyland-banner-desc" style={{ color: slide.textColor || '#ffffff' }}>
                {slide.description}
              </p>
              <Link to={slide.buttonLink} className="hollyland-banner-btn">
                {slide.buttonText}
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Controles */}
      <div className="hollyland-banner-controls">
        <button
          className="hollyland-banner-arrow"
          onClick={() => goTo(current - 1)}
          aria-label="Slide anterior"
        >‹</button>
        <div className="hollyland-banner-dots">
          {slides.map((_, idx) => (
            <button
              key={idx}
              className={`hollyland-banner-dot ${idx === current ? 'active' : ''}`}
              onClick={() => goTo(idx)}
              aria-label={`Ir para slide ${idx + 1}`}
            />
          ))}
        </div>
        <button
          className="hollyland-banner-arrow"
          onClick={() => goTo(current + 1)}
          aria-label="Próximo slide"
        >›</button>
      </div>
    </div>
  )
}