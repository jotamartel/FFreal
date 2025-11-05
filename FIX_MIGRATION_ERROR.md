# 🔧 Solución: Error "column merchant_id does not exist"

## 🔍 Problema

Si recibes el error:
```
ERROR: 42703: column "merchant_id" does not exist
```

Esto puede ocurrir si:
1. El schema principal no se ejecutó completamente
2. Hay algún trigger o función que hace referencia a una columna que no existe
3. Se ejecutaron ambos schemas en orden incorrecto

---

## ✅ Solución: Ejecutar Schema Standalone

He creado una versión **standalone** y más segura de la migración que:

1. ✅ **Solo crea la tabla `users`** (no depende de otras tablas)
2. ✅ **Verifica que las tablas existan** antes de agregar columnas
3. ✅ **Maneja errores** sin detener la ejecución completa
4. ✅ **Es segura** de ejecutar múltiples veces

---

## 📝 Pasos

### Opción 1: Solo Tabla Users (Más Seguro)

Si solo necesitas la tabla `users` para empezar:

1. Ve a Supabase → **SQL Editor**
2. Abre: `lib/database/schema_auth_standalone.sql`
3. Copia **todo el contenido**
4. Pégalo en SQL Editor
5. Click **Run**

Esto creará:
- ✅ Tabla `users`
- ✅ Índices necesarios
- ✅ Trigger para `updated_at`
- ✅ Agregará columnas `user_id` y `owner_user_id` **solo si las tablas existen**

---

### Opción 2: Ejecutar Schema Principal Primero

Si prefieres tener todo el schema completo:

1. **Ejecutar primero**: `lib/database/schema.sql`
   - Esto crea todas las tablas base
   - Verifica que no haya errores

2. **Luego ejecutar**: `lib/database/schema_auth_standalone.sql`
   - Esto agrega la tabla `users` y las columnas necesarias

---

## 🔍 Verificar que Funcionó

Después de ejecutar, verifica en Supabase:

1. **Table Editor** → Deberías ver:
   - ✅ `users` (nueva tabla)

2. **Verificar columnas en `users`**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'users';
   ```

   Deberías ver:
   - `id` (uuid)
   - `email` (varchar)
   - `password_hash` (varchar)
   - `name` (varchar)
   - `phone` (varchar)
   - `is_active` (boolean)
   - `role` (varchar)
   - `shopify_customer_id` (varchar)
   - `created_at` (timestamp)
   - `updated_at` (timestamp)
   - `last_login_at` (timestamp)

---

## 🎯 Si Solo Necesitas la Tabla Users

Si el error persiste y solo necesitas empezar con la autenticación, puedes ejecutar **solo** esta parte:

```sql
-- Solo crear tabla users
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  shopify_customer_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_shopify_customer ON users(shopify_customer_id);
```

Esto es suficiente para que el sistema de autenticación funcione. Las columnas `user_id` en otras tablas las puedes agregar después cuando las tablas estén creadas.

---

## ✅ Checklist

- [ ] Ejecuté `schema_auth_standalone.sql`
- [ ] Verifiqué que la tabla `users` existe
- [ ] Verifiqué que tiene todas las columnas
- [ ] No recibí errores

---

¿Ya probaste ejecutar `schema_auth_standalone.sql`? Es más seguro y maneja errores mejor.

