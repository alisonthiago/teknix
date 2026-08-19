const logoFiles: Record<string, string> = {
  'Mercado Livre': '/logos/mercado-livre.svg',
  'Shopee': '/logos/shopee.svg',
  'TikTok Shop': '/logos/tiktok.svg',
  'Amazon': '/logos/amazon.svg',
  'Extra': '/logos/extra.svg',
  'Magalu': '/logos/magalu.svg',
}

export function MarketplaceLogo({ name, className = 'w-5 h-5' }: { name: string; className?: string }) {
  const src = logoFiles[name]
  if (!src) {
    return (
      <div className={`${className} rounded bg-[#f5f5f5] flex items-center justify-center flex-shrink-0`}>
        <span className="text-[8px] font-bold text-[#999]">{name[0]}</span>
      </div>
    )
  }
  // Removed disable
  return <img src={src} alt={name} className={`${className} object-contain flex-shrink-0`} />
}
