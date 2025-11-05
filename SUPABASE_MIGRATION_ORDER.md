# 📋 Orden Correcto de Migraciones en Supabase

## ⚠️ Error Común

Si recibes el error:
```
ERROR: 42P01: relation "ff_group_members" does not exist
```

Significa que **primero debes ejecutar el schema principal** antes de la migración de autenticación.

---

## ✅ Orden Correcto de Ejecución

### Paso 1: Ejecutar Schema Principal (OBLIGATORIO PRIMERO)

1. Ve a Supabase Dashboard → **SQL Editor**
2. Abre el archivo: `lib/database/schema.sql`
3. Copia **todo el contenido** del archivo
4. Pégalo en el SQL Editor
5. Click en **Run** o **Execute**

Este schema crea todas las tablas base:
- `branches`
- `appointments`
- `availability_slots`
- `ff_groups`
- `ff_group_members` ← **IMPORTANTE: Esta tabla se crea aquí**
- `ff_invitations`
- `ff_discount_config`
- `ff_code_usage`

### Paso 2: Ejecutar Migración de Autenticación

**Solo después** de ejecutar el schema principal:

1. Abre el archivo: `lib/database/schema_auth.sql`
2. Copia **todo el contenido** del archivo
3. Pégalo en el SQL Editor
4. Click en **Run** o **Execute**

Este schema agrega:
- Tabla `users`
- Columnas `user_id` y `owner_user_id`
- Índices necesarios

---

## 🔍 Verificar que Funcionó

Después de ejecutar ambos, verifica en Supabase:

1. **Table Editor** → Deberías ver:
   - ✅ `users` (nueva)
   - ✅ `ff_groups`
   - ✅ `ff_group_members`
   - ✅ Todas las demás tablas

2. **Verificar columnas**:
   - En `ff_group_members` → Debe tener columna `user_id`
   - En `ff_groups` → Debe tener columna `owner_user_id`
   - En `users` → Debe tener todas las columnas

---

## 📝 Notas

- **Orden es crítico**: No puedes agregar columnas a tablas que no existen
- **Idempotente**: La migración usa `IF NOT EXISTS`, puedes ejecutarla múltiples veces
- **Sin pérdida de datos**: La migración solo agrega, no modifica datos existentes

---

## 🐛 Si Aún Tienes Problemas

### Opción 1: Verificar Tablas Existentes

Ejecuta en Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver todas las tablas listadas arriba.

### Opción 2: Ejecutar Todo Junto

Si prefieres, puedes ejecutar ambos schemas en una sola ejecución:

1. Abre `lib/database/schema.sql`
2. Copia todo
3. Abre `lib/database/schema_auth.sql`
4. Copia todo
5. Pega ambos en el SQL Editor (uno después del otro)
6. Ejecuta todo junto

---

## ✅ Checklist

- [ ] Ejecuté `schema.sql` primero
- [ ] Verifiqué que las tablas existen
- [ ] Ejecuté `schema_auth.sql` después
- [ ] Verifiqué que la tabla `users` existe
- [ ] Verifiqué que las columnas `user_id` y `owner_user_id` existen

---

¿Ya ejecutaste el schema principal (`schema.sql`) antes de intentar la migración?

