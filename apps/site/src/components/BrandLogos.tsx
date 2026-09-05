export function MakitaLogo({ height = 28, color = '#141414', className = '' }: { height?: number; color?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 130 32"
      height={height}
      className={className}
      fill={color}
      style={{ display: 'block', maxWidth: '100%', height }}
    >
      {/* Makita Official Typography */}
      <text
        x="0"
        y="25"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontSize="28"
        fontStyle="italic"
        fontWeight="900"
        letterSpacing="-1.5px"
      >
        makita
      </text>
    </svg>
  )
}

export function BoschLogo({ height = 28, color = '#141414', className = '' }: { height?: number; color?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 140 32"
      height={height}
      className={className}
      style={{ display: 'block', maxWidth: '100%', height }}
    >
      {/* Bosch Circle Emblem */}
      <circle cx="15" cy="16" r="13" stroke={color} strokeWidth="3" fill="none" />
      <path d="M7 16h16M15 8v16" stroke={color} strokeWidth="3" strokeLinecap="square" />
      {/* BOSCH text */}
      <text
        x="36"
        y="24"
        fontFamily="'Helvetica Neue', 'Arial Black', sans-serif"
        fontSize="22"
        fontWeight="900"
        letterSpacing="1px"
        fill={color}
      >
        BOSCH
      </text>
    </svg>
  )
}

export function PdrLogo({ height = 28, color = '#141414', className = '' }: { height?: number; color?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 110 32"
      height={height}
      className={className}
      fill={color}
      style={{ display: 'block', maxWidth: '100%', height }}
    >
      <text
        x="4"
        y="26"
        fontFamily="'Impact', 'Arial Black', sans-serif"
        fontSize="32"
        fontWeight="900"
        letterSpacing="3px"
      >
        PDR
      </text>
    </svg>
  )
}

export function BovenauLogo({ height = 28, color = '#141414', className = '' }: { height?: number; color?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 150 32"
      height={height}
      className={className}
      fill={color}
      style={{ display: 'block', maxWidth: '100%', height }}
    >
      <text
        x="0"
        y="20"
        fontFamily="'Arial Black', 'Impact', sans-serif"
        fontSize="21"
        fontWeight="900"
        letterSpacing="2px"
      >
        BOVENAU
      </text>
      <rect x="0" y="24" width="145" height="2" />
      <rect x="0" y="28" width="145" height="2" />
    </svg>
  )
}

export function DewaltLogo({ height = 28, color = '#141414', className = '' }: { height?: number; color?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 130 32"
      height={height}
      className={className}
      fill={color}
      style={{ display: 'block', maxWidth: '100%', height }}
    >
      <text
        x="0"
        y="24"
        fontFamily="'Impact', 'Arial Black', sans-serif"
        fontSize="28"
        fontWeight="900"
        letterSpacing="1px"
      >
        DEWALT
      </text>
    </svg>
  )
}

export function KarcherLogo({ height = 28, color = '#141414', className = '' }: { height?: number; color?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 150 32"
      height={height}
      className={className}
      fill={color}
      style={{ display: 'block', maxWidth: '100%', height }}
    >
      <text
        x="0"
        y="20"
        fontFamily="'Helvetica Neue', 'Arial Black', sans-serif"
        fontSize="22"
        fontWeight="900"
        letterSpacing="1px"
      >
        KÄRCHER
      </text>
      <rect x="0" y="25" width="140" height="4" />
    </svg>
  )
}
