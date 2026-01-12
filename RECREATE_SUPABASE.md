# 🆕 Recrear Supabase desde Cero - Guía Completa

## 🎯 Objetivo

Crear un nuevo proyecto Supabase y configurarlo completamente con todos los schemas necesarios.

---

## 📋 Paso 1: Crear Nuevo Proyecto en Supabase

### 1.1 Crear Cuenta/Iniciar Sesión

1. Ve a: **https://supabase.com**
2. Inicia sesión o crea una cuenta (gratis)
3. Click en **"New Project"**

### 1.2 Configurar Proyecto

Completa la información:

- **Name**: `friends-family-app` (o el nombre que prefieras)
- **Database Password**: ⚠️ **GUARDA ESTA CONTRASEÑA** - la necesitarás después
  - Usa una contraseña fuerte (mínimo 12 caracteres)
  - Guárdala en un lugar seguro
- **Region**: Selecciona la región más cercana a tus usuarios
- **Pricing Plan**: **Free** (suficiente para empezar)

3. Click **"Create new project"**

⏱️ **Espera 2-3 minutos** mientras se crea el proyecto.

---

## 📋 Paso 2: Obtener Connection String

### 2.1 Acceder a Database Settings

1. En tu proyecto nuevo, ve a **Settings** (ícono de engranaje ⚙️)
2. Click **Database** en el menú lateral

### 2.2 Copiar Connection String (Connection Pooling)

1. Scroll hasta **"Connection string"**
2. Selecciona la tab **"Connection Pooling"**
3. Selecciona **"Session mode"** o **"Transaction mode"**
4. Copia la connection string del **pooler** (puerto **6543**)

**Formato esperado:**
```
postgresql://postgres.xxxxx:TuPassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

### 2.3 Agregar SSL

Agrega `?sslmode=require` al final:

```
postgresql://postgres.xxxxx:TuPassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
```

⚠️ **IMPORTANTE**: 
- Reemplaza `xxxxx` con tu proyecto ID
- Reemplaza `TuPassword` con la contraseña que configuraste

---

## 📋 Paso 3: Ejecutar Schemas en Orden

⚠️ **CRÍTICO**: Debes ejecutar los schemas en este orden exacto.

### 3.1 Schema Principal (OBLIGATORIO PRIMERO)

1. Ve a **SQL Editor** en Supabase (ícono de SQL en la barra lateral)
2. Click **"New query"**
3. Abre el archivo: `lib/database/schema.sql`
4. **Copia TODO el contenido** del archivo
5. Pégalo en el SQL Editor
6. Click **"Run"** (o `Cmd+Enter` / `Ctrl+Enter`)

**Este schema crea:**
- ✅ Tabla `users`
- ✅ Tabla `ff_groups`
- ✅ Tabla `ff_group_members`
- ✅ Tabla `ff_invitations`
- ✅ Tabla `ff_discount_config`
- ✅ Tabla `ff_code_usage`
- ✅ Tabla `terms_acceptance`
- ✅ Todos los índices y triggers

**Verificación:**
- Deberías ver: `Success. No rows returned`
- Ve a **Table Editor** → Deberías ver todas las tablas listadas

### 3.2 Schema de Autenticación (OPCIONAL - Ya incluido en schema.sql)

El schema principal ya incluye la tabla `users`, pero si necesitas ejecutar migraciones adicionales:

1. Abre: `lib/database/schema_auth_standalone.sql`
2. Copia y ejecuta en SQL Editor

**Este schema agrega:**
- ✅ Columnas `user_id` y `owner_user_id` (si no existen)
- ✅ Índices adicionales

### 3.3 Schema de Permisos (OPCIONAL)

Si necesitas permisos adicionales:

1. Abre: `lib/database/schema_permissions.sql`
2. Copia y ejecuta en SQL Editor

**Este schema agrega:**
- ✅ Columna `can_create_groups` en `users`
- ✅ Configuraciones adicionales

### 3.4 Schema de Configuración de Grupos (OPCIONAL)

Si necesitas configuraciones de grupos:

1. Abre: `lib/database/schema_user_group_settings.sql`
2. Copia y ejecuta en SQL Editor

---

## 📋 Paso 4: Configurar Variables en Vercel

### 4.1 Obtener Todas las Variables de Supabase

En Supabase Dashboard → **Settings** → **API**:

1. **Project URL**: Copia `NEXT_PUBLIC_SUPABASE_URL`
   - Formato: `https://xxxxx.supabase.co`

2. **anon/public key**: Copia `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Formato: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

3. **service_role key**: Copia `SUPABASE_SERVICE_ROLE_KEY` (opcional, para operaciones admin)
   - Formato: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 4.2 Agregar Variables en Vercel

1. Ve a tu proyecto en Vercel: **https://vercel.com**
2. Selecciona tu proyecto
3. Ve a **Settings** → **Environment Variables**
4. Agrega estas variables:

#### Variable 1: DATABASE_URL
- **Key**: `DATABASE_URL`
- **Value**: Tu connection string completa con SSL
  ```
  postgresql://postgres.xxxxx:TuPassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require
  ```
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 2: NEXT_PUBLIC_SUPABASE_URL (Opcional)
- **Key**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://xxxxx.supabase.co`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

#### Variable 3: NEXT_PUBLIC_SUPABASE_ANON_KEY (Opcional)
- **Key**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: Tu anon key de Supabase
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### 4.3 Redeploy en Vercel

Después de agregar las variables:

1. Ve a **Deployments**
2. Click en el último deployment
3. Click **"Redeploy"**
4. Espera a que termine el deploy

---

## 📋 Paso 5: Configurar Variables Localmente

### 5.1 Crear .env.local

En la raíz de tu proyecto, crea o edita `.env.local`:

```env
# Supabase Database Connection
DATABASE_URL=postgresql://postgres.xxxxx:TuPassword@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require

# Supabase API (Opcional)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Shopify (si las tienes)
SHOPIFY_API_KEY=tu_api_key
SHOPIFY_API_SECRET=tu_api_secret
SHOPIFY_APP_URL=https://tu-app.vercel.app
```

### 5.2 Verificar Conexión Local

Ejecuta el script de diagnóstico:

```bash
node scripts/test-supabase-connection.js
```

Deberías ver:
```
✅ Conexión exitosa!
✅ Se encontraron X tablas
✅ Tabla users existe
```

---

## 📋 Paso 6: Verificar que Todo Funciona

### 6.1 Verificar Tablas en Supabase

1. Ve a **Table Editor** en Supabase
2. Deberías ver estas tablas:
   - ✅ `users`
   - ✅ `ff_groups`
   - ✅ `ff_group_members`
   - ✅ `ff_invitations`
   - ✅ `ff_discount_config`
   - ✅ `ff_code_usage`
   - ✅ `terms_acceptance`

### 6.2 Probar Endpoint de Prueba

1. Inicia el servidor local:
   ```bash
   npm run dev
   ```

2. Visita: **http://localhost:3000/api/debug/db-test**

3. Deberías ver un JSON con:
   - ✅ `basic_connection.success: true`
   - ✅ `users_table_exists: true`
   - ✅ Lista de tablas encontradas

### 6.3 Verificar en Producción (Vercel)

1. Visita: `https://tu-app.vercel.app/api/debug/db-test`
2. Deberías ver el mismo resultado

---

## ✅ Checklist Final

- [ ] Nuevo proyecto creado en Supabase
- [ ] Connection string obtenido (Connection Pooling, puerto 6543)
- [ ] Schema principal ejecutado (`schema.sql`)
- [ ] Tablas verificadas en Table Editor
- [ ] `DATABASE_URL` agregada en Vercel
- [ ] Variables opcionales agregadas en Vercel (si las necesitas)
- [ ] `.env.local` creado localmente
- [ ] Conexión verificada localmente (`test-supabase-connection.js`)
- [ ] Endpoint de prueba funciona (`/api/debug/db-test`)
- [ ] Redeploy realizado en Vercel
- [ ] Endpoint de prueba funciona en producción

---

## 🐛 Troubleshooting

### Error: "password authentication failed"
- Verifica que la contraseña en `DATABASE_URL` sea correcta
- Obtén una nueva connection string desde Supabase Dashboard

### Error: "Connection refused" o "ETIMEDOUT"
- Verifica que uses el puerto correcto: **6543** (pooler) o **5432** (directo)
- Verifica que tu IP esté permitida en Supabase:
  - Settings → Database → Connection Pooling → Allowed IPs
  - O usa "Allow all IPs" para desarrollo

### Error: "SSL required"
- Asegúrate de que la connection string termine con `?sslmode=require`
- El código maneja SSL automáticamente, pero el parámetro ayuda

### Error: "relation does not exist"
- Verifica que ejecutaste `schema.sql` primero
- Verifica en Table Editor que las tablas existen

### Error: "Too many connections"
- Usa Connection Pooling (puerto 6543) en lugar de conexión directa (5432)
- Verifica que no tengas muchas conexiones abiertas

---

## 📚 Recursos

- [Supabase Dashboard](https://app.supabase.com)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

## 🎉 ¡Listo!

Tu nuevo proyecto Supabase está configurado y listo para usar. La aplicación debería funcionar correctamente tanto en local como en producción.
