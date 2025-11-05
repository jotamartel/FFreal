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
  if (!JWT_SECRET || JWT_SECRET === 'fallback-secret-change-in-production') {
    console.error('[createToken] ⚠️ SESSION_SECRET no está configurado o usa el valor por defecto');
  }
  
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
  
  if (process.env.DEBUG_DB === 'true') {
    console.log('[createToken] Token creado:', {
      userId: payload.userId,
      email: payload.email,
      secretLength: JWT_SECRET?.length || 0,
      usingFallback: JWT_SECRET === 'fallback-secret-change-in-production',
    });
  }
  
  return token;
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): SessionPayload | null {
  try {
    // Siempre log para debugging en producción
    console.log('[verifyToken] Iniciando verificación:', {
      hasSecret: !!JWT_SECRET,
      secretLength: JWT_SECRET?.length || 0,
      usingFallback: JWT_SECRET === 'fallback-secret-change-in-production',
      secretPreview: JWT_SECRET ? `${JWT_SECRET.substring(0, 10)}...${JWT_SECRET.substring(JWT_SECRET.length - 10)}` : 'none',
      tokenLength: token.length,
    });
    
    if (!JWT_SECRET || JWT_SECRET === 'fallback-secret-change-in-production') {
      console.error('[verifyToken] ⚠️ SESSION_SECRET no está configurado o usa el valor por defecto');
    }
    
    const decoded = jwt.verify(token, JWT_SECRET) as SessionPayload;
    
    console.log('[verifyToken] ✅ Token válido:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    });
    
    return decoded;
  } catch (error: any) {
    // Log el error específico para debugging
    console.error('[verifyToken] ❌ Error verificando token:', {
      error: error.message,
      name: error.name,
      hasSecret: !!JWT_SECRET,
      secretLength: JWT_SECRET?.length || 0,
      secretPreview: JWT_SECRET ? `${JWT_SECRET.substring(0, 10)}...${JWT_SECRET.substring(JWT_SECRET.length - 10)}` : 'none',
      tokenPreview: token.substring(0, 50) + '...',
    });
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

