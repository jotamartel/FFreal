// Endpoint de validación completa de la base de datos
// Útil para verificar que todo esté configurado correctamente

import { NextResponse } from 'next/server';
import { pool } from '@/lib/database/client';

const expectedTables = {
  users: ['id', 'email', 'password_hash', 'role', 'is_active', 'created_at'],
  ff_groups: ['id', 'merchant_id', 'name', 'owner_customer_id', 'owner_email', 'invite_code', 'status'],
  ff_group_members: ['id', 'group_id', 'email', 'role', 'status', 'user_id'],
  ff_invitations: ['id', 'group_id', 'email', 'token', 'status', 'expires_at'],
  ff_discount_config: ['id', 'merchant_id', 'is_enabled', 'max_members_default'],
  ff_code_usage: ['id', 'group_id', 'invite_code', 'customer_id'],
  terms_acceptance: ['id', 'customer_id', 'terms_version', 'accepted_at'],
};

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    connection: { success: false },
    tables: {},
    indexes: {},
    triggers: {},
    foreignKeys: {},
    errors: [],
    warnings: [],
  };

  try {
    // 1. Test de conexión básica
    try {
      const testResult = await pool.query('SELECT NOW() as time, version() as version');
      results.connection.success = true;
      results.connection.time = testResult.rows[0].time;
      results.connection.version = testResult.rows[0].version?.substring(0, 50);
    } catch (error: any) {
      results.connection.error = error.message;
      results.errors.push(`Conexión fallida: ${error.message}`);
      return NextResponse.json(results, { status: 500 });
    }

    // 2. Verificar tablas
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const existingTables = tablesResult.rows.map((r: any) => r.table_name);

    for (const [tableName, requiredColumns] of Object.entries(expectedTables)) {
      const exists = existingTables.includes(tableName);
      results.tables[tableName] = {
        exists,
        columns: {},
        missingColumns: [],
        rowCount: 0,
      };

      if (exists) {
        // Verificar columnas
        const columnsResult = await pool.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);

        const existingColumns = columnsResult.rows.map((r: any) => r.column_name);
        results.tables[tableName].columns = columnsResult.rows.reduce((acc: any, row: any) => {
          acc[row.column_name] = {
            type: row.data_type,
            nullable: row.is_nullable === 'YES',
          };
          return acc;
        }, {});

        // Verificar columnas requeridas
        for (const col of requiredColumns) {
          if (!existingColumns.includes(col)) {
            results.tables[tableName].missingColumns.push(col);
            results.warnings.push(`Tabla ${tableName} falta columna: ${col}`);
          }
        }

        // Contar registros
        try {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          results.tables[tableName].rowCount = parseInt(countResult.rows[0].count);
        } catch (error: any) {
          results.warnings.push(`No se pudo contar registros en ${tableName}: ${error.message}`);
        }
      } else {
        results.errors.push(`Tabla faltante: ${tableName}`);
      }
    }

    // 3. Verificar índices
    const indexesResult = await pool.query(`
      SELECT 
        tablename,
        indexname
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    const indexesByTable: any = {};
    indexesResult.rows.forEach((row: any) => {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    });
    results.indexes = indexesByTable;

    // 4. Verificar triggers
    const triggersResult = await pool.query(`
      SELECT 
        trigger_name,
        event_object_table,
        action_timing,
        event_manipulation
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name
    `);

    const triggersByTable: any = {};
    triggersResult.rows.forEach((row: any) => {
      if (!triggersByTable[row.event_object_table]) {
        triggersByTable[row.event_object_table] = [];
      }
      triggersByTable[row.event_object_table].push({
        name: row.trigger_name,
        timing: row.action_timing,
        event: row.event_manipulation,
      });
    });
    results.triggers = triggersByTable;

    // 5. Verificar foreign keys
    const fkResult = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `);

    const fkByTable: any = {};
    fkResult.rows.forEach((row: any) => {
      if (!fkByTable[row.table_name]) {
        fkByTable[row.table_name] = [];
      }
      fkByTable[row.table_name].push({
        column: row.column_name,
        references: `${row.foreign_table_name}.${row.foreign_column_name}`,
      });
    });
    results.foreignKeys = fkByTable;

    // 6. Calcular estado general
    const allTablesExist = Object.keys(expectedTables).every(
      table => results.tables[table]?.exists
    );
    const hasMissingColumns = Object.values(results.tables).some(
      (table: any) => table.missingColumns?.length > 0
    );

    results.summary = {
      connectionOk: results.connection.success,
      allTablesExist,
      noMissingColumns: !hasMissingColumns,
      totalErrors: results.errors.length,
      totalWarnings: results.warnings.length,
      status: (results.connection.success && allTablesExist && !hasMissingColumns && results.errors.length === 0) 
        ? 'OK' 
        : 'WARNING',
    };

    const status = results.summary.status === 'OK' ? 200 : 500;
    return NextResponse.json(results, { status });

  } catch (error: any) {
    results.errors.push(`Error en validación: ${error.message}`);
    return NextResponse.json(results, { status: 500 });
  }
}
