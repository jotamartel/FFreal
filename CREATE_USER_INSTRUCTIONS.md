# 📝 Crear Usuario Manualmente

Si el registro desde el frontend no funciona, puedes crear un usuario directamente en la base de datos usando el script incluido.

## Opción 1: Usar el Script (Recomendado)

1. **Asegúrate de tener las variables de entorno configuradas:**
   - `DATABASE_URL` o `POSTGRES_URL` debe estar configurado en tu entorno

2. **Ejecuta el script:**
   ```bash
   node scripts/create-user.js <email> <password> [name]
   ```

   **Ejemplo:**
   ```bash
   node scripts/create-user.js test@example.com password123 "Juan Pérez"
   ```

3. **El script:**
   - Verifica que el email no exista
   - Hashea la contraseña correctamente
   - Inserta el usuario en la base de datos
   - Muestra la información del usuario creado

## Opción 2: Crear Usuario Directamente en Supabase

Si prefieres crear el usuario directamente en Supabase:

1. **Ve a Supabase Dashboard > SQL Editor**

2. **Ejecuta este SQL (reemplaza los valores):**
   ```sql
   -- Primero, genera el hash de la contraseña usando bcrypt
   -- Puedes usar este script Node.js para generar el hash:
   -- const bcrypt = require('bcryptjs');
   -- bcrypt.hash('tu_password', 10).then(hash => console.log(hash));

   INSERT INTO users (email, password_hash, name, role, is_active)
   VALUES (
     'test@example.com',  -- Reemplaza con el email
     '$2a$10$...',        -- Reemplaza con el hash bcrypt de tu contraseña
     'Nombre Usuario',    -- Opcional
     'customer',
     true
   )
   RETURNING id, email, name, role, created_at;
   ```

3. **Para generar el hash bcrypt:**
   ```bash
   node -e "const bcrypt=require('bcryptjs'); bcrypt.hash('tu_password', 10).then(h=>console.log(h))"
   ```

## Credenciales de Prueba Recomendadas

```
Email: test@example.com
Password: test123
```

O usa cualquier email y contraseña que prefieras.

## Solución de Problemas

### Error: "DATABASE_URL no está configurado"
- Verifica que tengas `DATABASE_URL` o `POSTGRES_URL` en tu entorno
- Para desarrollo local, crea un archivo `.env.local` con:
  ```
  DATABASE_URL=tu_connection_string_aqui
  ```

### Error: "El usuario ya existe"
- El email que intentas usar ya está registrado
- Usa un email diferente o elimina el usuario existente

### Error de conexión a la base de datos
- Verifica que tu `DATABASE_URL` sea correcto
- Asegúrate de que Supabase permita conexiones desde tu IP

