/**
 * @jest-environment node
 */
import { resetRateLimits } from '@/lib/security/rate-limiter';

/**
 * Mock authenticated user in Supabase
 */
export function mockAuthenticatedUser(userId: string = 'test-user-id') {
  const mockUser = {
    id: userId,
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  jest.mock('@/lib/supabase/server', () => ({
    createServerClient: jest.fn(() => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
        getSession: jest.fn().mockResolvedValue({
          data: {
            session: {
              user: mockUser,
              access_token: 'mock-token',
            },
          },
          error: null,
        }),
      },
      from: jest.fn(() => ({
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: {},
          error: null,
        }),
      })),
    })),
  }));

  return mockUser;
}

/**
 * Mock unauthenticated user in Supabase
 */
export function mockUnauthenticatedUser() {
  jest.mock('@/lib/supabase/server', () => ({
    createServerClient: jest.fn(() => ({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: { message: 'Not authenticated' },
        }),
        getSession: jest.fn().mockResolvedValue({
          data: { session: null },
          error: { message: 'No active session' },
        }),
      },
    })),
  }));
}

/**
 * Reset rate limits between tests
 */
export function resetRateLimitsForTests() {
  resetRateLimits();
}

/**
 * Create a mock Request object for testing
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Request {
  const {
    method = 'GET',
    body,
    headers = {},
  } = options;

  // Add default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'x-forwarded-for': '127.0.0.1',
    ...headers,
  };

  return new Request(url, {
    method,
    headers: defaultHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Create an authenticated request with CSRF token
 */
export function createAuthenticatedRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    csrfToken?: string;
  } = {}
): Request {
  const { method = 'GET', body, csrfToken = 'test-csrf-token' } = options;

  return createMockRequest(url, {
    method,
    body,
    headers: {
      'x-csrf-token': csrfToken,
      Cookie: `csrf-token=${csrfToken}`,
    },
  });
}

/**
 * Create an unauthenticated request (no CSRF token)
 */
export function createUnauthenticatedRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
  } = {}
): Request {
  return createMockRequest(url, options);
}

/**
 * Mock cookies for CSRF testing
 */
export function mockCookies(csrfToken?: string) {
  const mockCookieStore = {
    get: jest.fn((name: string) => {
      if (name === 'csrf-token' && csrfToken) {
        return { value: csrfToken };
      }
      return undefined;
    }),
    set: jest.fn(),
  };

  jest.mock('next/headers', () => ({
    cookies: jest.fn(() => mockCookieStore),
  }));

  return mockCookieStore;
}

/**
 * Verify response has correct rate limit headers
 */
export function expectRateLimitHeaders(response: Response) {
  expect(response.headers.get('X-RateLimit-Limit')).toBeDefined();
  expect(response.headers.get('X-RateLimit-Remaining')).toBeDefined();
  expect(response.headers.get('X-RateLimit-Reset')).toBeDefined();
}

/**
 * Verify response is rate limited
 */
export async function expectRateLimited(response: Response) {
  expect(response.status).toBe(429);
  const json = await response.json();
  expect(json.error).toContain('Too many requests');
  expect(response.headers.get('Retry-After')).toBeDefined();
}

/**
 * Verify response is unauthorized
 */
export async function expectUnauthorized(response: Response) {
  expect(response.status).toBe(401);
  const json = await response.json();
  expect(json.error).toBeDefined();
}

/**
 * Verify response has CSRF error
 */
export async function expectCsrfError(response: Response) {
  expect(response.status).toBe(403);
  const json = await response.json();
  expect(json.error).toContain('Invalid request');
}

/**
 * Verify response does not expose sensitive data
 */
export async function expectSanitizedError(response: Response) {
  const json = await response.json();

  // Should not contain database-specific error details
  const errorString = JSON.stringify(json).toLowerCase();
  expect(errorString).not.toContain('pgrst');
  expect(errorString).not.toContain('postgres');
  expect(errorString).not.toContain('database');
  expect(errorString).not.toContain('sql');
  expect(errorString).not.toContain('password');
  expect(errorString).not.toContain('secret');
}
