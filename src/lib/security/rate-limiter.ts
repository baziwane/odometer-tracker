/**
 * Rate limit configurations
 */
export const RATE_LIMITS = {
  auth: { max: 5, interval: 60000 }, // 5 requests per minute for auth endpoints
  api: { max: 100, interval: 60000 }, // 100 requests per minute for data endpoints
  apiStrict: { max: 30, interval: 60000 }, // 30 requests per minute for expensive operations
} as const

export type RateLimitPreset = keyof typeof RATE_LIMITS

/**
 * Maximum number of unique identifiers to track in cache (LRU)
 */
const MAX_CACHE_SIZE = 500

/**
 * Request timestamp record
 */
interface RequestRecord {
  timestamps: number[]
  lastAccess: number
}

/**
 * In-memory LRU cache for rate limiting
 * Map<identifier, RequestRecord>
 */
const rateLimitCache = new Map<string, RequestRecord>()

/**
 * Extract identifier from request
 * Uses IP address for anonymous requests
 *
 * @param request - The incoming request
 * @returns Identifier string (IP address)
 */
function getIdentifier(request: Request): string {
  // Get IP from x-forwarded-for header (first IP in chain)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim())
    return ips[0] || 'unknown'
  }

  // Fallback to unknown (will still be rate limited, just grouped)
  return 'unknown'
}

/**
 * Clean up old timestamps outside the window
 *
 * @param timestamps - Array of request timestamps
 * @param interval - Time window in milliseconds
 * @returns Filtered array with only timestamps within window
 */
function cleanupOldTimestamps(timestamps: number[], interval: number): number[] {
  const now = Date.now()
  const windowStart = now - interval
  return timestamps.filter((ts) => ts > windowStart)
}

/**
 * Enforce LRU cache size limit
 * Removes least recently accessed entries
 */
function enforceCacheLimit(): void {
  if (rateLimitCache.size <= MAX_CACHE_SIZE) {
    return
  }

  // Sort entries by lastAccess (oldest first)
  const entries = Array.from(rateLimitCache.entries()).sort(
    ([, a], [, b]) => a.lastAccess - b.lastAccess
  )

  // Remove oldest entry
  const [oldestKey] = entries[0]
  rateLimitCache.delete(oldestKey)
}

/**
 * Check rate limit for a request
 *
 * Features:
 * - Sliding window algorithm for accurate rate limiting
 * - LRU cache with max 500 identifiers
 * - O(1) lookup time
 * - Returns standard rate limit headers
 * - Configurable presets for different endpoint types
 *
 * @param request - The incoming request
 * @param preset - Rate limit preset ('auth' | 'api' | 'apiStrict')
 * @returns Object with success flag and rate limit headers
 *
 * @example
 * ```typescript
 * const rateLimitResult = await checkRateLimit(request, 'auth')
 * if (!rateLimitResult.success) {
 *   return NextResponse.json(
 *     { error: 'Too many requests' },
 *     { status: 429, headers: rateLimitResult.headers }
 *   )
 * }
 * ```
 */
export async function checkRateLimit(
  request: Request,
  preset: RateLimitPreset
): Promise<{
  success: boolean
  headers: Record<string, string>
}> {
  const identifier = getIdentifier(request)
  const { max, interval } = RATE_LIMITS[preset]
  const now = Date.now()

  // Get or create record for this identifier
  let record = rateLimitCache.get(identifier)

  if (!record) {
    record = {
      timestamps: [],
      lastAccess: now,
    }
    rateLimitCache.set(identifier, record)
    enforceCacheLimit()
  }

  // Clean up old timestamps outside window
  record.timestamps = cleanupOldTimestamps(record.timestamps, interval)
  record.lastAccess = now

  // Calculate reset time (end of current window)
  const oldestTimestamp = record.timestamps[0] || now
  const resetTime = oldestTimestamp + interval

  // Check if within limit
  const remaining = Math.max(0, max - record.timestamps.length)
  const success = record.timestamps.length < max

  // Add current request timestamp if allowed
  if (success) {
    record.timestamps.push(now)
  }

  // Build rate limit headers
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': max.toString(),
    'X-RateLimit-Remaining': Math.max(0, remaining - (success ? 1 : 0)).toString(),
    'X-RateLimit-Reset': resetTime.toString(),
  }

  // Add Retry-After header if blocked
  if (!success) {
    const retryAfter = Math.ceil((resetTime - now) / 1000)
    headers['Retry-After'] = retryAfter.toString()
  }

  return {
    success,
    headers,
  }
}

/**
 * Reset all rate limits (useful for testing)
 */
export function resetRateLimits(): void {
  rateLimitCache.clear()
}
