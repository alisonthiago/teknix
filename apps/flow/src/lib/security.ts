import crypto from 'crypto'

/**
 * TEKTOU Hardened Security Suite
 * 
 * Cryptographic operations, secret masking, log sanitization, and LGPD data protection.
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16

function getMasterKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || 'teknix-default-fallback-master-key-32b!'
  return crypto.createHash('sha256').update(secret).digest()
}

/**
 * Encrypt sensitive text (Access Tokens, Refresh Tokens, Secrets) using AES-256-GCM
 */
export function encryptSecret(plainText: string): string {
  if (!plainText) return ''
  try {
    const iv = crypto.randomBytes(IV_LENGTH)
    const key = getMasterKey()
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    let encrypted = cipher.update(plainText, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    const authTag = cipher.getAuthTag()

    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`
  } catch (err) {
    console.error('[Security] Falha na criptografia de segredo')
    return plainText
  }
}

/**
 * Decrypt AES-256-GCM encrypted text
 */
export function decryptSecret(encryptedPayload: string): string {
  if (!encryptedPayload || !encryptedPayload.includes(':')) return encryptedPayload
  try {
    const [ivHex, authTagHex, encryptedText] = encryptedPayload.split(':')
    if (!ivHex || !authTagHex || !encryptedText) return encryptedPayload

    const iv = Buffer.from(ivHex, 'hex')
    const authTag = Buffer.from(authTagHex, 'hex')
    const key = getMasterKey()

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    return decrypted
  } catch (err) {
    // If it wasn't encrypted or decryption failed, return original safely
    return encryptedPayload
  }
}

/**
 * LGPD Data Masking Utilities
 */
export function maskEmail(email?: string | null): string {
  if (!email || !email.includes('@')) return '—'
  const [user, domain] = email.split('@')
  if (user.length <= 2) return `${user[0]}***@${domain}`
  return `${user.slice(0, 2)}***${user.slice(-1)}@${domain}`
}

export function maskPhone(phone?: string | null): string {
  if (!phone) return '—'
  const clean = phone.replace(/\D/g, '')
  if (clean.length < 8) return '****-****'
  return clean.replace(/(\d{2})(\d{4,5})(\d{4})/, '($1) *****-$3')
}

export function maskCPF(cpf?: string | null): string {
  if (!cpf) return '—'
  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11) return '***.***.***-**'
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '***.$2.***-$4')
}

export function maskSecret(secret?: string | null): string {
  if (!secret) return '—'
  if (secret.length <= 8) return '********'
  return `${'*'.repeat(Math.max(8, secret.length - 4))}${secret.slice(-4)}`
}

/**
 * Safe Logger - Prevents accidental logging of secrets or tokens
 */
export function sanitizeLog(data: any): any {
  if (typeof data === 'string') {
    return data
      .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED]')
      .replace(/client_secret=["']?[A-Za-z0-9\-_.]+["']?/gi, 'client_secret="[REDACTED]"')
      .replace(/access_token=["']?[A-Za-z0-9\-_.]+["']?/gi, 'access_token="[REDACTED]"')
      .replace(/refresh_token=["']?[A-Za-z0-9\-_.]+["']?/gi, 'refresh_token="[REDACTED]"')
      .replace(/password=["']?[^"'\s]+["']?/gi, 'password="[REDACTED]"')
  }

  if (data && typeof data === 'object') {
    const clean: any = Array.isArray(data) ? [] : {}
    for (const key of Object.keys(data)) {
      const lowerKey = key.toLowerCase()
      if (
        lowerKey.includes('secret') || 
        lowerKey.includes('password') || 
        lowerKey.includes('token') || 
        lowerKey.includes('key') || 
        lowerKey.includes('auth')
      ) {
        clean[key] = '[REDACTED]'
      } else {
        clean[key] = sanitizeLog(data[key])
      }
    }
    return clean
  }

  return data
}
