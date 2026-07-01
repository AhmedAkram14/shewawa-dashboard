import { cookies } from "next/headers";

import { env } from "@/lib/env";
import { createServerClient } from "@supabase/ssr";

/**
 * Returns a Supabase client for use in Server Components and Route Handlers.
 * Reads the user's session from the request cookie store.
 * All queries run under the user's JWT → Supabase RLS policies apply.
 *
 * Must be called inside an async Server Component or Route Handler.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll() called from a Server Component — the middleware
            // already handles refreshing the session cookie on every request.
          }
        },
      },
    },
  );
}
