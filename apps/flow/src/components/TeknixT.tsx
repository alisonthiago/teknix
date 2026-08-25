import React from 'react'

/**
 * TeknixT — somente o "t" estilizado do logotipo TEKNIX,
 * extraído do SVG original (viewBox 0 0 113.98 26.81).
 * Os dois paths que formam o "t" ficam em x≈0..16, y≈0..26.
 */
interface TeknixTProps {
  className?: string
  style?: React.CSSProperties
}

export function TeknixT({ className, style }: TeknixTProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16.5 26.81"
      fill="currentColor"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {/* Haste vertical + base curva do "t" */}
      <path d="M15.99,26.22l-4.32-.04c-3.82-.04-6.97-3.46-6.99-6.94l-.05-8.69c0-.45-.36-.84-.81-.85l-3.82-.02v-4.29s2.76.01,2.76.01c3.36.19,6.11,2.9,6.14,6.26l.07,7.03c.02,2.11,2.06,3.26,3.97,3.25l3.06-.02-.02,4.3Z" />
      {/* Barra horizontal do topo do "t" */}
      <path d="M15.76,4.67l.02,4.17-3.43-.03c-3.15-.21-5.64-2.77-5.88-5.9L6.42,0h4.35s0,3.8,0,3.8c.06.49.37.86.86.87h4.13Z" />
    </svg>
  )
}
