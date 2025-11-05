-- Script SQL para verificar y corregir el usuario
-- Ejecuta este script en Supabase SQL Editor

-- 1. Verificar el usuario actual
SELECT 
  id, 
  email, 
  name, 
  is_active, 
  role, 
  created_at,
  CASE 
    WHEN password_hash IS NULL THEN '❌ Sin password_hash'
    WHEN LENGTH(password_hash) < 50 THEN '⚠️ Hash muy corto'
    ELSE '✅ Hash OK'
  END as password_status,
  SUBSTRING(password_hash, 1, 30) as hash_preview
FROM users 
WHERE email = 'test@example.com';

-- 2. Si el usuario no está activo, activarlo
UPDATE users 
SET is_active = true 
WHERE email = 'test@example.com' AND is_active = false;

-- 3. Si necesitas regenerar el hash de la contraseña 'test123', 
-- ejecuta esto en Node.js primero:
-- node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('test123', 10).then(h=>console.log(h))"
-- Luego copia el hash y ejecuta:
-- UPDATE users 
-- SET password_hash = '$2a$10$K3FPP.sOauWzwBNCYPiQJeo5rJDRqAuYOyYWFbLr86PE2RMsBWcUu'
-- WHERE email = 'test@example.com';

-- 4. Verificar el resultado final
SELECT 
  id, 
  email, 
  name, 
  is_active, 
  role,
  created_at
FROM users 
WHERE email = 'test@example.com';

