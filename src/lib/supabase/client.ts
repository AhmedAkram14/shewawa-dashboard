import { env } from "@/lib/env";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Returns a Supabase client for use in Client Components.
 * Uses the user's session cookie automatically via @supabase/ssr.
 * All queries run under the user's JWT → Supabase RLS policies apply.
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
