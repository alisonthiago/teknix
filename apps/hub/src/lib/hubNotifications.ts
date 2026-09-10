export type HubToastType = 'success' | 'error' | 'info'

export interface HubToastDetail {
  message: string
  type?: HubToastType
  duration?: number
}

export function notifyHub(message: string, type: HubToastType = 'success', duration = 4000) {
  window.dispatchEvent(new CustomEvent<HubToastDetail>('hub:toast', {
    detail: { message, type, duration }
  }))
}