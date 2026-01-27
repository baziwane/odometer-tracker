import { NextResponse } from 'next/server'
import { ZodError } from 'zod'

/**
 * Error code to HTTP status mapping
 */
const ERROR_STATUS_MAP: Record<string, number> = {
  PGRST116: 404, // Supabase: No rows returned
  '23505': 409, // PostgreSQL: Unique constraint violation
  '23514': 400, // PostgreSQL: Check constraint violation
  '23503': 400, // PostgreSQL: Foreign key violation
  '42P01': 500, // PostgreSQL: Undefined table (should not happen in production)
}

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  PGRST116: 'The requested resource was not found.',
  '23505': 'This resource already exists.',
  '23514': 'The provided data is invalid.',
  '23503': 'The operation references data that does not exist.',
}

/**
 * Check if error is a Supabase/PostgreSQL error with a code
 */
function isDatabaseError(error: unknown): error is { code: string; message?: string; details?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as any).code === 'string'
  )
}

/**
 * Check if error is a Zod validation error
 */
function isZodError(error: unknown): error is ZodError {
  return error instanceof ZodError
}

/**
 * Format Zod errors for API response
 */
function formatZodErrors(error: ZodError) {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }))
}

/**
 * Centralized error handler for API routes
 *
 * Features:
 * - Sanitizes database errors to prevent information leakage
 * - Preserves Zod validation errors (safe to expose)
 * - Maps error types to appropriate HTTP status codes
 * - Logs full error details server-side
 * - Returns user-friendly error messages
 *
 * @param error - The error to handle
 * @param context - Context string for logging (e.g., "GET /api/cars")
 * @returns NextResponse with sanitized error
 *
 * @example
 * ```typescript
 * try {
 *   const data = await supabase.from('cars').select()
 *   return NextResponse.json({ data })
 * } catch (error) {
 *   return handleApiError(error, 'GET /api/cars')
 * }
 * ```
 */
export function handleApiError(error: unknown, context: string): NextResponse {
  // Log full error server-side with timestamp and context
  const timestamp = new Date().toISOString()
  console.error(`[${timestamp}] [API Error] ${context}:`, error)

  // Handle Zod validation errors (safe to expose)
  if (isZodError(error)) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        errors: formatZodErrors(error),
      },
      { status: 400 }
    )
  }

  // Handle database errors (sanitize)
  if (isDatabaseError(error)) {
    const status = ERROR_STATUS_MAP[error.code] || 500
    const message = ERROR_MESSAGES[error.code] || 'An unexpected error occurred. Please try again later.'

    return NextResponse.json(
      { error: message },
      { status }
    )
  }

  // Handle generic errors (sanitize)
  return NextResponse.json(
    { error: 'An unexpected error occurred. Please try again later.' },
    { status: 500 }
  )
}
