// Middleware to protect routes and handle authentication
// IMPORTANTE: Este middleware debe ejecutarse en Node.js runtime, no Edge Runtime

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// No necesitamos configurar runtime - jose funciona en Edge Runtime

// Importar verifyToken después de configurar runtime
import { verifyToken } from './lib/auth/session';

// Routes that require authentication
const protectedRoutes = ['/customer'];

// Public routes (accessible without authentication)
const publicRoutes = ['/tienda', '/login'];

// Routes that should redirect to /customer if already authenticated
const authRoutes = ['/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Handle CORS preflight requests for API routes FIRST
  // This must be checked before any other logic
  if (request.method === 'OPTIONS') {
    if (pathname.startsWith('/api/')) {
      console.log('[Middleware] Handling OPTIONS preflight for:', pathname);
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }
    // For non-API OPTIONS, just pass through
    return NextResponse.next();
  }

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
    const verified = await verifyToken(token);
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
     * - api (API routes) - but we need to handle OPTIONS for CORS
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

