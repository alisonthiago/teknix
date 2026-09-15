export type HubToastType = 'success' | 'error' | 'warning' | 'info'

export interface HubToastDetail {
  title?: string
  message: string
  type?: HubToastType
  duration?: number
  onClick?: () => void
}

export function notifyHub(
  messageOrOptions: string | { title?: string; message: string; type?: HubToastType; duration?: number; onClick?: () => void },
  type: HubToastType = 'success',
  duration = 4000
) {
  if (typeof window === 'undefined') return

  let detail: HubToastDetail
  if (typeof messageOrOptions === 'object' && messageOrOptions !== null) {
    detail = {
      title: messageOrOptions.title,
      message: messageOrOptions.message,
      type: messageOrOptions.type || 'info',
      duration: messageOrOptions.duration || duration,
      onClick: messageOrOptions.onClick
    }
  } else {
    detail = {
      message: messageOrOptions,
      type,
      duration
    }
  }

  window.dispatchEvent(new CustomEvent<HubToastDetail>('hub:toast', { detail }))
}