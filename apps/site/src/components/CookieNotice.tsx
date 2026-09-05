import { useEffect, useState } from 'react'
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
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    const sync = () => {
      clearTimeout(timer)
      let expires = 0
      try { expires = noticeExpiresAt(localStorage.getItem(STORAGE_KEY)) } catch { /* Navegação restrita: mostrar aviso. */ }
      setVisible(!expires)
      if (expires) timer = setTimeout(sync, Math.min(expires - Date.now(), 2147483647))
    }
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener('focus', sync)
    window.addEventListener('teknix-cookie-notice-open', open)
    function open() { setVisible(true) }
    return () => {
      clearTimeout(timer)
      window.removeEventListener('storage', sync)
      window.removeEventListener('focus', sync)
      window.removeEventListener('teknix-cookie-notice-open', open)
    }
  }, [])

  function acknowledge() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, savedAt: Date.now() }))
      setVisible(false)
    } catch { setStorageFailed(true) }
  }

  if (!visible) return null
  return (
    <section className="teknix-cookie-notice" aria-label="Aviso de cookies">
      <div className="teknix-cookie-notice-inner">
        <div className="teknix-cookie-notice-text">
          <strong>Cookies e privacidade</strong>
          <span>Usamos armazenamento no navegador para funcionalidades como sua sacola e para lembrar este aviso por 180 dias.</span>
          {storageFailed && (
            <p className="teknix-cookie-notice-status" role="status">
              Seu navegador não permitiu salvar a escolha. O aviso poderá aparecer novamente.
            </p>
          )}
        </div>
        <div className="teknix-cookie-notice-actions">
          <button type="button" onClick={acknowledge}>Entendi</button>
          {storageFailed && (
            <button type="button" onClick={() => setVisible(false)} className="teknix-cookie-notice-btn-secondary">
              Fechar agora
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
