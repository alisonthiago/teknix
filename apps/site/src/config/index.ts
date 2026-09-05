export const config = {
  whatsapp: {
    number: '5511999999999',
    get link() {
      return `https://wa.me/${this.number}`
    },
    getMessage(product?: { name: string; sku?: string; slug?: string }) {
      if (!product) {
        return encodeURIComponent('Olá! Vim pelo site Teknix Ferramentas e gostaria de mais informações.')
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
    name: 'TEKNIX FERRAMENTAS',
    tagline: 'Feito para fazer.',
    description: 'Ferramentas profissionais com a qualidade que você precisa para realizar qualquer projeto com excelência.',
    url: 'https://teknix.com.br',
  },
  colors: {
    green: '#B5F500',
    dark: '#0a0a0a',
    gray: '#1a1a1a',
    light: '#2a2a2a',
    lighter: '#3a3a3a',
    border: '#333333',
  }
}
