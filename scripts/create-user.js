// Script para crear un usuario directamente en la base de datos
// Uso: node scripts/create-user.js <email> <password> [name]
// 
// Asegúrate de tener DATABASE_URL o POSTGRES_URL configurado en las variables de entorno
// o en un archivo .env.local

// Intentar cargar dotenv si está disponible (opcional)
try {
  require('dotenv').config({ path: '.env.local' });
} catch (e) {
  // dotenv no está instalado, usar variables de entorno del sistema
}

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

// Obtener connection string
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL o POSTGRES_URL no está configurado');
  process.exit(1);
}

// Configurar pool de conexiones
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

async function createUser(email, password, name = null) {
  try {
    // Verificar que el email no existe
    const checkResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (checkResult.rows.length > 0) {
      console.error(`❌ Error: El usuario con email ${email} ya existe`);
      await pool.end();
      process.exit(1);
    }

    // Hash de la contraseña
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    console.log('✅ Password hasheado correctamente');

    // Insertar usuario
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, is_active)
       VALUES ($1, $2, $3, 'customer', true)
       RETURNING id, email, name, role, created_at`,
      [email, passwordHash, name]
    );

    const user = result.rows[0];
    console.log('\n✅ Usuario creado exitosamente:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.name || 'N/A'}`);
    console.log(`   Rol: ${user.role}`);
    console.log(`   Creado: ${user.created_at}\n`);

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

// Obtener argumentos de la línea de comandos
const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Uso: node scripts/create-user.js <email> <password> [name]');
  console.error('Ejemplo: node scripts/create-user.js test@example.com password123 "Juan Pérez"');
  process.exit(1);
}

const [email, password, name] = args;

if (!email || !password) {
  console.error('❌ Error: Email y password son requeridos');
  process.exit(1);
}

createUser(email, password, name || null);

