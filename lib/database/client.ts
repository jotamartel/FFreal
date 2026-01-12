// Database Client - PostgreSQL (compatible con Vercel Postgres, Supabase)

import { Pool } from 'pg';

// Obtener connection string (compatible con DATABASE_URL y POSTGRES_URL)
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  const errorMsg = '⚠️ DATABASE_URL or POSTGRES_URL not configured. Please add DATABASE_URL to your .env.local file. See FIX_SUPABASE_CONNECTION.md for instructions.';
  console.error(errorMsg);
  // En desarrollo, mostrar error más visible
  if (process.env.NODE_ENV === 'development') {
    console.error('\n📋 Quick Fix:');
    console.error('1. Get connection string from Supabase Dashboard → Settings → Database');
    console.error('2. Add to .env.local: DATABASE_URL=postgresql://...');
    console.error('3. Restart dev server\n');
  }
}

// Detectar si es Supabase (más robusto)
const isSupabase = 
  connectionString?.includes('supabase.co') ||
  connectionString?.includes('supabase') ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

// IMPORTANTE: Para Supabase, siempre necesitamos SSL con certificados auto-firmados
// El connection string puede tener ?sslmode=require, pero necesitamos configurar SSL explícitamente
// Eliminar sslmode del connection string y configurarlo manualmente
let cleanConnectionString = connectionString || '';
// Remover todos los parámetros sslmode del connection string
cleanConnectionString = cleanConnectionString.replace(/\?sslmode=[^&]*/i, '');
cleanConnectionString = cleanConnectionString.replace(/&sslmode=[^&]*/i, '');
cleanConnectionString = cleanConnectionString.replace(/\?sslmode=[^\s]*/i, '');

// Configurar SSL para Supabase - SIEMPRE requerido con certificados auto-firmados
// En producción, si es Supabase o tiene sslmode=require, usar SSL con configuración permisiva
const needsSSL = isSupabase || 
  (connectionString?.includes('sslmode=require')) ||
  (connectionString && !connectionString.includes('localhost'));

const sslConfig = needsSSL ? {
  rejectUnauthorized: false,
  // Crítico: deshabilitar verificación de identidad del servidor para certificados auto-firmados
  checkServerIdentity: () => undefined,
} : false;

// Log de configuración SSL (solo en desarrollo o cuando hay error)
if (process.env.NODE_ENV === 'development' || process.env.DEBUG_DB === 'true') {
  console.log('[DB Client] Configuración:', {
    hasConnectionString: !!connectionString,
    isSupabase,
    hasSSL: !!sslConfig,
    sslConfig: sslConfig ? {
      rejectUnauthorized: sslConfig.rejectUnauthorized,
      hasCheckServerIdentity: !!sslConfig.checkServerIdentity,
    } : false,
  });
}

export const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: sslConfig,
  // Configuración adicional para evitar problemas de conexión
  max: 10, // máximo de conexiones en el pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Manejar errores de conexión
pool.on('error', (err, client) => {
  console.error('[DB Client] Error inesperado en pool de conexiones:', err);
});

pool.on('connect', (client) => {
  if (process.env.DEBUG_DB === 'true') {
    console.log('[DB Client] Nueva conexión establecida');
  }
});

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    return !!result.rows[0];
  } catch (error) {
    console.error('Database connection error:', error);
    return false;
  }
}

