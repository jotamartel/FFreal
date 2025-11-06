# Migración: Configuración de Grupos por Usuario

Este script agrega dos nuevos campos a la tabla `users` para permitir configurar el máximo de miembros y el identificador de descuento por usuario.

## Campos Agregados

1. **`max_members_per_group`** (INTEGER, NULLABLE)
   - Máximo número de miembros que puede tener un grupo creado por este usuario
   - Si es NULL, se usa el valor por defecto de la configuración global

2. **`discount_tier_identifier`** (VARCHAR(50), NULLABLE)
   - Identificador del nivel de descuento para grupos creados por este usuario
   - Puede ser un número (ej: "1", "2") o un string (ej: "basic", "premium")
   - Si es NULL, se usa el tier por defecto (1)

## Cómo Ejecutar la Migración

### En Supabase:

1. Ve a tu proyecto en Supabase
2. Abre el **SQL Editor**
3. Copia y pega el contenido de `lib/database/schema_user_group_settings.sql`
4. Ejecuta el script

### O desde la línea de comandos:

```bash
# Si tienes psql configurado
psql $DATABASE_URL -f lib/database/schema_user_group_settings.sql
```

## Verificación

Después de ejecutar la migración, verifica que los campos se agregaron correctamente:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
  AND column_name IN ('max_members_per_group', 'discount_tier_identifier');
```

Deberías ver ambas columnas listadas.

## Uso en la Interfaz

Una vez ejecutada la migración:

1. Ve a **Gestión de Usuarios** en el admin
2. Para usuarios con `can_create_groups = true`, verás una nueva sección "Configuración de Grupos"
3. Podrás configurar:
   - **Máximo de Miembros por Grupo**: Número máximo de miembros
   - **Identificador de Nivel de Descuento**: Identificador del tier de descuento

## Comportamiento

- Cuando un usuario crea un grupo:
  - Si tiene `max_members_per_group` configurado, se usa ese valor
  - Si no, se usa `max_members_default` de la configuración global
  - Si tiene `discount_tier_identifier` configurado, se usa para establecer el `discount_tier` del grupo
  - Si no, se usa el tier por defecto (1)

