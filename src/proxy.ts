import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isDemoMode } from "@/lib/config";

/**
 * Production auth gate.
 *  - Public: /login, /join, /member (self-gating), /checkin/*, and the
 *    Survey Runner at /research/sessions/<id>/run.
 *  - Everything else requires a signed-in user; unauthenticated visitors
 *    are redirected to /login?next=<original path>.
 *  - The Supabase session is refreshed on every matched request.
 */
function isPublic(pathname: string): boolean {
  if (
    pathname === "/login" ||
    pathname === "/join" ||
    pathname === "/forgot-password" ||
    pathname === "/reset-password" ||
    pathname === "/member" ||
    pathname === "/member/play"
  )
    return true;
  if (pathname.startsWith("/checkin/")) return true;
  if (/^\/research\/sessions\/[^/]+\/run\/?$/.test(pathname)) return true;
  return false;
}

export async function proxy(request: NextRequest) {
  if (isDemoMode) return NextResponse.next();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return new NextResponse("Authentication is not configured.", { status: 503 });
  }

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname, search } = request.nextUrl;
  if (!user && !isPublic(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.search = "";
    redirectUrl.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
