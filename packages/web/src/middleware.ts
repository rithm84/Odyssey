import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isAuthenticated = !!req.auth;

  // Public routes that don't require authentication
  const publicRoutes = ["/auth/signin"];
  const isPublicRoute = publicRoutes.some((route) => nextUrl.pathname.startsWith(route));

  // API routes and static files
  const isApiRoute = nextUrl.pathname.startsWith("/api");
  const isStaticFile = nextUrl.pathname.startsWith("/_next") || nextUrl.pathname.includes(".");

  // Allow public routes, API routes, and static files
  if (isPublicRoute || isApiRoute || isStaticFile) {
    return NextResponse.next();
  }

  // Redirect to sign in if not authenticated
  if (!isAuthenticated) {
    const signInUrl = new URL("/auth/signin", nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
