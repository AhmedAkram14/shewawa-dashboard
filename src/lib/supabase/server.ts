import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "./database.types";
import { env } from "@/lib/env";

/**
 * Returns a typed Supabase client for use in Server Components and Route Handlers.
 * Reads the session from the request cookie store.
 * All queries run under the user's JWT — Supabase RLS policies apply.
 *
 * Must be called inside an async Server Component or Route Handler.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
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
            // Called from a Server Component — the middleware already refreshes
            // the session cookie on every request, so this is safe to ignore.
          }
        },
      },
    },
  );
}
