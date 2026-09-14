/* ==========================================================================
   TEKNIX MOBILE VIEWPORT UTILITIES
   Utilitário compartilhado do ecossistema TEKNIX para restaurar o enquadramento
   do viewport e prevenir/reverter zoom persistente em formulários no iOS (Safari/Chrome).
   ========================================================================== */

/**
 * Remove o foco do elemento ativo (fechando teclado virtual) e restaura
 * o enquadramento normal da tela, eliminando deslocamento horizontal.
 */
export function restoreMobileViewport(): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  // 1. Remove foco do campo ativo (fecha teclado virtual)
  const activeEl = document.activeElement as HTMLElement | null
  if (activeEl && typeof activeEl.blur === 'function') {
    activeEl.blur()
  }

  // 2. Corrige qualquer deslocamento horizontal indesejado
  if (window.scrollX !== 0) {
    window.scrollTo({ left: 0, top: window.scrollY, behavior: 'instant' as ScrollBehavior })
  }
  if (document.documentElement.scrollLeft !== 0) {
    document.documentElement.scrollLeft = 0
  }
  if (document.body.scrollLeft !== 0) {
    document.body.scrollLeft = 0
  }

  // 3. Força alinhamento do visual viewport no iOS sem bloquear acessibilidade
  if (window.visualViewport && window.visualViewport.scale > 1) {
    const meta = document.querySelector('meta[name="viewport"]')
    if (meta) {
      meta.setAttribute('content', 'width=device-width, initial-scale=1.0')
    }
  }
}

/**
 * Registra listeners globais para interceptar ações de botões e formulários
 * (Buscar, Salvar, Aplicar, Confirmar, Continuar, Finalizar, etc.) e disparar
 * automaticamente o restoreMobileViewport().
 */
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
