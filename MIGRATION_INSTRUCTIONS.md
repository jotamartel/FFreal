# 🚀 Instrucciones para Ejecutar la Migración de Permisos

## Opción 1: Ejecutar SQL Directamente en Supabase (Recomendado)

1. Ve a tu proyecto en Supabase: https://supabase.com/dashboard
2. Selecciona tu proyecto
3. Ve a **SQL Editor** en el menú lateral
4. Crea un **New Query**
5. Copia y pega el siguiente SQL:

```sql
-- Add permissions and configuration for Friends & Family groups

-- Add can_create_groups column to users table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'can_create_groups'
  ) THEN
    ALTER TABLE users ADD COLUMN can_create_groups BOOLEAN DEFAULT false;
    CREATE INDEX IF NOT EXISTS idx_users_can_create_groups ON users(can_create_groups);
  END IF;
END $$;

-- Add max_members_default to discount config
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ff_discount_config' AND column_name = 'max_members_default'
  ) THEN
    ALTER TABLE ff_discount_config ADD COLUMN max_members_default INTEGER DEFAULT 6;
  END IF;
END $$;

-- Add invite_redirect_url to discount config (for email links)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ff_discount_config' AND column_name = 'invite_redirect_url'
  ) THEN
    ALTER TABLE ff_discount_config ADD COLUMN invite_redirect_url VARCHAR(500);
  END IF;
END $$;

-- Update existing users: set can_create_groups to false by default
UPDATE users SET can_create_groups = false WHERE can_create_groups IS NULL;

-- Update existing discount configs: set max_members_default to 6 if not set
UPDATE ff_discount_config SET max_members_default = 6 WHERE max_members_default IS NULL;
```

6. Haz clic en **Run** (o presiona `Cmd/Ctrl + Enter`)
7. Deberías ver mensajes de éxito para cada paso

## Opción 2: Usar el Endpoint API (Después del Deploy)

Una vez que despliegues los cambios a Vercel, puedes ejecutar la migración usando el endpoint API:

```bash
curl -X POST https://shopify-friends-family-app.vercel.app/api/admin/migrate-permissions \
  -H "Authorization: Bearer migration-secret-key-change-in-production"
```

**Nota:** Por seguridad, deberías cambiar el `MIGRATION_SECRET` en Vercel antes de usar esta opción.

## Opción 3: Script Local (Si tienes DATABASE_URL configurado)

Si tienes `DATABASE_URL` configurado en tu `.env.local`:

```bash
node scripts/run-permissions-migration.js
```

## ✅ Verificar que la Migración Funcionó

Después de ejecutar la migración, puedes verificar que las columnas se crearon correctamente:

```sql
-- Verificar can_create_groups
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'can_create_groups';

-- Verificar max_members_default
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'ff_discount_config' AND column_name = 'max_members_default';

-- Verificar invite_redirect_url
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ff_discount_config' AND column_name = 'invite_redirect_url';
```

## 📝 Próximos Pasos

Después de ejecutar la migración:

1. **Configurar permisos de usuarios** (para permitir que creen grupos):
   ```sql
   UPDATE users SET can_create_groups = true WHERE email = 'usuario@ejemplo.com';
   ```

2. **Configurar en el Admin Panel**:
   - Ve a `/admin/config` en Shopify
   - Configura `Default Max Members Per Group` (ej: 6)
   - Configura `Invitation Redirect URL` (ej: `https://shopify-friends-family-app.vercel.app/tienda/unirse`)

3. **Desplegar los cambios**:
   ```bash
   shopify app deploy --force
   ```

