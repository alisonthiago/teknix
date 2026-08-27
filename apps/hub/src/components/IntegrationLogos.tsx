import React from 'react'

interface LogoProps {
  size?: number
  className?: string
}

export function MercadoLivreLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 150 104"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path fill="#2D3277" d="M150 49.027c0-26.944-33.685-48.87-75-48.87-41.501 0-75 21.926-75 48.87v2.787c0 28.616 29.404 51.843 75 51.843 45.968 0 75-23.227 75-51.843v-2.787Z" />
      <path fill="#FFE600" d="M147.022 49.027c0 25.457-32.196 46.083-72.022 46.083-39.826 0-72.022-20.626-72.022-46.083C2.978 23.57 35.174 2.944 75 2.944c39.826.186 72.022 20.626 72.022 46.083Z" />
      <path fill="#FFF" d="M50.993 34.533s-.745.743-.373 1.487c1.117 1.486 4.653 2.23 8.189 1.486 2.047-.557 4.839-2.601 7.444-4.645 2.792-2.23 5.583-4.46 8.56-5.389 2.979-.93 4.84-.558 6.142-.186 1.49.372 2.978 1.3 5.584 3.345 5.024 3.716 24.751 20.997 28.101 23.97 2.792-1.3 15.075-6.503 31.638-10.22-1.117-8.919-6.514-17.095-14.702-23.784-11.353 4.831-25.31 7.247-39.082.557 0 0-7.444-3.53-14.702-3.345-10.794.186-15.447 5.017-20.472 9.849l-6.327 6.875Z" />
    </svg>
  )
}

export function ShopeeLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 449.96 638.22"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path fill="#ee4d30" fillRule="evenodd" d="M301.45,345.67c-2.69,22.18-16.13,39.95-36.95,48.84-11.59,4.96-27.16,7.63-39.48,6.79-19.22-.73-37.28-5.41-53.93-13.95-5.95-3.05-14.81-9.15-21.62-14.87-1.72-1.44-1.93-2.37-.79-3.99.62-.93,1.75-2.6,4.26-6.28,3.64-5.33,4.1-6,4.5-6.63,1.16-1.79,3.06-1.94,4.92-.47q.2.15.34.27.31.24,1.03.8c.73.57,1.16.91,1.34,1.04,17.95,14.06,38.86,22.17,59.97,22.98,29.37-.4,50.49-13.6,54.27-33.88,4.16-22.31-13.36-41.59-47.63-52.33-10.72-3.36-37.81-14.2-42.81-17.13-23.46-13.76-34.43-31.79-32.87-54.06,2.39-30.87,31.04-53.89,67.25-54.04,16.19-.03,32.35,3.33,47.87,9.87,5.5,2.32,15.31,7.66,18.7,10.19,1.95,1.43,2.34,3.1,1.22,4.91-.62,1.04-1.66,2.7-3.83,6.15l-.02.04c-2.86,4.55-2.95,4.69-3.61,5.75-1.14,1.73-2.47,1.89-4.52.59-16.61-11.16-35.02-16.77-55.27-17.18-25.21.5-44.11,15.5-45.35,35.94-.33,18.46,13.52,31.94,43.43,42.22,60.71,19.51,83.94,42.38,79.57,78.45M226.47,26.97c39.53,0,71.74,37.51,73.25,84.46h-146.5c1.51-46.95,33.73-84.46,73.25-84.46M431.03,120.26c0-4.88-3.93-8.83-8.77-8.83h-94.96C324.98,49.44,280.72,0,226.47,0s-98.5,49.44-100.83,111.43H30.55c-4.77.09-8.61,4.01-8.61,8.83,0,.23,0,.46.03.68h-.07l13.56,298.82c0,.83.03,1.67.09,2.51.01.19.03.38.04.57l.03.63.03.03c2.06,20.79,17.15,37.54,37.67,38.31l.05.05h301.65c.14,0,.29,0,.43,0s.29,0,.43,0h.66c20.88-.58,37.79-17.56,39.57-38.61h.01s.01-.29.01-.29c.02-.22.03-.44.05-.66.03-.53.05-1.06.06-1.58l14.79-300h-.01c0-.15.01-.3.01-.46" />
    </svg>
  )
}

export function AmazonLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path fill="#FFC107" d="M20.677 19.768c-9.79 4.688-15.858.761-19.743-1.623-.239-.161-.652.032-.292.445C1.941 20.169 6.18 24 11.719 24s8.841-3.054 9.249-3.59v.001c.413-.536.107-.841-.291-.643z" />
      <path fill="#212121" d="M13.76 7.001c-2.581.096-8.984.831-8.984 6.295 0 5.867 7.331 6.108 9.727 2.314.345.546 1.876 2.009 2.401 2.508l3.011-3s-1.712-1.355-1.712-2.829v-7.88C18.203 3.054 16.905 0 12.251 0 7.587 0 5.112 2.946 5.112 5.588l3.895.365c.864-2.652 2.873-2.652 2.873-2.652 2.158-.006 1.882 1.597 1.882 3.702l-.002-.002zm0 4.65c0 4.286-4.463 3.644-4.463.921 0-2.528 2.676-3.038 4.463-3.096v2.175z" />
      <path fill="#FFC107" d="M23.422 18.219c-.264-.347-1.606-.401-2.438-.305-.838.106-2.11.632-1.988.937.053.123.17.07.742.016.583-.059 2.199-.273 2.544.171.35.455-.514 2.598-.673 2.946-.158.349.053.445.345.203.276-.225.779-.814 1.124-1.661h-.001c.345-.855.541-2.034.345-2.307z" />
    </svg>
  )
}

export function MagaluLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 600 450"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path fill="#009FE3" d="M511.6,179.8h-9.8c-2.8,0-4.5,1.7-4.5,4.5v28.9c0,10.6-5.7,16.6-13.7,16.6c-8.4,0-13.1-5.4-13.1-15.9v-29.6c0-2.8-1.7-4.5-4.5-4.5h-9.8c-2.8,0-4.5,1.7-4.5,4.5v31c0,19.7,10.2,30.9,25.6,30.9c9.2,0,16.3-3.1,21.4-9.4l0.8,3.9c0.5,2.5,2.2,3.9,4.9,3.9h7.1c2.8,0,4.5-1.7,4.5-4.5v-55.9C516.1,181.4,514.5,179.8,511.6,179.8z" />
      <path fill="#009FE3" d="M443.5,227.5h-17.6c-6.2,0-9.4-3.2-9.4-9.4v-33.9c0-2.8-1.7-4.5-4.5-4.5h-10c-2.8,0-4.5,1.7-4.5,4.5v36.3c0,14.9,9.1,24,24,24h21.9c2.8,0,4.5-1.7,4.5-4.5V232C448,229.2,446.3,227.5,443.5,227.5z" />
      <path fill="#009FE3" d="M158.8,184.1c-0.3-3-1.8-4.3-4.6-4.3h-7.4c-2.4,0-4,1-5.3,3.1l-18,30.4l-16.7-30.4c-1.1-2.1-3-3.1-5.3-3.1h-8c-2.8,0-4.3,1.4-4.6,4.3L84.3,240c-0.3,3.1,1.3,4.6,4.2,4.6h8.9c2.8,0,4.5-1.4,4.6-4.3l1.9-31.3l10.8,19.4c1.1,2.1,3,3.1,5.3,3.1h6.2c2.4,0,4-0.8,5.3-3.1l12.1-20.8l1.4,32.7c0.1,3,1.7,4.3,4.5,4.3h9.7c3,0,4.5-1.5,4.2-4.6L158.8,184.1z" />
      <path fill="#009FE3" d="M384.6,179.8h-7.7c-2.7,0-4.5,1.4-4.9,4l-0.4,3.2c-4.3-4.6-10.6-8.8-21.1-8.8c-17.6,0-30.6,13.8-30.6,33.8c0,19.6,12.1,34.1,29.5,34.1c10.9,0,18-4.6,22.4-9.4l0.7,3.9c0.4,2.5,2.1,3.9,4.8,3.9h7.4c2.8,0,4.5-1.7,4.5-4.5v-55.9C389,181.4,387.3,179.8,384.6,179.8z M354.5,229.8c-9.9,0-16.2-6.8-16.2-17.5c0-10.8,6.6-17.8,16.2-17.8c9.9,0,16.2,6.8,16.2,17.5C370.7,222.8,364.2,229.8,354.5,229.8z" />
      <path fill="#009FE3" d="M308.7,179.8H301c-2.7,0-4.5,1.4-4.9,4l-0.4,3.2c-4.3-4.6-10.6-8.8-21.1-8.8c-17.6,0-30.6,13-30.6,33c0,19,12,32.4,29.4,32.4c10.8,0,17.2-4.5,21.5-9.2v3.2c0,11.2-6.3,18.3-19.6,18.3c-5.6,0-10.6-1.1-15.8-3.3c-2.7-1.3-4.8-0.7-6,1.9l-3.1,6.2c-1.3,2.5-0.8,4.6,1.5,6c7.4,4.2,16.5,5.9,25.3,5.9c21.9,0,35.9-13.8,35.9-33.1v-55.2C313.2,181.4,311.5,179.8,308.7,179.8z M278.7,227.7c-9.7,0-16.2-6.4-16.2-16.4c0-10.5,6.8-16.7,16.2-16.7c9.7,0,16.2,5.7,16.2,16.5C294.9,220.7,288,227.7,278.7,227.7z" />
      <path fill="#009FE3" d="M232.9,179.8h-7.7c-2.7,0-4.5,1.4-4.9,4l-0.4,3.2c-4.3-4.6-10.6-8.8-21.1-8.8c-17.6,0-30.6,13.8-30.6,33.8c0,19.6,12.1,34.1,29.5,34.1c10.9,0,18-4.6,22.4-9.4l0.7,3.9c0.4,2.5,2.1,3.9,4.8,3.9h7.4c2.8,0,4.5-1.7,4.5-4.5v-55.9C237.3,181.4,235.7,179.8,232.9,179.8z M202.8,229.8c-9.9,0-16.2-6.8-16.2-17.5c0-10.8,6.6-17.8,16.2-17.8c9.9,0,16.2,6.8,16.2,17.5C219,222.8,212.5,229.8,202.8,229.8z" />
    </svg>
  )
}

export function WhatsAppLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"
        fill="#25D366"
      />
    </svg>
  )
}

export function MercadoPagoLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="24" height="24" rx="6" fill="#009EE3" />
      <path
        d="M5 11.5C5 11.5 7.5 9 10 11C12.5 13 13.5 12 13.5 12L12.5 10L10 10.5C9 9 10 7.5 11.5 8C13 8.5 15.5 10.5 17 9.5C18.5 8.5 18.5 8.5 18.5 8.5"
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="8" cy="7.5" r="1" fill="#ffffff" />
    </svg>
  )
}

export function AsaasLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="24" height="24" rx="6" fill="#3BBAB1" />
      <path d="M7 10C7 8.34 8.34 7 10 7H14C15.66 7 17 8.34 17 10V14C17 15.66 15.66 17 14 17H10C8.34 17 7 15.66 7 14V10Z" fill="#ffffff" />
      <text x="12" y="14" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#3BBAB1">A</text>
    </svg>
  )
}

export function FocusNfeLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="24" height="24" rx="6" fill="#F2521B" />
      <path d="M7 7H17C17.55 7 18 7.45 18 8V16C18 16.55 17.55 17 17 17H7C6.45 17 6 16.55 6 16V8C6 7.45 6.45 7 7 7Z" fill="#ffffff" />
      <path d="M9 10H15M9 13H15" stroke="#F2521B" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function MelhorEnvioLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="24" height="24" rx="6" fill="#FF6B00" />
      <path d="M5 17V10L8 7H16L19 10V17H16V12H8V17H5Z" fill="#ffffff" />
    </svg>
  )
}

export function BlingLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="24" height="24" rx="6" fill="#3DB86B" />
      <path d="M8 8H16V10H8V8ZM6 12H18V14H6V12ZM8 16H16V18H8V16Z" fill="#ffffff" />
    </svg>
  )
}

export function StripeLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path fill="#635bff" d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z" />
    </svg>
  )
}

export function PagarMeLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="24" height="24" rx="6" fill="#00DA00" />
      <path d="M7 10C7 8.34 8.34 7 10 7H14C15.66 7 17 8.34 17 10V14C17 15.66 15.66 17 14 17H10C8.34 17 7 15.66 7 14V10Z" fill="#ffffff" />
      <text x="12" y="14" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#00DA00">P</text>
    </svg>
  )
}

export function EnotasLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="24" height="24" rx="6" fill="#FF6B35" />
      <path d="M8 7H16C16.55 7 17 7.45 17 8V16C17 16.55 16.55 17 16 17H8C7.45 17 7 16.55 7 16V8C7 7.45 7.45 7 8 7Z" fill="#ffffff" />
      <path d="M9 10H15M9 13H15" stroke="#FF6B35" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function FrenetLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 103 100"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M74.5395 67.2523C74.0205 67.5374 73.4382 67.6859 72.8487 67.6859C72.3273 67.6859 71.7986 67.569 71.3016 67.3253C71.2967 67.3229 71.2894 67.3204 71.2845 67.3156C71.2187 67.2839 71.1554 67.2496 71.092 67.2132L44.9225 52.1052C44.8664 52.0758 44.8104 52.0443 44.7568 52.01C44.7178 51.9856 44.6812 51.9613 44.6447 51.937C44.6349 51.9322 44.6275 51.9273 44.6203 51.92C44.1793 51.6253 43.8114 51.2305 43.5435 50.7699L43.541 50.7626C43.2925 50.3339 43.1317 49.849 43.0854 49.3299C43.0757 49.2229 43.0708 49.1156 43.0708 49.006V18.6775C43.0708 18.5679 43.0758 18.4607 43.0854 18.3536C43.1317 17.8345 43.2925 17.3498 43.541 16.9209C43.6945 16.6528 43.8821 16.4093 44.0989 16.1924C44.2938 15.9975 44.5107 15.8269 44.747 15.6808C44.7519 15.6784 44.7568 15.6735 44.7617 15.6711L44.9321 15.5735L56.3832 8.96113L45.6289 2.75316C44.8273 2.2903 43.9526 2.07099 43.0903 2.07099H43.0707C42.1984 2.07343 41.3384 2.30249 40.5807 2.73123C40.5319 2.75803 40.4856 2.78727 40.4369 2.81421L2.66056 24.6248C2.58989 24.6638 2.51936 24.7052 2.44856 24.7466C2.1001 24.9586 1.77858 25.2119 1.49104 25.4994C1.17669 25.8138 0.903775 26.167 0.682164 26.5544C0.248416 27.3024 0 28.1697 0 29.0956V72.9754C0 73.9012 0.248416 74.7686 0.682164 75.5165C1.10846 76.2572 1.71766 76.8809 2.44856 77.3244C2.51923 77.3658 2.58989 77.4072 2.66056 77.4462L40.542 99.3178C41.3435 99.7807 42.2206 100.002 43.0856 100C43.9505 100 44.8057 99.7784 45.5609 99.3568C45.6194 99.3251 45.6779 99.2934 45.7339 99.2569L83.5106 77.4462C83.5812 77.4072 83.6519 77.3658 83.7225 77.3244C84.0709 77.1124 84.3925 76.8591 84.6799 76.5715C84.992 76.2596 85.2648 75.9063 85.4841 75.5239C85.4889 75.5214 85.4889 75.5165 85.4889 75.5165C85.9226 74.7686 86.1711 73.9012 86.1711 72.9754V60.5375L74.6445 67.1939L74.5395 67.2523Z" fill="url(#paint0_linear_frenet)"></path>
      <path d="M102.161 16.9282L102.159 16.9209C102.005 16.6528 101.815 16.4093 101.598 16.1924C101.403 15.9975 101.184 15.8246 100.948 15.6808L100.777 15.5785L74.6445 0.492095L74.6079 0.470164C74.5981 0.46529 74.5908 0.460416 74.5812 0.455543C74.0354 0.146207 73.4409 0 72.8538 0H72.8488C72.2422 0 71.6452 0.158391 71.119 0.455543L56.3832 8.96113L83.5107 24.6248C83.5813 24.6638 83.652 24.7052 83.7227 24.7466C84.071 24.9586 84.3927 25.2119 84.6801 25.4994C84.9921 25.8112 85.2649 26.1647 85.4842 26.547C85.4891 26.5494 85.4891 26.5543 85.4891 26.5543C85.9227 27.3022 86.1712 28.1696 86.1712 29.0954L86.1711 60.5375L100.787 52.1002C100.839 52.0709 100.887 52.0418 100.936 52.0124C101.177 51.8638 101.399 51.6909 101.599 51.4911C101.816 51.2744 102.006 51.0305 102.159 50.7626C102.459 50.2462 102.629 49.6467 102.629 49.0061V18.6775C102.629 18.0392 102.461 17.4423 102.161 16.9282Z" fill="url(#paint1_linear_frenet)"></path>
      <defs>
        <linearGradient id="paint0_linear_frenet" x1="51.3146" y1="0" x2="51.3146" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#31C48D"></stop>
          <stop offset="0.5" stop-color="#3F83F8"></stop>
          <stop offset="1" stop-color="#7B3FF3"></stop>
        </linearGradient>
        <linearGradient id="paint1_linear_frenet" x1="51.3146" y1="0" x2="51.3146" y2="100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#31C48D"></stop>
          <stop offset="0.5" stop-color="#3F83F8"></stop>
          <stop offset="1" stop-color="#7B3FF3"></stop>
        </linearGradient>
      </defs>
    </svg>
  )
}

export function KanguLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className={className}>
      <rect width="24" height="24" rx="6" fill="#FF4500" />
      <path d="M7 8H17V10H7V8ZM6 12H18V14H6V12ZM7 16H17V18H7V16Z" fill="#ffffff" />
    </svg>
  )
}

export function CorreiosLogo({ size = 26, className = '' }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 445.3 91.2"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="SVGID_1_correios" gradientUnits="userSpaceOnUse" x1="68.8418" y1="28.8938" x2="10.0538" y2="74.824">
          <stop offset="0" style={{ stopColor: '#FFDD00' }} />
          <stop offset="0.9" style={{ stopColor: '#D49F00' }} />
          <stop offset="1" style={{ stopColor: '#FFDD00' }} />
        </linearGradient>
        <linearGradient id="SVGID_2_correios" gradientUnits="userSpaceOnUse" x1="70.0161" y1="75.8603" x2="27.2177" y2="75.8603">
          <stop offset="0" style={{ stopColor: '#D49F00' }} />
          <stop offset="1" style={{ stopColor: '#AB5808' }} />
        </linearGradient>
        <linearGradient id="SVGID_3_correios" gradientUnits="userSpaceOnUse" x1="55.9278" y1="62.2183" x2="114.8193" y2="16.3725">
          <stop offset="0" style={{ stopColor: '#00537E' }} />
          <stop offset="0.9" style={{ stopColor: '#18AAE2' }} />
          <stop offset="1" style={{ stopColor: '#107BC0' }} />
        </linearGradient>
        <linearGradient id="SVGID_4_correios" gradientUnits="userSpaceOnUse" x1="91.8037" y1="-4.211" x2="66.7936" y2="15.329">
          <stop offset="0" style={{ stopColor: '#002542' }} />
          <stop offset="1" style={{ stopColor: '#004169' }} />
        </linearGradient>
      </defs>
      <path style={{ fillRule: 'evenodd', clipRule: 'evenodd', fill: 'url(#SVGID_1_correios)' }} d="M31.7,91.2h-4c-3.2,0-6.1-1.5-8-3.9L0.7,62.9C0.3,62.3,0,61.6,0,60.8c0-0.8,0.3-1.5,0.7-2.1l19.1-24.4c1.9-2.4,4.7-3.9,8-3.9H70l-24,30.1L28.5,82.6L31.7,91.2z" />
      <path style={{ fillRule: 'evenodd', clipRule: 'evenodd', fill: 'url(#SVGID_2_correios)' }} d="M46.3,60.8l-0.2-0.3L28.5,82.6c-0.7,0.9-1.3,2.1-1.3,4.1c0,2,1.9,4.5,5.7,4.5H70L46.3,60.8z" />
      <path style={{ fillRule: 'evenodd', clipRule: 'evenodd', fill: 'url(#SVGID_3_correios)' }} d="M96.3,8.6L93.1,0h4c3.2,0,6.1,1.5,8,3.9l19.1,24.4c0.4,0.6,0.7,1.3,0.7,2.1c0,0.8-0.3,1.5-0.7,2.1L105,56.9c-1.9,2.4-4.7,3.9-8,3.9H54.8l24-30.1L96.3,8.6z" />
      <path style={{ fillRule: 'evenodd', clipRule: 'evenodd', fill: 'url(#SVGID_4_correios)' }} d="M78.6,30.4l0.2,0.3L96.3,8.6c0.7-0.9,1.3-2.1,1.3-4.1c0-2-1.9-4.5-5.7-4.5H54.8L78.6,30.4z" />
      <path fill="#0BBBEF" d="M97.3,8.2c0.7-0.9,1.1-1.9,1.1-3.1c0-2.8-2.3-5.1-5.1-5.1H92C94.8,0,97,2.3,97,5.1c0,1.2-0.4,2.3-1.1,3.1L78.6,30.4L54.9,60.7L97.3,8.2z" />
      <path fill="#FFD500" d="M27.6,83c-0.7,0.9-1.1,1.9-1.1,3.1c0,2.8,2.3,5.1,5.1,5.1h1.3c-2.8,0-5.1-2.3-5.1-5.1c0-1.2,0.4-2.3,1.1-3.1l17.4-22.2L70,30.5L27.6,83z" />
    </svg>
  )
}

export function IntegrationLogoRenderer({
  code,
  size = 24,
  className = ''
}: {
  code: string
  size?: number
  className?: string
}) {
  const c = code.toLowerCase()
  if (c.includes('mercado') || c.includes('meli') || c.includes('ml') || c.includes('mercadolivre')) return <MercadoLivreLogo size={size} className={className} />
  if (c.includes('shopee')) return <ShopeeLogo size={size} className={className} />
  if (c.includes('amazon')) return <AmazonLogo size={size} className={className} />
  if (c.includes('magalu') || c.includes('magazine')) return <MagaluLogo size={size} className={className} />
  if (c.includes('whats') || c.includes('zap')) return <WhatsAppLogo size={size} className={className} />
  if (c.includes('pago') || c.includes('mercado_pago') || c.includes('mercado-pago')) return <MercadoPagoLogo size={size} className={className} />
  if (c.includes('asaas')) return <AsaasLogo size={size} className={className} />
  if (c.includes('focus') || c.includes('nfe')) return <FocusNfeLogo size={size} className={className} />
  if (c.includes('melhor') || c.includes('envio')) return <MelhorEnvioLogo size={size} className={className} />
  if (c.includes('bling')) return <BlingLogo size={size} className={className} />
  if (c.includes('stripe')) return <StripeLogo size={size} className={className} />
  if (c.includes('pagar') || c.includes('pagarme')) return <PagarMeLogo size={size} className={className} />
  if (c.includes('enotas')) return <EnotasLogo size={size} className={className} />
  if (c.includes('frenet')) return <FrenetLogo size={size} className={className} />
  if (c.includes('kangu')) return <KanguLogo size={size} className={className} />
  if (c.includes('correios')) return <CorreiosLogo size={size} className={className} />
  return <MercadoLivreLogo size={size} className={className} />
}
