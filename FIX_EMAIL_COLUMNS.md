# 🔧 Fix: Column "email_from" does not exist

## ❌ Problema

Error al enviar invitaciones:
```
column "email_from" does not exist
```

## 🔍 Causa

La tabla `ff_discount_config` no tiene las columnas `email_from` y `email_support` que son necesarias para enviar emails.

## ✅ Solución Rápida

### Paso 1: Ejecutar Migración en Supabase

1. Ve a **Supabase Dashboard** → Tu proyecto
2. Click en **SQL Editor** (ícono de SQL en la barra lateral)
3. Click **"New query"**
4. Abre el archivo: `lib/database/migration_add_email_columns.sql`
5. **Copia TODO el contenido** del archivo
6. Pégalo en el SQL Editor
7. Click **"Run"** (o `Cmd+Enter` / `Ctrl+Enter`)

**Deberías ver:**
```
✅ Column email_from added to ff_discount_config
✅ Column email_support added to ff_discount_config
✅ ✅ ✅ Migration completed successfully! Both columns exist.
```

### Paso 2: Verificar en Table Editor

1. Ve a **Table Editor** en Supabase
2. Selecciona la tabla `ff_discount_config`
3. Verifica que existan las columnas:
   - ✅ `email_from` (VARCHAR(255))
   - ✅ `email_support` (VARCHAR(255))

### Paso 3: Configurar Email From (Opcional)

Si quieres configurar el email desde el cual se envían las invitaciones:

1. Ve a la app → **Admin** → **Config**
2. Completa el campo **"Email From"**
   - Ejemplo: `noreply@tudominio.com`
   - O usa: `onboarding@resend.dev` (para pruebas con Resend)
3. Click **"Save"**

## 🔍 Verificar que Funciona

### Opción 1: Desde la App

1. Crea una invitación desde la interfaz
2. Verifica que el email se envíe correctamente
3. Revisa los logs en la consola del navegador

### Opción 2: Endpoint de Prueba

Si tienes el endpoint de prueba de email:

```bash
POST /api/debug/test-email
{
  "to": "tu-email@example.com",
  "subject": "Test",
  "html": "<p>Test</p>"
}
```

## 📋 SQL Manual (Si prefieres ejecutarlo directamente)

Si prefieres ejecutar el SQL manualmente en Supabase:

```sql
-- Agregar columna email_from
ALTER TABLE ff_discount_config 
ADD COLUMN IF NOT EXISTS email_from VARCHAR(255);

-- Agregar columna email_support
ALTER TABLE ff_discount_config 
ADD COLUMN IF NOT EXISTS email_support VARCHAR(255);
```

## 🐛 Troubleshooting

### Error: "relation ff_discount_config does not exist"

**Solución:**
1. Verifica que la tabla existe en Supabase → Table Editor
2. Si no existe, ejecuta el schema completo: `scripts/setup-supabase-complete.sql`

### Error: "column already exists"

**Solución:**
- Esto es normal si ya ejecutaste la migración antes
- Las columnas ya están agregadas, puedes continuar

### Error: "permission denied"

**Solución:**
- Asegúrate de estar en el proyecto correcto de Supabase
- Verifica que tengas permisos de administrador

## ✅ Checklist

- [ ] Migración ejecutada en Supabase SQL Editor
- [ ] Columnas `email_from` y `email_support` verificadas en Table Editor
- [ ] Email From configurado en Admin → Config (opcional)
- [ ] Invitación de prueba enviada exitosamente

## 🎉 ¡Listo!

Después de ejecutar la migración, las invitaciones deberían poder enviarse correctamente.

---

**Nota:** Si sigues teniendo problemas después de ejecutar la migración, verifica:
1. Que la conexión a la base de datos funcione
2. Que el servicio de email (Resend/SMTP) esté configurado
3. Los logs de la aplicación para ver errores específicos
