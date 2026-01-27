/**
 * @jest-environment node
 */
import { NextResponse } from 'next/server'
import { handleApiError } from '../error-handler'
import { ZodError, z } from 'zod'

describe('handleApiError', () => {
  // Suppress console logs during tests
  const originalConsoleError = console.error
  beforeAll(() => {
    console.error = jest.fn()
  })
  afterAll(() => {
    console.error = originalConsoleError
  })

  describe('Database Error Sanitization', () => {
    it('sanitizes Supabase PGRST116 (not found) errors', () => {
      const error = {
        code: 'PGRST116',
        message: 'The result contains 0 rows',
        details: 'Sensitive database details',
      }

      const response = handleApiError(error, 'GET /api/cars')

      expect(response.status).toBe(404)
      expect(response).toBeInstanceOf(NextResponse)
    })

    it('sanitizes Supabase 23505 (duplicate key) errors', () => {
      const error = {
        code: '23505',
        message: 'duplicate key value violates unique constraint "cars_pkey"',
        details: 'Key (id)=(123) already exists.',
      }

      const response = handleApiError(error, 'POST /api/cars')

      expect(response.status).toBe(409)
    })

    it('sanitizes Supabase 23514 (check constraint) errors', () => {
      const error = {
        code: '23514',
        message: 'new row for relation "cars" violates check constraint "valid_year"',
      }

      const response = handleApiError(error, 'POST /api/cars')

      expect(response.status).toBe(400)
    })

    it('sanitizes generic database errors', () => {
      const error = new Error('Database connection failed: postgres://user:password@localhost:5432/db')

      const response = handleApiError(error, 'GET /api/cars')

      expect(response.status).toBe(500)
    })

    it('does not expose sensitive error details in response', async () => {
      const error = {
        code: 'PGRST116',
        message: 'The result contains 0 rows',
        details: 'SELECT * FROM users WHERE password = "secret123"',
      }

      const response = handleApiError(error, 'GET /api/users')
      const json = await response.json()

      expect(json.error).not.toContain('PGRST')
      expect(json.error).not.toContain('postgres')
      expect(json.error).not.toContain('secret123')
      expect(json.error).not.toContain('SELECT')
    })
  })

  describe('Zod Validation Errors', () => {
    it('preserves Zod validation errors with field details', async () => {
      const schema = z.object({
        email: z.string().email(),
        age: z.number().min(0).max(150),
      })

      try {
        schema.parse({ email: 'invalid-email', age: -5 })
      } catch (error) {
        const response = handleApiError(error, 'POST /api/users')
        const json = await response.json()

        expect(response.status).toBe(400)
        expect(json.error).toContain('Validation failed')
        expect(json.errors).toBeDefined()
        expect(Array.isArray(json.errors)).toBe(true)
      }
    })

    it('formats Zod errors with field paths', async () => {
      const schema = z.object({
        name: z.string().min(1),
        email: z.string().email(),
      })

      try {
        schema.parse({ name: '', email: 'bad' })
      } catch (error) {
        const response = handleApiError(error, 'POST /api/users')
        const json = await response.json()

        expect(json.errors).toHaveLength(2)
        expect(json.errors[0]).toHaveProperty('field')
        expect(json.errors[0]).toHaveProperty('message')
      }
    })
  })

  describe('HTTP Status Code Mapping', () => {
    it('maps PGRST116 to 404', () => {
      const error = { code: 'PGRST116', message: 'Not found' }
      const response = handleApiError(error, 'GET /api/cars/123')
      expect(response.status).toBe(404)
    })

    it('maps 23505 (duplicate) to 409', () => {
      const error = { code: '23505', message: 'Duplicate key' }
      const response = handleApiError(error, 'POST /api/cars')
      expect(response.status).toBe(409)
    })

    it('maps 23514 (constraint) to 400', () => {
      const error = { code: '23514', message: 'Check constraint violated' }
      const response = handleApiError(error, 'POST /api/cars')
      expect(response.status).toBe(400)
    })

    it('maps ZodError to 400', () => {
      const schema = z.object({ name: z.string() })
      try {
        schema.parse({ name: 123 })
      } catch (error) {
        const response = handleApiError(error, 'POST /api/cars')
        expect(response.status).toBe(400)
      }
    })

    it('maps unknown errors to 500', () => {
      const error = new Error('Something went wrong')
      const response = handleApiError(error, 'GET /api/cars')
      expect(response.status).toBe(500)
    })
  })

  describe('Server-Side Logging', () => {
    it('logs full error details with context', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')
      const error = new Error('Test error')

      handleApiError(error, 'GET /api/cars')

      expect(consoleErrorSpy).toHaveBeenCalled()
      // Check that the first argument (log message) contains expected parts
      const firstCall = consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1]
      expect(firstCall[0]).toContain('[API Error]')
      expect(firstCall[0]).toContain('GET /api/cars')
      expect(firstCall[1]).toBe(error)

      consoleErrorSpy.mockRestore()
    })

    it('includes timestamp in logs', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error')
      const error = new Error('Test error')

      handleApiError(error, 'POST /api/cars')

      // Check that the first argument contains ISO timestamp
      const firstCall = consoleErrorSpy.mock.calls[consoleErrorSpy.mock.calls.length - 1]
      expect(firstCall[0]).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)

      consoleErrorSpy.mockRestore()
    })
  })

  describe('User-Friendly Messages', () => {
    it('returns generic message for unknown errors', async () => {
      const error = new Error('Internal database failure')
      const response = handleApiError(error, 'GET /api/cars')
      const json = await response.json()

      expect(json.error).toBe('An unexpected error occurred. Please try again later.')
    })

    it('returns helpful message for not found errors', async () => {
      const error = { code: 'PGRST116', message: 'Not found' }
      const response = handleApiError(error, 'GET /api/cars/123')
      const json = await response.json()

      expect(json.error).toBe('The requested resource was not found.')
    })

    it('returns helpful message for duplicate errors', async () => {
      const error = { code: '23505', message: 'Duplicate' }
      const response = handleApiError(error, 'POST /api/cars')
      const json = await response.json()

      expect(json.error).toBe('This resource already exists.')
    })

    it('returns helpful message for constraint violations', async () => {
      const error = { code: '23514', message: 'Constraint violation' }
      const response = handleApiError(error, 'POST /api/cars')
      const json = await response.json()

      expect(json.error).toBe('The provided data is invalid.')
    })
  })

  describe('Edge Cases', () => {
    it('handles null error', async () => {
      const response = handleApiError(null, 'GET /api/cars')
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.error).toBe('An unexpected error occurred. Please try again later.')
    })

    it('handles undefined error', async () => {
      const response = handleApiError(undefined, 'GET /api/cars')
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.error).toBe('An unexpected error occurred. Please try again later.')
    })

    it('handles string error', async () => {
      const response = handleApiError('Something went wrong', 'GET /api/cars')
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.error).toBe('An unexpected error occurred. Please try again later.')
    })

    it('handles error without message property', async () => {
      const error = { code: 'UNKNOWN' }
      const response = handleApiError(error, 'GET /api/cars')
      const json = await response.json()

      expect(response.status).toBe(500)
      expect(json.error).toBe('An unexpected error occurred. Please try again later.')
    })
  })
})
