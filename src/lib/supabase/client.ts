import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for client-side operations
 * Singleton pattern ensures only one client instance exists
 *
 * @returns Supabase client configured for browser use
 */
let client: ReturnType<typeof createBrowserClient> | undefined;

export function createClient() {
  if (client) {
    return client;
  }

  client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  return client;
}
