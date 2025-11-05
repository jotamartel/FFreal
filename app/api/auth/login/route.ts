// API route for user login

import { NextRequest, NextResponse } from 'next/server';
import { verifyUserCredentials } from '@/lib/database/users';
import { createToken } from '@/lib/auth/session';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('[LOGIN] Intento de login:', { email, hasPassword: !!password });

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Verify credentials
    console.log('[LOGIN] Verificando credenciales...');
    const user = await verifyUserCredentials(email, password);

    if (!user) {
      console.error('[LOGIN] ❌ Credenciales inválidas para:', email);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.log('[LOGIN] ✅ Usuario autenticado:', { id: user.id, email: user.email });

    // Create session token
    const token = createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Determine if we should use secure cookies
    const isProduction = process.env.NODE_ENV === 'production';
    const isSecure = isProduction || process.env.VERCEL === '1';

    // Create response with user data
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    // Set cookie directly in response headers for immediate availability
    // IMPORTANTE: Usar las mismas opciones que el navegador espera
    const cookieOptions = {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    };
    
    response.cookies.set('auth-token', token, cookieOptions);

    console.log('[LOGIN] Cookie establecida en respuesta:', { 
      hasToken: !!token,
      tokenLength: token.length,
      secure: isSecure,
      options: cookieOptions,
      // Verificar que la cookie está en los headers
      setCookieHeader: response.headers.get('Set-Cookie'),
    });

    return response;
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

