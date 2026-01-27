import { cookies } from 'next/headers';

/**
 * CSRF token cookie name
 */
const CSRF_COOKIE_NAME = 'csrf-token';

/**
 * CSRF token header name
 */
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Generate a random CSRF token
 * Uses crypto.randomUUID for cryptographically secure token generation
 *
 * @returns A random UUID string
 */
export function generateCsrfToken(): string {
  return crypto.randomUUID();
}

/**
 * Set CSRF token in cookie
 * Should be called when establishing a session (e.g., GET /api/auth/session)
 *
 * @param token - The CSRF token to set
 *
 * @example
 * ```typescript
 * const token = generateCsrfToken();
 * setCsrfTokenCookie(token);
 * ```
 */
export function setCsrfTokenCookie(token: string): void {
  const cookieStore = cookies();

  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });
}

/**
 * Validate CSRF token from request
 * Uses double-submit cookie pattern:
 * - Token is stored in httpOnly cookie
 * - Client sends same token in X-CSRF-Token header
 * - Server validates both match
 *
 * @param request - The incoming request
 * @returns true if token is valid, false otherwise
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   if (!validateCsrfToken(request)) {
 *     return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
 *   }
 *   // ... handle request
 * }
 * ```
 */
export function validateCsrfToken(request: Request): boolean {
  try {
    const cookieStore = cookies();

    // Get token from cookie
    const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;
    if (!cookieToken) {
      return false;
    }

    // Get token from header
    const headerToken = request.headers.get(CSRF_HEADER_NAME);
    if (!headerToken) {
      return false;
    }

    // Validate tokens match
    return cookieToken === headerToken;
  } catch {
    return false;
  }
}

/**
 * Higher-order function to wrap route handlers with CSRF protection
 * Only validates for mutation methods (POST, PUT, PATCH, DELETE)
 *
 * @param handler - The route handler function to wrap
 * @returns Wrapped handler with CSRF protection
 *
 * @example
 * ```typescript
 * export const POST = withCsrfProtection(async (request: Request) => {
 *   // Handler code - CSRF already validated
 * });
 * ```
 */
export function withCsrfProtection<T extends (...args: any[]) => Promise<Response>>(
  handler: T
): T {
  return (async (...args: any[]) => {
    const request = args[0] as Request;
    const method = request.method;

    // Only validate for mutation methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      if (!validateCsrfToken(request)) {
        return new Response(
          JSON.stringify({ error: 'Invalid request' }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    return handler(...args);
  }) as T;
}
