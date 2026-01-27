import { checkRateLimit, resetRateLimits } from '../rate-limiter'

// Mock Request constructor
class MockRequest {
  headers: Map<string, string>
  url: string

  constructor(url: string, headers: Record<string, string> = {}) {
    this.url = url
    this.headers = new Map(Object.entries(headers))
  }

  get(key: string): string | null {
    return this.headers.get(key) || null
  }
}

describe('checkRateLimit', () => {
  beforeEach(() => {
    // Reset rate limits before each test
    resetRateLimits()
  })

  describe('Auth Rate Limiting (5 req/min)', () => {
    it('allows requests within limit', async () => {
      const request = new MockRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': '192.168.1.1',
      })

      const results = []
      for (let i = 0; i < 5; i++) {
        const result = await checkRateLimit(request as any, 'auth')
        results.push(result.success)
      }

      expect(results).toEqual([true, true, true, true, true])
    })

    it('blocks 6th request within window', async () => {
      const request = new MockRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': '192.168.1.1',
      })

      // Make 5 allowed requests
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(request as any, 'auth')
      }

      // 6th request should be blocked
      const result = await checkRateLimit(request as any, 'auth')
      expect(result.success).toBe(false)
    })

    it('returns correct rate limit headers when allowed', async () => {
      const request = new MockRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': '192.168.1.1',
      })

      const result = await checkRateLimit(request as any, 'auth')

      expect(result.headers).toHaveProperty('X-RateLimit-Limit')
      expect(result.headers).toHaveProperty('X-RateLimit-Remaining')
      expect(result.headers).toHaveProperty('X-RateLimit-Reset')
      expect(result.headers['X-RateLimit-Limit']).toBe('5')
      expect(result.headers['X-RateLimit-Remaining']).toBe('4')
    })

    it('returns Retry-After header when blocked', async () => {
      const request = new MockRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': '192.168.1.1',
      })

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(request as any, 'auth')
      }

      const result = await checkRateLimit(request as any, 'auth')
      expect(result.success).toBe(false)
      expect(result.headers).toHaveProperty('Retry-After')
      expect(parseInt(result.headers['Retry-After'])).toBeGreaterThan(0)
    })
  })

  describe('API Rate Limiting (100 req/min)', () => {
    it('allows higher volume for data endpoints', async () => {
      const request = new MockRequest('http://localhost/api/cars', {
        'x-forwarded-for': '192.168.1.1',
      })

      const results = []
      for (let i = 0; i < 100; i++) {
        const result = await checkRateLimit(request as any, 'api')
        results.push(result.success)
      }

      expect(results.every((r) => r === true)).toBe(true)
    })

    it('blocks 101st request', async () => {
      const request = new MockRequest('http://localhost/api/cars', {
        'x-forwarded-for': '192.168.1.1',
      })

      // Make 100 allowed requests
      for (let i = 0; i < 100; i++) {
        await checkRateLimit(request as any, 'api')
      }

      // 101st should be blocked
      const result = await checkRateLimit(request as any, 'api')
      expect(result.success).toBe(false)
    })

    it('returns correct limit in headers', async () => {
      const request = new MockRequest('http://localhost/api/cars', {
        'x-forwarded-for': '192.168.1.1',
      })

      const result = await checkRateLimit(request as any, 'api')
      expect(result.headers['X-RateLimit-Limit']).toBe('100')
    })
  })

  describe('Identifier Strategy', () => {
    it('uses IP address for anonymous requests', async () => {
      const request1 = new MockRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': '192.168.1.1',
      })
      const request2 = new MockRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': '192.168.1.2',
      })

      // Each IP gets separate limit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(request1 as any, 'auth')
      }

      // Different IP should still be allowed
      const result = await checkRateLimit(request2 as any, 'auth')
      expect(result.success).toBe(true)
    })

    it('handles missing x-forwarded-for header', async () => {
      const request = new MockRequest('http://localhost/api/auth/login', {})

      const result = await checkRateLimit(request as any, 'auth')
      expect(result.success).toBe(true)
    })

    it('uses first IP from x-forwarded-for chain', async () => {
      const request = new MockRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': '192.168.1.1, 10.0.0.1, 172.16.0.1',
      })

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(request as any, 'auth')
      }

      // Same first IP should be blocked
      const blockedRequest = new MockRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': '192.168.1.1, 10.0.0.2',
      })
      const result = await checkRateLimit(blockedRequest as any, 'auth')
      expect(result.success).toBe(false)
    })
  })

  describe('Sliding Window', () => {
    it('allows new requests after window expires', async () => {
      jest.useFakeTimers()

      const request = new MockRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': '192.168.1.1',
      })

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(request as any, 'auth')
      }

      // Should be blocked
      let result = await checkRateLimit(request as any, 'auth')
      expect(result.success).toBe(false)

      // Advance time by 61 seconds (past 60s window)
      jest.advanceTimersByTime(61000)

      // Should be allowed again
      result = await checkRateLimit(request as any, 'auth')
      expect(result.success).toBe(true)

      jest.useRealTimers()
    })

    it('keeps old requests in window', async () => {
      jest.useFakeTimers()

      const request = new MockRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': '192.168.1.1',
      })

      // Make 3 requests
      for (let i = 0; i < 3; i++) {
        await checkRateLimit(request as any, 'auth')
      }

      // Advance time by 30 seconds (within window)
      jest.advanceTimersByTime(30000)

      // Make 2 more requests (total 5)
      for (let i = 0; i < 2; i++) {
        await checkRateLimit(request as any, 'auth')
      }

      // 6th should be blocked (first 3 still in window)
      const result = await checkRateLimit(request as any, 'auth')
      expect(result.success).toBe(false)

      jest.useRealTimers()
    })
  })

  describe('LRU Cache Cleanup', () => {
    it('limits tracked identifiers to 500', async () => {
      // Create 501 unique IPs
      for (let i = 0; i < 501; i++) {
        const request = new MockRequest('http://localhost/api/auth/login', {
          'x-forwarded-for': `192.168.${Math.floor(i / 256)}.${i % 256}`,
        })
        await checkRateLimit(request as any, 'auth')
      }

      // First IP should have been evicted (LRU)
      const oldestRequest = new MockRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': '192.168.0.0',
      })

      // Should be treated as new (full limit available)
      const result = await checkRateLimit(oldestRequest as any, 'auth')
      expect(result.success).toBe(true)
      expect(result.headers['X-RateLimit-Remaining']).toBe('4') // Used 1 just now
    })
  })

  describe('Concurrent Requests', () => {
    it('handles concurrent requests correctly', async () => {
      const request = new MockRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': '192.168.1.1',
      })

      // Make 10 concurrent requests
      const promises = Array(10)
        .fill(null)
        .map(() => checkRateLimit(request as any, 'auth'))

      const results = await Promise.all(promises)
      const successCount = results.filter((r) => r.success).length

      // Only first 5 should succeed
      expect(successCount).toBe(5)
    })
  })

  describe('Rate Limit Reset', () => {
    it('resets all rate limits', async () => {
      const request = new MockRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': '192.168.1.1',
      })

      // Exhaust limit
      for (let i = 0; i < 5; i++) {
        await checkRateLimit(request as any, 'auth')
      }

      // Should be blocked
      let result = await checkRateLimit(request as any, 'auth')
      expect(result.success).toBe(false)

      // Reset
      resetRateLimits()

      // Should be allowed again
      result = await checkRateLimit(request as any, 'auth')
      expect(result.success).toBe(true)
    })
  })

  describe('Edge Cases', () => {
    it('handles request without headers', async () => {
      const request = new MockRequest('http://localhost/api/auth/login')

      const result = await checkRateLimit(request as any, 'auth')
      expect(result.success).toBe(true)
    })

    it('handles malformed x-forwarded-for', async () => {
      const request = new MockRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': 'not-an-ip',
      })

      const result = await checkRateLimit(request as any, 'auth')
      expect(result.success).toBe(true)
    })

    it('returns consistent timestamp in reset header', async () => {
      const request = new MockRequest('http://localhost/api/auth/login', {
        'x-forwarded-for': '192.168.1.1',
      })

      const result1 = await checkRateLimit(request as any, 'auth')
      const result2 = await checkRateLimit(request as any, 'auth')

      // Reset time should be approximately the same (within 1 second)
      const reset1 = parseInt(result1.headers['X-RateLimit-Reset'])
      const reset2 = parseInt(result2.headers['X-RateLimit-Reset'])
      expect(Math.abs(reset1 - reset2)).toBeLessThan(1000)
    })
  })
})
