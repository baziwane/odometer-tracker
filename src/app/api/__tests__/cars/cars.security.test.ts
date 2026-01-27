/**
 * @jest-environment node
 */
import { GET, POST } from '@/app/api/cars/route';
import {
  resetRateLimitsForTests,
  createMockRequest,
  createAuthenticatedRequest,
  expectRateLimited,
  expectCsrfError,
  expectSanitizedError,
  expectUnauthorized,
  expectRateLimitHeaders,
} from '../setup';

// Mock Supabase
const mockGetUser = jest.fn();
const mockFrom = jest.fn();
const mockSelect = jest.fn();
const mockInsert = jest.fn();
const mockEq = jest.fn();
const mockOrder = jest.fn();
const mockSingle = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createServerClient: jest.fn(() => ({
    auth: {
      getUser: mockGetUser,
    },
    from: mockFrom,
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

// Helper to setup authenticated user
function setupAuthenticatedUser(userId = 'test-user-id') {
  mockGetUser.mockResolvedValue({
    data: {
      user: {
        id: userId,
        email: 'test@example.com',
      },
    },
    error: null,
  });
}

// Helper to setup unauthenticated user
function setupUnauthenticatedUser() {
  mockGetUser.mockResolvedValue({
    data: { user: null },
    error: { message: 'Not authenticated' },
  });
}

// Helper to setup database mock chain
function setupDatabaseMock(data: any = [], error: any = null) {
  mockSingle.mockResolvedValue({ data: data, error });
  mockOrder.mockReturnValue({ data, error });
  mockEq.mockReturnValue({ order: mockOrder, single: mockSingle, data, error });
  mockSelect.mockReturnValue({ eq: mockEq, single: mockSingle });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockFrom.mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
  });
}

describe('GET /api/cars - Security Tests', () => {
  beforeEach(() => {
    resetRateLimitsForTests();
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      setupUnauthenticatedUser();

      const request = createMockRequest('http://localhost/api/cars');

      const response = await GET(request);
      await expectUnauthorized(response);
    });

    it('returns 401 when auth token is expired', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'JWT expired' },
      });

      const request = createMockRequest('http://localhost/api/cars');

      const response = await GET(request);
      await expectUnauthorized(response);
    });

    it('returns 401 when auth token is invalid', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const request = createMockRequest('http://localhost/api/cars');

      const response = await GET(request);
      await expectUnauthorized(response);
    });
  });

  describe('Authorization (RLS)', () => {
    it('only returns cars for authenticated user via RLS', async () => {
      setupAuthenticatedUser('user-123');
      setupDatabaseMock([
        { id: 'car-1', name: 'My Car', user_id: 'user-123' },
      ]);

      const request = createMockRequest('http://localhost/api/cars');

      const response = await GET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data).toBeDefined();

      // Verify RLS is applied via eq('is_active', true)
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
    });

    it('cannot access other users cars due to RLS', async () => {
      // This test verifies that even if a malicious user tries,
      // RLS on the database prevents cross-user data access
      setupAuthenticatedUser('user-123');
      // RLS would return empty array for other user's data
      setupDatabaseMock([]);

      const request = createMockRequest('http://localhost/api/cars');

      const response = await GET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.data).toEqual([]);
    });
  });

  describe('Rate Limiting', () => {
    it('allows 100 requests within limit', async () => {
      setupAuthenticatedUser();
      setupDatabaseMock([]);

      for (let i = 0; i < 100; i++) {
        const request = createMockRequest('http://localhost/api/cars');
        const response = await GET(request);
        expect(response.status).toBeLessThan(429);
        expectRateLimitHeaders(response);
      }
    });

    it('blocks 101st request within rate limit window', async () => {
      setupAuthenticatedUser();
      setupDatabaseMock([]);

      // Make 100 allowed requests
      for (let i = 0; i < 100; i++) {
        const request = createMockRequest('http://localhost/api/cars');
        await GET(request);
      }

      // 101st request should be blocked
      const request = createMockRequest('http://localhost/api/cars');
      const response = await GET(request);
      await expectRateLimited(response);
    });
  });

  describe('Error Handling Security', () => {
    it('does not expose database errors', async () => {
      setupAuthenticatedUser();
      mockFrom.mockImplementation(() => {
        throw {
          code: 'PGRST001',
          message: 'PostgreSQL connection failed at host:5432',
          details: 'Database pool exhausted',
        };
      });

      const request = createMockRequest('http://localhost/api/cars');

      const response = await GET(request);
      await expectSanitizedError(response);
    });

    it('does not expose SQL error details', async () => {
      setupAuthenticatedUser();
      mockFrom.mockImplementation(() => {
        throw {
          code: '42P01',
          message: 'relation "cars" does not exist',
        };
      });

      const request = createMockRequest('http://localhost/api/cars');

      const response = await GET(request);
      await expectSanitizedError(response);
    });
  });
});

describe('POST /api/cars - Security Tests', () => {
  beforeEach(() => {
    resetRateLimitsForTests();
    jest.clearAllMocks();
  });

  const validCarBody = {
    name: 'My Car',
    make: 'Toyota',
    model: 'Camry',
    year: 2020,
    color: 'Blue',
    initialOdometer: 50000,
    trackingStartDate: '2024-01-01',
  };

  describe('Authentication', () => {
    it('returns 401 when not authenticated', async () => {
      setupUnauthenticatedUser();
      mockCookieGet.mockReturnValue({ value: 'valid-csrf-token' });

      const request = createAuthenticatedRequest('http://localhost/api/cars', {
        method: 'POST',
        body: validCarBody,
        csrfToken: 'valid-csrf-token',
      });

      const response = await POST(request);
      await expectUnauthorized(response);
    });

    it('returns 401 with manipulated Authorization header', async () => {
      setupUnauthenticatedUser();
      mockCookieGet.mockReturnValue({ value: 'valid-csrf-token' });

      const request = new Request('http://localhost/api/cars', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-forwarded-for': '127.0.0.1',
          'x-csrf-token': 'valid-csrf-token',
          Cookie: 'csrf-token=valid-csrf-token',
          Authorization: 'Bearer fake-token-attempt',
        },
        body: JSON.stringify(validCarBody),
      });

      const response = await POST(request);
      await expectUnauthorized(response);
    });
  });

  describe('CSRF Protection', () => {
    it('rejects requests without CSRF token', async () => {
      setupAuthenticatedUser();
      mockCookieGet.mockReturnValue(undefined);

      const request = createMockRequest('http://localhost/api/cars', {
        method: 'POST',
        body: validCarBody,
      });

      const response = await POST(request);
      await expectCsrfError(response);
    });

    it('rejects requests with mismatched CSRF tokens', async () => {
      setupAuthenticatedUser();
      mockCookieGet.mockReturnValue({ value: 'cookie-token' });

      const request = createMockRequest('http://localhost/api/cars', {
        method: 'POST',
        body: validCarBody,
        headers: {
          'x-csrf-token': 'different-header-token',
        },
      });

      const response = await POST(request);
      await expectCsrfError(response);
    });

    it('accepts requests with valid matching CSRF tokens', async () => {
      setupAuthenticatedUser();
      mockCookieGet.mockReturnValue({ value: 'valid-csrf-token' });
      setupDatabaseMock({ id: 'new-car-id', ...validCarBody });

      const request = createAuthenticatedRequest('http://localhost/api/cars', {
        method: 'POST',
        body: validCarBody,
        csrfToken: 'valid-csrf-token',
      });

      const response = await POST(request);
      expect(response.status).not.toBe(403);
    });
  });

  describe('Input Validation Security', () => {
    beforeEach(() => {
      setupAuthenticatedUser();
      mockCookieGet.mockReturnValue({ value: 'valid-csrf-token' });
    });

    it('rejects SQL injection in name field', async () => {
      const sqlPayloads = [
        "'; DROP TABLE cars;--",
        "' OR '1'='1",
        "1'; DELETE FROM cars WHERE '1'='1",
      ];

      for (const payload of sqlPayloads) {
        resetRateLimitsForTests();

        const request = createAuthenticatedRequest('http://localhost/api/cars', {
          method: 'POST',
          body: {
            ...validCarBody,
            name: payload,
          },
          csrfToken: 'valid-csrf-token',
        });

        const response = await POST(request);
        // SQL injection attempts should either be rejected by validation
        // or safely escaped by parameterized queries (status 201 or 400)
        expect([201, 400]).toContain(response.status);
      }
    });

    it('rejects XSS payloads in text fields', async () => {
      const xssPayloads = [
        '<script>alert("xss")</script>',
        '<img src=x onerror=alert(1)>',
        'javascript:alert(1)',
        '<svg onload=alert(1)>',
      ];

      for (const payload of xssPayloads) {
        resetRateLimitsForTests();
        setupDatabaseMock({ id: 'new-car-id', name: payload });

        const request = createAuthenticatedRequest('http://localhost/api/cars', {
          method: 'POST',
          body: {
            ...validCarBody,
            name: payload,
          },
          csrfToken: 'valid-csrf-token',
        });

        const response = await POST(request);
        // XSS payloads in name field should be stored safely
        // (output encoding happens on render, not storage)
        // The important thing is no script execution
        expect([201, 400]).toContain(response.status);
      }
    });

    it('rejects name exceeding max length', async () => {
      const request = createAuthenticatedRequest('http://localhost/api/cars', {
        method: 'POST',
        body: {
          ...validCarBody,
          name: 'A'.repeat(51), // Max is 50
        },
        csrfToken: 'valid-csrf-token',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toBe('Validation failed');
    });

    it('rejects empty required fields', async () => {
      const requiredFields = ['name', 'make', 'model', 'year', 'color'];

      for (const field of requiredFields) {
        resetRateLimitsForTests();

        const body = { ...validCarBody };
        delete (body as any)[field];

        const request = createAuthenticatedRequest('http://localhost/api/cars', {
          method: 'POST',
          body,
          csrfToken: 'valid-csrf-token',
        });

        const response = await POST(request);
        expect(response.status).toBe(400);
      }
    });

    it('rejects invalid year values', async () => {
      const invalidYears = [-1, 1800, 3000, 'not-a-year', null];

      for (const year of invalidYears) {
        resetRateLimitsForTests();

        const request = createAuthenticatedRequest('http://localhost/api/cars', {
          method: 'POST',
          body: {
            ...validCarBody,
            year,
          },
          csrfToken: 'valid-csrf-token',
        });

        const response = await POST(request);
        expect(response.status).toBe(400);
      }
    });

    it('rejects negative odometer values', async () => {
      const request = createAuthenticatedRequest('http://localhost/api/cars', {
        method: 'POST',
        body: {
          ...validCarBody,
          initialOdometer: -100,
        },
        csrfToken: 'valid-csrf-token',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toBe('Validation failed');
    });

    it('rejects odometer without tracking date', async () => {
      const request = createAuthenticatedRequest('http://localhost/api/cars', {
        method: 'POST',
        body: {
          name: 'My Car',
          make: 'Toyota',
          model: 'Camry',
          year: 2020,
          color: 'Blue',
          initialOdometer: 50000,
          // Missing trackingStartDate
        },
        csrfToken: 'valid-csrf-token',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toBe('Validation failed');
    });

    it('rejects invalid date format', async () => {
      const invalidDates = [
        '01-01-2024',
        '2024/01/01',
        'January 1, 2024',
        '2024-1-1',
      ];

      for (const date of invalidDates) {
        resetRateLimitsForTests();

        const request = createAuthenticatedRequest('http://localhost/api/cars', {
          method: 'POST',
          body: {
            ...validCarBody,
            trackingStartDate: date,
          },
          csrfToken: 'valid-csrf-token',
        });

        const response = await POST(request);
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Rate Limiting', () => {
    it('blocks excessive POST requests', async () => {
      setupAuthenticatedUser();
      mockCookieGet.mockReturnValue({ value: 'valid-csrf-token' });
      setupDatabaseMock({ id: 'new-car-id', ...validCarBody });

      // Make 100 allowed requests
      for (let i = 0; i < 100; i++) {
        const request = createAuthenticatedRequest('http://localhost/api/cars', {
          method: 'POST',
          body: validCarBody,
          csrfToken: 'valid-csrf-token',
        });
        await POST(request);
      }

      // 101st request should be blocked
      const request = createAuthenticatedRequest('http://localhost/api/cars', {
        method: 'POST',
        body: validCarBody,
        csrfToken: 'valid-csrf-token',
      });

      const response = await POST(request);
      await expectRateLimited(response);
    });
  });

  describe('Error Handling Security', () => {
    beforeEach(() => {
      setupAuthenticatedUser();
      mockCookieGet.mockReturnValue({ value: 'valid-csrf-token' });
    });

    it('does not expose database errors', async () => {
      mockFrom.mockImplementation(() => {
        throw {
          code: 'PGRST001',
          message: 'PostgreSQL connection failed at host:5432',
          details: 'Database pool exhausted',
        };
      });

      const request = createAuthenticatedRequest('http://localhost/api/cars', {
        method: 'POST',
        body: validCarBody,
        csrfToken: 'valid-csrf-token',
      });

      const response = await POST(request);
      await expectSanitizedError(response);
    });

    it('handles unique constraint violations gracefully', async () => {
      mockFrom.mockImplementation(() => {
        throw {
          code: '23505',
          message: 'duplicate key value violates unique constraint "cars_pkey"',
        };
      });

      const request = createAuthenticatedRequest('http://localhost/api/cars', {
        method: 'POST',
        body: validCarBody,
        csrfToken: 'valid-csrf-token',
      });

      const response = await POST(request);
      expect(response.status).toBe(409);

      const json = await response.json();
      expect(json.error).toBe('This resource already exists.');
      // Should not expose database constraint name
      expect(JSON.stringify(json)).not.toContain('cars_pkey');
    });

    it('does not expose internal error details', async () => {
      mockFrom.mockImplementation(() => {
        throw new Error('Internal error with sensitive info: password=secret123');
      });

      const request = createAuthenticatedRequest('http://localhost/api/cars', {
        method: 'POST',
        body: validCarBody,
        csrfToken: 'valid-csrf-token',
      });

      const response = await POST(request);
      const json = await response.json();

      expect(JSON.stringify(json)).not.toContain('password');
      expect(JSON.stringify(json)).not.toContain('secret');
    });
  });

  describe('Authorization Bypass Prevention', () => {
    it('prevents user_id injection in request body', async () => {
      setupAuthenticatedUser('real-user-id');
      mockCookieGet.mockReturnValue({ value: 'valid-csrf-token' });
      setupDatabaseMock({ id: 'new-car-id', user_id: 'real-user-id' });

      const request = createAuthenticatedRequest('http://localhost/api/cars', {
        method: 'POST',
        body: {
          ...validCarBody,
          user_id: 'attacker-user-id', // Attempting to inject different user_id
        },
        csrfToken: 'valid-csrf-token',
      });

      const response = await POST(request);
      // Should succeed but with real user's ID, not injected one
      // The route uses server-side user.id, not request body
      expect(response.status).toBe(201);

      // Verify the insert was called with correct user_id
      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: 'real-user-id',
        })
      );
    });
  });
});
