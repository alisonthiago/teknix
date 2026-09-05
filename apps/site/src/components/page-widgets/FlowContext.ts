import { createContext, useContext } from 'react'

export interface FlowContextValue {
  regionId: string
  globalKey?: string
  action?: (data: object) => void
  drop?: (event: any, target?: string, inside?: boolean, position?: 'before' | 'after' | 'inside') => void
  depth?: number
}

export const FlowContext = createContext<FlowContextValue | null>(null)
export const useFlowContext = () => useContext(FlowContext)
