// Session management using JWT

import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.SESSION_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  role?: string;
}

/**
 * Create a JWT token
 */
export function createToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): SessionPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Set session cookie
 */
export async function setSession(payload: SessionPayload): Promise<void> {
  const token = createToken(payload);
  const cookieStore = await cookies();
  
  // En producción, usar secure siempre que sea HTTPS
  // En desarrollo, no usar secure para permitir localhost
  const isProduction = process.env.NODE_ENV === 'production';
  const isSecure = isProduction || process.env.VERCEL === '1';
  
  cookieStore.set('auth-token', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
  
  if (process.env.DEBUG_DB === 'true') {
    console.log('[Session] Cookie establecida:', {
      userId: payload.userId,
      email: payload.email,
      secure: isSecure,
    });
  }
}

/**
 * Clear session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('auth-token');
}

/**
 * Get user ID from session (client-side helper)
 */
export function getUserIdFromToken(token: string): string | null {
  const payload = verifyToken(token);
  return payload?.userId || null;
}

