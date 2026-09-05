import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Header from './Header'
import Footer from './Footer'
import './AppleHome3Page.css'

export default function AppleHome3Page() {
  const [widgets, setWidgets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadWidgets() {
      try {
        // 1. Fetch sections for page 'home3'
        const { data: secData } = await supabase
          .from('page_sections')
          .select('id')
          .in('page_id', ['home3', 'a3c8e4d0-5b6c-48d0-89ab-428015f096c0'])

        if (secData && secData.length > 0) {
          const secIds = secData.map(s => s.id)
          // 2. Fetch containers
          const { data: conData } = await supabase
            .from('page_containers')
            .select('id')
            .in('section_id', secIds)

          if (conData && conData.length > 0) {
            const conIds = conData.map(c => c.id)
            // 3. Fetch widgets
            const { data: widData } = await supabase
              .from('page_widgets')
              .select('*')
              .in('container_id', conIds)

            if (widData) {
              setWidgets(widData)
            }
          }
        }
      } catch (e) {
        console.error('Error loading page tree:', e)
      } finally {
        setLoading(false)
      }
    }
    loadWidgets()
  }, [])

  // Helper helper to resolve widget values with fallbacks
  const getWidgetValue = (id: string, field: string, fallback: any) => {
    const w = widgets.find(item => item.id === id || item.custom_class === id)
    if (!w) return fallback
    if (field === 'content') return w.content || fallback
    return w[field] || fallback
  }

  const getWidgetContent = (id: string, key: string, fallback: any) => {
    const content = getWidgetValue(id, 'content', {})
    return content[key] !== undefined ? content[key] : fallback
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', background: '#000' }}>
        <div style={{
          width: 36,
          height: 36,
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#0071e3',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    )
  }

  const shows = [
    {
      id: 'ted-lasso',
      title: 'Ted Lasso',
      genre: 'Comedy',
      desc: 'The hit comedy is back and Tedder than ever.',
      cta: 'Stream now',
      bg: 'https://is1-ssl.mzstatic.com/image/thumb/eD8DZGJ170t3MyFhlWOkdw/1250x668sr.jpg'
    },
    {
      id: 'lucky',
      title: 'Lucky',
      genre: 'Action',
      desc: 'Anya Taylor-Joy is a grifter running for her life after a heist goes sideways.',
      cta: 'Stream now',
      bg: 'https://is1-ssl.mzstatic.com/image/thumb/3aJOoInTKLjwSg8kv-ifDg/1250x668sr.jpg'
    },
    {
      id: 'f1',
      title: 'Formula 1',
      genre: 'Sports',
      desc: 'Every Grand Prix™, live and on demand—all in one place, all year long.',
      cta: 'F1 on Apple TV',
      bg: 'https://is1-ssl.mzstatic.com/image/thumb/Features/v4/47/76/ea/4776ea5e-5e00-a76b-c8f1-6fda44050f30/3dd9b6d8-a87a-4a15-80bb-0cc06dfa62d4.png/1250x668sr.jpg'
    },
    {
      id: 'silo',
      title: 'Silo',
      genre: 'Sci-Fi',
      desc: 'The truth lies in the past.',
      cta: 'Stream now',
      bg: 'https://is1-ssl.mzstatic.com/image/thumb/hRaOrIKahRFcNlKt6UV4Ow/1250x668sr.jpg'
    },
    {
      id: 'mls',
      title: 'MLS',
      genre: 'Sports',
      desc: 'Watch every club, every match, live—all season long.',
      cta: 'MLS on Apple TV',
      bg: 'https://is1-ssl.mzstatic.com/image/thumb/Features/v4/5d/60/5d/5d605d68-a564-eefc-f0ed-001864cf33e4/5f7a3530-2dd0-44fd-89cd-e42bbe1e797e.png/1250x668sr.jpg'
    }
  ]

  return (
    <div className="apple-home3-root">
      {/* ── HEADER DA LOJA ── */}
      <Header />

      {/* ── 1. ANNOUNCEMENT RIBBON ── */}
      <div className="apple-ribbon-bar">
        <span>{getWidgetContent('wid-home3-ribbon-cta', 'title', 'Estamos doando US$ 10 para a National Park Foundation a cada compra na TEKNIX usando Apple Pay até 28 de agosto.*')}</span>
        <Link to={getWidgetContent('wid-home3-ribbon-cta', 'buttonUrl', '/produtos')}>
          {getWidgetContent('wid-home3-ribbon-cta', 'buttonText', 'Comprar agora >')}
        </Link>
      </div>

      {/* ── 2. HERO 1 (SURPRISE AND SHINE - DARK THEME) ── */}
      <section className="apple-hero-tile theme-dark">
        <h2 className="apple-hero-headline">{getWidgetContent('wid-home3-h1-title', 'text', 'Surprise and shine.')}</h2>
        <p className="apple-hero-subhead">{getWidgetContent('wid-home3-h1-sub', 'html', 'Watch a special Apple Event online on 9/9 at 10 a.m. PT.').replace(/<[^>]*>/g, '')}</p>
        <div className="apple-cta-group">
          <Link to={getWidgetContent('wid-home3-h1-btn', 'url', '/contato')} className="apple-btn-pill white-pill">
            {getWidgetContent('wid-home3-h1-btn', 'text', 'Add to calendar')}
          </Link>
        </div>
        <div className="apple-hero-image-wrap">
          <img
            src={getWidgetContent('wid-home3-h1-img', 'url', 'https://www.apple.com/v/home/images/apple-event-september-2026/a/hero_apple_event_september_2026__fkq1w4m2h2eu_large.jpg')}
            alt={getWidgetContent('wid-home3-h1-img', 'alt', 'Apple Event')}
          />
        </div>
      </section>

      {/* ── 3. HERO 2 (IPHONE LINEUP) ── */}
      <section className="apple-hero-tile theme-light-gray">
        <h2 className="apple-hero-headline">{getWidgetContent('wid-home3-h2-title', 'text', 'iPhone')}</h2>
        <p className="apple-hero-subhead">{getWidgetContent('wid-home3-h2-sub', 'html', 'Meet the latest iPhone lineup.').replace(/<[^>]*>/g, '')}</p>
        <div className="apple-cta-group">
          <Link to={getWidgetContent('wid-home3-h2-btn1', 'url', '/iphone')} className="apple-btn-pill primary">
            {getWidgetContent('wid-home3-h2-btn1', 'text', 'Learn more')}
          </Link>
          <Link to={getWidgetContent('wid-home3-h2-btn2', 'url', '/produtos?cat=iphone')} className="apple-btn-pill secondary">
            {getWidgetContent('wid-home3-h2-btn2', 'text', 'Shop iPhone')}
          </Link>
        </div>
        <div className="apple-hero-image-wrap">
          <img
            src={getWidgetContent('wid-home3-h2-img', 'url', 'https://www.apple.com/v/home/images/iphone-family/a/hero_iphone_family__be5jkzxszb1e_large.jpg')}
            alt={getWidgetContent('wid-home3-h2-img', 'alt', 'iPhone')}
          />
        </div>
      </section>

      {/* ── 4. HERO 3 (COLLEGE, SORTED) ── */}
      <section className="apple-hero-tile theme-white">
        <h2 className="apple-hero-headline">{getWidgetContent('wid-home3-h3-title', 'text', 'College, sorted.')}</h2>
        <p className="apple-hero-subhead">{getWidgetContent('wid-home3-h3-sub', 'html', 'Get a gift card from $100 to $150** when you buy Mac or iPad with education savings.').replace(/<[^>]*>/g, '')}</p>
        <div className="apple-cta-group">
          <Link to={getWidgetContent('wid-home3-h3-btn', 'url', '/produtos')} className="apple-btn-pill primary">
            {getWidgetContent('wid-home3-h3-btn', 'text', 'Shop')}
          </Link>
        </div>
        <div className="apple-hero-image-wrap">
          <img
            src={getWidgetContent('wid-home3-h3-img', 'url', 'https://www.apple.com/v/home/images/back-to-school-2026/a/hero_back_to_school_2026__cz07tzsg14sy_large.jpg')}
            alt={getWidgetContent('wid-home3-h3-img', 'alt', 'Back to School')}
          />
        </div>
      </section>

      {/* ── 5. PROMO GRID 2x2 (6 CARDS) ── */}
      <section className="apple-promo-grid">
        {/* Card 1: MacBook Air */}
        <div className="apple-promo-card theme-light">
          <div>
            <h3 className="apple-promo-headline">{getWidgetContent('wid-home3-p1-title', 'text', 'MacBook Air')}</h3>
            <p className="apple-promo-subhead">{getWidgetContent('wid-home3-p1-sub', 'html', 'Now supercharged by M5.').replace(/<[^>]*>/g, '')}</p>
            <div className="apple-cta-group">
              <Link to={getWidgetContent('wid-home3-p1-btn1', 'url', '/macbook-air')} className="apple-btn-pill primary">
                {getWidgetContent('wid-home3-p1-btn1', 'text', 'Learn more')}
              </Link>
              <Link to={getWidgetContent('wid-home3-p1-btn2', 'url', '/produtos')} className="apple-btn-pill secondary">
                {getWidgetContent('wid-home3-p1-btn2', 'text', 'Buy')}
              </Link>
            </div>
          </div>
          <div className="apple-promo-img-wrap">
            <img
              src={getWidgetContent('wid-home3-p1-img', 'url', 'https://www.apple.com/v/home/images/macbook-air-m5/a/promo_macbook_air_m5__e5xk2yysqiie_large.jpg')}
              alt="MacBook Air"
            />
          </div>
        </div>

        {/* Card 2: iPad Air */}
        <div className="apple-promo-card theme-light">
          <div>
            <h3 className="apple-promo-headline">{getWidgetContent('wid-home3-p2-title', 'text', 'iPad Air')}</h3>
            <p className="apple-promo-subhead">{getWidgetContent('wid-home3-p2-sub', 'html', 'Now supercharged by M4.').replace(/<[^>]*>/g, '')}</p>
            <div className="apple-cta-group">
              <Link to={getWidgetContent('wid-home3-p2-btn1', 'url', '/ipad-air')} className="apple-btn-pill primary">
                {getWidgetContent('wid-home3-p2-btn1', 'text', 'Learn more')}
              </Link>
              <Link to={getWidgetContent('wid-home3-p2-btn2', 'url', '/produtos')} className="apple-btn-pill secondary">
                {getWidgetContent('wid-home3-p2-btn2', 'text', 'Buy')}
              </Link>
            </div>
          </div>
          <div className="apple-promo-img-wrap">
            <img
              src={getWidgetContent('wid-home3-p2-img', 'url', 'https://www.apple.com/v/home/images/ipad-air-m4/a/promo_ipad_air_m4__bgcv7t286k8y_large.jpg')}
              alt="iPad Air"
            />
          </div>
        </div>

        {/* Card 3: MacBook Pro (Dark) */}
        <div className="apple-promo-card theme-dark">
          <div>
            <h3 className="apple-promo-headline">{getWidgetContent('wid-home3-p3-title', 'text', 'MacBook Pro')}</h3>
            <p className="apple-promo-subhead">{getWidgetContent('wid-home3-p3-sub', 'html', 'Now with M5, M5 Pro, and M5 Max.').replace(/<[^>]*>/g, '')}</p>
            <div className="apple-cta-group">
              <Link to={getWidgetContent('wid-home3-p3-btn1', 'url', '/macbook-pro')} className="apple-btn-pill primary">
                {getWidgetContent('wid-home3-p3-btn1', 'text', 'Learn more')}
              </Link>
              <Link to={getWidgetContent('wid-home3-p3-btn2', 'url', '/produtos')} className="apple-btn-pill secondary">
                {getWidgetContent('wid-home3-p3-btn2', 'text', 'Buy')}
              </Link>
            </div>
          </div>
          <div className="apple-promo-img-wrap">
            <img
              src={getWidgetContent('wid-home3-p3-img', 'url', 'https://www.apple.com/v/home/images/macbook-pro/a/promo_macbook_pro__c9td9w1mc8ia_large.jpg')}
              alt="MacBook Pro"
            />
          </div>
        </div>

        {/* Card 4: Apple Watch Series 11 */}
        <div className="apple-promo-card theme-light">
          <div>
            <h3 className="apple-promo-headline">{getWidgetContent('wid-home3-p4-title', 'text', '⌚ WATCH SERIES 11')}</h3>
            <p className="apple-promo-subhead">{getWidgetContent('wid-home3-p4-sub', 'html', 'The ultimate way to watch your health.').replace(/<[^>]*>/g, '')}</p>
            <div className="apple-cta-group">
              <Link to={getWidgetContent('wid-home3-p4-btn1', 'url', '/watch')} className="apple-btn-pill primary">
                {getWidgetContent('wid-home3-p4-btn1', 'text', 'Learn more')}
              </Link>
              <Link to={getWidgetContent('wid-home3-p4-btn2', 'url', '/produtos')} className="apple-btn-pill secondary">
                {getWidgetContent('wid-home3-p4-btn2', 'text', 'Buy')}
              </Link>
            </div>
          </div>
          <div className="apple-promo-img-wrap">
            <img
              src={getWidgetContent('wid-home3-p4-img', 'url', 'https://www.apple.com/v/home/images/apple-watch-series-11/a/promo_apple_watch_series_11__gnlwqxe1jlu2_large.jpg')}
              alt="Apple Watch"
            />
          </div>
        </div>

        {/* Card 5: Trade In */}
        <div className="apple-promo-card theme-light">
          <div>
            <h3 className="apple-promo-headline">{getWidgetContent('wid-home3-p5-title', 'text', '🍏 Trade In')}</h3>
            <p className="apple-promo-subhead">{getWidgetContent('wid-home3-p5-sub', 'html', 'Get up to $205–$720 in credit when you trade in iPhone 13 or higher.').replace(/<[^>]*>/g, '')}</p>
            <div className="apple-cta-group">
              <Link to={getWidgetContent('wid-home3-p5-btn1', 'url', '/contato')} className="apple-btn-pill primary">
                {getWidgetContent('wid-home3-p5-btn1', 'text', 'Get your estimate')}
              </Link>
            </div>
          </div>
          <div className="apple-promo-img-wrap">
            <img
              src={getWidgetContent('wid-home3-p5-img', 'url', 'https://www.apple.com/v/home/images/iphone-tradein/a/promo_iphone_tradein__e4hrjxmgmf0i_large.jpg')}
              alt="Trade In"
            />
          </div>
        </div>

        {/* Card 6: Apple Card */}
        <div className="apple-promo-card theme-light">
          <div>
            <h3 className="apple-promo-headline">{getWidgetContent('wid-home3-p6-title', 'text', '💳 Card')}</h3>
            <p className="apple-promo-subhead">{getWidgetContent('wid-home3-p6-sub', 'html', 'Get up to 3% Daily Cash back with every purchase.').replace(/<[^>]*>/g, '')}</p>
            <div className="apple-cta-group">
              <Link to={getWidgetContent('wid-home3-p6-btn1', 'url', '/conta')} className="apple-btn-pill primary">
                {getWidgetContent('wid-home3-p6-btn1', 'text', 'Learn more')}
              </Link>
              <Link to={getWidgetContent('wid-home3-p6-btn2', 'url', '/conta')} className="apple-btn-pill secondary">
                {getWidgetContent('wid-home3-p6-btn2', 'text', 'Apply now')}
              </Link>
            </div>
          </div>
          <div className="apple-promo-img-wrap">
            <img
              src={getWidgetContent('wid-home3-p6-img', 'url', 'https://www.apple.com/v/home/images/apple-card/a/promo_apple_card__d8xz4kd4evwy_large.jpg')}
              alt="Apple Card"
            />
          </div>
        </div>
      </section>

      {/* ── 6. ENDLESS ENTERTAINMENT ── */}
      <section className="apple-entertainment-section">
        <h2 className="apple-entertainment-headline">Endless entertainment.</h2>
        <div className="apple-entertainment-carousel">
          {shows.map((show) => (
            <div
              key={show.id}
              className="apple-show-card"
              style={{ backgroundImage: `url(${show.bg})` }}
            >
              <div className="apple-show-card-overlay" />
              <div className="apple-show-card-content">
                <span className="apple-show-genre">{show.genre}</span>
                <h4 className="apple-show-title">{show.title}</h4>
                <p className="apple-show-desc">{show.desc}</p>
                <a href="#stream" className="apple-show-btn" onClick={e => e.preventDefault()}>
                  ▶ {show.cta}
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── RODAPÉ DA LOJA ── */}
      <Footer />
    </div>
  )
}
