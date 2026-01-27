import { createServerClient } from '@/lib/supabase/server';
import { transformReading } from '@/lib/api/transforms';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/security/error-handler';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { validateCsrfToken } from '@/lib/security/csrf';

const readingSchema = z.object({
  carId: z.string().uuid('Invalid car ID'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  reading: z.number().int().min(0, 'Reading must be a non-negative integer'),
  notes: z.string().optional(),
});

/**
 * GET /api/readings?carId={id}
 * Returns all readings for a specific car or all user's readings
 */
export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const carId = searchParams.get('carId');

    // Build query
    let query = supabase
      .from('odometer_readings')
      .select('*')
      .order('date', { ascending: true });

    // Filter by car if carId provided
    if (carId) {
      query = query.eq('car_id', carId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform to camelCase
    const transformedData = (data || []).map(transformReading);

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    return handleApiError(error, 'GET /api/readings');
  }
}

/**
 * POST /api/readings
 * Creates a new odometer reading with chronological validation
 */
export async function POST(request: Request) {
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
    const validatedData = readingSchema.parse(body);

    // Verify the car belongs to the user
    const { data: car, error: carError } = await supabase
      .from('cars')
      .select('id')
      .eq('id', validatedData.carId)
      .single();

    if (carError || !car) {
      return NextResponse.json(
        { error: 'Car not found or access denied' },
        { status: 404 }
      );
    }

    // Insert into database
    // The PostgreSQL trigger will validate chronological order
    const { data, error } = await supabase
      .from('odometer_readings')
      .insert({
        user_id: user.id,
        car_id: validatedData.carId,
        date: validatedData.date,
        reading: validatedData.reading,
        notes: validatedData.notes,
      })
      .select()
      .single();

    if (error) {
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

    return NextResponse.json({ data: transformedData }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/readings');
  }
}
