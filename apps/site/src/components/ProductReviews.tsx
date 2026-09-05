import { useState } from 'react'
import './ProductSignals.css'
import { reviewSummary, type ProductReview } from '../services/productPresentation'

export function RatingSummary({ reviews, demo = false }: { reviews: ProductReview[]; demo?: boolean }) {
  const {count, average} = reviewSummary(reviews)
  return <a className="rating-summary" href="#reviews"><span aria-hidden="true">★</span> {count ? average.toFixed(1).replace('.', ',') : 'Sem avaliações'} {count > 0 && `(${count} avaliações${demo ? ' ilustrativas' : ''})`}</a>
}

export default function ProductReviews({ reviews = [], demo = false }: { reviews?: ProductReview[]; demo?: boolean }) {
  const [sort, setSort] = useState('recent')
  const {reviews: valid, count, average} = reviewSummary(reviews)
  const ordered = [...valid].sort((a, b) => sort === 'rating' ? b.rating - a.rating : b.date.localeCompare(a.date))
  return <section className="product-reviews ui container" id="reviews">
    <h2>Avaliações de clientes</h2>
    {demo && <p className="reviews-demo-note">Demonstração visual — notas e comentários fictícios, sem compras reais.</p>}
    {!count ? <p>Este produto ainda não recebeu avaliações.</p> : <div className="reviews-layout">
      <div className="reviews-overview">
        <strong className="reviews-average">{average.toFixed(1).replace('.', ',')} <span aria-hidden="true">★</span></strong>
        <p>{count} avaliações{demo ? ' ilustrativas' : ''}</p>
        {[5,4,3,2,1].map(stars => { const percent = Math.round(valid.filter(r=>r.rating===stars).length / count * 100); return <div className="review-distribution" key={stars}><span>{stars} ★</span><progress max="100" value={percent} aria-label={`${stars} estrelas: ${percent}%`} /><span>{percent}%</span></div> })}
        <div className="review-recommendation"><strong>{Math.round(valid.filter(r=>r.recommended).length / count * 100)}%</strong><span>recomendam este produto{demo ? ' (exemplo)' : ''}</span></div>
      </div>
      <div className="reviews-comments">
        <label className="reviews-sort">Ordenar por <select value={sort} onChange={e=>setSort(e.target.value)}><option value="recent">Mais recentes</option><option value="rating">Maior nota</option></select></label>
        {ordered.map(review=><article className="review-comment" key={review.id}><strong>{review.author}</strong><div className="review-comment-meta"><span aria-label={`${review.rating} de 5 estrelas`}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span><time dateTime={review.date}>{review.date.split('-').reverse().join('/')}</time></div><p>{review.text}</p></article>)}
      </div>
    </div>}
  </section>
}
