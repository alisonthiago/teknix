import { FormEvent, useEffect, useState } from 'react'
import { calculateMelhorEnvioQuote, checkMelhorEnvio, MelhorEnvioQuote } from '../services/melhorEnvioTest'
import { TeknixLogo } from '../components/TeknixLogo'
import './MelhorEnvioTest.css'

function setNoIndex() {
  const existing = document.head.querySelector('meta[name="robots"]')
  const meta = existing || document.createElement('meta')
  meta.setAttribute('name', 'robots')
  meta.setAttribute('content', 'noindex,nofollow')
  if (!existing) document.head.appendChild(meta)
  const previousTitle = document.title
  document.title = 'Ambiente de Testes — Melhor Envio | TEKNIX'
  return () => {
    if (!existing) meta.remove()
    else meta.setAttribute('content', 'index,follow')
    document.title = previousTitle
  }
}

function formatPrice(value: MelhorEnvioQuote['price']) {
  const price = Number(value)
  return Number.isFinite(price) ? price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '—'
}

function formatDeadline(quote: MelhorEnvioQuote) {
  if (quote.delivery_range?.min && quote.delivery_range?.max) {
    return `${quote.delivery_range.min}–${quote.delivery_range.max} dias`
  }
  return quote.delivery_time ? `${quote.delivery_time} dias` : '—'
}

export default function MelhorEnvioTest() {
  const [apiStatus, setApiStatus] = useState('Verificando…')
  const [statusTone, setStatusTone] = useState<'neutral' | 'success' | 'error'>('neutral')
  const [postalCode, setPostalCode] = useState('')
  const [quotes, setQuotes] = useState<MelhorEnvioQuote[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const restore = setNoIndex()
    let active = true
    checkMelhorEnvio()
      .then((response) => {
        if (!active) return
        const sandbox = response.status === 'sandbox'
        setApiStatus(response.status === 'pending_credentials' ? 'Aguardando credencial' : sandbox ? 'Conectada — Sandbox' : response.message || 'Conectada')
        setStatusTone(response.status === 'error' ? 'error' : 'success')
      })
      .catch((error: Error) => {
        if (!active) return
        setApiStatus(error.message)
        setStatusTone('error')
      })
    return () => { active = false; restore() }
  }, [])

  async function handleQuote(event: FormEvent) {
    event.preventDefault()
    const cleanPostalCode = postalCode.replace(/\D/g, '')
    if (cleanPostalCode.length !== 8) {
      setMessage('Informe um CEP de destino válido com 8 dígitos.')
      return
    }
    setLoading(true)
    setMessage('')
    setQuotes([])
    try {
      const result = await calculateMelhorEnvioQuote(cleanPostalCode)
      setQuotes(result)
      setMessage(result.length ? '' : 'A API não retornou opções de frete para este CEP.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível calcular o frete.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="melhor-envio-test" aria-labelledby="melhor-envio-title">
      <section className="melhor-envio-test__card">
        <div className="melhor-envio-test__brand" aria-label="TEKNIX e Melhor Envio">
          <TeknixLogo />
          <span className="melhor-envio-test__brand-separator" aria-hidden="true">×</span>
          <img src="/melhor-envio-logo.svg" alt="Melhor Envio" />
        </div>
        <h1 id="melhor-envio-title">Ambiente de Testes</h1>
        <p className="melhor-envio-test__intro">Validação da integração logística entre TEKNIX e Melhor Envio.</p>

        <div className="melhor-envio-test__details" aria-label="Detalhes do ambiente">
          <div><span>Ambiente</span><strong className="detail-value--blue">Testes</strong></div>
          <div><span>Integração</span><strong className="detail-value--blue">Melhor Envio</strong></div>
          <div><span>Status da API</span><strong className={`status-${statusTone}`}><i />{apiStatus}</strong></div>
        </div>

        <div className="melhor-envio-test__divider" />
        <h2>Calcular frete</h2>
        <p className="melhor-envio-test__hint">Consulta segura pelo backend da TEKNIX.</p>
        <form onSubmit={handleQuote} className="melhor-envio-test__form">
          <label htmlFor="destination-postal-code">CEP de destino</label>
          <div className="melhor-envio-test__input-row">
            <input id="destination-postal-code" inputMode="numeric" autoComplete="postal-code" placeholder="00000-000" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} maxLength={9} />
            <button type="submit" disabled={loading}>{loading ? 'Calculando…' : 'Calcular frete'}</button>
          </div>
        </form>
        {message && <p className="melhor-envio-test__message" role="status">{message}</p>}
        {quotes.length > 0 && <div className="melhor-envio-test__results" aria-live="polite">
          <div className="melhor-envio-test__result-header"><span>Transportadora</span><span>Serviço</span><span>Prazo</span><span>Valor</span></div>
          {quotes.map((quote, index) => <div className="melhor-envio-test__result" key={quote.id || index}><span>{quote.company?.name || '—'}</span><span>{quote.name || '—'}</span><span>{formatDeadline(quote)}</span><strong>{formatPrice(quote.price)}</strong></div>)}
        </div>}
        <p className="melhor-envio-test__footer">Página privada de homologação · TEKNIX</p>
      </section>
    </main>
  )
}