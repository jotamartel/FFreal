#!/usr/bin/env node
/**
 * Script de diagnóstico para conexión a Supabase
 * Uso: node scripts/test-supabase-connection.js
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

console.log('🔍 Diagnóstico de Conexión a Supabase\n');

// 1. Verificar variables de entorno
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

console.log('📋 Variables de Entorno:');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurado' : '❌ No configurado');
console.log('  POSTGRES_URL:', process.env.POSTGRES_URL ? '✅ Configurado' : '❌ No configurado');
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Configurado' : '❌ No configurado');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurado' : '❌ No configurado');

if (!connectionString) {
  console.error('\n❌ ERROR: No se encontró DATABASE_URL ni POSTGRES_URL');
  console.error('\n💡 Solución:');
  console.error('   1. Ve a Supabase Dashboard → Settings → Database');
  console.error('   2. Copia la connection string (Connection Pooling)');
  console.error('   3. Agrega DATABASE_URL a tu archivo .env.local');
  console.error('   4. Formato: postgresql://postgres.xxx:password@xxx.pooler.supabase.com:6543/postgres?sslmode=require');
  process.exit(1);
}

// Detectar si es Supabase
const isSupabase = 
  connectionString.includes('supabase.co') ||
  connectionString.includes('supabase') ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;

console.log('\n🔐 Detección SSL:');
console.log('  Es Supabase:', isSupabase ? '✅ Sí' : '❌ No');
console.log('  Connection string contiene "supabase":', connectionString.includes('supabase') ? '✅ Sí' : '❌ No');

// Limpiar connection string (remover sslmode)
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

console.log('  SSL requerido:', needsSSL ? '✅ Sí' : '❌ No');
console.log('  Config SSL:', sslConfig ? JSON.stringify(sslConfig, null, 2) : 'false');

// 2. Intentar conexión
console.log('\n🔌 Intentando conectar...\n');

const pool = new Pool({
  connectionString: cleanConnectionString,
  ssl: sslConfig,
  max: 2,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

pool.on('error', (err) => {
  console.error('❌ Error en pool:', err.message);
});

async function testConnection() {
  try {
    // Test 1: Conexión básica
    console.log('Test 1: Conexión básica...');
    const result1 = await pool.query('SELECT NOW() as current_time, version() as pg_version');
    console.log('  ✅ Conexión exitosa!');
    console.log('  Hora actual:', result1.rows[0].current_time);
    console.log('  Versión PostgreSQL:', result1.rows[0].pg_version.substring(0, 60) + '...');

    // Test 2: Verificar tablas
    console.log('\nTest 2: Verificando tablas...');
    const result2 = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (result2.rows.length === 0) {
      console.log('  ⚠️  No se encontraron tablas en el esquema public');
      console.log('  💡 Necesitas ejecutar el schema en Supabase SQL Editor');
    } else {
      console.log(`  ✅ Se encontraron ${result2.rows.length} tablas:`);
      result2.rows.forEach(row => {
        console.log(`     - ${row.table_name}`);
      });
    }

    // Test 3: Verificar tabla users específicamente
    console.log('\nTest 3: Verificando tabla users...');
    const result3 = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      ) as exists
    `);
    
    if (result3.rows[0].exists) {
      console.log('  ✅ Tabla users existe');
      
      // Contar usuarios
      const countResult = await pool.query('SELECT COUNT(*) as total FROM users');
      console.log(`  📊 Total de usuarios: ${countResult.rows[0].total}`);
    } else {
      console.log('  ❌ Tabla users NO existe');
      console.log('  💡 Ejecuta lib/database/schema.sql en Supabase SQL Editor');
    }

    console.log('\n✅ Todos los tests completados exitosamente!');
    await pool.end();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    console.error('   Código:', error.code);
    
    if (error.code === 'ENOTFOUND') {
      console.error('\n💡 Problema: No se puede resolver el hostname');
      console.error('   - Verifica que la connection string sea correcta');
      console.error('   - Verifica tu conexión a internet');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('\n💡 Problema: No se puede conectar al servidor');
      console.error('   - Verifica que la connection string sea correcta');
      console.error('   - Verifica que el puerto sea correcto (6543 para pooler, 5432 para directo)');
      console.error('   - Verifica que tu IP esté permitida en Supabase (Settings → Database → Connection Pooling)');
    } else if (error.message.includes('password authentication failed')) {
      console.error('\n💡 Problema: Autenticación fallida');
      console.error('   - Verifica que la contraseña en DATABASE_URL sea correcta');
      console.error('   - Obtén una nueva connection string desde Supabase Dashboard');
    } else if (error.message.includes('SSL') || error.code === 'DEPTH_ZERO_SELF_SIGNED_CERT') {
      console.error('\n💡 Problema: Error de SSL');
      console.error('   - El código ya debería manejar esto automáticamente');
      console.error('   - Verifica que la connection string tenga ?sslmode=require');
    } else {
      console.error('\n💡 Stack trace completo:');
      console.error(error.stack);
    }
    
    await pool.end();
    process.exit(1);
  }
}

testConnection();
