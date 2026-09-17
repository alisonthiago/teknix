import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Remove acentos, caracteres diacríticos e converte para minúsculas
 */
export function normalizeSearch(text: string): string {
  return (text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

/**
 * Verifica se os campos contêm todas as palavras/termos da busca
 * Suporta busca por múltiplos termos sem ordem fixa e sem sensibilidade a acentos
 */
export function matchesSearchQuery(
  fields: (string | number | null | undefined)[],
  query: string
): boolean {
  if (!query) return true
  const normQuery = normalizeSearch(query)
  if (!normQuery) return true

  const tokens = normQuery.split(/\s+/).filter(Boolean)
  const haystack = normalizeSearch(fields.filter(Boolean).join(' '))

  return tokens.every(token => haystack.includes(token))
}

/**
 * Resume títulos longos e redundantes de produtos de marketplace para apresentação visual
 * Adiciona reticências (...) para indicar claramente que o nome foi apenas abreviado visualmente
 * sem alterar o cadastro oficial no banco de dados.
 */
export function summarizeProductName(fullName: string | null | undefined, maxChars: number = 37): string {
  if (!fullName) return 'Produto sem título'
  
  // Limpeza de sufixos comuns de marketplace
  let cleaned = fullName
    .replace(/\s*-\s*Remover dos favoritos\s*$/i, '')
    .replace(/\s*-\s*Mercado Livre.*$/i, '')
    .replace(/\s*-\s*Pronta Entrega.*$/i, '')
    .replace(/\s*-\s*Envio Imediato.*$/i, '')
    .replace(/\s*-\s*Com Nfe?.*$/i, '')
    .replace(/\s*-\s*Nota Fiscal.*$/i, '')
    .trim()

  if (cleaned.length <= maxChars) return cleaned

  const words = cleaned.split(/\s+/)
  let current = ''
  for (const word of words) {
    const next = current ? `${current} ${word}` : word
    if (next.length > maxChars && current.length >= 15) {
      break
    }
    current = next
  }

  const truncated = (current || cleaned.slice(0, maxChars)).trim()
  return truncated.length < cleaned.length ? `${truncated}...` : truncated
}


