import { createServerClient } from '@/lib/supabase/server';
import { carSchema } from '@/lib/schemas';
import { transformCar } from '@/lib/api/transforms';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/security/error-handler';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { validateCsrfToken } from '@/lib/security/csrf';

/**
 * GET /api/cars
 * Returns all active cars for the authenticated user
 */
export async function GET(request: Request) {
  // Rate limit check
  const rateLimitResult = await checkRateLimit(request, 'api');
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: rateLimitResult.headers }
    );
  }

  try {
    const supabase = createServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query database (RLS automatically filters by user_id)
    const { data, error } = await supabase
      .from('cars')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to camelCase
    const transformedData = (data || []).map(transformCar);

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    return handleApiError(error, 'GET /api/cars');
  }
}

/**
 * POST /api/cars
 * Creates a new car for the authenticated user
 */
export async function POST(request: Request) {
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

  try {
    const supabase = createServerClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = carSchema.parse(body);

    // Insert into database
    const { data, error } = await supabase
      .from('cars')
      .insert({
        user_id: user.id,
        name: validatedData.name,
        make: validatedData.make,
        model: validatedData.model,
        year: validatedData.year,
        color: validatedData.color,
        initial_odometer: validatedData.initialOdometer,
        tracking_start_date: validatedData.trackingStartDate,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Transform to camelCase
    const transformedData = transformCar(data);

    return NextResponse.json({ data: transformedData }, { status: 201 });
  } catch (error) {
    return handleApiError(error, 'POST /api/cars');
  }
}
