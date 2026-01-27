import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/security/error-handler';
import { generateCsrfToken, setCsrfTokenCookie } from '@/lib/security/csrf';

export async function GET() {
  try {
    const supabase = createServerClient();

    // Get current session
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!session) {
      return NextResponse.json(
        { error: 'No active session' },
        { status: 401 }
      );
    }

    // Generate and set CSRF token for authenticated session
    const csrfToken = generateCsrfToken();
    setCsrfTokenCookie(csrfToken);

    return NextResponse.json({
      data: {
        user: session.user,
        session,
        csrfToken, // Include token in response for client to use in headers
      },
    });
  } catch (error) {
    return handleApiError(error, 'GET /api/auth/session');
  }
}
