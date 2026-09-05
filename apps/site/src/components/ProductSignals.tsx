import { useEffect, useState } from 'react'
import './ProductSignals.css'
import { remainingOfferTime, type ProductSignalsData } from '../services/productPresentation'

export function OfferCountdown({
  seconds,
  label = 'Oferta termina em',
  badgeTitle = 'OFERTA RELÂMPAGO',
  badgeBg,
  badgeColor,
  boxBg,
  boxColor
}: {
  seconds: number
  label?: string
  badgeTitle?: string
  badgeBg?: string
  badgeColor?: string
  boxBg?: string
  boxColor?: string
}) {
  const parts = [
    Math.floor(seconds / 3600),
    Math.floor(seconds / 60) % 60,
    seconds % 60
  ].map(n => String(Math.max(0, n)).padStart(2, '0'))

  return (
    <span className="offer-countdown" role="timer" aria-label={`${label}: ${parts.join(':')}`}>
      <span
        className="offer-countdown-title"
        style={{
          ...(badgeBg ? { background: badgeBg } : {}),
          ...(badgeColor ? { color: badgeColor } : {})
        }}
      >
        {badgeTitle}
      </span>
      <div className="offer-countdown-boxes">
        <span className="offer-countdown-box" style={{ ...(boxBg ? { background: boxBg } : {}), ...(boxColor ? { color: boxColor } : {}) }}>{parts[0]}</span>
        <b className="offer-countdown-sep">:</b>
        <span className="offer-countdown-box" style={{ ...(boxBg ? { background: boxBg } : {}), ...(boxColor ? { color: boxColor } : {}) }}>{parts[1]}</span>
        <b className="offer-countdown-sep">:</b>
        <span className="offer-countdown-box" style={{ ...(boxBg ? { background: boxBg } : {}), ...(boxColor ? { color: boxColor } : {}) }}>{parts[2]}</span>
      </div>
    </span>
  )
}

export default function ProductSignals({ data, overlay = false }: { data?: ProductSignalsData; overlay?: boolean }) {
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    if (!data?.offerEndsAt) return
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [data?.offerEndsAt])

  if (!data) return null
  const seconds = remainingOfferTime(data.offerEndsAt, now)

  // Prioridade absoluta: Máximo de 1 selo por card!
  // 1. Oferta Relâmpago (prioridade máxima para conversão)
  // 2. Mais Vendido
  // 3. Oferta Imperdível
  // 4. Oferta do Dia
  // 5. Última Unidade
  let singleBadge = null
  if (seconds > 0) {
    singleBadge = <OfferCountdown seconds={seconds} label="Oferta termina em" />
  } else if (data.bestSeller || data.badge === 'bestseller') {
    singleBadge = <span className="product-signal bestseller">MAIS VENDIDO</span>
  } else if (data.badge === 'special') {
    singleBadge = (
      <span className="product-signal special">
        <svg className="product-signal-icon" viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
          <path d="M12 2l2.4 2.4 3.4-.6 1.4 3.1 3.2 1.3-.4 3.4 2.4 2.4-2.4 2.4.4 3.4-3.2 1.3-1.4 3.1-3.4-.6L12 22l-2.4-2.4-3.4.6-1.4-3.1-3.2-1.3.4-3.4-2.4-2.4 2.4-2.4-.4-3.4 3.2-1.3 1.4-3.1 3.4.6L12 2zm-1.5 6a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm3 5a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm-4.3 2.7l5.6-5.6-.7-.7-5.6 5.6.7.7z" />
        </svg>
        OFERTA IMPERDÍVEL
      </span>
    )
  } else if (data.badge === 'daily' || (data.demo && !data.badge && !overlay)) {
    singleBadge = <span className="product-signal offer">OFERTA DO DIA</span>
  } else if (data.stock === 1) {
    singleBadge = <span className="product-signal last-unit">ÚLTIMA UNIDADE</span>
  }

  if (!singleBadge && !data.demo) return null

  return (
    <div className={`product-signals ${overlay ? 'image-signals' : ''}`} aria-label={data.demo ? 'Selos ilustrativos' : 'Destaques do produto'}>
      {data.demo && !overlay && !singleBadge && <small className="product-signals-demo">Exemplos de selos</small>}
      {singleBadge}
    </div>
  )
}
