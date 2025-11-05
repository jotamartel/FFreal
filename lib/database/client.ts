// Database Client - PostgreSQL (compatible con Vercel Postgres, Supabase)

import { Pool } from 'pg';

// Configurar SSL para Supabase/Vercel Postgres
export const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false,
    checkServerIdentity: () => undefined,
  },
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

