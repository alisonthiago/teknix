import { useEffect, useState, type CSSProperties, type ElementType } from 'react'

export default function AnimatedHeadline({ content, style }: { content: Record<string, any>; style?: CSSProperties }) {
  const [index, setIndex] = useState(0)
  const words = String(content.highlighted_text || content.animated_word || content.text || '').split(/\n|\|/).filter(Boolean)
  const rotating = content.headline_style === 'rotate'
  const duration = Math.max(0, Number(content.duration ?? 1200))
  const delay = Math.max(100, Number(content.delay ?? 8000))
  useEffect(() => {
    setIndex(0)
    if (!rotating || words.length < 2) return
    const timer = window.setInterval(() => setIndex(current => content.infinite_loop === false ? Math.min(current + 1, words.length - 1) : (current + 1) % words.length), delay + duration)
    return () => window.clearInterval(timer)
  }, [rotating, words.join('|'), content.infinite_loop, delay, duration])
  const Tag = (['h1','h2','h3','h4','h5','h6','div','p','span'].includes(content.html_tag) ? content.html_tag : 'h3') as ElementType
  const paths: Record<string, string> = { circle: 'M25 75 C25 5 475 5 475 75 C475 145 25 145 25 75', underline: 'M5 140 Q250 120 495 140', double: 'M5 125 L495 125 M5 145 L495 145', curly: 'M5 140 Q125 100 250 140 T495 140' }
  return <Tag style={{ margin: 0, fontSize: '2.5rem', fontWeight: 800, textAlign: content.align || 'center', ...style }}>
    {content.before_text && <span>{content.before_text} </span>}
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <span className="elementor-headline-dynamic-text" key={index} style={{ position: 'relative', zIndex: 1, color: content.highlight_color, animation: rotating ? `teknix-headline-in ${duration}ms ease both` : undefined }}>{words[index] || ''}</span>
      {!rotating && <svg className="teknix-headline-shape" viewBox="0 0 500 150" preserveAspectRatio="none" aria-hidden style={{ position: 'absolute', inset: '-10% -5%', width: '110%', height: '120%', fill: 'none', stroke: content.stroke_color || content.shape_color || '#0071e3', strokeWidth: Number(content.shape_width || 8), strokeLinecap: content.rounded_edges === false ? 'butt' : 'round', pointerEvents: 'none', zIndex: content.bring_to_front ? 2 : 0 }}><path d={paths[content.shape] || paths.circle} pathLength="1" style={{ strokeDasharray: 1, animation: `teknix-headline-draw ${duration + delay}ms ease ${content.infinite_loop === false ? '1' : 'infinite'}` }} /></svg>}
    </span>
    {content.after_text && <span> {content.after_text}</span>}
  </Tag>
}
