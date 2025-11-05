// API route for user login

import { NextRequest, NextResponse } from 'next/server';
import { verifyUserCredentials } from '@/lib/database/users';
import { setSession } from '@/lib/auth/session';

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

    // Create session
    await setSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error in login:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

