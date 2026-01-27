/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/login/route';
import {
  resetRateLimitsForTests,
  createMockRequest,
  createAuthenticatedRequest,
  expectRateLimited,
  expectCsrfError,
  expectSanitizedError,
  expectRateLimitHeaders,
} from '../setup';

// Mock Supabase
const mockSignInWithPassword = jest.fn();
jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
    },
  })),
}));

// Mock cookies for CSRF validation
const mockCookieGet = jest.fn();
jest.mock('next/headers', () => ({
  cookies: jest.fn(() => ({
    get: mockCookieGet,
    set: jest.fn(),
  })),
}));

describe('POST /api/auth/login - Security Tests', () => {
  beforeEach(() => {
    resetRateLimitsForTests();
    jest.clearAllMocks();
    mockSignInWithPassword.mockResolvedValue({
      data: {
        user: { id: 'test-user-id', email: 'test@example.com' },
        session: { access_token: 'test-token' },
      },
      error: null,
    });
  });

  describe('Rate Limiting', () => {
    it('allows 5 requests within limit', async () => {
      // Setup valid CSRF token
      mockCookieGet.mockReturnValue({ value: 'valid-csrf-token' });

      const validBody = {
        email: 'test@example.com',
        password: 'password123',
      };

      for (let i = 0; i < 5; i++) {
        const request = createAuthenticatedRequest(
          'http://localhost/api/auth/login',
          {
            method: 'POST',
            body: validBody,
            csrfToken: 'valid-csrf-token',
          }
        );

        const response = await POST(request);
        expect(response.status).toBeLessThan(429);
        expectRateLimitHeaders(response);
      }
    });

    it('blocks 6th request within rate limit window', async () => {
      mockCookieGet.mockReturnValue({ value: 'valid-csrf-token' });

      const validBody = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Make 5 allowed requests
      for (let i = 0; i < 5; i++) {
        const request = createAuthenticatedRequest(
          'http://localhost/api/auth/login',
          {
            method: 'POST',
            body: validBody,
            csrfToken: 'valid-csrf-token',
          }
        );
        await POST(request);
      }

      // 6th request should be blocked
      const request = createAuthenticatedRequest(
        'http://localhost/api/auth/login',
        {
          method: 'POST',
          body: validBody,
          csrfToken: 'valid-csrf-token',
        }
      );

      const response = await POST(request);
      await expectRateLimited(response);
    });

    it('includes Retry-After header when rate limited', async () => {
      mockCookieGet.mockReturnValue({ value: 'valid-csrf-token' });

      const validBody = {
        email: 'test@example.com',
        password: 'password123',
      };

      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        const request = createAuthenticatedRequest(
          'http://localhost/api/auth/login',
          {
            method: 'POST',
            body: validBody,
            csrfToken: 'valid-csrf-token',
          }
        );
        await POST(request);
      }

      // Check rate limited response
      const request = createAuthenticatedRequest(
        'http://localhost/api/auth/login',
        {
          method: 'POST',
          body: validBody,
          csrfToken: 'valid-csrf-token',
        }
      );

      const response = await POST(request);
      expect(response.headers.get('Retry-After')).toBeDefined();
      expect(parseInt(response.headers.get('Retry-After') || '0')).toBeGreaterThan(0);
    });
  });

  describe('CSRF Protection', () => {
    it('rejects requests without CSRF token', async () => {
      mockCookieGet.mockReturnValue(undefined);

      const request = createMockRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      });

      const response = await POST(request);
      await expectCsrfError(response);
    });

    it('rejects requests with mismatched CSRF tokens', async () => {
      mockCookieGet.mockReturnValue({ value: 'cookie-csrf-token' });

      const request = createMockRequest('http://localhost/api/auth/login', {
        method: 'POST',
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
        headers: {
          'x-csrf-token': 'different-header-token',
        },
      });

      const response = await POST(request);
      await expectCsrfError(response);
    });

    it('accepts requests with valid matching CSRF tokens', async () => {
      const csrfToken = 'valid-matching-token';
      mockCookieGet.mockReturnValue({ value: csrfToken });

      const request = createAuthenticatedRequest(
        'http://localhost/api/auth/login',
        {
          method: 'POST',
          body: {
            email: 'test@example.com',
            password: 'password123',
          },
          csrfToken,
        }
      );

      const response = await POST(request);
      expect(response.status).not.toBe(403);
    });
  });

  describe('Input Validation Security', () => {
    beforeEach(() => {
      mockCookieGet.mockReturnValue({ value: 'valid-csrf-token' });
    });

    it('rejects SQL injection in email field', async () => {
      const sqlInjectionPayloads = [
        "' OR '1'='1",
        "admin'--",
        "1'; DROP TABLE users;--",
        "' UNION SELECT * FROM users--",
      ];

      for (const payload of sqlInjectionPayloads) {
        resetRateLimitsForTests();

        const request = createAuthenticatedRequest(
          'http://localhost/api/auth/login',
          {
            method: 'POST',
            body: {
              email: payload,
              password: 'password123',
            },
            csrfToken: 'valid-csrf-token',
          }
        );

        const response = await POST(request);
        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json.error).toBe('Validation failed');
        expect(json.errors).toContainEqual(
          expect.objectContaining({
            field: 'email',
            message: 'Invalid email address',
          })
        );
      }
    });

    it('rejects XSS payloads in email field', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        'test@example.com<script>alert(1)</script>',
        '"><img src=x onerror=alert(1)>',
        "javascript:alert('XSS')",
      ];

      for (const payload of xssPayloads) {
        resetRateLimitsForTests();

        const request = createAuthenticatedRequest(
          'http://localhost/api/auth/login',
          {
            method: 'POST',
            body: {
              email: payload,
              password: 'password123',
            },
            csrfToken: 'valid-csrf-token',
          }
        );

        const response = await POST(request);
        expect(response.status).toBe(400);

        const json = await response.json();
        expect(json.error).toBe('Validation failed');
      }
    });

    it('rejects empty email', async () => {
      const request = createAuthenticatedRequest(
        'http://localhost/api/auth/login',
        {
          method: 'POST',
          body: {
            email: '',
            password: 'password123',
          },
          csrfToken: 'valid-csrf-token',
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toBe('Validation failed');
    });

    it('rejects empty password', async () => {
      const request = createAuthenticatedRequest(
        'http://localhost/api/auth/login',
        {
          method: 'POST',
          body: {
            email: 'test@example.com',
            password: '',
          },
          csrfToken: 'valid-csrf-token',
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toBe('Validation failed');
      expect(json.errors).toContainEqual(
        expect.objectContaining({
          field: 'password',
          message: 'Password is required',
        })
      );
    });

    it('rejects invalid JSON body', async () => {
      mockCookieGet.mockReturnValue({ value: 'valid-csrf-token' });

      const request = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
          'x-csrf-token': 'valid-csrf-token',
          Cookie: 'csrf-token=valid-csrf-token',
        },
        body: 'not valid json{{{',
      });

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });

  describe('Authentication Scenarios', () => {
    beforeEach(() => {
      mockCookieGet.mockReturnValue({ value: 'valid-csrf-token' });
    });

    it('returns 401 for invalid credentials', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const request = createAuthenticatedRequest(
        'http://localhost/api/auth/login',
        {
          method: 'POST',
          body: {
            email: 'test@example.com',
            password: 'wrongpassword',
          },
          csrfToken: 'valid-csrf-token',
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json.error).toBe('Invalid login credentials');
    });

    it('returns user data on successful login', async () => {
      const request = createAuthenticatedRequest(
        'http://localhost/api/auth/login',
        {
          method: 'POST',
          body: {
            email: 'test@example.com',
            password: 'password123',
          },
          csrfToken: 'valid-csrf-token',
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data.user).toBeDefined();
      expect(json.data.session).toBeDefined();
    });
  });

  describe('Error Handling Security', () => {
    beforeEach(() => {
      mockCookieGet.mockReturnValue({ value: 'valid-csrf-token' });
    });

    it('does not expose database errors', async () => {
      mockSignInWithPassword.mockRejectedValue({
        code: 'PGRST001',
        message: 'Connection to PostgreSQL database failed at host:5432',
        details: 'Internal database error with connection pool',
      });

      const request = createAuthenticatedRequest(
        'http://localhost/api/auth/login',
        {
          method: 'POST',
          body: {
            email: 'test@example.com',
            password: 'password123',
          },
          csrfToken: 'valid-csrf-token',
        }
      );

      const response = await POST(request);
      await expectSanitizedError(response);
    });

    it('does not expose stack traces', async () => {
      mockSignInWithPassword.mockRejectedValue(new Error('Internal error'));

      const request = createAuthenticatedRequest(
        'http://localhost/api/auth/login',
        {
          method: 'POST',
          body: {
            email: 'test@example.com',
            password: 'password123',
          },
          csrfToken: 'valid-csrf-token',
        }
      );

      const response = await POST(request);
      const json = await response.json();

      expect(JSON.stringify(json)).not.toContain('at ');
      expect(JSON.stringify(json)).not.toContain('Error:');
      expect(JSON.stringify(json)).not.toContain('.ts:');
      expect(JSON.stringify(json)).not.toContain('.js:');
    });

    it('returns generic error message for unexpected errors', async () => {
      mockSignInWithPassword.mockRejectedValue(new Error('Unexpected internal error'));

      const request = createAuthenticatedRequest(
        'http://localhost/api/auth/login',
        {
          method: 'POST',
          body: {
            email: 'test@example.com',
            password: 'password123',
          },
          csrfToken: 'valid-csrf-token',
        }
      );

      const response = await POST(request);
      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json.error).toBe('An unexpected error occurred. Please try again later.');
    });
  });

  describe('Timing Attack Prevention', () => {
    beforeEach(() => {
      mockCookieGet.mockReturnValue({ value: 'valid-csrf-token' });
    });

    it('returns consistent error for non-existent user', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const request = createAuthenticatedRequest(
        'http://localhost/api/auth/login',
        {
          method: 'POST',
          body: {
            email: 'nonexistent@example.com',
            password: 'password123',
          },
          csrfToken: 'valid-csrf-token',
        }
      );

      const response = await POST(request);
      const json = await response.json();

      // Should not reveal whether user exists
      expect(json.error).toBe('Invalid login credentials');
    });

    it('returns consistent error for wrong password', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid login credentials' },
      });

      const request = createAuthenticatedRequest(
        'http://localhost/api/auth/login',
        {
          method: 'POST',
          body: {
            email: 'existing@example.com',
            password: 'wrongpassword',
          },
          csrfToken: 'valid-csrf-token',
        }
      );

      const response = await POST(request);
      const json = await response.json();

      // Should use same error message as non-existent user
      expect(json.error).toBe('Invalid login credentials');
    });
  });
});
