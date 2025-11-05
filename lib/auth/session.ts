// Session management using JWT with jose (Edge Runtime compatible)

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.SESSION_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
  role?: string;
}

// Convert secret string to Uint8Array for jose
function getSecretKey(): Uint8Array {
  const encoder = new TextEncoder();
  return encoder.encode(JWT_SECRET);
}

/**
 * Create a JWT token (Edge Runtime compatible)
 */
export async function createToken(payload: SessionPayload): Promise<string> {
  if (!JWT_SECRET || JWT_SECRET === 'fallback-secret-change-in-production') {
    console.error('[createToken] ⚠️ SESSION_SECRET no está configurado o usa el valor por defecto');
  }
  
  const secretKey = getSecretKey();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
  
  const token = await new SignJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role || 'customer',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secretKey);
  
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
 * Verify and decode a JWT token (Edge Runtime compatible)
 */
export async function verifyToken(token: string): Promise<SessionPayload | null> {
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
    
    const secretKey = getSecretKey();
    const { payload: decoded } = await jwtVerify(token, secretKey);
    
    const sessionPayload: SessionPayload = {
      userId: decoded.userId as string,
      email: decoded.email as string,
      role: decoded.role as string,
    };
    
    console.log('[verifyToken] ✅ Token válido:', {
      userId: sessionPayload.userId,
      email: sessionPayload.email,
      role: sessionPayload.role,
    });
    
    return sessionPayload;
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

  return await verifyToken(token);
}

/**
 * Set session cookie
 */
export async function setSession(payload: SessionPayload): Promise<void> {
  const token = await createToken(payload);
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
export async function getUserIdFromToken(token: string): Promise<string | null> {
  const payload = await verifyToken(token);
  return payload?.userId || null;
}

