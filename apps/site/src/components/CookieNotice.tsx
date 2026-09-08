import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import './CookieNotice.css'

const STORAGE_KEY = 'teknix-cookie-notice-v1'
const MAX_AGE = 180 * 24 * 60 * 60 * 1000

export function noticeExpiresAt(raw: string | null, now = Date.now()): number {
  try {
    const value = JSON.parse(raw || 'null')
    return value?.version === 1 && Number.isFinite(value.savedAt) && value.savedAt <= now && value.savedAt + MAX_AGE > now
      ? value.savedAt + MAX_AGE : 0
  } catch { return 0 }
}

export default function CookieNotice() {
  const [visible, setVisible] = useState(false)
  const [storageFailed, setStorageFailed] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true)
  const [marketingEnabled, setMarketingEnabled] = useState(true)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const sync = () => {
      clearTimeout(timer)
      let expires = 0
      try { expires = noticeExpiresAt(localStorage.getItem(STORAGE_KEY)) } catch { /* Navegação restrita */ }
      setVisible(!expires)
      if (expires) timer = setTimeout(sync, Math.min(expires - Date.now(), 2147483647))
    }
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    window.addEventListener('teknix-cookie-notice-open', open)
    function open() { setVisible(true) }

    // Higieniza qualquer banner de terceiros que mencione Mercado Livre
    const sanitizeExternalBanners = () => {
      const banners = document.querySelectorAll('.cookie-consent-banner-opt-out, .andes-snackbar-fixed-element')
      banners.forEach(banner => {
        if (banner.classList.contains('teknix-cookie-notice')) return
        banner.innerHTML = banner.innerHTML
          .replace(/Mercado Livre/gi, 'TEKNIX')
          .replace(/mercado livre/gi, 'TEKNIX')
      })
    }

    sanitizeExternalBanners()
    const observer = new MutationObserver(sanitizeExternalBanners)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      clearTimeout(timer)
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
      window.removeEventListener('teknix-cookie-notice-open', open)
      observer.disconnect()
    }
  }, [])

  function acknowledge(customSettings?: { analytics: boolean; marketing: boolean }) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        settings: customSettings || { analytics: true, marketing: true }
      }))
      setVisible(false)
      setShowConfigModal(false)
    } catch {
      setStorageFailed(true)
    }
  }

  if (!visible) return null

  return (
    <>
      <div
        role="region"
        aria-label="Aviso de cookies e privacidade TEKNIX"
        className="cookie-consent-banner-opt-out andes-snackbar-fixed-element teknix-cookie-notice"
      >
        <div className="teknix-cookie-notice-inner">
          <div className="teknix-cookie-notice-text">
            <span>
              Usamos cookies para melhorar sua experiência na <strong>TEKNIX</strong>. Consulte mais informações na nossa{' '}
              <Link to="/institucional" className="cookie-privacy-link">Central de privacidade</Link>.
            </span>
            {storageFailed && (
              <p className="teknix-cookie-notice-status" role="status">
                Seu navegador não permitiu salvar a escolha. O aviso poderá aparecer novamente.
              </p>
            )}
          </div>
          <div className="teknix-cookie-notice-actions">
            <button
              type="button"
              className="teknix-cookie-accept-btn"
              onClick={() => acknowledge()}
            >
              Aceitar cookies
            </button>
            <button
              type="button"
              className="teknix-cookie-config-btn"
              onClick={() => setShowConfigModal(true)}
            >
              Configurar cookies
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Configuração de Cookies */}
      {showConfigModal && (
        <div className="cookie-modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="cookie-modal-content" onClick={e => e.stopPropagation()}>
            <div className="cookie-modal-header">
              <h3>Configuração de Cookies TEKNIX</h3>
              <button
                type="button"
                className="cookie-modal-close"
                onClick={() => setShowConfigModal(false)}
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>
            <p className="cookie-modal-desc">
              Escolha quais tipos de cookies você autoriza para otimizar sua navegação na loja TEKNIX.
            </p>

            <div className="cookie-modal-options">
              <div className="cookie-option-item">
                <div className="cookie-option-info">
                  <strong>Cookies Essenciais</strong>
                  <span>Necessários para o funcionamento da loja, sacola e autenticação.</span>
                </div>
                <input type="checkbox" checked disabled />
              </div>

              <div className="cookie-option-item">
                <div className="cookie-option-info">
                  <strong>Cookies de Desempenho e Análise</strong>
                  <span>Ajudam a entender como a loja é utilizada para melhorias contínuas.</span>
                </div>
                <input
                  type="checkbox"
                  checked={analyticsEnabled}
                  onChange={e => setAnalyticsEnabled(e.target.checked)}
                />
              </div>

              <div className="cookie-option-item">
                <div className="cookie-option-info">
                  <strong>Cookies de Marketing e Personalização</strong>
                  <span>Utilizados para exibir promoções e novidades de seu interesse.</span>
                </div>
                <input
                  type="checkbox"
                  checked={marketingEnabled}
                  onChange={e => setMarketingEnabled(e.target.checked)}
                />
              </div>
            </div>

            <div className="cookie-modal-footer">
              <button
                type="button"
                className="cookie-modal-btn-save"
                onClick={() => acknowledge({ analytics: analyticsEnabled, marketing: marketingEnabled })}
              >
                Salvar preferências
              </button>
              <button
                type="button"
                className="cookie-modal-btn-all"
                onClick={() => acknowledge({ analytics: true, marketing: true })}
              >
                Aceitar todos
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
