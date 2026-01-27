import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { handleApiError } from '@/lib/security/error-handler';

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    if (code) {
      const supabase = createServerClient();

      // Exchange code for session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (error) {
        handleApiError(error, 'GET /api/auth/callback - code exchange');
        return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent(error.message)}`);
      }

      // Create default user settings if this is a new user
      if (data.user) {
        const { error: settingsError } = await supabase
          .from('user_settings')
          .insert({
            user_id: data.user.id,
            theme: 'auto',
            distance_unit: 'miles',
          })
          .select()
          .single();

        // Ignore error if settings already exist
        if (settingsError && settingsError.code !== '23505') {
          handleApiError(settingsError, 'GET /api/auth/callback - settings creation');
        }
      }

      // Redirect to next URL or home
      return NextResponse.redirect(`${origin}${next}`);
    }

    // No code provided, redirect to home
    return NextResponse.redirect(`${origin}/`);
  } catch (error) {
    handleApiError(error, 'GET /api/auth/callback');
    const { origin } = new URL(request.url);
    return NextResponse.redirect(`${origin}/auth/error?message=${encodeURIComponent('Authentication failed')}`);
  }
}
