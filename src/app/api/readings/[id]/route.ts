import { createServerClient } from '@/lib/supabase/server';
import { transformReading } from '@/lib/api/transforms';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/security/error-handler';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { validateCsrfToken } from '@/lib/security/csrf';

const readingUpdateSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  reading: z.number().int().min(0, 'Reading must be a non-negative integer').optional(),
  notes: z.string().optional(),
});

/**
 * GET /api/readings/:id
 * Returns a single reading by ID
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, 'api');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    const supabase = createServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query database
    const { data, error } = await supabase
      .from('odometer_readings')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Reading not found' }, { status: 404 });
      }
      throw error;
    }

    // Transform to camelCase
    const transformedData = transformReading(data);

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    return handleApiError(error, 'GET /api/readings/[id]');
  }
}

/**
 * PATCH /api/readings/:id
 * Updates a reading with chronological validation
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, 'api');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // CSRF protection for mutation operations
    if (!validateCsrfToken(request)) {
      return NextResponse.json(
        { error: 'Invalid request. Please refresh and try again.' },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = readingUpdateSchema.parse(body);

    // Update database
    // The PostgreSQL trigger will validate chronological order
    const { data, error } = await supabase
      .from('odometer_readings')
      .update({
        date: validatedData.date,
        reading: validatedData.reading,
        notes: validatedData.notes,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Reading not found' }, { status: 404 });
      }

      // Check if it's a validation error from the trigger
      if (error.code === '23514') {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }

      // Check if it's a duplicate date error
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'A reading already exists for this date' },
          { status: 400 }
        );
      }

      throw error;
    }

    // Transform to camelCase
    const transformedData = transformReading(data);

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    return handleApiError(error, 'PATCH /api/readings/[id]');
  }
}

/**
 * DELETE /api/readings/:id
 * Deletes a reading
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limit check
    const rateLimitResult = await checkRateLimit(request, 'api');
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    // CSRF protection for mutation operations
    if (!validateCsrfToken(request)) {
      return NextResponse.json(
        { error: 'Invalid request. Please refresh and try again.' },
        { status: 403 }
      );
    }

    const supabase = createServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete from database
    const { error } = await supabase
      .from('odometer_readings')
      .delete()
      .eq('id', params.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/readings/[id]');
  }
}
