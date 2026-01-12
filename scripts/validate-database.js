#!/usr/bin/env node
/**
 * Script de validación completa de la base de datos Supabase
 * Verifica todas las tablas, estructura, índices y relaciones
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local si existe
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=:#]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ ERROR: DATABASE_URL no está configurado');
  console.error('💡 Configura DATABASE_URL en .env.local o como variable de entorno');
  process.exit(1);
}

// Configurar SSL para Supabase
const isSupabase = 
  connectionString.includes('supabase.co') ||
  connectionString.includes('supabase') ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

let cleanConnectionString = connectionString;
cleanConnectionString = cleanConnectionString.replace(/\?sslmode=[^&]*/i, '');
cleanConnectionString = cleanConnectionString.replace(/&sslmode=[^&]*/i, '');

const needsSSL = isSupabase || 
  connectionString.includes('sslmode=require') ||
  (!connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));

const sslConfig = needsSSL ? {
  rejectUnauthorized: false,
  checkServerIdentity: () => undefined,
} : false;

const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: sslConfig,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Tablas esperadas con sus columnas críticas
const expectedTables = {
  users: ['id', 'email', 'password_hash', 'role', 'is_active', 'created_at'],
  ff_groups: ['id', 'merchant_id', 'name', 'owner_customer_id', 'owner_email', 'invite_code', 'status'],
  ff_group_members: ['id', 'group_id', 'email', 'role', 'status', 'user_id'],
  ff_invitations: ['id', 'group_id', 'email', 'token', 'status', 'expires_at'],
  ff_discount_config: ['id', 'merchant_id', 'is_enabled', 'max_members_default'],
  ff_code_usage: ['id', 'group_id', 'invite_code', 'customer_id'],
  terms_acceptance: ['id', 'customer_id', 'terms_version', 'accepted_at'],
};

async function validateDatabase() {
  const results = {
    connection: { success: false },
    tables: {},
    indexes: {},
    triggers: {},
    foreignKeys: {},
    errors: [],
    warnings: [],
  };

  try {
    console.log('🔍 Validando Base de Datos Supabase\n');

    // 1. Test de conexión básica
    console.log('1️⃣ Probando conexión...');
    try {
      const testResult = await pool.query('SELECT NOW() as time, version() as version');
      results.connection.success = true;
      results.connection.time = testResult.rows[0].time;
      results.connection.version = testResult.rows[0].version.substring(0, 50);
      console.log('   ✅ Conexión exitosa');
      console.log(`   📅 Hora del servidor: ${testResult.rows[0].time}`);
    } catch (error) {
      results.connection.error = error.message;
      results.errors.push(`Conexión fallida: ${error.message}`);
      console.log(`   ❌ Error de conexión: ${error.message}`);
      throw error;
    }

    // 2. Verificar tablas
    console.log('\n2️⃣ Verificando tablas...');
    const tablesResult = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const existingTables = tablesResult.rows.map(r => r.table_name);
    console.log(`   📊 Tablas encontradas: ${existingTables.length}`);

    for (const [tableName, requiredColumns] of Object.entries(expectedTables)) {
      const exists = existingTables.includes(tableName);
      results.tables[tableName] = {
        exists,
        columns: {},
        missingColumns: [],
      };

      if (exists) {
        console.log(`   ✅ ${tableName}`);

        // Verificar columnas
        const columnsResult = await pool.query(`
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' 
          AND table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);

        const existingColumns = columnsResult.rows.map(r => r.column_name);
        results.tables[tableName].columns = columnsResult.rows.reduce((acc, row) => {
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
            console.log(`      ⚠️  Falta columna: ${col}`);
          }
        }

        // Contar registros
        try {
          const countResult = await pool.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          const count = parseInt(countResult.rows[0].count);
          results.tables[tableName].rowCount = count;
          console.log(`      📈 Registros: ${count}`);
        } catch (error) {
          console.log(`      ⚠️  No se pudo contar registros: ${error.message}`);
        }
      } else {
        console.log(`   ❌ ${tableName} - NO EXISTE`);
        results.errors.push(`Tabla faltante: ${tableName}`);
      }
    }

    // 3. Verificar índices
    console.log('\n3️⃣ Verificando índices...');
    const indexesResult = await pool.query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    const indexesByTable = {};
    indexesResult.rows.forEach(row => {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    });

    results.indexes = indexesByTable;
    const totalIndexes = indexesResult.rows.length;
    console.log(`   📊 Total de índices: ${totalIndexes}`);
    Object.keys(indexesByTable).forEach(table => {
      console.log(`   ✅ ${table}: ${indexesByTable[table].length} índices`);
    });

    // 4. Verificar triggers
    console.log('\n4️⃣ Verificando triggers...');
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

    const triggersByTable = {};
    triggersResult.rows.forEach(row => {
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
    const totalTriggers = triggersResult.rows.length;
    console.log(`   📊 Total de triggers: ${totalTriggers}`);
    Object.keys(triggersByTable).forEach(table => {
      console.log(`   ✅ ${table}: ${triggersByTable[table].length} triggers`);
    });

    // 5. Verificar foreign keys
    console.log('\n5️⃣ Verificando foreign keys...');
    const fkResult = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
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

    const fkByTable = {};
    fkResult.rows.forEach(row => {
      if (!fkByTable[row.table_name]) {
        fkByTable[row.table_name] = [];
      }
      fkByTable[row.table_name].push({
        column: row.column_name,
        references: `${row.foreign_table_name}.${row.foreign_column_name}`,
        constraint: row.constraint_name,
      });
    });

    results.foreignKeys = fkByTable;
    const totalFKs = fkResult.rows.length;
    console.log(`   📊 Total de foreign keys: ${totalFKs}`);
    Object.keys(fkByTable).forEach(table => {
      console.log(`   ✅ ${table}: ${fkByTable[table].length} foreign keys`);
    });

    // 6. Resumen final
    console.log('\n' + '='.repeat(60));
    console.log('📋 RESUMEN DE VALIDACIÓN');
    console.log('='.repeat(60));

    const allTablesExist = Object.keys(expectedTables).every(
      table => results.tables[table]?.exists
    );

    const hasMissingColumns = Object.values(results.tables).some(
      table => table.missingColumns?.length > 0
    );

    if (results.connection.success && allTablesExist && !hasMissingColumns && results.errors.length === 0) {
      console.log('\n✅ ✅ ✅ VALIDACIÓN EXITOSA ✅ ✅ ✅\n');
      console.log('✅ Conexión a la base de datos: OK');
      console.log('✅ Todas las tablas existen');
      console.log('✅ Todas las columnas requeridas presentes');
      console.log(`✅ ${totalIndexes} índices configurados`);
      console.log(`✅ ${totalTriggers} triggers configurados`);
      console.log(`✅ ${totalFKs} foreign keys configurados`);
      console.log('\n🎉 La base de datos está lista para usar!\n');
    } else {
      console.log('\n⚠️  VALIDACIÓN CON ADVERTENCIAS\n');
      
      if (!results.connection.success) {
        console.log('❌ Conexión: FALLIDA');
      } else {
        console.log('✅ Conexión: OK');
      }

      if (!allTablesExist) {
        console.log('❌ Tablas faltantes:');
        Object.entries(results.tables).forEach(([name, info]) => {
          if (!info.exists) {
            console.log(`   - ${name}`);
          }
        });
      } else {
        console.log('✅ Todas las tablas: OK');
      }

      if (hasMissingColumns) {
        console.log('⚠️  Columnas faltantes:');
        Object.entries(results.tables).forEach(([name, info]) => {
          if (info.missingColumns?.length > 0) {
            console.log(`   - ${name}: ${info.missingColumns.join(', ')}`);
          }
        });
      } else {
        console.log('✅ Todas las columnas: OK');
      }

      if (results.errors.length > 0) {
        console.log('\n❌ Errores encontrados:');
        results.errors.forEach(err => console.log(`   - ${err}`));
      }

      if (results.warnings.length > 0) {
        console.log('\n⚠️  Advertencias:');
        results.warnings.forEach(warn => console.log(`   - ${warn}`));
      }
    }

    await pool.end();
    return results;

  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO:', error.message);
    console.error(error.stack);
    await pool.end();
    process.exit(1);
  }
}

validateDatabase().then(results => {
  process.exit(results.errors.length > 0 ? 1 : 0);
}).catch(error => {
  console.error('Error fatal:', error);
  process.exit(1);
});
