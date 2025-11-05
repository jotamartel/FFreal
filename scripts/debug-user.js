// Script para diagnosticar problemas con el usuario
// Uso: node scripts/debug-user.js <email>

require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL o POSTGRES_URL no está configurado');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes('supabase') || connectionString.includes('sslmode=require')
    ? {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
      }
    : connectionString
    ? {
        rejectUnauthorized: false,
        checkServerIdentity: () => undefined,
      }
    : false,
});

async function debugUser(email) {
  try {
    console.log(`\n🔍 Buscando usuario: ${email}\n`);

    // Buscar usuario
    const result = await pool.query(
      `SELECT id, email, password_hash, name, is_active, role, created_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      console.error('❌ Usuario no encontrado en la base de datos');
      await pool.end();
      process.exit(1);
    }

    const user = result.rows[0];
    console.log('✅ Usuario encontrado:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.name || 'N/A'}`);
    console.log(`   Rol: ${user.role}`);
    console.log(`   Activo: ${user.is_active}`);
    console.log(`   Creado: ${user.created_at}`);
    console.log(`   Hash almacenado: ${user.password_hash.substring(0, 30)}...`);

    // Verificar si está activo
    if (!user.is_active) {
      console.error('\n⚠️  PROBLEMA: El usuario NO está activo (is_active = false)');
      console.log('   Solución: Ejecuta en Supabase:');
      console.log(`   UPDATE users SET is_active = true WHERE email = '${email}';`);
    }

    // Probar verificación de contraseña
    console.log('\n🔐 Probando verificación de contraseña...');
    console.log('   Ingresa la contraseña que quieres probar:');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question('   Password: ', async (password) => {
      try {
        const isValid = await bcrypt.compare(password, user.password_hash);
        
        if (isValid) {
          console.log('   ✅ Contraseña correcta!');
        } else {
          console.log('   ❌ Contraseña incorrecta');
          console.log('\n   💡 Si la contraseña debería ser correcta, puede que el hash esté mal.');
          console.log('   Genera un nuevo hash y actualiza el usuario:');
          console.log('   node scripts/generate-password-hash.js tu_password');
        }
      } catch (error) {
        console.error('   ❌ Error verificando contraseña:', error.message);
      }
      
      await pool.end();
      rl.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

const email = process.argv[2];

if (!email) {
  console.error('Uso: node scripts/debug-user.js <email>');
  console.error('Ejemplo: node scripts/debug-user.js test@example.com');
  process.exit(1);
}

debugUser(email);

