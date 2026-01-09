import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;

  // Create response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create Supabase client with middleware cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/signin", "/auth/callback", "/auth/sync-guilds"];
  const isPublicRoute = publicRoutes.some((route) => nextUrl.pathname.startsWith(route));

  // API routes and static files
  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isStaticFile = nextUrl.pathname.startsWith("/_next") || nextUrl.pathname.includes(".");

  // Allow public routes, API routes, and static files
  if (isPublicRoute || isApiRoute || isStaticFile) {
    return response;
  }

  // Verify authentication with server (more secure than getSession)
  const { data: { user }, error } = await supabase.auth.getUser();

  // Redirect to sign in if not authenticated
  if (error || !user) {
    const signInUrl = new URL("/auth/signin", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
