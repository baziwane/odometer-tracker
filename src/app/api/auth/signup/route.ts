import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleApiError } from '@/lib/security/error-handler';
import { checkRateLimit } from '@/lib/security/rate-limiter';
import { validateCsrfToken } from '@/lib/security/csrf';

const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export async function POST(request: Request) {
  // Rate limit check (strict for auth endpoints)
  const rateLimitResult = await checkRateLimit(request, 'auth');
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
    const body = await request.json();

    // Validate request body
    const validatedData = signUpSchema.parse(body);

    // Sign up user
    const { data, error } = await supabase.auth.signUp({
      email: validatedData.email,
      password: validatedData.password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    // Create default user settings
    if (data.user) {
      const { error: settingsError } = await supabase
        .from('user_settings')
        .insert({
          user_id: data.user.id,
          theme: 'auto',
          distance_unit: 'miles',
        });

      if (settingsError) {
        // Log error but don't fail the signup if settings creation fails
        handleApiError(settingsError, 'POST /api/auth/signup - settings creation');
      }
    }

    return NextResponse.json({
      data: {
        user: data.user,
        session: data.session,
      },
    });
  } catch (error) {
    return handleApiError(error, 'POST /api/auth/signup');
  }
}
