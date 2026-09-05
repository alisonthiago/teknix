import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Shared player for image carousels and authored slides. All settings come from saved widget content. */
export default function WidgetCarousel({ content, style, slides = false }: { content: Record<string, any>; style?: CSSProperties; slides?: boolean }) {
  const track = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [interacted, setInteracted] = useState(false)
  const items: any[] = slides ? (Array.isArray(content.slides) ? content.slides : [content]) : (Array.isArray(content.images) ? content.images : Array.isArray(content.carousel_items) ? content.carousel_items : [])
  const visible = Math.max(1, Number(content.slides_to_show || (slides ? 1 : content.columns || 3)))
  const step = Math.max(1, Number(content.slides_to_scroll || 1))
  const last = Math.max(0, items.length - visible)
  const gap = Number(content.gap ?? 16)
  const infinite = content.infinite !== false
  const duration = Math.max(0, Number(content.transition_duration ?? 500))
  const move = (next: number) => setActive(infinite ? next > last ? 0 : next < 0 ? last : next : Math.max(0, Math.min(last, next)))
  useEffect(() => { setActive(current => Math.min(current, last)) }, [last])
  useEffect(() => {
    if (!content.autoplay || last === 0 || (hovered && content.pause_on_hover !== false) || (interacted && content.pause_on_interaction !== false)) return
    const timer = window.setInterval(() => setActive(current => {
      const next = current + (content.direction === 'right' ? -step : step)
      return infinite ? next > last ? 0 : next < 0 ? last : next : Math.max(0, Math.min(last, next))
    }), Math.max(250, Number(content.autoplay_speed || 5000)))
    return () => window.clearInterval(timer)
  }, [content.autoplay, content.autoplay_speed, content.pause_on_hover, content.pause_on_interaction, content.direction, hovered, interacted, step, last, infinite])
  const navigation = content.navigation || 'both'
  const arrows = navigation === 'both' || navigation === 'arrows'
  const dots = navigation === 'both' || navigation === 'dots'
  const click = (next: number) => { setInteracted(true); move(next) }
  return <section aria-roledescription="carrossel" aria-label={content.name || 'Carrossel'} style={{ position: 'relative', ...style }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
    <div style={{ overflow: 'hidden' }}><div ref={track} style={{ display: 'flex', gap, transform: `translateX(calc(-${active * 100 / visible}% - ${active * gap / visible}px))`, transition: `transform ${duration}ms ease` }}>
      {items.map((item, index) => {
        const data = typeof item === 'string' ? { image: item } : item
        const image = data.image || data.url || data.bg_image
        return <article key={index} aria-roledescription="slide" aria-label={`${index + 1} de ${items.length}`} aria-hidden={index < active || index >= active + visible} style={{ flex: `0 0 calc((100% - ${(visible - 1) * gap}px) / ${visible})`, minWidth: 0, position: 'relative', overflow: 'hidden', borderRadius: Number(content.border_radius || 0), ...(slides ? { minHeight: Number(content.height || 400), display: 'grid', placeItems: 'center', background: image ? `url("${image}") center / cover` : data.bg_color || '#f5f5f7' } : {}) }}>
          {!slides && image && <img src={image} alt={data.alt || ''} loading="lazy" style={{ width: '100%', height: Number(content.image_height || 220), objectFit: content.stretch ? 'fill' : 'cover', display: 'block' }} />}
          {(slides || data.title) && <div style={{ padding: 24, textAlign: content.text_align || 'center', width: slides ? `${content.content_width || 66}%` : undefined, color: data.color || content.color }}>
            <h3 style={{ margin: '0 0 12px' }}>{data.title || ''}</h3>{(data.description || data.subtitle) && <p>{data.description || data.subtitle}</p>}
            {data.button_text && <a href={data.button_link || '#'} tabIndex={index < active || index >= active + visible ? -1 : 0}>{data.button_text}</a>}
          </div>}
        </article>
      })}
    </div></div>
    {arrows && items.length > visible && <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}><button type="button" aria-label="Slide anterior" disabled={!infinite && active === 0} onClick={() => click(active - step)}><ChevronLeft size={20} /></button><button type="button" aria-label="Próximo slide" disabled={!infinite && active === last} onClick={() => click(active + step)}><ChevronRight size={20} /></button></div>}
    {dots && last > 0 && <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>{Array.from({ length: last + 1 }, (_, index) => <button key={index} type="button" aria-label={`Ir para slide ${index + 1}`} aria-current={active === index ? 'true' : undefined} onClick={() => click(index)} style={{ width: 8, height: 8, padding: 0, border: 0, borderRadius: '50%', background: active === index ? '#30343b' : '#c7cbd1' }} />)}</div>}
  </section>
}
