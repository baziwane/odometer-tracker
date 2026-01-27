import { createServerClient } from '@/lib/supabase/server';
import { transformSettings } from '@/lib/api/transforms';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/security/error-handler';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { validateCsrfToken } from '@/lib/security/csrf';

const settingsSchema = z.object({
  defaultCarId: z.string().uuid().nullable().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  distanceUnit: z.enum(['miles', 'kilometers']).optional(),
});

/**
 * GET /api/settings
 * Returns user settings, creating default settings if none exist
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

    // Query database
    let { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // If no settings exist, create default settings
    if (error && error.code === 'PGRST116') {
      const { data: newSettings, error: insertError } = await supabase
        .from('user_settings')
        .insert({
          user_id: user.id,
          theme: 'auto',
          distance_unit: 'miles',
          default_car_id: null,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      data = newSettings;
    } else if (error) {
      throw error;
    }

    // Transform to camelCase
    const transformedData = transformSettings(data);

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    return handleApiError(error, 'GET /api/settings');
  }
}

/**
 * PATCH /api/settings
 * Updates user settings
 */
export async function PATCH(request: Request) {
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
    const validatedData = settingsSchema.parse(body);

    // Check if default_car_id belongs to user (if provided)
    if (validatedData.defaultCarId) {
      const { data: car, error: carError } = await supabase
        .from('cars')
        .select('id')
        .eq('id', validatedData.defaultCarId)
        .eq('is_active', true)
        .single();

      if (carError || !car) {
        return NextResponse.json(
          { error: 'Invalid default car ID' },
          { status: 400 }
        );
      }
    }

    // Update or insert settings (upsert)
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: user.id,
        default_car_id: validatedData.defaultCarId,
        theme: validatedData.theme,
        distance_unit: validatedData.distanceUnit,
      })
      .select()
      .single();

    if (error) throw error;

    // Transform to camelCase
    const transformedData = transformSettings(data);

    return NextResponse.json({ data: transformedData });
  } catch (error) {
    return handleApiError(error, 'PATCH /api/settings');
  }
}
