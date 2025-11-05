// Middleware to protect routes and handle authentication

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth/session';

// Routes that require authentication
const protectedRoutes = ['/customer'];

// Public routes (accessible without authentication)
const publicRoutes = ['/tienda', '/login'];

// Routes that should redirect to /customer if already authenticated
const authRoutes = ['/login'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get token from cookies
  const token = request.cookies.get('auth-token')?.value;
  
  // Log for debugging (always log in production to diagnose issues)
  console.log('[Middleware]', {
    pathname,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    allCookies: request.cookies.getAll().map(c => c.name),
  });
  
  let isAuthenticated = false;
  if (token) {
    const verified = verifyToken(token);
    isAuthenticated = verified !== null;
    if (!isAuthenticated) {
      console.log('[Middleware] Token inválido o expirado');
    }
  } else {
    console.log('[Middleware] No se encontró token en cookies');
  }

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if route is public (no auth required)
  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if route is auth route (login, register)
  const isAuthRoute = authRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Allow public routes
  if (isPublicRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to customer portal if accessing auth routes while authenticated
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/customer', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

