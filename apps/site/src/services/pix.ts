/* ==========================================================================
   TEKNIX MONOREPO — OFFICIAL PIX BR CODE ENGINE (BANCO CENTRAL DO BRASIL)
   Conforme Resolução BCB nº 1/2020 e Manual de Padrões de Iniciação do Pix.
   Gera payload EMVCo 100% compatível com TODOS os bancos brasileiros
   (Nubank, Itaú, Bradesco, Santander, Banco do Brasil, Inter, C6, PicPay, etc.)
   ========================================================================== */

/**
 * Formata um campo no padrão EMVCo: Tag (2 dígitos) + Tamanho (2 dígitos) + Valor
 */
function formatEMV(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${id}${len}${value}`
}

/**
 * Calcula o CRC16-CCITT (Polinômio 0x1021, Init 0xFFFF) exigido pelo Banco Central
 */
export function crc16CCITT(payload: string): string {
  let crc = 0xFFFF
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xFFFF
      } else {
        crc = (crc << 1) & 0xFFFF
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export interface PixBRCodeOptions {
  pixKey?: string
  merchantName?: string
  merchantCity?: string
  amount?: number
  txId?: string
}

export const DEFAULT_STORE_PIX_KEY = 'alisonsilvathiago@gmail.com'
export const DEFAULT_STORE_MERCHANT_NAME = 'TEKNIX'
export const DEFAULT_STORE_MERCHANT_CITY = 'SAO PAULO'

/**
 * Gera o payload oficial BR Code (Pix Copia e Cola)
 */
export function generatePixBRCode(options: PixBRCodeOptions = {}): string {
  const pixKey = (options.pixKey || DEFAULT_STORE_PIX_KEY).trim()
  const merchantName = (options.merchantName || DEFAULT_STORE_MERCHANT_NAME).trim()
  const merchantCity = (options.merchantCity || DEFAULT_STORE_MERCHANT_CITY).trim()
  const amount = options.amount
  const txId = (options.txId || '***').trim()

  // 00: Payload Format Indicator (Fixo '01')
  let payload = formatEMV('00', '01')

  // 26: Merchant Account Information (Pix)
  // Sub-tag 00: GUI do Banco Central ('br.gov.bcb.pix')
  // Sub-tag 01: Chave Pix (E-mail, CPF, CNPJ, Telefone ou EVP)
  const gui = formatEMV('00', 'br.gov.bcb.pix')
  const key = formatEMV('01', pixKey)
  payload += formatEMV('26', `${gui}${key}`)

  // 52: Merchant Category Code ('0000' = default)
  payload += formatEMV('52', '0000')

  // 53: Transaction Currency ('986' = BRL)
  payload += formatEMV('53', '986')

  // 54: Transaction Amount (opcional, formatado com 2 casas decimais)
  if (amount && amount > 0) {
    payload += formatEMV('54', amount.toFixed(2))
  }

  // 58: Country Code ('BR')
  payload += formatEMV('58', 'BR')

  // 59: Merchant Name (máximo 25 caracteres, sem acentos conforme norma EMVCo)
  const cleanName = merchantName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 25)
  payload += formatEMV('59', cleanName)

  // 60: Merchant City (máximo 15 caracteres, sem acentos)
  const cleanCity = merchantCity
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 15)
  payload += formatEMV('60', cleanCity)

  // 62: Additional Data Field Template
  // Sub-tag 05: Reference Label / TxID (máx 25 alfanuméricos ou '***')
  const cleanTxId = (txId.replace(/[^A-Za-z0-9]/g, '') || '***').slice(0, 25)
  const refLabel = formatEMV('05', cleanTxId)
  payload += formatEMV('62', refLabel)

  // 63: CRC16 (Tag '63' + Tamanho '04' + Checksum calculado)
  payload += '6304'
  const checksum = crc16CCITT(payload)
  return `${payload}${checksum}`
}

/**
 * Valida se um código Pix Copia e Cola possui formato EMVCo e CRC16 válidos
 */
export function isValidPixPayload(code: string): boolean {
  if (!code || typeof code !== 'string' || code.length < 30) return false
  if (!code.startsWith('000201')) return false
  if (!code.includes('br.gov.bcb.pix')) return false

  const crcIndex = code.lastIndexOf('6304')
  if (crcIndex === -1 || crcIndex + 8 !== code.length) return false

  const payloadWithoutCrc = code.substring(0, crcIndex + 4)
  const providedCrc = code.substring(crcIndex + 4)
  const calculatedCrc = crc16CCITT(payloadWithoutCrc)

  return providedCrc.toUpperCase() === calculatedCrc.toUpperCase()
}
