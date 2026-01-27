import { createServerClient } from '@/lib/supabase/server';
import { carUpdateSchema } from '@/lib/schemas';
import { transformCar } from '@/lib/api/transforms';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/security/error-handler';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { validateCsrfToken } from '@/lib/security/csrf';

/**
 * GET /api/cars/:id
 * Returns a single car by ID
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
      .from('cars')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Car not found' }, { status: 404 });
      }
      throw error;
    }

    // Transform to camelCase
    const transformedData = transformCar(data);

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    return handleApiError(error, 'GET /api/cars/[id]');
  }
}

/**
 * PATCH /api/cars/:id
 * Updates a car
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
    const validatedData = carUpdateSchema.parse(body);

    // Update database
    const { data, error } = await supabase
      .from('cars')
      .update({
        name: validatedData.name,
        make: validatedData.make,
        model: validatedData.model,
        year: validatedData.year,
        color: validatedData.color,
        initial_odometer: validatedData.initialOdometer,
        tracking_start_date: validatedData.trackingStartDate,
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Car not found' }, { status: 404 });
      }
      throw error;
    }

    // Transform to camelCase
    const transformedData = transformCar(data);

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    return handleApiError(error, 'PATCH /api/cars/[id]');
  }
}

/**
 * DELETE /api/cars/:id
 * Soft deletes a car (sets is_active to false)
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

    // Soft delete by setting is_active to false
    const { data, error } = await supabase
      .from('cars')
      .update({ is_active: false })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Car not found' }, { status: 404 });
      }
      throw error;
    }

    // Transform to camelCase
    const transformedData = transformCar(data);

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    return handleApiError(error, 'DELETE /api/cars/[id]');
  }
}
