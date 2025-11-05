// Endpoint de prueba para validar conexión a la base de datos
// IMPORTANTE: Eliminar este endpoint después de diagnosticar

import { NextResponse } from 'next/server';
import { pool } from '@/lib/database/client';
import { getUserByEmail } from '@/lib/database/users';

export async function GET() {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      checks: {},
      errors: [],
    };

    // 1. Verificar variables de entorno
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    results.checks.env_vars = {
      has_database_url: !!process.env.DATABASE_URL,
      has_postgres_url: !!process.env.POSTGRES_URL,
      has_connection_string: !!connectionString,
      connection_string_preview: connectionString 
        ? `${connectionString.substring(0, 20)}...${connectionString.substring(connectionString.length - 20)}`
        : 'NOT SET',
      has_supabase_url: !!process.env.SUPABASE_URL,
      has_next_pub_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    };

    if (!connectionString) {
      results.errors.push('DATABASE_URL o POSTGRES_URL no está configurado');
      return NextResponse.json(results, { status: 500 });
    }

    // 2. Probar conexión básica
    try {
      const testQuery = await pool.query('SELECT NOW() as current_time, version() as pg_version');
      results.checks.basic_connection = {
        success: true,
        current_time: testQuery.rows[0].current_time,
        pg_version: testQuery.rows[0].pg_version?.substring(0, 50),
      };
    } catch (error: any) {
      results.errors.push(`Error en conexión básica: ${error.message}`);
      results.checks.basic_connection = {
        success: false,
        error: error.message,
        code: error.code,
      };
    }

    // 3. Verificar que existe la tabla users
    try {
      const tableCheck = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        ) as exists
      `);
      results.checks.users_table_exists = tableCheck.rows[0].exists;
    } catch (error: any) {
      results.errors.push(`Error verificando tabla users: ${error.message}`);
      results.checks.users_table_exists = false;
    }

    // 4. Intentar leer un usuario de prueba
    if (results.checks.users_table_exists) {
      try {
        const testUser = await getUserByEmail('test@example.com');
        results.checks.test_user = {
          found: !!testUser,
          user_data: testUser ? {
            id: testUser.id,
            email: testUser.email,
            name: testUser.name,
            is_active: testUser.is_active,
            role: testUser.role,
          } : null,
        };
      } catch (error: any) {
        results.errors.push(`Error leyendo usuario de prueba: ${error.message}`);
        results.checks.test_user = {
          found: false,
          error: error.message,
        };
      }

      // 5. Verificar estructura de la tabla users
      try {
        const columns = await pool.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = 'users'
          ORDER BY ordinal_position
        `);
        results.checks.users_table_structure = columns.rows.map((row: any) => ({
          column: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable === 'YES',
        }));
      } catch (error: any) {
        results.errors.push(`Error verificando estructura: ${error.message}`);
      }
    }

    // 6. Contar usuarios totales
    try {
      const countResult = await pool.query('SELECT COUNT(*) as total FROM users');
      results.checks.total_users = parseInt(countResult.rows[0].total);
    } catch (error: any) {
      results.errors.push(`Error contando usuarios: ${error.message}`);
    }

    const hasErrors = results.errors.length > 0;
    return NextResponse.json(results, { 
      status: hasErrors ? 500 : 200 
    });

  } catch (error: any) {
    return NextResponse.json({
      error: 'Error en diagnóstico',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

