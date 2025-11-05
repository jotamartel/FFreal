// Database Client - PostgreSQL (compatible con Vercel Postgres, Supabase)

import { Pool } from 'pg';

// Obtener connection string (compatible con DATABASE_URL y POSTGRES_URL)
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.warn('⚠️ DATABASE_URL or POSTGRES_URL not configured');
}

// Configurar SSL para Supabase/Vercel Postgres
// Supabase requiere SSL pero con configuración específica para certificados
export const pool = new Pool({
  connectionString,
  ssl: connectionString?.includes('supabase') || connectionString?.includes('sslmode=require')
    ? {
        rejectUnauthorized: false,
        // Permitir certificados auto-firmados de Supabase
        checkServerIdentity: () => undefined,
      }
    : connectionString
    ? {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
      }
    : false,
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

