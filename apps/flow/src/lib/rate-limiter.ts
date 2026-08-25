/**
 * In-Memory Sliding Window Rate Limiter for Next.js API Routes & Actions
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

const ipMap = new Map<string, RateLimitRecord>()

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, record] of ipMap.entries()) {
      if (now > record.resetTime) {
        ipMap.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitOptions {
  limit?: number
  windowMs?: number
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetInMs: number } {
  const limit = options.limit || 60 // 60 requests
  const windowMs = options.windowMs || 60 * 1000 // per 1 minute
  const now = Date.now()

  const record = ipMap.get(identifier)

  if (!record || now > record.resetTime) {
    ipMap.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: limit - 1, resetInMs: windowMs }
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetInMs: Math.max(0, record.resetTime - now)
    }
  }

  record.count += 1
  return {
    allowed: true,
    remaining: limit - record.count,
    resetInMs: Math.max(0, record.resetTime - now)
  }
}
