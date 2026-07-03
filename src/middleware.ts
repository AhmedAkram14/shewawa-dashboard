import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Runs on every matched request.
 *
 * Two responsibilities:
 * 1. Refresh the Supabase session token so it never expires mid-session.
 * 2. Guard dashboard routes — redirect unauthenticated users to /login,
 *    and redirect authenticated users away from /login.
 *
 * IMPORTANT: Do not add any logic between createServerClient and
 * supabase.auth.getUser(). The cookie setAll callback must execute
 * before any response is returned so the refreshed token is written.
 */
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginRoute = pathname === "/login";

  if (!user && !isLoginRoute) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (user && isLoginRoute) {
    const todayUrl = request.nextUrl.clone();
    todayUrl.pathname = "/today";
    return NextResponse.redirect(todayUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match every path except:
     * - _next/static  (static files)
     * - _next/image   (image optimisation)
     * - favicon.ico
     * - PWA files: sw.js, workbox chunks, manifest.json
     * - any file with a common static extension
     */
    "/((?!_next/static|_next/image|favicon\\.ico|sw\\.js|swe-worker-.*\\.js|workbox-.*\\.js|manifest\\.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2)$).*)",
  ],
};
