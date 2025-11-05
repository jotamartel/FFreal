-- Script SQL para crear un usuario directamente en Supabase
-- Ejecuta este script en Supabase SQL Editor
-- 
-- Credenciales por defecto:
-- Email: test@example.com
-- Password: test123
-- 
-- Puedes cambiar estos valores antes de ejecutar

INSERT INTO users (email, password_hash, name, role, is_active)
VALUES (
  'test@example.com',  -- Cambia este email si quieres
  '$2a$10$K3FPP.sOauWzwBNCYPiQJeo5rJDRqAuYOyYWFbLr86PE2RMsBWcUu',  -- Hash de 'test123'
  'Usuario de Prueba',  -- Opcional: cambia el nombre
  'customer',
  true
)
RETURNING id, email, name, role, created_at;

-- Para generar un nuevo hash para otra contraseña, ejecuta en Node.js:
-- node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('tu_password', 10).then(h=>console.log(h))"

