import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/security/error-handler';
import { validateCsrfToken } from '@/lib/security/csrf';

export async function POST(request: Request) {
  // CSRF protection for mutation operations
  if (!validateCsrfToken(request)) {
    return NextResponse.json(
      { error: 'Invalid request. Please refresh and try again.' },
      { status: 403 }
    );
  }

  try {
    const supabase = createServerClient();

    // Sign out user
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error, 'POST /api/auth/logout');
  }
}
