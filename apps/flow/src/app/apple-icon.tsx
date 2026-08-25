import { ImageResponse } from 'next/og'

export const size = {
  width: 180,
  height: 180,
}
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#B5F500',
          borderRadius: '36px',
        }}
      >
        <svg width="120" height="120" viewBox="0 0 64 64" fill="none">
          <path
            d="M20 14V9h10v5h10v10h-10v16a8 8 0 0 0 8 8h3v8h-5a16 16 0 0 1-16-16V24h-5v-10h5z"
            fill="#111111"
          />
        </svg>
      </div>
    ),
    {
      ...size,
    }
  )
}
