// Script para generar hash de contraseña bcrypt
// Uso: node scripts/generate-password-hash.js <password>

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('Uso: node scripts/generate-password-hash.js <password>');
  console.error('Ejemplo: node scripts/generate-password-hash.js mypassword123');
  process.exit(1);
}

bcrypt.hash(password, 10).then(hash => {
  console.log('\n✅ Hash generado:');
  console.log(hash);
  console.log('\n📋 Copia este hash y úsalo en el script SQL:\n');
  console.log(`INSERT INTO users (email, password_hash, name, role, is_active)`);
  console.log(`VALUES ('tu_email@example.com', '${hash}', 'Nombre Usuario', 'customer', true);\n`);
});

