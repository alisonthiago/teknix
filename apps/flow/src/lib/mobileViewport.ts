/* ==========================================================================
   TEKNIX MOBILE VIEWPORT UTILITY (FLOW)
   Previne e corrige zoom persistente em formulários no iOS (Safari/Chrome).
   ========================================================================== */

export function restoreMobileViewport(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  // 1. Remove foco do campo ativo (fecha teclado virtual)
  const activeEl = document.activeElement as HTMLElement | null
  if (activeEl && typeof activeEl.blur === 'function') {
    activeEl.blur()
  }

  // 2. Corrige deslocamentos horizontais
  if (window.scrollX !== 0) {
    window.scrollTo({ left: 0, top: window.scrollY, behavior: 'instant' as ScrollBehavior })
  }
  if (document.documentElement.scrollLeft !== 0) {
    document.documentElement.scrollLeft = 0
  }
  if (document.body.scrollLeft !== 0) {
    document.body.scrollLeft = 0
  }

  // 3. Força alinhamento visual se o viewport tiver sofrido zoom residual
  if (window.visualViewport && window.visualViewport.scale > 1) {
    const meta = document.querySelector('meta[name="viewport"]')
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0')
    }
  }
}

export function setupMobileViewportGuard(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {}
  }

  const handleSubmit = () => {
    restoreMobileViewport()
  }

  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null
    if (!target) return

    const btn = target.closest('button, input[type="submit"], [role="button"]') as HTMLElement | null
    if (!btn) return

    const activeEl = document.activeElement
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT')) {
      const text = (btn.innerText || btn.getAttribute('aria-label') || btn.getAttribute('title') || '').toLowerCase()
      const actionKeywords = [
        'buscar', 'pesquisar', 'salvar', 'aplicar', 'confirmar',
        'continuar', 'finalizar', 'concluir', 'entrar', 'cadastrar',
        'pagar', 'calcular', 'filtrar', 'adicionar', 'comprar', 'fechar', 'ok'
      ]
      const isAction = actionKeywords.some(kw => text.includes(kw)) || btn.getAttribute('type') === 'submit'

      if (isAction) {
        requestAnimationFrame(() => {
          restoreMobileViewport()
        })
      }
    }
  }

  window.addEventListener('submit', handleSubmit, { capture: true, passive: true })
  window.addEventListener('click', handleClick, { capture: true, passive: true })

  return () => {
    window.removeEventListener('submit', handleSubmit, { capture: true })
    window.removeEventListener('click', handleClick, { capture: true })
  }
}
