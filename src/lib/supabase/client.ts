import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "./database.types";
import { env } from "@/lib/env";

/**
 * Returns a typed Supabase client for use in Client Components.
 * Session is read from the cookie written by @supabase/ssr middleware.
 * All queries run under the user's JWT — Supabase RLS policies apply.
 */
export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
