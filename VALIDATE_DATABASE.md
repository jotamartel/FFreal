# ✅ Validar Base de Datos Supabase

## 🎯 Objetivo

Verificar que la base de datos Supabase esté correctamente configurada después de reactivarla.

---

## 🔍 Métodos de Validación

### Opción 1: Script Local (Recomendado)

Ejecuta el script de validación completo:

```bash
node scripts/validate-database.js
```

**Este script verifica:**
- ✅ Conexión a la base de datos
- ✅ Todas las tablas requeridas existen
- ✅ Todas las columnas requeridas en cada tabla
- ✅ Índices configurados
- ✅ Triggers configurados
- ✅ Foreign keys configurados
- ✅ Conteo de registros por tabla

**Salida esperada:**
```
✅ ✅ ✅ VALIDACIÓN EXITOSA ✅ ✅ ✅

✅ Conexión a la base de datos: OK
✅ Todas las tablas existen
✅ Todas las columnas requeridas presentes
✅ X índices configurados
✅ X triggers configurados
✅ X foreign keys configurados

🎉 La base de datos está lista para usar!
```

### Opción 2: Endpoint API (Para Producción)

Si tu app está desplegada en Vercel, puedes validar desde ahí:

**URL Local:**
```
http://localhost:3000/api/debug/validate-db
```

**URL Producción:**
```
https://tu-app.vercel.app/api/debug/validate-db
```

**Respuesta JSON esperada:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "connection": {
    "success": true,
    "time": "2024-01-15T10:30:00.000Z",
    "version": "PostgreSQL 15.x..."
  },
  "tables": {
    "users": {
      "exists": true,
      "rowCount": 0,
      "columns": {...},
      "missingColumns": []
    },
    ...
  },
  "summary": {
    "connectionOk": true,
    "allTablesExist": true,
    "noMissingColumns": true,
    "totalErrors": 0,
    "totalWarnings": 0,
    "status": "OK"
  }
}
```

### Opción 3: Endpoint de Prueba Básica

Para una prueba rápida de conexión:

**URL:**
```
http://localhost:3000/api/debug/db-test
```

Este endpoint verifica:
- ✅ Variables de entorno configuradas
- ✅ Conexión básica funciona
- ✅ Tabla `users` existe
- ✅ Estructura de la tabla `users`

---

## 📋 Tablas que se Validan

El script verifica estas 7 tablas principales:

1. **`users`** - Usuarios del sistema
   - Columnas críticas: `id`, `email`, `password_hash`, `role`, `is_active`, `created_at`

2. **`ff_groups`** - Grupos de Friends & Family
   - Columnas críticas: `id`, `merchant_id`, `name`, `owner_customer_id`, `owner_email`, `invite_code`, `status`

3. **`ff_group_members`** - Miembros de los grupos
   - Columnas críticas: `id`, `group_id`, `email`, `role`, `status`, `user_id`

4. **`ff_invitations`** - Invitaciones a grupos
   - Columnas críticas: `id`, `group_id`, `email`, `token`, `status`, `expires_at`

5. **`ff_discount_config`** - Configuración de descuentos
   - Columnas críticas: `id`, `merchant_id`, `is_enabled`, `max_members_default`

6. **`ff_code_usage`** - Uso de códigos de descuento
   - Columnas críticas: `id`, `group_id`, `invite_code`, `customer_id`

7. **`terms_acceptance`** - Aceptación de términos
   - Columnas críticas: `id`, `customer_id`, `terms_version`, `accepted_at`

---

## 🐛 Problemas Comunes y Soluciones

### Error: "DATABASE_URL no está configurado"

**Solución:**
1. Crea/edita `.env.local` en la raíz del proyecto
2. Agrega:
   ```env
   DATABASE_URL=postgresql://postgres.xxxxx:password@xxx.pooler.supabase.com:6543/postgres?sslmode=require
   ```
3. Reinicia el servidor si está corriendo

### Error: "Tabla X NO EXISTE"

**Solución:**
1. Ve a Supabase → SQL Editor
2. Ejecuta el schema completo: `scripts/setup-supabase-complete.sql`
3. Verifica en Table Editor que las tablas existan

### Error: "Falta columna: X"

**Solución:**
1. Ve a Supabase → SQL Editor
2. Ejecuta las migraciones necesarias:
   - `lib/database/schema_auth_standalone.sql` (si falta `user_id` o `owner_user_id`)
   - `lib/database/schema_permissions.sql` (si falta `can_create_groups`)
   - `lib/database/schema_user_group_settings.sql` (si falta `max_members_per_group`)

### Error: "Connection refused" o "ETIMEDOUT"

**Solución:**
1. Verifica que uses el puerto correcto: **6543** (pooler) o **5432** (directo)
2. Verifica IPs permitidas en Supabase:
   - Settings → Database → Connection Pooling → Allowed IPs
   - O usa "Allow all IPs" para desarrollo

### Error: "password authentication failed"

**Solución:**
1. Verifica que la contraseña en `DATABASE_URL` sea correcta
2. Obtén una nueva connection string desde Supabase Dashboard
3. Asegúrate de que no haya espacios extra en `.env.local`

---

## ✅ Checklist de Validación

Después de reactivar Supabase, verifica:

- [ ] Script de validación ejecutado sin errores
- [ ] Todas las 7 tablas existen
- [ ] Todas las columnas requeridas presentes
- [ ] Índices configurados (al menos 20+ índices)
- [ ] Triggers configurados (al menos 4 triggers)
- [ ] Foreign keys configurados (al menos 5 foreign keys)
- [ ] Conexión funciona desde local (`npm run dev`)
- [ ] Conexión funciona desde producción (Vercel)
- [ ] Endpoint `/api/debug/validate-db` responde correctamente

---

## 🚀 Próximos Pasos Después de Validar

Una vez que la validación sea exitosa:

1. **Probar creación de usuario:**
   ```bash
   # Si tienes el script
   node scripts/create-user.js
   ```

2. **Probar creación de grupo:**
   - Usa la interfaz de la app o API

3. **Verificar logs:**
   - Revisa que no haya errores en la consola
   - Verifica logs en Vercel si está desplegado

4. **Probar endpoints principales:**
   - `/api/groups` - Listar grupos
   - `/api/invitations` - Gestionar invitaciones
   - `/api/admin/*` - Endpoints de administración

---

## 📚 Archivos Relacionados

- `scripts/validate-database.js` - Script de validación completo
- `scripts/test-supabase-connection.js` - Script de prueba básica
- `app/api/debug/validate-db/route.ts` - Endpoint de validación
- `app/api/debug/db-test/route.ts` - Endpoint de prueba básica
- `scripts/setup-supabase-complete.sql` - Schema completo para recrear

---

## 💡 Tips

- **Ejecuta la validación después de cada cambio importante** en la base de datos
- **Usa el endpoint API** para validar en producción sin acceso local
- **Guarda los resultados** de la validación para referencia futura
- **Si hay warnings**, revísalos pero no siempre son críticos

---

## 🎉 ¡Listo!

Si la validación es exitosa, tu base de datos está lista para usar. Si encuentras problemas, revisa la sección de troubleshooting arriba.
