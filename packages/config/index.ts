export * from './src/index'

export const config = {
  whatsapp: {
    number: '5511999999999',
    get link() {
      return `https://wa.me/${this.number}`
    },
    getMessage(product?: { name: string; sku?: string; slug?: string }) {
      if (!product) {
        return encodeURIComponent('Olá! Vim pelo site Teknix e gostaria de mais informações.')
      }
      const url = product.slug ? `${window.location.origin}/produtos/${product.slug}` : ''
      return encodeURIComponent(
        `Olá! Tenho interesse no produto:\n\n` +
        `*${product.name}*\n` +
        (product.sku ? `SKU: ${product.sku}\n` : '') +
        (url ? `Link: ${url}` : '')
      )
    }
  },
  site: {
    name: 'TEKNIX',
    tagline: 'Feito para fazer.',
    description: 'Produtos profissionais com a qualidade que você precisa.',
    url: 'https://teknixbrasil.com.br',
  },
  colors: {
    green: '#B5F500',
    dark: '#1f2328',
    gray: '#666666',
    light: '#f5f5f5',
    lighter: '#eeeeee',
    border: '#e6e6e6',
  }
}
